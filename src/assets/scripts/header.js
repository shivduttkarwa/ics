// the header scrolls away with the page; only its pill (Book a tour and the burger) stays, fixed, and the bar keeps room for it
const LIGHT = 0.6; // relative luminance above which the ground behind the burger counts as light

export function initHeader() {
  const header = document.querySelector(".site-header");
  const tools = header?.querySelector(".site-header__tools");
  if (!header || !tools) return;
  const measure = () => header.style.setProperty("--header-tools", `${tools.offsetWidth}px`);
  measure();
  window.addEventListener("resize", measure);
  document.fonts?.ready.then(measure);

  // the burger is white for the dark grounds and photos Figma draws it on; over a light ground it turns canopy (is-light)
  let queued = false;
  const update = () => {
    queued = false;
    tools.classList.toggle("is-light", onLight(header, tools));
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("load", schedule);
  schedule();
}

function onLight(header, tools) {
  const box = tools.getBoundingClientRect();
  const x = box.right - box.height / 2;
  const y = box.top + box.height / 2;
  for (const el of document.elementsFromPoint(x, y)) {
    if (header.contains(el)) continue;
    if (el.matches("img, video, picture, canvas, iframe")) return false;
    const style = getComputedStyle(el);
    if (style.backgroundImage.includes("url(")) return false;
    const [r, g, b, a = 1] = (style.backgroundColor.match(/[\d.]+/g) || [0, 0, 0, 0]).map(Number);
    if (a < 0.5) continue;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > LIGHT;
  }
  return true;
}
