/**
 * Single source of truth for the color system.
 *
 * Colors are stored in env vars (see `.env.local`) and injected as CSS custom
 * properties on :root by the root layout. `globals.css` and the Tailwind config
 * consume them via `var(--color-*)`, with the `fallback` here used when the env
 * var is not set (CSS itself cannot read env vars directly).
 */

export type ColorToken = {
  /** CSS custom property name (without the leading `--`). */
  cssVar: string;
  /** Environment variable name that overrides the fallback. */
  env: string;
  /** Hard-coded default used when the env var is absent. */
  fallback: string;
};

/** Brand palette from the style guide. */
export const PALETTE: ColorToken[] = [
  { cssVar: "color-chathamsblue", env: "THEME_COLOR_CHATHAMSBLUE", fallback: "#195084" },
  { cssVar: "color-java", env: "THEME_COLOR_JAVA", fallback: "#24bdb0" },
  { cssVar: "color-monza", env: "THEME_COLOR_MONZA", fallback: "#D40032" },
  { cssVar: "color-aquahaze", env: "THEME_COLOR_AQUAHAZE", fallback: "#daecec" },
  { cssVar: "color-wildsand", env: "THEME_COLOR_WILDSAND", fallback: "#f5f5f5" },
  { cssVar: "color-porcelain", env: "THEME_COLOR_PORCELAIN", fallback: "#EEF0F2" },
  { cssVar: "color-cranberry", env: "THEME_COLOR_CRANBERRY", fallback: "#DD4C95" },
  { cssVar: "color-irisblue", env: "THEME_COLOR_IRISBLUE", fallback: "#03b4d6" },
  { cssVar: "color-cabaret", env: "THEME_COLOR_CABARET", fallback: "#D34E6F" },
  { cssVar: "color-marine", env: "THEME_COLOR_MARINE", fallback: "#20568E" },
  { cssVar: "color-persiangreen", env: "THEME_COLOR_PERSIANGREEN", fallback: "#00A29B" },
  { cssVar: "color-mercury", env: "THEME_COLOR_MERCURY", fallback: "#E3E3E3" },
  { cssVar: "color-amethystsmoke", env: "THEME_COLOR_AMETHYSTSMOKE", fallback: "#928CB1" },
  { cssVar: "color-cornflowerblue", env: "THEME_COLOR_CORNFLOWERBLUE", fallback: "#0069B0" },
];

/**
 * Semantic theme tokens. These point at palette values by default but can be
 * overridden independently via their own env vars.
 */
export const SEMANTIC: ColorToken[] = [
  { cssVar: "color-primary", env: "THEME_COLOR_PRIMARY", fallback: "#24bdb0" }, // java
  { cssVar: "color-primary-hover", env: "THEME_COLOR_PRIMARY_HOVER", fallback: "#1ea699" },
  { cssVar: "color-secondary", env: "THEME_COLOR_SECONDARY", fallback: "#195084" }, // chathamsblue
  { cssVar: "color-secondary-hover", env: "THEME_COLOR_SECONDARY_HOVER", fallback: "#14406b" },
  { cssVar: "color-tertiary", env: "THEME_COLOR_TERTIARY", fallback: "#D40032" }, // monza
  { cssVar: "color-quaternary", env: "THEME_COLOR_QUATERNARY", fallback: "#daecec" }, // aquahaze
  { cssVar: "color-quinary", env: "THEME_COLOR_QUINARY", fallback: "#928CB1" }, // amethystsmoke
  { cssVar: "color-success", env: "THEME_COLOR_SUCCESS", fallback: "#00A29B" }, // persiangreen
  { cssVar: "color-danger", env: "THEME_COLOR_DANGER", fallback: "#D40032" }, // monza
  { cssVar: "color-warning", env: "THEME_COLOR_WARNING", fallback: "#f0ad4e" },
  { cssVar: "color-info", env: "THEME_COLOR_INFO", fallback: "#03b4d6" }, // irisblue
  { cssVar: "color-light", env: "THEME_COLOR_LIGHT", fallback: "#f5f5f5" }, // wildsand
  { cssVar: "color-dark", env: "THEME_COLOR_DARK", fallback: "#195084" }, // chathamsblue
  { cssVar: "color-cart-line", env: "THEME_COLOR_CART_LINE", fallback: "#f6f8f9" },
];

/**
 * Neutral tokens. White and black are the only colors outside the brand
 * palette; everything else in the UI is sourced from the semantic/palette
 * tokens above.
 */
export const NEUTRAL: ColorToken[] = [
  { cssVar: "color-white", env: "THEME_COLOR_WHITE", fallback: "#ffffff" },
  { cssVar: "color-black", env: "THEME_COLOR_BLACK", fallback: "#000000" },
];

export const ALL_TOKENS: ColorToken[] = [...PALETTE, ...SEMANTIC, ...NEUTRAL];

/** Resolve a token value from env, falling back to its default. */
function resolve(token: ColorToken): string {
  const value = process.env[token.env];
  return value && value.trim().length > 0 ? value.trim() : token.fallback;
}

/** Convert a #rgb / #rrggbb hex string into space-separated RGB channels. */
function hexToRgbChannels(hex: string): string | null {
  const normalized = hex.trim().replace(/^#/, "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  if (full.length !== 6 || /[^0-9a-fA-F]/.test(full)) return null;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/**
 * Build the `:root { --color-*: ...; }` declaration block from env values.
 * Rendered once in the root layout so every page (and globals.css) can use them.
 *
 * For each token we emit both the raw value (`--color-x`) and its RGB channels
 * (`--color-x-rgb`) so Tailwind can support opacity modifiers via
 * `rgb(var(--color-x-rgb) / <alpha-value>)`.
 */
export function buildThemeRootCss(): string {
  const declarations = ALL_TOKENS.flatMap((token) => {
    const value = resolve(token);
    const channels = hexToRgbChannels(value);
    const parts = [`--${token.cssVar}: ${value};`];
    if (channels) parts.push(`--${token.cssVar}-rgb: ${channels};`);
    return parts;
  }).join("");
  return `:root{${declarations}}`;
}
