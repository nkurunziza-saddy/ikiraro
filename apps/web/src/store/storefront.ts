import { create } from "zustand";
import type { Product } from "../components/store/mock-storefront";

interface StorefrontState {
  cart: Product[];
  isCheckingOut: boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  setCheckingOut: (v: boolean) => void;
}

export const useStorefrontStore = create<StorefrontState>((set) => ({
  cart: [],
  isCheckingOut: false,
  addToCart: (product) => set((s) => ({ cart: [...s.cart, product] })),
  removeFromCart: (index) => set((s) => ({ cart: s.cart.filter((_, i) => i !== index) })),
  clearCart: () => set({ cart: [] }),
  setCheckingOut: (v) => set({ isCheckingOut: v }),
}));
