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
