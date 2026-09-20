import { describe, expect, it } from "vitest";
import { EditorState, type StateField } from "@codemirror/state";
import type { DecorationSet } from "@codemirror/view";
import { classify, embeds } from "@/content/demos/editor/editor-embeds";

// The field itself isn't exported (the demo exports only `classify`, `embeds`
// and its default component) — read its decorations back through the same
// StateField instance the extension array carries.
function fieldDecorations(state: EditorState): DecorationSet {
  const field = embeds[0] as StateField<{ decorations: DecorationSet }>;
  return state.field(field).decorations;
}

describe("classify", () => {
  it("recognizes a YouTube URL", () => {
    expect(classify("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      kind: "youtube",
      src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    });
  });

  it("recognizes a Spotify track URL", () => {
    expect(classify("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC")).toEqual({
      kind: "spotify",
      src: "https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC",
      height: 152,
    });
  });

  it("recognizes an image URL", () => {
    expect(classify("https://example.com/photo.jpg")).toEqual({
      kind: "image",
      src: "https://example.com/photo.jpg",
    });
  });

  it("leaves a root-relative path alone, so a pasted line cannot reach the reader's own origin", () => {
    expect(classify("/images/photo.jpg")).toBeNull();
    expect(classify("//example.com/photo.jpg")).toBeNull();
  });

  it("recognizes a video URL", () => {
    expect(classify("https://example.com/clip.mp4")).toEqual({
      kind: "video",
      src: "https://example.com/clip.mp4",
    });
  });

  it("decides from the path, so a query string cannot pass an endpoint off as an image", () => {
    expect(classify("https://example.com/api/logout?next=.png")).toBeNull();
    expect(classify("https://example.com/photo.png?width=800")).toEqual({
      kind: "image",
      src: "https://example.com/photo.png?width=800",
    });
  });

  it("returns null for a URL nothing can embed", () => {
    expect(classify("https://example.com/about")).toBeNull();
  });
});

describe("embeds", () => {
  it("chips and mounts the embed on an image line the caret is not on", () => {
    // given: an image URL on its own line, selection sitting on the line above
    const doc = "intro\nhttps://example.com/photo.jpg\n";
    const state = EditorState.create({ doc, extensions: [embeds], selection: { anchor: 0 } });

    // when: reading the field's decorations without ever focusing the editor
    const ranges: unknown[] = [];
    const cursor = fieldDecorations(state).iter();
    while (cursor.value) {
      ranges.push(cursor.value);
      cursor.next();
    }

    // then: the image line gets both the collapsed chip and the block embed
    expect(ranges).toHaveLength(2);
  });

  it("leaves a line with no embeddable URL undecorated", () => {
    const state = EditorState.create({ doc: "just some prose\n", extensions: [embeds] });
    expect(fieldDecorations(state).size).toBe(0);
  });
});
