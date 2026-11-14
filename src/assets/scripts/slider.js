// data-slider: a row of cards that drags with momentum and eases to rest (Swiper)
import Swiper from "swiper";
import { A11y, FreeMode, Keyboard, Navigation } from "swiper/modules";
import { still, designPx } from "./motion.js";

const SPEED = 1000;

export function initSliders() {
  document.querySelectorAll("[data-slider]").forEach((el) => {
    const scope = el.closest("[data-slider-scope]") || el.parentElement;
    const gap = parseFloat(el.dataset.sliderGap || "0");
    // data-slider-mode="snap" rests on a card; the default glides freely and stops where the momentum ends
    const snap = el.dataset.sliderMode === "snap";
    new Swiper(el, {
      modules: [A11y, FreeMode, Keyboard, Navigation],
      slidesPerView: "auto",
      spaceBetween: designPx(gap),
      speed: still.matches ? 0 : SPEED,
      grabCursor: true,
      threshold: 6,
      resistanceRatio: 0.5,
      freeMode: snap ? false : { enabled: true, momentumRatio: 0.9, momentumVelocityRatio: 0.9, momentumBounce: false },
      // data-slider-rewind: the arrows wrap round, so neither is ever switched off
      rewind: el.hasAttribute("data-slider-rewind"),
      keyboard: { enabled: true, onlyInViewport: true },
      navigation: {
        prevEl: scope.querySelector("[data-slider-prev]"),
        nextEl: scope.querySelector("[data-slider-next]"),
      },
      on: {
        beforeResize(swiper) {
          swiper.params.spaceBetween = designPx(gap);
        },
      },
    });
    // Safari loads a lazy photo only once it is on screen, so a card arrived blank and its photo popped in
    new IntersectionObserver((entries, watch) => {
      if (!entries[0].isIntersecting) return;
      watch.disconnect();
      el.querySelectorAll('img[loading="lazy"]').forEach((img) => {
        img.loading = "eager";
        img.decode().catch(() => {});
      });
    }, { rootMargin: "100% 0px" }).observe(el);
  });
}
