import type { Metadata } from "next";
import { BenchoCard } from "./bencho-card";

export const metadata: Metadata = {
  title: "Bencho card preview",
  robots: { index: false, follow: false },
};

// bencho's wall: three flex columns, 12px gaps, each card a fixed height so
// the columns stagger like a masonry. Heights are theirs, verbatim.
const BARS = 36;
const FILLED = 18;

function WakeSlider() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-[5px]">
        {Array.from({ length: BARS }, (_, i) => (
          <span
            key={i}
            className={i < FILLED ? "h-5 w-[3px] rounded-full bg-[#17181a] dark:bg-[rgb(242,241,238)]" : "h-5 w-[3px] rounded-full bg-[#17181a]/22 dark:bg-white/25"}
          />
        ))}
      </div>
      <span className="text-[14px] tabular-nums text-[#5c5b56] dark:text-white/60">50</span>
    </div>
  );
}

function Product({ src, alt, size = 240 }: { src: string; alt: string; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element -- a stand-in for bencho's scaled demo stage
  return <img src={src} alt={alt} width={size} height={size} className="object-contain" style={{ width: size, height: size }} draggable={false} />;
}

export default function BenchoCardPreview() {
  return (
    <main className="mx-auto w-full max-w-[1472px] px-5 py-10">
      <p className="mb-6 text-sm text-muted-foreground">
        A reproduction of the bencho.dev landing-page card. Hover a card to reveal the save, play and edit controls and the name pill.
      </p>
      <div className="flex flex-col items-start gap-3 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-3">
          <BenchoCard name="Twemco clock" tag="New" height={411} href="/docs/product-card">
            <Product src="/images/products/twemco-clock.png" alt="Twemco flip clock" />
          </BenchoCard>
          <BenchoCard name="Wake slider" height={300}>
            <WakeSlider />
          </BenchoCard>
        </div>
        <div className="flex w-full min-w-0 flex-1 flex-col gap-3">
          <BenchoCard name="Analogue Pocket" tag="New" height={401} href="/docs/product-card">
            <Product src="/images/products/analogue-pocket.webp" alt="Analogue Pocket handheld" />
          </BenchoCard>
          <BenchoCard name="World at War" height={404} href="/docs/product-card">
            <Product src="/images/products/call-of-duty-world-at-war.webp" alt="Call of Duty: World at War box" size={260} />
          </BenchoCard>
        </div>
        <div className="flex w-full min-w-0 flex-1 flex-col gap-3">
          <BenchoCard name="Hitmontop" tag="Sponsored" height={460} href="/docs/product-card">
            <Product src="/images/products/hitmontop-still.png" alt="Hitmontop" size={220} />
          </BenchoCard>
          <BenchoCard name="Counter" height={334}>
            <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-[#17181a] shadow-[0_1px_2px_rgba(23,24,26,.06),0_8px_24px_rgba(23,24,26,.06)] dark:bg-[#1c1d20] dark:text-white">
              <span className="grid size-10 place-items-center rounded-xl bg-[#17181a]/6 text-lg dark:bg-white/10">−</span>
              <span className="w-16 text-center text-[28px] font-medium tabular-nums">00</span>
              <span className="grid size-10 place-items-center rounded-xl bg-[#17181a]/6 text-lg dark:bg-white/10">+</span>
            </div>
          </BenchoCard>
        </div>
      </div>
    </main>
  );
}
