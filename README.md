# 🚗 SimulaDetran — Simulador Prático do Exame de Direção (DETRAN)

Aplicativo mobile profissional desenvolvido em **React Native (Expo SDK 52, New Architecture)** e arquitetura **Offline-First**, projetado para instrutores de trânsito e autoescolas realizarem simulados da prova prática do Detran de acordo com a **Resolução Contran nº 1.020/2025** e o **Manual Brasileiro de Exames de Direção Veicular (MBEDV 2026)**.

---

## 📱 Como Baixar e Instalar o APK

Os arquivos `.apk` prontos para instalação direta em celulares Android ficam disponíveis na aba de Releases do repositório:
👉 **[GitHub Releases — SimulaDetran](https://github.com/JaoOlvr/SimuladoDentran/releases)**

1. Acesse a versão mais recente em [Releases](https://github.com/JaoOlvr/SimuladoDentran/releases).
2. Na seção de **Assets**, faça o download do arquivo `SimulaDetran-v1.0.0.apk`.
3. No smartphone Android, toque no arquivo baixado e confirme a instalação (autorizando fontes desconhecidas se necessário).

---

## 🚀 Como Gerar Novos APKs para os Releases

### Opção 1: Automático via GitHub Actions (Recomendado)
O projeto possui um workflow configurado em `.github/workflows/build-and-release-apk.yml`.

1. **Via Tag de Versão (Automático):**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
   O GitHub Actions irá compilar o APK release no ambiente em nuvem e publicar automaticamente uma nova Release com o `.apk` anexado.

2. **Via Interface do GitHub (Manual):**
   - Acesse o repositório no GitHub -> aba **Actions**.
   - Selecione o workflow **"Build e Release APK Android"**.
   - Clique em **"Run workflow"** e confirme. O APK será gerado e publicado na aba Releases.

---

### Opção 2: Via Expo Application Services (EAS Build)
Para compilar na nuvem oficial da Expo:
```bash
# 1. Login no Expo (caso ainda não esteja logado)
npx eas-cli login

# 2. Gerar o APK com o perfil preview (definido no eas.json)
npm run build:apk
# ou
npx eas-cli build -p android --profile preview
```
Ao término, a CLI exibirá o link direto e QR Code para baixar o arquivo `.apk`.

---

## 🛠️ Tecnologias Utilizadas
- **Framework:** React Native 0.76 (Expo SDK 52, TypeScript, New Architecture).
- **Navegação:** Expo Router v4 (baseado em arquivos).
- **Estilização:** NativeWind v4 (Tailwind CSS) com suporte a Alto Contraste WCAG AAA.
- **Banco de Dados Local:** `expo-sqlite` + `drizzle-orm` (Offline-First).
- **Estado Global:** Zustand.
- **Geração de Relatórios:** `expo-print` (HTML para PDF 100% offline) + `expo-sharing` (WhatsApp).
- **Sincronização & Backend:** Supabase (PostgreSQL, RLS e fila `sync_queue`).
- **Testes:** Jest + TypeScript (53 testes unitários e de integração com 100% de aprovação).

---

## 🧪 Rodando os Testes

```bash
# Executar todos os testes
npm test

# Verificação de tipagem TypeScript
npm run typecheck
```
