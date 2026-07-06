import { create } from 'zustand';
import { message } from 'antd';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  content: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: ({ type, content, duration = 3 }) => {
    const id = Date.now().toString();
    set((state) => ({ toasts: [...state.toasts, { id, type, content, duration }] }));
    if (type === 'success') message.success(content, duration);
    else if (type === 'error') message.error(content, duration);
    else if (type === 'warning') message.warning(content, duration);
    else message.info(content, duration);
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, duration * 1000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}));
