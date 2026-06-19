# Maximus PWA - Changelog & Walkthroughs



> **Agent Instruction**: To conserve context window space, read only the first 200 lines of this file to review recent version history. Read further down if a task explicitly references older updates. If this file exceeds 500 lines, move older releases to [CHANGELOG_ARCHIVE.md](./CHANGELOG_ARCHIVE.md).

This file contains the persistent record of all completed tasks, architectural updates, and styling changes made to the Maximus PWA.

## [v119] - 2026-06-19

### Task: Add yearly recurrence to recurring events and tasks (Rework - Hotfix)
- **ID**: `1d1833f6-91f7-4425-8621-1bcf67c5153f`
- **Changes**:
  - Fixed syntax error in `app.js` caused by duplicate declaration of `todayStr_pre` in `loadTasksDashboard` which had caused the script parsing to fail and make the PWA unresponsive.
  - Ported `getEasterDate`, `getNthWeekdayOfMonth`, and `getNextEnglishRecurrenceDate` helper functions locally to `app.js` to prevent ReferenceError crashes when parsing English recurrence patterns offline or on initial loading fallback paths.
  - Bumped PWA service worker cache name and asset version query strings to `v119`.

---

## [v118] - 2026-06-19

### Task: Add yearly recurrence to recurring events and tasks (Rework - Event Recurrence Projection & Auto-Roll)
- **ID**: `1d1833f6-91f7-4425-8621-1bcf67c5153f`
- **Changes**:
  - Implemented automatic background roll-forward for past recurring events in the PWA `loadTasksDashboard` to dynamically calculate, update locally, and persist next recurrence dates.
  - Implemented automatic background roll-forward for past recurring events in the `voice-gateway` agenda handler.
  - Allowed recurring events to fall through to recurrence checking logic in the voice gateway's `isScheduledForDate` function.
  - Enhanced the general search memory context generator in `voice-gateway` to expose Type, Status, Due Date, and Recurrence to Gemini for accurate natural-language recurrence replies.
  - Bumped PWA service worker cache name and asset version query strings to `v118`.

---

## [v117] - 2026-06-17

### Task: Add yearly recurrence to recurring events and tasks (Rework)
- **ID**: `1d1833f6-91f7-4425-8621-1bcf67c5153f`
- **Changes**:
  - Implemented backend action `get_next_recurrence_date` using Deno and Gemini to calculate complex/relative recurrences (e.g. `english:the first Friday of the month`, `english:every Easter`).
  - Integrated async recurrence rolling in the PWA client-side completion handler (`app.js`).
  - Implemented completed recurring task rollover support in Google Tasks pull sync (`sync-google` Edge Function).
  - Standardized prompt formats in the metadata extraction prompt in `_shared/ai.ts`.
  - Bumped PWA service worker cache name and asset version query strings to `v117`.

---

## [v116] - 2026-06-17

### Task: Thought summarizing is not functioning
- **ID**: `57f14716-4729-4d46-b30b-27661ab21e63`
- **Changes**:
  - Restandardized all summary prompt limits for coding tasks, tasks, events, and references to 8 words or fewer.
  - Implemented auto-summarization logic inside the `capture_thought` and `update_thought` MCP edge tools in `open-brain-mcp/index.ts`.
  - Executed a backfill to generate new 8-word summaries for all thoughts that were missing summaries or had overlong duplicate content in the database.
  - Bumped PWA version to `v116`.

---

## [v115] - 2026-06-17

### Task: Expand tasks in message history page when I click on the task (Rework)
- **ID**: `7da0d3ed-0927-4b95-aecd-f94832d01780`
- **Changes**:
  - Expanded the inline click-to-toggle details feature in the Message History panel to support all thought types (thoughts, observations, ideas, references, events, tasks, coding tasks).
  - Renamed `.task-item-clickable` to `.history-item-clickable` in both JavaScript and CSS.
  - Implemented dynamic metadata parsing and rendering, displaying event details (location, timing) and standard metadata fields (status, priority, due date, recurrence) when present.
  - Bumped cache and asset version query strings to `v115` to trigger client-side update.

---

## [v112] - 2026-06-17

