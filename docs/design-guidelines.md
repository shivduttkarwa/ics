# Design guidelines

Two sources. The client's brief, sent in chat on 2026-11-16 with a screen recording of gsa.uk.com, comes first. Then the designer's notes in the Figma file itself: the Tooltip annotations beside the desktop homepage (`15417:12062`, page "02 - Website Layouts"), plus what the frames show about states and behaviour. Where the two differ, the client's brief is the later word. Each item is a requirement unless marked as interpreted.

## Tone
- Premium independent school feel: deep canopy green, cream "beach" grounds, a light serif (Ulises) whose italic words carry the emphasis ("*Excellent* education, *real* faith…"), and lime "moss" for actions.
- Motion: the client wants "the same animations as" gsa.uk.com, within the house rules (St Luke's): subtle and smooth, nothing quick, nothing bouncy.

## The client's brief (chat, 2026-11-16)
The client's words are in quotes. What GSA does was read from the client's recording and from gsa.uk.com at 1440 × 900.

### Whole site
- "Basically want to have same animations as this site https://gsa.uk.com/ for ICS." GSA is the motion reference wherever this brief and Figma are silent. "Everything else should be pretty straight forward": the rest builds from Figma as drawn.

### Pillars #01–#03 stack on scroll
- "These are the 3 pillars (main marketing points of ICS)" … "can you add the same animation as here on GSA site", sent with the recording.
- What GSA does: a panel pins once its top reaches the top of the screen. The next panel then wipes up over it across about one screen of scroll, scrubbed with the scroll. Its rounded top edge rises from the foot of the screen and uncovers its heading, copy, button and photo where they will rest. Nothing inside either panel moves. Because the photo sits in the same slot as the one before, it reads as one photo wiping to the next. The pinned panel does not move, scale or darken. The incoming panel's small copy and button start at about a third of their strength and come up to full as it docks. GSA builds it with GSAP ScrollTrigger pins.
- For ICS: Pillar #01 scrolls in as now and pins. #02 wipes up over it, then #03 over #02, and the journey block after #03 scrolls on normally. Each pillar pins with its content centred on the screen, room above the title and below the buttons (the client, 2026-11-18: pinning by the foot sat them too high and pinned late; pinning at the very top cut the buttons). The photo holds still with the rest (no parallax while stacked). Under reduced motion the pillars scroll normally.
- Interpreted:
  - The look stays as Figma draws it: each pillar keeps its rounded foot. The incoming pillar's top edge is rounded as it rises, as GSA's is (the client, 2026-11-18), and the quote card sits the same on every pillar, so it stands still through the wipe.
  - The incoming pillar's title is uncovered as it stands, with no line rise. Its figures count as the rising edge uncovers them.
  - The stack runs from lg only. Below lg the pillars scroll as now: there is no phone recording, and a phone pillar is taller than the screen.

### Announcement bar
- "Announcement bar just under hero … will reveal on scroll (so fixed in background)." The bar holds still behind the hero while the hero's rounded foot slides up off it. Once it is uncovered, it scrolls on with the page. This replaces the fade-up it had.

### USPs slider
- "USPs (unique selling points) slider can be dragged right to left by user, with optional video popup option."
- Dragging is built.
- New: a card may carry a video that its Play button opens in a popup. The popup is a modal dialog with the video; its close button, Esc or a click outside closes it, and focus returns to the button. A card without a video keeps its click-through button.

### Where ICS Graduates go
- "The logos in Where ICS Graduates go, will be same as St Luke's (with the two rows of logos moving slowly in opposite directions)." The top row runs right to left and the bottom row left to right, both at the same slow, linear speed. St Luke's pathways logos alternate `data-marquee="left"` and `"right"` at one speed. This overrides the Figma note that both rows run left.

### Footer accreditation logos
- "Accreditation logos bar at the bottom of footer will reveal on scroll (so fixed in background)." The strip holds still at the foot of the screen while the footer's upper band scrolls up off it. Interpreted: the legal row under the strip goes with it.
- "Accreditation logos in footer will have very slow linear right to left animation."

### Main menu
- "Main menu can have same animation as GSA site." GSA's opening, about 1.8s in all:
  1. The page dims under black 30% and the header links fade out (0–0.2s).
  2. The Menu pill becomes the panel. First it stretches left to the panel's width at pill height (0.2–0.5s), "Menu" turning to "Close" and the icon to a cross. Then it drops to full height (1.0–1.6s).
  3. The links fade up in turn as it opens, and the small links at the foot come last.
- For ICS, interpreted: the panel grows out of the header's frosted pill (Book a tour + burger) into Figma's panel, 540 wide, 10 in from the window and rounded 20. The rows then come in as they did before. The page behind is not dimmed and the header links stay, since Figma leaves the page untouched. Closing was not recorded; it is the reverse, quicker. On phones the panel grows out of the burger and still fills the screen, as Figma draws it.

### Also in the recording
- After the stack, the recording runs on into GSA's "Why choose an all-girls school?" (a heading uncovered word by word) and a crossfading stats slider. The client asked only for the stack from it.

### Open questions for the client
- Should the pillar stack also run on phones?
- Is a USP popup video a file (`{ src, poster }`) or a YouTube / Vimeo link?
- Does the footer's legal row stay with the accreditation logos in the fixed strip?

## Homepage, top to bottom (Tooltip notes, verbatim in quotes)
1. **Hero** — "Hero Section with main messaging (Video or static image background with stats animation)." The 960-tall hero has the header over it, the title and intro on the left, a "Welcome to ICS" glass button and a "Watch full video" thumbnail bottom right (`15513:9909`). The second alternative hero (`15430:12369`) shows the stats version.
2. **Announcement bar** — "Announcements Bar (Revealed on scroll)." A dark green strip under the hero: a moss "REMINDER" label, the message in Ulises Book Italic, and a white "Book interviews" button. On phones a CTA bar (`15541:30348`) sits over the bottom of the hero. The client: fixed behind the hero and uncovered as it scrolls away (see the brief).
3. **USPs** — "USPs Slider with Image or Video thumbnails with video button or click through button. Draggable from right to left." Cards 311 × 414 (Figma component `USP Card`, normal and hover states), starting at the container's left edge and running off the right of the screen. The client: the video button opens a popup.
4. **Pillars #01–#03** — each a title, copy, "Proof Points" (three stats with a line under each figure) and buttons beside a large photo with a frosted quote card. Pillar #02 sits on beach light with a large decorative vector (`15417:12496`). The client: they stack on scroll, as GSA's panels do.
5. **Journey Entry Points** — "Find the *right* starting point." A row of Stages Cards (Prep, Primary, Year 5 entry, Secondary…) with arrows; each card has a hover state that reveals a line of copy and a button.
6. **Where ICS Graduates Go** — "Logos add credibility and assurance for prospective parents." Two rows of university and employer logos. Figma notes "Top row will animate to the left" and "Bottom Row will animate to the left". The client overrides this: the rows move in opposite directions, as St Luke's do.
7. **Co-Curricular Slider** — "Co-Curricular Slider with click through buttons (Autoplay with 3-5 seconds on each slide)." Full-width slides (`Full Width Slide`), each a photo, a title, a frosted stat card with a button, a slide count ("01 / 07") and arrows. The alternative promo (`15430:12645`): "Co-Curricular Slider with click through CTA (Auto left to right horizontal motion of image row on scroll)."
8. **FAQs** — "FAQs to reassure prospective parents and ease any doubts." Accordion rows with a diagonal arrow that turns when open; an open row may hold a button.
9. **News** — "News items which change on hover showing current happenings at the school." A dark green list (category + title) beside one large photo; hovering a row swaps the photo.
10. **Join the conversation** — "Instagram reel animates to the left slowly." A row of Insta Tiles moving right to left, then a moss band "Follow along with life at ICS on social media" with the social buttons.
11. **CTA cards** — "Large CTA cards prompting parents to take a step towards enrolment or employment." The Full Width CTA (Employment) and the three CTA Upper Footer cards (Meet our community / Enquire / Start your ICS journey).
12. **Footer** — "Helpful footer information" and "Accreditation Logos" (the strip of affiliation logos under the footer). The client: the strip is fixed in the background, uncovered as the footer scrolls up, and its logos run very slowly right to left.

## Header and menu
- Header (`Header`, 1440 × 119): landscape logo left, five links centred in Museo Sans 500 16, and a frosted pill on the right holding "Book a tour" (moss) and the burger.
- Phone: the header scrolls into a compact state (`Hero - On Scroll`, `15541:30650`).
- Menu (`15742:14409` desktop, `15541:30252` phone): a dark green panel on the right, rounded 20, inset from the window. Search field and Close button at the top; the main list in Ulises Light 45 with moss arrows; an item with children opens in place to show them (Wellbeing and care in moss for the current page, Our people in white); three small moss buttons and three plain links at the foot. On phones the panel fills the screen. The client: it opens as GSA's does (see the brief).

## Buttons
- Every action is the kit's `Button Rounded Solid` or `Button Rounded Outline`: a pill with a 10px dot before a caps label. On hover (`15513:9896`) the dot grows into a 42px circle holding an arrow and the label moves 12px right (interpreted for every variant from the moss one drawn).

## What this means for the build
Rows marked *(brief)* come from the client's brief, built on 2026-11-17 as motion and behaviour only: the design is unchanged.

| Behaviour | Implementation |
|---|---|
| Smooth scroll, reveals, split titles, parallax | `anim.js` (Lenis + GSAP), `data-anim-*` (`docs/animation.md`) |
| Hero video or image, stats counting up | every media slot is `image` + optional `video`; `data-anim="counter"` |
| Announcement bar revealed on scroll *(brief)* | as gsa.uk.com's: the bar is tucked up under the hero's foot and slides down out from under it as the page scrolls, at about a third of the scroll's pace, and holds on the way back up until the page is nearly back at the foot (`data-anim="tuck"`, `anim.js` + `_announcement.less`) |
| Pillars stacking *(brief)* | `data-anim="stack"` (`pillar.stack`): each pillar holds and the next is uncovered over it on a scroll timeline, its content standing still; from lg, none under reduced motion |
| Phone hero "On Scroll" state | the photo holds still, the shade deepens and the intro fades in on a CSS scroll timeline (`_hero.less`); the header is not sticky at the client's ask: the logo scrolls away and only the burger (the pill from lg) stays fixed (`_header.less`, `header.js`) |
| Draggable sliders (USPs, entry points) | Swiper free mode (`data-slider`, `slider.js`), left edge on the container, overflow visible to the right; the journey tiles snap and wrap round |
| USP video popup *(brief)* | `data-video-popup` on the Play Video button (`ui.js`, `partials/video-popup.njk`): a video file, YouTube or Vimeo link in a modal dialog; dormant while the `url` is empty |
| Co-curricular autoplay, 3–5 s | `data-stage data-stage-autoplay="4500"` (`stage.js`): a wipe between slides, paused under the pointer, on keyboard focus and off screen |
| Logo rows and Instagram reel | `data-marquee` (`marquee.js`), linear on the compositor; the graduates' rows run in opposite directions at one speed *(brief)*; the reel also takes arrows, drag and a hover pause; still under reduced motion |
| Footer accreditation strip *(brief)* | `data-marquee="left"`, very slow; the lower band waits stuck to the foot of the screen and is uncovered as the upper band scrolls off it |
| Accordions (FAQs) | `data-accordion` (`accordion.js`) |
| News photo swap on hover | `data-news` (`news.js`) |
| Hover videos on cards | `data-hover-video` (`initHoverVideos()`), never autoplays on touch |
| Main menu *(brief)* | `menu.js`: a modal panel growing out of the header's pill (`data-menu-origin`) as GSA's does, rows rising in turn, sections opening in place |
| Stages card hover on touch | a tap opens the tile (`cards.js`) |
| Graduate stories (HSC Results): value pills, count, arrows | `data-slider` in snap mode with `[data-slider-tab]` and the count (`slider.js`) |
| "Read Jeremy's Story" → the Expanded Story frame | the card opens in place (`stories.js`); interpreted from the two Figma states |
