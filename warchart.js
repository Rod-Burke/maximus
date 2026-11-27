'use strict';

const CONFIG = {
    MANAGE_ENDPOINT: 'https://xbrhqaztkqtlruocvwal.supabase.co/functions/v1/manage-thoughts',
    KEY: ''
};

const INBOX_KEY = '__inbox__';
const M2M_COLUMN_RENDER_CAP = 60;

const AIRMARIA_SCOPE_KEYWORDS = [
    'airmaria', 'air maria', 'chatops', 'chat ops', 'chat-ops', 'chat_ops',
    'chat_processor', 'chat-ops-bridge', 'quote_manager', 'quote manager',
    'chat_quotes', 'eucharistic quote', 'liturgy_explorer', 'liturgy explorer',
    'liturgy filler', 'homily_pipeline', 'homily', 'homilies', 'vid_update',
    'stream_management', 'backups_devops', 'backups_dashboard', 'runcloud',
    'wordpress', 'wp-admin', 'am-admin', 'franciscanfriars', 'youtube live',
    'vmix', 'samp_db', 'perpetual intention', 'long-term intention'
];

const OPENBRAIN_SCOPE_KEYWORDS = [
    'openbrain', 'open brain', 'open_brain', 'maximus', 'saint max',
    'warchart', 'war chart', 'm2m studio', 'mary to the moon', 'm2m_workflow',
    'manage-thoughts', 'voice-gateway', 'ingest-thought', 'sync-google',
    'google tasks', 'supabase', 'tasks.py', 'list_ready_tasks', 'antigravity'
];

const AIRMARIA_PROJECTS_SET = new Set([
    'chatops', 'chatops_participants', 'chatops_intentions',
    'chatops_today_enrichment', 'chatops_external_integrations',
    'quote_manager', 'liturgy_explorer', 'homily_pipeline',
    'stream_management', 'stream_scheduling_automation',
    'backups_devops', 'system_backups'
]);

function detectWorkspaceScope(content = '', summary = '', projectKey = '') {
    const proj = String(projectKey || '').trim().toLowerCase();
    if (AIRMARIA_PROJECTS_SET.has(proj)) return 'airmaria';
    const combined = `${summary || ''} ${content || ''}`.toLowerCase();
    let airScore = 0;
    let obScore = 0;
    for (const kw of AIRMARIA_SCOPE_KEYWORDS) {
        if (combined.includes(kw)) airScore++;
    }
    for (const kw of OPENBRAIN_SCOPE_KEYWORDS) {
        if (combined.includes(kw)) obScore++;
    }
    return airScore > obScore ? 'airmaria' : 'openbrain';
}

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
    { key: 'house_chapter', name: 'House Chapter', color: '#eab308', kind: 'realm', sortMode: 'manual', hidden: false },
    { key: 'fill_in', name: 'Fill-In Jobs', color: '#06b6d4', kind: 'realm', sortMode: 'manual', hidden: false }
];

const M2M_STAGES = [
    { key: 'idea', name: '💡 Ideas', color: '#94a3b8', frontLine: false },
    { key: 'queued', name: '🎯 Queued Next', color: '#f59e0b', frontLine: true },
    { key: 'research', name: '📚 Research', color: '#3b82f6', frontLine: true },
    { key: 'script', name: '✍️ Script Draft', color: '#a855f7', frontLine: true },
    { key: 'record', name: '🎙️ Record', color: '#ef4444', frontLine: true },
    { key: 'edit_graphics', name: '🎬 Edit & Graphics', color: '#ec4899', frontLine: true },
    { key: 'published', name: '🚀 Published', color: '#22c55e', frontLine: false }
];

const M2M_SUBSERIES = [
    { key: 'Peace to the Moon', color: '#38bdf8' },
    { key: 'Holy Science', color: '#fbbf24' },
    { key: 'Ad Astra', color: '#a78bfa' },
    { key: 'Religion in Space', color: '#f472b6' },
    { key: 'Space Follies', color: '#fb923c' },
    { key: 'Lost in Cyberspace', color: '#818cf8' },
    { key: 'Franciscan Ecology', color: '#4ade80' },
    { key: 'Rev Copernican Rev', color: '#2dd4bf' }
];

