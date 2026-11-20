'use strict';

const CONFIG = {
    MANAGE_ENDPOINT: 'https://xbrhqaztkqtlruocvwal.supabase.co/functions/v1/manage-thoughts',
    KEY: ''
};

const INBOX_KEY = '__inbox__';

const COLOR_PALETTE = [
    '#22c55e', // Green
    '#f97316', // Orange
    '#a855f7', // Purple
    '#ef4444', // Red
    '#ec4899', // Pink
    '#3b82f6', // Blue
    '#14b8a6', // Teal
    '#eab308', // Yellow
    '#6366f1', // Indigo
    '#fbbf24', // Gold
    '#06b6d4', // Cyan
    '#94a3b8'  // Slate
];

const DEFAULT_REALM_COLUMNS = [
    { key: 'farm_grounds', name: 'Farm / Grounds Keeping', color: '#22c55e', kind: 'realm', sortMode: 'manual', hidden: false },
    { key: 'radio', name: 'Radio', color: '#f97316', kind: 'realm', sortMode: 'manual', hidden: false },
    { key: 'chapel_av', name: 'Chapel AV Upgrades', color: '#a855f7', kind: 'realm', sortMode: 'manual', hidden: false },
    { key: 'live_stream', name: 'Live Stream', color: '#ef4444', kind: 'realm', sortMode: 'manual', hidden: false },
    { key: 'm2m_workflow', name: 'M2M Workflow', color: '#ec4899', kind: 'realm', sortMode: 'manual', hidden: false },
    { key: 'computer_admin', name: 'Computer & Admin', color: '#3b82f6', kind: 'realm', sortMode: 'manual', hidden: false },
    { key: 'personal_health', name: 'Personal & Health', color: '#14b8a6', kind: 'realm', sortMode: 'manual', hidden: false },
    { key: 'house_chapter', name: 'House Chapter', color: '#eab308', kind: 'realm', sortMode: 'manual', hidden: false }
];

const CODING_STATUS_LABELS = {
    draft: 'Draft',
    needs_clarification: 'Needs Info',
    needs_plan_approval: 'Plan Approval',
    ready_for_antigravity: 'Ready',
    rework_in_antigravity: 'Rework',
    in_progress: 'In Progress',
    needs_verification: 'Verify',
    needs_logging: 'Needs Log',
    done: 'Done'
};

// --- APPLICATION STATE ---
const state = {
    thoughts: [],              // All task, event, coding_task items
    configThoughtId: null,     // Supabase thought ID for warchart_config
    boardConfig: {
        columns: [],
        calendarCollapsed: false,
        compactMode: false,
        inboxCollapsed: false
    },
    subprojectToParent: {},    // Maps coding subproject keys -> parent project key
    scopeFilter: 'all',        // 'all' | 'general' | 'coding'
    statusFilter: 'all_active',// 'all_active' | 'unscheduled' | 'scheduled' | 'completed'
    searchQuery: '',
    weekStart: getSundayOfWeek(new Date()),
    editingTaskId: null,
    editingColumnKey: null,
    selectedColor: COLOR_PALETTE[0],
    drag: {
        mode: null,            // 'card' | 'column' | 'cal-item'
        id: null,              // task id or column key
        sourceColKey: null
    },
    autoScrollDir: 0,
    autoScrollRaf: null,
    pendingSaves: 0
};

// --- DOM REFERENCES ---
const dom = {
    app: document.querySelector('.wc-app'),
    saveStatus: document.getElementById('wc-save-status'),
    searchInput: document.getElementById('wc-search-input'),
    toggleCalBtn: document.getElementById('wc-toggle-cal-btn'),
    compactBtn: document.getElementById('wc-compact-btn'),
    manageColsBtn: document.getElementById('wc-manage-cols-btn'),
    refreshBtn: document.getElementById('wc-refresh-btn'),
    addColBtn: document.getElementById('wc-add-col-btn'),

    // Calendar
    calPane: document.getElementById('wc-calendar-pane'),
    calPrev: document.getElementById('wc-cal-prev'),
    calToday: document.getElementById('wc-cal-today'),
    calNext: document.getElementById('wc-cal-next'),
    calRangeTitle: document.getElementById('wc-cal-range-title'),
    calGrid: document.getElementById('wc-cal-grid'),

    // Board
    boardViewport: document.getElementById('wc-board-viewport'),
    boardTrack: document.getElementById('wc-board-track'),

    // Login Dialog
    loginDialog: document.getElementById('wc-login-dialog'),
    loginForm: document.getElementById('wc-login-form'),
    loginUsername: document.getElementById('wc-login-username'),
    loginPassword: document.getElementById('wc-login-password'),
    loginError: document.getElementById('wc-login-error'),
    loginSubmit: document.getElementById('wc-login-submit'),

    // Detail Dialog
    detailDialog: document.getElementById('wc-detail-dialog'),
    detailHeading: document.getElementById('wc-detail-heading'),
    detailStatusDot: document.getElementById('wc-detail-status-dot'),
    detailClose: document.getElementById('wc-detail-close'),
    detailForm: document.getElementById('wc-detail-form'),
    detailSummary: document.getElementById('wc-detail-summary'),
    detailContent: document.getElementById('wc-detail-content'),
    detailColumn: document.getElementById('wc-detail-column'),
    detailType: document.getElementById('wc-detail-type'),
    detailDueDate: document.getElementById('wc-detail-due-date'),
    detailClearDate: document.getElementById('wc-detail-clear-date'),
    detailPriority: document.getElementById('wc-detail-priority'),
    detailRecurrence: document.getElementById('wc-detail-recurrence'),
    detailTimeRow: document.getElementById('wc-detail-time-row'),
    detailStartTime: document.getElementById('wc-detail-start-time'),
    detailEndTime: document.getElementById('wc-detail-end-time'),
    detailLocation: document.getElementById('wc-detail-location'),
    detailCodingSection: document.getElementById('wc-detail-coding-section'),
    detailCtStatus: document.getElementById('wc-detail-ct-status'),
    detailCtComplexity: document.getElementById('wc-detail-ct-complexity'),
    detailCtUrl: document.getElementById('wc-detail-ct-url'),
    detailNotes: document.getElementById('wc-detail-notes'),
    detailLinksPreview: document.getElementById('wc-detail-links-preview'),
    detailMetaInfo: document.getElementById('wc-detail-meta-info'),
    detailToggleComplete: document.getElementById('wc-detail-toggle-complete'),
    detailDelete: document.getElementById('wc-detail-delete'),
    detailCancel: document.getElementById('wc-detail-cancel'),
    detailSave: document.getElementById('wc-detail-save'),

    // Column Dialog
    colDialog: document.getElementById('wc-column-dialog'),
    colDialogHeading: document.getElementById('wc-col-dialog-heading'),
    colDialogClose: document.getElementById('wc-col-dialog-close'),
    colForm: document.getElementById('wc-col-form'),
    colNameInput: document.getElementById('wc-col-name-input'),
    colKindSelect: document.getElementById('wc-col-kind-select'),
    colorSwatches: document.getElementById('wc-color-swatches'),
    colHideBtn: document.getElementById('wc-col-hide-btn'),
    colDeleteBtn: document.getElementById('wc-col-delete-btn'),
    colCancelBtn: document.getElementById('wc-col-cancel-btn'),
    colSaveBtn: document.getElementById('wc-col-save-btn'),
    colManagerView: document.getElementById('wc-col-manager-view'),
    colManagerList: document.getElementById('wc-col-manager-list'),
    colManagerAddBtn: document.getElementById('wc-col-manager-add-btn'),
    colManagerDoneBtn: document.getElementById('wc-col-manager-done-btn')
};

