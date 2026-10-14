"use client";

import { Switch } from "@/registry/ui/switch";

export default function SwitchDemo() {
  return (
    <label className="flex items-center gap-3 text-sm">
      <Switch defaultChecked />
      Airplane mode
    </label>
  );
}
