// the header scrolls away with the page; only its pill (Book a tour and the burger) stays, fixed, and the bar keeps room for it
export function initHeader() {
  const header = document.querySelector(".site-header");
  const tools = header?.querySelector(".site-header__tools");
  if (!header || !tools) return;
  const measure = () => header.style.setProperty("--header-tools", `${tools.offsetWidth}px`);
  measure();
  window.addEventListener("resize", measure);
  document.fonts?.ready.then(measure);
}
