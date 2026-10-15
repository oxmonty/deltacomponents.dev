"use client";

import { Switch } from "@/registry/ui/switch";

export default function SwitchSizes() {
  return (
    <div className="flex items-center gap-6">
      <Switch size="sm" defaultChecked aria-label="Small" />
      <Switch defaultChecked aria-label="Default" />
      <Switch size="lg" defaultChecked aria-label="Large" />
    </div>
  );
}
