# Illawarra Christian School — static cutup

Eleventy + Nunjucks · Bootstrap 5.3 · LESS · `anim`. Output in `dist/` is plain HTML, one CSS and one JS.

```bash
npm install
npm run dev      # http://localhost:3000, live reload; also on the Wi-Fi address it prints, for phones on the same network
npm run build    # production build → dist/
```

The build writes every URL relative to its page, so `dist/` runs from any folder with no prefix, or straight from disk. Pages are flat `<page>.html` files beside `index.html` and `assets/`; the `lab/` pages (`/lab/foundations.html` previews colours, type and buttons) are only built by `npm run dev`. Stop `npm run dev` before `npm run build`: it rewrites `dist/` while the build runs.

Fonts: Ulises and Museo Sans are licensed. The source files (from the ICS landing pages, `../ics-landings/assets/fonts`) sit in `fonts-source/` (git-ignored) and their woff2 conversions in `src/assets/fonts/` under the names in `src/assets/styles/03-base/_fonts.less`. Convert Ulises with the OS/2 `USE_TYPO_METRICS` bit set: without it Windows browsers use its taller win metrics and every Ulises line sits about 18% of the font size lower than Figma.

- Rules: `CLAUDE.md`
- Designer's brief: `docs/design-guidelines.md`
- Tokens, type, components: `docs/design-system.md`
- Figma frame ids: `docs/figma-frames.md`
- Block field contract: `blocks.yaml`
- Wagtail handoff: `docs/wagtail-handoff.md`
- History: `CHANGELOG.md`
