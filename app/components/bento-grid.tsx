"use client";

import { labelOf, type ComponentEntry } from "@/lib/docs/components";
import { previewMap } from "@/app/components/bento-previews";
import { BentoCard } from "@/app/components/bento-card";

interface BentoGridProps {
  components: ComponentEntry[];
}

export function BentoGrid({ components }: BentoGridProps) {
  return (
    <div className="bento-grid grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {components.map((c) => {
        const Preview = previewMap[c.slug];
        if (!Preview) return null;
        return (
          <BentoCard
            key={c.slug}
            slug={c.slug}
            name={labelOf(c)}
            isNew={c.isNew}
            gridSize={c.gridSize}
          >
            <Preview />
          </BentoCard>
        );
      })}
    </div>
  );
}
