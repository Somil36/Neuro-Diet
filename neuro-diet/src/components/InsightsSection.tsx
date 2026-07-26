import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { getGoalColor } from '../theme/theme';
import { GlassCard } from './GlassCard';
import { useAppStore, useThemeColors } from '../store/useAppStore';
import * as ProgressPrimitive from '@rn-primitives/progress';
import * as AccordionPrimitive from '@rn-primitives/accordion';

const WEEKLY_TREND = [
  { label: 'Mon', val: 40 },
  { label: 'Tue', val: 65 },
  { label: 'Wed', val: 50 },
  { label: 'Thu', val: 85 },
  { label: 'Fri', val: 70 },
  { label: 'Sat', val: 95 },
  { label: 'Sun', val: 80 },
];

const SYNTHESIS_STATS = [
  { label: 'Focus Control', value: 85 },
  { label: 'Physical Recovery', value: 60 },
  { label: 'Stamina Reserves', value: 92 },
];

const TROPHIES = [
  { title: '7-Day Streak', icon: '🔥', unlocked: true },
  { title: 'Protein Master', icon: '🥩', unlocked: true },
  { title: 'Zen Mind', icon: '🧘', unlocked: false },
  { title: 'Early Bird', icon: '🌅', unlocked: true },
  { title: 'Iron Lungs', icon: '🫁', unlocked: false },
  { title: 'Hydration Pro', icon: '💧', unlocked: true },
];

const SCIENCE_FAQ = [
  { value: 'theanine', title: 'Why L-Theanine?', content: 'L-Theanine is an amino acid found primarily in green tea that promotes relaxation without drowsiness, perfectly complementing caffeine to create sustained focus.' },
];

const AnimatedBar = ({ value, label, max, semanticColor, colors }: any) => {
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: (value / max) * 150,
      duration: 1000,
      useNativeDriver: false
    }).start();
  }, [value]);

  return (
    <View style={styles.barColumn}>
      <View style={[styles.barTrack, { backgroundColor: colors.surfaceBorder }]}>
        <Animated.View style={[styles.barFill, { height: heightAnim, backgroundColor: semanticColor }]} />
      </View>
      <Text style={[styles.barLabel, { color: colors.textPrimary }]}>{label}</Text>
    </View>
  );
};

const ScienceAccordionItem = ({ value, title, content, isOpen, semanticColor, colors }: any) => {
  const heightAnim = useRef(new Animated.Value(isOpen ? 100 : 0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, { toValue: isOpen ? 100 : 0, duration: 300, useNativeDriver: false }).start();
  }, [isOpen]);

  return (
    <AccordionPrimitive.Item value={value} style={styles.accordionWrapper}>
      <GlassCard style={{ padding: 16 }}>
        <AccordionPrimitive.Trigger style={styles.accordionHeader}>
          <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{title}</Text>
          <Text style={{ color: semanticColor, fontWeight: '800' }}>{isOpen ? '-' : '+'}</Text>
        </AccordionPrimitive.Trigger>
        <AccordionPrimitive.Content forceMount>
          <Animated.View style={{ height: heightAnim, overflow: 'hidden', marginTop: isOpen ? 12 : 0 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{content}</Text>
          </Animated.View>
        </AccordionPrimitive.Content>
      </GlassCard>
    </AccordionPrimitive.Item>
  );
};

const Badge = ({ title, icon, unlocked, semanticColor, colors, isDark }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const bounce = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true })
    ]).start();
  };

  return (
    <Pressable onPress={bounce} style={[styles.badgeWrapper, { opacity: unlocked ? 1 : 0.4 }]}>
      <Animated.View style={[
        styles.badgeCircle,
        {
          transform: [{ scale: scaleAnim }],
          backgroundColor: unlocked ? semanticColor : colors.surfaceBorder,
          borderColor: unlocked ? (isDark ? '#fff' : '#000') : 'transparent',
        }
      ]}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </Animated.View>
      <Text style={[styles.badgeTitle, { color: colors.textPrimary }]}>{title}</Text>
    </Pressable>
  );
};

export const InsightsSection = () => {
  const { cognitiveGoal, physicalGoal } = useAppStore();
  const { colors, isDark } = useThemeColors();
  const semanticColor = getGoalColor(cognitiveGoal || 'Focus', isDark);
  const [openItems, setOpenItems] = useState<string[]>([]);

  const faq = [...SCIENCE_FAQ, { value: 'goal', title: `How does ${physicalGoal || 'your goal'} work?`, content: 'By prioritizing macronutrients that trigger anabolism and balancing blood sugar levels, your body synthesizes new tissue rapidly during recovery windows.' }];

  return (
    <View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Intelligence</Text>
      <Text style={[styles.subtitle, { color: colors.textPrimary }]}>Your Neural Analytics</Text>

      <GlassCard inverted={true} style={styles.trendCard}>
        <Text style={[styles.cardHeading, { color: colors.invertedTextPrimary }]}>7-Day Neuro-Score Trend</Text>
        <View style={styles.trendRow}>
          {WEEKLY_TREND.map((d) => (
            <AnimatedBar key={d.label} value={d.val} max={100} label={d.label} semanticColor={semanticColor} colors={{ ...colors, textPrimary: colors.invertedTextPrimary }} />
          ))}
        </View>
      </GlassCard>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Physical & Cognitive Synthesis</Text>
      <GlassCard style={styles.synthesisCard}>
         {SYNTHESIS_STATS.map((stat, i) => (
            <View key={stat.label} style={i < SYNTHESIS_STATS.length - 1 ? styles.statRow : undefined}>
              <Text style={[styles.statLabel, { color: colors.textPrimary }]}>{stat.label}</Text>
              <ProgressPrimitive.Root value={stat.value} style={{ ...styles.progressTrack, backgroundColor: colors.surfaceBorder }}>
                 <ProgressPrimitive.Indicator style={{ ...styles.progressFill, width: `${stat.value}%`, backgroundColor: semanticColor }} />
              </ProgressPrimitive.Root>
            </View>
         ))}
      </GlassCard>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Trophies</Text>
      <GlassCard style={styles.trophyCard}>
         {TROPHIES.map((badge) => (
           <Badge key={badge.title} {...badge} semanticColor={semanticColor} colors={colors} isDark={isDark} />
         ))}
      </GlassCard>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>The Science</Text>
      <AccordionPrimitive.Root type="multiple" value={openItems} onValueChange={setOpenItems}>
        {faq.map(item => (
          <ScienceAccordionItem key={item.value} {...item} isOpen={openItems.includes(item.value)} semanticColor={semanticColor} colors={colors} />
        ))}
      </AccordionPrimitive.Root>
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', marginTop: 4, marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  cardHeading: { fontWeight: '800', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1 },
  trendCard: { padding: 24, marginBottom: 24 },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 180 },
  barColumn: { alignItems: 'center', marginHorizontal: 4 },
  barTrack: { height: 150, width: 30, borderRadius: 15, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 15 },
  barLabel: { fontSize: 10, marginTop: 8, fontWeight: '700' },
  synthesisCard: { padding: 24, marginBottom: 24 },
  statRow: { marginBottom: 12 },
  statLabel: { fontSize: 12, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  trophyCard: { padding: 24, marginBottom: 24, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  badgeWrapper: { width: '30%', alignItems: 'center', marginBottom: 16 },
  badgeCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 2 },
  badgeTitle: { fontSize: 10, textAlign: 'center', fontWeight: '700' },
  accordionWrapper: { marginBottom: 12 },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between' },
});
