import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppStore, useThemeColors } from '../store/useAppStore';
import { getGoalColor } from '../theme/theme';

const { width } = Dimensions.get('window');

export const GlobalBackground = () => {
  const { cognitiveGoal } = useAppStore();
  const { colors, isDark } = useThemeColors();
  const semanticColor = getGoalColor(cognitiveGoal || 'Focus', isDark);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background[0], zIndex: -1 }]} pointerEvents="none">
      
      {/* Organic Glow Blob */}
      <View style={{
        position: 'absolute',
        top: -width * 0.5,
        left: -width * 0.25,
        width: width * 1.5,
        height: width * 1.5,
        borderRadius: width,
        backgroundColor: semanticColor,
        opacity: isDark ? 0.35 : 0.5,
        ...(Platform.OS === 'web' ? { filter: 'blur(120px)' } as any : {})
      }} />

      {/* Softening Glass Layer */}
      <BlurView 
        intensity={100} 
        tint={isDark ? 'dark' : 'light'} 
        style={StyleSheet.absoluteFill} 
      />
    </View>
  );
};
