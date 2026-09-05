# Agent guide

Start here, then read the guide that matches what you are about to change.
`README.md` at the repo root covers setup, commands, and the design system.

| Guide | Read it before |
| --- | --- |
| [component-documentation-guidelines.md](component-documentation-guidelines.md) | Adding a component or writing its doc page |
| [motion-guidelines.md](motion-guidelines.md) | Adding or changing any animation |

`metadata-templates/AGENTS.md` is not listed here on purpose — it documents the
contract for that one directory and has to sit next to the files it describes.

## Ground rules

- **Site identity lives in `lib/config.ts`.** Name, URL, repo, author, socials.
  Never hardcode a domain, repo slug, or author name anywhere else.
- **Design tokens live in `app/globals.css`**, written as
  `light-dark(light, dark)`. One source of truth per token across both themes.
- **Two registry tiers.** `registry/base/` is primitive-backed (Base UI),
  `registry/default/` is primitive-agnostic. A new component goes in one of
  them, gets an entry in `registry.json`, a slug in `lib/docs/components.ts`, a
  preview in `app/components/bento-previews.tsx`, and a page under `app/docs/`.
- **Run `make registry` after touching `registry.json`** and commit the
  regenerated `public/r`.
- **`make check` is what CI runs** — lint, typecheck, test. Green before you
  hand anything back.
