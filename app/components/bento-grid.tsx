"use client";

import { labelOf, type ComponentEntry } from "@/lib/docs/components";
import { previewMap } from "@/app/components/bento-previews";
import { BentoCard } from "@/app/components/bento-card";

interface BentoGridProps {
  components: ComponentEntry[];
}

// Hand-packed for the three-column grid. Only Button and Tooltip are one
// column wide, so they flank Code and every two-column card below leaves the
// third column open:
//   [ code  ][button ]
//   [ code  ][tooltip]
//   [ product ][ ]  ×2
//   [ tabs    ][ ]
//   [ editor  ][ ]  ×2
//   [ alert   ][ ]
// The sidebar keeps componentList's reading order; slugs missing here follow
// in that order, and dense flow drops a one-column card into the first gap.
const SHOWCASE_ORDER = ["code", "button", "tooltip", "product-card", "tabs", "editor", "alert"];

function showcaseRank(slug: string) {
  const i = SHOWCASE_ORDER.indexOf(slug);
  return i === -1 ? SHOWCASE_ORDER.length : i;
}

export function BentoGrid({ components }: BentoGridProps) {
  const ordered = [...components].sort((a, b) => showcaseRank(a.slug) - showcaseRank(b.slug));
  return (
    <div className="bento-grid grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {ordered.map((c) => {
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
