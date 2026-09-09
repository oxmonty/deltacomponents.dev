import type { PrismTheme } from "prism-react-renderer";

/** The code palette from patrickprunty.com, ported from its Shiki theme.
 *
 *  That theme is always dark on a light page — the block reads as its own
 *  surface rather than as part of the prose — so it is passed as `theme`
 *  (one fixed palette) rather than `adaptiveTheme` (a light/dark pair).
 *
 *  Shiki themes key off TextMate scopes and Prism off token types, so the
 *  mapping is by role, not name: keywords blue, callables and numbers amber,
 *  strings and types green, punctuation and variables left in the body colour. */
export const PATRICK_DARK: PrismTheme = {
  plain: { color: "#eeeee3", backgroundColor: "#111111" },
  styles: [
    {
      types: ["comment", "prolog", "cdata"],
      style: { color: "#6f6f68", fontStyle: "italic" },
    },
    {
      // The reference keeps braces, dots, semicolons and operators unaccented.
      types: ["punctuation", "operator", "variable", "property", "namespace"],
      style: { color: "#eeeee3" },
    },
    {
      types: ["keyword", "storage", "atrule", "important", "symbol"],
      style: { color: "#7388f7" },
    },
    {
      types: ["function", "function-variable", "number", "constant", "boolean"],
      style: { color: "#f5bb5f" },
    },
    {
      types: [
        "string",
        "char",
        "attr-value",
        "attr-name",
        "class-name",
        "builtin",
        "regex",
        "selector",
        "inserted",
      ],
      style: { color: "#bad688" },
    },
  ],
};

/** The Pierre "Vibrant" palette from interfaces.dev, ported from its Shiki
 *  theme (the source colours were display-p3, converted to sRGB hex).
 *
 *  Unlike {@link PATRICK_DARK} this one ships as a light/dark pair, so it is
 *  passed as `adaptiveTheme` and follows the site theme.
 *
 *  Mapping is approximate where Prism's grammar is coarser than Shiki's: the
 *  `=` in a JSX expression comes through as `script-punctuation` (cyan),
 *  ternary and other operators carry the pink accent, and structural
 *  punctuation stays neutral. */
export const PIERRE_LIGHT: PrismTheme = {
  plain: { color: "#3c3c3c", backgroundColor: "#ffffff" },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "#636363", fontStyle: "italic" },
    },
    { types: ["punctuation"], style: { color: "#636363" } },
    { types: ["script-punctuation"], style: { color: "#00cdff" } },
    { types: ["operator"], style: { color: "#e81861" } },
    {
      types: ["tag", "class-name", "maybe-class-name"],
      style: { color: "#b81cd7" },
    },
    {
      types: ["keyword", "builtin", "function", "function-variable"],
      style: { color: "#b81cd7" },
    },
    { types: ["attr-name"], style: { color: "#00ad69" } },
    {
      types: ["string", "attr-value", "char", "inserted", "regex", "url"],
      style: { color: "#00a836" },
    },
    {
      types: ["number", "boolean", "constant", "symbol"],
      style: { color: "#00a6d5" },
    },
    // Bare identifiers inside a JSX `{…}` expression carry the `script`
    // ancestor type; leaf types (number/string/operator) still win, so only
    // the variables pick up orange.
    {
      types: ["script", "property", "literal-property", "variable", "parameter"],
      style: { color: "#e87a18" },
    },
  ],
};

export const PIERRE_DARK: PrismTheme = {
  plain: { color: "#c9c9c9", backgroundColor: "#1e1e1e" },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "#8a8a8a", fontStyle: "italic" },
    },
    { types: ["punctuation"], style: { color: "#8a8a8a" } },
    { types: ["script-punctuation"], style: { color: "#00cdff" } },
    { types: ["operator"], style: { color: "#ff6691" } },
    {
      types: ["tag", "class-name", "maybe-class-name"],
      style: { color: "#e368fb" },
    },
    {
      types: ["keyword", "builtin", "function", "function-variable"],
      style: { color: "#e368fb" },
    },
    { types: ["attr-name"], style: { color: "#49da96" } },
    {
      types: ["string", "attr-value", "char", "inserted", "regex", "url"],
      style: { color: "#48d565" },
    },
    {
      types: ["number", "boolean", "constant", "symbol"],
      style: { color: "#4bd2ff" },
    },
    {
      types: ["script", "property", "literal-property", "variable", "parameter"],
      style: { color: "#ffab5c" },
    },
  ],
};

/** The pair in the shape `Code`'s `adaptiveTheme` expects. */
export const PIERRE: { light: PrismTheme; dark: PrismTheme } = {
  light: PIERRE_LIGHT,
  dark: PIERRE_DARK,
};
