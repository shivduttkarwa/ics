# Animation

Motion is driven by `data-anim-*` attributes in the templates; no template or block writes GSAP by hand. The attributes are plain HTML and pass through Wagtail templates untouched.

| File | Does |
|---|---|
| `scripts/motion.js` | registers GSAP's plugins and the house eases (`soft`, `silk`, `glide`), exports the media queries (`still`, `phone`, `fine`) |
| `scripts/anim.js` | Lenis smooth scroll, reveals, split titles, counters, the parallax fallback; `window.Anim` |
| `scripts/slider.js` | `data-slider`: card rows (Swiper) |
| `scripts/stage.js` | `data-stage`: the full-width slide show |
| `scripts/marquee.js` | `data-marquee`: logo rows and the Instagram reel |
| `scripts/accordion.js`, `menu.js`, `news.js`, `header.js` | the FAQ rows, the main menu, the news photo swap, the header's scroll states |
| `scripts/stories.js` | `data-story`: a graduate story opening in place |
| `06-animation/_animation.less`, `_parallax.less` | start states, line masks, the scroll-driven parallax |

## How it feels, and why it stays smooth
- Everything moves on `transform` and `opacity` only (plus `clip-path` for photo wipes), at sub-pixel precision on its own compositor layer, then drops the layer when it lands so text is crisp at rest.
- No sub-pixel tails: a layer that is still creeping by fractions of a pixel is resampled every frame, so its text and hairlines look soft and seem to shiver while they are already solid. `landing()` in `motion.js` ends every move once it stays within one device pixel of home, after any overshoot (the curve keeps its shape, the tween runs that share of its duration); `settled(el, vars)` applies it to a tween from wherever the element is. Every reveal, title line, menu row, slide count and accordion panel goes through it.
- A hero title's lines glide on the compositor (`element.animate`, the house curve with its tail cut, as a CSS `linear()` easing), so their pace holds while the page is still loading, and they stay on their layers once landed, the split kept until the width changes: at 100% zoom text on a layer is drawn up to half a pixel from where the page draws it (measured: 0.25px across, 0.43px down), so a line leaving its layer, or the markup going back, visibly shifted the title. St Luke's holds its hero rows on layers the same way. First-screen copy that lifts (`fade-up-held`) keeps `will-change: transform` in its own CSS for the same reason.
- Any other split title's lines are on their own layer only while they move (`will-change` set inline): each line drops it on the frame it lands. A line left resting on a layer is drawn slightly differently from plain text, so the whole title used to twitch when the markup went back after the last line, once it already looked settled. Without the layer while moving, Chrome redraws the line on the pixel grid every frame and it steps a whole pixel at a time.
- Frosted elements (backdrop-filter) fade in place: their blur is sampled from what is behind them, so one that moves over a still backdrop jitters. `glassy(el)` turns a moving preset into `fade` for such an element unless it carries its own photo (a card whose backdrop moves with it).
- Reveals are timed, not scrubbed: each plays once when it comes into view, at its own pace however fast the page is scrolled. Reveals that enter together start 0.09s apart in page order (0.6s at most for a whole batch).
- Long, soft curves: `soft` (`cubic-bezier(0.22, 1, 0.36, 1)`, the same as `--ease-out`) for moves, `silk` (`0.16, 1, 0.3, 1`) for title lines and wipes, `glide` (`0.65, 0, 0.35, 1`) for slide changes. Nothing bounces, with one exception: the hero's video card (`from-right-edge`) settles with a slight overshoot (`back.out(1)`, 13px at 1920).
- Parallax runs as a CSS scroll-driven animation where the browser has them (Chrome, Edge, Safari 26), on the compositor and in step with the scroll, on phones too. Elsewhere GSAP follows Lenis on desktop, and touch screens without scroll timelines get none (a script-driven parallax trails a touch scroll and shivers).
- A CSS `transition` on a revealed element is switched off while its reveal runs, so the two never fight.
- `prefers-reduced-motion`: no smooth scroll, no reveals (everything simply shows), no parallax, no autoplay; sliders and marquees change instantly or stand still.

## Reveal — `data-anim="reveal"`
| Attribute | Values | Default |
|---|---|---|
| `data-anim-type` | `fade-up` `fade-down` (the header's items: 24 down, off a layer in whole pixels, landing at 57% of a 0.7s fade, as St Luke's `drop-soft`) `fade-up-held` (first-screen copy: 15 up on a held layer, landing at 55% of a 0.8s fade; give the element `will-change: transform` in CSS) `fade` `from-left` `from-right` `rise` (cards) `scale` `zoom-out` (a background settling) `line` (a rule drawing from the left) `wipe-up` `wipe-down` `wipe-left` `wipe-right` (a frame opening while the photo or video inside settles from 1.2) `from-right-edge` (slides in from beyond the right edge of the screen and settles with a slight overshoot) | `fade-up` |
| `data-anim-tier` | `hero` (plays on load, in `data-anim-order`) · `secondary` (starts at `top 96%`) · default (starts at `top 88%`) | default |
| `data-anim-order` | hero tier only: the step, 0.14s apart | `0` |
| `data-anim-delay` | seconds added to its start | `0` |
| `data-anim-duration` | seconds, overrides the preset's length | preset |
| `data-anim-fade` | seconds: the fade-in runs evenly over this long, past the end of the move, so text is still faint while its move slows and turns solid once it has stopped (the hero intro, 1.1) | preset |
| `data-anim-start` | ScrollTrigger start, e.g. `top 70%` (`-mobile` twin below lg) | tier |
| `data-anim-type-mobile` | another preset below lg | |
| `data-anim-media` | a media query; where it does not match at load the element simply shows | |
| `data-anim-trigger` | on an ancestor: that ancestor's position starts the reveal | the element |

