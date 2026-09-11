import path from "node:path";
import { defineConfig } from "vitest/config";

// No test previously imported a .tsx file with real JSX in it, so Vite's
// oxc transform never needed to strip JSX (it otherwise inherits tsconfig's
// `jsx: "preserve"`, which Next's own compiler handles instead) or resolve
// the `@/*` alias `tsconfig.json` declares for the app.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  oxc: {
    jsx: { runtime: "automatic" },
  },
});
