# 𝚫 Delta Components

A curated collection of UI components I've refined over the years, the ones
that make the difference. Free and open source via the shadcn registry.

## Documentation

Visit [deltacomponents.dev](https://www.deltacomponents.dev) to view the full
documentation.

## Getting started

```bash
bun install
make dev
```

The site runs at http://localhost:4001. `make` on its own lists every target,
and `make check` is what CI runs.

## Contributing

Please read the
[contribution guidelines](https://www.deltacomponents.dev/docs/contributing).

Before a component ships or after a bug report, run a QA pass on it. In
Claude Code, with [Claude in Chrome](https://claude.com/chrome) enabled so the
live site can be screenshotted:

```
/qa-component <slug>
```

It drives the component through its edge cases with Playwright, confirms
each root cause against the code, and publishes a findings page with repro
steps and screenshots to hand to whoever fixes it. The skill lives in
`.agents/skills/qa-component/`.

## Inspiration

Delta Components took inspiration from [Fluid Functionalism](https://fluidfunctionalism.com) and its use of layout and color palette — another shadcn registry worth checking out.

## License

Licensed under the [MIT license](LICENSE).
