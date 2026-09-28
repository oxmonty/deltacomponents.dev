"use client";

import { Editor } from "@/registry/ui/editor";
import { EditorControls } from "@/registry/ui/editor-controls";

const DOC = `## Release notes

Select a word and press **B**, or put the caret on a line and pick a style.

- [x] Toolbar reads the caret
- [ ] Undo is the editor's own history

> Every button runs the same command its shortcut does.`;

export default function EditorControlsDemo() {
  return (
    <Editor defaultValue={DOC} className="w-full max-w-[560px]">
      <EditorControls />
    </Editor>
  );
}
