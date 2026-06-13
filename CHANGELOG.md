# Maximus PWA - Changelog & Walkthroughs

> **Agent Instruction**: To conserve context window space, read only the first 200 lines of this file to review recent version history. Read further down if a task explicitly references older updates. If this file exceeds 500 lines, move older releases to [CHANGELOG_ARCHIVE.md](./CHANGELOG_ARCHIVE.md).

This file contains the persistent record of all completed tasks, architectural updates, and styling changes made to the Maximus PWA.

## [v92] - 2026-06-13

### Task: Status Name Renaming
- **Changes**:
  - Renamed `done_in_maximus` status to `ready_for_antigravity` across PWA HTML select options, JavaScript app configurations, CSS status badge colors, Supabase Edge Function evaluator prompts, helper scripts (`list_ready_tasks.ps1`), CLI arguments (`tasks.py`), and documentation.
  - Renamed `ready_in_antigravity` status to `rework_in_antigravity` across PWA HTML options, JavaScript event/visibility triggers, CSS status badge colors, Supabase Edge Function sync maps, helper scripts, CLI arguments, and documentation.
- **Cache**: Bumped service worker cache name and asset link queries to `v92`.

---

## [v91] - 2026-06-12

### Task: Remove "Ready for Maximus" Status
- **Changes**:
  - Removed `ready_for_maximus` status from all UI dropdown options (filtering, creation, editing) in `index.html`.
  - Removed `ready_for_maximus` from labels and group configurations in `app.js` and badge styling in `style.css`.
  - Updated the Supabase Edge Function `evaluate_coding_task` system prompt in `index.ts` to assign structured but unfinished tasks to `needs_clarification` instead of `ready_for_maximus`.
  - Excluded `ready_for_maximus` from valid CLI argument choices in `tasks.py`.
- **Cache**: Bumped service worker cache name and asset link queries to `v91`.

---

## [v90] - 2026-06-12

### Task: Action Button Visibility Restriction
- **Changes**:
  - Restricted the visibility of the "Action" button on coding task cards to only show for statuses belonging to the `antigravGo` group (where the agent needs to do work, e.g. `needs_plan`, `done_in_maximus`, `ready_in_antigravity`, `needs_logging`).
  - Hides the "Action" button for tasks that are under the user's court (e.g. `needs_verification`, `needs_clarification`, `in_progress`, etc.) to prevent confusing and unnecessary prompt copies.
- **Cache**: Bumped service worker cache name and asset link queries to `v90`.

---

## [v88] - 2026-06-12

### Task: Update Action Button Text per Task Status
- **ID**: `90e0cdcc-b96c-471f-862d-e5e2dac964f0`
- **Changes**:
  - Updated the action prompt template in `getPromptTextForStatus` for the `ready_in_antigravity` status.
  - The copied prompt now directs the developer to review the verification feedback and address rework items, reflecting the status's role in the feedback loop.
  - Added an agent directive header block to prevent memory blowup and manage file archiving once size limits are reached.
- **Cache**: Bumped service worker cache name and asset link queries to `v88`.

---

## [v89] - 2026-06-11

### Task: Filtering Coding Tasks in PWA UI
- **ID**: `05276aff-0fff-4023-926d-7eb1efcaa38e`
- **Changes**:
  - Added quick filter buttons for "Needs Input" and "AntiGrav Go" in the Coding Tasks panel.
  - Filter membership is determined strictly by task status values.
- **Cache**: Bumped service worker cache name and asset link queries to `v89`.

---

### Task: Delete Button Styling Improvements
- **Changes**:
  - Restyled `.ct-btn-delete` to have a light red/pink solid background (`#fee2e2`), a solid vibrant red border (`#ef4444`), and a high-contrast dark red trash can icon color (`#991b1b`).
  - Added hover transitions with a slightly darker pink background (`#fecaca`) and border/text shifts.
- **Cache**: Bumped service worker cache name and asset link queries to `v86`.

---

## [v85] - 2026-06-11

### Task: Cache Bump for Update Verification
- **Changes**:
  - Bumped service worker cache name to `maximus-v85` and assets query parameters to `v=85` to force browser clients to detect and load the updated coding task deletion fixes and styling.

