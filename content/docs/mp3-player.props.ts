import type { PropDef } from "@/lib/docs/props-table";

export const mp3PlayerProps: PropDef[] = [
  { name: "src", type: "string", description: "URL of the audio file." },
  { name: "title", type: "string", description: "Track title, used for the Media Session (lock screen / hardware keys) only — not rendered." },
  { name: "artist", type: "string", description: "Artist name, used for the Media Session only." },
  { name: "artwork", type: "string", description: "Artwork image URL, used for the Media Session only." },
  { name: "peaks", type: "number[]", description: "0–1 amplitude values, one per bar. Forwarded to `MP3PlayerScrubber` through context; omit for a plain line scrubber." },
  { name: "autoPlay", type: "boolean", description: "Forwarded to the underlying `<audio>` element." },
  { name: "loop", type: "boolean", description: "Forwarded to the underlying `<audio>` element." },
  { name: "children", type: "ReactNode", description: "Custom layout of the parts below. Omit to render the default: play, elapsed time, scrubber, remaining time, speed, download." },
  { name: "...props", type: "React.ComponentProps<'div'>", description: "Everything else lands on the root, `ref` included. `title` is not forwarded — it collides with the HTML attribute, so it stays Media-Session-only." },
];

export const mp3PlayerPlayProps: PropDef[] = [
  { name: "className", type: "string", description: "Merged onto the button." },
];

export const mp3PlayerTimeProps: PropDef[] = [
  { name: "remaining", type: "boolean", default: "false", description: "Shows time left instead of time elapsed, prefixed with a minus sign." },
  { name: "format", type: "(seconds: number) => string", default: "formatTime", description: "Formats the displayed value." },
  { name: "...props", type: "React.ComponentProps<'span'>", description: "Everything else lands on the span, `ref` and `className` included." },
];

export const mp3PlayerScrubberProps: PropDef[] = [
  { name: "peaks", type: "number[]", description: "0–1 amplitude values, one per bar. Falls back to the `peaks` passed to `MP3Player`. Renders as bars when present, otherwise a line." },
  { name: "...props", type: "React.ComponentProps<'div'>", description: "Everything else lands on the slider root, `ref` and `className` included." },
];

export const mp3PlayerSpeedProps: PropDef[] = [
  { name: "className", type: "string", description: "Merged onto the button." },
];

export const mp3PlayerDownloadProps: PropDef[] = [
  { name: "className", type: "string", description: "Merged onto the button." },
];

export const formatTimeProps: PropDef[] = [
  { name: "seconds", type: "number", description: "Elapsed seconds. Non-finite or negative values, and `NaN`, render as `0:00`." },
];
