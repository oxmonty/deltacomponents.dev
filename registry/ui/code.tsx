"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Highlight } from "prism-react-renderer"
import type { PrismTheme } from "prism-react-renderer"

// Side-effect import: registers extra Prism grammars (bash, docker,
// java, ruby, php, …) on the shared instance. Must come before any
// ``<Highlight>`` usage in this module.
import "@/registry/lib/prism-languages"

import { cn } from "@/registry/lib/utils"
import { copyToClipboard } from "@/registry/lib/clipboard"
import { getIconForFile } from "@/registry/ui/code-icons"
import { Button } from "@/registry/ui/button"

type PackageManager = "npm" | "yarn" | "pnpm" | "bun"

/** Every group the two built-in Prism palettes used to carry as hardcoded hex,
 *  now a named slot in the CSS palette (`--code-token-<key>`, declared in
 *  globals.css §8). One list drives two things: the built-in theme below
 *  (each group's color is just `var(--code-token-<key>)`, resolved by the
 *  `.dark` class with no JS), and `resolveGroupColor` — which walks a
 *  consumer-supplied `adaptiveTheme` palette to find the color it assigns
 *  each group, so that palette can be resolved the same CSS-only way. */
const tokenGroups: { key: string; types: string[]; fontStyle?: "italic" }[] = [
  { key: "comment", types: ["comment"], fontStyle: "italic" },
  { key: "keyword", types: ["keyword"] },
  { key: "property", types: ["property", "property-access", "attr-name"] },
  { key: "tag", types: ["tag"] },
  { key: "punctuation", types: ["punctuation", "symbol", "dom", "operator"] },
  { key: "definition", types: ["definition"] },
  { key: "function", types: ["function"] },
  { key: "string", types: ["string", "char", "attr-value"] },
  { key: "static", types: ["static", "number"] },
  { key: "variable", types: ["variable", "parameter"] },
  { key: "builtin", types: ["builtin", "function-definition"] },
  { key: "class-name", types: ["class-name"] },
]

/** The built-in syntax palette. Every color is a CSS variable reference —
 *  light values on `:root`, dark overrides on `.dark` (globals.css §8) — so
 *  the right palette is already in effect before this ever renders. Merging
 *  the old separate dark/light `PrismTheme`s into one is what makes that
 *  possible: previously the choice of *which* theme object to use lived in
 *  React state, guaranteeing a light-palette frame on every mount. */
const builtinTheme: PrismTheme = {
  plain: { color: "var(--code-fg)", backgroundColor: "var(--code-bg)" },
  styles: tokenGroups.map(({ key, types, fontStyle }) => ({
    types,
    style: {
      color: `var(--code-token-${key})`,
      ...(fontStyle ? { fontStyle } : {}),
    },
  })),
}

/** The color a `PrismTheme` assigns a token group, mirroring how
 *  prism-react-renderer resolves overlapping style entries: the last one
 *  naming the type wins. Falls back to the theme's own plain color for a
 *  group it doesn't style at all — used to project a consumer's
 *  `adaptiveTheme` onto the same `--code-token-*` slots the built-in palette
 *  uses. */
function resolveGroupColor(theme: PrismTheme, types: string[]): string {
  for (let i = theme.styles.length - 1; i >= 0; i--) {
    const entry = theme.styles[i]
    if (types.some((t) => entry.types.includes(t)))
      return entry.style.color ?? theme.plain?.color ?? ""
  }
  return theme.plain?.color ?? ""
}

