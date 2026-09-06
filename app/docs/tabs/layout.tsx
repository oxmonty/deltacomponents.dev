import type { Metadata } from "next";

import { componentMetadata } from "@/lib/metadata";

export const metadata: Metadata = componentMetadata("tabs");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
