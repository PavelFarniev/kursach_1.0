import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

let useThemeStore: typeof import("@/store/themeStore").useThemeStore;

beforeAll(async () => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  ({ useThemeStore } = await import("@/store/themeStore"));
});

describe("themeStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
    useThemeStore.setState({ theme: "light" });
  });

  it("bootstraps the stored theme and applies dark mode to the document", () => {
    window.localStorage.setItem("kill-exam-theme", "dark");

    useThemeStore.getState().bootstrap();

    expect(useThemeStore.getState().theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("toggles the theme and persists the new value", () => {
    useThemeStore.getState().setTheme("dark");

    useThemeStore.getState().toggleTheme();

    expect(useThemeStore.getState().theme).toBe("light");
    expect(window.localStorage.getItem("kill-exam-theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
  });
});
