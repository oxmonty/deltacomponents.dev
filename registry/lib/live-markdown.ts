// CodeMirror 6 extension set behind <Editor>: one always-on surface that is
// both the view and the editor. Markdown renders in place and the raw syntax
// reveals only where the caret is, Obsidian-style. Pure CM6 — no React — so
// the decoration logic stays headlessly testable.
//
// Type and colour are NOT in here. Every decoration reads an `EditorElements`
// map, which is this editor's answer to an MDX components map: the same keys,
// each saying which ELEMENT the construct renders as and which classes it
// carries. It cannot be a map of React components, because these ranges are
// live editable text — a `<strong>` here wraps the very characters the caret
// is moving through, so it has to be a tag CodeMirror can mark text with, not
// a node handed to a renderer. Emitting the real tags is what makes an
// existing prose stylesheet apply to the editor without being restated.
//
// The theme below holds only what must not vary — padding, caret, selection,
// list indent, and the box model of those tags (see the reset in it).

import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  redoDepth,
  undoDepth,
} from "@codemirror/commands";
import {
  deleteMarkupBackward,
  insertNewlineContinueMarkupCommand,
  markdownLanguage,
  pasteURLAsLink,
} from "@codemirror/lang-markdown";
import { Language, indentUnit, syntaxTree } from "@codemirror/language";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  drawSelection,
  keymap,
  placeholder as cmPlaceholder,
  type DecorationSet,
  type KeyBinding,
  type ViewUpdate,
} from "@codemirror/view";
import {
  EditorSelection,
  StateEffect,
  StateField,
  type EditorState,
  type Extension,
  type Range,
  type StateCommand,
} from "@codemirror/state";
import type { SyntaxNode } from "@lezer/common";
import type { MarkdownParser } from "@lezer/markdown";

/** What one construct renders as: a class string, or an element and its
 *  classes. `{ tag: "strong", className: "font-semibold" }` emits
 *  `<strong class="font-semibold">` around the live text. */
export type EditorElement = string | { tag?: string; className?: string };

/** The editor's element map. Keys are the HTML elements an MDX components map
 *  uses, plus the three constructs markdown has and HTML doesn't. Anything
 *  omitted falls back to `defaultElements`. */
export interface EditorElements {
  h1?: EditorElement;
  h2?: EditorElement;
  h3?: EditorElement;
  h4?: EditorElement;
  h5?: EditorElement;
  h6?: EditorElement;
  strong?: EditorElement;
  em?: EditorElement;
  del?: EditorElement;
  code?: EditorElement;
  a?: EditorElement;
  /** The whole list row. The indent itself is structural and always applied. */
  li?: EditorElement;
  /** The whole quoted row. The rule down its left edge is structural. */
  blockquote?: EditorElement;
  /** The `<hr>` standing in for `---` once the caret has left its line. */
  hr?: EditorElement;
  /** The • / ◦ glyph standing in for a `-` marker. */
  bullet?: EditorElement;
  /** The real `<input type="checkbox">` standing in for `[ ]` / `[x]`. */
  checkbox?: EditorElement;
  /** The text of a checked task row. */
  taskDone?: EditorElement;
}

// Tailwind utilities and the matching tag, so semantics come for free (a
// screen reader meets a real heading, not a div) and a consumer's own element
// CSS lands on the right thing. Colours are tokens, which flip on `.dark`, so
// one set covers both modes and installing the editor needs no stylesheet.
//
// The three keys with no tag are the ones where an element would be a lie: a
// list ROW is a `.cm-line` div (CodeMirror owns it), and an `<li>` outside a
// list, or a `<del>` around half a line, is worse markup than a class.
export const defaultElements: Required<Record<keyof EditorElements, { tag?: string; className: string }>> = {
  h1: { tag: "h1", className: "text-2xl font-semibold" },
  h2: { tag: "h2", className: "text-xl font-semibold" },
  h3: { tag: "h3", className: "text-lg font-semibold" },
  h4: { tag: "h4", className: "font-semibold" },
  h5: { tag: "h5", className: "font-semibold" },
  h6: { tag: "h6", className: "font-semibold" },
  strong: { tag: "strong", className: "font-semibold" },
  em: { tag: "em", className: "italic" },
  del: { tag: "del", className: "line-through" },
  code: { tag: "code", className: "font-mono text-sm bg-muted rounded px-1" },
  a: { tag: "a", className: "underline underline-offset-2 decoration-muted-foreground" },
  li: { className: "" },
  blockquote: { className: "text-muted-foreground" },
  hr: { className: "border-border" },
  bullet: { className: "text-muted-foreground" },
  checkbox: { className: "size-3.5 pointer-coarse:size-[18px] accent-[var(--primary)] cursor-pointer" },
  taskDone: { className: "text-muted-foreground line-through" },
};

function resolve(
  elements: EditorElements | undefined,
  key: keyof EditorElements,
): { tag?: string; className: string } {
  const value = elements?.[key];
  if (value === undefined) return defaultElements[key];
  if (typeof value === "string") return { tag: defaultElements[key].tag, className: value };
  return { tag: value.tag, className: value.className ?? "" };
}

