// the header scrolls away with the page; only its pill (Book a tour and the burger) stays, fixed, and the bar keeps room for it
const LIGHT = 0.6; // relative luminance above which the ground behind the burger counts as light

export function initHeader() {
  const header = document.querySelector(".site-header");
  const tools = header?.querySelector(".site-header__tools");
  if (!header || !tools) return;
  const hero = document.querySelector(".hero");
  const measure = () => {
    const width = `${tools.offsetWidth}px`;
    header.style.setProperty("--header-tools", width);
    try { sessionStorage.setItem("header-tools", width); } catch (e) {}
    if (hero) header.style.setProperty("--hero-height", `${hero.offsetHeight}px`);
  };
  measure();
  window.addEventListener("resize", measure);
  document.fonts?.ready.then(measure);

  // the burger is white for the dark grounds and photos Figma draws it on; over a light ground it turns canopy (is-light)
  let queued = false;
  const update = () => {
    queued = false;
    const light = onLight(header, tools);
    if (light === null) {
      setTimeout(schedule, 100);
      return;
    }
    tools.classList.toggle("is-light", light);
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
  const hits = document.elementsFromPoint(x, y);
  // mid page change only the root is hit-tested, so the ground is unknown until it has played
  if (hits.length && !hits.some((el) => document.body.contains(el))) return null;
  for (const el of hits) {
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
