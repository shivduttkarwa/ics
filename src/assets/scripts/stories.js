// data-story: the card's [data-story-toggle] opens it in place to show its [data-story-more] parts and reads "Close"
import { gsap, still, designPx, landing } from "./motion.js";

export function initStories() {
  document.querySelectorAll("[data-story]").forEach((card) => {
    const toggle = card.querySelector("[data-story-toggle]");
    if (!toggle) return;
    const label = toggle.querySelector(".btn__label");
    const copy = card.querySelector("[data-story-copy]");
    const words = { open: label.textContent, shut: toggle.dataset.storyClose || "Close" };
    let busy = false;

    const mark = (open) => {
      card.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      label.textContent = open ? words.shut : words.open;
    };

    // a long story read to its end: bring the card's top back into view as it shuts
    const backToTop = () => {
      const top = card.getBoundingClientRect().top;
      if (top >= 0) return;
      const offset = -designPx(120);
      if (window.Anim?.lenis && !still.matches) window.Anim.lenis.scrollTo(card, { offset, duration: 1 });
      else window.scrollTo(0, window.scrollY + top + offset);
    };

    toggle.addEventListener("click", () => {
      if (busy) return;
      const open = !card.classList.contains("is-open");
      if (still.matches) {
        mark(open);
        if (!open) backToTop();
        window.Anim?.refresh();
        return;
      }
      busy = true;
      const more = () => card.querySelectorAll("[data-story-more]");
      // the copy fades out, the card eases to its new height in whole pixels, then the copy and the second photo fade in
      gsap.timeline()
        .to(open ? copy : [copy, ...more()], { opacity: 0, duration: 0.25, ease: "power1.in" })
        .call(() => {
          const from = card.offsetHeight;
          mark(open);
          const to = card.offsetHeight;
          if (!open) backToTop();
          const rise = designPx(16);
          const land = landing("soft", rise);
          const tl = gsap.timeline({
            onComplete: () => {
              gsap.set([card, copy, ...more()], { clearProps: "height,opacity,transform" });
              busy = false;
              window.Anim?.refresh();
            },
          })
            .fromTo(card, { height: from }, { height: to, duration: 0.8, ease: "glide", snap: { height: 1 } }, 0)
            .fromTo(copy, { opacity: 0, y: rise }, { opacity: 1, y: 0, duration: 0.7 * land.cut, ease: land.ease }, 0.3);
          if (open) tl.fromTo(more(), { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "soft" }, 0.3);
        });
    });
  });
}
