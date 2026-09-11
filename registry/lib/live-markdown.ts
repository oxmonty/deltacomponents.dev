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

import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  deleteMarkupBackward,
  insertNewlineContinueMarkupCommand,
  markdown,
  markdownLanguage,
} from "@codemirror/lang-markdown";
import { syntaxTree } from "@codemirror/language";
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
  type EditorState,
  type Extension,
  type Range,
  type StateCommand,
} from "@codemirror/state";
import type { SyntaxNode } from "@lezer/common";

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
  code?: EditorElement;
  a?: EditorElement;
  /** The whole list row. The indent itself is structural and always applied. */
  li?: EditorElement;
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
  code: { tag: "code", className: "font-mono text-sm bg-muted rounded px-1" },
  a: { tag: "a", className: "underline underline-offset-2 decoration-muted-foreground" },
  li: { className: "" },
  bullet: { className: "text-muted-foreground" },
  checkbox: { className: "size-3.5 align-[-0.09375rem] accent-[var(--primary)] cursor-pointer" },
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
    // with a fingertip. `min-*`, so a caller who wants a bigger one still
    // wins; the negative margin keeps the line from growing around it.
    "input.cm-md-checkbox": {
      minWidth: "1.5rem",
      minHeight: "1.5rem",
      margin: "-0.25rem",
    },
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

/** Toggle an inline marker pair (** / * / `) around each selection range.
 *  Empty selections get an empty pair with the caret inside; a second
 *  invocation right away (or on an already-wrapped selection) unwraps. */
