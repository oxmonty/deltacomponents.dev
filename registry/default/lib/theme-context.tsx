"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

/** useLayoutEffect in the browser, useEffect on the server (where layout
 *  effects don't run and React warns about them). */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Theme = "system" | "light" | "dark";

const themeOrder: Theme[] = ["system", "light", "dark"];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** The theme actually being rendered — "system" resolved against the OS.
   *  Components that must branch on the real appearance (a code block picking
   *  a syntax palette, a canvas drawing its own colors) need this, because
   *  `theme === "system"` says nothing about which one is on screen.
   *  Always "light" on the server and the first client render, so markup
   *  matches at hydration; it settles after mount. */
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within a ThemeProvider");
  return ctx;
}

function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemIsDark, setSystemIsDark] = useState(false);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? (systemIsDark ? "dark" : "light") : theme;

  // Apply the resolved theme as a class on <html>, with every transition
  // suppressed for the duration of the swap — next-themes calls this
  // `disableTransitionOnChange`, and it is the behaviour www runs with. A
  // theme change is a discrete state change, not an animation: letting colours
  // tween means a beat where half the page is one theme and half the other,
  // and anything painting from JS (CodeBlock picks a whole syntax palette that
  // way) lands instantly while the CSS around it is still mid-fade.
  //
  // A LAYOUT effect, not a passive one, so the class lands in the same frame
  // as the render that read `resolvedTheme` — a passive effect can be painted
  // around, showing the new palette's code colours on the old theme's page.
  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    const style = document.createElement("style");
    style.appendChild(
      document.createTextNode(
        "*,*::before,*::after{transition:none!important}"
      )
    );
    document.head.appendChild(style);

    root.classList.toggle("dark", resolvedTheme === "dark");

    // Read a computed style to force the swap to flush while transitions are
    // still off; the style element can then go on the next tick.
    void window.getComputedStyle(document.body).opacity;
    const restore = setTimeout(() => style.remove(), 1);
    return () => {
      clearTimeout(restore);
      style.remove();
    };
  }, [resolvedTheme]);

  // Track the OS preference so "system" can resolve. Seeded from the same
  // media query the pre-paint script in app/layout.tsx reads, so the class on
  // <html> and this state agree from the first commit.
  useIsomorphicLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemIsDark(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Global keyboard shortcut: T to cycle theme
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "t" && e.key !== "T") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      // Just advance the state — the [theme] effect above applies the DOM.
      setThemeState((prev) => themeOrder[(themeOrder.indexOf(prev) + 1) % themeOrder.length]);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeProvider, useThemeContext };
export type { Theme };
