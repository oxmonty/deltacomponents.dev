"use client";

import { useState } from "react";

import { BottomNav, BottomNavItem } from "@/registry/ui/bottom-nav";
import { PhoneFrame } from "@/lib/docs/phone-frame";

// Icon pairs as path data: the outline the bar rests at and the fill it
// switches to when the item is active. Search and Create have no filled
// form and are only recoloured.
export const ICONS = {
  home: {
    outline:
      "M13.4056 3.72522C12.5838 3.06783 11.4162 3.06783 10.5944 3.72522L4.28209 8.7751C3.62975 9.29697 3.25 10.0871 3.25 10.9225V18C3.25 19.5188 4.48122 20.75 6 20.75H18C19.5188 20.75 20.75 19.5188 20.75 18V10.9225C20.75 10.0871 20.3703 9.29697 19.7179 8.7751L13.4056 3.72522ZM9.0327 1.77305C10.7675 0.385221 13.2325 0.38522 14.9673 1.77305L21.2796 6.82293C22.525 7.81923 23.25 9.32762 23.25 10.9225V18C23.25 20.8995 20.8995 23.25 18 23.25H6C3.1005 23.25 0.75 20.8995 0.75 18V10.9225C0.75 9.32763 1.47497 7.81923 2.72035 6.82293L9.0327 1.77305Z",
    filled:
      "M9.0327 1.77305C10.7675 0.385221 13.2325 0.38522 14.9673 1.77305L21.2796 6.82293C22.525 7.81923 23.25 9.32762 23.25 10.9225V18C23.25 20.8995 20.8995 23.25 18 23.25H6C3.1005 23.25 0.75 20.8995 0.75 18V10.9225C0.75 9.32763 1.47497 7.81923 2.72035 6.82293L9.0327 1.77305Z",
  },
  search: {
    outline:
      "M11.2607 1.01074C5.59982 1.01074 1.01074 5.59982 1.01074 11.2607C1.01074 16.9217 5.59982 21.5107 11.2607 21.5107C13.6407 21.5107 15.8312 20.6996 17.5709 19.3387L20.8554 22.6231C21.3435 23.1113 22.135 23.1113 22.6231 22.6231C23.1113 22.135 23.1113 21.3435 22.6231 20.8554L19.3387 17.5709C20.6996 15.8312 21.5107 13.6407 21.5107 11.2607C21.5107 5.59982 16.9217 1.01074 11.2607 1.01074ZM3.51074 11.2607C3.51074 6.98053 6.98054 3.51074 11.2607 3.51074C15.5409 3.51074 19.0107 6.98053 19.0107 11.2607C19.0107 15.541 15.5409 19.0107 11.2607 19.0107C6.98054 19.0107 3.51074 15.541 3.51074 11.2607Z",
  },
  create: {
    outline:
      "M13.25 3.00001C13.25 2.30965 12.6904 1.75001 12 1.75001C11.3096 1.75001 10.75 2.30965 10.75 3.00001V10.75H3C2.30964 10.75 1.75 11.3097 1.75 12C1.75 12.6904 2.30964 13.25 3 13.25H10.75V21C10.75 21.6904 11.3096 22.25 12 22.25C12.6904 22.25 13.25 21.6904 13.25 21V13.25H21C21.6904 13.25 22.25 12.6904 22.25 12C22.25 11.3097 21.6904 10.75 21 10.75H13.25V3.00001Z",
  },
  heart: {
    outline:
      "M16.4045 1.50879C14.785 1.50879 13.2185 2.16259 12 3.30764C10.7815 2.16259 9.215 1.50879 7.5955 1.50879C3.41766 1.50879 0.5 4.62796 0.5 9.09411C0.5 13.7857 4.70617 18.9703 11.2153 22.3022C11.4605 22.428 11.7298 22.4912 11.9995 22.4912C12.2692 22.4912 12.5395 22.428 12.7847 22.3022C19.2938 18.9703 23.5 13.7857 23.5 9.09411C23.5 4.62796 20.5823 1.50879 16.4045 1.50879ZM12 19.9518C6.65166 17.1137 2.94684 12.6864 2.94684 9.09411C2.94684 5.97251 4.77133 3.95556 7.5955 3.95556C9.825 3.95556 11.0773 5.80961 12 7.26504C12.9227 5.80961 14.175 3.95556 16.4045 3.95556C19.2287 3.95556 21.0532 5.97251 21.0532 9.09411C21.0532 12.6864 17.3483 17.1137 12 19.9518Z",
    filled:
      "M16.4045 1.50879C14.785 1.50879 13.2185 2.16259 12 3.30764C10.7815 2.16259 9.215 1.50879 7.5955 1.50879C3.41766 1.50879 0.5 4.62796 0.5 9.09411C0.5 13.7857 4.70617 18.9703 11.2153 22.3022C11.4605 22.428 11.7298 22.4912 11.9995 22.4912C12.2692 22.4912 12.5395 22.428 12.7847 22.3022C19.2938 18.9703 23.5 13.7857 23.5 9.09411C23.5 4.62796 20.5823 1.50879 16.4045 1.50879Z",
  },
  profile: {
    outline:
      "M12 0.75C8.82431 0.75 6.25 3.32437 6.25 6.5C6.25 9.67563 8.82431 12.25 12 12.25C15.1757 12.25 17.75 9.67563 17.75 6.5C17.75 3.32437 15.1757 0.75 12 0.75ZM8.75 6.5C8.75 4.70507 10.205 3.25 12 3.25C13.795 3.25 15.25 4.70507 15.25 6.5C15.25 8.29493 13.795 9.75 12 9.75C10.205 9.75 8.75 8.29493 8.75 6.5ZM12.0003 13.75C6.97423 13.75 2.73384 17.086 1.30779 21.6254C1.10089 22.284 1.46707 22.9856 2.1257 23.1925C2.78432 23.3994 3.48596 23.0333 3.69287 22.3746C4.80482 18.835 8.10976 16.25 12.0003 16.25C15.8909 16.25 19.1958 18.835 20.3078 22.3746C20.5147 23.0333 21.2163 23.3994 21.8749 23.1925C22.5336 22.9856 22.8997 22.284 22.6928 21.6254C21.2668 17.086 17.0264 13.75 12.0003 13.75Z",
    filled:
      "M12 0.75C8.82431 0.75 6.25 3.32437 6.25 6.5C6.25 9.67563 8.82431 12.25 12 12.25C15.1757 12.25 17.75 9.67563 17.75 6.5C17.75 3.32437 15.1757 0.75 12 0.75ZM12 13.75C7.51601 13.75 3.65758 16.4063 1.86595 20.1981C1.12621 21.7637 2.41318 23.25 3.86237 23.25H20.1377C21.5869 23.25 22.8738 21.7637 22.1341 20.1981C20.3425 16.4063 16.484 13.75 12 13.75Z",
  },
};

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

