"use client";

import { Alert } from "@/registry/ui/alert";

const TYPES = ["note", "tip", "info", "warning", "danger", "success", "caution"] as const;

export default function AlertTypes() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      {TYPES.map((type) => (
        <Alert key={type} type={type} title={type[0].toUpperCase() + type.slice(1)}>
          The fill carries the severity on its own.
        </Alert>
      ))}
    </div>
  );
}
