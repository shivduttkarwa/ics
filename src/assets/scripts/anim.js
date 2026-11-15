// Lenis smooth scroll + GSAP reveals, split titles, counters and parallax, driven by data-anim-* (docs/animation.md)
import Lenis from "lenis";
import { gsap, ScrollTrigger, SplitText, still, phone, fine, settled, glassy, landing, whole, cssEase } from "./motion.js";

const STAGGER = 0.09; // between reveals that come into view together
const SPREAD = 0.6; // the longest a batch of them may take to start
const STEP = 0.14; // between two data-anim-order steps of the page entrance
const START = { default: "top 88%", secondary: "top 96%" };
const HERO = "hero";
const BOUND = "data-anim-bound";
const CLEAR = "transform,opacity,visibility,clipPath,willChange,transition";
const LENIS = { lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, anchors: true, autoRaf: false };

const fade = (duration = 0.9) => ({ autoAlpha: 1, duration, ease: "power2.out" });
const wipe = (inset) => ({
  from: { clipPath: inset, autoAlpha: 1 },
  to: [{ clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "silk" }],
  inner: { from: { scale: 1.2 }, to: { scale: 1, duration: 1.9, ease: "power2.out" } },
});

// `to` is a list of tweens that start together; `inner` also moves every img and video inside
const REVEAL = {
  "fade-up": { from: { y: 36, autoAlpha: 0 }, to: [{ y: 0, duration: 1.15 }, fade()] },
  // the header's items: off a GPU layer and in whole pixels, landing under the fade, so the text never shifts or re-sharpens as it stops
  "fade-down": { from: { y: -24, autoAlpha: 0, force3D: false }, to: [{ autoAlpha: 1, duration: 0.7, ease: "power1.out", force3D: false, keyframes: { "57%": { y: 0, ease: whole("power2.out", 24) }, ease: "none" } }] },
  // large copy on the first screen: a short lift on a held layer that lands under the fade, so nothing creeps once it is solid
  "fade-up-held": { from: { y: 15, autoAlpha: 0, force3D: true }, to: [{ autoAlpha: 1, duration: 0.8, ease: "power1.out", force3D: true, keyframes: { "55%": { y: 0, ease: "power1.out" }, ease: "none" } }] },
  "fade": { from: { autoAlpha: 0 }, to: [fade(1.2)] },
  "from-left": { from: { x: -48, autoAlpha: 0 }, to: [{ x: 0, duration: 1.2 }, fade()] },
  "from-right": { from: { x: 48, autoAlpha: 0 }, to: [{ x: 0, duration: 1.2 }, fade()] },
  "rise": { from: { y: 72, autoAlpha: 0 }, to: [{ y: 0, duration: 1.3 }, fade(1)] },
  "scale": { from: { scale: 0.94, autoAlpha: 0 }, to: [{ scale: 1, duration: 1.3 }, fade()] },
  "from-right-edge": {
    from: { x: (i, el) => document.documentElement.clientWidth - el.getBoundingClientRect().left, autoAlpha: 0 },
    to: [{ x: 0, duration: 1.4, ease: "back.out(1)" }, fade(0.6)],
  },
  "zoom-out": { from: { scale: 1.1, autoAlpha: 0 }, to: [{ scale: 1, duration: 2.6, ease: "power2.out" }, fade(1.4)] },
  "line": { from: { scaleX: 0, transformOrigin: "0% 50%", autoAlpha: 1 }, to: [{ scaleX: 1, duration: 1.3, ease: "silk" }] },
  "wipe-up": wipe("inset(100% 0% 0% 0%)"),
  "wipe-down": wipe("inset(0% 0% 100% 0%)"),
  "wipe-right": wipe("inset(0% 100% 0% 0%)"),
  "wipe-left": wipe("inset(0% 0% 0% 100%)"),
};
REVEAL.clip = REVEAL["wipe-down"];

const LINES = { from: 125, duration: 1.3, ease: "silk", stagger: 0.11, fade: 0.6 };const PIECES = { duration: 0.9, stagger: { words: 0.045, chars: 0.018 } };
const COUNTER = { duration: 2.2, ease: "power2.out" };

const attr = (el, name, fallback = null) => (el.hasAttribute(name) ? el.getAttribute(name) : fallback);
const number = (el, name, fallback) => {
  const value = parseFloat(attr(el, name, ""));
  return Number.isNaN(value) ? fallback : value;
};
// a `-mobile` twin of an attribute wins below lg
const variant = (el, name) => (phone.matches && el.hasAttribute(`${name}-mobile`) ? `${name}-mobile` : name);
const tierOf = (el) => attr(el, "data-anim-tier", "default");
const startOf = (el) => attr(el, variant(el, "data-anim-start"), START[tierOf(el)] || START.default);
const bind = (el) => el.setAttribute(BOUND, "");

