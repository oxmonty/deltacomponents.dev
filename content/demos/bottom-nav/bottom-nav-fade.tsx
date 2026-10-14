"use client";

import { useState } from "react";

import { useIcon } from "@/registry/lib/icon-context";
import { BottomNav, BottomNavItem } from "@/registry/ui/bottom-nav";
import { PhoneFrame } from "@/lib/docs/phone-frame";

const LINES = Array.from(
  { length: 24 },
  (_, i) => `Line ${i + 1} of the page, scrolling up under the bar.`
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
      <label className="flex items-center gap-3 text-sm text-muted-foreground">
        fade
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={fade}
          onChange={(e) => setFade(Number(e.target.value))}
          className="w-40 accent-foreground"
        />
        <span className="w-8 tabular-nums text-foreground">{fade.toFixed(2)}</span>
      </label>
      <PhoneFrame route={value}>
        <div className="px-5 pb-28">
          {LINES.map((line, i) => (
            <p key={i} className="mt-3 text-sm">
              {line}
            </p>
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
