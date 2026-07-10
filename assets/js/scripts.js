(function () {
  function initProspectusForms() {
    document.querySelectorAll(".ics-prospectus-card__form[data-static-success]").forEach((form) => {
      const successMessage = form.querySelector(".ics-form-success");
      const closeButton = successMessage ? successMessage.querySelector(".ics-form-success__close") : null;
      const submitButton = form.querySelector('[type="submit"]');

      if (!successMessage) {
        return;
      }

      if (closeButton) {
        closeButton.addEventListener("click", () => {
          successMessage.hidden = true;
        });
      }

      form.addEventListener("submit", (event) => {
        const action = (form.getAttribute("action") || "").trim();

        if (action && action !== "#") {
          return;
        }

        event.preventDefault();

        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        form.reset();
        successMessage.hidden = false;

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = "Request sent";
        }

        if (typeof gsap !== "undefined") {
          gsap.fromTo(successMessage, {
            autoAlpha: 0,
            scale: 0.96
          }, {
            autoAlpha: 1,
            scale: 1,
            duration: 0.45,
            ease: "power1.out"
          });
        }
      });
    });
  }

  if (typeof gsap === "undefined") {
    document.documentElement.classList.remove("ics-js-loading");
    document.addEventListener("DOMContentLoaded", initProspectusForms);
    return;
  }

  const plugins = [];
  if (typeof ScrollTrigger !== "undefined") {
    plugins.push(ScrollTrigger);
  }
  if (typeof SplitText !== "undefined") {
    plugins.push(SplitText);
  }
  if (plugins.length > 0) {
    gsap.registerPlugin(...plugins);
  }
  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  const HERO_TIMING = {
    eyebrow: {
      start: 0.2,
      duration: 0.7
    },
    title: {
      start: 0.55,
      charStagger: 0.02,
      charDuration: 0.095,
      fallbackDuration: 0.6
    },
    rest: {
      gapAfterTitle: 0.1,
      duration: 0.6,
      stagger: 0.05
    },
    media: {
      startScale: 1.35,
      endScale: 1.2,
      duration: 1.3,
      ease: "power4.inOut"
    }
  };

  /* endScale above leaves 20% overscale inside the media frame; the
     image travels from -imgYPercent to +imgYPercent, so (imgYPercent
     x endScale) must stay under half that headroom or the image edge
     becomes visible. */
  const HERO_PARALLAX = {
    imgYPercent: 8,
    statY: -70,
    vinesY: 100,
    scrub: 0.6
  };

  const MEDIA_ZOOM = {
    startScale: 1.5,
    duration: 1.3,
    fadeDuration: 1.5,
    ease: "power4.inOut"
  };

  const STORY_MOBILE_REVEAL = {
    mediaFadeDuration: 0.8,
    contentStart: 0.25,
    firstPanelStart: "top 75%",
    panelStart: "left 82%"
  };

  const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initSmoothScroll() {
    if (typeof Lenis === "undefined" || prefersReducedMotion()) {
      return null;
    }

    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: false,
      anchors: {
        duration: 1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
      },
      stopInertiaOnNavigate: true
    });

    window.icsLenis = lenis;

    if (typeof ScrollTrigger !== "undefined") {
      lenis.on("scroll", ScrollTrigger.update);
    }

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return lenis;
  }

  const smoothScroll = initSmoothScroll();

  const ICSAnimations = {
    initHeroTimeline() {
      const releasePreHiddenHero = () => document.documentElement.classList.remove("ics-js-loading");

      if (prefersReducedMotion()) {
        releasePreHiddenHero();
        return;
      }

      const heroes = document.querySelectorAll(".ics-hero");
      if (!heroes.length) {
        releasePreHiddenHero();
        return;
      }

      heroes.forEach((hero) => {
        const eyebrow = hero.querySelector(".ics-hero__eyebrow");
        const title = hero.querySelector(".ics-hero__title");
        const copyLines = Array.from(hero.querySelectorAll(":scope > .container > .ics-hero__copy > *"));
        const cta = hero.querySelector(":scope > .container > .ics-hero__cta");
        const media = hero.querySelector(".ics-hero__media");
        const mediaImg = media ? media.querySelector(".ics-media-frame img") : null;
        const stat = hero.querySelector(".ics-hero__stat");
        const rest = [...copyLines, cta, media].filter(Boolean);
        const allTargets = [eyebrow, title, ...rest].filter(Boolean);

        if (!allTargets.length) {
          return;
        }

        gsap.set(allTargets, { autoAlpha: 0 });
        if (stat) {
          gsap.set(stat, { autoAlpha: 0 });
        }
        if (mediaImg) {
          gsap.set(mediaImg, { scale: HERO_TIMING.media.startScale });
        }
        releasePreHiddenHero();

        let titleChars = null;
        if (title && typeof SplitText !== "undefined") {
          const split = new SplitText(title, {
            type: "words,chars",
            wordsClass: "ics-hero-word",
            charsClass: "ics-hero-char",
            aria: "none"
          });
          titleChars = split.chars;
          gsap.set(title, { autoAlpha: 1 });
          gsap.set(titleChars, { autoAlpha: 0 });
        }

        const tl = gsap.timeline({ defaults: { ease: "power1.out" } });

        if (eyebrow) {
          tl.to(eyebrow, { autoAlpha: 1, duration: HERO_TIMING.eyebrow.duration }, HERO_TIMING.eyebrow.start);
        }

        if (titleChars && titleChars.length) {
          tl.to(titleChars, {
            autoAlpha: 1,
            ease: "none",
            stagger: HERO_TIMING.title.charStagger,
            duration: HERO_TIMING.title.charDuration
          }, HERO_TIMING.title.start);
        } else if (title) {
          tl.to(title, { autoAlpha: 1, duration: HERO_TIMING.title.fallbackDuration }, HERO_TIMING.title.start);
        }

        if (rest.length) {
          tl.to(rest, {
            autoAlpha: 1,
            duration: HERO_TIMING.rest.duration,
            stagger: HERO_TIMING.rest.stagger
          }, `>${HERO_TIMING.rest.gapAfterTitle >= 0 ? "+" : ""}${HERO_TIMING.rest.gapAfterTitle}`);
        }

        if (mediaImg) {
          tl.to(mediaImg, {
            scale: HERO_TIMING.media.endScale,
            duration: HERO_TIMING.media.duration,
            ease: HERO_TIMING.media.ease
          }, "<");
        }
      });
    },

    initSplitTextAndBatch() {
      if (typeof ScrollTrigger === "undefined") {
        return;
      }

      const splitTextElements = document.querySelectorAll(".ics-split-init");
      splitTextElements.forEach((item) => {
        if (typeof SplitText === "undefined") {
          return;
        }

        if (item.classList.contains("ics-split-lines")) {
          const targets = item.querySelectorAll("p, li, h4, h3, h5, h6");
          if (targets.length > 0) {
            targets.forEach((el) => {
              new SplitText(el, { type: "lines", linesClass: "line-st", aria: "none" });
            });
          } else {
            new SplitText(item, { type: "lines", linesClass: "line-st", aria: "none" });
          }
        } else if (item.classList.contains("ics-split-chars")) {
          new SplitText(item, { type: "chars,lines", linesClass: "line-st", charsClass: "char-st", aria: "none" });
        }
      });

      const childrenAnimContainers = Array.from(document.querySelectorAll(".ics-children-anim"));
      const textBlocks = [];
      const blockquoteBlocks = [];

      childrenAnimContainers.forEach((container) => {
        Array.from(container.children).forEach((child) => {
          if (child.matches("blockquote")) {
            blockquoteBlocks.push(child);
          } else {
            textBlocks.push(child);
          }
        });
      });

      if (textBlocks.length > 0) {
        textBlocks.forEach((el) => el.classList.add("ics-anim-item", "ics-anim-item--static"));
      }

      if (blockquoteBlocks.length > 0) {
        blockquoteBlocks.forEach((el) => {
          const wrapper = document.createElement("div");
          wrapper.classList.add("ics-anim-item", "ics-anim-item--blockquote");
          el.parentNode.replaceChild(wrapper, el);
          wrapper.appendChild(el);
        });
      }

      const batchItems = document.querySelectorAll(".ics-anim-item");
      if (batchItems.length === 0) {
        return;
      }

      if (document.querySelectorAll(".ics-anim-item--text.ics-split-lines .line-st").length > 0) {
        gsap.set(".ics-anim-item--text.ics-split-lines .line-st", { autoAlpha: 0 });
      }
      if (document.querySelectorAll(".ics-anim-item--text.ics-split-chars .char-st").length > 0) {
        gsap.set(".ics-anim-item--text.ics-split-chars .char-st", { autoAlpha: 0 });
      }
      if (document.querySelectorAll(".ics-anim-item--default").length > 0) {
        gsap.set(".ics-anim-item--default", { autoAlpha: 0 });
      }
      if (document.querySelectorAll(".ics-anim-item--blockquote").length > 0) {
        gsap.set(".ics-anim-item--blockquote blockquote", { autoAlpha: 0 });
      }
      if (document.querySelectorAll(".ics-anim-item--static").length > 0) {
        gsap.set(".ics-anim-item--static", { autoAlpha: 0 });
      }
      if (document.querySelectorAll(".ics-anim-item--scale").length > 0) {
        gsap.set(".ics-anim-item--scale", { autoAlpha: 0, force3D: true });
        gsap.set(".ics-anim-item--scale .ics-anim-scale-target", {
          scale: MEDIA_ZOOM.startScale,
          transformOrigin: "center center",
          force3D: true
        });
      }
      if (document.querySelectorAll(".ics-anim-item--grow-x").length > 0) {
        gsap.set(".ics-anim-item--grow-x", { autoAlpha: 0, scaleX: 0, transformOrigin: "left center", force3D: true });
      }
      if (document.querySelectorAll(".ics-senior-outcomes__stat-line").length > 0) {
        gsap.set(".ics-senior-outcomes__stat-line", { autoAlpha: 0, scaleX: 0, transformOrigin: "left center", force3D: true });
      }

      function animateScale(card, delay = 0) {
        gsap.to(card, {
          autoAlpha: 1,
          duration: MEDIA_ZOOM.fadeDuration,
          ease: MEDIA_ZOOM.ease,
          delay,
          force3D: true
        });

        const scaleTarget = card.querySelector(".ics-anim-scale-target");
        if (scaleTarget) {
          gsap.to(scaleTarget, {
            scale: 1,
            duration: MEDIA_ZOOM.duration,
            ease: MEDIA_ZOOM.ease,
            delay,
            force3D: true
          });
        }
      }

      function animateDefault(card, delay = 0) {
        gsap.to(card, {
          duration: 0.6,
          ease: "power1.out",
          autoAlpha: 1,
          delay
        });
      }

      function animateGrowX(card, delay = 0) {
        gsap.to(card, {
          autoAlpha: 1,
          scaleX: 1,
          duration: 0.7,
          ease: "power2.out",
          delay,
          force3D: true
        });
      }

      function getGridColumnCount(grid) {
        if (!grid) {
          return 0;
        }
        return getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length;
      }

      function getRowStaggerDelay(item, index) {
        const card = item.closest(".ics-fee-card");
        const grid = card ? card.closest(".ics-fee-includes__grid") : null;

        if (!card || !grid) {
          return index * 0.1;
        }

        const columns = getGridColumnCount(grid) || 1;
        const cards = grid.querySelectorAll(".ics-fee-card");
        const cardIndex = Array.prototype.indexOf.call(cards, card);
        const colIndex = cardIndex === -1 ? 0 : cardIndex % columns;

        return colIndex * 0.12;
      }

      function runBatch(batch) {
        batch.forEach((card, index) => {
          const delay = getRowStaggerDelay(card, index);

          if (card.classList.contains("ics-anim-item--default") || card.classList.contains("ics-anim-item--static")) {
            animateDefault(card, delay);
          }

          if (card.classList.contains("ics-senior-outcomes__stat")) {
            const statLine = card.querySelector(".ics-senior-outcomes__stat-line");
            if (statLine) {
              animateGrowX(statLine, delay + 0.12);
            }
          }

          if (card.classList.contains("ics-anim-item--scale")) {
            animateScale(card, delay);
          }

          if (card.classList.contains("ics-anim-item--grow-x")) {
            animateGrowX(card, delay);
          }

          if (card.classList.contains("ics-anim-item--blockquote")) {
            gsap.to(card.querySelector("blockquote"), {
              duration: 0.6,
              ease: "power1.out",
              autoAlpha: 1,
              delay
            });
          }

          if (card.classList.contains("ics-split-lines")) {
            const lines = card.querySelectorAll(".line-st");
            gsap.to(lines, {
              autoAlpha: 1,
              duration: 0.5,
              stagger: 0.15,
              ease: "power1.out",
              delay
            });
          }

          if (card.classList.contains("ics-split-chars")) {
            const chars = card.querySelectorAll(".char-st");
            gsap.to(chars, {
              duration: 0.4,
              stagger: 0.05,
              ease: "power3.inOut",
              autoAlpha: 1,
              delay
            });
          }
        });
      }

      ScrollTrigger.batch(".ics-anim-item", {
        start: "top 80%",
        once: true,
        onEnter: (batch) => runBatch(batch)
      });

      document.querySelectorAll(".ics-site-footer__legal-left").forEach((legalLeft) => {
        const legalRow = legalLeft.closest(".ics-site-footer__legal");
        const footer = legalLeft.closest(".ics-site-footer");

        if (!legalRow) {
          return;
        }

        let isRevealed = false;
        const revealLegalRow = () => {
          if (isRevealed) {
            return;
          }

          isRevealed = true;
          animateDefault(legalRow);
        };

        ScrollTrigger.create({
          trigger: legalLeft,
          start: "top bottom",
          once: true,
          onEnter: revealLegalRow
        });

        if (footer) {
          ScrollTrigger.create({
            trigger: footer,
            start: "bottom bottom",
            once: true,
            onEnter: revealLegalRow
          });
        }
      });
    },

    init() {
      this.initSplitTextAndBatch();
    }
  };

  function initStorySection(section) {
    if (typeof ScrollTrigger === "undefined") {
      return;
    }

    const viewport = section.querySelector(".ics-story-section");
    const track = section.querySelector(".ics-story-track");

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
        onRefresh: setScrollHeight
      }
    });

    initStoryPanelReveals(section, horizontalTween);
  }

  function initStoryPanelReveals(section, horizontalTween) {
    if (prefersReducedMotion()) {
      return;
    }

    const panels = gsap.utils.toArray(section.querySelectorAll("[data-story-panel]"));
    const isMobileStory = window.matchMedia("(max-width: 991.98px)").matches;

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
      const mediaTriggerConfig = index === 0
        ? {
            trigger: section,
            start: isMobileStory ? STORY_MOBILE_REVEAL.firstPanelStart : "top 50%",
            once: true
          }
        : {
            trigger: panel,
            containerAnimation: horizontalTween,
            start: isMobileStory ? STORY_MOBILE_REVEAL.panelStart : "left 70%",
            once: true
          };

      if (media) {
        gsap.set(media, { autoAlpha: 0, force3D: true });
      }

      if (mediaImg) {
        gsap.set(mediaImg, {
          scale: MEDIA_ZOOM.startScale,
          transformOrigin: "center center",
          force3D: true
        });
      }

      if (isMobileStory) {
        if (revealItems.length > 0) {
          gsap.set(revealItems, { autoAlpha: 0, force3D: true });
        }

        const mobileTimeline = gsap.timeline({
          defaults: {
            duration: 0.6,
            ease: "power1.out"
          },
          scrollTrigger: mediaTriggerConfig
        });

        if (media) {
          mobileTimeline.to(media, {
            autoAlpha: 1,
            duration: STORY_MOBILE_REVEAL.mediaFadeDuration,
            ease: "power1.out",
            force3D: true
          }, 0);
        }

        if (mediaImg) {
          mobileTimeline.to(mediaImg, {
            scale: 1,
            duration: MEDIA_ZOOM.duration,
            ease: MEDIA_ZOOM.ease,
            force3D: true
          }, 0);
        }

        if (revealItems.length > 0) {
          mobileTimeline.to(revealItems, {
            autoAlpha: 1,
            stagger: 0.07,
            force3D: true
          }, STORY_MOBILE_REVEAL.contentStart);
        }

        return;
      }

      if (media || mediaImg) {
        const mediaTimeline = gsap.timeline({
          scrollTrigger: mediaTriggerConfig
        });

        if (media) {
          mediaTimeline.to(media, {
            autoAlpha: 1,
            duration: MEDIA_ZOOM.fadeDuration,
            ease: MEDIA_ZOOM.ease,
            force3D: true
          }, 0);
        }

        if (mediaImg) {
          mediaTimeline.to(mediaImg, {
            scale: 1,
            duration: MEDIA_ZOOM.duration,
            ease: MEDIA_ZOOM.ease,
            force3D: true
          }, 0);
        }
      }

      const timeline = gsap.timeline({
        defaults: {
          duration: 0.6,
          ease: "power1.out"
        },
        scrollTrigger: triggerConfig
      });

      if (revealItems.length > 0) {
        timeline.from(revealItems, {
          autoAlpha: 0,
          stagger: 0.07,
          force3D: true
        }, 0.12);
      }
    });
  }

  function initStorySections() {
    document.querySelectorAll("[data-story-scroll]").forEach(initStorySection);
  }

  function initHeroParallax() {
    if (typeof ScrollTrigger === "undefined" || prefersReducedMotion()) {
      return;
    }

    document.querySelectorAll(".ics-hero").forEach((hero) => {
      const mediaImg = hero.querySelector(".ics-hero__media .ics-media-frame img");
      const stat = hero.querySelector(".ics-hero__stat");
      const vines = hero.querySelectorAll(":scope > .ics-decorative-line");

      const layers = [
        mediaImg ? { targets: mediaImg, from: { yPercent: -HERO_PARALLAX.imgYPercent }, to: { yPercent: HERO_PARALLAX.imgYPercent } } : null,
        stat ? { targets: stat, from: { y: 0 }, to: { y: HERO_PARALLAX.statY } } : null,
        vines.length ? { targets: vines, from: { y: 0 }, to: { y: HERO_PARALLAX.vinesY } } : null
      ].filter(Boolean);

      layers.forEach((layer) => {
        gsap.fromTo(layer.targets, layer.from, {
          ...layer.to,
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: HERO_PARALLAX.scrub,
            invalidateOnRefresh: true
          }
        });
      });
    });
  }

  /* The scattered testimonial cards are positioned with CSS translateY
     percentages, so each element's base offset is captured in px first
     and the drift is applied around it (amp = half the total travel;
     positive drifts up / foreground, negative drifts down / background). */
  const TESTIMONIAL_PARALLAX = {
    mediaA: 110,
    mediaB: -140,
    card: 80,
    scrub: 0.6
  };

  function initTestimonialParallax() {
    if (typeof ScrollTrigger === "undefined" || prefersReducedMotion() || window.matchMedia("(max-width: 767.98px)").matches) {
      return;
    }

    document.querySelectorAll(".ics-testimonial-section").forEach((section) => {
      const layers = [
        { el: section.querySelector(".ics-testimonial-section__media--a"), amp: TESTIMONIAL_PARALLAX.mediaA },
        { el: section.querySelector(".ics-testimonial-section__media--b"), amp: TESTIMONIAL_PARALLAX.mediaB },
        { el: section.querySelector(".ics-testimonial-section__card"), amp: TESTIMONIAL_PARALLAX.card }
      ].filter((layer) => layer.el);

      layers.forEach(({ el, amp }) => {
        const baseY = Number(gsap.getProperty(el, "y")) || 0;

        gsap.fromTo(el, { y: baseY + amp }, {
          y: baseY - amp,
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: TESTIMONIAL_PARALLAX.scrub
          }
        });
      });
    });
  }

  /* Emulates background-attachment: fixed with transforms (works on
     iOS and under Lenis): the image is viewport-height and counter-
     translated 1:1 with scroll, so the section becomes a window
     sliding over a stationary image. */
  function initQuoteBannerParallax() {
    if (typeof ScrollTrigger === "undefined" || prefersReducedMotion() || window.matchMedia("(max-width: 991.98px)").matches) {
      return;
    }

    document.querySelectorAll(".ics-quote-banner").forEach((section) => {
      const media = section.querySelector(".ics-quote-banner__media");
      const img = media ? media.querySelector("img") : null;

      if (!img) {
        return;
      }

      media.classList.add("ics-quote-banner__media--fixed");

      const setImgHeight = () => {
        img.style.height = `${window.innerHeight}px`;
      };

      setImgHeight();

      gsap.fromTo(img, {
        y: () => -window.innerHeight
      }, {
        y: () => section.offsetHeight,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
          onRefreshInit: setImgHeight
        }
      });
    });
  }

  function initStatCounters() {
    if (typeof ScrollTrigger === "undefined" || prefersReducedMotion()) {
      return;
    }

    const statNumbers = gsap.utils.toArray(".ics-senior-outcomes__stat-number");

    statNumbers.forEach((stat) => {
      const original = stat.textContent.trim();
      const match = original.match(/^([^0-9.-]*)(-?\d+(?:\.\d+)?)(.*)$/);

      if (!match) {
        return;
      }

      const [, prefix, numericText, suffix] = match;
      const endValue = Number.parseFloat(numericText);
      const decimals = numericText.includes(".") ? numericText.split(".")[1].length : 0;
      const counter = { value: 0 };
      let hasAnimated = false;
      const trigger = stat.closest(".ics-hero__stat, .ics-senior-outcomes__stat") || stat;
      const formatValue = (value) => value.toLocaleString("en-AU", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });

      ScrollTrigger.create({
        trigger,
        start: "top 92%",
        once: true,
        onEnter: () => {
          if (hasAnimated) {
            return;
          }

          hasAnimated = true;
          counter.value = 0;
          stat.textContent = `${prefix}${formatValue(0)}${suffix}`;

          gsap.to(counter, {
            value: endValue,
            duration: endValue >= 500 ? 1.8 : 1.25,
            ease: "power2.out",
            onUpdate: () => {
              stat.textContent = `${prefix}${formatValue(counter.value)}${suffix}`;
            },
            onComplete: () => {
              stat.textContent = original;
            }
          });
        }
      });
    });
  }

  window.ICSAnimations = ICSAnimations;

  document.addEventListener("DOMContentLoaded", () => {
    initProspectusForms();
    ICSAnimations.initHeroTimeline();
  });

  window.addEventListener("load", () => {
    ICSAnimations.init();
    initStorySections();
    initStatCounters();
    initHeroParallax();
    initTestimonialParallax();
    initQuoteBannerParallax();

    if (smoothScroll) {
      smoothScroll.resize();
    }

    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
    }
  });
})();
