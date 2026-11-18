// data-moments: from lg the block holds on screen while each [data-moments-item] is uncovered over the one before as the page scrolls
import { gsap, ScrollTrigger, settled } from "./motion.js";

const WIPE = { duration: 1.3, ease: "glide" };
const SETTLE = { duration: 1.6, ease: "soft" };
// share of the screen an incoming panel's content rises from, and a covered one's drifts up by
const LIFT = 0.14;
const SINK = 0.06;

export function initMoments() {
  document.querySelectorAll("[data-moments]").forEach((root) => {
    const panels = Array.from(root.querySelectorAll("[data-moments-item]"));
    if (panels.length < 2) return;
    gsap.matchMedia().add("(min-width: 992px) and (prefers-reduced-motion: no-preference)", () => pin(root, panels));
  });
}

function pin(root, panels) {
  root.classList.add("is-pinned");
  root.style.setProperty("--moments-count", panels.length);
  const insides = panels.map((panel) => panel.querySelector("[data-moments-inner]"));
  const photos = panels.map((panel) => panel.querySelector("[data-moments-photo]"));
  // the wipe moves a number and writes the clip from it: the browser shortens an inset() it reports
  const clips = panels.map((_, i) => ({ top: i ? 100 : 0 }));
  const draw = (i) => (panels[i].style.clipPath = `inset(${clips[i].top}% 0% 0% 0%)`);
  const offset = (i, index) => (i < index ? -SINK : i > index ? LIFT : 0) * window.innerHeight;
  let current = 0;

  const place = (index) => {
    current = index;
    panels.forEach((_, i) => {
      gsap.killTweensOf([clips[i], insides[i], photos[i]]);
      clips[i].top = i <= index ? 0 : 100;
      draw(i);
      gsap.set(insides[i], { y: offset(i, index) });
      gsap.set(photos[i], { scale: 1 });
    });
  };

  const go = (index) => {
    if (index === current) return;
    const from = current;
    current = index;
    panels.forEach((_, i) => {
      const top = i <= index ? 0 : 100;
      if (clips[i].top !== top || gsap.isTweening(clips[i])) {
        gsap.to(clips[i], { top, ...WIPE, overwrite: true, onUpdate: () => draw(i) });
      }
      const y = offset(i, index);
      if (Math.abs((gsap.getProperty(insides[i], "y") || 0) - y) > 0.5) {
        gsap.to(insides[i], settled(insides[i], { y, ...WIPE, overwrite: true }));
      }
      if (i > from && i <= index) {
        gsap.set(photos[i], { scale: 1.12 });
        gsap.to(photos[i], settled(photos[i], { scale: 1, ...SETTLE, overwrite: true }));
      }
    });
  };

  const at = (progress) => Math.round(progress * (panels.length - 1));
  place(0);
  ScrollTrigger.create({
    trigger: root,
    start: "top top",
    end: "bottom bottom",
    onRefresh: (self) => place(at(self.progress)),
    onUpdate: (self) => go(at(self.progress)),
  });

  return () => {
    root.classList.remove("is-pinned");
    root.style.removeProperty("--moments-count");
    panels.forEach((panel) => panel.style.removeProperty("clip-path"));
    gsap.set([...insides, ...photos], { clearProps: "transform" });
  };
}
