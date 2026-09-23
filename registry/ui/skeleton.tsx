// shadcn's own Skeleton, vendored verbatim so `@/registry/ui/skeleton`
// resolves in this repo. It is not published — a consumer gets it from
// shadcn's registry through `registryDependencies`, and
// `scripts/registry-paths.ts` rewrites this import to their `components/ui/skeleton`.
import * as React from "react"

import { cn } from "@/registry/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
