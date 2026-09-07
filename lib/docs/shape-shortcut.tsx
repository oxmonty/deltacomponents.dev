"use client";

import { useShapeContext, shapeMap, type ShapeVariant } from "@/lib/docs/shape-context";
import { useGlobalKey } from "@/lib/docs/use-global-key";

const shapeOrder = Object.keys(shapeMap) as ShapeVariant[];

/**
 * Docs-site-only global shortcut: R cycles the radius variant. Mount once
 * inside ShapeProvider.
 */
export function ShapeShortcut() {
  const { shape, setShape } = useShapeContext();

  useGlobalKey("r", () => {
    const idx = shapeOrder.indexOf(shape);
    setShape(shapeOrder[(idx + 1) % shapeOrder.length]);
  });

  return null;
}