### Task: Expand tasks in message history page when I click on the task
- **ID**: `7da0d3ed-0927-4b95-aecd-f94832d01780`
- **Changes**:
  - Implemented client-side details expansion for tasks and coding tasks in the Message History panel.
  - Rendered inline detailed metadata including full markdown description, status, priority, due date, recurrence, and coding task specifics (project, complexity, CT status, workstream).
  - Configured click handlers to toggle expansion, and stopped click propagation on action buttons (edit, details, delete) to prevent interference.
  - Styled hover states, expanded boundaries, and inline badges with harmonious colors conforming to the premium PWA visual language.
  - Bumped the Service Worker cache version and asset query references to `v112` to force client-side reload.

---

## [v111] - 2026-06-16

### Task: Add Ref button to copy task reference, summary, and ID
- **ID**: `2c1aad32-2288-4a27-8fbf-f8aa3304662c`
- **Changes**:
  - Rendered a "Ref" button for each Coding Task entry on the Coding Tasks page, styled with a teal gradient background.
  - Placed a matching "Ref" button inside the details modal footer (`#modal-ref-btn`), styled with a teal border.
  - Implemented event handlers to copy the format `"{Summary} (ID: {ID})"` to the clipboard, with visual "✅ Copied!" feedback on click.
  - Added new directives in `behavior_directive.md` to establish version bumping and deployment procedures for future PWA updates.
  - Bumped the Service Worker cache version and asset query references to `v111` to force client-side reload.

---

## [v110] - 2026-06-16

### Task: Make the verification Comment box larger & persistent
- **ID**: `550c571d-c51b-4e4a-8340-fe17b5319833`
- **Changes**:
  - Resized the verification/sendback comment text area to rows="5" (naturally holds 5-6 lines).
  - Configured `.ct-sendback-input` in `style.css` to limit height bounds (min-height: 120px, max-height: 250px, overflow-y: auto) to prevent layout obstruction.
  - Implemented vanilla JS auto-expanding height logic matching user typing.
  - Added in-memory caching (`ctInProgressComments`) and debounced database updates (500ms) to ensure in-progress comments are never lost when changing filters, opening the "+" Add Modal, or closing the PWA.
  - Automatically flushed saves on blur and cleaned up stored comments when tasks are successfully verified, sent back, or changed status.
  - Bumped Service Worker cache version and asset query version parameters to `v110`.

---

## [v109] - 2026-06-16

### Task: Enhance Improve: self-clarify via OpenBrain and include details
- **ID**: `83d4e870-2aaf-4a3a-8211-8038d61d77a5`
- **Changes**:
  - Enhanced the backend Deno Edge Function `manage-thoughts/index.ts` `improve_coding_task` handler to query OpenBrain to resolve clarification questions.
  - Successfully answered clarifications are appended under `## Resolved Clarifications (via OpenBrain)` in the task's improved text, and omitted from user suggestions.
  - Remaining unresolved multiple-choice suggestions include the option `"check existing code"`.
  - Updated the PWA frontend `renderInteractiveSuggestions` in `app.js` to render the `"check existing code"` option checkbox for multiple-choice suggestions.
  - Bumped the Service Worker cache version and index.html version references to `v109` to force client-side reload.

---

## [v108] - 2026-06-16

### Task: Adjust typing box expansion to avoid keyboard overlap
- **ID**: `d0623dae-c2e8-42f0-9ac4-4247dcbd179a`
- **Changes**:
  - Modified `<meta name="viewport">` in `index.html` to specify `interactive-widget=resizes-content` so Android Chrome resizes the layout viewport automatically when the keyboard is toggled.
  - Implemented `initViewportHandler()` in `app.js` to dynamically set `.app-container` height to `window.visualViewport.height` on resize or scroll, preventing keyboard overlap on all platforms.
  - Bumped Service Worker cache version and asset query version strings to `v108` to trigger visual update.

---

## [v106] - 2026-06-16

### Task: Set Default project to Maximus for create
- **ID**: `ec75c01a-fdf9-41f4-ba6b-0c81ba95b067`
- **Changes**:
  - Rearranged the dropdown options in the Add Coding Task modal (`#add-ct-project`) to place `Maximus Core` (`maximus_core`) as the first and selected option.
  - Updated the click listener for the "Add Coding Task" button in `app.js` to reset the project value back to `maximus_core` when opening the modal and no project filter is active.
  - Bumped Service Worker cache name to `maximus-v106` and updated asset version strings in `index.html` to trigger visual client reload.

---

## [v105] - 2026-06-16

