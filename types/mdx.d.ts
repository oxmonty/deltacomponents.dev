/** Our own declaration for `*.mdx`, replacing `@types/mdx`.
 *
 *  That package declares the module with a default export and nothing else,
 *  and a wildcard module declaration cannot be augmented — so a second one
 *  adding `frontmatter` is ignored. Declaring it once, here, is the only way
 *  to see the named export remark-mdx-frontmatter attaches. */
declare module "*.mdx" {
  /** The page's own YAML block. Only `description` is carried in content: a
   *  page's title, order and status live in `componentList`, where the
   *  sidebar and showcase read them. */
  export const frontmatter: { description: string };

  const MDXContent: (props: {
    components?: Record<string, unknown>;
  }) => import("react").JSX.Element;
  export default MDXContent;
}
