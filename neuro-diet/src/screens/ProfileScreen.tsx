import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated, Easing, Pressable, ScrollView, Image, TextInput, Share, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Portal } from '@rn-primitives/portal';
import { spacing, getGoalColor } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { useAppStore, useThemeColors, getStreakDays } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { AVATARS } from '../constants/avatars';
import Counter from '../components/Counter';
import { showToast } from '../store/useToastStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/AlertDialog';
import * as SwitchPrimitive from '@rn-primitives/switch';
import * as SeparatorPrimitive from '@rn-primitives/separator';
import { Ionicons } from '@expo/vector-icons';
import { GlobalBackground } from '../components/GlobalBackground';
import * as AvatarPrimitive from '@rn-primitives/avatar';

const ThemeToggle = ({ themeMode, toggleTheme, semanticColor, colors }: any) => {
  const isDark = themeMode === 'dark';
  const iconAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(iconAnim, { toValue: isDark ? 1 : 0, duration: 300, useNativeDriver: true }).start();
  }, [isDark]);

  const rotate = iconAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[styles.toggleRow, { backgroundColor: colors.surfaceBorder }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.textPrimary} />
        </Animated.View>
        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>Dark Mode</Text>
      </View>

      <SwitchPrimitive.Root
        checked={isDark}
        onCheckedChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); toggleTheme(); }}
        style={{ ...styles.switchTrack, backgroundColor: isDark ? semanticColor : colors.textSecondary }}
      >
        <SwitchPrimitive.Thumb
          style={{ ...styles.switchThumb, transform: [{ translateX: isDark ? 22 : 0 }] }}
        />
      </SwitchPrimitive.Root>
    </View>
  );
};

const ToggleRow = ({ icon, label, value, onToggle, semanticColor, colors }: any) => (
  <View style={[styles.toggleRow, { backgroundColor: colors.surfaceBorder }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Ionicons name={icon} size={18} color={colors.textPrimary} />
      <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>{label}</Text>
    </View>
    <SwitchPrimitive.Root
      checked={value}
      onCheckedChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onToggle(); }}
      style={{ ...styles.switchTrack, backgroundColor: value ? semanticColor : colors.textSecondary }}
    >
      <SwitchPrimitive.Thumb style={{ ...styles.switchThumb, transform: [{ translateX: value ? 22 : 0 }] }} />
    </SwitchPrimitive.Root>
  </View>
);

const SettingsRow = ({ icon, label, onPress, colors, danger }: any) => (
  <Pressable onPress={() => { Haptics.selectionAsync().catch(() => {}); onPress(); }} style={[styles.settingsRow, { backgroundColor: colors.surfaceBorder }]}>
    <Ionicons name={icon} size={18} color={danger ? colors.error : colors.textPrimary} />
    <Text style={{ color: danger ? colors.error : colors.textPrimary, fontWeight: '700', fontSize: 15, flex: 1, marginLeft: 12 }}>{label}</Text>
    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
  </Pressable>
);

// Shared slide-up-sheet animation, used by every Portal-based sheet on this
// screen (Settings, Avatar Picker, Edit Stats, Change Password). Guards
// against `close()` running more than once for the same sheet instance - a
// fast double-tap on Cancel/backdrop fires two overlapping `Animated.timing`
// calls on the same shared value, which left the sheet stuck mounted behind
// its own now-invisible full-screen backdrop (soft-locking the screen)
// despite the slide-out itself completing correctly.
const useSlideSheet = (onClose: () => void) => {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const closingRef = useRef(false);

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true }).start();
  }, []);

  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start();
    setTimeout(onClose, 200);
  };

  return { slideAnim, close };
};

