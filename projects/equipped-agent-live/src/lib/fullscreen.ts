// One key, one behaviour, both screens.
//
// A projector setup is somebody else's laptop, five minutes before a room
// fills up. F toggles fullscreen; Escape is the browser's own way out and we
// don't fight it. Vendor-prefixed Safari is included because the machine
// plugged into the HDMI is, often enough, an old MacBook.

type WebkitDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};
type WebkitEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

export function toggleFullscreen(): void {
  const doc = document as WebkitDoc;
  const el = document.documentElement as WebkitEl;
  const on = Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement);
  try {
    if (on) void (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
    else void (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.());
  } catch {
    // A browser that refuses fullscreen is not a reason to break the show.
  }
}

/** True while the document is fullscreen, kept in sync with the browser's own
 *  exits (Escape, the OS, a second display being unplugged). */
export function watchFullscreen(cb: (on: boolean) => void): () => void {
  const read = () => {
    const doc = document as WebkitDoc;
    cb(Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement));
  };
  read();
  document.addEventListener("fullscreenchange", read);
  document.addEventListener("webkitfullscreenchange", read);
  return () => {
    document.removeEventListener("fullscreenchange", read);
    document.removeEventListener("webkitfullscreenchange", read);
  };
}
