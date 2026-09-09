"use client";

import { useState } from "react";
import { Code } from "@/registry/ui/code";
import { Button } from "@/registry/ui/button";
import { PIERRE } from "@/lib/docs/code-themes";

const SAMPLE = `type BadgeProps = {
  label: string;
  tone?: "neutral" | "positive";
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const count = label.length;
  return (
    <span className={tone === "positive" ? "ok" : "muted"} data-count={count}>
      {label}
    </span>
  );
}`;

export default function CodeAdaptiveTheme() {
  const [useThemeBackground, setUseThemeBackground] = useState(true);

  return (
    <div className="flex w-full max-w-[520px] flex-col gap-3">
      <Button
        size="compact"
        variant="secondary"
        className="self-start"
        onClick={() => setUseThemeBackground((on) => !on)}
      >
        useThemeBackground: {useThemeBackground ? "on" : "off"}
      </Button>
      <Code
        filename="badge.tsx"
        language="tsx"
        adaptiveTheme={PIERRE}
        useThemeBackground={useThemeBackground}
        code={SAMPLE}
      />
    </div>
  );
}
