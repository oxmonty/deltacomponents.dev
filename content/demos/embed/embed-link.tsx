"use client";

import { LinkPreview } from "@/registry/ui/embed";

export default function EmbedLink() {
  return (
    <div className="w-full max-w-[560px]">
      <LinkPreview url="https://patrickprunty.com" />
    </div>
  );
}
