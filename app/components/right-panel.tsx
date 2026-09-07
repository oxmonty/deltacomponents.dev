"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/registry/default/lib/utils";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { Button } from "@/registry/base/button";
import { NativeSelect, NativeSelectOption } from "@/lib/docs/native-select";
import {
  useShape,
  useShapeContext,
  type ShapeVariant,
} from "@/registry/default/lib/shape-context";
import { useSizeContext, type SizeVariant } from "@/registry/default/lib/size-context";
import { useThemeContext, type Theme } from "@/registry/default/lib/theme-context";
import { useIcon } from "@/registry/default/lib/icon-context";
import {
  useIconLibrary,
  iconLibraryOrder,
  iconLibraryLabels,
  type IconLibrary,
} from "@/lib/docs/icon-playground";
import { SurfaceProvider } from "@/registry/default/lib/surface-context";
import { RightRailTarget } from "@/lib/right-rail";
import { DocsToc } from "@/lib/docs/DocsToc";
import { AuthorCredit } from "@/app/components/author-credit";
import { showShortcutToast } from "@/lib/docs/settings-toast";
import { Tooltip } from "@/registry/base/tooltip";
import { ScrollArea } from "@/registry/base/scroll-area";
import { site } from "@/lib/config";

const REPO = site.repo;

function formatStars(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(n);
}

/** GitHub mark, shaped as an IconComponent so it can ride Button's leadingIcon slot. */
export function GitHubIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/** Standalone GitHub star-count button — rendered next to the "Customise" heading. */
// One fetch per page load, shared by every instance (right panel + the
// sidebar sheet's footer). Without the cache, each sheet open remounted the
// button and refired the unauthenticated API call — GitHub rate-limits those
// per IP, after which the count silently disappeared.
let cachedStars: number | null = null;
let starsPromise: Promise<number | null> | null = null;

function fetchStars(): Promise<number | null> {
  starsPromise ??= fetch(`https://api.github.com/repos/${REPO}`, {
    headers: { Accept: "application/vnd.github.v3+json" },
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data?.stargazers_count != null) cachedStars = data.stargazers_count;
      return cachedStars;
    })
    .catch(() => null);
  return starsPromise;
}

export function GitHubStarButton({ showCount = true }: { showCount?: boolean }) {
  const shapeCtx = useShape();
  const [stars, setStars] = useState<number | null>(cachedStars);

  useEffect(() => {
    // No count on screen, no reason to spend an unauthenticated call on it —
    // GitHub rate-limits those per IP, and the right panel needs the budget.
    if (!showCount || cachedStars !== null) return;
    let cancelled = false;
    fetchStars().then((count) => {
      if (!cancelled && count !== null) setStars(count);
    });
    return () => {
      cancelled = true;
    };
  }, [showCount]);

  return (
    <Button
      variant="ghost"
      size={showCount ? "sm" : "icon"}
      // An icon-only Button takes its glyph as children — `leadingIcon` is
      // deliberately ignored at that size, so passing it there renders an
      // empty button.
      leadingIcon={showCount ? GitHubIcon : undefined}
      aria-label="View on GitHub"
      className={shapeCtx.button}
      onClick={() =>
        window.open(
          `https://github.com/${REPO}`,
          "_blank",
          "noopener,noreferrer"
        )
      }
    >
      {!showCount && <GitHubIcon />}
      {showCount && stars !== null && (
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatStars(stars)}
        </span>
      )}
    </Button>
  );
}

