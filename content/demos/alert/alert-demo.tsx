"use client";

import { Alert } from "@/registry/ui/alert";

export default function AlertDemo() {
  return (
    <Alert type="warning" title="Write-only" className="w-full max-w-md">
      Secrets can be replaced but never read back. Copy the value somewhere
      safe before you save it.
    </Alert>
  );
}
