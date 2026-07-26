import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ToggleGroupPrimitive from '@rn-primitives/toggle-group';
import { spacing, commonStyles, getGoalColor } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { GlobalBackground } from '../components/GlobalBackground';
import { Skeleton } from '../components/Skeleton';
import { BreathingBubble } from '../components/BreathingBubble';
import { ProgressRing } from '../components/ProgressRing';
import { useAppStore, useThemeColors, getStreakDays } from '../store/useAppStore';
import { getCyclePhase } from '../utils/nutrition';
import { showToast } from '../store/useToastStore';

const API_URL = "http://127.0.0.1:8090/api/v1/exercise-protocol";
const CATEGORY_FILTERS = ['All', 'Strength', 'Cardio', 'Stretching', 'Mindfulness'];
const FAVORITES_ROW_HEIGHT = 60;

const REST_SECONDS_BY_GOAL: Record<string, number> = {
  'Muscle Gain': 90,
  'Stamina/Endurance': 30,
  'Fat Loss': 45,
};

const FavoriteButton = ({ active, onPress, colors }: any) => (
  <Pressable onPress={onPress} hitSlop={8}>
    <Ionicons name={active ? 'heart' : 'heart-outline'} size={22} color={active ? colors.error : colors.textSecondary} />
  </Pressable>
);

// Brief scale+fade checkmark burst shown after Mark Done, shared by both card types.
const CompletionBurst = ({ trigger, color }: { trigger: number; color: string }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger === 0) return;
    anim.setValue(0);
    Animated.sequence([
      Animated.spring(anim, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 300, delay: 400, useNativeDriver: true }),
    ]).start();
  }, [trigger]);

  if (trigger === 0) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.completionBurst, { opacity: anim, transform: [{ scale: anim }] }]}>
      <Ionicons name="checkmark-circle" size={64} color={color} />
    </Animated.View>
  );
};

