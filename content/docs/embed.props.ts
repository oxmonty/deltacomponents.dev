import type { PropDef } from "@/lib/docs/props-table";

export const embedProps: PropDef[] = [
  {
    name: "url",
    type: "string",
    description: "Classified with classifyUrl; renders nothing for a URL nothing here can embed.",
  },
  {
    name: "className",
    type: "string",
    description: "Additional classes applied to whichever part ends up rendering.",
  },
  {
    name: "endpoint",
    type: "string | null",
    default: '"/api/link-preview"',
    description: "Where a plain link's preview is fetched from. Forwarded to LinkPreview only; null turns the fetch off.",
  },
];

export const youtubeEmbedProps: PropDef[] = [
  {
    name: "videoId",
    type: "string",
    description: "The 11-character YouTube video ID.",
  },
  {
    name: "title",
    type: "string",
    default: '"YouTube video"',
    description: "Accessible label for the play button and the iframe once it mounts.",
  },
  {
    name: "className",
    type: "string",
    description: "Additional classes applied to the root.",
  },
];

export const spotifyEmbedProps: PropDef[] = [
  {
    name: "type",
    type: '"track" | "playlist" | "album" | "episode" | "show"',
    description: "Picks the compact 152px player for a track or episode, the tall 352px one otherwise.",
  },
  {
    name: "id",
    type: "string",
    description: "The Spotify resource ID from the URL.",
  },
  {
    name: "className",
    type: "string",
    description: "Additional classes applied to the root.",
  },
];

export const videoEmbedProps: PropDef[] = [
  {
    name: "src",
    type: "string",
    description: "The video URL. Held back until the element is near the viewport.",
  },
  {
    name: "poster",
    type: "string",
    description: "An image shown until the video plays. Without one the opening frame stands in. Any other `<video>` attribute passes through the same way.",
  },
  {
    name: "className",
    type: "string",
    description: "Additional classes applied to the root.",
  },
];

export const imageEmbedProps: PropDef[] = [
  {
    name: "src",
    type: "string",
    description: "The image URL.",
  },
  {
    name: "alt",
    type: "string",
    default: '""',
    description: "Alt text. Empty by default, since a caller passing a bare URL rarely has one to give.",
  },
  {
    name: "className",
    type: "string",
    description: "Additional classes applied to the root.",
  },
];

export const linkPreviewProps: PropDef[] = [
  {
    name: "url",
    type: "string",
    description: "The link. Anything but `http(s)` renders nothing. With no `title`, the card shows the hostname and the full URL beneath it.",
  },
  {
    name: "title",
    type: "string",
    description: "The page's title. Passing it turns the plain card into a full preview, moves the hostname to the last line, and skips the fetch.",
  },
  {
    name: "description",
    type: "string",
    description: "One or two lines under the title; longer text is clamped to two. Passing it skips the fetch.",
  },
  {
    name: "image",
    type: "string",
    description: "A thumbnail, cropped to the 1.91:1 that link previews are drawn at. It sits beside the text, above it on a narrow screen, and passing it skips the fetch.",
  },
  {
    name: "className",
    type: "string",
    description: "Additional classes applied to the root.",
  },
  {
    name: "endpoint",
    type: "string | null",
    default: '"/api/link-preview"',
    description: "Where the title, description and image are fetched from when none of them are passed. null turns the fetch off.",
  },
];
