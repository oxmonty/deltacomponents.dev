import { fontWeights } from "@/registry/default/lib/font-weight";
import { ScrollArea } from "@/registry/base/scroll-area";

/** Renders `backtick` spans in a description as real inline code. Descriptions
 *  are plain strings, not markdown, so without this the backticks show up
 *  literally — which is exactly where a prop description most wants code
 *  styling, since it is usually naming another prop or a literal value. */
function withInlineCode(text: string) {
  return text.split(/`([^`]+)`/).map((part, i) =>
    i % 2 === 1 ? <code key={i}>{part}</code> : part
  );
}

export interface PropDef {
  name: string;
  type: string;
  default?: string;
  description: string;
}

interface PropsTableProps {
  props: PropDef[];
}

export function PropsTable({ props }: PropsTableProps) {
  // Horizontal ScrollArea gives narrow viewports the shape-system scrollbar +
  // a scroll-fade-x edge; min-w keeps columns legible before it scrolls.
  // Drop the Default column when nothing has a default (e.g. token references,
  // or a table where every prop is required) — an all-"—" column is noise.
  const showDefault = props.some((prop) => prop.default !== undefined);

  return (
    <ScrollArea
      orientation="horizontal"
      viewportClassName="scroll-fade-x"
      className="w-full"
    >
      {/* Cell rhythm follows the www tables: px-3 py-2, a hairline under every
          row, headers left and semibold, cells top-aligned so a long
          description doesn't drag its neighbours down with it.
          Set at the site's dense size, well below prose: a table is scanned
          across columns rather than read in lines, and the smaller face both
          fits more of a description on one row and keeps the table from
          reading as body copy that happens to have rules in it. One step down
          (`subtitle`, a single pixel) was not enough to separate them — a
          narrow description column wraps more, and the denser block then reads
          as the LARGER text of the two. */}
      <table className="w-full min-w-[520px] border-collapse text-body [&_th:first-child]:pl-0 [&_td:first-child]:pl-0">
        <thead>
          <tr className="border-b border-border">
            {["Prop", "Type", ...(showDefault ? ["Default"] : []), "Description"].map(
              (heading) => (
                <th
                  key={heading}
                  className="px-3 py-2 text-left text-foreground"
                  style={{ fontVariationSettings: fontWeights.semibold }}
                >
                  {heading}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name} className="border-b border-border/40">
              {/* Real <code>, not a mono utility: the name, type and default
                  ARE code, so they pick up the same inline treatment they
                  would get written as `backticks` in a description. */}
              <td className="px-3 py-2 align-top">
                <code>{prop.name}</code>
              </td>
              <td className="px-3 py-2 align-top">
                <code>{prop.type}</code>
              </td>
              {showDefault && (
                <td className="px-3 py-2 align-top">
                  {prop.default === undefined ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <code>{prop.default}</code>
                  )}
                </td>
              )}
              <td className="px-3 py-2 align-top text-muted-foreground">
                {withInlineCode(prop.description)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  );
}
