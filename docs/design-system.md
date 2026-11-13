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
| white / black alphas | WhiteAlpha/*, BlackAlpha/* | | frosted fills (white 20%), image shades, hairlines (white 20%) |

The announcement bar's ground is canopy under 40% black. Image shades are black linear gradients (0 → 40/50/65/75%); each is added as a token with the section that uses it.

## Type
Two licensed families. **Ulises** (serif, light weights, italics for emphasis) and **Museo Sans** (sans for body, labels and buttons). Files needed, as woff2 in `src/assets/fonts/`:

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
| Heading 5 | Ulises Bold | 25 / 1.2 / 0 | — (see `type-h5`) |
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
| Hero and slide titles | Ulises Light + Light Italic | 60 / 1.1 / −5% | 45 | `type-h1` (h1) |
| Inner page hero titles | Ulises Book + Book Italic | 75 / 1.1 / −5% | interpreted 45 | `type-page-title` |
| CTA titles | Ulises Book + Book Italic | 45 / 1.1 / −3% | 45 | `type-h2` (h2) |
| Footer statement | Ulises Book + Book Italic | 35 / 1.2 / −3% | 35 | `type-h3` (h3) |
| Footer column titles, news titles | Ulises Book | 25 / 1.2 / 0 to −2% | 25 | `type-h5` (h5) |
| Stat figures | Ulises Light Italic | 60 / 1 / −3% | 60 | `type-stat` |
| Quotes | Ulises Medium Italic | 20 / 1.4 / −3%; 16 / 1.5 | same | `type-quote`, `type-quote-small` |
| FAQ questions | Ulises SemiBold | 20 / 1.5 / 0 | same | `type-faq-question` |
| Section copy | Museo Sans 300 | 20 / 1.4 / 0 | 20 | `type-body-1-light` |
| Card and pillar copy | Museo Sans 300 | 16 / 1.4 / 0 | 16 | `type-body-3-light` |
| USP card titles | Museo Sans 500 | 25 / 1.2 / −2% | 25 | `type-card-title` |
| Buttons, tags | Museo Sans 700 | 14 / 1.4 / +5%, caps | 14 | `type-label` |
| News categories | Museo Sans 700 | 12 / 1.4 / +5%, caps | 12 | `type-eyebrow` |

Section-specific variants (60 / 1 and 60 / 1.2 section titles, 45 / 1.2 "Find the right starting point", the 181 alternative hero, the announcement's Book Italic 20) are added as mixins with the section that uses them.

## Spacing, radius, effects
- Spacing variables: 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 200 (micro → huge). Sections pad 100 top on desktop; content sits at x 80 in 1440 (container 1280, gutter 80) and at x 20 in 430.
- Radius: 1000 pills (buttons, tags), 20 cards and the rounded foot of the hero and dark sections (0 0 20 20), 10 the video thumbnail, 5 small badges.
- Effects: one, a background blur of 40 (CSS 20) on the frosted white 20% fills: glass buttons, the header pill, quote and stat cards. `.glass()` in `_mixins.less`.
- Lines: 1px canopy, forest or white 20% rules; 2px under stat figures; 0.5 outline buttons (one device pixel, `.hairline()`).

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

Large 52 tall, 25 side insets, 15 gap; small (`size: "small"`) 36 tall with 15 insets, 44 on touch. Hover grows the dot to 42 (26 small) with the arrow in the button's fill colour; `plain` drops the dot (the header's "Book a tour").

## Icons
Figma draws icons as Font Awesome 7 Pro glyphs (Sharp Light arrows, Light pictograms at 24 and 36, Regular/Solid play and search) and Font Awesome 6 Brands for social logos. Each one is outlined from Figma into `partials/icons.njk` as an `icon-<name>` symbol when its section is built. In the sprite now: `icon-arrow-right`.

## Logos
`src/assets/icons/crest.svg` (79 × 79) and `wordmark.svg` (109 × 52, white) from the header's Logo Landscape, Full Colour Inverted. The kit also has Full Colour, White and Dark Green variants (`6140:12636`) for light grounds. Favicons: `favicon.ico` (16/32/48) and `apple-touch-icon.png` (the crest on canopy).