interface CodeProps extends Omit<React.ComponentProps<"div">, "children"> {
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

/** The code's own type size, set on the block's ROOT rather than on the
 *  `<pre>`, so every part of the block inherits it — the highlighted source,
 *  the line-number gutter, the filename bar and the package-manager tabs. That
 *  is what makes a single `text-sm` in `className` resize the whole block:
 *  tailwind-merge drops this default in favour of the caller's utility, where
 *  a size declared further down would have won on specificity and left the
 *  parts at different sizes. */
const CODE_TEXT_SIZE = "text-[14px]"

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


/* ------------------------------------------------------------------
 * Icons
 * ------------------------------------------------------------------
 * Inlined rather than imported from lucide-react. Three glyphs are not worth
 * an install-time dependency on a consumer's project: the registry item lists
 * what `shadcn add` installs, and every package there is one the reader did
 * not choose. The paths are lucide's own (ISC), drawn at its 24px grid so they
 * sit correctly beside icons a consumer does bring from it.
 */

interface IconProps {
  className?: string
  style?: React.CSSProperties
}

function iconProps({ className, style }: IconProps) {
  return {
    className,
    style,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  }
}

function CopyIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

function CheckIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function TerminalIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  )
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
 *  `group-hover` for a glyph inside one.
 *
 *  Rest is `chromeRestingTone`, the same tone the filename bar uses, so the
 *  glyph and the name beside it sit at one weight. Hover is the only thing
 *  that brightens it — deliberately not touch. A phone never hovers, so
 *  pinning it to full strength there (which is what this used to do) left the
 *  copy glyph permanently darker than the filename it shares a row with. */
function chromeTone(onTheme: boolean, within: "self" | "group") {
  // Every variant is written out rather than assembled from a `hover` variable.
  // Tailwind generates utilities by scanning source text, so a class built as
  // `${modifier}:text-foreground` never reaches the stylesheet — this hover had
  // silently done nothing at all, and the glyph only ever changed weight
  // through a `[@media(hover:none)]` rule that fired on touch and never on a
  // pointer. Keep these literal.
  if (within === "self") {
    return onTheme
      ? `${chromeRestingTone(onTheme)} hover:opacity-100`
      : `${chromeRestingTone(onTheme)} hover:text-foreground`
  }
  return onTheme
    ? `${chromeRestingTone(onTheme)} group-hover:opacity-100`
    : `${chromeRestingTone(onTheme)} group-hover:text-foreground`
}

/** `chromeTone`'s resting half on its own, for the chrome that never lights
 *  up: the filename bar's file icon and label. They sit in the same row as the
 *  copy button, so anything brighter than the glyph it sits beside reads as the
 *  filename shouting over the control — which is what `text-foreground/75` did.
 *  Both branches are here for the same reason as in `chromeTone`: on a block
 *  painting from its own palette the app's muted token is the wrong grey, so
 *  the label rides the theme's colour at the glyph's opacity instead. */
function chromeRestingTone(onTheme: boolean) {
  return onTheme ? "opacity-60" : "text-muted-foreground"
}

/** Copy-to-clipboard control for a code surface.
 *
 *  Transparent at rest so it doesn't sit on the code as a visible chip; the
 *  ground arrives on hover, mixed against the block's own `--code-fg`/
 *  `--code-bg` (globals.css §8) rather than an app token, because a block
 *  carries its own light/dark palette independent of the page. Both vars are
 *  set once on the block's outer wrapper and inherited here, so this needs no
 *  colour prop of its own.
 *
 *  A floating button (no filename bar to sit in) also gets that ground at
 *  rest on a touch device — there's no hover to reveal it otherwise, so
 *  without a resting ground the glyph lands on top of whatever the first
 *  line happens to be. The two in-header buttons already sit on a bar and
 *  stay transparent until touched or hovered. */
