# CLAUDE.md

This file gives Claude Code context about this project. Claude reads it automatically at the start of every session, so anything here saves you from re-explaining the same things over and over.

## Project overview

A static website built with plain HTML, CSS, and JavaScript — no frameworks, no build tools, no npm required. Files can be opened directly in a browser or served with a simple local server.

<!-- Once you know more, replace this line with 1-3 sentences about what the site is for (e.g. "A portfolio site for a photography business" or "A landing page for a local bakery"). -->

## File structure

- `index.html` — the whole site, one page, sections in order (nav, hero, services, about, work, process, final CTA, contact, footer)
- `css/style.css` — all styles: design tokens (colors, spacing, fonts) at the top, then reset, layout, and one block per section
- `js/main.js` — sticky header state, mobile menu toggle, scroll-reveal animations, footer year

<!--
Update this as the project grows. A typical static site looks like:

  index.html        — homepage
  /css/style.css     — styles
  /js/main.js         — scripts
  /images/            — image assets

List your actual folders here once they exist, so Claude knows where things live instead of guessing.
-->

## How to preview the site

Since there's no build step, you can preview changes by:
- Opening the HTML file directly in a browser (double-click it, or right-click → "Open with"), or
- Running a local server from this folder, e.g. `python3 -m http.server`, then visiting `http://localhost:8000`

A local server is recommended over opening the file directly if the site uses `fetch()`, JS modules, or relative paths that browsers block under the `file://` protocol.

## Coding conventions

- Use semantic HTML tags (`<header>`, `<nav>`, `<main>`, `<footer>`) instead of generic `<div>`s where it makes sense.
- Keep CSS in the `css/` folder, not inline in HTML, unless it's a one-off style.
- Keep JavaScript in the `js/` folder, not inline in HTML.
- Prefer plain, readable JavaScript over clever one-liners — this makes it easier to learn from and debug later.

## Notes for Claude

- This is a learning project as well as a real site, so briefly explain non-obvious code choices in plain language when making changes.
- Don't introduce a framework, bundler, or npm dependency unless explicitly asked — the goal is to keep this a simple, dependency-free static site.
