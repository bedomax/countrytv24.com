# Tasks: Handle Unavailable YouTube Videos Gracefully

**Input**: Design documents from `/specs/001-handle-broken-videos/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Not requested — manual browser testing per quickstart.md is the validation approach.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing project structure and prepare for changes. No new directories needed — all changes land in existing files or one new file.

- [x] T001 Read and understand existing `apps/web/public/app.js` to locate `initPlayer()`, `onPlayerStateChange`, `playSong()`, `playNext()`, and the playlist load section
- [x] T002 Read `apps/web/public/playlist.json` to confirm current song entry schema and identify any entries already missing `youtubeId`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the playlist data model to support availability state. This is required before US1 (frontend filtering) and US3 (health check tool) can be implemented.

**⚠️ CRITICAL**: US1 sidebar filtering and US3 depend on the `unavailable` field existing in the schema.

- [x] T003 Verify `apps/web/public/playlist.json` schema is compatible with adding an optional `unavailable: boolean` field per song entry (field must be absent or `false` for existing entries — no migration required per data-model.md D-003)

**Checkpoint**: Data model verified — user story implementation can begin

---

## Phase 3: User Story 1 — Auto-Skip Broken Videos During Playback (Priority: P1) 🎯 MVP

**Goal**: When the YouTube player encounters an unavailable video (error codes 2, 100, 101, 150), automatically call `playNext()`, log the broken video ID to `console.warn`, and store it in `sessionStorage["brokenVideoIds"]` to prevent retrying it in the same session. If every video is unavailable, show a user-friendly message.

**Independent Test**: Set `"youtubeId": "AAAAAAAAAAA"` on the first song in `playlist.json`, run `npm run dev`, open `http://localhost:3000`, confirm the player skips within 3 seconds and logs `[CountryTV24] Video error 100` in the console. Revert after testing.

### Implementation for User Story 1

- [x] T004 [US1] Add `onError: onPlayerError` to the `events` object inside `initPlayer()` in `apps/web/public/app.js`
- [x] T005 [US1] Implement `onPlayerError(event)` function in `apps/web/public/app.js` — handles error codes 2, 100, 101, 150 (actionable: call `playNext()`), logs `console.warn` with videoId and song title, appends videoId to `sessionStorage["brokenVideoIds"]`; error code 5 logs only without skipping
- [x] T006 [US1] Modify `playSong(index)` in `apps/web/public/app.js` to check `sessionStorage["brokenVideoIds"]` before calling `player.loadVideoById()` and call `playNext()` if the song's `youtubeId` is already in the broken list
- [x] T007 [US1] Add empty-playlist guard in `apps/web/public/app.js` — after applying the `unavailable` filter (T009), if `playlist.length === 0` display a user-friendly "No content available" message in the Now Playing area instead of calling `playSong(0)`

**Checkpoint**: US1 complete — auto-skip works on broken videos, sessionStorage blacklist prevents retries, empty-playlist edge case handled

---

## Phase 4: User Story 2 — Broken Videos Removed from Playlist View (Priority: P2)

**Goal**: Songs with `unavailable: true` in `playlist.json` are excluded from the active playlist array on load and therefore never rendered in the playlist sidebar. Viewers browsing the sidebar only see playable songs.

**Independent Test**: Add `"unavailable": true` to any one song entry in `playlist.json`, reload `http://localhost:3000`, confirm that song does not appear in the playlist sidebar. Revert after testing.

### Implementation for User Story 2

- [x] T008 [P] [US2] Modify the playlist load section in `apps/web/public/app.js` — change the existing `data.songs.filter(song => song.youtubeId)` filter to `data.songs.filter(song => song.youtubeId && !song.unavailable)` so unavailable songs are excluded from `playlist` (and therefore from `renderPlaylist()` and all playback rotation)
- [x] T009 [P] [US2] Verify `apps/web/public/style.css` requires no changes — per research.md D-004, unavailable songs are hidden by exclusion (not styled), so no new CSS class is needed; confirm no stale "unavailable" CSS rules exist that might conflict

**Checkpoint**: US2 complete — sidebar shows only available songs; no song with `unavailable: true` appears

---

## Phase 5: User Story 3 — Playlist Stays Healthy Over Time (Priority: P3)

**Goal**: Create a CLI tool `backend/scrapers/validate-playlist.ts` that checks each YouTube video ID via the oEmbed endpoint (no API key required), sets `unavailable: true` on failed entries, restores `unavailable: false` on recovered entries, and writes the updated `playlist.json`. Register it as `npm run validate-playlist` in `package.json`.

**Independent Test**: Run `npx tsx backend/scrapers/validate-playlist.ts --dry-run --verbose` and confirm it reads `playlist.json`, checks video IDs, and prints `[PASS]`/`[FAIL]` per song without modifying the file. Then run without `--dry-run` and confirm `playlist.json` is updated with any unavailable flags.

### Implementation for User Story 3

