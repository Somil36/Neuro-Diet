import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import * as ToastPrimitive from '@rn-primitives/toast';
import { useToastStore } from '../store/useToastStore';
import { useThemeColors } from '../store/useAppStore';

// Mounted once at the App root (alongside PortalHost) so any screen can fire
// a toast via showToast() without wiring its own notification UI.
export const ToastHost = () => {
  const { message, visible, action, hide } = useToastStore();
  const { colors } = useThemeColors();

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <ToastPrimitive.Root
        type="foreground"
        open={visible}
        onOpenChange={(open) => { if (!open) hide(); }}
        style={{ ...styles.toast, backgroundColor: colors.invertedSurface }}
      >
        <ToastPrimitive.Title style={{ color: colors.invertedTextPrimary, fontWeight: '700', flexShrink: 1 }}>{message}</ToastPrimitive.Title>
        {action && (
          <Pressable onPress={() => { action.onPress(); hide(); }} hitSlop={8}>
            <Text style={{ color: colors.primary, fontWeight: '800', marginLeft: 12 }}>{action.label}</Text>
          </Pressable>
        )}
      </ToastPrimitive.Root>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', bottom: 110, left: 0, right: 0, alignItems: 'center', zIndex: 999 },
  toast: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 16, maxWidth: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});
