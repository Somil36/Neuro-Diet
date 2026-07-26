import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../theme/theme';

export type Gender = 'Male' | 'Female' | 'Prefer not to say';
export type ActivityLevel = 'Sedentary' | 'Light' | 'Moderate' | 'Very Active';
export type WorkoutExperience = 'Beginner' | 'Intermediate' | 'Advanced';
export type SleepQuality = 'Poor' | 'Fair' | 'Good';
export type StressLevel = 'Low' | 'Medium' | 'High';
export type ScreenTimeLevel = 'Under 2h' | '2-4h' | '4-6h' | '6-8h' | '8h+';

export interface Completion {
  date: string; // YYYY-MM-DD
  exerciseId: number;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Everything in here belongs to one specific account, not the device -
// swapped in/out of the live AppState below whenever the active user
// changes (register/login/logout), so one account's onboarding answers,
// goals, and history never bleed into another's. `themeMode` is
// deliberately excluded - that's a device preference, not a per-account one.
export type UnitsPreference = 'metric' | 'imperial';

export interface ProfileSnapshot {
  hasCompletedOnboarding: boolean;
  cognitiveGoal: string;
  physicalGoal: string;
  isVegetarian: boolean;
  weight: number;
  height: number;
  bmi: number;
  gender: Gender;
  cycleDay: number | null;
  age: number;
  activityLevel: ActivityLevel;
  workoutExperience: WorkoutExperience;
  sleepQuality: SleepQuality;
  stressLevel: StressLevel;
  screenTimeLevel: ScreenTimeLevel;
  favoriteMealIds: string[];
  favoriteExerciseIds: number[];
  completions: Completion[];
  avatarId: string;
  notifications: Notification[];
  lastReminderCheckDate: string | null;

  // Profile-screen-only additions
  bio: string;
  notificationsEnabled: boolean;
  unitsPreference: UnitsPreference;
  joinedAt: string | null; // ISO date, stamped once at registration
}

const DEFAULT_PROFILE: ProfileSnapshot = {
  hasCompletedOnboarding: false,
  cognitiveGoal: '',
  physicalGoal: '',
  isVegetarian: false,
  weight: 0,
  height: 0,
  bmi: 0,
  gender: 'Prefer not to say',
  cycleDay: null,
  age: 25,
  activityLevel: 'Moderate',
  workoutExperience: 'Intermediate',
  sleepQuality: 'Fair',
  stressLevel: 'Medium',
  screenTimeLevel: '4-6h',
  favoriteMealIds: [],
  favoriteExerciseIds: [],
  completions: [],
  avatarId: 'avatar_1',
  notifications: [],
  lastReminderCheckDate: null,
  bio: '',
  notificationsEnabled: true,
  unitsPreference: 'metric',
  joinedAt: null,
};

interface AppState extends ProfileSnapshot {
  themeMode: 'light' | 'dark';

  // Keyed by username - the saved snapshot for every account that has ever
  // logged out on this device.
  profiles: Record<string, ProfileSnapshot>;

  setCognitiveGoal: (goal: string) => void;
  setPhysicalGoal: (goal: string) => void;
  setDietaryPreference: (isVegetarian: boolean) => void;
  setPhysicalMetrics: (weight: number, height: number) => void;
  setGender: (gender: Gender) => void;
  setCycleDay: (day: number) => void;
  setAge: (age: number) => void;
  setActivityLevel: (level: ActivityLevel) => void;
  setWorkoutExperience: (level: WorkoutExperience) => void;
  setSleepQuality: (quality: SleepQuality) => void;
  setStressLevel: (level: StressLevel) => void;
  setScreenTimeLevel: (level: ScreenTimeLevel) => void;
  toggleFavoriteMeal: (id: string) => void;
  toggleFavoriteExercise: (id: number) => void;
  logCompletion: (exerciseId: number) => void;
  undoCompletion: (exerciseId: number) => void;
  completeOnboarding: () => void;
  toggleTheme: () => void;
  resetOnboarding: () => void;
  setAvatarId: (id: string) => void;
  addNotification: (message: string) => void;
  markNotificationsRead: () => void;
  setLastReminderCheckDate: (date: string) => void;

