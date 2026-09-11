"use client";

import { Editor } from "@/registry/ui/editor";

export default function EditorBasic() {
  return (
    <Editor
      placeholder="Click or touch here to begin editing — # for a heading, - [ ] for a task"
      className="w-full max-w-[560px]"
    />
  );
}
