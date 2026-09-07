"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Popover } from "@base-ui/react/popover";
import { cn } from "@/registry/lib/utils";
import { fontWeights } from "@/registry/lib/font-weight";
import { componentList, labelOf, sectionList } from "@/lib/docs/components";
import { StatusDot } from "@/app/components/sidebar";

function NavLink({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 text-2xl",
        // Press feedback, ported from the previous site's mobile nav. A tap on
        // a phone has no hover to confirm it landed, so the row answers with a
        // slight dip and a jump to full contrast — the only acknowledgement
        // before the route changes. `touch-manipulation` drops the browser's
        // 300ms double-tap wait, which is what otherwise makes a correct tap
        // feel ignored.
        "touch-manipulation transition-all duration-(--motion-fast) ease-spring",
        "active:scale-[0.99] active:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground"
      )}
      style={{
        fontVariationSettings: isActive ? fontWeights.semibold : fontWeights.medium,
      }}
    >
      {children}
    </Link>
  );
}

function NavGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-muted-foreground text-sm font-medium">{label}</div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

/**
 * Mobile header's hamburger trigger + nav popover — shadcn's mobile-nav.tsx
 * ported onto Base UI's Popover (this repo has no Radix). Base UI's
 * Positioner sets `--available-width`/`--available-height`, the same trick
 * Radix does with `--radix-popper-available-width`/`-height`, which is how
 * the panel fills the screen below the header.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Same approach as sidebar-layout.tsx's CloseSheetOnNavigate: a route
  // change closes the panel, rather than wiring every link's onClick.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    // `modal` locks the document's scroll and stops pointer interaction
    // reaching the page while the menu is open — without it the site scrolled
    // freely behind a panel that covers the whole screen. Base UI only holds
    // that lock on touch when the popup spans nearly the full viewport width,
    // which this one does (`--available-width` with `collisionPadding={0}`).
    <Popover.Root open={open} onOpenChange={setOpen} modal>
      <Popover.Trigger
        aria-label={open ? "Close menu" : "Open menu"}
        className={cn(
          "relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center",
          // The same press feedback as the rows it opens. Deeper, because the
          // trigger is a 32px target with nothing else to show it was hit.
          "touch-manipulation transition-all duration-(--motion-fast) ease-spring",
          "active:scale-95 active:opacity-70"
        )}
      >
        {/* Two bars that rotate into an X — shadcn's mobile-nav trigger, no
            third bar. aria-expanded/aria-haspopup come from Popover.Trigger
            itself. */}
        <span className="relative size-4">
          <span
            className={cn(
              "bg-foreground absolute left-0 block h-0.5 w-4 transition-all duration-(--motion-fast) ease-spring",
              open ? "top-[0.4rem] -rotate-45" : "top-1"
            )}
          />
          <span
            className={cn(
              "bg-foreground absolute left-0 block h-0.5 w-4 transition-all duration-(--motion-fast) ease-spring",
              open ? "top-[0.4rem] rotate-45" : "top-2.5"
            )}
          />
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        {/* The panel is sized to `--available-height`, which stops at the
            anchor's collision boundary — short of the bottom of the screen.
            iOS Safari's floating address bar is translucent and composites
            whatever the page draws underneath it, so that gap showed the
            scrolled page through the bar and in the strip above it. A backdrop
            in the same colour as the panel means there is nothing else to see,
            whatever height the panel lands on. `fixed inset-0` covers the
            layout viewport, which under `viewport-fit=cover` is the whole
            display. */}
        <Popover.Backdrop className="bg-background fixed inset-0 z-40" />
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={12}
          alignOffset={-16}
          // Base UI insets a popup from the viewport edge by default, which
          // pushed the panel 5px in and left its text hanging off the
          // hamburger's left edge. At 0 the panel is genuinely full-bleed, so
          // the content's own px-6 lands exactly on the trigger's icon: 16px
          // of header padding plus the 8px that centres a 16px glyph in a
          // 32px button.
          collisionPadding={0}
          className="z-50"
        >
          <Popover.Popup
            className={cn(
              "h-(--available-height) w-(--available-width) overflow-y-auto outline-none",
              "bg-background",
              "origin-top transition-[opacity,transform] duration-(--motion-moderate) ease-spring",
              "data-[instant]:duration-0",
              "data-[starting-style]:-translate-y-2 data-[starting-style]:opacity-0",
              "data-[ending-style]:-translate-y-2 data-[ending-style]:opacity-0 data-[ending-style]:duration-(--motion-moderate-exit)"
            )}
          >
            {/* Base UI enables focus trapping under `modal` only when a Close
                is rendered inside the popup, and touch screen readers need one
                to escape. Visually hidden: the hamburger above is the visible
                way out. */}
            <Popover.Close className="sr-only">Close menu</Popover.Close>
            <div className="flex flex-col gap-8 px-6 py-6">
              <NavGroup label="Menu">
                {sectionList.map((section) => (
                  <NavLink
                    key={section.href}
                    href={section.href}
                    isActive={pathname === section.href}
                  >
                    {section.name}
                  </NavLink>
                ))}
              </NavGroup>

              <NavGroup label="Components">
                {componentList.map((entry) => {
                  const href = `/docs/${entry.slug}`;
                  return (
                    <NavLink key={entry.slug} href={href} isActive={pathname === href}>
                      {labelOf(entry)}
                      <StatusDot entry={entry} />
                    </NavLink>
                  );
                })}
              </NavGroup>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