// Chromeless and type-free: the editor inherits the font, size and leading of
// whatever it is mounted in, and every colour reads a token. `min-height`
// inherits so one `min-h-*` on the wrapper sizes both the editor's click
// target and the pre-hydration fallback.
const chromelessTheme = EditorView.theme({
  "&": { backgroundColor: "transparent", fontSize: "inherit" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "inherit",
    lineHeight: "inherit",
    overflow: "visible", // the page scrolls, not the editor
  },
  ".cm-content": {
    padding: "0",
    minHeight: "inherit",
    caretColor: "var(--foreground)",
    // Kill the 300ms double-tap-zoom wait and the grey flash a tap leaves on
    // mobile WebKit. Neither affects long-press selection or double-tap word
    // select — those are selection gestures, not browser zoom gestures.
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
  },
  ".cm-line": { padding: "0" },
  // The emitted tags (h1…h6, strong, code, a) sit INSIDE a line div, and a
  // source editor's vertical rhythm is its blank lines, not element margins:
  // a heading that brought `margin: 1rem 0` with it would push the caret off
  // its own text. Type, weight and colour still come through from whatever
  // styles the tag — only the box model is pinned.
  ".cm-line :is(h1,h2,h3,h4,h5,h6,p,blockquote)": {
    display: "inline",
    margin: "0",
    padding: "0",
  },
  // List rows read as a block. Structural, and applied regardless of caret
  // position — layout must never toggle as the caret moves.
  ".cm-line.cm-md-li": { paddingLeft: "0.5rem" },
  // A quoted row reads as a block the same way: the rule is structural and
  // stays put as the caret moves; what the element map adds is colour.
  ".cm-line.cm-md-quote": {
    paddingLeft: "0.75rem",
    boxShadow: "inset 2px 0 0 var(--border)",
  },
  // Hanging indent: a wrapped line continues under its own text, not back
  // at the left edge. `--hang` is the measured width of what precedes the
  // text — leading spaces, and a bullet or checkbox plus its space — set per
  // line by the preview (see hangMetrics). Padding pushes every row of the
  // line in by that much and the negative text-indent pulls only the first
  // row back out, so the marker still sits flush.
  ".cm-line.cm-md-hang": {
    paddingLeft: "var(--hang)",
    textIndent: "calc(var(--hang) * -1)",
  },
  ".cm-line.cm-md-li.cm-md-hang": { paddingLeft: "calc(0.5rem + var(--hang))" },
  // One marker column for every list kind. The bullet glyph, the checkbox and
  // an ordered row's `1.` each centre in a box `--marker-w` wide — the widest
  // of the three, measured and set per line beside `--hang` — so the markers
  // share a centre axis and the text after them starts at the same x. The
  // column stops at the marker: the space that follows it is document text on
  // all three, so it lines them up too. `text-indent: 0` because the hanging
  // indent's negative indent inherits into these boxes and would drag the
  // marker out of the column. The `auto` fallback is what the metric probes
  // measure against, before any `--marker-w` exists. A minimum, not a width:
  // the number is text, and a `10.` wider than the column must spill past
  // it rather than wrap inside its own box.
  ".cm-md-bullet, .cm-md-check, .cm-md-num": {
    display: "inline-block",
    minWidth: "var(--marker-w, auto)",
    textAlign: "center",
    textIndent: "0",
    whiteSpace: "nowrap",
  },
  // The checkbox wrapper. Sizing the box is the element map's job; this only
  // sits it on the text baseline, and `display: block` on the input keeps the
  // wrapper's baseline at its bottom edge rather than on a line box that
  // shifts with the box's size. `content-box` so the coarse-pointer padding
  // below grows OUTSIDE the column and the input stays on the column's centre.
  ".cm-md-check": { verticalAlign: "-0.09375rem", boxSizing: "content-box" },
  // The rule fills its line and sits on the text's midline, so the row keeps
  // the height of the `---` it replaces and the caret lands beside it.
  ".cm-md-hr": {
    display: "inline-block",
    width: "100%",
    margin: "0",
    verticalAlign: "middle",
    borderWidth: "1px 0 0",
    borderStyle: "solid",
  },
  // Centred in the column, not flush against its left edge.
  ".cm-md-check > input": { display: "block", marginInline: "auto" },
  ".cm-cursor": { borderLeftColor: "var(--foreground)" },
  // drawSelection() replaces the native selection and caret (the native caret
  // spans the full line box and reads oversized); its layers need explicit
  // colours.
  ".cm-selectionBackground": {
    backgroundColor: "color-mix(in oklab, var(--foreground) 12%, transparent)",
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "color-mix(in oklab, var(--focus-ring, #6B97FF) 30%, transparent)",
  },
  ".cm-placeholder": { color: "var(--muted-foreground)" },

  // --- Touch ---------------------------------------------------------------
  "@media (pointer: coarse)": {
    // iOS zooms the page when an editable field under 16px takes focus, and
    // leaves the user zoomed in with no way back. A floor, not a size: a
    // surface already larger than 16px keeps whatever it inherited.
    ".cm-content": { fontSize: "max(1rem, 1em)" },
    // WCAG 2.2 target size (24×24 minimum) — a 14px checkbox is a coin toss
    // with a fingertip. The HIT AREA grows, not the box: padding takes the
    // label past 24px in both axes and an equal negative margin gives the
    // space straight back, so the line keeps its height and the text keeps
    // its distance. Sizing the box itself to 24px is what made it tower over
    // 16px type with the sentence jammed against it.
    ".cm-md-check": { padding: "0.375rem", margin: "-0.375rem" },
  },
});

/** True on a device whose primary input is a finger. Read once, at mount —
 *  extensions are built there and a pointer type does not change mid-session
 *  in any way worth rebuilding an editor over. */
function isTouchDevice(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches === true;
}

/** How much of the window the on-screen keyboard is covering.
 *
 *  iOS and Android open the keyboard OVER the page: the layout viewport keeps
 *  its height and only the visual viewport shrinks, so nothing in CSS knows
 *  the bottom of the window is gone. */
function keyboardInset(): number {
  const viewport = typeof window !== "undefined" ? window.visualViewport : null;
  if (!viewport) return 0;
  return Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
}

// Both halves of keeping the caret off the keyboard: tell CodeMirror how much
// of the window is obscured whenever it scrolls the selection into view, and
// re-run that scroll when the keyboard opens, closes or changes height (a
// suggestion strip appearing is a resize too). Without the second half, the
// keyboard opens over the line you just tapped and nothing moves.
const keyboardAware: Extension = [
  EditorView.scrollMargins.of(() => {
    const inset = keyboardInset();
    return inset > 0 ? { bottom: inset + 16 } : null;
  }),
  ViewPlugin.fromClass(
    class {
      constructor(readonly view: EditorView) {
        window.visualViewport?.addEventListener("resize", this.onViewportResize);
      }
      // A frame later: iOS reports the resize while the keyboard is still
      // sliding, and scrolling into a viewport that is still moving lands
      // short of where it settles.
      onViewportResize = () => {
        if (!this.view.hasFocus) return;
        requestAnimationFrame(() => {
          if (!this.view.hasFocus) return;
          this.view.dispatch({
            effects: EditorView.scrollIntoView(this.view.state.selection.main.head),
          });
        });
      };
      destroy() {
        window.visualViewport?.removeEventListener("resize", this.onViewportResize);
      }
    },
  ),
];

/* ------------------------------------------------------------------
 * Formatting shortcuts
 * ------------------------------------------------------------------ */

/** Toggle an inline marker pair (** / * / ~~ / `) around each selection range.
 *  Empty selections get an empty pair with the caret inside; a second
 *  invocation right away (or on an already-wrapped selection) unwraps. */