// Slide-up settings panel rendered via Portal (App.tsx already mounts a
// PortalHost) rather than a permanently-inline settings block on the page.
// Rows that open another sheet close this one immediately (no slide-out
// animation) rather than the animated `close()`, so two Portal overlays
// never end up stacked mid-transition.
const SettingsSheet = ({
  onClose, themeMode, toggleTheme, semanticColor, colors, onRestart, onLogout, username,
  unitsPreference, onToggleUnits, notificationsEnabled, onToggleNotifications,
  onOpenAvatarPicker, onOpenEditStats, onOpenChangePassword, onOpenExportData, onShare, onDeleteAccount,
}: any) => {
  const { slideAnim, close } = useSlideSheet(onClose);

  const navigateTo = (openFn: () => void) => {
    onClose();
    openFn();
  };

  return (
    <Portal name="profile-settings-sheet">
      <Pressable style={styles.sheetBackdrop} onPress={close} />
      <Animated.View style={[styles.sheetPanel, { backgroundColor: colors.background[0], transform: [{ translateY: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.surfaceBorder }]} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 8 }]}>Settings</Text>

          <ThemeToggle themeMode={themeMode} toggleTheme={toggleTheme} semanticColor={semanticColor} colors={colors} />
          <ToggleRow icon="notifications-outline" label={notificationsEnabled ? 'Reminders On' : 'Reminders Off'} value={notificationsEnabled} onToggle={onToggleNotifications} semanticColor={semanticColor} colors={colors} />
          <ToggleRow icon="speedometer-outline" label={unitsPreference === 'imperial' ? 'Units: Imperial (lb)' : 'Units: Metric (kg)'} value={unitsPreference === 'imperial'} onToggle={onToggleUnits} semanticColor={semanticColor} colors={colors} />

          <Text style={[styles.sheetGroupLabel, { color: colors.textSecondary }]}>Account</Text>
          <SettingsRow icon="person-circle-outline" label="Change Avatar" onPress={() => navigateTo(onOpenAvatarPicker)} colors={colors} />
          <SettingsRow icon="body-outline" label="Update Weight & Height" onPress={() => navigateTo(onOpenEditStats)} colors={colors} />
          <SettingsRow icon="key-outline" label="Change Password" onPress={() => navigateTo(onOpenChangePassword)} colors={colors} />
          <SettingsRow icon="download-outline" label="Export My Data" onPress={() => navigateTo(onOpenExportData)} colors={colors} />
          <SettingsRow icon="share-social-outline" label="Share My Progress" onPress={onShare} colors={colors} />

          <Text style={[styles.sheetGroupLabel, { color: colors.textSecondary }]}>Danger Zone</Text>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Pressable style={[styles.dangerBtn, { backgroundColor: `${colors.error}1A` }]}>
                <Text style={{ color: colors.error, fontWeight: '800' }}>RESTART ONBOARDING</Text>
              </Pressable>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restart Onboarding?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to restart your setup? This will clear your current goals.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>Cancel</Text>
                </AlertDialogCancel>
                <AlertDialogAction onPress={onRestart}>
                  <Text style={{ color: '#000', fontWeight: '800' }}>Confirm Restart</Text>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Pressable style={[styles.logoutBtn, { backgroundColor: colors.surfaceBorder }]}>
                <Text style={{ color: colors.textSecondary, fontWeight: '800' }}>LOG OUT</Text>
              </Pressable>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Log Out?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to log out of Neuro-Diet?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>Cancel</Text>
                </AlertDialogCancel>
                <AlertDialogAction onPress={onLogout}>
                  <Text style={{ color: '#000', fontWeight: '800' }}>Log Out</Text>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Pressable style={[styles.dangerBtn, { backgroundColor: `${colors.error}1A`, marginTop: 12 }]}>
                <Text style={{ color: colors.error, fontWeight: '800' }}>DELETE ACCOUNT</Text>
              </Pressable>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes '{username}' and all its local data - goals, history, favorites. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>Cancel</Text>
                </AlertDialogCancel>
                <AlertDialogAction onPress={onDeleteAccount} style={{ backgroundColor: colors.error }}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Delete Forever</Text>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Text style={[styles.appInfoText, { color: colors.textSecondary }]}>Neuro-Diet v1.0.0{'\n'}Built with 🧠 for cognitive + physical performance</Text>

          <Pressable onPress={close} style={styles.sheetCloseBtn}>
            <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Close</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </Portal>
  );
};

// Full-size avatar preview, tap-to-dismiss, also via Portal.
const AvatarZoomModal = ({ image, onClose, colors }: any) => (
  <Portal name="profile-avatar-zoom">
    <Pressable style={styles.zoomBackdrop} onPress={onClose}>
      <Image source={image} style={[styles.zoomImage, { borderColor: colors.primary }]} />
      <Text style={styles.zoomHint}>Tap anywhere to close</Text>
    </Pressable>
  </Portal>
);

