import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { useThemeColors } from '../store/useAppStore';

interface SkeletonProps {
  style?: ViewStyle | ViewStyle[];
  inverted?: boolean;
}

export const Skeleton = ({ style, inverted = false }: SkeletonProps) => {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;
  const { colors } = useThemeColors();

  const bgColor = inverted ? 'rgba(255,255,255,0.2)' : colors.surfaceBorder;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: bgColor,
          opacity: fadeAnim,
          borderRadius: 8,
        },
        style,
      ]}
    />
  );
};
