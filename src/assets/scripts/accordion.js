// data-accordion: one [data-accordion-item] open at a time (data-accordion-multi: each on its own); its [data-accordion-panel] eases open and shut
import { gsap, still, phone } from "./motion.js";

const toggleOf = (item) => item.querySelector("[aria-expanded]");
const panelOf = (item) => item.querySelector("[data-accordion-panel]");
// the page re-measures once the browser is idle, not on the frame the motion ends
const later = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 600 }) : setTimeout(fn, 200));
// a steady few pixels a frame with brief eased ends: on the long eased ends rows crept a pixel at a time and shivered
const pace = (distance) => gsap.utils.clamp(0.5, 0.8, Math.abs(distance) / 320);

// heights move in whole pixels: a height that creeps under a pixel a frame leaves every row below it shimmering
export function initAccordions() {
  document.querySelectorAll("[data-accordion]").forEach((root) => {
    const items = [...root.querySelectorAll("[data-accordion-item]")].filter((item) => toggleOf(item));
    const multi = root.hasAttribute("data-accordion-multi");
    const moves = new WeakMap(); // each panel's move, so a row caught mid-move is taken over
    const mark = (item, open) => {
      item.classList.toggle("is-open", open);
      toggleOf(item).setAttribute("aria-expanded", String(open));
    };
    // data-accordion-closed-mobile: below lg every row starts shut, whatever the markup opens
    if (root.hasAttribute("data-accordion-closed-mobile") && phone.matches) items.forEach((item) => mark(item, false));

    const move = (item, open, from) => {
      const panel = panelOf(item);
      if (!panel || still.matches) return null;
      const content = panel.firstElementChild;
      gsap.killTweensOf([panel, content]);
      if (moves.has(panel)) moves.get(panel).kill();
      gsap.set(panel, { height: "auto", visibility: "visible", overflow: "hidden" });
      const to = open ? panel.getBoundingClientRect().height : 0;
      const duration = pace(to - from);
      // the answer only fades: the panel already uncovers it, and a rise left it settling a fraction of a pixel as it landed
      if (open && !from) gsap.set(content, { opacity: 0 });
      // whole pixels on the way, the exact height on the last frame, so nothing shifts when it goes back to auto
      const size = { height: from };
      const step = gsap.timeline({ onComplete: () => gsap.set([panel, content], { clearProps: "height,visibility,overflow,opacity" }) })
        .to(size, { height: to, duration, ease: "power1.inOut", onUpdate: () => { panel.style.height = `${size.height === to ? to : Math.round(size.height)}px`; } }, 0)
        .to(content, open ? { opacity: 1, duration: duration + 0.2, ease: "power1.out" } : { opacity: 0, duration: duration * 0.6, ease: "power1.in" }, open ? 0.1 : 0);
      moves.set(panel, step);
      return step;
    };
    items.forEach((item) => {
      toggleOf(item).addEventListener("click", () => {
        const open = !item.classList.contains("is-open");
        // heights are read before any class changes, so a row caught mid-move carries on from where it is
        const changes = (multi ? [item] : items)
          .map((other) => ({ other, on: open && other === item, from: panelOf(other)?.offsetHeight ?? 0 }))
          .filter(({ other, on }) => on !== other.classList.contains("is-open"));
        changes.forEach(({ other, on }) => mark(other, on));
        const refresh = () => later(() => window.Anim?.refresh());
        const tl = gsap.timeline({ onComplete: refresh });
        changes.forEach(({ other, on, from }) => {
          const step = move(other, on, from);
          if (step) tl.add(step, 0);
        });
        if (!tl.getChildren().length) refresh();
      });
    });
  });
}
