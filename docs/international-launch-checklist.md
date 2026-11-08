# Flamenco Events Agency — international launch checklist

**Target domain (not yet purchased):** `flamencoeventsagency.com`

## Current state

- English editorial site: five pages in `web-preview/*-en.html`, with real Flamenco Events images.
- Preview and the existing Spanish site are not to be changed by this launch process.
- `tools/build_international_site.py` prepares a separate, self-contained English HTML package with referenced assets.
- `.github/workflows/international-package.yml` packages and checks the files as a downloadable GitHub Actions artifact. **It does not deploy or buy anything.**
- All packaged HTML files retain `noindex,nofollow`. There is no `CNAME` or active custom domain.

## Before publishing

1. Confirm the exact .com is still available through a domain registrar and review renewal pricing; register it only after owner approval.
2. Create a **separate repository and GitHub Pages site** for the English public website, rather than pointing the existing app repository (with `portal.html` and admin pages) at the new domain.
3. Run `python3 tools/build_international_site.py --output international-build`; review the English copy, mobile layout, real photographs, logo rendering and WhatsApp link.
4. Check all relative links from the standalone package. In the provisional build, ES goes to `https://www.flamencoevents.net/`; when the Spanish Agency website has stable canonical pages, provide matching Spanish-language URLs.
5. Confirm how international customers will access client accounts. The standalone package omits the unfinished test portal link; do not expose a test/admin area from the commercial site.
6. Verify that branding, contact details, privacy/cookies/legal notices and tracking consent satisfy applicable requirements; obtain approval of copy and launch.
7. After purchase, add the domain to the **new English GitHub Pages repository first**, then configure the domain's DNS with the registrar. Avoid wildcard DNS records. See: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
8. Only once DNS resolves and HTTPS works, decide preferred hostname (`www` versus apex), configure the redirect, production canonical URLs and paired `hreflang` links, generate a sitemap, and remove `noindex,nofollow` **on the public English site's approved release only**.
9. Register the verified site in Google Search Console and validate indexing, link navigation, responsive behavior and form/WhatsApp contact.
10. Google Workspace **domain alias** for `info@flamencoeventsagency.com` is separate and optional: add it only after the domain is owned and verified. Never replace existing `info@flamencoevents.net` or its mail records.

## Safety

No DNS, MX, SPF, DKIM, DMARC, domain registration, Workspace changes, or public-site deployment is performed by the package workflow. The Spanish web, live business mail and client database remain unchanged.
