"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/registry/ui/button";
import { Tooltip } from "@/registry/ui/tooltip";
import GlyphBasic from "@/content/demos/glyph/glyph-basic";
import AlertDemo from "@/content/demos/alert/alert-demo";
import { LinkPreview } from "@/registry/ui/embed";
import { Image } from "@/registry/ui/image";
import { BottomNav, BottomNavItem } from "@/registry/ui/bottom-nav";
import { useIcon } from "@/registry/lib/icon-context";
import { PhoneFrame } from "@/lib/docs/phone-frame";
import { Switch } from "@/registry/ui/switch";
import { PATRICK_DARK } from "@/lib/docs/code-themes";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/ui/tabs";
import {
  ProductCard,
  ProductCardContent,
  ProductCardHeader,
  ProductCardImage,
  ProductCardMetric,
  ProductCardSubtitle,
  ProductCardTitle,
} from "@/registry/ui/product-card";
import { BUTTON_ITEMS, TOOLTIP_COPY, TABS_ITEMS } from "@/app/components/demo-data";

// A seeded document rather than an empty editor: the card has to show what
// the component does in one glance, and an empty editor shows a placeholder.
// One of each construct — heading, inline marks, a bullet glyph, a checked
// task — because the concealment is the point and you only see it happen
// against syntax that ISN'T there.
const EDITOR_DOC = `# Field notes

Click or touch here to begin editing — markdown syntax appears only where you're typing.

- Bullets, [links](https://www.deltacomponents.dev) and \`code\`

- [x] Conceal the marks away from the caret
- [ ] Swap the typography set
`;

// Client-only, loaded after hydration: Prism and CodeMirror are the two
// heaviest things on the showcase and both cards sit below the fold on a
// phone. Each placeholder holds the mounted size so nothing shifts when the
// chunk lands — the Code one is the block's measured height at the default
// size, the Editor one is the same text the component itself shows until
// CodeMirror takes over.
// ponytail: the Code placeholder is a fixed height; measure again if the
// snippet or its typography changes.
//
// Each chunk resolves into focus as it lands — from faint and soft to sharp
// and solid, the motion guidelines' own idiom (`starting:` + a tier; slow,
// as these are the two largest surfaces on the page), on a wrapper that
// mounts WITH the chunk so the starting style fires then, not at page load.
// The Editor's placeholder is the same text, but the swap still shows: the
// `#` and `- [x]` marks conceal and the heading takes its size, and eased
// that reads as the editor arriving rather than the text blinking.
function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <div className="starting:opacity-0 starting:blur-[6px] transition-[opacity,filter] duration-(--motion-slow) ease-spring">
      {children}
    </div>
  );
}
function revealed<P extends object>(Component: React.ComponentType<P>) {
  return function Revealed(props: P) {
    return (
      <Reveal>
        <Component {...props} />
      </Reveal>
    );
  };
}
const Code = dynamic(() => import("@/registry/ui/code").then((m) => revealed(m.Code)), {
  ssr: false,
  loading: () => <div aria-hidden className="h-[302px] w-full max-md:h-full" />,
});
const Editor = dynamic(() => import("@/registry/ui/editor").then((m) => revealed(m.Editor)), {
  ssr: false,
  loading: () => (
    <div aria-hidden className="text-base leading-7 whitespace-pre-wrap">
      {EDITOR_DOC}
    </div>
  ),
});

function ButtonPreview() {
  return (
    // justify-center, not just the stage's centring: the row wraps on a phone
    // and a wrapped line is laid out from the start edge, so the second row of
    // buttons sat left of the first.
    <div className="flex flex-wrap items-center justify-center gap-2">
      {BUTTON_ITEMS.map((item) => (
        <Button key={item.label} variant={item.variant}>
          {item.label}
        </Button>
      ))}
    </div>
  );
}


function TooltipPreview() {
  return (
    <div className="relative z-10">
      <Tooltip content={TOOLTIP_COPY.content}>
        <Button variant="secondary">{TOOLTIP_COPY.trigger}</Button>
      </Tooltip>
    </div>
  );
}

function CodePreview() {
  return (
    // Narrower than the stage on purpose: edge-to-edge the block reads as
    // cropped rather than as a card sitting on a surface. Fixed height
    // below md, where the card takes its height from its content: the block
    // lands after hydration, and Safari measures its lines a few px off
    // Chrome, so the box it lands in must not depend on it. From md the
    // grid's 300px rows already pin the card.
    <div className="w-full max-w-[440px] max-md:h-[302px]">
      <Code
        filename="tally.rs"
        language="rust"
        theme={PATRICK_DARK}
        showLineNumbers={false}
        className="text-caption"
        code={`use std::collections::HashMap;

/// Counts how many times each word appears.
pub fn tally(text: &str) -> HashMap<&str, usize> {
    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word).or_insert(0) += 1;
    }
    counts
}`}
      />
    </div>
  );
}

