gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

function initStorySection(section) {
  const track = section.querySelector(".ics-story-track");
  const bar = section.querySelector(".ics-story-progress__bar");

  if (!track) {
    return;
  }

  const getDistance = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);

  gsap.set(track, { x: 0 });

  gsap.to(track, {
    x: () => -getDistance(),
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => `+=${getDistance()}`,
      scrub: 0.5,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (bar) {
          gsap.set(bar, { scaleX: self.progress });
        }
      }
    }
  });
}

window.addEventListener("load", () => {
  document.querySelectorAll(".ics-story-section").forEach(initStorySection);
  ScrollTrigger.refresh();
});