function CopyButton({
  value,
  className,
  floating = false,
  onTheme = false,
}: {
  value: string
  className?: string
  /** Floats over the code with no header/figcaption underneath it. */
  floating?: boolean
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
        "bg-transparent hover:bg-[var(--copy-button-hover-bg)] active:bg-[var(--copy-button-hover-bg)]",
        // No hover on a phone, so only the floating button — the one with no
        // ground under it already — gets a resting chip there.
        floating && "[@media(hover:none)]:bg-[var(--copy-button-rest-bg)]",
        className
      )}
      style={
        // Only when the chrome rides the theme colour; otherwise the
        // muted/foreground classes own it.
        onTheme ? ({ color: "var(--code-fg)" } as React.CSSProperties) : undefined
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
}: {
  code: string
  language: string
  theme: PrismTheme
  showLineNumbers: boolean
}) {
  const lineNumberColor = theme.plain?.color
    ? `color-mix(in srgb, ${theme.plain.color} 35%, transparent)`
    : "rgba(128, 128, 128, 0.35)"

  return (
    <Highlight theme={theme} code={code.trim()} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          data-slot="code-pre"
          className={cn(
            className,
            // w-max so the block grows to the longest line, min-w-full so it
            // still fills the scroller when every line is short. Together they
            // give the rows below a width to stretch to.
            "relative w-max min-w-full py-3.5 outline-none",
            // Unitless leading rather than `leading-6`: it lands on the same
            // 24px at the default 14px, but a `text-*` override on the root
            // now scales the rows with the type instead of leaving them
            // pinned to a height the larger text overflows.
            "leading-[1.7143] font-normal"
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
              className="relative flex min-h-[1.7143em] w-max min-w-full"
            >
              {showLineNumbers && (
                // Sticky so the gutter survives a horizontal scroll; it paints
                // the block background so code scrolls *under* it, not through.
                <span
                  data-slot="code-gutter"
                  className="sticky left-0 z-10 w-16 flex-shrink-0 pr-6 pl-6 text-right font-medium tabular-nums select-none"
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
  scrollbar = true,
  expandable = false,
  defaultExpanded = false,
  collapsedHeight = "12rem",
  expandLabel = "Expand",
  style,
  ...props
}: CodeProps) {
  const [packageManager, setPackageManager] = React.useState<PackageManager>(
    defaultPackageManager
  )
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // A caller-supplied palette brings its own background; the built-in pair is
  // designed to sit flush with --card, so only that one defaults to the token.
  const paintFromTheme = useThemeBackground ?? Boolean(theme || adaptiveTheme)

  const pageSurfaceVars = { color: "var(--foreground)", backgroundColor: "var(--card)" }

  // `adaptiveTheme` is the one case that still varies by resolved theme, but
  // the choice is made by the `.dark` class (see `wrapperVars` below), not by
  // reading which theme is on screen — so `selectedTheme` itself never
  // branches on light vs. dark.
  //
  // Without the theme's ground, its plain colour can't be trusted against the
  // page surface either — a dark palette's near-white body text would land on
  // a light card. Tokens keep their colours; unstyled text falls back.
  const selectedTheme =
    theme && !paintFromTheme
      ? { ...theme, plain: { ...theme.plain, ...pageSurfaceVars } }
      : theme || builtinTheme

  // The palette's foreground/background, set once on the outer wrapper so the
  // copy button's resting/hover ground (globals.css §8) can mix against a
  // block's real surface instead of `transparent`. `adaptiveTheme` sets both
  // halves of every pair here too, and `.code-adaptive-theme` (also in §8)
  // is what lets `.dark` pick between them without JS.
  const wrapperVars: Record<string, string> = adaptiveTheme
    ? {
        "--code-fg-l": adaptiveTheme.light.plain?.color ?? "",
        "--code-fg-d": adaptiveTheme.dark.plain?.color ?? "",
        "--code-bg-l": adaptiveTheme.light.plain?.backgroundColor ?? "",
        "--code-bg-d": adaptiveTheme.dark.plain?.backgroundColor ?? "",
        ...Object.fromEntries(
          tokenGroups.flatMap(({ key, types }) => [
            [`--code-token-${key}-l`, resolveGroupColor(adaptiveTheme.light, types)],
            [`--code-token-${key}-d`, resolveGroupColor(adaptiveTheme.dark, types)],
          ])
        ),
      }
    : {
        "--code-fg": theme?.plain?.color ?? "var(--foreground)",
        "--code-bg": theme?.plain?.backgroundColor ?? "var(--card)",
      }

  // The code surface paints straight from `--code-bg`, so turning the theme
  // ground off has to move the variable itself — the header alone would leave
  // the two halves of the block on different surfaces. Inline vars outrank the
  // `.code-adaptive-theme` class rules, so this covers the adaptive pair too.
  if (!paintFromTheme) {
    wrapperVars["--code-fg"] = pageSurfaceVars.color
    wrapperVars["--code-bg"] = pageSurfaceVars.backgroundColor
  }

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
        data-slot="code"
        className={cn(
          "bg-card text-card-foreground border-border/60 overflow-hidden rounded-[var(--radius-bg,var(--radius,0.5rem))] border [background-clip:padding-box]",
          CODE_TEXT_SIZE,
          adaptiveTheme && "code-adaptive-theme",
          className
        )}
        style={{ ...(wrapperVars as React.CSSProperties), ...style }}
        {...props}
      >
        <div
          data-slot="code-header"
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
            <div
              role="tablist"
              aria-label="Package manager"
              data-slot="code-tablist"
              className="flex items-center"
            >
              {keys.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active === key}
                  data-state={active === key ? "active" : "inactive"}
                  data-slot="code-tab"
                  onClick={() => setPackageManager(key)}
                  className={cn(
                    "text-muted-foreground data-[state=active]:text-foreground h-7 rounded-[var(--radius-item,var(--radius,0.5rem))] px-2.5 font-medium transition-colors",
                    "outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
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
            onTheme={paintFromTheme}
          />
        </div>
        <div
          data-slot="code-body"
          className={cn("overflow-x-auto", !scrollbar && "scrollbar-hide")}
        >
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
                  data-slot="code-pre"
                  className={cn(
                    highlightClassName,
                    "w-full overflow-x-auto px-4 leading-relaxed font-normal"
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

  const highlighted = (
    <HighlightedCode
      code={actualCode}
      language={actualLanguage}
      theme={selectedTheme}
      showLineNumbers={showLineNumbers}
    />
  )

  return (
    <div
      data-slot="code"
      className={cn(
        "pointer-events-auto w-full max-w-full overflow-hidden",
        "border-border/60 border [background-clip:padding-box]",
        "rounded-[var(--radius-bg,var(--radius,0.5rem))]",
        CODE_TEXT_SIZE,
        adaptiveTheme && "code-adaptive-theme",
        className
      )}
      style={{ ...(wrapperVars as React.CSSProperties), ...style }}
      {...props}
    >
      {filename && (
        <figcaption
          data-slot="code-header"
          className={cn(
            "border-border/60 flex items-center justify-between border-b px-4 py-2.5",
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
            data-slot="code-filename"
            className={cn(
              "flex items-center gap-2",
              chromeRestingTone(paintFromTheme)
            )}
          >
            {/* The file badge is a solid shape where the name beside it is
                13px text, so at one shared colour it out-weighs the name it
                belongs to and pulls the eye off both the label and the copy
                button. The token stays the same; a notch of transparency is
                what evens the three optically. */}
            <span className="flex items-center opacity-70 [&_svg]:size-3.5">
              {getIconForFile(filename)}
            </span>
            <span className="font-medium tracking-tight">{filename}</span>
          </div>
          <div className="flex items-center gap-2">
            <CopyButton
              value={actualCode}
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
                floating
                onTheme={paintFromTheme}
              />
            </div>
          </div>
        )}

        {expandable ? (
          <div
            data-slot="code-body"
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
            data-slot="code-body"
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
            className="absolute inset-x-0 bottom-0 z-20 flex h-24 items-end justify-center rounded-b-[var(--radius-bg,var(--radius,0.5rem))] pb-4"
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
              data-slot="code-expand"
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
