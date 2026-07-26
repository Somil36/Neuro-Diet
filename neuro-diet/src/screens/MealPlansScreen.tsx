import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Animated, Easing, PanResponder, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ToggleGroupPrimitive from '@rn-primitives/toggle-group';
import { spacing, getGoalColor, commonStyles } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { GlobalBackground } from '../components/GlobalBackground';
import { useAppStore, useThemeColors } from '../store/useAppStore';
import { showToast } from '../store/useToastStore';

import { Skeleton } from '../components/Skeleton';

const FILTER_OPTIONS = [{ label: 'All', value: 'all' }, { label: 'Favorites', value: 'favorites' }];
const DOUBLE_TAP_MS = 300;

const API_URL = "http://127.0.0.1:8090/api/v1/protocol";

const SkeletonLoader = ({ isDark }: { isDark: boolean }) => {
  return (
    <View style={{ marginTop: 24, gap: 16 }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Skeleton style={{ height: 60, width: 60, borderRadius: 30 }} inverted={!isDark} />
          <View style={{ gap: 8 }}>
            <Skeleton style={{ height: 16, width: 250 }} inverted={!isDark} />
            <Skeleton style={{ height: 16, width: 200 }} inverted={!isDark} />
          </View>
        </View>
      ))}
    </View>
  );
};

const MacroBar = ({ label, current, total, color, bg }: { label: string, current: number, total: number, color: string, bg: string }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const percentage = Math.min((current / total) * 100, 100);

  useEffect(() => {
    Animated.timing(widthAnim, { toValue: percentage, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [percentage]);

  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: '#aaa', fontSize: 10 }}>{current}g</Text>
      </View>
      <View style={{ height: 6, backgroundColor: bg, borderRadius: 3, overflow: 'hidden' }}>
        <Animated.View style={{ height: '100%', backgroundColor: color, borderRadius: 3, width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }} />
      </View>
    </View>
  );
}

