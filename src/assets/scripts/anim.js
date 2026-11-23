// Lenis smooth scroll + GSAP reveals, split titles, counters and parallax, driven by data-anim-* (docs/animation.md)
import Lenis from "lenis";
import { gsap, ScrollTrigger, SplitText, still, phone, fine, settled, glassy, fadeParts, landing, cssEase, spring, designPx } from "./motion.js";

const STAGGER = 0.09; // between reveals that come into view together
const SPREAD = 0.6; // the longest a batch of them may take to start
const LEAD = 0.4; // an entrance step starts this long before the step before it has landed (data-anim-lead; negative for a pause)
const ITEMS = 0.07; // between the items of a hero-tier group (data-anim-stagger on the group)
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
  // a gentle lift for first-screen copy: 25 up on the compositor while it fades, on a held layer (give the element will-change: transform)
  "fade-up-soft": { from: { y: 25, autoAlpha: 0 }, glide: { axis: "y", duration: 0.6, ease: "rise", fade: 0.6, fadeEase: "power1.out", fallback: "cubic-bezier(0.33, 1, 0.68, 1)" } },
  // the header's items: 24 down on the compositor, landing under the fade, on a held layer (give the element will-change: transform)
  "fade-down": { from: { y: -24, autoAlpha: 0 }, glide: { axis: "y", duration: 0.7, ease: "power2.out", fade: 0.7, fadeEase: "power1.out", fallback: "cubic-bezier(0.33, 1, 0.68, 1)" } },
  "fade": { from: { autoAlpha: 0 }, to: [fade(1.2)] },
  "from-left": { from: { x: -48, autoAlpha: 0 }, to: [{ x: 0, duration: 1.2 }, fade()] },
  "from-right": { from: { x: 48, autoAlpha: 0 }, to: [{ x: 0, duration: 1.2 }, fade()] },
  "rise": { from: { y: 72, autoAlpha: 0 }, to: [{ y: 0, duration: 1.3 }, fade(1)] },
  "scale": { from: { scale: 0.94, autoAlpha: 0 }, to: [{ scale: 1, duration: 1.3 }, fade()] },
  // from beyond the right edge on a spring, on the compositor (`glide`); give the element will-change: transform
  "from-right-edge": {
    from: { x: (i, el) => document.documentElement.clientWidth - el.getBoundingClientRect().left, autoAlpha: 0 },
    glide: { duration: 1, ease: spring(), fade: 0.4, fallback: "cubic-bezier(0.34, 1.4, 0.64, 1)" },
  },
  "zoom-out": { from: { scale: 1.1, autoAlpha: 0 }, to: [{ scale: 1, duration: 2.6, ease: "power2.out" }, fade(1.4)] },
  "line": { from: { scaleX: 0, transformOrigin: "0% 50%", autoAlpha: 1 }, to: [{ scaleX: 1, duration: 1.3, ease: "silk" }] },
  "wipe-up": wipe("inset(100% 0% 0% 0%)"),
  "wipe-down": wipe("inset(0% 0% 100% 0%)"),
  "wipe-right": wipe("inset(0% 100% 0% 0%)"),
  "wipe-left": wipe("inset(0% 0% 0% 100%)"),
};
REVEAL.clip = REVEAL["wipe-down"];

// no fade: a line is solid as it clears the mask's edge, which is what reads as rising from under it
const LINES = { from: 150, duration: 1.4, ease: "soft", stagger: 0.11, fade: 0 };
const PIECES = { duration: 0.9, stagger: { words: 0.045, chars: 0.018 } };
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

// shown at once on a page reached from another of the site's pages (the header carries over)
function carries(el) {
  return el.hasAttribute("data-anim-carry") && document.documentElement.classList.contains("anim-carried");
}

function expandGroups(root) {
  scoped(root, "[data-anim-group]").forEach((group) => {
    if (carries(group)) {
      bind(group);
      return;
    }
    const type = group.getAttribute("data-anim-group") || "fade-up";
    const gap = number(group, "data-anim-stagger", ITEMS);
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
      // in the entrance the items share the group's step and follow each other `gap` apart
      if (group.hasAttribute("data-anim-order") && !child.hasAttribute("data-anim-order")) child.setAttribute("data-anim-order", group.getAttribute("data-anim-order"));
      if (tierOf(child) === HERO && !child.hasAttribute("data-anim-delay")) child.setAttribute("data-anim-delay", (turn * gap).toFixed(2));
      // an item not displayed at this width gives up its turn
      if (child.getClientRects().length) turn++;
    });
    // the stylesheet hides a group's direct children until revealed, wrappers of marked items included
    if (marked.length) Array.from(group.children).forEach((child) => child.hasAttribute("data-anim") || child.classList.add("is-revealed"));
    bind(group);
  });
}