const M2M_CHECKLIST_STEPS = [
    { key: 'hook', label: 'Hook & Outline' },
    { key: 'recorded', label: 'Base Recording' },
    { key: 'pauses', label: 'Pauses Cleaned' },
    { key: 'broll', label: 'Stock / AI B-Roll' },
    { key: 'music', label: 'Music & Audio' },
    { key: 'thumbnail', label: 'Thumbnail & Title' },
    { key: 'published', label: 'Published Live' }
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
    activeBoard: 'life',       // 'life' | 'm2m'
    thoughts: [],              // Life board items (task, event, coding_task)
    m2mEpisodes: [],           // M2M Studio items (thoughts with metadata.m2m)
    configThoughtId: null,     // Supabase thought ID for warchart_config
    boardConfig: {
        columns: [],
        calendarCollapsed: false,
        compactMode: false,
        inboxCollapsed: false,
        fillInSeeded: false,
        quickDeleteMode: true,
        m2mViewMode: 'warchart',   // 'warchart' | 'kanban'
        m2mSeries: M2M_SUBSERIES.map(s => ({ ...s })),
        m2mSeriesOrder: M2M_SUBSERIES.map(s => s.key),
        m2mAutoRotate: true
    },
    triageMode: false,
    triageLastDropped: new Map(), // tileKey -> { taskId, title, kind, prevMeta }
    editingM2mSeriesKey: null,
    selectedM2mSeriesColor: '#38bdf8',
    lastDeleted: null,
    undoTimer: null,
    subprojectToParent: {},    // Maps coding subproject keys -> parent project key
    scopeFilter: 'all',        // 'all' | 'general' | 'coding'
    codingStatusFilter: 'all', // 'all' | 'ready' | 'verify' | 'clarify' | 'draft'
    statusFilter: 'all_active',// 'all_active' | 'unscheduled' | 'scheduled' | 'completed'
    m2mSubseriesFilter: 'all', // 'all' | subseries name (Kanban mode)
    m2mWcStageFilter: 'unpublished', // 'unpublished' | 'queued' | 'idea' | 'all' (War Chart mode)
    m2mExpandedCols: new Set(),
    searchQuery: '',
    weekStart: getSundayOfWeek(new Date()),
    editingTaskId: null,
    editingM2mId: null,
    m2mActiveTab: 'research',
    m2mResearchMode: 'read',   // 'read' | 'edit'
    editingColumnKey: null,
    selectedColor: COLOR_PALETTE[0],
    drag: {
        mode: null,            // 'card' | 'column' | 'cal-item' | 'm2m-card'
        id: null,
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
    boardLifeTab: document.getElementById('wc-board-life'),
    boardM2mTab: document.getElementById('wc-board-m2m'),
    m2mBadge: document.getElementById('wc-m2m-badge'),
    lifeFilters: document.getElementById('wc-life-filters'),
    m2mControls: document.getElementById('wc-m2m-controls'),
    m2mWcStageFilter: document.getElementById('wc-m2m-wc-stage-filter'),
    addSubseriesBtn: document.getElementById('wc-add-subseries-btn'),
    searchInput: document.getElementById('wc-search-input'),
    triageBtn: document.getElementById('wc-triage-btn'),
    toggleCalBtn: document.getElementById('wc-toggle-cal-btn'),
    compactBtn: document.getElementById('wc-compact-btn'),
    quickDeleteBtn: document.getElementById('wc-quick-delete-btn'),
    manageColsBtn: document.getElementById('wc-manage-cols-btn'),
    refreshBtn: document.getElementById('wc-refresh-btn'),
    addColBtn: document.getElementById('wc-add-col-btn'),
    addEpisodeBtn: document.getElementById('wc-add-episode-btn'),
    undoToast: document.getElementById('wc-undo-toast'),
    undoText: document.getElementById('wc-undo-text'),
    undoBtn: document.getElementById('wc-undo-btn'),

    // M2M SubSeries Filter Bar
    m2mSubseriesBar: document.getElementById('wc-m2m-subseries-bar'),
    subseriesPills: document.getElementById('wc-subseries-pills'),

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

    // Life Task Detail Dialog
    detailDialog: document.getElementById('wc-detail-dialog'),
    detailHeading: document.getElementById('wc-detail-heading'),
    detailStatusDot: document.getElementById('wc-detail-status-dot'),
    detailClose: document.getElementById('wc-detail-close'),
    detailForm: document.getElementById('wc-detail-form'),
    detailSummary: document.getElementById('wc-detail-summary'),
    detailContent: document.getElementById('wc-detail-content'),
    detailColumn: document.getElementById('wc-detail-column'),
    detailType: document.getElementById('wc-detail-type'),
    detailTaskStatusField: document.getElementById('wc-detail-task-status-field'),
    detailTaskStatus: document.getElementById('wc-detail-task-status'),
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
    detailM2mTransfer: document.getElementById('wc-detail-m2m-transfer'),
    detailM2mSubseries: document.getElementById('wc-detail-m2m-subseries'),
    detailMoveToM2m: document.getElementById('wc-detail-move-to-m2m'),
    detailMetaInfo: document.getElementById('wc-detail-meta-info'),
    detailToggleComplete: document.getElementById('wc-detail-toggle-complete'),
    detailToRef: document.getElementById('wc-detail-to-ref'),
    detailDelete: document.getElementById('wc-detail-delete'),
    detailCancel: document.getElementById('wc-detail-cancel'),
    detailSave: document.getElementById('wc-detail-save'),

    // M2M Episode Workspace Dialog
    m2mDialog: document.getElementById('wc-m2m-dialog'),
    m2mHeading: document.getElementById('wc-m2m-heading'),
    m2mClose: document.getElementById('wc-m2m-close'),
    m2mForm: document.getElementById('wc-m2m-form'),
    m2mTitle: document.getElementById('wc-m2m-title'),
    m2mSubseries: document.getElementById('wc-m2m-subseries'),
    m2mStage: document.getElementById('wc-m2m-stage'),
    m2mPanelResearch: document.getElementById('wc-m2m-panel-research'),
    m2mPanelScript: document.getElementById('wc-m2m-panel-script'),
    m2mPanelRefined: document.getElementById('wc-m2m-panel-refined'),
    m2mPanelProduction: document.getElementById('wc-m2m-panel-production'),
    m2mResearchStats: document.getElementById('wc-m2m-research-stats'),
    m2mResearchReadBtn: document.getElementById('wc-m2m-research-read-btn'),
    m2mResearchEditBtn: document.getElementById('wc-m2m-research-edit-btn'),
    m2mResearchReader: document.getElementById('wc-m2m-research-reader'),
    m2mResearchInput: document.getElementById('wc-m2m-research-input'),
    m2mLinksPreview: document.getElementById('wc-m2m-links-preview'),
    m2mScriptStats: document.getElementById('wc-m2m-script-stats'),
    m2mScriptInput: document.getElementById('wc-m2m-script-input'),
    m2mRoughRefineStatus: document.getElementById('wc-m2m-rough-refine-status'),
    m2mRefineFromRoughBtn: document.getElementById('wc-m2m-refine-from-rough-btn'),
    m2mRefinedStats: document.getElementById('wc-m2m-refined-stats'),
    m2mPacingCard: document.getElementById('wc-m2m-pacing-card'),
    m2mPacingSummary: document.getElementById('wc-m2m-pacing-summary'),
    m2mPacingBody: document.getElementById('wc-m2m-pacing-body'),
    m2mRefinedInput: document.getElementById('wc-m2m-refined-input'),
    m2mRefinedStatus: document.getElementById('wc-m2m-refined-status'),
    m2mUndoRefineBtn: document.getElementById('wc-m2m-undo-refine-btn'),
    m2mRefineEditsBtn: document.getElementById('wc-m2m-refine-edits-btn'),
    m2mChecklist: document.getElementById('wc-m2m-checklist'),
    m2mVideoUrl: document.getElementById('wc-m2m-video-url'),
    m2mGraphicsInput: document.getElementById('wc-m2m-graphics-input'),
    m2mDelete: document.getElementById('wc-m2m-delete'),
    m2mToInbox: document.getElementById('wc-m2m-to-inbox'),
    m2mMetaInfo: document.getElementById('wc-m2m-meta-info'),
    m2mCancel: document.getElementById('wc-m2m-cancel'),
    m2mSave: document.getElementById('wc-m2m-save'),

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
    colManagerDoneBtn: document.getElementById('wc-col-manager-done-btn'),

    // M2M SubSeries Dialog
    m2mSeriesDialog: document.getElementById('wc-m2m-series-dialog'),
    m2mSeriesHeading: document.getElementById('wc-m2m-series-heading'),
    m2mSeriesClose: document.getElementById('wc-m2m-series-close'),
    m2mSeriesForm: document.getElementById('wc-m2m-series-form'),
    m2mSeriesNameInput: document.getElementById('wc-m2m-series-name-input'),
    m2mSeriesSwatches: document.getElementById('wc-m2m-series-swatches'),
    m2mSeriesHint: document.getElementById('wc-m2m-series-hint'),
    m2mSeriesDeleteBtn: document.getElementById('wc-m2m-series-delete-btn'),
    m2mSeriesCancelBtn: document.getElementById('wc-m2m-series-cancel-btn'),
    m2mSeriesSaveBtn: document.getElementById('wc-m2m-series-save-btn')
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

function countWords(text) {
    const trimmed = (text || '').trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
}

function renderSimpleMarkdown(rawText) {
    if (!rawText || !rawText.trim()) {
        return '<p style="color: var(--wc-text-dim); font-style: italic;">No research notes yet. Click "Edit" above to start writing or pasting research.</p>';
    }
    const safe = escapeHtml(rawText);
    const lines = safe.split(/\r?\n/);
    let html = '';
    let inList = false;

    const inlineFormat = (line) => {
        return line
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            .replace(/(^|[\s(])(https?:\/\/[^\s<)"]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            if (inList) { html += '</ul>'; inList = false; }
            continue;
        }
        if (trimmed.startsWith('### ')) {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<h3>${inlineFormat(trimmed.slice(4))}</h3>`;
        } else if (trimmed.startsWith('## ')) {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<h2>${inlineFormat(trimmed.slice(3))}</h2>`;
        } else if (trimmed.startsWith('# ')) {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<h1>${inlineFormat(trimmed.slice(2))}</h1>`;
        } else if (/^[-*•]\s+/.test(trimmed)) {
            if (!inList) { html += '<ul>'; inList = true; }
            html += `<li>${inlineFormat(trimmed.replace(/^[-*•]\s+/, ''))}</li>`;
        } else {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<p>${inlineFormat(trimmed)}</p>`;
        }
    }
    if (inList) html += '</ul>';
    return html;
}

function normalizeM2mSeries(savedSeries, savedOrder) {
    if (Array.isArray(savedSeries) && savedSeries.length > 0) {
        const seen = new Set();
        const cleaned = [];
        for (const item of savedSeries) {
            const key = String(item?.key || '').trim();
            if (!key || seen.has(key.toLowerCase())) continue;
            seen.add(key.toLowerCase());
            cleaned.push({ key, color: item.color || '#38bdf8' });
        }
        if (cleaned.length > 0) return cleaned;
    }
    const order = normalizeM2mSeriesOrder(savedOrder);
    return order.map(key => {
        const def = M2M_SUBSERIES.find(s => s.key.toLowerCase() === key.toLowerCase());
        return { key, color: def ? def.color : '#38bdf8' };
    });
}

function getSubseriesColor(name) {
    const list = getOrderedM2mSeries();
    const found = list.find(s => s.key.toLowerCase() === (name || '').toLowerCase());
    if (found) return found.color;
    const def = M2M_SUBSERIES.find(s => s.key.toLowerCase() === (name || '').toLowerCase());
    return def ? def.color : '#94a3b8';
}

function getStageMeta(stageKey) {
    return M2M_STAGES.find(s => s.key === stageKey) || M2M_STAGES[0];
}

function normalizeM2mSeriesOrder(saved) {
    const defaults = M2M_SUBSERIES.map(s => s.key);
    if (!Array.isArray(saved) || saved.length === 0) return defaults;
    const validSet = new Set(defaults);
    const ordered = saved.filter(k => validSet.has(k));
    defaults.forEach(k => { if (!ordered.includes(k)) ordered.push(k); });
    return ordered;
}

function getOrderedM2mSeries() {
    if (Array.isArray(state.boardConfig.m2mSeries) && state.boardConfig.m2mSeries.length > 0) {
        return state.boardConfig.m2mSeries;
    }
    return M2M_SUBSERIES.map(s => ({ ...s }));
}

function interleaveBySeriesRotation(episodes) {
    const seriesKeys = getOrderedM2mSeries().map(s => s.key);
    const buckets = new Map();
    seriesKeys.forEach(k => buckets.set(k, []));
    const otherBucket = [];

    for (const ep of episodes) {
        const ss = ep.metadata?.m2m?.subseries || 'Other';
        if (buckets.has(ss)) buckets.get(ss).push(ep);
        else otherBucket.push(ep);
    }

    const sortedKeys = [...seriesKeys];
    if (otherBucket.length) {
        buckets.set('Other', otherBucket);
        sortedKeys.push('Other');
    }

    let maxDepth = 0;
    for (const k of sortedKeys) {
        const sorted = sortColumnTasks(buckets.get(k) || [], 'manual');
        buckets.set(k, sorted);
        if (sorted.length > maxDepth) maxDepth = sorted.length;
    }

    const interleaved = [];
    let pos = 0;
    for (let row = 0; row < maxDepth; row++) {
        for (const k of sortedKeys) {
            const list = buckets.get(k);
            if (row < list.length) {
                pos++;
                interleaved.push({
                    episode: list[row],
                    cycle: row + 1,
                    pos
                });
            }
        }
    }
    return interleaved;
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

// --- LIGHT-DISMISS FALLBACK FOR <dialog closedby="any"> ---
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
        const [wcConfigRes, projConfigRes, itemsRes, m2mRes] = await Promise.all([
            apiCall({ action: 'list', types: ['warchart_config'], limit: 1 }),
            apiCall({ action: 'list', types: ['projects_config'], limit: 1 }),
            apiCall({ action: 'list', types: ['task', 'event', 'coding_task'], limit: 1000 }),
            apiCall({ action: 'list', m2m_only: true, limit: 1000 })
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
                inboxCollapsed: Boolean(wcConfigThought.metadata.inboxCollapsed),
                fillInSeeded: Boolean(wcConfigThought.metadata.fillInSeeded),
                quickDeleteMode: wcConfigThought.metadata.quickDeleteMode !== undefined
                    ? Boolean(wcConfigThought.metadata.quickDeleteMode)
                    : true,
                m2mViewMode: wcConfigThought.metadata.m2mViewMode === 'kanban' ? 'kanban' : 'warchart',
                m2mSeries: normalizeM2mSeries(wcConfigThought.metadata.m2mSeries, wcConfigThought.metadata.m2mSeriesOrder),
                m2mSeriesOrder: normalizeM2mSeries(wcConfigThought.metadata.m2mSeries, wcConfigThought.metadata.m2mSeriesOrder).map(s => s.key),
                m2mAutoRotate: wcConfigThought.metadata.m2mAutoRotate !== undefined
                    ? Boolean(wcConfigThought.metadata.m2mAutoRotate)
                    : true
            };
            const existingKeys = new Set(state.boardConfig.columns.map(c => c.key));
            let changed = false;

            // One-time seed of Fill-In Jobs column for existing configs
            if (!state.boardConfig.fillInSeeded && !existingKeys.has('fill_in')) {
                const insertAt = state.boardConfig.columns.findIndex(c => c.kind === 'coding');
                const fillInCol = { key: 'fill_in', name: 'Fill-In Jobs', color: '#06b6d4', kind: 'realm', sortMode: 'manual', hidden: false };
                if (insertAt >= 0) state.boardConfig.columns.splice(insertAt, 0, fillInCol);
                else state.boardConfig.columns.push(fillInCol);
                existingKeys.add('fill_in');
                state.boardConfig.fillInSeeded = true;
                changed = true;
            }

            codingProjects.forEach(cp => {
                if (!existingKeys.has(cp.key)) {
                    state.boardConfig.columns.push(cp);
                    existingKeys.add(cp.key);
                    changed = true;
                }
            });
            if (changed) saveBoardConfig();
        } else {
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
                inboxCollapsed: false,
                fillInSeeded: true,
                quickDeleteMode: true,
                m2mViewMode: 'warchart',
                m2mSeries: M2M_SUBSERIES.map(s => ({ ...s })),
                m2mSeriesOrder: M2M_SUBSERIES.map(s => s.key),
                m2mAutoRotate: true
            };
            await saveBoardConfig();
        }

        // 3. Store Life tasks & M2M episodes
        state.thoughts = Array.isArray(itemsRes.thoughts) ? itemsRes.thoughts : [];
        state.m2mEpisodes = (Array.isArray(m2mRes.thoughts) ? m2mRes.thoughts : [])
            .filter(t => t?.metadata?.m2m && typeof t.metadata.m2m === 'object');
        dom.m2mBadge.textContent = String(state.m2mEpisodes.length);

        populateM2mDropdowns();
        applyBoardModeUI();
        renderAll();
        setSaveStatus('saved', `Synced (${state.thoughts.length + state.m2mEpisodes.length})`);
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
        inboxCollapsed: state.boardConfig.inboxCollapsed,
        fillInSeeded: state.boardConfig.fillInSeeded,
        quickDeleteMode: state.boardConfig.quickDeleteMode,
        m2mViewMode: state.boardConfig.m2mViewMode,
        m2mSeries: state.boardConfig.m2mSeries,
        m2mSeriesOrder: (state.boardConfig.m2mSeries || M2M_SUBSERIES).map(s => s.key),
        m2mAutoRotate: state.boardConfig.m2mAutoRotate
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
    let title = (m.summary || t?.content || '').trim();
    title = title.replace(/^Notion Note\s*-\s*/i, '').replace(/:\s*$/, '').trim();
    return title || '(Untitled)';
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

function matchesLifeFilters(t) {
    const type = getTaskType(t);
    if (type === 'event') return false;
    // Keep M2M Studio episodes out of Life Board Inbox (unless explicitly filed under M2M Workflow)
    if (t.metadata?.m2m && t.metadata?.project !== 'm2m_workflow') return false;

    if (state.scopeFilter === 'general' && type !== 'task') return false;
    if (state.scopeFilter === 'coding' && type !== 'coding_task') return false;

    if (state.codingStatusFilter !== 'all') {
        if (type !== 'coding_task') return false;
        const ctStatus = t.metadata?.coding_task?.status || 'draft';
        if (state.codingStatusFilter === 'ready' && !['ready_for_antigravity', 'rework_in_antigravity'].includes(ctStatus)) return false;
        if (state.codingStatusFilter === 'verify' && !['needs_verification', 'needs_logging'].includes(ctStatus)) return false;
        if (state.codingStatusFilter === 'clarify' && !['needs_clarification', 'needs_plan', 'needs_plan_approval', 'in_progress'].includes(ctStatus)) return false;
        if (state.codingStatusFilter === 'draft' && ctStatus !== 'draft') return false;
    }

    const completed = isTaskCompleted(t);
    const scheduled = Boolean(t.metadata?.due_date);

    if (state.statusFilter === 'all_active' && completed) return false;
    if (state.statusFilter === 'unscheduled' && (completed || scheduled)) return false;
    if (state.statusFilter === 'scheduled' && (completed || !scheduled)) return false;
    if (state.statusFilter === 'completed' && !completed) return false;

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

function matchesM2mFilters(ep) {
    const m2m = ep.metadata?.m2m || {};
    if (state.m2mSubseriesFilter !== 'all') {
        if ((m2m.subseries || '').toLowerCase() !== state.m2mSubseriesFilter.toLowerCase()) {
            return false;
        }
    }
    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        const hay = [
            ep.metadata?.summary,
            ep.content,
            m2m.subseries,
            m2m.research_doc,
            m2m.script_draft,
            m2m.graphics_notes
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

// --- BOARD MODE & LAYOUT TOGGLES ---
function applyBoardModeUI() {
    const isM2m = state.activeBoard === 'm2m';
    const isM2mWarChart = isM2m && state.boardConfig.m2mViewMode === 'warchart';

    dom.boardLifeTab.classList.toggle('active', !isM2m);
    dom.boardLifeTab.setAttribute('aria-selected', String(!isM2m));
    dom.boardM2mTab.classList.toggle('active', isM2m);
    dom.boardM2mTab.setAttribute('aria-selected', String(isM2m));

    dom.lifeFilters.hidden = isM2m;
    dom.m2mControls.hidden = !isM2m;
    dom.m2mWcStageFilter.hidden = !isM2mWarChart;
    dom.addSubseriesBtn.hidden = !isM2m;
    dom.m2mSubseriesBar.hidden = !isM2m || isM2mWarChart;
    dom.triageBtn.hidden = isM2m;
    dom.triageBtn.classList.toggle('active', !isM2m && state.triageMode);
    dom.toggleCalBtn.hidden = isM2m;
    dom.manageColsBtn.hidden = isM2m;
    dom.addColBtn.hidden = isM2m;
    dom.addEpisodeBtn.hidden = !isM2m;

    document.querySelectorAll('[data-m2m-view]').forEach(btn => {
        const active = btn.dataset.m2mView === state.boardConfig.m2mViewMode;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', String(active));
    });

    dom.searchInput.placeholder = isM2m ? 'Search episodes & research…' : 'Search tasks…';

    dom.calPane.classList.toggle('is-collapsed', isM2m || state.boardConfig.calendarCollapsed);
    dom.toggleCalBtn.classList.toggle('active', !state.boardConfig.calendarCollapsed);
    dom.app.classList.toggle('is-compact', state.boardConfig.compactMode);
    dom.compactBtn.classList.toggle('active', state.boardConfig.compactMode);
    dom.app.classList.toggle('is-quick-delete', state.boardConfig.quickDeleteMode);
    dom.quickDeleteBtn.classList.toggle('is-danger-active', state.boardConfig.quickDeleteMode);
    dom.quickDeleteBtn.classList.toggle('active', state.boardConfig.quickDeleteMode);
}

// --- RENDERING DISPATCH ---
function renderAll() {
    dom.m2mBadge.textContent = String(state.m2mEpisodes.length);
    if (state.activeBoard === 'm2m') {
        dom.boardTrack.classList.remove('is-triage');
        if (state.boardConfig.m2mViewMode === 'warchart') {
            renderM2mSeriesWarChart();
        } else {
            renderM2mSubseriesBar();
            renderM2mKanban();
        }
    } else {
        renderCalendar();
        renderLifeBoard();
    }
}

// --- WEEKLY CALENDAR (LIFE BOARD) ---
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

// --- COLUMN SCROLL POSITION PRESERVATION ---
function captureColumnScrollPositions() {
    const map = new Map();
    dom.boardTrack.querySelectorAll('.wc-col-body').forEach(el => {
        const key = el.dataset.colKey || el.dataset.seriesKey || el.dataset.stageKey;
        if (key && el.scrollTop > 0) {
            map.set(key, el.scrollTop);
        }
    });
    return map;
}

function restoreColumnScrollPositions(map) {
    if (!map || map.size === 0) return;
    dom.boardTrack.querySelectorAll('.wc-col-body').forEach(el => {
        const key = el.dataset.colKey || el.dataset.seriesKey || el.dataset.stageKey;
        if (key && map.has(key)) {
            el.scrollTop = map.get(key);
        }
    });
}

// --- LIFE WAR CHART BOARD ---
function getVisibleLifeColumns() {
    return state.boardConfig.columns.filter((col) => {
        if (col.hidden) return false;
        if (state.scopeFilter === 'general' && col.kind === 'coding') return false;
        if (state.scopeFilter === 'coding' && col.kind !== 'coding') return false;
        return true;
    });
}

function renderLifeBoard() {
    const grouped = new Map();
    grouped.set(INBOX_KEY, []);
    state.boardConfig.columns.forEach(c => grouped.set(c.key, []));

    for (const t of state.thoughts) {
        if (!matchesLifeFilters(t)) continue;
        const colKey = getTaskColumnKey(t);
        (grouped.get(colKey) || grouped.get(INBOX_KEY)).push(t);
    }

    const scrollLeft = dom.boardViewport.scrollLeft;
    const colScrolls = captureColumnScrollPositions();
    dom.boardTrack.innerHTML = '';

    const inboxTasks = sortColumnTasks(grouped.get(INBOX_KEY) || [], 'manual');
    const inboxCol = {
        key: INBOX_KEY,
        name: 'Inbox / Unassigned',
        color: '#94a3b8',
        kind: 'inbox',
        sortMode: 'manual'
    };

    if (state.triageMode) {
        renderInboxTriageBoard(inboxCol, inboxTasks, grouped);
        restoreColumnScrollPositions(colScrolls);
        return;
    }

    dom.boardTrack.classList.remove('is-triage');
    dom.boardTrack.appendChild(createLifeColumnElement(inboxCol, inboxTasks, true));

    for (const col of getVisibleLifeColumns()) {
        const colTasks = sortColumnTasks(grouped.get(col.key) || [], col.sortMode);
        dom.boardTrack.appendChild(createLifeColumnElement(col, colTasks, false));
    }

    dom.boardViewport.scrollLeft = scrollLeft;
    restoreColumnScrollPositions(colScrolls);
}

// --- INBOX TRIAGE / BULK SORT MODE ---
function renderInboxTriageBoard(inboxCol, inboxTasks, grouped) {
    dom.boardTrack.classList.add('is-triage');

    // Left: Scrollable Inbox column (always expanded in Triage Mode)
    const wasCollapsed = state.boardConfig.inboxCollapsed;
    state.boardConfig.inboxCollapsed = false;
    const inboxEl = createLifeColumnElement(inboxCol, inboxTasks, true);
    state.boardConfig.inboxCollapsed = wasCollapsed;
    inboxEl.classList.add('wc-triage-inbox');
    dom.boardTrack.appendChild(inboxEl);

    // Right: Responsive grid of Project Drop Tiles + Special Action Tiles
    const pane = document.createElement('div');
    pane.className = 'wc-triage-tiles-pane';
    pane.innerHTML = `
        <div class="wc-triage-header">
            <div>
                <h2>📥 Inbox Triage — Drag cards onto a project tile</h2>
                <p>The last dropped card stays visible in each tile until you drop another one there.</p>
            </div>
            <button type="button" class="wc-btn wc-btn-ghost wc-btn-xs" id="wc-triage-exit-btn">Exit Triage</button>
        </div>
    `;
    pane.querySelector('#wc-triage-exit-btn')?.addEventListener('click', () => {
        state.triageMode = false;
        applyBoardModeUI();
        renderAll();
    });

    const grid = document.createElement('div');
    grid.className = 'wc-triage-grid';

    // All visible Life & Coding project columns as drop tiles
    for (const col of getVisibleLifeColumns()) {
        const count = (grouped.get(col.key) || []).length;
        grid.appendChild(createTriageTile({
            key: col.key,
            title: col.name,
            accent: col.color || '#fbbf24',
            count,
            isSpecial: false,
            onDrop: (taskId) => handleTriageDropToProject(taskId, col)
        }));
    }

    // Special Action Tiles
    const defaultSs = getOrderedM2mSeries()[0]?.key || 'Peace to the Moon';
    grid.appendChild(createTriageTile({
        key: '__m2m__',
        title: `🎥 Move to M2M Studio`,
        accent: '#a78bfa',
        count: state.m2mEpisodes.length,
        isSpecial: true,
        emptyHint: `Drop to send to M2M (${defaultSs})`,
        onDrop: (taskId) => handleTriageDropToM2m(taskId, defaultSs)
    }));

    grid.appendChild(createTriageTile({
        key: '__ref__',
        title: '📖 Procedure / Reference',
        accent: '#38bdf8',
        count: null,
        isSpecial: true,
        emptyHint: 'Drop to save as Briefing Ref (leaves War Chart)',
        onDrop: (taskId) => handleTriageDropToRef(taskId)
    }));

    grid.appendChild(createTriageTile({
        key: '__delete__',
        title: '🗑 Delete Permanently',
        accent: '#ef4444',
        count: null,
        isSpecial: true,
        emptyHint: 'Drop to delete (Undo toast available)',
        onDrop: (taskId) => {
            const task = state.thoughts.find(t => t.id === taskId);
            if (!task) return;
            state.triageLastDropped.set('__delete__', {
                taskId,
                title: getTaskTitle(task),
                label: 'Deleted',
                canUndo: false
            });
            quickDeleteItem('life', taskId);
        }
    }));

    pane.appendChild(grid);
    dom.boardTrack.appendChild(pane);
}

function createTriageTile({ key, title, accent, count, isSpecial, emptyHint, onDrop }) {
    const tile = document.createElement('div');
    tile.className = `wc-triage-tile${isSpecial ? ' is-special' : ''}`;
    tile.style.setProperty('--tile-accent', accent);
    tile.dataset.tileKey = key;

    const head = document.createElement('div');
    head.className = 'wc-triage-tile-head';
    head.innerHTML = `
        <span class="wc-triage-tile-title">${escapeHtml(title)}</span>
        ${count !== null && count !== undefined ? `<span class="wc-col-count">${count}</span>` : ''}
    `;
    tile.appendChild(head);

    const slot = document.createElement('div');
    slot.className = 'wc-triage-drop-slot';
    const last = state.triageLastDropped.get(key);
    if (last) {
        const card = document.createElement('div');
        card.className = 'wc-triage-last-card';
        card.innerHTML = `
            <div class="wc-triage-last-title">${escapeHtml(last.title)}</div>
            <div class="wc-triage-last-foot">
                <span>✓ ${escapeHtml(last.label || 'Moved here')}</span>
                ${last.canUndo ? '<button type="button" class="wc-triage-undo-btn">↩ Undo</button>' : ''}
            </div>
        `;
        card.querySelector('.wc-triage-undo-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            handleTriageUndo(key);
        });
        slot.appendChild(card);
    } else {
        slot.innerHTML = `<span class="wc-triage-empty-hint">${escapeHtml(emptyHint || 'Drop task here')}</span>`;
    }
    tile.appendChild(slot);

    tile.addEventListener('dragover', (e) => {
        if (state.drag.mode !== 'card') return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        tile.classList.add('is-drop-target');
    });

    tile.addEventListener('dragleave', (e) => {
        if (!tile.contains(e.relatedTarget)) {
            tile.classList.remove('is-drop-target');
        }
    });

    tile.addEventListener('drop', (e) => {
        e.preventDefault();
        tile.classList.remove('is-drop-target');
        const taskId = state.drag.id || e.dataTransfer.getData('text/plain');
        if (taskId && state.drag.mode === 'card') {
            onDrop(taskId);
        }
        clearDragState();
    });

    return tile;
}

async function handleTriageDropToProject(taskId, col) {
    const task = state.thoughts.find(t => t.id === taskId);
    if (!task) return;
    const prevMeta = JSON.parse(JSON.stringify(task.metadata || {}));

    // Place at top of target column
    const colTasks = state.thoughts.filter(t => t.id !== taskId && getTaskColumnKey(t) === col.key);
    let minOrder = 100000;
    for (const ct of colTasks) {
        const o = getTaskOrderValue(ct);
        if (o < minOrder) minOrder = o;
    }
    const newOrder = minOrder - 1000;

    const metaPatch = { warchart_order: newOrder };
    if (getTaskType(task) === 'coding_task') {
        metaPatch.coding_task = { ...(task.metadata?.coding_task || {}), project: col.key };
    } else {
        metaPatch.project = col.key;
    }

    task.metadata = { ...(task.metadata || {}), ...metaPatch };
    state.triageLastDropped.set(col.key, {
        taskId,
        title: getTaskTitle(task),
        label: `Moved to ${col.name}`,
        kind: 'project',
        prevMeta,
        canUndo: true
    });
    renderAll();
    await trackSave(apiCall({ action: 'update', id: taskId, metadata: metaPatch }));
}

async function handleTriageDropToM2m(taskId, subseries) {
    const task = state.thoughts.find(t => t.id === taskId);
    if (!task) return;
    const prevMeta = JSON.parse(JSON.stringify(task.metadata || {}));
    const metaPatch = {
        m2m: {
            ...(task.metadata?.m2m || {}),
            subseries,
            stage: task.metadata?.m2m?.stage || 'idea',
            research_doc: task.metadata?.m2m?.research_doc || task.content || ''
        }
    };
    task.metadata = { ...(task.metadata || {}), ...metaPatch };
    if (!state.m2mEpisodes.some(e => e.id === task.id)) {
        state.m2mEpisodes.unshift(task);
    }
    state.triageLastDropped.set('__m2m__', {
        taskId,
        title: getTaskTitle(task),
        label: `Sent to M2M (${subseries})`,
        kind: 'm2m',
        prevMeta,
        canUndo: true
    });
    renderAll();
    await trackSave(apiCall({ action: 'update', id: taskId, metadata: metaPatch }));
}

async function handleTriageDropToRef(taskId) {
    const task = state.thoughts.find(t => t.id === taskId);
    if (!task) return;
    const prevMeta = JSON.parse(JSON.stringify(task.metadata || {}));
    const metaPatch = { type: 'reference', status: null };
    task.metadata = { ...(task.metadata || {}), ...metaPatch };
    state.thoughts = state.thoughts.filter(t => t.id !== taskId);
    state.triageLastDropped.set('__ref__', {
        taskId,
        taskSnapshot: task,
        title: getTaskTitle(task),
        label: 'Saved as Reference',
        kind: 'ref',
        prevMeta,
        canUndo: true
    });
    renderAll();
    await trackSave(apiCall({ action: 'update', id: taskId, metadata: metaPatch }));
}

async function handleTriageUndo(tileKey) {
    const entry = state.triageLastDropped.get(tileKey);
    if (!entry || !entry.canUndo) return;
    state.triageLastDropped.delete(tileKey);

    if (entry.kind === 'ref' && entry.taskSnapshot) {
        entry.taskSnapshot.metadata = entry.prevMeta;
        state.thoughts.unshift(entry.taskSnapshot);
    } else {
        const task = state.thoughts.find(t => t.id === entry.taskId);
        if (task) task.metadata = entry.prevMeta;
        if (entry.kind === 'm2m') {
            state.m2mEpisodes = state.m2mEpisodes.filter(e => e.id !== entry.taskId);
        }
    }
    renderAll();
    await trackSave(apiCall({ action: 'update', id: entry.taskId, metadata: entry.prevMeta }));
}

function createLifeColumnElement(col, tasks, isInbox) {
    const colEl = document.createElement('section');
    colEl.className = `wc-column${isInbox ? ' is-inbox' : ''}${isInbox && state.boardConfig.inboxCollapsed ? ' is-collapsed' : ''}`;
    colEl.dataset.colKey = col.key;
    colEl.style.setProperty('--col-accent', col.color || '#fbbf24');

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
        ? `<button type="button" class="wc-col-btn wc-col-quickadd-btn" title="Quick add unassigned task" aria-label="Add task">+ Add</button>
           <button type="button" class="wc-col-btn wc-inbox-collapse-btn" title="Collapse Inbox rail" aria-label="Collapse Inbox">« Collapse</button>`
        : `<button type="button" class="wc-col-btn wc-col-quickadd-btn" title="Add task to ${escapeHtml(col.name)}" aria-label="Add task">+ Add</button>
           <button type="button" class="wc-col-btn wc-col-sort-btn${col.sortMode === 'date' ? ' is-date-sort' : ''}" title="${col.sortMode === 'date' ? 'Sorted by Date (click for Manual drag order)' : 'Manual Drag Order (click to sort by Date)'}" aria-label="Toggle sort order">${col.sortMode === 'date' ? '📅 Date' : '↕ Manual'}</button>
           <button type="button" class="wc-col-btn wc-col-edit-btn" title="Rename, recolor, or delete column" aria-label="Edit column">✎ Edit</button>
           <button type="button" class="wc-col-btn wc-col-hide-inline-btn" title="Hide column (keeps tasks safe in OpenBrain)" aria-label="Hide column">Hide</button>`;

    headerEl.innerHTML = `
        <div class="wc-col-title-wrap">
            ${gripSvg}
            <h2 class="wc-col-title">${escapeHtml(col.name)}</h2>
            <span class="wc-col-count">${tasks.length}</span>
        </div>
        <div class="wc-col-actions">${actionsHtml}</div>
    `;

    if (isInbox) {
        headerEl.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            if (state.boardConfig.inboxCollapsed) {
                state.boardConfig.inboxCollapsed = false;
                renderLifeBoard();
                saveBoardConfig();
            }
        });
        headerEl.querySelector('.wc-inbox-collapse-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            state.boardConfig.inboxCollapsed = true;
            renderLifeBoard();
            saveBoardConfig();
        });
    } else {
        headerEl.querySelector('.wc-col-sort-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            col.sortMode = col.sortMode === 'date' ? 'manual' : 'date';
            renderLifeBoard();
            saveBoardConfig();
        });
        headerEl.querySelector('.wc-col-edit-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            openColumnEditDialog(col.key);
        });
        headerEl.querySelector('.wc-col-hide-inline-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            col.hidden = true;
            renderLifeBoard();
            saveBoardConfig();
        });
    }

    const quickAddEl = document.createElement('div');
    quickAddEl.className = 'wc-col-quick-add';
    quickAddEl.hidden = true;
    quickAddEl.innerHTML = `
        <input type="text" class="wc-quick-add-input" placeholder="New task title… (Enter to add)">
        <div class="wc-quick-add-hint"><span>Enter to save · Esc to close</span></div>
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
                await createQuickLifeTask(col, title);
                quickInput.value = '';
                quickInput.disabled = false;
                quickInput.focus();
            } catch {
                quickInput.disabled = false;
            }
        }
    });

    const bodyEl = document.createElement('div');
    bodyEl.className = 'wc-col-body';
    bodyEl.dataset.colKey = col.key;

    if (tasks.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'wc-col-empty';
        emptyEl.textContent = isInbox ? 'All tasks organized!' : 'Drop tasks here or click +';
        bodyEl.appendChild(emptyEl);
    } else {
        const highlightFrontLine = !isInbox && state.statusFilter !== 'completed';
        tasks.forEach((task, idx) => {
            bodyEl.appendChild(createLifeCardElement(task, col.key, idx, highlightFrontLine && idx === 0));
        });
    }

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
            if (dropIndicator.parentElement === bodyEl) dropIndicator.remove();
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
            moveLifeCardToColumn(state.drag.id, col.key, insertIdx);
            clearDragState();
        }
    });

    colEl.appendChild(headerEl);
    colEl.appendChild(quickAddEl);
    colEl.appendChild(bodyEl);
    return colEl;
}

function createLifeCardElement(task, colKey, idx, isFrontLine) {
    const card = document.createElement('article');
    const statusClass = getTaskStatusClass(task);
    const completed = isTaskCompleted(task);
    const m = task.metadata || {};
    const type = getTaskType(task);

    card.className = `wc-card ${statusClass}${isFrontLine ? ' is-front-line' : ''}`;
    card.draggable = true;
    card.dataset.taskId = task.id;
    card.dataset.colKey = colKey;

    const pills = [];
    if (m.due_date) {
        const isOverdue = !completed && m.due_date < getLocalDateStr();
        const timeText = m.start_time ? ` ${format12HourTime(m.start_time)}` : '';
        pills.push(`<span class="wc-pill wc-pill-date${isOverdue ? ' is-overdue' : ''}">📅 ${escapeHtml(formatShortDate(m.due_date))}${escapeHtml(timeText)}</span>`);
    }
    if (type === 'task' && m.status === 'in_progress') {
        pills.push(`<span class="wc-pill wc-pill-in-progress">▶ In Progress</span>`);
    }
    if (type === 'coding_task') {
        const ctStatus = m.coding_task?.status || 'draft';
        const label = CODING_STATUS_LABELS[ctStatus] || ctStatus;
        const isReady = ctStatus === 'ready_for_antigravity' || ctStatus === 'rework_in_antigravity';
        const isVerify = ctStatus === 'needs_verification' || ctStatus === 'needs_logging';
        const pillCls = isReady ? 'wc-pill-coding-ready' : isVerify ? 'wc-pill-coding-verify' : 'wc-pill-coding';
        const icon = isReady ? '🚀' : '⚡';
        pills.push(`<span class="wc-pill ${pillCls}">${icon} ${escapeHtml(label)}</span>`);
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
    const frontLineHtml = isFrontLine ? `<div class="wc-front-line-tag">★ Front Line</div>` : '';
    const topBtnHtml = `<button type="button" class="wc-card-top-btn${idx === 0 ? ' is-at-top' : ''}" title="To Top (set priority #1 in column)" aria-label="Move to top">⬆</button>`;
    const delBtnHtml = state.boardConfig.quickDeleteMode
        ? `<button type="button" class="wc-card-del-btn" title="Delete permanently (does not mark done)" aria-label="Delete task">🗑</button>`
        : '';
    const actionsClusterHtml = `<div class="wc-card-actions">${topBtnHtml}${delBtnHtml}</div>`;

    card.innerHTML = `
        ${actionsClusterHtml}
        ${frontLineHtml}
        <div class="wc-card-main">
            <label class="wc-cb-wrap" title="${completed ? 'Mark incomplete' : 'Mark complete'}">
                <input type="checkbox" class="wc-cb" ${completed ? 'checked' : ''} aria-label="Mark ${escapeHtml(getTaskTitle(task))} complete">
            </label>
            <div class="wc-card-title">${escapeHtml(getTaskTitle(task))}</div>
        </div>
        ${metaHtml}
    `;

    const cbWrap = card.querySelector('.wc-cb-wrap');
    const cb = card.querySelector('.wc-cb');
    cbWrap.addEventListener('click', (e) => e.stopPropagation());
    cb.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleTaskComplete(task.id, cb.checked);
    });

    card.querySelector('.wc-card-top-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        moveCardToTopOfColumn(task.id, colKey);
    });

    card.querySelector('.wc-card-del-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        quickDeleteItem(task.id);
    });

    card.addEventListener('click', (e) => {
        if (e.target.closest('.wc-cb-wrap') || e.target.closest('.wc-card-actions')) return;
        openTaskDetailDialog(task.id);
    });

    card.addEventListener('dragstart', (e) => {
        if (e.target.closest('.wc-cb-wrap') || e.target.closest('.wc-card-actions')) {
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

// --- M2M STUDIO BOARD ---
function renderM2mSubseriesBar() {
    const counts = new Map();
    let total = 0;
    for (const ep of state.m2mEpisodes) {
        total++;
        const ss = ep.metadata?.m2m?.subseries || 'Other';
        counts.set(ss, (counts.get(ss) || 0) + 1);
    }

    dom.subseriesPills.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = `wc-ss-pill${state.m2mSubseriesFilter === 'all' ? ' active' : ''}`;
    allBtn.innerHTML = `All <span class="wc-ss-count">${total}</span>`;
    allBtn.addEventListener('click', () => {
        state.m2mSubseriesFilter = 'all';
        renderAll();
    });
    dom.subseriesPills.appendChild(allBtn);

    getOrderedM2mSeries().forEach(ss => {
        const c = counts.get(ss.key) || 0;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `wc-ss-pill${state.m2mSubseriesFilter === ss.key ? ' active' : ''}`;
        btn.style.setProperty('--ss-color', ss.color);
        btn.innerHTML = `${escapeHtml(ss.key)} <span class="wc-ss-count">${c}</span>`;
        btn.addEventListener('click', () => {
            state.m2mSubseriesFilter = ss.key;
            renderAll();
        });
        dom.subseriesPills.appendChild(btn);
    });
}

// --- M2M SERIES WAR CHART MODE (Columns = 8 SubSeries in Rotation Order) ---
function matchesM2mWarChartFilters(ep) {
    const m2m = ep.metadata?.m2m || {};
    const stage = m2m.stage || 'idea';
    if (state.m2mWcStageFilter === 'unpublished' && stage === 'published') return false;
    if (state.m2mWcStageFilter === 'queued' && stage !== 'queued') return false;
    if (state.m2mWcStageFilter === 'idea' && stage !== 'idea') return false;

    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        const hay = [
            ep.metadata?.summary,
            ep.content,
            m2m.subseries,
            m2m.research_doc,
            m2m.script_draft,
            m2m.graphics_notes
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
    }
    return true;
}

function renderM2mSeriesWarChart() {
    const orderedSeries = getOrderedM2mSeries();
    const validKeys = new Set(orderedSeries.map(s => s.key));
    const grouped = new Map();
    orderedSeries.forEach(s => grouped.set(s.key, []));
    const otherList = [];

    for (const ep of state.m2mEpisodes) {
        if (!matchesM2mWarChartFilters(ep)) continue;
        const ss = ep.metadata?.m2m?.subseries || 'Other';
        if (validKeys.has(ss)) grouped.get(ss).push(ep);
        else otherList.push(ep);
    }

    const scrollLeft = dom.boardViewport.scrollLeft;
    const colScrolls = captureColumnScrollPositions();
    dom.boardTrack.innerHTML = '';

    // Pinned leftmost M2M Workflow column (pulling active m2m_workflow tasks from Life Board)
    const q = state.searchQuery.toLowerCase();
    const wfTasks = sortColumnTasks(
        state.thoughts.filter(t => {
            if (isTaskCompleted(t) || getTaskType(t) === 'event') return false;
            if (getTaskColumnKey(t) !== 'm2m_workflow') return false;
            if (q) {
                const hay = `${t.metadata?.summary || ''} ${t.content || ''} ${t.metadata?.notes || ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        }),
        'manual'
    );
    dom.boardTrack.appendChild(createM2mWorkflowColumn(wfTasks));

    orderedSeries.forEach((series, rotIdx) => {
        const episodes = sortColumnTasks(grouped.get(series.key) || [], 'manual');
        dom.boardTrack.appendChild(createM2mSeriesColumn(series, episodes, rotIdx + 1, false));
    });

    if (otherList.length > 0) {
        const sortedOther = sortColumnTasks(otherList, 'manual');
        dom.boardTrack.appendChild(createM2mSeriesColumn({ key: 'Other', color: '#94a3b8' }, sortedOther, null, true));
    }

    dom.boardViewport.scrollLeft = scrollLeft;
    restoreColumnScrollPositions(colScrolls);
}

