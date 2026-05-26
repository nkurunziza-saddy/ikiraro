import { create } from "zustand";

interface NewsState {
  activeCategory: string;
  readArticles: Set<string>;
  setActiveCategory: (cat: string) => void;
  markRead: (id: string) => void;
  markAllRead: (ids: string[]) => void;
}

export const useNewsStore = create<NewsState>((set) => ({
  activeCategory: "All",
  readArticles: new Set<string>(),
  setActiveCategory: (cat) => set({ activeCategory: cat }),
  markRead: (id) => set((s) => ({ readArticles: new Set([...s.readArticles, id]) })),
  markAllRead: (ids) => set({ readArticles: new Set(ids) }),
}));
