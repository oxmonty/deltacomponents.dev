"use client";

import {
  useEffect,
  useRef,
  forwardRef,
  type ReactNode,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/registry/lib/utils";
import { useSurface, SurfaceProvider } from "@/registry/lib/surface-context";
import { surfaceClasses } from "@/registry/lib/surface-classes";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
  useSidebar,
  SidebarShell,
  type SidebarSide,
  type SidebarVariant,
  type SidebarCollapsible,
} from "@/app/components/ui/sidebar-core";

// ─── Mobile sheet ────────────────────────────────────────────────────────────
//
// Built on Base UI Dialog rather than Base UI Drawer: Drawer's
// swipe-to-dismiss writes inline `transform` + `--drawer-swipe-movement-*`
// CSS vars onto its Popup, which would fight a plain CSS slide transition on
// the same element. Dialog provides everything we actually need — scroll
// lock, focus trap, focus restore, Esc + outside-click dismissal, and (via
// `data-starting-style`/`data-ending-style`) holding the popup mounted for
// the duration of the exit transition — so the slide is a CSS transition on
// the popup itself.

interface SidebarSheetProps {
  side: SidebarSide;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

function SidebarSheet({ side, open, onClose, children }: SidebarSheetProps) {
  const { widthMobile } = useSidebar();
  // The panel takes initial focus itself. Left to the primitive, the focus
  // trap lands on the first focusable child — the top nav row — which reads
  // as a selected item the moment the drawer opens, and Chrome grants
  // :focus-visible to script-driven focus so it shows the keyboard ring too.
  const panelRef = useRef<HTMLDivElement | null>(null);
  const substrate = useSurface();
  const level = Math.min(substrate + 2, 8);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        {/* Scrim: an always-on bg-black/40 base that stays visible for
            system-dark users (`dark:` only matches the explicit .dark class),
            boosted to /80 in explicit dark mode. */}
        <DialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 z-40 bg-black/40 dark:bg-black/80",
            "transition-opacity duration-(--motion-moderate) ease-spring",
            "data-[ending-style]:duration-(--motion-moderate-exit)",
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
          )}
        />

        <DialogPrimitive.Popup
          ref={panelRef}
          aria-label="Sidebar"
          initialFocus={panelRef}
          tabIndex={-1}
          data-sidebar="sidebar"
          data-mobile="true"
          data-side={side}
          className={cn(
            "fixed inset-y-0 z-50 flex flex-col overflow-hidden outline-none",
            "data-[closed]:pointer-events-none",
            side === "left" ? "left-0" : "right-0",
            surfaceClasses(level, 3),
            "transition-transform duration-(--motion-moderate) ease-spring",
            "data-[ending-style]:duration-(--motion-moderate-exit)",
            side === "left"
              ? "data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full"
              : "data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full"
          )}
          style={{ width: widthMobile } as CSSProperties}
        >
          <SurfaceProvider value={level}>{children}</SurfaceProvider>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export interface SidebarProps extends HTMLAttributes<HTMLDivElement> {
  side?: SidebarSide;
  variant?: SidebarVariant;
  /** `"icon"` collapse is intentionally not supported — offcanvas or none. */
  collapsible?: SidebarCollapsible;
  /** The `sidebar` variant's inner-edge border. Default true. */
  bordered?: boolean;
  /** Pin the rail's tooltip open (`true`) or closed (`false`); `undefined`
   *  leaves it on hover. Dragging always hides it. */
  railTooltipOpen?: boolean;
  /** Render the built-in resize/collapse rail. Default true. */
  rail?: boolean;
}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  (
    { side = "left", variant = "sidebar", collapsible = "offcanvas", bordered = true, rail = true, railTooltipOpen, className, style, children, ...props },
    ref
  ) => {
    const { isMobile, openMobile, setOpenMobile, width, registerSide } = useSidebar();

    // The provider mirrors the side into the default shortcut ("[" / "]")
    // and the rail handle.
    useEffect(() => registerSide(side), [side, registerSide]);

    if (collapsible === "none") {
      return (
        <div
          ref={ref}
          data-slot="sidebar"
          data-variant={variant}
          data-side={side}
          className={cn(
            "peer sticky top-0 flex h-svh shrink-0 flex-col",
            side === "right" && "order-last",
            className
          )}
          style={{ width, ...style } as CSSProperties}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className={cn(
              "flex h-full w-full min-h-0 flex-col",
              bordered &&
                variant === "sidebar" &&
                (side === "left" ? "border-r border-border" : "border-l border-border")
            )}
          >
            {children}
          </div>
        </div>
      );
    }

    // The desktop shell stays MOUNTED across the drawer breakpoint — its
    // breakpoint classes fade it out (opacity + display, allow-discrete)
    // instead of this component unmounting it, which snapped the rail away
    // the instant the window shrank. The sheet mounts alongside it below the
    // breakpoint; the hidden shell costs nothing visible (display: none).
    return (
      <>
        {isMobile && (
          <SidebarSheet side={side} open={openMobile} onClose={() => setOpenMobile(false)}>
            {children}
          </SidebarSheet>
        )}
        <SidebarShell ref={ref} side={side} variant={variant} bordered={bordered} rail={rail} railTooltipOpen={railTooltipOpen} className={className} style={style} {...props}>
          {children}
        </SidebarShell>
      </>
    );
  }
);
Sidebar.displayName = "Sidebar";

