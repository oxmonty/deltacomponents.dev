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
  insertHorizontalRule,
  insertLink,
  liveMarkdownBase,
  setHeading,
  taskMarkerRanges,
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

  it("puts a rule on its own line, never directly under text", () => {
    // then: a blank line separates text from the rule, or markdown reads a setext heading
    expect(apply("text", insertHorizontalRule, 4, 4).doc.toString()).toBe("text\n\n---\n");
    expect(apply("text\n", insertHorizontalRule, 5, 5).doc.toString()).toBe("text\n\n---\n");
    expect(apply("", insertHorizontalRule).doc.toString()).toBe("---\n");
    const state = apply("text", insertHorizontalRule, 4, 4);
    expect(state.selection.main.head).toBe(state.doc.length);
  });

  it("replaces a rule with a widget off the caret and shows the dashes on it", () => {
    const off = parsedState("a\n\n---\n\nb", 0);
    const on = parsedState("a\n\n---\n\nb", 4);
    const marks = createMarks();
    expect(serialize(computeLiveDecorations(off, true, marks, fullRange(off))).join(" ")).toContain("widget");
    expect(serialize(computeLiveDecorations(on, true, marks, fullRange(on))).join(" ")).not.toContain("widget");
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
    // then: a blank line between the quote and the caret, or the next sentence
    // is a lazy continuation and renders back inside the quote
    expect(state.doc.toString()).toBe("> quoted\n\n");
    expect(state.selection.main.head).toBe(state.doc.length);
  });
});

describe("toggleWrap stacking", () => {
  // given: thread a command through an evolving state, the same shape `apply` uses
  const run = (state: EditorState, command: (t: { state: EditorState; dispatch: (tr: Transaction) => void }) => boolean) => {
    let next = state;
    command({ state, dispatch: (tr) => (next = tr.state) });
    return next;
  };
  // given: simulate typing at the caret
  const type = (state: EditorState, text: string) => {
    const pos = state.selection.main.head;
    return state.update({ changes: { from: pos, insert: text }, selection: { anchor: pos + text.length } }).state;
  };
  const selected = (state: EditorState) => state.sliceDoc(state.selection.main.from, state.selection.main.to);

  it("stacks bold then italic then bold back down to plain", () => {
    // given: "Select" selected in a plain sentence
    let state = EditorState.create({ doc: "Select a word", extensions: [liveMarkdownBase()], selection: { anchor: 0, head: 6 } });
    // when: bold, then italic on top of it
    state = run(state, toggleWrap("**"));
    expect(state.doc.toString()).toBe("**Select** a word");
    expect(selected(state)).toBe("Select");
    state = run(state, toggleWrap("*"));
    expect(state.doc.toString()).toBe("***Select*** a word");
    expect(selected(state)).toBe("Select");
    // then: bold peels off first, italic remains, then italic peels off too
    state = run(state, toggleWrap("**"));
    expect(state.doc.toString()).toBe("*Select* a word");
    expect(selected(state)).toBe("Select");
    state = run(state, toggleWrap("*"));
    expect(state.doc.toString()).toBe("Select a word");
  });

  it("stacks italic then bold then italic back down to bold", () => {
    let state = EditorState.create({ doc: "Select", extensions: [liveMarkdownBase()], selection: { anchor: 0, head: 6 } });
    state = run(state, toggleWrap("*"));
    expect(state.doc.toString()).toBe("*Select*");
    state = run(state, toggleWrap("**"));
    expect(state.doc.toString()).toBe("***Select***");
    // then: italic peels off, bold remains
    state = run(state, toggleWrap("*"));
    expect(state.doc.toString()).toBe("**Select**");
    expect(selected(state)).toBe("Select");
  });

  it.each([
    ["**", "bold"],
    ["*", "italic"],
    ["~~", "strikethrough"],
    ["`", "code"],
  ])("steps the caret past its own closer instead of stacking a new pair (%s)", (marker) => {
    let state = EditorState.create({ doc: "", extensions: [liveMarkdownBase()] });
    // given: toggling on nothing opens an empty pair with the caret inside
    state = run(state, toggleWrap(marker));
    expect(state.doc.toString()).toBe(marker + marker);
    expect(state.selection.main.from).toBe(marker.length);
    expect(state.selection.main.to).toBe(marker.length);
    // when: typing content, then toggling the same marker again to close it
    state = type(state, "typed");
    expect(state.doc.toString()).toBe(`${marker}typed${marker}`);
    state = run(state, toggleWrap(marker));
    // then: the caret lands after the closer, nothing new is inserted
    expect(state.doc.toString()).toBe(`${marker}typed${marker}`);
    expect(state.selection.main.head).toBe(state.doc.length);
    state = type(state, " plain");
    expect(state.doc.toString()).toBe(`${marker}typed${marker} plain`);
  });

  it("collapses an empty pair back to nothing", () => {
    let state = EditorState.create({ doc: "", extensions: [liveMarkdownBase()] });
    state = run(state, toggleWrap("**"));
    state = run(state, toggleWrap("**"));
    expect(state.doc.toString()).toBe("");
  });

  it("still unwraps a selection that includes the markers themselves", () => {
    const state = EditorState.create({ doc: "**Select**", extensions: [liveMarkdownBase()], selection: { anchor: 0, head: 10 } });
    expect(run(state, toggleWrap("**")).doc.toString()).toBe("Select");
  });
});