// Floating drop indicator element for cards
const dropIndicator = document.createElement('div');
dropIndicator.className = 'wc-drop-indicator';

// --- DATE & FORMAT HELPERS ---
function getLocalDateStr(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function parseLocalDate(yyyyMmDd) {
    if (!yyyyMmDd || typeof yyyyMmDd !== 'string') return null;
    const parts = yyyyMmDd.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

function getSundayOfWeek(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() - d.getDay());
    return d;
}

function addDays(date, days) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + days);
    return d;
}

function formatShortDate(yyyyMmDd) {
    const d = parseLocalDate(yyyyMmDd);
    if (!d) return yyyyMmDd || '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function format12HourTime(time24) {
    if (!time24) return '';
    const parts = time24.split(':');
    if (parts.length < 2) return time24;
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    if (Number.isNaN(h)) return time24;
    const ampm = h >= 12 ? 'p' : 'a';
    h = h % 12 || 12;
    return m === '00' ? `${h}${ampm}` : `${h}:${m}${ampm}`;
}

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function slugifyKey(name) {
    const base = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 36);
    return base || `col_${Date.now().toString(36)}`;
}

// --- STATUS INDICATOR ---
function setSaveStatus(mode, text) {
    dom.saveStatus.className = 'wc-save-status';
    if (mode === 'saving') dom.saveStatus.classList.add('is-saving');
    else if (mode === 'saved') dom.saveStatus.classList.add('is-saved');
    else if (mode === 'error') dom.saveStatus.classList.add('is-error');
    dom.saveStatus.textContent = text;
}

async function trackSave(promise) {
    state.pendingSaves++;
    setSaveStatus('saving', 'Saving…');
    try {
        const res = await promise;
        state.pendingSaves = Math.max(0, state.pendingSaves - 1);
        if (state.pendingSaves === 0) {
            setSaveStatus('saved', 'Saved ✓');
        }
        return res;
    } catch (err) {
        state.pendingSaves = Math.max(0, state.pendingSaves - 1);
        setSaveStatus('error', 'Save failed');
        console.error('War Chart save error:', err);
        throw err;
    }
}

// --- API LAYER ---
async function apiCall(payload) {
    const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-brain-key': CONFIG.KEY
        },
        body: JSON.stringify(payload)
    });
    if (res.status === 401) {
        localStorage.removeItem('maximus_session_token');
        CONFIG.KEY = '';
        openLoginDialog();
        throw new Error('Unauthorized');
    }
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
}

// --- AUTH ---
function initAuth() {
    const token = localStorage.getItem('maximus_session_token');
    if (token) {
        CONFIG.KEY = token;
        return true;
    }
    openLoginDialog();
    return false;
}

function openLoginDialog() {
    if (!dom.loginDialog.open) {
        dom.loginDialog.showModal();
    }
}

// Prevent Esc dismissing login dialog while unauthenticated
dom.loginDialog.addEventListener('cancel', (e) => {
    if (!CONFIG.KEY) e.preventDefault();
});

dom.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = dom.loginUsername.value.trim();
    const password = dom.loginPassword.value;
    if (!username || !password) return;

    dom.loginError.hidden = true;
    dom.loginSubmit.disabled = true;
    dom.loginSubmit.textContent = 'Authenticating…';

    try {
        const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', username, password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.token) {
            throw new Error(data.error || 'Invalid credentials');
        }
        localStorage.setItem('maximus_session_token', data.token);
        CONFIG.KEY = data.token;
        dom.loginDialog.close();
        await loadAllData();
    } catch (err) {
        dom.loginError.textContent = err.message || 'Authentication failed';
        dom.loginError.hidden = false;
    } finally {
        dom.loginSubmit.disabled = false;
        dom.loginSubmit.textContent = 'Authenticate';
    }
});

// --- LIGHT-DISMISS FALLBACK FOR <dialog closedby="any"> (Modern Web Guidance) ---
function setupDialogLightDismissFallback() {
    if ('closedBy' in HTMLDialogElement.prototype) return;

    const isOutside = (e, dialog) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };

    for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
        let pressedOutside = false;
        dialog.addEventListener('pointerdown', (e) => {
            pressedOutside = isOutside(e, dialog);
        });
        dialog.addEventListener('pointerup', (e) => {
            if (pressedOutside && isOutside(e, dialog)) {
                dialog.close();
            }
            pressedOutside = false;
        });
    }
}

// --- DATA LOADING & CONFIG SYNC ---
async function loadAllData() {
    setSaveStatus('saving', 'Loading…');
    try {
        const [wcConfigRes, projConfigRes, itemsRes] = await Promise.all([
            apiCall({ action: 'list', types: ['warchart_config'], limit: 1 }),
            apiCall({ action: 'list', types: ['projects_config'], limit: 1 }),
            apiCall({ action: 'list', types: ['task', 'event', 'coding_task'], limit: 1000 })
        ]);

        // 1. Parse projects_config for coding project columns & subproject rollup
        const codingProjects = [];
        state.subprojectToParent = {};
        const projConfigThought = projConfigRes.thoughts?.[0];
        const rawProjects = projConfigThought?.metadata?.projects || [];
        rawProjects.forEach((proj, idx) => {
            if (!proj?.key || proj.key === 'uncategorized') return;
            codingProjects.push({
                key: proj.key,
                name: proj.name || proj.key,
                color: COLOR_PALETTE[(idx + 5) % COLOR_PALETTE.length],
                kind: 'coding',
                sortMode: 'manual',
                hidden: false
            });
            if (Array.isArray(proj.subprojects)) {
                proj.subprojects.forEach((sub) => {
                    if (sub?.key) state.subprojectToParent[sub.key] = proj.key;
                });
            }
        });

        // 2. Parse or initialize warchart_config
        const wcConfigThought = wcConfigRes.thoughts?.[0];
        if (wcConfigThought?.metadata?.columns && Array.isArray(wcConfigThought.metadata.columns)) {
            state.configThoughtId = wcConfigThought.id;
            state.boardConfig = {
                columns: wcConfigThought.metadata.columns.map(c => ({
                    key: c.key,
                    name: c.name,
                    color: c.color || '#3b82f6',
                    kind: c.kind || 'realm',
                    sortMode: c.sortMode === 'date' ? 'date' : 'manual',
                    hidden: Boolean(c.hidden)
                })),
                calendarCollapsed: Boolean(wcConfigThought.metadata.calendarCollapsed),
                compactMode: Boolean(wcConfigThought.metadata.compactMode),
                inboxCollapsed: Boolean(wcConfigThought.metadata.inboxCollapsed)
            };
            // Append any newly added coding projects from projects_config not yet in boardConfig
            const existingKeys = new Set(state.boardConfig.columns.map(c => c.key));
            let addedNew = false;
            codingProjects.forEach(cp => {
                if (!existingKeys.has(cp.key)) {
                    state.boardConfig.columns.push(cp);
                    existingKeys.add(cp.key);
                    addedNew = true;
                }
            });
            if (addedNew) {
                saveBoardConfig();
            }
        } else {
            // First-time seed: Notion realms + Maximus coding projects
            const seeded = [...DEFAULT_REALM_COLUMNS.map(c => ({ ...c }))];
            const keys = new Set(seeded.map(c => c.key));
            codingProjects.forEach(cp => {
                if (!keys.has(cp.key)) {
                    seeded.push(cp);
                    keys.add(cp.key);
                }
            });
            state.boardConfig = {
                columns: seeded,
                calendarCollapsed: false,
                compactMode: false,
                inboxCollapsed: false
            };
            await saveBoardConfig();
        }

        // 3. Store tasks/events/coding_tasks
        state.thoughts = Array.isArray(itemsRes.thoughts) ? itemsRes.thoughts : [];

        applyLayoutToggles();
        renderAll();
        setSaveStatus('saved', `Synced (${state.thoughts.length})`);
    } catch (err) {
        if (err.message !== 'Unauthorized') {
            setSaveStatus('error', 'Load failed');
            console.error('Failed to load War Chart data:', err);
        }
    }
}