function createM2mWorkflowColumn(tasks) {
    const wfCol = state.boardConfig.columns.find(c => c.key === 'm2m_workflow') || {
        key: 'm2m_workflow',
        name: 'M2M Workflow',
        color: '#a855f7',
        kind: 'realm',
        sortMode: 'manual'
    };

    const colEl = document.createElement('section');
    colEl.className = 'wc-column is-inbox';
    colEl.dataset.colKey = 'm2m_workflow';
    colEl.style.setProperty('--col-accent', wfCol.color || '#a855f7');

    const headerEl = document.createElement('div');
    headerEl.className = 'wc-col-header';
    headerEl.title = 'M2M Workflow tasks — drag episode ideas right into any SubSeries column, or click + to add a workflow idea';
    headerEl.innerHTML = `
        <div class="wc-col-title-wrap">
            <span aria-hidden="true">⚙️</span>
            <h2 class="wc-col-title">${escapeHtml(wfCol.name)}</h2>
            <span class="wc-col-count">${tasks.length}</span>
        </div>
        <div class="wc-col-actions">
            <button type="button" class="wc-col-btn wc-col-quickadd-btn" title="Add M2M workflow task" aria-label="Add workflow task">+ Task</button>
        </div>
    `;

    const quickAddEl = document.createElement('div');
    quickAddEl.className = 'wc-col-quick-add';
    quickAddEl.hidden = true;
    quickAddEl.innerHTML = `
        <input type="text" class="wc-quick-add-input" placeholder="New M2M workflow task… (Enter)">
        <div class="wc-quick-add-hint"><span>Enter to save · Esc to close</span></div>
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
        if (e.key === 'Escape') { quickAddEl.hidden = true; return; }
        if (e.key === 'Enter' && !e.isComposing) {
            e.preventDefault();
            const title = quickInput.value.trim();
            if (!title) return;
            quickInput.disabled = true;
            try {
                await createQuickTask(wfCol, title);
                quickInput.value = '';
                quickInput.disabled = false;
                quickInput.focus();
            } catch {
                quickInput.disabled = false;
            }
        }
    });

    const bodyEl = document.createElement('div');
    bodyEl.className = 'wc-col-body';
    bodyEl.dataset.colKey = 'm2m_workflow';

    if (tasks.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'wc-col-empty';
        emptyEl.textContent = 'No M2M workflow tasks — click + to capture one, or drop episodes here';
        bodyEl.appendChild(emptyEl);
    } else {
        tasks.forEach((task, idx) => {
            bodyEl.appendChild(createLifeCardElement(task, wfCol, idx));
        });
    }

    colEl.addEventListener('dragover', (e) => {
        updateAutoScroll(e.clientX);
        if (state.drag.mode === 'card' || state.drag.mode === 'm2m-series-card') {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            colEl.classList.add('card-drop-hover');
            positionCardDropIndicator(bodyEl, e.clientY);
        }
    });

    colEl.addEventListener('dragleave', (e) => {
        if (!colEl.contains(e.relatedTarget)) {
            colEl.classList.remove('card-drop-hover');
            if (dropIndicator.parentElement === bodyEl) dropIndicator.remove();
        }
    });

    colEl.addEventListener('drop', (e) => {
        e.preventDefault();
        colEl.classList.remove('card-drop-hover');
        const id = state.drag.id;
        if (!id) { clearDragState(); return; }
        const insertIdx = computeDropIndex(bodyEl, e.clientY, id);
        if (state.drag.mode === 'card') {
            moveCardToColumn(id, 'm2m_workflow', insertIdx);
        } else if (state.drag.mode === 'm2m-series-card') {
            moveM2mEpisodeToWorkflow(id, insertIdx);
        }
        clearDragState();
    });

    colEl.appendChild(headerEl);
    colEl.appendChild(quickAddEl);
    colEl.appendChild(bodyEl);
    return colEl;
}

function createM2mSeriesColumn(series, episodes, rotNumber, isOther) {
    const colEl = document.createElement('section');
    colEl.className = 'wc-column';
    colEl.dataset.seriesKey = series.key;
    colEl.style.setProperty('--col-accent', series.color);

    const headerEl = document.createElement('div');
    headerEl.className = 'wc-col-header';
    if (!isOther) {
        headerEl.draggable = true;
        headerEl.title = 'Drag header left or right to change SubSeries rotation order';
    }

    const rotBadge = rotNumber ? `<span class="wc-rot-num" title="Rotation position #${rotNumber}">#${rotNumber}</span>` : '';
    const gripSvg = !isOther
        ? `<svg class="wc-col-grip" viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
               <circle cx="5" cy="3.5" r="1.2"></circle><circle cx="11" cy="3.5" r="1.2"></circle>
               <circle cx="5" cy="8" r="1.2"></circle><circle cx="11" cy="8" r="1.2"></circle>
               <circle cx="5" cy="12.5" r="1.2"></circle><circle cx="11" cy="12.5" r="1.2"></circle>
           </svg>`
        : '';

    headerEl.innerHTML = `
        <div class="wc-col-title-wrap">
            ${gripSvg}
            ${rotBadge}
            <h2 class="wc-col-title">${escapeHtml(series.key)}</h2>
            <span class="wc-col-count">${episodes.length}</span>
        </div>
        <div class="wc-col-actions">
            <button type="button" class="wc-col-btn wc-col-quickadd-btn" title="Add episode to ${escapeHtml(series.key)}" aria-label="Add episode">+ Episode</button>
            ${!isOther ? `<button type="button" class="wc-col-btn wc-col-edit-btn" title="Rename or recolor ${escapeHtml(series.key)}" aria-label="Edit SubSeries">✎ Edit</button>` : ''}
        </div>
    `;

    headerEl.querySelector('.wc-col-edit-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditM2mSeriesModal(series.key);
    });

    const quickAddEl = document.createElement('div');
    quickAddEl.className = 'wc-col-quick-add';
    quickAddEl.hidden = true;
    quickAddEl.innerHTML = `
        <input type="text" class="wc-quick-add-input" placeholder="New ${escapeHtml(series.key)} episode… (Enter)">
        <div class="wc-quick-add-hint"><span>Enter to save · Esc to close</span></div>
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
        if (e.key === 'Escape') { quickAddEl.hidden = true; return; }
        if (e.key === 'Enter' && !e.isComposing) {
            e.preventDefault();
            const title = quickInput.value.trim();
            if (!title) return;
            quickInput.disabled = true;
            try {
                const defaultStage = state.m2mWcStageFilter === 'queued' ? 'queued' : 'idea';
                await createQuickM2mEpisode(defaultStage, title, series.key);
                quickInput.value = '';
                quickInput.disabled = false;
                quickInput.focus();
            } catch {
                quickInput.disabled = false;
            }
        }
    });

    const bodyEl = document.createElement('div');
    bodyEl.className = 'wc-col-body';
    bodyEl.dataset.seriesKey = series.key;

    if (episodes.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'wc-col-empty';
        emptyEl.textContent = 'Drop episodes here or click +';
        bodyEl.appendChild(emptyEl);
    } else {
        const expandKey = `ss:${series.key}`;
        const isExpanded = state.m2mExpandedCols.has(expandKey) || Boolean(state.searchQuery);
        const visibleEps = isExpanded ? episodes : episodes.slice(0, M2M_COLUMN_RENDER_CAP);

        visibleEps.forEach((ep, idx) => {
            bodyEl.appendChild(createM2mSeriesCardElement(ep, series, idx));
        });

        if (!isExpanded && episodes.length > M2M_COLUMN_RENDER_CAP) {
            const moreBtn = document.createElement('button');
            moreBtn.type = 'button';
            moreBtn.className = 'wc-btn wc-btn-ghost wc-btn-xs';
            moreBtn.style.marginTop = '0.25rem';
            moreBtn.textContent = `Show all ${episodes.length} episodes (+${episodes.length - M2M_COLUMN_RENDER_CAP})`;
            moreBtn.addEventListener('click', () => {
                state.m2mExpandedCols.add(expandKey);
                renderM2mSeriesWarChart();
            });
            bodyEl.appendChild(moreBtn);
        }
    }

    // SubSeries column drag left/right to set rotation order
    if (!isOther) {
        headerEl.addEventListener('dragstart', (e) => {
            if (e.target.closest('button')) { e.preventDefault(); return; }
            state.drag = { mode: 'm2m-series-col', id: series.key, sourceColKey: series.key };
            colEl.classList.add('is-dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', `series:${series.key}`);
        });
        headerEl.addEventListener('dragend', clearDragState);
    }

    colEl.addEventListener('dragover', (e) => {
        updateAutoScroll(e.clientX);
        if (state.drag.mode === 'm2m-series-col' && !isOther && state.drag.id !== series.key) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const rect = colEl.getBoundingClientRect();
            const before = e.clientX < rect.left + rect.width / 2;
            colEl.classList.toggle('col-drop-before', before);
            colEl.classList.toggle('col-drop-after', !before);
            return;
        }
        if (state.drag.mode === 'm2m-series-card' || state.drag.mode === 'card') {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            colEl.classList.add('card-drop-hover');
            positionCardDropIndicator(bodyEl, e.clientY);
        }
    });

    colEl.addEventListener('dragleave', (e) => {
        if (!colEl.contains(e.relatedTarget)) {
            colEl.classList.remove('col-drop-before', 'col-drop-after', 'card-drop-hover');
            if (dropIndicator.parentElement === bodyEl) dropIndicator.remove();
        }
    });

    colEl.addEventListener('drop', (e) => {
        e.preventDefault();
        const wasBefore = colEl.classList.contains('col-drop-before');
        colEl.classList.remove('col-drop-before', 'col-drop-after', 'card-drop-hover');

        if (state.drag.mode === 'm2m-series-col' && !isOther && state.drag.id && state.drag.id !== series.key) {
            reorderM2mSeriesColumns(state.drag.id, series.key, wasBefore);
            clearDragState();
            return;
        }
        if (state.drag.mode === 'm2m-series-card' && state.drag.id) {
            const insertIdx = computeDropIndex(bodyEl, e.clientY, state.drag.id);
            moveM2mEpisodeToSubseries(state.drag.id, series.key, insertIdx);
            clearDragState();
            return;
        }
        if (state.drag.mode === 'card' && state.drag.id) {
            const insertIdx = computeDropIndex(bodyEl, e.clientY, state.drag.id);
            convertWorkflowTaskToM2mEpisode(state.drag.id, series.key, insertIdx);
            clearDragState();
        }
    });

    colEl.appendChild(headerEl);
    colEl.appendChild(quickAddEl);
    colEl.appendChild(bodyEl);
    return colEl;
}

function createM2mSeriesCardElement(ep, series, idx) {
    const card = document.createElement('article');
    const m2m = ep.metadata?.m2m || {};
    const stageMeta = getStageMeta(m2m.stage || 'idea');
    const isFrontLine = idx === 0;

    card.className = `wc-card${isFrontLine ? ' is-front-line' : ''}`;
    card.style.borderLeftColor = stageMeta.color;
    card.draggable = true;
    card.dataset.taskId = ep.id;
    card.dataset.seriesKey = series.key;

    const pills = [
        `<span class="wc-pill wc-pill-cycle" title="Rotation row ${idx + 1} in ${escapeHtml(series.key)}">Cycle ${idx + 1}</span>`,
        `<span class="wc-pill wc-pill-stage" style="color:${stageMeta.color}; background:${stageMeta.color}1f">${escapeHtml(stageMeta.name)}</span>`
    ];

    const docLen = (m2m.research_doc || '').trim().length;
    if (docLen > 80) {
        const label = docLen >= 1000 ? `${(docLen / 1000).toFixed(1)}k` : `${docLen}c`;
        pills.push(`<span class="wc-pill wc-pill-doc" title="Has full research document">📚 ${label}</span>`);
    }
    const scriptWords = countWords(m2m.script_draft || '');
    if (scriptWords > 20) {
        pills.push(`<span class="wc-pill wc-pill-script" title="Has script draft">✍️ ${scriptWords}w</span>`);
    }

    const frontLineHtml = isFrontLine ? `<div class="wc-front-line-tag">★ Cycle 1 · Front Line</div>` : '';
    const inboxBtnHtml = series.key === 'Other'
        ? `<button type="button" class="wc-card-top-btn wc-card-to-inbox-btn" title="Send out of M2M Studio to Life Board Inbox" aria-label="Send to Life Inbox">📥</button>`
        : '';
    const topBtnHtml = `<button type="button" class="wc-card-top-btn${idx === 0 ? ' is-at-top' : ''}" title="To Top (Move to Row #1 / Cycle 1)" aria-label="Move to top">⬆</button>`;
    const delBtnHtml = state.boardConfig.quickDeleteMode
        ? `<button type="button" class="wc-card-del-btn" title="Delete episode permanently" aria-label="Delete episode">🗑</button>`
        : '';
    const actionsClusterHtml = `<div class="wc-card-actions">${inboxBtnHtml}${topBtnHtml}${delBtnHtml}</div>`;

    card.innerHTML = `
        ${actionsClusterHtml}
        ${frontLineHtml}
        <div class="wc-card-main">
            <div class="wc-card-title">${escapeHtml(getTaskTitle(ep))}</div>
        </div>
        <div class="wc-card-meta" style="padding-left: 0;">${pills.join('')}</div>
    `;

    card.querySelector('.wc-card-to-inbox-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        sendM2mEpisodeToLifeInbox(ep.id);
    });

    card.querySelector('.wc-card-top-btn:not(.wc-card-to-inbox-btn)')?.addEventListener('click', (e) => {
        e.stopPropagation();
        moveM2mEpisodeToSubseries(ep.id, series.key, 0);
    });

    card.querySelector('.wc-card-del-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        quickDeleteItem(ep.id);
    });

    card.addEventListener('click', (e) => {
        if (e.target.closest('.wc-card-actions')) return;
        openM2mWorkspaceDialog(ep.id);
    });

    card.addEventListener('dragstart', (e) => {
        if (e.target.closest('.wc-card-actions')) { e.preventDefault(); return; }
        state.drag = { mode: 'm2m-series-card', id: ep.id, sourceColKey: series.key };
        card.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ep.id);
    });

    card.addEventListener('dragend', clearDragState);
    return card;
}

// --- M2M PRODUCTION KANBAN MODE (Columns = 7 Stages, with Auto-Rotate from Series War Chart) ---
function renderM2mKanban() {
    const grouped = new Map();
    M2M_STAGES.forEach(s => grouped.set(s.key, []));

    for (const ep of state.m2mEpisodes) {
        if (!matchesM2mFilters(ep)) continue;
        const stg = ep.metadata?.m2m?.stage || 'idea';
        const bucket = grouped.get(stg) || grouped.get('idea');
        bucket.push(ep);
    }

    const scrollLeft = dom.boardViewport.scrollLeft;
    const colScrolls = captureColumnScrollPositions();
    dom.boardTrack.innerHTML = '';

    for (const stage of M2M_STAGES) {
        const rawList = grouped.get(stage.key) || [];
        const supportsRotate = stage.key === 'queued' || stage.key === 'idea';
        const useRotate = supportsRotate && state.boardConfig.m2mAutoRotate && state.m2mSubseriesFilter === 'all';
        const items = useRotate
            ? interleaveBySeriesRotation(rawList)
            : sortColumnTasks(rawList, 'manual').map(ep => ({ episode: ep, cycle: null, pos: null }));
        dom.boardTrack.appendChild(createM2mStageColumn(stage, items, supportsRotate, useRotate));
    }

    dom.boardViewport.scrollLeft = scrollLeft;
    restoreColumnScrollPositions(colScrolls);
}

function createM2mStageColumn(stage, items, supportsRotate, isRotated) {
    const colEl = document.createElement('section');
    colEl.className = 'wc-column';
    colEl.dataset.stageKey = stage.key;
    colEl.style.setProperty('--col-accent', stage.color);

    const rotateBtnHtml = supportsRotate
        ? `<button type="button" class="wc-col-btn wc-col-rotate-btn${state.boardConfig.m2mAutoRotate ? ' is-rotate-active' : ''}" title="${state.boardConfig.m2mAutoRotate ? 'Auto-rotating row-by-row from Series War Chart (click for manual order)' : 'Manual order (click to auto-rotate from Series War Chart)'}" aria-label="Toggle auto-rotation">🔄</button>`
        : '';

    const headerEl = document.createElement('div');
    headerEl.className = 'wc-col-header';
    headerEl.innerHTML = `
        <div class="wc-col-title-wrap">
            <h2 class="wc-col-title">${escapeHtml(stage.name)}</h2>
            <span class="wc-col-count">${items.length}</span>
        </div>
        <div class="wc-col-actions">
            ${rotateBtnHtml}
            <button type="button" class="wc-col-btn wc-col-quickadd-btn" title="Add episode to ${escapeHtml(stage.name)}" aria-label="Add episode">+</button>
        </div>
    `;

    headerEl.querySelector('.wc-col-rotate-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.boardConfig.m2mAutoRotate = !state.boardConfig.m2mAutoRotate;
        renderM2mKanban();
        saveBoardConfig();
    });

    const quickAddEl = document.createElement('div');
    quickAddEl.className = 'wc-col-quick-add';
    quickAddEl.hidden = true;
    quickAddEl.innerHTML = `
        <input type="text" class="wc-quick-add-input" placeholder="New episode title… (Enter to add)">
        <div class="wc-quick-add-hint"><span>Enter to save · Esc to close</span></div>
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
                await createQuickM2mEpisode(stage.key, title);
                quickInput.value = '';
                quickInput.disabled = false;
                quickInput.focus();
            } catch {
                quickInput.disabled = false;
            }
        }
    });

    const bodyEl = document.createElement('div');
    bodyEl.className = 'wc-col-body';
    bodyEl.dataset.stageKey = stage.key;

    if (items.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'wc-col-empty';
        emptyEl.textContent = 'Drag an episode here or click +';
        bodyEl.appendChild(emptyEl);
    } else {
        const expandKey = `stg:${stage.key}`;
        const isExpanded = state.m2mExpandedCols.has(expandKey) || Boolean(state.searchQuery) || state.m2mSubseriesFilter !== 'all';
        const visibleItems = isExpanded ? items : items.slice(0, M2M_COLUMN_RENDER_CAP);

        visibleItems.forEach((entry, idx) => {
            bodyEl.appendChild(createM2mCardElement(entry.episode, stage, idx, stage.frontLine && idx === 0, entry.cycle, entry.pos, isRotated));
        });

        if (!isExpanded && items.length > M2M_COLUMN_RENDER_CAP) {
            const moreBtn = document.createElement('button');
            moreBtn.type = 'button';
            moreBtn.className = 'wc-btn wc-btn-ghost wc-btn-xs';
            moreBtn.style.marginTop = '0.25rem';
            moreBtn.textContent = `Show all ${items.length} episodes (+${items.length - M2M_COLUMN_RENDER_CAP})`;
            moreBtn.addEventListener('click', () => {
                state.m2mExpandedCols.add(expandKey);
                renderM2mKanban();
            });
            bodyEl.appendChild(moreBtn);
        }
    }

    colEl.addEventListener('dragover', (e) => {
        updateAutoScroll(e.clientX);
        if (state.drag.mode !== 'm2m-card') return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        colEl.classList.add('card-drop-hover');
        positionCardDropIndicator(bodyEl, e.clientY);
    });

    colEl.addEventListener('dragleave', (e) => {
        if (!colEl.contains(e.relatedTarget)) {
            colEl.classList.remove('card-drop-hover');
            if (dropIndicator.parentElement === bodyEl) dropIndicator.remove();
        }
    });

    colEl.addEventListener('drop', (e) => {
        e.preventDefault();
        colEl.classList.remove('card-drop-hover');
        if (state.drag.mode === 'm2m-card' && state.drag.id) {
            const insertIdx = computeDropIndex(bodyEl, e.clientY, state.drag.id);
            moveM2mEpisodeToStage(state.drag.id, stage.key, insertIdx, state.drag.sourceColKey);
            clearDragState();
        }
    });

    colEl.appendChild(headerEl);
    colEl.appendChild(quickAddEl);
    colEl.appendChild(bodyEl);
    return colEl;
}

