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
                const rest = [...copyLines, cta, media].filter(Boolean);

                const allTargets = [eyebrow, title, ...rest].filter(Boolean);
                if (!allTargets.length) return;

                gsap.set(allTargets, { autoAlpha: 0 });
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

            ScrollTrigger.batch('.ics-anim-item', {
                start: 'top bottom-=100',
                once: true,
                onEnter: (batch) => runBatch(batch),
            });
        },

        initMaskClipReveal() {
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            const maskBlocks = Array.from(document.querySelectorAll('.ics-media-frame'));
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

            const maskBlocks = Array.from(document.querySelectorAll('.ics-mask-grow-reveal'));
            if (!maskBlocks.length) return;

            const getSvgCenter = (svg) => {
                const viewBox = svg?.viewBox?.baseVal;
                if (!viewBox || !viewBox.width || !viewBox.height) return null;
                return `${viewBox.x + (viewBox.width / 2)} ${viewBox.y + (viewBox.height / 2)}`;
            };

            maskBlocks.forEach((block) => {
                const svg = block.querySelector('svg');
                const maskShell = svg?.querySelector('.ics-mask-grow-shell');
                const maskImage = svg?.querySelector('.ics-mask-grow-image');
                if (!svg || !maskShell) return;

                const origin = getSvgCenter(svg) || '0 0';
                const startScale = 0.004;
                const overshootScale = 1.004;
                const imageStartScale = 1.04;

                gsap.set(block, { autoAlpha: 0, willChange: 'opacity' });
                gsap.set(maskShell, { scale: startScale, svgOrigin: origin, willChange: 'transform', force3D: true });
                if (maskImage) {
                    gsap.set(maskImage, { scale: imageStartScale, svgOrigin: origin, willChange: 'transform', force3D: true });
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
                        tl.to(block, { autoAlpha: 1, duration: 0.1, ease: 'none' }, 0);
                        tl.to(maskShell, { scale: overshootScale, duration: 1.12, ease: 'expo.out' }, 0);
                        if (maskImage) tl.to(maskImage, { scale: 1, duration: 1.08, ease: 'power2.out' }, 0.04);
                        tl.to(maskShell, { scale: 1, duration: 0.26, ease: 'power1.out' }, '-=0.2');
                    },
                });
            });
        },

        initMaskShapeReveal() {
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            const revealBlocks = document.querySelectorAll('.ics-mask-shape-reveal');
            if (!revealBlocks.length) return;

            const getCenter = (svg, path) => {
                try {
                    const box = path?.getBBox?.();
                    if (box && box.width && box.height) {
                        return `${box.x + (box.width / 2)} ${box.y + (box.height / 2)}`;
                    }
                } catch (e) {
                }
                const viewBox = svg?.viewBox?.baseVal;
                if (viewBox && viewBox.width && viewBox.height) {
                    return `${viewBox.x + (viewBox.width / 2)} ${viewBox.y + (viewBox.height / 2)}`;
                }
                return '0 0';
            };

            revealBlocks.forEach((block) => {
                const svg = block.querySelector('svg');
                const maskShape = svg?.querySelector('.ics-mask-shape-reveal-path');
                if (!svg || !maskShape) return;

                const origin = getCenter(svg, maskShape);
                gsap.set(maskShape, { scale: 0.004, svgOrigin: origin, willChange: 'transform', force3D: true });

                ScrollTrigger.create({
                    trigger: block,
                    start: 'top 75%',
                    once: true,
                    onEnter: () => {
                        gsap.timeline({
                            defaults: { overwrite: 'auto' },
                            onComplete: () => gsap.set(maskShape, { clearProps: 'transform,willChange' }),
                        })
                            .to(maskShape, { scale: 1.012, duration: 1.02, ease: 'expo.out' }, 0)
                            .to(maskShape, { scale: 1, duration: 0.24, ease: 'power1.out' }, '-=0.16');
                    },
                });
            });
        },

        initMaskSweepReveal() {
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            const blocks = Array.from(document.querySelectorAll('.ics-mask-sweep-reveal'));
            if (!blocks.length) return;

            const SVG_NS = 'http://www.w3.org/2000/svg';

            const ensureSweepMask = (block, blockIndex) => {
                const svg = block.querySelector('svg');
                const maskTarget = svg?.querySelector('.ics-mask-grow-image, image');
                const clipPath = svg?.querySelector('clipPath');
                const clipShape = clipPath?.querySelector('path');
                if (!svg || !maskTarget || !clipPath || !clipShape) return null;

                let maskPath = svg.querySelector('.ics-mask-sweep-reveal-path');
                if (maskPath) return { svg, maskPath };

                let defs = svg.querySelector('defs');
                if (!defs) {
                    defs = document.createElementNS(SVG_NS, 'defs');
                    svg.insertBefore(defs, svg.firstChild);
                }

                if (!clipPath.id) {
                    clipPath.id = `ics-mask-sweep-clip-${blockIndex}`;
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
                maskPath.setAttribute('class', 'ics-mask-sweep-reveal-path');
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

            blocks.forEach((block, blockIndex) => {
                const setup = ensureSweepMask(block, blockIndex);
                if (!setup) return;
                const { svg, maskPath } = setup;

                const viewBox = svg.viewBox?.baseVal;
                const boxWidth = viewBox?.width || 640;
                const boxHeight = viewBox?.height || 432;
                const sweepOrigin = block.dataset.sweepOrigin;
                let tipX, tipY;
                if (sweepOrigin === 'bottom') { tipX = boxWidth / 2; tipY = boxHeight; }
                else if (sweepOrigin === 'left') { tipX = 0; tipY = boxHeight / 2; }
                else if (sweepOrigin === 'right') { tipX = boxWidth; tipY = boxHeight / 2; }
                else { tipX = boxWidth; tipY = boxHeight / 2; }

                gsap.set(maskPath, { scale: 0.004, svgOrigin: `${tipX} ${tipY}`, willChange: 'transform', force3D: true });

                const sweepStart = block.dataset.sweepStart || 'top 55%';

                ScrollTrigger.create({
                    trigger: block,
                    start: sweepStart,
                    once: true,
                    onEnter: () => {
                        gsap.timeline({
                            defaults: { overwrite: 'auto' },
                            onComplete: () => gsap.set(maskPath, { clearProps: 'transform,willChange' }),
                        })
                            .to(maskPath, { scale: 1.012, duration: 1.08, ease: 'expo.out' }, 0)
                            .to(maskPath, { scale: 1, duration: 0.26, ease: 'power1.out' }, '-=0.18');
                    },
                });
            });
        },

        init() {
            this.initSplitTextAndBatch();
            this.initMaskClipReveal();
            this.initMaskGrowReveal();
            this.initMaskShapeReveal();
            this.initMaskSweepReveal();
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
