import { create } from "zustand";

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

const useStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),

  theme: localStorage.getItem("theme") || getSystemTheme(),

  isManual: !!localStorage.getItem("theme"),

  // ✅ manual theme (user choice)
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    set({ theme, isManual: true });
  },

  // ✅ system theme (DO NOT SAVE)
  setSystemTheme: (theme) => {
    set((state) => {
      if (!state.isManual) {
        return { theme };
      }
      return {};
    });
  },

  setUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },

  currentProject: null,
  setProject: (p) => set({ currentProject: p }),
  clearProject: () => set({ currentProject: null }),

  logout: () => {
    localStorage.removeItem("user");
    set({ user: null, currentProject: null });
  },
}));

export default useStore;