---

## [v84] - 2026-06-11

### Task: Coding Tasks Deletion & Modal Flow Optimization
- **ID**: `8364ed67-2241-412d-adeb-e6c6f1f5526d`
- **Changes**:
  - Tracked `editSource = 'coding_tasks'` when editing tasks from the coding tasks panel.
  - Configured modal save & delete handlers to correctly refresh the coding tasks panel and remove the correct card element.
  - Enhanced visual styling of `.ct-btn-delete` to make it larger and brighter red for better visibility on a dark background.
- **Cache**: Bumped service worker cache name and asset link queries to `v84`.

---

## [v83] - 2026-06-11

### Task: Add Task Summary to Action Button & Workflow Mods
- **ID**: `c3ee9fcf-99d0-41d3-b084-7ce9cf10e09f`
- **Changes**:
  - Prepended task summary and a newline to prompt text generated for the `done_in_maximus` status in `getPromptTextForStatus()`.
  - This allows the Antigravity conversation title to inherit the clean summary directly.
- **Workflow / DevOps Changes**:
  - Updated Agent Behavior Rules (`behavior_directive.md`) to establish a strict database state-sync workflow.
  - Mandated automatic task transitions to `in_progress` (at execution start) and `needs_verification` (on completion, with checklist details).
- **Cache**: Bumped service worker cache name and asset link queries to `v83`.

---

## [v82] - 2026-06-10

### Task: Responsive Install Banner & Authentication Finalization
- **Changes**:
  - Implemented responsive styling for the custom install banner.
  - Finalized Maximus PWA authentication session and login card.
- **Cache**: Bumped service worker cache name and asset link queries to `v82`.

---

## [v81] - 2026-06-08

### Task 4: Create Distinct Google Tasks Reorder Icon
- **ID**: `ed9169a8-c9b4-4f92-a172-7f6e25eeaed5`
- **Changes**:
  - Replaced the circular refresh arrow path on the `#sync-tasks` button in `index.html` with Feather's loop-arrows (`repeat`) icon.
  - This differentiates the Google Tasks sync button from the Coding Tasks page's Refresh button.
- **Cache**: Bumped service worker cache name and asset link queries to `v81`.

---

## [v80] - 2026-06-08

### Task 3: Visible App Version Badge & Dynamic Versioning
- **Changes**:
  - Added a version badge container (`.app-version` span) to the PWA header.
  - Implemented dynamic logic in `app.js` to parse the script tag's query string version (e.g., `?v=80`) on startup and write it to the header badge.
  - Avoids manual text changes in the HTML header whenever versions are bumped.
- **Cache**: Bumped service worker cache name and asset link queries to `v80`.

---

## [v78] - 2026-06-08

### Task 1: Match Improve Button Styling
- **ID**: `0dec0d2e-377c-4b87-84e9-99656dc50903`
- **Changes**:
  - Updated `#modal-ct-improve-btn` classes from `modal-btn modal-btn-primary` to `modal-btn ct-btn-improve` to inherit the purple theme from the Coding Tasks page.
  - Added active state scaling and color transitions in `style.css`.

### Task 2: Update Copied Button Text to Specify Relevant MD File
- **ID**: `2585c81c-36b5-4809-9d39-a770075ab1e1`
- **Changes**:
  - Created a centralized status-to-markdown file dictionary mapping (`STATUS_MD_FILES`) in `app.js`.
  - Refactored `getPromptTextForStatus` to append the correct markdown filename to the end of copy prompts (e.g., `as per implementation_plan.md`, `as per task.md`, or `as per walkthrough.md` including any follow-ups).
- **Cache**: Bumped service worker cache name and asset link queries to `v78` (and subsequently `v79`).

---

## Workspace Utilities

### Task CLI Manager (`tasks.py`)
- **Location**: Root of the `_OpenBrain` workspace.
- **Features**:
  - Zero-config: dynamically parses `maximus-pwa/app.js` to extract endpoint URLs and credentials.
  - Windows UTF-8 console output support for clean emoji status rendering.
  - Subcommands: `list`, `get <id>`, `status <id> <status>`, `add "<desc>"`.
