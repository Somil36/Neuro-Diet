import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import * as Font from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PortalHost } from '@rn-primitives/portal';
import { lightColors, darkColors } from './src/theme/theme';
import { useAppStore } from './src/store/useAppStore';
import { ToastHost } from './src/components/ToastHost';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
          <Text style={{ color: '#FF6B6B', fontWeight: '900', fontSize: 18, marginBottom: 12 }}>App crashed</Text>
          <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 12 }}>{String(this.state.error.message)}</Text>
          <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{String(this.state.error.stack)}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const colors = useAppStore(state => state.themeMode === 'dark' ? darkColors : lightColors);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync(Ionicons.font);
      } catch (e) {
        console.warn(e);
      } finally {
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // The scroll-lock behind our Radix-based dialogs (AlertDialog, Toast)
    // compensates for the hidden scrollbar with a `margin-right` on <body>,
    // computed as `window.innerWidth - document.documentElement.clientWidth`.
    // In narrow/emulated viewports (e.g. Chrome DevTools device mode) that
    // difference isn't a real scrollbar width - it can be 80-100px, which
    // crushes the whole page into a sliver the instant any dialog opens.
    // An inline `!important` override here permanently wins over that
    // stylesheet rule for this element, so pin it to 0 up front.
    document.body.style.setProperty('margin-right', '0px', 'important');
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background[0], justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.textPrimary }}>Powering up...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AppNavigator />
      <ToastHost />
      <PortalHost />
    </ErrorBoundary>
  );
}
