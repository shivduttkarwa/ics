import { Anim } from "./anim.js";
import { gsap } from "gsap";

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

export function initDisclosures() {
  document.querySelectorAll("[data-disclosure]").forEach((root) => {
    const toggle = root.querySelector("[aria-expanded]");
    if (!toggle) return;
    const set = (open) => {
      root.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => set(!root.classList.contains("is-open")));
    // an open one takes Escape for itself, so inside the menu it closes before the menu does
    root.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !root.classList.contains("is-open")) return;
      e.stopPropagation();
      set(false);
      toggle.focus();
    });
    document.addEventListener("click", (e) => {
      if (!root.contains(e.target)) set(false);
    });
  });
}

// panels move in whole pixels: an eased height that creeps under a pixel a frame leaves every row below shimmering as it settles
export function initAccordions() {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ease = "cubic-bezier(0.4, 0, 0.2, 1)";
  document.querySelectorAll("[data-accordion]").forEach((root) => {
    const items = [...root.querySelectorAll("[data-accordion-item]")];
    const move = (item, open, from) => {
      const panel = item.querySelector("[data-accordion-panel]");
      if (!panel || still.matches) return null;
      const content = panel.firstElementChild;
      gsap.killTweensOf([panel, content]);
      gsap.set(panel, { height: "auto", visibility: "visible" });
      const to = open ? panel.offsetHeight : 0;
      if (open && !from) gsap.set(content, { opacity: 0 });
      return gsap.timeline({ onComplete: () => gsap.set([panel, content], { clearProps: "height,visibility,opacity" }) })
        .fromTo(panel, { height: from }, { height: to, duration: 0.6, ease, snap: { height: 1 } }, 0)
        .to(content, open ? { opacity: 1, duration: 0.45, ease: "power1.out" } : { opacity: 0, duration: 0.25, ease: "power1.in" }, open ? 0.15 : 0);
    };
    items.forEach((item) => {
      item.querySelector("[aria-expanded]").addEventListener("click", () => {
        const open = !item.classList.contains("is-open");
        // heights are read before any class changes, so a row caught mid-move carries on from where it is
        const changes = items
          .map((other) => ({ other, on: open && other === item, from: other.querySelector("[data-accordion-panel]")?.offsetHeight ?? 0 }))
          .filter(({ other, on }) => on !== other.classList.contains("is-open"));
        changes.forEach(({ other, on }) => {
          other.classList.toggle("is-open", on);
          other.querySelector("[aria-expanded]").setAttribute("aria-expanded", String(on));
        });
        const tl = gsap.timeline({ onComplete: () => window.Anim?.refresh() });
        changes.forEach(({ other, on, from }) => {
          const step = move(other, on, from);
          if (step) tl.add(step, 0);
        });
        if (!tl.getChildren().length) window.Anim?.refresh();
      });
    });
  });
}


export function initHoverVideos() {
  const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.querySelectorAll("[data-hover-video]").forEach((card) => {
    const video = card.querySelector("video");
    if (!video) return;
    card.addEventListener("pointerenter", () => {
      if (!pointer.matches || still.matches || card.classList.contains("is-open")) return;
      if (!video.getAttribute("src")) video.src = video.dataset.src;
      card.classList.add("is-playing");
      video.play().catch(() => card.classList.remove("is-playing"));
    });
    card.addEventListener("pointerleave", () => {
      if (card.classList.contains("is-open")) return;
      card.classList.remove("is-playing");
      video.pause();
    });
    video.addEventListener("transitionend", () => {
      if (!card.classList.contains("is-playing")) video.currentTime = 0;
    });
  });
}

// data-video-toggle: plays the card's video from the start with sound; the button, its end, Escape or scrolling away closes it

// background videos play muted only while on screen, once their reveal has landed and while their promo isn't
// playing; under reduced motion they hold on their first frame. is-live marks one that has
// started, for a fade-in over its still
const ambientStill = window.matchMedia("(prefers-reduced-motion: reduce)");
const ambientOnScreen = new WeakSet();
const REVEALING = '[data-anim="reveal"]:not(.is-revealed, [data-anim-scrub])';
const awaitingReveal = new WeakSet();

