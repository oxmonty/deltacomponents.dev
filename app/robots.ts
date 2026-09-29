import type { MetadataRoute } from "next";

import { site } from "@/lib/config";

const SITE_URL = site.url;

// Scrapers that ignore crawl-rate norms and give nothing back. The OpenAI
// and Anthropic agents (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot,
// Claude-User, Claude-SearchBot) are deliberately NOT here: a component
// registry wants to be findable from an assistant, and /llms.txt and the
// `.md` pages exist for exactly that reader. Well-behaved bots honor this;
// abusive ones won't — Vercel Firewall is the real enforcement.
const BLOCKED_BOTS = [
  "CCBot",
  "Google-Extended",
  "PerplexityBot",
  "Bytespider",
  "Amazonbot",
  "Applebot-Extended",
  "Diffbot",
  "ImagesiftBot",
  "Omgilibot",
  "FacebookBot",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...BLOCKED_BOTS.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
