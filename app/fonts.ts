import localFont from "next/font/local";

/**
 * Inter, self-hosted through `next/font/local`.
 *
 * It was a bare `@font-face` in globals.css, which flickered on every hard
 * load for two reasons the timings made plain: the font was only discovered
 * once the stylesheet had been parsed (request started 48ms after the CSS
 * finished, well after first paint), and `font-display: swap` then did exactly
 * what it says — paint the fallback, swap when the file lands.
 *
 * `next/font` fixes both halves. It emits a `<link rel="preload">` so the file
 * is fetched alongside the CSS rather than after it, and it generates a
 * fallback `@font-face` with `size-adjust` and metric overrides derived from
 * the real font, so the text that paints first already occupies the right
 * space. The swap stops being a reflow and becomes imperceptible.
 *
 * `swap` is kept rather than `optional`: with the metrics matched there is
 * nothing to see, and `optional` would leave a first-time visitor on the
 * fallback for the whole visit.
 *
 * woff2, not the ttf the file started as: `next/font/local` copies the file
 * through as-is rather than subsetting or compressing it, and the preload is
 * unconditional — including on iOS, which renders SF instead (see the
 * `-webkit-touch-callout` block in globals.css) and so downloads this and
 * discards it. 337KB rather than 843KB is the difference that costs nothing.
 */
export const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-inter",
  // The stack globals.css used, so the pre-swap frame is the same face it
  // always was — now with Inter's metrics applied to it.
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});
