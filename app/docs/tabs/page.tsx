"use client";

import { LockIcon, SettingsIcon, UserIcon } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/default/tabs";
import { Code } from "@/registry/default/code";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection, DocSubSection } from "@/lib/docs/DocPage";

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
function Panels({ fadeIn = false }: { fadeIn?: boolean }) {
  return (
    <div className="relative min-h-[24px]">
      {PANELS.map((panel) => (
        <TabsContent
          key={panel.value}
          value={panel.value}
          className="absolute inset-x-0 top-0"
          fadeIn={fadeIn}
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

const usageCode = `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">Manage your account settings.</TabsContent>
  <TabsContent value="password">Change your password here.</TabsContent>
</Tabs>`;

const demoCode = `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="account">Manage your account settings.</TabsContent>
  <TabsContent value="password">Change your password here.</TabsContent>
  <TabsContent value="settings">Configure your preferences.</TabsContent>
</Tabs>`;

// The Basic demo is the two-tab minimum — the same source as Usage, rendered.
const basicCode = usageCode;


const underlineCode = `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// An underline indicator instead of a filled pill, plus a hover wash that
// slides ahead of the click. Reads as navigation rather than as a control.
<Tabs defaultValue="account" variant="underline">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  …
</Tabs>`;

const ghostCode = `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Same indicator, no tray behind it — for a tab strip that sits on a
// surface which already has its own ground.
<Tabs defaultValue="account" variant="ghost">
  …
</Tabs>`;

const concentricCode = `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Nested radii: the list takes the shape system's container radius, the
// triggers its element radius. They differ by exactly the list's 4px padding
// in both Rounded and Pill, so the corners stay concentric whichever the
// reader picks in the properties panel.
<Tabs defaultValue="account" concentric>
  …
</Tabs>`;

const sizesCode = `import { Tabs } from "@/components/ui/tabs";

// sm / default / lg. The size drives the list height, the trigger padding,
// and the underline's thickness together.
<Tabs defaultValue="account" size="sm">…</Tabs>
<Tabs defaultValue="account" size="default">…</Tabs>
<Tabs defaultValue="account" size="lg">…</Tabs>`;

const iconsCode = `import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LockIcon, SettingsIcon, UserIcon } from "lucide-react";

<TabsList>
  <TabsTrigger value="account" icon={<UserIcon />}>Account</TabsTrigger>
  <TabsTrigger value="password" icon={<LockIcon />}>Password</TabsTrigger>
  <TabsTrigger value="settings" icon={<SettingsIcon />}>Settings</TabsTrigger>
</TabsList>`;

const fadeInCode = `import { TabsContent } from "@/components/ui/tabs";

// Panels are static by default — for a heavy panel the fade is the thing
// that makes a tab switch feel slow. Opt in per panel when the content is
// light enough to earn it.
<TabsContent value="account" fadeIn>
  Manage your account settings.
</TabsContent>`;

const tabsProps: PropDef[] = [
  { name: "defaultValue", type: "string", description: "Value of the tab selected on first render, when uncontrolled." },
  { name: "value", type: "string", description: "Selected tab. Pass it with `onValueChange` to control the component." },
  { name: "onValueChange", type: "(value: string) => void", description: "Called with the new value when a trigger is clicked." },
  { name: "variant", type: '"default" | "underline" | "ghost"', default: '"default"', description: "`default` fills a tray, `ghost` drops the tray, `underline` swaps the pill for a bar." },
  { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "Drives the list height, trigger padding, and underline thickness together." },
  { name: "concentric", type: "boolean", default: "false", description: "Nest the radii so the list's corners sit concentric with the triggers'." },
  { name: "activationMode", type: '"automatic" | "manual"', default: '"automatic"', description: "`automatic` selects a tab as the arrow keys move focus onto it; `manual` only moves focus, and Enter/Space commits the selection." },
  { name: "indicatorClassName", type: "string", description: "Extra classes merged onto the active indicator — its background, or the underline bar's thickness (e.g. `h-0.5`)." },
];

const listProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "TabsTrigger elements to render in the strip." },
  { name: "className", type: "string", description: "Extra classes merged onto the tab strip." },
];

const triggerProps: PropDef[] = [
  { name: "value", type: "string", description: "Matches the `value` of the panel this trigger reveals." },
  { name: "icon", type: "ReactNode", description: "Glyph rendered before the label, sized to 16px." },
  { name: "disabled", type: "boolean", default: "false", description: "Dims the trigger and stops it taking pointer events." },
];

const contentProps: PropDef[] = [
  { name: "value", type: "string", description: "Matches the `value` of the trigger that reveals this panel." },
  { name: "forceMount", type: "boolean", default: "false", description: "Render this panel from the first render instead of waiting for it to become active." },
  { name: "fadeIn", type: "boolean", default: "false", description: "Fade the panel in on entry." },
];

const fromArrayProps: PropDef[] = [
  { name: "tabs", type: "TabItem[]", description: "Tabs to render from data instead of JSX; each item's `id` becomes both the trigger and panel value." },
  { name: "defaultValue", type: "string", description: "Value of the tab selected on first render, when uncontrolled." },
  { name: "value", type: "string", description: "Selected tab. Pass it with `onValueChange` to control the component." },
  { name: "onValueChange", type: "(value: string) => void", description: "Called with the new value when a trigger is clicked." },
  { name: "variant", type: '"default" | "underline" | "ghost"', default: '"default"', description: "`default` fills a tray, `ghost` drops the tray, `underline` swaps the pill for a bar." },
  { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "Drives the list height, trigger padding, and underline thickness together." },
  { name: "listClassName", type: "string", description: "Extra classes on the tab strip." },
  { name: "triggerClassName", type: "string", description: "Extra classes on every trigger." },
  { name: "contentClassName", type: "string", description: "Extra classes on every panel." },
  { name: "children", type: "(tab: TabItem) => ReactNode", description: "Renders each tab's panel content; omit to render the triggers with panels supplied separately." },
];

export default function TabsDoc() {
  return (
    <DocPage
      slug="tabs"
      demo={
        <ComponentPreview code={demoCode} padding="compact">
          <Tabs defaultValue="account" className="w-fit max-w-full">
            <Triggers />
            <Panels />
          </Tabs>
        </ComponentPreview>
      }
    >
      <DocSection title="Usage">
        <Code language="tsx" code={usageCode} />
      </DocSection>

      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <Tabs defaultValue="account" className="w-fit max-w-full">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            {/* Not the stacked `Panels` the rest of the page uses: an absolutely
                positioned panel adds nothing to a `w-fit` parent's width, so
                with only two triggers the strip stayed narrower than the copy
                and the copy wrapped. In flow, the widest of the two sets the
                block's width and the strip sits under it, left edges aligned. */}
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

      <DocSection title="Concentric">
        <ComponentPreview code={concentricCode}>
          <Tabs defaultValue="account" concentric className="w-fit max-w-full">
            <Triggers />
            <Panels />
          </Tabs>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Animated panels">
        <ComponentPreview code={fadeInCode}>
          <Tabs defaultValue="account" variant="underline" className="w-fit max-w-full">
            <Triggers />
            <Panels fadeIn />
          </Tabs>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <DocSubSection title="Tabs">
          <PropsTable props={tabsProps} />
        </DocSubSection>

        <DocSubSection title="TabsList">
          <PropsTable props={listProps} />
        </DocSubSection>

        <DocSubSection title="TabsTrigger">
          <PropsTable props={triggerProps} />
        </DocSubSection>

        <DocSubSection title="TabsContent">
          <p className="text-caption text-muted-foreground">
            A panel mounts the first time its tab becomes active, then stays
            mounted — hidden, not unmounted, when another tab is selected —
            so content backed by an API doesn&apos;t refetch and flash empty
            on every revisit. <code>forceMount</code> mounts every panel up
            front instead of waiting for a first visit.
          </p>
          <PropsTable props={contentProps} />
        </DocSubSection>

        <DocSubSection title="TabsFromArray">
          <p className="text-caption text-muted-foreground">
            The same tabs, driven by an array of <code>TabItem</code> objects
            instead of JSX — for a list that comes from a config or an API
            rather than being written out by hand.
          </p>
          <PropsTable props={fromArrayProps} />
        </DocSubSection>
      </DocSection>
    </DocPage>
  );
}
