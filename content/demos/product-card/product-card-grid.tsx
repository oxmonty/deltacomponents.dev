"use client";

import {
  ProductCard,
  ProductCardContent,
  ProductCardHeader,
  ProductCardImage,
  ProductCardSubtitle,
  ProductCardTitle,
} from "@/registry/ui/product-card";

/** The essay row — the images ship with the repo, and each card links out to
 *  the essay it is a screenshot of. */
const ESSAYS = [
  { title: "Buy Wisely", author: "Steph Ango", image: "/images/essays/buy-wisely.jpg", url: "https://stephango.com/buy-wisely" },
  { title: "On Becoming Competitive", author: "Ludwig", image: "/images/essays/on-becoming-competitive.jpg", url: "https://ludwigabap.bearblog.dev/on-becoming-competitive-when-joining-a-new-company/" },
  { title: "Salary Negotiations", author: "Patrick McKenzie", image: "/images/essays/salary-negotiations.jpg", url: "https://www.kalzumeus.com/2012/01/23/salary-negotiation/" },
  { title: "Solution Space & Taste", author: "Grant Slatton", image: "/images/essays/solution-space-taste.jpg", url: "https://grantslatton.com/solution-space-taste" },
  { title: "The Bear Manifesto", author: "Herman", image: "/images/essays/the-bear-manifesto.jpg", url: "https://herman.bearblog.dev/manifesto/" },
  { title: "Write Like You Talk", author: "Paul Graham", image: "/images/essays/write-like-you-talk.jpg", url: "https://paulgraham.com/talk.html" },
];

export default function ProductCardGrid() {
  return (
    <div className="grid w-full grid-cols-2 gap-5 sm:grid-cols-3">
      {ESSAYS.map((essay) => (
        <a
          key={essay.title}
          href={essay.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-2"
        >
          <ProductCard className="w-full max-w-none rounded-none">
            <ProductCardImage src={essay.image} alt={essay.title} className="rounded-none" />
            <ProductCardContent>
              <ProductCardHeader>
                <ProductCardTitle>{essay.title}</ProductCardTitle>
                <ProductCardSubtitle>by {essay.author}</ProductCardSubtitle>
              </ProductCardHeader>
            </ProductCardContent>
          </ProductCard>
        </a>
      ))}
    </div>
  );
}
