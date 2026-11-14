// data-accordion: one [data-accordion-item] open at a time; its [data-accordion-panel] eases open and shut
import { gsap, still, phone } from "./motion.js";

const toggleOf = (item) => item.querySelector("[aria-expanded]");
const panelOf = (item) => item.querySelector("[data-accordion-panel]");

// heights move in whole pixels: a height that creeps under a pixel a frame leaves every row below it shimmering
export function initAccordions() {
  document.querySelectorAll("[data-accordion]").forEach((root) => {
    const items = [...root.querySelectorAll("[data-accordion-item]")].filter((item) => toggleOf(item));
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
      gsap.set(panel, { height: "auto", visibility: "visible", overflow: "hidden" });
      const to = open ? panel.offsetHeight : 0;
      if (open && !from) gsap.set(content, { opacity: 0, y: 12 });
      return gsap.timeline({ onComplete: () => gsap.set([panel, content], { clearProps: "height,visibility,overflow,opacity,transform" }) })
        .fromTo(panel, { height: from }, { height: to, duration: 0.7, ease: "glide", snap: { height: 1 } }, 0)
        .to(content, open ? { opacity: 1, y: 0, duration: 0.6, ease: "soft" } : { opacity: 0, duration: 0.3, ease: "power1.in" }, open ? 0.2 : 0);
    };
    items.forEach((item) => {
      toggleOf(item).addEventListener("click", () => {
        const open = !item.classList.contains("is-open");
        // heights are read before any class changes, so a row caught mid-move carries on from where it is
        const changes = items
          .map((other) => ({ other, on: open && other === item, from: panelOf(other)?.offsetHeight ?? 0 }))
          .filter(({ other, on }) => on !== other.classList.contains("is-open"));
        changes.forEach(({ other, on }) => mark(other, on));
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
