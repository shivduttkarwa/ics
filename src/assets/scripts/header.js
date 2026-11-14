// the header's scroll states: is-stuck (the fixed bar) once it has left the top, is-hidden while scrolling down
import { phone } from "./motion.js";

const TOLERANCE = 8;
const HOLD = 0.4; // below lg the header holds for this share of the screen, the range of the hero's own scroll fade

export function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  header.classList.add("is-held");
  let full = header.offsetHeight;
  let zone = 0;
  let anchor = window.scrollY;
  const measure = () => {
    if (!header.classList.contains("is-stuck")) full = header.offsetHeight;
    zone = phone.matches ? Math.max(full, window.innerHeight * HOLD) : full;
  };
  const sync = (loading) => {
    const y = window.scrollY;
    if (y <= (phone.matches ? zone : 0)) {
      header.classList.remove("is-stuck", "is-hidden");
      anchor = y;
      return;
    }
    if (!header.classList.contains("is-stuck")) {
      if (y > zone) {
        // from lg it has already scrolled out of sight, so it sticks without a slide; below lg it slides away
        if (loading === true || !phone.matches) header.classList.add("is-instant");
        header.classList.add("is-stuck", "is-hidden");
        void header.offsetHeight;
        header.classList.remove("is-instant");
      }
      anchor = y;
      return;
    }
    if (Math.abs(y - anchor) >= TOLERANCE) {
      header.classList.toggle("is-hidden", y > zone && y > anchor);
      anchor = y;
    }
  };
  measure();
  sync(true);
  window.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", () => {
    measure();
    sync();
  });
}
