// data-stage: full-width slides stacked on one another; the next one wipes in over the current while both photos drift
import { gsap, Observer, ScrollTrigger, still, settled, landing } from "./motion.js";
import { riseLines } from "./anim.js";

const WIPE = { duration: 1.4, ease: "glide" };
const DRIFT = 16; // % of its own width each photo travels during the wipe
const ZOOM = 1.12;
// the wipe uncovers the copy on the left last when it comes from the right, so the copy starts later that way
const COPY = { next: 0.7, back: 0.4, items: 0.25 };
const CLEAR = "transform,opacity,visibility,clipPath,zIndex";
const pad = (n) => String(n).padStart(2, "0");

export function initStages() {
  document.querySelectorAll("[data-stage]").forEach((root) => {
    const slides = Array.from(root.querySelectorAll("[data-stage-slide]"));
    if (!slides.length) return;
    const current = root.querySelector("[data-stage-current]");
    const total = root.querySelector("[data-stage-total]");
    const fill = root.querySelector("[data-stage-progress]");
    const nav = root.querySelector("[data-stage-nav]");
    const prev = root.querySelector("[data-stage-prev]");
    const next = root.querySelector("[data-stage-next]");
    const delay = parseFloat(root.dataset.stageAutoplay || "0");
    const auto = () => delay > 0 && slides.length > 1 && !still.matches;
    const hold = { view: true, hover: false, focus: false };

    let index = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));
    let busy = false;
    let queued = null;
    let ready = still.matches;
    let copy = null; // the incoming title and items, which outlast the wipe
    let timer = null; // the autoplay run: the progress line fills, then the next slide comes

    const media = (slide) => slide.querySelector("[data-stage-media]");
    const title = (slide) => slide.querySelector("[data-stage-title]");
    const items = (slide) => Array.from(slide.querySelectorAll("[data-stage-item]"));
    const words = (slide) => [title(slide), ...items(slide)].filter(Boolean);

    const mark = () => slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === index);
      slide.inert = i !== index;
    });
    const tone = () => { root.dataset.stageTone = slides[index].dataset.stageTone || ""; };
    const count = (dir) => {
      if (!current) return;
      if (still.matches || !dir) return void (current.textContent = pad(index + 1));
      const land = landing("soft", 0.6 * current.offsetHeight);
      gsap.timeline()
        .to(current, { yPercent: -60 * dir, autoAlpha: 0, duration: 0.35, ease: "power2.in" })
        .call(() => { current.textContent = pad(index + 1); })
        .fromTo(current, { yPercent: 60 * dir }, { yPercent: 0, autoAlpha: 1, duration: 0.6 * land.cut, ease: land.ease, clearProps: "transform,opacity,visibility" });
    };
    // with no autoplay the line shows how far through the slides we are
    const place = (duration = 0) => {
      if (fill && !auto()) gsap.to(fill, { scaleX: (index + 1) / slides.length, duration, ease: WIPE.ease, overwrite: true });
    };

    const arm = () => {
      if (!auto() || busy || !ready) return;
      if (!timer) {
        const run = {
          duration: delay / 1000,
          ease: "none",
          paused: true,
          onComplete: () => {
            timer = null;
            go(index + 1, 1);
          },
        };
        timer = fill ? gsap.fromTo(fill, { scaleX: 0 }, { scaleX: 1, overwrite: true, ...run }) : gsap.to({}, run);
      }
      timer.paused(hold.view || hold.hover || hold.focus || document.hidden);
    };
    const disarm = () => {
      timer?.kill();
      timer = null;
      if (fill && auto()) gsap.to(fill, { scaleX: 0, duration: 0.6, ease: "glide", overwrite: true });
    };

    // the copy plays on its own timeline, so the arrows answer again as soon as the wipe has landed;
    // the frosted card fades in place, as its blur would jitter against the photo if it moved
    const bring = (slide, at, extra) => {
      const mine = gsap.timeline({ onComplete: () => { if (copy === mine) copy = null; } });
      copy = mine;
      if (title(slide)) mine.add(riseLines(title(slide)), at);
      if (items(slide).length) mine.to(items(slide), { autoAlpha: 1, duration: 1.1, ease: "power2.out", stagger: 0.1, clearProps: "opacity,visibility" }, at + COPY.items);
      extra?.(mine);
    };

    function go(to, dir) {
      if (slides.length < 2 || !ready) return;
      const target = (to + slides.length) % slides.length;
      if (target === index) return;
      if (busy) return void (queued = [target, dir]);
      disarm();
      // copy still arriving on the slide that now leaves is hurried home under the fade
      copy?.timeScale(6);
      const from = slides[index];
      const into = slides[target];
      index = target;
      tone();
      count(dir);
      if (still.matches) {
        mark();
        place();
        return;
      }
      busy = true;
      gsap.set(into, { visibility: "visible", zIndex: 2, clipPath: dir > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)" });
      if (items(into).length) gsap.set(items(into), { autoAlpha: 0 });
      const wipe = gsap.timeline({
        defaults: WIPE,
        onComplete: () => {
          const focused = from.contains(document.activeElement);
          mark();
          gsap.set([from, into, media(from), media(into), ...words(from)].filter(Boolean), { clearProps: CLEAR });
          if (focused) (dir > 0 ? next : prev)?.focus({ preventScroll: true });
          busy = false;
          const [then, way] = queued || [];
          queued = null;
          if (then !== undefined && then !== index) go(then, way);
          else arm();
        },
      })
        .to(into, { clipPath: "inset(0% 0% 0% 0%)" }, 0)
        .fromTo(media(into), { xPercent: DRIFT * dir, scale: ZOOM }, { xPercent: 0, scale: 1 }, 0)
        .to(media(from), { xPercent: -DRIFT * dir }, 0);
      if (words(from).length) wipe.to(words(from), { autoAlpha: 0, duration: 0.45, ease: "power2.in" }, 0);
      bring(into, dir > 0 ? COPY.next : COPY.back);
      place(WIPE.duration);
    }

    // the first slide arrives once, as the stage scrolls into view
    const intro = () => {
      if (ready) return;
      ready = true;
      bring(slides[index], 0.1, (tl) => {
        tl.to(media(slides[index]), { scale: 1, duration: 2.4, ease: "power2.out" }, 0);
        if (nav) tl.to(nav, { ...settled(nav, { y: 0, duration: 1.1 }), autoAlpha: 1, clearProps: "transform,opacity,visibility" }, 0.6);
      });
      arm();
    };

    prev?.addEventListener("click", () => go(index - 1, -1));
    next?.addEventListener("click", () => go(index + 1, 1));
    root.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") go(index + 1, 1);
      else if (event.key === "ArrowLeft") go(index - 1, -1);
    });

    // one slide per swipe, whichever way the finger or the mouse drags
    let swiped = false;
    Observer.create({
      target: root,
      type: "touch,pointer",
      tolerance: 50,
      lockAxis: true,
      ignore: "a, button",
      onPress: () => { swiped = false; },
      onLeft: () => { if (!swiped) { swiped = true; go(index + 1, 1); } },
      onRight: () => { if (!swiped) { swiped = true; go(index - 1, -1); } },
    });

    const set = (key, value) => {
      hold[key] = value;
      arm();
    };
    root.addEventListener("pointerenter", () => set("hover", true));
    root.addEventListener("pointerleave", () => set("hover", false));
    root.addEventListener("focusin", (event) => set("focus", event.target.matches(".is-keyboard :focus-visible")));
    root.addEventListener("focusout", () => set("focus", false));
    document.addEventListener("visibilitychange", arm);
    new IntersectionObserver(([entry]) => set("view", !entry.isIntersecting), { threshold: 0.3 }).observe(root);

    mark();
    tone();
    count(0);
    if (total) total.textContent = pad(slides.length);
    place();
    if (!still.matches) {
      const first = slides[index];
      gsap.set(media(first), { scale: 1.1 });
      if (title(first)) gsap.set(title(first), { autoAlpha: 0 });
      if (items(first).length) gsap.set(items(first), { autoAlpha: 0 });
      if (nav) gsap.set(nav, { autoAlpha: 0, y: 24 });
      // a title split against the fallback face breaks its lines in the wrong places, so the intro waits briefly for the webfonts
      const watch = () => ScrollTrigger.create({ trigger: root, start: "top 72%", end: "max", once: true, onEnter: intro });
      Promise.race([document.fonts?.ready, new Promise((resolve) => setTimeout(resolve, 900))]).then(watch, watch);
    }
    root.classList.add("is-ready");
  });
}
