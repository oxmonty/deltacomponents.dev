"use client";

import { Code } from "@/registry/ui/code";

const SAMPLE = `export function greet(name: string) {
  const greeting = \`Hello, \${name}!\`;
  console.log(greeting);
  return greeting;
}`;

export default function CodeDemo() {
  return (
    <div className="w-full max-w-[520px]">
      <Code filename="greet.ts" language="typescript" code={SAMPLE} />
    </div>
  );
}
