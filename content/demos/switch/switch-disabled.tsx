"use client";

import { Switch } from "@/registry/ui/switch";

export default function SwitchDisabled() {
  return (
    <div className="flex items-center gap-6">
      <label className="flex items-center gap-3 text-sm">
        <Switch disabled />
        Off
      </label>
      <label className="flex items-center gap-3 text-sm">
        <Switch disabled defaultChecked />
        On
      </label>
    </div>
  );
}
