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

// A move on a compositor layer is resampled at every fractional offset, so text and hairlines go soft and seem to
// shiver through an ease's long tail, when they are already solid and barely moving. landing() ends the move once
// under half a pixel is left: the curve keeps its shape up to that point and the tween runs that share of its duration.
export function landing(ease, distance) {
  const curve = gsap.parseEase(ease);
  const span = Math.abs(distance);
  if (!(span > 1)) return { ease: curve, cut: 1 };
  const target = 1 - 0.5 / span;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (curve(mid) < target) lo = mid;
    else hi = mid;
  }
  const end = curve(hi) || 1;
  return { ease: (p) => curve(p * hi) / end, cut: hi };
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

export { gsap, ScrollTrigger, SplitText, Observer };
