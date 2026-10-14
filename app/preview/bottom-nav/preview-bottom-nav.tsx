"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BottomNav, BottomNavItem } from "@/registry/ui/bottom-nav";
import { useIcon } from "@/registry/lib/icon-context";

function PreviewBottomNav() {
  const pathname = usePathname();
  const HomeIcon = useIcon("home");
  const SearchIcon = useIcon("search");
  const UserIcon = useIcon("user");
  return (
    // No `md:hidden`: the preview is for trying the bar, on a desktop too.
    <BottomNav value={pathname} linkComponent={Link}>
      <BottomNavItem value="/preview/bottom-nav" href="/preview/bottom-nav" icon={<HomeIcon />}>
        Home
      </BottomNavItem>
      <BottomNavItem value="/preview/bottom-nav/search" href="/preview/bottom-nav/search" icon={<SearchIcon />}>
        Search
      </BottomNavItem>
      <BottomNavItem value="/preview/bottom-nav/profile" href="/preview/bottom-nav/profile" icon={<UserIcon />}>
        Profile
      </BottomNavItem>
    </BottomNav>
  );
}

export { PreviewBottomNav };