function createM2mCardElement(ep, stage, idx, isFrontLine, rotCycle = null, rotPos = null, isRotated = false) {
    const card = document.createElement('article');
    const m2m = ep.metadata?.m2m || {};
    const ss = m2m.subseries || 'Unassigned';
    const ssColor = getSubseriesColor(ss);

    card.className = `wc-card${isFrontLine ? ' is-front-line' : ''}`;
    card.style.borderLeftColor = ssColor;
    card.draggable = true;
    card.dataset.taskId = ep.id;
    card.dataset.stageKey = stage.key;

    const pills = [];
    if (isRotated && rotCycle != null) {
        pills.push(`<span class="wc-pill wc-pill-cycle" title="Auto-rotated from Series War Chart (Cycle ${rotCycle}, #${rotPos})">C${rotCycle} · #${rotPos}</span>`);
    }
    pills.push(`<span class="wc-pill wc-pill-subseries" style="color:${ssColor}; background:${ssColor}1f">${escapeHtml(ss)}</span>`);

    const docLen = (m2m.research_doc || '').trim().length;
    if (docLen > 80) {
        const label = docLen >= 1000 ? `${(docLen / 1000).toFixed(1)}k` : `${docLen}c`;
        pills.push(`<span class="wc-pill wc-pill-doc" title="Has full research document">📚 ${label}</span>`);
    }
    const scriptWords = countWords(m2m.script_draft || '');
    if (scriptWords > 20) {
        pills.push(`<span class="wc-pill wc-pill-script" title="Has script draft">✍️ ${scriptWords}w</span>`);
    }
    if (m2m.checklist && typeof m2m.checklist === 'object') {
        const doneCount = Object.values(m2m.checklist).filter(Boolean).length;
        if (doneCount > 0) {
            pills.push(`<span class="wc-pill wc-pill-note">✓ ${doneCount}/${M2M_CHECKLIST_STEPS.length}</span>`);
        }
    }

    const frontLineHtml = isFrontLine ? `<div class="wc-front-line-tag">★ Next Up</div>` : '';
    const topBtnHtml = `<button type="button" class="wc-card-top-btn${idx === 0 ? ' is-at-top' : ''}" title="To Top of Stage" aria-label="Move to top">⬆</button>`;
    const delBtnHtml = state.boardConfig.quickDeleteMode
        ? `<button type="button" class="wc-card-del-btn" title="Delete episode permanently" aria-label="Delete episode">🗑</button>`
        : '';
    const actionsClusterHtml = `<div class="wc-card-actions">${topBtnHtml}${delBtnHtml}</div>`;

    card.innerHTML = `
        ${actionsClusterHtml}
        ${frontLineHtml}
        <div class="wc-card-main">
            <div class="wc-card-title">${escapeHtml(getTaskTitle(ep))}</div>
        </div>
        <div class="wc-card-meta" style="padding-left: 0;">${pills.join('')}</div>
    `;

    card.querySelector('.wc-card-top-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        moveM2mEpisodeToStage(ep.id, stage.key, 0, stage.key);
    });

    card.querySelector('.wc-card-del-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        quickDeleteItem(ep.id);
    });

    card.addEventListener('click', (e) => {
        if (e.target.closest('.wc-card-actions')) return;
        openM2mWorkspaceDialog(ep.id);
    });

    card.addEventListener('dragstart', (e) => {
        if (e.target.closest('.wc-card-actions')) {
            e.preventDefault();
            return;
        }
        state.drag = { mode: 'm2m-card', id: ep.id, sourceColKey: stage.key };
        card.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ep.id);
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

    if (insertBeforeEl) bodyEl.insertBefore(dropIndicator, insertBeforeEl);
    else bodyEl.appendChild(dropIndicator);
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
    if (clientX < rect.left + edge) state.autoScrollDir = -1;
    else if (clientX > rect.right - edge) state.autoScrollDir = 1;
    else state.autoScrollDir = 0;

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

// --- FRACTIONAL ORDER HELPER ---
function computeNewOrder(siblings, insertIdx, movedItem) {
    const prev = insertIdx > 0 ? siblings[insertIdx - 1] : null;
    const next = insertIdx < siblings.length ? siblings[insertIdx] : null;

    if (!prev && !next) return { newOrder: 1000, respace: [] };
    if (!prev && next) return { newOrder: getTaskOrderValue(next, 0) - 1000, respace: [] };
    if (prev && !next) return { newOrder: getTaskOrderValue(prev, siblings.length - 1) + 1000, respace: [] };

    const prevOrd = getTaskOrderValue(prev, insertIdx - 1);
    const nextOrd = getTaskOrderValue(next, insertIdx);
    if (Math.abs(nextOrd - prevOrd) > 0.001) {
        return { newOrder: (prevOrd + nextOrd) / 2, respace: [] };
    }

    const ordered = siblings.slice();
    ordered.splice(insertIdx, 0, movedItem);
    const respace = [];
    let movedOrder = 1000;
    ordered.forEach((item, i) => {
        const ord = (i + 1) * 1000;
        item.metadata = { ...(item.metadata || {}), warchart_order: ord };
        if (item.id === movedItem.id) movedOrder = ord;
        else respace.push({ id: item.id, order: ord });
    });
    return { newOrder: movedOrder, respace };
}

// --- LIFE BOARD MUTATIONS ---
function reorderColumns(sourceKey, targetKey, insertBefore) {
    const cols = state.boardConfig.columns;
    const srcIdx = cols.findIndex(c => c.key === sourceKey);
    if (srcIdx === -1) return;

    const [moved] = cols.splice(srcIdx, 1);
    let dstIdx = cols.findIndex(c => c.key === targetKey);
    if (dstIdx === -1) cols.push(moved);
    else {
        if (!insertBefore) dstIdx += 1;
        cols.splice(dstIdx, 0, moved);
    }

    renderLifeBoard();
    saveBoardConfig();
}

async function moveCardToTopOfColumn(taskId, colKey) {
    const task = state.thoughts.find(t => t.id === taskId);
    if (!task) return;

    const targetCol = state.boardConfig.columns.find(c => c.key === colKey);
    let configChanged = false;
    if (targetCol && targetCol.sortMode === 'date') {
        targetCol.sortMode = 'manual';
        configChanged = true;
    }

    const colTasks = sortColumnTasks(
        state.thoughts.filter(t => getTaskColumnKey(t) === colKey && !isTaskCompleted(t)),
        'manual'
    );
    const otherOrders = colTasks
        .filter(t => t.id !== taskId)
        .map((t, i) => getTaskOrderValue(t, i));
    const minOrderInColumn = otherOrders.length > 0 ? Math.min(...otherOrders) : 1000;
    const newOrder = minOrderInColumn - 1000;

    const metaPatch = { warchart_order: newOrder };
    task.metadata = { ...(task.metadata || {}), ...metaPatch };
    renderAll();

    const ops = [trackSave(apiCall({ action: 'update', id: taskId, metadata: metaPatch }))];
    if (configChanged) ops.push(saveBoardConfig());
    await Promise.all(ops);
}

async function moveLifeCardToColumn(taskId, targetColKey, insertIdx) {
    const task = state.thoughts.find(t => t.id === taskId);
    if (!task) return;

    const targetCol = state.boardConfig.columns.find(c => c.key === targetColKey);
    let configChanged = false;
    if (targetCol && targetCol.sortMode === 'date') {
        targetCol.sortMode = 'manual';
        configChanged = true;
    }

    const siblings = sortColumnTasks(
        state.thoughts.filter(t => t.id !== taskId && matchesLifeFilters(t) && getTaskColumnKey(t) === targetColKey),
        'manual'
    );
    const { newOrder, respace } = computeNewOrder(siblings, insertIdx, task);

    const assignedKey = targetColKey === INBOX_KEY ? null : targetColKey;
    const metaPatch = { warchart_order: newOrder };

    if (getTaskType(task) === 'coding_task') {
        metaPatch.coding_task = {
            ...(task.metadata?.coding_task || {}),
            project: assignedKey || 'uncategorized'
        };
    } else {
        metaPatch.project = assignedKey;
    }

    task.metadata = { ...(task.metadata || {}), ...metaPatch };
    renderAll();

    const ops = [trackSave(apiCall({ action: 'update', id: taskId, metadata: metaPatch }))];
    if (configChanged) ops.push(saveBoardConfig());
    respace.forEach(r => ops.push(apiCall({ action: 'update', id: r.id, metadata: { warchart_order: r.order } }).catch(() => {})));
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

async function quickDeleteItem(itemId) {
    const inLife = state.thoughts.find(t => t.id === itemId);
    const inM2m = state.m2mEpisodes.find(e => e.id === itemId);
    const item = inLife || inM2m;
    if (!item) return;

    const title = getTaskTitle(item);
    // Keep clean snapshot for instant Undo (strip Google IDs so a restore re-syncs cleanly)
    const clonedMeta = JSON.parse(JSON.stringify(item.metadata || {}));
    delete clonedMeta.google_task_id;
    delete clonedMeta.google_event_id;

    state.lastDeleted = {
        content: item.content || title,
        metadata: clonedMeta,
        wasInLife: Boolean(inLife),
        wasInM2m: Boolean(inM2m)
    };

    state.thoughts = state.thoughts.filter(t => t.id !== itemId);
    state.m2mEpisodes = state.m2mEpisodes.filter(e => e.id !== itemId);
    renderAll();
    showUndoToast(`Deleted "${title.slice(0, 48)}${title.length > 48 ? '…' : ''}"`);

    await trackSave(apiCall({ action: 'delete', id: itemId }));
}

function showUndoToast(message) {
    dom.undoText.textContent = message;
    dom.undoToast.hidden = false;
    if (state.undoTimer) clearTimeout(state.undoTimer);
    state.undoTimer = setTimeout(() => {
        dom.undoToast.hidden = true;
        state.undoTimer = null;
    }, 6500);
}

async function undoLastDelete() {
    const snap = state.lastDeleted;
    if (!snap) return;
    state.lastDeleted = null;
    dom.undoToast.hidden = true;
    if (state.undoTimer) {
        clearTimeout(state.undoTimer);
        state.undoTimer = null;
    }

    const data = await trackSave(apiCall({
        action: 'add',
        content: snap.content,
        metadata: snap.metadata
    }));
    if (data.thought) {
        if (snap.wasInLife) state.thoughts.unshift(data.thought);
        if (snap.wasInM2m) state.m2mEpisodes.unshift(data.thought);
        renderAll();
    }
}

async function createQuickLifeTask(col, title) {
    const isInbox = col.key === INBOX_KEY;
    const isCoding = col.kind === 'coding';

    const existing = sortColumnTasks(
        state.thoughts.filter(t => matchesLifeFilters(t) && getTaskColumnKey(t) === col.key),
        'manual'
    );
    const topOrder = existing.length > 0 ? getTaskOrderValue(existing[0], 0) - 1000 : 1000;
    const workspaceScope = detectWorkspaceScope(title, title, isInbox ? '' : col.key);

    const metadata = isCoding
        ? {
            type: 'coding_task',
            summary: title,
            status: 'pending',
            priority: 'normal',
            workspace_scope: workspaceScope,
            warchart_order: topOrder,
            coding_task: { project: col.key, workspace: workspaceScope, workspace_scope: workspaceScope, status: 'draft', priority: 'medium', complexity: 'moderate' }
        }
        : {
            type: 'task',
            summary: title,
            status: 'pending',
            priority: 'normal',
            workspace_scope: workspaceScope,
            project: isInbox ? null : col.key,
            warchart_order: topOrder
        };

    const data = await trackSave(apiCall({ action: 'add', content: title, metadata }));
    if (data.thought) {
        state.thoughts.unshift(data.thought);
        renderAll();
    }
}

// --- M2M STUDIO MUTATIONS ---
function reorderM2mSeriesColumns(sourceKey, targetKey, insertBefore) {
    const list = getOrderedM2mSeries().slice();
    const srcIdx = list.findIndex(s => s.key === sourceKey);
    if (srcIdx === -1) return;

    const [moved] = list.splice(srcIdx, 1);
    let dstIdx = list.findIndex(s => s.key === targetKey);
    if (dstIdx === -1) list.push(moved);
    else {
        if (!insertBefore) dstIdx += 1;
        list.splice(dstIdx, 0, moved);
    }

    state.boardConfig.m2mSeries = list;
    state.boardConfig.m2mSeriesOrder = list.map(s => s.key);
    renderAll();
    saveBoardConfig();
}

async function moveM2mEpisodeToSubseries(epId, targetSeriesKey, insertIdx) {
    const ep = state.m2mEpisodes.find(e => e.id === epId);
    if (!ep) return;

    const siblings = sortColumnTasks(
        state.m2mEpisodes.filter(e => {
            if (e.id === epId || !matchesM2mWarChartFilters(e)) return false;
            const ss = e.metadata?.m2m?.subseries || 'Other';
            return ss === targetSeriesKey;
        }),
        'manual'
    );
    const { newOrder, respace } = computeNewOrder(siblings, insertIdx, ep);

    const newM2m = {
        ...(ep.metadata?.m2m || {}),
        subseries: targetSeriesKey
    };
    const metaPatch = {
        warchart_order: newOrder,
        m2m: newM2m
    };

    ep.metadata = { ...(ep.metadata || {}), ...metaPatch };
    renderAll();

    const ops = [trackSave(apiCall({ action: 'update', id: epId, metadata: metaPatch }))];
    respace.forEach(r => ops.push(apiCall({ action: 'update', id: r.id, metadata: { warchart_order: r.order } }).catch(() => {})));
    await Promise.all(ops);
}

async function convertWorkflowTaskToM2mEpisode(taskId, targetSeriesKey, insertIdx) {
    const task = state.thoughts.find(t => t.id === taskId);
    if (!task) return;

    const siblings = sortColumnTasks(
        state.m2mEpisodes.filter(e => {
            if (e.id === taskId || !matchesM2mWarChartFilters(e)) return false;
            const ss = e.metadata?.m2m?.subseries || 'Other';
            return ss === targetSeriesKey;
        }),
        'manual'
    );
    const { newOrder, respace } = computeNewOrder(siblings, insertIdx, task);

    const metaPatch = {
        project: null,
        warchart_order: newOrder,
        m2m: {
            ...(task.metadata?.m2m || {}),
            subseries: targetSeriesKey,
            stage: task.metadata?.m2m?.stage || 'idea',
            research_doc: task.metadata?.m2m?.research_doc || task.content || ''
        }
    };

    task.metadata = { ...(task.metadata || {}), ...metaPatch };
    if (!state.m2mEpisodes.some(e => e.id === task.id)) {
        state.m2mEpisodes.unshift(task);
    }
    renderAll();

    const ops = [trackSave(apiCall({ action: 'update', id: taskId, metadata: metaPatch }))];
    respace.forEach(r => ops.push(apiCall({ action: 'update', id: r.id, metadata: { warchart_order: r.order } }).catch(() => {})));
    await Promise.all(ops);
}

async function moveM2mEpisodeToWorkflow(epId, insertIdx) {
    const ep = state.m2mEpisodes.find(e => e.id === epId);
    if (!ep) return;

    const siblings = sortColumnTasks(
        state.thoughts.filter(t => t.id !== epId && !isTaskCompleted(t) && getTaskColumnKey(t) === 'm2m_workflow'),
        'manual'
    );
    const { newOrder, respace } = computeNewOrder(siblings, insertIdx, ep);

    const metaPatch = {
        type: 'task',
        status: ep.metadata?.status === 'completed' ? 'pending' : (ep.metadata?.status || 'pending'),
        project: 'm2m_workflow',
        warchart_order: newOrder,
        m2m: null
    };

    ep.metadata = { ...(ep.metadata || {}), ...metaPatch };
    state.m2mEpisodes = state.m2mEpisodes.filter(e => e.id !== epId);
    if (!state.thoughts.some(t => t.id === epId)) {
        state.thoughts.unshift(ep);
    }
    renderAll();

    const ops = [trackSave(apiCall({ action: 'update', id: epId, metadata: metaPatch }))];
    respace.forEach(r => ops.push(apiCall({ action: 'update', id: r.id, metadata: { warchart_order: r.order } }).catch(() => {})));
    await Promise.all(ops);
}

async function moveM2mEpisodeToStage(epId, targetStageKey, insertIdx, sourceStageKey = null) {
    const ep = state.m2mEpisodes.find(e => e.id === epId);
    if (!ep) return;

    const supportsRotate = targetStageKey === 'queued' || targetStageKey === 'idea';
    let configChanged = false;
    // If manually reordering inside an auto-rotated stage, switch off auto-rotate so manual order sticks
    if (supportsRotate && sourceStageKey === targetStageKey && state.boardConfig.m2mAutoRotate && state.m2mSubseriesFilter === 'all') {
        state.boardConfig.m2mAutoRotate = false;
        configChanged = true;
    }

    const siblings = sortColumnTasks(
        state.m2mEpisodes.filter(e => e.id !== epId && matchesM2mFilters(e) && (e.metadata?.m2m?.stage || 'idea') === targetStageKey),
        'manual'
    );
    const { newOrder, respace } = computeNewOrder(siblings, insertIdx, ep);

    const newM2m = {
        ...(ep.metadata?.m2m || {}),
        stage: targetStageKey
    };
    const metaPatch = {
        warchart_order: newOrder,
        m2m: newM2m
    };

    ep.metadata = { ...(ep.metadata || {}), ...metaPatch };
    renderAll();

    const ops = [trackSave(apiCall({ action: 'update', id: epId, metadata: metaPatch }))];
    if (configChanged) ops.push(saveBoardConfig());
    respace.forEach(r => ops.push(apiCall({ action: 'update', id: r.id, metadata: { warchart_order: r.order } }).catch(() => {})));
    await Promise.all(ops);
}

async function createQuickM2mEpisode(stageKey, title, explicitSubseries = null) {
    const subseries = explicitSubseries || (state.m2mSubseriesFilter !== 'all' ? state.m2mSubseriesFilter : 'Peace to the Moon');
    const existing = sortColumnTasks(
        state.m2mEpisodes.filter(e => {
            if (state.boardConfig.m2mViewMode === 'warchart') {
                return matchesM2mWarChartFilters(e) && (e.metadata?.m2m?.subseries || 'Other') === subseries;
            }
            return matchesM2mFilters(e) && (e.metadata?.m2m?.stage || 'idea') === stageKey;
        }),
        'manual'
    );
    const topOrder = existing.length > 0 ? getTaskOrderValue(existing[0], 0) - 1000 : 1000;

    const metadata = {
        type: 'idea',
        summary: title,
        topics: ['Mary to the Moon', subseries],
        warchart_order: topOrder,
        m2m: {
            subseries,
            stage: stageKey,
            research_doc: '',
            script_draft: '',
            graphics_notes: '',
            checklist: {}
        }
    };

    const content = `Mary to the Moon Episode (${subseries}): ${title}`;
    const data = await trackSave(apiCall({ action: 'add', content, metadata }));
    if (data.thought) {
        state.m2mEpisodes.unshift(data.thought);
        renderAll();
    }
    return data.thought;
}

// --- LIFE TASK DETAIL MODAL ---
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

function renderLinksPreview(containerEl, text) {
    const urls = (text || '').match(/https?:\/\/[^\s)>"']+/g) || [];
    if (urls.length === 0) {
        containerEl.hidden = true;
        containerEl.innerHTML = '';
        return;
    }
    containerEl.hidden = false;
    containerEl.innerHTML = '';
    const unique = [...new Set(urls)].slice(0, 12);
    unique.forEach(u => {
        const a = document.createElement('a');
        a.href = u;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = u.replace(/^https?:\/\//, '').slice(0, 55);
        containerEl.appendChild(a);
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

    dom.detailSummary.value = getTaskTitle(task);
    dom.detailContent.value = task.content || '';
    populateColumnSelect(getTaskColumnKey(task));
    dom.detailType.value = type;
    const normTaskStatus = m.status === 'completed'
        ? 'completed'
        : m.status === 'in_progress' ? 'in_progress' : 'pending';
    dom.detailTaskStatus.value = normTaskStatus;
    dom.detailTaskStatusField.hidden = type !== 'task';
    dom.detailDueDate.value = m.due_date || '';
    dom.detailPriority.value = m.priority || 'normal';
    dom.detailRecurrence.value = m.recurrence || '';
    dom.detailStartTime.value = m.start_time || '';
    dom.detailEndTime.value = m.end_time || '';
    dom.detailLocation.value = m.location || '';
    dom.detailNotes.value = m.notes || '';
    renderLinksPreview(dom.detailLinksPreview, `${task.content || ''}\n${m.notes || ''}`);

    const isCoding = type === 'coding_task';
    dom.detailCodingSection.hidden = !isCoding;
    if (isCoding) {
        dom.detailCtStatus.value = m.coding_task?.status || 'draft';
        dom.detailCtComplexity.value = m.coding_task?.complexity || 'moderate';
        dom.detailCtUrl.value = m.coding_task?.verification_url || '';
    }

    dom.detailToggleComplete.hidden = type === 'event';
    dom.detailToggleComplete.textContent = completed ? 'Reopen Task' : 'Mark Done';
    dom.detailToRef.hidden = type === 'reference';
    dom.detailM2mTransfer.hidden = type === 'coding_task' || Boolean(m.m2m);

    const created = task.created_at ? new Date(task.created_at).toLocaleString() : '—';
    const people = Array.isArray(m.people) && m.people.length ? ` · People: ${m.people.join(', ')}` : '';
    dom.detailMetaInfo.textContent = `Created: ${created}${people}`;

    dom.detailDialog.showModal();
}

dom.detailType.addEventListener('change', () => {
    const val = dom.detailType.value;
    dom.detailTaskStatusField.hidden = val !== 'task';
    dom.detailCodingSection.hidden = val !== 'coding_task';
    dom.detailToggleComplete.hidden = val !== 'task' && val !== 'coding_task';
    dom.detailToRef.hidden = val === 'reference';
});

dom.detailTaskStatus.addEventListener('change', () => {
    const isDone = dom.detailTaskStatus.value === 'completed';
    dom.detailStatusDot.className = 'wc-dot ' + (
        isDone ? 'wc-dot-green' : dom.detailDueDate.value ? 'wc-dot-amber' : 'wc-dot-red'
    );
    dom.detailToggleComplete.textContent = isDone ? 'Reopen Task' : 'Mark Done';
});

dom.detailNotes.addEventListener('input', () => {
    renderLinksPreview(dom.detailLinksPreview, `${dom.detailContent.value}\n${dom.detailNotes.value}`);
});

dom.detailClearDate.addEventListener('click', () => { dom.detailDueDate.value = ''; });
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
    const workspaceScope = detectWorkspaceScope(content, summary, assignedProject || '');

    const metaPatch = {
        type,
        summary,
        workspace_scope: workspaceScope,
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

    if (type === 'task') {
        metaPatch.status = dom.detailTaskStatus.value;
    } else if (type === 'coding_task') {
        metaPatch.coding_task = {
            ...(task.metadata?.coding_task || {}),
            project: assignedProject || 'uncategorized',
            workspace: workspaceScope,
            workspace_scope: workspaceScope,
            status: dom.detailCtStatus.value,
            complexity: dom.detailCtComplexity.value,
            verification_url: dom.detailCtUrl.value.trim() || null
        };
        metaPatch.status = dom.detailCtStatus.value === 'done' ? 'completed' : 'pending';
    }

    const isNonTaskThought = !['task', 'event', 'coding_task'].includes(type);
    if (isNonTaskThought) {
        metaPatch.status = null;
        metaPatch.due_date = null;
    }

    const contentChanged = content !== (task.content || '').trim();
    task.content = content;
    task.metadata = { ...(task.metadata || {}), ...metaPatch };

    if (isNonTaskThought) {
        // Reclassified as Reference/Procedure, Idea, Observation, or Person Note: remove from War Chart tasks list
        state.thoughts = state.thoughts.filter(t => t.id !== taskId);
    }

    dom.detailDialog.close();
    renderAll();

    const payload = { action: 'update', id: taskId, metadata: metaPatch };
    if (contentChanged) payload.content = content;
    await trackSave(apiCall(payload));
});

dom.detailToRef.addEventListener('click', async () => {
    const taskId = state.editingTaskId;
    const task = state.thoughts.find(t => t.id === taskId);
    if (!task) return;

    const summary = dom.detailSummary.value.trim() || getTaskTitle(task);
    const content = dom.detailContent.value.trim() || summary;
    const notes = dom.detailNotes.value.trim() || null;

    const metaPatch = {
        type: 'reference',
        summary,
        notes,
        status: null,
        due_date: null
    };

    const contentChanged = content !== (task.content || '').trim();
    state.thoughts = state.thoughts.filter(t => t.id !== taskId);
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

dom.detailMoveToM2m.addEventListener('click', async () => {
    const taskId = state.editingTaskId;
    const task = state.thoughts.find(t => t.id === taskId);
    if (!task) return;

    const subseries = dom.detailM2mSubseries.value || 'Peace to the Moon';
    const title = dom.detailSummary.value.trim() || getTaskTitle(task);
    const existingResearch = [dom.detailContent.value.trim(), dom.detailNotes.value.trim()].filter(Boolean).join('\n\n');

    const metaPatch = {
        type: 'idea',
        summary: title,
        project: null,
        m2m: {
            subseries,
            stage: 'idea',
            research_doc: existingResearch,
            script_draft: '',
            graphics_notes: '',
            checklist: {}
        }
    };

    task.metadata = { ...(task.metadata || {}), ...metaPatch };
    if (!state.m2mEpisodes.some(e => e.id === task.id)) {
        state.m2mEpisodes.unshift(task);
    }
    dom.detailDialog.close();
    renderAll();
    await trackSave(apiCall({ action: 'update', id: taskId, metadata: metaPatch }));
});

// --- M2M EPISODE WORKSPACE MODAL ---
function populateM2mDropdowns() {
    dom.m2mSubseries.innerHTML = '';
    dom.detailM2mSubseries.innerHTML = '';
    getOrderedM2mSeries().forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.key;
        opt.textContent = s.key;
        dom.m2mSubseries.appendChild(opt);
        dom.detailM2mSubseries.appendChild(opt.cloneNode(true));
    });
    const otherOpt = document.createElement('option');
    otherOpt.value = 'Other';
    otherOpt.textContent = 'Other';
    dom.m2mSubseries.appendChild(otherOpt);

    dom.m2mStage.innerHTML = '';
    M2M_STAGES.forEach(st => {
        const opt = document.createElement('option');
        opt.value = st.key;
        opt.textContent = st.name;
        dom.m2mStage.appendChild(opt);
    });
}

let m2mRefinedUndoText = null;
let m2mCurrentPacingReport = null;

function setM2mTab(tabName) {
    state.m2mActiveTab = tabName;
    document.querySelectorAll('[data-m2m-tab]').forEach(btn => {
        const isActive = btn.dataset.m2mTab === tabName;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', String(isActive));
    });
    dom.m2mPanelResearch.hidden = tabName !== 'research';
    dom.m2mPanelScript.hidden = tabName !== 'script';
    dom.m2mPanelRefined.hidden = tabName !== 'refined';
    dom.m2mPanelProduction.hidden = tabName !== 'production';
}

function setM2mResearchMode(mode) {
    state.m2mResearchMode = mode;
    dom.m2mResearchReadBtn.classList.toggle('active', mode === 'read');
    dom.m2mResearchEditBtn.classList.toggle('active', mode === 'edit');
    dom.m2mResearchReader.hidden = mode !== 'read';
    dom.m2mResearchInput.hidden = mode !== 'edit';
    if (mode === 'read') {
        dom.m2mResearchReader.innerHTML = renderSimpleMarkdown(dom.m2mResearchInput.value);
    } else {
        dom.m2mResearchInput.focus();
    }
}

function countSpokenWords(text) {
    const cleaned = String(text || '')
        .replace(/\[[^\]]*\]/g, ' ')
        .replace(/^#+\s+.*$/gm, ' ');
    return countWords(cleaned);
}

function updateM2mWriterStats() {
    const rText = dom.m2mResearchInput.value || '';
    const rWords = countWords(rText);
    dom.m2mResearchStats.textContent = `${rWords.toLocaleString()} words · ${rText.length.toLocaleString()} chars`;

    const sText = dom.m2mScriptInput.value || '';
    const sWords = countWords(sText);
    const sMins = (sWords / 130).toFixed(1);
    dom.m2mScriptStats.textContent = `${sWords.toLocaleString()} words · ~${sMins} min spoken (10 min ≈ 1,300 words)`;

    const refText = dom.m2mRefinedInput.value || '';
    const refWords = countSpokenWords(refText);
    const refMins = (refWords / 130).toFixed(1);
    const shortCount = (refText.match(/\[SHORT-READY\]/gi) || []).length;
    const shortBadge = shortCount > 0 ? ` · 🎬 ${shortCount} Short-ready` : '';
    dom.m2mRefinedStats.textContent = `${refWords.toLocaleString()} spoken words · ~${refMins} min${shortBadge} (target: 10 min ≈ 1,300 words)`;
}

function renderM2mPacingReport(report) {
    m2mCurrentPacingReport = report || null;
    if (!report) {
        dom.m2mPacingCard.hidden = true;
        dom.m2mPacingBody.innerHTML = '';
        return;
    }
    const mins = report.est_minutes != null ? report.est_minutes : (report.word_count ? (report.word_count / 130).toFixed(1) : '?');
    const beats = report.beat_count != null ? `${report.beat_count} beats` : '';
    const shortsNum = report.short_ready_count != null ? `${report.short_ready_count} Short-ready` : '';
    const summaryParts = [
        report.word_count ? `${Number(report.word_count).toLocaleString()} spoken words (~${mins} min)` : null,
        beats || null,
        shortsNum || null
    ].filter(Boolean);
    dom.m2mPacingSummary.textContent = `📊 Pacing & Shorts Report — ${summaryParts.join(' · ') || 'Ready'}`;

    let bodyHtml = '';
    if (report.notes) {
        bodyHtml += `<p>${escapeHtml(report.notes)}</p>`;
    }
    if (Array.isArray(report.shorts) && report.shorts.length > 0) {
        bodyHtml += `<p><strong>Extractable Shorts:</strong></p><ul class="wc-pacing-shorts-list">`;
        report.shorts.forEach(s => {
            const beat = s.beat ? `<strong>${escapeHtml(s.beat)}:</strong> ` : '';
            bodyHtml += `<li>${beat}${escapeHtml(s.title || '')}</li>`;
        });
        bodyHtml += `</ul>`;
    }
    dom.m2mPacingBody.innerHTML = bodyHtml || '<p>Pacing check complete.</p>';
    dom.m2mPacingCard.hidden = false;
}

function setRefineStatus(el, text, stateClass) {
    el.textContent = text;
    el.classList.remove('is-working', 'is-error', 'is-done');
    if (stateClass) el.classList.add(stateClass);
}

async function runM2mRefineScript(mode) {
    const isFromRough = mode === 'from_rough';
    const sourceScript = (isFromRough ? dom.m2mScriptInput.value : dom.m2mRefinedInput.value).trim();
    const statusEl = isFromRough ? dom.m2mRoughRefineStatus : dom.m2mRefinedStatus;

    if (!sourceScript) {
        setRefineStatus(
            statusEl,
            isFromRough
                ? 'Add some rough ideas or dictation above first, then click Refine Script.'
                : 'The Refined Script box is empty — refine from Rough Script first.',
            'is-error'
        );
        return;
    }

    const prevRefined = dom.m2mRefinedInput.value;
    dom.m2mRefineFromRoughBtn.disabled = true;
    dom.m2mRefineEditsBtn.disabled = true;
    setRefineStatus(
        statusEl,
        isFromRough
            ? '✨ Refining your rough draft with the Mary2Moon style prompt… (usually 10–25s)'
            : '✨ Incorporating your edits and smoothing flow… (usually 10–25s)',
        'is-working'
    );

    try {
        const data = await apiCall({
            action: 'refine_m2m_script',
            mode,
            title: dom.m2mTitle.value.trim() || 'Untitled Episode',
            subseries: dom.m2mSubseries.value,
            research_doc: dom.m2mResearchInput.value || '',
            source_script: sourceScript
        });

        if (!data?.refined_script) {
            throw new Error(data?.error || 'No refined script returned.');
        }

        // Snapshot previous refined text for one-click Undo
        if (prevRefined.trim()) {
            m2mRefinedUndoText = prevRefined;
            dom.m2mUndoRefineBtn.hidden = false;
        } else {
            m2mRefinedUndoText = null;
            dom.m2mUndoRefineBtn.hidden = true;
        }

        dom.m2mRefinedInput.value = data.refined_script;
        renderM2mPacingReport(data.pacing_report || null);
        if (data.pacing_report) dom.m2mPacingCard.open = true;
        updateM2mWriterStats();

        // Persist immediately to OpenBrain if this is an existing episode
        if (state.editingM2mId) {
            const ep = state.m2mEpisodes.find(item => item.id === state.editingM2mId);
            if (ep) {
                const updatedM2m = {
                    ...(ep.metadata?.m2m || {}),
                    script_draft: dom.m2mScriptInput.value,
                    refined_script: data.refined_script,
                    pacing_report: data.pacing_report || null
                };
                ep.metadata = { ...(ep.metadata || {}), m2m: updatedM2m };
                trackSave(apiCall({ action: 'update', id: ep.id, metadata: { m2m: updatedM2m } }));
            }
        }

        if (isFromRough) {
            setRefineStatus(dom.m2mRoughRefineStatus, '✓ Refined script ready in the Refined Script tab.', 'is-done');
            setRefineStatus(dom.m2mRefinedStatus, '✓ Freshly refined from your Rough Script. Make any edits above, then click Refine Edits to smooth.', 'is-done');
            setM2mTab('refined');
        } else {
            setRefineStatus(dom.m2mRefinedStatus, '✓ Edits smoothed and replaced in place. Use Undo Last Refine if you want to step back.', 'is-done');
        }
    } catch (err) {
        setRefineStatus(statusEl, `Refine failed: ${err.message || err}`, 'is-error');
    } finally {
        dom.m2mRefineFromRoughBtn.disabled = false;
        dom.m2mRefineEditsBtn.disabled = false;
    }
}

function openM2mWorkspaceDialog(epId) {
    const ep = epId ? state.m2mEpisodes.find(e => e.id === epId) : null;
    state.editingM2mId = ep ? ep.id : null;

    const m2m = ep?.metadata?.m2m || {};
    dom.m2mHeading.textContent = ep ? 'Episode Workspace' : 'New M2M Episode';
    dom.m2mTitle.value = ep ? getTaskTitle(ep) : '';

    const seriesList = getOrderedM2mSeries();
    const defaultSs = m2m.subseries || (state.m2mSubseriesFilter !== 'all' ? state.m2mSubseriesFilter : (seriesList[0]?.key || 'Peace to the Moon'));
    dom.m2mSubseries.value = seriesList.some(s => s.key === defaultSs) ? defaultSs : 'Other';
    dom.m2mStage.value = m2m.stage || 'idea';

    const researchText = m2m.research_doc || (ep?.content || '');
    dom.m2mResearchInput.value = researchText;
    dom.m2mResearchReader.innerHTML = renderSimpleMarkdown(researchText);
    renderLinksPreview(dom.m2mLinksPreview, researchText);

    dom.m2mScriptInput.value = m2m.script_draft || '';
    dom.m2mRefinedInput.value = m2m.refined_script || '';
    m2mRefinedUndoText = null;
    dom.m2mUndoRefineBtn.hidden = true;
    renderM2mPacingReport(m2m.pacing_report || null);
    dom.m2mPacingCard.open = false;
    setRefineStatus(dom.m2mRoughRefineStatus, 'Sends your rough draft through the Mary2Moon style prompt → outputs to Refined Script tab.');
    setRefineStatus(dom.m2mRefinedStatus, 'Make any rough edits above, then click Refine Edits to smooth & replace in place.');

    dom.m2mVideoUrl.value = m2m.video_url || '';
    dom.m2mGraphicsInput.value = m2m.graphics_notes || '';

    // Production checklist
    const checklistState = m2m.checklist || {};
    dom.m2mChecklist.innerHTML = '';
    M2M_CHECKLIST_STEPS.forEach(step => {
        const lbl = document.createElement('label');
        lbl.className = 'wc-prod-check-item';
        lbl.innerHTML = `
            <input type="checkbox" data-check-key="${step.key}" ${checklistState[step.key] ? 'checked' : ''}>
            <span>${escapeHtml(step.label)}</span>
        `;
        dom.m2mChecklist.appendChild(lbl);
    });

    dom.m2mDelete.hidden = !ep;
    dom.m2mToInbox.hidden = !ep;
    dom.m2mMetaInfo.textContent = ep?.created_at
        ? `Added ${new Date(ep.created_at).toLocaleDateString()}`
        : 'New episode';

    updateM2mWriterStats();
    setM2mTab('research');
    setM2mResearchMode(researchText.trim().length > 60 ? 'read' : 'edit');
    dom.m2mDialog.showModal();
    if (!ep) dom.m2mTitle.focus();
}

document.querySelectorAll('[data-m2m-tab]').forEach(btn => {
    btn.addEventListener('click', () => setM2mTab(btn.dataset.m2mTab));
});

dom.m2mResearchReadBtn.addEventListener('click', () => setM2mResearchMode('read'));
dom.m2mResearchEditBtn.addEventListener('click', () => setM2mResearchMode('edit'));

dom.m2mResearchInput.addEventListener('input', () => {
    updateM2mWriterStats();
    renderLinksPreview(dom.m2mLinksPreview, dom.m2mResearchInput.value);
});
dom.m2mScriptInput.addEventListener('input', updateM2mWriterStats);
dom.m2mRefinedInput.addEventListener('input', updateM2mWriterStats);

dom.m2mRefineFromRoughBtn.addEventListener('click', () => runM2mRefineScript('from_rough'));
dom.m2mRefineEditsBtn.addEventListener('click', () => runM2mRefineScript('polish_edits'));
dom.m2mUndoRefineBtn.addEventListener('click', () => {
    if (m2mRefinedUndoText === null) return;
    dom.m2mRefinedInput.value = m2mRefinedUndoText;
    m2mRefinedUndoText = null;
    dom.m2mUndoRefineBtn.hidden = true;
    updateM2mWriterStats();
    setRefineStatus(dom.m2mRefinedStatus, '↩ Reverted to the previous version. Click Save Episode to keep.', 'is-done');
});

dom.m2mClose.addEventListener('click', () => dom.m2mDialog.close());
dom.m2mCancel.addEventListener('click', () => dom.m2mDialog.close());

dom.m2mForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = dom.m2mTitle.value.trim();
    if (!title) return;

    const checklist = {};
    dom.m2mChecklist.querySelectorAll('input[data-check-key]').forEach(cb => {
        checklist[cb.dataset.checkKey] = cb.checked;
    });

    const m2mData = {
        subseries: dom.m2mSubseries.value,
        stage: dom.m2mStage.value,
        research_doc: dom.m2mResearchInput.value,
        script_draft: dom.m2mScriptInput.value,
        refined_script: dom.m2mRefinedInput.value,
        pacing_report: m2mCurrentPacingReport,
        video_url: dom.m2mVideoUrl.value.trim() || null,
        graphics_notes: dom.m2mGraphicsInput.value,
        checklist
    };

    if (state.editingM2mId) {
        const ep = state.m2mEpisodes.find(item => item.id === state.editingM2mId);
        if (!ep) return;
        const metaPatch = {
            summary: title,
            m2m: { ...(ep.metadata?.m2m || {}), ...m2mData }
        };
        ep.metadata = { ...(ep.metadata || {}), ...metaPatch };
        dom.m2mDialog.close();
        renderAll();
        await trackSave(apiCall({ action: 'update', id: ep.id, metadata: metaPatch }));
    } else {
        const metadata = {
            type: 'idea',
            summary: title,
            topics: ['Mary to the Moon', m2mData.subseries],
            warchart_order: 500,
            m2m: m2mData
        };
        const content = `Mary to the Moon Episode (${m2mData.subseries}): ${title}`;
        dom.m2mDialog.close();
        const data = await trackSave(apiCall({ action: 'add', content, metadata }));
        if (data.thought) {
            state.m2mEpisodes.unshift(data.thought);
            renderAll();
        }
    }
});

async function sendM2mEpisodeToLifeInbox(epId) {
    const ep = state.m2mEpisodes.find(e => e.id === epId);
    if (!ep) return;

    const isCoding = ep.metadata?.type === 'coding_task' || Boolean(ep.metadata?.coding_task);
    const metaPatch = {
        type: isCoding ? 'coding_task' : 'task',
        status: ep.metadata?.status === 'completed' ? 'pending' : (ep.metadata?.status || 'pending'),
        project: isCoding ? (ep.metadata?.project ?? null) : null,
        m2m: null
    };

    ep.metadata = { ...(ep.metadata || {}), ...metaPatch };
    state.m2mEpisodes = state.m2mEpisodes.filter(e => e.id !== epId);
    if (!state.thoughts.some(t => t.id === epId)) {
        state.thoughts.unshift(ep);
    }
    if (dom.m2mDialog.open && state.editingM2mId === epId) {
        dom.m2mDialog.close();
    }
    renderAll();
    await trackSave(apiCall({ action: 'update', id: epId, metadata: metaPatch }));
}

dom.m2mToInbox.addEventListener('click', () => {
    if (state.editingM2mId) sendM2mEpisodeToLifeInbox(state.editingM2mId);
});

dom.m2mDelete.addEventListener('click', async () => {
    const epId = state.editingM2mId;
    if (!epId) return;
    if (!confirm('Delete this M2M episode permanently from OpenBrain?')) return;

    state.m2mEpisodes = state.m2mEpisodes.filter(e => e.id !== epId);
    state.thoughts = state.thoughts.filter(t => t.id !== epId);
    dom.m2mDialog.close();
    renderAll();
    await trackSave(apiCall({ action: 'delete', id: epId }));
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
            renderLifeBoard();
            saveBoardConfig();
        });

        row.querySelector('.wc-mgr-down')?.addEventListener('click', () => {
            const arr = state.boardConfig.columns;
            if (idx >= arr.length - 1) return;
            [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
            renderColumnManagerList();
            renderLifeBoard();
            saveBoardConfig();
        });

        row.querySelector('.wc-mgr-toggle')?.addEventListener('click', () => {
            col.hidden = !col.hidden;
            renderColumnManagerList();
            renderLifeBoard();
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
    renderLifeBoard();
    await saveBoardConfig();
});

dom.colHideBtn.addEventListener('click', async () => {
    const col = state.boardConfig.columns.find(c => c.key === state.editingColumnKey);
    if (!col) return;
    col.hidden = !col.hidden;
    dom.colDialog.close();
    renderLifeBoard();
    await saveBoardConfig();
});

dom.colDeleteBtn.addEventListener('click', async () => {
    const col = state.boardConfig.columns.find(c => c.key === state.editingColumnKey);
    if (!col) return;
    if (!confirm(`Remove column "${col.name}"? Any tasks in it will stay safe in Inbox / Unassigned.`)) return;

    state.boardConfig.columns = state.boardConfig.columns.filter(c => c.key !== col.key);
    dom.colDialog.close();
    renderLifeBoard();
    await saveBoardConfig();
});

// --- TOOLBAR EVENTS ---
document.querySelectorAll('[data-board]').forEach(btn => {
    btn.addEventListener('click', () => {
        state.activeBoard = btn.dataset.board;
        dom.boardViewport.scrollLeft = 0;
        applyBoardModeUI();
        renderAll();
    });
});

document.querySelectorAll('[data-m2m-view]').forEach(btn => {
    btn.addEventListener('click', () => {
        state.boardConfig.m2mViewMode = btn.dataset.m2mView === 'kanban' ? 'kanban' : 'warchart';
        dom.boardViewport.scrollLeft = 0;
        applyBoardModeUI();
        renderAll();
        saveBoardConfig();
    });
});

document.querySelectorAll('[data-m2m-stage-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
        state.m2mWcStageFilter = btn.dataset.m2mStageFilter;
        document.querySelectorAll('[data-m2m-stage-filter]').forEach(b => b.classList.toggle('active', b === btn));
        renderAll();
    });
});

document.querySelectorAll('[data-scope]').forEach(btn => {
    btn.addEventListener('click', () => {
        state.scopeFilter = btn.dataset.scope;
        document.querySelectorAll('[data-scope]').forEach(b => b.classList.toggle('active', b === btn));
        const ctFilterWrap = document.getElementById('wc-coding-status-filter');
        if (ctFilterWrap) ctFilterWrap.hidden = state.scopeFilter === 'general';
        if (state.scopeFilter === 'general' && state.codingStatusFilter !== 'all') {
            state.codingStatusFilter = 'all';
            document.querySelectorAll('[data-coding-status]').forEach(b => b.classList.toggle('active', b.dataset.codingStatus === 'all'));
        }
        renderAll();
    });
});

document.querySelectorAll('[data-coding-status]').forEach(btn => {
    btn.addEventListener('click', () => {
        state.codingStatusFilter = btn.dataset.codingStatus;
        document.querySelectorAll('[data-coding-status]').forEach(b => b.classList.toggle('active', b === btn));
        renderAll();
    });
});

document.querySelectorAll('[data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
        state.statusFilter = btn.dataset.status;
        document.querySelectorAll('[data-status]').forEach(b => b.classList.toggle('active', b === btn));
        renderLifeBoard();
    });
});

