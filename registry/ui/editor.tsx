"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import {
  liveMarkdownBase,
  livePreview,
  type EditorElements,
} from "@/registry/lib/live-markdown";
import { cn } from "@/registry/lib/utils";

/** What the corner indicator is reporting. `error` means the write rejected
 *  and the text is only in the browser. */
export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const SAVE_LABEL: Record<SaveState, string> = {
  idle: "",
  dirty: "Unsaved",
  saving: "Saving",
  saved: "Saved",
  error: "Not saved",
};

export interface EditorProps {
  /** Seeds the document. The editor owns the text from then on — see the note
   *  on the save contract in the docs. */
  defaultValue?: string;
  placeholder?: string;
  /** Every keystroke. For persistence use `onSave`, which is debounced. */
  onChange?: (doc: string) => void;
  /** Fired after `saveDelay` of idle, on blur, and on unmount — never with a
   *  document it has already stored. Reject (or throw) to report a failed
   *  write: the indicator says so and the next flush retries. */
  onSave?: (doc: string) => void | Promise<void>;
  saveDelay?: number;
  /** Hide the corner save indicator and drive your own from `onSaveState`. */
  showSaveStatus?: boolean;
  onSaveState?: (state: SaveState) => void;
  /** Which element each markdown construct renders as, and its classes.
   *  Omitted keys fall back to `defaultElements`. */
  elements?: EditorElements;
  className?: string;
}

/**
 * Always-on live-preview markdown editor: one surface that is both the
 * rendered document and the text you type into. Syntax marks conceal
 * everywhere the caret isn't.
 *
 * The editor is created exactly once per mount (empty-dep effect, callbacks
 * held in refs) — rebuilding the view on re-render would drop the caret and
 * the undo history.
 */
export const Editor = forwardRef<HTMLDivElement, EditorProps>(function Editor(
  {
    defaultValue = "",
    placeholder = "",
    onChange,
    onSave,
    saveDelay = 800,
    showSaveStatus = true,
    onSaveState,
    elements,
    className,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [mounted, setMounted] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  // One compartment so an `elements` change swaps only the preview plugin;
  // rebuilding the whole extension set would construct a fresh history() and
  // lose the user's undo stack.
  const [elementsCompartment] = useState(() => new Compartment());

  // Read once at mount: re-seeding the document from props mid-edit would
  // fight the user for the caret.
  const seedRef = useRef({ defaultValue, placeholder, elements });

  // The editor owns the document after mount; these refs only orchestrate
  // saving. `savedRef` is the last value known to be STORED and `sendingRef`
  // the one in flight, so idle ticks, blurs and double-flushes are no-ops.
  const draftRef = useRef(defaultValue);
  const savedRef = useRef(defaultValue);
  const sendingRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Only the newest save may set the indicator: a slow write that resolves
  // after a later one would otherwise report stale news.
  const saveTokenRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  const onSaveStateRef = useRef(onSaveState);
  const saveDelayRef = useRef(saveDelay);
  useEffect(() => {
    onChangeRef.current = onChange;
    onSaveRef.current = onSave;
    onSaveStateRef.current = onSaveState;
    saveDelayRef.current = saveDelay;
  });

  const report = useCallback((state: SaveState) => {
    setSaveState(state);
    onSaveStateRef.current?.(state);
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const next = draftRef.current;
    // Saved verbatim — leading and trailing newlines are part of the document.
    if (next === savedRef.current || next === sendingRef.current) return;
    const save = onSaveRef.current;
    if (!save) {
      savedRef.current = next;
      return;
    }
    const token = ++saveTokenRef.current;
    sendingRef.current = next;
    report("saving");
    Promise.resolve()
      .then(() => save(next))
      .then(() => {
        // Advanced only once the write lands, so a rejected save stays
        // pending and the next flush sends it again.
        savedRef.current = next;
        if (token === saveTokenRef.current) report("saved");
      })
      .catch(() => {
        if (token === saveTokenRef.current) report("error");
      })
      .finally(() => {
        if (sendingRef.current === next) sendingRef.current = null;
      });
  }, [report]);
  const flushRef = useRef(flush);
  flushRef.current = flush;

  useEffect(() => {
    const seed = seedRef.current;
    const view = new EditorView({
      parent: containerRef.current!,
      state: EditorState.create({
        doc: seed.defaultValue,
        extensions: [
          liveMarkdownBase(seed.placeholder),
          elementsCompartment.of(livePreview(seed.elements)),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            const doc = update.state.doc.toString();
            draftRef.current = doc;
            onChangeRef.current?.(doc);
            if (onSaveRef.current && doc !== savedRef.current) report("dirty");
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => flushRef.current(), saveDelayRef.current);
          }),
          EditorView.domEventHandlers({
            blur: () => {
              flushRef.current();
            },
          }),
        ],
      }),
    });
    viewRef.current = view;
    setMounted(true);
    return () => {
      // Flush on unmount so navigating away mid-typing never drops work.
      flushRef.current();
      view.destroy();
      viewRef.current = null;
    };
  }, [elementsCompartment, report]);

  // Keyed on the map's contents, not its identity: a caller passing an inline
  // object literal would otherwise reconfigure on every render.
  const elementsKey = JSON.stringify(elements ?? {});
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: elementsCompartment.reconfigure(livePreview(elements)) });
    // `elements` is tracked through elementsKey — see above.
     
  }, [elementsKey, elementsCompartment]);

  const status = showSaveStatus && onSave && saveState !== "idle" ? saveState : null;

  return (
    <div
      ref={ref}
      className={cn("relative min-h-24 text-base leading-7", className)}
      data-slot="editor"
    >
      {/* Covers the hydration window at the same typography as the editor, so
          line positions hold and only the syntax marks change when CodeMirror
          takes over. `min-h` on the root is what gives the mounted editor its
          click target too — the theme inherits it. */}
      {!mounted && (
        <div aria-hidden className="whitespace-pre-wrap">
          {defaultValue || <span className="text-muted-foreground">{placeholder}</span>}
        </div>
      )}
      <div ref={containerRef} />
      {status && (
        // Pinned to the corner rather than placed after the text: it has to
        // be in the same spot every time you glance for it, and the document
        // is the wrong length for that. Its own ground keeps it legible over
        // a long first line.
        //
        // Visual only: the announcement is the sr-only region below, which
        // carries the SETTLED states alone. Announcing "unsaved" and "saving"
        // too would narrate every pause in typing — and CodeMirror already
        // has a polite region of its own inside this editor.
        <div
          aria-hidden
          className="bg-background/90 text-muted-foreground pointer-events-none absolute top-0 right-0 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs select-none"
        >
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full",
              status === "saving" && "bg-muted-foreground animate-pulse",
              status === "dirty" && "bg-muted-foreground/50",
              status === "saved" && "bg-muted-foreground/70",
              status === "error" && "bg-destructive",
            )}
          />
          <span className={cn(status === "error" && "text-destructive")}>
            {SAVE_LABEL[status]}
          </span>
        </div>
      )}
      {onSave && (
        <span className="sr-only" aria-live="polite">
          {saveState === "saved" || saveState === "error" ? SAVE_LABEL[saveState] : ""}
        </span>
      )}
    </div>
  );
});
Editor.displayName = "Editor";
