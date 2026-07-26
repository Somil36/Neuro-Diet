import { create } from 'zustand';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastState {
  message: string;
  visible: boolean;
  action?: ToastAction;
  show: (message: string, action?: ToastAction) => void;
  hide: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  visible: false,
  action: undefined,
  show: (message, action) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message, visible: true, action });
    hideTimer = setTimeout(() => set({ visible: false }), 3200);
  },
  hide: () => set({ visible: false }),
}));

// Callable from anywhere without needing the hook - one shared entry point
// instead of every screen building its own one-off notification. Pass an
// action (e.g. Undo) when the triggering change should be reversible.
export const showToast = (message: string, action?: ToastAction) => useToastStore.getState().show(message, action);
