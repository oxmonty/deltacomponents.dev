"use client";

import { YouTubeEmbed } from "@/registry/ui/embed";

export default function EmbedYouTube() {
  return (
    <div className="w-full max-w-[560px]">
      <YouTubeEmbed videoId="eVjP9Vnh2xE" title="But what is a neural network?" />
    </div>
  );
}
