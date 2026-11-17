import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { Observer } from "gsap/Observer";

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, Observer);

// the house curves, the same as --ease-out, --ease-silk and --ease-in-out in _tokens.less
CustomEase.create("soft", "0.22, 1, 0.36, 1");
CustomEase.create("silk", "0.16, 1, 0.3, 1");
CustomEase.create("glide", "0.65, 0, 0.35, 1");
gsap.defaults({ ease: "soft", duration: 1 });

export const still = window.matchMedia("(prefers-reduced-motion: reduce)");
export const phone = window.matchMedia("(max-width: 991.98px)");
export const fine = window.matchMedia("(hover: hover) and (pointer: fine)");

// a design px at the current fluid root
export const designPx = (value) => (value * parseFloat(getComputedStyle(document.documentElement).fontSize)) / 16;

// a layer crawling through an ease's tail is resampled every frame and shimmers, so the move ends once it stays within a device pixel of home
export function landing(ease, distance) {
  const curve = gsap.parseEase(ease);
  const span = Math.abs(distance);
  const near = 1 / (window.devicePixelRatio || 1) / span;
  if (!(near < 1)) return { ease: curve, cut: 1 };
  const away = (p) => Math.abs(1 - curve(p)) >= near;
  let lo = 0;
  for (let i = 100; i > 0; i--) {
    if (away(i / 100)) {
      lo = i / 100;
      break;
    }
  }
  let hi = Math.min(1, lo + 0.01);
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (away(mid)) lo = mid;
    else hi = mid;
  }
  const end = curve(hi) || 1;
  return { ease: (p) => curve(p * hi) / end, cut: hi };
}

// a move drawn on whole device pixels: off a layer, text stays on the pixel grid and every item steps on the same frame
export function whole(ease, distance) {
  const curve = gsap.parseEase(ease);
  return (progress) => {
    const steps = Math.abs(distance) * (window.devicePixelRatio || 1);
    return Math.round(curve(progress) * steps) / steps;
  };
}

// a GSAP ease as a CSS easing, so the compositor can run it; without linear() the fallback curve is used
const LINEAR = typeof CSS !== "undefined" && CSS.supports("animation-timing-function", "linear(0, 1)");
export function cssEase(ease, fallback, steps = 40) {
  if (!LINEAR) return fallback;
  const curve = gsap.parseEase(ease);
  const points = Array.from({ length: steps + 1 }, (_, i) => +curve(i / steps).toFixed(4));
  return `linear(${points.join(", ")})`;
}

// a damped spring over the tween's length: it arrives in about a quarter of it, swings about 8% past, and settles with a
// barely-there second swing, for something that should land with a little give
export function spring(damping = 0.62, stiffness = 11) {
  const swing = stiffness * Math.sqrt(1 - damping * damping);
  const decay = damping * stiffness;
  return (p) => 1 - Math.exp(-decay * p) * (Math.cos(swing * p) + (decay / swing) * Math.sin(swing * p));
}

// the same tween vars with the tail cut, measured from where `el` is now to where `vars` takes it
export function settled(el, vars) {
  const box = el.getBoundingClientRect();
  const now = (prop) => parseFloat(gsap.getProperty(el, prop)) || 0;
  const px = (value, size) => (typeof value === "string" && value.endsWith("%") ? (parseFloat(value) / 100) * size : parseFloat(value) || 0);
  let distance = 0;
  if ("x" in vars) distance = Math.max(distance, Math.abs(px(vars.x, box.width) - now("x")));
  if ("y" in vars) distance = Math.max(distance, Math.abs(px(vars.y, box.height) - now("y")));
  if ("xPercent" in vars) distance = Math.max(distance, (Math.abs(vars.xPercent - now("xPercent")) / 100) * box.width);
  if ("yPercent" in vars) distance = Math.max(distance, (Math.abs(vars.yPercent - now("yPercent")) / 100) * box.height);
  if ("scale" in vars) distance = Math.max(distance, (Math.abs(vars.scale - now("scale")) * Math.max(box.width, box.height)) / 2);
  if (!distance) return vars;
  const { ease, cut } = landing(vars.ease || gsap.defaults().ease, distance);
  return { ...vars, ease, duration: (vars.duration ?? gsap.defaults().duration) * cut };
}

// A frosted element's blur is sampled from whatever sits behind it, so one that moves over a still backdrop jitters;
// it should fade in place. A card that carries its own photo moves the backdrop with it and may move.
const blurred = (el) => {
  const style = getComputedStyle(el);
  return (style.backdropFilter || style.webkitBackdropFilter || "none") !== "none";
};
export function glassy(el) {
  if (!(blurred(el) || Array.from(el.querySelectorAll("*")).some(blurred))) return false;
  const box = el.getBoundingClientRect();
  const area = box.width * box.height;
  return !Array.from(el.querySelectorAll("img, video")).some((media) => {
    const b = media.getBoundingClientRect();
    return b.width * b.height >= area * 0.5;
  });
}

// Opacity under 1 on an ancestor cuts a backdrop-filter off from what is behind it (a backdrop root), so glass faded through
// its wrapper shows only its tint and snaps to its blur as the fade ends. These are the parts to fade instead: the glass
// itself and whatever beside it holds none.
export function fadeParts(el) {
  if (blurred(el)) return [el];
  const parts = [];
  const walk = (node) => Array.from(node.children).forEach((child) => {
    if (blurred(child)) parts.push(child);
    else if (Array.from(child.querySelectorAll("*")).some(blurred)) walk(child);
    else parts.push(child);
  });
  walk(el);
  return parts.length ? parts : [el];
}

export { gsap, ScrollTrigger, SplitText, Observer };