async function saveBoardConfig() {
    const content = 'Maximus War Chart Layout & Column Configuration';
    const metadata = {
        type: 'warchart_config',
        columns: state.boardConfig.columns,
        calendarCollapsed: state.boardConfig.calendarCollapsed,
        compactMode: state.boardConfig.compactMode,
        inboxCollapsed: state.boardConfig.inboxCollapsed
    };

    const req = state.configThoughtId
        ? apiCall({ action: 'update', id: state.configThoughtId, metadata })
        : apiCall({ action: 'add', content, metadata });

    const data = await trackSave(req);
    if (!state.configThoughtId) {
        state.configThoughtId = data.thought?.id || data.updated?.id || null;
    }
}

// --- TASK METADATA HELPERS ---
function getTaskType(t) {
    return t?.metadata?.type || 'task';
}

function getTaskTitle(t) {
    const m = t?.metadata || {};
    const title = (m.summary || t?.content || '').trim();
    return title || '(Untitled task)';
}

function isTaskCompleted(t) {
    const m = t?.metadata || {};
    if (m.type === 'coding_task') {
        return m.coding_task?.status === 'done' || m.status === 'completed';
    }
    return m.status === 'completed';
}

function getTaskStatusClass(t) {
    if (isTaskCompleted(t)) return 'status-completed';
    if (t?.metadata?.due_date) return 'status-scheduled';
    return 'status-unscheduled';
}

function getTaskColumnKey(t) {
    const m = t?.metadata || {};
    const validKeys = new Set(state.boardConfig.columns.map(c => c.key));

    let rawKey = null;
    if (m.type === 'coding_task') {
        rawKey = m.coding_task?.project || m.coding_task?.workstream || m.project || null;
    } else {
        rawKey = m.project || m.category || null;
    }

    if (!rawKey || rawKey === 'uncategorized') return INBOX_KEY;
    if (validKeys.has(rawKey)) return rawKey;

    // Roll up coding subproject to parent column if parent exists
    const parentKey = state.subprojectToParent[rawKey];
    if (parentKey && validKeys.has(parentKey)) return parentKey;

    return INBOX_KEY;
}

function getTaskOrderValue(t, fallbackIndex = 0) {
    const m = t?.metadata || {};
    if (typeof m.warchart_order === 'number' && Number.isFinite(m.warchart_order)) {
        return m.warchart_order;
    }
    if (typeof m.order === 'number' && Number.isFinite(m.order)) {
        return m.order * 1000;
    }
    return (fallbackIndex + 1) * 100000;
}

function matchesFilters(t) {
    const type = getTaskType(t);
    // Events display on the weekly calendar; columns hold tasks & coding_tasks
    if (type === 'event') return false;

    // Scope filter
    if (state.scopeFilter === 'general' && type !== 'task') return false;
    if (state.scopeFilter === 'coding' && type !== 'coding_task') return false;

    // Status filter
    const completed = isTaskCompleted(t);
    const scheduled = Boolean(t.metadata?.due_date);

    if (state.statusFilter === 'all_active' && completed) return false;
    if (state.statusFilter === 'unscheduled' && (completed || scheduled)) return false;
    if (state.statusFilter === 'scheduled' && (completed || !scheduled)) return false;
    if (state.statusFilter === 'completed' && !completed) return false;

    // Search query
    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        const hay = [
            t.metadata?.summary,
            t.content,
            t.metadata?.notes,
            ...(Array.isArray(t.metadata?.topics) ? t.metadata.topics : [])
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
    }

    return true;
}

