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
import { Code } from "@/registry/default/code";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection, DocSubSection } from "@/lib/docs/DocPage";

const CLOCK = "/images/products/twemco-clock.png";
const POCKET = "/images/products/analogue-pocket.webp";

/** The essay row from the original grid demo — the images ship with the repo,
 *  and each card links out to the essay it is a screenshot of. */
const ESSAYS = [
  { title: "Buy Wisely", author: "Steph Ango", image: "/images/essays/buy-wisely.jpg", url: "https://stephango.com/buy-wisely" },
  { title: "On Becoming Competitive", author: "Ludwig", image: "/images/essays/on-becoming-competitive.jpg", url: "https://ludwigabap.bearblog.dev/on-becoming-competitive-when-joining-a-new-company/" },
  { title: "Salary Negotiations", author: "Patrick McKenzie", image: "/images/essays/salary-negotiations.jpg", url: "https://www.kalzumeus.com/2012/01/23/salary-negotiation/" },
  { title: "Solution Space & Taste", author: "Grant Slatton", image: "/images/essays/solution-space-taste.jpg", url: "https://grantslatton.com/solution-space-taste" },
  { title: "The Bear Manifesto", author: "Herman", image: "/images/essays/the-bear-manifesto.jpg", url: "https://herman.bearblog.dev/manifesto/" },
  { title: "Write Like You Talk", author: "Paul Graham", image: "/images/essays/write-like-you-talk.jpg", url: "https://paulgraham.com/talk.html" },
];

const usageCode = `import {
  ProductCard,
  ProductCardContent,
  ProductCardHeader,
  ProductCardMetric,
  ProductCardSubtitle,
  ProductCardTitle,
} from "@/components/ui/product-card";

<ProductCard>
  <ProductCardContent>
    <ProductCardHeader>
      <ProductCardTitle>Twemco Clock</ProductCardTitle>
      <ProductCardSubtitle>Clock</ProductCardSubtitle>
    </ProductCardHeader>
    <ProductCardMetric>$219</ProductCardMetric>
  </ProductCardContent>
</ProductCard>`;

// What the demo at the top of the page and the Basic section both render:
// Usage leaves the image out to keep the shape of the composition visible,
// and a real card almost always has one.
const basicCode = `import {
  ProductCard,
  ProductCardContent,
  ProductCardHeader,
  ProductCardImage,
  ProductCardMetric,
  ProductCardSubtitle,
  ProductCardTitle,
} from "@/components/ui/product-card";

<ProductCard>
  <ProductCardImage src="/twemco-clock.png" alt="Twemco Clock" />
  <ProductCardContent>
    <ProductCardHeader>
      <ProductCardTitle>Twemco Clock</ProductCardTitle>
      <ProductCardSubtitle>Clock</ProductCardSubtitle>
    </ProductCardHeader>
    <ProductCardMetric>$219</ProductCardMetric>
  </ProductCardContent>
</ProductCard>`;


const innerCode = `import {
  ProductCard,
  ProductCardContent,
  ProductCardHeader,
  ProductCardImage,
  ProductCardMetric,
  ProductCardSubtitle,
  ProductCardTitle,
} from "@/components/ui/product-card";

// The "inner" variant overlays the content on the image — for
// editorial rows where the caption should sit on the artwork.
<ProductCard variant="inner">
  <ProductCardImage src="/twemco-clock.png" alt="Twemco Clock">
    <ProductCardContent>
      <ProductCardHeader>
        <ProductCardTitle>Twemco Clock</ProductCardTitle>
        <ProductCardSubtitle>Clock</ProductCardSubtitle>
      </ProductCardHeader>
      <ProductCardMetric>$219</ProductCardMetric>
    </ProductCardContent>
  </ProductCardImage>
</ProductCard>`;

const badgeCode = `import {
  ProductCard,
  ProductCardBadge,
  ProductCardImage,
} from "@/components/ui/product-card";

// The badge stops propagation, so clicking it never fires onCardClick.
const [wishlisted, setWishlisted] = useState(false);

<ProductCard onCardClick={() => open(product)}>
  <ProductCardImage src="/twemco-clock.png" alt="Twemco Clock">
    <ProductCardBadge
      icon="✦"
      isActive={wishlisted}
      onClick={() => setWishlisted((v) => !v)}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      Wishlist
    </ProductCardBadge>
  </ProductCardImage>
  {/* … */}
</ProductCard>`;

const gridCode = `import {
  ProductCard,
  ProductCardContent,
  ProductCardHeader,
  ProductCardImage,
  ProductCardMetric,
  ProductCardSubtitle,
  ProductCardTitle,
} from "@/components/ui/product-card";

// A plain CSS grid of cards. \`max-w-none\` lifts the size cap so each card
// fills its own cell, and square corners let the artwork read as printed.
<div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
  {essays.map((essay) => (
    <a key={essay.title} href={essay.url} target="_blank" rel="noopener noreferrer">
      <ProductCard className="w-full rounded-none">
        <ProductCardImage src={essay.image} alt={essay.title} className="rounded-none" />
        <ProductCardContent>
          <ProductCardHeader>
            <ProductCardTitle>{essay.title}</ProductCardTitle>
            <ProductCardSubtitle>by {essay.author}</ProductCardSubtitle>
          </ProductCardHeader>
        </ProductCardContent>
      </ProductCard>
    </a>
  ))}
</div>`;

