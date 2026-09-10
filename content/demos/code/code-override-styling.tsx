"use client";

import { Code } from "@/registry/ui/code";

const SAMPLE = `export function greet(name: string) {
  return \`Hello, \${name}!\`;
}`;

export default function CodeOverrideStyling() {
  return (
    <div className="flex w-full max-w-[520px] flex-col gap-6">
      <Code language="typescript" filename="greet.ts" code={SAMPLE} />

      {/* One className does all four: the type size (inherited by the code,
          the gutter and the filename together), the corner, the border, and
          the header bar reached through its data-slot. */}
      <Code
        language="typescript"
        filename="greet.ts"
        code={SAMPLE}
        className="rounded-2xl border-2 border-dashed text-[12px] **:data-[slot=code-header]:bg-amber-500/10"
      />
    </div>
  );
}
