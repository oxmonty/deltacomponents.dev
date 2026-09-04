"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/registry/base/sidebar";
import { componentList, labelOf } from "@/lib/docs/components";
import { GitHubStarButton, SettingsContent } from "@/app/components/right-panel";

interface NavEntry {
  slug: string;
  name: string;
  label?: string;
  isNew?: boolean;
  isUpdated?: boolean;
  dotColor?: string;
}

/** The isNew/isUpdated dot, rendered as a trailing child inside the row's
 *  weight-animated label span (same markup the old NavItem used). */
function StatusDot({ entry }: { entry: NavEntry }) {
  // Rendered as a flex sibling of the weight-animated label (the row's gap
  // provides the spacing), matching the old NavItem dot's visual position.
  if (entry.isUpdated) {
    return <span className="inline-block size-1.5 shrink-0 rounded-full bg-blue-500" />;
  }
  if (entry.isNew) {
    return (
      <span
        className={`inline-block size-1.5 shrink-0 rounded-full ${entry.dotColor ?? "bg-blue-500"}`}
      />
    );
  }
  return null;
}

function NavGroup({
  label,
  entries,
  pathname,
  ariaLabel,
}: {
  label?: string;
  entries: NavEntry[];
  pathname: string;
  ariaLabel: string;
}) {
  return (
    <SidebarGroup>
      {label && (
        <SidebarGroupLabel>
          {label}
          <span className="text-[11px]">{entries.length}</span>
        </SidebarGroupLabel>
      )}
      <SidebarMenu aria-label={ariaLabel}>
        {entries.map((entry) => {
          const href = `/docs/${entry.slug}`;
          return (
            <SidebarMenuItem key={entry.slug}>
              <SidebarMenuButton render={<Link href={href} />} isActive={pathname === href}>
                {labelOf(entry)}
                <StatusDot entry={entry} />
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

/** The site's own navigation rail — the Sidebar component, dogfooded. */
export function SiteSidebar() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  return (
    <Sidebar collapsible="offcanvas" bordered={false} rail={false} className="ml-2">
      <SidebarContent className="py-2">
        {/* Top-level navigation. Carries a group label like the Components
            group below it, so the rail reads as two labelled sections rather
            than a loose pair of links above a titled list. */}
        <SidebarGroup>
          <SidebarGroupLabel>
            Sections
            <span className="text-[11px]">2</span>
          </SidebarGroupLabel>
          <SidebarMenu aria-label="Main navigation">
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/" />} isActive={pathname === "/"}>
                Showcase
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/docs" />} isActive={pathname === "/docs"}>
                Introduction
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <NavGroup
          label="Components"
          entries={componentList}
          pathname={pathname}
          ariaLabel="Component navigation"
        />
      </SidebarContent>

      {/* The settings block only ships in the mobile sheet — on desktop it
          lives in the right panel. */}
      {isMobile && (
        <SidebarFooter className="p-4 pt-2">
          <div className="flex items-center justify-between pt-2">
            <h2
              className="text-title text-foreground leading-none"
              style={{ fontVariationSettings: "'wght' 600" }}
            >
              Make them yours
            </h2>
            <GitHubStarButton />
          </div>
          <SettingsContent tooltipSide="right" />
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

export default SiteSidebar;
