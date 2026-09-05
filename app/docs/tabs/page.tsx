"use client";

import { LockIcon, SettingsIcon, UserIcon } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/default/tabs";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

const PANELS = [
  { value: "account", copy: "Manage your account settings." },
  { value: "password", copy: "Change your password here." },
  { value: "settings", copy: "Configure your preferences." },
] as const;

const LABELS: Record<string, string> = {
  account: "Account",
  password: "Password",
  settings: "Settings",
};

/** Every demo on this page switches between three one-line panels. Pinning the
 *  stage to one row's height and stacking the panels in it keeps the source
 *  under each demo about the tabs rather than about the layout, and stops the
 *  preview frame resizing as the reader clicks through. */
function Panels({ animate = false }: { animate?: boolean }) {
  return (
    <div className="relative min-h-[24px]">
      {PANELS.map((panel) => (
        <TabsContent
          key={panel.value}
          value={panel.value}
          className="absolute inset-x-0 top-0"
          animate={animate}
        >
          <p className="text-caption text-muted-foreground">{panel.copy}</p>
        </TabsContent>
      ))}
    </div>
  );
}

/** Each demo is a `w-fit` block, so the strip sizes to its own triggers and the
 *  preview frame's `justify-center` centres the whole unit. Inside it, the
 *  triggers and the copy below them share a left edge — centring the triggers
 *  within a full-width underline bar reads as a mistake, and copy centred under
 *  a left-packed strip reads as a second mistake. */