// Gamification Feature: 3D Flip Card
const FlipCard = ({ food, colors, semanticColor, isMeal, isFavorite, onToggleFavorite, entranceDelay }: any) => {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);

  const basePortion = food.portion_g || 150;
  const [portion, setPortion] = useState(basePortion);
  const portionScale = portion / basePortion;

  useEffect(() => {
    Animated.timing(entranceAnim, { toValue: 1, duration: 400, delay: entranceDelay || 0, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  // The back panel uses semanticColor as its background, which is either the
  // bright green "energy" accent or the theme's own inverted-surface tone
  // (see getGoalColor/theme.ts) - so the readable text color flips accordingly
  // rather than being hardcoded, which would go invisible (black-on-black)
  // whenever semanticColor resolves to the light theme's near-black "recovery" tone.
  const backTextColor = semanticColor === colors.energy ? '#000' : colors.invertedTextPrimary;

  const flipCard = () => {
    Haptics.selectionAsync().catch(() => {});
    Animated.spring(flipAnim, {
      toValue: flipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true
    }).start(() => setFlipped(!flipped));
  };

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onToggleFavorite();
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.5, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true })
    ]).start();
  };

  // Double-tap anywhere on the front face favorites it too, in addition to the heart.
  const handleCardTap = () => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      handleFavorite();
    }
    lastTap.current = now;
  };

  const adjustPortion = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    setPortion((p: number) => Math.max(20, p + delta));
  };

  const frontInterpolate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backInterpolate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

  const frontOpacity = flipAnim.interpolate({ inputRange: [89, 90], outputRange: [1, 0] });
  const backOpacity = flipAnim.interpolate({ inputRange: [89, 90], outputRange: [0, 1] });

  return (
    <Animated.View style={{ marginBottom: spacing.lg, opacity: entranceAnim, transform: [{ translateY: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
      {/* FRONT OF CARD */}
      <Animated.View
        pointerEvents={flipped ? 'none' : 'auto'}
        style={[styles.dayCard, { transform: [{ rotateY: frontInterpolate }], opacity: frontOpacity, backgroundColor: colors.surfaceBorder, borderColor: semanticColor, borderWidth: 1 }]}
      >
        <Pressable onPress={handleCardTap} style={StyleSheet.absoluteFill} />
        <View style={styles.mealRow}>
          <Text style={[styles.dayTitle, { color: semanticColor, flex: 1 }]}>
            {isMeal ? 'Synthesized Meal' : 'Raw Bio-Hack'} 🧬
          </Text>
          <Pressable onPress={handleFavorite}>
             <Animated.Text style={{ fontSize: 20, transform: [{ scale: scaleAnim }] }}>{isFavorite ? '❤️' : '🤍'}</Animated.Text>
          </Pressable>
        </View>

        <Text style={[styles.mealName, { color: colors.textPrimary }]}>{food.name}</Text>

        <View style={styles.portionRow}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            Portion Size: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{portion}g</Text>
          </Text>
          <View style={styles.portionStepper}>
            <Pressable onPress={() => adjustPortion(-10)} style={[styles.stepperBtn, { backgroundColor: colors.surface }]}>
              <Ionicons name="remove" size={14} color={colors.textPrimary} />
            </Pressable>
            <Pressable onPress={() => adjustPortion(10)} style={[styles.stepperBtn, { backgroundColor: colors.surface }]}>
              <Ionicons name="add" size={14} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <MacroBar label="PROTEIN" current={Math.round(food.macros.protein_g * portionScale)} total={80} color={colors.accentCyan} bg={`${colors.accentCyan}33`} />
        <MacroBar label="CARBS" current={Math.round(food.macros.carbs_g * portionScale)} total={250} color={colors.accentPurple} bg={`${colors.accentPurple}33`} />
        <MacroBar label="FATS" current={Math.round(food.macros.fats_g * portionScale)} total={90} color={colors.primary} bg={`${colors.primary}33`} />

        <Pressable onPress={flipCard} style={[styles.scienceBtn, { backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>View Neuro-Science 🔬</Text>
        </Pressable>
      </Animated.View>

      {/* BACK OF CARD */}
      <Animated.View
        pointerEvents={flipped ? 'auto' : 'none'}
        style={[styles.dayCard, styles.cardBack, { transform: [{ rotateY: backInterpolate }], opacity: backOpacity, backgroundColor: semanticColor }]}
      >
         <Text style={[styles.backTitle, { color: backTextColor }]}>{food.name}</Text>
         <Text style={[styles.backBody, { color: backTextColor }]}>
            This {isMeal ? 'meal' : 'ingredient'} is rich in {food.primary_compound}, delivering {Math.round(food.amount_mg * portionScale)}mg per {portion}g serving to trigger physiological adaptations.
         </Text>
         {isMeal && (
            <View>
              <Text style={[styles.backLabel, { color: backTextColor }]}>Core Bio-Hacks Used:</Text>
              <Text style={{ color: backTextColor, fontSize: 14 }}>{food.core_ingredients?.join(', ')}</Text>
            </View>
         )}
         <Pressable onPress={flipCard} style={styles.backButton}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Back to Macros</Text>
         </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

export const MealPlansScreen = () => {
  const { cognitiveGoal, physicalGoal, bmi, weight, isVegetarian, favoriteMealIds, toggleFavoriteMeal } = useAppStore();
  const { colors, isDark } = useThemeColors();
  const semanticColor = getGoalColor(cognitiveGoal || '', isDark);

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'meals'|'ingredients'>('meals');
  const [filter, setFilter] = useState('all');
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchProtocol = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_profile: {
              cognitive_goal: cognitiveGoal || "Enhance Focus",
              physical_goal: physicalGoal || "Fat Loss",
              is_vegetarian: isVegetarian,
              bmi: bmi || 24.5
            }
          })
        });

        const data = await response.json();
        if (data.status === 'success') {
          const baseWeight = weight || 70;
          const portionMult = (baseWeight / 70);

          // Backend macros/compound amounts are per 100g of food (the
          // standard USDA convention) - scale them to the actual portion_g
          // we're displaying (100g reference * however many grams that is),
          // not by portionMult alone, which would under-scale everything by
          // the base-150g/100g ratio.
          const processItems = (items: any[]) => {
             if (!items || !Array.isArray(items)) return [];
             return items.map(item => {
                const portion_g = Math.round(150 * portionMult);
                const scale = portion_g / 100;
                return {
                   ...item,
                   portion_g,
                   macros: {
                      calories: Math.round(item.macros.calories * scale),
                      protein_g: Math.round(item.macros.protein_g * scale),
                      carbs_g: Math.round(item.macros.carbs_g * scale),
                      fats_g: Math.round(item.macros.fats_g * scale),
                   },
                   amount_mg: Math.round(item.amount_mg * scale)
                };
             });
          };

          setIngredients(processItems(data.data.ingredients || []));
          setMeals(processItems(data.data.meals || []));
        }
      } catch (error) {
        console.error("Error fetching protocol:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProtocol();
  }, [cognitiveGoal, physicalGoal, bmi, isVegetarian]);

  const handleSwap = () => {
    Animated.timing(spinAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start(() => {
       spinAnim.setValue(0);
       // Simple array shuffle for gamification feel
       if (activeTab === 'meals') setMeals([...meals.sort(() => Math.random() - 0.5)]);
       else setIngredients([...ingredients.sort(() => Math.random() - 0.5)]);
    });
  };

  const spinInterpolate = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[styles.container, { backgroundColor: colors.background[0] }]}>
      <GlobalBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.tabRow}>
           <Pressable onPress={() => setActiveTab('meals')} style={[styles.tab, activeTab === 'meals' && { borderBottomColor: semanticColor, borderBottomWidth: 2 }]}>
              <Text style={{ color: activeTab === 'meals' ? semanticColor : colors.textSecondary, fontWeight: '800' }}>MEALS</Text>
           </Pressable>
           <Pressable onPress={() => setActiveTab('ingredients')} style={[styles.tab, activeTab === 'ingredients' && { borderBottomColor: semanticColor, borderBottomWidth: 2 }]}>
              <Text style={{ color: activeTab === 'ingredients' ? semanticColor : colors.textSecondary, fontWeight: '800' }}>RAW INGREDIENTS</Text>
           </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[commonStyles.screenTitle, { color: colors.textPrimary }]}>Daily Protocol</Text>
              <Text style={[styles.subtitle, { color: colors.textPrimary }]}>Target: {activeTab}</Text>
            </View>
            <Pressable onPress={handleSwap} style={[styles.swapBtn, { backgroundColor: colors.surfaceBorder }]}>
               <Animated.Text style={{ fontSize: 24, transform: [{ rotate: spinInterpolate }] }}>🔄</Animated.Text>
            </Pressable>
          </View>

          <ToggleGroupPrimitive.Root type="single" value={filter} onValueChange={(v) => v && setFilter(v)} style={styles.filterRow}>
            {FILTER_OPTIONS.map(opt => {
              const active = filter === opt.value;
              return (
                <ToggleGroupPrimitive.Item key={opt.value} value={opt.value} style={{ ...styles.filterChip, backgroundColor: active ? semanticColor : colors.surfaceBorder }}>
                  <Text style={{ color: active ? '#000' : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>{opt.label}</Text>
                </ToggleGroupPrimitive.Item>
              );
            })}
          </ToggleGroupPrimitive.Root>

          {loading ? (
            <SkeletonLoader isDark={isDark} />
          ) : (() => {
            const withKeys = (activeTab === 'meals' ? meals : ingredients).map((food: any, index: number) => ({ food, favKey: String(food.id ?? index) }));
            const visible = filter === 'favorites' ? withKeys.filter(({ favKey }) => favoriteMealIds.includes(favKey)) : withKeys;

            if (visible.length === 0) {
              return (
                <View style={styles.emptyState}>
                  <Ionicons name="heart-outline" size={40} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>No favorites yet - tap the heart on a card to save it here.</Text>
                </View>
              );
            }

            return visible.map(({ food, favKey }, i) => (
              <FlipCard
                key={favKey}
                food={food}
                colors={colors}
                semanticColor={semanticColor}
                isMeal={activeTab === 'meals'}
                isFavorite={favoriteMealIds.includes(favKey)}
                entranceDelay={i * 80}
                onToggleFavorite={() => {
                  const wasFavorite = favoriteMealIds.includes(favKey);
                  toggleFavoriteMeal(favKey);
                  showToast(wasFavorite ? 'Removed from favorites' : 'Added to favorites');
                }}
              />
            ));
          })()}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  tabRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  tab: { paddingHorizontal: 20, paddingVertical: 12 },
  content: { padding: spacing.lg, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  swapBtn: { padding: 12, borderRadius: 20 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  subtitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
  dayCard: { padding: spacing.lg, borderRadius: 20 },
  cardBack: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 24 },
  dayTitle: { fontSize: 12, fontWeight: '800', marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
  mealRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  mealName: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  scienceBtn: { marginTop: 12, padding: 8, borderRadius: 8, alignItems: 'center' },
  portionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  portionStepper: { flexDirection: 'row', gap: 6 },
  stepperBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  backTitle: { fontSize: 24, fontWeight: '900', marginBottom: 16 },
  backBody: { fontSize: 14, fontWeight: '700', marginBottom: 24, lineHeight: 22 },
  backLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  backButton: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#000', padding: 8, borderRadius: 8 },
});
