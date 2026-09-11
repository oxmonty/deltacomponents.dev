"use client";

import { Alert } from "@/registry/ui/alert";

export default function AlertDemo() {
  return (
    <Alert type="warning" className="w-full max-w-md">
      Alerts need minimal styling. They just need to stand out!
    </Alert>
  );
}
