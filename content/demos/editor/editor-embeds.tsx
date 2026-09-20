"use client";

import { StateEffect, StateField, type EditorState, type Range } from "@codemirror/state";
import { Decoration, EditorView, WidgetType, type DecorationSet } from "@codemirror/view";
import { Editor } from "@/registry/ui/editor";

type Classified =
  | { kind: "youtube"; src: string }
  | { kind: "spotify"; src: string; height: number }
  | { kind: "image"; src: string }
  | { kind: "video"; src: string };

const CANDIDATE_LINE = /^(?:https?:\/\/|\/)\S+$/;
const YOUTUBE_ID = /^[\w-]{11}$/;

function matchYouTubeId(parsed: URL): string | null {
  const host = parsed.hostname.replace(/^(www\.|m\.)/, "");
  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1);
    return YOUTUBE_ID.test(id) ? id : null;
  }
  if (host !== "youtube.com") return null;
  if (parsed.pathname === "/watch") {
    const id = parsed.searchParams.get("v");
    return id && YOUTUBE_ID.test(id) ? id : null;
  }
  const path = parsed.pathname.match(/^\/(?:shorts|embed)\/([\w-]{11})$/);
  return path ? path[1] : null;
}

function matchSpotify(parsed: URL): { type: string; id: string } | null {
  if (parsed.hostname !== "open.spotify.com") return null;
  const match = parsed.pathname.match(/^\/(track|playlist|album|episode|show)\/([A-Za-z0-9]+)$/);
  return match ? { type: match[1], id: match[2] } : null;
}

export function classify(url: string): Classified | null {
  try {
    const parsed = new URL(url);
    const youtubeId = matchYouTubeId(parsed);
    if (youtubeId) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${youtubeId}` };
    const spotify = matchSpotify(parsed);
    if (spotify) {
      const height = spotify.type === "track" || spotify.type === "episode" ? 152 : 352;
      return { kind: "spotify", src: `https://open.spotify.com/embed/${spotify.type}/${spotify.id}`, height };
    }
  } catch {
    // Not an absolute URL — YouTube and Spotify never match a relative path.
  }
  if (/\.(jpe?g|png|gif|webp|avif|svg)(\?.*)?$/i.test(url)) return { kind: "image", src: url };
  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(url)) return { kind: "video", src: url };
  return null;
}

// loading="lazy" starts fetching thousands of pixels before the viewport, so
// a player far down a page would still load with it. The src is held back
// until the player is about to be seen.
const pendingLoads = new WeakMap<HTMLElement, IntersectionObserver>();

function loadWhenNear(player: HTMLIFrameElement | HTMLVideoElement, src: string) {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      player.src = src;
      observer.disconnect();
    },
    { rootMargin: "200px" },
  );
  observer.observe(player);
  pendingLoads.set(player, observer);
}

class EmbedWidget extends WidgetType {
  constructor(readonly embed: Classified) {
    super();
  }

  // Keyed on the URL so CodeMirror keeps the same DOM across unrelated
  // edits instead of reloading an iframe per keystroke.
  eq(other: EmbedWidget) {
    return other.embed.kind === this.embed.kind && other.embed.src === this.embed.src;
  }

  get estimatedHeight() {
    if (this.embed.kind === "spotify") return this.embed.height;
    return 315; // 16:9 at a 560px column; an image's real height lands on load
  }

  toDOM(view: EditorView) {
    const wrapper = document.createElement("div");
    wrapper.className = "py-2";

    if (this.embed.kind === "image") {
      const img = document.createElement("img");
      // Not loading="lazy": at `h-auto` an unloaded image is zero pixels tall,
      // and a zero-area image never counts as near the viewport. CodeMirror
      // only builds widgets for the lines on screen, which is the laziness.
      img.src = this.embed.src;
      img.alt = "";
      img.className = "block h-auto w-full rounded-md";
      // The height is only known once it loads; the lines below have moved.
      img.addEventListener("load", () => view.requestMeasure());
      wrapper.appendChild(img);
      return wrapper;
    }

    if (this.embed.kind === "video") {
      const video = document.createElement("video");
      loadWhenNear(video, this.embed.src);
      video.controls = true;
      video.preload = "metadata";
      video.className = "block aspect-video w-full rounded-md border-0";
      wrapper.appendChild(video);
      return wrapper;
    }

    const iframe = document.createElement("iframe");
    loadWhenNear(iframe, this.embed.src);
    iframe.allow = "encrypted-media; picture-in-picture; fullscreen";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.title = this.embed.kind === "youtube" ? "YouTube video" : "Spotify player";
    if (this.embed.kind === "spotify") {
      iframe.className = "block w-full rounded-md border-0";
      iframe.style.height = `${this.embed.height}px`;
    } else {
      iframe.className = "block aspect-video w-full rounded-md border-0";
    }
    wrapper.appendChild(iframe);
    return wrapper;
  }

