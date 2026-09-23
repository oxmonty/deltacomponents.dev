"use client";

import { Editor } from "@/registry/ui/editor";

const NOTE = `# Weekly note

Click or touch here to start editing. The editor is **always on** — there is no *edit mode* to enter, and Markdown syntax appears only where you're typing.

- [x] Port the live preview off \`@codemirror/lang-markdown\`
- [ ] Read the [typography map](https://www.deltacomponents.dev/docs/editor)
- [ ] Wire autosave to the database

Try \`Cmd+B\`, \`Cmd+I\` and \`Cmd+L\` on a selection.
`;

export default function EditorDemo() {
  return <Editor defaultValue={NOTE} className="w-full max-w-[560px]" />;
}
