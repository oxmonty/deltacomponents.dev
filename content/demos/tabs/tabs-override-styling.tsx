"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/ui/tabs";

export default function TabsOverrideStyling() {
  return (
    // `data-radius` scopes the shape system to this subtree. The list takes
    // the container radius and the triggers the element radius, so the corners
    // stay nested without either being written out here.
    <div data-radius="pill" className="w-full max-w-[380px]">
      <Tabs defaultValue="monthly" concentric>
        {/* The list's height and type size are the only ones in the strip —
            the triggers stretch to the first and inherit the second. */}
        <TabsList className="h-11 w-full p-1 text-sm">
          <TabsTrigger value="monthly" className="flex-1">
            Monthly
          </TabsTrigger>
          <TabsTrigger value="yearly" className="flex-1">
            Yearly
          </TabsTrigger>
        </TabsList>
        <TabsContent value="monthly" className="text-muted-foreground text-sm">
          $12 per user, billed monthly.
        </TabsContent>
        <TabsContent value="yearly" className="text-muted-foreground text-sm">
          $9 per user, billed annually. Two months free.
        </TabsContent>
      </Tabs>
    </div>
  );
}
