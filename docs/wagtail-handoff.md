# Wagtail handoff

Living document. Updated as blocks land; the Wagtail build reads this, `blocks.yaml` and `src/_includes/blocks/`.

## How the static build maps to Wagtail

| Static | Wagtail |
|---|---|
| `src/_includes/blocks/<name>.njk` | `templates/blocks/<name>.html`, the block template |
| `value.<field>` | `value.<field>` (same) |
| `{{ value.text \| safe }}` | `{{ value.text\|richtext }}` |
| `{% set img = value.image %}{% include "snippets/image.njk" %}` | `{% image value.image fill-WxH %}` |
| `{% set btn = … %}{% include "snippets/button.njk" %}` | `{% include "snippets/button.html" with btn=… %}` |
| `partials/stream.njk` loop | `{% for block in page.body %}{% include_block block %}{% endfor %}` |
| `src/_data/pages/<page>.json` | the page's fields + StreamField |
| `src/_data/site.json` | site settings and snippets |
| `blocks.yaml` | the StreamField block definitions |
| `dist/assets/css/main.css`, `dist/assets/js/main.js`, from `npm run build` | copied as-is into the Wagtail static files; never edited there |

Nunjucks → Django differences to expect: `loop.index0` → `forloop.counter0`, `{% else %}` in a `for` → `{% empty %}`, `{% set %}` → `{% with %}`.

Type scale on phones and tablets: below 992 the root is the browser's own size (`font-size: 100%` in `_base.less`), so a design px is a CSS px and the phone frames (430) map one to one. From 992 the fluid root takes over and scales the 1440 design with the window.

Titles: italic words are `<em>` inside the heading (Ulises Light → Light Italic, Book → Book Italic). In Wagtail a title field that carries emphasis is a RichTextBlock limited to `italic`, rendered without its `<p>`.

Links: no `href="#"` anywhere. A link whose `url` is empty renders as an `<a>` with no `href` (`{% if btn.url %} href="{{ btn.url }}"{% endif %}`), so it keeps its look but goes nowhere and drops out of the tab order. Keep that test in the Django templates and never use `|default:'#'`.

Focus rings: only for keyboard users. `initFocusMode()` in `ui.js` adds `is-keyboard` to `<html>` on a key press and takes it off on any tap or click; the outline in `_base.less` applies only under it, in `--focus-ring` (canopy; a dark section sets it to moss).

Search engines: `head.njk` carries `<meta name="robots" content="noindex, nofollow">` so the staging copy stays out of search results. Leave it out of the live base template.

## Snippets

### Button (`snippets/button.njk`)
`btn = { text, url, style, size, icon }`. `style` is one of the kit's variants (`moss`, `canopy`, `white`, `beach`, `glass`, `outline-white`, `outline-canopy`, `outline-moss`, `outline-glass`; see `docs/design-system.md`), `size` is empty or `small`. `plain` (set before the include) drops the dot. `icon: "arrow"` is Figma's plain "Button": no dot, the label then a trailing arrow, 40 tall (44 on touch), the arrow nudging 3px right on hover. The dot and the arrow are the `icon-arrow-right` sprite icon, so keep `partials/icons.njk` in the base template.

## Layout

### Rounded feet (`04-layout/_sections.less`)
Figma rounds the foot of a section (20) and tucks the next one under it, so the next section's colour shows in the corners. A block whose section has the corners carries `rounded-foot` on its root; the section after it gets a `::before` that reaches 20 up behind the corners in its own background (`background: inherit`), at `z-index: -1`. That only works while `main` and `body` make no stacking context (no `transform`, `filter`, `isolation` or `z-index` on them), and the next section's background must be a plain colour. Hero and announcement carry it now.

## Site chrome

### Header (`partials/header.njk`)
- Over the top of the page (`position: absolute`), white. From lg: the landscape logo (`crest.svg` + `wordmark.svg`), `site.header_links` (Museo Sans 500 16, 40 apart, moss on hover) and a frosted pill with `site.header_button` (moss, no dot) and the burger. Below lg: the logo and a white 60 circle with a canopy burger.
- Entrance: one `data-anim="sequence"` (hero tier, order 1, after the hero title), its three cells dropping in 0.12s apart.
- The burger is a `<button aria-expanded="false">` with nothing to open yet; the menu comes with its own section (`15742:14409`, `15541:30252`). Figma draws no scrolled or compact header, so the header scrolls away with the page for now.

## Blocks

### hero (`blocks/hero.njk`, `_hero.less`)
- From lg: full screen (`min-height: 100svh`), the copy bottom left (177 above the foot at 1440, so the button lines up with the video card), the video card 25 from the right and 29 from the foot. The background is the video when there is one (from lg only, `data-ambient`: muted loop while on screen, `preload="none"`, fading in over the still once it plays) and otherwise `image`. Figma's crop of the video is matched by a 12% overhang above the frame, anchored at the foot (`object-position: 48% 100%`); the overhang is the parallax travel (`data-anim="parallax"`, from the top, off below lg). Shade: black 20% and black 40% → 0 from the left (`--gradient-hero`).
- Below lg (Figma's phone frames): `image_mobile` (falling back to `image`) holds still while the copy scrolls up over it (a sticky 100lvh layer). The first screen is the logo, the title and the CTA bar (`actions`); the bar sticks 20 above the bottom of the screen until the hero's end. Scrolling 40% of a screen deepens the shade with 40% black and fades the intro and button in once they have risen clear of the bar: Figma's "Hero - On Scroll" frame. These two are CSS scroll timelines (`scroll(root)`); without them (Firefox) or under reduced motion the intro simply shows and the shade stays. The glass button and the CTA buttons have no dot below lg, as drawn.
- Entrance: title split by lines (order 0), header (1), intro (2), button, CTA bar and video card (3).
- `video` is empty: Figma's hero video is a video fill no export route reaches. Its first frame is `image`. Supply the file (or read it through the signed-in browser, as St Luke's did) and set `video: { src, poster }`.
- The video card links to `video_card.url`; empty, it renders with no `href`. "Watch full video" is Figma's PP Neue Montreal, set in Museo Sans 500.

### announcement (`blocks/announcement.njk`, `_announcement.less`)
- Canopy under 40% black (`--color-canopy-deep`), tucked under the hero's rounded foot. From lg one row: the moss label (Museo Sans 700 20, caps) and the message (Ulises Book Italic 20, trimmed to its cap height) on the left, the button on the right, 20 above and below. Below lg stacked: label, message 10 below, button 25 below, padded 29 / 38.
- "Revealed on scroll" (the designer's note): the hero fills the first screen, so the bar sits just under the fold and its contents fade up in turn as it scrolls in (`data-anim-group="fade-up"`).
- Figma's phone button ends in a chevron (`angle-right`), the desktop one in an arrow; both use the arrow.

### placeholder (`blocks/placeholder.njk`, `_coming-soon.less`)
A full-height beach-light stand-in with a centred label, holding the place of the next section to build. Static build only; drop it from the page data as sections land.
