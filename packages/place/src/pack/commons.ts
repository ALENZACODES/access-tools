/** Photo requests are explicitly initiated by the visitor, never during render. */
export interface CommonsPhoto {
  title: string;
  pageUrl: string;
  thumbUrl: string;
  author: string;
  licence: string;
  licenceUrl: string;
}

const COMMONS = "https://commons.wikimedia.org";

export function commonsTitle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let text = value.trim();
  if (text.startsWith("https://")) {
    try {
      const url = new URL(text);
      if (url.hostname !== "commons.wikimedia.org" || !url.pathname.startsWith("/wiki/File:")) return null;
      text = decodeURIComponent(url.pathname.slice(6));
    } catch {
      return null;
    }
  }
  if (!/^File:/i.test(text)) return null;
  const name = text.slice(5).replace(/_/g, " ").trim();
  if (!name || /[#?<>]/.test(name) || [...name].some((ch) => ch.charCodeAt(0) < 32)) return null;
  return `File:${name}`;
}

function safeCommonsUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || !["commons.wikimedia.org", "upload.wikimedia.org"].includes(parsed.hostname)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function plainText(html: unknown): string {
  if (typeof html !== "string") return "";
  if (typeof DOMParser !== "undefined") return new DOMParser().parseFromString(html, "text/html").body.textContent?.trim() ?? "";
  return html.replace(/<[^>]*>/g, "").trim();
}

function openLicence(name: string): boolean {
  return /^(?:CC0(?:\b|[- ])|CC BY(?:-SA)?(?:\b|[- ])|Public domain\b|PD\b)/i.test(name) && !/\b(?:NC|ND)\b/i.test(name);
}

export async function fetchCommonsPhoto(title: string, request: typeof fetch = fetch): Promise<CommonsPhoto | null> {
  const canonical = commonsTitle(title);
  if (!canonical) return null;
  const url = new URL("/w/api.php", COMMONS);
  url.search = new URLSearchParams({
    action: "query", format: "json", origin: "*", prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "480", titles: canonical,
  }).toString();
  const response = await request(url.toString());
  if (!response.ok) throw new Error("Commons API request failed");
  const json: unknown = await response.json();
  if (!json || typeof json !== "object" || !("query" in json)) return null;
  const query = (json as { query?: { pages?: Record<string, { imageinfo?: Array<{
    thumburl?: string; descriptionurl?: string; extmetadata?: Record<string, { value?: string }>;
  }> }> } }).query;
  const image = Object.values(query?.pages ?? {})[0]?.imageinfo?.[0];
  const metadata = image?.extmetadata;
  const licence = plainText(metadata?.LicenseShortName?.value);
  const thumbUrl = safeCommonsUrl(image?.thumburl);
  const pageUrl = safeCommonsUrl(image?.descriptionurl);
  const licenceUrl = safeCommonsUrl(metadata?.LicenseUrl?.value);
  if (!openLicence(licence) || !thumbUrl || !pageUrl) return null;
  return {
    title: canonical,
    thumbUrl,
    pageUrl,
    author: plainText(metadata?.Artist?.value) || plainText(metadata?.Credit?.value),
    licence,
    licenceUrl: licenceUrl ?? pageUrl,
  };
}
