"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/app/components/ui/sidebar";
import { cn } from "@/registry/lib/utils";
import { useIcon } from "@/registry/lib/icon-context";
import { useShape } from "@/lib/docs/shape-context";
import { useSize } from "@/lib/docs/size-context";
import { useSiteCommandMenu } from "@/app/components/site-command-menu";
import { labelOf, sectionList, visibleComponents } from "@/lib/docs/components";

/** The rail's search field: a button dressed as SidebarInput (same field
 *  ladder, same height and radius) that opens the site command menu, with
 *  the ⌘K chip always showing so the shortcut is learnt from the rail. A
 *  button rather than a real input because typing happens in the menu — an
 *  input that opens a dialog on focus reopens it the moment the dialog hands
 *  focus back. */
function NavSearch() {
  const SearchIcon = useIcon("search");
  const shape = useShape();
  const size = useSize();
  const { setOpen } = useSiteCommandMenu();

  return (
    <div className="relative">
      <SearchIcon
        size={size.icon}
        strokeWidth={1.5}
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 -translate-y-1/2"
      />
      <button
        type="button"
        aria-label="Search pages"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={cn(
          "text-muted-foreground flex w-full cursor-pointer items-center bg-transparent pr-12 pl-8 text-left outline-none",
          "ring-1 ring-transparent transition-[background-color,box-shadow] duration-80",
          "hover:bg-muted/50 hover:ring-border",
          "focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
          size.variant === "compact" ? "h-7" : "h-8",
          size.text,
          shape.input
        )}
      >
        Search…
      </button>
      <kbd className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 font-sans text-[11px]">
        ⌘K
      </kbd>
    </div>
  );
}

interface NavEntry {
  slug: string;
  name: string;
  label?: string;
  isNew?: boolean;
  isUpdated?: boolean;
  dotColor?: string;
  draft?: boolean;
}

/** The draft/isNew/isUpdated dot, rendered as a trailing child inside the row's
 *  weight-animated label span (same markup the old NavItem used). Exported
 *  for the mobile header's nav popover, which lists the same components. */
export function StatusDot({ entry }: { entry: NavEntry }) {
  // Rendered as a flex sibling of the weight-animated label (the row's gap
  // provides the spacing), matching the old NavItem dot's visual position.

  // Draft outranks new: a row only reaches this branch in `next dev` (the
  // production build filters drafts out entirely), and "this one will not
  // ship" is the more useful fact about it than "this one is recent". Amber
  // rather than the blue both other states share, so the two read apart, and
  // titled because a bare colour swap does not say which state it means.
  if (entry.draft) {
    return (
      <span
        title="Draft — hidden from the production build"
        className="inline-block size-1.5 shrink-0 rounded-full bg-amber-500"
      />
    );
  }
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

  return (
    <Sidebar collapsible="offcanvas" bordered={false} rail={false} className="ml-2">
      <SidebarHeader className="pt-4 pb-0">
        <NavSearch />
      </SidebarHeader>
      <SidebarContent className="py-2">
        {/* Top-level navigation. Carries a group label like the Components
            group below it, so the rail reads as two labelled sections rather
            than a loose pair of links above a titled list. */}
        <SidebarGroup>
          <SidebarGroupLabel>
            Sections
            <span className="text-[11px]">{sectionList.length}</span>
          </SidebarGroupLabel>
          <SidebarMenu aria-label="Main navigation">
            {sectionList.map((section) => (
              <SidebarMenuItem key={section.href}>
                <SidebarMenuButton
                  render={<Link href={section.href} />}
                  isActive={pathname === section.href}
                >
                  {section.name}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <NavGroup
          label="Components"
          entries={visibleComponents}
          pathname={pathname}
          ariaLabel="Component navigation"
        />
      </SidebarContent>
    </Sidebar>
  );
}

export default SiteSidebar;
