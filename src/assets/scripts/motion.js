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

export { gsap, ScrollTrigger, SplitText, Observer };
