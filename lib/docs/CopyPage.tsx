"use client";

import { useEffect, useRef, useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { usePathname } from "next/navigation";

import { Button } from "@/registry/ui/button";
import { Tooltip } from "@/registry/ui/tooltip";
import { useIcon } from "@/registry/lib/icon-context";
import { useShape } from "@/registry/lib/shape-context";
import { useSizeVariant } from "@/registry/lib/size-context";
import { cn } from "@/registry/lib/utils";

/** The prompt an assistant opens with. It carries the markdown URL rather than
 *  the page's — an assistant that fetches the .md gets the demos' real source
 *  and the props tables, where the rendered page would give it chrome. */
function promptFor(markdownUrl: string, pageUrl: string): string {
  return `I'm reading the Delta Components documentation at ${pageUrl}. The page is available as markdown at ${markdownUrl} — read that for the component's source, props and examples. Help me understand and use it.`;
}

function ClaudeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 shrink-0">
      <path
        fill="currentColor"
        d="m4.714 15.956 4.718-2.648.079-.23-.08-.128h-.23l-.79-.048-2.695-.073-2.337-.097-2.265-.122-.57-.121-.535-.704.055-.353.48-.321.685.06 1.518.104 2.277.157 1.651.098 2.447.255h.389l.054-.158-.133-.097-.103-.098-2.356-1.596-2.55-1.688-1.336-.972-.722-.491L2 6.223l-.158-1.008.655-.722.88.06.225.061.893.686 1.906 1.476 2.49 1.833.364.304.146-.104.018-.072-.164-.274-1.354-2.446-1.445-2.49-.644-1.032-.17-.619a2.972 2.972 0 0 1-.103-.729L6.287.133 6.7 0l.995.134.42.364.619 1.415L9.735 4.14l1.555 3.03.455.898.243.832.09.255h.159V9.01l.127-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.583.28.48.685-.067.444-.286 1.851-.558 2.903-.365 1.942h.213l.243-.242.983-1.306 1.652-2.064.728-.82.85-.904.547-.431h1.032l.759 1.129-.34 1.166-1.063 1.347-.88 1.142-1.263 1.7-.79 1.36.074.11.188-.02 2.853-.606 1.542-.28 1.84-.315.832.388.09.395-.327.807-1.967.486-2.307.462-3.436.813-.043.03.049.061 1.548.146.662.036h1.62l3.018.225.79.522.473.638-.08.485-1.213.62-1.64-.389-3.825-.91-1.31-.329h-.183v.11l1.093 1.068 2.003 1.81 2.508 2.33.127.578-.321.455-.34-.049-2.204-1.657-.85-.747-1.925-1.62h-.127v.17l.443.649 2.343 3.521.122 1.08-.17.353-.607.213-.668-.122-1.372-1.924-1.415-2.168-1.141-1.943-.14.08-.674 7.254-.316.37-.728.28-.607-.461-.322-.747.322-1.476.388-1.924.316-1.53.285-1.9.17-.632-.012-.042-.14.018-1.432 1.967-2.18 2.945-1.724 1.845-.413.164-.716-.37.066-.662.401-.589 2.386-3.036 1.439-1.882.929-1.086-.006-.158h-.055L4.138 18.56l-1.13.146-.485-.456.06-.746.231-.243 1.907-1.312Z"
      />
    </svg>
  );
}

function ChatGPTIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 shrink-0">
      <path
        fill="currentColor"
        d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z"
      />
    </svg>
  );
}

function MarkdownIcon() {
  return (
    <svg viewBox="0 0 22 16" aria-hidden className="size-4 shrink-0">
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.5 2.25H2.5C1.80964 2.25 1.25 2.80964 1.25 3.5V12.5C1.25 13.1904 1.80964 13.75 2.5 13.75H19.5C20.1904 13.75 20.75 13.1904 20.75 12.5V3.5C20.75 2.80964 20.1904 2.25 19.5 2.25ZM2.5 1C1.11929 1 0 2.11929 0 3.5V12.5C0 13.8807 1.11929 15 2.5 15H19.5C20.8807 15 22 13.8807 22 12.5V3.5C22 2.11929 20.8807 1 19.5 1H2.5ZM3 4.5H4H4.25H4.6899L4.98715 4.82428L7 7.02011L9.01285 4.82428L9.3101 4.5H9.75H10H11V5.5V11.5H9V7.79807L7.73715 9.17572L7 9.97989L6.26285 9.17572L5 7.79807V11.5H3V5.5V4.5ZM15 8V4.5H17V8H19.5L17 10.5L16 11.5L15 10.5L12.5 8H15Z"
      />
    </svg>
  );
}