// Both forms are rendered and CSS picks one off the item's `data-state`, so
// the swap needs nothing from the component: an active item simply shows
// its filled glyph.
export function FilledOnActive({ outline, filled }: { outline: string; filled?: string }) {
  if (!filled) return <Glyph d={outline} />;
  return (
    <>
      <span className="contents group-data-[state=active]/item:hidden">
        <Glyph d={outline} />
      </span>
      <span className="hidden group-data-[state=active]/item:contents">
        <Glyph d={filled} />
      </span>
    </>
  );
}

const PHOTOS = Array.from(
  { length: 8 },
  (_, i) => `https://picsum.photos/seed/bottom-nav-${i}/600/450`
);

const ITEMS: { value: string; label: string; icon: keyof typeof ICONS }[] = [
  { value: "home", label: "Home", icon: "home" },
  { value: "search", label: "Search", icon: "search" },
  { value: "create", label: "Create", icon: "create" },
  { value: "activity", label: "Activity", icon: "heart" },
  { value: "profile", label: "Profile", icon: "profile" },
];

// Each tab shows the same eight photos in its own fixed order, so a route
// change reshuffles the feed without fetching anything new.
const FEEDS: Record<string, string[]> = Object.fromEntries(
  ITEMS.map(({ value: route }, r) => [
    route,
    PHOTOS.map((_, i) => PHOTOS[(i * 3 + r * 3) % PHOTOS.length]),
  ])
);

export default function BottomNavOverrideStyling() {
  const [value, setValue] = useState("home");

  return (
    <PhoneFrame route={value}>
      <p className="px-5 text-lg font-semibold">{ITEMS.find((i) => i.value === value)?.label}</p>
      <div className="px-5">
        {FEEDS[value].map((src) => (
          // eslint-disable-next-line @next/next/no-img-element -- a mock feed, not a page asset
          <img key={src} src={src} alt="" loading="lazy" className="mt-3 aspect-4/3 w-full rounded-xl object-cover" />
        ))}
      </div>
      {/* A translucent bar that blurs the feed under it, in place of the
          fade: the solid variant with its background made see-through. */}
      <BottomNav
        value={value}
        onValueChange={setValue}
        labels={false}
        gradient={false}
        className="bg-background/85 backdrop-blur-lg"
      >
        {ITEMS.map((item) => (
          <BottomNavItem
            key={item.value}
            value={item.value}
            icon={<FilledOnActive {...ICONS[item.icon]} />}
            // The Create item sits on a tile, reached through its icon slot:
            // a muted rounded box around the glyph and nothing else.
            className={
              item.value === "create"
                ? "**:data-[slot=bottom-nav-icon]:rounded-xl **:data-[slot=bottom-nav-icon]:bg-muted **:data-[slot=bottom-nav-icon]:px-[18px] **:data-[slot=bottom-nav-icon]:py-2"
                : undefined
            }
          >
            {item.label}
          </BottomNavItem>
        ))}
      </BottomNav>
    </PhoneFrame>
  );
}

