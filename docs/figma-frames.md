# Figma frames

File `El5cAszLdnHFyIKN6g9uOc` ("Illawarra Christian School Kit"), page "02 - Website Layouts" (`15417:12061`). Desktop frames are 1440 wide, phone frames 430. The designer's notes are Tooltip instances to the left of the desktop homepage (see `design-guidelines.md`).

## Pages (desktop)
| Frame | Node | Height |
|---|---|---|
| Homepage | `15417:12062` | 12196 |
| Why ICS Landing page | `15550:30814` | 8151 |
| Faith Landing | `15694:13352` | 8347 |
| Enrol Landing Page | `15672:10588` | 6663 |
| Entry Points | `15699:14978` | 5412 |
| HSC Results | `15621:13290` | 10495 |
| Our People | `15657:24546` | 7679 |
| Contact ICS | `15657:25820` | 7767 |
| Internal Page Blocks | `15513:9960` | 9207 |
| Internal Page Blocks (second) | `15550:32965` | 9207 |

## Phone
| Frame | Node | Height |
|---|---|---|
| Homepage | `15513:26462` | 13636 |
| Hero - On Scroll | `15541:30650` | 854 |
| Main Menu | `15541:30252` | 932 (410 wide) |

## Overlays, states and alternatives
| Frame | Node |
|---|---|
| Main Menu (desktop, over the hero) | `15742:14261` (panel `15742:14409`) |
| Staff Bio Overlay | `15735:14218` (popup `15735:14219`) |
| Expanded Story | `15657:27409` |
| Homepage Hero Alternative 01 | `15430:1305` |
| Homepage Hero Alternative 02 with Stats | `15430:12369` |
| Alternative Co-Curricular Promo | `15430:12645` |
| Co-Curricular Slider (all slides) | `15513:13207` |
| Journey Entry Points Slider (all cards) | `15417:13672` |
| Pinned Sections (three states) | `15694:17682` |
| Button states: Normal / Hover | `15513:9833` / `15513:9896` |
| Premium Palette (presentation) | `15513:24754` |
| Cover (presentation) | `15417:13715` |

## Homepage top level (desktop)
| Section | Node | y | Height |
|---|---|---|---|
| Hero + announcement bar (group) | `15417:12115` | 0 | 1041 |
| — Hero (header, background) | `15417:12116` | 0 | 960 |
| — Hero copy | `15417:12125` | 265 | 518 |
| — Video thumbnail | `15513:9909` | 751 | 180 |
| — Announcement bar content | `15417:12133` | 980 | 40 |
| USPs (title + CTA) | `15417:12107` | 967 | 860 |
| — USP cards row | `15417:12487` | 1307 | 414 |
| Pillar #01 (Strong outcomes) | `15417:12529` | 1827 | 970 |
| Pillar #02 (Real faith) | `15417:12495` | 2777 | 990 |
| Pillar #03 (A community that knows your child) | `15417:12078` | 3742 | 990 |
| Journey Entry Points | `15699:23363` | 4708 | 1182 |
| Where ICS Graduates Go | `15699:23323` | 5890 | 654 |
| Co-Curricular Slider | `15417:13418` | 6544 | 810 |
| FAQs | `15417:12595` | 7355 | 800 |
| News | `15417:12608` | 8155 | 906 |
| Twitter Feed and Social | `15417:12620` | 9061 | 817 |
| Full Width CTA | `15513:12252` | 9916 | 662 |
| CTA Upper Footer | `15513:12196` | 10578 | 859 |
| Footer Desktop | `15513:11531` | 11437 | 762 |
| Pinned sections (off canvas, three 1440 × 797) | `15417:12111` | | |

## Homepage top level (phone, 430)
| Section | Node | y | Height |
|---|---|---|---|
| Hero | `15513:26871` | 0 | 854 |
| CTA Bar | `15541:30348` | 762 | 72 |
| Announcement Bar | `15513:26719` | 833 | 261 |
| USPs | `15513:27001` | 1075 | 961 |
| Pillar #01 | `15513:27044` | 2032 | 1339 |
| Pillar #02 | `15513:27097` | 3360 | 1503 |
| Pillar #03 | `15513:27142` | 4612 | 1320 |
| Journey Entry Points | `15513:27184` | 5919 | 1099 |
| Where ICS Graduates Go | `15513:27312` | 7018 | 719 |
| Co-Curricular Slider | `15536:27351` | 7739 | 810 |
| FAQs | `15536:27925` | 8549 | 700 |
| News | `15536:28042` | 9230 | 1011 |
| Twitter Feed and Social | `15536:28088` | 10242 | 1071 |
| Full Width CTA | `15536:28134` | 11313 | 720 |
| CTA Upper Footer | `15541:28895` | 12030 | 361 |
| Footer | `15541:29630` | 12391 | 1245 |

