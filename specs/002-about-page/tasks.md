# Tasks: About Page Overlay

**Input**: Design documents from `/specs/002-about-page/`
**Prerequisites**: plan.md, spec.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story. US1 and US2 are both P1 and tightly coupled (open/close the same modal), so they share a phase. US3 (responsive) is a separate phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: User Story 1 & 2 - Open and Close About Overlay (Priority: P1) 🎯 MVP

**Goal**: Add an About button to the bottom-bar controls that opens a modal overlay with project description and email contact. Users can close it via × button, clicking outside, or pressing Escape. Music continues playing.

**Independent Test**: Click the About button → overlay appears with content. Close via all 3 methods. Verify music doesn't stop.

### Implementation

- [x] T001 [P] [US1] Add About button (info icon SVG) to `.controls` div after memory button, and add About modal overlay HTML (backdrop + centered card with heading, description, email, close button) before `</body>` in `apps/web/public/index.html`
- [x] T002 [P] [US1] Add styles for `.about-overlay` (fixed fullscreen backdrop, z-index: 50, semi-transparent black, backdrop-filter blur, hidden by default, `.open` class with fade-in transition) and `.about-modal` (centered card, max-width 500px, dark glassy background matching existing sidebar aesthetic) in `apps/web/public/style.css`
- [x] T003 [US1] [US2] Add `toggleAboutModal()` and `closeAboutModal()` functions, wire About button click in `setupUI()`, add backdrop click-to-close (click `.about-overlay` but not `.about-modal`), add Escape key handling in existing `keydown` listener, close playlist/memory sidebars when About opens, and exclude `.about-overlay` from `handleUserInteraction` unmute logic in `apps/web/public/app.js`

**Checkpoint**: About overlay opens and closes correctly. Music plays uninterrupted. All 3 close methods work.

---

## Phase 2: User Story 3 - Responsive Design (Priority: P2)

**Goal**: The About overlay adapts to mobile, tablet, and desktop viewports so content is readable and dismissible on all screen sizes.

**Independent Test**: Open overlay at 320px, 768px, and 1024px+ widths. Verify text is readable and close button is reachable.

### Implementation

- [x] T004 [US3] Add responsive media query for About modal (modal fills ~90% width on screens < 768px, appropriate padding, reachable close button) in existing `@media (max-width: 768px)` block in `apps/web/public/style.css`

**Checkpoint**: About overlay is fully responsive across all viewport sizes.

---

## Phase 3: Polish & Cross-Cutting Concerns

- [x] T005 Add About button keyboard shortcut (e.g., 'A' key or 'I' key) to existing `keydown` listener in `apps/web/public/app.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (US1 & US2)**: No setup needed — modifying existing files
- **Phase 2 (US3)**: Depends on T002 (base styles must exist before adding responsive overrides)
- **Phase 3 (Polish)**: Depends on T003 (toggle function must exist)

### Parallel Opportunities

- T001 and T002 can run in parallel (different files: HTML vs CSS)
- T003 depends on T001 (needs the HTML elements to wire up)

### Within Phase 1

```
T001 (index.html) ──┐
                     ├──→ T003 (app.js)
T002 (style.css) ───┘
```

---

## Implementation Strategy

### MVP First (Phase 1 Only)

1. Complete T001 + T002 in parallel (HTML + CSS)
2. Complete T003 (JavaScript logic)
3. **STOP and VALIDATE**: Test open/close/playback independently
4. Deploy if ready

### Full Delivery

1. Phase 1: T001 + T002 → T003 → MVP ready
2. Phase 2: T004 → Responsive complete
3. Phase 3: T005 → Keyboard shortcut polish

---

## Summary

- **Total tasks**: 5
- **US1 (Open overlay)**: 2 tasks (T001, T002) + shared T003
- **US2 (Close overlay)**: Shared with US1 in T003
- **US3 (Responsive)**: 1 task (T004)
- **Polish**: 1 task (T005)
- **Parallel opportunities**: T001 ∥ T002
- **MVP scope**: Phase 1 (T001–T003) — functional About overlay with open/close

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 and US2 are combined because they modify the same modal element
- Commit after each task or logical group
- Stop at Phase 1 checkpoint for a fully working MVP
