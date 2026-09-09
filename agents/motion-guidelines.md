# Motion Guidelines

The motion system every component in this project shares. It is CSS: three
duration tiers and one easing, declared as custom properties in
`app/globals.css` and shipped to consumers by the `motion` entry in
`registry.json`. There is no animation library — `framer-motion` was removed,
and nothing may reintroduce it or a replacement.

---

## The tiers

| Token | Value | Use for |
|---|---|---|
| `--motion-fast` | 80ms | Hover, focus rings, fades, selection indicators |
| `--motion-moderate` | 160ms | Short travel and small expansions — dropdown and tab indicators, tooltips, panels and sheets that must land exactly |
| `--motion-slow` | 240ms | Large surfaces: dialogs, side panels, stepped flows |

Each has a matching exit, one tier quicker, so a dismissal reads as crisp and
final rather than as the entrance replayed backwards:

| Enter | Exit | Value |
|---|---|---|
| `--motion-fast` | `--motion-fast-exit` | 60ms |
| `--motion-moderate` | `--motion-moderate-exit` | 120ms |
| `--motion-slow` | `--motion-slow-exit` | 160ms |

One easing for all of them, `--motion-ease`, also registered in Tailwind's theme
as `ease-spring`:

```css
--motion-ease: cubic-bezier(0.32, 0.72, 0, 1);
```

That curve is the settle of a critically damped spring, which is what these
tiers used to literally be. The old `slow` tier carried `bounce: 0.12` — a
damping ratio of 0.88, which overshoots by about 0.3%. Invisible. Nothing was
lost by dropping to one curve.

**Rule:** the bigger the thing that moves, the slower the tier. No component
invents its own duration — reach for a tier:

```tsx
<div className="transition-opacity duration-(--motion-moderate) ease-spring" />
```

An element whose exit runs quicker than its entrance says so on the exit state:

```tsx
className="… data-[ending-style]:duration-(--motion-moderate-exit)"
```

The one standing exception is `duration-80` on font-weight transitions (see
below), which predates the tiers and matches `--motion-fast` exactly.

## Entering and leaving without a library

Three cases, in order of preference.

**1. The element is always in the DOM.** Put the animated value in a class or an
inline style keyed on a `data-*` attribute and let the browser interpolate.
Nothing else is needed.

**2. A Base UI primitive renders it** — anything built on `@base-ui/react`:
Popover, Menu, Tooltip, Dialog, Drawer. Base UI keeps
the element mounted for the duration of a CSS transition and unmounts it when
the transition ends, so it replaces `AnimatePresence` outright:

```tsx
<Menu.Popup
  className={cn(
    "origin-(--transform-origin) transition-[opacity,transform]",
    "duration-(--motion-fast) ease-spring",
    "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
    "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
    "data-[ending-style]:duration-(--motion-fast-exit)",
    "data-[instant]:duration-0",
  )}
/>
```

Do **not** hand Base UI an `actionsRef` and call `unmount()` yourself. That API
exists for *externally controlled* closing animations; with a real CSS
transition the primitive detects the end itself.

**3. Our own conditional.** Keep the element mounted and drive it from a
`data-*` attribute, using `transition-discrete` (`transition-behavior:
allow-discrete`) and the `starting:` variant (`@starting-style`) so it can fade
in from `display: none`:

```tsx
<div
  data-open={open}
  inert={!open || undefined}
  className={cn(
    "hidden opacity-0 transition-[opacity,display] transition-discrete",
    "duration-(--motion-fast) ease-spring",
    "data-[open=true]:block data-[open=true]:opacity-100",
    "starting:data-[open=true]:opacity-0",
  )}
/>
```

`inert` on the closed state is not optional. An element that stays in the DOM
faded out is still tabbable and still announced without it.

An animation that must **restart** rather than retarget — the settings toast's
press dip — is a keyframe animation on a remounted node. A transition cannot
restart itself mid-flight; see `lib/docs/settings-toast.tsx`.

## Reduced motion

