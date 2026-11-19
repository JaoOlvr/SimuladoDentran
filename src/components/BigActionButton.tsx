import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'warning'
  | 'success'
  | 'outline';

interface BigActionButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  minHeight?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export function BigActionButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  minHeight = 56,
  style,
  textStyle,
  accessibilityLabel,
}: BigActionButtonProps) {
  const getVariantStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          button: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
          text: { color: '#FFFFFF' },
        };
      case 'secondary':
        return {
          button: { backgroundColor: '#E2E8F0', borderColor: '#CBD5E1' },
          text: { color: '#0F172A' },
        };
      case 'success':
        return {
          button: { backgroundColor: '#047857', borderColor: '#047857' },
          text: { color: '#FFFFFF' },
        };
      case 'danger':
        return {
          button: { backgroundColor: '#BE123C', borderColor: '#BE123C' },
          text: { color: '#FFFFFF' },
        };
      case 'warning':
        return {
          button: { backgroundColor: '#D97706', borderColor: '#D97706' },
          text: { color: '#FFFFFF' },
        };
      case 'outline':
        return {
          button: {
            backgroundColor: '#FFFFFF',
            borderColor: '#94A3B8',
            borderWidth: 2,
          },
          text: { color: '#0F172A' },
        };
      default:
        return {
          button: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
          text: { color: '#FFFFFF' },
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      style={[
        styles.baseButton,
        { minHeight },
        vStyles.button,
        disabled && styles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' || variant === 'outline' ? '#0F172A' : '#FFFFFF'}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.baseText,
            vStyles.text,
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
    elevation: 0,
    shadowOpacity: 0,
  },
  baseText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  disabledText: {
    color: '#94A3B8',
  },
});