let lenis = null;
let started = false;
let holdUntil = 0; // ticker time before which reveals already on screen wait for the entrance
let entranceEnd = 0; // ticker time by which the entrance has played

// heavy work waits until the entrance has played, so it never stalls a frame of it
function afterEntrance(fn) {
  const wait = entranceEnd - gsap.ticker.time;
  if (wait > 0) gsap.delayedCall(wait, fn);
  else fn();
}

function scoped(root, selector) {
  const list = Array.from(root.querySelectorAll(selector));
  if (root.matches && root.matches(selector)) list.unshift(root);
  return list.filter((el) => !el.hasAttribute(BOUND));
}

const settle = (el, also = []) => {
  el.classList.add("is-revealed");
  gsap.set([el, ...also], { clearProps: CLEAR });
};

// an element with no box (display: none at this width) simply shows whenever it is displayed
const skipped = (el) => {
  if (el.getClientRects().length) return false;
  bind(el);
  el.classList.add("is-revealed");
  return true;
};

function initScroll(opts) {
  ScrollTrigger.config({ ignoreMobileResize: true });
  lenis = new Lenis({ ...LENIS, ...(opts.lenis || {}) });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// data-anim-group: the direct children (or the [data-anim-item]s inside) become reveals of the group's type, in order
const PASSED = ["data-anim-tier", "data-anim-start", "data-anim-start-mobile", "data-anim-media"];

function expandGroups(root) {
  scoped(root, "[data-anim-group]").forEach((group) => {
    const type = group.getAttribute("data-anim-group") || "fade-up";
    const base = number(group, "data-anim-order", 0);
    const step = number(group, "data-anim-step", 1);
    const marked = Array.from(group.querySelectorAll("[data-anim-item]"));
    const items = marked.length ? marked : Array.from(group.children);
    let turn = 0;
    items.forEach((child) => {
      if (!child.hasAttribute("data-anim")) {
        child.setAttribute("data-anim", "reveal");
        child.setAttribute("data-anim-type", type);
      }
      PASSED.forEach((name) => {
        if (group.hasAttribute(name) && !child.hasAttribute(name)) child.setAttribute(name, group.getAttribute(name));
      });
      if (!child.hasAttribute("data-anim-order")) child.setAttribute("data-anim-order", String(base + turn * step));
      // an item not displayed at this width gives up its turn
      if (child.getClientRects().length) turn++;
    });
    // the stylesheet hides a group's direct children until revealed, wrappers of marked items included
    if (marked.length) Array.from(group.children).forEach((child) => child.hasAttribute("data-anim") || child.classList.add("is-revealed"));
    bind(group);
  });
}

const moves = (preset) => ["x", "y", "scale"].some((key) => key in preset.from);

function revealUnit(el) {
  let preset = REVEAL[attr(el, variant(el, "data-anim-type"), "fade-up")] || REVEAL["fade-up"];
  if (moves(preset) && glassy(el)) preset = REVEAL.fade;
  const inner = preset.inner ? Array.from(el.querySelectorAll("img, video")) : [];
  // a CSS transition on the element would smear every frame of the tween
  gsap.set(el, { ...preset.from, transition: "none" });
  if (inner.length) gsap.set(inner, preset.inner.from);
  return {
    el,
    play(delay) {
      const tl = gsap.timeline({ delay, onComplete: () => settle(el, inner) });
      const fadeFor = number(el, "data-anim-fade", 0);
      const even = (vars) => (fadeFor && "autoAlpha" in vars && !moves({ from: vars }) ? { ...vars, duration: fadeFor, ease: "none" } : vars);
      preset.to.forEach((vars) => tl.to(el, settled(el, even(vars)), 0));
      if (inner.length) tl.to(inner, settled(inner[0], preset.inner.to), 0);
      const duration = number(el, "data-anim-duration", 0);
      if (duration) tl.duration(duration);
      return tl;
    },
    show: () => settle(el, inner),
  };
}

// where each line of the text really starts: the word whose top drops below the line before it
function lineStarts(target) {
  const style = getComputedStyle(target);
  const half = parseFloat(style.lineHeight) / 2 || parseFloat(style.fontSize) / 2;
  const starts = [];
  let top = null;
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    for (const word of node.textContent.matchAll(/[^\s\-–—]+[\-–—]*|[\-–—]+/g)) {
      const range = document.createRange();
      range.setStart(node, word.index);
      range.setEnd(node, word.index + 1);
      const now = range.getBoundingClientRect().top;
      if (top !== null && now > top + half) starts.push({ node, offset: word.index });
      if (top === null || now > top + half) top = now;
    }
  }
  return starts;
}

