"use client";

import { useState } from "react";

import { Switch } from "@/registry/ui/switch";

export default function SwitchControlled() {
  const [on, setOn] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Switch checked={on} onCheckedChange={setOn} />
      <p className="text-sm text-muted-foreground">
        Notifications are {on ? "on" : "off"}
      </p>
    </div>
  );
}
