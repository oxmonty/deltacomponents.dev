"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { CheckIcon, CopyIcon, TerminalIcon } from "lucide-react"
import { Highlight } from "prism-react-renderer"
import type { PrismTheme } from "prism-react-renderer"

// Side-effect import: registers extra Prism grammars (bash, docker,
// java, ruby, php, …) on the shared instance. Must come before any
// ``<Highlight>`` usage in this module.
import "@/registry/default/lib/prism-languages"

import { cn } from "@/registry/default/lib/utils"
import { useThemeContext } from "@/registry/default/lib/theme-context"
import { getIconForFile } from "@/registry/default/code-icons"
import { Button } from "@/registry/base/button"

type PackageManager = "npm" | "yarn" | "pnpm" | "bun"

const defaultTheme: PrismTheme = {
  plain: {
    // Matches the dark-mode ``--card`` token from globals.css so code
    // blocks sit flush with surrounding Card surfaces without a
    // contrast jump.
    color: "#FFFFFF",
    backgroundColor: "#262626",
  },
  styles: [
    {
      types: ["comment"],
      style: {
        color: "#757575",
        fontStyle: "italic",
      },
    },
    {
      types: ["keyword", "property", "property-access", "attr-name"],
      style: {
        color: "#77b7d7",
      },
    },
    {
      types: ["tag"],
      style: {
        color: "#dfab5c",
      },
    },
    {
      types: ["punctuation", "symbol", "dom"],
      style: {
        color: "#ffffff",
      },
    },
    {
      types: ["definition", "function"],
      style: {
        color: "#86d9ca",
      },
    },
    {
      types: ["string", "char", "attr-value"],
      style: {
        color: "#977cdc",
      },
    },
    {
      types: ["static", "number"],
      style: {
        color: "#ff6658",
      },
    },
  ],
}

const lightTheme: PrismTheme = {
  plain: {
    color: "#24292e",
    backgroundColor: "#ffffff",
  },
  styles: [
    {
      types: ["comment"],
      style: {
        color: "#8b949e",
        fontStyle: "italic",
      },
    },
    {
      types: ["variable", "parameter"],
      style: {
        color: "#e36209",
      },
    },
    {
      types: ["keyword", "builtin", "function-definition"],
      style: {
        color: "#d73a49",
      },
    },
    {
      types: ["property", "property-access", "attr-name"],
      style: {
        color: "#005cc5",
      },
    },
    {
      types: ["tag"],
      style: {
        color: "#22863a",
      },
    },
    {
      types: ["punctuation", "symbol", "dom", "operator"],
      style: {
        color: "#24292e",
      },
    },
    {
      types: ["function"],
      style: {
        color: "#6f42c1",
      },
    },
    {
      types: ["class-name"],
      style: {
        color: "#6f42c1",
      },
    },
    {
      types: ["string", "char", "attr-value"],
      style: {
        color: "#032f62",
      },
    },
    {
      types: ["static", "number"],
      style: {
        color: "#005cc5",
      },
    },
  ],
}

interface CodeProps {
  npm?: string
  yarn?: string
  pnpm?: string
  bun?: string
  defaultPackageManager?: PackageManager
  code?: string
  css?: string
  language?: string
  defaultLanguage?: string
  filename?: string
  showLineNumbers?: boolean
  theme?: PrismTheme
  adaptiveTheme?: {
    light: PrismTheme
    dark: PrismTheme
  }
  /** Paint the header and code surface from the Prism theme's own background
   *  instead of the page's card token. Defaults to true whenever `theme` or
   *  `adaptiveTheme` is supplied — a palette brought from elsewhere carries its
   *  own ground, and pairing its colours with the page's card is what makes a
   *  dark theme read washed out on a light page. */
  useThemeBackground?: boolean
  className?: string
  textClassName?: string
  scrollbar?: boolean
  expandable?: boolean
  defaultExpanded?: boolean
  collapsedHeight?: string
  /** Label on the affordance that opens a collapsed block. Docs previews say
   *  "View code"; a bare code block says "Expand". Expanding is one-way —
   *  there is no collapse control, so a reader never has to re-open what they
   *  just opened. A page load starts collapsed again. */
  expandLabel?: string
}

