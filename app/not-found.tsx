import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/registry/ui/button";
import { fontWeights } from "@/registry/lib/font-weight";

// No `createMetadata` here: it stamps a canonical URL, and there is no real
// URL for a 404 to point at. Title and noindex are all this page wants.
export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

// Renders inside the root layout (this route has no parent segment of its
// own), so it gets the sidebar chrome for free — same reading column as
// every docs page, no DocHeader: there is no prev/next pair or copy-page
// route for a 404 to point at.
export default function NotFound() {
  return (
    <div className="w-full max-w-[680px] mx-auto py-20 sm:py-28 px-6 flex flex-col gap-2">
      <h1
        className="text-display text-foreground leading-none"
        style={{ fontVariationSettings: fontWeights.bold }}
      >
        Page not found
      </h1>
      <p className="text-prose text-muted-foreground text-pretty">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <Link href="/" className="outline-none" tabIndex={-1}>
          <Button variant="primary" size="sm">
            Back home
          </Button>
        </Link>
      </div>
    </div>
  );
}
