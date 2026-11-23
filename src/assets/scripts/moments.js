// data-moments: from lg the block holds on screen while its [data-moments-item] panels pass across it as the page scrolls
import { gsap } from "./motion.js";

// % of its width a panel's photo drifts across its frame while the panel passes
const DRIFT = 6;
// share of the screen a panel's copy starts ahead of it as it comes in
const LEAD = 0.08;

export function initMoments() {
  document.querySelectorAll("[data-moments]").forEach((root) => {
    const panels = Array.from(root.querySelectorAll("[data-moments-item]"));
    if (panels.length < 2) return;
    gsap.matchMedia().add("(min-width: 992px) and (prefers-reduced-motion: no-preference)", () => pan(root, panels));
  });
}

function pan(root, panels) {
  root.classList.add("is-pinned");
  root.style.setProperty("--moments-count", panels.length);
  const stage = root.querySelector("[data-moments-stage]");
  const track = gsap.to(stage, {
    x: () => -(panels.length - 1) * stage.offsetWidth,
    ease: "none",
    scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: true, invalidateOnRefresh: true },
  });
  const along = (panel, start, end) => ({ trigger: panel, containerAnimation: track, start, end, scrub: true, invalidateOnRefresh: true });
  panels.forEach((panel, i) => {
    gsap.fromTo(panel.querySelector("[data-moments-photo]"), { xPercent: -DRIFT }, { xPercent: DRIFT, ease: "none", scrollTrigger: along(panel, "left right", "right left") });
    if (i) gsap.fromTo(panel.querySelector("[data-moments-copy]"), { x: () => LEAD * window.innerWidth }, { x: 0, ease: "none", scrollTrigger: along(panel, "left right", "left left") });
  });

  return () => {
    root.classList.remove("is-pinned");
    root.style.removeProperty("--moments-count");
  };
}
