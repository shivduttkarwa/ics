(function () {
    const SGAnimations = {
        animateHeroSlide(slide) {
            // ── SLIDE CHANGE ANIMATION ───────────────────────────────────────────────────
            if (!slide || typeof gsap === 'undefined') return;
            const eyebrow  = slide.querySelector('.sg-hero__label');
            const title    = slide.querySelector('.sg-hero__h1-sans');
            const subtitle = slide.querySelector('.sg-hero__h1-serif');
            const body     = slide.querySelector('.sg-hero__body');

            // durations
            const D_EYEBROW  = 0.52;
            const D_TITLE    = 0.35;
            const D_SUBTITLE = 0.35;
            const D_BODY     = 0.35;

            // start positions on the timeline
            const T_EYEBROW  = 0;
            const T_TITLE    = 0.14;
            const T_SUBTITLE = 0.32;
            const T_BODY     = 0.46;

            const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
            // 1. label / eyebrow
            if (eyebrow)  tl.fromTo(eyebrow,  { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: D_EYEBROW  }, T_EYEBROW);
            // 2. title (h1-sans)
            if (title)    tl.fromTo(title,    { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: D_TITLE    }, T_TITLE);
            // 3. subtitle (h1-serif)
            if (subtitle) tl.fromTo(subtitle, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: D_SUBTITLE }, T_SUBTITLE);
            // 4. body
            if (body)     tl.fromTo(body,     { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: D_BODY     }, T_BODY);
        },

        hideHeroSlideContent(slide, includeTitle = true, includeEyebrow = true) {
            if (!slide || typeof gsap === 'undefined') return;
            const eyebrow = slide.querySelector('.sg-hero__label');
            const title = slide.querySelector('.sg-hero__h1-sans');
            const subtitle = slide.querySelector('.sg-hero__h1-serif');
            const body = slide.querySelector('.sg-hero__body');
            const targets = includeTitle
                ? (includeEyebrow ? [eyebrow, title, subtitle, body] : [title, subtitle, body])
                : (includeEyebrow ? [eyebrow, subtitle, body] : [subtitle, body]);
            gsap.set(targets.filter(Boolean), { autoAlpha: 0 });
            if (includeEyebrow && eyebrow) gsap.set(eyebrow, { y: 14 });
            if (body) gsap.set(body, { y: 14 });
            if (subtitle) gsap.set(subtitle, { y: 20 });
            if (includeTitle && title) gsap.set(title, { y: 20 });
        },

        resetHeroSlides(swiper, includeTitle = true, includeEyebrow = true) {
            if (!swiper) return;
            swiper.slides.forEach((slide) => {
                slide.classList.remove('sg-hero__slide--anim');
                if (typeof gsap !== 'undefined') {
                    gsap.killTweensOf(slide.querySelectorAll('.sg-hero__label, .sg-hero__h1-sans, .sg-hero__h1-serif, .sg-hero__body'));
                }
                this.hideHeroSlideContent(slide, includeTitle, includeEyebrow);
            });
        },

        animateCurrentHeroSlide(swiper) {
            if (!swiper) return;
            const active = swiper.slides[swiper.activeIndex];
            if (!active) return;
            active.classList.add('sg-hero__slide--anim');
            this.animateHeroSlide(active);
        },

        getHeaderAnimationTargets(prioritizeMobileActions = false) {
            const headerItems = Array.from(document.querySelectorAll('.sg-anim-header-item'));
            if (!headerItems.length) return [];

            if (window.innerWidth >= 992) return headerItems;

            // On mobile, avoid counting hidden desktop nav items in stagger timing.
            const mobileVisibleItems = headerItems.filter((item) => {
                const styles = window.getComputedStyle(item);
                return styles.display !== 'none';
            });

            const targets = mobileVisibleItems.length ? mobileVisibleItems : headerItems;
            if (!prioritizeMobileActions) return targets;

            // Mobile hero intro order: logo -> search -> hamburger.
            const mobilePrioritySelectors = ['.sg-header__logo-banner', '#sg-header-search-link-mobile', '#menu-btn'];
            const mobilePriorityTargets = mobilePrioritySelectors
                .map((selector) => targets.find((item) => item.matches(selector)))
                .filter(Boolean);

            if (!mobilePriorityTargets.length) return targets;
            const remainingTargets = targets.filter((item) => !mobilePriorityTargets.includes(item));
            return [...mobilePriorityTargets, ...remainingTargets];
        },

        initSplitTextAndBatch() {
            const splitTextElements = document.querySelectorAll('.sg-split-init');
            splitTextElements.forEach((item) => {
                if (item.classList.contains('sg-split-lines')) {
                    const targets = item.querySelectorAll('p, li, h4, h3, h5, h6');
                    if (targets.length > 0) {
                        targets.forEach((el) => {
                            new SplitText(el, { type: 'lines', linesClass: 'line-st', aria: 'none' });
                        });
                    } else {
                        new SplitText(item, { type: 'lines', linesClass: 'line-st', aria: 'none' });
                    }
                } else if (item.classList.contains('sg-split-chars')) {
                    new SplitText(item, { type: 'chars,lines', linesClass: 'line-st', charsClass: 'char-st', aria: 'none' });
                }
            });

            const headerItems = this.getHeaderAnimationTargets(window.innerWidth < 992);
            if (!window.is_preloader && headerItems.length > 0) {
                headerItems.forEach((el) => el.classList.add('sg-anim-item', 'sg-anim-item--static'));
                if (window.innerWidth < 992) {
                    headerItems
                        .filter((el) => el.matches('.sg-header__logo-banner, #sg-header-search-link-mobile, #menu-btn'))
                        .forEach((el) => el.classList.add('sg-anim-item--header-priority'));
                }
            }

            const childrenAnimContainers = Array.from(document.querySelectorAll('.sg-children-anim')).filter((container) => (
                !container.closest('[data-card-animation="fade"]')
            ));
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
                textBlocks.forEach((el) => el.classList.add('sg-anim-item', 'sg-anim-item--static'));
            }

            if (blockquoteBlocks.length > 0) {
                blockquoteBlocks.forEach((el) => {
                    const line1 = document.createElement('div');
                    line1.classList.add('blockquote-line', 'blockquote-line-top');
                    const line2 = document.createElement('div');
                    line2.classList.add('blockquote-line', 'blockquote-line-bottom');
                    const wrapper = document.createElement('div');
                    wrapper.classList.add('blockquote-lines-wrapper', 'sg-anim-item', 'sg-anim-item--blockquote', 'blockquote-added-lines');
                    wrapper.appendChild(el.cloneNode(true));
                    el.parentNode.replaceChild(wrapper, el);
                    wrapper.appendChild(line1);
                    wrapper.appendChild(line2);
                });
            }

            const batchItems = document.querySelectorAll('.sg-anim-item');
            if (batchItems.length === 0) return;

            if (document.querySelectorAll('.sg-anim-item--text.sg-split-lines .line-st').length > 0) {
                gsap.set('.sg-anim-item--text.sg-split-lines .line-st', { y: 30, autoAlpha: 0 });
            }
            if (document.querySelectorAll('.sg-anim-item--text.sg-split-chars .char-st').length > 0) {
                gsap.set('.sg-anim-item--text.sg-split-chars .char-st', { autoAlpha: 0 });
            }
            if (document.querySelectorAll('.sg-anim-item--default').length > 0) {
                gsap.set('.sg-anim-item--default', { y: 30, autoAlpha: 0 });
            }
            if (document.querySelectorAll('.sg-anim-item--blockquote').length > 0) {
                gsap.set('.sg-anim-item--blockquote blockquote', { y: 30, autoAlpha: 0 });
            }
            if (document.querySelectorAll('.sg-anim-item--static').length > 0) {
                gsap.set('.sg-anim-item--static', { autoAlpha: 0 });
            }
            if (document.querySelectorAll('.sg-anim-item--from-right').length > 0) {
                gsap.set('.sg-anim-item--from-right', { x: '15%', autoAlpha: 0 });
            }
            if (document.querySelectorAll('.sg-anim-item--from-left').length > 0) {
                gsap.set('.sg-anim-item--from-left', { y: '-15%', autoAlpha: 0 });
            }

            function animateDefault(card, index = 0, isStatic = false, useEvents = false) {
                if (!isStatic) {
                    gsap.to(card, { duration: 0.7, ease: 'power1.out', x: 0, y: 0, delay: index * 0.1 });
                }
                gsap.to(card, {
                    duration: 0.5,
                    ease: 'power1.out',
                    autoAlpha: 1,
                    delay: index * 0.1 + 0.1,
                    onStart: () => useEvents && card.classList.add('start-animation'),
                    onComplete: () => useEvents && card.classList.add('end-animation'),
                });
            }

            function runBatch(batch) {
                const isMobile = window.innerWidth < 992;
                const mobilePrioritySelectors = ['.sg-header__logo-banner', '#sg-header-search-link-mobile', '#menu-btn'];
                const mobileHeaderStagger = 0.1;
                const priorityCards = isMobile
                    ? batch.filter((card) => card.classList.contains('sg-anim-item--header-priority'))
                    : [];
                const priorityDelayMap = new Map();
                if (isMobile && priorityCards.length) {
                    priorityCards.forEach((card) => {
                        const priorityIndex = mobilePrioritySelectors.findIndex((selector) => card.matches(selector));
                        if (priorityIndex >= 0) {
                            priorityDelayMap.set(card, priorityIndex * mobileHeaderStagger);
                        }
                    });
                }

                const getDelay = (card, index, extra = 0) => {
                    if (isMobile && priorityDelayMap.has(card)) {
                        return Math.max(0, priorityDelayMap.get(card) + extra);
                    }
                    return Math.max(0, index * 0.1 + extra);
                };

                batch.forEach((card, index) => {
                    if (card.classList.contains('sg-anim-item--default')) animateDefault(card, index);
                    if (card.classList.contains('sg-anim-item--blockquote')) {
                        gsap.to(card.querySelector('blockquote'), { duration: 0.7, ease: 'power1.out', x: 0, y: 0, delay: getDelay(card, index) });
                        gsap.to(card.querySelector('blockquote'), {
                            duration: 0.5, ease: 'power1.out', autoAlpha: 1, delay: getDelay(card, index, 0.1),
                            onStart: () => card.classList.add('start-animation'),
                            onComplete: () => card.classList.add('end-animation'),
                        });
                    }
                    if (card.classList.contains('sg-anim-item--static')) {
                        if (isMobile && priorityDelayMap.has(card)) {
                            gsap.to(card, {
                                duration: 0.42,
                                ease: 'power1.out',
                                autoAlpha: 1,
                                delay: getDelay(card, index),
                            });
                        } else {
                            animateDefault(card, index, true);
                        }
                    }
                    if (card.classList.contains('sg-anim-item--from-right')) animateDefault(card, index);
                    if (card.classList.contains('sg-anim-item--from-left')) animateDefault(card, index);
                    if (card.classList.contains('sg-anim-item--clip')) {
                        gsap.fromTo(card, { '--clip-value': '100%' }, {
                            duration: 1.1, ease: 'power3.out', '--clip-value': '0%', delay: getDelay(card, index, index * 0.1),
                            onComplete: () => card.classList.add('disable-clip'),
                        });
                    }
                    if (card.classList.contains('sg-split-lines')) {
                        const lines = card.querySelectorAll('.line-st');
                        gsap.to(lines, { y: 0, duration: 0.6, stagger: 0.15, ease: 'power1.out', delay: getDelay(card, index) });
                        gsap.to(lines, { autoAlpha: 1, duration: 0.5, stagger: 0.15, ease: 'power1.out', delay: getDelay(card, index, 0.1) });
                    }
                    if (card.classList.contains('sg-split-chars')) {
                        const chars = card.querySelectorAll('.char-st');
                        gsap.to(chars, { duration: 0.4, stagger: 0.05, ease: 'power3.inOut', autoAlpha: 1, delay: getDelay(card, index) });
                    }
                });
            }

            ScrollTrigger.batch('.sg-anim-item:not(.sg-anim-item--hero)', {
                start: 'top bottom-=100',
                once: true,
                onEnter: (batch) => runBatch(batch),
            });

            ScrollTrigger.batch('.sg-anim-item--hero', {
                start: 'top bottom',
                once: true,
                onEnter: (batch) => runBatch(batch),
            });
        },

        initParallax() {
            const customParallaxElements = document.querySelectorAll('.sg-parallax-custom');
            customParallaxElements.forEach((item) => {
                const container = item.closest('.sg-parallax-custom-container');
                if (!container) return;
                item.classList.add('add-styles');
                const startValue = item.classList.contains('sg-parallax-custom-hero') ? 'top top' : 'top bottom';
                gsap.timeline({
                    scrollTrigger: {
                        trigger: container,
                        start: startValue,
                        end: 'bottom top',
                        pin: item,
                        pinSpacing: false,
                    },
                });
            });

            const customHeroParallaxElements = document.querySelectorAll('.sg-parallax-custom-hero');
            if (customHeroParallaxElements.length > 0) {
                document.body.classList.add('disable-offset-top');
                customHeroParallaxElements.forEach((item) => {
                    const container = item.closest('.sg-parallax-custom-container');
                    if (!container) return;
                    gsap.timeline({
                        scrollTrigger: {
                            trigger: container,
                            start: 'top top',
                            end: `bottom-=${document.querySelector('#header')?.offsetHeight || 0}px top`,
                            onLeave: () => document.body.classList.remove('disable-offset-top'),
                            onEnterBack: () => document.body.classList.add('disable-offset-top'),
                        },
                    });
                });
            }

            const disableLgParallax = document.querySelectorAll('.sg-disable-lg-parallax');
            if (disableLgParallax.length > 0 && window.innerWidth < 992) {
                disableLgParallax.forEach((item) => item.classList.remove('sg-parallax'));
            }

            const parallaxes = document.querySelectorAll('.sg-parallax');
            if (!parallaxes.length) return;

            parallaxes.forEach((el) => {
                const isImg = el.classList.contains('sg-parallax-img');
                const isBlock = el.classList.contains('sg-parallax-block');
                const isReverse = el.classList.contains('sg-parallax-reverse');
                const translateValue = parseFloat(el.dataset.parallaxValue) || 0;
                const translateY = el.classList.contains('sg-parallax-y') ? translateValue : 0;
                const translateX = el.classList.contains('sg-parallax-x') ? translateValue : 0;
                const scale = el.classList.contains('sg-parallax-scale') ? translateValue : 1;
                const scrubVal = el.dataset.parallaxScrub !== undefined ? el.dataset.parallaxScrub : 1;
                const startPos = el.dataset.parallaxTriggerStart || 'top bottom';
                const endPos = el.dataset.parallaxTriggerEnd || 'bottom top';
                const trig = el.classList.contains('sg-is-parallax-trigger') ? el.closest('.sg-parallax-trigger') : el;
                const trigEnd = el.dataset.endTrigger || trig;

                if (isImg && (translateY || translateX)) {
                    const translateYVal = isReverse ? 0 : -translateY;
                    const translateXVal = isReverse ? 0 : -translateX;
                    Object.assign(el.style, {
                        height: `calc(100% + ${translateY}%)`,
                        width: `calc(100% + ${translateX}%)`,
                        position: 'relative',
                        top: `${translateYVal}%`,
                        left: `${translateXVal}%`,
                    });
                }

                if (isBlock && (translateY || translateX)) {
                    let translateYVal = translateY / 2;
                    let translateXVal = translateX / 2;
                    if (!isReverse) {
                        translateYVal *= -1;
                        translateXVal *= -1;
                    }
                    Object.assign(el.style, {
                        position: 'relative',
                        top: `${translateYVal}%`,
                        left: `${translateXVal}%`,
                    });
                }

                const section = el.closest('section');
                const isSafariBrowser = typeof window.isSafari === 'function' ? window.isSafari() : false;
                const parallaxTL = gsap.timeline({
                    scrollTrigger: {
                        trigger: trig,
                        endTrigger: trigEnd,
                        start: startPos,
                        end: endPos,
                        scrub: scrubVal,
                        pin: false,
                        onEnter: () => isSafariBrowser && section && section.classList.add('use-will-change-on-children'),
                        onLeave: () => isSafariBrowser && section && section.classList.remove('use-will-change-on-children'),
                        onEnterBack: () => isSafariBrowser && section && section.classList.add('use-will-change-on-children'),
                        onLeaveBack: () => isSafariBrowser && section && section.classList.remove('use-will-change-on-children'),
                    },
                });

                let translateYVal = translateY;
                let translateXVal = translateX;
                if (isReverse) {
                    if (translateY) translateYVal = -translateY + 3;
                    if (translateX) translateXVal = -translateX + 3;
                }
                parallaxTL.to(el, {
                    xPercent: translateXVal,
                    yPercent: translateYVal,
                    scale,
                    duration: 1,
                    ease: 'none',
                });
            });
        },

        initContainersAndSections() {
            const animContainers = document.querySelectorAll('.sg-anim-container');
            if (animContainers.length > 0) {
                gsap.set(animContainers, { autoAlpha: 1 });
            }

            const sectionsInView = document.querySelectorAll('.sg-safari-section-trigger');
            if (sectionsInView.length && typeof window.isSafari === 'function' && window.isSafari()) {
                sectionsInView.forEach((section) => {
                    gsap.timeline({
                        scrollTrigger: {
                            trigger: section,
                            start: 'top bottom',
                            end: 'bottom top',
                            onEnter: () => section.classList.add('section-in-view'),
                            onLeave: () => section.classList.remove('section-in-view'),
                            onEnterBack: () => section.classList.add('section-in-view'),
                            onLeaveBack: () => section.classList.remove('section-in-view'),
                        },
                    });
                });
            }

            const videos = document.querySelectorAll('.sg-video');
            if (videos.length) {
                videos.forEach((video) => {
                    const container = video.closest('.sg-video-container');
                    if (!container) return;
                    const play = () => video.play();
                    const pause = () => video.pause();
                    pause();
                    gsap.timeline({
                        scrollTrigger: {
                            trigger: container,
                            start: 'top bottom',
                            end: 'bottom top',
                            onEnter: play,
                            onLeave: pause,
                            onEnterBack: play,
                            onLeaveBack: pause,
                        },
                    });

                    video.addEventListener('play', () => container.classList.add('child-video-play'));
                    video.addEventListener('pause', () => container.classList.remove('child-video-play'));
                    video.addEventListener('ended', () => container.classList.remove('child-video-play'));
                });
            }

            const headerMobBtns = document.querySelector('#header-mob-btns');
            if (headerMobBtns) {
                gsap.timeline({
                    scrollTrigger: {
                        trigger: '#footer',
                        start: 'top bottom',
                        onEnter: () => headerMobBtns.classList.add('hide-object'),
                        onLeaveBack: () => headerMobBtns.classList.remove('hide-object'),
                    },
                });
            }
        },

        initSectionTitleWriteReveal() {
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || typeof SplitText === 'undefined') return;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            const titleSelectors = [
                '#main section h2',
                '#main section [class$="title-sans"]',
                '#main section [class$="title-serif"]',
            ].join(', ');

            const blockedHeroSections = [
                '.sg-hero',
                '.sg-about-hero',
                '.sg-internal-hero',
                '.sg-contact-hero',
                '.sg-photo-grid',
            ].join(', ');

            const titles = Array.from(document.querySelectorAll(titleSelectors)).filter((title) => {
                if (!title || title.closest('#preloader')) return false;
                if (blockedHeroSections && title.closest(blockedHeroSections)) return false;
                if (!title.textContent || !title.textContent.trim()) return false;
                return true;
            });

            if (!titles.length) return;

            titles.forEach((title) => {
                title.dataset.sgTitleWrite = 'true';

                const split = new SplitText(title, {
                    type: 'words,chars',
                    wordsClass: 'sg-title-word',
                    charsClass: 'sg-title-char',
                });

                const chars = split.chars || [];
                if (!chars.length) {
                    split.revert();
                    return;
                }

                gsap.set(chars, { autoAlpha: 0 });

                ScrollTrigger.create({
                    trigger: title,
                    start: 'top bottom-=90',
                    once: true,
                    onEnter: () => {
                        gsap.to(chars, {
                            autoAlpha: 1,
                            ease: 'none',
                            stagger: 0.02,
                            duration: 0.045,
                            onComplete: () => {
                                // Keep SplitText markup so heading spacing does not snap after reveal.
                                gsap.set(chars, { clearProps: 'opacity,visibility' });
                                title.dataset.sgTitleWriteComplete = 'true';
                            },
                        });
                    },
                });
            });
        },

        initMaskClipReveal() {
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            const isHomepage = document.body.classList.contains('homepage');
            const maskBlocks = Array.from(document.querySelectorAll(
                '.sg-promo-card-frame, .sg-news-card-frame, .sg-school-life-tile, .sg-split-slider-pic-slider, .sg-profile-card-image, .sg-contact-map-wrap'
            )).filter((block) => {
                if (block.closest('[data-card-animation="fade"]')) return false;
                if (block.classList.contains('sg-mask-sweep-reveal')) return false;
                return !(isHomepage && block.matches('.sg-promo-card-frame, .sg-news-card-frame'));
            });
            if (!maskBlocks.length) return;

            gsap.set(maskBlocks, {
                clipPath: 'inset(100% 0% 0% 0%)',
                willChange: 'clip-path',
            });

            ScrollTrigger.batch(maskBlocks, {
                start: 'top bottom-=60',
                once: true,
                onEnter: (batch) => {
                    gsap.to(batch, {
                        clipPath: 'inset(0% 0% 0% 0%)',
                        duration: 1.05,
                        ease: 'power3.out',
                        stagger: 0.12,
                        clearProps: 'willChange',
                    });
                },
            });
        },

        initMaskGrowReveal() {
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            const maskBlocks = Array.from(
                document.querySelectorAll('.homepage .sg-story-media, .homepage .sg-promo-card-frame, .homepage .sg-news-card-frame')
            ).filter((block) => !block.classList.contains('sg-mask-sweep-reveal'));
            if (!maskBlocks.length) return;

            const getSvgCenter = (svg) => {
                const viewBox = svg?.viewBox?.baseVal;
                if (!viewBox || !viewBox.width || !viewBox.height) return null;
                return `${viewBox.x + (viewBox.width / 2)} ${viewBox.y + (viewBox.height / 2)}`;
            };

            const getMaskGrowConfig = (block) => {
                if (block.matches('.sg-promo-card-frame, .sg-news-card-frame')) {
                    return {
                        origin: '200 257',
                        startScale: 0.006,
                        overshootScale: 1.003,
                        imageStartScale: 1.03,
                    };
                }

                if (block.classList.contains('sg-story-media--secondary')) {
                    const mediaCol = block.closest('.sg-story-media-col');
                    const hasLeftTip = mediaCol?.classList.contains('order-lg-2');
                    return {
                        origin: hasLeftTip ? '0 216' : '640 216',
                        startScale: 0.004,
                        overshootScale: 1.004,
                        imageStartScale: 1.04,
                    };
                }

                return {
                    origin: '639.5005 310',
                    startScale: 0.004,
                    overshootScale: 1.004,
                    imageStartScale: 1.04,
                };
            };

            maskBlocks.forEach((block) => {
                const svg = block.querySelector('svg');
                const maskShell = svg?.querySelector('.sg-mask-grow-shell');
                const maskImage = svg?.querySelector('.sg-mask-grow-image');
                if (!svg || !maskShell) return;

                const config = getMaskGrowConfig(block);
                const maskOrigin = config.origin || getSvgCenter(svg) || '0 0';
                const startScale = config.startScale;
                const overshootScale = config.overshootScale;
                const imageStartScale = config.imageStartScale;

                gsap.set(block, {
                    autoAlpha: 0,
                    willChange: 'opacity',
                });
                gsap.set(maskShell, {
                    scale: startScale,
                    svgOrigin: maskOrigin,
                    willChange: 'transform',
                    force3D: true,
                });

                if (maskImage) {
                    gsap.set(maskImage, {
                        scale: imageStartScale,
                        svgOrigin: maskOrigin,
                        willChange: 'transform',
                        force3D: true,
                    });
                }

                ScrollTrigger.create({
                    trigger: block,
                    start: 'top 30%',
                    once: true,
                    onEnter: () => {
                        const tl = gsap.timeline({
                            defaults: { overwrite: 'auto' },
                            onComplete: () => {
                                gsap.set(block, { clearProps: 'opacity,visibility,willChange' });
                                gsap.set(maskShell, { clearProps: 'transform,willChange' });
                                if (maskImage) gsap.set(maskImage, { clearProps: 'transform,willChange' });
                            },
                        });

                        tl.to(block, {
                            autoAlpha: 1,
                            duration: 0.1,
                            ease: 'none',
                        }, 0);
                        tl.to(maskShell, {
                            scale: overshootScale,
                            duration: 1.12,
                            ease: 'expo.out',
                        }, 0);

                        if (maskImage) {
                            tl.to(maskImage, {
                                scale: 1,
                                duration: 1.08,
                                ease: 'power2.out',
                            }, 0.04);
                        }

                        tl.to(maskShell, {
                            scale: 1,
                            duration: 0.26,
                            ease: 'power1.out',
                        }, '-=0.2');
                    },
                });
            });
        },

        initMaskShapeReveal() {
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            const revealBlocks = document.querySelectorAll('.sg-mask-shape-reveal');
            if (!revealBlocks.length) return;

            const getCenter = (svg, path) => {
                try {
                    const box = path?.getBBox?.();
                    if (box && box.width && box.height) {
                        return `${box.x + (box.width / 2)} ${box.y + (box.height / 2)}`;
                    }
                } catch (e) {
                    // Ignore and fallback to viewBox center.
                }

                const viewBox = svg?.viewBox?.baseVal;
                if (viewBox && viewBox.width && viewBox.height) {
                    return `${viewBox.x + (viewBox.width / 2)} ${viewBox.y + (viewBox.height / 2)}`;
                }
                return '0 0';
            };

            revealBlocks.forEach((block) => {
                const svg = block.querySelector('svg');
                const maskShape = svg?.querySelector('.sg-mask-shape-reveal-path');
                if (!svg || !maskShape) return;

                const origin = getCenter(svg, maskShape);

                gsap.set(maskShape, {
                    scale: 0.004,
                    svgOrigin: origin,
                    willChange: 'transform',
                    force3D: true,
                });

                ScrollTrigger.create({
                    trigger: block,
                    start: 'top 75%',
                    once: true,
                    onEnter: () => {
                        gsap.timeline({
                            defaults: { overwrite: 'auto' },
                            onComplete: () => {
                                gsap.set(maskShape, { clearProps: 'transform,willChange' });
                            },
                        })
                            .to(maskShape, {
                                scale: 1.012,
                                duration: 1.02,
                                ease: 'expo.out',
                            }, 0)
                            .to(maskShape, {
                                scale: 1,
                                duration: 0.24,
                                ease: 'power1.out',
                            }, '-=0.16');
                    },
                });
            });
        },

        initMaskSweepReveal() {
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            const blocks = Array.from(document.querySelectorAll('.sg-mask-sweep-reveal')).filter((block) => (
                !block.closest('[data-card-animation="fade"]')
            ));
            if (!blocks.length) return;

            const SVG_NS = 'http://www.w3.org/2000/svg';

            const ensureSweepMask = (block, blockIndex) => {
                const svg = block.querySelector('svg');
                const maskTarget = svg?.querySelector('.sg-mask-grow-image, .sg-mask-grow-embed, image');
                const clipPath = svg?.querySelector('clipPath');
                const clipShape = clipPath?.querySelector('path');
                if (!svg || !maskTarget || !clipPath || !clipShape) return null;

                let maskPath = svg.querySelector('.sg-mask-sweep-reveal-path');
                if (maskPath) return { svg, maskPath };

                let defs = svg.querySelector('defs');
                if (!defs) {
                    defs = document.createElementNS(SVG_NS, 'defs');
                    svg.insertBefore(defs, svg.firstChild);
                }

                if (!clipPath.id) {
                    clipPath.id = `sg-mask-sweep-clip-${blockIndex}`;
                }

                const viewBox = svg.viewBox?.baseVal;
                const width = viewBox?.width || parseFloat(svg.getAttribute('width')) || 640;
                const height = viewBox?.height || parseFloat(svg.getAttribute('height')) || 432;

                const mask = document.createElementNS(SVG_NS, 'mask');
                const maskId = `${clipPath.id}-sweep-mask`;
                mask.setAttribute('id', maskId);
                mask.setAttribute('maskUnits', 'userSpaceOnUse');
                mask.setAttribute('x', '0');
                mask.setAttribute('y', '0');
                mask.setAttribute('width', String(width));
                mask.setAttribute('height', String(height));

                const bg = document.createElementNS(SVG_NS, 'rect');
                bg.setAttribute('x', '0');
                bg.setAttribute('y', '0');
                bg.setAttribute('width', String(width));
                bg.setAttribute('height', String(height));
                bg.setAttribute('fill', 'black');

                maskPath = document.createElementNS(SVG_NS, 'path');
                maskPath.setAttribute('class', 'sg-mask-sweep-reveal-path');
                maskPath.setAttribute('d', clipShape.getAttribute('d') || '');
                maskPath.setAttribute('fill', 'white');

                const fillRule = clipShape.getAttribute('fill-rule');
                const clipRule = clipShape.getAttribute('clip-rule');
                if (fillRule) maskPath.setAttribute('fill-rule', fillRule);
                if (clipRule) maskPath.setAttribute('clip-rule', clipRule);

                mask.appendChild(bg);
                mask.appendChild(maskPath);
                defs.appendChild(mask);

                maskTarget.setAttribute('mask', `url(#${maskId})`);
                maskTarget.removeAttribute('clip-path');

                return { svg, maskPath };
            };

            const getSweepDelay = (block) => {
                const explicitDelay = block.dataset.sweepDelay;
                if (explicitDelay !== undefined && explicitDelay !== '') {
                    const parsedDelay = parseFloat(explicitDelay);
                    return Number.isFinite(parsedDelay) ? parsedDelay : 0;
                }

                const group = block.closest('[data-sweep-stagger-group]');
                if (!group) return 0;

                const step = parseFloat(group.dataset.sweepStaggerStep);
                const staggerStep = Number.isFinite(step) ? step : 0.2;
                const selector = group.dataset.sweepStaggerSelector || '.sg-mask-sweep-reveal';
                const groupBlocks = Array.from(group.querySelectorAll(selector));
                const blockIndex = groupBlocks.indexOf(block);
                if (blockIndex < 0) return 0;

                if (group.dataset.sweepStaggerMode === 'row') {
                    const getGroupItem = (item) => {
                        let current = item;
                        while (current.parentElement && current.parentElement !== group) {
                            current = current.parentElement;
                        }
                        return current.parentElement === group ? current : item;
                    };

                    const currentItem = getGroupItem(block);
                    const currentTop = currentItem.getBoundingClientRect().top;
                    const sameRowBlocks = groupBlocks.filter((item) => (
                        Math.abs(getGroupItem(item).getBoundingClientRect().top - currentTop) < 2
                    ));
                    const rowIndex = sameRowBlocks.indexOf(block);

                    return rowIndex >= 0 ? rowIndex * staggerStep : 0;
                }

                const cycle = parseInt(group.dataset.sweepStaggerCycle, 10);
                const staggerIndex = Number.isFinite(cycle) && cycle > 0 ? blockIndex % cycle : blockIndex;

                return staggerIndex * staggerStep;
            };

            blocks.forEach((block, blockIndex) => {
                const setup = ensureSweepMask(block, blockIndex);
                if (!setup) return;
                const { svg, maskPath } = setup;

                const viewBox = svg.viewBox?.baseVal;
                const boxWidth = viewBox?.width || 640;
                const boxHeight = viewBox?.height || 432;
                const sweepOrigin = block.dataset.sweepOrigin;
                let tipX, tipY;
                if (sweepOrigin === 'bottom') {
                    tipX = boxWidth / 2;
                    tipY = boxHeight;
                } else if (sweepOrigin === 'left') {
                    tipX = 0;
                    tipY = boxHeight / 2;
                } else if (sweepOrigin === 'right') {
                    tipX = boxWidth;
                    tipY = boxHeight / 2;
                } else {
                    const mediaCol = block.closest('.sg-story-media-col');
                    const hasLeftTip = !!mediaCol?.classList.contains('order-lg-2');
                    tipX = hasLeftTip ? 0 : boxWidth;
                    tipY = boxHeight / 2;
                }

                gsap.set(maskPath, {
                    scale: 0.004,
                    svgOrigin: `${tipX} ${tipY}`,
                    willChange: 'transform',
                    force3D: true,
                });

                const sweepStart = block.dataset.sweepStart || 'top 55%';

                ScrollTrigger.create({
                    trigger: block,
                    start: sweepStart,
                    once: true,
                    onEnter: () => {
                        gsap.timeline({
                            delay: getSweepDelay(block),
                            defaults: { overwrite: 'auto' },
                            onComplete: () => {
                                gsap.set(maskPath, { clearProps: 'transform,willChange' });
                            },
                        })
                            .to(maskPath, {
                                scale: 1.012,
                                duration: 1.08,
                                ease: 'expo.out',
                            }, 0)
                            .to(maskPath, {
                                scale: 1,
                                duration: 0.26,
                                ease: 'power1.out',
                            }, '-=0.18');
                    },
                });
            });
        },

        initCardFadeReveal() {
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            const fadeGroups = Array.from(document.querySelectorAll('[data-card-animation="fade"]'));
            if (!fadeGroups.length) return;

            fadeGroups.forEach((group) => {
                const selector = group.dataset.cardAnimationSelector || '.sg-news-item:not(.sg-news-item--pending) .sg-news-card';
                const cards = Array.from(group.querySelectorAll(selector)).filter((card) => (
                    card.dataset.cardFadeReady !== 'true'
                    && card.getClientRects().length
                ));
                if (!cards.length) return;

                const step = parseFloat(group.dataset.cardStaggerStep);
                const staggerStep = Number.isFinite(step) ? step : 0.08;

                cards.forEach((card) => {
                    card.dataset.cardFadeReady = 'true';
                });

                gsap.set(cards, {
                    autoAlpha: 0,
                    willChange: 'opacity',
                });

                ScrollTrigger.batch(cards, {
                    start: 'top bottom-=80',
                    once: true,
                    onEnter: (batch) => {
                        gsap.to(batch, {
                            autoAlpha: 1,
                            duration: 0.58,
                            ease: 'power2.out',
                            stagger: staggerStep,
                            clearProps: 'opacity,visibility,willChange',
                        });
                    },
                });
            });
        },

