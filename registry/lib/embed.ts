export type EmbedSource =
  | { kind: "youtube"; videoId: string }
  | { kind: "spotify"; type: "track" | "playlist" | "album" | "episode" | "show"; id: string }
  | { kind: "image"; url: string }
  | { kind: "video"; url: string }
  | { kind: "link"; url: string };

const ABSOLUTE_URL = /^https?:\/\/\S+$/;
const YOUTUBE_ID = /^[\w-]{11}$/;

function matchYouTube(parsed: URL): EmbedSource | null {
  const host = parsed.hostname.replace(/^(www\.|m\.)/, "");
  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1);
    return YOUTUBE_ID.test(id) ? { kind: "youtube", videoId: id } : null;
  }
  if (host !== "youtube.com") return null;
  if (parsed.pathname === "/watch") {
    const id = parsed.searchParams.get("v");
    return id && YOUTUBE_ID.test(id) ? { kind: "youtube", videoId: id } : null;
  }
  const path = parsed.pathname.match(/^\/(?:shorts|embed)\/([\w-]{11})$/);
  return path ? { kind: "youtube", videoId: path[1] } : null;
}

type SpotifyType = "track" | "playlist" | "album" | "episode" | "show";

function matchSpotify(parsed: URL): EmbedSource | null {
  if (parsed.hostname !== "open.spotify.com") return null;
  const match = parsed.pathname.match(
    /^\/(track|playlist|album|episode|show)\/([A-Za-z0-9]+)$/,
  );
  if (!match) return null;
  return { kind: "spotify", type: match[1] as SpotifyType, id: match[2] };
}

/** For UNTRUSTED text (a pasted line, a comment body). Null means "not a URL we
 *  will touch". */
export function classifyUrl(text: string): EmbedSource | null {
  const trimmed = text.trim();
  // Root- and protocol-relative paths ("/x.png", "//host/x.png") resolve
  // against the reader's own origin, so following one sends their cookies
  // wherever the pasted text points. Only an absolute http(s) URL qualifies.
  if (!ABSOLUTE_URL.test(trimmed)) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const youtube = matchYouTube(parsed);
  if (youtube) return youtube;

  const spotify = matchSpotify(parsed);
  if (spotify) return spotify;

  // Path only, never the full string — a query string could otherwise pass
  // an endpoint off as an image (e.g. "/api/logout?next=.png"), and an <img>
  // fires that GET with whatever cookies the reader has.
  const path = parsed.pathname;
  if (/\.(jpe?g|png|gif|webp|avif|svg)$/i.test(path)) return { kind: "image", url: trimmed };
  if (/\.(mp4|webm|mov)$/i.test(path)) return { kind: "video", url: trimmed };

  return { kind: "link", url: trimmed };
}