- [x] T010 [US3] Create `backend/scrapers/validate-playlist.ts` — reads `apps/web/public/playlist.json`, iterates each song with a `youtubeId`, sends GET to `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={youtubeId}&format=json` with configurable concurrency (default 5) and timeout (default 5000ms)
- [x] T011 [US3] Implement availability logic in `backend/scrapers/validate-playlist.ts` — HTTP 200 → clear `unavailable` field (delete it if present); HTTP 401/403/404 → set `unavailable: true`; timeout/network error → skip song and log a warning without changing its state
- [x] T012 [US3] Implement CLI options in `backend/scrapers/validate-playlist.ts` — `--dry-run` (print results, do not write file), `--verbose` (print status for every song), `--concurrency N`, `--timeout N`; print summary: total checked, available count, newly unavailable count, already-flagged count
- [x] T013 [US3] Implement file write in `backend/scrapers/validate-playlist.ts` — after validation, update `playlist.lastUpdated` to current ISO 8601 timestamp and write the updated object back to `apps/web/public/playlist.json` (unless `--dry-run`); exit 0 on success, exit 1 on fatal errors (file not found, JSON parse error, write error)
- [x] T014 [US3] Add `"validate-playlist": "npx tsx backend/scrapers/validate-playlist.ts"` to the `scripts` section of `package.json`

**Checkpoint**: US3 complete — `npm run validate-playlist` flags broken videos and updates `playlist.json`; `--dry-run` works without modifying the file

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration verification and deployment readiness.

- [x] T015 [P] Run full quickstart.md validation: test auto-skip (P1), sidebar filtering (P2), and health check tool (P3) in sequence per the manual test steps in `specs/001-handle-broken-videos/quickstart.md`
- [x] T016 Run `npm run validate-playlist` against the live `apps/web/public/playlist.json` to flag any currently broken videos before deploying
- [x] T017 [P] Verify `apps/web/public/playlist.json` validates against `specs/001-handle-broken-videos/contracts/playlist-schema.json` after the health check run (the schema allows `unavailable: boolean` as optional)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — verifies data model compatibility; BLOCKS US2 sidebar filtering
- **US1 (Phase 3)**: Depends on Phase 2 — no dependency on US2 or US3
- **US2 (Phase 4)**: Depends on Phase 2 — T008 and T009 can run in parallel; independent of US1
- **US3 (Phase 5)**: Depends on Phase 2 — entirely backend, independent of US1 and US2
- **Polish (Phase 6)**: Depends on all desired user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. No dependency on US2 or US3.
- **US2 (P2)**: Can start after Phase 2. T008 (filter) is independent of US1 T004–T007 (error handler) since they touch different lines in `app.js` — but should be done sequentially to avoid merge conflicts.
- **US3 (P3)**: Entirely separate file (`validate-playlist.ts`). Can start after Phase 2 in parallel with US1 and US2.

### Within Each User Story

- US1: T004 → T005 → T006 → T007 (sequential — each builds on the previous in `app.js`)
- US2: T008 and T009 can run in parallel (different files)
- US3: T010 → T011 → T012 → T013 → T014 (sequential — building the same file)

### Parallel Opportunities

- US1 T004–T007 are sequential (same function/file region)
- US2 T008 (`app.js` filter) and T009 (`style.css` check) are [P] — different files
- US3 T010–T014 are sequential (building one new file)
- US3 as a whole can run in parallel with US1 and US2 (entirely separate file)
- Phase 6: T015 and T017 are [P] — different concerns

---

## Parallel Example: US2 + US3 Simultaneously

```bash
# After Phase 2 is complete, these can run in parallel:

# Developer A — US2 (app.js filter change, ~10 min)
Task: "T008 [US2] Modify playlist filter in apps/web/public/app.js"
Task: "T009 [US2] Verify apps/web/public/style.css requires no changes"

# Developer B — US3 (new validate-playlist.ts, ~45 min)
Task: "T010 [US3] Create backend/scrapers/validate-playlist.ts with oEmbed check"
Task: "T011 [US3] Implement availability logic in validate-playlist.ts"
Task: "T012 [US3] Implement CLI options in validate-playlist.ts"
Task: "T013 [US3] Implement file write in validate-playlist.ts"
Task: "T014 [US3] Add validate-playlist script to package.json"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (read app.js, playlist.json)
2. Complete Phase 2: Foundational (verify data model)
3. Complete Phase 3: US1 — auto-skip broken videos (T004–T007)
4. **STOP and VALIDATE**: Test with a known-broken video ID per quickstart.md §3
5. Deploy — this alone fixes the core "playback stops" issue

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → test auto-skip → deploy (MVP — fixes broken playback)
3. US2 → test sidebar filtering → deploy (cleaner UX)
4. US3 → test health check tool → run before next deploy (long-term playlist health)
5. Phase 6 polish → run validate-playlist → final deploy

### Solo Developer Strategy

Work sequentially in priority order:
1. Phase 1 → Phase 2 → US1 (T004–T007) → validate → deploy
2. US2 (T008–T009) → validate → deploy
3. US3 (T010–T014) → validate → run health check → deploy

---

## Notes

- [P] tasks = different files or concerns, no shared dependencies
- [Story] label maps each task to a specific user story for traceability
- Tests are not included — manual validation per `specs/001-handle-broken-videos/quickstart.md`
- US1 and US2 both modify `app.js` — if working in parallel, coordinate to avoid conflicts
- US3 creates a new file and only touches `package.json` — safe to parallelize with US1/US2
- Run `npm run validate-playlist` locally before every deployment to keep playlist clean
- No new frontend npm dependencies added; `tsx` is already available in the project
