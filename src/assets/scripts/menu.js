// the main menu: a modal panel that grows out of the header's pill, its rows rising in turn; parent items open in place
import { gsap, still, settled, landing } from "./motion.js";
import { lockScroll } from "./ui.js";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
const AWAY = 105; // % of the panel's width: clear of the screen's edge, inset included

export function initMenu() {
  const menu = document.getElementById("menu");
  const openers = Array.from(document.querySelectorAll("[data-menu-open]"));
  if (!menu || !openers.length) return;
  const panel = menu.querySelector(".menu__panel");
  const backdrop = menu.querySelector(".menu__backdrop");
  const rows = Array.from(menu.querySelectorAll("[data-menu-row]"));
  let open = false;
  let opener = openers[0];
  let tl = null;

  const outside = () => Array.from(document.body.children).filter((el) => el !== menu);
  const expanded = (value) => openers.forEach((button) => button.setAttribute("aria-expanded", String(value)));
  const hide = () => {
    menu.hidden = true;
    lockScroll(false);
  };

  // The panel's clip is inset(--clip-t --clip-r --clip-b --clip-l round --clip-round) in the stylesheet: the edges of the
  // box it grows out of (the header's pill), each its own property, so the width and the height fold at their own pace
  const EDGES = ["--clip-t", "--clip-r", "--clip-b", "--clip-l", "--clip-round"];
  const px = (n) => `${n}px`;
  const shapes = () => {
    const from = (opener.closest("[data-menu-origin]") || opener).getBoundingClientRect();
    if (!from.width || !from.height) return null;
    const box = panel.getBoundingClientRect();
    return {
      pill: { "--clip-t": px(from.top - box.top), "--clip-r": px(box.right - from.right), "--clip-b": px(box.bottom - from.bottom), "--clip-l": px(from.left - box.left), "--clip-round": px(from.height / 2) },
      full: { "--clip-t": "0px", "--clip-r": "0px", "--clip-b": "0px", "--clip-l": "0px", "--clip-round": px(parseFloat(getComputedStyle(panel).borderTopLeftRadius) || 0) },
    };
  };
  const unclip = () => EDGES.forEach((edge) => panel.style.removeProperty(edge));
  const clipped = () => panel.style.getPropertyValue("--clip-t") !== "";

  const show = () => {
    if (open) return;
    open = true;
    const fresh = menu.hidden;
    menu.hidden = false;
    expanded(true);
    lockScroll(true);
    outside().forEach((el) => { el.inert = true; });
    menu.querySelector(".menu__close").focus({ preventScroll: true });
    tl?.kill();
    if (still.matches) return;
    const shape = shapes();
    // caught mid-close, it comes back from wherever it is; the rows fade on opacity alone, as hiding one would drop the focus
    if (fresh) {
      gsap.set(backdrop, { autoAlpha: 0 });
      gsap.set(rows, { y: 28, opacity: 0 });
      if (shape) gsap.set(panel, { ...shape.pill, opacity: 0 });
      else gsap.set(panel, { xPercent: AWAY });
    }
    const rise = { ...settled(rows[0], { y: 0, duration: 0.8, ease: "soft" }), opacity: 1, stagger: 0.055 };
    tl = gsap.timeline({ onComplete: () => { gsap.set([panel, ...rows], { clearProps: "transform,opacity" }); unclip(); } })
      .to(backdrop, { autoAlpha: 1, duration: 0.6, ease: "power1.out" }, 0);
    if (!shape) {
      tl.to(panel, settled(panel, { xPercent: 0, duration: 0.9, ease: "silk" }), 0).to(rows, rise, 0.25);
      return;
    }
    // it stretches out of the pill at the pill's height, and a beat later drops to its full height as its corners go from
    // the pill's round to its own and its rows come in (gsa.uk.com); width and height on one curve, overlapping
    const { "--clip-t": t, "--clip-b": b, "--clip-round": round } = shape.full;
    tl.to(panel, { opacity: 1, duration: 0.3, ease: "power1.out" }, 0)
      .to(panel, { "--clip-l": "0px", "--clip-r": "0px", duration: 1.1, ease: "fold" }, 0)
      .to(panel, { "--clip-t": t, "--clip-b": b, "--clip-round": round, duration: 1.4, ease: "fold" }, fresh ? 0.5 : 0)
      .to(rows, rise, fresh ? 1.05 : 0.2);
  };

  const close = () => {
    if (!open) return;
    open = false;
    expanded(false);
    outside().forEach((el) => { el.inert = false; });
    opener.focus({ preventScroll: true });
    tl?.kill();
    if (still.matches) return hide();
    const shape = shapes();
    tl = gsap.timeline({ onComplete: hide })
      .to(rows, { opacity: 0, duration: 0.2, ease: "power1.in" }, 0)
      .to(backdrop, { autoAlpha: 0, duration: 0.45, ease: "power1.in" }, 0.1);
    if (!shape) {
      tl.to(panel, { xPercent: AWAY, duration: 0.55, ease: "power2.in" }, 0);
      return;
    }
    // it folds back to the pill's height, and from a beat in narrows into the pill, settling on the same curve; caught
    // mid-open it folds from wherever it is
    if (!clipped()) gsap.set(panel, shape.full);
    const { "--clip-t": t, "--clip-b": b, "--clip-l": l, "--clip-r": r, "--clip-round": round } = shape.pill;
    tl.to(panel, { "--clip-t": t, "--clip-b": b, "--clip-round": round, duration: 1, ease: "fold" }, 0)
      .to(panel, { "--clip-l": l, "--clip-r": r, duration: 1.3, ease: "fold" }, 0.4)
      .to(panel, { opacity: 0, duration: 0.35, ease: "power1.in" }, 1.35);
  };

  openers.forEach((button) => button.addEventListener("click", () => {
    opener = button;
    show();
  }));
  menu.querySelectorAll("[data-menu-close]").forEach((el) => el.addEventListener("click", close));
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a[href]")) close();
  });
  menu.querySelector(".menu__search")?.addEventListener("submit", (event) => {
    if (!event.currentTarget.getAttribute("action")) event.preventDefault();
  });

  menu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      return close();
    }
    if (event.key !== "Tab") return;
    const stops = Array.from(menu.querySelectorAll(FOCUSABLE)).filter((el) => el.checkVisibility?.({ visibilityProperty: true }) ?? el.offsetParent);
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // a parent item opens in place and shuts the others; heights move in whole pixels, as accordion.js
  const parents = Array.from(menu.querySelectorAll(".menu__item")).filter((item) => item.querySelector(".menu__sub"));
  const move = (item, on) => {
    const sub = item.querySelector(".menu__sub");
    const links = Array.from(sub.querySelectorAll("li"));
    const from = sub.offsetHeight;
    item.classList.toggle("is-open", on);
    item.querySelector(".menu__link").setAttribute("aria-expanded", String(on));
    if (still.matches) return;
    gsap.killTweensOf([sub, ...links]);
    gsap.set(sub, { height: "auto", visibility: "visible" });
    const to = on ? sub.offsetHeight : 0;
    const step = gsap.timeline({ onComplete: () => gsap.set([sub, ...links], { clearProps: "height,visibility,opacity,transform" }) })
      .fromTo(sub, { height: from }, { height: to, duration: 0.65, ease: "glide", snap: { height: 1 } }, 0);
    if (on) {
      const land = landing("soft", 10);
      step.fromTo(links, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.55 * land.cut, ease: land.ease, stagger: 0.06 }, 0.15);
    }
    else step.to(links, { autoAlpha: 0, duration: 0.25, ease: "power1.in" }, 0);
  };
  parents.forEach((item) => {
    item.querySelector(".menu__link").addEventListener("click", () => {
      const on = !item.classList.contains("is-open");
      parents.forEach((other) => {
        if (other !== item && other.classList.contains("is-open")) move(other, false);
      });
      move(item, on);
    });
  });
}
