# Changelog

## 2026-11-14 — Why ICS landing page
- `/why.html` from `15550:30814`, linked from the header's "Why ICS". No phone frame exists: phone layouts follow the home page's patterns and are marked as interpreted in the handoff.
- Inner-page hero (`blocks/page_hero.njk`, `_page-hero.less`) from `15550:30890`, `15550:30892` and the Breadcrumbs component `15513:14084`: the 800 photo band with the title at its foot, an optional breadcrumb trail, the photo drifting on scroll.
- Pinned band (`blocks/pinned.njk`, `_pinned.less`) from `15550:30879`: the statement and copy on canopy-deep under the hero.
- Pillars (`blocks/pillar.njk`, `_pillar.less`): `bullets` (the Bullet Point with Icon list) and `media_height`, for the three Why ICS pillars `15550:30858`, `15550:30838`, `15550:30818`; the home pillars render as before.
- What our community say (`blocks/testimonials.njk`, `_testimonials.less`) from `15550:30893` and `15431:14902`: a draggable row of video tiles with frosted play buttons and quote tiles on canopy or beach.
- Where next? (`blocks/where_next.njk`, `_where-next.less`) from `15699:22938`, `15699:22869`, `15430:14370`: two photo cards with frosted captions.
- Keep exploring (`blocks/keep_exploring.njk`, `_keep-exploring.less`) from `15699:23023`, `15699:23000`, `15430:14480`: a list of link rows beside the title, ending in a rounded foot.
- FAQs: `theme: "white"` (`faqs--white`) for the inner pages' white, 120-padded version.
- Header links carry the 44px hit area on touch.
- Sprite: fifteen Font Awesome 7 Light bullet glyphs (`icon-medal` … `icon-family`) and `icon-angle-right`. Tokens `--color-black-25`, `--color-moss-20`. Type mixins `type-breadcrumb`, `type-bullet-title`, `type-testimonial-quote`, `type-card-caption`, `type-link-row`.
- Images: `why/why-hero-1920.webp`, `why-hero-1280.webp`, `why-hero-mobile.webp`, `why/pillar-faith-ics.webp`, `why/testimonial-*.webp` (3), `why/next-faith.webp`, `next-learning.webp`.
- Checked at 1440 against Figma (every title, list, button and photo within 1px; section heights as drawn), 430, 320, 375, 768, 1024, 1920 for breakage, motion on with no console errors, `mobile-audit` clean at 320–1024.

## 2026-11-14 — Text shiver
- Every move ends once under half a pixel is left (`landing()` / `settled()` in `motion.js`), so no text or hairline sits soft and shivering on a resampled layer through an ease's tail; frosted elements fade in place (`glassy()`), as their blur jitters over a still backdrop when they move.

