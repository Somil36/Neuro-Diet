import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, Pressable, Animated, PanResponder, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Pedometer } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius, getGoalColor, commonStyles } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { InsightsSection } from '../components/InsightsSection';
import { GlobalBackground } from '../components/GlobalBackground';
import { Skeleton } from '../components/Skeleton';
import { Confetti } from '../components/Confetti';
import { useAppStore, useThemeColors, getStreakDays } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { computeDailyTargets, getCyclePhase } from '../utils/nutrition';
import { getScreenTimeInsight } from '../utils/screenTime';
import { AVATARS } from '../constants/avatars';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/AlertDialog';

const PROTOCOL_URL = "http://127.0.0.1:8090/api/v1/protocol";
const EXERCISE_URL = "http://127.0.0.1:8090/api/v1/exercise-protocol";

const STEP_GOAL = 10000;

// Rough calories-per-step estimate, the same technique most step-counting
// apps use as a baseline before factoring in stride length/weight: ~0.04
// kcal per step for an average adult.
const CALORIES_PER_STEP = 0.04;

const DailyActivityCard = ({ colors, semanticColor, onStepsChange }: any) => {
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    const subscribe = async () => {
      const available = await Pedometer.isAvailableAsync();
      if (available) {
        return Pedometer.watchStepCount(result => setSteps(result.steps));
      }
    };

    let sub: any;
    subscribe().then(res => sub = res);
    return () => {
      if (sub && sub.remove) sub.remove();
    };
  }, []);

  const caloriesBurned = Math.floor(steps * CALORIES_PER_STEP);
  const progress = Math.min((steps / STEP_GOAL) * 100, 100);

  useEffect(() => {
    onStepsChange?.(steps, caloriesBurned);
  }, [steps]);

  return (
    <View style={[styles.activityCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.cardHeading, { color: colors.textSecondary }]}>Daily Activity</Text>
      <View style={styles.activityRow}>
        <View style={styles.activityStat}>
          <LinearGradient colors={[colors.primary, '#00A85C']} style={styles.activityIcon}>
            <Ionicons name="footsteps" size={20} color="#FFFFFF" />
          </LinearGradient>
          <View>
            <Text style={[styles.activityValue, { color: colors.textPrimary }]}>{steps.toLocaleString()}</Text>
            <Text style={[styles.activityLabel, { color: colors.textSecondary }]}>STEPS</Text>
          </View>
        </View>

        <View style={styles.activityStat}>
          <LinearGradient colors={[colors.accentCyan, '#0B85BE']} style={styles.activityIcon}>
            <Ionicons name="flame" size={20} color="#FFFFFF" />
          </LinearGradient>
          <View>
            <Text style={[styles.activityValue, { color: colors.textPrimary }]}>{caloriesBurned}</Text>
            <Text style={[styles.activityLabel, { color: colors.textSecondary }]}>KCAL</Text>
          </View>
        </View>
      </View>

      <View style={[styles.activityProgressTrack, { backgroundColor: colors.surfaceBorder }]}>
        <View style={{ height: '100%', width: `${progress}%`, backgroundColor: semanticColor, borderRadius: 4 }} />
      </View>
      <Text style={[styles.activityGoalText, { color: colors.textSecondary }]}>{steps.toLocaleString()} / {STEP_GOAL.toLocaleString()} step goal</Text>
    </View>
  );
};

const MoodLogger = ({ semanticColor, colors }: { semanticColor: string, colors: any }) => {
  const [mood, setMood] = useState(3);

  const handleMood = (val: number) => {
    setMood(val);
    Haptics.selectionAsync().catch(() => {});
  };

  return (
    <GlassCard style={{ marginTop: spacing.md, padding: spacing.lg, borderRadius: 20 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '800', marginBottom: 16, textTransform: 'uppercase' }}>Energy Level</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {[1, 2, 3, 4, 5].map((val) => (
          <Pressable
            key={val}
            onPress={() => handleMood(val)}
            style={{
              width: 45, height: 45, borderRadius: 25,
              backgroundColor: mood === val ? semanticColor : 'rgba(128,128,128,0.1)',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: mood === val ? 0 : 1, borderColor: 'rgba(128,128,128,0.2)'
            }}
          >
            <Text style={{ fontSize: 20 }}>{val === 1 ? '😫' : val === 2 ? '🥱' : val === 3 ? '😐' : val === 4 ? '🙂' : '⚡'}</Text>
          </Pressable>
        ))}
      </View>
    </GlassCard>
  );
}