function sortColumnTasks(tasks, sortMode) {
    const copy = tasks.slice();
    copy.sort((a, b) => {
        if (sortMode === 'date') {
            const da = a.metadata?.due_date || '9999-12-31';
            const db = b.metadata?.due_date || '9999-12-31';
            if (da !== db) return da.localeCompare(db);
        }
        const oa = getTaskOrderValue(a);
        const ob = getTaskOrderValue(b);
        if (oa !== ob) return oa - ob;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
    return copy;
}

// --- LAYOUT TOGGLES ---
function applyLayoutToggles() {
    dom.calPane.classList.toggle('is-collapsed', state.boardConfig.calendarCollapsed);
    dom.toggleCalBtn.classList.toggle('active', !state.boardConfig.calendarCollapsed);
    dom.app.classList.toggle('is-compact', state.boardConfig.compactMode);
    dom.compactBtn.classList.toggle('active', state.boardConfig.compactMode);
}

// --- RENDERING ---
function renderAll() {
    renderCalendar();
    renderBoard();
}

function renderCalendar() {
    const start = state.weekStart;
    const end = addDays(start, 6);
    const todayStr = getLocalDateStr();

    const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = end.toLocaleDateString('en-US', {
        month: start.getMonth() === end.getMonth() ? undefined : 'short',
        day: 'numeric',
        year: 'numeric'
    });
    dom.calRangeTitle.textContent = `${startLabel} – ${endLabel}`;

    // Bucket dated items (events + tasks/coding_tasks matching scope/search)
    const itemsByDate = new Map();
    for (let i = 0; i < 7; i++) {
        itemsByDate.set(getLocalDateStr(addDays(start, i)), []);
    }

    const q = state.searchQuery.toLowerCase();
    for (const t of state.thoughts) {
        const due = t.metadata?.due_date;
        if (!due || !itemsByDate.has(due)) continue;

        const type = getTaskType(t);
        if (type === 'task' && state.scopeFilter === 'coding') continue;
        if (type === 'coding_task' && state.scopeFilter === 'general') continue;

        if (q) {
            const hay = `${t.metadata?.summary || ''} ${t.content || ''} ${t.metadata?.notes || ''}`.toLowerCase();
            if (!hay.includes(q)) continue;
        }
        itemsByDate.get(due).push(t);
    }

    dom.calGrid.innerHTML = '';

    for (let i = 0; i < 7; i++) {
        const dayDate = addDays(start, i);
        const dateStr = getLocalDateStr(dayDate);
        const isToday = dateStr === todayStr;

        const dayEl = document.createElement('div');
        dayEl.className = `wc-cal-day${isToday ? ' is-today' : ''}`;
        dayEl.dataset.date = dateStr;

        const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = dayDate.getDate();

        dayEl.innerHTML = `
            <div class="wc-cal-day-header">
                <span class="wc-cal-day-name">${dayName}</span>
                <span class="wc-cal-day-num">${dayNum}</span>
            </div>
            <div class="wc-cal-day-items"></div>
        `;

        const listEl = dayEl.querySelector('.wc-cal-day-items');
        const dayItems = itemsByDate.get(dateStr) || [];

        // Sort: Events with start_time first, then other events, then tasks
        dayItems.sort((a, b) => {
            const ea = getTaskType(a) === 'event' ? 0 : 1;
            const eb = getTaskType(b) === 'event' ? 0 : 1;
            if (ea !== eb) return ea - eb;
            const ta = a.metadata?.start_time || '99:99';
            const tb = b.metadata?.start_time || '99:99';
            return ta.localeCompare(tb);
        });

        for (const item of dayItems) {
            const type = getTaskType(item);
            const completed = isTaskCompleted(item);
            const chip = document.createElement('div');
            chip.className = `wc-cal-item${type === 'event' ? ' is-event' : ''}${completed ? ' is-completed' : ''}`;
            chip.draggable = true;
            chip.dataset.taskId = item.id;
            chip.title = getTaskTitle(item);

            const timePrefix = item.metadata?.start_time
                ? `<span class="wc-cal-item-time">${escapeHtml(format12HourTime(item.metadata.start_time))}</span>`
                : '';
            const unscheduleBtn = type !== 'event'
                ? `<button type="button" class="wc-cal-unschedule" title="Remove scheduled date" aria-label="Unschedule">&times;</button>`
                : '';

            chip.innerHTML = `${timePrefix}<span class="wc-cal-item-title">${escapeHtml(getTaskTitle(item))}</span>${unscheduleBtn}`;

            chip.addEventListener('click', (e) => {
                if (e.target.closest('.wc-cal-unschedule')) {
                    e.stopPropagation();
                    updateTaskScheduleDate(item.id, null);
                    return;
                }
                openTaskDetailDialog(item.id);
            });

            chip.addEventListener('dragstart', (e) => {
                state.drag = { mode: 'cal-item', id: item.id, sourceColKey: null };
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', item.id);
            });

            chip.addEventListener('dragend', clearDragState);
            listEl.appendChild(chip);
        }

        // Calendar drop target for scheduling cards or rescheduling chips
        dayEl.addEventListener('dragover', (e) => {
            if (state.drag.mode !== 'card' && state.drag.mode !== 'cal-item') return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            dayEl.classList.add('is-drop-target');
        });

        dayEl.addEventListener('dragleave', (e) => {
            if (!dayEl.contains(e.relatedTarget)) {
                dayEl.classList.remove('is-drop-target');
            }
        });

        dayEl.addEventListener('drop', (e) => {
            e.preventDefault();
            dayEl.classList.remove('is-drop-target');
            const taskId = state.drag.id || e.dataTransfer.getData('text/plain');
            if (taskId && (state.drag.mode === 'card' || state.drag.mode === 'cal-item')) {
                updateTaskScheduleDate(taskId, dateStr);
            }
            clearDragState();
        });

        dom.calGrid.appendChild(dayEl);
    }
}

function getVisibleColumns() {
    return state.boardConfig.columns.filter((col) => {
        if (col.hidden) return false;
        if (state.scopeFilter === 'general' && col.kind === 'coding') return false;
        if (state.scopeFilter === 'coding' && col.kind !== 'coding') return false;
        return true;
    });
}

function renderBoard() {
    // Group filtered tasks by column key
    const grouped = new Map();
    grouped.set(INBOX_KEY, []);
    state.boardConfig.columns.forEach(c => grouped.set(c.key, []));

    for (const t of state.thoughts) {
        if (!matchesFilters(t)) continue;
        const colKey = getTaskColumnKey(t);
        if (!grouped.has(colKey)) grouped.set(INBOX_KEY, grouped.get(INBOX_KEY));
        (grouped.get(colKey) || grouped.get(INBOX_KEY)).push(t);
    }

    const scrollLeft = dom.boardViewport.scrollLeft;
    dom.boardTrack.innerHTML = '';

    // 1. Inbox / Unassigned Column on the left
    const inboxTasks = sortColumnTasks(grouped.get(INBOX_KEY) || [], 'manual');
    const inboxCol = {
        key: INBOX_KEY,
        name: 'Inbox / Unassigned',
        color: '#94a3b8',
        kind: 'inbox',
        sortMode: 'manual'
    };
    dom.boardTrack.appendChild(createColumnElement(inboxCol, inboxTasks, true));

    // 2. Visible Project / Realm Columns
    const visibleCols = getVisibleColumns();
    for (const col of visibleCols) {
        const colTasks = sortColumnTasks(grouped.get(col.key) || [], col.sortMode);
        dom.boardTrack.appendChild(createColumnElement(col, colTasks, false));
    }

    dom.boardViewport.scrollLeft = scrollLeft;
}

function createColumnElement(col, tasks, isInbox) {
    const colEl = document.createElement('section');
    colEl.className = `wc-column${isInbox ? ' is-inbox' : ''}${isInbox && state.boardConfig.inboxCollapsed ? ' is-collapsed' : ''}`;
    colEl.dataset.colKey = col.key;
    colEl.style.setProperty('--col-accent', col.color || '#fbbf24');

    // Header
    const headerEl = document.createElement('div');
    headerEl.className = 'wc-col-header';
    if (!isInbox) {
        headerEl.draggable = true;
        headerEl.title = 'Drag header left or right to reorder column';
    } else {
        headerEl.title = state.boardConfig.inboxCollapsed
            ? 'Click to expand Inbox / Unassigned'
            : 'Unassigned tasks — drag cards into your project columns';
    }

    const gripSvg = isInbox
        ? `<span aria-hidden="true">📥</span>`
        : `<svg class="wc-col-grip" viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
               <circle cx="5" cy="3.5" r="1.2"></circle><circle cx="11" cy="3.5" r="1.2"></circle>
               <circle cx="5" cy="8" r="1.2"></circle><circle cx="11" cy="8" r="1.2"></circle>
               <circle cx="5" cy="12.5" r="1.2"></circle><circle cx="11" cy="12.5" r="1.2"></circle>
           </svg>`;

    const actionsHtml = isInbox
        ? `<button type="button" class="wc-col-btn wc-col-quickadd-btn" title="Quick add unassigned task" aria-label="Add task">+</button>
           <button type="button" class="wc-col-btn wc-inbox-collapse-btn" title="Collapse Inbox rail" aria-label="Collapse Inbox">«</button>`
        : `<button type="button" class="wc-col-btn wc-col-sort-btn${col.sortMode === 'date' ? ' is-date-sort' : ''}" title="${col.sortMode === 'date' ? 'Sorted by Date (click for Manual drag order)' : 'Manual Drag Order (click to sort by Date)'}" aria-label="Toggle sort order">${col.sortMode === 'date' ? '📅' : '↕'}</button>
           <button type="button" class="wc-col-btn wc-col-quickadd-btn" title="Add task to ${escapeHtml(col.name)}" aria-label="Add task">+</button>
           <button type="button" class="wc-col-btn wc-col-edit-btn" title="Edit or hide column" aria-label="Edit column">⋯</button>`;

    headerEl.innerHTML = `
        <div class="wc-col-title-wrap">
            ${gripSvg}
            <h2 class="wc-col-title">${escapeHtml(col.name)}</h2>
            <span class="wc-col-count">${tasks.length}</span>
        </div>
        <div class="wc-col-actions">${actionsHtml}</div>
    `;

    // Collapsed Inbox expands on click
    if (isInbox) {
        headerEl.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            if (state.boardConfig.inboxCollapsed) {
                state.boardConfig.inboxCollapsed = false;
                renderBoard();
                saveBoardConfig();
            }
        });
        headerEl.querySelector('.wc-inbox-collapse-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            state.boardConfig.inboxCollapsed = true;
            renderBoard();
            saveBoardConfig();
        });
    } else {
        // Sort toggle
        headerEl.querySelector('.wc-col-sort-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            col.sortMode = col.sortMode === 'date' ? 'manual' : 'date';
            renderBoard();
            saveBoardConfig();
        });
        // Edit column
        headerEl.querySelector('.wc-col-edit-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            openColumnEditDialog(col.key);
        });
    }

    // Inline Quick-Add container
    const quickAddEl = document.createElement('div');
    quickAddEl.className = 'wc-col-quick-add';
    quickAddEl.hidden = true;
    quickAddEl.innerHTML = `
        <input type="text" class="wc-quick-add-input" placeholder="New task title… (Enter to add)">
        <div class="wc-quick-add-hint">
            <span>Enter to save · Esc to close</span>
        </div>
    `;
    const quickInput = quickAddEl.querySelector('.wc-quick-add-input');

    headerEl.querySelector('.wc-col-quickadd-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        quickAddEl.hidden = !quickAddEl.hidden;
        if (!quickAddEl.hidden) {
            quickInput.value = '';
            quickInput.focus();
        }
    });

    quickInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Escape') {
            quickAddEl.hidden = true;
            return;
        }
        if (e.key === 'Enter' && !e.isComposing) {
            e.preventDefault();
            const title = quickInput.value.trim();
            if (!title) return;
            quickInput.disabled = true;
            try {
                await createQuickTask(col, title);
                quickInput.value = '';
                quickInput.disabled = false;
                quickInput.focus();
            } catch {
                quickInput.disabled = false;
            }
        }
    });

    // Body (Cards List)
    const bodyEl = document.createElement('div');
    bodyEl.className = 'wc-col-body';
    bodyEl.dataset.colKey = col.key;

    if (tasks.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'wc-col-empty';
        emptyEl.textContent = isInbox ? 'All tasks organized!' : 'Drop tasks here or click +';
        bodyEl.appendChild(emptyEl);
    } else {
        for (const task of tasks) {
            bodyEl.appendChild(createCardElement(task, col.key));
        }
    }

    // --- COLUMN DRAG-AND-DROP (Left / Right Reorder) ---
    if (!isInbox) {
        headerEl.addEventListener('dragstart', (e) => {
            if (e.target.closest('button')) {
                e.preventDefault();
                return;
            }
            state.drag = { mode: 'column', id: col.key, sourceColKey: col.key };
            colEl.classList.add('is-dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', `col:${col.key}`);
        });

        headerEl.addEventListener('dragend', clearDragState);
    }

    // Column receives BOTH column drops (to reorder columns) AND card drops (anywhere on column)
    colEl.addEventListener('dragover', (e) => {
        updateAutoScroll(e.clientX);

        if (state.drag.mode === 'column' && !isInbox && state.drag.id !== col.key) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const rect = colEl.getBoundingClientRect();
            const before = e.clientX < rect.left + rect.width / 2;
            colEl.classList.toggle('col-drop-before', before);
            colEl.classList.toggle('col-drop-after', !before);
            return;
        }

        if (state.drag.mode === 'card') {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            colEl.classList.add('card-drop-hover');
            // Auto-expand collapsed inbox if dragging onto it
            if (isInbox && state.boardConfig.inboxCollapsed) {
                state.boardConfig.inboxCollapsed = false;
                colEl.classList.remove('is-collapsed');
            }
            positionCardDropIndicator(bodyEl, e.clientY);
        }
    });

    colEl.addEventListener('dragleave', (e) => {
        if (!colEl.contains(e.relatedTarget)) {
            colEl.classList.remove('col-drop-before', 'col-drop-after', 'card-drop-hover');
            if (dropIndicator.parentElement === bodyEl) {
                dropIndicator.remove();
            }
        }
    });

    colEl.addEventListener('drop', (e) => {
        e.preventDefault();
        const wasBefore = colEl.classList.contains('col-drop-before');
        colEl.classList.remove('col-drop-before', 'col-drop-after', 'card-drop-hover');

        if (state.drag.mode === 'column' && !isInbox && state.drag.id && state.drag.id !== col.key) {
            reorderColumns(state.drag.id, col.key, wasBefore);
            clearDragState();
            return;
        }

        if (state.drag.mode === 'card' && state.drag.id) {
            const insertIdx = computeDropIndex(bodyEl, e.clientY, state.drag.id);
            moveCardToColumn(state.drag.id, col.key, insertIdx);
            clearDragState();
        }
    });

    colEl.appendChild(headerEl);
    colEl.appendChild(quickAddEl);
    colEl.appendChild(bodyEl);
    return colEl;
}