// a <br> directly in the target at that point; an inline element the line falls inside is cut in two around it
function breakBefore(target, { node, offset }) {
  let right = node.splitText(offset);
  while (right.parentNode !== target) {
    const parent = right.parentNode;
    const rest = parent.cloneNode(false);
    while (right) {
      const next = right.nextSibling;
      rest.append(right);
      right = next;
    }
    parent.after(rest);
    right = rest;
  }
  target.insertBefore(document.createElement("br"), right);
}

// SplitText boxes each word to find lines, which can push a full line's last word down, so the real breaks are fixed first
export function splitLines(el) {
  const html = el.innerHTML;
  const rows = [...el.children].filter((child) => child.tagName !== "BR" && getComputedStyle(child).display !== "inline");
  const targets = rows.length ? rows : [el];
  const breaks = targets.map(lineStarts);
  el.querySelectorAll("br").forEach((br) => br.remove());
  targets.forEach((target, i) => breaks[i].reverse().forEach((start) => breakBefore(target, start)));
  el.style.whiteSpace = "nowrap";
  const split = new SplitText(targets, { type: "lines", mask: "lines", linesClass: "anim-line", aria: "none" });
  return {
    lines: split.lines,
    revert() {
      split.revert();
      el.innerHTML = html;
      el.style.whiteSpace = "";
    },
  };
}

// a layer keeps a moving line smooth, but one left resting draws unlike plain text and twitches when the markup goes back
export function riseLines(el, vars = {}) {
  const { onComplete, stagger = LINES.stagger, fade = 0, ...rest } = vars;
  const { lines, revert } = splitLines(el);
  gsap.set(lines, { yPercent: LINES.from, autoAlpha: 0, willChange: "transform" });
  gsap.set(el, { autoAlpha: 1 });
  const rise = settled(lines[0], { yPercent: 0, duration: LINES.duration, ease: LINES.ease });
  return gsap.timeline({
    ...rest,
    onComplete: () => {
      revert();
      onComplete?.();
    },
  })
    .to(lines, {
      ...rise,
      stagger: {
        each: stagger,
        onComplete() {
          gsap.set(this.targets(), { clearProps: "transform,willChange" });
        },
      },
    }, 0)
    .to(lines, { autoAlpha: 1, duration: fade || LINES.fade, ease: fade ? "none" : "power1.out", stagger }, 0);
}

