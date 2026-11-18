// data-slider: a row of cards that drags with momentum and eases to rest (Swiper)
import Swiper from "swiper";
import { A11y, FreeMode, Keyboard, Navigation } from "swiper/modules";
import { still, designPx } from "./motion.js";

const SPEED = 1000;
const pad = (n) => String(n).padStart(2, "0");

// a row is built once it comes near the screen: Swiper re-measures on every photo that loads inside it, and at page load that stalled the entrance
export function initSliders() {
  const near = new IntersectionObserver((entries) => entries.forEach(({ target, isIntersecting }) => {
    if (!isIntersecting) return;
    near.unobserve(target);
    build(target);
  }), { rootMargin: "150% 0px" });
  document.querySelectorAll("[data-slider]").forEach((el) => near.observe(el));
}

function build(el) {
  const scope = el.closest("[data-slider-scope]") || el.parentElement;
  const gap = parseFloat(el.dataset.sliderGap || "0");
  // data-slider-mode="snap" rests on a card; the default glides freely and stops where the momentum ends
  const snap = el.dataset.sliderMode === "snap";
  // optional: [data-slider-current] / [data-slider-total] show "01 / 03"; each [data-slider-tab] goes to its card
  const current = scope.querySelector("[data-slider-current]");
  const total = scope.querySelector("[data-slider-total]");
  const tabs = [...scope.querySelectorAll("[data-slider-tab]")];
  // [data-slider-caption] shows the active card's data-caption
  const caption = scope.querySelector("[data-slider-caption]");
  const loop = el.hasAttribute("data-slider-loop");
  const mark = (swiper) => {
    const index = loop ? swiper.realIndex : swiper.activeIndex;
    if (current) current.textContent = pad(index + 1);
    if (caption) caption.textContent = swiper.slides[swiper.activeIndex]?.dataset.caption || "";
    tabs.forEach((tab, i) => tab.setAttribute("aria-current", String(i === index)));
  };
  const swiper = new Swiper(el, {
    modules: [A11y, FreeMode, Keyboard, Navigation],
    slidesPerView: "auto",
    spaceBetween: designPx(gap),
    speed: still.matches ? 0 : SPEED,
    grabCursor: true,
    threshold: 6,
    resistanceRatio: 0.5,
    freeMode: snap ? false : { enabled: true, momentumRatio: 0.9, momentumVelocityRatio: 0.9, momentumBounce: false },
    // data-slider-rewind: the arrows wrap round, so neither is ever switched off
    rewind: !loop && el.hasAttribute("data-slider-rewind"),
    // data-slider-loop with data-slider-centred: the card in view sits centred, its neighbours showing either side, round and round
    loop,
    centeredSlides: el.hasAttribute("data-slider-centred"),
    keyboard: { enabled: true, onlyInViewport: true },
    navigation: {
      prevEl: scope.querySelector("[data-slider-prev]"),
      nextEl: scope.querySelector("[data-slider-next]"),
    },
    on: {
      beforeResize(swiper) {
        swiper.params.spaceBetween = designPx(gap);
      },
      slideChange(swiper) {
        mark(swiper);
        el.dispatchEvent(new CustomEvent("slider:change", { detail: { index: swiper.activeIndex } }));
      },
    },
  });
  if (total) total.textContent = pad(swiper.slides.length);
  tabs.forEach((tab, i) => tab.addEventListener("click", () => (loop ? swiper.slideToLoop(i) : swiper.slideTo(i))));
  // Safari loads a lazy photo only once it is on screen, so a card arrived blank and its photo popped in
  new IntersectionObserver((entries, watch) => {
    if (!entries[0].isIntersecting) return;
    watch.disconnect();
    el.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      img.loading = "eager";
      img.decode().catch(() => {});
    });
  }, { rootMargin: "100% 0px" }).observe(el);
}
