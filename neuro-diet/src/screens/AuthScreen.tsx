import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, Pressable } from 'react-native';
import * as TabsPrimitive from '@rn-primitives/tabs';
import * as SeparatorPrimitive from '@rn-primitives/separator';
import { spacing } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { useThemeColors } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { GlobalBackground } from '../components/GlobalBackground';
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

const InputField = ({ placeholder, value, onChange, secure = false, keyboardType, colors }: any) => (
  <View style={styles.inputWrapper}>
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      value={value}
      onChangeText={onChange}
      secureTextEntry={secure}
      keyboardType={keyboardType}
      autoCapitalize="none"
      style={[styles.input, { backgroundColor: colors.surfaceBorder, color: colors.textPrimary, borderColor: colors.border }]}
    />
  </View>
);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AuthScreen = () => {
  const { colors } = useThemeColors();

  const [activeTab, setActiveTab] = useState('login');

  // Login Form
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  // Register Form
  const [regUser, setRegUser] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');

  // Forgot Password Mode
  const [forgotMode, setForgotMode] = useState(false);
  const [resetUser, setResetUser] = useState('');
  const [resetPass, setResetPass] = useState('');

  const authStore = useAuthStore();

  // Navigating away on success is handled by AppNavigator reacting to
  // `currentUser`/`hasCompletedOnboarding` changing - no explicit
  // navigation call needed here (see AppNavigator.tsx).
  const handleLogin = async () => {
    try {
      if (!loginUser || !loginPass) return showToast('Please fill in all fields');
      const success = await authStore.login(loginUser, loginPass);
      if (!success) {
        showToast('Invalid username or password');
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleRegister = async () => {
    try {
      if (!regUser || !regEmail || !regPass) return showToast('Please fill in all fields');
      if (!EMAIL_PATTERN.test(regEmail.trim())) return showToast('Please enter a valid email address');
      const result = await authStore.register(regUser, regEmail, regPass);
      if (result === 'username_taken') {
        showToast('Username already exists');
      } else if (result === 'email_taken') {
        showToast('An account with that email already exists');
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleResetPassword = async () => {
    if (!resetUser || !resetPass) return showToast('Please fill in all fields');
    const success = await authStore.resetPassword(resetUser, resetPass);
    if (!success) {
      showToast('User not found');
    } else {
      showToast('Password reset successfully!');
      setTimeout(() => {
        setForgotMode(false);
        setActiveTab('login');
      }, 300);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background[0] }}>
      <GlobalBackground />
      <SafeAreaView style={styles.safeArea}>

        <View style={styles.brandBlock}>
           <Text style={styles.brandEmoji}>🧠</Text>
           <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>Neuro Diet</Text>
           <Text style={[styles.brandSubtitle, { color: colors.primary }]}>COGNITIVE PROTOCOL</Text>
        </View>

        <GlassCard style={{ padding: 24, backgroundColor: colors.surface }}>

          {forgotMode ? (
            <View>
              <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Reset Password</Text>
              <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>Enter your username and new password.</Text>

              <InputField placeholder="Username" value={resetUser} onChange={setResetUser} colors={colors} />
              <InputField placeholder="New Password" value={resetPass} onChange={setResetPass} secure colors={colors} />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Pressable style={[styles.btn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.btnText}>RESET PASSWORD</Text>
                  </Pressable>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Password?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to change your password for '{resetUser}'? This will override your old password locally.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>Cancel</Text>
                    </AlertDialogCancel>
                    <AlertDialogAction onPress={handleResetPassword}>
                      <Text style={styles.btnText}>Confirm Reset</Text>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Pressable onPress={() => setForgotMode(false)} style={styles.linkRow}>
                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Back to Login</Text>
              </Pressable>
            </View>
          ) : (
            <TabsPrimitive.Root value={activeTab} onValueChange={setActiveTab}>
              <TabsPrimitive.List style={{ ...styles.tabList, backgroundColor: colors.surfaceBorder }}>

                <TabsPrimitive.Trigger value="login" style={{ flex: 1 }}>
                  <View style={[styles.tabPill, activeTab === 'login' && { backgroundColor: colors.surface }]}>
                     <Text style={{ color: activeTab === 'login' ? colors.textPrimary : colors.textSecondary, fontWeight: '800' }}>Login</Text>
                  </View>
                </TabsPrimitive.Trigger>

                <TabsPrimitive.Trigger value="register" style={{ flex: 1 }}>
                  <View style={[styles.tabPill, activeTab === 'register' && { backgroundColor: colors.surface }]}>
                     <Text style={{ color: activeTab === 'register' ? colors.textPrimary : colors.textSecondary, fontWeight: '800' }}>Register</Text>
                  </View>
                </TabsPrimitive.Trigger>

              </TabsPrimitive.List>

              <SeparatorPrimitive.Root style={{ ...styles.separator, backgroundColor: colors.border }} />

              <TabsPrimitive.Content value="login">
                <InputField placeholder="Username" value={loginUser} onChange={setLoginUser} colors={colors} />
                <InputField placeholder="Password" value={loginPass} onChange={setLoginPass} secure colors={colors} />

                <Pressable onPress={handleLogin} style={[styles.btn, { backgroundColor: colors.primary, marginTop: 8 }]}>
                  <Text style={styles.btnText}>LOGIN</Text>
                </Pressable>

                <Pressable onPress={() => setForgotMode(true)} style={styles.linkRowSpaced}>
                  <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Forgot Password?</Text>
                </Pressable>
              </TabsPrimitive.Content>

              <TabsPrimitive.Content value="register">
                <InputField placeholder="Choose Username" value={regUser} onChange={setRegUser} colors={colors} />
                <InputField placeholder="Email Address" value={regEmail} onChange={setRegEmail} keyboardType="email-address" colors={colors} />
                <InputField placeholder="Choose Password" value={regPass} onChange={setRegPass} secure colors={colors} />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Pressable style={[styles.btn, { backgroundColor: colors.primary, marginTop: 8 }]}>
                      <Text style={styles.btnText}>CREATE ACCOUNT</Text>
                    </Pressable>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Create Account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will register '{regUser}' into your local device storage. You can login with these credentials later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>Cancel</Text>
                      </AlertDialogCancel>
                      <AlertDialogAction onPress={handleRegister}>
                        <Text style={styles.btnText}>Confirm Register</Text>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TabsPrimitive.Content>

            </TabsPrimitive.Root>
          )}

        </GlassCard>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  brandBlock: { alignItems: 'center', marginBottom: 40 },
  brandEmoji: { fontSize: 48, marginBottom: 16 },
  brandTitle: { fontSize: 32, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
  brandSubtitle: { fontSize: 14, fontWeight: '800', marginTop: 4, letterSpacing: 4 },
  formTitle: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
  formSubtitle: { marginBottom: 24 },
  inputWrapper: { marginBottom: 16 },
  input: { padding: 16, borderRadius: 12, borderWidth: 1, fontWeight: '600' },
  tabList: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 24 },
  tabPill: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  separator: { height: 1, marginBottom: 24 },
  linkRow: { marginTop: 16, alignItems: 'center' },
  linkRowSpaced: { marginTop: 24, alignItems: 'center' },
  btn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4
  },
  btnText: { color: '#000', fontWeight: '800', fontSize: 16 },
});
