# Sahan Group — website improvements

A running record of what changed, why, and what still needs client sign-off.
Newest entries first. Keep this file updated with each design or content pass.

---

## November 2026

### Property portfolio + admin
**18 Nov 2026**

Yuga asked for a way for an admin to add future properties without editing HTML,
listed under Properties like a developer's project grid.

- New **Portfolio** section (`#portfolio`, "06") at the end of `properties.html`,
  after the Sahan Homes section. Cards show photo, status tags, type, name,
  location, description, details, starting price and Explore.
- Listings live in `data/properties.json`. AVORA is the only entry, built only
  from copy already on the page (banner text, fact grid, amenities).
- `/admin/` edits the listings and uploads photos straight to GitHub; Netlify
  redeploys in about a minute. No server, no third-party scripts.
- CSP: `connect-src` now allows `https://api.github.com` (admin only uses it).
  `/admin/` is `noindex` and blocked in robots.txt; `/tests/` returns 404.
- No existing copy, images or sections changed. `tests/run.cjs` checks this.

### Five sectors, a quieter page, and scroll colour
**18 Nov 2026**

The client consolidated the group into five sectors and asked for a landing page
that carries all of them, less text, and a scroll-driven colour effect.

**Structure**
- The homepage now presents **five sectors**: real estate, hospitality, F&B,
  financial services and logistics.
- **Real estate** is one company — *Sahan Engineering & Constructions (Pvt) Ltd* —
  with **Sahan Homes** shown as its housing arm for apartments and luxury houses.
- The five sector doors replace the old three-brand doors. Each carries its own
  accent, image, pitch and action.
- A five-column ventures strip names the operating company behind each sector.
- Verticals was rebuilt from seven company sections into **five sector sections**
  with new anchors: `#real-estate`, `#hospitality`, `#food-beverage`,
  `#financial-services`, `#logistics`. The sticky sub-nav, footer lists and every
  cross-page link follow the new anchors.
- The About group structure was simplified to the same five sectors, with Sahan
  Homes nested under real estate.
- Naming corrected throughout: **Pure Spring** (singular), **Cassandra**
  (logistics), **Invest Lanka** (financial services).

**Motion**
- Added a **scroll colour** feature: the page surface drifts between Highland Moss
  and Executive Pine as you read, with `--bg` / `--bg-alt` interpolated per frame
  and `theme-color` kept in sync. It is disabled for `prefers-reduced-motion`.
- Kept the existing scroll language (masked headings, parallax photos, drawn
  rules, count-up statistics) and extended it to the five-door layout.

**Layout**
- Tuned the five-door row for desktop, a 3+2 grid on tablet, and the existing
  swipe rail on phones.
- Added a compact Sahan Homes sub-card inside the real estate section.
- Reduced paragraph length across the homepage, Verticals, About and Careers;
  removed repeated intros and the long service lists where they repeated copy.
- Fixed the About chapters grid so copy no longer collapses into the year column
  on phones; tightened mobile spacing.

**Fixed**
- Footer tagline and metadata still described three sectors.
- About fact strip still said seven companies.
- Old anchor links (`#kaze`, `#pure-spring`, …) pointed at pages that no longer
  existed after the restructure.

---

### Scroll motion and mobile tightening
**17 Nov 2026**

- Scrubbed photo parallax inside framed media.
- An opening frame on feature photos as they enter.
- Masked heading reveals and label rules that draw in.
- Gold progress on service and principle lists.
- A header that tucks away on scroll down and returns on scroll up.
- Swipe rails for the sector doors, vertical photo sets and the property gallery
  on phones.
- Reduced mobile spacing and repeated copy; all motion respects
  `prefers-reduced-motion`.

---

### Highland Moss content surfaces
**16 Nov 2026**

- Page and content backgrounds moved from warm ivory to **Highland Moss
  `#3F4A42`**, with alternating bands at `#364139`.
- Body text moved to **Warm Cashmere `#F0E7D6`**; secondary text to a muted cream;
  small labels to Golden Oak, checked for contrast against moss.
- Reworked the header, sticky subnav, cards, forms, inputs and file control for a
  dark surface; the header now uses the light logo when scrolled.
- Kept ink text on gold buttons, brand plates and the map where the background
  stays light.
- Updated `theme-color`, README tokens and all preview images.

---

### Brand manifesto alignment
**16 Nov 2026**

Repositioned the site from "three consumer brands" to the umbrella group in the
*Brand Manifesto & Messaging Document*.

- Hero copy became **“25 years of proven trust”** across real estate, F&B and
  hospitality, with the manifesto sub-headline.
- Added the **official motto** — “We shape skylines, not just buildings.”
- Added an **investors & partners** section: capital safety, proven stewardship,
  long-term perspective.
