"use client";

import { Code } from "@/registry/ui/code";

const SAMPLE = `import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  return { theme, setTheme };
}`;

// Three kinds of override, one per line. The root: a bigger radius and type,
// and a shadow in place of the hairline — `border-0` replaces the default
// border rather than stacking on it, because the class is merged. The title
// bar, through its slot: inverted, so it is dark on a light page and light on
// a dark one; the filename and the copy glyph ride the bar's colour at 60%,
// so the one text colour carries both. The gutter, through its slot: pulled
// in, because a block this size doesn't need a 64px number column.
const OVERRIDES = [
  "rounded-2xl border-0 text-base shadow-[0_1px_2px_rgb(0_0_0/0.08),0_16px_40px_-16px_rgb(0_0_0/0.35)]",
  "**:data-[slot=code-header]:border-b-0 **:data-[slot=code-header]:bg-foreground **:data-[slot=code-header]:text-background **:data-[slot=code-header]:py-3",
  "**:data-[slot=code-gutter]:w-10 **:data-[slot=code-gutter]:pr-4 **:data-[slot=code-gutter]:pl-2",
].join(" ");

export default function CodeOverrideStyling() {
  return (
    <div className="w-full max-w-[560px] py-2">
      <Code
        language="typescript"
        filename="use-theme.ts"
        code={SAMPLE}
        className={OVERRIDES}
      />
    </div>
  );
}
