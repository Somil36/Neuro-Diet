import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Animated, Easing, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as RadioGroupPrimitive from '@rn-primitives/radio-group';
import { spacing, borderRadius as radii } from '../theme/theme';
import { GlobalBackground } from '../components/GlobalBackground';
import { GlassCard } from '../components/GlassCard';
import Counter from '../components/Counter';
import { useAppStore, useThemeColors, Gender, ActivityLevel, WorkoutExperience, SleepQuality, StressLevel, ScreenTimeLevel } from '../store/useAppStore';
import { AVATARS } from '../constants/avatars';

type StepKey = 'cognitive' | 'physical' | 'diet' | 'gender' | 'cycleDay' | 'age' | 'activity'
  | 'experience' | 'sleep' | 'stress' | 'screenTime' | 'baseline' | 'avatar' | 'synthesizing';

const STEP_ORDER: StepKey[] = ['cognitive', 'physical', 'diet', 'gender', 'cycleDay', 'age', 'activity',
  'experience', 'sleep', 'stress', 'screenTime', 'baseline', 'avatar', 'synthesizing'];

// Every step gets a distinct accent from the existing palette instead of a
// uniform black card, cycling through the theme's tokens (stress gets the
// "error" red specifically, since that tone fits the question).
type ColorKey = 'primary' | 'accentCyan' | 'accentPurple' | 'error';
const STEP_COLOR_KEY: Record<StepKey, ColorKey> = {
  cognitive: 'primary', physical: 'accentCyan', diet: 'accentPurple', gender: 'primary',
  cycleDay: 'accentPurple', age: 'accentCyan', activity: 'primary', experience: 'accentCyan',
  sleep: 'accentPurple', stress: 'error', screenTime: 'accentCyan', baseline: 'primary',
  avatar: 'accentPurple', synthesizing: 'primary',
};
const getStepColor = (step: StepKey, colors: any) => colors[STEP_COLOR_KEY[step]];

// The only conditional step: cycle day only makes sense for female users.
const isStepVisible = (key: StepKey, gender: Gender | ''): boolean => key !== 'cycleDay' || gender === 'Female';
const visibleSteps = (gender: Gender | '') => STEP_ORDER.filter(k => isStepVisible(k, gender));

const getAdjacentStep = (current: StepKey, gender: Gender | '', dir: 1 | -1): StepKey => {
  const seq = visibleSteps(gender);
  const next = seq[seq.indexOf(current) + dir];
  return next ?? current;
};

interface Answers {
  cogGoal: string; physGoal: string; isVeg: boolean | null; gender: Gender | '';
  activity: ActivityLevel | ''; experience: WorkoutExperience | ''; sleep: SleepQuality | '';
  stress: StressLevel | ''; screenTime: ScreenTimeLevel | '';
}

// Counter-based steps (cycle day/age/weight/height) always carry a valid
// numeric default, so they're never "unanswered" - only the tap-a-tile
// questions need an explicit choice before Next will proceed.
const isAnswered = (step: StepKey, a: Answers): boolean => {
  switch (step) {
    case 'cognitive': return a.cogGoal !== '';
    case 'physical': return a.physGoal !== '';
    case 'diet': return a.isVeg !== null;
    case 'gender': return a.gender !== '';
    case 'activity': return a.activity !== '';
    case 'experience': return a.experience !== '';
    case 'sleep': return a.sleep !== '';
    case 'stress': return a.stress !== '';
    case 'screenTime': return a.screenTime !== '';
    default: return true;
  }
};

const FadeInView = ({ children, isVisible }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (isVisible) {
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1, justifyContent: 'center' }}>
      {children}
    </Animated.View>
  );
};

