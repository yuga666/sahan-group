# Sahan Group — website

![Sahan Group homepage](preview/home-hero.jpg)

A static, four-page website for Sahan Group, inspired by the structure and pacing of [jxg.lk](https://jxg.lk/) and rebuilt in the Sahan brand palette: forest greens, paper ivory and brand gold.

Pages: **Home**, **About us**, **Verticals**, **Careers**.

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
index.html                 Home — hero, who we are, three verticals, AVORA, principles, careers
about.html                 About us — story, chapters, values, quote, the group
verticals.html             Verticals — food & beverage, hospitality, real estate (sticky section nav)
careers.html               Careers — culture, benefits, open roles, hiring process, application form

assets/css/styles.css      Design system, layout, components, responsive rules
assets/js/main.js          Navigation, reveal-on-scroll, scrollspy, lightbox, form handling
assets/fonts/fonts.css     Cormorant Garamond + Inter (latin subsets, embedded as data URIs)
assets/img/                Photography, AVORA renders, logo lockups, favicon, social image
_brand/                    Original supplied logo files (PNG + SVG), kept for reference
```

---

## Brand system

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#1c241e` | Primary charcoal green (body text, dark sections) |
| `--forest` | `#232c26` | Deep green panels |
| `--sage` / `--sage-deep` | `#6f7a6e` / `#3f4a42` | Secondary text, labels |
| `--gold` | `#b3976a` | Brand gold on dark backgrounds |
| `--gold-ink` | `#a8874f` | Gold accents on paper (contrast-adjusted) |
| `--gold-label` | `#8e7344` | Small gold labels on paper |
| `--sand` / `--cream` | `#d8c6a6` / `#e7d9bf` | Light gold accents and gradients |
| `--paper` | `#f7f4ee` | Ivory page background |

Type: **Cormorant Garamond** for display and editorial copy, **Inter** for labels, navigation and UI. Both are self-hosted variable fonts.

---

## Content and assets to review before going live

A few items are intentionally editable placeholders:

1. **Contact details** — `info@sahangroup.lk`, `careers@sahangroup.lk` and “Colombo, Sri Lanka” across all four pages.
2. **Social links** — footer and mobile-menu `href="#"` placeholders for Instagram, LinkedIn and Facebook.
3. **Careers roles** — the six openings and their requirements are sample content, written to show the layout. Replace them with live roles.
4. **AVORA details** — status, typology, amenities, location and enquiry route should be confirmed by the project team. The note “Images are artist’s impressions…” is included on the gallery.
5. **Photography** — AVORA visuals are cropped and colour-graded from the supplied `EXTERIOR.pdf` renders. Food & beverage and hospitality photographs are royalty-free Unsplash images used as placeholders; swap them for owned photography when available. `_brand/` contains the original supplied logo files.
6. **Share image** — `assets/img/og-image.jpg` (1200×630). Social platforms require an absolute URL for `og:image` once the site has a domain.

The application form is intentionally backend-free: it validates the fields, then opens the visitor’s email app with a pre-filled message to `careers@sahangroup.lk`. Connect it to a form service or ATS if you want in-page submissions.

---

## Interactions

- Sticky header that changes from transparent to ivory, with a dark logo swap.
- Full-screen mobile navigation with keyboard `Esc` support and scroll locking.
- Reveal-on-scroll for text and images (disabled automatically for `prefers-reduced-motion`).
- Parallax on the home hero (desktop only).
- Sticky section nav with scrollspy on Verticals.
- Accessible AVORA gallery lightbox: arrow keys, `Esc`, focus handling, captions.
- FAQ-style role accordions using native `<details>`.
- Responsive `srcset` variants for the largest images.

---

## Deploying

Upload the folder contents to any static host (Netlify, Vercel, Cloudflare Pages, S3, cPanel). No server-side runtime is needed. Keep `index.html` at the web root.