`prefers-reduced-motion` is handled once, in section 7 of `app/globals.css`,
which zeroes every tier:

```css
@media (prefers-reduced-motion: reduce) {
  :root { --motion-fast: 0ms; /* … */ }
}
```

Every transition stays in place and still fires `transitionend`; it just lands
instantly. **Do not write a per-component guard.** There is no `useReducedMotion`
in this repo and there should not be one again — a JS guard has to be
remembered at every call site, and an installed component cannot rely on a
consumer having wrapped their app in anything.

This is strictly better than what it replaces. The old `MotionConfig
reducedMotion="user"` only neutralised transform and layout animations, so a
component that moved by animating `top` / `left` / `width` / `height` was
silently *not* reduced. Zeroing the durations covers every property.

The old advice to prefer `transform` over layout properties still holds, but now
only for the reason that actually survives: transform and opacity stay on the
compositor, so they keep moving while the main thread is busy. That is why the
Tabs indicator animates `translate` and not `left` — a panel that is fetching
data must not be able to stall the indicator that sent it there.

### Never stack two measured-height collapses

A wrapper that pins its height to a ResizeObserver-measured value and animates
to it — `SidebarGroup`, `SidebarMenuSub` — must transition only when **it**
toggles. When the measured height changes underneath it because a child
collapsed, it has to snap (`transition-none`).

Animate on a re-measure and the outer wrapper chases a target that moves every
frame: it lags its own child, then needs a full settle *after* the child has
landed, dragging everything below it along late. Measured on the sidebar
playground before the guard, collapsing a sub-menu inside a collapsible group:
the sub-menu finished in 218ms, the group's wrapper in 326ms, diverging by ~80px
mid-flight. With the snap, both land within one frame. Every nesting level
multiplies it, which is what makes a deep tree feel sludgy.

## Weight without reflow

State changes (selected / checked / active / open) make text heavier, and a
heavier weight is wider. Animate that on a bare text node and the layout
reflows. Use the **ghost-span pattern** — an invisible copy of the label at the
heaviest weight reserves the width while the visible copy animates
`font-variation-settings`. Each `fontWeights` token (`@/lib/font-weight`) also
pairs a tighter optical size with the heavier weight so the advance width barely
changes. The full pattern and rules live in
[`component-documentation-guidelines.md`](component-documentation-guidelines.md#animated-font-weight--the-ghost-span-pattern).

## Where each speed shows up

Which component *leads* with which tier. Add to a cell when you add a
component, and remove from one when you delete a component — a table naming
things that no longer exist is how this one went stale.

| fast (80ms) | moderate (160ms) | slow (240ms) |
|---|---|---|
| Hover and focus rings, Toast press, Copy button | Tabs indicator, Tooltip, Mobile nav panel, Sidebar collapse | Right properties panel |

Most components also use `fast` for their hover and focus states on top of their
headline tier — the table lists each component once, by its headline motion.

---

## When you add (or change) a component

Part of the [new-component checklist](component-documentation-guidelines.md#checklist-for-a-new-component):

1. **Pick a tier** by the size of the headline motion: a small state flip →
   `fast`; a panel or indicator that travels → `moderate`; a surface that takes
   over the view → `slow`.
2. **Use the token**, never a hand-written duration:
   `duration-(--motion-moderate) ease-spring`.
3. **Exit one tier quicker** — `duration-(--motion-moderate-exit)` on the
   leaving state.
4. **Move with `transform` / `opacity`** where you can, so the motion survives a
   busy main thread.
5. **No `prefers-reduced-motion` guard.** It is handled globally.
6. **No JS animation.** No library, no `requestAnimationFrame` tweening, no
   per-frame React state. Writing a measured pixel value to a CSS custom
   property in a pointer handler is fine and is the house pattern; re-rendering
   to animate is not.
7. **Animated weight?** Follow the ghost-span pattern (link above).
8. **Update the table above** so the map stays complete.
9. If you changed a tier's value, re-check every duration quoted in this file
   and in `registry.json`'s `motion` entry.
