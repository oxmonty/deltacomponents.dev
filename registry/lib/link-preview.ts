import * as dns from "node:dns";
import * as http from "node:http";
import * as https from "node:https";
import { BlockList, isIP } from "node:net";

export interface LinkPreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

export class LinkPreviewError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 502,
  ) {
    super(message);
    this.name = "LinkPreviewError";
  }
}

// RFC 6890 special-use ranges, plus the ranges that matter for SSRF: loopback,
// the RFC 1918 private blocks, and 169.254.0.0/16 — where AWS, GCP and Azure
// all serve their instance-metadata endpoint.
const privateAddresses = new BlockList();
privateAddresses.addSubnet("0.0.0.0", 8, "ipv4");
privateAddresses.addSubnet("10.0.0.0", 8, "ipv4");
privateAddresses.addSubnet("100.64.0.0", 10, "ipv4");
privateAddresses.addSubnet("127.0.0.0", 8, "ipv4");
privateAddresses.addSubnet("169.254.0.0", 16, "ipv4");
privateAddresses.addSubnet("172.16.0.0", 12, "ipv4");
privateAddresses.addSubnet("192.0.0.0", 24, "ipv4");
privateAddresses.addSubnet("192.0.2.0", 24, "ipv4");
privateAddresses.addSubnet("192.168.0.0", 16, "ipv4");
privateAddresses.addSubnet("198.18.0.0", 15, "ipv4");
privateAddresses.addSubnet("198.51.100.0", 24, "ipv4");
privateAddresses.addSubnet("203.0.113.0", 24, "ipv4");
privateAddresses.addSubnet("224.0.0.0", 4, "ipv4"); // multicast
privateAddresses.addSubnet("240.0.0.0", 4, "ipv4"); // reserved, incl. broadcast
privateAddresses.addAddress("::", "ipv6");
privateAddresses.addAddress("::1", "ipv6");
privateAddresses.addSubnet("fc00::", 7, "ipv6"); // unique local
privateAddresses.addSubnet("fe80::", 10, "ipv6"); // link local
privateAddresses.addSubnet("ff00::", 8, "ipv6"); // multicast
privateAddresses.addSubnet("2001:db8::", 32, "ipv6"); // documentation
// These prefixes each carry an arbitrary IPv4 address inside an IPv6 one
// (NAT64, 6to4, Teredo, IPv4-compatible). Rather than unwrapping and
// re-checking what they carry, the whole prefix is refused.
privateAddresses.addSubnet("64:ff9b::", 96, "ipv6");
privateAddresses.addSubnet("2002::", 16, "ipv6");
privateAddresses.addSubnet("2001::", 32, "ipv6");
privateAddresses.addSubnet("::", 96, "ipv6");

/** True only for addresses on the public internet. */
export function isPublicAddress(address: string, family: 4 | 6): boolean {
  if (isIP(address) === 0) return false;
  // check() unwraps an IPv4-mapped IPv6 address (::ffff:a.b.c.d, dotted or
  // hex) against the ipv4 subnets above before comparing.
  return !privateAddresses.check(address, family === 4 ? "ipv4" : "ipv6");
}

const MAX_URL_LENGTH = 2048;

/** Throws LinkPreviewError(400) unless this is a URL the server may fetch. */
export function assertFetchableUrl(input: string): URL {
  if (typeof input !== "string" || input.length === 0 || input.length > MAX_URL_LENGTH) {
    throw new LinkPreviewError("URL not allowed", 400);
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new LinkPreviewError("URL not allowed", 400);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new LinkPreviewError("URL not allowed", 400);
  }
  if (url.username || url.password) {
    throw new LinkPreviewError("URL not allowed", 400);
  }
  // A non-default port would let this route be pointed at whatever else is
  // listening on the target host.
  if (url.port !== "") {
    throw new LinkPreviewError("URL not allowed", 400);
  }
  if (url.hostname.length === 0) {
    throw new LinkPreviewError("URL not allowed", 400);
  }

  // This is the ONLY check a literal IP gets: Node connects straight to an
  // IP hostname without calling `lookup`, so guardedLookup below never sees
  // it. The URL parser has already turned forms like "2130706433" or "0x7f.1"
  // into dotted form by this point.
  const literalIp = url.hostname.replace(/^\[|\]$/g, "");
  const ipFamily = isIP(literalIp);
  if (ipFamily !== 0 && !isPublicAddress(literalIp, ipFamily === 6 ? 6 : 4)) {
    throw new LinkPreviewError("URL not allowed", 400);
  }

  return url;
}

