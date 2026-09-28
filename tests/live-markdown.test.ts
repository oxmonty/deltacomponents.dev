import { describe, it, expect } from "vitest";
import { indentMore } from "@codemirror/commands";
import { ensureSyntaxTree } from "@codemirror/language";
import { EditorState, type Transaction } from "@codemirror/state";
import { EditorView, keymap, type DecorationSet } from "@codemirror/view";
import { pasteURLAsLink } from "@codemirror/lang-markdown";
import {
  computeLiveDecorations,
  createMarks,
  formattingAt,
  insertLink,
  liveMarkdownBase,
  setHeading,
  toggleLinePrefix,
  toggleWrap,
} from "@/registry/lib/live-markdown";

function parsedState(doc: string, anchor = 0) {
  const state = EditorState.create({ doc, extensions: [liveMarkdownBase()] });
  // ensureSyntaxTree advances the parse context but not the state field that
  // syntaxTree() reads, so take a no-op transaction to pick the full tree up.
  ensureSyntaxTree(state, state.doc.length, 5000);
  return state.update({ selection: { anchor } }).state;
}

function serialize(set: DecorationSet): string[] {
  const out: string[] = [];
  const cursor = set.iter();
  while (cursor.value) {
    out.push(`${cursor.from}-${cursor.to} ${JSON.stringify(cursor.value.spec)}`);
    cursor.next();
  }
  return out;
}

const FIXTURE = [
  "# Heading One",
  "",
  "## Heading Two *emphasis*",
  "",
  "A paragraph with **bold**, *italic*, `code`, and [label](https://example.com).",
  "",
  "- top bullet",
  "  - nested bullet",
  "",
  "1. first item",
  "2. second item",
  "",
  "- [ ] todo item",
  "- [x] done item with trailing text",
  "",
  "**hello",
  "",
  "**a** and *b",
  "",
  "some <b>html</b> here",
  "",
  "```",
  "fenced code block",
  "```",
  "",
].join("\n");

const MIXED_BLOCK = [
  "# Heading",
  "## Heading two *emphasis*",
  "Paragraph with **bold**, *italic*, `code`, and [label](https://example.com).",
  "- top bullet",
  "  - nested bullet",
  "1. first item",
  "2. second item",
  "- [ ] todo item",
  "- [x] done item with trailing text",
  "**hello",
  "**a** and *b",
  "some <b>html</b> here",
  "",
].join("\n");

