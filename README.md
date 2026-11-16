# Sahan Group — website

![Sahan Group homepage](preview/home-hero.jpg)

A static, four-page website for Sahan Group, aligned to the supplied Sahan Group Brand Guide — Midnight Canopy and Executive Pine greens, Golden Oak, Warm Cashmere and paper ivory — with the interaction and layout language of [jxg.lk](https://jxg.lk/) and [unilever.com](https://www.unilever.com/).

Pages: **Home**, **About us**, **Verticals** (with a **Properties** tab and top-level nav link), **Careers**.

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

## Structure

```
index.html                 Home — hero, who we are, verticals, Journal, AVORA, Commitments, On social, principles, careers
about.html                 About us — story, chapters, values, quote, the group
verticals.html             Verticals — food & beverage, hospitality, real estate and the Properties collection (sticky section nav)
careers.html               Careers — culture, benefits, open roles, hiring process, application form

assets/css/styles.css      Design system, layout, components, responsive rules
assets/js/main.js          Navigation, reveal-on-scroll, scrollspy, lightbox, form handling
assets/fonts/fonts.css     Cormorant Garamond + Inter (latin subsets, embedded as data URIs); Helvetica Neue and Optima are used locally where available
assets/img/                Photography, AVORA renders, logo lockups, favicon, social image
_brand/                    Original supplied logo files (PNG + SVG), kept for reference
```

---

## Brand system

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#1c241e` | Graphite Pine — primary text and dark sections |
| `--forest` | `#283229` | Executive Pine — panels |
| `--forest-deep` | `#141915` | Midnight Canopy — footer and deepest surfaces |
| `--sage` / `--sage-deep` | `#6f7a6e` / `#3f4a42` | Meadow Mist / Highland Moss — secondary text and labels |
| `--gold` | `#c6b08a` | Golden Oak — brand gold on dark surfaces and buttons |
| `--gold-ink` | `#a8874f` | Accessible gold accent on paper |
| `--gold-label` | `#8e7344` | Small gold labels on paper |
| `--sand` / `--cream` | `#e7d9bf` / `#efe4ce` | Warm Cashmere accents and gradients |
| `--hearthstone` | `#a79a84` | Secondary neutral |
| `--paper` | `#f6f2e9` | Warm ivory page background |

Type follows the Brand Guide: **Helvetica Neue** for body, navigation and UI (with **Inter** as the self-hosted fallback), **Cormorant Garamond** for editorial display, and **Optima** for property accents. The AVORA title uses a bold sans setting that echoes the guide's display face.

---

## Content and assets to review before going live

A few items are intentionally editable placeholders:

1. **Contact details** — `info@sahangroup.lk`, `careers@sahangroup.lk`, the brand-guide phone number `077 239 9049` and “Colombo, Sri Lanka” across all four pages.
2. **Social links** — footer and mobile-menu `href="#"` placeholders for Instagram, LinkedIn and Facebook.
3. **Careers roles** — the six openings and their requirements are sample content, written to show the layout. Replace them with live roles.
4. **AVORA and Properties** — status, typology, amenities, location, “first address” wording and enquiry routes should be confirmed by the project team. The note “Images are artist’s impressions…” is included on the home gallery.
5. **Photography** — AVORA visuals are cropped and colour-graded from the supplied `EXTERIOR.pdf` renders. Food & beverage, hospitality and the three commitment photographs (solar, produce market, studio team) are royalty-free Unsplash images used as placeholders; swap them for owned photography when available. `_brand/` contains the original supplied logo files.
6. **Journal, commitments and social copy** — the six Journal entries, four commitments and five social captions are sample content written to demonstrate the layout. Replace them with approved stories and dates before launch, and confirm the sustainability claims with the client.
7. **Social handle** — `@sahangroup` in the On social section is a placeholder until real accounts are confirmed.
8. **Share image** — `assets/img/og-image.jpg` (1200×630). Social platforms require an absolute URL for `og:image` once the site has a domain.

The application form is intentionally backend-free: it validates the fields, then opens the visitor’s email app with a pre-filled message to `careers@sahangroup.lk`. Connect it to a form service or ATS if you want in-page submissions.

---

## Interactions

- Sticky header that changes from transparent to ivory, with a dark logo swap.
- Full-screen mobile navigation with keyboard `Esc` support and scroll locking.
- Reveal-on-scroll for text and images (disabled automatically for `prefers-reduced-motion`).
- Parallax on the home hero (desktop only).
- Sticky section nav with scrollspy on Verticals, including the Properties collection tab.
- Property card with AVORA details, amenity strip and direct enquiry actions.
- Swimlane carousels (Journal and On social): scroll-snap, arrow controls, dot navigation, keyboard arrows, and disabled states at each end.
- Rounded "mask" corners on cards, media and section ends, echoing Unilever's soft content blocks.
- Journal, Commitments and On social modules add editorial depth; social tiles open the shared lightbox with captions.
- Accessible AVORA gallery lightbox: arrow keys, `Esc`, focus handling, captions.
- FAQ-style role accordions using native `<details>`.
- Responsive `srcset` variants for the largest images.


---

## Unilever-inspired UI notes

The client asked for the feel of [unilever.com](https://www.unilever.com/). The following patterns were adapted, never copied outright, and kept inside the Sahan brand palette and type system:

| Unilever pattern | Sahan implementation |
| --- | --- |
| Large rounded section ends and card masks | `--radius-section`, `--radius-mask` and `.section--round`; the next section shows through each bottom-right curve |
| Tag pills flush to the media edge | `.tag` on Journal cards, gold with ink text |
| News card grid and swimlane | `.swimlane` + `.ncard`: 3-up desktop, 2-up tablet, 82% peek on phones, with arrows and dots |
| Four-pillar sustainability block | Commitments section with `.pillars` and four masked images |
| "On social media" strip with modal | Social swimlane; each tile opens the existing accessible lightbox with its caption |
| Underlined card titles that clear on hover | `.ncard__title span` underline animation |
| Pill buttons with a moving arrow | `.btn` now uses a full pill radius; arrow slides on hover |

Content added for the demo: six Journal entries, four commitments, and five social captions. All of it is sample copy — see the list below.

---

## Deploying

Upload the folder contents to any static host (Netlify, Vercel, Cloudflare Pages, S3, cPanel). No server-side runtime is needed. Keep `index.html` at the web root.
