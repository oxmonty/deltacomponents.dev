"use client";

import { StateEffect, StateField, type EditorState, type Range } from "@codemirror/state";
import { Decoration, EditorView, WidgetType, type DecorationSet } from "@codemirror/view";
import { createRoot, type Root } from "react-dom/client";
import { Editor } from "@/registry/ui/editor";
import { classifyUrl, type EmbedSource } from "@/registry/lib/embed";
import { Embed } from "@/registry/ui/embed";

// Keyed by the mounted DOM node so destroy() can find the React root and the
// observer that belong to it.
const widgetInstances = new WeakMap<HTMLElement, { root: Root; observer: ResizeObserver }>();

class EmbedWidget extends WidgetType {
  constructor(
    readonly url: string,
    readonly source: EmbedSource,
  ) {
    super();
  }

  // Keyed on the URL so CodeMirror keeps the same DOM across unrelated
  // edits instead of remounting the embed per keystroke.
  eq(other: EmbedWidget) {
    return other.url === this.url;
  }

  get estimatedHeight() {
    if (this.source.kind === "spotify") {
      return this.source.type === "track" || this.source.type === "episode" ? 152 : 352;
    }
    if (this.source.kind === "link") return 102;
    return 315; // 16:9 at a 560px column; an image's real height lands on mount
  }

  toDOM(view: EditorView) {
    const dom = document.createElement("div");
    dom.className = "py-2";
    // A press in here lands inside the editor's editable area, so the browser
    // focuses the editor and a phone raises the keyboard over the picture
    // being opened. Cancelling the press keeps focus where it was; the click
    // still goes through. Not on a video, whose timeline is dragged.
    dom.addEventListener("mousedown", (event) => {
      if (!(event.target as Element).closest("video")) event.preventDefault();
    });

    const root = createRoot(dom);
    root.render(<Embed url={this.url} />);

    // React renders after this method returns, and an image's real height
    // lands later still — CodeMirror has to be told when the box it measured
    // turns out to be wrong.
    const observer = new ResizeObserver(() => view.requestMeasure());
    observer.observe(dom);
    widgetInstances.set(dom, { root, observer });

    return dom;
  }

  destroy(dom: HTMLElement) {
    const instance = widgetInstances.get(dom);
    if (!instance) return;
    instance.observer.disconnect();
    // CodeMirror destroys widgets from inside its own update; React refuses a
    // synchronous unmount called from there.
    queueMicrotask(() => instance.root.unmount());
  }
}

function chipLabel(url: string): string {
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
    const source = classifyUrl(url);
    if (!source) continue;

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
        Decoration.widget({ widget: new EmbedWidget(url, source), block: true, side: 1 }).range(
          line.to,
        ),
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
  "A **watch**, **share** or **shorts** link grows a player. It comes from `youtube-nocookie.com`, and only once you press play.",
  "",
  "https://www.youtube.com/watch?v=eVjP9Vnh2xE",
  "",
  "## Spotify",
  "",
  "Tracks and episodes get the *compact* player. Albums, playlists and shows get the tall one.",
  "",
  "https://open.spotify.com/track/6K4t31amVTZDgR3sKmwUJJ",
  "",
  "## Link",
  "",
  "Any other link becomes a card, filled in from the page's own title, description and picture.",
  "",
  "https://patrickprunty.com",
  "",
  "## Image",
  "",
  "Any link whose path ends in an image extension. It fills the column and keeps its own proportions. Click it to enlarge.",
  "",
  "https://www.deltacomponents.dev/images/editor-embed-sample.webp",
  "",
  "## Video",
  "",
  "An `.mp4`, `.webm` or `.mov` plays where it sits, with the browser's own controls.",
  "",
  "https://www.deltacomponents.dev/videos/swainsons-hawk.mp4",
].join("\n");

export default function EditorEmbeds() {
  return <Editor className="w-full max-w-[560px]" extensions={embeds} defaultValue={NOTE} />;
}
