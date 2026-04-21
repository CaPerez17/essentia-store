"use client";

import { create } from "zustand";

export interface ToastItem {
  id: string;
  productName: string;
  productBrand: string;
  productImage?: string;
}

interface ToastState {
  toast: ToastItem | null;
  show: (t: Omit<ToastItem, "id">) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (t) => {
    const id = crypto.randomUUID();
    set({ toast: { ...t, id } });
    // Auto-dismiss after 3s (matched to the active toast id to avoid race)
    setTimeout(() => {
      set((state) => (state.toast?.id === id ? { toast: null } : state));
    }, 3000);
  },
  hide: () => set({ toast: null }),
}));
