"use client";

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

function Panels() {
  return (
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
  );
}

function Triggers() {
  return (
    <TabsList>
      {PANELS.map((panel) => (
        <TabsTrigger key={panel.value} value={panel.value}>
          {LABELS[panel.value]}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

export default function TabsSizes() {
  return (
    <div className="flex w-fit max-w-full flex-col items-start gap-7">
      {(["sm", "default", "lg"] as const).map((size) => (
        <Tabs key={size} defaultValue="account" size={size}>
          <Triggers />
          <Panels />
        </Tabs>
      ))}
    </div>
  );
}
