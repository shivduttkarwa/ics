gsap.registerPlugin(ScrollTrigger);

function initStorySection(section) {
  const viewport = section.querySelector(".ics-story-section");
  const track = section.querySelector(".ics-story-track");
  const bar = section.querySelector(".ics-story-progress__bar");

  if (!viewport || !track) {
    return;
  }

  const getDistance = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
  const setScrollHeight = () => {
    const viewportHeight = viewport.offsetHeight || window.innerHeight;
    section.style.setProperty("--ics-story-scroll-height", `${viewportHeight + getDistance()}px`);
  };

  setScrollHeight();
  gsap.set(track, { x: 0 });

  gsap.to(track, {
    x: () => -getDistance(),
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => `+=${getDistance()}`,
      scrub: 0.5,
      pin: viewport,
      pinSpacing: false,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefreshInit: setScrollHeight,
      onRefresh: setScrollHeight,
      onUpdate: (self) => {
        if (bar) {
          gsap.set(bar, { scaleX: self.progress });
        }
      }
    }
  });
}

window.addEventListener("load", () => {
  document.querySelectorAll(".ics-story-scroll").forEach(initStorySection);
  ScrollTrigger.refresh();
});