  destroy(dom: HTMLElement) {
    const player = dom.firstElementChild;
    if (player instanceof HTMLElement) pendingLoads.get(player)?.disconnect();
  }
}

function chipLabel(url: string): string {
  if (url.startsWith("/")) return url.split("/").pop() || url;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

class ChipWidget extends WidgetType {
  constructor(readonly url: string) {
    super();
  }

  eq(other: ChipWidget) {
    return other.url === this.url;
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "rounded bg-muted px-1.5 py-0.5 text-sm text-muted-foreground cursor-text";
    span.title = this.url;
    span.textContent = chipLabel(this.url);
    return span;
  }

  // Lets CodeMirror turn the click into a caret placement instead of
  // swallowing it — that's what reveals the raw URL for editing.
  ignoreEvent() {
    return false;
  }
}

interface EmbedsValue {
  decorations: DecorationSet;
  activated: Set<string>;
  hasFocus: boolean;
}

function buildDecorations(
  state: EditorState,
  previousActivated: Set<string>,
  hasFocus: boolean,
): Pick<EmbedsValue, "decorations" | "activated"> {
  const ranges: Range<Decoration>[] = [];
  const activated = new Set<string>();
  const sel = state.selection.main;

  // ponytail: scans every line, because a state field cannot see the
  // viewport. Map the set through tr.changes and rescan only the touched
  // lines if documents get long.
  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber++) {
    const line = state.doc.line(lineNumber);
    const url = line.text.trim();
    if (!CANDIDATE_LINE.test(url)) continue;
    const embed = classify(url);
    if (!embed) continue;

    const caretOnLine = hasFocus && sel.from <= line.to && sel.to >= line.from;
    if (!caretOnLine) {
      ranges.push(Decoration.replace({ widget: new ChipWidget(url) }).range(line.from, line.to));
    }
    // Every prefix of a URL being typed is itself a valid URL, so the embed
    // mounts once the caret first leaves the line — never mid-keystroke —
    // and then stays while the caret comes and goes.
    if (!caretOnLine || previousActivated.has(url)) {
      activated.add(url);
      ranges.push(
        Decoration.widget({ widget: new EmbedWidget(embed), block: true, side: 1 }).range(line.to),
      );
    }
  }

  return { decorations: Decoration.set(ranges, true), activated };
}

const setFocus = StateEffect.define<boolean>();

// A StateField can't read view focus, and an unfocused editor still has a
// selection (position 0), so focus is fed in as an effect instead.
const focusNotifier = EditorView.focusChangeEffect.of((_state, focusing) => setFocus.of(focusing));

// Block decorations have to come from a StateField — CodeMirror forbids a
// view plugin from producing them.
const embedField = StateField.define<EmbedsValue>({
  create(state) {
    const { decorations, activated } = buildDecorations(state, new Set(), false);
    return { decorations, activated, hasFocus: false };
  },
  update(value, tr) {
    let hasFocus = value.hasFocus;
    for (const effect of tr.effects) {
      if (effect.is(setFocus)) hasFocus = effect.value;
    }
    if (!tr.docChanged && !tr.selection && hasFocus === value.hasFocus) return value;
    const { decorations, activated } = buildDecorations(tr.state, value.activated, hasFocus);
    return { decorations, activated, hasFocus };
  },
  provide: (field) => EditorView.decorations.from(field, (value) => value.decorations),
});

export const embeds = [embedField, focusNotifier];

const NOTE = [
  "# Embeds",
  "",
  "A link alone on a line becomes what it points to. Paste one of your own, then move the caret off the line.",
  "",
  "## YouTube",
  "",
  "https://www.youtube.com/watch?v=aircAruvnKk",
  "",
  "## Spotify",
  "",
  "https://open.spotify.com/track/6K4t31amVTZDgR3sKmwUJJ",
  "",
  "## Image",
  "",
  "/images/editor-embed-sample.webp",
  "",
  "## Video",
  "",
  "/videos/swainsons-hawk.mp4",
].join("\n");

export default function EditorEmbeds() {
  return <Editor className="w-full max-w-[560px]" extensions={embeds} defaultValue={NOTE} />;
}
