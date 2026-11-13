import { Anim } from "./anim.js";
import { initSliders } from "./slider.js";
import { initAccordions, initAmbientVideos, initDevicePixel, initDisclosures, initEagerPhotos, initFocusMode, initHoverVideos, initMarquees, initScrollState, initStickyHeader } from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
  initFocusMode();
  initDevicePixel();
  initScrollState();
  initStickyHeader();
  initSliders();
  initEagerPhotos();
  initMarquees();
  initAmbientVideos();
  Anim.init();
  initDisclosures();
  initAccordions();
  initHoverVideos();
});