const moves = (preset) => ["x", "y", "scale"].some((key) => key in preset.from);

// a glide runs on the compositor (element.animate), so its curve holds however busy the page is; once landed it settles
// with no change, its layer kept by the element's own will-change. The fade runs on `parts` (the glass and the plain
// parts beside it, as fadeParts), the element itself when it holds no glass.
function glideUnit(el, glide, parts = [el]) {
  const axis = glide.axis || "x";
  const translate = (px) => (axis === "y" ? `translate(0px, ${px}px)` : `translate(${px}px, 0px)`);
  const fade = { duration: glide.fade * 1000, easing: glide.fadeEase ? cssEase(glide.fadeEase, "ease-out") : "ease-out", fill: "both" };
  // a deferred step: the entrance's timeline starts it with a delay on the compositor's own clock and holds a slot of `duration`
  const build = () => {
    const from = gsap.getProperty(el, axis);
    const { ease, cut } = landing(glide.ease, from);
    const easing = cssEase(ease, null, 80);
    const length = glide.duration * (easing ? cut : 1);
    const start = (delay = 0) => {
      const wait = delay * 1000;
      const move = el.animate([{ transform: translate(from) }, { transform: "none" }], { duration: length * 1000, delay: wait, easing: easing || glide.fallback, fill: "both" });
      const runs = [move, ...(glide.fade ? parts.map((part) => part.animate([{ opacity: 0 }, { opacity: 1 }], { ...fade, delay: wait })) : [])];
      gsap.set([el, ...parts], { visibility: "inherit" });
      Promise.all(runs.map((run) => run.finished)).then(() => {
        settle(el, parts);
        runs.forEach((run) => run.cancel());
      }, () => {});
    };
    return { deferred: true, start, duration: Math.max(length, glide.fade) };
  };
  return { el, build, play: (delay) => gsap.delayedCall(delay, () => build().start()), show: () => settle(el, parts) };
}

function revealUnit(el) {
  let preset = REVEAL[attr(el, variant(el, "data-anim-type"), "fade-up")] || REVEAL["fade-up"];
  if (preset.glide) {
    // the move runs on the element, the fade on its glass and the plain parts beside it (fadeParts), so a frosted button
    // builds its blur with its opacity while its wrapper lifts
    const parts = fadeParts(el);
    const { autoAlpha, ...move } = preset.from;
    const fades = autoAlpha !== undefined;
    gsap.set(el, { ...move, ...(fades ? { autoAlpha: parts[0] === el ? autoAlpha : 1 } : {}), transition: "none" });
    if (fades && parts[0] !== el) gsap.set(parts, { autoAlpha, transition: "none" });
    // data-anim-duration: the move takes this long and the fade keeps its share of it
    const own = number(el, "data-anim-duration", 0);
    return glideUnit(el, own ? { ...preset.glide, duration: own, fade: (own * preset.glide.fade) / preset.glide.duration } : preset.glide, parts);
  }
  if (moves(preset) && glassy(el)) preset = REVEAL.fade;
  const inner = preset.inner ? Array.from(el.querySelectorAll("img, video")) : [];
  // a plain fade over glass fades the glass itself and the parts beside it, the wrapper staying solid (fadeParts)
  const parts = preset === REVEAL.fade ? fadeParts(el) : [el];
  const also = parts[0] === el ? inner : [...inner, ...parts];
  // a CSS transition on the element would smear every frame of the tween
  if (parts[0] !== el) gsap.set(el, { autoAlpha: 1 });
  gsap.set(parts, { ...preset.from, transition: "none" });
  if (inner.length) gsap.set(inner, preset.inner.from);
  const build = (delay = 0) => {
    const tl = gsap.timeline({ delay, onComplete: () => settle(el, also) });
    const fadeFor = number(el, "data-anim-fade", 0);
    const even = (vars) => (fadeFor && "autoAlpha" in vars && !moves({ from: vars }) ? { ...vars, duration: fadeFor, ease: "none" } : vars);
    preset.to.forEach((vars) => tl.to(parts, settled(parts[0], even(vars)), 0));
    if (inner.length) tl.to(inner, settled(inner[0], preset.inner.to), 0);
    const duration = number(el, "data-anim-duration", 0);
    if (duration) tl.duration(duration);
    return tl;
  };
  return { el, build, play: build, show: () => settle(el, also) };
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
          // the line lands: off its layer, and its mask's clip off, so its descenders complete
          gsap.set(this.targets(), { clearProps: "transform,willChange" });
          this.targets().forEach((line) => { line.parentElement.style.clipPath = "none"; });
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
  const build = () => {
    const { ease, cut } = landing(LINES.ease, (lines[0].offsetHeight * LINES.from) / 100);
    const easing = cssEase(ease, null, 100);
    const length = easing ? LINES.duration * cut : LINES.duration;
    const rise = { duration: length * 1000, easing: easing || "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" };
    const fadeFor = fade || LINES.fade;
    const show = { duration: fadeFor * 1000, easing: fade ? "linear" : cssEase("power1.out", "ease-out"), fill: "both" };
    const start = (wait = 0) => {
      runs = lines.flatMap((line, i) => {
        const delay = (wait + i * stagger) * 1000;
        const move = line.animate([{ transform: `translateY(${LINES.from}%)` }, { transform: "translateY(0)" }], { ...rise, delay });
        // the line lands: its mask's clip comes off, so its descenders complete
        move.finished.then(() => { line.parentElement.style.clipPath = "none"; }, () => {});
        return [move, ...(fadeFor ? [line.animate([{ opacity: 0 }, { opacity: 1 }], { ...show, delay })] : [])];
      });
      gsap.set(lines, fadeFor ? { visibility: "inherit" } : { autoAlpha: 1 });
      Promise.all(runs.map((run) => run.finished)).then(done, () => {});
    };
    // landed once the last line has stopped, the slot the entrance's timeline holds for it
    return { deferred: true, start, duration: (lines.length - 1) * stagger + Math.max(length, fadeFor) };
  };
  return { build, play: () => build().start(), show: done };
}

