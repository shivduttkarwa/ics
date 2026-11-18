# Design system

Read from the Figma file's local variables and text styles and from what the "02 - Website Layouts" frames actually use. Code: `01-settings/_tokens.less`, `02-tools/_type.less`, `05-components/_buttons.less`; preview at `/lab/foundations.html` under `npm run dev`.

## Colour
The site uses the file's "premium" palette. The older "primary" swatches (blues, oranges, reds) belong to the previous brand and are not used on the website frames.

| Token | Figma variable | Hex | Use |
|---|---|---|---|
| `--color-canopy` | premium/canopy-green | `#0c4b40` | primary: dark sections, headings and labels on light grounds |
| `--color-moss` | premium/bright-moss, primary/bright-green-accent | `#a6d222` | accent: buttons, dots, arrows, labels on dark |
| `--color-forest` | primary/dark-green | `#003620` | fine lines |
| `--color-beach` | premium/beach | `#efe8e0` | warm ground, CTA card |
| `--color-beach-light` | premium/beach-50 | `#f7f4ef` | light ground (Pillar #02, FAQs), light buttons |
| `--color-coal` | premium/coal-seam | `#2c2c2c` | body text on light grounds |
| `--color-dark-grey` | primary/dark-grey | `#373737` | the crest's lettering |
| `--color-flame` | premium/flame-tree | `#e01a1a` | the red menu icon variant (not on the layouts) |
| white / black alphas | WhiteAlpha/*, BlackAlpha/* | | frosted fills (white 20%), image shades (the inner-page hero: black 25%), hairlines (white 20%) |
| `--color-moss-10`, `--color-moss-20`, `--color-moss-30` | | | the graduate story cards; the bullet and stat icon squares; the Arrow circle's rest fill |

The announcement bar's ground is canopy under 40% black (`--color-canopy-deep`, `#072d26`). Image shades are black linear gradients, one token each: `--gradient-hero` (the hero and the slides), `--gradient-hero-sm` (the phone hero), `--gradient-card-top` (USP cards), `--gradient-tile-top` and `--gradient-tile-open` (journey tiles, at rest and open), `--gradient-photo-foot` (pillar photos), `--gradient-band` (the employment band from lg), `--gradient-page-hero` (the deeper inner-page hero: black 40% fading out to the right over black 30%). The scrolled header bar is `color-mix()` of canopy-deep at 88% over the glass blur.

## Type
Two licensed families. **Ulises** (serif, light weights, italics for emphasis) and **Museo Sans** (sans for body, labels and buttons). The woff2 files in `src/assets/fonts/` (converted from the ICS landing pages' files, see the README):

| File | Face | Used for |
|---|---|---|
| `ulises-light.woff2` | Ulises Light (300) | titles |
| `ulises-light-italic.woff2` | Ulises Light Italic | italic words in titles, stat figures |
| `ulises-book.woff2` | Ulises Book (400) | inner page titles, CTA titles, footer, news titles |
| `ulises-book-italic.woff2` | Ulises Book Italic | italic words in those, the announcement text |
| `ulises-medium-italic.woff2` | Ulises Medium Italic (500) | quotes |
| `ulises-semibold.woff2` | Ulises SemiBold (600) | FAQ questions |
| `ulises-bold.woff2` | Ulises Bold (700) | pinned section titles, "Heading 5" |
| `museo-sans-300.woff2` | Museo Sans 300 | copy, captions |
| `museo-sans-500.woff2` | Museo Sans 500 | Body 1, Body 3, nav, card titles |
| `museo-sans-700.woff2` | Museo Sans 700 | buttons, labels, eyebrows |
| `museo-sans-900.woff2` | Museo Sans 900 | breadcrumb current page, staff names |

Also in the frames but not needed as fonts: Ulises Heavy (one 120px quote mark: use the `Quote Marks` component as SVG), PP Neue Montreal ("Watch full video", a stray: set in Museo Sans 700), Myriad Pro (inside a logo).

### Named text styles (Figma)
| Style | Face | Size / line / tracking | Mixin |
|---|---|---|---|
| Display 1 | Ulises Bold | 200 / 1.4 / −3% | — (not on the layouts) |
| Display 2 | Ulises Bold | 120 / 1 / −3% | — |
| Display 3 | Ulises Bold | 90 / 1.2 / −3% | `type-display-3` (as used: Book 90 / 1.1 / −5%) |
| Heading 1 | Ulises Bold | 60 / 1 / −3% | — (see `type-h1`) |
| Heading 1 Light | Ulises Book | 60 / 1 / −3% | — |
| Heading 2 | Ulises Light | 45 / 1 / −3% | `type-heading-2` |
| Heading 3 | Ulises Light | 35 / 1.1 / −3% | `type-heading-3` |
| Heading 4 | Ulises Light | 30 / 1.1 / −2% | `type-heading-4` (h4) |
| Heading 5 | Ulises Bold | 25 / 1.2 / 0 | `type-heading-5` ("Their program includes:"; `type-h5` is the footer's Book 25) |
| Heading 6 | Museo Sans 500 | 20 / 1.4 / 0, caps | `type-heading-6` (h6) |
| Lead Paragraph Serif | Ulises Book | 25 / 1.4 / −2% | `type-lead-serif` |
| Body 1 | Museo Sans 500 | 20 / 1.5 / −3% | `type-body-1` |
| Body 2 | Museo Sans 300 | 18 / 1.4 / 0 | `type-body-2` |
| Body 3 | Museo Sans 500 | 16 / 1.5 / −1% | `type-body-3` (body) |
| Body 4 | Museo Sans 300 | 14 / 1.4 / 0 | `type-body-4` |
| Block Quote 2 / 3 | Ulises Bold | 35, 30 / 1.1 / −3% | — |
| Label Large / 1 | Museo Sans 700 | 25, 20 / 1 / +5%, caps | — |
| Label 2 / 3 / 4 / 10 | Museo Sans 500 | 18, 16, 14, 10 / 1 / +2%, caps | — |

### Unnamed styles the frames use most
| Use | Face | Size / line / tracking | Phone | Mixin |
|---|---|---|---|---|
| Hero, slide and employment band titles | Ulises Light + Light Italic | 60 / 1.1 / −5% | 45 | `type-h1` (h1) |
| Inner page hero titles | Ulises Book + Book Italic | 75 / 1.1 / −5% | interpreted 45 | `type-page-title` |
| Section titles (pillars, FAQs, news, social) | Ulises Light + Light Italic | 60 / 1 / −3% | 45 | `type-section-title` |
| "Preparing for remarkable futures." | Ulises Light + Light Italic | 60 / 1.2 / −3% | 45 | `type-section-title-tall` |
| "How do ICS students get these results?", "Read about some of our HSC graduates" | Ulises Light + Light Italic | 60 / 1.1 / −4% | 45 | `type-section-title-mid` |
| USPs and journey titles | Ulises Light + Light Italic | 45 / 1.2 / −3% | 45 | `type-section-title-small` |
| CTA card titles | Ulises Book + Book Italic | 45 / 1.1 / −3% | 45 | `type-h2` (h2) |
| Footer statement | Ulises Book + Book Italic | 35 / 1.2 / −3% | 35 | `type-h3` (h3) |
| Follow band | Ulises Light + Light Italic | 35 / 1.1 / −5% | 35 | `type-social-text` |
| Stage names (journey tiles) | Ulises Light | 35 / 1.2 / −2% | 35 | `type-stage-title` |
| Menu items | Ulises Light (open: Book Italic) | 45 / 1.1 / −5% | 45 | `type-menu-title` |
| Footer column titles | Ulises Book | 25 / 1.2 / 0 | 25 | `type-h5` (h5) |
| News titles | Ulises Book | 25 / 1.2 / −2% | 25 | `type-news-title` |
| Testimonial quotes | Ulises Book Italic | 25 / 1.4 / 0 | 25 | `type-testimonial-quote` |
| Where Next card captions | Ulises Book | 35 / 1.1 / −5% | 35 | `type-card-caption` |
| Keep Exploring link rows | Museo Sans 300 | 35 / 1.1 / −2% | 35 | `type-link-row` |
| Bullet point titles | Museo Sans 700 | 16 / 1.4 / 0 | 16 | `type-bullet-title` |
| Features Grid Text titles | Ulises Book | 25 / 1.4 / −3% | 25 | `type-feature-title` |
| Profile card names (Our People) | Ulises Book | 25 / 1.2 / −3% | 25 | `type-profile-name` |
| The principal's welcome | Ulises Book Italic | 20 / 1.4 / 0 | 20 | `type-message` |
| A signature's name | Museo Sans 900 | 16 / 1.5 / −1% | 16 | `type-signature` |
| Enrolment step numbers and titles | Ulises Light Italic | 120 / 1 / −3% (90 below lg); 30 / 1 / −3% | | `type-step-number`, `type-step-title` |
| Table header cells | Museo Sans 700 | 25 / 1.2 / 0 | 25 | `type-table-head` |
| Pull quote (Entry Points) | Ulises Light Italic; Museo Sans 700 caps | 35 / 1.4 / −3% (25 below md); 12 / 1.4 / +10% | | `type-pull-quote`, `type-attribution` |
| Table Row values (Contact) | Museo Sans 300 | 16 / 1.5 / −1% | 16 | `type-row-text` |
| Form field labels | Museo Sans 700 caps | 14 / 1 / +2% | 14 | `type-field-label` |
| Moments' time and title (Faith) | Ulises Book (Italic / Bold) | 60 / 1.1 / −4% | 45 | `type-moment-title` |
| A light 20 lead (moments, media-text) | Museo Sans 300 | 20 / 1.4 / −3% | 20 | `type-lead-light` |
| A note under 18 copy | Ulises Medium Italic | 18 / 1.4 / −3% | 18 | `type-note-small` |
| Dotted list rows | Museo Sans 500 | 16 / 1.4 | 16 | `type-list-item` |
| Large introduction | Ulises Light | 45 / 1.1 / −5% | 35 | `type-intro` |
| Photo captions | Ulises Book Italic | 16 / 1.5 / −1% | 16 | `type-caption` |
| Promo card titles | Ulises Light | 35 / 1.1 / −5% | 35 | `type-promo-title` |
| Article quote attribution | Museo Sans 500 caps | 16 / 1.4 / +10% | 16 | `type-attribution-large` |
| Staff quote tiles | Ulises Book Italic; Museo Sans 900 / 300 caps | 24 / 1.2 / −3%; 13 / 1.4 (the component at 94%) | same | `type-staff-quote`, `type-staff-caption` |
| Breadcrumbs | Museo Sans 900 for the pages above, 500 for the current page | 14 / 1.4 / −3% | 14 | `type-breadcrumb` |
| Stat figures | Ulises Light Italic | 60 / 1 / −3% | 60 | `type-stat`; the results grid `type-stat-grid` (45 below sm) |
| Quotes | Ulises Medium Italic | 20 / 1.4 / −3%; 16 / 1.5 | same | `type-quote`, `type-quote-small` |
| FAQ questions | Ulises SemiBold | 20 / 1.5 / 0 | 20 | `type-faq-question` |
| Slide count | Ulises Book Italic | 20 / 1.4 / 0 | 20 | `type-slides-count` |
| Footer summary | Ulises Book | 18 / 1.4 / −3% | 18 | `type-footer-summary` |
| Menu search placeholder | Ulises Book Italic | 18 / 1.5 / −1% | 18 | `type-menu-search` |
| Section copy (pillar leads, graduates) | Museo Sans 300 | 20 / 1.4 / 0 | 20 | `type-body-1-light` |
| Menu child items | Museo Sans 300 | 20 / 1.4 / −3% | 20 | `type-menu-child` |
| Card and pillar copy | Museo Sans 300 | 16 / 1.4 / 0 | 16 | `type-body-3-light` |
| USP card titles | Museo Sans 500 | 25 / 1.2 / −2% | 25 | `type-card-title` |
| Stage copy (journey tiles) | Museo Sans 500 | 16 / 1.2 / 0 | 16 | `type-stage-text` |
| Footer labels | Museo Sans 700 | 16 / 1.4 / +1% | 16 | `type-footer-label` |
| Buttons, tags | Museo Sans 700 | 14 / 1.4 / +5%, caps | 14 | `type-label` |
| News categories | Museo Sans 700 | 12 / 1.4 / +5%, caps | 12 | `type-eyebrow` |

The phone frames keep most of these at their desktop size, so only the 60 titles step down (to 45). The hero intro and the announcement have their own mixins (`type-hero-text`, `type-announcement`, `type-announcement-label`).

## Spacing, radius, effects
- Spacing variables: 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 200 (micro → huge). Sections pad 100 top on desktop; content sits at x 80 in 1440 (container 1280, gutter 80) and at x 20 in 430.
- Radius: 1000 pills (buttons, tags), 20 cards and the rounded foot of the hero and dark sections (0 0 20 20), 10 the video thumbnail, 5 small badges.
- Effects: one, a background blur of 40 (CSS 20) on the frosted white 20% fills: glass buttons, the header pill, quote and stat cards. `.glass()` in `_mixins.less`.
- Lines: 1px canopy, forest or white 20% rules, including the line under each stat figure; 0.5 outline buttons (one device pixel, `.hairline()`); the slide show's 2px progress line.

## Buttons (`snippets/button.njk`, `_buttons.less`)
| Style | Fill | Label | Dot |
|---|---|---|---|
| `moss` | moss | canopy | canopy |
| `canopy` | canopy | white | moss |
| `white` | white | canopy | moss |
| `beach` | beach light | canopy | canopy |
| `glass` | white 20% + blur | white | white |
| `outline-white` | 0.5 white ring | white | moss |
| `outline-canopy` | 0.5 canopy ring | canopy | canopy |
| `outline-moss` | 0.5 moss ring | moss | moss |
| `outline-glass` | 1px white ring + blur | white | white |

Large 52 tall, 25 side insets, 15 gap; small (`size: "small"`) 36 tall with 15 insets, 44 on touch (the menu and footer draw it 30 tall with a 44 hit area, as their frames). Hover grows the dot to 42 (26 small) with the arrow in the button's fill colour; `icon: "none"` or `plain` drops the dot (outline buttons, the header's "Book a tour"); `icon: "open"` draws the dot already grown (the HSC download button). The "Arrow" circle beside sliders is `.arrow-btn` (`_arrows.less`): 52 round, moss 30% with a moss arrow, recoloured per block.

## Icons
Figma draws icons as Font Awesome 7 Pro glyphs (Sharp Light arrows, Light pictograms at 24 and 36, Regular/Solid play and search) and Font Awesome 6 Brands for social logos. Each one is outlined from Figma into `partials/icons.njk` as an `icon-<name>` symbol when its section is built. In the sprite: `icon-arrow-right`, `icon-arrow-diagonal` (FAQ rows, the menu, the Where Next cards), `icon-angle-right` (breadcrumbs), `icon-menu` (the burger, 30 × 18), `icon-play` (the hero video card's triangle), `icon-play-outline` and `icon-play-solid` (the USP video card, the testimonial tiles), `icon-search`, `icon-close`, `icon-facebook`, `icon-instagram`, `icon-linkedin`, and the fifteen Font Awesome 7 Light bullet glyphs of the Why ICS pillars (`icon-medal`, `star`, `trophy`, `chart-line`, `web-awesome`, `chart-pie`, `file-certificate`, `cross`, `hands-praying`, `book-bible`, `face-thinking`, `hand-holding-heart`, `head-side-heart`, `message-heart`, `family`). The HSC Results page adds the four Stat with Icon glyphs (Font Awesome 7 Light at 36 in a 45 box: `icon-mountain`, `rocket`, `hands-clapping`, `hand-point-up`; trophy, star and medal reuse the bullet glyphs, which scale exactly) and eight bullet glyphs (`icon-user-magnifying-glass`, `briefcase`, `clipboard-list-check`, `user-chef`, `user-helmet-safety`, `signs-post`, `pen-field`, `comments`). A new icon is outlined from Figma into the sprite (an SVG export of the list it sits in, each glyph's box as the symbol's viewBox) and named in the data.

## Logos
`src/assets/icons/crest.svg` (79 × 79) and `wordmark.svg` (109 × 52, white) from the header's Logo Landscape, Full Colour Inverted. The kit also has Full Colour, White and Dark Green variants (`6140:12636`) for light grounds. Favicons: `favicon.ico` (16/32/48) and `apple-touch-icon.png` (the crest on canopy). Third-party logos live in `src/assets/images/logos/`: the sixteen university and employer marks of the graduates block (Figma holds them as small rasters; only UOW is a vector) and the six accreditation marks of the footer (`footer-*.svg`, `footer-cen.webp`) on a common 65-tall canvas.
