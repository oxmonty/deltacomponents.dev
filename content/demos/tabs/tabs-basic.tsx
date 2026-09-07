"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/default/tabs";

export default function TabsBasic() {
  return (
    <Tabs defaultValue="account" className="w-fit max-w-full">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p className="text-caption text-muted-foreground">
          Manage your account settings.
        </p>
      </TabsContent>
      <TabsContent value="password">
        <p className="text-caption text-muted-foreground">
          Change your password here.
        </p>
      </TabsContent>
    </Tabs>
  );
}