dom.searchInput.addEventListener('input', () => {
    state.searchQuery = dom.searchInput.value.trim();
    renderAll();
});

dom.triageBtn.addEventListener('click', () => {
    state.triageMode = !state.triageMode;
    applyBoardModeUI();
    renderAll();
});

dom.addSubseriesBtn.addEventListener('click', openAddM2mSeriesModal);

// --- M2M SUBSERIES ADD / RENAME / RECOLOR MODAL ---
function renderM2mSeriesSwatches(selectedColor) {
    state.selectedM2mSeriesColor = selectedColor || COLOR_PALETTE[0];
    dom.m2mSeriesSwatches.innerHTML = '';
    for (const color of COLOR_PALETTE) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `wc-swatch${color === state.selectedM2mSeriesColor ? ' is-selected' : ''}`;
        btn.style.background = color;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', String(color === state.selectedM2mSeriesColor));
        btn.setAttribute('aria-label', `Color ${color}`);
        btn.addEventListener('click', () => {
            state.selectedM2mSeriesColor = color;
            dom.m2mSeriesSwatches.querySelectorAll('.wc-swatch').forEach(s => {
                const sel = s === btn;
                s.classList.toggle('is-selected', sel);
                s.setAttribute('aria-checked', String(sel));
            });
        });
        dom.m2mSeriesSwatches.appendChild(btn);
    }
}

