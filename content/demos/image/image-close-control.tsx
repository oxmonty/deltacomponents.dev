"use client";

import { X } from "lucide-react";
import { Button } from "@/registry/ui/button";
import { Image, ImageClose } from "@/registry/ui/image";

export default function ImageCloseControl() {
  return (
    <div className="w-full max-w-[560px]">
      <Image
        src="/images/editor-embed-sample.webp"
        alt="A painted battle scene of knights on horseback in red, green and yellow"
        width={1200}
        height={672}
        caption="Enlarge it: the close button sits in the top right corner of the screen."
      >
        <ImageClose>
          <Button variant="secondary" size="icon-xl" aria-label="Close">
            <X />
          </Button>
        </ImageClose>
      </Image>
    </div>
  );
}
