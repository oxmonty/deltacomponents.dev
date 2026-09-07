"use client";

import { useState } from "react";
import {
  ProductCard,
  ProductCardBadge,
  ProductCardContent,
  ProductCardHeader,
  ProductCardImage,
  ProductCardMetric,
  ProductCardSubtitle,
  ProductCardTitle,
} from "@/registry/default/product-card";

export default function ProductCardBadgeDemo() {
  const [wishlisted, setWishlisted] = useState(false);

  return (
    <ProductCard>
      <ProductCardImage src="/images/products/twemco-clock.png" alt="Twemco Clock">
        <ProductCardBadge
          icon="✦"
          isActive={wishlisted}
          onClick={() => setWishlisted((v) => !v)}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          Wishlist
        </ProductCardBadge>
      </ProductCardImage>
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
