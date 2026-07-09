import type { SiteModule } from "../page-sync";

export const cloudflareStreamSite: SiteModule = {
  findVideo: () => waitForVideo(),
};

function findVideoDeep(root: Document | ShadowRoot = document): HTMLVideoElement | null {
  const directVideo = root.querySelector<HTMLVideoElement>("video");
  if (directVideo) return directVideo;

  // Some players hide internals in open shadow DOM.
  for (const element of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    const shadow = element.shadowRoot;
    if (!shadow) continue;

    const shadowVideo = findVideoDeep(shadow);
    if (shadowVideo) return shadowVideo;
  }

  return null;
}

function waitForVideo(timeoutMs = 15000): Promise<HTMLVideoElement | null> {
  const start = Date.now();

  return new Promise((resolve) => {
    const tick = () => {
      const video = findVideoDeep();

      if (video) return resolve(video);
      if (Date.now() - start >= timeoutMs) return resolve(null);

      window.setTimeout(tick, 250);
    };

    tick();
  });
}
