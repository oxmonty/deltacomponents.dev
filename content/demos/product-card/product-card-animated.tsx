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
} from "@/registry/ui/product-card";

const STILL = "/images/products/hitmontop-still.png";
const ANIMATED = "/images/products/hitmontop.gif";

export default function ProductCardAnimated() {
  // A GIF has no play control, so swapping the source is the whole trick: the
  // still frame rests, the animation starts from frame one on every hover.
  // The handlers reach the image well because it spreads the DOM props it is
  // given, like every other part of the card.
  const [playing, setPlaying] = useState(false);

  return (
    <ProductCard>
      <ProductCardImage
        src={playing ? ANIMATED : STILL}
        alt="Hitmontop"
        // Sits the sprite in a little further than the size step's own p-8.
        imageClassName="p-12"
        onMouseEnter={() => setPlaying(true)}
        onMouseLeave={() => setPlaying(false)}
      />
      <ProductCardContent>
        <ProductCardHeader>
          <ProductCardTitle>Hitmontop</ProductCardTitle>
          <ProductCardSubtitle>Fighting type</ProductCardSubtitle>
        </ProductCardHeader>
        <ProductCardMetric>#237</ProductCardMetric>
      </ProductCardContent>
    </ProductCard>
  );
}
