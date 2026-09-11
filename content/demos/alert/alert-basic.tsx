"use client";

import { Alert } from "@/registry/ui/alert";

export default function AlertBasic() {
  return (
    <Alert title="Flags live in Environment Variables" className="w-full max-w-md">
      Any variable prefixed with FLAG_ is read as a feature flag.
    </Alert>
  );
}