export function toggleWrap(marker: string): StateCommand {
  return ({ state, dispatch }) => {
    const len = marker.length;
    const char = marker[0];
    // The full run of `char` touching a position, not just one marker's
    // width of it — `*` and `**` share a character, so telling italic from
    // bold needs the WHOLE run outside the range, not just its last `len`
    // characters (which is what let toggling italic on a bold word strip
    // one star off each side instead of adding a third).
    const runBefore = (pos: number) => {
      let n = 0;
      while (pos - n > 0 && state.sliceDoc(pos - n - 1, pos - n) === char) n++;
      return n;
    };
    const runAfter = (pos: number) => {
      let n = 0;
      while (pos + n < state.doc.length && state.sliceDoc(pos + n, pos + n + 1) === char) n++;
      return n;
    };
    const changes = state.changeByRange((range) => {
      const { from, to } = range;
      // Markers just outside the range (also the caret-between-markers
      // case). `*` only counts as already-applied when the run on both
      // sides is odd — an even run is a `**` pair, not `*` plus leftover —
      // every other marker has no such overlap, so any run at least its own
      // length counts.
      const before = runBefore(from);
      const after = runAfter(to);
      const wrapped = marker === "*" ? before % 2 === 1 && after % 2 === 1 : before >= len && after >= len;
      if (wrapped) {
        return {
          changes: [
            { from: from - len, to: from },
            { from: to, to: to + len },
          ],
          range: EditorSelection.range(from - len, to - len),
        };
      }
      // Markers included at the edges of the selection.
      const inner = state.sliceDoc(from, to);
      if (inner.length >= 2 * len && inner.startsWith(marker) && inner.endsWith(marker)) {
        return {
          changes: [
            { from, to: from + len },
            { from: to - len, to },
          ],
          range: EditorSelection.range(from, to - 2 * len),
        };
      }
      // Caret sitting right before this marker's own closer (typed content
      // in between, so `wrapped` above missed it) — step past it instead of
      // opening a second, empty pair right next to the first.
      if (
        range.empty &&
        state.sliceDoc(to, to + len) === marker &&
        state.sliceDoc(to + len, to + len + 1) !== char &&
        state.sliceDoc(to - len, to) !== marker
      ) {
        return { range: EditorSelection.cursor(to + len) };
      }
      return {
        changes: [
          { from, insert: marker },
          { from: to, insert: marker },
        ],
        range: EditorSelection.range(from + len, to + len),
      };
    });
    dispatch(state.update(changes, { scrollIntoView: true, userEvent: "input" }));
    return true;
  };
}

/** The block constructs a line can open with. Exactly one applies per line:
 *  the outermost marker, so a `> - item` row is a quote here. */
export type LinePrefix = "quote" | "task" | "bullet" | "ordered";

// Indent, then the marker with its space. The task pattern comes before the
// bullet it extends. The heading marker is deliberately absent: a heading and
// a list marker never share a row, and `setHeading` handles it on its own.
const LINE_PREFIX = /^(\s*)(?:(> )|(- \[[ xX]\] )|([-*+] )|(\d+[.)] ))?/;

/** What a line opens with, and how far it reaches into the text. */
export function linePrefixOf(text: string): { indent: number; kind: LinePrefix | null; end: number } {
  const m = LINE_PREFIX.exec(text)!;
  const kind = m[2] ? "quote" : m[3] ? "task" : m[4] ? "bullet" : m[5] ? "ordered" : null;
  return { indent: m[1].length, kind, end: m[0].length };
}

/** Every line the selection touches, once, in document order. */
function selectedLines(state: EditorState) {
  const seen = new Set<number>();
  const lines = [];
  for (const range of state.selection.ranges) {
    const last = state.doc.lineAt(range.to).number;
    for (let n = state.doc.lineAt(range.from).number; n <= last; n++) {
      if (seen.has(n)) continue;
      seen.add(n);
      lines.push(state.doc.line(n));
    }
  }
  return lines;
}

/** Apply a per-line prefix rewrite, keeping the caret after whatever was
 *  inserted in front of it. Without `assoc: 1` the default mapping leaves it
 *  before a fresh "- [ ] ", visually hidden behind the checkbox. */
function rewriteLines(
  { state, dispatch }: Parameters<StateCommand>[0],
  rewrite: (line: { from: number; text: string }, index: number) => { from: number; to?: number; insert?: string } | null,
): boolean {
  const changes = selectedLines(state)
    .map((line, i) => rewrite(line, i))
    .filter((c) => c !== null);
  if (changes.length === 0) return false;
  const changeSet = state.changes(changes);
  dispatch(
    state.update({
      changes: changeSet,
      selection: state.selection.map(changeSet, 1),
      userEvent: "input",
    }),
  );
  return true;
}

/** Toggle a block prefix on every selected line: a line already carrying
 *  `kind` loses it, one carrying another marker swaps, a plain line gains it.
 *  So Cmd+L on a bullet turns it into a task and again into plain text. */
export function toggleLinePrefix(kind: LinePrefix): StateCommand {
  return (target) =>
    rewriteLines(target, (line, i) => {
      const { indent, kind: current, end } = linePrefixOf(line.text);
      const from = line.from + indent;
      if (current === kind) return { from, to: line.from + end };
      const marker =
        kind === "quote" ? "> " : kind === "task" ? "- [ ] " : kind === "bullet" ? "- " : `${i + 1}. `;
      return { from, to: line.from + end, insert: marker };
    });
}