const sizeCode = `import {
  ProductCard,
  ProductCardContent,
  ProductCardHeader,
  ProductCardImage,
  ProductCardMetric,
  ProductCardSubtitle,
  ProductCardTitle,
} from "@/components/ui/product-card";

// One prop scales the whole card: it caps the width AND scales the image
// padding, the type, and the badge inset. \`w-full\` underneath keeps it from
// overflowing a narrower box, so it still fills a grid cell.
const [size, setSize] = useState<"sm" | "default" | "lg">("lg");

<ProductCard size={size}>
  <ProductCardImage src="/analogue-pocket.webp" alt="Analogue Pocket" />
  <ProductCardContent>
    <ProductCardHeader>
      <ProductCardTitle>Analogue Pocket</ProductCardTitle>
      <ProductCardSubtitle>Gaming Console</ProductCardSubtitle>
    </ProductCardHeader>
    <ProductCardMetric>$219</ProductCardMetric>
  </ProductCardContent>
</ProductCard>`;

const rootProps: PropDef[] = [
  { name: "variant", type: '"default" | "inner"', default: '"default"', description: "Where the content sits: below the image, or overlaid on it." },
  { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "Caps the card width (200 / 320 / 460px) and scales the image padding, type, and badge inset with it. The card is `w-full` under that cap, so it still fills a narrower cell; pass `max-w-none` to opt out. `small` and `large` are accepted as aliases." },
  { name: "animated", type: "boolean", default: "true", description: "Lifts the image on hover and press. Turn off for a static grid." },
  { name: "onCardClick", type: "() => void", description: "Fires when the card is clicked. The badge stops propagation, so it never triggers this." },
];

const partProps: PropDef[] = [
  { name: "ProductCardImage", type: "{ src, alt, imageClassName }", description: "Square image well. Children render on top of it — badges, or the content block in the `inner` variant." },
  { name: "ProductCardBadge", type: "{ isActive, icon }", description: "Button pinned to the image's top-right. `isActive` swaps it to the filled treatment." },
  { name: "ProductCardContent", type: "div", description: "Row holding the header and the metric." },
  { name: "ProductCardHeader", type: "div", description: "Groups the title and subtitle, and takes the free space." },
  { name: "ProductCardTitle", type: "h3", description: "Product name. Truncates on overflow." },
  { name: "ProductCardSubtitle", type: "p", description: "Secondary line — category, brand, tags." },
  { name: "ProductCardMetric", type: "span", description: "Trailing value: price, count, rating. Never shrinks." },
];

function Basic() {
  return (
    <ProductCard>
      <ProductCardImage src={CLOCK} alt="Twemco Clock" />
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

function Inner() {
  return (
    <ProductCard variant="inner">
      <ProductCardImage src={CLOCK} alt="Twemco Clock">
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

function WithBadge() {
  const [wishlisted, setWishlisted] = useState(false);
  return (
    <ProductCard>
      <ProductCardImage src={CLOCK} alt="Twemco Clock">
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

function Grid() {
  return (
    <div className="grid w-full grid-cols-2 gap-5 sm:grid-cols-3">
      {ESSAYS.map((essay) => (
        <a
          key={essay.title}
          href={essay.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-2"
        >
          <ProductCard className="w-full max-w-none rounded-none">
            <ProductCardImage src={essay.image} alt={essay.title} className="rounded-none" />
            <ProductCardContent>
              <ProductCardHeader>
                <ProductCardTitle>{essay.title}</ProductCardTitle>
                <ProductCardSubtitle>by {essay.author}</ProductCardSubtitle>
              </ProductCardHeader>
            </ProductCardContent>
          </ProductCard>
        </a>
      ))}
    </div>
  );
}

function Sizes() {
  const [size, setSize] = useState<"sm" | "default" | "lg">("lg");

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <ProductCard size={size}>
        <ProductCardImage src={POCKET} alt="Analogue Pocket" />
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

export default function ProductCardDoc() {
  return (
    <DocPage
      slug="product-card"
      demo={
        <ComponentPreview code={basicCode} padding="compact">
          <Basic />
        </ComponentPreview>
      }
    >
      <DocSection title="Usage">
        <Code language="tsx" code={usageCode} />
      </DocSection>

      <DocSection title="Basic">
        <ComponentPreview code={basicCode} padding="compact">
          <Basic />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Inner layout">
        <ComponentPreview code={innerCode} padding="compact">
          <Inner />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Sizes">
        <ComponentPreview code={sizeCode} padding="compact">
          <Sizes />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Badge">
        <ComponentPreview code={badgeCode} padding="compact">
          <WithBadge />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Grid">
        <ComponentPreview code={gridCode} padding="compact">
          <Grid />
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <DocSubSection title="ProductCard">
          <PropsTable props={rootProps} />
        </DocSubSection>
        <DocSubSection title="ProductCardImage">
          <PropsTable props={[partProps[0]]} />
        </DocSubSection>
        <DocSubSection title="ProductCardBadge">
          <PropsTable props={[partProps[1]]} />
        </DocSubSection>
        <DocSubSection title="ProductCardContent">
          <PropsTable props={[partProps[2]]} />
        </DocSubSection>
        <DocSubSection title="ProductCardHeader">
          <PropsTable props={[partProps[3]]} />
        </DocSubSection>
        <DocSubSection title="ProductCardTitle">
          <PropsTable props={[partProps[4]]} />
        </DocSubSection>
        <DocSubSection title="ProductCardSubtitle">
          <PropsTable props={[partProps[5]]} />
        </DocSubSection>
        <DocSubSection title="ProductCardMetric">
          <PropsTable props={[partProps[6]]} />
        </DocSubSection>
      </DocSection>
    </DocPage>
  );
}
