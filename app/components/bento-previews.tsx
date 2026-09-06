"use client";

import { Button } from "@/registry/base/button";
import { Tooltip } from "@/registry/base/tooltip";
import { Code } from "@/registry/default/code";
import { PATRICK_DARK } from "@/lib/docs/code-themes";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/default/tabs";
import {
  ProductCard,
  ProductCardContent,
  ProductCardHeader,
  ProductCardImage,
  ProductCardMetric,
  ProductCardSubtitle,
  ProductCardTitle,
} from "@/registry/default/product-card";
import { BUTTON_ITEMS, TOOLTIP_COPY, TABS_ITEMS } from "@/app/components/demo-data";

function ButtonPreview() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {BUTTON_ITEMS.map((item) => (
        <Button key={item.label} variant={item.variant} size="sm">
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
        <Button variant="secondary" size="sm">{TOOLTIP_COPY.trigger}</Button>
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
        textClassName="text-caption"
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
    <Tabs defaultValue="account" className="w-fit max-w-full">
      <TabsList>
        {TABS_ITEMS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {/* The panels differ only in one line, so the stage is pinned to a
          single row's height and they cross-fade in the same spot rather than
          resizing the card as the reader clicks through. */}
      <div className="relative min-h-[24px]">
        {TABS_ITEMS.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="absolute inset-x-0 top-0"
            fadeIn
          >
            <p className="text-caption text-muted-foreground">{tab.copy}</p>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}

export const previewMap: Record<string, React.FC> = {
  tabs: TabsPreview,
  "product-card": ProductCardPreview,
  "code": CodePreview,
  button: ButtonPreview,
  tooltip: TooltipPreview,
};