```html
<p data-anim="reveal">…</p>
<figure class="pillar__frame" data-anim="reveal" data-anim-type="wipe-up">…</figure>
```

### Groups — `data-anim-group="<type>"`
The direct children become reveals of that type, in order. One static attribute on the parent, the same in Nunjucks and Django: the way to stagger a loop. Never hardcode `data-anim-order` inside a loop. `data-anim-tier`, `data-anim-start` and `data-anim-media` on the group pass to its children; with the hero tier, `data-anim-order` on the group is the first child's step and `data-anim-step` (1) is added for each child after it, so `0.5` plays them 0.07s apart. An item not displayed at that width gives up its turn.

When the items are not the group's direct children, mark each with `data-anim-item`: the group then reveals its `[data-anim-item]` descendants in page order and leaves the wrappers between them alone. The header does this: the logo, each `<li>` of the nav loop, and the button and burger inside the pill are items of the bar (`{% set anim_item = true %}` before the button include adds the attribute). The frosted pill itself is its own `fade` reveal, so it fades in place while its contents slide down.

```html
<ul class="usps__list" data-anim-group="rise">{% for card in value.cards %}<li>…</li>{% endfor %}</ul>
```

## Split titles — `data-anim="split"`
The title is split where the browser wrapped it and each line rises out of a mask, 0.11s apart (`data-anim-stagger` sets another gap in seconds, `data-anim-fade` an even fade that outlasts the rise, as for a reveal); the original markup is put back when the last line lands, so nothing about the layout changes. `data-anim-type="words"` or `"chars"` fades the pieces up instead. Takes `data-anim-tier`, `-order`, `-delay`, `-start` as a reveal does. A hero-tier title is split during setup, before the entrance starts; any other is split as it starts to play.

```html
<h2 data-anim="split">Preparing for <em>remarkable</em> futures.</h2>
```

## Counters — `data-anim="counter"`
The first number in the element (or in its `[data-anim-count]` child) counts up from 0 over 2.2s as it comes into view. Prefixes, suffixes, thousands separators and decimals are kept (`~900`, `150+`, `100%`, `99.90`); text with no digits (`XX%`) is left alone.

## Parallax — `data-anim="parallax"`
The layer travels from `--parallax-from` to `--parallax-to` (% of its own height) while its nearest `[data-anim-parallax-trigger]` ancestor, or itself, crosses the screen. `.parallax-layer(@travel)` in `_mixins.less` sets both and overhangs the frame by `@travel`% above and below, for a photo drifting inside a clipped frame. `data-anim-start="top top"` times it from the top of the page (the hero); `data-anim-disable-mobile` holds it still below lg. Keep it to one layer per section, never on every item of a loop.

```html
<div class="pillar__frame" data-anim-parallax-trigger>
  <div class="pillar__layer" data-anim="parallax"><img …></div>
</div>
```

## Scroll progress — `data-anim="progress"`
`--anim-progress` runs 0 → 1 on the element as it passes (`data-anim-start` / `-end`), for CSS to hang a scroll-linked state on.

## The page entrance
Hero-tier steps play on load, 0.14s per `data-anim-order` (fractions allowed). On the home page: the hero photo settles (0), the title rises line by line as every section title does (3), then the intro lifts in under its fade (8, `fade-up-held`) and the button fades in (9); then the header drops in item by item from left to right, 0.07s apart, in whole pixels, each landing while it still fades (10.5, step 0.5: the logo, each link, then the pill fading in place as its button and burger drop in); last, the video card slides in from the right (15). An inner page's hero runs photo (0), title (2), breadcrumbs (3), and the same header follows. It waits for the webfonts (0.9s at most) so the title is split in its real face. The setup and its measuring are done before the entrance's clock starts, and the work the page's `load` event sets off (ScrollTrigger's refresh) waits until the entrance has played, so no frame of it stalls. Anything else on the first screen follows the entrance instead of racing it.

