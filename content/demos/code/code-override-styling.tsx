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

// Bigger type, no outer border, and an editor-style dark title bar. The
// filename and the copy glyph ride the bar's own colour at 60%, so setting a
// text colour on the header carries both of them with it.
const OVERRIDES = [
  "rounded-xl border-0 text-base",
  "**:data-[slot=code-header]:border-b-0",
  "**:data-[slot=code-header]:bg-neutral-900 **:data-[slot=code-header]:text-white",
].join(" ");

export default function CodeOverrideStyling() {
  return (
    <div className="w-full max-w-[560px]">
      <Code
        language="typescript"
        filename="use-theme.ts"
        code={SAMPLE}
        className={OVERRIDES}
      />
    </div>
  );
}
