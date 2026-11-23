# Security audit — 23 Nov 2026

Scope: every page (`index`, `about`, `verticals`, `properties`, `careers`, `404`),
`assets/js/main.js`, `assets/js/properties.js`, the admin editor (`admin/`),
`data/*.json`, `netlify.toml`, `robots.txt`, `sitemap.xml`, `.gitignore`, the
test harness, and the full git history (22 commits, all branches).

Two facts change several checks compared with a generic checklist:

- **The forms do not post anywhere.** The Careers and AVORA forms build an email
  in the visitor's own mail app (`mailto:`). Nothing is stored by Netlify Forms,
  and the CV file is never uploaded. Spam, rate limiting and upload storage
  therefore have no server side to protect today.
- **There is an admin area** at `/admin/`. It has no password of its own: it does
  nothing until someone pastes a GitHub fine-grained token, and every change it
  makes is a commit to the `yuga666/sahan-group` repo through the GitHub API.
  The token is the key to the site.

## The 20 checks

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | Hide API keys | Pass | No keys in the code or anywhere in git history (scanned for GitHub, AWS, Stripe, Google, Slack and private-key patterns). |
| 2 | Env variables | Pass | None used. Any future secret goes in Netlify env vars, scoped to Functions. |
| 3 | Keys in git | Fixed + manual | `.gitignore` now also covers `.env`, `.env.*`, `*.pem`, `*.key`, `.claude-tmp/`. Manual: confirm the repo is private; turn on secret scanning + push protection. |
| 4 | Protect admin routes | Pass, manual | `/admin/` is `noindex`, disallowed in robots, `no-store`, and useless without a token. Manual: use a fine-grained token limited to this one repo, Contents only, with an expiry (≤ 90 days); revoke it if a laptop is lost. |
| 5 | Add auth | Pass | Admin auth = GitHub token (checked by GitHub). Public pages need none. |
| 6 | User permissions | Manual | GitHub, Netlify and the domain registrar: owner on a company email, 2FA on, only the people who need it. |
| 7 | Sanitize inputs | Pass | All fields have `maxlength`, `type=email/tel/url`, `required`; values are only URL-encoded into a `mailto:` link, never put into the page. |
| 8 | XSS | Pass + fixed | No `innerHTML`/`eval` in site JS; property cards use `textContent` and allow-listed image/link patterns. CSP tightened. Admin "Change text" now escapes `"` so replacement text cannot break out of an `alt`/`title` attribute. |
| 9 | SQL injection | N/A | No database. |
| 10 | DB rules | N/A | No database. `data/*.json` is static and only writable through GitHub. |
| 11 | Rate limiting | N/A today | No server endpoint to flood. If forms move to Netlify Forms later, add `netlify-honeypot="bot-field"` and turn on spam filtering. |
| 12 | Spend cap | Manual | Netlify: stay on Free or set usage alerts / a credit limit. |
| 13 | File uploads | Pass | CV is never uploaded. `accept=".pdf,.doc,.docx"`, single file, JS rejects other types and > 5 MB. Admin photos are limited to webp/jpeg/png and safe file names. |
| 14 | CSRF | N/A | No cookies or sessions. The admin token lives in `sessionStorage` (cleared when the tab closes) and is sent as a header, which forms on other sites cannot do. |
| 15 | CORS | Pass | No `Access-Control-Allow-Origin` header is set. |
| 16 | HTTPS | Fixed + manual | HSTS raised to 2 years; `upgrade-insecure-requests`. `og:image` is now an absolute `https://sahangroup.lk/…` URL. Manual: turn on Force HTTPS in Netlify once the domain is attached; add HSTS `preload` only after the domain is final. |
| 17 | Security headers | Fixed | Already had HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP. Added COOP, X-Permitted-Cross-Domain-Policies; modernised Permissions-Policy; CSP `frame-src 'none'`, `worker-src 'none'`, `manifest-src 'self'`. |
| 18 | Secure cookies | N/A | The site sets no cookies. Add a cookie notice if analytics are added. |
| 19 | Debug mode | Pass | No `console.log`, source maps or debug flags. |
| 20 | Prod settings | Fixed + manual | Custom 404, sitemap, robots exist. `_brand/`, `preview/`, `tests/`, `docs/`, `README.md`, `CHANGELOG.md`, `netlify.toml`, `.gitignore` now answer 404 on the live site. Manual: test the live URL at securityheaders.com (target A) after deploy. |

## Dependencies

| Dependency | Where | Version | Risk |
|---|---|---|---|
| Inter (variable) | `assets/fonts/inter-var.woff2`, self-hosted | bundled file | Low. OFL licence, no CDN. |
| Cormorant (variable + italic) | `assets/fonts/`, self-hosted | bundled files | Low. OFL licence, no CDN. |
| GitHub REST API | `api.github.com`, admin only | v3 / `2022-11-28` | Medium: whoever holds the token can edit the site. Mitigated by scoped, expiring tokens. |
| Google Maps | outbound links only (`maps.app.goo.gl`) | n/a | Low. Plain links with `rel="noopener"`, no embed or script. |
| Playwright | `tests/package.json`, dev only, never deployed | `^1.48.0` (resolves to 1.65.1) | Low. `npm audit`: 0 vulnerabilities. |
| Netlify | hosting, headers, redirects | platform | Account security is the main risk (2FA). |

No third-party scripts, CDNs, analytics, frameworks, build tools or `package.json`
for the website itself. Everything the browser loads comes from the site's own
domain, plus `api.github.com` on the admin page.
