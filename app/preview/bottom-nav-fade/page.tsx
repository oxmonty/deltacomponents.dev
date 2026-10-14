"use client";

import { useState } from "react";
import { useIcon } from "@/registry/lib/icon-context";
import { BottomNav, BottomNavItem } from "@/registry/ui/bottom-nav";
import { PhoneFrame } from "@/lib/docs/phone-frame";

// Throwaway comparison of the fade above the bar: height, and how the
// gradient is distributed over it. Delete once a default is chosen.
const VARIANTS = [
  { id: "A", label: "64px, linear (current)", fade: "4rem", className: "" },
  { id: "B", label: "96px, linear", fade: "6rem", className: "" },
  { id: "C", label: "128px, linear", fade: "8rem", className: "" },
  { id: "D", label: "160px, linear", fade: "10rem", className: "" },
  {
    id: "E",
    label: "128px, long tail: 40% at a third, then gentle",
    fade: "8rem",
    className: "before:via-background/40 before:via-[33%]",
  },
  {
    id: "F",
    label: "128px, holds: 80% to the middle, then drops",
    fade: "8rem",
    className: "before:via-background/80 before:via-[50%]",
  },
];

const LINES = Array.from({ length: 24 }, (_, i) => `Line ${i + 1} of the page, scrolling up under the bar so the fade can be judged on text.`);

export default function BottomNavFadePage() {
  const [value, setValue] = useState("home");
  const HomeIcon = useIcon("home");
  const SearchIcon = useIcon("search");
  const HeartIcon = useIcon("heart");
  const UserIcon = useIcon("user");

  return (
    <main className="mx-auto flex max-w-6xl flex-wrap justify-center gap-8 px-4 py-8">
      {VARIANTS.map((v) => (
        <figure key={v.id} className="flex flex-col items-center gap-3">
          <PhoneFrame route={value}>
            <div className="px-5 pb-28">
              {LINES.map((line, i) => (
                <p key={i} className="mt-3 text-sm text-foreground">
                  {line}
                </p>
              ))}
            </div>
            <BottomNav value={value} onValueChange={setValue} fade={v.fade} className={v.className}>
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
          <figcaption className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{v.id}</span> · {v.label}
          </figcaption>
        </figure>
      ))}
    </main>
  );
}
