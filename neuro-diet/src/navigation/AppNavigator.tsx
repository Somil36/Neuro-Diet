import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { TabNavigator } from './TabNavigator';
import { AuthScreen } from '../screens/AuthScreen';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';

const Stack = createNativeStackNavigator();

// Auth/onboarding gating is done by conditionally rendering which screen
// exists in the Navigator, not via `initialRouteName` - that prop is only
// read once at first mount, so it never reacts to `currentUser` or
// `hasCompletedOnboarding` changing later (login, register, finishing
// onboarding, logout, restart-onboarding all used to silently do nothing
// as a result). Swapping which <Stack.Screen> is present is the officially
// documented React Navigation pattern for auth flows and reacts immediately.
export const AppNavigator = () => {
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const currentUser = useAuthStore((state) => state.currentUser);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!currentUser ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="MainApp" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
