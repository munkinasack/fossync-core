import { defineContentScript } from "wxt/sandbox";

function isCloudflareStreamWatchPage(): boolean {
  const { hostname, pathname } = window.location;

  const isCloudflareStreamHost =
    hostname === "cloudflarestream.com" || hostname.endsWith(".cloudflarestream.com");

  return isCloudflareStreamHost && /^\/[^/]+\/watch\/?$/.test(pathname);
}

function isCloudflarePlayerIframe(iframe: HTMLIFrameElement): boolean {
  try {
    const url = new URL(iframe.src);

    return (
      url.hostname === "embed.cloudflarestream.com" &&
      url.pathname.startsWith("/embed/") &&
      url.searchParams.has("videoId")
    );
  } catch {
    return false;
  }
}

function findCloudflarePlayerIframe(): HTMLIFrameElement | null {
  return Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe")).find(
    isCloudflarePlayerIframe,
  ) ?? null;
}

function mirrorWatchHashToPlayerIframe(): boolean {
  const iframe = findCloudflarePlayerIframe();
  if (!iframe) return false;

  const iframeUrl = new URL(iframe.src);
  const wantedHash = window.location.hash || "";

  if (iframeUrl.hash === wantedHash) return true;

  iframeUrl.hash = wantedHash;
  iframe.src = iframeUrl.toString();

  console.log("[fossync] mirrored Cloudflare /watch hash into player iframe:", wantedHash);

  return true;
}

export default defineContentScript({
  matches: ["*://*.cloudflarestream.com/*"],

  main() {
    if (!isCloudflareStreamWatchPage()) return;

    console.log("[fossync] Cloudflare Stream /watch bridge active:", window.location.href);

    mirrorWatchHashToPlayerIframe();

    window.addEventListener("hashchange", () => {
      mirrorWatchHashToPlayerIframe();
    });

    const observer = new MutationObserver(() => {
      mirrorWatchHashToPlayerIframe();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });

    // Belt-and-suspenders polling while Cloudflare's deferred embed script boots.
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;

      const found = mirrorWatchHashToPlayerIframe();

      if (found || attempts >= 60) {
        window.clearInterval(timer);
      }
    }, 250);

    window.addEventListener(
      "pagehide",
      () => {
        observer.disconnect();
        window.clearInterval(timer);
      },
      { once: true },
    );
  },
});
