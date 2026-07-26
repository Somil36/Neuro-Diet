import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const PHASE_LABELS = ['Breathe In', 'Hold', 'Breathe Out'];
const PHASE_DURATION = 4000;

// The one deliberate use of react-native-reanimated in the app (previously
// installed but unused) - a continuously looping inhale/hold/exhale circle.
export const BreathingBubble = ({ colors }: { colors: any }) => {
  const scale = useSharedValue(1);
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: PHASE_DURATION }),
        withTiming(1.4, { duration: PHASE_DURATION }),
        withTiming(1, { duration: PHASE_DURATION }),
      ),
      -1,
    );
    const interval = setInterval(() => {
      setPhaseIndex((i) => (i + 1) % PHASE_LABELS.length);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }, PHASE_DURATION);
    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bubble, animatedStyle, { backgroundColor: colors.primary }]} />
      <Text style={[styles.label, { color: colors.textPrimary }]}>{PHASE_LABELS[phaseIndex]}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  bubble: { width: 120, height: 120, borderRadius: 60, opacity: 0.85 },
  label: { marginTop: 24, fontSize: 18, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
});
