# Paradise Stay — Modern Luxury Villa Website

This folder is the rebranded and redesigned version of the original static villa website.

## What changed

- Rebranded visible website identity to **Paradise Stay** across all live site pages.
- Added a shared modern luxury design system with deep forest, ivory and champagne-gold styling.
- Added glass surfaces, refined cards, hover depth, scroll reveal motion, a scroll progress indicator and ambient desktop pointer glow.
- Added a rotating homepage hero using images already bundled in the project.
- Improved responsive styling for mobile, tablet and desktop layouts.
- Modernized both newer Tailwind pages and 68 legacy villa-detail pages.
- Replaced generic legacy villa page titles with the actual villa/property name for clearer page titles.
- Fixed legacy villa slider background paths.
- Fixed two malformed villa image references that used `.url` instead of valid image files.
- Fixed nested dynamic villa-detail relative navigation and asset paths.
- Fixed the villa-list mobile navigation menu.
- Fixed legacy detail/gallery search forms so searches open the villa collection and pass filters correctly.
- Updated the gallery page from copied “Villa Catalogue” presentation to the Paradise Stay navigation/theme.
- Preserved villa names, locations, pricing, descriptions, contact phone numbers and other listing data.

## Operational data intentionally preserved

`CNAME` is configured for **paradisestay.online** and contact email links use **hello@paradisestay.online**.

## Preview locally

From this folder, run:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080/` in a browser.

## Main Paradise Stay theme files

- `public/villago-theme.css`
- `public/villago-theme.js`

The shared theme is linked across the 78 live HTML pages in the root and `villa-detail/` folders.