const HEADING = /^(#{1,6}) /;

/** Set the heading level of every selected line — 0 is a paragraph. A line
 *  already at that level is left alone rather than toggled, so a menu that
 *  re-selects "Heading 2" is a no-op, not a demotion. */
export function setHeading(level: 0 | 1 | 2 | 3 | 4 | 5 | 6): StateCommand {
  return (target) =>
    rewriteLines(target, (line) => {
      const current = HEADING.exec(line.text);
      const currentLevel = current ? current[1].length : 0;
      if (currentLevel === level) return null;
      const insert = level ? "#".repeat(level) + " " : "";
      return { from: line.from, to: line.from + (current?.[0].length ?? 0), insert };
    });
}

/** Wrap each range as `[text](url)` — or `![text](url)` for an image — and
 *  leave the placeholder URL selected, so typing replaces it. An empty range
 *  gets a placeholder label too. The image form is written raw: rendering an
 *  image is the `extensions` seam's job, not the text surface's. */
export function insertLink(image = false): StateCommand {
  return ({ state, dispatch }) => {
    const open = image ? "![" : "[";
    const changes = state.changeByRange((range) => {
      const label = state.sliceDoc(range.from, range.to) || (image ? "alt" : "link");
      const insert = `${open}${label}](url)`;
      const urlFrom = range.from + open.length + label.length + 2;
      return {
        changes: { from: range.from, to: range.to, insert },
        range: EditorSelection.range(urlFrom, urlFrom + 3),
      };
    });
    dispatch(state.update(changes, { scrollIntoView: true, userEvent: "input" }));
    return true;
  };
}

/** Put a `---` on a line of its own after the caret's line, and the caret on
 *  a fresh line under it. The blank line before it is not optional: markdown
 *  reads `text` directly over `---` as a setext heading, not a rule. */
export const insertHorizontalRule: StateCommand = ({ state, dispatch }) => {
  const line = state.doc.lineAt(state.selection.main.head);
  const previousHasText = line.number > 1 && state.doc.line(line.number - 1).length > 0;
  const lead = line.length > 0 ? "\n\n" : previousHasText ? "\n" : "";
  const insert = `${lead}---\n`;
  dispatch(
    state.update({
      changes: { from: line.to, insert },
      selection: { anchor: line.to + insert.length },
      scrollIntoView: true,
      userEvent: "input",
    }),
  );
  return true;
};

/** What is in force at the caret, for a toolbar's pressed states. Inline
 *  constructs come from the syntax tree (so only closed ones count, which is
 *  also what the eager styling of an unclosed `**` would mislead about); the
 *  block state is read off the line the same way the commands write it. */
export interface Formatting {
  heading: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  line: LinePrefix | null;
  strong: boolean;
  em: boolean;
  del: boolean;
  code: boolean;
  link: boolean;
  canUndo: boolean;
  canRedo: boolean;
  /** Whether the caret's line can take another indent step. */
  canIndent: boolean;
  /** Whether the caret's line has an indent to give back. */
  canOutdent: boolean;
}

const LIST_KINDS: LinePrefix[] = ["bullet", "task", "ordered"];

/** A list row nests under the row above it, so the FIRST item of a list has
 *  nothing to nest under: indenting it writes `    - a`, which markdown reads
 *  as a paragraph continuation of the item before, not a nested list — the
 *  marker comes back as a literal `-`. A plain line has no such constraint. */
function canIndentLine(state: EditorState, line: { number: number; text: string }): boolean {
  const { indent, kind } = linePrefixOf(line.text);
  if (!kind || !LIST_KINDS.includes(kind)) return true;
  for (let n = line.number - 1; n >= 1; n--) {
    const previous = state.doc.line(n);
    if (previous.text.trim() === "") continue;
    const above = linePrefixOf(previous.text);
    // Same indent is the previous sibling; deeper is a child of it, and its
    // own parent is then a sibling of ours.
    return above.kind !== null && LIST_KINDS.includes(above.kind) && above.indent >= indent;
  }
  return false;
}

const INLINE_NODES: Record<string, "strong" | "em" | "del" | "code" | "link"> = {
  StrongEmphasis: "strong",
  Emphasis: "em",
  Strikethrough: "del",
  InlineCode: "code",
  Link: "link",
  Image: "link",
};

export function formattingAt(state: EditorState): Formatting {
  const head = state.selection.main.head;
  const line = state.doc.lineAt(head);
  const formatting: Formatting = {
    heading: (HEADING.exec(line.text)?.[1].length ?? 0) as Formatting["heading"],
    line: linePrefixOf(line.text).kind,
    strong: false,
    em: false,
    del: false,
    code: false,
    link: false,
    canUndo: undoDepth(state) > 0,
    canRedo: redoDepth(state) > 0,
    canIndent: canIndentLine(state, line),
    canOutdent: linePrefixOf(line.text).indent > 0,
  };
  // Side -1 so a caret sitting just past `**bold**|` still reads as bold,
  // which is where it lands the moment the closing marks are typed.
  for (let node: SyntaxNode | null = syntaxTree(state).resolveInner(head, -1); node; node = node.parent) {
    const key = INLINE_NODES[node.name];
    if (key) formatting[key] = true;
  }
  return formatting;
}

const EMPTY_QUOTE = /^\s*(> ?)+$/;

/** Enter on a row that is only a quote marker leaves the quote — and leaves
 *  a BLANK line behind it. Clearing the marker in place is not enough: in
 *  CommonMark the next sentence typed directly under a quote is a lazy
 *  continuation of it, and the rule carries on down the left edge.
 *
 *  Lists are left to CodeMirror, which clears the marker and stays on the
 *  row: the glyph goes and the caret does not move, which is what a second
 *  Enter feels like it should do. A sentence typed there is a continuation
 *  of the item in markdown terms, but nothing on the surface says so, so the
 *  extra row would only read as a jump. `> > ` leaves the whole nesting at
 *  once, as it always has. */
const exitEmptyQuote: StateCommand = ({ state, dispatch }) => {
  const { main } = state.selection;
  if (!main.empty) return false;
  const line = state.doc.lineAt(main.head);
  if (!EMPTY_QUOTE.test(line.text)) return false;
  dispatch(state.update({ changes: { from: line.from, to: line.to, insert: "\n" }, userEvent: "input" }));
  return true;
};

/** Home on a row that opens with a marker goes to the start of the TEXT. The
 *  marker is chrome — a bullet glyph or a checkbox — and landing in front of
 *  it is never what was meant; returning false at the text start hands the
 *  second press to the stock command, which is the row start. */
const cursorTextStart: StateCommand = ({ state, dispatch }) => {
  const { main } = state.selection;
  const line = state.doc.lineAt(main.head);
  const { indent, end } = linePrefixOf(line.text);
  if (end === indent || main.head <= line.from + end) return false;
  dispatch(state.update({ selection: { anchor: line.from + end }, scrollIntoView: true }));
  return true;
};

/** Enter at the start of a list item's text opens an empty item above it and
 *  keeps the caret on its own words. CodeMirror's continuation writes the new
 *  marker with NO trailing space (`-\n- one`), and a space is what commits a
 *  block marker here — so its row came out as a bare `-`. */
const openItemAbove: StateCommand = ({ state, dispatch }) => {
  const { main } = state.selection;
  if (!main.empty) return false;
  const line = state.doc.lineAt(main.head);
  const { indent, kind, end } = linePrefixOf(line.text);
  if (kind === null || kind === "quote") return false;
  if (main.head !== line.from + end || line.length === end) return false;
  const lead = line.text.slice(0, indent);
  const marker = line.text.slice(indent, end);
  // The row being pushed down becomes the second item, so its number moves on.
  const next = kind === "ordered" ? marker.replace(/^\d+/, (n) => String(Number(n) + 1)) : marker;
  const insert = `${lead}${marker}\n${lead}${next}`;
  dispatch(
    state.update({
      changes: { from: line.from, to: line.from + end, insert },
      selection: { anchor: line.from + insert.length },
      scrollIntoView: true,
      userEvent: "input",
    }),
  );
  return true;
};

const formattingKeymap: readonly KeyBinding[] = [
  { key: "Mod-b", run: toggleWrap("**"), preventDefault: true },
  { key: "Mod-i", run: toggleWrap("*"), preventDefault: true },
  { key: "Mod-e", run: toggleWrap("`"), preventDefault: true },
  { key: "Mod-Shift-x", run: toggleWrap("~~"), preventDefault: true },
  { key: "Mod-k", run: insertLink(), preventDefault: true },
  { key: "Mod-l", run: toggleLinePrefix("task"), preventDefault: true },
];

// Escape and Cmd+Enter blur. Saving is the component's debounced autosave, so
// blur is "I'm done here" — it flushes, but it isn't the commit gesture.
const blurKeymap: readonly KeyBinding[] = [
  {
    key: "Escape",
    run: (view) => {
      view.contentDOM.blur();
      return true;
    },
  },
  {
    key: "Mod-Enter",
    run: (view) => {
      view.contentDOM.blur();
      return true;
    },
  },
];

/* ------------------------------------------------------------------
 * Hanging-indent metrics
 * ------------------------------------------------------------------
 * The editor sits in a proportional prose font, so the width of the indent
 * cannot be written in `ch` — a space, a bullet glyph and the checkbox are
 * each measured once, inside `.cm-content` so they inherit its type, and
 * again when the geometry changes (a web font landing, a resize). Ordinary
 * lines never touch the DOM for this.
 */

interface HangMetrics {
  space: number;
  bullet: number;
  subBullet: number;
  checkbox: number;
  ordered: number;
}

/** The shared marker column. Every list marker — the bullet glyph, the
 *  checkbox, an ordered row's `1.` — centres in a box this wide, so the three
 *  sit on one axis and their text starts at the same x. The widest marker
 *  wins. It tracks `1.`, not `10.`: a two-digit number spills into the space
 *  that follows it rather than widening the column for every other row, which
 *  is what most editors do. */
function markerColumn(metrics: HangMetrics): number {
  return Math.max(metrics.bullet, metrics.subBullet, metrics.checkbox, metrics.ordered);
}

const setHangMetrics = StateEffect.define<HangMetrics>();

const hangMetrics = StateField.define<HangMetrics | null>({
  create: () => null,
  update(value, tr) {
    for (const effect of tr.effects) if (effect.is(setHangMetrics)) return effect.value;
    return value;
  },
});

function measureHangMetrics(view: EditorView, marks: Marks): HangMetrics {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre";
  view.contentDOM.appendChild(probe);
  const width = (child: Node, className = "") => {
    probe.className = className;
    probe.replaceChildren(child);
    return probe.getBoundingClientRect().width;
  };
  const text = (value: string, className?: string) =>
    width(document.createTextNode(value), className);
  const metrics = {
    space: text(" "),
    bullet: text("•", `cm-md-bullet ${marks.bullet}`),
    subBullet: text("◦", `cm-md-bullet ${marks.bullet}`),
    // The real widget, margins and all: on touch it carries a padding the
    // negative margin gives straight back, so only the wrapper's width is
    // the advance the text sees.
    checkbox: width(new CheckboxWidget(false, marks.checkbox).toDOM(view)),
    // An ordered row's marker is the document's own text, so it is measured
    // as text — with the widest digit, because `1` is the narrowest in a
    // proportional face and a column cut to it wrapped `2.` inside itself.
    // The probes see `min-width: var(--marker-w, auto)` and fall through to
    // auto — `--marker-w` is set per line, never on the probe.
    ordered: text("0."),
  };
  probe.remove();
  return metrics;
}

// Measured off the DOM, so it goes through requestMeasure — a plugin's own
// update() may not read layout — and lands in state through an effect, so
// the decorations rebuild from state alone. The measure phase runs inside
// an update, where a dispatch throws, so the effect goes out a microtask
// later, once the cycle has closed.
function hangMeasurer(marks: Marks) {
  return ViewPlugin.fromClass(
    class {
      destroyed = false;
      constructor(readonly view: EditorView) {
        this.schedule();
      }
      update(update: ViewUpdate) {
        if (update.geometryChanged) this.schedule();
      }
      destroy() {
        this.destroyed = true;
      }
      schedule() {
        this.view.requestMeasure({
          read: () => measureHangMetrics(this.view, marks),
          write: (next, view) => {
            const current = view.state.field(hangMetrics, false);
            if (
              current &&
              current.space === next.space &&
              current.bullet === next.bullet &&
              current.subBullet === next.subBullet &&
              current.checkbox === next.checkbox &&
              current.ordered === next.ordered
            )
              return;
            queueMicrotask(() => {
              if (!this.destroyed) view.dispatch({ effects: setHangMetrics.of(next) });
            });
          },
        });
      }
    },
  );
}

// One line decoration per distinct pair of widths, so unchanged lines compare
// equal across rebuilds instead of being redrawn. `--marker-w` rides the same
// decoration as `--hang`: every row that has a marker has a hanging indent, so
// this is already the one place a per-line width reaches the markers inside.
const hangDecorations = new Map<string, Decoration>();
function hangLine(width: number, column: number): Decoration {
  const round = (value: number) => Math.round(value * 100) / 100;
  const px = round(width);
  const columnPx = round(column);
  const key = `${px}|${columnPx}`;
  let deco = hangDecorations.get(key);
  if (!deco) {
    deco = Decoration.line({
      class: "cm-md-hang",
      attributes: { style: `--hang:${px}px;--marker-w:${columnPx}px` },
    });
    hangDecorations.set(key, deco);
  }
  return deco;
}

/* ------------------------------------------------------------------
 * Live-preview decorations
 * ------------------------------------------------------------------
 * Conceal markdown syntax marks except where the selection touches the
 * construct (node-scoped reveal — never whole-line, which is where the
 * Obsidian-style jitter comes from). Heading classes are LINE decorations
 * applied unconditionally, so the line box never changes with the caret;
 * only the "#" marker's visibility does.
 */

class BulletWidget extends WidgetType {
  constructor(
    readonly glyph: string,
    readonly className: string,
  ) {
    super();
  }
  eq(other: BulletWidget) {
    return other.glyph === this.glyph && other.className === this.className;
  }
  toDOM() {
    const span = document.createElement("span");
    span.className = `cm-md-bullet ${this.className}`;
    span.textContent = this.glyph;
    return span;
  }
}

class HrWidget extends WidgetType {
  constructor(readonly className: string) {
    super();
  }
  eq(other: HrWidget) {
    return other.className === this.className;
  }
  toDOM() {
    const hr = document.createElement("hr");
    hr.className = `cm-md-hr ${this.className}`;
    return hr;
  }
}

class CheckboxWidget extends WidgetType {
  constructor(
    readonly checked: boolean,
    readonly className: string,
    /** How far past the widget's own start the `[ ]` sits: the decoration
     *  covers the whole `- [ ]`, so its position is the ROW's, not the
     *  marker's. */
    readonly markerOffset = 0,
  ) {
    super();
  }
  eq(other: CheckboxWidget) {
    return (
      other.checked === this.checked &&
      other.className === this.className &&
      other.markerOffset === this.markerOffset
    );
  }
  toDOM(view: EditorView) {
    // A <label>, not a bare input: on touch the hit area has to reach past
    // the box (see the target-size rule in the theme), and a label forwards a
    // click on that margin to the input natively — no handler of our own.
    const label = document.createElement("label");
    label.className = "cm-md-check";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = this.checked;
    input.className = `cm-md-checkbox ${this.className}`;
    input.setAttribute("aria-label", this.checked ? "Mark task not done" : "Mark task done");
    input.addEventListener("change", () => {
      // Toggle by rewriting the three characters of the marker, which sits
      // markerOffset past where the widget starts.
      const pos = view.posAtDOM(label) + this.markerOffset;
      view.dispatch({
        changes: { from: pos, to: pos + 3, insert: this.checked ? "[ ]" : "[x]" },
      });
    });
    // Ticking a task is not editing. Without this the press focuses the
    // editor it lands in, and on a phone that raises the keyboard over the
    // list being ticked. Cancelling the press keeps focus wherever it was —
    // the click, and so the toggle, still goes through.
    label.addEventListener("mousedown", (event) => event.preventDefault());
    label.appendChild(input);
    return label;
  }
  // Default ignoreEvent() is true: CM leaves clicks to the checkbox, so
  // toggling doesn't move the caret.
}

// An ordered row's marker stays the document's own "1." — no widget to centre
// it, so the column class goes on the text itself. Structural only: colour and
// type are the surrounding line's, as before.
const orderedMark = Decoration.mark({ class: "cm-md-num" });

interface Marks {
  hide: Decoration;
  strong: Decoration;
  em: Decoration;
  del: Decoration;
  code: Decoration;
  link: Decoration;
  taskDone: Decoration;
  listLine: Decoration;
  quoteLine: Decoration;
  hr: string;
  headingLines: Decoration[];
  /** Null where the heading key carries no tag — then the line class is the
   *  whole treatment. */
  headingTags: (Decoration | null)[];
  bullet: string;
  checkbox: string;
  /** Unclosed delimiters, in match priority order. */
  unclosed: { re: RegExp; len: number; deco: Decoration }[];
}

export function createMarks(elements?: EditorElements): Marks {
  const at = (key: keyof EditorElements) => resolve(elements, key);
  const marked = (key: keyof EditorElements) => {
    const { tag, className } = at(key);
    // The link keeps its href off (Cmd+click is what opens it), so it says
    // what it is with a role instead — for screen readers, and for crawlers
    // that otherwise report a bare <a> as an uncrawlable link.
    const attributes = tag === "a" ? { role: "link" } : undefined;
    return Decoration.mark({ tagName: tag, class: className, attributes });
  };
  const strong = marked("strong");
  const em = marked("em");
  const del = marked("del");
  const code = marked("code");
  const headings = (["h1", "h2", "h3", "h4", "h5", "h6"] as const).map(at);
  return {
    hide: Decoration.replace({}),
    strong,
    em,
    del,
    code,
    link: marked("a"),
    taskDone: marked("taskDone"),
    listLine: Decoration.line({ class: `cm-md-li ${at("li").className}` }),
    quoteLine: Decoration.line({ class: `cm-md-quote ${at("blockquote").className}` }),
    hr: at("hr").className,
    // The SIZE rides the line, not the tag: it has to apply to the whole line
    // box or a wrapped heading's second row would come out at body size.
    headingLines: headings.map((h) => Decoration.line({ class: h.className })),
    headingTags: headings.map((h) => (h.tag ? Decoration.mark({ tagName: h.tag }) : null)),
    bullet: at("bullet").className,
    checkbox: at("checkbox").className,
    // The parser only creates emphasis/code nodes for CLOSED constructs, so
    // "**hello" being typed would stay plain until the closing "**" —
    // headings style eagerly (no closer needed) and users expect the same
    // here. A delimiter must be followed by a non-space (mirrors CommonMark's
    // left-flanking rule; also keeps "* " list bullets out).
    unclosed: [
      { re: /\*\*(?=\S)/, len: 2, deco: strong },
      { re: /(?<!\*)\*(?=[^\s*])/, len: 1, deco: em },
      { re: /~~(?=\S)/, len: 2, deco: del },
      { re: /`(?=\S)/, len: 1, deco: code },
    ],
  };
}

/** Where a task row's marker starts: at the list bullet, not at the `[`. The
 *  whole `- [ ]` is drawn as one checkbox, so that is where the decoration and
 *  the atomic range both begin. */
function taskMarkerFrom(taskMarker: SyntaxNode): number {
  return taskMarker.parent?.parent?.getChild("ListMark")?.from ?? taskMarker.from;
}

/** `- [ ] ` counts as one character to the caret. The marker and the space
 *  after it render as a single checkbox, so every position inside them is
 *  invisible — arrow keys and clicks land at the row start or the text start,
 *  never in between, where Backspace used to eat the space and with it the
 *  checkbox. */
export function taskMarkerRanges(
  state: EditorState,
  visible: readonly { from: number; to: number }[],
): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const tree = syntaxTree(state);
  for (const { from, to } of visible) {
    tree.iterate({
      from,
      to,
      enter: (node) => {
        if (node.name !== "TaskMarker") return;
        const line = state.doc.lineAt(node.to);
        ranges.push(atomicMarker.range(taskMarkerFrom(node.node), Math.min(node.to + 1, line.to)));
      },
    });
  }
  return Decoration.set(ranges, true);
}

// Never rendered — atomicRanges reads only the range bounds.
const atomicMarker = Decoration.replace({});

const atomicTaskMarkers = EditorView.atomicRanges.of((view) =>
  taskMarkerRanges(view.state, view.visibleRanges),
);

/** Pure decoration computation, separated from the view for testability.
 *
 *  `hasFocus` gates the caret-reveal: an unfocused editor still HAS a
 *  selection (position 0 on load), which would otherwise keep the first
 *  construct's syntax revealed until the user clicks — everything conceals
 *  when the editor isn't focused.
 *
 *  Walks only `visible` (the viewport, plus CodeMirror's own overdraw
 *  margin) rather than the whole document — cost per keystroke must not grow
 *  with document length. */
export function computeLiveDecorations(
  state: EditorState,
  hasFocus: boolean,
  marks: Marks,
  visible: readonly { from: number; to: number }[],
): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const sel = state.selection.main;
  const touches = (from: number, to: number) => hasFocus && sel.from <= to && sel.to >= from;
  // A block marker only counts once a space follows it. Markdown already
  // calls a lone "*" or "#" an empty list item or heading, so without this a
  // "*" typed to open *italic* flashes a bullet, and "#" jumps to heading size
  // before there is a heading. Until the space it is the text that was typed.
  const committed = (markerEnd: number) => /[ \t]/.test(state.doc.sliceString(markerEnd, markerEnd + 1));
  const tree = syntaxTree(state);
  const metrics = state.field(hangMetrics, false) ?? null;
  // What stands before the text on a list row, in px, keyed by the row's line
  // start — filled from the tree walk, read in the line loop. Every kind of
  // marker occupies the same column, so it is the same number on all three.
  const markerWidth = new Map<number, number>();
  const column = metrics ? markerColumn(metrics) : 0;

  for (const { from: rangeFrom, to: rangeTo } of visible) {
    // Inline constructs the parser DID match, per line — used to scan only
    // leftover text for unclosed delimiters below.
    const covered: [number, number][] = [];

    tree.iterate({
      from: rangeFrom,
      to: rangeTo,
      enter: (node) => {
        if (node.name.startsWith("ATXHeading")) {
          const headerMark = node.node.getChild("HeaderMark");
          if (!headerMark || !committed(headerMark.to)) return;
          const level = Number(node.name.slice("ATXHeading".length));
          const line = state.doc.lineAt(node.from);
          ranges.push(marks.headingLines[level - 1].range(line.from));
          const tag = marks.headingTags[level - 1];
          if (tag && node.to > node.from) ranges.push(tag.range(node.from, node.to));
          if (!touches(node.from, node.to)) {
            // Swallow the space after "#" too, so the text sits flush left.
            const end =
              state.doc.sliceString(headerMark.to, headerMark.to + 1) === " "
                ? headerMark.to + 1
                : headerMark.to;
            ranges.push(marks.hide.range(headerMark.from, end));
          }
          return;
        }
        switch (node.name) {
          case "StrongEmphasis":
          case "Emphasis":
          case "Strikethrough": {
            covered.push([node.from, node.to]);
            const mark =
              node.name === "StrongEmphasis" ? marks.strong : node.name === "Emphasis" ? marks.em : marks.del;
            ranges.push(mark.range(node.from, node.to));
            if (!touches(node.from, node.to)) {
              const markName = node.name === "Strikethrough" ? "StrikethroughMark" : "EmphasisMark";
              for (const child of node.node.getChildren(markName)) {
                ranges.push(marks.hide.range(child.from, child.to));
              }
            }
            break;
          }
          case "HorizontalRule": {
            // The three dashes come back while the caret is on the line, the
            // way a heading's `#` does — that is how the rule is edited.
            if (touches(node.from, node.to)) break;
            ranges.push(Decoration.replace({ widget: new HrWidget(marks.hr) }).range(node.from, node.to));
            break;
          }
          case "Blockquote": {
            // Every row of the quote carries the rule, lazy continuation lines
            // included. The markers themselves are handled by the QuoteMark
            // case: only the FIRST row's `>` is a child of the Blockquote —
            // a continued row's belongs to the Paragraph inside it.
            const opener = node.node.getChild("QuoteMark");
            if (!opener || !committed(opener.to)) break;
            const last = state.doc.lineAt(node.to).number;
            for (let n = state.doc.lineAt(node.from).number; n <= last; n++) {
              ranges.push(marks.quoteLine.range(state.doc.line(n).from));
            }
            break;
          }
          case "QuoteMark": {
            // Concealed even with the caret on the row, as a bullet is: the
            // rule already says "quote", and a `>` surfacing on the line you
            // are typing is noise. Backspace at the head still removes it.
            // Nested `> > ` gives two adjacent marks, which do not overlap.
            if (!committed(node.to)) break;
            ranges.push(marks.hide.range(node.from, node.to + 1));
            break;
          }
          case "InlineCode": {
            covered.push([node.from, node.to]);
            ranges.push(marks.code.range(node.from, node.to));
            if (!touches(node.from, node.to)) {
              for (const mark of node.node.getChildren("CodeMark")) {
                ranges.push(marks.hide.range(mark.from, mark.to));
              }
            }
            break;
          }
          case "ListItem": {
            const listMark = node.node.getChild("ListMark");
            if (!listMark || !committed(listMark.to)) break;
            ranges.push(marks.listLine.range(state.doc.lineAt(node.from).from));
            break;
          }
          case "ListMark": {
            if (!committed(node.to)) break;
            const item = node.node.parent; // ListItem
            const lineFrom = state.doc.lineAt(node.from).from;
            // Whatever the marker is, it fills the column and the document's
            // own space follows it, so the text starts at the same x on all
            // three kinds of row — and the row wraps under that text.
            if (metrics) markerWidth.set(lineFrom, column + metrics.space);
            if (item?.parent?.name !== "BulletList") {
              // An ordered row keeps its "1." as text; only the column is ours.
              ranges.push(orderedMark.range(node.from, node.to));
              break;
            }
            const isTask = item.getChild("Task") !== null;
            // Bullets render as glyphs even with the caret adjacent — a fresh
            // "- " from Enter shows its bullet before any content is typed.
            // Backspace still removes the marker via deleteMarkupBackward.
            if (isTask) {
              // Nothing here: the TaskMarker case draws "- [ ]" as ONE
              // checkbox, so the bullet is inside that decoration.
            } else {
              // Nesting depth picks the glyph (• then ◦).
              let depth = 0;
              for (let p = item.parent.parent; p; p = p.parent) {
                if (p.name === "BulletList" || p.name === "OrderedList") depth++;
              }
              ranges.push(
                Decoration.replace({
                  widget: new BulletWidget(depth === 0 ? "•" : "◦", marks.bullet),
                }).range(node.from, node.to),
              );
            }
            break;
          }
          case "TaskMarker": {
            const checked = state.doc.sliceString(node.from, node.to).toLowerCase().includes("x");
            // One decoration over the whole "- [ ]", not a hidden "- " beside
            // a checkbox: the seam between two replaced ranges is a legal
            // caret position that renders nowhere, and Backspace in it ate the
            // space and took the checkbox with it.
            const from = taskMarkerFrom(node.node);
            ranges.push(
              Decoration.replace({
                widget: new CheckboxWidget(checked, marks.checkbox, node.from - from),
              }).range(from, node.to),
            );
            if (checked) {
              const line = state.doc.lineAt(node.to);
              if (line.to > node.to + 1) {
                ranges.push(marks.taskDone.range(node.to + 1, line.to));
              }
            }
            break;
          }
          case "Link": {
            // [label](url) — conceal to just the styled label; reveal raw when
            // the selection is anywhere inside. Cmd+click opens (handler below).
            const linkMarks = node.node.getChildren("LinkMark");
            if (linkMarks.length < 2) break;
            covered.push([node.from, node.to]);
            const labelFrom = linkMarks[0].to;
            const labelTo = linkMarks[1].from;
            if (labelTo > labelFrom) ranges.push(marks.link.range(labelFrom, labelTo));
            if (!touches(node.from, node.to)) {
              ranges.push(marks.hide.range(node.from, labelFrom));
              ranges.push(marks.hide.range(labelTo, node.to));
            }
            break;
          }
        }
      },
    });

    // Eager styling for unclosed constructs: scan each line's text that isn't
    // part of a parsed construct; the first unmatched delimiter styles the
    // rest of the line, and (like closed constructs) the delimiter itself
    // conceals once the caret leaves the range.
    //
    // `covered` is in tree pre-order, so already ascending by `from`: `first`
    // only moves forward, where filtering it per line was quadratic.
    let first = 0;
    const firstLine = state.doc.lineAt(rangeFrom).number;
    const lastLine = state.doc.lineAt(rangeTo).number;
    for (let lineNo = firstLine; lineNo <= lastLine; lineNo++) {
      const line = state.doc.line(lineNo);
      if (line.length === 0) continue;
      if (metrics) {
        // Leading whitespace plus the row's marker, if any. A tab counts as
        // one space's width — the indent unit writes spaces, so a tab here
        // was pasted in and is rare enough to be off by a little.
        const indent = /^[ \t]*/.exec(line.text)![0].length * metrics.space;
        const hang = indent + (markerWidth.get(line.from) ?? 0);
        if (hang > 0) ranges.push(hangLine(hang, column).range(line.from));
      }
      while (first < covered.length && covered[first][1] <= line.from) first++;
      const segments: [number, number][] = [];
      let cursor = line.from;
      for (let j = first; j < covered.length && covered[j][0] < line.to; j++) {
        const [f, t] = covered[j];
        if (t <= line.from) continue;
        if (f > cursor) segments.push([cursor, Math.min(f, line.to)]);
        cursor = Math.max(cursor, t);
      }
      if (cursor < line.to) segments.push([cursor, line.to]);

      outer: for (const [segFrom, segTo] of segments) {
        const segText = state.doc.sliceString(segFrom, segTo);
        for (const { re, len, deco } of marks.unclosed) {
          const m = re.exec(segText);
          if (!m) continue;
          const delimFrom = segFrom + m.index;
          ranges.push(deco.range(delimFrom + len, line.to));
          if (!touches(delimFrom, line.to)) {
            ranges.push(marks.hide.range(delimFrom, delimFrom + len));
          }
          break outer;
        }
      }
    }
  }

  return Decoration.set(ranges, true);
}

