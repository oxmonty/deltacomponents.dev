"use client";

import { useEffect } from "react";

/**
 * Docs-site-only global single-key shortcut. Mount once per key inside the
 * relevant provider; bails on modifier keys, focused inputs, and while an
 * open popup owns the key for its own typeahead ("System", "Sort by", …).
 */
export function useGlobalKey(key: string, onPress: () => void) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      )
        return;
      // Don't steal the key from an open popup's typeahead — select/menu/
      // dialog content owns it while it has focus.
      if (
        target?.closest(
          '[role="listbox"], [role="menu"], [role="dialog"], [role="combobox"], [role="option"]'
        )
      )
        return;
      e.preventDefault();
      onPress();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [key, onPress]);
}