function Triggers() {
  return (
    <TabsList>
      {PANELS.map((panel) => (
        <TabsTrigger key={panel.value} value={panel.value}>
          {LABELS[panel.value]}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

const basicCode = `import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components";

<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">Manage your account settings.</TabsContent>
  <TabsContent value="password">Change your password here.</TabsContent>
</Tabs>`;

const underlineCode = `// An underline indicator instead of a filled pill, plus a hover wash that
// slides ahead of the click. Reads as navigation rather than as a control.
<Tabs defaultValue="account" variant="underline">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  …
</Tabs>`;

const ghostCode = `// Same indicator, no tray behind it — for a tab strip that sits on a
// surface which already has its own ground.
<Tabs defaultValue="account" variant="ghost">
  …
</Tabs>`;

const concentricCode = `// Nested radii: the list takes the shape system's container radius, the
// triggers its element radius. They differ by exactly the list's 4px padding
// in both Rounded and Pill, so the corners stay concentric whichever the
// reader picks in the properties panel.
<Tabs defaultValue="account" concentric>
  …
</Tabs>`;

const sizesCode = `// sm / default / lg. The size drives the list height, the trigger padding,
// and the underline's thickness together.
<Tabs defaultValue="account" size="sm">…</Tabs>
<Tabs defaultValue="account" size="default">…</Tabs>
<Tabs defaultValue="account" size="lg">…</Tabs>`;

const iconsCode = `<TabsList>
  <TabsTrigger value="account" icon={<UserIcon />}>Account</TabsTrigger>
  <TabsTrigger value="password" icon={<LockIcon />}>Password</TabsTrigger>
  <TabsTrigger value="settings" icon={<SettingsIcon />}>Settings</TabsTrigger>
</TabsList>`;

const animateCode = `// Panels are static by default — for a heavy panel the fade is the thing
// that makes a tab switch feel slow. Opt in per panel when the content is
// light enough to earn it.
<TabsContent value="account" animate animateY={4}>
  Manage your account settings.
</TabsContent>`;

const tabsProps: PropDef[] = [
  { name: "defaultValue", type: "string", description: "Value of the tab selected on first render, when uncontrolled." },
  { name: "value", type: "string", description: "Selected tab. Pass it with `onValueChange` to control the component." },
  { name: "onValueChange", type: "(value: string) => void", description: "Called with the new value when a trigger is clicked." },
  { name: "variant", type: '"default" | "underline" | "ghost"', default: '"default"', description: "`default` fills a tray, `ghost` drops the tray, `underline` swaps the pill for a bar." },
  { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "Drives the list height, trigger padding, and underline thickness together." },
  { name: "concentric", type: "boolean", default: "false", description: "Nest the radii so the list's corners sit concentric with the triggers'." },
  { name: "indicatorThickness", type: "string", description: "Overrides the underline bar's height (e.g. `2px`)." },
  { name: "indicatorClassName", type: "string", description: "Overrides the indicator's background class." },
];

const triggerProps: PropDef[] = [
  { name: "value", type: "string", description: "Matches the `value` of the panel this trigger reveals." },
  { name: "icon", type: "ReactNode", description: "Glyph rendered before the label, sized to 16px." },
  { name: "disabled", type: "boolean", default: "false", description: "Dims the trigger and stops it taking pointer events." },
];

const contentProps: PropDef[] = [
  { name: "value", type: "string", description: "Matches the `value` of the trigger that reveals this panel." },
  { name: "forceMount", type: "boolean", default: "false", description: "Keep every panel mounted, so switching costs nothing and crawlers see the content." },
  { name: "animate", type: "boolean", default: "false", description: "Fade the panel in on entry." },
  { name: "animateY", type: "number", description: "Rise this many pixels on entry." },
  { name: "animateOpacity", type: "boolean", description: "Overrides `animate` when set explicitly." },
];

export default function TabsDoc() {
  return (
    <DocPage
      slug="tabs"
      description="Tab navigation with underline, background, and ghost variants, and a spring-driven indicator that follows the shape system."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <Tabs defaultValue="account" className="w-fit max-w-full">
            <Triggers />
            <Panels />
          </Tabs>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Underline">
        <ComponentPreview code={underlineCode}>
          <Tabs defaultValue="account" variant="underline" className="w-fit max-w-full">
            <Triggers />
            <Panels />
          </Tabs>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Ghost">
        <ComponentPreview code={ghostCode}>
          <Tabs defaultValue="account" variant="ghost" className="w-fit max-w-full">
            <Triggers />
            <Panels />
          </Tabs>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Concentric">
        <ComponentPreview code={concentricCode}>
          <Tabs defaultValue="account" concentric className="w-fit max-w-full">
            <Triggers />
            <Panels />
          </Tabs>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Sizes">
        <ComponentPreview code={sizesCode} align="top" minHeightClass="min-h-[280px]">
          {/* items-start, not centre: three strips of different widths centred
              individually would step in and out on the left edge. */}
          <div className="flex w-fit max-w-full flex-col items-start gap-7">
            {(["sm", "default", "lg"] as const).map((size) => (
              <Tabs key={size} defaultValue="account" size={size}>
                <Triggers />
                <Panels />
              </Tabs>
            ))}
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="With Icons">
        <ComponentPreview code={iconsCode}>
          <Tabs defaultValue="account" className="w-fit max-w-full">
            <TabsList>
              <TabsTrigger value="account" icon={<UserIcon />}>
                Account
              </TabsTrigger>
              <TabsTrigger value="password" icon={<LockIcon />}>
                Password
              </TabsTrigger>
              <TabsTrigger value="settings" icon={<SettingsIcon />}>
                Settings
              </TabsTrigger>
            </TabsList>
            <Panels />
          </Tabs>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Animated panels">
        <ComponentPreview code={animateCode}>
          <Tabs defaultValue="account" variant="underline" className="w-fit max-w-full">
            <Triggers />
            <Panels animate />
          </Tabs>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <div className="flex flex-col gap-8">
          <PropsTable props={tabsProps} />
          <div className="flex flex-col gap-3">
            <p className="text-caption text-muted-foreground">TabsTrigger</p>
            <PropsTable props={triggerProps} />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-caption text-muted-foreground">TabsContent</p>
            <PropsTable props={contentProps} />
          </div>
        </div>
      </DocSection>
    </DocPage>
  );
}
