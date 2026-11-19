import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { NaturezaInfracao } from '../core/rules/types';

/**
 * Dispara feedback tátil ergonômico diferenciado por severidade da falta.
 * Funciona de forma segura em ambiente móvel físico com fallback silencioso na web/emulador.
 */
export async function triggerHapticByNature(natureza: NaturezaInfracao): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    switch (natureza) {
      case 'leve':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'media':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'grave':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'gravissima':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // Ignora se o dispositivo não tiver suporte a vibração
  }
}

export async function triggerHapticSuccess(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}

export async function triggerHapticWarning(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {}
}