// A hero title's lines glide on the compositor, so their pace holds while the page is still busy loading, and stay on
// their layers once landed: text on a layer is drawn up to half a pixel from where the page draws it, so a line leaving
// its layer, or the markup going back, visibly shifted the title (St Luke's holds its hero rows on layers the same way).
// The markup goes back only when the width changes and the lines must rewrap.
function glideLines(el, { stagger, fade, onComplete }) {
  const { lines, revert } = splitLines(el);
  let runs = [];
  gsap.set(lines, { yPercent: LINES.from, autoAlpha: 0, willChange: "transform" });
  gsap.set(el, { autoAlpha: 1 });
  const done = () => {
    gsap.set(lines, { clearProps: "transform,opacity,visibility" });
    runs.forEach((run) => run.cancel());
    lines.forEach((line) => { line.parentElement.style.clipPath = "none"; });
    onComplete?.();
    const width = window.innerWidth;
    const rewrap = () => {
      if (window.innerWidth === width) return;
      window.removeEventListener("resize", rewrap);
      revert();
    };
    window.addEventListener("resize", rewrap);
  };
  const play = () => {
    const { ease, cut } = landing(LINES.ease, (lines[0].offsetHeight * LINES.from) / 100);
    const easing = cssEase(ease, null);
    const rise = easing
      ? { duration: LINES.duration * cut * 1000, easing, fill: "both" }
      : { duration: LINES.duration * 1000, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" };
    const show = { duration: (fade || LINES.fade) * 1000, easing: fade ? "linear" : cssEase("power1.out", "ease-out"), fill: "both" };
    runs = lines.flatMap((line, i) => {
      const delay = i * stagger * 1000;
      return [
        line.animate([{ transform: `translateY(${LINES.from}%)` }, { transform: "translateY(0)" }], { ...rise, delay }),
        line.animate([{ opacity: 0 }, { opacity: 1 }], { ...show, delay }),
      ];
    });
    gsap.set(lines, { visibility: "inherit" });
    Promise.all(runs.map((run) => run.finished)).then(done, () => {});
  };
  return { play, show: done };
}

function splitUnit(el) {
  const type = attr(el, "data-anim-type", "lines");
  const lines = (vars = {}) => riseLines(el, {
    ...vars,
    stagger: number(el, "data-anim-stagger", LINES.stagger),
    fade: number(el, "data-anim-fade", 0),
    onComplete: () => settle(el),
  });
  // a hero title is split during setup, so no split lands in a frame of the entrance
  if (type === "lines" && tierOf(el) === HERO) {
    const glide = glideLines(el, { stagger: number(el, "data-anim-stagger", LINES.stagger), fade: number(el, "data-anim-fade", 0), onComplete: () => settle(el) });
    return { el, play: (delay) => gsap.delayedCall(delay, glide.play), show: glide.show };
  }
  const pieces = () => {
    const split = new SplitText(el, { type: type === "chars" ? "words,chars" : "words", aria: "none" });
    const parts = type === "chars" ? split.chars : split.words;
    gsap.set(parts, { yPercent: 60, autoAlpha: 0 });
    gsap.set(el, { autoAlpha: 1 });
    gsap.to(parts, {
      ...settled(parts[0], { yPercent: 0, duration: PIECES.duration }),
      autoAlpha: 1,
      stagger: PIECES.stagger[type],
      onComplete: () => {
        split.revert();
        settle(el);
      },
    });
  };
  return {
    el,
    // split as it starts: the lines are read from the layout of that moment
    play: (delay) => gsap.delayedCall(delay, () => (type === "lines" ? lines() : pieces())),
    show: () => settle(el),
  };
}

// data-anim="counter": the first number in the element (or in its [data-anim-count]) counts up from 0
function counterUnit(el) {
  const num = el.querySelector("[data-anim-count]") || el;
  const text = num.textContent;
  const match = text.match(/\d[\d,]*(\.\d+)?/);
  if (!match) return null;
  const target = parseFloat(match[0].replace(/,/g, ""));
  const decimals = match[1] ? match[1].length - 1 : 0;
  const grouped = match[0].includes(",");
  const before = text.slice(0, match.index);
  const after = text.slice(match.index + match[0].length);
  const format = (n) =>
    grouped ? n.toLocaleString("en-AU", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : n.toFixed(decimals);
  const render = (p) => { num.textContent = before + format(target * p) + after; };
  const restore = () => {
    num.textContent = text;
    num.style.minWidth = "";
    el.classList.add("is-revealed");
  };
  // the final width is held while the digits grow, so whatever sits beside the number stays put
  num.style.minWidth = `${num.getBoundingClientRect().width}px`;
  render(0);
  return {
    el,
    play(delay) {
      const state = { p: 0 };
      return gsap.to(state, { p: 1, delay, ...COUNTER, onUpdate: () => render(state.p), onComplete: restore });
    },
    show: restore,
  };
}

// Reveals that come into view on the same tick start one after another in page order
let pending = [];
let flushing = null;
function flush() {
  flushing = null;
  const batch = pending.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  pending = [];
  const visible = batch.filter((unit) => {
    if (unit.el.getBoundingClientRect().bottom >= 0) return true;
    unit.show(); // scrolled past already: it simply shows
    return false;
  });
  const hold = window.scrollY < 20 ? Math.max(0, holdUntil - gsap.ticker.time) : 0;
  const step = visible.length > 1 ? Math.min(STAGGER, SPREAD / (visible.length - 1)) : 0;
  visible.forEach((unit, i) => unit.play(hold + i * step + number(unit.el, "data-anim-delay", 0)));
}
function enqueue(unit) {
  pending.push(unit);
  if (!flushing) flushing = gsap.delayedCall(0.02, flush);
}

function watch(unit) {
  const el = unit.el;
  ScrollTrigger.create({
    trigger: el.closest("[data-anim-trigger]") || el,
    // clamped, so a piece at the very foot of the page still starts when the page can scroll no further
    start: `clamp(${startOf(el)})`,
    end: "max",
    once: true,
    onEnter: () => enqueue(unit),
  });
}

// hero-tier steps play on load in data-anim-order; whatever else is on the first screen follows them
function playEntrance(units) {
  if (!units.length) return;
  let last = 0;
  units.forEach((unit) => {
    const at = 0.15 + number(unit.el, variant(unit.el, "data-anim-order"), 0) * STEP + number(unit.el, "data-anim-delay", 0);
    unit.play(at);
    last = Math.max(last, at);
  });
  holdUntil = gsap.ticker.time + last + 0.3;
  entranceEnd = gsap.ticker.time + last + 1.8;
}

function setupParallax(root) {
  scoped(root, '[data-anim="parallax"]').forEach((el) => {
    bind(el);
    // the stylesheet runs it as a scroll-driven animation where the browser has them (06-animation/_parallax.less)
    if (CSS.supports("animation-timeline", "view()")) return;
    // the fallback follows Lenis, so it only runs where Lenis smooths the scroll
    if (!fine.matches || (el.hasAttribute("data-anim-disable-mobile") && phone.matches)) return;
    const style = getComputedStyle(el);
    const top = attr(el, "data-anim-start") === "top top";
    gsap.fromTo(
      el,
      { yPercent: parseFloat(style.getPropertyValue("--parallax-from")) || 0 },
      {
        yPercent: parseFloat(style.getPropertyValue("--parallax-to")) || 0,
        ease: "none",
        scrollTrigger: {
          trigger: el.closest("[data-anim-parallax-trigger]") || el,
          start: top ? "top top" : "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  });
}

// data-anim="progress": --anim-progress runs 0 to 1 as the block passes, for CSS to hang a scroll-linked state on
function setupProgress(root) {
  scoped(root, '[data-anim="progress"]').forEach((el) => {
    bind(el);
    gsap.fromTo(el, { "--anim-progress": 0 }, {
      "--anim-progress": 1,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: attr(el, variant(el, "data-anim-start"), "top 80%"),
        end: attr(el, variant(el, "data-anim-end"), "bottom 60%"),
        scrub: true,
      },
    });
  });
}

function setup(root, opts = {}) {
  const entrance = [];
  const scroll = [];
  expandGroups(root);
  const add = (el, unit) => {
    if (!unit) return;
    bind(el);
    (tierOf(el) === HERO || opts.immediate ? entrance : scroll).push(unit);
  };
  scoped(root, '[data-anim="split"]').forEach((el) => {
    if (!skipped(el)) add(el, splitUnit(el));
  });
  scoped(root, '[data-anim="reveal"]').forEach((el) => {
    // data-anim-media: the reveal only runs where this query matches at load
    const media = attr(el, "data-anim-media");
    if (media && !window.matchMedia(media).matches) {
      bind(el);
      el.classList.add("is-revealed");
      return;
    }
    if (!skipped(el)) add(el, revealUnit(el));
  });
  scoped(root, '[data-anim="counter"]').forEach((el) => {
    if (el.getClientRects().length) add(el, counterUnit(el));
  });
  setupParallax(root);
  setupProgress(root);
  scroll.forEach(watch);
  return entrance;
}

function revealEverything() {
  document.documentElement.classList.add("anim-reduced");
  gsap.utils.toArray("[data-anim], .anim-line").forEach((el) => gsap.set(el, { clearProps: CLEAR }));
}

const Anim = {
  lenis: null,

  init(opts = {}) {
    if (started) return this;
    started = true;
    const root = document.documentElement;
    root.classList.add("anim-ready");
    root.setAttribute("data-anim-live", "");
    if (still.matches) {
      root.classList.add("anim-reduced");
      return this;
    }
    const fail = (err) => {
      console.error("[anim] failed, showing everything", err);
      revealEverything();
    };
    try {
      initScroll(opts);
      this.lenis = lenis;
    } catch (err) {
      fail(err);
      return this;
    }
    // a title split in the fallback face breaks in the wrong places, so setup waits for the webfonts, briefly
    const fonts = document.fonts?.ready ?? Promise.resolve();
    const go = () => {
      try {
        const entrance = setup(document);
        ScrollTrigger.refresh();
        // the entrance's clock starts once the setup and its measuring are done, or they eat into its first frames
        playEntrance(entrance);
      } catch (err) {
        fail(err);
      }
    };
    Promise.race([fonts, new Promise((resolve) => setTimeout(resolve, 900))]).then(go, go);
    window.addEventListener("load", () => afterEntrance(() => ScrollTrigger.refresh()));
    return this;
  },

  // content added after init (load more, a tab pane); { immediate: true } plays it at once instead of on scroll
  add(container = document, opts = {}) {
    if (still.matches) return this;
    const root = typeof container === "string" ? document.querySelector(container) : container;
    if (!root) return this;
    try {
      const entrance = setup(root, opts);
      ScrollTrigger.refresh();
      playEntrance(entrance);
    } catch (err) {
      console.error("[anim] add() failed", err);
    }
    return this;
  },

  refresh() { ScrollTrigger.refresh(); return this; },
  stop() { lenis && lenis.stop(); return this; },
  start() { lenis && lenis.start(); return this; },
};

if (typeof window !== "undefined") window.Anim = Anim;

export { Anim };
export default Anim;
