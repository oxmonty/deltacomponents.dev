"use client";

import { useState } from "react";

import { useIcon } from "@/registry/lib/icon-context";
import { BottomNav, BottomNavItem } from "@/registry/ui/bottom-nav";
import { PhoneFrame } from "@/lib/docs/phone-frame";

// Photos rather than grey blocks, so the fade above the bar has colour and
// detail to dissolve. Seeded, so the feed is the same on every load.
const PHOTOS = Array.from(
  { length: 8 },
  (_, i) => `https://picsum.photos/seed/bottom-nav-${i}/600/450`
);

const LABELS: Record<string, string> = {
  home: "Home",
  search: "Search",
  likes: "Likes",
  profile: "Profile",
};

export default function BottomNavSolid() {
  const [value, setValue] = useState("home");
  const HomeIcon = useIcon("home");
  const SearchIcon = useIcon("search");
  const HeartIcon = useIcon("heart");
  const UserIcon = useIcon("user");

  return (
    <PhoneFrame route={value}>
      <p className="px-5 text-lg font-semibold">{LABELS[value]}</p>
      <div className="px-5">
        {PHOTOS.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element -- a mock feed, not a page asset
          <img key={src} src={src} alt="" loading="lazy" className="mt-3 aspect-4/3 w-full rounded-xl object-cover" />
        ))}
      </div>
      <BottomNav value={value} onValueChange={setValue} fade={0}>
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
  );
}
