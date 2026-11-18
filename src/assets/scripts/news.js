// data-news: pointing at or focusing a [data-news-item] lights it and wipes its [data-news-photo] in over the last one
import { gsap, still } from "./motion.js";

const WIPE = { duration: 1.1, ease: "glide" };
const SETTLE = { duration: 1.6, ease: "soft" };
const INLINE = "visibility,zIndex,clipPath";
// the clip a photo opens from, moving down (1) or up (-1) the list, as its top and bottom insets in %
const shut = (dir) => (dir > 0 ? { top: 100, bottom: 0 } : { top: 0, bottom: 100 });
const OPEN = { top: 0, bottom: 0 };

export function initNews() {
  document.querySelectorAll("[data-news]").forEach((root) => {
    const rows = Array.from(root.querySelectorAll("[data-news-item]"));
    const frames = Array.from(root.querySelectorAll("[data-news-photo]"));
    if (rows.length < 2 || frames.length !== rows.length) return;

    let current = Math.max(0, rows.findIndex((row) => row.classList.contains("is-active")));
    const mark = (list) => list.forEach((el, i) => el.classList.toggle("is-active", i === current));
    mark(rows);
    mark(frames);

    const photo = (frame) => frame.querySelector("img");
    const shown = new Set([frames[current]]); // the photos on screen: the one at rest and any wiping over it
    let z = 1;
    // the wipe moves numbers and writes the clip from them: the browser shortens an inset() it reports, and a tween
    // read from it paired its values wrongly against the four it was heading for
    const insets = new Map(frames.map((frame) => [frame, { ...OPEN }]));
    const clip = (frame) => {
      const { top, bottom } = insets.get(frame);
      frame.style.clipPath = `inset(${top}% 0% ${bottom}% 0%)`;
    };
    const wipe = (list, to, onComplete) => gsap.to(list.map((frame) => insets.get(frame)), {
      ...to,
      ...WIPE,
      overwrite: true,
      onUpdate: () => list.forEach(clip),
      onComplete,
    });
    const rest = (frame) => {
      gsap.killTweensOf(insets.get(frame));
      Object.assign(insets.get(frame), OPEN);
      gsap.set(frame, { clearProps: INLINE });
    };

    // the new photo wipes in the way the pointer moved, settling from a slight zoom, as the one under it eases back
    const show = (index) => {
      if (index === current) return;
      const dir = index > current ? 1 : -1;
      current = index;
      mark(rows);
      if (still.matches) return mark(frames);
      const frame = frames[index];
      const others = [...shown].filter((other) => other !== frame);
      gsap.set(others, { visibility: "visible" });
      mark(frames);
      const done = () => {
        if (frames[current] !== frame) return;
        others.forEach((other) => {
          shown.delete(other);
          rest(other);
          gsap.set(photo(other), { clearProps: "transform" });
        });
        rest(frame);
        z = 1;
      };

      // back to a photo still on screen: the ones over it slide away the way they came
      if (shown.has(frame)) {
        const level = +frame.style.zIndex || 0;
        const over = others.filter((other) => (+other.style.zIndex || 0) > level);
        gsap.to(photo(frame), { scale: 1, yPercent: 0, ...SETTLE, overwrite: true });
        if (!over.length) return done();
        wipe(over, shut(-dir), done);
        return;
      }

      shown.add(frame);
      Object.assign(insets.get(frame), shut(dir));
      clip(frame);
      gsap.set(frame, { visibility: "visible", zIndex: ++z });
      gsap.fromTo(photo(frame), { scale: 1.15, yPercent: 8 * dir }, { scale: 1, yPercent: 0, ...SETTLE, overwrite: true });
      gsap.to(others.map(photo), { scale: 1.06, yPercent: -4 * dir, ...WIPE, overwrite: true });
      wipe([frame], OPEN, done);
    };

    rows.forEach((row, i) => {
      row.addEventListener("pointerenter", (event) => event.pointerType !== "touch" && show(i));
      row.addEventListener("focusin", () => show(i));
    });
  });
}
