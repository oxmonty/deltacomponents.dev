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

/** Lucide's bookmark, inlined so the badge carries no icon dependency. It
 *  fills when the item is saved and stays an outline when it is not, so the
 *  state reads without relying on the badge's colour alone. */
function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function ProductCardBadgeDemo() {
  const [wishlisted, setWishlisted] = useState(false);

  return (
    <ProductCard>
      <ProductCardImage src="/images/products/twemco-clock.png" alt="Twemco Clock">
        <ProductCardBadge
          icon={<BookmarkIcon filled={wishlisted} />}
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
