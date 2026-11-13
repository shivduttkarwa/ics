# Changelog

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
