"use client";

import { Tooltip } from "@/registry/ui/tooltip";
import { Button } from "@/registry/ui/button";

export default function TooltipBasic() {
  return (
    <Tooltip content="Save your changes">
      <Button>Hover me</Button>
    </Tooltip>
  );
}
