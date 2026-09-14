"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/registry/lib/utils";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/app/components/ui/sidebar";
import { SiteSidebar } from "@/app/components/sidebar";
import { SiteHeader } from "@/app/components/site-header";
import { RightPanel } from "@/app/components/right-panel";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteCommandMenu, SiteCommandMenuProvider } from "@/app/components/site-command-menu";
import { RightRailProvider } from "@/lib/right-rail";
import { showShortcutToast } from "@/lib/docs/settings-toast";
import { pageOrder } from "@/lib/docs/components";

// Left/right arrows walk the same order the sidebar and pager use.
const pagePaths = pageOrder.map((p) => p.href);

/** Set on <html> by the root layout's inline script when the sidebar_state
 *  cookie says collapsed; see SidebarCookieSync. app/layout.tsx repeats the
 *  literal (a server component can't import a client module's constant), so
 *  change both. */
const SIDEBAR_COLLAPSED_CLASS = "sidebar-collapsed";

/** Toasts the sidebar's "[" toggle the way the settings shortcuts toast
 *  theirs: a bare "[" press arms a short window, and the provider's own
 *  open-state change within it surfaces the result. Pointer-driven toggles
 *  (trigger clicks, the rail) stay silent, like every other setting. */
function SidebarShortcutToast() {
  const { open } = useSidebar();
  const pendingAtRef = useRef<number | null>(null);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "[") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      )
        return;
      pendingAtRef.current = e.timeStamp;
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
  const prevOpenRef = useRef<boolean | null>(null);
  useEffect(() => {
    const prev = prevOpenRef.current;
    prevOpenRef.current = open;
    if (prev === null || prev === open) return;
    const at = pendingAtRef.current;
    if (at === null || performance.now() - at > 300) return;
    pendingAtRef.current = null;
    showShortcutToast("[", open ? "Sidebar expanded" : "Sidebar collapsed");
  }, [open]);
  return null;
}

/** Desktop reopen affordance: collapsing the rail (the "[" key, the rail
 *  click) would otherwise leave NO visible way back — the layout's only
 *  trigger is the mobile one. The trigger fades in at the rail's
 *  top-left, carrying its own "Expand sidebar [" tooltip, and fades away
 *  once the rail is open again — the mirror of the right panel's
 *  "Properties panel" reopen button. */
function DesktopReopenTrigger() {
  const { open } = useSidebar();
  return (
    // Permanently rendered (rather than mounted/unmounted) so the
    // appear/disappear is a plain CSS transition: `lg:` scopes the open state
    // to desktop only (mirrors the old `max-xl:hidden`), and `inert` keeps it
    // out of the tab order and off-screen readers while the rail is expanded.
    <div
      data-open={!open || undefined}
      inert={open || undefined}
      className={cn(
        "fixed top-4 left-4 z-50 hidden opacity-0 scale-95",
        "transition-[opacity,transform,display] duration-(--motion-fast-exit) ease-spring transition-discrete",
        "lg:data-[open=true]:block lg:data-[open=true]:opacity-100 lg:data-[open=true]:scale-100 lg:data-[open=true]:duration-(--motion-fast)",
        "lg:starting:data-[open=true]:opacity-0 lg:starting:data-[open=true]:scale-95",
      )}
    >
      <SidebarTrigger />
    </div>
  );
}

/** Restores the persisted collapsed state on the client. The root layout is
 *  static (reading the cookie on the server made every page dynamic, which
 *  pushed the metadata out of <head> and made nothing cacheable), so the
 *  inline script in app/layout.tsx puts `sidebar-collapsed` on <html> before
 *  first paint and globals.css pins the rail shut under it. This syncs React
 *  to that, then lifts the class only once the state matches — lifting it
 *  earlier would let the width transition run from 16rem to 0. */
function SidebarCookieSync() {
  const { open, setOpen } = useSidebar();
  useLayoutEffect(() => {
    if (document.documentElement.classList.contains(SIDEBAR_COLLAPSED_CLASS)) setOpen(false);
  }, [setOpen]);
  useEffect(() => {
    if (!open) document.documentElement.classList.remove(SIDEBAR_COLLAPSED_CLASS);
  }, [open]);
  return null;
}

/** Closes the mobile sheet whenever the route changes. */
function CloseSheetOnNavigate() {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);
  return null;
}

export function SidebarLayout({
  children,
  stars = null,
}: {
  children: ReactNode;
  /** GitHub star count, fetched by the root layout on the server. */
  stars?: number | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // Arrow key navigation between pages — ref-based so held keys keep advancing
  // (closures over `pathname` would re-bind per nav and lose key-repeat events).
  const expectedIndexRef = useRef(pagePaths.indexOf(pathname));
  useEffect(() => {
    expectedIndexRef.current = pagePaths.indexOf(pathname);
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      const tag = (e.target as HTMLElement).tagName;
      const role = (e.target as HTMLElement).getAttribute("role");
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement).isContentEditable ||
        role === "slider" ||
        role === "tablist" ||
        role === "radiogroup" ||
        role === "listbox" ||
        role === "menu"
      ) return;

      // Also skip if focus is inside a component that uses arrow keys
      const closest = (e.target as HTMLElement).closest(
        "[role=slider],[role=tablist],[role=radiogroup],[role=listbox],[role=menu],[role=menubar]"
      );
      if (closest) return;

      const currentIndex = expectedIndexRef.current;
      if (currentIndex === -1) return;

      const nextIndex = e.key === "ArrowLeft" ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= pagePaths.length) return;

      e.preventDefault();
      expectedIndexRef.current = nextIndex;
      router.push(pagePaths[nextIndex]);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);


  return (
    <RightRailProvider>
      <SiteCommandMenuProvider>
      {/* The Sidebar component, dogfooded: the provider owns the desktop
          collapse ("[" + cookie persistence, restored by SidebarCookieSync)
          and the mobile sheet. The rail shows from lg (1024) — a laptop-width
          window keeps it — while the right panel waits for xl; between the
          two the mobile header stays for its theme and GitHub controls, minus
          the hamburger. */}
      <SidebarProvider mobileBreakpoint={1024} className="min-h-screen">
        <SiteSidebar />
        <SidebarCookieSync />
        <CloseSheetOnNavigate />
        <SiteCommandMenu />

        {/* Desktop collapse uses [ or the rail; mobile's own menu lives in
            SiteHeader now, which replaces this sidebar's sheet on phones. */}
        <DesktopReopenTrigger />
        <SidebarShortcutToast />

        {/* Main content */}
        <SidebarInset className="min-w-0">
          <SiteHeader />
          {children}
          <SiteFooter />
        </SidebarInset>

        {/* Desktop right panel */}
        <RightPanel stars={stars} />
      </SidebarProvider>
      </SiteCommandMenuProvider>
    </RightRailProvider>
  );
}

export default SidebarLayout;
