"use client";

import { useState } from "react";
import {
  ProductCard,
  ProductCardContent,
  ProductCardHeader,
  ProductCardImage,
  ProductCardMetric,
  ProductCardSubtitle,
  ProductCardTitle,
} from "@/registry/default/product-card";

export default function ProductCardSizes() {
  const [size, setSize] = useState<"sm" | "default" | "lg">("lg");

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <ProductCard size={size}>
        <ProductCardImage src="/images/products/analogue-pocket.webp" alt="Analogue Pocket" />
        <ProductCardContent>
          <ProductCardHeader>
            <ProductCardTitle>Analogue Pocket</ProductCardTitle>
            <ProductCardSubtitle>Gaming Console</ProductCardSubtitle>
          </ProductCardHeader>
          <ProductCardMetric>$219</ProductCardMetric>
        </ProductCardContent>
      </ProductCard>

      {/* A bare <select>, not the library's — the point of this demo is the
          card reacting to `size`, and a native control keeps the surrounding
          chrome out of the way. */}
      <label className="text-caption text-muted-foreground flex items-center gap-2">
        Size
        <select
          value={size}
          onChange={(e) => setSize(e.target.value as "sm" | "default" | "lg")}
          className="border-border bg-background text-foreground text-caption rounded-md border px-2 py-1 outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
        >
          <option value="sm">sm</option>
          <option value="default">default</option>
          <option value="lg">lg</option>
        </select>
      </label>
    </div>
  );
}
