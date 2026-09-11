"use client";

import { useState } from "react";
import { Editor } from "@/registry/ui/editor";

export default function EditorAutosave() {
  const [saves, setSaves] = useState(0);

  return (
    <div className="flex w-full max-w-[560px] flex-col gap-2">
      <Editor
        defaultValue={"Type here. The indicator in the corner is the save.\n"}
        onSave={async () => {
          // Stands in for the write: `await fetch("/api/note", { method: "PUT", body: doc })`
          await new Promise((resolve) => setTimeout(resolve, 900));
          setSaves((n) => n + 1);
        }}
      />
      <span className="text-caption text-muted-foreground">
        {saves === 0 ? "Nothing written yet" : `${saves} write${saves === 1 ? "" : "s"}`}
      </span>
    </div>
  );
}
