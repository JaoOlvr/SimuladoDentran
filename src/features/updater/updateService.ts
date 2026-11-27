import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { Linking, Platform } from 'react-native';

export interface ReleaseInfo {
  versaoAtual: string;
  versaoNova: string;
  temAtualizacao: boolean;
  tagName: string;
  nomeRelease: string;
  notas: string;
  apkUrl: string | null;
  tamanhoMb: number | null;
  publicadoEm: string;
}

/**
 * Compara duas versões no formato semver (ex: '1.0.8' vs '1.0.7').
 * Retorna:
 *  1 se v1 > v2
 * -1 se v1 < v2
 *  0 se v1 == v2
 */
export function compararVersoes(v1: string, v2: string): number {
  const normalizar = (v: string) =>
    v
      .replace(/^v/, '')
      .split(/[-+]/)[0]
      .split('.')
      .map((n) => parseInt(n, 10) || 0);

  const p1 = normalizar(v1);
  const p2 = normalizar(v2);

  const maxLen = Math.max(p1.length, p2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = p1[i] ?? 0;
    const num2 = p2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

const GITHUB_REPO = 'JaoOlvr/SimuladoDentran';
export const VERSAO_FALLBACK = '1.0.8';

// Flags nativas do Intent Android
// FLAG_GRANT_READ_URI_PERMISSION (1) | FLAG_ACTIVITY_NEW_TASK (0x10000000 = 268435456)
const FLAGS_INTENT_INSTALACAO = 1 | 268435456;

export class UpdateService {
  /**
   * Obtém a versão instalada do aplicativo.
   */
  obterVersaoAtual(): string {
    return Application.nativeApplicationVersion || VERSAO_FALLBACK;
  }

  /**
   * Consulta a API pública do GitHub para verificar a última release publicada.
   */
  async verificarAtualizacao(): Promise<ReleaseInfo | null> {
    try {
      const versaoAtual = this.obterVersaoAtual();
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'SimulaDetran-Mobile-App',
          },
        }
      );

      if (!response.ok) {
        console.warn('Não foi possível consultar releases do GitHub:', response.status);
        return null;
      }

      const data = await response.json();
      const tagName: string = data.tag_name || '';
      const versaoNova = tagName.replace(/^v/, '');

      let apkUrl: string | null = null;
      let tamanhoMb: number | null = null;

      if (Array.isArray(data.assets)) {
        const apkAsset = data.assets.find(
          (a: any) =>
            typeof a.name === 'string' && a.name.toLowerCase().endsWith('.apk')
        );
        if (apkAsset) {
          apkUrl = apkAsset.browser_download_url;
          if (apkAsset.size) {
            tamanhoMb = Math.round((apkAsset.size / (1024 * 1024)) * 10) / 10;
          }
        }
      }

      const temAtualizacao =
        apkUrl !== null && compararVersoes(versaoNova, versaoAtual) > 0;

      return {
        versaoAtual,
        versaoNova,
        temAtualizacao,
        tagName,
        nomeRelease: data.name || tagName,
        notas: data.body || '',
        apkUrl,
        tamanhoMb,
        publicadoEm: data.published_at || '',
      };
    } catch (err) {
      console.error('Erro ao verificar atualizações:', err);
      return null;
    }
  }

  /**
   * Faz o download do APK e salva no armazenamento local do app.
   * Retorna a URI local do arquivo baixado.
   */
  async baixarApk(
    apkUrl: string,
    onProgress?: (progresso: number) => void
  ): Promise<string> {
    const destinoApk = `${FileSystem.documentDirectory}SimulaDetran-update.apk`;

    // Remove arquivo anterior se existir
    try {
      const info = await FileSystem.getInfoAsync(destinoApk);
      if (info.exists) {
        await FileSystem.deleteAsync(destinoApk, { idempotent: true });
      }
    } catch {
      // Ignora erro ao limpar
    }

    const downloadResumable = FileSystem.createDownloadResumable(
      apkUrl,
      destinoApk,
      {},
      (downloadProgress) => {
        if (downloadProgress.totalBytesExpectedToWrite > 0 && onProgress) {
          const perc = Math.round(
            (downloadProgress.totalBytesWritten /
              downloadProgress.totalBytesExpectedToWrite) *
              100
          );
          onProgress(perc);
        }
      }
    );

    const resultado = await downloadResumable.downloadAsync();
    if (!resultado || !resultado.uri) {
      throw new Error('Falha ao baixar o arquivo da atualização.');
    }

    return resultado.uri;
  }

  /**
   * Abre o instalador de pacotes nativo do Android para o APK baixado.
   */
  async instalarApk(localUri: string, fallbackUrl?: string): Promise<boolean> {
    if (Platform.OS !== 'android') {
      if (fallbackUrl) await Linking.openURL(fallbackUrl);
      return false;
    }

    try {
      // Obtém o content:// URI via FileProvider do Expo
      const contentUri = await FileSystem.getContentUriAsync(localUri);

      // Dispara o instalador nativo com flags de leitura e NEW_TASK
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: FLAGS_INTENT_INSTALACAO,
        type: 'application/vnd.android.package-archive',
      });
      return true;
    } catch (launcherError: any) {
      console.warn('Erro ao disparar Intent de instalação do APK:', launcherError);

      // Tenta abrir tela de permissão de fontes desconhecidas se for bloqueio de segurança
      try {
        await IntentLauncher.startActivityAsync(
          'android.settings.MANAGE_UNKNOWN_APP_SOURCES',
          {
            data: 'package:com.examesimulado.detran',
          }
        );
      } catch {
        // Fallback para navegador
        if (fallbackUrl) {
          await Linking.openURL(fallbackUrl);
        }
      }
      return false;
    }
  }

  /**
   * Baixa e aciona a instalação diretamente.
   */
  async baixarEInstalarApk(
    apkUrl: string,
    onProgress?: (progresso: number) => void
  ): Promise<string> {
    const localUri = await this.baixarApk(apkUrl, onProgress);
    await this.instalarApk(localUri, apkUrl);
    return localUri;
  }
}

export const updateService = new UpdateService();