  setBio: (bio: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setUnitsPreference: (pref: UnitsPreference) => void;

  // Called from useAuthStore around login/register/logout - not meant to be
  // called directly from screens.
  loadProfileFor: (username: string) => void;
  saveProfileSnapshot: (username: string) => void;
}

export const useAppStore = create<AppState>()(persist((set, get) => ({
  ...DEFAULT_PROFILE,
  themeMode: 'light', // Default to Light mode (premium look)
  profiles: {},

  setCognitiveGoal: (goal) => set({ cognitiveGoal: goal }),
  setPhysicalGoal: (goal) => set({ physicalGoal: goal }),
  setDietaryPreference: (isVegetarian) => set({ isVegetarian }),
  setPhysicalMetrics: (weight, height) => {
    // Calculate BMI: weight(kg) / height(m)^2
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    set({ weight, height, bmi: parseFloat(bmi.toFixed(1)) });
  },
  setGender: (gender) => set({ gender }),
  setCycleDay: (cycleDay) => set({ cycleDay }),
  setAge: (age) => set({ age }),
  setActivityLevel: (activityLevel) => set({ activityLevel }),
  setWorkoutExperience: (workoutExperience) => set({ workoutExperience }),
  setSleepQuality: (sleepQuality) => set({ sleepQuality }),
  setStressLevel: (stressLevel) => set({ stressLevel }),
  setScreenTimeLevel: (screenTimeLevel) => set({ screenTimeLevel }),

  toggleFavoriteMeal: (id) => set((state) => ({
    favoriteMealIds: state.favoriteMealIds.includes(id)
      ? state.favoriteMealIds.filter(m => m !== id)
      : [...state.favoriteMealIds, id],
  })),
  toggleFavoriteExercise: (id) => set((state) => ({
    favoriteExerciseIds: state.favoriteExerciseIds.includes(id)
      ? state.favoriteExerciseIds.filter(e => e !== id)
      : [...state.favoriteExerciseIds, id],
  })),
  logCompletion: (exerciseId) => set((state) => {
    const date = new Date().toISOString().slice(0, 10);
    if (state.completions.some(c => c.date === date && c.exerciseId === exerciseId)) return state;
    return { completions: [...state.completions, { date, exerciseId }] };
  }),
  undoCompletion: (exerciseId) => set((state) => {
    const date = new Date().toISOString().slice(0, 10);
    return { completions: state.completions.filter(c => !(c.date === date && c.exerciseId === exerciseId)) };
  }),

  completeOnboarding: () => set({ hasCompletedOnboarding: true }),
  toggleTheme: () => set((state) => ({ themeMode: state.themeMode === 'light' ? 'dark' : 'light' })),
  resetOnboarding: () => set({ hasCompletedOnboarding: false }),
  setAvatarId: (avatarId) => set({ avatarId }),
  addNotification: (message) => set((state) => {
    // Profile's "Notification Preferences" toggle mutes reminders at the
    // source, so every existing call site (Dashboard's reminder effect)
    // doesn't need to know or check it individually.
    if (!state.notificationsEnabled) return state;
    return {
      notifications: [{ id: Date.now().toString(), message, read: false, createdAt: new Date().toISOString() }, ...state.notifications]
    };
  }),
  markNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),
  setLastReminderCheckDate: (lastReminderCheckDate) => set({ lastReminderCheckDate }),

  setBio: (bio) => set({ bio }),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
  setUnitsPreference: (unitsPreference) => set({ unitsPreference }),

  // Merged over DEFAULT_PROFILE (rather than replacing state outright) so a
  // snapshot saved before a new ProfileSnapshot field existed still backfills
  // that field with its default instead of leaving it `undefined`.
  loadProfileFor: (username) => set({ ...DEFAULT_PROFILE, ...(get().profiles[username] || {}) }),
  saveProfileSnapshot: (username) => set((state) => ({
    profiles: {
      ...state.profiles,
      [username]: {
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        cognitiveGoal: state.cognitiveGoal,
        physicalGoal: state.physicalGoal,
        isVegetarian: state.isVegetarian,
        weight: state.weight,
        height: state.height,
        bmi: state.bmi,
        gender: state.gender,
        cycleDay: state.cycleDay,
        age: state.age,
        activityLevel: state.activityLevel,
        workoutExperience: state.workoutExperience,
        sleepQuality: state.sleepQuality,
        stressLevel: state.stressLevel,
        screenTimeLevel: state.screenTimeLevel,
        favoriteMealIds: state.favoriteMealIds,
        favoriteExerciseIds: state.favoriteExerciseIds,
        completions: state.completions,
        avatarId: state.avatarId,
        notifications: state.notifications,
        lastReminderCheckDate: state.lastReminderCheckDate,
        bio: state.bio,
        notificationsEnabled: state.notificationsEnabled,
        unitsPreference: state.unitsPreference,
        joinedAt: state.joinedAt,
      },
    },
  })),
}), {
  name: 'app-storage',
  storage: createJSONStorage(() => AsyncStorage),
}));

// Shared across nearly every screen/component - avoids each one re-deriving
// `isDark`/`colors` from themeMode individually.
export const useThemeColors = () => {
  const themeMode = useAppStore(state => state.themeMode);
  const isDark = themeMode === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark, themeMode };
};

// Consecutive-day streak (today or yesterday must have at least one
// completion, otherwise the streak is considered broken) - derived on read
// rather than stored, so it can never drift out of sync with `completions`.
export const getStreakDays = (completions: Completion[]): number => {
  const days = new Set(completions.map(c => c.date));
  let streak = 0;
  const cursor = new Date();
  const todayStr = cursor.toISOString().slice(0, 10);
  if (!days.has(todayStr)) cursor.setDate(cursor.getDate() - 1); // allow "yesterday" as still-alive
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};