const FAB = ({ semanticColor }: any) => {
  const [open, setOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const toValue = open ? 0 : 1;
    Animated.spring(animation, { toValue, friction: 5, useNativeDriver: true }).start();
    setOpen(!open);
  };

  const action1Style = {
    transform: [
      { scale: animation },
      { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) }
    ]
  };

  const action2Style = {
    transform: [
      { scale: animation },
      { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, -120] }) }
    ]
  };

  return (
    <View style={styles.fabContainer}>
      <Animated.View style={[styles.fabAction, action2Style, { backgroundColor: semanticColor }]}>
         <Text style={styles.fabActionText}>SLEEP</Text>
      </Animated.View>
      <Animated.View style={[styles.fabAction, action1Style, { backgroundColor: semanticColor }]}>
         <Text style={styles.fabActionText}>WATER</Text>
      </Animated.View>
      <Pressable onPress={toggleMenu} style={[styles.fabButton, { backgroundColor: semanticColor }]}>
        <Animated.Text style={[styles.fabIcon, { transform: [{ rotate: animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }]}>+</Animated.Text>
      </Pressable>
    </View>
  );
};

// Static aurora backdrop: a vertical fade from the brand green into the
// theme background (white in light mode, black in dark mode), with two soft
// diagonal light bands drifting slowly for texture. Deliberately NOT tied to
// scroll position (the old parallax scale/height made the whole thing feel
// like it was moving); only the bands themselves drift, gently.
const AuroraHeader = ({ colors, isDark }: any) => {
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = (anim: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    drift(wave1, 7000).start();
    drift(wave2, 9500).start();
  }, []);

  const shift1 = wave1.interpolate({ inputRange: [0, 1], outputRange: [-24, 24] });
  const shift2 = wave2.interpolate({ inputRange: [0, 1], outputRange: [18, -18] });

  return (
    <View style={[styles.parallaxHeader, { backgroundColor: colors.background[0] }]} pointerEvents="none">
      <LinearGradient
        colors={[colors.primary, colors.background[0]]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.waveBand, { top: -30, transform: [{ rotate: '18deg' }, { translateX: shift1 }] }]}>
        <LinearGradient colors={['transparent', isDark ? '#00FF9D' : '#00A85C', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
      </Animated.View>
      <Animated.View style={[styles.waveBand, { top: 70, transform: [{ rotate: '-12deg' }, { translateX: shift2 }] }]}>
        <LinearGradient colors={['transparent', colors.primary, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
      </Animated.View>
      <BlurView intensity={70} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
    </View>
  );
};

const ProtocolRow = ({ label, value, colors, last = false }: any) => (
  <>
    <View style={styles.protocolRow}>
       <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>{label}</Text>
       <Text style={{ color: colors.textPrimary, fontWeight: '900' }}>{value}</Text>
    </View>
    {!last && <SeparatorPrimitive.Root style={{ ...styles.separator, backgroundColor: colors.border }} />}
  </>
);

// Longest-ever consecutive-day run, distinct from getStreakDays' "current
// active streak" (which only looks at the tail ending today/yesterday) -
// this is a lifetime-best stat, so it only ever grows.
const getLongestStreak = (completions: { date: string }[]): number => {
  const days = Array.from(new Set(completions.map(c => c.date))).sort();
  if (days.length === 0) return 0;
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const diffDays = Math.round((new Date(days[i]).getTime() - new Date(days[i - 1]).getTime()) / 86400000);
    run = diffDays === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return longest;
};

// XP is derived only from lifetime completions (never current streak, which
// can drop to 0) so level/progress never regresses - matches how Duolingo
// etc. keep total XP monotonically increasing even when a streak breaks.
const XP_PER_COMPLETION = 20;
const XP_PER_LEVEL = 100;
const computeLevel = (totalCompletions: number) => {
  const xp = totalCompletions * XP_PER_COMPLETION;
  return { level: Math.floor(xp / XP_PER_LEVEL) + 1, xpIntoLevel: xp % XP_PER_LEVEL, xpForNext: XP_PER_LEVEL };
};

const formatWeight = (kg: number, pref: 'metric' | 'imperial') =>
  pref === 'imperial' ? `${Math.round(kg * 2.20462)} lb` : `${kg} kg`;

const LevelProgress = ({ completions, semanticColor, colors }: any) => {
  const { level, xpIntoLevel, xpForNext } = computeLevel(completions.length);
  const widthAnim = useRef(new Animated.Value(0)).current;
  const progress = (xpIntoLevel / xpForNext) * 100;

  useEffect(() => {
    Animated.timing(widthAnim, { toValue: progress, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progress]);

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <Text style={[styles.avatarLevel, { color: semanticColor }]}>Level {level} Bio-Hacker</Text>
      <View style={[styles.xpTrack, { backgroundColor: colors.surfaceBorder }]}>
        <Animated.View style={[styles.xpFill, { backgroundColor: semanticColor, width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4, fontWeight: '700' }}>{xpIntoLevel} / {xpForNext} XP to next level</Text>
    </View>
  );
};

// Tap-to-edit inline bio, Instagram/social-profile style - shows a prompt
// when empty, swaps to a TextInput on tap, saves on submit/checkmark.
const BioEditor = ({ bio, onSave, colors }: any) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bio);

  const save = () => {
    Haptics.selectionAsync().catch(() => {});
    onSave(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <View style={styles.bioEditRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a short bio..."
          placeholderTextColor={colors.textSecondary}
          maxLength={80}
          autoFocus
          onSubmitEditing={save}
          style={[styles.bioInput, { color: colors.textPrimary, borderColor: colors.border }]}
        />
        <Pressable onPress={save} hitSlop={8}>
          <Ionicons name="checkmark-circle" size={26} color={colors.primary} />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable onPress={() => { setDraft(bio); setEditing(true); }} style={styles.bioRow}>
      <Text style={{ color: colors.textSecondary, fontStyle: bio ? 'normal' : 'italic', fontSize: 13, flex: 1, textAlign: 'center' }} numberOfLines={2}>
        {bio || 'Tap to add a bio'}
      </Text>
      <Ionicons name="pencil" size={12} color={colors.textSecondary} />
    </Pressable>
  );
};

const StatCell = ({ value, label, colors }: any) => (
  <View style={styles.statCell}>
    <Text style={[styles.statValue, { color: colors.textPrimary }]} numberOfLines={1}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
  </View>
);

// Strava-style lifetime stat tiles - derived entirely from data already in
// the store, no extra tracking needed.
const StatsGrid = ({ completionsCount, longestStreak, favoritesCount, joinedAt, colors }: any) => {
  const memberSince = joinedAt ? new Date(joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—';
  return (
    <View style={styles.statsGrid}>
      <StatCell value={completionsCount} label="Sessions" colors={colors} />
      <StatCell value={longestStreak} label="Best Streak" colors={colors} />
      <StatCell value={favoritesCount} label="Favorites" colors={colors} />
      <StatCell value={memberSince} label="Member Since" colors={colors} />
    </View>
  );
};

// GitHub-contributions/Duolingo-style 35-day activity heatmap.
const StreakCalendar = ({ completions, semanticColor, colors }: any) => {
  const days = useRef(Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    return d.toISOString().slice(0, 10);
  })).current;
  const completedDays = new Set(completions.map((c: any) => c.date));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <View style={styles.calendarGrid}>
      {days.map((date) => {
        const done = completedDays.has(date);
        return (
          <View
            key={date}
            style={[
              styles.calendarCell,
              {
                backgroundColor: done ? semanticColor : colors.surfaceBorder,
                opacity: done ? 1 : 0.5,
                borderWidth: date === today ? 2 : 0,
                borderColor: colors.textPrimary,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const ACHIEVEMENT_DEFS = [
  { key: 'first_step', emoji: '\u{1F331}', label: 'First Step', check: (d: any) => d.completionsCount >= 1 },
  { key: 'streak_7', emoji: '\u{1F525}', label: '7-Day Streak', check: (d: any) => d.longestStreak >= 7 },
  { key: 'consistent', emoji: '\u{1F3C5}', label: 'Consistent', check: (d: any) => d.completionsCount >= 25 },
  { key: 'century', emoji: '\u{1F4AF}', label: 'Century Club', check: (d: any) => d.completionsCount >= 100 },
  { key: 'favorites', emoji: '❤️', label: 'Favorite Finder', check: (d: any) => d.favoritesCount >= 3 },
  { key: 'setup', emoji: '\u{1F305}', label: 'Fresh Start', check: (d: any) => d.hasCompletedOnboarding },
];

const AchievementsGrid = ({ data, colors }: any) => (
  <View style={styles.achievementsGrid}>
    {ACHIEVEMENT_DEFS.map(a => {
      const unlocked = a.check(data);
      return (
        <View key={a.key} style={[styles.achievementCell, { backgroundColor: colors.surfaceBorder, opacity: unlocked ? 1 : 0.35 }]}>
          <Text style={{ fontSize: 22 }}>{a.emoji}</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 9, fontWeight: '700', marginTop: 4, textAlign: 'center' }}>{a.label}</Text>
        </View>
      );
    })}
  </View>
);

// Change-avatar-from-profile picker, same snap-scroll pattern as onboarding's
// avatar step but reachable any time, not just during setup.
const AvatarPickerSheet = ({ currentAvatarId, onSelect, onClose, colors, semanticColor }: any) => {
  const { slideAnim, close } = useSlideSheet(onClose);
  return (
    <Portal name="profile-avatar-picker">
      <Pressable style={styles.sheetBackdrop} onPress={close} />
      <Animated.View style={[styles.sheetPanel, { backgroundColor: colors.background[0], transform: [{ translateY: slideAnim }] }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.surfaceBorder }]} />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 8, textAlign: 'center' }]}>Choose Avatar</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 4, gap: 12 }}>
          {AVATARS.map((avatar: any) => (
            <Pressable
              key={avatar.id}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); onSelect(avatar.id); close(); }}
              style={{
                width: 70, height: 70, borderRadius: 35, overflow: 'hidden',
                borderWidth: currentAvatarId === avatar.id ? 3 : 0, borderColor: semanticColor,
              }}
            >
              <Image source={avatar.image} style={{ width: '100%', height: '100%' }} />
            </Pressable>
          ))}
        </ScrollView>
        <Pressable onPress={close} style={styles.sheetCloseBtn}>
          <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Close</Text>
        </Pressable>
      </Animated.View>
    </Portal>
  );
};

// Quick weight/height update without redoing the whole onboarding flow.
const EditStatsSheet = ({ weight, height, onSave, onClose, colors, semanticColor }: any) => {
  const { slideAnim, close } = useSlideSheet(onClose);
  const [w, setW] = useState(weight || 70);
  const [h, setH] = useState(height || 170);
  const save = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onSave(w, h);
    showToast('Stats updated');
    close();
  };
  return (
    <Portal name="profile-edit-stats">
      <Pressable style={styles.sheetBackdrop} onPress={close} />
      <Animated.View style={[styles.sheetPanel, { backgroundColor: colors.background[0], transform: [{ translateY: slideAnim }] }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.surfaceBorder }]} />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 8, textAlign: 'center' }]}>Update Stats</Text>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: colors.textSecondary, fontWeight: '800', marginBottom: 4, fontSize: 12 }}>WEIGHT (KG)</Text>
          <Counter value={w} onChange={setW} min={30} max={250} places={[100, 10, 1]} fontSize={38} padding={3} gap={3} textColor={semanticColor} fontWeight={900} />
        </View>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ color: colors.textSecondary, fontWeight: '800', marginBottom: 4, fontSize: 12 }}>HEIGHT (CM)</Text>
          <Counter value={h} onChange={setH} min={100} max={250} places={[100, 10, 1]} fontSize={38} padding={3} gap={3} textColor={semanticColor} fontWeight={900} />
        </View>
        <Pressable onPress={save} style={[styles.dangerBtn, { backgroundColor: semanticColor }]}>
          <Text style={{ color: '#000', fontWeight: '800' }}>SAVE</Text>
        </Pressable>
        <Pressable onPress={close} style={styles.sheetCloseBtn}>
          <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </Portal>
  );
};

