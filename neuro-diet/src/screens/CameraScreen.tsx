import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { useAppStore, useThemeColors } from '../store/useAppStore';
import { GlobalBackground } from '../components/GlobalBackground';

export const CameraScreen = () => {
  const { colors } = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background[0] }]}>
      <GlobalBackground />
      <SafeAreaView style={styles.safeArea}>

        <View style={styles.scannerBox}>
          <Ionicons name="scan" size={250} color={`${colors.accentCyan}4D`} />
          <View style={[styles.scanLine, { backgroundColor: colors.primary, shadowColor: colors.primary }]} />
        </View>

        <GlassCard style={styles.analysisCard}>
          <Text style={[styles.statusText, { color: colors.primary }]}>AI Vision Active...</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Point your camera at a meal. The engine will query FooDB to identify neuro-active compounds (L-Theanine, Flavonoids) and cross-reference USDA for macros.
          </Text>
        </GlassCard>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scannerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40, position: 'relative' },
  scanLine: { position: 'absolute', width: '80%', height: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  analysisCard: { margin: spacing.lg, padding: spacing.xl, alignItems: 'center' },
  statusText: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  description: { textAlign: 'center', lineHeight: 22, fontWeight: '500' }
});
