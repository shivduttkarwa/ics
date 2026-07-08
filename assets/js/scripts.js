gsap.registerPlugin(ScrollTrigger);

const STORY_MEDIA_ZOOM = {
  startScale: 1.15,
  duration: 1.3,
  ease: "power4.inOut"
};

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
  gsap.set(track, { x: 0, force3D: true });

  const horizontalTween = gsap.to(track, {
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

  initStoryPanelReveals(section, horizontalTween);
}

function initStoryPanelReveals(section, horizontalTween) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    return;
  }

  const panels = gsap.utils.toArray(section.querySelectorAll("[data-story-panel]"));

  panels.forEach((panel, index) => {
    const media = panel.querySelector("[data-story-media]");
    const mediaImg = media ? media.querySelector("img") : null;
    const revealItems = gsap.utils.toArray(panel.querySelectorAll("[data-story-reveal]"));
    const triggerConfig = index === 0
      ? {
          trigger: section,
          start: "top 50%",
          toggleActions: "play none none reverse"
        }
      : {
          trigger: panel,
          containerAnimation: horizontalTween,
          start: "left 70%",
          toggleActions: "play none none reverse"
        };
    const timeline = gsap.timeline({
      defaults: {
        duration: 0.6,
        ease: "power2.out"
      },
      scrollTrigger: triggerConfig
    });

    if (media) {
      timeline.from(media, {
        autoAlpha: 0,
        force3D: true
      }, 0);
    }

    if (mediaImg) {
      timeline.fromTo(mediaImg, {
        scale: STORY_MEDIA_ZOOM.startScale,
        transformOrigin: "center center"
      }, {
        scale: 1,
        duration: STORY_MEDIA_ZOOM.duration,
        ease: STORY_MEDIA_ZOOM.ease,
        force3D: true
      }, 0);
    }

    if (revealItems.length > 0) {
      timeline.from(revealItems, {
        autoAlpha: 0,
        y: 22,
        stagger: 0.07,
        force3D: true
      }, 0.12);
    }
  });
}

window.addEventListener("load", () => {
  document.querySelectorAll("[data-story-scroll]").forEach(initStorySection);
  ScrollTrigger.refresh();
});
