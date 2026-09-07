"use client";

import { Tooltip } from "@/registry/base/tooltip";
import { Button } from "@/registry/base/button";

export default function TooltipBasic() {
  return (
    <Tooltip content="Save your changes">
      <Button>Hover me</Button>
    </Tooltip>
  );
}
