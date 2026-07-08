gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

function initStorySection(section) {
  const track = section.querySelector(".ics-story-track");
  const bar   = section.querySelector(".ics-story-progress__bar");
  const rows  = gsap.utils.toArray(section.querySelectorAll(".ics-story-row"));

  const distance = () => track.scrollWidth - window.innerWidth;

  const scaleSetters = rows.map((r) => gsap.quickTo(r, "scale", { duration: 0.45, ease: "power3" }));
  const MIN = 0.9, MAX = 1;
  const updateScales = () => {
    const cx = window.innerWidth / 2;
    rows.forEach((r, i) => {
      const rect = r.getBoundingClientRect();
      const dist = Math.abs((rect.left + rect.width / 2) - cx) / window.innerWidth;
      scaleSetters[i](gsap.utils.clamp(MIN, MAX, MAX - dist * 0.16));
    });
  };

  const HOLD_RATIO = 0.06;
  const TOTAL_RATIO = 1 + HOLD_RATIO * 2;

  const horizontal = gsap.timeline({
    scrollTrigger: {
      trigger: section, pin: true, scrub: 1.2,
      start: "top top", end: () => "+=" + Math.round(distance() * TOTAL_RATIO),
      invalidateOnRefresh: true, onRefresh: updateScales,
      onUpdate: (self) => {
        const p = gsap.utils.clamp(0, 1, self.progress * TOTAL_RATIO - HOLD_RATIO);
        gsap.set(bar, { scaleX: p });
        updateScales();
      }
    }
  })
    .to({}, { duration: HOLD_RATIO })
    .to(track, { x: () => -distance(), ease: "none" })
    .to({}, { duration: HOLD_RATIO });

  rows.forEach((row) => {
    const img = row.querySelector(".ics-story-row__media img");

    gsap.fromTo(img, { xPercent: -5 }, {
      xPercent: 5, ease: "none",
      scrollTrigger: { trigger: row, containerAnimation: horizontal, start: "left right", end: "right left", scrub: true }
    });

    gsap.fromTo(row.querySelector(".ics-story-row__media"),
      { clipPath: "inset(0% 0% 0% 100%)" },
      { clipPath: "inset(0% 0% 0% 0%)", ease: "none",
        scrollTrigger: { trigger: row, containerAnimation: horizontal, start: "left right", end: "left center", scrub: true } }
    );
  });

  updateScales();
}

window.addEventListener("load", () => {
  document.querySelectorAll(".ics-story-section").forEach(initStorySection);
  ScrollTrigger.refresh();
});
