# Agent guide

Start here, then read the guide that matches what you are about to change.
`README.md` at the repo root covers setup, commands, and the design system.

| Guide | Read it before |
| --- | --- |
| [add-component skill](/.claude/skills/add-component/SKILL.md) | Adding a component — the end-to-end checklist, registry entry included |
| [component-docs skill](/.claude/skills/component-docs/SKILL.md) | Writing or restructuring a doc page under `content/docs/`, or adding a demo |
| [component-documentation-guidelines.md](/agents/component-documentation-guidelines.md) | The long-form mechanics — props tables, the ghost-span pattern, file locations |
| [motion-guidelines.md](/agents/motion-guidelines.md) | Adding or changing any animation |

## Ground rules

- **Site identity lives in `lib/config.ts`.** Name, URL, repo, author, socials.
  Never hardcode a domain, repo slug, or author name anywhere else.
- **Design tokens live in `app/globals.css`** — light values on `:root`, dark
  overrides on `.dark`. Not `light-dark()`: the build's polyfill silently drops
  those declarations (see the comment at the top of section 1).
- **Motion is CSS.** Three duration tiers and one easing, as custom properties.
  There is no animation library in this repo and nothing may add one.
- **Two registry tiers.** `registry/base/` is primitive-backed (Base UI),
  `registry/default/` is primitive-agnostic. A new component goes in one of
  them, gets an entry in `registry.json`, a slug in `lib/docs/components.ts`, a
  preview in `app/components/bento-previews.tsx`, and a page under
  `content/docs/`. See the add-component skill for the full order.
- **Doc pages are MDX.** `content/docs/<slug>.mdx` for the body,
  `content/demos/<slug>/` for its demos, `content/docs/<slug>.props.ts` for the
  prop tables. One route renders them all — there is no page component to write.
- **`lib/docs/*.generated.ts` is generated.** `make demos` after touching
  `content/demos/`, `make toc` after adding or renaming a heading. `make test`
  fails if either has drifted.
- **`components/ui/` holds path shims, not components.** A published component
  imports the path its files land at in a *consumer's* project
  (`@/components/ui/sidebar-core`), so this directory forwards those names to
  `registry/` to make them resolve here. One-line re-exports only. The docs
  site's own chrome lives in `lib/docs/`.
- **Run `make registry` after touching `registry.json`** or any file it lists,
  and commit the regenerated `public/r`.
- **`make check` is what CI runs** — lint, typecheck, test. Green before you
  hand anything back.