/** Every Enter binding in order, the way the editor runs them. */
function pressKey(state: EditorState, key: string) {
  const bindings = state.facet(keymap).flat().filter((b) => b.key === key);
  let next = state;
  for (const b of bindings)
    if (b.run!({ state: next, dispatch: (tr: Transaction) => (next = tr.state) } as never)) break;
  return next;
}

function caretState(doc: string, anchor: number) {
  return EditorState.create({ doc, extensions: [liveMarkdownBase()], selection: { anchor } });
}

/** Home, through the real bindings. Only ours is a StateCommand — the stock
 *  line-start command past it measures a live EditorView — so `handled: false`
 *  IS the fall-through to it. */
function pressHome(state: EditorState) {
  const [ours] = state.facet(keymap).flat().filter((b) => b.key === "Home");
  let next = state;
  const handled = ours.run!({ state, dispatch: (tr: Transaction) => (next = tr.state) } as never);
  return { state: next, handled };
}

describe("quote markers conceal on every row", () => {
  const marks = createMarks();
  const decorate = (doc: string, anchor: number, focused: boolean) =>
    serialize(computeLiveDecorations(parsedState(doc, anchor), focused, marks, fullRange(parsedState(doc, anchor))));

  it("hides the marker on a continued row, not just the one that opens the quote", () => {
    // given: "> a\n> b", whose second `>` is a child of the Paragraph, not of
    // the Blockquote — getChildren("QuoteMark") on the quote never saw it
    for (const focused of [false, true]) {
      // when: the caret sits on the second row
      const decorations = decorate("> a\n> b", 6, focused);
      // then: both markers are concealed, and both rows carry the rule
      expect(decorations, String(focused)).toContain("0-2 {}");
      expect(decorations, String(focused)).toContain("4-6 {}");
      expect(decorations.filter((d) => d.includes("cm-md-quote"))).toHaveLength(2);
    }
  });

  it("hides both markers of a nested row without overlapping them", () => {
    // given/when: "> > x" puts two marks on one row, back to back
    const decorations = decorate("> > x", 0, true);
    // then: they conceal as two adjacent ranges (an overlap would have thrown)
    expect(decorations).toContain("0-2 {}");
    expect(decorations).toContain("2-4 {}");
  });
});

describe("leaving a quote leaves a blank line; leaving a list clears the marker", () => {
  const typeAtCaret = (state: EditorState, text: string) =>
    state.update({ changes: { from: state.selection.main.head, insert: text } }).state;

  const nodeNamesAt = (doc: string, pos: number) => {
    const names: string[] = [];
    for (
      let node = ensureSyntaxTree(parsedState(doc), doc.length, 5000)!.resolveInner(pos, 1) as {
        name: string;
        parent: unknown;
      } | null;
      node;
      node = node.parent as typeof node
    )
      names.push(node.name);
    return names;
  };

  it("puts an empty row between the quote and the caret", () => {
    // given: the caret at the end of a quoted row
    let state = caretState("> a", 3);
    // when: Enter twice, the second on a row that is only its marker
    state = pressKey(state, "Enter");
    expect(state.doc.toString()).toBe("> a\n> ");
    state = pressKey(state, "Enter");
    // then: the quote, a blank line, and the caret on its own row
    expect(state.doc.toString()).toBe("> a\n\n");
    expect(state.selection.main.head).toBe(5);
  });

  it("keeps what is typed after a quote out of it", () => {
    let state = pressKey(pressKey(caretState("> a", 3), "Enter"), "Enter");
    state = typeAtCaret(state, "x");
    expect(state.doc.toString()).toBe("> a\n\nx");
    // then: the new sentence is its own paragraph, not a lazy continuation
    expect(nodeNamesAt(state.doc.toString(), 5)).not.toContain("Blockquote");
  });

  it("clears a list marker in place and stays on the row", () => {
    // given: the caret at the end of an item
    let state = pressKey(caretState("- one", 5), "Enter");
    expect(state.doc.toString()).toBe("- one\n- ");
    // when: Enter on the empty item
    state = pressKey(state, "Enter");
    // then: the glyph goes, the caret does not move down a row
    expect(state.doc.toString()).toBe("- one\n");
    expect(state.selection.main.head).toBe(6);
    expect(pressKey(caretState("- [ ] one\n- [ ] ", 16), "Enter").doc.toString()).toBe("- [ ] one\n");
    expect(pressKey(caretState("1. one\n2. ", 10), "Enter").doc.toString()).toBe("1. one\n");
  });

  it("still outdents a nested empty item one level before leaving the list", () => {
    // given: an empty item nested under a top-level one
    let state = pressKey(caretState("- one\n    - two", 15), "Enter");
    // when: Enter on it
    state = pressKey(state, "Enter");
    // then: it outdents rather than exiting — clearing the marker is one more Enter
    expect(state.doc.toString()).toBe("- one\n    - two\n- ");
    expect(pressKey(state, "Enter").doc.toString()).toBe("- one\n    - two\n");
  });
});

