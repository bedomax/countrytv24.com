# Implementation Plan: Handle Unavailable YouTube Videos Gracefully

**Branch**: `001-handle-broken-videos` | **Date**: 2026-02-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-handle-broken-videos/spec.md`

## Summary

Add robust error handling for unavailable YouTube videos (deleted, private, geo-blocked) by:
1. Wiring the YouTube IFrame API `onError` event to auto-skip to the next song within 3 seconds.
2. Filtering unavailable songs from the playlist sidebar and playback rotation.
3. Providing a background playlist health-check tool that flags unavailable video IDs in `playlist.json`.

## Technical Context

**Language/Version**: JavaScript (ES2020, browser) + TypeScript (Node.js 18+, backend)
**Primary Dependencies**: YouTube IFrame Player API (existing), Playwright (existing scraper tooling)
**Storage**: `apps/web/public/playlist.json` (flat JSON file, no database)
**Testing**: Manual browser testing + Node.js script for playlist validation
**Target Platform**: Browser (Chrome, Firefox, Safari, mobile) + Vercel Serverless (API)
**Project Type**: Web application (vanilla JS frontend + Node.js/TypeScript backend tools)
**Performance Goals**: Error detected and skip triggered within 3 seconds of video error event
**Constraints**: No new npm dependencies in frontend; must work without user login; Vercel cold-start safe
**Scale/Scope**: 135+ songs in playlist; single-page app serving thousands of concurrent anonymous viewers

## Constitution Check

*No project constitution has been ratified. Applying general web best practices as gates.*

| Gate | Status | Notes |
|------|--------|-------|
| No new frontend dependencies | PASS | YouTube IFrame API already loaded; error handling is native API usage |
| Backward-compatible data changes | PASS | Adding optional `unavailable` field to playlist.json song entries; existing code ignores unknown fields |
| No breaking changes to existing API | PASS | No API endpoints changed; viewer-count API untouched |
| Mobile-safe implementation | PASS | Error events fire identically on mobile YouTube embeds |
| Vercel-safe (no persistent state required) | PASS | Playlist JSON updated at build/scrape time; no runtime state needed |

*All gates pass. Proceeding to Phase 0.*

## Project Structure

### Documentation (this feature)

```text
specs/001-handle-broken-videos/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── playlist-schema.json
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/web/public/
├── app.js               # MODIFY: add onError handler, skip logic, sidebar filtering
├── playlist.json        # MODIFY: add optional `unavailable` field per song entry
└── style.css            # MODIFY: add styling for unavailable song indicator in sidebar

backend/
└── scrapers/
    └── validate-playlist.ts   # NEW: playlist health check tool

tools/
└── validate-playlist.ts       # Symlink or alias from backend/scrapers/ for CLI access
```

**Structure Decision**: Web application layout (existing). Frontend changes in `apps/web/public/`, new backend tool in `backend/scrapers/`. No new directories needed.

## Complexity Tracking

*No constitution violations. Section not applicable.*