// Validating inside the socket's own lookup means the address that was
// checked is the address that is connected to, so a hostname cannot pass the
// check and then re-resolve to an internal one (DNS rebinding). Hostnames
// only: Node skips `lookup` for a literal IP, which assertFetchableUrl covers.
export function guardedLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void,
): void {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) {
      callback(err, "");
      return;
    }
    const blocked = addresses.find(
      (candidate) => !isPublicAddress(candidate.address, candidate.family === 6 ? 6 : 4),
    );
    if (blocked || addresses.length === 0) {
      callback(new LinkPreviewError("URL not allowed", 400), "");
      return;
    }
    if (options.all) {
      callback(null, addresses);
    } else {
      callback(null, addresses[0].address, addresses[0].family);
    }
  });
}

export type RequestPage = (
  url: URL,
) => Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: string }>;

const TIMEOUT_MS = 5000;
const MAX_BODY_BYTES = 512 * 1024;

const defaultRequest: RequestPage = (url) =>
  new Promise((resolve, reject) => {
    let settled = false;
    const settle = (run: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      run();
    };

    const transport = url.protocol === "https:" ? https : http;
    const req = transport.request(
      url,
      {
        method: "GET",
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent": "link-preview/1.0",
          "accept-encoding": "identity",
        },
        lookup: guardedLookup,
        timeout: TIMEOUT_MS,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const headers = res.headers as Record<string, string | string[] | undefined>;
        let received = 0;
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => {
          received += Buffer.byteLength(chunk, "utf8");
          // A preview's tags are in the head, so the rest of the body is
          // never needed — and an unbounded read is a free download on
          // someone else's bill.
          if (received > MAX_BODY_BYTES) {
            res.destroy();
            settle(() => resolve({ status, headers, body }));
            return;
          }
          body += chunk;
        });
        res.on("end", () => settle(() => resolve({ status, headers, body })));
        res.on("error", () => settle(() => reject(new LinkPreviewError("Could not fetch the page", 502))));
      },
    );

    req.on("timeout", () => req.destroy(new LinkPreviewError("Could not fetch the page", 502)));
    // The `timeout` option only measures idle time, so a server dripping a
    // byte every few seconds would never trip it. This one is the whole budget.
    const deadline = setTimeout(
      () => req.destroy(new LinkPreviewError("Could not fetch the page", 502)),
      TIMEOUT_MS,
    );
    req.on("error", (err) =>
      settle(() => reject(err instanceof LinkPreviewError ? err : new LinkPreviewError("Could not fetch the page", 502))),
    );
    req.end();
  });

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (whole, entity: string) => {
    if (entity[0] === "#") {
      const codePoint =
        entity[1]?.toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isNaN(codePoint) ? whole : String.fromCodePoint(codePoint);
    }
    return ENTITIES[entity.toLowerCase()] ?? whole;
  });
}

function normalize(raw: string | undefined, max = Infinity): string | null {
  if (raw === undefined) return null;
  const text = decodeEntities(raw).replace(/\s+/g, " ").trim();
  if (text === "") return null;
  return text.length > max ? text.slice(0, max) : text;
}

