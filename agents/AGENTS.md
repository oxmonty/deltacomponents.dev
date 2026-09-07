# Agent guide

Start here, then read the guide that matches what you are about to change.
`README.md` is a short front door — what this is, where the docs live, how to
start it. Setup and commands are `make` (run it bare for the list); the design
system is `app/globals.css`, the single source of truth for every token.

| Guide | Read it before |
| --- | --- |
| [add-component skill](/agents/skills/add-component/SKILL.md) | Adding a component — the end-to-end checklist, registry entry included |
| [component-docs skill](/agents/skills/component-docs/SKILL.md) | Writing or restructuring a doc page under `content/docs/`, or adding a demo |
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
- **`registry/` is exactly what the site documents.** Its layout mirrors where
  the CLI files things: `registry/ui/` → the consumer's `components/ui/`,
  `registry/lib/` → their `lib/`. Everything in it is either a documented
  component or a module one of them installs — nothing else belongs there.
  Base UI is the default and needs no separate tier.
- **A new component** goes in `registry/ui/`, gets an entry in `registry.json`,
  a slug in `lib/docs/components.ts`, a preview in
  `app/components/bento-previews.tsx`, and a page under `content/docs/`. See
  the add-component skill for the full order.
- **The site's own components live in `app/components/`** — `ui/` for the
  primitives it uses (sidebar, scroll-area, badge), the rest for page chrome.
  They are not published and need no registry entry.
- **Doc pages are MDX.** `content/docs/<slug>.mdx` for the body,
  `content/demos/<slug>/` for its demos, `content/docs/<slug>.props.ts` for the
  prop tables. One route renders them all — there is no page component to write.
- **`lib/docs/*.generated.ts` is generated.** `make demos` after touching
  `content/demos/`, `make toc` after adding or renaming a heading. `make test`
  fails if either has drifted.
- **Registry source imports the real path.** A component that depends on a
  sibling imports `@/registry/...` like anything else here; `make registry`
  rewrites those to the paths `shadcn add` writes to, from `registry.json`'s
  targets and `components.json`'s aliases. Never write a consumer path
  (`@/lib/utils`, `@/components/ui/button`) in source — there are no shim
  directories left to make it resolve. The docs site's own chrome is in
  `lib/docs/`.
- **Run `make registry` after touching `registry.json`** or any file it lists,
  and commit the regenerated `public/r`.
- **`make check` is what CI runs** — lint, typecheck, test. Green before you
  hand anything back.