/**
 * "Copy page", with a menu for handing the page to an assistant.
 *
 * The copy puts the page's **markdown** on the clipboard, not its rendered
 * text: pasting a doc page into an assistant should give it the demos' source
 * and the props tables, which is what the .md route already assembles.
 *
 * Three entries only — Claude, ChatGPT, and the raw markdown. The site this
 * was ported from also offered v0 and Gemini; a menu of five is a menu nobody
 * reads, and these are the two assistants this documentation is written for.
 */
export function CopyPage() {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  // The arrows beside this derive their step the same way — a square button
  // has no provider-following size, so it is asked for explicitly.
  const shape = useShape();
  const size = useSizeVariant();
  const iconSize = size === "compact" ? ("icon-compact" as const) : ("icon" as const);
  const CopyIcon = useIcon("copy");
  const CheckIcon = useIcon("check");
  const ChevronDown = useIcon("chevron-down");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const markdownPath = `${pathname}.md`;

  async function copy() {
    try {
      const markdown = await fetch(markdownPath).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      });
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setFailed(false);
    } catch {
      // Say so rather than showing a tick for something that never landed.
      setFailed(true);
    }
    timer.current = setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 2000);
  }

  const item =
    "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-body text-muted-foreground no-underline outline-none transition-colors duration-80 data-[highlighted]:bg-hover data-[highlighted]:text-foreground";

  function assistant(name: string, base: string, icon: React.ReactNode) {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    const href = `${base}?q=${encodeURIComponent(promptFor(`${origin}${markdownPath}`, `${origin}${pathname}`))}`;
    return (
      <Menu.Item key={name} className={item} render={<a href={href} target="_blank" rel="noopener noreferrer" />}>
        {icon}
        Open in {name}
      </Menu.Item>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Menu.Root>
        {/* The labelled control is the menu, not the copy: handing the page
            to an assistant is the thing worth naming, and "Open with" says
            what the chevron is about to offer. */}
        <Menu.Trigger
          render={
            <Button
              variant="ghost"
              size={size}
              trailingIcon={ChevronDown}
              className="whitespace-nowrap"
            >
              Open with
            </Button>
          }
        />
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-50">
            <Menu.Popup
              className={cn(
                "bg-background border-border/60 flex min-w-52 flex-col gap-0.5 border p-1 shadow-sm outline-none",
                "origin-(--transform-origin) transition-[opacity,transform] duration-(--motion-fast) ease-spring",
                "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
                "data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:duration-(--motion-fast-exit)",
                shape.container
              )}
            >
              {/* Markdown first: it is the one entry that needs no third party
                  and no round trip, and the one a reader picks when they just
                  want the page's source. */}
              <Menu.Item
                className={item}
                render={<a href={markdownPath} target="_blank" rel="noopener noreferrer" />}
              >
                <MarkdownIcon />
                Open in Markdown
              </Menu.Item>
              {assistant("Claude", "https://claude.ai/new", <ClaudeIcon />)}
              {assistant("ChatGPT", "https://chatgpt.com", <ChatGPTIcon />)}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <Tooltip content={failed ? "Copy failed" : copied ? "Copied" : "Copy page as markdown"}>
        {/* Icon-only, so the label swap on copy cannot resize it — the glyph
            carries the state instead, and the tooltip carries the name, like
            the arrows beside it. An icon-only Button takes its glyph as
            children; `leadingIcon` is ignored at that size. */}
        <Button
          variant="ghost"
          size={iconSize}
          onClick={copy}
          aria-label={failed ? "Copy failed" : copied ? "Copied" : "Copy this page as markdown"}
          // Both glyphs sit in the same 16px box as the arrows, but a copy
          // mark fills far more of its viewBox than an arrow does — 13.3px of
          // drawing against 9.3px — so at the shared box size it reads as the
          // bigger icon. Clipping the box to 12px lands it at the arrows'
          // drawn size; the stroke steps up to 2 to hold the same 1px weight
          // once the box is smaller. `!` because Button's own `[&_svg]:size-4`
          // has equal specificity and would otherwise win on source order.
          className="[&_svg]:!size-3 [&_svg]:!stroke-[2]"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      </Tooltip>
    </div>
  );
}
