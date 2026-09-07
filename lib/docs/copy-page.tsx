"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/registry/ui/button";
import { Tooltip } from "@/registry/ui/tooltip";
import { useIcon } from "@/registry/lib/icon-context";
import { copyToClipboard } from "@/registry/lib/clipboard";
import { useSizeVariant } from "@/lib/docs/size-context";

/**
 * "Copy page".
 *
 * The copy puts the page's **markdown** on the clipboard, not its rendered
 * text: pasting a doc page into an assistant should give it the demos' source
 * and the props tables, which is what the .md route already assembles.
 */
export function CopyPage() {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  // A square button has no provider-following size, so it is asked for explicitly.
  const size = useSizeVariant();
  const iconSize = size === "compact" ? ("icon-compact" as const) : ("icon" as const);
  const CopyIcon = useIcon("copy");
  const CheckIcon = useIcon("check");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const markdownPath = `${pathname}.md`;

  // Fetched up front rather than on click. Two things broke when the click
  // handler did the fetch itself: the tap did nothing visible until the
  // network came back, and — worse — the clipboard write then happened after
  // an `await`, outside the user gesture, which Safari refuses. So the button
  // looked dead on a phone and copied nothing. The `.md` route is static and
  // small, so paying for it on mount buys a copy that is synchronous at the
  // moment it matters.
  const markdown = useRef<string | null>(null);

  useEffect(() => {
    markdown.current = null;
    let cancelled = false;
    fetch(markdownPath)
      .then((r) => (r.ok ? r.text() : null))
      .then((text) => {
        if (!cancelled) markdown.current = text;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [markdownPath]);

  async function copy() {
    // If the prefetch has not landed (a slow connection, a tap the instant the
    // page renders) fall back to fetching now. That path loses the gesture on
    // Safari, but `copyToClipboard`'s `execCommand` branch still works, and a
    // late copy beats none.
    const text = markdown.current ?? (await fetch(markdownPath).then((r) => (r.ok ? r.text() : null)));
    if (text) markdown.current = text;

    const ok = text ? await copyToClipboard(text) : false;
    setCopied(ok);
    setFailed(!ok);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 2000);
  }
  return (
    <Tooltip content={failed ? "Copy failed" : copied ? "Copied" : "Copy page as markdown"}>
      {/* Icon-only, so the label swap on copy cannot resize it — the glyph
          carries the state instead, and the tooltip carries the name. An
          icon-only Button takes its glyph as children; `leadingIcon` is
          ignored at that size. */}
      <Button
        variant="ghost"
        size={iconSize}
        onClick={copy}
        aria-label={failed ? "Copy failed" : copied ? "Copied" : "Copy this page as markdown"}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </Tooltip>
  );
}
