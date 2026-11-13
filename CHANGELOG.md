# Changelog

## 2026-11-13 — Hero checked against Figma at 1440
- Photo crop matched to Figma's (100% scale, 219 in, 117 up) and tied to the hero's width rather than the screen height, so a 1920 × 945 screen shows Figma's framing scaled instead of the whole zoomed-out photo. The parallax travel is the same 117 overhang, scaled.
- Parallax fix (`_parallax.less`): from lg, `data-anim-disable-mobile` reset a top-timed layer to the `cover` range, so the first scroll dropped the hero photo half its travel (about 58 px at 1440) and it never came back. Top-timed layers keep `exit-crossing` from lg too.
- "Watch full video" label 1 px lower (Figma's 8 is inside the card's 1 px border); the play triangle sits 2.5 right, as Figma's rotated polygon.
- Copy, button and video card were already on Figma's boxes. The title wraps to 3 lines instead of 4 until Ulises is supplied.

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
