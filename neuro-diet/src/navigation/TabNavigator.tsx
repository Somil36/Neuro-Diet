import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../store/useAppStore';

import { DashboardScreen } from '../screens/DashboardScreen';
import { MealPlansScreen } from '../screens/MealPlansScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { ExercisesScreen } from '../screens/ExercisesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CustomTabBarButton } from '../components/CustomTabBarButton';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const { colors } = useThemeColors();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 90,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tab.Screen name="Plans" component={MealPlansScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="restaurant" size={24} color={color} /> }} />
      <Tab.Screen name="Scanner" component={CameraScreen} options={{ tabBarLabel: '', tabBarIcon: () => <Ionicons name="scan-outline" size={32} color="#FFFFFF" />, tabBarButton: (props) => <CustomTabBarButton {...props} /> }} />
      <Tab.Screen name="Exercises" component={ExercisesScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="barbell" size={24} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} /> }} />
    </Tab.Navigator>
  );
};
