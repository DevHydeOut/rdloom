# Changelog

All notable changes to rdloom are listed here. The library is below version 1.0, so every component is marked experimental: a prop or a name can still change in a minor release, and each change is listed below. Your copy of a component only changes when you run `rdloom upgrade`.

## 0.3.1

### Improved

- TimeSlotPicker: a new `refreshKey` prop loads the times for the day on show again, and the picker reloads by itself after `onSelect` succeeds, so a booked time shows as taken.
- Sources: a new `headingLevel` prop (1 to 6, default 4) so the heading fits under the one above it.
- CLI: `rdloom list` also marks an item as outdated when its files changed upstream without a version change.
- CLI: the lock file records the newest CLI that wrote it, and an older CLI refuses to `upgrade` over it unless you pass `--force`.

### Fixed

- Backlight: the glow keeps animating under reduced motion, because the rule that stops it was less specific than the rules that start it.
- NumberField: typed values no longer snap to a whole number when no `step` is set (19.99 stayed 20). `step` has no default now; the buttons still change the value by 1.
- Carousel: the scrolling area is now keyboard focusable (it is the one tab stop, and the arrow keys work from it).
- CardMedia: an empty `alt` without `decorative` is treated as decorative instead of exposing an unnamed image.
- CLI: conflict markers left by an earlier upgrade are reported by `diff` and `upgrade` (exit code 1) instead of "up to date".
- CLI: the motion `@import` added to the tokens file is no longer shown as your edit.
- CLI: a corrupt `rdloom.lock.json` or `rdloom.json` fails with a short message instead of a stack trace.

## 0.3.0

### Added

- **Motion and effects: 69 components**, each optional and installed with its own `rdloom add`. They stand still for visitors who prefer reduced motion and can be paused.
  - Text: shimmer, typing, word rotate, text reveal, text animate, hyper text, kinetic, spinning, morphing, sparkles, aurora, line shadow, 3D flip, comic, highlighter, scroll velocity, video text and gradient text.
  - Buttons: shimmer, rainbow, shiny, pulse, ripple, reveal, gradient and an interactive hover button.
  - Backgrounds: grid, dot, striped and hexagon patterns, an interactive grid, a flickering grid, a retro grid, light rays, noise and a weave grid, plus ripple, meteors, particles and confetti.
  - Layout and content: bento grid, terminal, code comparison, dock, marquee, animated list, animated beam, number ticker, circular progress, orbiting circles, icon cloud, backlight, blur fade, selvedge blur, scroll progress, spotlight and glare cards, shine and shuttle borders.
  - Media and interaction: lens, pixel image, hero video dialog, globe, dotted map, device frames, a social post card, a smooth cursor, a pointer, a theme toggler and a file tree.
- A simulated end-to-end Chat example: send, streaming, tool approval, failure and Try again.
- A Maturity note and a status badge on every component card in the docs, and a FAQ entry on stability.

### Changed

- The docs no longer call the library "production-ready" while every component is experimental.
- Docs search finds components by their code names (`DataGrid`, `TextField`) as well as their display names.
- Copy buttons in the docs fall back to a hidden selection when the clipboard is blocked, and say so when both fail.
- The Invite example names the problem with a wrong email address.
- `npm run smoke:mcp` builds the MCP server first, and the sample app stops with a clear message when the components are not installed yet.

### Fixed

- Dock: a grown icon moves its neighbours aside instead of covering them.
- Lens: the enlarged copy no longer lets the original text show through.
- Ripple and RippleButton: rings and waves are centred on the right point.
- Globe: no longer throws while its container has no size yet.
- Glare Hover: the default glare is visible on light surfaces.

## 0.2.0

- The CLI (`rdloom`) and the MCP server (`@rdloom/mcp`) with the core components and blocks, the docs site, the AI components and the Figma data.
