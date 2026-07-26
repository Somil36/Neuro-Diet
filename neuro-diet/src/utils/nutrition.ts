// Grounds the app's calorie/macro targets in real formulas instead of the
// old flat weight-ratio guess, using standard, widely-used equations rather
// than anything app-specific.

export type Gender = 'Male' | 'Female' | 'Prefer not to say';
export type ActivityLevel = 'Sedentary' | 'Light' | 'Moderate' | 'Very Active';

// Activity multipliers for TDEE (standard values used across nutrition apps/literature)
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  Sedentary: 1.2,
  Light: 1.375,
  Moderate: 1.55,
  'Very Active': 1.725,
};

const GOAL_CALORIE_ADJUSTMENT: Record<string, number> = {
  'Fat Loss': -500,
  'Muscle Gain': 300,
  'Stamina/Endurance': 100,
};

const GOAL_MACRO_SPLIT: Record<string, { protein: number; carbs: number; fats: number }> = {
  'Muscle Gain': { protein: 0.30, carbs: 0.45, fats: 0.25 },
  'Fat Loss': { protein: 0.35, carbs: 0.35, fats: 0.30 },
  'Stamina/Endurance': { protein: 0.20, carbs: 0.55, fats: 0.25 },
};

export interface DailyTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
}

interface DailyTargetsInput {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  physicalGoal: string;
}

// Mifflin-St Jeor equation (BMR) -> TDEE via activity multiplier -> goal
// adjustment -> goal-specific macro split. "Prefer not to say" uses the
// midpoint of the male/female constants as a neutral default.
export function computeDailyTargets({ weightKg, heightCm, age, gender, activityLevel, physicalGoal }: DailyTargetsInput): DailyTargets {
  const genderConstant = gender === 'Male' ? 5 : gender === 'Female' ? -161 : -78;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + genderConstant;

  const tdee = bmr * (ACTIVITY_MULTIPLIERS[activityLevel] ?? ACTIVITY_MULTIPLIERS.Moderate);
  const calories = Math.round(tdee + (GOAL_CALORIE_ADJUSTMENT[physicalGoal] ?? 0));
  const split = GOAL_MACRO_SPLIT[physicalGoal] ?? GOAL_MACRO_SPLIT['Stamina/Endurance'];

  return {
    calories,
    protein_g: Math.round((calories * split.protein) / 4),
    carbs_g: Math.round((calories * split.carbs) / 4),
    fats_g: Math.round((calories * split.fats) / 9),
  };
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

// Simplified standard 28-day cycle model (the same coarse phase windows used
// by mainstream cycle-tracking apps for a self-reported cycle day).
export function getCyclePhase(cycleDay: number): CyclePhase {
  if (cycleDay <= 5) return 'menstrual';
  if (cycleDay <= 13) return 'follicular';
  if (cycleDay <= 16) return 'ovulatory';
  return 'luteal';
}