const SwipeQuote = ({ semanticColor, colors }: any) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [swiped, setSwiped] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => !swiped,
      onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > 100 || gesture.dx < -100) {
          Animated.timing(pan, { toValue: { x: gesture.dx > 0 ? 500 : -500, y: 0 }, duration: 200, useNativeDriver: false }).start(() => setSwiped(true));
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
        }
      }
    })
  ).current;

  if (swiped) return null;

  return (
    <Animated.View style={{ transform: [{ translateX: pan.x }], opacity: pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: [0, 1, 0] }) }} {...panResponder.panHandlers}>
      <GlassCard style={{ padding: 24, marginTop: 24, alignItems: 'center', borderColor: semanticColor, borderWidth: 1 }}>
        <Text style={{ fontSize: 32, marginBottom: 12 }}>⚔️</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 16, fontStyle: 'italic', textAlign: 'center', fontWeight: '700' }}>"A warrior's greatest weapon is a focused mind."</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 12, textTransform: 'uppercase' }}>Swipe to dismiss</Text>
      </GlassCard>
    </Animated.View>
  );
}

// Removed ActivityRings

const TodaysPlan = ({ colors, semanticColor, refreshKey }: any) => {
  const { cognitiveGoal, physicalGoal, isVegetarian, workoutExperience, gender, cycleDay } = useAppStore();
  const navigation = useNavigation<any>();
  const [meal, setMeal] = useState<any>(null);
  const [exercise, setExercise] = useState<any>(null);
  const [mindfulness, setMindfulness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const cyclePhase = gender === 'Female' && cycleDay ? getCyclePhase(cycleDay) : undefined;
        const profile = {
          cognitive_goal: cognitiveGoal || 'Enhance Focus',
          physical_goal: physicalGoal || 'Fat Loss',
          is_vegetarian: isVegetarian,
          bmi: 22,
          workout_experience: workoutExperience,
          cycle_phase: cyclePhase,
        };
        const [mealRes, exRes] = await Promise.all([
          fetch(PROTOCOL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_profile: profile }) }),
          fetch(EXERCISE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_profile: profile }) }),
        ]);
        const mealData = await mealRes.json();
        const exData = await exRes.json();
        if (mealData.status === 'success') setMeal(mealData.data.meals?.[0] || null);
        if (exData.status === 'success') {
          setExercise(exData.data.physical_exercises?.[0] || null);
          setMindfulness(exData.data.mindfulness_exercises?.[0] || null);
        }
      } catch (error) {
        console.error("Error loading today's plan:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cognitiveGoal, physicalGoal, isVegetarian, workoutExperience, gender, cycleDay, refreshKey]);

  const rows = [
    meal && { icon: 'restaurant' as const, label: meal.name, sub: `${meal.macros.calories} kcal`, tab: 'Plans' },
    exercise && { icon: 'barbell' as const, label: exercise.name, sub: exercise.level, tab: 'Exercises' },
    mindfulness && { icon: 'leaf' as const, label: mindfulness.name, sub: `${mindfulness.duration_min} min mindfulness`, tab: 'Exercises' },
  ].filter(Boolean) as { icon: any; label: string; sub: string; tab: string }[];

  return (
    <GlassCard style={styles.sectionCard}>
      <Text style={[styles.cardHeading, { color: colors.textPrimary }]}>Today's Plan</Text>
      {loading ? (
        <View style={{ gap: 12 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={styles.planRow}>
              <Skeleton style={{ width: 36, height: 36, borderRadius: 12 }} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton style={{ height: 14, width: '70%' }} />
                <Skeleton style={{ height: 11, width: '40%' }} />
              </View>
            </View>
          ))}
        </View>
      ) : rows.map((row, i) => (
        <Pressable key={i} style={styles.planRow} onPress={() => navigation.navigate(row.tab)}>
          <View style={[styles.planIcon, { backgroundColor: `${semanticColor}22` }]}>
            <Ionicons name={row.icon} size={18} color={semanticColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{row.label}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, textTransform: 'capitalize' }}>{row.sub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      ))}
    </GlassCard>
  );
};

