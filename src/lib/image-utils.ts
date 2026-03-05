export function upgradeUnsplashImageUrl(
  src: string,
  opts: { w: number; h?: number; q?: number },
): string {
  if (!src || typeof src !== "string") return src;
  if (!src.startsWith("http")) return src;

  try {
    const u = new URL(src);
    if (u.hostname !== "images.unsplash.com") return src;

    const q = Math.max(1, Math.min(100, opts.q ?? 85));
    u.searchParams.set("auto", "format");
    u.searchParams.set("fit", "crop");
    u.searchParams.set("q", String(q));
    u.searchParams.set("w", String(Math.max(1, Math.floor(opts.w))));
    if (opts.h) u.searchParams.set("h", String(Math.max(1, Math.floor(opts.h))));

    return u.toString();
  } catch {
    return src;
  }
}

export function getPartyHeroImageUrl(src: string): string {
  return upgradeUnsplashImageUrl(src, { w: 2400, h: 1350, q: 90 });
}

export function getPartyCardImageUrl(src: string): string {
  return upgradeUnsplashImageUrl(src, { w: 1400, h: 875, q: 85 });
}
