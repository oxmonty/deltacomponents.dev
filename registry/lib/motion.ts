/**
 * Reading a motion tier from JS.
 *
 * The tiers themselves are CSS custom properties — `--motion-fast`,
 * `--motion-moderate`, `--motion-slow` and their `-exit` pairs — declared in
 * `app/globals.css` and shipped by the `motion` entry in `registry.json`.
 * Animations use them directly, through `duration-(--motion-moderate)` and
 * friends. Nothing here is needed for that.
 *
 * This exists for the handful of places that need a JS *timer* sized to a
 * transition: a piece of state that has to be held for exactly as long as
 * something is moving. Reading the token rather than restating its value is
 * the point — a hardcoded number is how the timings drifted apart before they
 * were tokenised, and reading the live property means reduced motion (which
 * zeroes every tier) zeroes the timer with it.
 *
 * If you are reaching for this to drive an animation, stop: write a CSS
 * transition instead.
 */

/** A tier's length in milliseconds. `fallback` covers the server, where there
 *  is no computed style to read. */
export function motionMs(token: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
  if (!raw) return fallback;
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) return fallback;
  // The tokens are written in ms; seconds are accepted so a consumer who
  // redefines a tier as `0.2s` doesn't get a 0.2 millisecond timer.
  return raw.endsWith("ms") ? value : value * 1000;
}

/** A timer that must outlast a transition rather than match it — the tier plus
 *  a margin, so a throttled or backgrounded tab that paints late still clears
 *  the state it was holding. */
export function motionHoldMs(token: string, fallback: number): number {
  return motionMs(token, fallback) + 100;
}
