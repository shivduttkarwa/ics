// the main menu: a modal panel that grows out of the header's pill (below lg it is uncovered from the top down), its rows
// coming in turn; parent items open in place
import { gsap, still, phone, settled, landing } from "./motion.js";
import { lockScroll } from "./ui.js";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
const AWAY = 105; // % of the panel's width: clear of the screen's edge, inset included
const PHONE_PACE = 1.4; // below lg the menu plays this much faster than the desktop's timing

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
  // below lg, once the panel covers the screen, the page behind it is hidden: iPhone Safari showed it under its toolbar
  const cover = (on) => document.documentElement.classList.toggle("is-menu-covered", on);
  const hide = () => {
    menu.hidden = true;
    cover(false);
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
    // a pixel past the pill's edges, or its frosted rim shows as a light line under the strip's edge
    const bleed = 1;
    return {
      pill: { "--clip-t": px(from.top - box.top - bleed), "--clip-r": px(box.right - from.right - bleed), "--clip-b": px(box.bottom - from.bottom - bleed), "--clip-l": px(from.left - box.left - bleed), "--clip-round": px(from.height / 2 + bleed) },
      full: { "--clip-t": "0px", "--clip-r": "0px", "--clip-b": "0px", "--clip-l": "0px", "--clip-round": px(parseFloat(getComputedStyle(panel).borderTopLeftRadius) || 0) },
    };
  };
  const unclip = () => EDGES.forEach((edge) => panel.style.removeProperty(edge));
  const clipped = () => panel.style.getPropertyValue("--clip-t") !== "";
  // below lg there is no pill to grow out of: the clip's foot runs down over the panel as the desktop's height does
  const shut = () => px(panel.offsetHeight);
  // the panel's reach under Safari's toolbar: the roll lands at the screen's foot, then that strip is uncovered at once
  const under = () => Math.max(panel.offsetHeight - menu.clientHeight, 0);

  // the list's items are masks while they move: each one's contents drop in from above its top edge in turn, and lift back
  // out the same way, each item's rule fading with it (--menu-rule); the other rows (the search at the top, the buttons and
  // links at the foot) fade
  const items = rows.filter((row) => row.classList.contains("menu__item"));
  const inner = items.flatMap((row) => Array.from(row.children));
  const top = rows.find((row) => row.classList.contains("menu__top"));
  const foot = rows.find((row) => row.classList.contains("menu__foot"));
  const fades = [top, foot].filter(Boolean);
  const bits = foot ? Array.from(foot.querySelectorAll(".btn, .menu__links li")) : []; // the foot's buttons and links, in turn
  const MASK = "inset(0px 0px 0px 0px)";
  const above = (i, el) => -(el.parentElement.offsetHeight + 2);
  const rowsIn = (tl, at, stagger = 0.04) => {
    gsap.set(items, { clipPath: MASK });
    items.forEach((row, i) => {
      tl.to(row.children, { ...settled(row.firstElementChild, { y: 0, duration: 1, ease: "soft" }), force3D: true }, at + i * stagger)
        .to(row, { "--menu-rule": 1, duration: 0.9, ease: "power1.out" }, at + i * stagger);
    });
    // the search with the first item; the foot's buttons and links one by one once the last item has dropped in
    tl.to(fades, { opacity: 1, duration: 0.9, ease: "power1.out" }, at)
      .to(bits, { opacity: 1, duration: 0.7, ease: "power1.out", stagger: 0.06 }, at + items.length * stagger + 0.3);
  };
  const rowsOut = (tl, at, stagger = 0.025) => {
    gsap.set(items, { clipPath: MASK, transition: "none" });
    items.forEach((row, i) => {
      tl.to(row.children, { y: above, duration: 0.45, ease: "power2.in", force3D: true }, at + i * stagger)
        .to(row, { "--menu-rule": 0, duration: 0.35, ease: "power1.in" }, at + i * stagger);
    });
    tl.to(fades, { opacity: 0, duration: 0.35, ease: "power1.in" }, at);
  };
  const rowsSettle = () => {
    gsap.set([...items, ...inner, ...fades, ...bits], { clearProps: "clipPath,transform,opacity,transition" });
    items.forEach((row) => row.style.removeProperty("--menu-rule"));
  };
  // where a fresh open starts its rows: the items' contents above their masks, their rules and the other rows faded out
  const rowsReady = () => {
    gsap.set(backdrop, { autoAlpha: 0 });
    gsap.set(inner, { y: above, force3D: true });
    // the rule's own transition (an item opening) would trail the fade by a beat
    gsap.set(items, { "--menu-rule": 0, transition: "none" });
    gsap.set([top, ...bits].filter(Boolean), { opacity: 0 });
    if (foot) gsap.set(foot, { opacity: 1 });
  };

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
    if (still.matches) return cover(phone.matches);
    const shape = phone.matches ? null : shapes();
    // caught mid-close, it comes back from wherever it is; the rows' contents stay in the tree while under their masks, so focus holds
    if (fresh) {
      rowsReady();
      if (phone.matches) {
        unclip();
        gsap.set(panel, { "--clip-b": shut() });
      }
      else if (shape) gsap.set(panel, { ...shape.pill, opacity: 0 });
      else gsap.set(panel, { xPercent: AWAY });
    }
    tl = gsap.timeline({ onComplete: () => { gsap.set(panel, { clearProps: "transform,opacity" }); unclip(); rowsSettle(); } })
      .to(backdrop, { autoAlpha: 1, duration: 0.6, ease: "power1.out" }, 0);
    // below lg it is uncovered from the top down on the desktop's height curve and timing, its rows coming in 0.4s into it
    if (phone.matches) {
      tl.to(panel, { "--clip-b": px(under()), duration: 1.3, ease: "fold" }, 0)
        .set(panel, { "--clip-b": "0px" }, 1.3)
        .call(cover, [true], 1.3);
      rowsIn(tl, fresh ? 0.4 : 0.2);
      tl.timeScale(PHONE_PACE);
      return;
    }
    if (!shape) {
      tl.to(panel, settled(panel, { xPercent: 0, duration: 0.9, ease: "silk" }), 0);
      rowsIn(tl, 0.25);
      return;
    }
    // it grows left out of the pill at the pill's height, and once that has settled grows down to its full height as its
    // corners go from the pill's round to its own and its rows come in; width and height on one curve
    const { "--clip-t": t, "--clip-b": b, "--clip-round": round } = shape.full;
    tl.to(panel, { opacity: 1, duration: 0.3, ease: "power1.out" }, 0)
      .to(panel, { "--clip-l": "0px", "--clip-r": "0px", duration: 0.75, ease: "fold" }, 0)
      .to(panel, { "--clip-t": t, "--clip-b": b, "--clip-round": round, duration: 1.2, ease: "fold" }, fresh ? 0.55 : 0);
    rowsIn(tl, fresh ? 0.95 : 0.2);
  };

  const close = () => {
    if (!open) return;
    open = false;
    expanded(false);
    outside().forEach((el) => { el.inert = false; });
    opener.focus({ preventScroll: true });
    tl?.kill();
    if (still.matches) return hide();
    tl = gsap.timeline({ onComplete: hide });
    rowsOut(tl, 0);
    // below lg, once its rows have sunk, it rolls back up from the foot as the desktop folds its height
    if (phone.matches) {
      const foot = Math.max(parseFloat(panel.style.getPropertyValue("--clip-b")) || 0, under());
      tl.to(backdrop, { autoAlpha: 0, duration: 0.4, ease: "power1.in" }, 0.35)
        .call(cover, [false], 0.3)
        .set(panel, { "--clip-b": px(foot) }, 0.3)
        .to(panel, { "--clip-b": shut, duration: 0.8, ease: "fold" }, 0.3)
        .timeScale(PHONE_PACE);
      return;
    }
    const shape = shapes();
    if (!shape) {
      tl.to(backdrop, { autoAlpha: 0, duration: 0.45, ease: "power1.in" }, 0.1)
        .to(panel, { xPercent: AWAY, duration: 0.55, ease: "power2.in" }, 0.3);
      return;
    }
    // once its rows have sunk it folds back up to the pill's height, and once that has settled narrows into the pill,
    // settling on the same curve; caught mid-open it folds from wherever it is
    if (!clipped()) gsap.set(panel, shape.full);
    const { "--clip-t": t, "--clip-b": b, "--clip-l": l, "--clip-r": r, "--clip-round": round } = shape.pill;
    tl.to(backdrop, { autoAlpha: 0, duration: 0.4, ease: "power1.in" }, 0.35)
      .to(panel, { "--clip-t": t, "--clip-b": b, "--clip-round": round, duration: 0.7, ease: "fold" }, 0.3)
      .to(panel, { "--clip-l": l, "--clip-r": r, duration: 0.75, ease: "fold" }, 0.85)
      .to(panel, { opacity: 0, duration: 0.25, ease: "power1.in" }, 1.35);
  };

  openers.forEach((button) => button.addEventListener("click", () => {
    opener = button;
    show();
  }));
  menu.querySelectorAll("[data-menu-close]").forEach((el) => el.addEventListener("click", close));
  // a link that loads another page leaves the menu open for the next page to uncover itself over; closing it played the
  // fold for as long as the page took to arrive, and the page change then caught it half-shut
  const leaves = (link, event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download")) return false;
    const to = new URL(link.href, location.href);
    return !(to.hash && to.origin === location.origin && to.pathname === location.pathname && to.search === location.search);
  };
  menu.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (link && !leaves(link, event)) close();
  });
  // Back restores this page as it was left, menu open: it is put away at once
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted || !open) return;
    open = false;
    tl?.kill();
    expanded(false);
    outside().forEach((el) => { el.inert = false; });
    hide();
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