## Inner pages top level
Every inner page opens with the same hero: image band `Frame 544` (1440 × 800), title text at y 577 (Ulises Book 75), Breadcrumbs at y 534, and a "Pinned Section" at y 782. On the Why ICS page that "Pinned Section" is a plain statement band (`blocks/pinned.njk`); the three-state "Pinned Section" component (`15694:17682`, "8:15am Morning Devotions") sits off canvas beside every page frame and is a different, day-in-the-life block still to be built. Inner pages have no phone frames.
- Why ICS: hero `15550:30890`, title `15550:30892`, pinned `15550:30879`, then `15550:30858`, `15550:30838`, `15550:30818`, `15550:30893`, `15550:30902`, `15550:30815` (Where next / CTA / footer).
- Faith: hero `15694:13430`, title `15694:13432`, pinned `15694:13419` and `15742:14506`, then `15694:13376`, `15694:13356`, `15694:13433`, `15694:13443`, `15699:24334`.
- Enrol: hero `15672:10666`, title `15672:10668`, pinned `15672:10655`, then `15672:10632`, `15672:10612`, `15694:20104`, `15699:23440`, `15672:10589`.
- Entry Points: hero `15699:15059`, title `15699:15061`, pinned `15699:15048`, then `15699:14979`, `15699:14995`, `15699:23498`, `15699:15045`.
- HSC Results (`/results.html`, built): hero `15621:13302`, title `15621:13304`, breadcrumbs `15621:13339`, pinned `15621:13291`; body `15621:13393` (laid 35 over the pinned band's foot): results `15621:14837`, features `15621:13394`, graduate stories `15657:24463` (expanded state `15657:27409`), FAQs `15653:15625`, careers `15653:15637`, graduates + tiles `15653:15063`, Full Width CTA `15699:23502`, Where Next `15699:22920`, Keep Exploring `15699:23055`, CTA Upper Footer `15653:15758`, footer `15653:15759`.
- Our People: hero `15657:24558`, title `15657:24560`, pinned `15657:24547`, body `15657:27271`, footer group `15657:24561`.
- Contact: hero `15657:25832`, title `15657:25834`, pinned `15657:25821`, body `15657:25923`.
- Internal Page Blocks: hero `15513:10033`, title `15513:10038`, pinned `15513:10022`, blocks `15550:34339` and `15699:23625`.

## Shared components (page "Components", `15337:14538`)
Header `15513:13475` · Footer Desktop `15513:11530` (desktop + phone variants) · Footer `15431:17033` · CTA Upper Footer `15513:12195` · Full Width CTA `15513:12251` · Full Width Slide `15377:6773` (desktop + phone) · Breadcrumbs `15513:14084` · Button Rounded Solid `15339:18031` · Button Rounded Outline `15366:5060` · Button Dot `15339:18054` · Arrow Right `15513:12289` · Arrow Angle Right `15370:6225` · Arrow Group `15581:34595` · Arrow diagonal `15356:21412` · Main Menu Icon `15337:7659` · Main Menu Icon Transparent `15417:13832` · Main Menu Label `15337:7613` · Main Menu Dropdown Item `15340:18573` · Main Menu Dropdown Child Item `15340:18632` · Menu Quick Links `15340:18654` · CTA Flyouts `15337:7584` · USP Card `15337:7399` · Stages Card `15337:7691` · Video Testimonial `15431:14902` · Stat Homepage `15339:17886` · Stat with Icon `15653:24261` · CTA Card `15337:15529` · Accordion Item `15356:21348` · News Home List `15366:5881` · Insta Tile `15370:6173` · Where Next Card `15430:14370` · Where Next Text Row `15430:14480` · Where Next? `15699:22869` · Keep Exploring `15699:23000` · Entry Point Text Row `15694:25288` · Enrolment Step `15694:19553` · Bullet Point with Icon `15431:14590` · Quote Marks `15431:15118` · Internal Promo Card Portrait `15550:32861` · Profile Card `15581:34431` · Staff Quote `15581:34513` · Graduate Story `15657:27591` · Features Grid Text `15653:15041` · Table Row `15657:27820` · Form Input Field `15667:26170` · Tooltip `15430:12527`.

## Foundations
Logos `6140:12636` (Logo Landscape variants: Full Colour `14818:2290`, Full Colour Inverted `14818:2292`, White `14856:3303`, Dark Green `14856:3673`) · Colours `1:200` · Photography `12478:122` · Videos `14817:113` · Vectors `14816:38153` · Patterns `12341:9526`. The Typography page (`5923:55`) is font exploration, not the final styles: the styles are the file's local text styles (see `design-system.md`).
