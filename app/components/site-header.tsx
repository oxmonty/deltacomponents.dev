import { MobileNav } from "@/app/components/mobile-nav";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { GitHubStarButton } from "@/app/components/right-panel";

/**
 * Sticky mobile-only header: the rail and right panel already carry
 * everything at xl and up, so this never renders there. Replaces the old
 * floating sidebar trigger and the sidebar sheet's mobile footer — both now
 * live here (see MobileNav).
 */
export function SiteHeader() {
  return (
    <header className="border-border bg-background sticky top-0 z-40 w-full border-b xl:hidden">
      <div className="flex h-14 items-center gap-2 px-4">
        <MobileNav />
        <div className="flex-1" />
        <ThemeToggle />
        <GitHubStarButton />
      </div>
    </header>
  );
}
