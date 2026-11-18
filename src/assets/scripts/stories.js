// data-story: the card's [data-story-toggle] opens it in place to show its [data-story-more] parts in place of its [data-story-less] ones and reads "Close"
import { gsap, still, designPx, landing } from "./motion.js";

// The card grows down and rolls up as the menu panel does: a clip on its foot on the menu's curve, with everything below it
// carried on the compositor, so nothing is laid out frame by frame. The layout changes once, under the motion: opening, at
// the start with the page below held where it was; shutting, at the end, when the page below stands where it lands.
// One story in a row is open at a time: opening one, or the slider moving off one, shuts the other.
const GROW = 1.3;
const SHUT = 1.1;
// the page re-measures once the browser is idle, not on the frame the motion ends
const later = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 600 }) : setTimeout(fn, 200));

// everything drawn after the card's section, wherever it is: the page may still be gliding when the card moves
const below = (card) => {
  const out = [];
  for (let el = card.closest("section"); el && el !== document.body; el = el.parentElement) {
    for (let next = el.nextElementSibling; next; next = next.nextElementSibling) {
      if (next instanceof HTMLElement && next.offsetHeight && getComputedStyle(next).position !== "fixed") out.push(next);
    }
  }
  return out;
};
// where the page below sits in the layout, transforms aside: the row is as tall as its tallest story, so a story's own change
// of height is not always the page's
const footOf = (moved) => (moved[0] ? moved[0].offsetTop : 0);
// the browser keeps a node on screen still when the layout changes under it; here the motion does that, so it is held off
const anchoring = (on) => document.documentElement.style.setProperty("overflow-anchor", on ? "" : "none");

export function initStories() {
  const rows = new Map();
  document.querySelectorAll("[data-story]").forEach((card) => {
    const row = card.closest("[data-slider]") || card.parentElement;
    if (!rows.has(row)) rows.set(row, { stories: [], next: null });
    const group = rows.get(row);
    const one = story(card, group);
    if (one) group.stories.push(one);
  });
  // slider.js announces the card it has moved to; the one left open rolls up as the row slides
  rows.forEach((group, row) => row.addEventListener("slider:change", ({ detail }) => {
    const active = row.querySelectorAll("[data-story]")[detail.index];
    group.stories.forEach((one) => {
      if (one.card !== active) one.away();
    });
  }));
}

