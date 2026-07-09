import { defineContentScript } from "wxt/sandbox";

import { startPageSync } from "../src/page-sync";
import { cloudflareStreamSite } from "../src/sites/cloudflare-stream";

function isCloudflareStreamEmbedFrame(): boolean {
  const { hostname, pathname, search } = window.location;

  return (
    hostname === "embed.cloudflarestream.com" &&
    pathname.startsWith("/embed/") &&
    new URLSearchParams(search).has("videoId")
  );
}

export default defineContentScript({
  matches: ["*://embed.cloudflarestream.com/embed/*"],

  // Critical: lets the extension run inside Cloudflare’s embedded iframe.
  allFrames: true,

  main() {
    if (!isCloudflareStreamEmbedFrame()) return;

    console.log("[fossync] Cloudflare Stream iframe active:", window.location.href);

    startPageSync(cloudflareStreamSite);
  },
});
