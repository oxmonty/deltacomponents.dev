import { describe, it, expect } from "vitest";
import { pinchTo, settlePinch } from "../registry/ui/image";

describe("pinchTo", () => {
  it("doubles the scale and keeps the fingers' midpoint fixed", () => {
    const start = {
      scale: 1,
      x: 0,
      y: 0,
      dist: 100,
      midX: 100,
      midY: 50,
      centerX: 0,
      centerY: 0,
    };
    const result = pinchTo(start, { dist: 200, midX: 100, midY: 50 });
    expect(result.scale).toBe(2);
    expect(result.x).toBe(-100);
    expect(result.y).toBe(-50);
  });

  it("clamps scale at MAX_ZOOM (4) and never below 1", () => {
    const start = {
      scale: 1,
      x: 0,
      y: 0,
      dist: 100,
      midX: 0,
      midY: 0,
      centerX: 0,
      centerY: 0,
    };
    expect(pinchTo(start, { dist: 1000, midX: 0, midY: 0 }).scale).toBe(4);
    expect(pinchTo(start, { dist: 1, midX: 0, midY: 0 }).scale).toBe(1);
  });
});

describe("settlePinch", () => {
  it("snaps back to 1x under SNAP_BACK_BELOW (1.05)", () => {
    expect(settlePinch({ scale: 1.04, x: 50, y: 50 }, { width: 300, height: 200 })).toEqual({
      scale: 1,
      x: 0,
      y: 0,
    });
  });

  it("clamps x/y to +/-(scale-1)*size/2 and leaves in-bound values alone", () => {
    // given: a 2x zoom on a 300x200 box, so the bound is +/-150 x, +/-100 y
    const box = { width: 300, height: 200 };
    expect(settlePinch({ scale: 2, x: 200, y: 200 }, box)).toEqual({ scale: 2, x: 150, y: 100 });
    expect(settlePinch({ scale: 2, x: -200, y: -200 }, box)).toEqual({ scale: 2, x: -150, y: -100 });
    expect(settlePinch({ scale: 2, x: 40, y: -30 }, box)).toEqual({ scale: 2, x: 40, y: -30 });
  });
});