function toggleWrap(marker: string): StateCommand {
  return ({ state, dispatch }) => {
    const len = marker.length;
    const changes = state.changeByRange((range) => {
      const { from, to } = range;
      // Markers just outside the range (also the caret-between-markers case).
      if (
        state.sliceDoc(Math.max(0, from - len), from) === marker &&
        state.sliceDoc(to, to + len) === marker
      ) {
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

/** Toggle task-list prefixes on every selected line: plain → "- [ ] ",
 *  bullet → task, task → plain. */
const toggleTaskList: StateCommand = ({ state, dispatch }) => {
  const changes: { from: number; to?: number; insert?: string }[] = [];
  const seen = new Set<number>();
  for (const range of state.selection.ranges) {
    const last = state.doc.lineAt(range.to).number;
    for (let n = state.doc.lineAt(range.from).number; n <= last; n++) {
      if (seen.has(n)) continue;
      seen.add(n);
      const line = state.doc.line(n);
      const task = /^(\s*)- \[[ xX]\] /.exec(line.text);
      if (task) {
        changes.push({ from: line.from + task[1].length, to: line.from + task[0].length });
        continue;
      }
      const bullet = /^(\s*)[-*+] /.exec(line.text);
      if (bullet) {
        changes.push({
          from: line.from + bullet[1].length,
          to: line.from + bullet[0].length,
          insert: "- [ ] ",
        });
        continue;
      }
      const indent = /^\s*/.exec(line.text)![0];
      changes.push({ from: line.from + indent.length, insert: "- [ ] " });
    }
  }
  if (changes.length === 0) return false;
  const changeSet = state.changes(changes);
  // assoc 1 keeps the caret AFTER an inserted "- [ ] " — the default mapping
  // left it before the prefix, visually hidden behind the checkbox.
  dispatch(
    state.update({
      changes: changeSet,
      selection: state.selection.map(changeSet, 1),
      userEvent: "input",
    }),
  );
  return true;
};

const formattingKeymap: readonly KeyBinding[] = [
  { key: "Mod-b", run: toggleWrap("**"), preventDefault: true },
  { key: "Mod-i", run: toggleWrap("*"), preventDefault: true },
  { key: "Mod-e", run: toggleWrap("`"), preventDefault: true },
  { key: "Mod-l", run: toggleTaskList, preventDefault: true },
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

class CheckboxWidget extends WidgetType {
  constructor(
    readonly checked: boolean,
    readonly className: string,
  ) {
    super();
  }
  eq(other: CheckboxWidget) {
    return other.checked === this.checked && other.className === this.className;
  }
  toDOM(view: EditorView) {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = this.checked;
    input.className = `cm-md-checkbox ${this.className}`;
    input.setAttribute("aria-label", this.checked ? "Mark task not done" : "Mark task done");
    input.addEventListener("change", () => {
      // The widget replaces the "[ ]"/"[x]" marker, so its own position IS
      // the marker's — toggle by rewriting those three characters.
      const pos = view.posAtDOM(input);
      view.dispatch({
        changes: { from: pos, to: pos + 3, insert: this.checked ? "[ ]" : "[x]" },
      });
    });
    return input;
  }
  // Default ignoreEvent() is true: CM leaves clicks to the checkbox, so
  // toggling doesn't move the caret.
}

interface Marks {
  hide: Decoration;
  strong: Decoration;
  em: Decoration;
  code: Decoration;
  link: Decoration;
  taskDone: Decoration;
  listLine: Decoration;
  headingLines: Decoration[];
  /** Null where the heading key carries no tag — then the line class is the
   *  whole treatment. */
  headingTags: (Decoration | null)[];
  bullet: string;
  checkbox: string;
  /** Unclosed delimiters, in match priority order. */
  unclosed: { re: RegExp; len: number; deco: Decoration }[];
}

function createMarks(elements?: EditorElements): Marks {
  const at = (key: keyof EditorElements) => resolve(elements, key);
  const marked = (key: keyof EditorElements) => {
    const { tag, className } = at(key);
    return Decoration.mark({ tagName: tag, class: className });
  };
  const strong = marked("strong");
  const em = marked("em");
  const code = marked("code");
  const headings = (["h1", "h2", "h3", "h4", "h5", "h6"] as const).map(at);
  return {
    hide: Decoration.replace({}),
    strong,
    em,
    code,
    link: marked("a"),
    taskDone: marked("taskDone"),
    listLine: Decoration.line({ class: `cm-md-li ${at("li").className}` }),
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
      { re: /`(?=\S)/, len: 1, deco: code },
    ],
  };
}

/** Pure decoration computation, separated from the view for testability.
 *
 *  `hasFocus` gates the caret-reveal: an unfocused editor still HAS a
 *  selection (position 0 on load), which would otherwise keep the first
 *  construct's syntax revealed until the user clicks — everything conceals
 *  when the editor isn't focused. */
function computeLiveDecorations(
  state: EditorState,
  hasFocus: boolean,
  marks: Marks,
): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const sel = state.selection.main;
  const touches = (from: number, to: number) => hasFocus && sel.from <= to && sel.to >= from;
  // Inline constructs the parser DID match, per line — used to scan only
  // leftover text for unclosed delimiters below.
  const covered: [number, number][] = [];

  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.name.startsWith("ATXHeading")) {
        const level = Number(node.name.slice("ATXHeading".length));
        const line = state.doc.lineAt(node.from);
        ranges.push(marks.headingLines[level - 1].range(line.from));
        const tag = marks.headingTags[level - 1];
        if (tag && node.to > node.from) ranges.push(tag.range(node.from, node.to));
        if (!touches(node.from, node.to)) {
          const mark = node.node.getChild("HeaderMark");
          if (mark) {
            // Swallow the space after "#" too, so the text sits flush left.
            const end = state.doc.sliceString(mark.to, mark.to + 1) === " " ? mark.to + 1 : mark.to;
            ranges.push(marks.hide.range(mark.from, end));
          }
        }
        return;
      }
      switch (node.name) {
        case "StrongEmphasis":
        case "Emphasis": {
          covered.push([node.from, node.to]);
          ranges.push(
            (node.name === "StrongEmphasis" ? marks.strong : marks.em).range(node.from, node.to),
          );
          if (!touches(node.from, node.to)) {
            for (const mark of node.node.getChildren("EmphasisMark")) {
              ranges.push(marks.hide.range(mark.from, mark.to));
            }
          }
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
          ranges.push(marks.listLine.range(state.doc.lineAt(node.from).from));
          break;
        }
        case "ListMark": {
          const item = node.node.parent; // ListItem
          if (item?.parent?.name !== "BulletList") break; // ordered numbers stay as-is
          const isTask = item.getChild("Task") !== null;
          // Bullets render as glyphs even with the caret adjacent — a fresh
          // "- " from Enter shows its bullet before any content is typed.
          // Backspace still removes the marker via deleteMarkupBackward.
          if (isTask) {
            // Task rows: the checkbox carries the affordance — hide "- ".
            const end = state.doc.sliceString(node.to, node.to + 1) === " " ? node.to + 1 : node.to;
            ranges.push(marks.hide.range(node.from, end));
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
          ranges.push(
            Decoration.replace({
              widget: new CheckboxWidget(checked, marks.checkbox),
            }).range(node.from, node.to),
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
  // part of a parsed construct; the first unmatched delimiter styles the rest
  // of the line, and (like closed constructs) the delimiter itself conceals
  // once the caret leaves the range.
  for (let lineNo = 1; lineNo <= state.doc.lines; lineNo++) {
    const line = state.doc.line(lineNo);
    if (line.length === 0) continue;
    const lineCovered = covered.filter(([f, t]) => f < line.to && t > line.from);
    const segments: [number, number][] = [];
    let cursor = line.from;
    for (const [f, t] of lineCovered.sort((a, b) => a[0] - b[0])) {
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
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = computeLiveDecorations(view.state, view.hasFocus, marks);
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
        // shows the rest as raw markdown, at random.
        if (
          update.docChanged ||
          update.selectionSet ||
          update.focusChanged ||
          syntaxTree(update.startState) !== syntaxTree(update.state)
        ) {
          this.decorations = computeLiveDecorations(update.state, update.view.hasFocus, marks);
        }
      }
    },
    { decorations: (v) => v.decorations },
  );
}

/** Everything that is not typography: the markdown language, the keymaps,
 *  history, the placeholder and the chromeless theme. Pair with
 *  `livePreview()`. */
export function liveMarkdownBase(placeholderText = ""): Extension[] {
  return [
    // The built-in keymap is replaced below: its default Enter command turns
    // a tight list non-tight on the second empty item (blank line + carried
    // bullet) — nonTightLists: false makes double-Enter exit the list,
    // removing the empty item's marker instead.
    markdown({ base: markdownLanguage, addKeymap: false }),
    keymap.of([
      { key: "Enter", run: insertNewlineContinueMarkupCommand({ nonTightLists: false }) },
      { key: "Backspace", run: deleteMarkupBackward },
    ]),
    linkClickHandler,
    history(),
    // drawSelection() forces `caret-color: transparent` and paints its own
    // caret and selection. On a desktop that is an improvement — the native
    // caret spans the whole line box and reads oversized. On a phone it takes
    // away the things a finger actually uses: the caret you drag, the
    // selection handles, the magnifier. The platform keeps its own there.
    ...(isTouchDevice() ? [] : [drawSelection()]),
    keymap.of([...blurKeymap, ...formattingKeymap, ...defaultKeymap, ...historyKeymap]),
    EditorView.lineWrapping,
    cmPlaceholder(placeholderText),
    keyboardAware,
    EditorView.contentAttributes.of({
      "aria-label": placeholderText,
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
