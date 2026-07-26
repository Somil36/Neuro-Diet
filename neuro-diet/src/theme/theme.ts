import { StyleSheet } from 'react-native';

export const lightColors = {
  background: ['#F5F6F8', '#F5F6F8', '#F5F6F8'], // Soft premium off-white
  surface: '#FFFFFF',
  invertedSurface: '#0A0A0A',
  surfaceBorder: 'rgba(0, 0, 0, 0.06)',
  primary: '#00D96A', // Refined mint green
  secondary: '#0A0A0A',
  textPrimary: '#0A0A0A',
  textSecondary: '#6B7280',
  invertedTextPrimary: '#FFFFFF',
  invertedTextSecondary: '#9CA3AF',
  success: '#00D96A',
  error: '#FF5A5F',
  border: 'rgba(0, 0, 0, 0.06)',

  // Secondary accents (kept distinct per-macro/status, centrally controlled)
  accentCyan: '#0EA5E9',
  accentPurple: '#8B5CF6',

  // Context-Aware Goal Colors
  energy: '#00D96A',
  focus: '#00D96A',
  recovery: '#0A0A0A',
  calm: '#0A0A0A',
};

export const darkColors = {
  background: ['#0A0A0A', '#0A0A0A', '#0A0A0A'],
  surface: '#18181B',
  invertedSurface: '#FFFFFF',
  surfaceBorder: 'rgba(255, 255, 255, 0.06)',
  primary: '#00D96A',
  secondary: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  invertedTextPrimary: '#0A0A0A',
  invertedTextSecondary: '#6B7280',
  success: '#00D96A',
  error: '#FF6B6B',
  border: 'rgba(255, 255, 255, 0.08)',

  accentCyan: '#22D3EE',
  accentPurple: '#A78BFA',

  energy: '#00D96A',
  focus: '#00D96A',
  recovery: '#FFFFFF',
  calm: '#FFFFFF',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const borderRadius = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 28, round: 9999 };

// Helper to get semantic color based on goal
export const getGoalColor = (goal: string, isDark: boolean) => {
  const c = isDark ? darkColors : lightColors;
  const g = goal.toLowerCase();
  if (g.includes('focus') || g.includes('energy')) return c.energy;
  return c.recovery;
};

// Dashboard and MealPlans both define this exact same header style verbatim -
// centralized here rather than duplicated (their subtitle styles differ in
// real ways - weight/letter-spacing - so those stay local per-screen).
export const commonStyles = StyleSheet.create({
  screenTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
});
