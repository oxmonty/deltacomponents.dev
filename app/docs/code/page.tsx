"use client";

import { Code } from "@/registry/default/code";
import { PATRICK_DARK } from "@/lib/docs/code-themes";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

const SAMPLE = `export function greet(name: string) {
  const greeting = \`Hello, \${name}!\`;
  console.log(greeting);
  return greeting;
}`;

const LONG_SAMPLE = `import { useEffect, useState } from "react";

export function useDebounced<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}`;


const RUST_SAMPLE = `use std::collections::HashMap;

/// Counts how many times each word appears.
pub fn word_counts(text: &str) -> HashMap<String, usize> {
    let mut counts: HashMap<String, usize> = HashMap::new();

    for word in text.split_whitespace() {
        let key = word.trim_matches(|c: char| !c.is_alphanumeric());
        if key.is_empty() {
            continue;
        }
        *counts.entry(key.to_lowercase()).or_insert(0) += 1;
    }

    counts
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_repeats() {
        let counts = word_counts("the cat the hat");
        assert_eq!(counts["the"], 2);
    }
}`;

const basicCode = `import { Code } from "./components";

<Code language="tsx" code={source} />`;

const filenameCode = `<Code
  filename="greet.ts"
  language="typescript"
  code={source}
/>`;

const packageManagerCode = `// A fenced npx command expands into all four managers.
const install = "\`\`\`npx\\nshadcn@latest add code\\n\`\`\`";

<Code code={install} />

// Or pass the commands yourself:
<Code
  npm="npm i prism-react-renderer"
  pnpm="pnpm add prism-react-renderer"
/>`;

const customThemeCode = `
// One fixed palette: the block stays dark on a light page.
const patrickDark: PrismTheme = {
  plain: { color: "#eeeee3", backgroundColor: "#111111" },
  styles: [
    { types: ["comment"], style: { color: "#6f6f68", fontStyle: "italic" } },
    { types: ["keyword"], style: { color: "#7388f7" } },
    { types: ["function", "number"], style: { color: "#f5bb5f" } },
    { types: ["string", "class-name"], style: { color: "#bad688" } },
  ],
};

<Code filename="word_count.rs" language="rust" theme={patrickDark} code={source} />`;

const expandableCode = `<Code
  filename="hooks.ts"
  code={source}
  expandable
  collapsedHeight="10rem"
/>`;

const codeBlockProps: PropDef[] = [
  { name: "code", type: "string", description: "The source to render. A fenced markdown block (```lang) is unwrapped, and its language wins over `language`." },
  { name: "language", type: "string", default: '"typescript"', description: "Prism grammar name. Common aliases (ts, js, sh, yml, py) resolve automatically." },
  { name: "filename", type: "string", description: "Shows a header bar with a file-type icon, the name, and the copy button. Without it, the copy button floats over the code." },
  { name: "showLineNumbers", type: "boolean", default: "true", description: "Renders a sticky line-number gutter that survives horizontal scroll." },
  { name: "expandable", type: "boolean", default: "false", description: "Clips the block to `collapsedHeight` behind a fade, with an Expand/Collapse toggle." },
  { name: "defaultExpanded", type: "boolean", default: "false", description: "Starts an expandable block open." },
  { name: "collapsedHeight", type: "string", default: '"12rem"', description: "Height of an expandable block while collapsed." },
  { name: "expandLabel", type: "string", default: '"Expand"', description: "Text on the affordance that opens a collapsed block; the docs previews pass \"View code\". Expanding is one-way — there is no collapse control, so a reader never re-opens what they just opened." },
  { name: "npm / yarn / pnpm / bun", type: "string", description: "Install commands. Supplying any renders the package-manager tab strip instead of a plain block." },
  { name: "defaultPackageManager", type: '"npm" | "yarn" | "pnpm" | "bun"', default: '"npm"', description: "Which tab opens selected." },
  { name: "theme", type: "PrismTheme", description: "Pins one palette regardless of the site theme." },
  { name: "adaptiveTheme", type: "{ light, dark }", description: "A palette pair chosen by the resolved site theme. Overrides `theme`." },
  { name: "useThemeBackground", type: "boolean", default: "true when a custom theme is set", description: "Paints the header and code surface from the Prism theme's own background instead of the page's card token. A supplied `theme` or `adaptiveTheme` turns this on by default, since a palette from elsewhere carries its own ground." },
  { name: "scrollbar", type: "boolean", default: "true", description: "Set false to hide the scrollbar while keeping the block scrollable." },
  { name: "textClassName", type: "string", default: '"text-[14px]"', description: "Font size for the code. A `text-*` class in `className` overrides it." },
];

export default function CodeDoc() {
  return (
    <DocPage
      slug="code"
      description="Syntax-highlighted code with a copy button, a filename bar, and a package-manager tab strip."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode} padding="compact">
          <div className="w-full max-w-[520px]">
            <Code language="tsx" code={SAMPLE} />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="With a filename">
        <ComponentPreview code={filenameCode} padding="compact">
          <div className="w-full max-w-[520px]">
            <Code filename="greet.ts" language="typescript" code={SAMPLE} />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Package managers">
        <ComponentPreview code={packageManagerCode} padding="compact">
          <div className="w-full max-w-[520px]">
            <Code code={"```npx\nshadcn@latest add code\n```"} />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Custom theme">
        <ComponentPreview code={customThemeCode} padding="compact">
          <div className="w-full max-w-[520px]">
            <Code
              filename="word_count.rs"
              language="rust"
              theme={PATRICK_DARK}
              code={RUST_SAMPLE}
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Expandable">
        <ComponentPreview code={expandableCode} padding="compact">
          <div className="w-full max-w-[520px]">
            <Code
              filename="hooks.ts"
              language="typescript"
              code={LONG_SAMPLE}
              expandable
              collapsedHeight="10rem"
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={codeBlockProps} />
      </DocSection>
    </DocPage>
  );
}
