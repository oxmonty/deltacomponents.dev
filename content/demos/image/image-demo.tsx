"use client";

import { Image } from "@/registry/ui/image";

export default function ImageDemo() {
  return (
    <div className="w-full max-w-[560px]">
      <Image
        src="/images/editor-embed-sample.webp"
        alt="A painted battle scene of knights on horseback in red, green and yellow"
        width={1200}
        height={672}
        caption="Click or tap to enlarge"
      />
    </div>
  );
}
