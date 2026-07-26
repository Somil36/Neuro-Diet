import React from 'react';
import { Text, StyleSheet, Pressable, PressableProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../store/useAppStore';

interface PremiumButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PremiumButton = ({ title, variant = 'primary', style, onPress, ...props }: PremiumButtonProps) => {
  const { colors } = useThemeColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: scale.value }] };
  });

  if (variant === 'primary') {
    return (
      <AnimatedPressable
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={[animatedStyle, style as any]}
        {...props}
      >
        <LinearGradient
          colors={[colors.primary, '#00A85C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, styles.primary, { shadowColor: colors.primary }]}
        >
          <Text style={styles.text}>{title}</Text>
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
      style={[animatedStyle, style as any]}
      {...props}
    >
      <LinearGradient
        colors={[colors.surfaceBorder, 'transparent']}
        style={[styles.button, styles.secondary, { borderColor: colors.border }]}
      >
        <Text style={[styles.text, { color: colors.textPrimary }]}>{title}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  primary: { shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  secondary: { borderWidth: 1 },
  text: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});
