import type { PropDef } from "@/lib/docs/PropsTable";

export const productCardProps: PropDef[] = [
  { name: "variant", type: '"default" | "inner"', default: '"default"', description: "Where the content sits: below the image, or overlaid on it." },
  { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "Caps the card width (200 / 320 / 460px) and scales the image padding, type, and badge inset with it. The card is `w-full` under that cap, so it still fills a narrower cell; pass `max-w-none` to opt out. `small` and `large` are accepted as aliases." },
  { name: "animated", type: "boolean", default: "true", description: "Lifts the image on hover and press. Turn off for a static grid." },
  { name: "onCardClick", type: "() => void", description: "Fires when the card is clicked. The badge stops propagation, so it never triggers this." },
];

export const productCardImageProps: PropDef[] = [
  { name: "ProductCardImage", type: "{ src, alt, imageClassName }", description: "Square image well. Children render on top of it — badges, or the content block in the `inner` variant." },
];

export const productCardBadgeProps: PropDef[] = [
  { name: "ProductCardBadge", type: "{ isActive, icon }", description: "Button pinned to the image's top-right. `isActive` swaps it to the filled treatment." },
];

export const productCardContentProps: PropDef[] = [
  { name: "ProductCardContent", type: "div", description: "Row holding the header and the metric." },
];

export const productCardHeaderProps: PropDef[] = [
  { name: "ProductCardHeader", type: "div", description: "Groups the title and subtitle, and takes the free space." },
];

export const productCardTitleProps: PropDef[] = [
  { name: "ProductCardTitle", type: "h3", description: "Product name. Truncates on overflow." },
];

export const productCardSubtitleProps: PropDef[] = [
  { name: "ProductCardSubtitle", type: "p", description: "Secondary line — category, brand, tags." },
];

export const productCardMetricProps: PropDef[] = [
  { name: "ProductCardMetric", type: "span", description: "Trailing value: price, count, rating. Never shrinks." },
];
