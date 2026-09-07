import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { site } from "@/lib/config";

// Query params are public, unauthenticated input on this route — cap both
// before they reach Satori so a pathological query string can't blow up
// render time or the image the way an unbounded title/description would.
const MAX_TITLE_LENGTH = 100;

/** The framing rules, inset from the card's edge.
 *
 *  48px sits outside everything the card draws — the text column starts at 80
 *  and the logo is inset 80 from the bottom-right — so the frame reads as a
 *  margin around the content rather than a line through it.
 *
 *  Dashed, like the previous site's card: a solid rule at this weight reads as
 *  a crop mark, and the dashes keep it as a margin guide.
 *
 *  The dashes are a repeating gradient, not `border-style: dashed`. Satori
 *  drops the dash pattern on a box with no thickness in the other axis and
 *  renders it solid, so the rule has to paint its own. */
const RULE_INSET = 48;
const RULE_COLOR = "#D4D4D4";
const DASH = 6;
const GAP = 5;

function dashes(direction: "to right" | "to bottom"): string {
  return `repeating-linear-gradient(${direction}, ${RULE_COLOR} 0 ${DASH}px, transparent ${DASH}px ${DASH + GAP}px)`;
}
const MAX_DESCRIPTION_LENGTH = 110;

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

// Mirrors the previous site's step-down: a longer title needs a smaller size
// to still read as one or two lines inside the 1040px text column.
function titleFontSize(title: string): number {
  if (title.length > 40) return 44;
  if (title.length > 20) return 56;
  return 72;
}

// Read from disk, not `fetch(new URL(..., import.meta.url))`. That form works
// in dev but resolves to a bundled asset path (`/_next/static/media/…`) in a
// production build, which `fetch` cannot parse without an origin — the route
// 500s with ERR_INVALID_URL. `next.config.ts` traces these two files into the
// route's bundle so they exist at runtime. Read once and kept: the fonts are
// ~325KB each and never change.
let fonts: Promise<[Buffer, Buffer]> | null = null;

function loadFonts(): Promise<[Buffer, Buffer]> {
  fonts ??= Promise.all([
    readFile(join(process.cwd(), "app/og/Inter-Regular.ttf")),
    readFile(join(process.cwd(), "app/og/Inter-Bold.ttf")),
  ]) as Promise<[Buffer, Buffer]>;
  return fonts;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = truncate(searchParams.get("title") ?? site.name, MAX_TITLE_LENGTH);
  const description = truncate(
    searchParams.get("description") ?? site.description,
    MAX_DESCRIPTION_LENGTH,
  );

  const [regular, bold] = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          height: "100%",
          backgroundColor: "#FAFAFA",
          fontFamily: "Inter",
        }}
      >
        {[
          { top: RULE_INSET, left: 0, right: 0, height: 1, backgroundImage: dashes("to right") },
          { bottom: RULE_INSET, left: 0, right: 0, height: 1, backgroundImage: dashes("to right") },
          { left: RULE_INSET, top: 0, bottom: 0, width: 1, backgroundImage: dashes("to bottom") },
          { right: RULE_INSET, top: 0, bottom: 0, width: 1, backgroundImage: dashes("to bottom") },
        ].map((rule, i) => (
          <div key={i} style={{ display: "flex", position: "absolute", ...rule }} />
        ))}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 80,
            width: 1040,
          }}
        >
          <div
            style={{
              display: "flex",
              fontWeight: 700,
              fontSize: titleFontSize(title),
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "#171717",
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontWeight: 400,
              fontSize: 32,
              lineHeight: 1.4,
              color: "#737373",
            }}
          >
            {description}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            right: 80,
            bottom: 80,
            color: "#171717",
          }}
        >
          <svg viewBox="0 0 282 308" width={53} height={58} fill="none">
            <path
              d="M280.438 295.396L152.117 5.66075C151.645 3.87252 150.584 2.32152 149.12 1.29292C147.665 0.264327 145.896 -0.172778 144.147 0.0619372H120.258C118.509 -0.172778 116.74 0.264327 115.285 1.29292C113.821 2.32152 112.76 3.87252 112.288 5.66075L0.780777 295.396C0.171502 296.774 -0.0839596 298.294 0.0241376 299.81C0.132235 301.327 0.603995 302.788 1.40981 304.052C2.2058 305.318 3.30641 306.345 4.58392 307.034C5.87126 307.725 7.30596 308.054 8.75053 307.993H272.92C279.111 307.993 284.86 300.528 280.438 295.396ZM122.469 127.434L177.775 250.605C178.384 252.07 178.65 253.664 178.551 255.257C178.453 256.85 177.991 258.395 177.215 259.765C176.429 261.133 175.358 262.286 174.07 263.128C172.783 263.969 171.329 264.475 169.815 264.602H68.037C66.4941 264.493 64.9807 264.019 63.6246 263.213C62.2685 262.408 61.1089 261.293 60.2146 259.951C59.3204 258.607 58.7307 257.07 58.4752 255.454C58.2197 253.836 58.318 252.18 58.7504 250.605L106.539 127.434C107.266 125.856 108.397 124.525 109.802 123.594C111.207 122.663 112.838 122.169 114.499 122.169C116.17 122.169 117.791 122.663 119.206 123.594C120.612 124.525 121.741 125.856 122.469 127.434Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "Inter", data: bold, weight: 700, style: "normal" },
      ],
      headers: {
        // Content is fully determined by the query string, so it never
        // changes for a given URL — safe to cache indefinitely.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
}
