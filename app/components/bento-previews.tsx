"use client";

import { Button } from "@/registry/ui/button";
import { Tooltip } from "@/registry/ui/tooltip";
import GlyphBasic from "@/content/demos/glyph/glyph-basic";
import AlertDemo from "@/content/demos/alert/alert-demo";
import { Code } from "@/registry/ui/code";
import { Editor } from "@/registry/ui/editor";
import { PATRICK_DARK } from "@/lib/docs/code-themes";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/ui/tabs";
import {
  ProductCard,
  ProductCardContent,
  ProductCardHeader,
  ProductCardImage,
  ProductCardMetric,
  ProductCardSubtitle,
  ProductCardTitle,
} from "@/registry/ui/product-card";
import { BUTTON_ITEMS, TOOLTIP_COPY, TABS_ITEMS } from "@/app/components/demo-data";

function ButtonPreview() {
  return (
    // justify-center, not just the stage's centring: the row wraps on a phone
    // and a wrapped line is laid out from the start edge, so the second row of
    // buttons sat left of the first.
    <div className="flex flex-wrap items-center justify-center gap-2">
      {BUTTON_ITEMS.map((item) => (
        <Button key={item.label} variant={item.variant}>
          {item.label}
        </Button>
      ))}
    </div>
  );
}


function TooltipPreview() {
  return (
    <div className="relative z-10">
      <Tooltip content={TOOLTIP_COPY.content}>
        <Button variant="secondary">{TOOLTIP_COPY.trigger}</Button>
      </Tooltip>
    </div>
  );
}

function CodePreview() {
  return (
    // Narrower than the stage on purpose: edge-to-edge the block reads as
    // cropped rather than as a card sitting on a surface.
    <div className="w-full max-w-[440px]">
      <Code
        filename="tally.rs"
        language="rust"
        theme={PATRICK_DARK}
        showLineNumbers={false}
        className="text-caption"
        code={`use std::collections::HashMap;

/// Counts how many times each word appears.
pub fn tally(text: &str) -> HashMap<&str, usize> {
    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word).or_insert(0) += 1;
    }
    counts
}`}
      />
    </div>
  );
}

function ProductCardPreview() {
  return (
    <ProductCard size="lg">
      <ProductCardImage src="/images/products/analogue-pocket.webp" alt="Analogue Pocket" />
      <ProductCardContent>
        <ProductCardHeader>
          <ProductCardTitle>Analogue Pocket</ProductCardTitle>
          <ProductCardSubtitle>Gaming Console</ProductCardSubtitle>
        </ProductCardHeader>
        <ProductCardMetric>$219</ProductCardMetric>
      </ProductCardContent>
    </ProductCard>
  );
}

function TabsPreview() {
  return (
    // Same shape as the demos on the docs page: a `w-fit` block whose strip and
    // copy share a left edge, centred as one unit by the card's stage. Needs
    // the two-column card — in one column the stage is 213px against the
    // strip's 232, and a `w-fit` block that cannot shrink pins left instead.
    <Tabs defaultValue="account" size="lg" className="w-fit max-w-full">
      <TabsList>
        {TABS_ITEMS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {/* The panels differ only in one line, so the stage is pinned to a
          single row's height and they swap in the same spot rather than
          resizing the card as the reader clicks through. */}
      <div className="relative min-h-[24px]">
        {TABS_ITEMS.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="absolute inset-x-0 top-0"
          >
            <p className="text-caption text-muted-foreground">{tab.copy}</p>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}

// A seeded document rather than an empty editor: the card has to show what
// the component does in one glance, and an empty editor shows a placeholder.
// One of each construct — heading, inline marks, a bullet glyph, a checked
// task — because the concealment is the point and you only see it happen
// against syntax that ISN'T there.
const EDITOR_DOC = `# Field notes

Click or touch here to begin editing — the syntax hides wherever the caret isn't.

- Bullets, [links](https://deltacomponents.dev) and \`code\`

- [x] Conceal the marks away from the caret
- [ ] Swap the typography set
`;

function EditorPreview() {
  return (
    // text-base, not text-sm: an editable field under 16px makes iOS zoom the
    // page the moment it takes focus, and the showcase card is the first one
    // a phone meets.
    <div className="w-full max-w-[460px]">
      <Editor defaultValue={EDITOR_DOC} className="min-h-0 text-base" />
    </div>
  );
}

export const previewMap: Record<string, React.FC> = {
  tabs: TabsPreview,
  "product-card": ProductCardPreview,
  "code": CodePreview,
  button: ButtonPreview,
  tooltip: TooltipPreview,
  "glyph": GlyphBasic,
  alert: AlertDemo,
  editor: EditorPreview,
};
