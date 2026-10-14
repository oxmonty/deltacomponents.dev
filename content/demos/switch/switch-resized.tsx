"use client";

import type { CSSProperties } from "react";

import { Switch } from "@/registry/ui/switch";

export default function SwitchResized() {
  return (
    <div className="flex items-center gap-6">
      <Switch
        defaultChecked
        aria-label="Compact"
        style={
          {
            "--switch-w": "28px",
            "--switch-h": "14px",
            "--switch-pad": "2.33px",
            "--switch-thumb-w": "14px",
            "--switch-thumb-h": "9.33px",
            "--switch-press": "3px",
          } as CSSProperties
        }
      />
      <Switch defaultChecked aria-label="Default" />
      <Switch
        defaultChecked
        aria-label="Large"
        style={
          {
            "--switch-w": "56px",
            "--switch-h": "28px",
            "--switch-pad": "4.67px",
            "--switch-thumb-w": "28px",
            "--switch-thumb-h": "18.67px",
          } as CSSProperties
        }
      />
    </div>
  );
}