const monoFontFamily =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'

function parseMarkdownCodeBlock(input: string): {
  code: string
  language: string | null
} {
  const markdownRegex = /^```(\w+)?\n?([\s\S]*?)```$/
  const match = input.trim().match(markdownRegex)

  if (match) {
    return {
      language: match[1] || null,
      code: match[2]?.trim() || "",
    }
  }

  return { code: input, language: null }
}

const languageAliases: Record<string, string> = {
  py: "python",
  js: "javascript",
  ts: "typescript",
  tsx: "tsx",
  jsx: "jsx",
  rb: "ruby",
  rs: "rust",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  console: "bash",
  yml: "yaml",
  md: "markdown",
  dockerfile: "docker",
  Dockerfile: "docker",
  ps1: "powershell",
  ps: "powershell",
}

const packageManagerCommands: Record<string, PackageManager> = {
  npx: "npm",
  npm: "npm",
  yarn: "yarn",
  pnpm: "pnpm",
  bunx: "bun",
  bun: "bun",
}

function resolveLanguage(lang: string): string {
  return languageAliases[lang.toLowerCase()] || lang.toLowerCase()
}

function detectPackageManagerFromMarkdown(input: string): {
  isPackageManager: boolean
  command: string
  manager: PackageManager
} | null {
  const parsed = parseMarkdownCodeBlock(input)
  if (!parsed.language) return null

  const lang = parsed.language.toLowerCase()
  const manager = packageManagerCommands[lang]

  if (manager) {
    return {
      isPackageManager: true,
      command: parsed.code,
      manager,
    }
  }

  return null
}

function convertNpxToPackageManagers(npxCommand: string): {
  npm: string
  yarn: string
  pnpm: string
  bun: string
} {
  // Handle patterns like "npx shadcn@latest add button" or just "shadcn@latest add button"
  let command = npxCommand.trim()

  // Remove leading "npx " if present
  if (command.startsWith("npx ")) {
    command = command.slice(4)
  }

  return {
    npm: `npx ${command}`,
    yarn: `yarn dlx ${command}`,
    pnpm: `pnpm dlx ${command}`,
    bun: `bunx ${command}`,
  }
}


/** The tone every control sitting ON the code surface shares — the copy glyph
 *  and the expand affordance — so they read as one set rather than two
 *  separately-tuned greys.
 *
 *  Two branches, because the surface underneath differs. Normally the block
 *  sits on the page's card, so the app's muted → foreground pair is right. When
 *  the block paints from its own palette (a dark theme on a light page) those
 *  tokens read wrong against it, so the chrome rides the theme's own colour and
 *  varies by opacity instead. `hover` for a control you point at directly,
 *  `group-hover` for a glyph inside one. */
function chromeTone(onTheme: boolean, within: "self" | "group") {
  const hover = within === "self" ? "hover" : "group-hover"
  // A touch device never hovers, so the glyph would sit at its resting tone
  // forever — it is shown at full strength there instead.
  return onTheme
    ? `opacity-60 ${hover}:opacity-100 [@media(hover:none)]:opacity-100`
    : `text-muted-foreground ${hover}:text-foreground [@media(hover:none)]:text-foreground`
}

/** Copy `value`, falling back when the async Clipboard API is unavailable.
 *
 *  `navigator.clipboard` only exists in a secure context — HTTPS, or localhost.
 *  Opening the docs from a phone on the LAN (http://192.168.x.x) is plain
 *  HTTP, so the object is simply absent and reading `.writeText` off it
 *  throws. The same applies to any consumer serving this component over HTTP
 *  on an internal network.
 *
 *  The fallback selects the text in an off-screen node and runs the legacy
 *  `execCommand("copy")`. It is deprecated but universally implemented, and it
 *  is the only path available without TLS. Returns whether the copy landed, so
 *  the button only claims success when it actually copied.
 *
 *  The node is a span, not a focused textarea. `execCommand("copy")` takes
 *  whatever is selected, and a selection needs no focus — while focusing a
 *  field (the usual recipe, which has to flip `contentEditable` on to make iOS
 *  select it at all) reads to iOS as "about to type": Safari collapses its
 *  bottom address bar for a keyboard that never arrives, then puts it back a
 *  frame later when the node is removed. Selecting a plain node skips the
 *  whole performance. `white-space: pre` keeps the newlines, which the copy
 *  takes from the rendered text rather than the string. */
