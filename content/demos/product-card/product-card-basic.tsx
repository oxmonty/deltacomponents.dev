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

export default function ProductCardBasic() {
  return (
    <ProductCard>
      <ProductCardImage src="/images/products/twemco-clock.png" alt="Twemco Clock" />
      <ProductCardContent>
        <ProductCardHeader>
          <ProductCardTitle>Twemco Clock</ProductCardTitle>
          <ProductCardSubtitle>Clock</ProductCardSubtitle>
        </ProductCardHeader>
        <ProductCardMetric>$219</ProductCardMetric>
      </ProductCardContent>
    </ProductCard>
  );
}
