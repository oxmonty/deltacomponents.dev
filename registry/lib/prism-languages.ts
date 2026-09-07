/**
 * Register additional Prism grammars on the shared instance used by
 * ``prism-react-renderer``.
 *
 * ``prism-react-renderer`` ships with a small built-in set (JS/TS,
 * Python, Go, Rust, JSON, YAML, CSS/HTML, SQL, Swift, Kotlin, etc.)
 * and silently falls back to a plain-text render for anything not on
 * that list. Each language-component file from ``prismjs/components``
 * self-registers on ``globalThis.Prism`` as a side effect of being
 * imported — so we expose the renderer's Prism instance there once,
 * then ``require`` each grammar we want to support.
 *
 * Importing this module anywhere in the app is enough; the
 * registrations are global and idempotent. Keep this file
 * side-effect-only: no exports, no React, no SSR-unsafe globals.
 */

import { Prism } from "prism-react-renderer";

// ``prismjs`` grammars read from ``global.Prism`` (Node) or
// ``window.Prism`` (browser). ``globalThis`` resolves to whichever is
// available, so this works on both the server and the client.
(globalThis as typeof globalThis & { Prism?: typeof Prism }).Prism = Prism;

// Each ``require`` mutates ``globalThis.Prism.languages`` and returns
// nothing useful — the side effect is the point. Using ``require``
// rather than ``import`` because the grammar files are CommonJS and
// expect a synchronous registration order.
/* eslint-disable @typescript-eslint/no-require-imports */
// ``prism-markup-templating`` defines ``Prism.languages.markup-templating``
// and helpers (``tokenizePlaceholders``) that PHP / Smarty / Twig /
// EJS / ERB grammars look up at registration time. It must load
// **before** any of those.
require("prismjs/components/prism-markup-templating");
require("prismjs/components/prism-bash");
require("prismjs/components/prism-diff");
require("prismjs/components/prism-docker");
require("prismjs/components/prism-ini");
require("prismjs/components/prism-java");
require("prismjs/components/prism-nginx");
require("prismjs/components/prism-php");
require("prismjs/components/prism-powershell");
require("prismjs/components/prism-ruby");
require("prismjs/components/prism-toml");
/* eslint-enable @typescript-eslint/no-require-imports */
