import { isHarnessOrigin } from "./config";

function isCloudflareStreamHost(hostname: string): boolean {
  return hostname === "cloudflarestream.com" || hostname.endsWith(".cloudflarestream.com");
}

function isCloudflareStreamWatchOrIframePath(pathname: string): boolean {
  return /^\/[^/]+\/(watch|iframe)\/?$/.test(pathname);
}

function isCloudflareStreamEmbedUrl(u: URL): boolean {
  return (
    u.hostname === "embed.cloudflarestream.com" &&
    u.pathname.startsWith("/embed/") &&
    u.searchParams.has("videoId")
  );
}

export function isSupportedContentUrl(url: string): boolean {
  try {
    const u = new URL(url);

    if (isHarnessOrigin(u.origin)) return true;

    if (u.hostname === "www.youtube.com") return u.pathname === "/watch";
    if (u.hostname === "www.crunchyroll.com") return u.pathname.startsWith("/watch/");

    if (isCloudflareStreamHost(u.hostname)) {
      return isCloudflareStreamWatchOrIframePath(u.pathname);
    }

    if (isCloudflareStreamEmbedUrl(u)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
