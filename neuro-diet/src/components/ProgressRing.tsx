import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-100
  color: string;
  trackColor: string;
  children?: React.ReactNode;
}

// Shared circular progress indicator (rest timer, step goal, etc). Animates
// strokeDashoffset on value changes rather than jumping instantly.
export const ProgressRing = ({ size = 100, strokeWidth = 10, progress, color, trackColor, children }: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: Math.min(100, Math.max(0, progress)),
      duration: 500,
      useNativeDriver: false, // strokeDashoffset isn't supported by the native driver
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedProgress.interpolate({ inputRange: [0, 100], outputRange: [circumference, 0] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
        />
      </Svg>
      {children}
    </View>
  );
};
