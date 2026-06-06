# Tasks: Playlist Ranking Display

**Input**: Design documents from `/specs/004-playlist-ranking/`
**Branch**: `004-playlist-ranking`
**Spec**: spec.md | **Plan**: plan.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup

**Purpose**: No new dependencies or project structure needed — vanilla JS, single files.

- [x] T001 Verify current playlist renders correctly in browser before changes (`apps/web/public/app.js`, `apps/web/public/playlist.json`)

---

## Phase 2: User Story 1 - View Ranked Playlist (Priority: P1) 🎯 MVP

**Goal**: Every song in the sidebar shows a sequential rank number matching its current display order (1, 2, 3…).

**Independent Test**: Open playlist sidebar → songs display `#01`, `#02`, `#03`… in order. Reload (reshuffles) → numbers still start at `#01` with no gaps.

### Implementation for User Story 1

- [x] T002 [US1] In `renderPlaylist()` at `apps/web/public/app.js:285`, replace `#${song.position}` with `#${String(index + 1).padStart(2, '0')}` so rank reflects display order
- [x] T003 [P] [US1] In `apps/web/public/style.css:.song-number`, update `min-width` from `40px` to `44px` to prevent layout shift with zero-padded numbers

**Checkpoint**: Playlist sidebar shows `#01`–`#96` in correct sequential order. Active song highlight still shows rank number. Mobile layout intact.

---

## Phase 3: User Story 2 - Stylized Rank Format (Priority: P2)

**Goal**: Rank numbers use a consistent `#01`–`#09` zero-padded format matching the TV broadcast aesthetic.

**Independent Test**: Check ranks 1–9 show as `#01`–`#09`, not `#1`–`#9`. Verify no overflow at 320px width.

### Implementation for User Story 2

> **Note**: T002 already implements zero-padding (`padStart(2, '0')`) and T003 adjusts `min-width`. US2 is fully delivered by the US1 tasks. Only verify styling matches theme.

- [x] T004 [US2] Visual review: confirm `.song-number` color (`rgba(255,255,255,0.4)`) and `font-size: 1.5rem` still reads well on mobile alongside `#01`-padded numbers in `apps/web/public/style.css:516-521`

**Checkpoint**: Zero-padded rank format visible and consistent on desktop and 320px mobile.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [x] T005 [P] Smoke test full playlist sidebar: scroll all 96 songs, click a song to play, check active highlight, verify TV scan-line effects still render over playlist area

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Start immediately
- **Phase 2 (US1)**: After Phase 1
- **Phase 3 (US2)**: T002 and T003 from US1 already deliver US2 — run T004 in parallel with T002/T003
- **Phase 4 (Polish)**: After all story phases complete

### Parallel Opportunities

- T002 and T003 touch different files — run in parallel
- T004 is a visual check that can happen alongside T003

### Parallel Example: User Story 1

```bash
# These can run simultaneously (different files):
Task T002: app.js - replace song.position with padded index
Task T003: style.css - update .song-number min-width
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1 — verify current state
2. Complete T002 + T003 in parallel (< 5 min total)
3. **Validate**: Open sidebar, confirm sequential padded numbers
4. Done — US2 is already satisfied by the same changes

### Total Task Count

| Phase | Tasks | Parallelizable |
|-------|-------|----------------|
| Setup | 1 | 0 |
| US1 (P1) | 2 | 2 |
| US2 (P2) | 1 | 1 |
| Polish | 1 | 1 |
| **Total** | **5** | **4** |
