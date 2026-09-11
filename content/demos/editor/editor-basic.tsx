"use client";

import { Editor } from "@/registry/ui/editor";

export default function EditorBasic() {
  return (
    <Editor
      placeholder="Write something — # for a heading, - [ ] for a task"
      className="w-full max-w-[560px]"
    />
  );
}
