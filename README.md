# Sahan Group — website

![Sahan Group homepage](preview/home-hero.jpg)

A static, five-page website for Sahan Group, built from the client's information request, company profile, Brand Guide and the November 2026 *Brand Manifesto & Messaging Document*. The positioning is the umbrella brand: 25 years of proven trust across real estate, hospitality, F&B, financial services and logistics.

Pages: **Home**, **About us**, **Verticals**, **Properties**, **Careers**.

The homepage follows the manifesto and the November brief: a slow montage hero using the manifesto headline, five sector doors, a ventures strip, a count-up proof strip, a legacy section with the four-step roots timeline, the official motto, an investor section, the founder block and a map-led closing call to action. The page surface drifts between brand greens as you scroll.

---

## Open it

No build step is required. Everything is plain HTML, CSS and vanilla JavaScript.

- **Quickest:** double-click `index.html`.
- **Recommended (local server):**

  ```bash
  cd "Sahan Group "
  python3 -m http.server 8080
  ```

  Then visit <http://localhost:8080>.

Fonts are embedded in `assets/fonts/fonts.css`, so the site renders correctly even when opened directly from disk.

---

## The group

Sahan Group is the umbrella brand. The site presents **five sectors**, each with the operating company behind it:

| Sector | Company | Summary |
| --- | --- | --- |
| **Real estate** | Sahan Engineering & Constructions (Pvt) Ltd | Civil, building and water works for public and private clients; ICTAD registration C-9571, Grade C-4. **Sahan Homes** sits inside it, building apartments and luxury houses — AVORA Residences is its first development. |
| **Hospitality** | Kaze Restaurant & Pub | Chinese and Sri Lankan dining, BYOB, three VIP rooms, two karaoke rooms, pub and banquet hall in Gampaha; 11 AM–11.30 PM; delivery via Uber Eats and PickMe. |
| **F&B** | Pure Spring | Natural mineral water from a 115-metre aquifer, bottled at source in Bandarawela on a fully automated line; 500 ml–19 L and a Premium range in development. |
| **Financial services** | Invest Lanka | Personal loans, gold loans and leasing for three-wheelers and motorcycles. |
| **Logistics** | Cassandra | A Dubai-registered trading and logistics house for imports and fresh-produce exports. |

---

## Structure

```
index.html                 Home — montage hero, five sector doors, ventures, proof, legacy + roots, motto, investors, founder, closing + map
about.html                 About us — story, chapters, group structure, purpose/vision/mission, what we stand for, manifesto quote
verticals.html             Verticals — a section per sector, with sticky section navigation
properties.html            Properties — Sahan Homes and AVORA Residences, gallery, register-interest form, portfolio grid
admin/                     Properties admin (edits data/properties.json through GitHub)
data/properties.json       Property listings shown in the portfolio grid
careers.html               Careers — culture, benefits, CV submission portal

assets/css/styles.css      Design system, layout, components, responsive rules
assets/js/main.js          Navigation, reveal-on-scroll, scrollspy, count-up, scroll colour, lightbox, forms
assets/js/properties.js    Renders the property cards (shared by the page and the admin preview)
assets/fonts/fonts.css     Helvetica Neue is system; Inter, Cormorant Garamond and Roboto Slab are embedded as data URIs
assets/img/                Photography, AVORA renders, company logos, favicon, social image
assets/img/brand/          Sahan Homes, Kaze, Pure Spring, Cassandra and Invest Lanka logos
_brand/                    Original supplied group logo files (PNG + SVG)
netlify.toml               Publish settings, security headers and CSP for Netlify
robots.txt / sitemap.xml   Crawl rules and page list (domain placeholder — see below)
404.html                   Branded not-found page
CHANGELOG.md               History of design and content passes, newest first
preview/                   Reference screenshots used in this README and for client review
```

---

