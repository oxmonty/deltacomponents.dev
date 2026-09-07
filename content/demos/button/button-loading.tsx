"use client";

import { useState } from "react";
import { useIcon } from "@/registry/default/lib/icon-context";
import { Button } from "@/registry/base/button";

export default function ButtonLoading() {
  const Loader = useIcon("loader");
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        loading={loading}
        onClick={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 2000);
        }}
      >
        {loading ? "Loading" : "Click me"}
      </Button>
      <Button variant="secondary" loading leadingIcon={Loader}>
        Saving
      </Button>
      <Button disabled>Disabled</Button>
    </div>
  );
}
