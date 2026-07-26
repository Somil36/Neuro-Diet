import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { borderRadius } from '../theme/theme';
import { useThemeColors } from '../store/useAppStore';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  inverted?: boolean;
}

export const GlassCard = ({ children, style, inverted = false, ...props }: GlassCardProps) => {
  const { colors, isDark } = useThemeColors();
  const bgColor = inverted ? colors.invertedSurface : colors.surface;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bgColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 16,
          elevation: 4
        },
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    padding: 24,
    overflow: 'hidden',
  }
});