## Brand system

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#3f4a42` | Highland Moss — page and content background |
| `--bg-alt` | `#364139` | Alternate content band |
| `--bg-raised` | `#48554c` | Raised surfaces such as badges |
| `--text` | `#f0e7d6` | Warm Cashmere — primary content text |
| `--ink` | `#1c241e` | Graphite Pine — deep sections and dark buttons |
| `--forest` | `#283229` | Executive Pine — panels |
| `--forest-deep` | `#141915` | Midnight Canopy — footer and deepest surfaces |
| `--sage` / `--sage-deep` | `#6f7a6e` / `#b9c5ba` | Meadow Mist / light Highland Moss — secondary text and labels on moss |
| `--gold` | `#c6b08a` | Golden Oak — brand gold on dark surfaces and buttons |
| `--gold-ink` | `#a8874f` | Accessible gold accent on paper |
| `--gold-label` | `#8e7344` | Small gold labels on paper |
| `--sand` / `--cream` | `#e7d9bf` / `#efe4ce` | Warm Cashmere accents and gradients |
| `--hearthstone` | `#a79a84` | Secondary neutral |
| `--paper` | `#f6f2e9` | Warm ivory — text on dark surfaces and brand plates |

Visual identity system designed by Imanka Wijesinghe (per the manifesto). Content surfaces are **Highland Moss (#3F4A42)** with Warm Cashmere text and Golden Oak accents; dark sections step down to Executive Pine, Midnight Canopy and Graphite Pine for rhythm. Type follows the manifesto: **Helvetica Neue** is the core brand typeface for headlines, body, navigation and UI, with **Inter** as the self-hosted fallback. **Cormorant Garamond** remains as an editorial accent for statements, pull quotes and the founder quote — a deliberate house style rather than a manifesto font. **Optima** is the Sahan Homes/property accent and **Roboto Slab** is used for the Sahan Engineering wordmark and technical notes. **GC Vank** is a licensed specialty face and is not bundled. Company logos are supplied artwork and set on neutral plates so their original backgrounds stay intact.

---

## Key content and interactions

- **Home** opens with a slow montage of AVORA at twilight, Kaze's dining room and a Pure Spring bottle under a dark-green grade, the "Est. 2001 · Gampaha" badge and the manifesto headline "25 years of proven trust" across the five sectors. Below it, five sector doors — real estate (AVORA / Sahan Homes), hospitality (Kaze), F&B (Pure Spring), financial services (Invest Lanka) and logistics (Cassandra) — widen on hover to reveal their pitch and action; on phones they become a swipe rail. A ventures strip names the company behind each sector. A proof strip counts up on scroll (25 years, 100+ people, 5 sectors, 1 home in Gampaha); the legacy section carries the manifesto passage and the four-step roots timeline (2001 → 2018 → Kaze → AVORA); the official motto sits in a full-width band; an investor section sets out capital safety, proven stewardship and long-term perspective. The founder block pairs a quote with a portrait, and the page closes with "Work with us" / "Get in touch", the head office address and a branded Gampaha map.
- **About** tells the 2001 origin story, the chapters that followed, the group structure (with Sahan Homes shown under Sahan Engineering & Constructions), the purpose, vision and mission from the manifesto, and the four "what we stand for" pillars: 25 years of earned trust, multi-sector competence, accountability and proof, people and stewardship.
- **Verticals** gives each sector a full section with services, facts, imagery and a contact route. The sticky sub-navigation tracks the section in view.
- **Properties** is the Sahan Homes / AVORA page: 24 apartments, 10 floors, 2/3/4 bedrooms, from LKR 24 million, construction 2027–2029, amenities, gallery lightbox, location and an enquiry form.
- **Careers** is a CV portal, not a job board: name, contact, LinkedIn, area of interest, note and CV type/size validation, with a two-day reply promise. The form opens the visitor's email app with the details filled in.

Shared interactions: sticky header with logo swap, full-screen mobile navigation, reveal-on-scroll, scroll progress, count-up statistics, a scroll-driven background colour, five sector doors, accessible lightbox, and a sticky section subnav on Verticals.

---

## Unilever-inspired UI notes

The client asked for the feel of [unilever.com](https://www.unilever.com/). These patterns were adapted, not copied, and kept inside the Sahan brand palette and type system:

| Unilever pattern | Sahan implementation |
| --- | --- |
| Large rounded section ends and card masks | `--radius-section`, `--radius-mask`, `.section--round`; the next section shows through each bottom-right curve |
| Pill buttons with a moving arrow | `.btn` uses a full pill radius; the arrow slides on hover |
| Expanding "doors" navigation | `.doors` / `.door`: flex-grow transition on hover, accent bar per brand, content reveal |
| Count-up statistics | `[data-count]` values animate once via IntersectionObserver; instant under reduced motion |
| Chaptered brand timeline | `.roots` five-second horizontal timeline, vertical on phones |

---

## Content and assets to review before going live

1. **Contact details** — `info@sahangroup.lk`, `careers@sahangroup.lk`, `077 239 9049`, `+94 33 223 3004`, 136/4 Minuwangoda, Miriswatta Road, Gampaha and 8.00 AM–4.00 PM come from the information request, the engineering profile and the brand guide. Confirm the main and WhatsApp lines, and whether the two email addresses exist yet.
2. **Social links** — footer and mobile-menu `href="#"` placeholders for Instagram, LinkedIn and Facebook. The `@sahangroup` handle is also a placeholder.
3. **Kaze** — the hospitality venture. Confirm Kaze's phone, reservation link and social accounts.
4. **Cassandra and Invest Lanka** — descriptions are based on the client's brief ("Dubai-registered", "imports and exports, vegetables", "loans, gold loans, leasing for three-wheelers and bikes"). Confirm the registered name, trade lanes, product range and the exact lending products, rates and regulatory wording before launch.
5. **Pure Spring** — product facts, aquifer depth, Bandarawela factory, ISO 22000/SLS/HACCP/GMP, and the order line `076 441 3391` come from the brief, the information request and the supplied campaign artwork. Confirm the certification numbers and the Premium range launch timing. The campaign images carry their own phone number and marketing copy.
6. **Sahan Engineering and Sahan Engineering & Constructions** — the engineering profile is for *Sahan Engineering and Construction (Pvt) Ltd* (ICTAD C-9571, Grade C-4). The site presents Engineering and Construction as two group businesses per the client's brief; confirm the legal entity structure and which projects may be named publicly.
7. **AVORA** — 24 apartments, 10 floors, 2/3/4 bedrooms, from LKR 24 million, 2027–2029, amenities and the Gampaha location come from the information request. Confirm pricing, payment plans, floor plans, brochure, sales contact and the Google Maps link. Renders are cropped and graded from the supplied `EXTERIOR.pdf`.
8. **Founder quote and portrait** — the homepage founder block is a draft. The quote is placeholder copy and the portrait is a designed "PG" monogram. Both are marked with HTML comments in `index.html` and must be replaced with Priyantha Godegama's approved quote and a photograph from Thulith before launch.
9. **Homepage map** — `assets/img/map-gampaha.webp` is built from OpenStreetMap tiles and is credited in-page ("© OpenStreetMap contributors"). The pin marks Gampaha town; the "Open in Google Maps" link goes to the supplied head-office location. Replace or re-export if a more precise pin is required, and keep the attribution.
10. **Naming** — the site uses **Pure Spring** (the brief and information request) while the logo reads "pure spring"; **Cassandra** (the manifesto and logo) rather than the earlier "Cassandara"; and **Sahan Engineering & Constructions** as the venture name, while the legal entity remains *Sahan Engineering and Construction (Pvt) Ltd*. Confirm all three with the client.
11. **Photography** — AVORA visuals are the client's renders. Construction, trading, finance, hospitality, water and community photographs are royalty-free Unsplash images or client-supplied campaign artwork, used as placeholders; swap them for owned photography where possible.
12. **Forms** — both forms are backend-free and compose an email. Connect them to Netlify Forms or an ATS/form service for in-page submissions. The privacy notes are short starting points for Sri Lanka PDPA review.
13. **SEO and sharing** — `og:image` is relative; set an absolute URL on the final domain. `sitemap.xml`, `robots.txt`, a branded `404.html` and Netlify security headers are included; replace the placeholder domain and add canonical tags on the live host.
14. **Deployment hygiene** — publish the site files only; keep `_brand/`, `preview/` and `README.md` out of the public web root.

Source documents used: *Sahan Group — Brand Manifesto & Messaging Document* (Bricks, 16 Nov 2026), *Sahan Group Website Information Request* (Gayan, 22 Oct 2026), *Sahan Engineering company profile 2025 part 01*, the three *Brand Manifesto & Discovery Brief* documents, *Sahan Group Brand Guide*, and the *4-day launch plan* (16 Nov 2026).

The manifesto's vision, mission, motto, investor language and "what we stand for" pillars are reproduced as approved brand messaging; confirm them with the client before launch. The manifesto's visual identity (logo architecture, colourways, Helvetica Neue core, GC Vank/Optima/Roboto Slab hierarchy) is reflected in the site where the fonts are available.

---

## Updating properties

The **Portfolio** section at the bottom of `properties.html` (`#portfolio`) lists every Sahan Homes development as a card: photo, status tags, type, name, location, short description, details (bedrooms, size, bathrooms, parking, floors, timeline), starting price and an **Explore** button. The cards come from `data/properties.json`; nothing else on the page changes when you add one.

### With the admin page (no code)

1. **One-time:** create a GitHub token. GitHub → Settings → Developer settings → *Fine-grained tokens* → Generate. Repository access: *Only select repositories* → `sahan-group`. Permissions: *Contents → Read and write*. Set an expiry (90 days is sensible) and keep the token somewhere safe, like a password manager.
2. Open **`https://<site>/admin/`**, paste the token and press **Connect**. The token lives only in that browser tab and is forgotten when the tab closes.
3. **Add property**, fill the fields, choose a photo (WebP/JPG/PNG under 2 MB) and watch the live preview. Press **Done**.
4. Use **Up / Down** to set the order, **Hide** to take a listing off the site without deleting it, **Delete** (press twice) to remove it.
5. Press **Publish changes**. Photos and listings go out together as one commit to `main`; Netlify redeploys and the site shows the change in about a minute.

Anyone who should edit listings needs write access to the repository (or a token from someone who has it). Revoke a token on GitHub at any time.

### Site settings and text (same admin)

- **Site settings** tab: main and careers email, main and office phone, Google Maps link, Instagram / LinkedIn / Facebook. *Publish settings* rewrites every matching link and line of text on all pages (and the email used by the enquiry and CV forms) in one commit. Empty social fields leave the icon pointing nowhere, as now. Current values are kept in `data/site.json`.
- **Change text** tab: find a phrase and replace it on every page. *Find matches* shows how many places per page; *Replace and publish* changes page text, image descriptions and page descriptions only. Links, code and layout are never touched.

Every publish is a single commit on `main`, so any change can be undone on GitHub with *Revert*.

### By hand

Edit `data/properties.json` and put photos in `assets/img/properties/`. Leave a field as `""` to hide it on the card; set `"published": false` to hide a whole listing. Links may be `#anchor`, a page such as `avora.html`, or a full `https://` address; images must live under `assets/img/`.

### Trying it safely

Open `/admin/?branch=admin-sandbox` to work on a test branch instead of the live site (a red *Test mode* badge shows). Step-by-step checklist: [`docs/ADMIN-TESTING.md`](docs/ADMIN-TESTING.md).

### Tests

```bash
cd tests && npm install && npm test
```

The checks serve the site with the production CSP and confirm that AVORA is listed with the right details, that the original `properties.html` copy is unchanged apart from the added portfolio block (compared with `tests/baseline-properties.html`), that the layout holds at phone width, that text from the data can't inject HTML, and that the admin publishes the right commit (GitHub API mocked). If you deliberately change the page copy later, refresh the baseline by copying `properties.html` over `tests/baseline-properties.html` without the `portfolio:start … portfolio:end` block and the `portfolio:script` line.

---

## History

`CHANGELOG.md` records every design and content pass, newest first — from the
initial four-page demo through the Brand Guide, Unilever-inspired UI, manifesto
alignment, Highland Moss theme and the five-sector restructure.

---

## Deploying

Upload the folder contents to any static host (Netlify, Vercel, Cloudflare Pages, S3, cPanel). No server-side runtime is needed. Keep `index.html` at the web root.

`netlify.toml` is ready for Netlify: it publishes the folder root, sets HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and a Content-Security-Policy whose script hash matches the inline `js` class script. Long-lived caching is set for `/assets/*`. The www-to-non-www redirect is present but commented out until the domain is confirmed — enable one direction only.

`robots.txt` and `sitemap.xml` currently use `https://sahangroup.lk/` as the domain. Replace it with the final domain before submitting the sitemap to Google Search Console. `404.html` is picked up automatically by Netlify.

For in-page form submissions, connect the two forms to Netlify Forms (or an ATS/form service) and add the honeypot and file-size limits described in the launch plan.