const MacroPill = ({ label, value, color }: any) => (
  <View style={styles.macroPill}>
    <Text style={{ color, fontSize: 20, fontWeight: '900' }}>{value}g</Text>
    <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 }}>{label}</Text>
  </View>
);

const DailyTargets = ({ colors }: any) => {
  const { weight, height, age, gender, activityLevel, physicalGoal } = useAppStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  const targets = computeDailyTargets({
    weightKg: weight || 70,
    heightCm: height || 170,
    age: age || 25,
    gender,
    activityLevel,
    physicalGoal: physicalGoal || 'Stamina/Endurance',
  });

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <GlassCard inverted={true} style={styles.sectionCard}>
        <Text style={[styles.cardHeading, { color: colors.invertedTextSecondary }]}>Daily Targets</Text>
        <Text style={{ color: colors.invertedTextPrimary, fontSize: 42, fontWeight: '900' }}>
          {targets.calories} <Text style={{ fontSize: 16, fontWeight: '700', color: colors.invertedTextSecondary }}>kcal</Text>
        </Text>
        <View style={styles.macroRow}>
          <MacroPill label="Protein" value={targets.protein_g} color={colors.accentCyan} />
          <MacroPill label="Carbs" value={targets.carbs_g} color={colors.accentPurple} />
          <MacroPill label="Fats" value={targets.fats_g} color={colors.primary} />
        </View>
      </GlassCard>
    </Animated.View>
  );
};

const WeeklyChallenge = ({ colors, semanticColor }: any) => {
  const progress = 2;
  const target = 3;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: (progress / target) * 100, duration: 1000, useNativeDriver: false }).start();
  }, []);

  return (
    <GlassCard style={styles.sectionCard}>
      <View style={styles.challengeHeader}>
        <Text style={[styles.cardHeading, { color: colors.textPrimary, marginBottom: 0 }]}>Weekly Challenge</Text>
        <Text style={{ color: semanticColor, fontWeight: '800' }}>{progress}/{target}</Text>
      </View>
      <Text style={{ color: colors.textSecondary, marginTop: 8, marginBottom: 12 }}>Complete 3 mindfulness sessions this week</Text>
      <View style={{ height: 8, backgroundColor: colors.surfaceBorder, borderRadius: 4, overflow: 'hidden' }}>
        <Animated.View style={{ height: '100%', width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), backgroundColor: semanticColor, borderRadius: 4 }} />
      </View>
    </GlassCard>
  );
};

const SEVERITY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  good: 'checkmark-circle',
  moderate: 'information-circle',
  high: 'alert-circle',
};

const DigitalWellbeingCard = ({ colors }: any) => {
  const { screenTimeLevel, cognitiveGoal } = useAppStore();
  const insight = getScreenTimeInsight(screenTimeLevel, cognitiveGoal || 'Enhance Focus');
  const severityColor = insight.severity === 'good' ? colors.primary : insight.severity === 'high' ? colors.error : colors.accentCyan;

  return (
    <GlassCard style={styles.sectionCard}>
      <View style={styles.challengeHeader}>
        <Text style={[styles.cardHeading, { color: colors.textPrimary, marginBottom: 0 }]}>Digital Wellbeing</Text>
        <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12 }}>{screenTimeLevel}/day</Text>
      </View>
      <View style={styles.wellbeingRow}>
        <Ionicons name={SEVERITY_ICON[insight.severity]} size={22} color={severityColor} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '800', marginBottom: 4 }}>{insight.headline}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>{insight.message}</Text>
          <Text style={[styles.wellbeingSource, { color: colors.textSecondary }]}>Source: {insight.source}</Text>
        </View>
      </View>
    </GlassCard>
  );
};

