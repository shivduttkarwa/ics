// data-news: pointing at or focusing a [data-news-item] lights it and fades its [data-news-photo] in over the last one
import { gsap, still } from "./motion.js";

const FADE = { duration: 0.8, ease: "power2.out", overwrite: true };
const INLINE = "opacity,visibility,zIndex";

export function initNews() {
  document.querySelectorAll("[data-news]").forEach((root) => {
    const rows = Array.from(root.querySelectorAll("[data-news-item]"));
    const frames = Array.from(root.querySelectorAll("[data-news-photo]"));
    if (rows.length < 2 || frames.length !== rows.length) return;

    let current = Math.max(0, rows.findIndex((row) => row.classList.contains("is-active")));
    const mark = (list) => list.forEach((el, i) => el.classList.toggle("is-active", i === current));
    mark(rows);
    mark(frames);

    // the photos on show, bottom to top: one caught mid-fade stays where it is in the pile
    const pile = [frames[current]];
    let z = 1;
    const drop = (frame) => {
      gsap.killTweensOf(frame);
      gsap.set(frame, { clearProps: INLINE });
      pile.splice(pile.indexOf(frame), 1);
    };

    const show = (index) => {
      if (index === current) return;
      current = index;
      mark(rows);
      if (still.matches) return mark(frames);
      const frame = frames[index];
      gsap.set(pile, { visibility: "visible" });
      mark(frames);
      const at = pile.indexOf(frame);
      if (at < 0) {
        pile.push(frame);
        gsap.set(frame, { zIndex: ++z, opacity: 0 });
        gsap.fromTo(frame.querySelector("img"), { scale: 1.06 }, { scale: 1, duration: 1.6, ease: "soft", overwrite: true, clearProps: "transform" });
      } else {
        pile.slice(at + 1).forEach((above) => gsap.to(above, { ...FADE, opacity: 0, duration: 0.6, onComplete: () => drop(above) }));
      }
      gsap.to(frame, {
        ...FADE,
        opacity: 1,
        onComplete: () => {
          pile.slice(0, pile.indexOf(frame)).forEach(drop);
          if (pile.length > 1) return;
          gsap.set(frame, { clearProps: INLINE });
          z = 1;
        },
      });
    };

    rows.forEach((row, i) => {
      row.addEventListener("pointerenter", (event) => event.pointerType !== "touch" && show(i));
      row.addEventListener("focusin", () => show(i));
    });
  });
}
