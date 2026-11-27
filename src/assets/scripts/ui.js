import { Anim } from "./anim.js";
import { gsap, still, landing } from "./motion.js";

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

// data-hover-video: the card's video fades in under the pointer once it is playing and rewinds once it has faded back out
export function initHoverVideos() {
  const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  document.querySelectorAll("[data-hover-video]").forEach((card) => {
    const video = card.querySelector("video");
    if (!video) return;
    let over = false;
    const stop = () => {
      over = false;
      card.classList.remove("is-playing");
      video.pause();
    };
    card.addEventListener("pointerenter", () => {
      if (!pointer.matches || still.matches) return;
      over = true;
      if (!video.getAttribute("src")) video.src = video.dataset.src;
      video.play().then(() => card.classList.toggle("is-playing", over), () => {});
    });
    card.addEventListener("pointerleave", stop);
    card.addEventListener("click", (event) => {
      if (event.target.closest("a[data-video-popup][href]")) stop();
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
  // a film waits for the entrance: its first frames arriving under the hero title's rising lines dropped frames
  let armed = false;
  const sync = (video) => {
    if (still.matches) {
      video.pause();
      video.currentTime = 0;
    } else if (onScreen.has(video) && armed) {
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
  Anim.played.then(() => {
    armed = true;
    videos.forEach(sync);
  });
}

const embed = (url) => {
  const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  const src = youtube ? `https://www.youtube-nocookie.com/embed/${youtube[1]}?autoplay=1&rel=0&playsinline=1` : vimeo ? `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1` : null;
  if (!src) return Object.assign(document.createElement("video"), { src: url, controls: true, autoplay: true, playsInline: true });
  return Object.assign(document.createElement("iframe"), { src, title: "Video", allow: "autoplay; fullscreen; picture-in-picture", allowFullscreen: true });
};

// a[data-video-popup] opens its href (a video file, a YouTube or a Vimeo link) in the popup instead of leaving the page; ="portrait" opens it in a tall card-sized frame
export function initVideoPopup() {
  const dialog = document.getElementById("video-popup");
  const links = Array.from(document.querySelectorAll("a[data-video-popup][href]"));
  if (!dialog || !links.length) return;
  const frame = dialog.querySelector("[data-video-popup-frame]");
  const box = dialog.querySelector("[data-video-popup-box]");
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let opener = null;
  let turn = 0;

  const finish = () => {
    dialog.close();
    frame.replaceChildren();
    box.style.removeProperty("--video-ratio");
    gsap.set([dialog, box], { clearProps: "opacity,transform" });
    lockScroll(false);
    opener?.focus({ preventScroll: true });
  };

  const close = () => {
    if (!dialog.open) return;
    turn++;
    gsap.killTweensOf([dialog, box]);
    if (still.matches) return finish();
    gsap.to(box, { opacity: 0, y: 12, duration: 0.3, ease: "power1.in" });
    gsap.to(dialog, { opacity: 0, duration: 0.4, delay: 0.05, ease: "power1.in", onComplete: finish });
  };

  // a video file shows once its size is known, so a portrait clip opens tall instead of jumping from 16:9
  const sized = (media) => {
    if (!(media instanceof HTMLVideoElement)) return Promise.resolve();
    return Promise.race([wait(1500), new Promise((resolve) => {
      media.addEventListener("loadedmetadata", () => {
        if (media.videoWidth) box.style.setProperty("--video-ratio", `${media.videoWidth} / ${media.videoHeight}`);
        resolve();
      }, { once: true });
      media.addEventListener("error", resolve, { once: true });
    })]);
  };

  links.forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    const mine = ++turn;
    const portrait = link.dataset.videoPopup === "portrait";
    opener = link;
    gsap.killTweensOf([dialog, box]);
    const media = embed(link.href);
    box.style.removeProperty("--video-ratio");
    dialog.classList.toggle("video-popup--portrait", portrait);
    frame.replaceChildren(media);
    lockScroll(true);
    dialog.showModal();
    dialog.querySelector("[data-video-popup-close]").focus();
    gsap.set(box, still.matches ? { opacity: 0 } : { opacity: 0, y: 24 });
    if (!still.matches) gsap.fromTo(dialog, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" });
    Promise.all([portrait ? null : sized(media), wait(still.matches ? 0 : 150)]).then(() => {
      if (mine !== turn) return;
      if (still.matches) return gsap.set(box, { clearProps: "opacity,transform" });
      const land = landing("soft", 24);
      gsap.to(box, { opacity: 1, y: 0, duration: 0.9 * land.cut, ease: land.ease, onComplete: () => gsap.set([dialog, box], { clearProps: "opacity,transform" }) });
    });
  }));

  // a [data-video-card] opens its popup link wherever it is clicked
  document.querySelectorAll("[data-video-card]").forEach((card) => {
    const link = card.querySelector("a[data-video-popup][href]");
    if (!link) return;
    card.addEventListener("click", (event) => {
      if (!event.target.closest("a, button")) link.click();
    });
  });

  dialog.querySelector("[data-video-popup-close]").addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
}

// [data-dialog-open] opens the <dialog data-dialog> in its [data-dialog-scope]; its close button, Esc or a click outside the panel shuts it
export function initDialogs() {
  document.querySelectorAll("[data-dialog-open]").forEach((opener) => {
    const dialog = opener.closest("[data-dialog-scope]")?.querySelector("dialog[data-dialog]");
    if (!dialog) return;
    const panel = dialog.querySelector("[data-dialog-panel]") || dialog;
    let tl = null;

    const finish = () => {
      dialog.close();
      gsap.set([dialog, panel], { clearProps: "opacity,transform" });
      lockScroll(false);
      opener.focus({ preventScroll: true });
    };

    const close = () => {
      if (!dialog.open) return;
      tl?.kill();
      if (still.matches) return finish();
      tl = gsap.timeline({ onComplete: finish })
        .to(panel, { opacity: 0, y: 12, duration: 0.3, ease: "power1.in" }, 0)
        .to(dialog, { opacity: 0, duration: 0.4, ease: "power1.in" }, 0.05);
    };

    opener.addEventListener("click", () => {
      tl?.kill();
      lockScroll(true);
      dialog.showModal();
      dialog.querySelector("[data-dialog-close]")?.focus();
      if (still.matches) return;
      const land = landing("soft", 24);
      tl = gsap.timeline({ onComplete: () => gsap.set([dialog, panel], { clearProps: "opacity,transform" }) })
        .fromTo(dialog, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" }, 0)
        .fromTo(panel, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9 * land.cut, ease: land.ease }, 0.15);
    });

    dialog.querySelectorAll("[data-dialog-close]").forEach((button) => button.addEventListener("click", close));
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close();
    });
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });
  });
}

// a form whose action is not set yet (the static build) stays on the page
export function initScrollState() {
  const root = document.documentElement;
  const sync = () => root.classList.toggle("is-scrolled", window.scrollY > 0);
  sync();
  window.addEventListener("scroll", sync, { passive: true });
  // the ground turns the footer's colour as the footer comes into view: a phone's fast fling reached the end before a later switch
  const footer = document.querySelector(".site-footer");
  if (footer) new IntersectionObserver(([entry]) => root.classList.toggle("is-at-foot", entry.isIntersecting)).observe(footer);
}