## 2026-11-14 — Homepage complete, main menu, footer, new motion engine
- Motion engine rewritten (`anim.js`, `motion.js`, `docs/animation.md`): timed reveals that play once on transform and opacity at sub-pixel precision, titles rising line by line out of masks, photo wipes, counters, a page entrance in `data-anim-order` steps, parallax as CSS scroll-driven animations with a GSAP fallback. The old engine's whole-pixel stepping and scroll-scrubbed reveals, which read as shivering, are gone. Lenis stays for the smooth scroll. New eases `soft`, `silk`, `glide` (`--ease-silk` token).
- Sliders: `slider.js` (card rows that drag with momentum and ease to rest; `data-slider-mode="snap"`, `data-slider-rewind`), `stage.js` (`data-stage`: the full-width slide show with a wipe, drifting photos, a rising title, count and progress line, autoplay, swipe and keys), `marquee.js` (`data-marquee`: compositor-driven rows with arrows, drag, flick and hover pause), `accordion.js`, `news.js`, `menu.js`, `header.js`, `cards.js`.
- USPs (`blocks/usps.njk`, `_usps.less`) from `15417:12107`, `15417:12487`, `15337:7399` and `15513:27001`: title and "View all the reasons", seven draggable cards with Figma's hover state and the "Play Video" card.
- Pillars (`blocks/pillar.njk`, `_pillar.less`) from `15417:12529`, `15417:12495`, `15417:12078` and the phone frames: one block with three grounds, the proof points counting up, the photo wiping open with a slow drift, the frosted quote card.
- Journey entry points (`blocks/journey.njk`, `_journey.less`, `cards.js`) from `15699:23363`, `15337:7691` and `15513:27184`: title with arrows, five stage tiles with the hover copy and button, the two buttons; phone order from the phone frame.
- Where ICS graduates go (`blocks/graduates.njk`, `_graduates.less`) from `15699:23323` and `15513:27312`: title, copy and button over two logo rows that run right to left.
- Co-curricular slider (`blocks/slides.njk`, `_slides.less`, `stage.js`) from `15417:13418`, `15513:13207`, `15377:6773` and `15536:27351`: seven full-width slides with the frosted stat card, count, arrows and a progress line, autoplaying at 4.5s.
- FAQs (`blocks/faqs.njk`, `_faqs.less`) from `15417:12595` and `15536:27925`: the title beside an accordion of five rows, the first open from lg; the diagonal arrow turns when a row opens.
- News (`blocks/news.njk`, `_news.less`, `news.js`) from `15417:12608` and `15536:28042`: the canopy list card over one large photo; pointing at a row swaps the photo.
- Join the conversation (`blocks/social.njk`, `_social.less`) from `15417:12620` and `15536:28088`: the Instagram reel drifting left with arrows, drag and pause, then the follow band with the social buttons.
- Employment band (`blocks/cta_band.njk`, `_cta-band.less`) from `15513:12252` and `15536:28134`; CTA cards (`blocks/cta_cards.njk`, `_cta-cards.less`) from `15513:12196`, `15337:15529` and `15541:28895`.
- Main menu (`partials/menu.njk`, `_menu.less`, `menu.js`) from `15742:14409` and `15541:30252`: a modal panel that slides in from the right with its rows rising in turn, sections that open in place, the search field, the three moss buttons and the quick links. The header burger opens it; Escape, Close and a click outside shut it.
- Footer (`partials/footer.njk`, `_footer.less`) from `15513:11531` and `15541:29630`: logo and statement, summary and socials, Visit Us / Contact Us / Next Steps, the accreditation logos as a slow marquee and the legal row. Content in `site.json` under `footer`.
- Header: a scrolled state (`header.js`): it slides away going down the page and comes back going up as a compact frosted bar; below lg it first holds over the hero as Figma's "Hero - On Scroll" frame. `html.is-locked` (scroll lock without a layout shift).
- Hero: the photo settles in as the first step of the entrance, the video card scales in last.
- Shared: `.arrow-btn` (`_arrows.less`), `.parallax-layer()`, the button snippet's `icon: "none"`, gradient tokens `--gradient-card-top`, `--gradient-tile-top`, `--gradient-tile-open`, `--gradient-photo-foot`, `--gradient-band`; type mixins `type-section-title`, `-tall`, `-small`, `type-news-title`, `type-stage-title`, `type-stage-text`, `type-social-text`, `type-slides-count`, `type-menu-*`, `type-footer-summary`, `type-footer-label`; `type-h2`, `type-h3`, `type-h5`, `type-card-title`, `type-body-1`, `type-body-1-light`, `type-body-3-light` and `type-faq-question` now keep their desktop size on phones, as the phone frames draw them.
- Sprite: `icon-play-outline`, `icon-play-solid`, `icon-arrow-diagonal`, `icon-search`, `icon-close`, `icon-facebook`, `icon-instagram`, `icon-linkedin`.
- Images: `home/usp-*`, `journey-*`, `pillar-*`, `slide-*`, `news-*`, `social-*`, `cta-*` (webp); `logos/` (sixteen university and employer logos, six accreditation marks).
- Removed: the placeholder block; the lab pages other than `/lab/foundations.html`.
- QA: `.qa/frames.mjs` (timed frames of an entrance or a scroll, `page:` for every screen) and `.qa/stitch.py`.
- Checked at 1440 and 430 against Figma, section by section and as the whole page; 320, 375, 768, 1024, 1920 and 667 × 375 for breakage; motion on at 1440 and 430 with no console errors; `mobile-audit` clean at 320–1024.

## 2026-11-13 — Fonts
- Ulises and Museo Sans woff2 (the eleven weights in `_fonts.less`), converted from the ICS landing pages' files. Ulises carries the `USE_TYPO_METRICS` flag so Windows places its glyphs as Figma and macOS do (they sat 11 px low at 60).
- The hero now lands on Figma's boxes with real type: the title on four lines at 265, the button 204 wide.

