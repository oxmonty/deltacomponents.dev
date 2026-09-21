"use client";

import { Image } from "@/registry/ui/image";

export default function ImageZoom() {
  return (
    <div className="w-full max-w-[320px]">
      <Image
        src="/images/image-zoom-sample.webp"
        alt="A painting of sheep resting on an orange and green hillside among open laptops, with a figure in orange working on one under a blue sky"
        width={560}
        height={748}
      />
    </div>
  );
}
