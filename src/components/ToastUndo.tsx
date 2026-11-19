import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

interface ToastUndoProps {
  mensagem: string;
  onUndo: () => void;
  onDismiss: () => void;
  duracaoMs?: number;
}

export function ToastUndo({
  mensagem,
  onUndo,
  onDismiss,
  duracaoMs = 5000,
}: ToastUndoProps) {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => onDismiss());
    }, duracaoMs);

    return () => clearTimeout(timer);
  }, [duracaoMs, onDismiss, opacityAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      <View style={styles.content}>
        <Text style={styles.text} numberOfLines={2}>
          {mensagem}
        </Text>
        <TouchableOpacity
          style={styles.undoButton}
          onPress={onUndo}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Desfazer lançamento"
        >
          <Text style={styles.undoText}>DESFAZER</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 84, // Logo acima da barra inferior fixa
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  content: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  text: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 12,
  },
  undoButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  undoText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});

