import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';

const CONFETTI_COLORS = ['#00D96A', '#0EA5E9', '#8B5CF6', '#FF5A5F', '#FFD166'];
const PARTICLE_COUNT = 16;

interface ConfettiProps {
  trigger: number; // increment this to fire a new burst
}

// Small celebratory particle burst (goal hit, exercise completed, etc).
// Renders nothing until `trigger` moves off its initial value.
export const Confetti = ({ trigger }: ConfettiProps) => {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      anim: new Animated.Value(0),
      angle: Math.random() * Math.PI * 2,
      distance: 60 + Math.random() * 80,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 6,
    }))
  ).current;

  useEffect(() => {
    if (trigger === 0) return;
    particles.forEach(p => p.anim.setValue(0));
    Animated.stagger(15, particles.map(p =>
      Animated.timing(p.anim, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    )).start();
  }, [trigger]);

  if (trigger === 0) return null;

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, zIndex: 10 }}>
      {particles.map((p, i) => {
        const tx = p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(p.angle) * p.distance] });
        const ty = p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(p.angle) * p.distance] });
        const opacity = p.anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute', width: p.size, height: p.size, borderRadius: p.size / 2,
              backgroundColor: p.color, opacity,
              transform: [{ translateX: tx }, { translateY: ty }],
            }}
          />
        );
      })}
    </View>
  );
};
