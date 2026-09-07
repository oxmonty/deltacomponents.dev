"use client";

import { LockIcon, SettingsIcon, UserIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/ui/tabs";

const PANELS = [
  { value: "account", copy: "Manage your account settings." },
  { value: "password", copy: "Change your password here." },
  { value: "settings", copy: "Configure your preferences." },
] as const;

export default function TabsWithIcons() {
  return (
    <Tabs defaultValue="account" className="w-fit max-w-full">
      <TabsList>
        <TabsTrigger value="account" icon={<UserIcon />}>
          Account
        </TabsTrigger>
        <TabsTrigger value="password" icon={<LockIcon />}>
          Password
        </TabsTrigger>
        <TabsTrigger value="settings" icon={<SettingsIcon />}>
          Settings
        </TabsTrigger>
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
  );
}
