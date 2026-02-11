# Plan: About Page Overlay

**Branch**: `002-about-page` | **Date**: 2026-02-11 | **Spec**: [spec.md](spec.md)

## Summary

Add an "About" button to the right-side controls (bottom-bar) that opens a modal overlay with a brief project description and email contact info. The overlay appears on top of the player without interrupting playback, matching the existing dark/glassy aesthetic.

## Files to Change

| File | Action | What Changes |
|------|--------|-------------|
| `apps/web/public/index.html` | Modify | Add About button to `.controls` div and About modal overlay HTML |
| `apps/web/public/app.js` | Modify | Add open/close logic for About modal (click, outside click, Escape) |
| `apps/web/public/style.css` | Modify | Add styles for About modal overlay + button + responsive |

## Implementation Steps

1. **`index.html`** — Add an "About" button (with info icon SVG) to the `.controls` div in the bottom-bar, after the existing memory button. Add the About modal overlay HTML before `</body>`: a semi-transparent backdrop div containing a centered modal with heading, short project description, email contact, and close button (×).

2. **`style.css`** — Add styles for:
   - `.about-overlay` — Fixed fullscreen backdrop (`z-index: 50`, semi-transparent black, backdrop-filter blur), hidden by default, shown with `.open` class using fade-in transition
   - `.about-modal` — Centered card (max-width ~500px) with dark glassy background matching existing sidebar aesthetic (rgba black, blur, border)
   - `.about-modal` close button — Reuse existing `.close-btn` pattern
   - Responsive rules for mobile (modal fills ~90% width on screens < 768px)

3. **`app.js`** — Add:
   - `toggleAboutModal()` / `closeAboutModal()` functions
   - Wire About button click in `setupUI()`
   - Close on backdrop click (click on `.about-overlay` but not `.about-modal`)
   - Add Escape key handling in existing `keydown` listener (already closes playlist/memory, add about modal)
   - Exclude about modal from `handleUserInteraction` unmute logic

## Testing

- [ ] Click About button — overlay appears with project info and email
- [ ] Music continues playing while overlay is open
- [ ] Close via × button, clicking outside modal, and pressing Escape all work
- [ ] Cannot interact with player controls while overlay is open
- [ ] Responsive: modal readable on 320px, 768px, 1024px+ screens
- [ ] Opening About while playlist/memory sidebar is open closes them first
