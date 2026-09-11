import { describe, it, expect } from "vitest";
import { formatTime, resamplePeaks } from "../registry/ui/mp3-player";

describe("formatTime", () => {
  it("renders non-finite, negative, or zero seconds as 0:00", () => {
    expect(formatTime(NaN)).toBe("0:00");
    expect(formatTime(Infinity)).toBe("0:00");
    expect(formatTime(-3)).toBe("0:00");
    expect(formatTime(0)).toBe("0:00");
  });

  it("floors to whole seconds", () => {
    expect(formatTime(59.9)).toBe("0:59");
  });

  it("renders under an hour as m:ss", () => {
    expect(formatTime(61)).toBe("1:01");
    expect(formatTime(600)).toBe("10:00");
    expect(formatTime(3599)).toBe("59:59");
  });

  it("renders an hour or more as h:mm:ss", () => {
    expect(formatTime(3600)).toBe("1:00:00");
    expect(formatTime(3661)).toBe("1:01:01");
  });
});

describe("resamplePeaks", () => {
  it("keeps the loudest peak of each merged group", () => {
    expect(resamplePeaks([0.1, 0.9, 0.2, 0.3, 0.5, 0.4], 3)).toEqual([0.9, 0.3, 0.5]);
  });

  it("spreads uneven groups across the whole input", () => {
    expect(resamplePeaks([1, 0, 0, 0, 0, 0.5, 0], 2)).toEqual([1, 0.5]);
  });

  it("returns the input untouched when there are no more bars than peaks", () => {
    const peaks = [0.2, 0.4];
    expect(resamplePeaks(peaks, 2)).toBe(peaks);
    expect(resamplePeaks(peaks, 10)).toBe(peaks);
    expect(resamplePeaks(peaks, 0)).toBe(peaks);
  });
});
