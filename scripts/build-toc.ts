/**
 * Builds every page's table of contents at build time, the way www's MDX
 * pipeline does — so the list ships inside the server-rendered HTML instead of
 * being discovered from the DOM after hydration.
 *
 * Reading it from the DOM was what made the panel flicker: the effect that
 * scanned for headings could only run after the first paint, so the page
 * painted without a table of contents and then grew one, shoving everything
 * below it down the rail.
 *
 * MDX gets this for free because the headings are content. Our pages are TSX,
 * so the headings live in JSX and this walks the syntax tree for them. It reads
 * exactly the three components that render an anchored heading — DocSection,
 * DocSubSection and AnchoredHeading — plus the Installation heading DocPage
 * injects ahead of a page's own children.
 *
 * Anything it cannot resolve to a literal is a hard error rather than a
 * silently missing entry, so a heading built from a variable fails the build
 * instead of quietly dropping out of the panel.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

import { headingId, type TocEntry } from "../lib/docs/heading-id";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "app");
const OUT_FILE = join(ROOT, "lib", "docs", "toc.generated.ts");

/** Every `page.tsx` under app/, with the route it serves. Route groups and
 *  private folders are skipped the way Next skips them. */
function pageFiles(dir: string, route = ""): { file: string; route: string }[] {
  const found: { file: string; route: string }[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name === "page.tsx") {
      found.push({ file: join(dir, entry.name), route: route || "/" });
      continue;
    }
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("_") || entry.name.startsWith("(")) continue;
    if (entry.name === "api") continue;
    found.push(...pageFiles(join(dir, entry.name), `${route}/${entry.name}`));
  }
  return found;
}

function attribute(
  element: ts.JsxOpeningLikeElement,
  name: string
): ts.JsxAttribute | undefined {
  return element.attributes.properties.find(
    (property): property is ts.JsxAttribute =>
      ts.isJsxAttribute(property) && property.name.getText() === name
  );
}

/** A prop's value when it is a plain string — `title="Basic"` or
 *  `title={"Basic"}`. Anything else returns undefined and is reported. */
function stringAttribute(
  element: ts.JsxOpeningLikeElement,
  name: string
): string | undefined {
  const initializer = attribute(element, name)?.initializer;
  if (!initializer) return undefined;
  if (ts.isStringLiteral(initializer)) return initializer.text;
  if (
    ts.isJsxExpression(initializer) &&
    initializer.expression &&
    ts.isStringLiteralLike(initializer.expression)
  ) {
    return initializer.expression.text;
  }
  return undefined;
}

/** `showInstall={false}` — the only boolean prop that changes the TOC. */
function isExplicitlyFalse(
  element: ts.JsxOpeningLikeElement,
  name: string
): boolean {
  const initializer = attribute(element, name)?.initializer;
  return Boolean(
    initializer &&
      ts.isJsxExpression(initializer) &&
      initializer.expression?.kind === ts.SyntaxKind.FalseKeyword
  );
}

function tagNameOf(element: ts.JsxOpeningLikeElement): string {
  return element.tagName.getText();
}

/** The literal text of a heading element's children. */
function textOf(element: ts.JsxElement, file: string): string {
  const text = element.children
    .map((child) => (ts.isJsxText(child) ? child.text : ""))
    .join("")
    .trim();

  if (!text) {
    const { line } = element
      .getSourceFile()
      .getLineAndCharacterOfPosition(element.getStart());
    throw new Error(
      `${relative(ROOT, file)}:${line + 1} — <${tagNameOf(element.openingElement)}> ` +
        `has no literal text. The table of contents is built from source, so a ` +
        `heading whose text comes from a variable cannot be read. Write the ` +
        `text inline, or give the component a literal \`title\` prop.`
    );
  }
  return text;
}

function entryFor(
  element: ts.JsxOpeningLikeElement,
  text: string,
  depth: 2 | 3
): TocEntry | null {
  const id = stringAttribute(element, "id") ?? headingId(text);
  return id ? { id, text, depth } : null;
}

/** Walks one page in source order, so entries come out in reading order. */
function tocForPage(file: string): TocEntry[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TSX
  );

  const entries: TocEntry[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const tag = tagNameOf(node);

      // DocPage injects its Installation block above the page's own children,
      // so it has to lead — see lib/docs/DocPage.tsx.
      if (tag === "DocPage") {
        const slug = stringAttribute(node, "slug");
        if (slug && !isExplicitlyFalse(node, "showInstall")) {
          entries.push({ id: "installation", text: "Installation", depth: 2 });
        }
      }

      if (tag === "DocSection" || tag === "DocSubSection") {
        const title = stringAttribute(node, "title");
        if (!title) {
          const { line } = source.getLineAndCharacterOfPosition(node.getStart());
          throw new Error(
            `${relative(ROOT, file)}:${line + 1} — <${tag}> needs a literal ` +
              `\`title\` for the table of contents to be built from source.`
          );
        }
        const entry = entryFor(node, title, tag === "DocSection" ? 2 : 3);
        if (entry) entries.push(entry);
      }
    }

    if (ts.isJsxElement(node) && tagNameOf(node.openingElement) === "AnchoredHeading") {
      const depth = stringAttribute(node.openingElement, "as") === "h3" ? 3 : 2;
      const entry = entryFor(node.openingElement, textOf(node, file), depth);
      if (entry) entries.push(entry);
    }

    ts.forEachChild(node, visit);
  };

  visit(source);
  return entries;
}

export function collectToc(): Record<string, TocEntry[]> {
  const toc: Record<string, TocEntry[]> = {};
  for (const { file, route } of pageFiles(APP_DIR).sort((a, b) =>
    a.route.localeCompare(b.route)
  )) {
    const entries = tocForPage(file);
    // A page with one heading or none has nothing worth listing.
    if (entries.length > 1) toc[route] = entries;
  }
  return toc;
}

export function renderModule(toc: Record<string, TocEntry[]>): string {
  const body = Object.entries(toc)
    .map(([route, entries]) => {
      const lines = entries
        .map(
          (entry) =>
            `    { id: ${JSON.stringify(entry.id)}, text: ${JSON.stringify(entry.text)}, depth: ${entry.depth} },`
        )
        .join("\n");
      return `  ${JSON.stringify(route)}: [\n${lines}\n  ],`;
    })
    .join("\n");

  return `// Generated by scripts/build-toc.ts — do not edit by hand.
// Run \`make toc\` after adding or renaming a section. \`make dev\` and
// \`make build\` regenerate it, and \`make test\` fails if it has drifted.
import type { TocEntry } from "@/lib/docs/heading-id";

/** Every page's headings, in reading order, keyed by route. */
export const TOC: Record<string, TocEntry[]> = {
${body}
};
`;
}

if (process.argv[1]?.includes("build-toc")) {
  const toc = collectToc();
  writeFileSync(OUT_FILE, renderModule(toc));
  const pages = Object.keys(toc).length;
  const headings = Object.values(toc).reduce((n, e) => n + e.length, 0);
  console.log(`✔ Table of contents: ${headings} headings across ${pages} pages.`);
}