/** The inner settings content — reused in the right column and mobile drawer. */
export function SettingsContent({ tooltipSide = "left" }: { tooltipSide?: "left" | "right" | "top" | "bottom" }) {
  const { theme, setTheme } = useThemeContext();
  const { shape, setShape } = useShapeContext();
  const { size, setSize } = useSizeContext();
  const { iconLibrary, setIconLibrary } = useIconLibrary();

  const MonitorIcon = useIcon("monitor");
  const SunIcon = useIcon("sun");
  const MoonIcon = useIcon("moon");
  const RectHorizIcon = useIcon("rectangle-horizontal");
  const CircleIcon = useIcon("circle");

  const themeOptions = [
    { label: "System", value: "system" as Theme, icon: MonitorIcon },
    { label: "Light", value: "light" as Theme, icon: SunIcon },
    { label: "Dark", value: "dark" as Theme, icon: MoonIcon },
  ];

  const shapeOptions = [
    { label: "Rounded", value: "rounded" as ShapeVariant, icon: RectHorizIcon },
    { label: "Pill", value: "pill" as ShapeVariant, icon: CircleIcon },
  ];

  const sizeOptions = [
    { label: "Default", value: "default" as SizeVariant },
    { label: "Compact", value: "compact" as SizeVariant },
  ];

  const iconOptions = iconLibraryOrder.map((lib) => ({
    label: iconLibraryLabels[lib],
    value: lib,
  }));

  // A native `<option>` can't carry a glyph — the platform draws the list — so
  // the icon that used to sit on every row now only marks the chosen value on
  // the closed control, which is where it was doing the work anyway.
  const ActiveThemeIcon = themeOptions.find((o) => o.value === theme)?.icon;
  const ActiveShapeIcon = shapeOptions.find((o) => o.value === shape)?.icon;

  return (
    <div className="flex flex-col gap-2">
      {/* Theme, Radius & Icons selects */}
      <div className="flex flex-col gap-1.5 py-3">
        <Tooltip content={<span>Press &ensp;<kbd className="font-mono opacity-50">T</kbd>&ensp; to cycle</span>} side={tooltipSide}>
          <div className="flex items-center justify-between">
            <span className="text-body text-muted-foreground">Theme</span>
            <NativeSelect
              aria-label="Theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
              icon={ActiveThemeIcon ? <ActiveThemeIcon size={16} strokeWidth={1.5} /> : undefined}
            >
              {themeOptions.map((o) => (
                <NativeSelectOption key={o.value} value={o.value}>
                  {o.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </Tooltip>
        <Tooltip content={<span>Press &ensp;<kbd className="font-mono opacity-50">R</kbd>&ensp; to toggle</span>} side={tooltipSide}>
          <div className="flex items-center justify-between">
            <span className="text-body text-muted-foreground">Radius</span>
            <NativeSelect
              aria-label="Radius"
              value={shape}
              onChange={(e) => setShape(e.target.value as ShapeVariant)}
              icon={ActiveShapeIcon ? <ActiveShapeIcon size={16} strokeWidth={1.5} /> : undefined}
            >
              {shapeOptions.map((o) => (
                <NativeSelectOption key={o.value} value={o.value}>
                  {o.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </Tooltip>
        <Tooltip content={<span>Press &ensp;<kbd className="font-mono opacity-50">S</kbd>&ensp; to toggle</span>} side={tooltipSide}>
          <div className="flex items-center justify-between">
            <span className="text-body text-muted-foreground">Size</span>
            <NativeSelect
              aria-label="Size"
              value={size}
              onChange={(e) => setSize(e.target.value as SizeVariant)}
            >
              {sizeOptions.map((o) => (
                <NativeSelectOption key={o.value} value={o.value}>
                  {o.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </Tooltip>
        <Tooltip content={<span>Press &ensp;<kbd className="font-mono opacity-50">I</kbd>&ensp; to cycle</span>} side={tooltipSide}>
          <div className="flex items-center justify-between">
            <span className="text-body text-muted-foreground">Icons</span>
            <NativeSelect
              aria-label="Icons"
              value={iconLibrary}
              onChange={(e) => setIconLibrary(e.target.value as IconLibrary)}
            >
              {iconOptions.map((o) => (
                <NativeSelectOption key={o.value} value={o.value}>
                  {o.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </Tooltip>
      </div>

    </div>
  );
}

/** Desktop-only right column that mirrors the left sidebar styling. */
export function RightPanel() {
  // The bare "]" key shows/hides the panel — the mirror of the left rail's
  // "[" (the sidebar provider only ever claims its own side's key, so "]" is
  // free while no right-side Sidebar is mounted). Same guards as the other
  // site shortcuts: no modifiers, and typing surfaces own their keys.
  const [open, setOpen] = useState(true);
  // The listener registers once; the ref keeps the current value in reach so
  // the toast can announce the RESULT without a setState-updater side effect.
  const openRef = useRef(open);
  openRef.current = open;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "]") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Below xl the panel doesn't render — a shortcut that visibly does
      // nothing (but toasts and flips state) reads as broken.
      if (!window.matchMedia("(min-width: 1280px)").matches) return;
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      )
        return;
      e.preventDefault();
      const next = !openRef.current;
      setOpen(next);
      showShortcutToast(
        "]",
        next ? "Properties panel expanded" : "Properties panel collapsed"
      );
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const PanelRightIcon = useIcon("panel-right");

  return (
    <>
      {/* Collapsed, the panel leaves a way back in its own top-right spot —
          the same ghost trigger the sidebar uses, mirrored. Permanently
          rendered (rather than mounted/unmounted) so the appear/disappear can
          be a plain CSS transition: `xl:` scopes the open state to desktop
          only (mirrors the old `max-xl:hidden`), and `inert` keeps it out of
          the tab order and off-screen readers while collapsed. */}
      <div
        data-open={!open || undefined}
        inert={open || undefined}
        className={cn(
          "fixed top-4 right-4 z-40 hidden opacity-0 scale-95",
          "transition-[opacity,transform,display] duration-(--motion-fast-exit) ease-spring transition-discrete",
          "xl:data-[open=true]:block xl:data-[open=true]:opacity-100 xl:data-[open=true]:scale-100 xl:data-[open=true]:duration-(--motion-fast)",
          "xl:starting:data-[open=true]:opacity-0 xl:starting:data-[open=true]:scale-95",
        )}
      >
        <Tooltip
          side="left"
          content={
            <span className="flex items-center gap-2">
              <span className="[text-box:trim-both_cap_alphabetic]">
                Expand properties panel
              </span>
              <kbd className="-my-1 flex h-4 min-w-4 items-center justify-center rounded border border-background/30 px-1 font-sans text-[10px] text-background/80">
                ]
              </kbd>
            </span>
          }
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label="Expand properties panel"
            onClick={() => setOpen(true)}
          >
            <PanelRightIcon />
          </Button>
        </Tooltip>
      </div>
    {/* max-xl:fixed — during the xl-fade-block fade-out the panel keeps
        display:block for the transition (allow-discrete), which would hold its
        264px of flex space and make the content reflow a second time when
        display finally flips to none. Fixed positioning below xl removes it
        from flow at the breakpoint (single reflow) while it fades in place:
        top-0/right-0 + mt-4 and the animated 16px marginRight land on the
        same 16px inset as the pinned sticky state. The wrapper carries the fade/sticky so pages can stack a
        second panel (RightRailTarget) below the settings.
        xl-fade-block sets display:block at ≥xl, so the flex column lives on an
        inner wrapper (else it would override `flex` and drop the gap).
        The "]" toggle animates width/margin (the sidebar-shell technique: the
        outer collapses while the inner keeps its true width) so the page
        content reflows into the space instead of snapping.
        Two independent fades (this breakpoint one, and the "]" toggle below)
        can't share one element in plain CSS the way a single framer `animate`
        call could — each needs its own transitioned element, and nested
        opacities multiply, so the panel is only visible when BOTH are 1. The
        breakpoint fade stays on this outer element; the "]" toggle's
        width/margin/opacity collapse moves to the wrapper just inside it. */}
    <div className="shrink-0 sticky top-4 self-start mt-4 xl-fade-block max-xl:fixed max-xl:top-0 max-xl:right-0 max-xl:z-40 max-xl:pointer-events-none">
      <div
        data-open={open}
        className={cn(
          "w-0 mr-0 opacity-0 pointer-events-none overflow-hidden",
          "transition-[width,margin-right,opacity] duration-(--motion-slow-exit) ease-spring",
          // 16px on the right, matching the 16px top (sticky top-4) and the
          // 16px the max-h calc leaves at the bottom — one even inset.
          "data-[open=true]:w-64 data-[open=true]:mr-4 data-[open=true]:opacity-100 data-[open=true]:pointer-events-auto data-[open=true]:duration-(--motion-slow)",
        )}
        // Collapsed is width:0 + opacity:0 — still in the DOM, so without
        // inert every control inside would stay tabbable and announced.
        inert={open ? undefined : true}
      >
      <div className="w-64">
      {/* Taller stacks (settings + playground controls) scroll within the
          viewport instead of running past it — the house ScrollArea (quiet
          thumb on the overlay ramp), scroll-fade dissolving the clipped
          edges. The fade sits on the viewport itself, so it starts at the
          panel's true edge — any breathing room lives INSIDE the scroller,
          under the mask, never outside pushing the gradient down. */}
      <ScrollArea viewportClassName="scroll-fade max-h-[calc(100svh-2rem)]">
      <div className="flex flex-col gap-3">
        <aside className="p-4 rounded-lg bg-muted">
          <SurfaceProvider value={2}>
            <div className="flex items-center justify-between pt-2 pb-2">
              <h2
                className="text-title text-foreground leading-none"
                style={{ fontVariationSettings: fontWeights.semibold }}
              >
                Customise
              </h2>
              <GitHubStarButton />
            </div>
            <SettingsContent tooltipSide="left" />
            {/* Desktop's home for the credit. Below xl this panel is gone and
                SiteFooter carries it instead. */}
            <AuthorCredit />
          </SurfaceProvider>
        </aside>

        {/* Under the properties card. The card is the panel's banner — on every
            page, and the thing the reader reaches for — so it holds the top of
            the rail and the page's own contents list follows it. Deliberately
            not a card itself: a list of links to read past, not a surface to
            act on, but padded to the card's inset so both columns of text line
            up. Renders nothing on a page with fewer than two headings. */}
        <DocsToc className="px-4 pt-2" />

        {/* Page-owned slot — e.g. the Card doc's Playground controls. */}
        <RightRailTarget />
      </div>
      </ScrollArea>
      </div>
      </div>
    </div>
    </>
  );
}
