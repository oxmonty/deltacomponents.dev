import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { site } from "@/lib/config";
import { LOGO_PATH, LOGO_VIEWBOX } from "@/lib/logo";

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
          <svg viewBox={LOGO_VIEWBOX} width={53} height={58} fill="none">
            <path d={LOGO_PATH} fill="currentColor" />
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
