"use client";

import { Image, ImageCaption } from "@/registry/ui/image";

export default function ImageCaptionDemo() {
  return (
    <div className="w-full max-w-[560px]">
      <Image
        src="/images/editor-embed-sample.webp"
        alt="A painted battle scene of knights on horseback in red, green and yellow"
        width={1200}
        height={672}
      >
        <ImageCaption className="text-left">
          The Battle of Crécy, from a fifteenth-century manuscript.{" "}
          <a href="https://en.wikipedia.org/wiki/Battle_of_Cr%C3%A9cy" className="underline underline-offset-2">
            Wikipedia
          </a>
        </ImageCaption>
      </Image>
    </div>
  );
}
