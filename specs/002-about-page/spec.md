# Feature Specification: About Page Overlay

**Feature Branch**: `002-about-page`
**Created**: 2026-02-11
**Status**: Draft
**Input**: GitHub Issue #6 — "Página de acerca del proyecto"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open About overlay from right menu (Priority: P1)

A viewer watching CountryTV24 wants to learn about the project and find contact information. They click an "About" button in the right-side menu. A modal overlay appears on top of the current page with contact details. Music continues playing in the background.

**Why this priority**: Core functionality — without the overlay appearing, the feature doesn't exist.

**Independent Test**: Can be fully tested by clicking the About button and verifying the overlay appears with contact information while music continues playing.

**Acceptance Scenarios**:

1. **Given** a user is on the main page, **When** they click the "About" button in the right menu, **Then** a modal overlay appears displaying project contact information
2. **Given** a video is currently playing, **When** the user opens the About overlay, **Then** the video/music continues playing uninterrupted behind the overlay
3. **Given** the About overlay is open, **When** the user views the content, **Then** they see a brief project description and contact information

---

### User Story 2 - Close the About overlay (Priority: P1)

A viewer has finished reading the about/contact info and wants to return to the full viewing experience. They can close the overlay by clicking a close button, clicking outside the modal, or pressing Escape.

**Why this priority**: Equally critical — users must be able to dismiss the overlay to continue watching.

**Independent Test**: Can be tested by opening the overlay and verifying all three close methods work correctly.

**Acceptance Scenarios**:

1. **Given** the About overlay is open, **When** the user clicks the close button (×), **Then** the overlay closes and the full player view is restored
2. **Given** the About overlay is open, **When** the user clicks outside the modal content area, **Then** the overlay closes
3. **Given** the About overlay is open, **When** the user presses the Escape key, **Then** the overlay closes

---

### User Story 3 - Responsive About overlay on mobile (Priority: P2)

A mobile user taps the About button and the overlay adapts to their screen size, remaining readable and easy to dismiss on small screens.

**Why this priority**: Many users watch on phones — the overlay must be usable on all screen sizes.

**Independent Test**: Can be tested by opening the overlay on various screen widths (320px, 768px, 1024px+) and verifying content is readable and dismissible.

**Acceptance Scenarios**:

1. **Given** a user is on a mobile device (screen width < 768px), **When** they open the About overlay, **Then** the modal fills most of the screen width with readable text and a reachable close button
2. **Given** a user is on a tablet or desktop, **When** they open the About overlay, **Then** the modal is centered with appropriate max-width and padding

---

### Edge Cases

- What happens when the user presses the About button while the overlay is already open? (No-op — overlay stays open)
- What happens if the user tries to interact with the player controls while the overlay is open? (Overlay blocks interaction with underlying UI)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an "About" button in the right-side menu area
- **FR-002**: Clicking the About button MUST open a modal overlay on top of the current page
- **FR-003**: The overlay MUST display a brief project description and contact information
- **FR-004**: The overlay MUST NOT interrupt or pause video/audio playback
- **FR-005**: Users MUST be able to close the overlay via close button (×), clicking outside, or pressing Escape
- **FR-006**: The overlay MUST be responsive across mobile, tablet, and desktop viewports
- **FR-007**: The overlay MUST match the existing visual style of the application (dark theme, country branding)
- **FR-008**: The overlay MUST prevent interaction with underlying page elements while open
- **FR-009**: The overlay content MUST be in English

### Key Entities

- **About Overlay**: A modal dialog containing project description and contact details, visually consistent with the existing TV aesthetic
- **Contact Information**: An email address for contacting the project team

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: About overlay opens within 300ms of clicking the button
- **SC-002**: Music/video playback continues uninterrupted when overlay is opened and closed
- **SC-003**: Overlay is readable and dismissible on screens as small as 320px wide
- **SC-004**: All three close methods (button, outside click, Escape) work reliably
