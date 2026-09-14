"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/app/components/ui/sidebar";
import { useIcon } from "@/registry/lib/icon-context";
import { useSize } from "@/lib/docs/size-context";
import { labelOf, sectionList, visibleComponents } from "@/lib/docs/components";

/** The rail's search field, on the rows' own rhythm: the icon on the rows'
 *  leading axis, the text on their text axis, and the ⌘K chip waiting at the
 *  trailing edge until hover or focus — the placeholder owns the field at
 *  rest. ⌘K / Ctrl+K focuses it from anywhere; Escape clears and leaves. */
function NavSearch({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const SearchIcon = useIcon("search");
  const iconSize = useSize().icon;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="group/search relative">
      <SearchIcon
        size={iconSize}
        strokeWidth={1.5}
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 -translate-y-1/2"
      />
      <SidebarInput
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Escape") return;
          onChange("");
          e.currentTarget.blur();
        }}
        placeholder="Search…"
        aria-label="Search the navigation"
        className="pr-12 pl-8"
      />
      <kbd className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 font-sans text-[11px] opacity-0 transition-opacity duration-80 group-hover/search:opacity-100 group-focus-within/search:opacity-100">
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
  if (entries.length === 0) return null;
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
  const [query, setQuery] = useState("");
  // Plain substring match on the visible label: nine components do not need
  // more, and it means "what you typed is in what you see".
  const needle = query.trim().toLowerCase();
  const matches = (name: string) => !needle || name.toLowerCase().includes(needle);
  const sections = sectionList.filter((section) => matches(section.name));
  const components = visibleComponents.filter((entry) => matches(labelOf(entry)));

  return (
    <Sidebar collapsible="offcanvas" bordered={false} rail={false} className="ml-2">
      <SidebarHeader className="pt-4 pb-0">
        <NavSearch value={query} onChange={setQuery} />
      </SidebarHeader>
      <SidebarContent className="py-2">
        {/* Top-level navigation. Carries a group label like the Components
            group below it, so the rail reads as two labelled sections rather
            than a loose pair of links above a titled list. */}
        {sections.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              Sections
              <span className="text-[11px]">{sections.length}</span>
            </SidebarGroupLabel>
            <SidebarMenu aria-label="Main navigation">
              {sections.map((section) => (
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
        )}

        <NavGroup
          label="Components"
          entries={components}
          pathname={pathname}
          ariaLabel="Component navigation"
        />

        {sections.length === 0 && components.length === 0 && (
          <p className="text-muted-foreground px-4 py-2 text-[12px]">No matches</p>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

export default SiteSidebar;