export const DashboardScreen = () => {
  const {
    cognitiveGoal, completions, avatarId, notifications, markNotificationsRead,
    lastReminderCheckDate, setLastReminderCheckDate, addNotification,
  } = useAppStore();
  const currentUser = useAuthStore((state) => state.currentUser);
  const { colors, isDark } = useThemeColors();
  const semanticColor = getGoalColor(cognitiveGoal || 'Focus', isDark);
  const streak = getStreakDays(completions);
  const navigation = useNavigation<any>();

  const avatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0];
  const unreadCount = notifications.filter(n => !n.read).length;

  const [steps, setSteps] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const goalCelebrated = useRef(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Generate "goals pending" reminders at most once per calendar day, giving
  // the pedometer a few seconds to report an initial reading first.
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (lastReminderCheckDate === today) return;

    const timer = setTimeout(() => {
      if (!completions.some(c => c.date === today)) {
        addNotification("No workout logged yet today — fit in a quick session to keep your streak alive.");
      }
      if (steps < STEP_GOAL) {
        addNotification(`You've only walked ${steps.toLocaleString()} steps (${caloriesBurned} kcal) so far today — keep moving toward your ${STEP_GOAL.toLocaleString()} step goal!`);
      }
      setLastReminderCheckDate(today);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Celebrate crossing the step goal exactly once per day, not on every render.
  useEffect(() => {
    if (steps >= STEP_GOAL && !goalCelebrated.current) {
      goalCelebrated.current = true;
      setConfettiTrigger(t => t + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [steps]);

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshKey(k => k + 1);
    setTimeout(() => setRefreshing(false), 800);
  };

  const headerFontSize = scrollY.interpolate({ inputRange: [0, 80], outputRange: [18, 15], extrapolate: 'clamp' });

  return (
    <View style={[styles.container, { backgroundColor: colors.background[0] }]}>
      <GlobalBackground />
      <SafeAreaView style={styles.safeArea}>
        <Confetti trigger={confettiTrigger} />

        <Animated.ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onRefresh(); }} tintColor={colors.primary} />}
        >

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Pressable onPress={() => navigation.navigate('Profile')} style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: semanticColor }}>
              <Image source={avatar.image} style={{ width: '100%', height: '100%' }} />
            </Pressable>

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Animated.Text style={[commonStyles.screenTitle, { color: colors.textPrimary, fontSize: headerFontSize, marginBottom: 0 }]}>
                Good Morning{currentUser?.username ? ` ${currentUser.username}` : ''}
              </Animated.Text>
            </View>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Pressable onPress={() => { Haptics.selectionAsync().catch(() => {}); markNotificationsRead(); }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceBorder, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
                  {unreadCount > 0 && (
                    <View style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: 'red' }} />
                  )}
                </Pressable>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reminders</AlertDialogTitle>
                  <AlertDialogDescription>
                    {notifications.length === 0 ? "You have no new reminders." : notifications.map(n => n.message).join('\n\n')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>Close</Text>
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </View>

          <DailyActivityCard colors={colors} semanticColor={semanticColor} onStepsChange={(s: number, c: number) => { setSteps(s); setCaloriesBurned(c); }} />

          <TodaysPlan colors={colors} semanticColor={semanticColor} refreshKey={refreshKey} />
          <DailyTargets colors={colors} />
          <WeeklyChallenge colors={colors} semanticColor={semanticColor} />
          <DigitalWellbeingCard colors={colors} />

          <MoodLogger semanticColor={semanticColor} colors={colors} />

          <SwipeQuote semanticColor={semanticColor} colors={colors} />

          <View style={{ marginTop: spacing.xl }}>
            <InsightsSection />
          </View>

        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 100 },
  subtitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', marginTop: 4, letterSpacing: 0.5 },
  streakBadge: { alignItems: 'center', padding: 12, borderRadius: 16 },
  activityCard: { borderRadius: borderRadius.xl, marginTop: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  activityRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  activityStat: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activityIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  activityValue: { fontSize: 24, fontWeight: '900' },
  activityLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  activityProgressTrack: { height: 8, borderRadius: 4, marginTop: 20, overflow: 'hidden' },
  activityGoalText: { fontSize: 11, fontWeight: '700', marginTop: 8 },
  sectionCard: { marginTop: 24, padding: 20 },
  cardHeading: { fontWeight: '800', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1, fontSize: 13 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  planIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  macroPill: { alignItems: 'center' },
  challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wellbeingRow: { flexDirection: 'row', gap: 12, marginTop: 12, alignItems: 'flex-start' },
  wellbeingSource: { fontSize: 10, marginTop: 8, fontStyle: 'italic' },
});
