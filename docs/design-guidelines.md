# Design guidelines from the designer

There is no written brief yet. This file collects the designer's notes in the Figma file itself: the Tooltip annotations beside the desktop homepage (`15417:12062`, page "02 - Website Layouts"), plus what the frames show about states and behaviour. Each item is a requirement unless marked as interpreted. Add the designer's chat or brief here when it arrives.

## Tone
- Premium independent school feel: deep canopy green, cream "beach" grounds, a light serif (Ulises) whose italic words carry the emphasis ("*Excellent* education, *real* faith…"), and lime "moss" for actions.
- Motion follows the house style (St Luke's): subtle and smooth, nothing quick, nothing bouncy.

## Homepage, top to bottom (Tooltip notes, verbatim in quotes)
1. **Hero** — "Hero Section with main messaging (Video or static image background with stats animation)." The 960-tall hero has the header over it, the title and intro on the left, a "Welcome to ICS" glass button and a "Watch full video" thumbnail bottom right (`15513:9909`). The second alternative hero (`15430:12369`) shows the stats version.
2. **Announcement bar** — "Announcements Bar (Revealed on scroll)." A dark green strip under the hero: a moss "REMINDER" label, the message in Ulises Book Italic, and a white "Book interviews" button. On phones a CTA bar (`15541:30348`) sits over the bottom of the hero.
3. **USPs** — "USPs Slider with Image or Video thumbnails with video button or click through button. Draggable from right to left." Cards 311 × 414 (Figma component `USP Card`, normal and hover states), starting at the container's left edge and running off the right of the screen.
4. **Pillars #01–#03** — each a title, copy, "Proof Points" (three stats with a line under each figure) and buttons beside a large photo with a frosted quote card. Pillar #02 sits on beach light with a large decorative vector (`15417:12496`).
5. **Journey Entry Points** — "Find the *right* starting point." A row of Stages Cards (Prep, Primary, Year 5 entry, Secondary…) with arrows; each card has a hover state that reveals a line of copy and a button.
6. **Where ICS Graduates Go** — "Logos add credibility and assurance for prospective parents." Two rows of university and employer logos. "Top row will animate to the left", "Bottom Row will animate to the left": both rows move right to left.
7. **Co-Curricular Slider** — "Co-Curricular Slider with click through buttons (Autoplay with 3-5 seconds on each slide)." Full-width slides (`Full Width Slide`), each a photo, a title, a frosted stat card with a button, a slide count ("01 / 07") and arrows. The alternative promo (`15430:12645`): "Co-Curricular Slider with click through CTA (Auto left to right horizontal motion of image row on scroll)."
8. **FAQs** — "FAQs to reassure prospective parents and ease any doubts." Accordion rows with a diagonal arrow that turns when open; an open row may hold a button.
9. **News** — "News items which change on hover showing current happenings at the school." A dark green list (category + title) beside one large photo; hovering a row swaps the photo.
10. **Join the conversation** — "Instagram reel animates to the left slowly." A row of Insta Tiles moving right to left, then a moss band "Follow along with life at ICS on social media" with the social buttons.
11. **CTA cards** — "Large CTA cards prompting parents to take a step towards enrolment or employment." The Full Width CTA (Employment) and the three CTA Upper Footer cards (Meet our community / Enquire / Start your ICS journey).
12. **Footer** — "Helpful footer information" and "Accreditation Logos" (the strip of affiliation logos under the footer).

## Header and menu
- Header (`Header`, 1440 × 119): landscape logo left, five links centred in Museo Sans 500 16, and a frosted pill on the right holding "Book a tour" (moss) and the burger.
- Phone: the header scrolls into a compact state (`Hero - On Scroll`, `15541:30650`).
- Menu (`15742:14409` desktop, `15541:30252` phone): a dark green panel on the right, rounded 20, inset from the window. Search field and Close button at the top; the main list in Ulises Light 45 with moss arrows; an item with children opens in place to show them (Wellbeing and care in moss for the current page, Our people in white); three small moss buttons and three plain links at the foot. On phones the panel fills the screen.

## Buttons
- Every action is the kit's `Button Rounded Solid` or `Button Rounded Outline`: a pill with a 10px dot before a caps label. On hover (`15513:9896`) the dot grows into a 42px circle holding an arrow and the label moves 12px right (interpreted for every variant from the moss one drawn).

## What this means for the build
| Behaviour | Implementation |
|---|---|
| Smooth scroll, reveals, split titles, parallax | `anim.js` (Lenis + GSAP), `data-anim-*` |
| Hero video or image, stats counting up | every media slot is `image` + optional `video`; `data-anim="counter"` |
| Announcement bar revealed on scroll | to be decided with the hero section |
| Draggable sliders (USPs, entry points, news on phones) | Swiper (`slider.js`), left edge on the container, overflow visible to the right |
| Co-curricular autoplay, 3–5 s | `data-slider-autoplay="4000"`, paused on hover, focus and off screen |
| Logo rows and Instagram reel | `data-marquee="left"` (`initMarquees()`), linear, paused under reduced motion |
| Accordions (FAQs) | `data-accordion` (`initAccordions()`) |
| News photo swap on hover | small script with the news block |
| Hover videos on cards | `data-hover-video` (`initHoverVideos()`), never autoplays on touch |