const ExerciseCard = ({ exercise, colors, isFavorite, onToggleFavorite, onMarkDone, restSeconds }: any) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(restSeconds);
  const [burstTrigger, setBurstTrigger] = useState(0);

  useEffect(() => {
    if (!timerActive) return;
    if (secondsLeft <= 0) { setTimerActive(false); return; }
    const t = setTimeout(() => setSecondsLeft((s: number) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timerActive, secondsLeft]);

  const handleMarkDone = () => {
    setBurstTrigger(t => t + 1);
    onMarkDone();
  };

  return (
    <GlassCard style={styles.exerciseCard}>
      <CompletionBurst trigger={burstTrigger} color={colors.primary} />
      <View style={styles.exerciseHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>{exercise.name}</Text>
          <Text style={[styles.exerciseMeta, { color: colors.textSecondary }]}>
            {exercise.level} · {exercise.equipment || 'no equipment'}{exercise.primary_muscles?.length ? ` · ${exercise.primary_muscles.join(', ')}` : ''}
          </Text>
        </View>
        <FavoriteButton active={isFavorite} onPress={onToggleFavorite} colors={colors} />
      </View>

      <Pressable onPress={() => setShowInstructions(!showInstructions)}>
        <Text style={[styles.stepsToggle, { color: colors.primary }]}>{showInstructions ? 'Hide steps' : 'View steps'}</Text>
      </Pressable>
      {showInstructions && (exercise.instructions || []).map((step: string, i: number) => (
        <Text key={i} style={[styles.stepText, { color: colors.textSecondary }]}>{i + 1}. {step}</Text>
      ))}

      <View style={styles.actionRow}>
        <Pressable
          style={[styles.actionBtn, styles.timerBtn, { backgroundColor: colors.surfaceBorder }]}
          onPress={() => { Haptics.selectionAsync().catch(() => {}); setSecondsLeft(restSeconds); setTimerActive(true); }}
        >
          {timerActive ? (
            <ProgressRing size={28} strokeWidth={3} progress={(1 - secondsLeft / restSeconds) * 100} color={colors.primary} trackColor={colors.surface}>
              <Text style={{ color: colors.textPrimary, fontSize: 10, fontWeight: '800' }}>{secondsLeft}</Text>
            </ProgressRing>
          ) : null}
          <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{timerActive ? 's left' : 'Rest Timer'}</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleMarkDone}>
          <Text style={styles.actionBtnDoneText}>Mark Done</Text>
        </Pressable>
      </View>
    </GlassCard>
  );
};

const MindfulnessCard = ({ exercise, colors, isActive, onToggleActive, onMarkDone, isFavorite, onToggleFavorite }: any) => {
  const [burstTrigger, setBurstTrigger] = useState(0);
  const handleMarkDone = () => {
    setBurstTrigger(t => t + 1);
    onMarkDone();
  };

  return (
    <GlassCard style={styles.exerciseCard}>
      <CompletionBurst trigger={burstTrigger} color={colors.primary} />
      <View style={styles.exerciseHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>{exercise.name}</Text>
          <Text style={[styles.exerciseMeta, { color: colors.textSecondary }]}>{exercise.duration_min} min · Mindfulness</Text>
        </View>
        <FavoriteButton active={isFavorite} onPress={onToggleFavorite} colors={colors} />
      </View>

      {isActive && <BreathingBubble colors={colors} />}

      <View style={styles.actionRow}>
        <Pressable style={[styles.actionBtn, { backgroundColor: colors.surfaceBorder }]} onPress={() => { Haptics.selectionAsync().catch(() => {}); onToggleActive(); }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{isActive ? 'Stop' : 'Start Session'}</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleMarkDone}>
          <Text style={styles.actionBtnDoneText}>Mark Done</Text>
        </Pressable>
      </View>
    </GlassCard>
  );
};

// Long-press-and-drag reordering for the favorites shortlist. Simple index-swap
// model: track which row is being dragged and its live vertical offset, and on
// release compute how many rows it crossed to splice it into its new position.
const DraggableFavoritesList = ({ items, colors, semanticColor, onReorder }: any) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;

  const makeResponder = (index: number) => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setDragIndex(index);
      dragY.setValue(0);
    },
    onPanResponderMove: Animated.event([null, { dy: dragY }], { useNativeDriver: false }),
    onPanResponderRelease: (_evt, gesture) => {
      const moveBy = Math.round(gesture.dy / FAVORITES_ROW_HEIGHT);
      const newIndex = Math.min(items.length - 1, Math.max(0, index + moveBy));
      if (newIndex !== index) {
        const reordered = [...items];
        const [moved] = reordered.splice(index, 1);
        reordered.splice(newIndex, 0, moved);
        onReorder(reordered);
        Haptics.selectionAsync().catch(() => {});
      }
      setDragIndex(null);
      dragY.setValue(0);
    },
  });

  return (
    <View style={{ marginBottom: 8 }}>
      {items.map((item: any, index: number) => {
        const isDragging = dragIndex === index;
        const responder = makeResponder(index);
        return (
          <Animated.View
            key={item.id}
            {...responder.panHandlers}
            style={[
              styles.favoriteRow,
              { backgroundColor: colors.surfaceBorder, height: FAVORITES_ROW_HEIGHT - 8 },
              isDragging && { transform: [{ translateY: dragY }], zIndex: 10, opacity: 0.9, borderColor: semanticColor, borderWidth: 1 },
            ]}
          >
            <Ionicons name="reorder-three" size={20} color={colors.textSecondary} />
            <Text style={{ color: colors.textPrimary, fontWeight: '700', marginLeft: 12, flex: 1 }} numberOfLines={1}>{item.name}</Text>
            {item.is_mindfulness ? (
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{item.duration_min} min</Text>
            ) : (
              <Text style={{ color: colors.textSecondary, fontSize: 11, textTransform: 'capitalize' }}>{item.level}</Text>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
};

export const ExercisesScreen = () => {
  const { cognitiveGoal, physicalGoal, workoutExperience, gender, cycleDay, favoriteExerciseIds, toggleFavoriteExercise, completions, logCompletion, undoCompletion } = useAppStore();
  const { colors, isDark } = useThemeColors();
  const semanticColor = getGoalColor(cognitiveGoal || 'Focus', isDark);

  const [physicalExercises, setPhysicalExercises] = useState<any[]>([]);
  const [mindfulnessExercises, setMindfulnessExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [activeBreathingId, setActiveBreathingId] = useState<number | null>(null);
  const [favoriteOrder, setFavoriteOrder] = useState<any[]>([]);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        const cyclePhase = gender === 'Female' && cycleDay ? getCyclePhase(cycleDay) : undefined;
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_profile: {
              cognitive_goal: cognitiveGoal || 'Enhance Focus',
              physical_goal: physicalGoal || 'Fat Loss',
              is_vegetarian: false,
              bmi: 22,
              workout_experience: workoutExperience,
              cycle_phase: cyclePhase,
            }
          })
        });
        const data = await response.json();
        if (data.status === 'success') {
          setPhysicalExercises(data.data.physical_exercises || []);
          setMindfulnessExercises(data.data.mindfulness_exercises || []);
        }
      } catch (error) {
        console.error('Error fetching exercises:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, [cognitiveGoal, physicalGoal, workoutExperience, gender, cycleDay]);

  // Keep the reorderable favorites list in sync with the underlying favorite
  // IDs (added/removed elsewhere) while preserving any custom drag order for
  // items that are still favorited.
  useEffect(() => {
    const all = [...mindfulnessExercises, ...physicalExercises];
    const favorited = favoriteExerciseIds
      .map(id => favoriteOrder.find(f => f.id === id) || all.find(e => e.id === id))
      .filter(Boolean);
    setFavoriteOrder(favorited);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoriteExerciseIds, physicalExercises, mindfulnessExercises]);

  const restSeconds = REST_SECONDS_BY_GOAL[physicalGoal] || 45;
  const showPhysical = category !== 'Mindfulness';
  const showMindfulness = category === 'All' || category === 'Mindfulness';
  const filteredPhysical = category === 'All' || category === 'Mindfulness'
    ? physicalExercises
    : physicalExercises.filter(e => e.category?.toLowerCase() === category.toLowerCase());

  const handleMarkDone = (exercise: any) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    logCompletion(exercise.id);
    const streak = getStreakDays([...completions, { date: new Date().toISOString().slice(0, 10), exerciseId: exercise.id }]);
    showToast(`${exercise.name} logged - ${streak}-day streak!`, { label: 'Undo', onPress: () => undoCompletion(exercise.id) });
  };

  const handleToggleFavorite = (exercise: any) => {
    const wasFavorite = favoriteExerciseIds.includes(exercise.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggleFavoriteExercise(exercise.id);
    showToast(wasFavorite ? 'Removed from favorites' : 'Added to favorites', { label: 'Undo', onPress: () => toggleFavoriteExercise(exercise.id) });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background[0] }]}>
      <GlobalBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[commonStyles.screenTitle, { color: colors.textPrimary }]}>Exercises</Text>
          <Text style={[styles.subtitle, { color: colors.textPrimary }]}>Body + Mind for {physicalGoal || 'your goals'}</Text>

          <ToggleGroupPrimitive.Root type="single" value={category} onValueChange={(v) => v && setCategory(v)} style={styles.filterRow}>
            {CATEGORY_FILTERS.map(cat => (
              <ToggleGroupPrimitive.Item
                key={cat}
                value={cat}
                style={{ ...styles.filterChip, backgroundColor: category === cat ? semanticColor : colors.surfaceBorder }}
              >
                <Text style={{ color: category === cat ? '#000' : colors.textPrimary, fontWeight: '700', fontSize: 12 }}>{cat}</Text>
              </ToggleGroupPrimitive.Item>
            ))}
          </ToggleGroupPrimitive.Root>

          {loading ? (
            <View style={{ marginTop: 24, gap: 16 }}>
              {[1, 2, 3].map(i => <Skeleton key={i} style={{ height: 100, borderRadius: 20 }} inverted={!isDark} />)}
            </View>
          ) : (
            <>
              {favoriteOrder.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Favorites (drag to reorder)</Text>
                  <DraggableFavoritesList items={favoriteOrder} colors={colors} semanticColor={semanticColor} onReorder={setFavoriteOrder} />
                </>
              )}

              {showMindfulness && mindfulnessExercises.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Mindfulness</Text>
                  {mindfulnessExercises.map(ex => (
                    <MindfulnessCard
                      key={ex.id}
                      exercise={ex}
                      colors={colors}
                      isActive={activeBreathingId === ex.id}
                      onToggleActive={() => setActiveBreathingId(activeBreathingId === ex.id ? null : ex.id)}
                      onMarkDone={() => handleMarkDone(ex)}
                      isFavorite={favoriteExerciseIds.includes(ex.id)}
                      onToggleFavorite={() => handleToggleFavorite(ex)}
                    />
                  ))}
                </>
              )}

              {showPhysical && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Physical</Text>
                  {filteredPhysical.map(ex => (
                    <ExerciseCard
                      key={ex.id}
                      exercise={ex}
                      colors={colors}
                      restSeconds={restSeconds}
                      isFavorite={favoriteExerciseIds.includes(ex.id)}
                      onToggleFavorite={() => handleToggleFavorite(ex)}
                      onMarkDone={() => handleMarkDone(ex)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 120 },
  subtitle: { marginTop: 4, marginBottom: 20, fontWeight: '700', textTransform: 'uppercase', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginTop: 8, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  exerciseCard: { padding: 20, marginBottom: 16 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  exerciseName: { fontSize: 17, fontWeight: '800' },
  exerciseMeta: { fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  stepsToggle: { fontWeight: '700', marginTop: 12 },
  stepText: { fontSize: 12, marginTop: 6, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  timerBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  actionBtnDoneText: { color: '#000', fontWeight: '800' },
  completionBurst: { position: 'absolute', top: '30%', left: 0, right: 0, alignItems: 'center', zIndex: 20 },
  favoriteRow: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8, borderRadius: 12 },
});
