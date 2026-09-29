import { getShopImageBaseUrl } from "./config";

const OXID_PICTURE_DIR_PLACEHOLDER =
  /\[\{\$oViewConf->getPictureDir\(\)\}\]/gi;

const DESCRIPTION_HTML_TAGS = new Set([
  "ul",
  "ol",
  "li",
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "span",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "figure",
  "figcaption",
  "img",
  "sup",
  "sub",
  "a",
]);

const DESCRIPTION_TAG_ATTRS: Partial<Record<string, Set<string>>> = {
  img: new Set(["src", "alt", "title", "class"]),
  a: new Set(["href", "title", "class", "target", "rel"]),
};

const GLOBAL_ATTRS = new Set(["class"]);

function decodeHtmlEntities(value: string): string {
  let decoded = value;
  for (let i = 0; i < 2; i++) {
    decoded = decoded
      .replace(/&nbsp;/gi, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
  }
  return decoded;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function getShopPicturesBaseUrl(): string {
  const shopBase = getShopImageBaseUrl()?.replace(/\/$/, "");
  return shopBase ? `${shopBase}/out/pictures` : "/out/pictures";
}

function joinPicturesPath(picturesBase: string, path: string): string {
  const base = picturesBase.replace(/\/$/, "");
  const normalized = path.replace(/^\/+/, "");
  return normalized ? `${base}/${normalized}` : base;
}

function replaceOxidPictureDir(value: string, picturesBase: string): string {
  const base = picturesBase.replace(/\/$/, "");
  return value.replace(OXID_PICTURE_DIR_PLACEHOLDER, `${base}/`);
}

export function resolveOxidPictureSrc(
  src: string,
  picturesBase = getShopPicturesBaseUrl()
): string | null {
  const trimmed = src.trim();
  if (!trimmed) return null;

  let resolved = replaceOxidPictureDir(trimmed, picturesBase);

  if (/^javascript:/i.test(resolved) || /^data:/i.test(resolved)) {
    return null;
  }

  if (resolved.startsWith("//")) {
    resolved = `https:${resolved}`;
  }

  if (!/^https?:\/\//i.test(resolved)) {
    resolved = joinPicturesPath(picturesBase, resolved);
  }

  if (!/^https?:\/\//i.test(resolved) && !resolved.startsWith("/out/pictures")) {
    return null;
  }

  return resolved;
}

function parseAttributes(attrString: string): Map<string, string> {
  const attrs = new Map<string, string>();
  const pattern =
    /([a-z][a-z0-9-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(attrString)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[3] ?? match[4] ?? match[5] ?? "";
    attrs.set(name, value);
  }

  return attrs;
}

function sanitizeHref(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed) return null;
  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed)) return null;
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(trimmed)) return trimmed;
  return null;
}

function buildAllowedAttributes(
  tag: string,
  attrString: string,
  picturesBase: string
): string {
  const parsed = parseAttributes(attrString);
  const allowed = new Set([
    ...GLOBAL_ATTRS,
    ...(DESCRIPTION_TAG_ATTRS[tag] ?? []),
  ]);
  const parts: string[] = [];

  for (const [name, rawValue] of parsed) {
    if (!allowed.has(name)) continue;

    let value = rawValue;
    if (tag === "img" && name === "src") {
      const resolved = resolveOxidPictureSrc(value, picturesBase);
      if (!resolved) continue;
      value = resolved;
    } else if (tag === "a" && name === "href") {
      const resolved = sanitizeHref(value);
      if (!resolved) continue;
      value = resolved;
    } else if (name === "target" && value !== "_blank") {
      continue;
    } else if (name === "rel" && !/^noopener/i.test(value)) {
      value = "noopener noreferrer";
    }

    parts.push(`${name}="${escapeAttr(value)}"`);
  }

  if (tag === "a" && parsed.has("target") && parsed.get("target") === "_blank") {
    if (!parts.some((part) => part.startsWith('rel="'))) {
      parts.push('rel="noopener noreferrer"');
    }
  }

  return parts.length > 0 ? ` ${parts.join(" ")}` : "";
}

/** Sanitize OXID Beschreibung HTML (mwvrtc / oxlongdesc). */
export function sanitizeDescriptionHtml(
  value: string | null
): string | undefined {
  if (!value) return undefined;

  const picturesBase = getShopPicturesBaseUrl();
  const decoded = decodeHtmlEntities(value)
    .replace(OXID_PICTURE_DIR_PLACEHOLDER, () => {
      const base = picturesBase.replace(/\/$/, "");
      return `${base}/`;
    })
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<(\/?)([a-z0-9]+)([^>]*)>/gi, (match, slash, tag, attrs) => {
      const name = String(tag).toLowerCase();
      if (!DESCRIPTION_HTML_TAGS.has(name)) return "";

      if (slash) return `</${name}>`;
      if (name === "br") return "<br>";

      const safeAttrs = buildAllowedAttributes(name, String(attrs), picturesBase);
      return `<${name}${safeAttrs}>`;
    })
    .trim();

  return decoded || undefined;
}
