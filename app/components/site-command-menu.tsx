"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { cn } from "@/registry/lib/utils";
import { useIcon } from "@/registry/lib/icon-context";
import { useShape } from "@/lib/docs/shape-context";
import { useSize } from "@/lib/docs/size-context";
import { labelOf, sectionList, visibleComponents } from "@/lib/docs/components";

/** The site's own search: ⌘K anywhere, or the field at the top of the rail.
 *  Every page the sidebar lists, in one filtered list, with the keyboard
 *  driving it — arrows move the highlight, Enter opens, Escape closes. */

interface Item {
  href: string;
  label: string;
  group: string;
  note?: string;
  keywords: string[];
}

const ITEMS: Item[] = [
  ...sectionList.map((section) => ({
    href: section.href,
    label: section.name,
    group: "Sections",
    keywords: [section.href],
  })),
  ...visibleComponents.map((entry) => ({
    href: `/docs/${entry.slug}`,
    label: labelOf(entry),
    group: "Components",
    note: entry.isNew ? "New" : entry.isUpdated ? "Updated" : undefined,
    keywords: [entry.slug],
  })),
];

/** Every word of the query appears in the label or keywords. Order is kept,
 *  so rows never re-sort under the highlight as the query grows. */
function matches(item: Item, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = [item.label, ...item.keywords].join(" ").toLowerCase();
  return words.every((word) => haystack.includes(word));
}

interface SiteCommandMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SiteCommandMenuContext = createContext<SiteCommandMenuContextValue | null>(null);

export function useSiteCommandMenu(): SiteCommandMenuContextValue {
  const ctx = useContext(SiteCommandMenuContext);
  if (!ctx) throw new Error("useSiteCommandMenu must be used within SiteCommandMenuProvider");
  return ctx;
}

export function SiteCommandMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  // ⌘K / Ctrl+K toggles from anywhere — inside a field too, the way it does
  // in every app that has it.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      e.preventDefault();
      setOpen((prev) => !prev);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ open, setOpen }), [open]);
  return <SiteCommandMenuContext.Provider value={value}>{children}</SiteCommandMenuContext.Provider>;
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="border-border/60 text-muted-foreground flex h-5 min-w-5 items-center justify-center rounded border px-1 font-sans text-[11px]">
      {children}
    </kbd>
  );
}

export function SiteCommandMenu() {
  const { open, setOpen } = useSiteCommandMenu();
  const router = useRouter();
  const SearchIcon = useIcon("search");
  const shape = useShape();
  const size = useSize();
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const visible = useMemo(() => ITEMS.filter((item) => matches(item, query)), [query]);

  // A fresh menu each time: the query and the highlight start over on open,
  // and the highlight returns to the first row whenever the list changes.
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);
  useEffect(() => {
    setActive(0);
  }, [query, open]);
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>("[data-active]")
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (item: Item) => {
    setOpen(false);
    router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const last = visible.length - 1;
    if (last < 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => (i >= last ? 0 : i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => (i <= 0 ? last : i - 1));
        break;
      case "Home":
        if (query !== "") return; // the caret's own Home
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        if (query !== "") return;
        e.preventDefault();
        setActive(last);
        break;
      case "Enter":
        e.preventDefault();
        go(visible[active]);
        break;
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-40 bg-black/40 dark:bg-black/80",
            "transition-opacity duration-(--motion-moderate) ease-spring",
            "data-[ending-style]:duration-(--motion-moderate-exit)",
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
          )}
        />
        <Dialog.Popup
          className={cn(
            // No hairline: a 4px ring in the translucent border colour reads
            // as a soft halo around the panel, and bg-clip-padding keeps the
            // panel's own fill from showing through it.
            "bg-card fixed top-[10vh] left-1/2 z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden bg-clip-padding shadow-2xl ring-4 ring-border outline-none",
            shape.bg,
            "transition-[opacity,transform] duration-(--motion-moderate) ease-spring",
            "data-[ending-style]:duration-(--motion-moderate-exit)",
            "data-[starting-style]:-translate-y-2 data-[starting-style]:opacity-0",
            "data-[ending-style]:-translate-y-2 data-[ending-style]:opacity-0"
          )}
        >
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          <Dialog.Description className="sr-only">Jump to a page.</Dialog.Description>

          <div className="border-border/60 relative border-b">
            <SearchIcon
              size={size.icon}
              strokeWidth={1.5}
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
            />
            <input
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={visible[active] ? `${listId}-${active}` : undefined}
              aria-autocomplete="list"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search pages…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              className="text-foreground placeholder:text-muted-foreground h-12 w-full bg-transparent pr-14 pl-11 text-[15px] outline-none"
            />
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
              <Kbd>esc</Kbd>
            </div>
          </div>

          <div
            ref={listRef}
            id={listId}
            role="listbox"
            className="max-h-[min(360px,50vh)] overflow-y-auto p-2"
          >
            {visible.length === 0 && (
              <p className="text-muted-foreground px-2 py-6 text-center text-[13px]">Nothing matches</p>
            )}
            {visible.map((item, i) => {
              const isActive = i === active;
              const startsGroup = i === 0 || visible[i - 1].group !== item.group;
              return (
                <div key={item.href}>
                  {startsGroup && (
                    <div className="text-muted-foreground flex h-8 items-center px-2 text-[12px]">
                      {item.group}
                    </div>
                  )}
                  <div
                    role="option"
                    id={`${listId}-${i}`}
                    aria-selected={isActive}
                    data-active={isActive || undefined}
                    onPointerMove={() => setActive(i)}
                    onClick={() => go(item)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 px-2",
                      size.variant === "compact" ? "h-7" : "h-8",
                      size.text,
                      shape.item,
                      isActive && "bg-hover"
                    )}
                  >
                    {item.label}
                    {item.note && (
                      <span className="text-muted-foreground ml-auto text-[11px]">{item.note}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-border/60 text-muted-foreground flex h-9 items-center gap-4 border-t px-3 text-[11px]">
            <span className="flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> navigate
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>↵</Kbd> open
            </span>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
