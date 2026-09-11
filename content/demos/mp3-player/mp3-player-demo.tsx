"use client";

import { MP3Player } from "@/registry/ui/mp3-player";

export default function MP3PlayerDemo() {
  return (
    <MP3Player
      src="/audio/the-engineers-proclivity-for-perfection.mp3"
      title="The Engineer's Proclivity for Perfection"
      artist="Patrick Prunty"
      className="max-w-md"
    />
  );
}
