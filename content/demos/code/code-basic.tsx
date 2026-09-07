"use client";

import { Code } from "@/registry/default/code";

const SAMPLE = `export function greet(name: string) {
  const greeting = \`Hello, \${name}!\`;
  console.log(greeting);
  return greeting;
}`;

export default function CodeBasic() {
  return (
    <div className="w-full max-w-[520px]">
      <Code language="typescript" code={SAMPLE} />
    </div>
  );
}
