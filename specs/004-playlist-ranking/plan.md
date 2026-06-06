# Plan: Playlist Ranking Display

**Branch**: `004-playlist-ranking` | **Date**: 2026-06-05 | **Spec**: [spec.md](spec.md)

## Summary

Replace `song.position` (a static scrape-time field) with the live display index in `renderPlaylist()` so numbers always show 1, 2, 3… in current playlist order. Add `#` prefix and zero-padding for the chart countdown aesthetic.

## Files to Change

| File | Action | What Changes |
|------|--------|-------------|
| `apps/web/public/app.js` | Modify | `renderPlaylist()` line 285: replace `#${song.position}` with `#${String(index + 1).padStart(2, '0')}` |
| `apps/web/public/style.css` | Modify | `.song-number` — bump font-size slightly and set a fixed `min-width` so two-digit numbers don't shift layout |

## Implementation Steps

1. **[app.js:285]** In `renderPlaylist()`, change the `.song-number` innerHTML from `#${song.position}` to `#${String(index + 1).padStart(2, '0')}`. The `index` variable is already the correct display-order index from the `forEach`.

2. **[style.css:.song-number]** Set `min-width: 44px` (up from `40px`) to accommodate zero-padded two-digit numbers without layout shift, and confirm color/size still reads well on mobile.

## Testing

- [ ] Open playlist sidebar — verify songs show `#01`, `#02`, `#03`… in order
- [ ] Reload the page (playlist reshuffles) — verify numbers still start at `#01` and are contiguous
- [ ] Scroll to the end of the 96-song playlist — verify last item shows `#96`
- [ ] Click a song to play it (active highlight) — verify rank number is still visible
- [ ] Resize to 320px width — verify rank numbers don't overflow or overlap title/artist text
