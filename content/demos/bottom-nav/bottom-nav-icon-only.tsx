"use client";

import { useState } from "react";

import { useIcon } from "@/registry/lib/icon-context";
import { BottomNav, BottomNavItem } from "@/registry/ui/bottom-nav";
import { PhoneFrame } from "@/lib/docs/phone-frame";

const LABELS: Record<string, string> = {
  home: "Home",
  search: "Search",
  likes: "Likes",
  profile: "Profile",
};

export default function BottomNavIconOnly() {
  const [value, setValue] = useState("home");
  const HomeIcon = useIcon("home");
  const SearchIcon = useIcon("search");
  const HeartIcon = useIcon("heart");
  const UserIcon = useIcon("user");

  return (
    <PhoneFrame route={value}>
      <p className="px-5 text-lg font-semibold">{LABELS[value]}</p>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} aria-hidden className="mx-5 mt-3 h-16 rounded-xl bg-muted" />
      ))}
      <BottomNav value={value} onValueChange={setValue} labels={false}>
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