## 2026-11-13 — Hero checked against Figma at 1440
- Photo crop matched to Figma's (100% scale, 219 in, 117 up) and tied to the hero's width rather than the screen height, so a 1920 × 945 screen shows Figma's framing scaled instead of the whole zoomed-out photo. The parallax travel is the same 117 overhang, scaled.
- Parallax fix (`_parallax.less`): from lg, `data-anim-disable-mobile` reset a top-timed layer to the `cover` range, so the first scroll dropped the hero photo half its travel (about 58 px at 1440) and it never came back. Top-timed layers keep `exit-crossing` from lg too.
- "Watch full video" label 1 px lower (Figma's 8 is inside the card's 1 px border); the play triangle sits 2.5 right, as Figma's rotated polygon.
- Copy, button and video card were already on Figma's boxes.

## 2026-11-13 — Homepage hero, header and announcement bar
- Header (`partials/header.njk`, `_header.less`) from Figma's Header component: landscape logo, five links and the frosted "Book a tour" + burger pill from lg; logo and a white menu circle below lg. Drops in after the hero title. The burger has no menu yet.
- Hero (`blocks/hero.njk`, `_hero.less`) from `15417:12115`: full screen, Figma's video framing with a slow parallax drift, the copy bottom left and the "Watch full video" card bottom right. Phones follow `15513:26871` and "Hero - On Scroll" (`15541:30650`): the girls photo holds still, the title sits above the sticky Tours / Enquire / Apply bar, and scrolling deepens the shade and fades the intro and button in.
- Announcement bar (`blocks/announcement.njk`, `_announcement.less`): the reminder row under the hero, tucked under its rounded corners, with Figma's white arrow button (`btn--arrow`).
- A full-height placeholder (`blocks/placeholder.njk`) after it, for the next section.
- New: `.rounded-foot` (`04-layout/_sections.less`), the next section's colour filling the corners as Figma tucks it under; `--color-canopy-deep`, `--gradient-hero`, `--gradient-hero-sm`; type mixins `type-hero-text`, `type-announcement-label`, `type-announcement`, `type-video-label`; sprite icons `icon-menu`, `icon-play`.
- Images: `home/hero-1920.webp` and `hero-1280.webp` (the hero video's first frame), `hero-mobile.webp`, `hero-video-card.webp` (Figma's centred crop at 2×).
- Not yet: the hero video file (Figma's video fill can't be exported; the still stands in) and the Ulises and Museo Sans fonts.
- Checked at 320, 375, 430, 667 × 375, 768, 1024, 1440 and 1920; `mobile-audit` clean at 320–1024.

## 2026-11-13 — Project set up
- New cutup on the St Luke's stack: Eleventy 3 + Nunjucks, Bootstrap 5.3 themed through `--bs-*`, LESS (ITCSS + BEM), `anim` (Lenis + GSAP). Same build (`.eleventy.js`, relative URLs, one CSS and one JS), same package versions (St Luke's lockfile).
- Carried over unchanged: `anim.js`, `slider.js`, `_animation.less`, `_parallax.less`, `_base.less` (pointed at ICS tokens), `stream.njk`, `image.njk`, and the QA scripts in `.qa/` (`figma.py` now on this file's key).
- `ui.js` keeps the generic helpers only: scroll lock, device pixel, keyboard focus mode, disclosures, accordions, hover videos, eager photos, ambient videos, marquees, scroll state, sticky header.
- Read from Figma: the local variables (premium palette, spacing and radius scale), the 28 local text styles and every style the 02 - Website Layouts frames use, the button components, the designer's Tooltip notes and the frame ids. Written up in `docs/design-system.md`, `docs/design-guidelines.md` and `docs/figma-frames.md`.
- Tokens (`_tokens.less`): canopy, moss, forest, beach, beach light, coal, dark grey, flame, white and black alphas; gutter 20 → 80, container 1280; radii 5 / 10 / 20 / pill; glass blur.
- Type (`_type.less`): Ulises and Museo Sans mixins, the named Figma styles plus the unnamed ones the frames use most; h1–h6 defaults. The font files are still to come (`_fonts.less` lists the names); until then the page shows Georgia and the system sans.
- Buttons (`_buttons.less`, `snippets/button.njk`): the kit's five solid and four outline variants, large and small, with the dot that grows into a 42px arrow circle on hover.
- Logo: `crest.svg` and `wordmark.svg` from the header's Logo Landscape; `favicon.ico` and `apple-touch-icon.png` rendered from the crest.
- `/lab/foundations.html` (dev only) previews the colours, headings and every button on light and dark grounds.
