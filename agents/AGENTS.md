# Agent guide

Start here, then read the guide that matches what you are about to change.
`README.md` at the repo root covers setup, commands, and the design system.

| Guide | Read it before |
| --- | --- |
| [component-documentation-guidelines.md](/agents/component-documentation-guidelines.md) | Adding a component — its source, registry entry and props |
| [component-docs skill](/.claude/skills/component-docs/SKILL.md) | Writing or restructuring a doc page under `app/docs/` |
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
  preview in `app/components/bento-previews.tsx`, and a page under `app/docs/`.
- **`components/ui/` is the site's own.** Not published, not in the registry —
  chrome the docs site needs for itself.
- **Run `make registry` after touching `registry.json`** or any file it lists,
  and commit the regenerated `public/r`.
- **`make check` is what CI runs** — lint, typecheck, test. Green before you
  hand anything back.