function createCardElement(task, colKey) {
    const card = document.createElement('article');
    const statusClass = getTaskStatusClass(task);
    const completed = isTaskCompleted(task);
    const m = task.metadata || {};
    const type = getTaskType(task);

    card.className = `wc-card ${statusClass}`;
    card.draggable = true;
    card.dataset.taskId = task.id;
    card.dataset.colKey = colKey;

    // Metadata pills (only shown when meaningful)
    const pills = [];
    if (m.due_date) {
        const isOverdue = !completed && m.due_date < getLocalDateStr();
        const timeText = m.start_time ? ` ${format12HourTime(m.start_time)}` : '';
        pills.push(`<span class="wc-pill wc-pill-date${isOverdue ? ' is-overdue' : ''}">📅 ${escapeHtml(formatShortDate(m.due_date))}${escapeHtml(timeText)}</span>`);
    }
    if (type === 'coding_task') {
        const ctStatus = m.coding_task?.status || 'draft';
        const label = CODING_STATUS_LABELS[ctStatus] || ctStatus;
        pills.push(`<span class="wc-pill wc-pill-coding">⚡ ${escapeHtml(label)}</span>`);
    }
    if (m.priority === 'high' || m.coding_task?.priority === 'high') {
        pills.push(`<span class="wc-pill wc-pill-priority-high">High</span>`);
    }
    if (m.notes && m.notes.trim()) {
        pills.push(`<span class="wc-pill wc-pill-note" title="Has notes">📝</span>`);
    }
    if (m.recurrence) {
        pills.push(`<span class="wc-pill wc-pill-note" title="Recurring: ${escapeHtml(m.recurrence)}">↺</span>`);
    }

    const metaHtml = pills.length ? `<div class="wc-card-meta">${pills.join('')}</div>` : '';

    card.innerHTML = `
        <div class="wc-card-main">
            <label class="wc-cb-wrap" title="${completed ? 'Mark incomplete' : 'Mark complete'}">
                <input type="checkbox" class="wc-cb" ${completed ? 'checked' : ''} aria-label="Mark ${escapeHtml(getTaskTitle(task))} complete">
            </label>
            <div class="wc-card-title">${escapeHtml(getTaskTitle(task))}</div>
        </div>
        ${metaHtml}
    `;

    // Checkbox toggle (isolated from card click & drag)
    const cbWrap = card.querySelector('.wc-cb-wrap');
    const cb = card.querySelector('.wc-cb');

    cbWrap.addEventListener('click', (e) => e.stopPropagation());
    cb.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleTaskComplete(task.id, cb.checked);
    });

    // Click card body -> open Task Detail Modal
    card.addEventListener('click', (e) => {
        if (e.target.closest('.wc-cb-wrap')) return;
        openTaskDetailDialog(task.id);
    });

    // Drag start
    card.addEventListener('dragstart', (e) => {
        if (e.target.closest('.wc-cb-wrap')) {
            e.preventDefault();
            return;
        }
        state.drag = { mode: 'card', id: task.id, sourceColKey: colKey };
        card.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id);
    });

    card.addEventListener('dragend', clearDragState);

    return card;
}

// --- DRAG & DROP GEOMETRY + EDGE AUTO-SCROLL ---
function positionCardDropIndicator(bodyEl, clientY) {
    const cards = Array.from(bodyEl.querySelectorAll('.wc-card:not(.is-dragging)'));
    let insertBeforeEl = null;

    for (const c of cards) {
        const rect = c.getBoundingClientRect();
        if (clientY < rect.top + rect.height / 2) {
            insertBeforeEl = c;
            break;
        }
    }

    if (insertBeforeEl) {
        bodyEl.insertBefore(dropIndicator, insertBeforeEl);
    } else {
        bodyEl.appendChild(dropIndicator);
    }
}