async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    // Present but refused (permissions policy, denied prompt) — try the node.
  }

  // Off-screen rather than invisible: text under `display:none` or
  // `visibility:hidden` is not selectable, so the copy would silently do
  // nothing. Parked at the viewport's top-left rather than off at -9999px —
  // selecting something makes the browser reveal it, and revealing a node
  // 9999px to the left is what made mobile lurch sideways on every copy.
  const holder = document.createElement("span")
  holder.textContent = value
  holder.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;overflow:hidden;opacity:0;white-space:pre;user-select:text;-webkit-user-select:text"
  document.body.appendChild(holder)

  // Put whatever the reader had highlighted back afterwards.
  const selection = document.getSelection()
  const previous =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

  try {
    const range = document.createRange()
    range.selectNodeContents(holder)
    selection?.removeAllRanges()
    selection?.addRange(range)
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    selection?.removeAllRanges()
    holder.remove()
    if (previous) selection?.addRange(previous)
  }
}

/** Copy-to-clipboard control for a code surface.
 *
 *  Transparent at rest so it doesn't sit on the code as a visible chip; the
 *  ground arrives on hover, mixed from ``iconColor`` — the code theme's own
 *  plain colour — rather than an app token, because a block carries its own
 *  light/dark palette independent of the page.
 *
 *  Trade-off of the transparent rest state: with no filename bar the button
 *  floats over the code, so a long first line can run under the glyph until
 *  you hover it. */