// Cmd/Ctrl+click opens the link under the pointer (plain click edits).
const linkClickHandler = EditorView.domEventHandlers({
  mousedown(event, view) {
    if (!(event.metaKey || event.ctrlKey)) return false;
    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos == null) return false;
    let node: SyntaxNode | null = syntaxTree(view.state).resolveInner(pos, 0);
    while (node && node.name !== "Link") node = node.parent;
    const url = node?.getChild("URL");
    if (!url) return false;
    window.open(view.state.doc.sliceString(url.from, url.to), "_blank", "noopener");
    return true;
  },
});

/** The live-preview plugin alone, so an element-map change can be swapped
 *  through a `Compartment` without rebuilding the editor's history. */
export function livePreview(elements?: EditorElements): Extension {
  const marks = createMarks(elements);
  return [
    hangMeasurer(marks),
    ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = computeLiveDecorations(view.state, view.hasFocus, marks, view.visibleRanges);
      }
      update(update: ViewUpdate) {
        // IME guard: rebuilding decorations mid-composition detaches the
        // candidate popup. Map the existing ones through the change instead.
        if (update.view.composing) {
          this.decorations = this.decorations.map(update.changes);
          return;
        }
        // The tree check is not optional: Lezer parses in time-sliced chunks
        // and reports each one as a transaction that changes neither the doc
        // nor the selection. Without it, a document whose first parse pass
        // ran out of budget — a long one, or a busy page with several
        // editors — keeps the decorations of the fragment that WAS parsed and
        // shows the rest as raw markdown, at random. `viewportChanged` covers
        // scrolling into a new part of the document, which touches none of
        // the above but still needs its own now-visible range decorated.
        if (
          update.docChanged ||
          update.selectionSet ||
          update.focusChanged ||
          update.viewportChanged ||
          syntaxTree(update.startState) !== syntaxTree(update.state) ||
          update.startState.field(hangMetrics, false) !== update.state.field(hangMetrics, false)
        ) {
          this.decorations = computeLiveDecorations(
            update.state,
            update.view.hasFocus,
            marks,
            update.view.visibleRanges,
          );
        }
      }
    },
    { decorations: (v) => v.decorations },
    ),
  ];
}

