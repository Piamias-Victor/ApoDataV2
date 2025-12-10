// src/hooks/useToast.ts

import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  showToast: (toast) => {
    const id = Date.now().toString();
    const newToast = { ...toast, id };
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }));
    
    if (toast.duration) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter(t => t.id !== id)
        }));
      }, toast.duration);
    }
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  }
}));

export const useToast = () => {
  const { showToast, removeToast } = useToastStore();
  return { showToast, removeToast };
};