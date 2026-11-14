import { Anim } from "./anim.js";
import { still } from "./motion.js";

export function lockScroll(lock) {
  const root = document.documentElement;
  if (lock && !root.classList.contains("is-locked")) {
    root.style.setProperty("--scrollbar-gutter", `${window.innerWidth - root.clientWidth}px`);
  }
  // Lenis reads the scroll as it starts, so it must start while the gutter padding still holds the page width
  if (!lock) Anim.start();
  root.classList.toggle("is-locked", lock);
  if (lock) Anim.stop();
}

export function initDevicePixel() {
  const set = () => {
    document.documentElement.style.setProperty("--device-px", `${1 / devicePixelRatio}px`);
    matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener("change", set, { once: true });
  };
  set();
}

// typing in a field is not keyboard navigation, or a phone's own keyboard would bring the rings back
export function initFocusMode() {
  const root = document.documentElement;
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key !== "Tab" && e.target.closest?.("input, textarea, select, [contenteditable]")) return;
    root.classList.toggle("is-keyboard", true);
  }, true);
  document.addEventListener("pointerdown", () => root.classList.toggle("is-keyboard", false), true);
}

// data-hover-video: the card's video plays under the pointer and rewinds once it has faded back out
export function initHoverVideos() {
  const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  document.querySelectorAll("[data-hover-video]").forEach((card) => {
    const video = card.querySelector("video");
    if (!video) return;
    card.addEventListener("pointerenter", () => {
      if (!pointer.matches || still.matches) return;
      if (!video.getAttribute("src")) video.src = video.dataset.src;
      card.classList.add("is-playing");
      video.play().catch(() => card.classList.remove("is-playing"));
    });
    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-playing");
      video.pause();
    });
    video.addEventListener("transitionend", () => {
      if (!card.classList.contains("is-playing")) video.currentTime = 0;
    });
  });
}

// a lazy photo is decoded once it is within a screen of view, so no frame waits on its decode as it scrolls in
export function initEagerPhotos() {
  const photos = Array.from(document.querySelectorAll('img[loading="lazy"]'));
  if (!photos.length) return;
  const near = new IntersectionObserver((entries) => entries.forEach(({ target, isIntersecting }) => {
    if (!isIntersecting) return;
    near.unobserve(target);
    target.loading = "eager";
    target.decode().catch(() => {});
  }), { rootMargin: "100% 0px" });
  photos.forEach((img) => near.observe(img));
}

// video[data-ambient] plays muted only while on screen; under reduced motion it holds on its first frame
export function initAmbientVideos() {
  const videos = Array.from(document.querySelectorAll("video[data-ambient]"));
  if (!videos.length) return;
  const onScreen = new WeakSet();
  const sync = (video) => {
    if (still.matches) {
      video.pause();
      video.currentTime = 0;
    } else if (onScreen.has(video)) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };
  const view = new IntersectionObserver((entries) => entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) onScreen.add(target);
    else onScreen.delete(target);
    sync(target);
  }), { threshold: 0.3 });
  videos.forEach((video) => {
    video.addEventListener("playing", () => video.classList.add("is-live"), { once: true });
    view.observe(video);
  });
  still.addEventListener("change", () => videos.forEach(sync));
}

export function initScrollState() {
  const root = document.documentElement;
  const sync = () => root.classList.toggle("is-scrolled", window.scrollY > 0);
  sync();
  window.addEventListener("scroll", sync, { passive: true });
}
