import type { Metadata } from "next";

import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Introduction",
  description: "What Delta Components is, and how to install it.",
  path: "/docs",
});

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-20 sm:py-28 w-full max-w-[680px] mx-auto">
      {children}
    </div>
  );
}
