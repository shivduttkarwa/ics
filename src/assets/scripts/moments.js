// data-moments: from lg the block holds on screen while each [data-moments-item] after the first rolls over the last from the right as the page scrolls
import { gsap, ScrollTrigger, landing, cssEase } from "./motion.js";

// % of its width a photo drifts across its frame per moment of scroll
const DRIFT = 6;
// an incoming moment's copy fades in from the right, item after item, once the edge has uncovered half of it
const ARRIVE = { x: 40, duration: 0.7, stagger: 0.09 };

export function initMoments() {
  document.querySelectorAll("[data-moments]").forEach((root) => {
    const panels = Array.from(root.querySelectorAll("[data-moments-item]"));
    if (panels.length < 2) return;
    gsap.matchMedia().add("(min-width: 992px) and (prefers-reduced-motion: no-preference)", () => roll(root, panels));
  });
}

function roll(root, panels) {
  root.classList.add("is-pinned");
  root.style.setProperty("--moments-count", panels.length);
  const last = panels.length - 1;
  const incoming = panels.slice(1);
  const copies = incoming.map((panel) => panel.querySelector("[data-moments-copy]"));
  const arrivals = copies.map((copy) => ({ copy, items: Array.from(copy.children), at: Infinity, done: false }));
  const items = arrivals.flatMap((arrival) => arrival.items);

  // uncovered as it stands: anim.js leaves its reveals, the photo shows at once and the copy waits for its arrival
  incoming.forEach((panel) => panel.querySelectorAll("[data-anim]").forEach((el) => {
    el.setAttribute("data-anim-bound", "");
    if (!items.includes(el)) el.classList.add("is-revealed");
  }));
  gsap.set(items, { autoAlpha: 0 });

  // they stand off to the side until uncovered, out of the lazy loader's sight, so they load as the block nears
  const photos = incoming.flatMap((panel) => Array.from(panel.querySelectorAll('img[loading="lazy"]')));
  ScrollTrigger.create({ trigger: root, start: "top 200%", once: true, onEnter: () => photos.forEach((img) => {
    img.loading = "eager";
    img.decode().catch(() => {});
  }) });

  const width = () => root.offsetWidth;
  const measure = () => {
    const left = root.getBoundingClientRect().left;
    arrivals.forEach((arrival, n) => {
      const box = arrival.copy.getBoundingClientRect();
      arrival.at = n + 1 - (box.left - left + box.width / 2) / width();
    });
  };
  const tl = gsap.timeline({
    defaults: { ease: "none", duration: 1, force3D: true },
    scrollTrigger: {
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      invalidateOnRefresh: true,
      onRefresh: measure,
      onUpdate: (self) => arrivals.forEach((arrival) => {
        if (arrival.done || self.progress * last < arrival.at) return;
        arrival.done = true;
        arrive(arrival.items);
      }),
    },
  });
  // the panel comes in from the right while its content moves against it, so the content stands where it rests and the edge uncovers it
  incoming.forEach((panel, n) => {
    tl.fromTo(panel, { x: width }, { x: 0 }, n).fromTo(panel.firstElementChild, { x: () => -width() }, { x: 0 }, n);
  });
  // each photo drifts the whole time its moment is on screen, until the next has rolled over it
  panels.forEach((panel, i) => {
    const from = Math.max(0, i - 1);
    const to = Math.min(i + 1, last);
    tl.fromTo(panel.querySelector("[data-moments-photo]"), { xPercent: i ? DRIFT : 0 }, { xPercent: i < last ? -DRIFT : 0, duration: to - from }, from);
  });
  measure();

  return () => {
    root.classList.remove("is-pinned");
    root.style.removeProperty("--moments-count");
    items.forEach((el) => {
      el.getAnimations().forEach((run) => run.cancel());
      el.classList.add("is-revealed");
    });
    gsap.set(items, { clearProps: "opacity,visibility" });
  };
}

// on the compositor, each item on the layer its stylesheet holds, so it lands with no change
function arrive(items) {
  const { ease, cut } = landing("rise", ARRIVE.x);
  const move = { duration: ARRIVE.duration * cut * 1000, easing: cssEase(ease, "cubic-bezier(0.33, 1, 0.68, 1)", 80), fill: "both" };
  const fade = { duration: ARRIVE.duration * 1000, easing: cssEase("power1.out", "ease-out"), fill: "both" };
  items.forEach((el, i) => {
    const delay = i * ARRIVE.stagger * 1000;
    const runs = [
      el.animate([{ transform: `translate(${ARRIVE.x}px, 0px)` }, { transform: "none" }], { ...move, delay }),
      el.animate([{ opacity: 0 }, { opacity: 1 }], { ...fade, delay }),
    ];
    el.classList.add("is-revealed");
    gsap.set(el, { clearProps: "opacity,visibility" });
    Promise.all(runs.map((run) => run.finished)).then(() => runs.forEach((run) => run.cancel()), () => {});
  });
}
