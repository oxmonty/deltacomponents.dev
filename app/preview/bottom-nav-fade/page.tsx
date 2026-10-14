"use client";

import { useState } from "react";
import { useIcon } from "@/registry/lib/icon-context";
import { BottomNav, BottomNavItem } from "@/registry/ui/bottom-nav";
import { PhoneFrame } from "@/lib/docs/phone-frame";

// Throwaway comparison of the fade above the bar: height, and how the
// gradient is distributed over it. Delete once a default is chosen.
const VARIANTS: {
  id: string;
  label: string;
  fade: number;
  className?: string;
  style?: React.CSSProperties;
}[] = [
  { id: "A", label: "fade 0 · ends at the icons' bottom edge", fade: 0 },
  { id: "B", label: "fade 0.25 · ends halfway down the icons", fade: 0.25 },
  { id: "C", label: "fade 0.5 · ends at the icons' top edge (default)", fade: 0.5 },
  { id: "D", label: "fade 0.75 · ends between the icons and the bar's edge", fade: 0.75 },
  { id: "E", label: "fade 1 · ends at the bar's top edge", fade: 1 },
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
            <BottomNav
              value={value}
              onValueChange={setValue}
              fade={v.fade}
              className={v.className}
              style={v.style}
            >
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
