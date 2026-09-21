import { describe, expect, it, vi } from "vitest";

const lookupMock = vi.fn();
vi.mock("node:dns", () => ({ lookup: (...args: unknown[]) => lookupMock(...(args as [never, never, never])) }));

import {
  assertFetchableUrl,
  extractMetadata,
  fetchLinkPreview,
  guardedLookup,
  isPublicAddress,
  LinkPreviewError,
  type RequestPage,
} from "@/registry/lib/link-preview";

describe("isPublicAddress", () => {
  it.each([
    ["8.8.8.8", 4, true],
    ["1.1.1.1", 4, true],
    ["93.184.216.34", 4, true],
    ["172.32.0.1", 4, true], // just outside the 172.16.0.0/12 block
    ["127.0.0.1", 4, false],
    ["10.0.0.5", 4, false],
    ["172.16.0.1", 4, false],
    ["172.31.255.255", 4, false],
    ["192.168.1.1", 4, false],
    ["169.254.169.254", 4, false],
    ["100.64.0.1", 4, false],
    ["0.0.0.0", 4, false],
    ["224.0.0.1", 4, false],
    ["255.255.255.255", 4, false],
    ["2606:4700:4700::1111", 6, true],
    ["::1", 6, false],
    ["::", 6, false],
    ["fe80::1", 6, false],
    ["fc00::1", 6, false],
    ["fd12:3456::1", 6, false],
    ["ff02::1", 6, false],
    ["::ffff:127.0.0.1", 6, false],
    ["::ffff:7f00:1", 6, false],
    ["::ffff:169.254.169.254", 6, false],
    ["64:ff9b::7f00:1", 6, false],
    ["not-an-ip", 4, false],
  ] as const)("isPublicAddress(%s, %s) -> %s", (address, family, expected) => {
    expect(isPublicAddress(address, family)).toBe(expected);
  });
});

describe("assertFetchableUrl", () => {
  it("accepts a plain https URL", () => {
    expect(assertFetchableUrl("https://example.com/a?b=1").href).toBe("https://example.com/a?b=1");
  });

  it.each([
    ["ftp://example.com"],
    ["javascript:alert(1)"],
    ["file:///etc/passwd"],
    ["http://user:pass@example.com"],
    ["http://example.com:8080"],
    ["https://example.com:22"],
    ["//example.com"],
    [""],
    [`https://example.com/${"a".repeat(3000)}`],
  ])("rejects %s", (input) => {
    expect(() => assertFetchableUrl(input)).toThrow(LinkPreviewError);
  });
});

describe("extractMetadata", () => {
  const pageUrl = new URL("https://example.com/post");

  it("prefers og:title, falls back to <title>", () => {
    const withOg = '<meta property="og:title" content="OG Title"><title>Page Title</title>';
    expect(extractMetadata(withOg, pageUrl).title).toBe("OG Title");
    expect(extractMetadata("<title>Page Title</title>", pageUrl).title).toBe("Page Title");
  });

  it("reads og tags with property before content and content before property", () => {
    expect(extractMetadata('<meta property="og:description" content="Hello">', pageUrl).description).toBe(
      "Hello",
    );
    expect(extractMetadata('<meta content="Hello" property="og:description">', pageUrl).description).toBe(
      "Hello",
    );
  });

  it("reads single-quoted attributes", () => {
    expect(extractMetadata("<meta property='og:title' content='Single Quoted'>", pageUrl).title).toBe(
      "Single Quoted",
    );
  });

  it("decodes named and numeric entities", () => {
    const html = '<meta property="og:title" content="Tom &amp; Jerry &#39; &#x27;">';
    expect(extractMetadata(html, pageUrl).title).toBe("Tom & Jerry ' '");
  });

  it("resolves a relative og:image against the page URL", () => {
    expect(extractMetadata('<meta property="og:image" content="/og.png">', pageUrl).image).toBe(
      "https://example.com/og.png",
    );
  });

  it("refuses a javascript: or data: image", () => {
    expect(
      extractMetadata('<meta property="og:image" content="javascript:alert(1)">', pageUrl).image,
    ).toBeNull();
    expect(
      extractMetadata('<meta property="og:image" content="data:image/png;base64,AAAA">', pageUrl).image,
    ).toBeNull();
  });

  it("collapses whitespace", () => {
    const html = '<meta property="og:title" content="  Too   much\n\nwhitespace  ">';
    expect(extractMetadata(html, pageUrl).title).toBe("Too much whitespace");
  });

  it("caps an over-long title at 300 characters", () => {
    const html = `<meta property="og:title" content="${"a".repeat(400)}">`;
    expect(extractMetadata(html, pageUrl).title).toHaveLength(300);
  });
});

