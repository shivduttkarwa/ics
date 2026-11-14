// [data-tiles]: with no hover, a tap on a [data-tile] opens its copy and button and shuts the others
import { fine } from "./motion.js";

export function initCards() {
  document.querySelectorAll("[data-tiles]").forEach((list) => {
    list.addEventListener("click", (event) => {
      // Swiper has already cancelled the click that ends a drag
      if (fine.matches || event.defaultPrevented || event.target.closest("a, button")) return;
      const tile = event.target.closest("[data-tile]");
      if (!tile) return;
      const open = !tile.classList.contains("is-open");
      list.querySelectorAll(".is-open").forEach((other) => other.classList.remove("is-open"));
      tile.classList.toggle("is-open", open);
    });
  });
}