function computeDropIndex(bodyEl, clientY, draggedId) {
    const cards = Array.from(bodyEl.querySelectorAll('.wc-card')).filter(
        c => c.dataset.taskId !== draggedId
    );
    let idx = cards.length;
    for (let i = 0; i < cards.length; i++) {
        const rect = cards[i].getBoundingClientRect();
        if (clientY < rect.top + rect.height / 2) {
            idx = i;
            break;
        }
    }
    return idx;
}

function updateAutoScroll(clientX) {
    const rect = dom.boardViewport.getBoundingClientRect();
    const edge = 85;
    if (clientX < rect.left + edge) {
        state.autoScrollDir = -1;
    } else if (clientX > rect.right - edge) {
        state.autoScrollDir = 1;
    } else {
        state.autoScrollDir = 0;
    }

    if (state.autoScrollDir !== 0 && !state.autoScrollRaf) {
        const step = () => {
            if (state.autoScrollDir === 0 || !state.drag.mode) {
                state.autoScrollRaf = null;
                return;
            }
            dom.boardViewport.scrollLeft += state.autoScrollDir * 14;
            state.autoScrollRaf = requestAnimationFrame(step);
        };
        state.autoScrollRaf = requestAnimationFrame(step);
    }
}

function clearDragState() {
    state.drag = { mode: null, id: null, sourceColKey: null };
    state.autoScrollDir = 0;
    if (state.autoScrollRaf) {
        cancelAnimationFrame(state.autoScrollRaf);
        state.autoScrollRaf = null;
    }
    dropIndicator.remove();
    document.querySelectorAll('.is-dragging, .col-drop-before, .col-drop-after, .card-drop-hover, .is-drop-target')
        .forEach(el => el.classList.remove('is-dragging', 'col-drop-before', 'col-drop-after', 'card-drop-hover', 'is-drop-target'));
}

// --- BOARD & TASK MUTATIONS ---
function reorderColumns(sourceKey, targetKey, insertBefore) {
    const cols = state.boardConfig.columns;
    const srcIdx = cols.findIndex(c => c.key === sourceKey);
    if (srcIdx === -1) return;

    const [moved] = cols.splice(srcIdx, 1);
    let dstIdx = cols.findIndex(c => c.key === targetKey);
    if (dstIdx === -1) {
        cols.push(moved);
    } else {
        if (!insertBefore) dstIdx += 1;
        cols.splice(dstIdx, 0, moved);
    }

    renderBoard();
    saveBoardConfig();
}

async function moveCardToColumn(taskId, targetColKey, insertIdx) {
    const task = state.thoughts.find(t => t.id === taskId);
    if (!task) return;

    const targetCol = state.boardConfig.columns.find(c => c.key === targetColKey);
    let configChanged = false;
    // If target column was sorted by date and user drags a card inside it, switch to manual mode so drag sticks
    if (targetCol && targetCol.sortMode === 'date') {
        targetCol.sortMode = 'manual';
        configChanged = true;
    }

    // Determine sibling tasks already in the target column (excluding dragged task)
    const siblings = sortColumnTasks(
        state.thoughts.filter(t => t.id !== taskId && matchesFilters(t) && getTaskColumnKey(t) === targetColKey),
        'manual'
    );

    // Ensure siblings have clean monotonic warchart_order values if tightly packed
    let newOrder;
    const prev = insertIdx > 0 ? siblings[insertIdx - 1] : null;
    const next = insertIdx < siblings.length ? siblings[insertIdx] : null;

    if (!prev && !next) {
        newOrder = 1000;
    } else if (!prev && next) {
        newOrder = getTaskOrderValue(next, 0) - 1000;
    } else if (prev && !next) {
        newOrder = getTaskOrderValue(prev, siblings.length - 1) + 1000;
    } else {
        const prevOrd = getTaskOrderValue(prev, insertIdx - 1);
        const nextOrd = getTaskOrderValue(next, insertIdx);
        if (Math.abs(nextOrd - prevOrd) > 0.001) {
            newOrder = (prevOrd + nextOrd) / 2;
        } else {
            // Re-space sibling orders cleanly
            siblings.splice(insertIdx, 0, task);
            const batchUpdates = [];
            siblings.forEach((item, i) => {
                const ord = (i + 1) * 1000;
                item.metadata = { ...(item.metadata || {}), warchart_order: ord };
                if (item.id !== taskId) {
                    batchUpdates.push(apiCall({ action: 'update', id: item.id, metadata: { warchart_order: ord } }));
                }
            });
            newOrder = task.metadata.warchart_order;
            Promise.all(batchUpdates).catch(err => console.error('Re-space update error:', err));
        }
    }

    const assignedKey = targetColKey === INBOX_KEY ? null : targetColKey;
    const metaPatch = { warchart_order: newOrder };

    if (getTaskType(task) === 'coding_task') {
        metaPatch.coding_task = {
            ...(task.metadata?.coding_task || {}),
            project: assignedKey || 'uncategorized'
        };
        task.metadata = { ...task.metadata, ...metaPatch };
    } else {
        metaPatch.project = assignedKey;
        task.metadata = { ...task.metadata, ...metaPatch };
    }

    renderAll();

    const ops = [trackSave(apiCall({ action: 'update', id: taskId, metadata: metaPatch }))];
    if (configChanged) ops.push(saveBoardConfig());
    await Promise.all(ops);
}

async function toggleTaskComplete(taskId, isComplete) {
    const task = state.thoughts.find(t => t.id === taskId);
    if (!task) return;

    const metaPatch = {};
    if (getTaskType(task) === 'coding_task') {
        metaPatch.coding_task = {
            ...(task.metadata?.coding_task || {}),
            status: isComplete ? 'done' : 'in_progress'
        };
        metaPatch.status = isComplete ? 'completed' : 'pending';
    } else {
        metaPatch.status = isComplete ? 'completed' : 'pending';
    }

    task.metadata = { ...(task.metadata || {}), ...metaPatch };
    renderAll();

    await trackSave(apiCall({ action: 'update', id: taskId, metadata: metaPatch }));
}

async function updateTaskScheduleDate(taskId, dateStr) {
    const task = state.thoughts.find(t => t.id === taskId);
    if (!task) return;

    const metaPatch = { due_date: dateStr || null };
    task.metadata = { ...(task.metadata || {}), ...metaPatch };
    renderAll();

    await trackSave(apiCall({ action: 'update', id: taskId, metadata: metaPatch }));
}

async function createQuickTask(col, title) {
    const isInbox = col.key === INBOX_KEY;
    const isCoding = col.kind === 'coding';

    // Put at top of column
    const existing = sortColumnTasks(
        state.thoughts.filter(t => matchesFilters(t) && getTaskColumnKey(t) === col.key),
        'manual'
    );
    const topOrder = existing.length > 0 ? getTaskOrderValue(existing[0], 0) - 1000 : 1000;

    const metadata = isCoding
        ? {
            type: 'coding_task',
            summary: title,
            status: 'pending',
            priority: 'normal',
            warchart_order: topOrder,
            coding_task: {
                project: col.key,
                status: 'draft',
                priority: 'medium',
                complexity: 'moderate'
            }
        }
        : {
            type: 'task',
            summary: title,
            status: 'pending',
            priority: 'normal',
            project: isInbox ? null : col.key,
            warchart_order: topOrder
        };

    const data = await trackSave(apiCall({ action: 'add', content: title, metadata }));
    if (data.thought) {
        state.thoughts.unshift(data.thought);
        renderAll();
    }
}