function ProductCardPreview() {
  return (
    <ProductCard size="lg">
      <ProductCardImage src="/images/products/analogue-pocket.webp" alt="Analogue Pocket" />
      <ProductCardContent>
        <ProductCardHeader>
          <ProductCardTitle>Analogue Pocket</ProductCardTitle>
          <ProductCardSubtitle>Gaming Console</ProductCardSubtitle>
        </ProductCardHeader>
        <ProductCardMetric>$219</ProductCardMetric>
      </ProductCardContent>
    </ProductCard>
  );
}

function TabsPreview() {
  return (
    // Same shape as the demos on the docs page: a `w-fit` block whose strip and
    // copy share a left edge, centred as one unit by the card's stage. The
    // large step, so the strip reads at a glance from the grid. Needs the
    // two-column card — in one column the stage is narrower than the strip,
    // and a `w-fit` block that cannot shrink pins left instead.
    <Tabs defaultValue="account" size="lg" className="w-fit max-w-full">
      <TabsList>
        {TABS_ITEMS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {/* The panels differ only in one line, so the stage is pinned to a
          single row's height and they swap in the same spot rather than
          resizing the card as the reader clicks through. */}
      <div className="relative min-h-[24px]">
        {TABS_ITEMS.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="absolute inset-x-0 top-0"
          >
            <p className="text-caption text-muted-foreground">{tab.copy}</p>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}


function BottomNavPreview() {
  const [value, setValue] = useState("home");
  const HomeIcon = useIcon("home");
  const SearchIcon = useIcon("search");
  const InboxIcon = useIcon("inbox");
  const UserIcon = useIcon("user");
  return (
    // The same phone as the doc page's demos, with the top cut off by the
    // card: a 300px row cannot hold a 656px phone, and the bar is the point.
    // The window sits on the stage's bottom edge (over its padding) and clips
    // the frame from the top; grey cards instead of the demos' photos, so
    // the showcase stays quiet.
    <div className="-mb-12 flex h-60 w-full items-end justify-center self-end overflow-hidden">
      <PhoneFrame>
        <div className="px-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} aria-hidden className="mt-3 aspect-4/3 w-full rounded-xl bg-muted" />
          ))}
        </div>
        <BottomNav value={value} onValueChange={setValue}>
        <BottomNavItem value="home" icon={<HomeIcon />}>
          Home
        </BottomNavItem>
        <BottomNavItem value="search" icon={<SearchIcon />}>
          Search
        </BottomNavItem>
        <BottomNavItem value="inbox" icon={<InboxIcon />}>
          Inbox
        </BottomNavItem>
        <BottomNavItem value="profile" icon={<UserIcon />}>
          Profile
        </BottomNavItem>
        </BottomNav>
      </PhoneFrame>
    </div>
  );
}

function SwitchPreview() {
  return (
    // Three rows, two on: enough to click one and watch the bounce, and to
    // see both states side by side.
    <div className="flex flex-col gap-3">
      {[
        ["Airplane mode", true],
        ["Wi-Fi", true],
        ["Bluetooth", false],
      ].map(([label, on]) => (
        <label key={String(label)} className="flex items-center gap-3 text-sm">
          {/* transitions.dev's own blue, so the card shows the on-colour is
              one class away from the default `primary` track. */}
          <Switch
            defaultChecked={Boolean(on)}
            className="data-[checked]:bg-[rgba(0,60,255,0.8)] data-[checked]:hover:bg-[rgba(0,60,255,0.9)] dark:data-[checked]:bg-[rgba(0,60,255,0.8)] dark:data-[checked]:hover:bg-[rgba(0,60,255,0.9)]"
          />
          {label}
        </label>
      ))}
    </div>
  );
}

function EmbedPreview() {
  // LinkPreview, not a YouTube or Spotify part: the showcase loads a lot of
  // cards at once. The metadata is passed in so the card never asks the
  // preview route for it, and the tile is too narrow for the image to sit
  // beside the text, so it stays stacked at every width.
  return (
    <div className="w-full max-w-[280px]">
      <LinkPreview
        url="https://patrickprunty.com"
        title="Patrick Prunty"
        description="Software engineer and writer"
        image="https://www.patrickprunty.com/images/og.png"
        className="sm:flex-col [&_img]:sm:w-full"
      />
    </div>
  );
}

function ImagePreview() {
  return (
    <div className="w-full max-w-[340px]">
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

function EditorPreview() {
  return (
    // text-base, not text-sm: an editable field under 16px makes iOS zoom the
    // page the moment it takes focus, and the showcase card is the first one
    // a phone meets.
    <div className="w-full max-w-[460px]">
      <Editor defaultValue={EDITOR_DOC} className="min-h-0 text-base" />
    </div>
  );
}

export const previewMap: Record<string, React.FC> = {
  tabs: TabsPreview,
  "product-card": ProductCardPreview,
  "code": CodePreview,
  button: ButtonPreview,
  tooltip: TooltipPreview,
  "glyph": GlyphBasic,
  "bottom-nav": BottomNavPreview,
  switch: SwitchPreview,
  alert: AlertDemo,
  embed: EmbedPreview,
  editor: EditorPreview,
  image: ImagePreview,
};