function splitUnit(el) {
  const type = attr(el, "data-anim-type", "lines");
  const opts = { stagger: number(el, "data-anim-stagger", LINES.stagger), fade: number(el, "data-anim-fade", 0), onComplete: () => settle(el) };
  // a hero title is split during setup, so no split lands in a frame of the entrance
  if (type === "lines" && tierOf(el) === HERO) {
    const glide = glideLines(el, opts);
    return { el, build: glide.build, play: (delay) => gsap.delayedCall(delay, glide.play), show: glide.show };
  }
  // every other title glides the same way, split as it starts, so its lines are read from the layout of that moment
  if (type === "lines") {
    let glide = null;
    const make = () => (glide = glideLines(el, opts));
    return {
      el,
      build: () => make().build(),
      play: (delay) => gsap.delayedCall(delay, () => make().play()),
      show: () => (glide ? glide.show() : settle(el)),
    };
  }
  const pieces = (delay = 0) => {
    const split = new SplitText(el, { type: type === "chars" ? "words,chars" : "words", aria: "none" });
    const parts = type === "chars" ? split.chars : split.words;
    gsap.set(parts, { yPercent: 60, autoAlpha: 0 });
    gsap.set(el, { autoAlpha: 1 });
    return gsap.to(parts, {
      ...settled(parts[0], { yPercent: 0, duration: PIECES.duration }),
      autoAlpha: 1,
      delay,
      stagger: PIECES.stagger[type],
      onComplete: () => {
        split.revert();
        settle(el);
      },
    });
  };
  // split as it starts: the pieces are read from the layout of that moment
  const start = (delay = 0) => pieces(delay);
  return {
    el,
    build: () => ({ deferred: true, start, duration: PIECES.duration }),
    play: (delay) => gsap.delayedCall(delay, () => start()),
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
  const build = (delay = 0) => {
    const state = { p: 0 };
    return gsap.to(state, { p: 1, delay, ...COUNTER, onUpdate: () => render(state.p), onComplete: restore });
  };
  return { el, build, play: build, show: restore };
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

const STARTS = new WeakMap(); // a start of its own, as a scroll position (stackRun)

function watch(unit) {
  const el = unit.el;
  const start = startOf(el);
  const trigger = el.closest("[data-anim-trigger]") || el;
  // clamped, a piece already on the first screen starts at 0, which a page at rest never passes
  const onFirstScreen = window.scrollY < 20 && trigger.getBoundingClientRect().top < window.innerHeight;
  ScrollTrigger.create({
    trigger,
    // clamped, so a piece at the very foot of the page still starts when the page can scroll no further; a plain number
    // is a scroll position (the announcement bar, uncovered from under the hero wherever it sits)
    start: STARTS.get(el) || (Number.isNaN(+start) ? (onFirstScreen ? start : `clamp(${start})`) : +start),
    end: "max",
    once: true,
    onEnter: () => enqueue(unit),
  });
}

// Hero-tier steps play on load as one GSAP timeline (Anim.entrance), in data-anim-order: the steps of one order start
// together (data-anim-delay after it), and each order starts LEAD seconds before the order before it has landed
// (data-anim-lead on any of its steps sets another lead, negative for a pause after). A step lands when its animation
// ends, or data-anim-landed seconds after it starts (a long settle needn't hold up what follows). A deferred step (the
// title's lines, a glide on the compositor) is started at once with its position as a delay on the compositor's own
// clock, and holds a slot of its length in the timeline: a first load stalls the main thread (the hero photo decoding,
// fonts arriving), the ticker's clock leaps over a stall, and a step started by a callback in it started late while the
// next kept its time, so the intro arrived under a title still rising. Whatever else is on the first screen follows.
const BASE = 0.15; // the entrance's clock starts this long after the setup

function playEntrance(units) {
  if (!units.length) return null;
  const tl = gsap.timeline({ delay: BASE });
  const orderOf = (unit) => number(unit.el, variant(unit.el, "data-anim-order"), 0);
  let at = 0;
  let landed = 0;
  [...new Set(units.map(orderOf))].sort((a, b) => a - b).forEach((order, i) => {
    const group = units.filter((unit) => orderOf(unit) === order);
    const lead = Math.max(...group.map((unit) => number(unit.el, variant(unit.el, "data-anim-lead"), LEAD)));
    if (i) at = Math.max(at, landed - lead);
    group.forEach((unit) => {
      const start = at + number(unit.el, "data-anim-delay", 0);
      const anim = unit.build();
      if (anim.deferred) {
        anim.start(BASE + start);
        tl.to({}, { duration: anim.duration }, start);
      } else tl.add(anim, start);
      landed = Math.max(landed, start + (number(unit.el, "data-anim-landed", 0) || (anim.deferred ? anim.duration : anim.duration())));
    });
  });
  holdUntil = gsap.ticker.time + BASE + tl.duration() - LEAD;
  entranceEnd = gsap.ticker.time + BASE + tl.duration() + 0.5;
  return tl;
}

function setupParallax(root) {
  scoped(root, '[data-anim="parallax"]').forEach((el) => {
    bind(el);
    // the stylesheet runs it as a scroll-driven animation where the browser has them (06-animation/_parallax.less)
    if (CSS.supports("animation-timeline", "view()")) return;
    // the fallback follows Lenis, so it only runs where Lenis smooths the scroll
    if (!fine.matches || (el.hasAttribute("data-anim-disable-mobile") && phone.matches)) return;
    if (el.closest('[data-anim="stack"]') && !phone.matches) return;
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

// data-anim="tuck": a sheet tucked wholly under the section before it (the announcement bar) slides down out from under
// its foot as the page scrolls, from data-anim-wait px of scroll over data-anim-run px (design px), --tuck going 0 to 1
// for the CSS to move it by. Scrolling back up it holds where it is until the shorter way home (data-anim-back px from
// the wait) catches it, so it is not pulled back under the foot the moment the page turns. The sheet eases towards that
// scroll target rather than tracking it, so a fast flick still gives a slow glide
const TUCK_EASE = 4; // per second: 90% of the way to the target in about 0.6s

function setupSheets(root) {
  scoped(root, '[data-anim="tuck"]').forEach((el) => {
    bind(el);
    if (still.matches) return;
    let wait, run, back;
    const measure = () => {
      wait = designPx(number(el, "data-anim-wait", 40));
      run = designPx(number(el, "data-anim-run", 200));
      back = designPx(number(el, "data-anim-back", 80));
    };
    let target = -1;
    let shown = -1;
    let ticking = false;
    let last = window.scrollY;
    const show = (value) => {
      shown = value;
      el.style.setProperty("--tuck", String(value));
    };
    const tick = (time, dt) => {
      let next = shown + (target - shown) * (1 - Math.exp(-(dt / 1000) * TUCK_EASE));
      if (Math.abs(target - next) < 0.0005) {
        next = target;
        gsap.ticker.remove(tick);
        ticking = false;
      }
      show(next);
    };
    const update = () => {
      const s = window.scrollY;
      const down = s >= last;
      last = s;
      const out = gsap.utils.clamp(0, 1, (s - wait) / run);
      const home = gsap.utils.clamp(0, 1, (s - wait) / back);
      const next = target < 0 ? out : down ? Math.max(target, out) : Math.min(target, home);
      if (next === target) return;
      target = next;
      if (shown < 0) return show(next);
      if (!ticking) {
        ticking = true;
        gsap.ticker.add(tick);
      }
    };
    measure();
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", () => { measure(); update(); });
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

// without scroll timelines the uncovering follows Lenis here instead of running in CSS
const TIMELINE = typeof CSS !== "undefined" && CSS.supports("animation-timeline", "scroll()");
const STACK_FOOT = 24; // px left under a stacked section's content when it is taller than the screen

function setupStacks(root) {
  const runs = [];
  scoped(root, '[data-anim="stack"]').forEach((el) => {
    bind(el);
    const run = runs.find((list) => list[list.length - 1] === el.previousElementSibling);
    if (run) run.push(el);
    else runs.push([el]);
  });
  runs.filter((run) => run.length > 1).forEach(stackRun);
}

function stackRun(panels) {
  if (phone.matches || !(TIMELINE || fine.matches)) return;
  const last = panels.length - 1;
  const incoming = panels.slice(1);
  // uncovered as it stands, its reveals and counters dropped; its title rises once the rising edge has uncovered half of it
  incoming.forEach((panel, n) => {
    panel.querySelectorAll('[data-anim="reveal"], [data-anim="counter"]').forEach((el) => {
      bind(el);
      el.classList.add("is-revealed");
    });
    panel.querySelectorAll("[data-anim-group]").forEach((group) => {
      bind(group);
      Array.from(group.children).forEach((child) => child.classList.add("is-revealed"));
    });
    panel.querySelectorAll('[data-anim="split"]').forEach((el) => STARTS.set(el, () => {
      const box = el.getBoundingClientRect();
      const top = box.top + window.scrollY;
      return marks ? 2 * marks[n + 1].top - marks[n + 1].hold - top - box.height / 2 : top - 0.88 * window.innerHeight;
    }));
  });
  const contents = incoming.map((panel) => Array.from(panel.firstElementChild.children));
  const dims = incoming.map((panel) => Array.from(panel.querySelectorAll("[data-anim-stack-dim]")));
  const layers = panels.map((panel) => Array.from(panel.querySelectorAll('[data-anim="parallax"]')));
  const travel = (layer) => ["--parallax-from", "--parallax-to"].map((name) => parseFloat(getComputedStyle(layer).getPropertyValue(name)) || 0);
  let spans = [];
  let marks = null;
  // a CSS scroll timeline runs a frame behind Lenis's scroll and the standing content shook, so under Lenis they move together
  const scripted = !TIMELINE || fine.matches;

  const clear = () => {
    panels.forEach((panel) => {
      panel.classList.remove("is-held", "is-incoming", "is-scripted", "is-stacked");
      panel.style.removeProperty("--stack-pull");
    });
    if (scripted) gsap.set([...contents.flat(), ...layers.flat(), ...dims.flat()], { clearProps: "transform,opacity" });
  };

  // from the natural layout: where each starts, its top while held, the scroll at which it holds
  const measure = () => {
    clear();
    marks = null;
    if (phone.matches) return;
    const y = window.scrollY;
    const view = document.documentElement.clientHeight;
    const boxes = panels.map((panel) => {
      const box = panel.getBoundingClientRect();
      const inner = panel.firstElementChild.getBoundingClientRect();
      return { top: box.top + y, height: box.height, pad: inner.top - box.top, end: inner.bottom - box.top };
    });
    marks = [];
    let pulled = 0;
    boxes.forEach((box, i) => {
      const prev = marks[i - 1];
      // drawn up under the held one's foot below the screen, so its edge starts rising the moment that one holds
      const pull = prev ? Math.max(0, prev.height + prev.hold - view) : 0;
      pulled += pull;
      const top = box.top - pulled;
      // held with its content centred on the screen, never lower than its top on the top of the screen; content taller than the screen holds with its foot in view, its top already seen on the way in
      const content = box.end - box.pad;
      const hold = Math.min(0, Math.round(content <= view ? (view - content) / 2 - box.pad : view - STACK_FOOT - box.end));
      marks.push({ top, height: box.height, hold, stick: top - hold, pad: box.pad, pull });
    });
    // the photo drifts across the whole time its section is on screen: from its first showing until the next one holds over it
    spans = layers.map((list) => list.map(travel));
    marks.forEach((mark, i) => {
      mark.drift = [i ? marks[i - 1].stick : mark.top - view, i < last ? marks[i + 1].stick : mark.top + mark.height];
      panels[i].style.setProperty("--stack-drift-from", `${mark.drift[0]}px`);
      panels[i].style.setProperty("--stack-drift-to", `${mark.drift[1]}px`);
    });
    panels.forEach((panel, i) => {
      if (i < last) panel.style.setProperty("--stack-top", `${marks[i].hold}px`);
      if (!i) return;
      if (marks[i].pull) panel.style.setProperty("--stack-pull", `${-marks[i].pull}px`);
      const { stick: from } = marks[i - 1];
      const { stick: to, pad } = marks[i];
      Object.assign(marks[i], { from, to });
      panel.style.setProperty("--stack-from", `${from}px`);
      panel.style.setProperty("--stack-to", `${to}px`);
      panel.style.setProperty("--stack-shift", `${from - to}px`);
      panel.style.setProperty("--stack-pad", `${pad}px`);
    });
  };

  // a section holds from its top reaching the top of the screen until the next one covers it
  const update = () => {
    if (!marks) return;
    const s = window.scrollY;
    panels.forEach((panel, i) => {
      if (i < last) panel.classList.toggle("is-held", s >= marks[i].top - 1 && s < marks[i + 1].stick);
    });
    if (!scripted) return;
    incoming.forEach((panel, n) => {
      const { from, to } = marks[n + 1];
      const p = gsap.utils.clamp(0, 1, (s - from) / (to - from || 1));
      gsap.set(contents[n], { y: (from - to) * (1 - p), force3D: true });
      gsap.set(dims[n], { opacity: p < 0.4 ? 0.35 : 0.35 + ((p - 0.4) / 0.6) * 0.65 });
    });
    layers.forEach((list, i) => {
      const [a, b] = marks[i].drift;
      const p = gsap.utils.clamp(0, 1, (s - a) / (b - a || 1));
      list.forEach((layer, j) => {
        const [start, end] = spans[i][j];
        gsap.set(layer, { yPercent: start + (end - start) * p, force3D: true });
      });
    });
  };

  const apply = () => {
    if (!marks) return;
    panels.forEach((panel, i) => panel.classList.add("is-stacked", ...(scripted ? ["is-scripted"] : []), ...(i ? ["is-incoming"] : [])));
    update();
  };

  // a keyboard user tabbing into a held section that the next one has partly covered is taken back to see it whole
  panels.slice(0, last).forEach((panel, i) => panel.addEventListener("focusin", (event) => {
    if (!marks || !event.target.matches(":focus-visible") || window.scrollY <= marks[i].stick) return;
    lenis ? lenis.scrollTo(marks[i].stick) : window.scrollTo(0, marks[i].stick);
  }));

  ScrollTrigger.addEventListener("refreshInit", measure);
  ScrollTrigger.addEventListener("refresh", apply);
  lenis?.on("scroll", update);
}

function setup(root, opts = {}) {
  const entrance = [];
  const scroll = [];
  setupStacks(root);
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
    if ((media && !window.matchMedia(media).matches) || carries(el)) {
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
  setupSheets(root);
  scroll.forEach(watch);
  return entrance;
}

function revealEverything() {
  document.documentElement.classList.add("anim-reduced");
  gsap.utils.toArray("[data-anim], .anim-line").forEach((el) => gsap.set(el, { clearProps: CLEAR }));
}

const Anim = {
  lenis: null,
  entrance: null, // the page entrance's GSAP timeline, once it has started

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
        // the entrance's clock starts once the setup and its measuring are done, or they eat into its first frames; a page
        // opened in a background tab waits for its first look, as hidden the clock stands still and the timeline would
        // leap on return, its steps firing together
        const start = () => { this.entrance = playEntrance(entrance); };
        if (document.visibilityState !== "hidden") start();
        else document.addEventListener("visibilitychange", function once() {
          if (document.visibilityState === "hidden") return;
          document.removeEventListener("visibilitychange", once);
          start();
        });
      } catch (err) {
        fail(err);
      }
    };
    Promise.race([fonts, new Promise((resolve) => setTimeout(resolve, 900))]).then(go, go);
    // hidden mid-way, the entrance pauses rather than leaping ahead when the tab is seen again
    document.addEventListener("visibilitychange", () => {
      const tl = this.entrance;
      if (!tl || tl.progress() === 1) return;
      if (document.visibilityState === "hidden") tl.pause();
      else tl.play();
    });
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