const StepProgress = ({ index, total, color, colors }: { index: number; total: number; color: string; colors: any }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(widthAnim, { toValue: (index / total) * 100, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [index, total]);

  return (
    <View style={[styles.progressTrack, { backgroundColor: colors.surfaceBorder }]}>
      <Animated.View style={[styles.progressFill, { backgroundColor: color, width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
    </View>
  );
};

// Replaces the old anime-character images with an icon+gradient tile in the
// same premium gradient style already used by PremiumButton/CustomTabBarButton.
// Tapping only selects now - it no longer auto-advances the flow.
const GradientTile = ({ title, icon, onPress, selected, color, colors }: any) => (
  <Pressable onPress={onPress} style={[styles.tileContainer, selected && { borderColor: color, transform: [{ scale: 1.05 }] }]}>
    <LinearGradient colors={selected ? [color, color] : [colors.surfaceBorder, colors.surfaceBorder]} style={styles.tileGradient}>
      <Ionicons name={icon} size={40} color={selected ? '#FFFFFF' : colors.textSecondary} />
      <Text style={[styles.tileTitle, { color: selected ? '#FFFFFF' : colors.textPrimary }]}>{title}</Text>
    </LinearGradient>
  </Pressable>
);

interface TileOption { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; }

const QuestionStep = ({ question, subtitle, options, value, onChange, color, colors }: {
  question: string; subtitle?: string; options: TileOption[]; value: string; onChange: (v: string) => void; color: string; colors: any;
}) => (
  <GlassCard inverted={true} style={[styles.card, { borderTopWidth: 4, borderTopColor: color }]}>
    <Text style={[styles.question, { color: colors.invertedTextPrimary }]}>{question}</Text>
    {subtitle && <Text style={[styles.subtitle, { color: colors.invertedTextSecondary }]}>{subtitle}</Text>}
    <RadioGroupPrimitive.Root value={value} onValueChange={onChange} style={styles.tileGrid}>
      {options.map(opt => {
        const selected = value === opt.value;
        return (
          <RadioGroupPrimitive.Item
            key={opt.value}
            value={opt.value}
            style={{ flexBasis: '45%', alignItems: 'center', padding: 20, borderRadius: 16, backgroundColor: selected ? color : 'rgba(255,255,255,0.08)' }}
          >
            <Ionicons name={opt.icon} size={28} color={selected ? '#000' : colors.invertedTextSecondary} />
            <Text style={{ marginTop: 8, fontWeight: '800', fontSize: 13, textTransform: 'uppercase', color: selected ? '#000' : colors.invertedTextPrimary }}>{opt.label}</Text>
          </RadioGroupPrimitive.Item>
        );
      })}
    </RadioGroupPrimitive.Root>
  </GlassCard>
);

const DietTile = ({ title, emoji, selected, onPress, color, colors }: any) => (
  <Pressable onPress={onPress} style={[styles.dietTile, { backgroundColor: colors.surfaceBorder, borderColor: selected ? color : 'transparent' }]}>
    <Text style={styles.dietEmoji}>{emoji}</Text>
    <Text style={[styles.dietTitle, { color: colors.invertedTextPrimary }]}>{title}</Text>
  </Pressable>
);

// Previous/Next footer, shared by every step. Next stays tappable even when
// unanswered (rather than truly disabled) so pressing it can shake the card
// as feedback instead of silently doing nothing - that's what makes the
// mandatory questions legible rather than just inert.
const NavFooter = ({ onPrev, onNext, showPrev, nextLabel, color }: any) => (
  <View style={styles.navRow}>
    {showPrev ? (
      <Pressable onPress={onPrev} style={styles.navBackBtn}>
        <Ionicons name="chevron-back" size={20} color={color} />
        <Text style={[styles.navBackText, { color }]}>Back</Text>
      </Pressable>
    ) : <View style={{ flex: 1 }} />}
    <Pressable onPress={onNext} style={[styles.navNextBtn, { backgroundColor: color }]}>
      <Text style={styles.navNextText}>{nextLabel || 'Next'}</Text>
      <Ionicons name="chevron-forward" size={20} color="#000" />
    </Pressable>
  </View>
);

const GENDER_OPTIONS: TileOption[] = [
  { label: 'Male', value: 'Male', icon: 'male' },
  { label: 'Female', value: 'Female', icon: 'female' },
  { label: 'Not Specified', value: 'Prefer not to say', icon: 'person' },
];
const ACTIVITY_OPTIONS: TileOption[] = [
  { label: 'Sedentary', value: 'Sedentary', icon: 'bed-outline' },
  { label: 'Light', value: 'Light', icon: 'walk-outline' },
  { label: 'Moderate', value: 'Moderate', icon: 'bicycle-outline' },
  { label: 'Very Active', value: 'Very Active', icon: 'fitness-outline' },
];
const EXPERIENCE_OPTIONS: TileOption[] = [
  { label: 'Beginner', value: 'Beginner', icon: 'leaf-outline' },
  { label: 'Intermediate', value: 'Intermediate', icon: 'trending-up-outline' },
  { label: 'Advanced', value: 'Advanced', icon: 'trophy-outline' },
];
const SLEEP_OPTIONS: TileOption[] = [
  { label: 'Poor', value: 'Poor', icon: 'cloud-outline' },
  { label: 'Fair', value: 'Fair', icon: 'partly-sunny-outline' },
  { label: 'Good', value: 'Good', icon: 'sunny-outline' },
];
const STRESS_OPTIONS: TileOption[] = [
  { label: 'Low', value: 'Low', icon: 'happy-outline' },
  { label: 'Medium', value: 'Medium', icon: 'remove-circle-outline' },
  { label: 'High', value: 'High', icon: 'thunderstorm-outline' },
];
const SCREEN_TIME_OPTIONS: TileOption[] = [
  { label: 'Under 2h', value: 'Under 2h', icon: 'phone-portrait-outline' },
  { label: '2-4h', value: '2-4h', icon: 'phone-portrait-outline' },
  { label: '4-6h', value: '4-6h', icon: 'phone-portrait-outline' },
  { label: '6-8h', value: '6-8h', icon: 'phone-portrait-outline' },
  { label: '8h+', value: '8h+', icon: 'phone-portrait-outline' },
];

const AVATAR_ITEM_WIDTH = 90;

export const OnboardingScreen = () => {
  const {
    setCognitiveGoal, setPhysicalGoal, setDietaryPreference, setPhysicalMetrics, completeOnboarding,
    setGender, setCycleDay, setAge, setActivityLevel, setWorkoutExperience, setSleepQuality, setStressLevel,
    setScreenTimeLevel, setAvatarId,
  } = useAppStore();
  const { colors } = useThemeColors();

  const [step, setStep] = useState<StepKey>('cognitive');
  const [shake, setShake] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const [localCogGoal, setLocalCogGoal] = useState('');
  const [localPhysGoal, setLocalPhysGoal] = useState('');
  const [localIsVeg, setLocalIsVeg] = useState<boolean | null>(null);
  const [localGender, setLocalGender] = useState<Gender | ''>('');
  const [localCycleDay, setLocalCycleDay] = useState(14);
  const [localAge, setLocalAge] = useState(25);
  const [localActivity, setLocalActivity] = useState<ActivityLevel | ''>('');
  const [localExperience, setLocalExperience] = useState<WorkoutExperience | ''>('');
  const [localSleep, setLocalSleep] = useState<SleepQuality | ''>('');
  const [localStress, setLocalStress] = useState<StressLevel | ''>('');
  const [localScreenTime, setLocalScreenTime] = useState<ScreenTimeLevel | ''>('');
  const [localAvatarId, setLocalAvatarId] = useState('avatar_1');

  const [weightKg, setWeightKg] = useState(70);
  const [heightCm, setHeightCm] = useState(175);

  const answers: Answers = {
    cogGoal: localCogGoal, physGoal: localPhysGoal, isVeg: localIsVeg, gender: localGender,
    activity: localActivity, experience: localExperience, sleep: localSleep, screenTime: localScreenTime, stress: localStress,
  };

  const seq = visibleSteps(localGender);
  const stepIndex = seq.indexOf(step);
  const stepColor = getStepColor(step, colors);

  const goNext = () => {
    if (!isAnswered(step, answers)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStep(getAdjacentStep(step, localGender, 1));
  };
  const goPrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStep(getAdjacentStep(step, localGender, -1));
  };
  const selectTile = (setter: () => void) => {
    Haptics.selectionAsync().catch(() => {});
    setter();
  };

  const handleCalculate = () => {
    setCognitiveGoal(localCogGoal);
    setPhysicalGoal(localPhysGoal);
    setDietaryPreference(!!localIsVeg);
    setGender((localGender || 'Prefer not to say') as Gender);
    if (localGender === 'Female') setCycleDay(localCycleDay);
    setAge(localAge);
    setActivityLevel((localActivity || 'Moderate') as ActivityLevel);
    setWorkoutExperience((localExperience || 'Intermediate') as WorkoutExperience);
    setSleepQuality((localSleep || 'Fair') as SleepQuality);
    setStressLevel((localStress || 'Medium') as StressLevel);
    setScreenTimeLevel((localScreenTime || '4-6h') as ScreenTimeLevel);
    setPhysicalMetrics(weightKg, heightCm);
    setAvatarId(localAvatarId);
    setStep('synthesizing');
  };

  useEffect(() => {
    if (step === 'synthesizing') {
      const timer = setTimeout(() => completeOnboarding(), 2500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const isFirstStep = stepIndex === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background[0] }]}>
      <GlobalBackground />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { transform: [{ translateX: shakeAnim }] }]}>
          {step !== 'synthesizing' && <StepProgress index={stepIndex} total={seq.length - 1} color={stepColor} colors={colors} />}
          <Text style={[styles.title, { color: colors.textSecondary }]}>Welcome to</Text>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>NEURO-DIET</Text>

          <FadeInView isVisible={step === 'cognitive'}>
            <Text style={[styles.question, { color: colors.textPrimary }]}>Choose your Mental Path</Text>
            <View style={styles.grid}>
              <GradientTile title="Enhance Focus" icon="flash" selected={localCogGoal === 'Enhance Focus'} color={stepColor} colors={colors} onPress={() => selectTile(() => setLocalCogGoal('Enhance Focus'))} />
              <GradientTile title="Stress Reduction" icon="leaf" selected={localCogGoal === 'Stress Reduction'} color={stepColor} colors={colors} onPress={() => selectTile(() => setLocalCogGoal('Stress Reduction'))} />
            </View>
          </FadeInView>

          <FadeInView isVisible={step === 'physical'}>
            <Text style={[styles.question, { color: colors.textPrimary }]}>Choose your Physical Path</Text>
            <View style={styles.grid}>
              <GradientTile title="Muscle Gain" icon="barbell" selected={localPhysGoal === 'Muscle Gain'} color={stepColor} colors={colors} onPress={() => selectTile(() => setLocalPhysGoal('Muscle Gain'))} />
              <GradientTile title="Stamina & Endurance" icon="speedometer" selected={localPhysGoal === 'Stamina/Endurance'} color={stepColor} colors={colors} onPress={() => selectTile(() => setLocalPhysGoal('Stamina/Endurance'))} />
              <GradientTile title="Fat Loss" icon="flame" selected={localPhysGoal === 'Fat Loss'} color={stepColor} colors={colors} onPress={() => selectTile(() => setLocalPhysGoal('Fat Loss'))} />
            </View>
          </FadeInView>

          <FadeInView isVisible={step === 'diet'}>
            <GlassCard inverted={true} style={[styles.card, { borderTopWidth: 4, borderTopColor: stepColor }]}>
              <Text style={[styles.question, { color: colors.invertedTextPrimary }]}>Dietary Preference</Text>
              <Text style={[styles.subtitle, { color: colors.invertedTextSecondary }]}>Every meal we recommend will respect this.</Text>
              <View style={styles.dietGrid}>
                <DietTile title="Vegetarian" emoji="🥦" selected={localIsVeg === true} color={stepColor} colors={colors} onPress={() => selectTile(() => setLocalIsVeg(true))} />
                <DietTile title="Non-Vegetarian" emoji="🍗" selected={localIsVeg === false} color={stepColor} colors={colors} onPress={() => selectTile(() => setLocalIsVeg(false))} />
              </View>
            </GlassCard>
          </FadeInView>

          <FadeInView isVisible={step === 'gender'}>
            <QuestionStep
              question="Which best describes you?"
              subtitle="Helps us calibrate exercise intensity and, for female users, cycle-aware recommendations."
              options={GENDER_OPTIONS}
              value={localGender}
              onChange={(v: string) => selectTile(() => setLocalGender(v as Gender))}
              color={stepColor}
              colors={colors}
            />
          </FadeInView>

          <FadeInView isVisible={step === 'cycleDay'}>
            <GlassCard inverted={true} style={[styles.card, { borderTopWidth: 4, borderTopColor: stepColor }]}>
              <Text style={[styles.question, { color: colors.invertedTextPrimary }]}>Cycle Day</Text>
              <Text style={[styles.subtitle, { color: colors.invertedTextSecondary }]}>
                Mood and energy shift across the cycle - this lets us favor gentler exercises and calmer meals during the luteal/menstrual phases.
              </Text>
              <View style={styles.counterBlock}>
                <Text style={[styles.nsLabel, { color: colors.invertedTextSecondary }]}>DAY OF CYCLE</Text>
                <Counter value={localCycleDay} onChange={setLocalCycleDay} min={1} max={35} places={[10, 1]} fontSize={64} padding={5} gap={4} textColor={stepColor} fontWeight={900} />
              </View>
            </GlassCard>
          </FadeInView>

          <FadeInView isVisible={step === 'age'}>
            <GlassCard inverted={true} style={[styles.card, { borderTopWidth: 4, borderTopColor: stepColor }]}>
              <Text style={[styles.question, { color: colors.invertedTextPrimary }]}>Your Age</Text>
              <View style={styles.counterBlock}>
                <Text style={[styles.nsLabel, { color: colors.invertedTextSecondary }]}>YEARS</Text>
                <Counter value={localAge} onChange={setLocalAge} min={10} max={100} places={[10, 1]} fontSize={64} padding={5} gap={4} textColor={stepColor} fontWeight={900} />
              </View>
            </GlassCard>
          </FadeInView>

          <FadeInView isVisible={step === 'activity'}>
            <QuestionStep question="Daily Activity Level" options={ACTIVITY_OPTIONS} value={localActivity}
              onChange={(v: string) => selectTile(() => setLocalActivity(v as ActivityLevel))} color={stepColor} colors={colors} />
          </FadeInView>

          <FadeInView isVisible={step === 'experience'}>
            <QuestionStep question="Workout Experience" options={EXPERIENCE_OPTIONS} value={localExperience}
              onChange={(v: string) => selectTile(() => setLocalExperience(v as WorkoutExperience))} color={stepColor} colors={colors} />
          </FadeInView>

          <FadeInView isVisible={step === 'sleep'}>
            <QuestionStep question="Sleep Quality" options={SLEEP_OPTIONS} value={localSleep}
              onChange={(v: string) => selectTile(() => setLocalSleep(v as SleepQuality))} color={stepColor} colors={colors} />
          </FadeInView>

          <FadeInView isVisible={step === 'stress'}>
            <QuestionStep question="Everyday Stress Level" options={STRESS_OPTIONS} value={localStress}
              onChange={(v: string) => selectTile(() => setLocalStress(v as StressLevel))} color={stepColor} colors={colors} />
          </FadeInView>

          <FadeInView isVisible={step === 'screenTime'}>
            <QuestionStep
              question="Daily Screen Time"
              subtitle="Screen time is one of the strongest, best-studied levers on stress, sleep, and focus - your plan will factor this in with research-backed tips."
              options={SCREEN_TIME_OPTIONS}
              value={localScreenTime}
              onChange={(v: string) => selectTile(() => setLocalScreenTime(v as ScreenTimeLevel))}
              color={stepColor}
              colors={colors}
            />
          </FadeInView>

          <FadeInView isVisible={step === 'baseline'}>
            <GlassCard inverted={true} style={[styles.card, { borderTopWidth: 4, borderTopColor: stepColor }]}>
              <Text style={[styles.question, { color: colors.invertedTextPrimary }]}>Physical Baseline</Text>
              <Text style={[styles.subtitle, { color: colors.invertedTextSecondary }]}>We need this to calculate your exact meal and exercise targets.</Text>

              <View style={styles.counterBlock}>
                <Text style={[styles.nsLabel, { color: colors.invertedTextSecondary }]}>WEIGHT (KG)</Text>
                <Counter value={weightKg} onChange={setWeightKg} min={30} max={250} places={[100, 10, 1]} fontSize={64} padding={5} gap={4} textColor={stepColor} fontWeight={900} />
              </View>

              <View style={styles.counterBlock}>
                <Text style={[styles.nsLabel, { color: colors.invertedTextSecondary }]}>HEIGHT (CM)</Text>
                <Counter value={heightCm} onChange={setHeightCm} min={100} max={250} places={[100, 10, 1]} fontSize={64} padding={5} gap={4} textColor={stepColor} fontWeight={900} />
              </View>
            </GlassCard>
          </FadeInView>

          <FadeInView isVisible={step === 'avatar'}>
            <GlassCard inverted={true} style={[styles.card, { borderTopWidth: 4, borderTopColor: stepColor }]}>
              <Text style={[styles.question, { color: colors.invertedTextPrimary }]}>Choose Your Avatar</Text>
              <Text style={[styles.subtitle, { color: colors.invertedTextSecondary, marginBottom: 16 }]}>Swipe to browse, tap to select.</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={AVATAR_ITEM_WIDTH}
                decelerationRate="fast"
                onMomentumScrollEnd={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})}
                contentContainerStyle={{ paddingHorizontal: 10, alignItems: 'center' }}
              >
                {AVATARS.map((avatar) => (
                  <Pressable
                    key={avatar.id}
                    onPress={() => selectTile(() => setLocalAvatarId(avatar.id))}
                    style={{
                      width: 70, height: 70, borderRadius: 35, marginHorizontal: 10,
                      borderWidth: localAvatarId === avatar.id ? 3 : 0, borderColor: stepColor, overflow: 'hidden',
                    }}
                  >
                    <Image source={avatar.image} style={{ width: '100%', height: '100%' }} />
                  </Pressable>
                ))}
              </ScrollView>
            </GlassCard>
          </FadeInView>

          <FadeInView isVisible={step === 'synthesizing'}>
            <GlassCard style={[styles.card, { alignItems: 'center' }]}>
              <Text style={[styles.question, { color: colors.primary, fontSize: 24 }]}>Synthesizing...</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: 12 }]}>
                Merging physical and cognitive nutrition profiles.
              </Text>
            </GlassCard>
          </FadeInView>

          {step !== 'synthesizing' && (
            <NavFooter
              showPrev={!isFirstStep}
              onPrev={goPrev}
              onNext={step === 'avatar' ? handleCalculate : goNext}
              nextLabel={step === 'avatar' ? 'Finish Setup' : 'Next'}
              color={stepColor}
            />
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, padding: spacing.md, zIndex: 1, paddingTop: 40 },
  progressTrack: { height: 4, borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  title: { fontSize: 16, textAlign: 'center', letterSpacing: 4, textTransform: 'uppercase', fontWeight: '800' },
  brandTitle: { fontSize: 42, fontWeight: '900', marginBottom: spacing.xl, textAlign: 'center', letterSpacing: 2 },
  subtitle: { fontSize: 14, marginBottom: spacing.xl, textAlign: 'center' },
  card: { padding: spacing.lg, borderRadius: 24 },
  question: { fontSize: 24, fontWeight: '900', marginBottom: spacing.lg, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  tileContainer: { width: '45%', height: 160, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  tileGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 8 },
  tileTitle: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', paddingHorizontal: 8 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },

  dietGrid: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  dietTile: { flex: 1, alignItems: 'center', padding: 24, borderRadius: 16, borderWidth: 2 },
  dietEmoji: { fontSize: 40, marginBottom: 12 },
  dietTitle: { fontWeight: '800', fontSize: 14, textTransform: 'uppercase' },

  counterBlock: { marginBottom: 24, alignItems: 'center' },
  nsLabel: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },

  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, paddingBottom: 8 },
  navBackBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 16 },
  navBackText: { fontWeight: '800', fontSize: 15, textTransform: 'uppercase' },
  navNextBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16, borderRadius: radii.md },
  navNextText: { color: '#000', fontWeight: '900', fontSize: 16, textTransform: 'uppercase' },
});
