"use client";

import { Code } from "@/registry/default/code";

export default function CodePackageManagers() {
  return (
    <div className="w-full max-w-[520px]">
      <Code code={"```npx\nshadcn@latest add code\n```"} />
    </div>
  );
}
