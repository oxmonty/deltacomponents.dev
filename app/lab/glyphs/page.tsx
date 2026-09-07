import type { Metadata } from "next";
import { LabGlyph, type LabGlyphProps } from "./lab-glyph";
import { Check } from "lucide-react";
import { Glyph } from "@/registry/ui/glyph";

export const metadata: Metadata = {
  title: "Glyph lab",
  robots: { index: false, follow: false },
};

// Every specimen renders twice — once at a size big enough to judge the
// interior tuning by eye, once at 16px, because a knockout that reads fine
// at 40px is often the first thing to close up or blur at the size a real
// badge actually ships at.
const BIG = 40;
const SMALL = 16;

interface Specimen extends Omit<LabGlyphProps, "size"> {
  caption: string;
}

function Row({ specimens }: { specimens: Specimen[] }) {
  return (
    <div className="flex flex-wrap gap-x-10 gap-y-8">
      {specimens.map((s, i) => (
        <div key={i} className="flex flex-col items-center gap-3 w-32">
          <div className="flex items-end gap-3">
            <LabGlyph {...s} size={BIG} />
            <LabGlyph {...s} size={SMALL} />
          </div>
          <p className="text-caption text-muted-foreground text-center">
            {s.caption}
          </p>
        </div>
      ))}
    </div>
  );
}

function Section({
  n,
  title,
  note,
  children,
}: {
  n: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 border-t border-border/60 pt-10">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-heading text-foreground" style={{ fontVariationSettings: "'wght' 550" }}>
          <span className="text-muted-foreground mr-2">{n}</span>
          {title}
        </h2>
        <p className="text-prose text-muted-foreground max-w-[640px]">{note}</p>
      </div>
      {children}
    </section>
  );
}

const BLUE = "#1d9bf0";
const GREEN = "#22c55e";
const AMBER = "#f59e0b";
const VIOLET = "#8b5cf6";
const RED = "#ef4444";
const GRAY = "#525252";

const trust: Specimen[] = [
  { shape: "rosette", icon: "check", mode: "stroke", scale: 1, color: BLUE, caption: "Verified — the shipped Glyph" },
  { shape: "shield", icon: "check", mode: "stroke", scale: 0.62, nudgeY: 0.3, color: BLUE, caption: "Official / staff" },
  { shape: "shield", icon: "lock", mode: "stroke", scale: 0.48, nudgeY: 0.4, color: GRAY, caption: "Protected" },
  { shape: "circle", icon: "bot", mode: "stroke", scale: 0.55, color: GRAY, caption: "Automated / bot" },
];

const standing: Specimen[] = [
  { shape: "rosette", icon: "star", mode: "fill", scale: 0.52, color: AMBER, caption: "Featured" },
  { shape: "squircle", icon: "bolt", mode: "fill", scale: 0.5, color: VIOLET, caption: "Premium / pro" },
  { shape: "squircle", icon: "crown", mode: "fill", scale: 0.52, nudgeY: 0.4, color: AMBER, caption: "Premium / pro (crown)" },
  { shape: "circle", icon: "flame", mode: "fill", scale: 0.52, nudgeY: 0.3, color: "#f97316", caption: "Streak" },
  { shape: "circle", icon: "pen", mode: "stroke", scale: 0.52, color: GRAY, caption: "Creator / author" },
];

const state: Specimen[] = [
  { shape: "circle", icon: "x", mode: "stroke", scale: 0.62, color: RED, caption: "Rejected" },
  { shape: "circle", icon: "exclamation", mode: "stroke", scale: 0.85, color: AMBER, caption: "Warning / disputed" },
  { shape: "circle", icon: "clock", mode: "stroke", scale: 0.48, color: GRAY, caption: "Pending (clock)" },
  { shape: "circle", icon: "ellipsis", mode: "fill", scale: 0.62, color: GRAY, caption: "Pending (ellipsis)" },
];

const textKnockouts: Specimen[] = [
  { shape: "circle", text: "9+", scale: 0.62, color: RED, caption: "Unread count" },
  { shape: "circle", text: "JD", scale: 0.62, nudgeY: -0.2, color: GRAY, caption: "Initials avatar fallback" },
  { shape: "squircle", text: "PRO", scale: 0.46, nudgeY: -0.2, color: VIOLET, caption: '"PRO"' },
  { shape: "rosette", text: "NEW", scale: 0.4, nudgeY: -0.1, color: GREEN, caption: '"NEW"' },
];

const shapeGallery: Specimen[] = [
  { shape: "rosette", icon: "check", mode: "stroke", scale: 1, color: BLUE, caption: "rosette" },
  { shape: "circle", icon: "check", mode: "stroke", scale: 0.62, color: BLUE, caption: "circle" },
  { shape: "squircle", icon: "check", mode: "stroke", scale: 0.62, color: BLUE, caption: "squircle" },
  { shape: "shield", icon: "check", mode: "stroke", scale: 0.62, nudgeY: 0.3, color: BLUE, caption: "shield" },
  { shape: "hexagon", icon: "check", mode: "stroke", scale: 0.6, color: BLUE, caption: "hexagon" },
  { shape: "seal", icon: "check", mode: "stroke", scale: 0.55, color: BLUE, caption: "seal" },
  { shape: "ribbon", icon: "check", mode: "stroke", scale: 0.5, nudgeY: -1.4, color: BLUE, caption: "ribbon" },
];

