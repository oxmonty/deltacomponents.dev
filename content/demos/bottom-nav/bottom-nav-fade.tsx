"use client";

import { useState } from "react";

import { useIcon } from "@/registry/lib/icon-context";
import { BottomNav, BottomNavItem } from "@/registry/ui/bottom-nav";
import { PhoneFrame } from "@/lib/docs/phone-frame";
import { Slider } from "@/app/components/ui/slider";

// Photos rather than grey blocks, so the fade above the bar has colour and
// detail to dissolve. Seeded, so the feed is the same on every load.
const PHOTOS = Array.from(
  { length: 8 },
  (_, i) => `https://picsum.photos/seed/bottom-nav-${i}/600/450`
);

// Each tab shows the same eight photos in its own fixed order, so a route
// change reshuffles the feed without fetching anything new.
const FEEDS: Record<string, string[]> = Object.fromEntries(
  ["home", "search", "likes", "profile"].map((route, r) => [
    route,
    PHOTOS.map((_, i) => PHOTOS[(i * 3 + r * 3) % PHOTOS.length]),
  ])
);

export default function BottomNavFade() {
  const [value, setValue] = useState("home");
  const [fade, setFade] = useState(0.5);
  const HomeIcon = useIcon("home");
  const SearchIcon = useIcon("search");
  const HeartIcon = useIcon("heart");
  const UserIcon = useIcon("user");

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-56 items-center gap-3 text-sm text-muted-foreground">
        fade
        <Slider
          aria-label="fade"
          min={0}
          max={1}
          step={0.05}
          value={fade}
          onValueChange={(v) => setFade(v as number)}
        />
        <span className="w-12 tabular-nums text-foreground">{fade.toFixed(2)}</span>
      </div>
      <PhoneFrame route={value}>
        <div className="px-5">
          {FEEDS[value].map((src) => (
            // eslint-disable-next-line @next/next/no-img-element -- a mock feed, not a page asset
            <img key={src} src={src} alt="" loading="lazy" className="mt-3 aspect-4/3 w-full rounded-xl object-cover" />
          ))}
        </div>
        <BottomNav value={value} onValueChange={setValue} fade={fade}>
          <BottomNavItem value="home" icon={<HomeIcon />}>
            Home
          </BottomNavItem>
          <BottomNavItem value="search" icon={<SearchIcon />}>
            Search
          </BottomNavItem>
          <BottomNavItem value="likes" icon={<HeartIcon />}>
            Likes
          </BottomNavItem>
          <BottomNavItem value="profile" icon={<UserIcon />}>
            Profile
          </BottomNavItem>
        </BottomNav>
      </PhoneFrame>
    </div>
  );
}