## Sliders
- **Card rows** (`slider.js`) — built once the row comes within 1.5 screens (Swiper re-measures a row on every photo that loads inside it, which stalled the page entrance when every row was built at load). `data-slider` on the `.swiper`, `data-slider-gap="20"` (design px). Drags freely with momentum and eases to rest on the house curve; `data-slider-mode="snap"` rests on a card; `data-slider-rewind` makes the arrows wrap round so neither is ever dimmed. Arrows: `[data-slider-prev]` / `[data-slider-next]` inside the nearest `[data-slider-scope]`; in the same scope `[data-slider-current]` / `[data-slider-total]` show the count ("01 / 03") and each `[data-slider-tab]` goes to its card, carrying `aria-current` while that card shows. Lazy photos in the row are loaded a screen early.
- **Full-width slides** (`stage.js`) — `data-stage` on the block, `data-stage-slide` on each slide (the first with `is-active`), `data-stage-media` on the photo wrapper, `data-stage-title` on the title, `data-stage-item` on whatever else should follow it, `data-stage-prev` / `-next` on the arrows, `data-stage-current` / `-total` for the count, `data-stage-progress` on the fill of a progress line and `data-stage-nav` on the whole foot. The next slide wipes in over the current one (1.4s, `glide`) while both photos drift 16% and the new one settles from 1.12; the old copy fades, the new title rises line by line and the items follow; the count rolls. `data-stage-autoplay="4500"` fills the progress line over the delay and pauses under the pointer, on keyboard focus, off screen and in a background tab; with no autoplay the line shows the position. One slide per swipe or drag (`a, button` ignored), arrow keys while the stage has focus, instant swaps and no autoplay under reduced motion. `data-stage-tone` on the block mirrors the active slide's own `data-stage-tone`, for CSS to recolour the arrows. The first slide's copy and the foot rise in once as the stage scrolls into view (`top 72%`), after the webfonts.
- **Marquees** (`marquee.js`) — built once the lane comes within a screen; `data-marquee="left|right"` on a track whose first child is the one list (give it a trailing gap equal to the item gap so the loop is seamless); the lane is the track's parent and must clip. The list is cloned to fill the lane (copies `aria-hidden`, their links out of the tab order) and the track runs as one compositor animation at `data-marquee-speed` design px a second (40), only while the lane is near the screen; a rebuild (fonts, load, resize) carries on from the same point. Optional: `[data-marquee-prev]` / `[data-marquee-next]` in the nearest `[data-marquee-scope]` step one item (a second click mid-step adds to the first), `data-marquee-pause` eases it to a stop under a mouse, `data-marquee-drag` lets it be dragged and flicked (vertical scrolling kept; a drag never follows the link it started on). Reduced motion: no copies, no animation; the lane gets `is-still` and scrolls sideways by hand, the arrows scroll it by one item.

## Other scripts
- **Accordion** (`accordion.js`) — `data-accordion` on the list, `data-accordion-item` on each row with a `<button aria-expanded>` inside, `data-accordion-panel` on the collapsing element with exactly one child. One row open at a time; the panel moves by height in whole pixels (0.7s, `glide`) while its child fades and lifts in; `is-open` on the item and `aria-expanded` on the button are the only state. CSS keeps a shut panel at `height: 0; overflow: hidden; visibility: hidden`. `data-accordion-closed-mobile` on the list shuts every row below lg at load.
- **News** (`news.js`) — `data-news` on the block, `data-news-item` on each row, `data-news-photo` on each stacked frame in the same order; pointing at or focusing a row lights it and fades its photo in over the last one (0.8s, settling from 1.06). Touch leaves the rows as plain links.
- **Menu** (`menu.js`) — opened from any `[data-menu-open]`: a GSAP timeline slides the panel in (0.9s, `silk`) and rises its `[data-menu-row]`s in turn; parent items open in place by height. Focus trap, Escape, backdrop, `inert` on the rest of the page and `lockScroll()` while open.
- **Header** (`header.js`) — adds `is-stuck` once the page has left the top and `is-hidden` while scrolling down; below lg it holds for 40% of the screen first. The CSS does the drawing.
- **Stories** (`stories.js`) — `data-story` on a card, `[data-story-toggle]` on its button (`data-story-close` is the open label, "Close"), `[data-story-copy]` on the copy and `[data-story-more]` on whatever only the open card shows. The copy fades out (0.25s), the card eases to its new height in whole pixels (0.8s, `glide`), the copy rises back in (16px, cut by `landing()`) and the extra parts fade in; closing fades them first, and scrolls the card's top back under the header when it was above the screen. `is-open` and `aria-expanded` are the state. Instant under reduced motion.
- **Tiles** (`cards.js`) — on a screen with no hover, a tap on a `[data-tile]` inside `[data-tiles]` opens it and shuts the others.

## Line masks
A split title's lines sit in `.anim-line-mask` wrappers that SplitText gives `overflow: clip` inline. `_animation.less` replaces that with a `clip-path` that reaches 0.14em above and 0.24em below each line, so descenders and italic overhangs are not cut off while a line rises and the layout of the title does not change by a pixel.

## Script API
`Anim.init()` runs once from `main.js`. `Anim.add(container, { immediate })` animates content inserted later (load more, a tab pane). `Anim.refresh()` after a layout change, `Anim.stop()` / `Anim.start()` around a scroll lock (`lockScroll()` in `ui.js` calls them). `Anim.lenis` is the Lenis instance.

## Without script
`head.njk` adds `anim-ready` to `<html>` before first paint so nothing flashes, and takes it off again if the script has not started 0.8s after load, so content is never left hidden.
