"use client";

import { MP3Player } from "@/registry/ui/mp3-player";

const PEAKS = [0.59,0.49,0.36,0.5,0.33,0.29,0.52,0.48,0.41,0.21,0.0,0.87,0.59,0.37,0.31,0.64,0.32,0.3,0.45,0.36,0.24,0.29,0.66,0.4,0.41,0.24,0.57,0.62,0.48,0.59,0.35,0.32,0.61,0.42,0.5,0.29,0.51,0.63,0.53,0.43,0.48,0.47,0.44,0.27,0.53,0.67,0.35,0.54,0.31,0.21,0.16,0.57,0.72,0.24,0.53,0.47,0.66,0.43,0.39,0.33,0.44,0.31,0.47,0.46,0.33,0.25,0.46,1.0,0.19,0.37,0.24,0.51,0.19,0.37,0.3,0.32,0.25,0.44,0.41,0.37,0.41,0.38,0.23,0.44,0.25,0.46,0.44,0.37,0.33,0.41,0.32,0.47,0.31,0.27,0.05,0.03];

export default function MP3PlayerWaveform() {
  return (
    <MP3Player
      src="/audio/the-engineers-proclivity-for-perfection.mp3"
      title="The Engineer's Proclivity for Perfection"
      artist="Patrick Prunty"
      peaks={PEAKS}
      className="max-w-md"
    />
  );
}
