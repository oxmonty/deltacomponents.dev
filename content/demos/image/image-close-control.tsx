"use client";

import { X } from "lucide-react";
import { Button } from "@/registry/ui/button";
import { Image, ImageClose } from "@/registry/ui/image";

export default function ImageCloseControl() {
  return (
    <div className="w-full max-w-[320px]">
      <Image
        src="/images/image-zoom-sample.webp"
        alt="A painting of sheep resting on an orange and green hillside among open laptops, with a figure in orange working on one under a blue sky"
        width={560}
        height={748}
        caption="Enlarge it: only the button in the top right corner, or Escape, closes it."
        dismissible={false}
      >
        <ImageClose>
          {/* icon-xl is the 48px touch target; a mouse doesn't need it, so
              a fine pointer steps the button and its glyph down one size. */}
          <Button
            variant="secondary"
            size="icon-xl"
            aria-label="Close"
            className="pointer-fine:size-[var(--control-icon-box-lg,40px)] pointer-fine:[&_svg]:size-[var(--control-icon-glyph,16px)]"
          >
            <X />
          </Button>
        </ImageClose>
      </Image>
    </div>
  );
}
