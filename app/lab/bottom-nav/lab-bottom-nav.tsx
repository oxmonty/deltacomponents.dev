"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BottomNav, BottomNavItem } from "@/registry/ui/bottom-nav";
import { useIcon } from "@/registry/lib/icon-context";

function LabBottomNav() {
  const pathname = usePathname();
  const HomeIcon = useIcon("home");
  const SearchIcon = useIcon("search");
  const UserIcon = useIcon("user");
  return (
    // No `md:hidden`: the lab must be testable on desktop too.
    <BottomNav value={pathname} linkComponent={Link}>
      <BottomNavItem value="/lab/bottom-nav" href="/lab/bottom-nav" icon={<HomeIcon />}>
        Home
      </BottomNavItem>
      <BottomNavItem value="/lab/bottom-nav/search" href="/lab/bottom-nav/search" icon={<SearchIcon />}>
        Search
      </BottomNavItem>
      <BottomNavItem value="/lab/bottom-nav/profile" href="/lab/bottom-nav/profile" icon={<UserIcon />}>
        Profile
      </BottomNavItem>
    </BottomNav>
  );
}

export { LabBottomNav };
