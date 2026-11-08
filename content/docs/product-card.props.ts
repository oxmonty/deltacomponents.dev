import type { PropDef } from "@/lib/docs/props-table";

export const productCardProps: PropDef[] = [
  { name: "variant", type: '"default" | "inner"', default: '"default"', description: "Where the content sits: below the image, or overlaid on it." },
  { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "Caps the card width (200 / 320 / 460px) and scales the image padding and type with it. The card is `w-full` under that cap, so it still fills a narrower cell; pass `max-w-none` to opt out." },
  { name: "animated", type: "boolean", default: "true", description: "Lifts the image on hover and press. Turn off for a card that keeps still." },
  { name: "className", type: "string", description: "Merged onto the root through `tailwind-merge`. The card's type size lives here — one `text-*` resizes the title, subtitle and metric together — and every part is reachable by its `data-slot`." },
  { name: "...props", type: "React.ComponentProps<'div'>", description: "Everything else lands on the root: `ref`, `id`, `onClick`, `aria-*`, data attributes. An `onClick` also gives the card a pointer cursor; see Accessibility for making it keyboard-reachable." },
];

export const productCardImageProps: PropDef[] = [
  { name: "ProductCardImage", type: "{ src?, alt?, imageClassName }", description: "Square image well. Children render on top of it, like the content block in the `inner` variant. Leave `src` off and the well is an empty stage for them." },
];

export const productCardOverlayProps: PropDef[] = [
  { name: "position", type: '"top-left" | "top-right" | "bottom-left" | "bottom-right"', description: "Which corner of the well it sits in, inset by the card's size step." },
  { name: "reveal", type: '"always" | "hover"', default: '"always"', description: "`hover` hides it until the well is hovered or holds focus. Only where hovering is possible: touch screens see it from the start. Put `data-on` on the overlay to keep it shown, for a toggled state." },
  { name: "...props", type: "React.ComponentProps<'div'>", description: "Lands on the overlay `div`; `className` is merged last." },
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
