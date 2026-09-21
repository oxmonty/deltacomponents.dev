import { describe, expect, it } from "vitest";
import { EditorState, type StateField } from "@codemirror/state";
import type { DecorationSet } from "@codemirror/view";
import { embeds } from "@/content/demos/editor/editor-embeds";

// The field itself isn't exported (the demo exports only `embeds` and its
// default component) — read its decorations back through the same StateField
// instance the extension array carries.
function fieldDecorations(state: EditorState): DecorationSet {
  const field = embeds[0] as StateField<{ decorations: DecorationSet }>;
  return state.field(field).decorations;
}

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

  it("chips and mounts the embed on a generic link line the caret is not on", () => {
    // given: a plain link on its own line, selection sitting on the line above
    const doc = "intro\nhttps://example.com/about\n";
    const state = EditorState.create({ doc, extensions: [embeds], selection: { anchor: 0 } });

    // when: reading the field's decorations without ever focusing the editor
    const ranges: unknown[] = [];
    const cursor = fieldDecorations(state).iter();
    while (cursor.value) {
      ranges.push(cursor.value);
      cursor.next();
    }

    // then: the link line gets both the collapsed chip and the block embed,
    // now that a link becomes a fetched card instead of staying plain text
    expect(ranges).toHaveLength(2);
  });
});