function docOfLines(count: number): string {
  const blockLines = MIXED_BLOCK.split("\n").length;
  const repeats = Math.ceil(count / blockLines);
  return MIXED_BLOCK.repeat(repeats);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function fullRange(state: EditorState) {
  return [{ from: 0, to: state.doc.length }];
}

/** A ~`lines`-line window centred on the document, the shape a real viewport
 *  decorates regardless of how long the document is. */
function middleWindow(state: EditorState, lines = 60) {
  const mid = Math.ceil(state.doc.lines / 2);
  const from = state.doc.line(Math.max(1, mid - lines / 2)).from;
  const to = state.doc.line(Math.min(state.doc.lines, mid + lines / 2)).to;
  return [{ from, to }];
}

describe("computeLiveDecorations", () => {
  const marks = createMarks();
  const boldAnchor = FIXTURE.indexOf("**bold**") + "**bo".length;
  const plainLineAnchor = FIXTURE.indexOf("top bullet") + 1;

  it("matches the golden snapshot when focused inside a bold construct", () => {
    const state = parsedState(FIXTURE, boldAnchor);
    expect(serialize(computeLiveDecorations(state, true, marks, fullRange(state)))).toMatchSnapshot();
  });

  it("matches the golden snapshot when focused on a plain line", () => {
    const state = parsedState(FIXTURE, plainLineAnchor);
    expect(serialize(computeLiveDecorations(state, true, marks, fullRange(state)))).toMatchSnapshot();
  });

  it("matches the golden snapshot when unfocused", () => {
    const state = parsedState(FIXTURE, boldAnchor);
    expect(serialize(computeLiveDecorations(state, false, marks, fullRange(state)))).toMatchSnapshot();
  });

  it("keeps every fully-enclosed decoration when windowed to a middle slice of lines", () => {
    const state = parsedState(FIXTURE, boldAnchor);
    const full = computeLiveDecorations(state, true, marks, fullRange(state));

    // Lines 7-14: the bullet list, nested bullet, ordered list, and both tasks.
    const windowFrom = state.doc.line(7).from;
    const windowTo = state.doc.line(14).to;
    const windowed = computeLiveDecorations(state, true, marks, [{ from: windowFrom, to: windowTo }]);
    const windowedSet = new Set(serialize(windowed));

    const cursor = full.iter();
    while (cursor.value) {
      if (cursor.from >= windowFrom && cursor.to <= windowTo) {
        expect(windowedSet).toContain(`${cursor.from}-${cursor.to} ${JSON.stringify(cursor.value.spec)}`);
      }
      cursor.next();
    }
  });

  // Ratios, not millisecond budgets: linear is ~10x, and the per-line
  // filter this replaced measured ~45x.
  it("scales roughly linearly with document length", () => {
    const doc1k = docOfLines(1000);
    const doc10k = docOfLines(10000);
    const state1k = parsedState(doc1k);
    const state10k = parsedState(doc10k);

    const time = (state: EditorState, visible: { from: number; to: number }[]) => {
      for (let i = 0; i < 2; i++) computeLiveDecorations(state, false, marks, visible);
      const samples: number[] = [];
      for (let i = 0; i < 15; i++) {
        const start = performance.now();
        computeLiveDecorations(state, false, marks, visible);
        samples.push(performance.now() - start);
      }
      return median(samples);
    };

    const t1k = time(state1k, fullRange(state1k));
    const t10k = time(state10k, fullRange(state10k));
    expect(t10k / t1k).toBeLessThan(20);

    // A real viewport decorates a fixed-size window regardless of document
    // length, so its cost should barely grow with the document at all.
    const windowed1k = time(state1k, middleWindow(state1k));
    const windowed10k = time(state10k, middleWindow(state10k));
    expect(windowed10k / windowed1k).toBeLessThan(5);
  }, 30_000);

  it("content attributes carry iOS keyboard behaviour (autocapitalize, autocorrect, spellcheck)", () => {
    const attrsList = parsedState("x").facet(EditorView.contentAttributes);
    const merged = Object.assign(
      {},
      ...attrsList.filter((a): a is Record<string, string> => typeof a === "object"),
    );
    expect(merged.autocapitalize).toBe("sentences");
    expect(merged.autocorrect).toBe("on");
    expect(merged.spellcheck).toBe("true");
  });

  // markdown() used to install it implicitly; with the bare language it is
  // ours to keep.
  it("keeps paste-URL-as-link installed", () => {
    expect(liveMarkdownBase().flat(5)).toContain(pasteURLAsLink);
  });

  it("keeps an indented paragraph a paragraph, not code", () => {
    const state = EditorState.create({
      doc: "    Click here. The editor is **always on** today.",
      extensions: [liveMarkdownBase()],
    });
    const names: string[] = [];
    ensureSyntaxTree(state, state.doc.length, 5000)!.iterate({ enter: (n) => void names.push(n.name) });
    expect(names).toContain("StrongEmphasis");
    expect(names).not.toContain("CodeBlock");
  });

  it("indents every selected line with Tab", () => {
    const doc = "- one\n- two";
    let state = EditorState.create({ doc, extensions: [liveMarkdownBase()] });
    state = state.update({ selection: { anchor: 0, head: doc.length } }).state;
    indentMore({ state, dispatch: (tr) => (state = tr.state) });
    expect(state.doc.line(1).text).toBe("    - one");
    expect(state.doc.line(2).text).toBe("    - two");
  });
});

describe("block markers wait for their space", () => {
  const marks = createMarks();
  const decorate = (doc: string) => {
    // given: an unfocused editor, so nothing is revealed for the caret's sake
    const state = parsedState(doc);
    return serialize(computeLiveDecorations(state, false, marks, fullRange(state)));
  };

  it("leaves a bare marker as the text that was typed", () => {
    for (const doc of ["*", "-", "+", "1.", "#", "##", "######"]) {
      expect(decorate(doc), JSON.stringify(doc)).toEqual([]);
    }
  });

  it("leaves a bare marker alone when it follows other content", () => {
    expect(decorate("intro\n\n*")).toEqual([]);
    expect(decorate("intro\n\n#")).toEqual([]);
  });

  it("treats the marker as a bullet, a numbered row or a heading once a space follows", () => {
    for (const doc of ["* ", "- ", "+ ", "1. ", "# ", "## "]) {
      expect(decorate(doc).length, JSON.stringify(doc)).toBeGreaterThan(0);
    }
  });

  it("still opens emphasis from a star that is followed by text", () => {
    // given: "*it" is the start of *italic*, never a list
    const decorations = decorate("*it");
    expect(decorations.length).toBeGreaterThan(0);
    expect(decorations.join(" ")).not.toContain("cm-md-li");
  });
});

describe("toolbar commands", () => {
  // given: a document with the whole of it selected, run one command over it
  const apply = (doc: string, command: (t: { state: EditorState; dispatch: (tr: Transaction) => void }) => boolean, from = 0, to = doc.length) => {
    let state = EditorState.create({ doc, extensions: [liveMarkdownBase()] });
    state = state.update({ selection: { anchor: from, head: to } }).state;
    command({ state, dispatch: (tr) => (state = tr.state) });
    return state;
  };

  it("toggles a line prefix: adds to plain, swaps another marker, removes its own", () => {
    expect(apply("plain", toggleLinePrefix("bullet")).doc.toString()).toBe("- plain");
    expect(apply("- plain", toggleLinePrefix("task")).doc.toString()).toBe("- [ ] plain");
    expect(apply("- [ ] plain", toggleLinePrefix("task")).doc.toString()).toBe("plain");
    expect(apply("> plain", toggleLinePrefix("quote")).doc.toString()).toBe("plain");
  });

  it("numbers an ordered list through the selection and keeps the indent", () => {
    const doc = "  a\n- b\nc";
    expect(apply(doc, toggleLinePrefix("ordered")).doc.toString()).toBe("  1. a\n2. b\n3. c");
  });

  it("keeps the caret after a prefix it inserted", () => {
    const state = apply("plain", toggleLinePrefix("task"), 0, 0);
    expect(state.selection.main.head).toBe("- [ ] ".length);
  });

  it("sets and clears a heading level without toggling a re-selected one", () => {
    expect(apply("title", setHeading(2)).doc.toString()).toBe("## title");
    expect(apply("# title", setHeading(3)).doc.toString()).toBe("### title");
    expect(apply("## title", setHeading(0)).doc.toString()).toBe("title");
    expect(setHeading(2)({ state: apply("## title", setHeading(2)), dispatch: () => {} })).toBe(false);
  });

  it("links the selection and leaves the placeholder url selected", () => {
    const state = apply("word", insertLink());
    expect(state.doc.toString()).toBe("[word](url)");
    expect(state.sliceDoc(state.selection.main.from, state.selection.main.to)).toBe("url");
    expect(apply("", insertLink(true)).doc.toString()).toBe("![alt](url)");
  });

  it("strikes through and unwraps again", () => {
    const once = apply("word", toggleWrap("~~"));
    expect(once.doc.toString()).toBe("~~word~~");
    expect(toggleWrap("~~")({ state: once, dispatch: () => {} })).toBe(true);
  });

  it("reads the formatting in force at the caret", () => {
    const state = parsedState("## A **bold** and ~~gone~~ line\n- [ ] task", "## A **bo".length);
    const at = formattingAt(state);
    expect(at).toMatchObject({ heading: 2, strong: true, em: false, del: false, line: null, canUndo: false });
    // then: a caret just past the closing marks still counts as inside them
    expect(formattingAt(state.update({ selection: { anchor: "## A **bold**".length } }).state).strong).toBe(true);
    expect(formattingAt(state.update({ selection: { anchor: state.doc.length } }).state).line).toBe("task");
  });

  it("decorates a quote row and conceals its marker, caret on the row or not", () => {
    for (const focused of [false, true]) {
      const state = parsedState("> quoted\nplain", 3);
      const decorations = serialize(computeLiveDecorations(state, focused, createMarks(), fullRange(state))).join(" ");
      expect(decorations).toContain("cm-md-quote");
      expect(decorations).toContain("0-2 {}");
    }
  });

  it("leaves a quote on the second Enter, like a list", () => {
    const enter = (state: EditorState) => {
      const bindings = state.facet(keymap).flat().filter((b) => b.key === "Enter");
      let next = state;
      for (const b of bindings) if (b.run!({ state: next, dispatch: (tr: Transaction) => (next = tr.state) } as never)) break;
      return next;
    };
    let state = EditorState.create({ doc: "> quoted", extensions: [liveMarkdownBase()], selection: { anchor: 8 } });
    state = enter(state);
    expect(state.doc.toString()).toBe("> quoted\n> ");
    state = enter(state);
    expect(state.doc.toString()).toBe("> quoted\n");
    expect(state.selection.main.head).toBe(state.doc.length);
  });
});