initPreloaderHeroFlow() {
            const heroLine = document.querySelector('#sg-hero-line') || document.querySelector('#s-hero-line');
            const heroLineAnim = () => {
                if (!heroLine) return;
                heroLine.classList.add('play');
                gsap.timeline({
                    scrollTrigger: {
                        trigger: heroLine,
                        start: 'bottom top',
                        end: 'bottom top',
                        onLeave: () => heroLine.classList.remove('play'),
                        onEnterBack: () => heroLine.classList.add('play'),
                    },
                });
            };

            if (window.tl_preloader) {
                let heroTitleSplit = null;
                const heroTitleEl = document.querySelector('#sg-hero__title');
                if (heroTitleEl) gsap.set(heroTitleEl, { autoAlpha: 0 });
                const heroTipEl = document.querySelector('#sg-hero__tip-txt');
                const heroSubtitleEl = document.querySelector('#sg-hero__subtitle') || document.querySelector('.sg-hero__slide .sg-hero__h1-serif');
                const heroBodyEl     = document.querySelector('#sg-hero__desc')     || document.querySelector('.sg-hero__slide .sg-hero__body');
                const heroArrowsEl   = document.querySelector('.sg-hero__arrows');
                const firstSlide     = document.querySelector('.sg-hero__slide');
                const isMobileHeader = window.innerWidth < 992;
                const headerAnimTargets = this.getHeaderAnimationTargets(isMobileHeader);
                // Keep preloader-page header reveal in sync with non-preloader pages.
                const headerAnimStagger = 0.1;
                const headerAnimInitialDelay = 0.1;
                if (firstSlide) firstSlide.classList.add('sg-hero__slide--anim');

                const tlHero = gsap.timeline({ paused: true });
                tlHero
                    // 1. nav header items
                    // Use fromTo so js-loading hidden state doesn't get captured as the tween's end state.
                    .fromTo(
                        headerAnimTargets.length ? headerAnimTargets : '.sg-anim-header-item',
                        { autoAlpha: 0 },
                        { autoAlpha: 1, duration: 0.5, stagger: headerAnimStagger, ease: 'power1.out', delay: headerAnimInitialDelay },
                        0,
                    )
                    // 2. tip text
                    .from(heroTipEl, { autoAlpha: 0, y: 8, duration: 0.5, ease: 'power2.out' }, 0.1)
                    // 3. main title — char by char (matches preloader top line)
                    .call(() => {
                        if (heroTitleEl) {
                            gsap.set(heroTitleEl, { autoAlpha: 1, y: 0 });
                            heroTitleSplit = new SplitText(heroTitleEl, {
                                type: 'words,chars',
                                wordsClass: 'word-st',
                                charsClass: 'char-st',
                                aria: 'none',
                            });
                            gsap.from(heroTitleSplit.chars, { autoAlpha: 0, ease: 'none', stagger: 0.03, duration: 0.12 });
                        }
                    }, null, 0.35)
                    // 4. subtitle (h1-serif)
                    .fromTo(heroSubtitleEl, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'power2.out' }, 1.1)
                    // 5. body text
                    .fromTo(heroBodyEl, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'power2.out' }, 1.7)
                    // 6. nav arrows
                    .fromTo(heroArrowsEl, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'power2.out' }, 1.9);

                gsap.set('.sg-hero .sg-anim-hero-container', { autoAlpha: 1 });

                (window.tl_preloader_exit || window.tl_preloader).then(() => {
                    const curtainDuration = 1.05; // must match preloader exit tween duration
                    const heroEntranceDelay = -0.4;  // 0 = curtain fully gone, negative = prepone (e.g. -0.5 starts 0.5s before curtain clears)
                    const resolvedDelay = Math.max(0, curtainDuration + heroEntranceDelay);
                    tlHero.eventCallback('onComplete', () => {
                        if (heroTitleSplit) {
                            heroTitleSplit.revert();
                            heroTitleSplit = null;
                        }
                    });
                    gsap.delayedCall(resolvedDelay, () => tlHero.play(0));
                    heroLineAnim();
                    gsap.delayedCall(2, () => {
                        const modal = document.querySelector('#modal');
                        if (modal) modal.classList.add('is-open');
                    });
                });
            } else {
                heroLineAnim();
                const getCookie = window.getCookie;
                if (!getCookie || getCookie('modalClose') !== 'true') {
                    gsap.delayedCall(2, () => {
                        const modal = document.querySelector('#modal');
                        if (modal) modal.classList.add('is-open');
                    });
                }
            }
        },

        initInternalHeroIntro() {
            if (typeof gsap === 'undefined') return;

            const heroContents = document.querySelectorAll('.sg-internal-hero .sg-anim-hero-container');
            if (!heroContents.length) return;

            // Single place to control internal hero intro timing.
            // You can also override any value per hero section via data-* on .sg-internal-hero.
            const DEFAULTS = {
                initialDelay: 0.18,
                eyebrowStart: 0.0,
                eyebrowDuration: 0.5,
                titleStart: 0.42,
                titleDuration: 0.68,
                titleCharDuration: 0.08,
                titleCharStagger: 0.035,
                serifStart: 1.02,
                serifDuration: 0.58,
                copyStart: 1.28,
                copyDuration: 0.62,
                yEyebrow: 18,
                yTitle: 24,
                ySerif: 26,
                yCopy: 20,
                ease: 'power2.out',
            };

            const getNumber = (value, fallback) => {
                const n = parseFloat(value);
                return Number.isFinite(n) ? n : fallback;
            };

            heroContents.forEach((heroContent) => {
                const hero = heroContent.closest('.sg-internal-hero');
                const label = heroContent.querySelector('.sg-internal-hero-label');
                const titleSans = heroContent.querySelector('.sg-internal-hero-title-sans');
                const titleSerif = heroContent.querySelector('.sg-internal-hero-title-serif');
                const copy = heroContent.querySelector('.sg-internal-hero-copy');

                const config = {
                    initialDelay: getNumber(hero?.dataset.heroAnimDelay, DEFAULTS.initialDelay),
                    eyebrowStart: getNumber(hero?.dataset.heroEyebrowStart, DEFAULTS.eyebrowStart),
                    eyebrowDuration: getNumber(hero?.dataset.heroEyebrowDuration, DEFAULTS.eyebrowDuration),
                    titleStart: getNumber(hero?.dataset.heroTitleStart, DEFAULTS.titleStart),
                    titleDuration: getNumber(hero?.dataset.heroTitleDuration, DEFAULTS.titleDuration),
                    titleCharDuration: getNumber(hero?.dataset.heroTitleCharDuration, DEFAULTS.titleCharDuration),
                    titleCharStagger: getNumber(hero?.dataset.heroTitleCharStagger, DEFAULTS.titleCharStagger),
                    serifStart: getNumber(hero?.dataset.heroSerifStart, DEFAULTS.serifStart),
                    serifDuration: getNumber(hero?.dataset.heroSerifDuration, DEFAULTS.serifDuration),
                    copyStart: getNumber(hero?.dataset.heroCopyStart, DEFAULTS.copyStart),
                    copyDuration: getNumber(hero?.dataset.heroCopyDuration, DEFAULTS.copyDuration),
                    yEyebrow: getNumber(hero?.dataset.heroYOffsetEyebrow, DEFAULTS.yEyebrow),
                    yTitle: getNumber(hero?.dataset.heroYOffsetTitle, DEFAULTS.yTitle),
                    ySerif: getNumber(hero?.dataset.heroYOffsetSerif, DEFAULTS.ySerif),
                    yCopy: getNumber(hero?.dataset.heroYOffsetCopy, DEFAULTS.yCopy),
                    ease: hero?.dataset.heroAnimEase || DEFAULTS.ease,
                };

                const skipTitleSplit = hero?.classList.contains('sg-news-details-hero') || hero?.dataset.heroTitleSplit === 'false';
                const hasSplitText = typeof SplitText !== 'undefined';
                const shouldSplitTitle = !!titleSans && !skipTitleSplit && hasSplitText && window.innerWidth >= 992;
                let titleSplit = null;
                let titleAnimTargets = titleSans ? [titleSans] : [];
                if (shouldSplitTitle) {
                    titleSplit = new SplitText(titleSans, {
                        type: 'chars',
                        charsClass: 'char-st',
                        aria: 'none',
                    });
                    titleAnimTargets = titleSans.querySelectorAll('.char-st');
                    // Keep wrapper visible so animated chars can render.
                    gsap.set(titleSans, { autoAlpha: 1, y: 0 });
                }

                const targets = [label, titleSans, titleSerif, copy].filter(Boolean);
                if (!targets.length) {
                    if (titleSplit) titleSplit.revert();
                    return;
                }

                gsap.set([label, titleSerif, copy].filter(Boolean), { autoAlpha: 0 });
                if (!shouldSplitTitle && titleSans) gsap.set(titleSans, { autoAlpha: 0 });
                if (shouldSplitTitle) gsap.set(titleAnimTargets, { autoAlpha: 0 });

                if (label) gsap.set(label, { y: config.yEyebrow });
                if (!shouldSplitTitle && titleSans) gsap.set(titleSans, { y: config.yTitle });
                if (titleSerif) gsap.set(titleSerif, { y: config.ySerif });
                if (copy) gsap.set(copy, { y: config.yCopy });

                const tl = gsap.timeline({ defaults: { ease: config.ease }, delay: config.initialDelay });
                tl.addLabel('eyebrow', config.eyebrowStart);
                tl.addLabel('title', config.titleStart);
                tl.addLabel('serif', config.serifStart);
                tl.addLabel('copy', config.copyStart);

                if (label) {
                    tl.to(label, { autoAlpha: 1, y: 0, duration: config.eyebrowDuration }, 'eyebrow');
                }
                if (shouldSplitTitle) {
                    tl.to(titleAnimTargets, {
                        autoAlpha: 1,
                        ease: 'none',
                        stagger: config.titleCharStagger,
                        duration: config.titleCharDuration,
                    }, 'title');
                } else if (titleSans) {
                    tl.to(titleSans, { autoAlpha: 1, y: 0, duration: config.titleDuration }, 'title');
                }
                if (titleSerif) tl.to(titleSerif, { autoAlpha: 1, y: 0, duration: config.serifDuration }, 'serif');
                if (copy) tl.to(copy, { autoAlpha: 1, y: 0, duration: config.copyDuration }, 'copy');

                if (titleSplit) {
                    tl.eventCallback('onComplete', () => {
                        titleSplit.revert();
                    });
                }
            });
        },

        activateRibbon(section) {
            if (!section || section.classList.contains('is-ribbon-active')) return;
            section.classList.add('is-ribbon-active');
        },

        initRibbonGrow() {
            const sections = document.querySelectorAll('.js-ribbon-grow');
            if (!sections.length) return;

            const RIBBON_TRIGGER_START = 'top 5%';
            const RIBBON_ANIM_DURATION = 2.4;

            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                gsap.registerPlugin(ScrollTrigger);
                sections.forEach((section) => {
                    const path = section.querySelector('.sg-full-promo-overlay-ribbon-path');
                    if (!path) return;

                    let length = 4200;
                    try {
                        length = path.getTotalLength();
                    } catch (e) {
                        // Keep fallback path length when browser cannot calculate it.
                    }

                    gsap.set(path, {
                        strokeDasharray: length,
                        strokeDashoffset: length,
                    });

                    gsap.to(path, {
                        strokeDashoffset: 0,
                        duration: RIBBON_ANIM_DURATION,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: section,
                            start: RIBBON_TRIGGER_START,
                            toggleActions: 'play none none none',
                            once: true,
                        },
                    });
                });
                return;
            }

            if (!('IntersectionObserver' in window)) {
                sections.forEach((section) => this.activateRibbon(section));
                return;
            }

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    this.activateRibbon(entry.target);
                    observer.unobserve(entry.target);
                });
            }, {
                threshold: 0,
                rootMargin: '0px',
            });

            sections.forEach((section) => observer.observe(section));
        },

        initFooterTagline() {
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
            const lines = document.querySelectorAll('.sg-footer__tagline-line');
            if (!lines.length) return;

            const firstLine = lines[0];
            const secondLine = lines[1] || null;

            // Split first line into words+chars so words don't jump lines while chars reveal
            let split = null;
            let chars = [];
            if (typeof SplitText !== 'undefined') {
                split = new SplitText(firstLine, {
                    type: 'words,chars',
                    wordsClass: 'sg-footer-word',
                    charsClass: 'char-st',
                    aria: 'none',
                });
                chars = split.chars || [];
                gsap.set(chars, { autoAlpha: 0 });
            } else {
                gsap.set(firstLine, { autoAlpha: 0, y: 14 });
            }

            if (secondLine) gsap.set(secondLine, { autoAlpha: 0, y: 14 });

            ScrollTrigger.create({
                trigger: firstLine,
                start: 'top 90%',
                once: true,
                onEnter: () => {
                    const tl = gsap.timeline();

                    if (chars.length) {
                        tl.to(chars, {
                            autoAlpha: 1,
                            ease: 'none',
                            stagger: 0.024,
                            duration: 0.042,
                            onComplete: () => split && split.revert(),
                        }, 0);
                    } else {
                        tl.to(firstLine, { autoAlpha: 1, y: 0, duration: 0.52, ease: 'power2.out' }, 0);
                    }

                    if (secondLine) {
                        tl.to(secondLine, { autoAlpha: 1, y: 0, duration: 0.52, ease: 'power2.out' }, chars.length ? 0.4 : 0.18);
                    }
                },
            });
        },

        init() {
            this.initSplitTextAndBatch();
            this.initParallax();
            this.initContainersAndSections();
            this.initSectionTitleWriteReveal();
            this.initMaskGrowReveal();
            this.initMaskShapeReveal();
            this.initMaskSweepReveal();
            this.initMaskClipReveal();
            this.initCardFadeReveal();
            this.initPreloaderHeroFlow();
            this.initInternalHeroIntro();
            this.initRibbonGrow();
            this.initFooterTagline();
        },
    };

    window.SGAnimations = SGAnimations;
})();
