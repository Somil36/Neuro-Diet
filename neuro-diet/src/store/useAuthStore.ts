import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { useAppStore } from './useAppStore';

interface User {
  username: string;
  email: string;
  passwordHash: string;
}

export type RegisterResult = 'ok' | 'username_taken' | 'email_taken';

interface AuthState {
  users: User[];
  currentUser: User | null;

  register: (username: string, email: string, password: string) => Promise<RegisterResult>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  resetPassword: (username: string, newPassword: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  deleteAccount: () => void;
}

const hashPassword = (password: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,

      register: async (username, email, password) => {
        const { users } = get();
        const uname = username.trim();
        const mail = email.trim().toLowerCase();
        if (users.find(u => u.username.toLowerCase() === uname.toLowerCase())) {
          return 'username_taken';
        }
        if (users.find(u => u.email.toLowerCase() === mail)) {
          return 'email_taken';
        }
        const newUser = { username: uname, email: mail, passwordHash: await hashPassword(password) };
        set({ users: [...users, newUser], currentUser: newUser });
        // Brand-new account - always starts from a blank slate (forces
        // onboarding) rather than inheriting whatever the previously active
        // account left in the shared app store.
        useAppStore.getState().loadProfileFor(uname);
        useAppStore.setState({ joinedAt: new Date().toISOString() });
        return 'ok';
      },

      login: async (username, password) => {
        const { users } = get();
        const passwordHash = await hashPassword(password);
        const user = users.find(
          u => u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === passwordHash
        );
        if (user) {
          set({ currentUser: user });
          useAppStore.getState().loadProfileFor(user.username);
          return true;
        }
        return false;
      },

      logout: () => {
        const { currentUser } = get();
        if (currentUser) {
          // Persist this account's onboarding progress/goals/history before
          // clearing the session, so it's there to restore next login -
          // otherwise whichever account logs in next would inherit it.
          useAppStore.getState().saveProfileSnapshot(currentUser.username);
        }
        set({ currentUser: null });
      },

      resetPassword: async (username, newPassword) => {
        const { users } = get();
        const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());

        if (userIndex === -1) {
          return false; // User not found
        }

        const passwordHash = await hashPassword(newPassword);
        const updatedUsers = users.map((u, i) => i === userIndex ? { ...u, passwordHash } : u);

        set({ users: updatedUsers });
        return true;
      },

      // Unlike resetPassword (used from the logged-out "Forgot Password"
      // flow), this requires the account's own current password - the
      // correct check for a settings-page password change on an already
      // authenticated session.
      changePassword: async (currentPassword, newPassword) => {
        const { users, currentUser } = get();
        if (!currentUser) return false;
        const currentHash = await hashPassword(currentPassword);
        if (currentHash !== currentUser.passwordHash) return false;

        const newHash = await hashPassword(newPassword);
        const updatedUser = { ...currentUser, passwordHash: newHash };
        set({
          users: users.map(u => u.username === currentUser.username ? updatedUser : u),
          currentUser: updatedUser,
        });
        return true;
      },

      deleteAccount: () => {
        const { users, currentUser } = get();
        if (!currentUser) return;
        set({
          users: users.filter(u => u.username !== currentUser.username),
          currentUser: null,
        });
        useAppStore.setState((state) => {
          const profiles = { ...state.profiles };
          delete profiles[currentUser.username];
          return { profiles };
        });
      },
    }),
    {
      name: 'auth-storage', // unique name
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // v0 users were created before the `email` field existed - backfill it
      // instead of letting `.toLowerCase()` on undefined crash at login time.
      migrate: (persisted: any) => {
        if (persisted?.users) {
          persisted.users = persisted.users.map((u: any) => ({ email: '', ...u }));
        }
        return persisted;
      },
    }
  )
);
