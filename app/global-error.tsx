"use client";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    // This replaces the root layout when the root layout itself throws, so
    // none of its providers or fonts are mounted — it has to render its own
    // <html>/<body> with nothing but the design tokens from globals.css.
    <html lang="en">
      <body className="bg-background text-foreground flex min-h-screen items-center justify-center px-6">
        <div className="flex max-w-[420px] flex-col items-center gap-4 text-center">
          <h1 className="text-display font-semibold">
            Something went wrong
          </h1>
          <p className="text-prose text-muted-foreground">
            An unexpected error occurred. Try again, or reload the page.
          </p>
          {error.digest && (
            <p className="text-caption text-muted-foreground">Error ID: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="h-9 rounded-lg bg-foreground px-4 text-sm text-background cursor-pointer"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