function openAddM2mSeriesModal() {
    state.editingM2mSeriesKey = null;
    dom.m2mSeriesHeading.textContent = 'Add M2M SubSeries';
    dom.m2mSeriesNameInput.value = '';
    const nextColor = COLOR_PALETTE[getOrderedM2mSeries().length % COLOR_PALETTE.length];
    renderM2mSeriesSwatches(nextColor);
    dom.m2mSeriesHint.textContent = 'New SubSeries is added to your Series War Chart rotation order.';
    dom.m2mSeriesDeleteBtn.hidden = true;
    dom.m2mSeriesSaveBtn.textContent = 'Create SubSeries';
    dom.m2mSeriesDialog.showModal();
    dom.m2mSeriesNameInput.focus();
}

function openEditM2mSeriesModal(seriesKey) {
    const list = getOrderedM2mSeries();
    const series = list.find(s => s.key === seriesKey);
    if (!series) return;
    state.editingM2mSeriesKey = series.key;
    const epCount = state.m2mEpisodes.filter(e => (e.metadata?.m2m?.subseries || '') === series.key).length;
    dom.m2mSeriesHeading.textContent = `Edit SubSeries`;
    dom.m2mSeriesNameInput.value = series.key;
    renderM2mSeriesSwatches(series.color);
    dom.m2mSeriesHint.textContent = epCount > 0
        ? `Renaming automatically updates ${epCount} episode${epCount === 1 ? '' : 's'} in OpenBrain.`
        : 'Rename or change the accent color for this SubSeries.';
    dom.m2mSeriesDeleteBtn.hidden = false;
    dom.m2mSeriesSaveBtn.textContent = 'Save SubSeries';
    dom.m2mSeriesDialog.showModal();
    dom.m2mSeriesNameInput.focus();
    dom.m2mSeriesNameInput.select();
}