describe("Enter at the start of an item's text", () => {
  it("opens a complete empty item above, marker and space", () => {
    // given: the caret right after the marker, with content after it
    // then: the new row is a committed marker, never a bare "-"
    for (const [doc, caret, expected] of [
      ["- one", 2, "- \n- one"],
      ["1. one", 3, "1. \n2. one"],
      ["    - one", 6, "    - \n    - one"],
      ["- [ ] one", 6, "- [ ] \n- [ ] one"],
    ] as const) {
      const state = pressKey(caretState(doc, caret), "Enter");
      expect(state.doc.toString(), doc).toBe(expected);
      // then: the caret stays on its own words, after the pushed-down marker
      expect(state.selection.main.head, doc).toBe(expected.length - "one".length);
    }
  });

  it("draws the empty row it leaves behind as a list row", () => {
    const state = parsedState("- \n- one");
    expect(
      serialize(computeLiveDecorations(state, false, createMarks(), fullRange(state))).join(" "),
    ).toContain("cm-md-li");
  });

  it("leaves Enter elsewhere on the row to CodeMirror", () => {
    expect(pressKey(caretState("- one", 5), "Enter").doc.toString()).toBe("- one\n- ");
    expect(pressKey(caretState("- one", 4), "Enter").doc.toString()).toBe("- on\n- e");
  });
});

describe("a task row's marker is one unit to the caret", () => {
  it("draws the whole marker as a single checkbox", () => {
    // given: "- [ ] text", which used to be a hidden "- " beside a widget
    const state = parsedState("- [ ] text");
    const decorations = serialize(computeLiveDecorations(state, false, createMarks(), fullRange(state)));
    // then: one replaced range over "- [ ]", so there is no seam to sit in
    const replaced = decorations.filter((d) => d.includes("widget"));
    expect(replaced).toHaveLength(1);
    expect(replaced[0]).toMatch(/^0-5 /);
    expect(replaced[0]).toContain('"markerOffset":2');
  });

  it("makes every position inside the marker and its space atomic", () => {
    const state = parsedState("- [ ] text");
    const atomic = taskMarkerRanges(state, fullRange(state));
    const spans: [number, number][] = [];
    const cursor = atomic.iter();
    while (cursor.value) {
      spans.push([cursor.from, cursor.to]);
      cursor.next();
    }
    // then: the row start through the text start, so a caret aimed at the line
    // start or dropped in the middle is pushed to one edge, never left at 2
    expect(spans).toEqual([[0, 6]]);
  });

  it("removes the whole marker with one Backspace at the text start", () => {
    const state = pressKey(caretState("- [ ] text", 6), "Backspace");
    expect(state.doc.toString()).toBe("text");
    expect(state.selection.main.head).toBe(0);
  });

  it("sends the first Home to the text and the second to the row start", () => {
    // given: the caret in the middle of a task row's words
    const first = pressHome(caretState("- [ ] task", 8));
    // then: it stops at the text, not in front of the checkbox
    expect(first.handled).toBe(true);
    expect(first.state.selection.main.head).toBe(6);
    // when: Home again, already at the text start
    const second = pressHome(first.state);
    // then: ours declines, so the stock line-start command takes it to 0
    expect(second.handled).toBe(false);
  });

  it("stops at the text on a quote row too, and leaves a plain line alone", () => {
    expect(pressHome(caretState("> quoted", 5)).state.selection.main.head).toBe(2);
    expect(pressHome(caretState("plain words", 6)).handled).toBe(false);
  });
});

describe("indent affordances", () => {
  const LIST = "para\n- a\n- b\n  - b1\n  - b2";
  const at = (needle: string) => formattingAt(parsedState(LIST, LIST.indexOf(needle) + 2));

  it("refuses to indent a row with no sibling above it to nest under", () => {
    // given: `- a` opens the list and `  - b1` opens the nested one
    // then: indenting either writes a marker markdown reads as plain text
    expect(at("- a").canIndent).toBe(false);
    expect(at("- b1").canIndent).toBe(false);
  });

  it("indents a row that follows a sibling, or a child of one", () => {
    expect(at("- b").canIndent).toBe(true);
    expect(at("- b2").canIndent).toBe(true);
  });

  it("leaves a plain line free to indent", () => {
    expect(at("para").canIndent).toBe(true);
  });

  it("outdents only a line that has an indent to give back", () => {
    expect(at("- b1").canOutdent).toBe(true);
    expect(at("- a").canOutdent).toBe(false);
    expect(at("para").canOutdent).toBe(false);
  });
});