- Added the **core purpose, vision and mission**, and replaced the three values
  with the four manifesto pillars: earned trust, multi-sector competence,
  accountability & proof, people & stewardship.
- Careers adopted the employer messaging: “real execution shapes careers”.
- Display typography switched to **Helvetica Neue** (Inter fallback) as the core
  brand face; Cormorant kept for editorial accents; **Roboto Slab** added for
  Sahan Engineering.
- Corrected **Cassandra** and **Sahan Constructions** naming in copy and assets.

---

### Kaze logo
**16 Nov 2026**

- Added the supplied round Kaze badge and wide lockup.
- Kaze's company section opens with the lockup on a sage plate.
- About brand strip now shows Sahan Homes, Kaze, Pure Springs, Cassandra and
  Invest Lanka.
- Fixed the About chapters grid on tablet and mobile.

---

### Homepage rebuilt to the brand-door brief
**16 Nov 2026**

- **Hero**: slow crossfade montage of AVORA at twilight, Kaze's dining room and a
  Pure Spring bottle, with an “Est. 2001 · Gampaha” badge.
- **Three doors**: tall panels for Kaze, Pure Spring and AVORA that widen on hover
  to reveal the pitch and action; stacked cards on mobile.
- **Proof strip**: count-up statistics (25 years, 100+ people, 3 brands, 1 home in
  Gampaha).
- **Roots timeline**: 2001 → 2018 → Kaze → AVORA in one line.
- **Founder block**: quote and portrait placeholder.
- **Closing**: “Work with us” / “Get in touch”, head office details and a branded
  Gampaha map linking to Google Maps.
- Added the map asset built from OpenStreetMap tiles with in-page attribution.

---

### Seven-company rebuild
**16 Nov 2026**

- Added Sahan Engineering, Sahan Constructions, Sahan Homes, Pure Spring,
  Cassandra and Invest Lanka alongside the existing site; Kaze retained.
- Built the dedicated **Properties** page for Sahan Homes and AVORA Residences:
  24 apartments, 10 floors, 2/3/4 bedrooms, from LKR 24 million, 2027–2029,
  amenities, gallery lightbox and a register-interest form.
- Rewrote About around the 2001 founding story, group structure and values.
- Converted Careers into the **CV portal** the information request asked for —
  no job listings, with CV type and size validation and a two-day reply promise.
- Added supplied company logos, new photography and deployment files
  (`netlify.toml`, `robots.txt`, `sitemap.xml`, `404.html`).

---

### Properties tab and Brand Guide
**16 Nov 2026**

- Removed investment-oriented wording across the site.
- Added a **Properties** tab, top-level nav entry and the AVORA property card with
  status, typology, amenities and an amenity gallery.
- Linked the home AVORA section to the collection and updated About and Careers.
- Applied the **Sahan Group Brand Guide** palette exactly: Midnight Canopy,
  Executive Pine, Graphite Pine, Golden Oak, Warm Cashmere, Highland Moss,
  Meadow Mist and Hearthstone.
- Typography: Helvetica Neue for body and UI, Cormorant for display, Optima for
  property accents.

---

### Unilever-inspired UI language
**16 Nov 2026**

Adapted, not copied, from [unilever.com](https://www.unilever.com/):

- Large rounded section ends and masked cards.
- Tag pills flush to the media edge.
- Swimlane carousels with arrows, dots and keyboard support.
- Four-pillar image blocks.
- “On social” strip whose tiles open the shared lightbox.
- Underlined card titles that clear on hover.
- Pill buttons with a sliding arrow.

Journal, commitments and social modules from this pass were later removed in the
five-sector simplification; the card, mask and carousel patterns remain in use.

---

### Initial build
**19–21 Oct 2026**

- Four pages — Home, About us, Verticals, Careers — in plain HTML, CSS and vanilla
  JavaScript with no build step.
- Brand palette sampled from the supplied logo files; self-hosted fonts embedded
  so the site renders from disk.
- AVORA Residences introduced as the upcoming real-estate project, using the
  supplied `EXTERIOR.pdf` renders.
- Header/logo swap on scroll, full-screen mobile menu, reveal animations,
  accessible lightbox and responsive `srcset` imagery.
- Published to GitHub as the demo.

---

## Still to confirm with the client

- Founder quote and portrait (homepage placeholder).
- Kaze phone, reservation link and social accounts.
- Cassandra's registered name, trade lanes and produce range.
- Invest Lanka's exact products, rates and regulatory wording.
- Pure Spring certification numbers and Premium range timing.
- AVORA pricing, payment plans, brochure and sales contact.
- Social URLs and the `@sahangroup` handle.
- Final domain for `sitemap.xml`, `robots.txt` and absolute `og:image`.
