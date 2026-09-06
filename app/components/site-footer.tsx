import { AuthorCredit } from "@/app/components/author-credit";

/**
 * Page footer, below xl only.
 *
 * The properties panel carries the author credit on desktop, and that panel
 * does not render under 1280px — so on a phone the credit had nowhere to live.
 * This puts it back, centred under whatever page the reader is on.
 */
export function SiteFooter() {
  return (
    // Deep bottom padding, plus the safe-area inset: scrolled to the end of a
    // page, mobile browser chrome (Safari's bottom bar, Chrome's toolbar) sits
    // over the last ~50px, and a shallower footer parks the credit underneath
    // it where nobody sees it.
    <footer className="flex justify-center px-6 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] xl:hidden">
      <AuthorCredit />
    </footer>
  );
}