### Task: Summarize long string thoughts and update Message History UI
- **ID**: `2e9bc48d-7090-4a25-8a0e-8e0b2f7c798f`
- **Changes**:
  - Modified the backend `manage-thoughts` Edge Function to automatically generate short summaries (<= 8 words) for incoming and edited thoughts when content is longer than 12 words, or use content verbatim if <= 12 words.
  - Wrote a batch migration script to retroactively summarize 211 existing thoughts in the database in batches of 30.
  - Updated the frontend `renderHistoryList` and `renderTaskSection` in `app.js` to render the short summaries and append a gold `+` sign suffix for entries that have longer content.
  - Bumped the Service Worker cache version and asset query strings to `v105` to trigger client-side update.

---

## [v104] - 2026-06-16

### Task: Remove complete buttons from events in Tasks and Events page
- **ID**: `c2a943d2-7098-4a8c-8fc0-000cb6087523`
- **Changes**:
  - Excluded completion radio checkboxes (`.task-checkbox`) from rendering for event items on the Tasks & Events list view.
  - Wrapped the checkbox click handler in a safety check to prevent JavaScript runtime errors when checkboxes are absent.
  - Hidden the "Complete" / "Reopen" button (`dom.modalComplete`) from the Task Detail Modal when the item is an event, including dynamic updates when switching types.
  - Updated the backend `manage-thoughts` Edge Function to delete the `status` field from metadata for `event` type thoughts on update.
  - Bumped the Service Worker cache version and asset query strings to `v104` to trigger client-side update.

---

## [v103] - 2026-06-16

### Task: Fix Maximus task Completion to prevent reverting to incomplete later
- **ID**: `4be4d1dd-fe91-45f9-aa1a-fe02765e8977`
- **Changes**:
  - Integrated the task completion `status` field into the `pushTask` Google Tasks API synchronization payload.
  - Corrected the two-way sync loop to prevent completed tasks from reverting to incomplete (pending) due to unmatched status alignment.
  - Reverted the experimental deletion tombstone tracking mechanism from Supabase Edge Functions (`sync-google`, `manage-thoughts`, and `voice-gateway`) to keep the architecture clean and maintainable.
  - Bumped the Service Worker cache version and asset query queries to `v103` to trigger visual client reload.

---

## [v102] - 2026-06-16

### Task: Improve Modal, Ensure general comments input is always enabled, never grayed out
- **ID**: `f49f4a1f-af95-4108-95de-4a422e626fd8`
- **Changes**:
  - Added a persistent `General Comments` textarea in `index.html` within the Improve Task modal (`improve-ct-dialog`).
  - Updated `app.js` to select the textarea and clear its value on opening the dialog.
  - Hooked up `improveAgainBtn` and `improveSubmitBtn` click listeners to collect the general comments, append them under a `## General Comments` header in the task content, and reset the field.
  - Bumped the Service Worker cache version and asset query references to `v102` to trigger an update toast on user devices.

---

## [v100] - 2026-06-15

### Task: Completed Button, Default hide completed Tasks (3-State Completed Filter Toggle)
- **ID**: `45eb3a7d-ac77-448e-95b1-e7c7f4e9ceab`
- **Changes**:
  - Replaced the binary "Show Completed" toggle with a 3-state cycle filter (State 1: Hide Completed [Default], State 2: Show Both, State 3: Show Only Completed).
  - Implemented `localStorage` persistence under the key `maximus_completed_filter` so that the user's selection remains consistent across sessions.
  - Added custom blue accent styles for the filter button's `only-completed` state in `style.css`, matching the premium visual design language.
  - Standardized completed task card styles (dimmed opacity, checkmark, and line-through content text decoration) across initial rendering and live interaction transitions.
  - Bumped the Service Worker cache name and asset query versions to `v100`.

---

## [v99] - 2026-06-15

### Task: Ensure Antigrav Go tasks on Coding Tasks page are not grayed out
- **ID**: `3647c017-5daa-44bf-9b4f-ba87afca98e7`
- **Changes**:
  - Toggled `ct-view-antigrav-go` class on the coding tasks list container (`ctDom.list`) in `renderCodingTasksList` based on the active quick filter state.
  - Added CSS overrides in `style.css` for `.ct-view-antigrav-go .ct-card.ct-done` to keep tasks fully bright (opacity: 1) in the Antigrav Go view.
  - Bumped the Service Worker cache name and asset query versions to `v99`.

---

## [v98] - 2026-06-15

