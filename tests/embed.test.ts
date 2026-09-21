import { describe, expect, it } from "vitest";
import { classifyUrl } from "@/registry/lib/embed";

describe("classifyUrl", () => {
  it("returns null for anything that isn't an absolute http(s) URL", () => {
    expect(classifyUrl("not a url at all")).toBeNull();
    expect(classifyUrl("ftp://example.com/file")).toBeNull();
    expect(classifyUrl("example.com/photo.jpg")).toBeNull();
  });

  it("leaves a root- or protocol-relative path alone, so a pasted line cannot reach the reader's own origin", () => {
    expect(classifyUrl("/images/photo.jpg")).toBeNull();
    expect(classifyUrl("//example.com/photo.jpg")).toBeNull();
  });

  it("trims surrounding whitespace before classifying", () => {
    expect(classifyUrl("  https://example.com/about  ")).toEqual({
      kind: "link",
      url: "https://example.com/about",
    });
  });

  describe("YouTube", () => {
    it("recognizes a watch link", () => {
      expect(classifyUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
        kind: "youtube",
        videoId: "dQw4w9WgXcQ",
      });
    });

    it("recognizes www., m. and bare youtube.com", () => {
      expect(classifyUrl("https://youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
        kind: "youtube",
        videoId: "dQw4w9WgXcQ",
      });
      expect(classifyUrl("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
        kind: "youtube",
        videoId: "dQw4w9WgXcQ",
      });
    });

    it("recognizes a youtu.be share link", () => {
      expect(classifyUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({
        kind: "youtube",
        videoId: "dQw4w9WgXcQ",
      });
    });

    it("recognizes a shorts link", () => {
      expect(classifyUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toEqual({
        kind: "youtube",
        videoId: "dQw4w9WgXcQ",
      });
    });

    it("recognizes an embed link", () => {
      expect(classifyUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toEqual({
        kind: "youtube",
        videoId: "dQw4w9WgXcQ",
      });
    });

    it("rejects an ID that isn't 11 characters", () => {
      expect(classifyUrl("https://youtu.be/short")).toEqual({
        kind: "link",
        url: "https://youtu.be/short",
      });
      expect(classifyUrl("https://www.youtube.com/watch?v=tooLongForAnId")).toEqual({
        kind: "link",
        url: "https://www.youtube.com/watch?v=tooLongForAnId",
      });
    });
  });

  describe("Spotify", () => {
    it("recognizes a track URL", () => {
      expect(classifyUrl("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC")).toEqual({
        kind: "spotify",
        type: "track",
        id: "4uLU6hMCjMI75M1A2tKUQC",
      });
    });

    it("recognizes playlist, album, episode and show URLs", () => {
      for (const type of ["playlist", "album", "episode", "show"]) {
        expect(classifyUrl(`https://open.spotify.com/${type}/abc123`)).toEqual({
          kind: "spotify",
          type,
          id: "abc123",
        });
      }
    });

    it("ignores a Spotify-looking path on the wrong host", () => {
      expect(classifyUrl("https://example.com/track/abc123")).toEqual({
        kind: "link",
        url: "https://example.com/track/abc123",
      });
    });
  });

  describe("image and video", () => {
    it("recognizes an image URL by its extension, case-insensitively", () => {
      expect(classifyUrl("https://example.com/photo.jpg")).toEqual({
        kind: "image",
        url: "https://example.com/photo.jpg",
      });
      expect(classifyUrl("https://example.com/photo.PNG")).toEqual({
        kind: "image",
        url: "https://example.com/photo.PNG",
      });
    });

    it("recognizes a video URL by its extension", () => {
      expect(classifyUrl("https://example.com/clip.mp4")).toEqual({
        kind: "video",
        url: "https://example.com/clip.mp4",
      });
    });

    it("decides from the path alone, so a query string cannot pass an endpoint off as an image", () => {
      expect(classifyUrl("https://example.com/api/logout?next=.png")).toEqual({
        kind: "link",
        url: "https://example.com/api/logout?next=.png",
      });
      expect(classifyUrl("https://example.com/photo.png?width=800")).toEqual({
        kind: "image",
        url: "https://example.com/photo.png?width=800",
      });
    });
  });

  it("falls back to a link for a URL nothing else can embed", () => {
    expect(classifyUrl("https://example.com/about")).toEqual({
      kind: "link",
      url: "https://example.com/about",
    });
  });
});