// looked up while held, not at load: a data-anim-group only marks its children as reveals once anim starts
function revealing(video) {
  const root = document.documentElement;
  if (!root.hasAttribute("data-anim-live") || root.classList.contains("anim-reduced")) return false;
  const reveal = video.closest(REVEALING);
  if (reveal && !awaitingReveal.has(video)) {
    awaitingReveal.add(video);
    const landed = new MutationObserver(() => {
      if (!reveal.classList.contains("is-revealed")) return;
      landed.disconnect();
      awaitingReveal.delete(video);
      syncAmbient(video);
    });
    landed.observe(reveal, { attributeFilter: ["class"] });
  }
  return Boolean(reveal);
}

function syncAmbient(video) {
  if (ambientStill.matches) {
    video.pause();
    video.currentTime = 0;
  } else if (!ambientOnScreen.has(video) || video.closest(".is-playing") || revealing(video)) {
    video.pause();
  } else {
    video.play().catch(() => {});
  }
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

export function initAmbientVideos() {
  const videos = Array.from(document.querySelectorAll("video[data-ambient]"));
  if (!videos.length) return;
  const view = new IntersectionObserver((entries) => entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) ambientOnScreen.add(target);
    else ambientOnScreen.delete(target);
    syncAmbient(target);
  }), { threshold: 0.3 });
  videos.forEach((video) => {
    video.addEventListener("playing", () => video.classList.add("is-live"), { once: true });
    view.observe(video);
    if (ambientStill.matches) syncAmbient(video);
  });
  ambientStill.addEventListener("change", () => videos.forEach(syncAmbient));
}

const MARQUEE_SPEED = 35; // design px per second, the same for every row whatever its length

export function initMarquees() {
  const tracks = Array.from(document.querySelectorAll("[data-marquee]"));
  if (!tracks.length) return;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  const build = () => {
    const scale = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
    tracks.forEach((track) => {
      const list = track.querySelector("ul");
      if (!list) return;
      track.classList.remove("is-running");
      track.querySelectorAll("[data-marquee-copy]").forEach((copy) => copy.remove());
      list.style.width = "";
      list.querySelectorAll("img").forEach((img) => {
        img.style.width = `${parseFloat(img.getAttribute("width")) * scale}px`;
      });
      if (still.matches) return;
      // whole device pixels, or each copy sits a fraction of a pixel out of step, draws differently and the loop snaps as it wraps
      const width = Math.ceil(list.getBoundingClientRect().width * devicePixelRatio) / devicePixelRatio;
      list.style.width = `${width}px`;
      const lane = track.parentElement.clientWidth;
      if (!width) return;
      const copies = Math.ceil(lane / width) + 1;
      for (let i = 0; i < copies; i++) {
        const copy = list.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        copy.setAttribute("data-marquee-copy", "");
        copy.querySelectorAll("a").forEach((a) => a.setAttribute("tabindex", "-1"));
        track.append(copy);
      }
      // the keyframes move one list's share of the track, so the loop stays seamless whatever the text measures
      track.style.setProperty("--marquee-lists", copies + 1);
      track.style.setProperty("--marquee-time", `${width / (MARQUEE_SPEED * scale)}s`);
      track.classList.add("is-running");
    });
  };
  build();
  document.fonts?.ready.then(build);
  // a phone's toolbar changes only the height, which leaves both of these alone
  const size = () => `${window.innerWidth} ${getComputedStyle(document.documentElement).fontSize}`;
  let built = size();
  let timer = 0;
  window.addEventListener("resize", () => {
    if (size() === built) return;
    built = size();
    clearTimeout(timer);
    timer = setTimeout(build, 200);
  });
  still.addEventListener("change", build);
}

export function initScrollState() {
  const root = document.documentElement;
  const sync = () => root.classList.toggle("is-scrolled", window.scrollY > 0);
  sync();
  window.addEventListener("scroll", sync, { passive: true });
}

export function initStickyHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const tolerance = 8;
  let zone = header.offsetHeight;
  let anchor = window.scrollY;
  const sync = () => {
    const y = window.scrollY;
    if (y <= 0) {
      header.classList.remove("is-stuck", "is-compact", "is-hidden");
      anchor = 0;
      return;
    }
    if (!header.classList.contains("is-stuck")) {
      if (y > zone) {
        header.classList.add("is-instant", "is-held", "is-stuck", "is-compact", "is-hidden");
        void header.offsetHeight;
        header.classList.remove("is-instant");
      }
      anchor = y;
      return;
    }
    header.classList.toggle("is-compact", y > zone);
    if (y <= zone || Math.abs(y - anchor) >= tolerance) {
      header.classList.toggle("is-hidden", y > zone && y > anchor);
      anchor = y;
    }
  };
  sync();
  window.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", () => { zone = header.offsetHeight; });
}