// The same language, minus CommonMark's indented code blocks: four leading
// spaces are what Tab writes here, and a paragraph someone indented to set it
// apart must keep its **bold** and its links rather than turn into verbatim
// code (which also let the eager unclosed-`**` styling run away with the
// rest of the line). Fenced ``` blocks are untouched. Built the way
// lang-markdown builds its own, so no other behaviour changes.
const proseMarkdown = new Language(
  markdownLanguage.data,
  // Typed as the generic Parser; it is lezer-markdown's, which configures.
  (markdownLanguage.parser as MarkdownParser).configure({ remove: ["IndentedCode"] }),
  [],
  "markdown",
);

/** Everything that is not typography: the markdown language, the keymaps,
 *  history, the placeholder and the chromeless theme. Pair with
 *  `livePreview()`. */
export function liveMarkdownBase(placeholderText = ""): Extension[] {
  return [
    // The keymap below is ours rather than markdownKeymap: its default Enter
    // command turns a tight list non-tight on the second empty item (blank
    // line + carried bullet) — nonTightLists: false makes double-Enter exit
    // the list, removing the empty item's marker instead.
    //
    // The bare language, not markdown(): that wrapper drags the HTML, CSS
    // and JS language packages (plus autocomplete) into a prose editor.
    // pasteURLAsLink is the one piece of it this editor uses.
    proseMarkdown,
    pasteURLAsLink,
    atomicTaskMarkers,
    keymap.of([
      { key: "Enter", run: exitEmptyQuote },
      { key: "Enter", run: openItemAbove },
      { key: "Enter", run: insertNewlineContinueMarkupCommand({ nonTightLists: false }) },
      { key: "Backspace", run: deleteMarkupBackward },
      { key: "Home", run: cursorTextStart, preventDefault: true },
      // Cmd+Left only, mirroring standardKeymap: `Mod-ArrowLeft` is word-left
      // off the Mac, and line start is a Mac-only binding there too.
      { mac: "Cmd-ArrowLeft", run: cursorTextStart, preventDefault: true },
    ]),
    linkClickHandler,
    hangMetrics,
    history(),
    // drawSelection() forces `caret-color: transparent` and paints its own
    // caret and selection. On a desktop that is an improvement — the native
    // caret spans the whole line box and reads oversized. On a phone it takes
    // away the things a finger actually uses: the caret you drag, the
    // selection handles, the magnifier. The platform keeps its own there.
    ...(isTouchDevice() ? [] : [drawSelection()]),
    // Tab is trapped here for indenting every selected line (Shift+Tab
    // outdents); Escape, bound above in blurKeymap, is the keyboard way out.
    // Four spaces a step: a nested bullet still nests, and the extra width
    // reads as a level in prose type where two spaces barely register. See
    // proseMarkdown for why that doesn't turn a paragraph into code.
    indentUnit.of("    "),
    keymap.of([...blurKeymap, ...formattingKeymap, indentWithTab, ...defaultKeymap, ...historyKeymap]),
    EditorView.lineWrapping,
    // Only with text to show: the extension writes `aria-placeholder` from
    // whatever it is given, and an empty one is an attribute that says nothing.
    ...(placeholderText ? [cmPlaceholder(placeholderText)] : []),
    keyboardAware,
    EditorView.contentAttributes.of({
      // A textbox has to be named. The placeholder is the caller's own words
      // for this field, so it names it when there is one; without it the
      // fallback at least says what the field is, where "" left a screen
      // reader announcing an unlabelled edit box.
      "aria-label": placeholderText || "Markdown editor",
      // CodeMirror ships code-editor defaults (spellcheck off, autocorrect
      // off, autocapitalize off). This is prose: without these, typing a
      // sentence on a phone gives you no capital, no autocorrect and no
      // spellcheck, which reads as a broken text field rather than a choice.
      autocorrect: "on",
      autocapitalize: "sentences",
      spellcheck: "true",
    }),
    chromelessTheme,
  ];
}
