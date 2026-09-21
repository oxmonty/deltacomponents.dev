"use client";

import { VideoEmbed } from "@/registry/ui/embed";

export default function EmbedVideo() {
  return (
    <div className="w-full max-w-[560px]">
      <VideoEmbed src="/videos/swainsons-hawk.mp4" poster="/videos/swainsons-hawk-poster.webp" />
    </div>
  );
}