const untunedPairs: { shape: LabGlyphProps["shape"]; icon: LabGlyphProps["icon"]; tunedScale: number; tunedNudgeY?: number; color: string; name: string }[] = [
  { shape: "circle", icon: "star", tunedScale: 0.52, color: AMBER, name: "circle + star" },
  { shape: "shield", icon: "check", tunedScale: 0.62, tunedNudgeY: 0.3, color: BLUE, name: "shield + check" },
  { shape: "squircle", icon: "crown", tunedScale: 0.52, tunedNudgeY: 0.4, color: VIOLET, name: "squircle + crown" },
  { shape: "circle", icon: "bot", tunedScale: 0.55, color: GRAY, name: "circle + bot" },
];

export default function GlyphLabPage() {
  return (
    <div className="w-full max-w-[860px] mx-auto px-6 py-20 sm:py-28 flex flex-col gap-14">
      <header className="flex flex-col gap-3">
        <h1 className="text-display text-foreground" style={{ fontVariationSettings: "'wght' 550" }}>
          Glyph lab
        </h1>
        <p className="text-prose text-muted-foreground max-w-[640px]">
          <code className="text-body">Glyph</code> ships one shape (a rosette)
          and one knockout (a check). Its name anticipates more: an arbitrary
          outline with an arbitrary glyph cut out of it. This page is that
          general version, built as a lab-local component (
          <code className="text-body">lab-glyph.tsx</code>) so real pairings
          can be judged before any of it becomes an API. Not a shipped
          component — nothing here is installable.
        </p>
      </header>

      <Section
        n="1"
        title="Trust and provenance"
        note="The family the shipped Glyph belongs to. Verified is the baseline for scale — everything else is judged against how close it reads to that."
      >
        <Row specimens={trust} />
      </Section>

      <Section
        n="2"
        title="Standing"
        note="Status badges that read as an achievement or a role rather than a fact about the account. Filled icons (star, bolt, crown, flame) behave differently from stroked ones — they're solid silhouettes, so they hold up as a hole even at 16px where a thin stroke starts to disappear."
      >
        <Row specimens={standing} />
      </Section>

      <Section
        n="3"
        title="State"
        note="Transient status rather than identity. Warning needed the heaviest scale of anything in this lab — an exclamation mark is almost all empty space, so it has to be blown up disproportionately to read as a mark instead of a stray dot."
      >
        <Row specimens={state} />
      </Section>

      <Section
        n="4"
        title="Text knockouts"
        note='Characters instead of a path. This is a different capability, not just another icon — the text has to be centred optically (numerals and letters sit differently against dominant-baseline "central") and set heavy enough that the strokes forming each letter survive as a hole rather than closing up.'
      >
        <Row specimens={textKnockouts} />
      </Section>

      <Section
        n="5"
        title="Shape gallery"
        note="The same check across all seven shapes, so the shape vocabulary is comparable in isolation from any glyph choice. Ribbon needed the interior pulled up and out of the tails to sit inside the medallion at all."
      >
        <Row specimens={shapeGallery} />
      </Section>

      <Section
        n="6"
        title="Untuned vs tuned"
        note="scale: 1 is what every icon path arrives at — lucide draws to fill its 24x24 box by design. Beside it, the scale this lab actually tuned to. This gap is the evidence for whether a general component is worth building: every pairing pays this cost once, by hand."
      >
        <div className="flex flex-wrap gap-x-10 gap-y-8">
          {untunedPairs.map((p) => (
            <div key={p.name} className="flex flex-col items-center gap-3">
              <div className="flex items-end gap-6">
                <div className="flex flex-col items-center gap-2">
                  <LabGlyph shape={p.shape} icon={p.icon} mode={p.icon === "check" ? "stroke" : "fill"} scale={1} color={p.color} size={BIG} />
                  <span className="text-caption text-muted-foreground">scale 1</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <LabGlyph shape={p.shape} icon={p.icon} mode={p.icon === "check" ? "stroke" : "fill"} scale={p.tunedScale} nudgeY={p.tunedNudgeY} color={p.color} size={BIG} />
                  <span className="text-caption text-muted-foreground">scale {p.tunedScale}</span>
                </div>
              </div>
              <p className="text-caption text-muted-foreground">{p.name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        n="7"
        title="On busy surfaces"
        note="The whole argument for a mask knockout over a painted icon: confirm the hole still reads as a hole once something other than a flat card sits behind it."
      >
        <div className="flex flex-wrap gap-10">
          <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-border/60">
            {/* eslint-disable-next-line @next/next/no-img-element -- lab-only, no build-time optimisation needed */}
            <img src="/portrait.png" alt="" className="w-full h-full object-cover" />
            <div className="absolute bottom-2 right-2 flex gap-1.5">
              <LabGlyph shape="rosette" icon="check" mode="stroke" scale={1} color={BLUE} size={28} />
              <LabGlyph shape="circle" icon="star" mode="fill" scale={0.52} color={AMBER} size={28} />
            </div>
          </div>
          <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-border/60 bg-[conic-gradient(from_180deg,#f97316,#ec4899,#8b5cf6,#f97316)]">
            <div className="absolute bottom-2 right-2 flex gap-1.5">
              <LabGlyph shape="squircle" icon="bolt" mode="fill" scale={0.5} color={VIOLET} size={28} />
              <LabGlyph shape="circle" text="9+" scale={0.62} color={RED} size={28} />
            </div>
          </div>
        </div>
      </Section>

      <footer className="border-t border-border/60 pt-8">
        <p className="text-caption text-muted-foreground">
          For reference, the shipped component:{" "}
          <Glyph label="Verified account" className="inline-block align-text-bottom text-[#1d9bf0]">
            <Check />
          </Glyph>
        </p>
      </footer>
    </div>
  );
}
