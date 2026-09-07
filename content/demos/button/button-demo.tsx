"use client";

import { useIcon } from "@/registry/lib/icon-context";
import { Button } from "@/registry/ui/button";

export default function ButtonDemo() {
  const Plus = useIcon("plus");
  const ArrowRight = useIcon("arrow-right");
  const Search = useIcon("search");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button leadingIcon={Plus}>Create</Button>
      <Button variant="secondary" trailingIcon={ArrowRight}>Next</Button>
      <Button variant="tertiary" leadingIcon={Search} trailingIcon={ArrowRight}>
        Search
      </Button>
    </div>
  );
}