### Task: Set Previous button to return to main screen (Back Interception Rework)
- **ID**: `61f8ad0d-6982-4a44-bbd4-8aad9e92f2e0`
- **Changes**:
  - Implemented a robust level-based visual routing architecture (Level 0: Main Screen, Level 1: Main Panels, Level 2: Modals & Editing states).
  - Hooked classList operations (`classList.add('hidden')` / `classList.remove('hidden')`) on all main panels and modals to automatically sync the browser history stack.
  - Implemented an `isNavigationTransitioning` guard flag to prevent `history.back()` from firing when panels are temporarily hidden visually during higher-level transitions (e.g. going from the Message History panel directly to edit/details mode).
  - Configured Service Worker cache and page query assets to bump to `v98` to force clients to update.

---

## [v97] - 2026-06-15

### Task: Set Previous button to return to main screen (Browser Back Interception)
- **ID**: `61f8ad0d-6982-4a44-bbd4-8aad9e92f2e0`
- **Changes**:
  - Created level-based popstate and history manager to intercept system Back button presses, returning from level 2 modals to level 1 panels, and level 1 panels to the main screen, preventing premature PWA closure.

---

## [v95] - 2026-06-14

### Task: Upgrade Maximus task dashboard with AJAX button
- **ID**: `2f3f8038-0c1a-470b-9c24-5cdef27e79fa`
- **Changes**:
  - Replaced the full-page reload on task completion with asynchronous background updates (AJAX) to the Supabase Edge Function (`manage-thoughts`).
  - Added local optimistic DOM updates to instantly show checked state, strike-through text, and dim opacity on the completed task.
  - Implemented a 3-second grace period with a dynamic countdown "Undo" button (e.g. "Undo 3s") next to the checkbox, allowing users to abort completion.
  - Handled automatic date calculation for recurring tasks, rolling their due date forward in the background.
  - Implemented asynchronous reopening (uncompleting) of tasks with immediate UI updates and error notification.
  - Smoothed user experience by fading out completed cards and dynamically removing empty sections without losing scroll position.

---

## [v94] - 2026-06-13

### Task: Smooth PWA Updates (Update Banner Notification)
- **ID**: `f0e84ae9-7a09-456e-ad00-eafa7793ebd2`
- **Changes**:
  - Implemented background Service Worker controllerchange event listener in `index.html` to automatically detect new Service Worker activation.
  - Added a stylish fixed overlay update notification banner (`#update-toast`) in `index.html` with a reload action button.
  - Added modern glassmorphic styles and slide-up micro-animations for the toast notification in `style.css`.
  - Configured reload button to trigger a page refresh to update all client-side assets in memory.
  - Bumped Service Worker cache version and script/style reference query version queries to `v94` in `sw.js` and `index.html`.

### Task: Manual Input Listener Deactivation (Focus Event Handler)
- **ID**: `ebdd3cd6-0c1f-4f71-b5d2-5083fd61c642` / `2ed40ae0-c5d7-496d-9855-2b9bc3e21e73`
- **Changes**:
  - Verified and closed the microphone auto-turn-off feature when the manual typing box gains focus.
  - Keeps voice orb status properly reset and clears any pending submission timeouts during manual entries.

### Task: Robust To-Do System Architecture & Workspace Sync
- **ID**: `a0da68d3-9dea-467b-9dca-bae7956edfa1`
- **Changes**:
  - Verified and closed the core architecture for Maximus and Antigravity task automations.
  - Formally resolved the synchronization logic and task management panel features built during earlier development phases.
- **Cache**: Bumped service worker cache name and asset queries to `v94`.

---

## [v93] - 2026-06-13

### Task: Planning Decision Delegation & Verification Efficiency
- **Changes**:
  - Shifted task complexity planning decision to Antigravity (eliminating the `needs_plan` status from the evaluator's output options).
  - Renamed the status key `needs_plan` to `needs_plan_approval` globally across Edge Functions, PWA components (`app.js`, `index.html`, `style.css`), PowerShell scripts (`list_ready_tasks.ps1`), and CLI utilities (`tasks.py`).
  - Added support for chat-based approval (such as "Go for it"), allowing Antigravity to autonomously transition tasks to `in_progress` in the database.
  - Implemented the **Verification Efficiency Rule**: Explicit division of the Verification Plan into "Agent Verification (Automated & Fast)" and "User Verification (Manual & Visual)" to completely avoid slow/expensive interactive browser subagent loops. Interactive visual checks are delegated to the user via checkable lists in the database.
  - Corrected the version bump in `index.html` loading tag for `app.js` to reference `v93`.
- **Cache**: Bumped service worker cache name and asset queries to `v93`.

---

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
