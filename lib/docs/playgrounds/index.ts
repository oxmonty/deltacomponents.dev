import { ButtonPlayground } from "./button";
import type { PlaygroundComponent } from "./types";

export type { PlaygroundParts, PlaygroundProps, PlaygroundComponent } from "./types";

// One entry per component slug. Registering a playground here makes the doc
// page render the shared module (preview + right-rail controls). To add one:
// create lib/docs/playgrounds/<slug>.tsx following the PlaygroundProps
// render-prop contract, register it below, and compose it in the doc page's
// Playground section.
export const playgroundMap: Record<string, PlaygroundComponent> = {
  button: ButtonPlayground,
};
