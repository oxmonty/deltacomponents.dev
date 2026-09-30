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

// A neobrutalist block, three overrides deep. The root: a 2px border and a
// hard 4px offset shadow with no blur, both in the foreground colour so they
// flip with the theme — `border-2` replaces the default hairline rather than
// stacking on it, because the class is merged; the type stays at `text-base`.
// The title bar, through its slot: a flat pastel with the same 2px rule under
// it and near-black text in either theme. The filename and its icon normally
// sit at 60% of the bar's colour, which greys them over a pastel, so that
// slot is brought to full strength. The gutter, through its slot: pulled in.
const OVERRIDES = [
  "rounded-md border-2 border-foreground text-base shadow-[4px_4px_0_0_var(--foreground)]",
  "**:data-[slot=code-header]:border-b-2 **:data-[slot=code-header]:border-foreground **:data-[slot=code-header]:bg-[#88aaee] **:data-[slot=code-header]:text-neutral-950 **:data-[slot=code-header]:py-3",
  "**:data-[slot=code-filename]:opacity-100",
  "**:data-[slot=code-gutter]:w-10 **:data-[slot=code-gutter]:pr-4 **:data-[slot=code-gutter]:pl-2",
].join(" ");

export default function CodeOverrideStyling() {
  return (
    // Room on the right and below for the shadow, which sits outside the box.
    <div className="w-full max-w-[560px] py-2 pr-1 pb-3">
      <Code
        language="typescript"
        filename="use-theme.ts"
        code={SAMPLE}
        className={OVERRIDES}
      />
    </div>
  );
}
