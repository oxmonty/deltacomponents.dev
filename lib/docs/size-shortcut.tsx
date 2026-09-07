"use client";

import { useSizeContext } from "@/lib/docs/size-context";
import { useGlobalKey } from "@/lib/docs/use-global-key";

/**
 * Docs-site-only global shortcut: S toggles the size variant. Mount once
 * inside SizeProvider.
 */
export function SizeShortcut() {
  const { size, setSize } = useSizeContext();

  useGlobalKey("s", () => {
    setSize(size === "default" ? "compact" : "default");
  });

  return null;
}
