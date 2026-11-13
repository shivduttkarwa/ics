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
`btn = { text, url, style, size }`. `style` is one of the kit's variants (`moss`, `canopy`, `white`, `beach`, `glass`, `outline-white`, `outline-canopy`, `outline-moss`, `outline-glass`; see `docs/design-system.md`), `size` is empty or `small`. `plain` (set before the include) drops the dot. The dot holds the `icon-arrow-right` sprite icon, so keep `partials/icons.njk` in the base template.

## Site chrome
To come with the header, menu and footer sections.

## Blocks
To come, one heading per block as it is built.