// ─── SidebarContent ──────────────────────────────────────────────────────────

export interface SidebarContentProps extends HTMLAttributes<HTMLDivElement> {
  viewportClassName?: string;
}

const SidebarContent = forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ className, viewportClassName, children, ...props }, ref) => {
    const { isMobile } = useSidebar();

    // Inside the mobile sheet, the sheet's flex column owns layout and this
    // region scrolls natively — a nested ScrollArea would double-scroll. The
    // boundary hairline still needs a frame to ride: scroll-divider can't sit
    // on the scroller itself (its own fade mask would erase the line), so the
    // region is wrapped the way ScrollArea wraps its viewport on desktop.
    if (isMobile) {
      return (
        <div className="scroll-divider [--scroll-divider-inset:8px] flex min-h-0 w-full flex-1 flex-col">
          <div
            ref={ref}
            data-sidebar="content"
            className={cn("scroll-fade flex min-h-0 w-full flex-1 flex-col overflow-y-auto", className)}
            {...props}
          >
            {children}
          </div>
        </div>
      );
    }

    // The scroll primitive wraps children in an inline-styled sizer that
    // sizes to content — rows would stop shrinking near the min width
    // instead of truncating, so the viewport's direct child is forced back
    // to a plain shrinkable block.
    return (
      <ScrollArea className={cn("scroll-divider min-h-0 w-full flex-1", className)} viewportClassName={cn("scroll-fade [&>div]:!block [&>div]:!min-w-0", viewportClassName)}>
        <div ref={ref} data-sidebar="content" className="flex w-full min-w-0 flex-col" {...props}>
          {children}
        </div>
      </ScrollArea>
    );
  }
);
SidebarContent.displayName = "SidebarContent";

export { Sidebar, SidebarContent };

// Re-export the flavor-neutral parts so `sidebar` is a one-stop import.
export {
  SidebarProvider,
  useSidebar,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
  SidebarInput,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupActions,
  SidebarGroupContent,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_MOBILE,
  SIDEBAR_KEYBOARD_SHORTCUT,
  SIDEBAR_KEYBOARD_SHORTCUT_RIGHT,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_MAX_WIDTH,
} from "@/app/components/ui/sidebar-core";
export type {
  SidebarContextValue,
  SidebarProviderProps,
  SidebarTriggerProps,
  SidebarRailProps,
  SidebarInsetProps,
  SidebarInputProps,
  SidebarSectionProps,
  SidebarGroupLabelProps,
  SidebarGroupActionProps,
  SidebarSide,
  SidebarVariant,
  SidebarCollapsible,
} from "@/app/components/ui/sidebar-core";
export {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuActions,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  sidebarMenuButtonVariants,
} from "@/app/components/ui/sidebar-menu";
export type {
  SidebarMenuProps,
  SidebarMenuItemProps,
  SidebarMenuButtonProps,
  SidebarMenuActionProps,
  SidebarMenuBadgeProps,
  SidebarMenuSkeletonProps,
  SidebarMenuSubProps,
  SidebarMenuSubItemProps,
  SidebarMenuSubButtonProps,
} from "@/app/components/ui/sidebar-menu";
