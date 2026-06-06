# Feature Specification: Playlist Ranking Display

**Feature Branch**: `004-playlist-ranking`  
**Created**: 2026-06-05  
**Status**: Draft  
**GitHub Issue**: #9 — Ordenar los numeros del playlist

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Ranked Playlist (Priority: P1)

A viewer opens the playlist sidebar and sees all songs listed with clear, sequential rank numbers (1, 2, 3…) so they can quickly identify a song's position and treat the list as a countdown/top-chart experience.

**Why this priority**: Core of the issue — the current numbering is unordered and confusing. Fixing it delivers the full value of the feature.

**Independent Test**: Open the playlist sidebar; every song has a visible rank number that starts at 1 and increments by 1 with no gaps or out-of-order values.

**Acceptance Scenarios**:

1. **Given** the playlist sidebar is open, **When** the page loads, **Then** each song shows its sequential rank number (1, 2, 3…) in order of display.
2. **Given** the playlist has 96 songs, **When** a viewer scrolls to the bottom, **Then** the last song shows rank #96 with no gaps.
3. **Given** a song is currently playing (highlighted), **When** viewing the sidebar, **Then** its rank number is still visible alongside the highlight styling.

---

### User Story 2 - Stylized Rank Format (Priority: P2)

A viewer sees rank numbers formatted in a style that matches the TV broadcast aesthetic (e.g., `#01`, `#02`) rather than plain integers, reinforcing the "chart countdown" feel.

**Why this priority**: Enhancement to P1 — adds polish without affecting core functionality.

**Independent Test**: Rank numbers use a consistent formatted style (e.g. leading zeros or `#` prefix) and do not clash with the live TV visual theme.

**Acceptance Scenarios**:

1. **Given** rank 1–9, **When** displayed in the sidebar, **Then** numbers use consistent zero-padding or prefix (e.g., `#01`–`#09`).
2. **Given** any rank number, **When** viewed on mobile, **Then** the number is fully visible and does not overflow or overlap song title/artist text.

---

### Edge Cases

- What happens when the playlist is empty? → No numbers shown; empty state handled gracefully.
- What happens when a song is added dynamically (e.g., from Spotify integration)? → New song appended at the end with the next sequential rank.
- How does numbering behave after the playlist reshuffles on reload? → Numbers always reflect current display order (1 = first in current list), not original chart rank.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The playlist sidebar MUST display a sequential rank number next to each song, starting at 1.
- **FR-002**: Rank numbers MUST be contiguous — no gaps, duplicates, or out-of-order values.
- **FR-003**: Rank numbers MUST be styled consistently with the live TV aesthetic (formatted as `#01`, `#02`, etc.).
- **FR-004**: Rank numbers MUST remain visible when a song is highlighted (currently playing).
- **FR-005**: Rank numbers MUST be responsive — fully readable on mobile without layout breakage.
- **FR-006**: The existing TV visual effects (scan lines, noise, vignette) MUST be preserved around the playlist area.

### Key Entities

- **Playlist Item**: A song entry in the sidebar — has a rank (position in current display order), title, and artist.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every song in the rendered playlist displays a unique, sequential rank number with zero gaps.
- **SC-002**: On a 96-song playlist, ranks run from #01 to #96 in visual order.
- **SC-003**: The rank display is visible on screens as narrow as 320px without text overflow.
- **SC-004**: No regression in existing TV effects or playlist interaction (highlighting, click-to-play, scrolling).
