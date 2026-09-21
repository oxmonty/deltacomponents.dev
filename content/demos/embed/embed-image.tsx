"use client";

import { ImageEmbed } from "@/registry/ui/embed";

export default function EmbedImage() {
  return (
    <div className="w-full max-w-[560px]">
      <ImageEmbed
        src="/images/editor-embed-sample.webp"
        alt="A painted battle scene of knights on horseback in red, green and yellow"
      />
    </div>
  );
}
