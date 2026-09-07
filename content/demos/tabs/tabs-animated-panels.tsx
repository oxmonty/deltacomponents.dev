"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/default/tabs";

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

export default function TabsAnimatedPanels() {
  return (
    <Tabs defaultValue="account" variant="underline" className="w-fit max-w-full">
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
            fadeIn
          >
            <p className="text-caption text-muted-foreground">{panel.copy}</p>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