// Settings-page password change - requires the CURRENT password (unlike
// the logged-out "Forgot Password" flow), the correct check for someone
// already inside an authenticated session.
const ChangePasswordSheet = ({ onClose, colors, semanticColor }: any) => {
  const { slideAnim, close } = useSlideSheet(onClose);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const submit = async () => {
    if (!current || !next || !confirm) return showToast('Please fill in all fields');
    if (next !== confirm) return showToast('New passwords do not match');
    const ok = await useAuthStore.getState().changePassword(current, next);
    if (!ok) return showToast('Current password is incorrect');
    showToast('Password updated');
    close();
  };
  return (
    <Portal name="profile-change-password">
      <Pressable style={styles.sheetBackdrop} onPress={close} />
      <Animated.View style={[styles.sheetPanel, { backgroundColor: colors.background[0], transform: [{ translateY: slideAnim }] }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.surfaceBorder }]} />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 8, textAlign: 'center' }]}>Change Password</Text>
        <TextInput placeholder="Current Password" placeholderTextColor={colors.textSecondary} secureTextEntry autoCapitalize="none" value={current} onChangeText={setCurrent} style={[styles.pwInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceBorder }]} />
        <TextInput placeholder="New Password" placeholderTextColor={colors.textSecondary} secureTextEntry autoCapitalize="none" value={next} onChangeText={setNext} style={[styles.pwInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceBorder }]} />
        <TextInput placeholder="Confirm New Password" placeholderTextColor={colors.textSecondary} secureTextEntry autoCapitalize="none" value={confirm} onChangeText={setConfirm} style={[styles.pwInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceBorder }]} />
        <Pressable onPress={submit} style={[styles.dangerBtn, { backgroundColor: semanticColor, marginTop: 8 }]}>
          <Text style={{ color: '#000', fontWeight: '800' }}>UPDATE PASSWORD</Text>
        </Pressable>
        <Pressable onPress={close} style={styles.sheetCloseBtn}>
          <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </Portal>
  );
};

