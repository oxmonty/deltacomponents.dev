# Delta Components

An open source React component library and docs site. Components are
distributed through a [shadcn](https://ui.shadcn.com) registry, so you install
the source into your project rather than adding a dependency.

Built on [Base UI](https://base-ui.com) primitives, Tailwind CSS v4, and
framer-motion.

## Getting started

```bash
bun install
make dev
```

The site runs at http://localhost:4001. `make` on its own lists every target.

| Route | What's there |
| --- | --- |
| `/` | Showcase — a card per component |
| `/docs` | Introduction, install instructions, icon setup |
| `/docs/<slug>` | One page per component |

## Installing a component

```bash
npx shadcn@latest add https://deltacomponents.dev/r/button.json
```

Dependencies and shared utilities resolve automatically. The font weight
animations need the Inter variable font, which ships in `public/fonts`.

## Adding a component

1. Write the source in `registry/ui/<name>.tsx`.
2. Add an entry to `registry.json` pointing at the file, with its npm
   `dependencies` and `registryDependencies`.
3. Add the slug to `componentList` in `lib/docs/components.ts` — this drives
   the sidebar, the showcase grid, and prev/next navigation.
4. Add a preview to `app/components/bento-previews.tsx` under the same slug.
5. Write the doc page at `app/docs/<slug>/page.tsx`.
6. `make registry` to regenerate `public/r`, and commit the output.

Agent-facing guides live in `agents/` (root `CLAUDE.md` symlinks to
`agents/AGENTS.md`): `agents/component-documentation-guidelines.md` for the doc
page structure, `agents/motion-guidelines.md` for the spring and animation
rules.

## Design system

Every design token (surfaces, shadows, type scale, spacing) is defined once in
`app/globals.css`. Colors are written as `light-dark(light, dark)` and resolved
by `color-scheme`, so there is a single source of truth per token across both
themes.

Three React contexts change how components render at runtime, wired to the
site's right panel:

| Context | Controls | Shortcut |
| --- | --- | --- |
| `ThemeProvider` | system / light / dark | `T` |
| `ShapeProvider` | rounded / pill corners | `R` |
| `SizeProvider` | default (36px) / compact (28px) ladder | `S` |

The right panel's icon-library switcher (`I`) is a preview tool for this site
only. Installed components ship with Lucide defaults and accept overrides
through `IconProvider`.

## Scripts

Run these through `make`, or with `bun run <script>` directly.

| Target | Does |
| --- | --- |
| `make dev` | Next.js dev server (Turbopack) |
| `make build` | Production build |
| `make start` | Build, then serve the production build |
| `make lint` | ESLint |
| `make typecheck` | `tsc --noEmit` |
| `make test` | Vitest |
| `make check` | Everything CI runs: lint, typecheck, test |
| `make registry` | Regenerate `public/r` from `registry.json` |

## Credits

Built by [Patrick Prunty](https://patrickprunty.com). MIT licensed — see
`LICENSE` for the full notice.