async function batchUpdateEpisodeSubseries(episodes, newSubseries) {
    if (!episodes.length) return;
    const CHUNK = 8;
    for (let i = 0; i < episodes.length; i += CHUNK) {
        const slice = episodes.slice(i, i + CHUNK);
        setSaveStatus('saving', `Updating episodes (${Math.min(i + CHUNK, episodes.length)}/${episodes.length})…`);
        await Promise.all(slice.map(ep => {
            const metaPatch = {
                m2m: { ...(ep.metadata?.m2m || {}), subseries: newSubseries }
            };
            ep.metadata = { ...(ep.metadata || {}), ...metaPatch };
            return apiCall({ action: 'update', id: ep.id, metadata: metaPatch });
        }));
    }
    setSaveStatus('saved', 'Saved');
}

dom.m2mSeriesClose.addEventListener('click', () => dom.m2mSeriesDialog.close());
dom.m2mSeriesCancelBtn.addEventListener('click', () => dom.m2mSeriesDialog.close());

dom.m2mSeriesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = dom.m2mSeriesNameInput.value.trim();
    if (!newName) return;

    const list = getOrderedM2mSeries().slice();
    const oldKey = state.editingM2mSeriesKey;
    const duplicate = list.find(s => s.key.toLowerCase() === newName.toLowerCase() && s.key !== oldKey);
    if (duplicate) {
        alert(`A SubSeries named "${duplicate.key}" already exists.`);
        return;
    }

    let affectedEpisodes = [];
    if (oldKey) {
        const item = list.find(s => s.key === oldKey);
        if (item) {
            item.key = newName;
            item.color = state.selectedM2mSeriesColor;
        }
        if (oldKey !== newName) {
            affectedEpisodes = state.m2mEpisodes.filter(ep => (ep.metadata?.m2m?.subseries || '') === oldKey);
            affectedEpisodes.forEach(ep => {
                ep.metadata = { ...(ep.metadata || {}), m2m: { ...(ep.metadata?.m2m || {}), subseries: newName } };
            });
            if (state.m2mSubseriesFilter === oldKey) state.m2mSubseriesFilter = newName;
        }
    } else {
        list.push({ key: newName, color: state.selectedM2mSeriesColor });
    }

    state.boardConfig.m2mSeries = list;
    state.boardConfig.m2mSeriesOrder = list.map(s => s.key);
    dom.m2mSeriesDialog.close();
    populateM2mDropdowns();
    renderAll();

    await saveBoardConfig();
    if (affectedEpisodes.length > 0) {
        await batchUpdateEpisodeSubseries(affectedEpisodes, newName);
    }
});

