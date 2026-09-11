import type { PropDef } from "@/lib/docs/props-table";

export const editorProps: PropDef[] = [
  { name: "defaultValue", type: "string", default: '""', description: "Seeds the document. Read once, at mount: the editor owns the text from then on, because re-seeding from props mid-edit takes the caret and the undo history with it." },
  { name: "placeholder", type: "string", default: '""', description: "Shown while the document is empty, and used as the editing surface's `aria-label`." },
  { name: "onChange", type: "(doc: string) => void", description: "Every keystroke, with the whole document. For persistence reach for `onSave` instead — this one fires far too often to write with." },
  { name: "onSave", type: "(doc: string) => void | Promise<void>", description: "The persistence hook: fired `saveDelay` after typing stops, on blur, and on unmount, and never with a document it has already stored. Reject or throw to report a failed write — the document stays pending and the next flush sends it again." },
  { name: "saveDelay", type: "number", default: "800", description: "Idle milliseconds before an autosave fires. Raise it for an expensive write." },
  { name: "showSaveStatus", type: "boolean", default: "true", description: "The indicator pinned to the top-right corner while there is something to report. Turn it off to render your own from `onSaveState`." },
  { name: "onSaveState", type: '(state: "idle" | "dirty" | "saving" | "saved" | "error") => void', description: "Every change of save state, for a status line of your own elsewhere on the page." },
  { name: "elements", type: "EditorElements", description: "Which element each markdown construct renders as, and its classes — see the table below. Omitted keys fall back to `defaultElements`, and changing the map swaps the type set in place without disturbing the document or its history." },
  { name: "className", type: "string", description: "Merged onto the root through `tailwind-merge`. The editor inherits its font, size, leading and `min-height` from here, so `font-serif text-lg leading-8` restyles the whole surface — including the pre-hydration fallback." },
];

export const elementsProps: PropDef[] = [
  { name: "h1 – h6", type: "EditorElement", default: '{ tag: "h1", className: "text-2xl font-semibold" } …', description: "The heading. Its classes ride the line, so a wrapped heading's second row is the same size as its first, and they apply whatever the caret is doing — only the `#` marker's visibility toggles, never the line box." },
  { name: "strong", type: "EditorElement", default: '{ tag: "strong", className: "font-semibold" }', description: "`**bold**`, including the still-unclosed `**bold` you are halfway through typing." },
  { name: "em", type: "EditorElement", default: '{ tag: "em", className: "italic" }', description: "`*italic*`." },
  { name: "code", type: "EditorElement", default: '{ tag: "code", className: "font-mono text-sm bg-muted rounded px-1" }', description: "`` `inline code` ``." },
  { name: "a", type: "EditorElement", default: '{ tag: "a", className: "underline underline-offset-2 decoration-muted-foreground" }', description: "The label of a `[link](url)`. The URL half stays concealed until the caret enters it, and the element carries no `href` — `Cmd+click` is what opens it." },
  { name: "li", type: "EditorElement", default: '{ className: "" }', description: "The whole list row. No tag: the row is CodeMirror's own line div, and the indent on it is structural, so this is for type and colour only." },
  { name: "bullet", type: "EditorElement", default: '{ className: "text-muted-foreground" }', description: "The • (or ◦ when nested) standing in for the `-` marker." },
  { name: "checkbox", type: "EditorElement", default: '{ className: "size-3.5 align-[-0.09375rem] accent-[var(--primary)] cursor-pointer" }', description: "The real `<input type=\"checkbox\">` standing in for `[ ]` / `[x]`. Clicking it rewrites those characters in the document." },
  { name: "taskDone", type: "EditorElement", default: '{ className: "text-muted-foreground line-through" }', description: "The text of a checked task row." },
];
