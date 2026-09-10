import type { Metadata } from "next";

import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Contributing",
  description: "Contributions are welcome, within a narrow scope",
  path: "/docs/contributing",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