function story(card, group) {
  const toggle = card.querySelector("[data-story-toggle]");
  if (!toggle) return null;
  const label = toggle.querySelector(".btn__label");
  const copy = card.querySelector("[data-story-copy]");
  const title = copy.firstElementChild;
  const less = [...card.querySelectorAll("[data-story-less]")];
  const more = [...card.querySelectorAll("[data-story-more]")];
  const texts = more.filter((el) => copy.contains(el));
  const photos = more.filter((el) => !copy.contains(el));
  const pictures = photos.map((el) => el.querySelector("img")).filter(Boolean);
  const lines = texts.flatMap((el) => (el.children.length ? [...el.children] : [el]));
  const words = { open: label.textContent, shut: toggle.dataset.storyClose || "Close" };
  const self = { card, busy: false, leave: false };

  const isOpen = () => card.classList.contains("is-open");
  const others = () => group.stories.filter((one) => one !== self);
  const idle = () => group.stories.every((one) => !one.busy);
  const mark = (open) => {
    card.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    label.textContent = open ? words.shut : words.open;
  };

  const titleTop = () => title.getBoundingClientRect().top - copy.getBoundingClientRect().top;
  const round = (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  const clip = (foot) => `inset(0px 0px ${foot}px 0px round ${round(card)}px)`;
  // the second photo unrolls with the card's foot, so none of it shows before the edge reaches it
  const wipe = (el, foot) => `inset(0px 0px ${foot} 0px round ${round(el)}px)`;
  const drop = () => designPx(14);
  const dropIn = (land) => ({ opacity: 1, y: 0, duration: 0.9 * land.cut, ease: land.ease, force3D: true });

  const settle = (moved) => {
    gsap.set([card, copy, ...moved, ...less, ...lines, toggle, ...photos, ...pictures], { clearProps: "clipPath,transform,opacity" });
    ["height", "padding-top", "justify-content"].forEach((prop) => {
      card.style.removeProperty(prop);
      copy.style.removeProperty(prop);
    });
    self.busy = false;
    later(() => window.Anim?.refresh());
    // the slider moved off it while it was opening: it shuts now
    if (self.leave) {
      self.leave = false;
      if (isOpen()) return shut();
    }
    if (!idle()) return;
    requestAnimationFrame(() => idle() && anchoring(true));
    // a story asked for while another was moving opens now
    const run = group.next;
    group.next = null;
    run?.();
  };

  const grow = () => {
    self.busy = true;
    gsap.to([...less, toggle], {
      opacity: 0,
      duration: 0.25,
      ease: "power1.in",
      onComplete: () => {
        const moved = below(card);
        const foot = footOf(moved);
        const from = card.offsetHeight;
        const top0 = titleTop();
        anchoring(false);
        mark(true);
        gsap.set([...lines, toggle], { opacity: 0 });
        const rise = card.offsetHeight - from;
        const shift = footOf(moved) - foot;
        // the one open before rolls up as this one grows down; the row keeps this one's height, so the page below stays
        others().forEach((one) => one.isOpen() && !one.busy && one.shut());
        // a move crawling through its curve's tail on a layer shimmers, so all of it ends once it is within a device pixel
        const fold = landing("fold", rise);
        const motion = { duration: GROW * fold.cut, ease: fold.ease };
        const land = landing("soft", drop());
        const shot = pictures[0]?.getBoundingClientRect();
        const zoom = landing("soft", shot ? 0.06 * Math.max(shot.width, shot.height) : 1);
        const tl = gsap.timeline({ onComplete: () => settle(shift ? moved : []) })
          .fromTo(card, { clipPath: clip(rise) }, { clipPath: clip(0), ...motion }, 0)
          .fromTo(copy, { y: top0 - titleTop() }, { y: 0, force3D: true, ...motion }, 0)
          .fromTo(photos, { clipPath: (i, el) => wipe(el, "100%") }, { clipPath: (i, el) => wipe(el, "0%"), ...motion }, 0)
          .fromTo(pictures, { scale: 1.12 }, { scale: 1, duration: (GROW + 0.4) * zoom.cut, ease: zoom.ease, force3D: true }, 0)
          .fromTo(lines, { opacity: 0, y: -drop() }, { ...dropIn(land), stagger: 0.12 }, 0.25)
          .fromTo(toggle, { opacity: 0, y: -drop() }, dropIn(land), GROW * 0.6);
        if (shift) tl.fromTo(moved, { y: -shift }, { y: 0, force3D: true, ...motion }, 0);
      },
    });
  };

  const shut = () => {
    self.busy = true;
    anchoring(false);
    const moved = below(card);
    const foot = footOf(moved);
    const from = card.offsetHeight;
    const top1 = titleTop();
    // the shut card, read without being drawn
    mark(false);
    const to = card.offsetHeight;
    const top0 = titleTop();
    const shift = footOf(moved) - foot;
    mark(true);
    const fall = from - to;
    const fold = landing("fold", fall);
    const motion = { duration: SHUT * fold.cut, ease: fold.ease };
    const land = landing("soft", drop());
    const start = 0.15;
    const tl = gsap.timeline({ onComplete: () => settle(shift ? moved : []) })
      .to([...lines, toggle], { opacity: 0, y: -drop(), duration: 0.35, ease: "power1.in", force3D: true }, 0)
      .to(photos, { opacity: 0, duration: 0.35, ease: "power1.in" }, 0)
      // the summary takes the story's place where the copy stands; the card keeps its open height until it has rolled up
      .call(() => {
        card.style.height = `${from}px`;
        copy.style.justifyContent = "flex-start";
        copy.style.paddingTop = `${top1}px`;
        gsap.set([...less], { opacity: 0 });
        mark(false);
      }, null, 0.35)
      .fromTo(card, { clipPath: clip(0) }, { clipPath: clip(fall), ...motion }, start)
      .to(copy, { y: top0 - top1, force3D: true, ...motion }, start)
      .fromTo(less, { opacity: 0, y: -drop() }, dropIn(land), start + SHUT * 0.35)
      .fromTo(toggle, { opacity: 0, y: -drop() }, dropIn(land), start + SHUT * 0.45);
    if (shift) tl.to(moved, { y: shift, force3D: true, ...motion }, start);
  };

  // shut at once under reduced motion
  const close = () => {
    if (!still.matches) return shut();
    mark(false);
    window.Anim?.refresh();
  };

  Object.assign(self, {
    isOpen,
    close,
    shut,
    // the slider has moved off this story
    away() {
      if (self.busy) self.leave = true;
      else if (isOpen()) close();
    },
  });

  toggle.addEventListener("click", () => {
    if (self.busy) return;
    const open = !isOpen();
    if (still.matches) {
      if (open) others().forEach((one) => one.isOpen() && one.close());
      mark(open);
      window.Anim?.refresh();
      return;
    }
    if (!open) return shut();
    // opening while another story is still moving waits for it, so only one move carries the page below at a time
    if (idle()) grow();
    else group.next = grow;
  });

  return self;
}
