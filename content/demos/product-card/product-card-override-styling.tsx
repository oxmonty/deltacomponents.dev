"use client";

import {
  ProductCard,
  ProductCardContent,
  ProductCardHeader,
  ProductCardImage,
  ProductCardMetric,
  ProductCardSubtitle,
  ProductCardTitle,
} from "@/registry/ui/product-card";

export default function ProductCardOverrideStyling() {
  return (
    // The same card fitted to another design system: a bordered tile with an
    // inset well. The root's 8px padding and 16px corner make the well's own
    // corner 8px, so the two stay concentric.
    <ProductCard className="border-border/60 bg-card rounded-2xl border p-2">
      <ProductCardImage
        src="/images/products/twemco-clock.png"
        alt="Twemco Clock"
        // Corner only: the well keeps the component's own `bg-muted` ground,
        // the same one every other card on this page rests on.
        className="rounded-lg"
      />
      <ProductCardContent className="px-1 pt-3 pb-1">
        <ProductCardHeader>
          <ProductCardTitle className="font-semibold tracking-tight">
            Twemco Clock
          </ProductCardTitle>
          <ProductCardSubtitle className="text-[0.85em] tracking-wider uppercase">
            Desk clock
          </ProductCardSubtitle>
        </ProductCardHeader>
        <ProductCardMetric className="tabular-nums">$219</ProductCardMetric>
      </ProductCardContent>
    </ProductCard>
  );
}
