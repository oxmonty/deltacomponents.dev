"use client";

import { Embed } from "@/registry/ui/embed";

export default function EmbedDemo() {
  return (
    <div className="w-full max-w-[560px]">
      <Embed url="https://www.youtube.com/watch?v=eVjP9Vnh2xE" />
    </div>
  );
}