function resolveImage(raw: string | undefined, pageUrl: URL): string | null {
  if (!raw) return null;
  try {
    const resolved = new URL(raw, pageUrl);
    return resolved.protocol === "http:" || resolved.protocol === "https:" ? resolved.href : null;
  } catch {
    return null;
  }
}

const MAX_META_TAG_LENGTH = 8192;

// The page is hostile input, so nothing here may backtrack: an attribute name
// has to follow whitespace (one way in per name, not one per letter), a tag
// longer than any real one is skipped, and the title is found with indexOf.
function collectMetaTags(html: string): Record<string, string>[] {
  const tags: Record<string, string>[] = [];
  const tagPattern = /<meta\b[^>]*>/gi;
  const attrPattern = /\s([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = tagPattern.exec(html))) {
    if (tagMatch[0].length > MAX_META_TAG_LENGTH) continue;
    const attrs: Record<string, string> = {};
    let attrMatch: RegExpExecArray | null;
    attrPattern.lastIndex = 0;
    while ((attrMatch = attrPattern.exec(tagMatch[0]))) {
      attrs[attrMatch[1].toLowerCase()] = attrMatch[2] ?? attrMatch[3];
    }
    tags.push(attrs);
  }
  return tags;
}

function findTitle(html: string): string | undefined {
  const open = html.search(/<title[\s>]/i);
  if (open === -1) return undefined;
  const start = html.indexOf(">", open);
  if (start === -1) return undefined;
  const lower = html.slice(start + 1, start + 1 + 2048).toLowerCase();
  const end = lower.indexOf("</title");
  return end === -1 ? undefined : html.slice(start + 1, start + 1 + end);
}

export function extractMetadata(html: string, pageUrl: URL): LinkPreviewData {
  const tags = collectMetaTags(html);
  const metaContent = (name: string): string | undefined =>
    tags.find((tag) => tag.property === name || tag.name === name)?.content;

  const rawTitle = metaContent("og:title") ?? findTitle(html);
  const rawDescription = metaContent("og:description") ?? metaContent("description");
  const rawImage = metaContent("og:image") ?? metaContent("twitter:image");
  const rawSiteName = metaContent("og:site_name");

  return {
    title: normalize(rawTitle, 300),
    description: normalize(rawDescription, 500),
    image: resolveImage(rawImage, pageUrl),
    siteName: normalize(rawSiteName),
  };
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 3;

export async function fetchLinkPreview(
  input: string,
  options?: { request?: RequestPage },
): Promise<LinkPreviewData> {
  const request = options?.request ?? defaultRequest;
  let url = assertFetchableUrl(input);
  let redirects = 0;
  let response: Awaited<ReturnType<RequestPage>>;

  for (;;) {
    try {
      response = await request(url);
    } catch (error) {
      throw error instanceof LinkPreviewError ? error : new LinkPreviewError("Could not fetch the page", 502);
    }

    if (!REDIRECT_STATUSES.has(response.status)) break;

    redirects += 1;
    if (redirects > MAX_REDIRECTS) throw new LinkPreviewError("Too many redirects", 502);

    const location = response.headers.location;
    const target = Array.isArray(location) ? location[0] : location;
    if (!target) throw new LinkPreviewError("Could not fetch the page", 502);

    // Every hop is a new URL from an untrusted server, so every hop is
    // checked like the first.
    url = assertFetchableUrl(new URL(target, url).href);
  }

  if (response.status < 200 || response.status >= 300) {
    throw new LinkPreviewError("Could not fetch the page", 502);
  }

  const contentType = response.headers["content-type"];
  const contentTypeValue = Array.isArray(contentType) ? contentType[0] : contentType;
  const isHtml =
    !!contentTypeValue &&
    (contentTypeValue.includes("text/html") || contentTypeValue.includes("application/xhtml+xml"));
  if (!isHtml) {
    return { title: null, description: null, image: null, siteName: null };
  }

  return extractMetadata(response.body, url);
}