// --- TASK DETAIL MODAL ---
function populateColumnSelect(selectedKey) {
    dom.detailColumn.innerHTML = '';

    const inboxOpt = document.createElement('option');
    inboxOpt.value = INBOX_KEY;
    inboxOpt.textContent = '📥 Inbox / Unassigned';
    dom.detailColumn.appendChild(inboxOpt);

    const realmCols = state.boardConfig.columns.filter(c => c.kind !== 'coding');
    const codingCols = state.boardConfig.columns.filter(c => c.kind === 'coding');

    if (realmCols.length) {
        const grp = document.createElement('optgroup');
        grp.label = 'Realms & General Projects';
        realmCols.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.key;
            opt.textContent = c.name + (c.hidden ? ' (Hidden)' : '');
            grp.appendChild(opt);
        });
        dom.detailColumn.appendChild(grp);
    }

    if (codingCols.length) {
        const grp = document.createElement('optgroup');
        grp.label = 'Coding Projects';
        codingCols.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.key;
            opt.textContent = c.name + (c.hidden ? ' (Hidden)' : '');
            grp.appendChild(opt);
        });
        dom.detailColumn.appendChild(grp);
    }

    dom.detailColumn.value = selectedKey || INBOX_KEY;
}

function renderLinksPreview(text) {
    const urls = (text || '').match(/https?:\/\/[^\s)>"']+/g) || [];
    if (urls.length === 0) {
        dom.detailLinksPreview.hidden = true;
        dom.detailLinksPreview.innerHTML = '';
        return;
    }
    dom.detailLinksPreview.hidden = false;
    dom.detailLinksPreview.innerHTML = '';
    const unique = [...new Set(urls)];
    unique.forEach(u => {
        const a = document.createElement('a');
        a.href = u;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = u.replace(/^https?:\/\//, '').slice(0, 55);
        dom.detailLinksPreview.appendChild(a);
    });
}

function openTaskDetailDialog(taskId) {
    const task = state.thoughts.find(t => t.id === taskId);
    if (!task) return;

    state.editingTaskId = taskId;
    const m = task.metadata || {};
    const type = getTaskType(task);
    const completed = isTaskCompleted(task);

    dom.detailHeading.textContent = type === 'coding_task'
        ? '⚡ Coding Task Details'
        : type === 'event' ? '📅 Event Details' : 'Task Details';

    dom.detailStatusDot.className = 'wc-dot ' + (
        completed ? 'wc-dot-green' : m.due_date ? 'wc-dot-amber' : 'wc-dot-red'
    );

    dom.detailSummary.value = m.summary || task.content || '';
    dom.detailContent.value = task.content || '';
    populateColumnSelect(getTaskColumnKey(task));
    dom.detailType.value = type;
    dom.detailDueDate.value = m.due_date || '';
    dom.detailPriority.value = m.priority || 'normal';
    dom.detailRecurrence.value = m.recurrence || '';
    dom.detailStartTime.value = m.start_time || '';
    dom.detailEndTime.value = m.end_time || '';
    dom.detailLocation.value = m.location || '';
    dom.detailNotes.value = m.notes || '';
    renderLinksPreview(`${task.content || ''}\n${m.notes || ''}`);

    const isCoding = type === 'coding_task';
    dom.detailCodingSection.hidden = !isCoding;
    if (isCoding) {
        dom.detailCtStatus.value = m.coding_task?.status || 'draft';
        dom.detailCtComplexity.value = m.coding_task?.complexity || 'moderate';
        dom.detailCtUrl.value = m.coding_task?.verification_url || '';
    }

    dom.detailToggleComplete.hidden = type === 'event';
    dom.detailToggleComplete.textContent = completed ? 'Reopen Task' : 'Mark Done';

    const created = task.created_at ? new Date(task.created_at).toLocaleString() : '—';
    const people = Array.isArray(m.people) && m.people.length ? ` · People: ${m.people.join(', ')}` : '';
    dom.detailMetaInfo.textContent = `Created: ${created}${people}`;

    dom.detailDialog.showModal();
}

dom.detailType.addEventListener('change', () => {
    const isCoding = dom.detailType.value === 'coding_task';
    dom.detailCodingSection.hidden = !isCoding;
    dom.detailToggleComplete.hidden = dom.detailType.value === 'event';
});

dom.detailNotes.addEventListener('input', () => {
    renderLinksPreview(`${dom.detailContent.value}\n${dom.detailNotes.value}`);
});

dom.detailClearDate.addEventListener('click', () => {
    dom.detailDueDate.value = '';
});

dom.detailClose.addEventListener('click', () => dom.detailDialog.close());
dom.detailCancel.addEventListener('click', () => dom.detailDialog.close());

dom.detailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskId = state.editingTaskId;
    const task = state.thoughts.find(t => t.id === taskId);
    if (!task) return;

    const summary = dom.detailSummary.value.trim();
    const content = dom.detailContent.value.trim() || summary;
    const type = dom.detailType.value;
    const colKey = dom.detailColumn.value;
    const assignedProject = colKey === INBOX_KEY ? null : colKey;

    const metaPatch = {
        type,
        summary,
        due_date: dom.detailDueDate.value || null,
        priority: dom.detailPriority.value,
        recurrence: dom.detailRecurrence.value || null,
        start_time: dom.detailStartTime.value || null,
        end_time: dom.detailEndTime.value || null,
        all_day: dom.detailStartTime.value ? false : true,
        location: dom.detailLocation.value.trim() || null,
        notes: dom.detailNotes.value.trim() || null,
        project: assignedProject
    };

    if (type === 'coding_task') {
        metaPatch.coding_task = {
            ...(task.metadata?.coding_task || {}),
            project: assignedProject || 'uncategorized',
            status: dom.detailCtStatus.value,
            complexity: dom.detailCtComplexity.value,
            verification_url: dom.detailCtUrl.value.trim() || null
        };
        if (dom.detailCtStatus.value === 'done') metaPatch.status = 'completed';
    }

    const contentChanged = content !== (task.content || '').trim();
    task.content = content;
    task.metadata = { ...(task.metadata || {}), ...metaPatch };

    dom.detailDialog.close();
    renderAll();

    const payload = { action: 'update', id: taskId, metadata: metaPatch };
    if (contentChanged) payload.content = content;

    await trackSave(apiCall(payload));
});

dom.detailToggleComplete.addEventListener('click', async () => {
    const taskId = state.editingTaskId;
    const task = state.thoughts.find(t => t.id === taskId);
    if (!task) return;
    const nextState = !isTaskCompleted(task);
    dom.detailDialog.close();
    await toggleTaskComplete(taskId, nextState);
});

dom.detailDelete.addEventListener('click', async () => {
    const taskId = state.editingTaskId;
    if (!taskId) return;
    if (!confirm('Delete this task permanently from OpenBrain?')) return;

    state.thoughts = state.thoughts.filter(t => t.id !== taskId);
    dom.detailDialog.close();
    renderAll();

    await trackSave(apiCall({ action: 'delete', id: taskId }));
});

// --- COLUMN DIALOG (ADD / EDIT / MANAGE) ---
function renderColorSwatches(selected) {
    state.selectedColor = selected || COLOR_PALETTE[0];
    dom.colorSwatches.innerHTML = '';
    COLOR_PALETTE.forEach(color => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `wc-swatch${color === state.selectedColor ? ' is-selected' : ''}`;
        btn.style.backgroundColor = color;
        btn.setAttribute('aria-label', `Select color ${color}`);
        btn.addEventListener('click', () => {
            state.selectedColor = color;
            dom.colorSwatches.querySelectorAll('.wc-swatch').forEach(b => b.classList.remove('is-selected'));
            btn.classList.add('is-selected');
        });
        dom.colorSwatches.appendChild(btn);
    });
}

