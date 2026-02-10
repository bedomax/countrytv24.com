# Feature Specification: Handle Unavailable YouTube Videos Gracefully

**Feature Branch**: `001-handle-broken-videos`
**Created**: 2026-02-10
**Status**: Draft
**Input**: GitHub Issue #4 - Handle unavailable YouTube videos gracefully

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Auto-Skip Broken Videos During Playback (Priority: P1)

A viewer is watching CountryTV24 and the current song's video has been removed or blocked by YouTube. Instead of seeing an error screen and having playback stop, the player automatically detects the problem and moves to the next available song without any action required from the viewer.

**Why this priority**: This is the most disruptive user experience issue — playback stopping unexpectedly breaks the core "24/7 live stream" promise of the platform. Fixing this restores continuous playback with no user effort.

**Independent Test**: Can be fully tested by loading a known-broken video ID in the player and verifying it skips to the next song automatically, delivering uninterrupted playback.

**Acceptance Scenarios**:

1. **Given** a song with an unavailable video ID is queued to play, **When** the player attempts to load that video, **Then** the player automatically skips to the next song within 3 seconds without displaying a YouTube error to the viewer.
2. **Given** multiple consecutive broken videos exist in the playlist, **When** each one is encountered during playback, **Then** the player continues skipping until it finds a working video and resumes playback.
3. **Given** all videos in the playlist are unavailable, **When** the player encounters this situation, **Then** the viewer sees a clear message that no content is currently available rather than a cryptic error.

---

### User Story 2 - Broken Videos Removed from Playlist View (Priority: P2)

A viewer browsing the playlist sidebar does not see songs with broken videos cluttering the list. Videos that are known to be unavailable are either hidden or visually marked so the viewer knows they cannot be selected.

**Why this priority**: Improves playlist quality and viewer trust. Reduces the chance of a viewer manually selecting a broken song and experiencing a poor playback experience.

**Independent Test**: Can be tested by checking that songs with known-broken video IDs are not displayed (or are marked unavailable) in the playlist sidebar, delivering a cleaner content browsing experience.

**Acceptance Scenarios**:

1. **Given** the playlist contains songs with unavailable videos, **When** the viewer opens the playlist sidebar, **Then** those songs are either hidden or clearly marked as unavailable.
2. **Given** a viewer manually selects a song that has a broken video, **When** the player attempts to load it, **Then** the player skips it and plays the next available song, showing a brief notice to the viewer.

---

### User Story 3 - Playlist Stays Healthy Over Time (Priority: P3)

The platform's song list is automatically kept up-to-date by removing or flagging songs whose videos have become unavailable, so that future viewers always encounter a working playlist.

**Why this priority**: Prevents the playlist from degrading over time as YouTube videos get removed. Reduces the frequency of the P1 playback-stopping issue for all future viewers.

**Independent Test**: Can be tested by running the playlist validation process and verifying that previously unavailable songs are flagged or removed from the playlist data file.

**Acceptance Scenarios**:

1. **Given** a song in the playlist has a video that is no longer available on YouTube, **When** the periodic playlist health check runs, **Then** that song is flagged or removed from the playlist.
2. **Given** a song has been flagged as having an unavailable video, **When** the scraping process finds a working replacement video for that song, **Then** the song is restored to the playlist with the new video.

---

### Edge Cases

- What happens when the entire playlist consists of broken videos? → Viewer sees a user-friendly "no content available" message.
- What happens when a video becomes unavailable mid-playback (e.g., live restriction changes)? → Player detects the error event and skips within 3 seconds.
- What happens when the broken-video detection triggers on a slow network connection (buffering delay vs. actual unavailability)? → System waits for a confirmed error event from the player rather than a timeout, to avoid false positives on slow connections.
- What happens when a broken song is the last in the playlist? → Player loops back to the beginning, skipping the broken entry.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The player MUST detect when a video is unavailable (removed, blocked, or private) and automatically advance to the next song without stopping playback.
- **FR-002**: The player MUST skip broken videos within 3 seconds of encountering an error, with no action required from the viewer.
- **FR-003**: The player MUST NOT display a raw YouTube error screen to viewers when a video is unavailable.
- **FR-004**: The playlist sidebar MUST visually distinguish or hide songs whose videos are confirmed unavailable.
- **FR-005**: The system MUST provide a mechanism to validate all video IDs in the playlist and flag those that are unavailable.
- **FR-006**: Flagged or unavailable songs MUST be excluded from normal playback rotation.
- **FR-007**: The system MUST handle the edge case where all playlist videos are unavailable, displaying a user-friendly message.
- **FR-008**: When skipping a broken video, the system MUST record the broken video ID so it can be reviewed and removed from the playlist.

### Key Entities

- **Song**: A playlist entry with a title, artist, and video reference. A song can be in one of these states: Available, Unavailable, or Unverified.
- **Playlist**: The ordered collection of songs used for playback and displayed in the sidebar. Only Available songs participate in active rotation.
- **Video Error Event**: A signal from the player indicating a video cannot be loaded or played, distinct from a temporary buffering or network delay.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Playback continues automatically within 3 seconds when an unavailable video is encountered, with no viewer interaction required.
- **SC-002**: Viewers never see a raw YouTube error screen during normal playback; 100% of video errors result in an automatic skip or a friendly message.
- **SC-003**: After a playlist health check runs, fewer than 5% of songs in the active rotation have unavailable videos.
- **SC-004**: A viewer browsing the playlist sidebar encounters zero songs that, when selected, result in a playback-stopping error without automatic recovery.
- **SC-005**: The platform maintains uninterrupted playback for at least 95% of a typical viewing session (30+ minutes), measured by the absence of stuck error screens.

## Assumptions

- The YouTube player emits distinct, detectable error events for unavailable videos, allowing reliable differentiation from slow-network buffering.
- The existing playlist contains enough working videos that, after removing unavailable ones, at least 10 active songs remain playable.
- Playlist health checks are a background or scheduled operation and do not run on every page load.
- This feature applies to all anonymous viewers — no user account or login is required.
- "Unavailable" encompasses videos that are deleted, set to private, or geo-blocked for the majority of viewers.
