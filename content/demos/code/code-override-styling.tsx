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
// hard 4px offset shadow with no blur — black on the light page; on the dark
// one the border takes the bar's blue and the shadow a darker cut of it,
// because a white slab-shadow on dark reads as a glow where the accent reads
// as a block. `border-2` replaces the default
// hairline rather than stacking on it, because the class is merged; the type
// stays at `text-base`. The title bar, through its slot: a flat pastel with a
// hard rule under it (black on both pages) and near-black text. The filename
// and its icon normally sit at 60% of the bar's colour, which greys them over
// a pastel, so that slot is brought to full strength. The gutter, through its
// slot: pulled in.
const OVERRIDES = [
  "rounded-md border-2 border-neutral-950 text-base shadow-[4px_4px_0_0_#0a0a0a]",
  "dark:border-[#88aaee] dark:shadow-[4px_4px_0_0_#2f4a8f]",
  "**:data-[slot=code-header]:border-b-2 **:data-[slot=code-header]:border-neutral-950 **:data-[slot=code-header]:bg-[#88aaee] **:data-[slot=code-header]:text-neutral-950 **:data-[slot=code-header]:py-3",
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