function openAddColumnDialog() {
    state.editingColumnKey = null;
    dom.colDialogHeading.textContent = 'Add New Column';
    dom.colForm.hidden = false;
    dom.colManagerView.hidden = true;
    dom.colNameInput.value = '';
    dom.colKindSelect.value = state.scopeFilter === 'coding' ? 'coding' : 'realm';
    renderColorSwatches(COLOR_PALETTE[state.boardConfig.columns.length % COLOR_PALETTE.length]);
    dom.colHideBtn.hidden = true;
    dom.colDeleteBtn.hidden = true;
    dom.colSaveBtn.textContent = 'Create Column';
    dom.colDialog.showModal();
    dom.colNameInput.focus();
}

function openColumnEditDialog(colKey) {
    const col = state.boardConfig.columns.find(c => c.key === colKey);
    if (!col) return;
    state.editingColumnKey = colKey;
    dom.colDialogHeading.textContent = `Edit Column — ${col.name}`;
    dom.colForm.hidden = false;
    dom.colManagerView.hidden = true;
    dom.colNameInput.value = col.name;
    dom.colKindSelect.value = col.kind || 'realm';
    renderColorSwatches(col.color || COLOR_PALETTE[0]);
    dom.colHideBtn.hidden = false;
    dom.colHideBtn.textContent = col.hidden ? 'Show Column' : 'Hide Column';
    dom.colDeleteBtn.hidden = false;
    dom.colSaveBtn.textContent = 'Save Column';
    dom.colDialog.showModal();
    dom.colNameInput.focus();
}

function openColumnManagerDialog() {
    dom.colDialogHeading.textContent = 'Manage Columns';
    dom.colForm.hidden = true;
    dom.colManagerView.hidden = false;
    renderColumnManagerList();
    dom.colDialog.showModal();
}

function renderColumnManagerList() {
    dom.colManagerList.innerHTML = '';
    state.boardConfig.columns.forEach((col, idx) => {
        const row = document.createElement('div');
        row.className = 'wc-manager-row';
        row.innerHTML = `
            <div class="wc-manager-row-left">
                <span class="wc-manager-color-bar" style="background:${escapeHtml(col.color || '#3b82f6')}"></span>
                <span class="wc-manager-name">${escapeHtml(col.name)}</span>
                <span class="wc-manager-kind">${col.kind === 'coding' ? 'Coding' : 'Realm'}</span>
            </div>
            <div class="wc-manager-row-right">
                <button type="button" class="wc-btn wc-btn-ghost wc-btn-xs wc-mgr-up" ${idx === 0 ? 'disabled' : ''} title="Move left">←</button>
                <button type="button" class="wc-btn wc-btn-ghost wc-btn-xs wc-mgr-down" ${idx === state.boardConfig.columns.length - 1 ? 'disabled' : ''} title="Move right">→</button>
                <button type="button" class="wc-btn wc-btn-ghost wc-btn-xs wc-mgr-toggle">${col.hidden ? 'Show' : 'Hide'}</button>
                <button type="button" class="wc-btn wc-btn-ghost wc-btn-xs wc-mgr-edit">Edit</button>
            </div>
        `;

        row.querySelector('.wc-mgr-up')?.addEventListener('click', () => {
            if (idx === 0) return;
            const arr = state.boardConfig.columns;
            [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
            renderColumnManagerList();
            renderBoard();
            saveBoardConfig();
        });

        row.querySelector('.wc-mgr-down')?.addEventListener('click', () => {
            const arr = state.boardConfig.columns;
            if (idx >= arr.length - 1) return;
            [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
            renderColumnManagerList();
            renderBoard();
            saveBoardConfig();
        });

        row.querySelector('.wc-mgr-toggle')?.addEventListener('click', () => {
            col.hidden = !col.hidden;
            renderColumnManagerList();
            renderBoard();
            saveBoardConfig();
        });

        row.querySelector('.wc-mgr-edit')?.addEventListener('click', () => {
            openColumnEditDialog(col.key);
        });

        dom.colManagerList.appendChild(row);
    });
}

dom.colDialogClose.addEventListener('click', () => dom.colDialog.close());
dom.colCancelBtn.addEventListener('click', () => dom.colDialog.close());
dom.colManagerDoneBtn.addEventListener('click', () => dom.colDialog.close());
dom.colManagerAddBtn.addEventListener('click', openAddColumnDialog);

dom.colForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = dom.colNameInput.value.trim();
    if (!name) return;

    if (state.editingColumnKey) {
        const col = state.boardConfig.columns.find(c => c.key === state.editingColumnKey);
        if (col) {
            col.name = name;
            col.kind = dom.colKindSelect.value;
            col.color = state.selectedColor;
        }
    } else {
        let key = slugifyKey(name);
        const existingKeys = new Set(state.boardConfig.columns.map(c => c.key));
        let suffix = 2;
        while (existingKeys.has(key)) {
            key = `${slugifyKey(name)}_${suffix++}`;
        }
        state.boardConfig.columns.push({
            key,
            name,
            color: state.selectedColor,
            kind: dom.colKindSelect.value,
            sortMode: 'manual',
            hidden: false
        });
    }

    dom.colDialog.close();
    renderBoard();
    await saveBoardConfig();
});

dom.colHideBtn.addEventListener('click', async () => {
    const col = state.boardConfig.columns.find(c => c.key === state.editingColumnKey);
    if (!col) return;
    col.hidden = !col.hidden;
    dom.colDialog.close();
    renderBoard();
    await saveBoardConfig();
});

dom.colDeleteBtn.addEventListener('click', async () => {
    const col = state.boardConfig.columns.find(c => c.key === state.editingColumnKey);
    if (!col) return;
    if (!confirm(`Remove column "${col.name}"? Any tasks in it will stay safe in Inbox / Unassigned.`)) return;

    state.boardConfig.columns = state.boardConfig.columns.filter(c => c.key !== col.key);
    dom.colDialog.close();
    renderBoard();
    await saveBoardConfig();
});

// --- TOOLBAR EVENTS ---
document.querySelectorAll('[data-scope]').forEach(btn => {
    btn.addEventListener('click', () => {
        state.scopeFilter = btn.dataset.scope;
        document.querySelectorAll('[data-scope]').forEach(b => b.classList.toggle('active', b === btn));
        renderAll();
    });
});

document.querySelectorAll('[data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
        state.statusFilter = btn.dataset.status;
        document.querySelectorAll('[data-status]').forEach(b => b.classList.toggle('active', b === btn));
        renderBoard();
    });
});

dom.searchInput.addEventListener('input', () => {
    state.searchQuery = dom.searchInput.value.trim();
    renderAll();
});

dom.toggleCalBtn.addEventListener('click', () => {
    state.boardConfig.calendarCollapsed = !state.boardConfig.calendarCollapsed;
    applyLayoutToggles();
    saveBoardConfig();
});

dom.compactBtn.addEventListener('click', () => {
    state.boardConfig.compactMode = !state.boardConfig.compactMode;
    applyLayoutToggles();
    saveBoardConfig();
});

dom.manageColsBtn.addEventListener('click', openColumnManagerDialog);
dom.addColBtn.addEventListener('click', openAddColumnDialog);
dom.refreshBtn.addEventListener('click', loadAllData);

// Calendar Week Navigation
dom.calPrev.addEventListener('click', () => {
    state.weekStart = addDays(state.weekStart, -7);
    renderCalendar();
});

dom.calToday.addEventListener('click', () => {
    state.weekStart = getSundayOfWeek(new Date());
    renderCalendar();
});

dom.calNext.addEventListener('click', () => {
    state.weekStart = addDays(state.weekStart, 7);
    renderCalendar();
});

// Global dragend safeguard so edge auto-scroll never sticks
window.addEventListener('dragend', clearDragState);

// --- BOOTSTRAP ---
setupDialogLightDismissFallback();
if (initAuth()) {
    loadAllData();
}
