"use client";

import { useState, type ComponentProps } from "react";
import { redo, undo } from "@codemirror/commands";
import type { EditorView } from "@codemirror/view";
import { Menu } from "@base-ui/react/menu";
import { Toolbar } from "@base-ui/react/toolbar";

import { useIcons, type IconComponent } from "@/registry/lib/icon-context";
import {
  formattingAt,
  insertLink,
  setHeading,
  toggleLinePrefix,
  toggleWrap,
  type Formatting,
} from "@/registry/lib/live-markdown";
import { cn } from "@/registry/lib/utils";
import { Button } from "@/registry/ui/button";
import { useEditorView } from "@/registry/ui/editor";
import { Tooltip, TooltipProvider } from "@/registry/ui/tooltip";

type Command = (view: EditorView) => boolean;

// The keyboard shortcut is spelt for the platform the reader is on, since a
// tooltip that says ⌘B to someone holding Ctrl is a tooltip that lies. Read
// at render: it never appears in the server markup (tooltips open on hover).
const mod = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl+";

const STYLES: { level: 0 | 1 | 2 | 3; label: string }[] = [
  { level: 0, label: "Paragraph" },
  { level: 1, label: "Heading 1" },
  { level: 2, label: "Heading 2" },
  { level: 3, label: "Heading 3" },
];

/**
 * The formatting toolbar for `<Editor>`, rendered as its child. Every button
 * runs one of the editor's own commands — the same ones its shortcuts run —
 * and reads its pressed state from the caret, so it is a second way in, never
 * a second source of truth.
 */
export function EditorControls({ className, ...props }: ComponentProps<"div">) {
  const view = useEditorView();
  const icons = useIcons();
  const formatting = view ? formattingAt(view.state) : null;
  const run = (command: Command) => {
    if (!view) return;
    command(view);
    view.focus();
  };

  return (
    <TooltipProvider>
      <Toolbar.Root
        aria-label="Formatting"
        // One row that scrolls rather than wraps: on a phone a toolbar folded
        // into three rows eats the screen the text needed, and a sideways
        // strip is what the platform's own editors do. The scrollbar is
        // hidden because the strip is a control, not a document.
        className={cn(
          "flex items-center overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          className,
        )}
        {...props}
      >
        <Group>
          <Control icon={icons.undo} label="Undo" keys="Z" disabled={!formatting?.canUndo} onRun={() => run(undo)} />
          <Control icon={icons.redo} label="Redo" keys="⇧Z" disabled={!formatting?.canRedo} onRun={() => run(redo)} />
        </Group>
        <Separator />
        <Group>
          <StyleMenu heading={formatting?.heading ?? 0} view={view} onRun={run} />
        </Group>
        <Separator />
        <Group>
          <Control icon={icons.bold} label="Bold" keys="B" pressed={formatting?.strong} onRun={() => run(toggleWrap("**"))} />
          <Control icon={icons.italic} label="Italic" keys="I" pressed={formatting?.em} onRun={() => run(toggleWrap("*"))} />
          <Control icon={icons.strikethrough} label="Strikethrough" keys="⇧X" pressed={formatting?.del} onRun={() => run(toggleWrap("~~"))} />
          <Control icon={icons.code} label="Code" keys="E" pressed={formatting?.code} onRun={() => run(toggleWrap("`"))} />
        </Group>
        <Separator />
        <Group>
          <Control icon={icons.link} label="Link" pressed={formatting?.link} onRun={() => run(insertLink())} />
          <Control icon={icons.image} label="Image" onRun={() => run(insertLink(true))} />
        </Group>
        <Separator />
        {/* The four that rewrite the head of the line, together: each swaps
            the marker the others wrote, so a quote sits with the lists. */}
        <Group>
          <Control icon={icons.list} label="Bullet list" pressed={formatting?.line === "bullet"} onRun={() => run(toggleLinePrefix("bullet"))} />
          <Control icon={icons["list-ordered"]} label="Numbered list" pressed={formatting?.line === "ordered"} onRun={() => run(toggleLinePrefix("ordered"))} />
          <Control icon={icons["list-todo"]} label="Task list" keys="L" pressed={formatting?.line === "task"} onRun={() => run(toggleLinePrefix("task"))} />
          <Control icon={icons["text-quote"]} label="Quote" pressed={formatting?.line === "quote"} onRun={() => run(toggleLinePrefix("quote"))} />
        </Group>
      </Toolbar.Root>
    </TooltipProvider>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <Toolbar.Group className="flex shrink-0 items-center">{children}</Toolbar.Group>;
}

function Separator() {
  return <Toolbar.Separator className="mx-1 h-5 w-px shrink-0 bg-border" />;
}

interface ControlProps {
  icon: IconComponent;
  label: string;
  /** The key after the modifier, for the tooltip. */
  keys?: string;
  pressed?: boolean;
  disabled?: boolean;
  onRun: () => void;
}

function Control({ icon: Icon, label, keys, pressed = false, disabled = false, onRun }: ControlProps) {
  return (
    <Tooltip content={keys ? `${label} ${mod()}${keys}` : label}>
      <Toolbar.Button
        disabled={disabled}
        // A control must not take the focus it is about to act on: the click
        // lands with the caret still in the text, and the selection it wraps
        // is the one the reader made.
        onMouseDown={(event) => event.preventDefault()}
        onClick={onRun}
        render={
          <Button variant="ghost" size="icon-sm" active={pressed} aria-label={label} aria-pressed={pressed}>
            <Icon />
          </Button>
        }
      />
    </Tooltip>
  );
}

function StyleMenu({
  heading,
  view,
  onRun,
}: {
  heading: Formatting["heading"];
  view: EditorView | null;
  onRun: (command: Command) => void;
}) {
  const [open, setOpen] = useState(false);
  const icons = useIcons();
  return (
    <Menu.Root open={open} onOpenChange={setOpen}>
      <Toolbar.Button
        render={
          <Menu.Trigger
            render={
              <Button variant="ghost" size="sm" trailingIcon={icons["chevron-down"]} active={open}>
                Style
              </Button>
            }
          />
        }
      />
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start" className="z-50">
          <Menu.Popup
            // Back to the text on close, not the trigger: the reader picked a
            // style in order to keep writing.
            finalFocus={() => view?.contentDOM ?? null}
            className={cn(
              "min-w-40 rounded-[var(--radius-bg,var(--radius,0.5rem))] bg-popover p-1 text-popover-foreground",
              "shadow-[0_0_0_1px_var(--border),0_8px_24px_-8px_rgb(0_0_0/0.25)]",
              "origin-(--transform-origin) transition-[opacity,scale] duration-(--motion-moderate) ease-spring",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:duration-(--motion-moderate-exit)",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            )}
          >
            <Menu.RadioGroup value={heading} onValueChange={(level) => onRun(setHeading(level))}>
              {STYLES.map(({ level, label }) => (
                <Menu.RadioItem
                  key={level}
                  value={level}
                  closeOnClick
                  className={cn(
                    "flex cursor-default items-center justify-between gap-6 rounded-[calc(var(--radius-bg,var(--radius,0.5rem))-4px)] px-2 py-1.5 text-[13px] outline-none select-none",
                    "data-[highlighted]:bg-hover",
                    level === 1 && "text-base font-semibold",
                    level === 2 && "text-[15px] font-semibold",
                    level === 3 && "font-semibold",
                  )}
                >
                  {label}
                  <Menu.RadioItemIndicator render={<icons.check size={14} className="size-3.5" />} />
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
