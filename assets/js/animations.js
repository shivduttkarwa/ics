(function () {
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger, SplitText);
    }

    const HERO_TIMING = {
        eyebrow: {
            start: 0.2,
            duration: 0.7,
        },
        title: {
            start: 0.55,
            charStagger: 0.02,
            charDuration: 0.095,
            fallbackDuration: 0.6,
        },
        rest: {
            gapAfterTitle: +0.1,
            duration: 0.6,
            stagger: 0.05,
        },
        media: {
            startScale: 1.15,
            duration: 1.3,
            ease: 'power4.inOut',
        },
    };

    const MEDIA_ZOOM = {
        startScale: 1.5,
        duration: 1.3,
        fadeDuration: 1.5,
        ease: 'power4.inOut',
    };

    const STORY_REVEAL = {
        y: 22,
        start: 0.12,
        stagger: 0.07,
        duration: 0.6,
        ease: 'power2.out',
        triggerStart: 'top 70%',
    };

    const ICSAnimations = {
        initHeroTimeline() {
            const releasePreHiddenHero = () => document.documentElement.classList.remove('ics-js-loading');

            if (typeof gsap === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                releasePreHiddenHero();
                return;
            }

            const heroes = document.querySelectorAll('.ics-hero');
            if (!heroes.length) {
                releasePreHiddenHero();
                return;
            }

            heroes.forEach((hero) => {
                const eyebrow = hero.querySelector('.ics-hero__eyebrow');
                const title = hero.querySelector('.ics-hero__title');
                const copyLines = Array.from(hero.querySelectorAll(':scope > .container > .ics-hero__copy > *'));
                const cta = hero.querySelector(':scope > .container > .ics-hero__cta');
                const media = hero.querySelector('.ics-hero__media');
                const mediaImg = media ? media.querySelector('.ics-media-frame img') : null;
                const stat = hero.querySelector('.ics-hero__stat');
                const rest = [...copyLines, cta, media].filter(Boolean);

                const allTargets = [eyebrow, title, ...rest].filter(Boolean);
                if (!allTargets.length) return;

                gsap.set(allTargets, { autoAlpha: 0 });
                if (stat) {
                    gsap.set(stat, { autoAlpha: 0 });
                }
                if (mediaImg) {
                    gsap.set(mediaImg, { scale: HERO_TIMING.media.startScale });
                }
                releasePreHiddenHero();

                let titleChars = null;
                if (title && typeof SplitText !== 'undefined') {
                    const split = new SplitText(title, {
                        type: 'words,chars',
                        wordsClass: 'ics-hero-word',
                        charsClass: 'ics-hero-char',
                        aria: 'none',
                    });
                    titleChars = split.chars;
                    gsap.set(title, { autoAlpha: 1 });
                    gsap.set(titleChars, { autoAlpha: 0 });
                }

                const tl = gsap.timeline({ defaults: { ease: 'power1.out' } });

                if (eyebrow) {
                    tl.to(eyebrow, { autoAlpha: 1, duration: HERO_TIMING.eyebrow.duration }, HERO_TIMING.eyebrow.start);
                }

                if (titleChars && titleChars.length) {
                    tl.to(titleChars, {
                        autoAlpha: 1,
                        ease: 'none',
                        stagger: HERO_TIMING.title.charStagger,
                        duration: HERO_TIMING.title.charDuration,
                    }, HERO_TIMING.title.start);
                } else if (title) {
                    tl.to(title, { autoAlpha: 1, duration: HERO_TIMING.title.fallbackDuration }, HERO_TIMING.title.start);
                }

                if (rest.length) {
                    tl.to(rest, {
                        autoAlpha: 1,
                        duration: HERO_TIMING.rest.duration,
                        stagger: HERO_TIMING.rest.stagger,
                    }, `>${HERO_TIMING.rest.gapAfterTitle >= 0 ? '+' : ''}${HERO_TIMING.rest.gapAfterTitle}`);
                }

                if (mediaImg) {
                    tl.to(mediaImg, {
                        scale: 1,
                        duration: HERO_TIMING.media.duration,
                        ease: HERO_TIMING.media.ease,
                    }, '<');
                }
            });
        },

        initSplitTextAndBatch() {
            const splitTextElements = document.querySelectorAll('.ics-split-init');
            splitTextElements.forEach((item) => {
                if (item.classList.contains('ics-split-lines')) {
                    const targets = item.querySelectorAll('p, li, h4, h3, h5, h6');
                    if (targets.length > 0) {
                        targets.forEach((el) => {
                            new SplitText(el, { type: 'lines', linesClass: 'line-st', aria: 'none' });
                        });
                    } else {
                        new SplitText(item, { type: 'lines', linesClass: 'line-st', aria: 'none' });
                    }
                } else if (item.classList.contains('ics-split-chars')) {
                    new SplitText(item, { type: 'chars,lines', linesClass: 'line-st', charsClass: 'char-st', aria: 'none' });
                }
            });

            const childrenAnimContainers = Array.from(document.querySelectorAll('.ics-children-anim'));
            const textBlocks = [];
            const blockquoteBlocks = [];
            childrenAnimContainers.forEach((container) => {
                Array.from(container.children).forEach((child) => {
                    if (child.matches('blockquote')) {
                        blockquoteBlocks.push(child);
                    } else {
                        textBlocks.push(child);
                    }
                });
            });
            if (textBlocks.length > 0) {
                textBlocks.forEach((el) => el.classList.add('ics-anim-item', 'ics-anim-item--static'));
            }

            if (blockquoteBlocks.length > 0) {
                blockquoteBlocks.forEach((el) => {
                    const wrapper = document.createElement('div');
                    wrapper.classList.add('ics-anim-item', 'ics-anim-item--blockquote');
                    el.parentNode.replaceChild(wrapper, el);
                    wrapper.appendChild(el);
                });
            }

            const storyRevealGroups = Array.from(document.querySelectorAll('[data-ics-story-reveal-group]'));
            storyRevealGroups.forEach((group) => {
                group.querySelectorAll('.ics-anim-item').forEach((item) => {
                    item.classList.add('ics-anim-item--story-grouped');
                });
            });

            const batchItems = document.querySelectorAll('.ics-anim-item');
            if (batchItems.length === 0) return;

            if (document.querySelectorAll('.ics-anim-item--text.ics-split-lines .line-st').length > 0) {
                gsap.set('.ics-anim-item--text.ics-split-lines .line-st', { autoAlpha: 0 });
            }
            if (document.querySelectorAll('.ics-anim-item--text.ics-split-chars .char-st').length > 0) {
                gsap.set('.ics-anim-item--text.ics-split-chars .char-st', { autoAlpha: 0 });
            }
            if (document.querySelectorAll('.ics-anim-item--default').length > 0) {
                gsap.set('.ics-anim-item--default', { autoAlpha: 0 });
            }
            if (document.querySelectorAll('.ics-anim-item--blockquote').length > 0) {
                gsap.set('.ics-anim-item--blockquote blockquote', { autoAlpha: 0 });
            }
            if (document.querySelectorAll('.ics-anim-item--static').length > 0) {
                gsap.set('.ics-anim-item--static', { autoAlpha: 0 });
            }
            if (document.querySelectorAll('.ics-anim-item--story-reveal').length > 0) {
                gsap.set('.ics-anim-item--story-reveal', {
                    autoAlpha: 0,
                    y: STORY_REVEAL.y,
                    force3D: true,
                });
            }
            if (document.querySelectorAll('.ics-anim-item--scale').length > 0) {
                gsap.set('.ics-anim-item--scale', { autoAlpha: 0, force3D: true });
                gsap.set('.ics-anim-item--scale .ics-anim-scale-target', {
                    scale: MEDIA_ZOOM.startScale,
                    transformOrigin: 'center center',
                    force3D: true,
                });
            }

            function animateScale(card, delay = 0) {
                gsap.to(card, {
                    autoAlpha: 1,
                    duration: MEDIA_ZOOM.fadeDuration,
                    ease: MEDIA_ZOOM.ease,
                    delay,
                    force3D: true,
                });
                const scaleTarget = card.querySelector('.ics-anim-scale-target');
                if (scaleTarget) {
                    gsap.to(scaleTarget, {
                        scale: 1,
                        duration: MEDIA_ZOOM.duration,
                        ease: MEDIA_ZOOM.ease,
                        delay,
                        force3D: true,
                    });
                }
            }

            function animateStoryReveal(card, delay = 0) {
                gsap.to(card, {
                    autoAlpha: 1,
                    y: 0,
                    duration: STORY_REVEAL.duration,
                    ease: STORY_REVEAL.ease,
                    delay,
                    force3D: true,
                });
            }

            function animateDefault(card, index = 0) {
                gsap.to(card, {
                    duration: 0.6,
                    ease: 'power1.out',
                    autoAlpha: 1,
                    delay: index * 0.1,
                });
            }

            function runBatch(batch) {
                batch.forEach((card, index) => {
                    if (card.classList.contains('ics-anim-item--default') || card.classList.contains('ics-anim-item--static')) {
                        animateDefault(card, index);
                    }
                    if (card.classList.contains('ics-anim-item--scale')) {
                        animateScale(card, index * 0.1);
                    }
                    if (card.classList.contains('ics-anim-item--story-reveal')) {
                        animateStoryReveal(card, STORY_REVEAL.start + index * STORY_REVEAL.stagger);
                    }
                    if (card.classList.contains('ics-anim-item--blockquote')) {
                        gsap.to(card.querySelector('blockquote'), {
                            duration: 0.6, ease: 'power1.out', autoAlpha: 1, delay: index * 0.1,
                        });
                    }
                    if (card.classList.contains('ics-split-lines')) {
                        const lines = card.querySelectorAll('.line-st');
                        gsap.to(lines, { autoAlpha: 1, duration: 0.5, stagger: 0.15, ease: 'power1.out', delay: index * 0.1 });
                    }
                    if (card.classList.contains('ics-split-chars')) {
                        const chars = card.querySelectorAll('.char-st');
                        gsap.to(chars, { duration: 0.4, stagger: 0.05, ease: 'power3.inOut', autoAlpha: 1, delay: index * 0.1 });
                    }
                });
            }

            storyRevealGroups.forEach((group) => {
                const scaleItems = Array.from(group.querySelectorAll('.ics-anim-item--scale'));
                const revealItems = Array.from(group.querySelectorAll('.ics-anim-item--story-reveal'));

                ScrollTrigger.create({
                    trigger: group,
                    start: STORY_REVEAL.triggerStart,
                    once: true,
                    onEnter: () => {
                        scaleItems.forEach((card) => animateScale(card, 0));
                        revealItems.forEach((card, index) => {
                            animateStoryReveal(card, STORY_REVEAL.start + index * STORY_REVEAL.stagger);
                        });
                    },
                });
            });

            ScrollTrigger.batch('.ics-anim-item:not(.ics-anim-item--story-grouped)', {
                start: 'top bottom-=100',
                once: true,
                onEnter: (batch) => runBatch(batch),
            });
        },

        init() {
            this.initSplitTextAndBatch();
        },
    };

    window.ICSAnimations = ICSAnimations;

    document.addEventListener('DOMContentLoaded', () => {
        ICSAnimations.initHeroTimeline();
    });

    window.addEventListener('load', () => {
        ICSAnimations.init();
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    });
})();