// "Download your data" style export (GDPR-adjacent pattern) - shown as
// selectable text rather than wired to expo-clipboard, so it works
// identically on web and native without an extra dependency.
const ExportDataModal = ({ dataText, onClose, colors }: any) => (
  <Portal name="profile-export-data">
    <Pressable style={styles.sheetBackdrop} onPress={onClose} />
    <View style={[styles.exportPanel, { backgroundColor: colors.background[0] }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Data</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }}>Tap and hold (or click-drag) to select and copy.</Text>
      <ScrollView style={styles.exportScroll}>
        <Text selectable style={{ color: colors.textPrimary, fontSize: 12, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}>
          {dataText}
        </Text>
      </ScrollView>
      <Pressable onPress={onClose} style={styles.sheetCloseBtn}>
        <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Close</Text>
      </Pressable>
    </View>
  </Portal>
);

export const ProfileScreen = () => {
  const {
    cognitiveGoal, physicalGoal, themeMode, toggleTheme, weight, height, bmi, resetOnboarding, avatarId,
    bio, setBio, notificationsEnabled, setNotificationsEnabled, unitsPreference, setUnitsPreference,
    completions, favoriteMealIds, favoriteExerciseIds, joinedAt, hasCompletedOnboarding, setAvatarId, setPhysicalMetrics,
  } = useAppStore();
  const currentUser = useAuthStore(state => state.currentUser);
  const { colors, isDark } = useThemeColors();
  const semanticColor = getGoalColor(cognitiveGoal || 'Focus', isDark);
  const avatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0];

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [avatarZoomed, setAvatarZoomed] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [editStatsOpen, setEditStatsOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [exportDataOpen, setExportDataOpen] = useState(false);

  const longestStreak = getLongestStreak(completions);
  const favoritesCount = favoriteMealIds.length + favoriteExerciseIds.length;

  // Logging out must not wipe onboarding progress - it only clears the
  // active session so the same user lands back on their Dashboard (not a
  // blank questionnaire) next time they log in. Only the explicit "Restart
  // Onboarding" action below should reset it.
  const handleLogout = () => {
    useAuthStore.getState().logout();
  };

  const handleDeleteAccount = () => {
    useAuthStore.getState().deleteAccount();
  };

  const handleShare = async () => {
    const message = `I'm on a ${cognitiveGoal || 'wellness'} + ${physicalGoal || 'fitness'} journey with Neuro-Diet \u{1F9E0} - Level ${computeLevel(completions.length).level}, ${longestStreak}-day best streak and counting!`;
    try {
      await Share.share({ message });
    } catch (e: any) {
      showToast('Sharing is not supported here');
    }
  };

  const exportDataText = JSON.stringify({
    username: currentUser?.username,
    email: currentUser?.email,
    joinedAt,
    bio,
    cognitiveGoal,
    physicalGoal,
    weight,
    height,
    bmi,
    favoriteMealIds,
    favoriteExerciseIds,
    totalCompletions: completions.length,
    longestStreak,
    avatarId,
  }, null, 2);

  return (
    <View style={[styles.container, { backgroundColor: colors.background[0] }]}>
      <GlobalBackground />
      <AuroraHeader colors={colors} isDark={isDark} />

      <Pressable
        onPress={() => setSettingsOpen(true)}
        style={[styles.settingsBtn, { backgroundColor: colors.surfaceBorder }]}
      >
        <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
      </Pressable>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SafeAreaView>
           <View style={styles.avatarBlock}>
             <View>
               <Pressable onPress={() => { Haptics.selectionAsync().catch(() => {}); setAvatarZoomed(true); }}>
                 <AvatarPrimitive.Root alt="Your avatar" style={{ ...styles.avatarCircle, backgroundColor: colors.surfaceBorder, borderColor: semanticColor }}>
                    <AvatarPrimitive.Image source={avatar.image} style={{ width: '100%', height: '100%' }} />
                    <AvatarPrimitive.Fallback style={styles.avatarFallback}>
                      <Text style={{ fontSize: 42 }}>⛩️</Text>
                    </AvatarPrimitive.Fallback>
                 </AvatarPrimitive.Root>
               </Pressable>
               <Pressable
                 onPress={() => { Haptics.selectionAsync().catch(() => {}); setAvatarPickerOpen(true); }}
                 style={[styles.avatarEditBadge, { backgroundColor: semanticColor, borderColor: colors.background[0] }]}
               >
                 <Ionicons name="pencil" size={12} color="#000" />
               </Pressable>
             </View>
             <Text style={[styles.avatarName, { color: colors.textPrimary }]}>{currentUser?.username || 'Protagonist'}</Text>
             <LevelProgress completions={completions} semanticColor={semanticColor} colors={colors} />
             <BioEditor bio={bio} onSave={setBio} colors={colors} />
           </View>

           <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Lifetime Stats</Text>
           <StatsGrid completionsCount={completions.length} longestStreak={longestStreak} favoritesCount={favoritesCount} joinedAt={joinedAt} colors={colors} />

           <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>Activity (Last 5 Weeks)</Text>
           <StreakCalendar completions={completions} semanticColor={semanticColor} colors={colors} />

           <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>Achievements</Text>
           <AchievementsGrid data={{ completionsCount: completions.length, longestStreak, favoritesCount, hasCompletedOnboarding }} colors={colors} />

           <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>Current Protocol</Text>
           <GlassCard style={[styles.protocolCard, { backgroundColor: colors.surfaceBorder }]}>
              <ProtocolRow label="Cognitive Target" value={cognitiveGoal} colors={colors} />
              <ProtocolRow label="Physical Target" value={physicalGoal} colors={colors} />
              <ProtocolRow label="Weight Baseline" value={formatWeight(weight, unitsPreference)} colors={colors} />
              <ProtocolRow label="BMI" value={bmi} colors={colors} last />
           </GlassCard>
        </SafeAreaView>
      </ScrollView>

      <FAB semanticColor={semanticColor} />

      {settingsOpen && (
        <SettingsSheet
          onClose={() => setSettingsOpen(false)}
          themeMode={themeMode}
          toggleTheme={toggleTheme}
          semanticColor={semanticColor}
          colors={colors}
          onRestart={resetOnboarding}
          onLogout={handleLogout}
          username={currentUser?.username}
          unitsPreference={unitsPreference}
          onToggleUnits={() => setUnitsPreference(unitsPreference === 'metric' ? 'imperial' : 'metric')}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={() => setNotificationsEnabled(!notificationsEnabled)}
          onOpenAvatarPicker={() => setAvatarPickerOpen(true)}
          onOpenEditStats={() => setEditStatsOpen(true)}
          onOpenChangePassword={() => setChangePasswordOpen(true)}
          onOpenExportData={() => setExportDataOpen(true)}
          onShare={handleShare}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
      {avatarZoomed && (
        <AvatarZoomModal image={avatar.image} onClose={() => setAvatarZoomed(false)} colors={colors} />
      )}
      {avatarPickerOpen && (
        <AvatarPickerSheet
          currentAvatarId={avatarId}
          onSelect={setAvatarId}
          onClose={() => setAvatarPickerOpen(false)}
          colors={colors}
          semanticColor={semanticColor}
        />
      )}
      {editStatsOpen && (
        <EditStatsSheet
          weight={weight}
          height={height}
          onSave={setPhysicalMetrics}
          onClose={() => setEditStatsOpen(false)}
          colors={colors}
          semanticColor={semanticColor}
        />
      )}
      {changePasswordOpen && (
        <ChangePasswordSheet onClose={() => setChangePasswordOpen(false)} colors={colors} semanticColor={semanticColor} />
      )}
      {exportDataOpen && (
        <ExportDataModal dataText={exportDataText} onClose={() => setExportDataOpen(false)} colors={colors} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 150 },
  parallaxHeader: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: 260, overflow: 'hidden' },
  waveBand: { position: 'absolute', left: '-20%', width: '140%', height: 90 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },

  settingsBtn: { position: 'absolute', top: 56, right: 20, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', zIndex: 5 },

  avatarBlock: { alignItems: 'center', marginTop: 100, marginBottom: 32 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  avatarFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarEditBadge: { position: 'absolute', bottom: 12, right: -4, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  avatarName: { fontSize: 24, fontWeight: '900', textTransform: 'uppercase', marginTop: 4 },
  avatarLevel: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },

  xpTrack: { width: 180, height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  xpFill: { height: '100%', borderRadius: 3 },

  bioRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 24 },
  bioEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, width: '100%', paddingHorizontal: 24 },
  bioInput: { flex: 1, borderBottomWidth: 1, fontSize: 13, paddingVertical: 4, textAlign: 'center' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCell: { flexBasis: '47%', flexGrow: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 16, backgroundColor: 'rgba(128,128,128,0.08)' },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 4, letterSpacing: 0.5 },

  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  calendarCell: { width: 28, height: 28, borderRadius: 6 },

  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achievementCell: { flexBasis: '30%', flexGrow: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16 },

  protocolCard: { padding: 24, marginBottom: 24 },
  protocolRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  separator: { height: 1, marginVertical: 8 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, marginBottom: 12 },
  switchTrack: { width: 50, height: 28, borderRadius: 14, justifyContent: 'center', padding: 2 },
  switchThumb: { width: 24, height: 24, backgroundColor: '#ffffff', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },

  sheetGroupLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8, marginBottom: 8 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10 },
  appInfoText: { fontSize: 11, textAlign: 'center', marginTop: 16, marginBottom: 8, lineHeight: 16 },

  pwInput: { padding: 14, borderRadius: 12, borderWidth: 1, fontWeight: '600', marginBottom: 12 },

  dangerBtn: { padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  logoutBtn: { padding: 16, borderRadius: 16, alignItems: 'center' },

  fabContainer: { position: 'absolute', bottom: 100, right: 20, alignItems: 'center' },
  fabButton: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  fabAction: { position: 'absolute', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 3 },
  fabActionText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  fabIcon: { color: '#ffffff', fontSize: 24, fontWeight: '900' },

  sheetBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheetPanel: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '85%', padding: spacing.lg, paddingBottom: 40, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center' },
  sheetCloseBtn: { alignItems: 'center', padding: 12, marginTop: 8 },

  zoomBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  zoomImage: { width: 240, height: 240, borderRadius: 120, borderWidth: 4 },
  zoomHint: { color: '#9CA3AF', marginTop: 20, fontWeight: '600' },

  exportPanel: { position: 'absolute', top: '10%', left: 20, right: 20, bottom: '10%', borderRadius: 24, padding: spacing.lg },
  exportScroll: { flex: 1, marginBottom: 12 },
});
