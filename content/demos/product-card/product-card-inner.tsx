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

export default function ProductCardInner() {
  return (
    <ProductCard variant="inner">
      <ProductCardImage src="/images/products/twemco-clock.png" alt="Twemco Clock">
        <ProductCardContent>
          <ProductCardHeader>
            <ProductCardTitle>Twemco Clock</ProductCardTitle>
            <ProductCardSubtitle>Clock</ProductCardSubtitle>
          </ProductCardHeader>
          <ProductCardMetric>$219</ProductCardMetric>
        </ProductCardContent>
      </ProductCardImage>
    </ProductCard>
  );
}
