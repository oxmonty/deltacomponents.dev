"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

type SizeVariant = "default" | "compact";

interface SizeClasses {
  /** The variant these classes belong to — handy for conditionals. */
  variant: SizeVariant;
  /** Bounded control height — buttons, inputs, select triggers, subtle tabs —
   *  AND list/menu rows (select options, dropdown, checkbox and radio rows).
   *  One token by design: a popup row lines up with the trigger that opened
   *  it because they share this height. */
  control: string;
  /** `control` as a number, for consumers that need raw pixels. */
  controlHeight: number;
  /** Tab trigger height inside a padded segmented list. Sized so
   *  `segmentPad` + `segmentItem` adds back up to the control height —
   *  the segmented control's outer box stays on the same ladder. */
  segmentItem: string;
  /** Padding of the segmented list around its tabs. */
  segmentPad: string;
  /** Body text inside controls. */
  text: string;
  /** Horizontal padding of bounded controls (select trigger, inputs). */
  px: string;
  /** Horizontal padding of list/menu rows, which sit inside a padded popup
   *  or group and need less inset than a bounded control. */
  itemPx: string;
  /** Gap between an icon / control glyph and its label, and between
   *  neighbouring controls in a row (toolbars, filter bars, button
   *  clusters). Density is spacing as much as control height, so the
   *  compact step halves it. */
  gap: string;
  /** Glyph size in px: leading/trailing icons inside controls, and the
   *  checkbox square / radio circle. */
  icon: number;
}

const sizeMap: Record<SizeVariant, SizeClasses> = {
  // 36px — the default control height. Matches a 13px label with comfortable
  // breathing room and keeps controls a workable pointer target.
  default: {
    variant: "default",
    control: "h-9",
    controlHeight: 36,
    segmentItem: "h-7",
    segmentPad: "p-1",
    text: "text-[13px]",
    px: "px-3",
    itemPx: "px-2",
    gap: "gap-2",
    icon: 16,
  },
  // 28px — the compact height for dense surfaces: filter bars, toolbars,
  // table headers, sidebars. One step down in text (12px) and icon (14px)
  // so the whole control shrinks together, not just its box.
  compact: {
    variant: "compact",
    control: "h-7",
    controlHeight: 28,
    segmentItem: "h-6",
    segmentPad: "p-0.5",
    text: "text-[12px]",
    px: "px-2.5",
    itemPx: "px-1.5",
    gap: "gap-1",
    icon: 14,
  },
};

/** One role of the type scale: px per ladder step. */
interface TypeScaleStep {
  default: number;
  compact: number;
}

/**
 * Role-based type scale, per ladder step (px values).
 *
 * The default column is the system as shipped; the compact column steps each
 * role down one notch so dense regions read as a smaller sibling of the same
 * hierarchy, not a squeezed copy. `body`, `caption`, and `subtitle` are what
 * the sized components already render through `SizeClasses.text` and their
 * compact conditionals; `display` and `title` are the page-level roles
 * for consumers composing their own screens.
 */
const typeScale = {
  /** Page titles. */
  display: { default: 30, compact: 26 },
  /** Section headings, dialog titles. */
  title: { default: 18, compact: 17 },
  /** Doc/reading copy. Site chrome only — components size text off `body`. */
  prose: { default: 16, compact: 15 },
  /** Card titles, chat bubbles, emphasized rows. */
  subtitle: { default: 15, compact: 14 },
  /** Control labels and body copy — `SizeClasses.text`. */
  body: { default: 13, compact: 12 },
  /** Secondary text: descriptions, meta rows, errors, eyebrows and group
   *  labels (the former overline role — an uppercase or muted caption). */
  caption: { default: 13, compact: 12 },
} as const satisfies Record<string, TypeScaleStep>;

type TypeScaleRole = keyof typeof typeScale;

/** The type scale resolved for the active ladder step (px per role):
 *  explicit override > surrounding SizeProvider > "default". */
function useTypeScale(
  override?: SizeVariant | null
): Record<TypeScaleRole, number> {
  const variant = useSizeVariant(override);
  return {
    display: typeScale.display[variant],
    title: typeScale.title[variant],
    prose: typeScale.prose[variant],
    subtitle: typeScale.subtitle[variant],
    body: typeScale.body[variant],
    caption: typeScale.caption[variant],
  };
}

interface SizeContextValue {
  size: SizeVariant;
  setSize: (size: SizeVariant) => void;
  classes: SizeClasses;
}

const SizeContext = createContext<SizeContextValue | null>(null);

/** Resolve the active size variant: explicit prop > provider > "default". */
function useSizeVariant(override?: SizeVariant | null): SizeVariant {
  const ctx = useContext(SizeContext);
  return override ?? ctx?.size ?? "default";
}

/** Resolve size classes: explicit prop > provider > "default". */
function useSize(override?: SizeVariant | null): SizeClasses {
  return sizeMap[useSizeVariant(override)];
}

function useSizeContext() {
  const ctx = useContext(SizeContext);
  if (!ctx) throw new Error("useSizeContext must be used within a SizeProvider");
  return ctx;
}

/**
 * Site-chrome only. Published registry components don't consume this — they
 * read the `--control-*` custom properties in globals.css directly, scoped by
 * the `data-size` attribute this provider writes onto `<html>`. This context
 * exists so the docs site's own chrome (the Customise card, the sidebar,
 * DocHeader, …) can read/set the live size variant and get the matching
 * Tailwind classes without re-deriving them from the attribute.
 */
function SizeProvider({
  children,
  size,
  defaultSize = "default",
}: {
  children: ReactNode;
  /** Controlled variant — pin a whole region to one size (e.g. a compact
   *  filter bar). Overrides internal state. */
  size?: SizeVariant;
  defaultSize?: SizeVariant;
}) {
  // SidebarMenu nests a scoped SizeProvider per-instance to pin a subtree's
  // *React consumers* (useSize/useSizeVariant) without touching <html> — only
  // the outermost provider (no ambient SizeContext above it) owns the
  // document-level attribute, so a nested one mounting/unmounting can't stomp
  // the app-wide size the root provider is tracking.
  const isRoot = useContext(SizeContext) === null;
  const [internalSize, setInternalSize] = useState<SizeVariant>(defaultSize);
  const isControlled = size !== undefined;
  const resolved = size ?? internalSize;

  // Controlled providers ignore setSize entirely — a background write to the
  // shadowed internal state would pop back out if the size prop were later
  // removed.
  const setSize = useCallback(
    (next: SizeVariant) => {
      if (isControlled) return;
      setInternalSize(next);
    },
    [isControlled]
  );

  // Mirrors the active size onto `<html data-size>` so the plain-CSS
  // `--control-*`/`--fs-*` tokens in globals.css (which registry components
  // and docs typography read directly) follow it.
  useEffect(() => {
    if (!isRoot) return;
    document.documentElement.dataset.size = resolved;
    return () => {
      delete document.documentElement.dataset.size;
    };
  }, [isRoot, resolved]);

  const value = useMemo(
    () => ({ size: resolved, setSize, classes: sizeMap[resolved] }),
    [resolved, setSize]
  );

  return <SizeContext.Provider value={value}>{children}</SizeContext.Provider>;
}

export {
  SizeProvider,
  useSize,
  useSizeVariant,
  useSizeContext,
  useTypeScale,
  sizeMap,
  typeScale,
};
export type { SizeVariant, SizeClasses, TypeScaleRole, TypeScaleStep };