dom.m2mSeriesDeleteBtn.addEventListener('click', async () => {
    const oldKey = state.editingM2mSeriesKey;
    if (!oldKey) return;
    const affected = state.m2mEpisodes.filter(ep => (ep.metadata?.m2m?.subseries || '') === oldKey);
    const msg = affected.length > 0
        ? `Remove SubSeries "${oldKey}"? Its ${affected.length} episode${affected.length === 1 ? '' : 's'} will be moved to "Other" (nothing is deleted).`
        : `Remove SubSeries "${oldKey}"?`;
    if (!confirm(msg)) return;

    const list = getOrderedM2mSeries().filter(s => s.key !== oldKey);
    state.boardConfig.m2mSeries = list;
    state.boardConfig.m2mSeriesOrder = list.map(s => s.key);
    if (state.m2mSubseriesFilter === oldKey) state.m2mSubseriesFilter = 'all';

    affected.forEach(ep => {
        ep.metadata = { ...(ep.metadata || {}), m2m: { ...(ep.metadata?.m2m || {}), subseries: 'Other' } };
    });

    dom.m2mSeriesDialog.close();
    populateM2mDropdowns();
    renderAll();

    await saveBoardConfig();
    if (affected.length > 0) {
        await batchUpdateEpisodeSubseries(affected, 'Other');
    }
});

dom.toggleCalBtn.addEventListener('click', () => {
    state.boardConfig.calendarCollapsed = !state.boardConfig.calendarCollapsed;
    applyBoardModeUI();
    saveBoardConfig();
});

dom.compactBtn.addEventListener('click', () => {
    state.boardConfig.compactMode = !state.boardConfig.compactMode;
    applyBoardModeUI();
    saveBoardConfig();
});

dom.quickDeleteBtn.addEventListener('click', () => {
    state.boardConfig.quickDeleteMode = !state.boardConfig.quickDeleteMode;
    applyBoardModeUI();
    renderAll();
    saveBoardConfig();
});

dom.undoBtn.addEventListener('click', undoLastDelete);

dom.manageColsBtn.addEventListener('click', openColumnManagerDialog);
dom.addColBtn.addEventListener('click', openAddColumnDialog);
dom.addEpisodeBtn.addEventListener('click', () => openM2mWorkspaceDialog(null));
dom.refreshBtn.addEventListener('click', loadAllData);

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

window.addEventListener('dragend', clearDragState);

// --- BOOTSTRAP ---
populateM2mDropdowns();
setupDialogLightDismissFallback();
if (initAuth()) {
    loadAllData();
}
