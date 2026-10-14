import type { Metadata } from "next";
import { LabBottomNav } from "./lab-bottom-nav";

export const metadata: Metadata = {
  title: "Bottom nav lab",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto w-full max-w-lg px-4 pt-8 pb-28">{children}</main>
      <LabBottomNav />
    </>
  );
}