function CopyButton({
  value,
  className,
  iconColor,
  onTheme = false,
}: {
  value: string
  className?: string
  iconColor?: string
  /** The block is painting from its own palette — see `chromeTone`. */
  onTheme?: boolean
}) {
  const [hasCopied, setHasCopied] = useState(false)

  useEffect(() => {
    if (!hasCopied) return
    const timer = setTimeout(() => setHasCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [hasCopied])

  return (
    <Button
      data-slot="copy-button"
      type="button"
      variant="ghost"
      size="icon-compact"
      aria-label={hasCopied ? "Copied" : "Copy code"}
      className={cn(
        "group size-7 border-none shadow-none transition-colors",
        "bg-transparent hover:bg-[var(--copy-button-hover-bg,var(--muted))] active:bg-[var(--copy-button-hover-bg,var(--muted))]",
        // No hover on a phone, and the button floats over the code with no
        // filename bar to sit in — without a resting ground the glyph lands on
        // top of whatever the first line happens to be. Same mix as the hover
        // ground, a touch stronger so it reads as a chip on its own.
        "[@media(hover:none)]:bg-[var(--copy-button-rest-bg,var(--muted))]",
        className
      )}
      style={
        {
          ...(iconColor
            ? {
                "--copy-button-hover-bg": `color-mix(in srgb, ${iconColor} 7%, transparent)`,
                "--copy-button-rest-bg": `color-mix(in srgb, ${iconColor} 12%, transparent)`,
                // Only when the chrome rides the theme colour; otherwise the
                // muted/foreground classes own it.
                ...(onTheme ? { color: iconColor } : {}),
              }
            : {}),
        } as React.CSSProperties
      }
      onClick={async () => {
        // Only claim success when the copy actually landed.
        if (await copyToClipboard(value)) setHasCopied(true)
      }}
    >
      {hasCopied ? (
        <CheckIcon
          className={cn("size-3.5", onTheme ? "opacity-100" : "text-foreground")}
        />
      ) : (
        <CopyIcon
          className={cn(
            "size-3.5 transition-[color,opacity]",
            chromeTone(onTheme, "group")
          )}
        />
      )}
    </Button>
  )
}

/** The highlighted source itself, with optional gutter line numbers. Shared by
 *  the expandable and plain wrappers so the two can't drift. */
function HighlightedCode({
  code,
  language,
  theme,
  showLineNumbers,
  textClassName,
}: {
  code: string
  language: string
  theme: PrismTheme
  showLineNumbers: boolean
  textClassName: string
}) {
  const lineNumberColor = theme.plain?.color
    ? `color-mix(in srgb, ${theme.plain.color} 35%, transparent)`
    : "rgba(128, 128, 128, 0.35)"

  return (
    <Highlight theme={theme} code={code.trim()} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={cn(
            className,
            // w-max so the block grows to the longest line, min-w-full so it
            // still fills the scroller when every line is short. Together they
            // give the rows below a width to stretch to.
            "relative w-max min-w-full py-3.5 outline-none",
            "leading-6 font-normal",
            textClassName
          )}
          style={
            {
              ...style,
              fontFamily: monoFontFamily,
              backgroundColor: "transparent",
              MozOsxFontSmoothing: "grayscale",
              "--line-number-color": lineNumberColor,
            } as React.CSSProperties
          }
        >
          {tokens.map((line, i) => (
            <div
              key={i}
              {...getLineProps({ line })}
              // A sticky child can only stay put inside its own containing
              // block. Left to size on its content, a short line's row ended
              // before the scroll did and its number slid away with it; at the
              // full block width every gutter survives the whole scroll.
              className="relative flex min-h-[24px] w-max min-w-full"
            >
              {showLineNumbers && (
                // Sticky so the gutter survives a horizontal scroll; it paints
                // the block background so code scrolls *under* it, not through.
                <span
                  className={cn(
                    "sticky left-0 z-10 w-16 flex-shrink-0 pr-6 pl-6 text-right font-medium tabular-nums select-none",
                    textClassName
                  )}
                  style={{
                    fontFamily: monoFontFamily,
                    color: lineNumberColor,
                    backgroundColor: "var(--code-bg)",
                  }}
                >
                  {i + 1}
                </span>
              )}
              <span
                className={cn(
                  "flex-1 pr-6 whitespace-pre",
                  !showLineNumbers && "pl-6"
                )}
              >
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </span>
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}

export function Code({
  npm,
  yarn,
  pnpm,
  bun,
  defaultPackageManager = "npm",
  code,
  css,
  language = "typescript",
  defaultLanguage,
  filename,
  showLineNumbers = true,
  theme,
  adaptiveTheme,
  useThemeBackground,
  className,
  textClassName = "text-[14px]",
  scrollbar = true,
  expandable = false,
  defaultExpanded = false,
  collapsedHeight = "12rem",
  expandLabel = "Expand",
}: CodeProps) {
  const [packageManager, setPackageManager] = React.useState<PackageManager>(
    defaultPackageManager
  )
  // SSR has no OS preference, so isDark must start false on both the server
  // and the first client render — it feeds dozens of inline
  // `selectedTheme.plain.color` styles (every prism token, the copy icon, the
  // line numbers) that must match at hydration. The `mounted` guard flips it
  // to the real value after mount. The token flash is barely perceptible; the
  // *background* flicker, the loud part, is already gone because
  // `--code-bg` routes through `var(--card)` — a string-stable value, so
  // SSR and client agree and CSS picks the right colour before paint.
  const { resolvedTheme } = useThemeContext()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === "dark"
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // A caller-supplied palette brings its own background; the built-in pair is
  // designed to sit flush with --card, so only that one defaults to the token.
  const paintFromTheme = useThemeBackground ?? Boolean(theme || adaptiveTheme)

  const selectedTheme = adaptiveTheme
    ? isDark
      ? adaptiveTheme.dark
      : adaptiveTheme.light
    : theme || (isDark ? defaultTheme : lightTheme)

  const packageManagerFromMarkdown = code
    ? detectPackageManagerFromMarkdown(code)
    : null

  const parsedMarkdown = code ? parseMarkdownCodeBlock(code) : null
  const actualCode = css || (parsedMarkdown?.code ?? code)
  const actualLanguage = css
    ? "css"
    : parsedMarkdown?.language
      ? resolveLanguage(parsedMarkdown.language)
      : defaultLanguage || language

  // Resolve the surface colour through a CSS variable so a theme swap happens
  // at CSS-evaluation time, not after a React state update. ThemeProvider puts
  // `class="dark"` on <html> before paint, so `var(--card)` is already right at
  // first paint — no flicker.
  const codeBlockBgColor = paintFromTheme
    ? (selectedTheme.plain?.backgroundColor ?? "var(--card)")
    : "var(--card)"

  // Two ways to get a package-manager block: an explicit npm/yarn/pnpm/bun
  // prop set, or a ```npx fenced command we expand into all four. They render
  // the same tab strip, so they resolve to one shape here rather than forking
  // the JSX.
  const explicit: Partial<Record<PackageManager, string>> = {
    npm,
    yarn,
    pnpm,
    bun,
  }
  const hasExplicit = Object.values(explicit).some(Boolean)
  const pmCommands = packageManagerFromMarkdown
    ? convertNpxToPackageManagers(packageManagerFromMarkdown.command)
    : hasExplicit
      ? explicit
      : null

  if (pmCommands) {
    const keys = (["npm", "yarn", "pnpm", "bun"] as PackageManager[]).filter(
      (key) => pmCommands[key]
    )
    const active = pmCommands[packageManager] ? packageManager : keys[0]
    const surfaceStyle = paintFromTheme
      ? {
          backgroundColor: selectedTheme.plain?.backgroundColor,
          color: selectedTheme.plain?.color,
        }
      : undefined

    return (
      <div
        className={cn(
          "bg-card text-card-foreground border-border/60 overflow-hidden rounded-lg border [background-clip:padding-box]",
          className
        )}
        style={{ "--code-bg": codeBlockBgColor } as React.CSSProperties}
      >
        <div
          className={cn(
            "border-border/60 flex items-center justify-between border-b px-3 py-2",
            !paintFromTheme && "bg-background"
          )}
          style={surfaceStyle}
        >
          <div className="flex items-center gap-2.5">
            <TerminalIcon
              className="text-muted-foreground size-4"
              style={
                paintFromTheme
                  ? { color: selectedTheme.plain?.color, opacity: 0.7 }
                  : undefined
              }
            />
            <div role="tablist" aria-label="Package manager" className="flex items-center">
              {keys.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active === key}
                  data-state={active === key ? "active" : "inactive"}
                  onClick={() => setPackageManager(key)}
                  className={cn(
                    "text-muted-foreground data-[state=active]:text-foreground h-7 rounded-md px-2.5 font-medium transition-colors",
                    "outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
                    textClassName
                  )}
                  style={{
                    fontFamily: monoFontFamily,
                    ...(paintFromTheme
                      ? {
                          color: selectedTheme.plain?.color,
                          opacity: active === key ? 1 : 0.7,
                        }
                      : {}),
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
          <CopyButton
            value={pmCommands[active] || ""}
            className="size-7"
            iconColor={selectedTheme.plain?.color}
            onTheme={paintFromTheme}
          />
        </div>
        <div className={cn("overflow-x-auto", !scrollbar && "scrollbar-hide")}>
          <div
            className={cn("relative py-4", !paintFromTheme && "bg-card")}
            style={
              paintFromTheme
                ? { backgroundColor: selectedTheme.plain?.backgroundColor }
                : undefined
            }
          >
            <Highlight
              theme={selectedTheme}
              code={pmCommands[active] || ""}
              language="bash"
            >
              {({
                className: highlightClassName,
                style,
                tokens,
                getLineProps,
                getTokenProps,
              }) => (
                <pre
                  className={cn(
                    highlightClassName,
                    "w-full overflow-x-auto px-4 leading-relaxed font-normal",
                    textClassName
                  )}
                  style={{
                    ...style,
                    fontFamily: monoFontFamily,
                    backgroundColor: paintFromTheme
                      ? selectedTheme.plain?.backgroundColor
                      : "transparent",
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                  }}
                >
                  {tokens.map((line, i) => (
                    <div key={i} {...getLineProps({ line })}>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          </div>
        </div>
      </div>
    )
  }

  if (!actualCode) return null

  // A `text-*` utility passed in className is a font-size override for the code
  // itself, so it wins over textClassName rather than landing on the wrapper.
  const classNames = className?.split(" ") ?? []
  const hasClassPrefix = (prefix: string) =>
    classNames.some((c) => c.startsWith(prefix))
  const textSizeClasses = classNames.filter((c) => c.startsWith("text-"))
  const effectiveTextClassName = textSizeClasses.length
    ? textSizeClasses.join(" ")
    : textClassName

  const highlighted = (
    <HighlightedCode
      code={actualCode}
      language={actualLanguage}
      theme={selectedTheme}
      showLineNumbers={showLineNumbers}
      textClassName={effectiveTextClassName}
    />
  )

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-full overflow-hidden",
        !hasClassPrefix("border") && "border-border/60 border [background-clip:padding-box]",
        !hasClassPrefix("rounded") && "rounded-lg",
        className
      )}
      style={{ "--code-bg": codeBlockBgColor } as React.CSSProperties}
    >
      {filename && (
        <figcaption
          className={cn(
            "border-border/60 flex items-center justify-between border-b px-4 py-2.5 [&_svg]:size-4",
            !paintFromTheme && "bg-background"
          )}
          style={{
            fontFamily: monoFontFamily,
            ...(paintFromTheme
              ? {
                  backgroundColor: selectedTheme.plain?.backgroundColor,
                  color: selectedTheme.plain?.color,
                }
              : {}),
          }}
        >
          <div
            className={cn(
              "flex items-center gap-2",
              paintFromTheme ? "opacity-75" : "text-foreground/75",
              effectiveTextClassName
            )}
          >
            {getIconForFile(filename)}
            <span className="font-medium tracking-tight">{filename}</span>
          </div>
          <div className="flex items-center gap-2">
            <CopyButton
              value={actualCode}
              iconColor={selectedTheme.plain?.color}
              onTheme={paintFromTheme}
            />
          </div>
        </figcaption>
      )}

      <div className="relative">
        {/* With no filename bar to live in, the controls float over the code.
            The row is pointer-transparent so it doesn't eat text selection;
            only the controls themselves take pointer events back. */}
        {!filename && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-end">
            <div className="pointer-events-auto flex items-center gap-2 p-3">
              <CopyButton
                value={actualCode}
                iconColor={selectedTheme.plain?.color}
                onTheme={paintFromTheme}
              />
            </div>
          </div>
        )}

        {expandable ? (
          <div
            className={cn(
              "relative w-full transition-all",
              isExpanded ? "overflow-auto" : "overflow-hidden",
              !scrollbar && "scrollbar-hide"
            )}
            style={{
              backgroundColor: "var(--code-bg)",
              maxHeight: isExpanded ? "none" : collapsedHeight,
            }}
          >
            {highlighted}
          </div>
        ) : (
          <div
            className={cn(
              "relative max-h-[450px] w-full overflow-auto",
              !scrollbar && "scrollbar-hide"
            )}
            style={{ backgroundColor: "var(--code-bg)" }}
          >
            {highlighted}
          </div>
        )}

        {expandable && !isExpanded && (
          <div
            className="absolute inset-x-0 bottom-0 z-20 flex h-24 items-end justify-center rounded-b-lg pb-4"
            style={{
              background: `linear-gradient(to top, ${
                paintFromTheme && selectedTheme.plain?.backgroundColor
                  ? selectedTheme.plain.backgroundColor
                  : "var(--card)"
              } 40%, color-mix(in oklab, ${
                paintFromTheme && selectedTheme.plain?.backgroundColor
                  ? selectedTheme.plain.backgroundColor
                  : "var(--card)"
              } 60%, transparent) 75%, transparent 100%)`,
            }}
          >
            <Button
              type="button"
              variant="tertiary"
              size="compact"
              onClick={() => setIsExpanded(true)}
              className="relative z-10 shadow-none"
            >
              {expandLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