describe("fetchLinkPreview", () => {
  it("refuses a redirect to a private address without ever making the second request", async () => {
    const request = vi.fn<RequestPage>(async () => ({
      status: 302,
      headers: { location: "http://169.254.169.254/latest/meta-data/" },
      body: "",
    }));
    await expect(fetchLinkPreview("https://example.com", { request })).rejects.toMatchObject({ status: 400 });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("refuses a redirect to a non-default port", async () => {
    const request = vi.fn<RequestPage>(async () => ({
      status: 301,
      headers: { location: "https://example.com:8443/" },
      body: "",
    }));
    await expect(fetchLinkPreview("https://example.com", { request })).rejects.toMatchObject({ status: 400 });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("gives up after more than 3 redirects", async () => {
    const request = vi.fn<RequestPage>(async () => ({
      status: 302,
      headers: { location: "https://example.com/next" },
      body: "",
    }));
    await expect(fetchLinkPreview("https://example.com/start", { request })).rejects.toMatchObject({
      status: 502,
    });
    expect(request).toHaveBeenCalledTimes(4);
  });

  it("returns all-null data for a non-HTML response", async () => {
    const request = vi.fn<RequestPage>(async () => ({
      status: 200,
      headers: { "content-type": "image/png" },
      body: "",
    }));
    await expect(fetchLinkPreview("https://example.com/photo.png", { request })).resolves.toEqual({
      title: null,
      description: null,
      image: null,
      siteName: null,
    });
  });

  it("returns the parsed fields on the happy path", async () => {
    const html = `
      <meta property="og:title" content="Example Title">
      <meta property="og:description" content="Example description">
      <meta property="og:image" content="/og.png">
      <meta property="og:site_name" content="Example">
    `;
    const request = vi.fn<RequestPage>(async () => ({
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
      body: html,
    }));
    await expect(fetchLinkPreview("https://example.com/post", { request })).resolves.toEqual({
      title: "Example Title",
      description: "Example description",
      image: "https://example.com/og.png",
      siteName: "Example",
    });
  });

  it("wraps a network failure without echoing its message", async () => {
    const request = vi.fn<RequestPage>(async () => {
      throw new Error("connect ECONNREFUSED 10.0.0.5:443");
    });
    const error: unknown = await fetchLinkPreview("https://example.com", { request }).catch((caught) => caught);
    expect(error).toBeInstanceOf(LinkPreviewError);
    expect((error as LinkPreviewError).status).toBe(502);
    expect((error as LinkPreviewError).message).not.toContain("10.0.0.5");
  });
});

describe("guardedLookup", () => {
  it("refuses when any resolved address is private", () => {
    lookupMock.mockImplementationOnce((_hostname, _options, callback) => {
      callback(null, [
        { address: "93.184.216.34", family: 4 },
        { address: "10.0.0.1", family: 4 },
      ]);
    });
    const callback = vi.fn();
    guardedLookup("example.com", {}, callback);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toBeInstanceOf(LinkPreviewError);
  });

  it("resolves the first address when every resolved address is public", () => {
    lookupMock.mockImplementationOnce((_hostname, _options, callback) => {
      callback(null, [{ address: "93.184.216.34", family: 4 }]);
    });
    const callback = vi.fn();
    guardedLookup("example.com", {}, callback);
    expect(callback).toHaveBeenCalledWith(null, "93.184.216.34", 4);
  });
});

describe("review hardening", () => {
  it("refuses the IPv6 prefixes that carry an IPv4 address inside them", () => {
    for (const address of ["2002:7f00:1::", "2001:0:7f00:1::", "::7f00:1", "::127.0.0.1"]) {
      expect(isPublicAddress(address, 6), address).toBe(false);
    }
  });

  it("refuses every spelling of a loopback literal, which the lookup guard never sees", () => {
    // given: Node connects to an IP hostname without calling `lookup`, so this is the only check
    const spellings = [
      "http://127.0.0.1/",
      "http://2130706433/",
      "http://0x7f.1/",
      "http://127.1/",
      "http://[::1]/",
      "http://[::ffff:127.0.0.1]/",
      "http://[::ffff:7f00:1]/",
      "http://169.254.169.254/latest/meta-data/",
    ];
    for (const spelling of spellings) {
      expect(() => assertFetchableUrl(spelling), spelling).toThrow(LinkPreviewError);
    }
  });

  it("still reads attributes written with spaces around the equals sign", () => {
    const html = `<meta property = "og:title" content = 'Spaced'>`;
    expect(extractMetadata(html, new URL("https://example.com/")).title).toBe("Spaced");
  });

  it("parses hostile markup in linear time", () => {
    // given: the three shapes that made the first parser backtrack quadratically
    const unclosedTitles = "<title>".repeat(60_000);
    const oneHugeAttributeName = `<meta ${"a".repeat(400_000)}>`;
    const manySpaces = `<meta a${" ".repeat(7_000)}b>`.repeat(60);

    for (const html of [unclosedTitles, oneHugeAttributeName, manySpaces]) {
      const started = performance.now();
      extractMetadata(html, new URL("https://example.com/"));
      expect(performance.now() - started).toBeLessThan(500);
    }
  });
});
