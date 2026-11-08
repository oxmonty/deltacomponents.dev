"use client";

import { useState } from "react";
import { Bookmark, Minus, Play, Plus, SlidersHorizontal } from "lucide-react";
import {
  ProductCard,
  ProductCardImage,
  ProductCardOverlay,
} from "@/registry/ui/product-card";

// A 38px elevated round action, bencho.dev's: it settles to 95% on hover and
// 90% on press on an overshooting curve.
const roundAction =
  "grid size-[38px] cursor-pointer place-items-center rounded-full bg-white/94 text-[#5c5b56] " +
  "[transition:scale_.24s_cubic-bezier(.28,1.3,.36,1),background-color_.2s,color_.16s] " +
  "hover:scale-95 hover:bg-white hover:text-[#17181a] active:scale-90 " +
  "dark:bg-[color-mix(in_srgb,rgb(242_241_238)_14%,var(--background))] dark:text-white/78 " +
  "dark:hover:bg-[color-mix(in_srgb,rgb(242_241_238)_20%,var(--background))] dark:hover:text-white";

const stepper =
  "grid size-10 cursor-pointer place-items-center rounded-xl bg-[#17181a]/6 text-lg " +
  "transition-colors hover:bg-[#17181a]/10 dark:bg-white/10 dark:hover:bg-white/15";

export default function ProductCardOverlays() {
  const [count, setCount] = useState(0);
  const [saved, setSaved] = useState(false);

  return (
    <ProductCard size="lg" animated={false} className="max-w-[443px] rounded-[28px] text-[13px]">
      {/* No `src`: the well is a stage, here for a live counter. */}
      <ProductCardImage className="grid aspect-auto h-[334px] place-items-center rounded-[28px]">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-[#17181a] shadow-[0_1px_2px_rgba(23,24,26,.06),0_8px_24px_rgba(23,24,26,.06)] dark:bg-[#1c1d20] dark:text-white">
          <button type="button" aria-label="Decrease" className={stepper} onClick={() => setCount((c) => c - 1)}>
            <Minus className="size-4" />
          </button>
          <output className="w-16 text-center text-[28px] font-medium tabular-nums">
            {String(count).padStart(2, "0")}
          </output>
          <button type="button" aria-label="Increase" className={stepper} onClick={() => setCount((c) => c + 1)}>
            <Plus className="size-4" />
          </button>
        </div>

        <ProductCardOverlay position="top-left" className="m-4">
          <span className="inline-flex h-6 items-center rounded-full bg-white px-2.5 text-[11px] leading-none font-medium tracking-[0.01em] text-[#17181a] dark:bg-white/14 dark:text-white">
            New
          </span>
        </ProductCardOverlay>

        {/* `data-on` keeps a saved bookmark on screen after the pointer leaves. */}
        <ProductCardOverlay position="top-right" reveal="hover" className="m-2.5" data-on={saved || undefined}>
          <button
            type="button"
            aria-label="Save"
            aria-pressed={saved}
            onClick={() => setSaved((s) => !s)}
            className={
              "relative grid size-9 cursor-pointer place-items-center rounded-full text-[#5c5b56] " +
              "[transition:color_.16s] hover:text-[#17181a] aria-pressed:text-[#17181a] " +
              "dark:text-[rgba(242,241,238,.5)] dark:hover:text-[rgb(242,241,238)] dark:aria-pressed:text-[rgb(242,241,238)] " +
              "before:absolute before:inset-0 before:scale-[.86] before:rounded-full before:bg-[rgba(23,24,26,.08)] before:opacity-0 before:content-[''] " +
              "before:[transition:opacity_.15s,scale_.26s_cubic-bezier(.3,1.12,.4,1)] dark:before:bg-white/10 " +
              "hover:before:scale-100 hover:before:opacity-100 " +
              "[&>svg]:relative [&>svg]:[transition:scale_.26s_cubic-bezier(.3,1.12,.4,1)] hover:[&>svg]:scale-[1.04] active:[&>svg]:scale-[.96]"
            }
          >
            <Bookmark className="size-[18px]" fill={saved ? "currentColor" : "none"} />
          </button>
        </ProductCardOverlay>

        <ProductCardOverlay position="bottom-left" reveal="hover" className="m-3.5" aria-hidden>
          <span className="block h-[38px] rounded-full bg-white/94 px-3.5 text-[12.5px] leading-[38px] tracking-[-0.01em] text-[#3c3b37] dark:bg-[color-mix(in_srgb,rgb(242_241_238)_14%,var(--background))] dark:text-white/78">
            Counter
          </span>
        </ProductCardOverlay>

        <ProductCardOverlay position="bottom-right" reveal="hover" className="m-3.5 flex gap-2">
          <button type="button" aria-label="Show me how" className={roundAction}>
            <Play className="size-[15px]" />
          </button>
          <button type="button" aria-label="Edit" className={roundAction}>
            <SlidersHorizontal className="size-[18px]" />
          </button>
        </ProductCardOverlay>
      </ProductCardImage>
    </ProductCard>
  );
}
