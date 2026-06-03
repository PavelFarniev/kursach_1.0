import { create } from "zustand";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "kill-exam-theme";

const getSystemTheme = (): ThemeMode =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const resolveInitialTheme = (): ThemeMode => {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return getSystemTheme();
};

const applyTheme = (theme: ThemeMode): void => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
};

interface ThemeState {
  theme: ThemeMode;
  bootstrap: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: resolveInitialTheme(),

  bootstrap: () => {
    const theme = resolveInitialTheme();
    applyTheme(theme);
    set({ theme });
  },

  setTheme: (theme) => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    set({ theme });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === "dark" ? "light" : "dark";
    get().setTheme(nextTheme);
  },
}));
