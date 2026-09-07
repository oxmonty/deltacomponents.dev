"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/ui/tabs";

const PANELS = [
  { value: "account", copy: "Manage your account settings." },
  { value: "password", copy: "Change your password here." },
  { value: "settings", copy: "Configure your preferences." },
] as const;

const LABELS: Record<string, string> = {
  account: "Account",
  password: "Password",
  settings: "Settings",
};

export default function TabsSizes() {
  const [size, setSize] = useState<"sm" | "default" | "lg">("lg");

  return (
    <div className="flex w-fit max-w-full flex-col items-start gap-5">
      <Tabs defaultValue="account" size={size}>
        <TabsList>
          {PANELS.map((panel) => (
            <TabsTrigger key={panel.value} value={panel.value}>
              {LABELS[panel.value]}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="relative min-h-[24px]">
          {PANELS.map((panel) => (
            <TabsContent
              key={panel.value}
              value={panel.value}
              className="absolute inset-x-0 top-0"
            >
              <p className="text-caption text-muted-foreground">{panel.copy}</p>
            </TabsContent>
          ))}
        </div>
      </Tabs>

      {/* A bare <select>, not the library's — the point of this demo is the
          tabs reacting to `size`, and a native control keeps the surrounding
          chrome out of the way. */}
      <label className="text-caption text-muted-foreground flex items-center gap-2">
        Size
        <select
          value={size}
          onChange={(e) => setSize(e.target.value as "sm" | "default" | "lg")}
          className="border-border bg-background text-foreground text-caption rounded-md border px-2 py-1 outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
        >
          <option value="sm">sm</option>
          <option value="default">default</option>
          <option value="lg">lg</option>
        </select>
      </label>
    </div>
  );
}
