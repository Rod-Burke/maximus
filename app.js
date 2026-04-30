const CONFIG = {
    ENDPOINT: 'https://xbrhqaztkqtlruocvwal.supabase.co/functions/v1/voice-gateway',
    MANAGE_ENDPOINT: 'https://xbrhqaztkqtlruocvwal.supabase.co/functions/v1/manage-thoughts',
    KEY: 'eddaa00be5289a5cd4130b01055cdef8123fa72994a9ad9784256806c2339ace',
    EMAIL: 'Fra_roderic@outlook.com'
};

// Local timezone date helper (returns YYYY-MM-DD in user's timezone)
function getLocalDateStr(date) {
    const d = date || new Date();
    return d.toLocaleDateString('en-CA'); // en-CA format = YYYY-MM-DD
}

const dom = {
    orb: document.getElementById('voice-trigger'),
    status: document.getElementById('status-text'),
    chat: document.getElementById('chat-output'),
    input: document.getElementById('text-input'),
    send: document.getElementById('send-btn'),
    orbContainer: document.querySelector('.orb-container'),
    historyBtn: document.getElementById('history-btn'),
    tasksBtn: document.getElementById('tasks-btn'),
    tasksPanel: document.getElementById('tasks-panel'),
    closeTasks: document.getElementById('close-tasks'),
    tasksList: document.getElementById('tasks-list'),
    historyPanel: document.getElementById('history-panel'),
    closeHistory: document.getElementById('close-history'),
    historyList: document.getElementById('history-list'),
    actionButtons: document.getElementById('action-buttons'),
    undoBtn: document.getElementById('undo-btn'),
    editLastBtn: document.getElementById('edit-last-btn'),
    countdownBar: document.getElementById('countdown-bar'),
    inputTray: document.querySelector('.input-tray'),
    // Modal
    modal: document.getElementById('task-detail-modal'),
    modalContent: document.getElementById('modal-content-input'),
    modalNotes: document.getElementById('modal-notes-input'),
    modalType: document.getElementById('modal-type'),
    modalPriority: document.getElementById('modal-priority'),
    modalDueDate: document.getElementById('modal-due-date'),
    modalRecurrence: document.getElementById('modal-recurrence'),
    modalSave: document.getElementById('modal-save-btn'),
    modalDelete: document.getElementById('modal-delete-btn'),
    modalClose: document.getElementById('close-modal'),
    // Custom Recurrence
    customPanel: document.getElementById('custom-recurrence-panel'),
    customInterval: document.getElementById('custom-interval'),
    customIntervalUnit: document.getElementById('custom-interval-unit'),
    customEndDate: document.getElementById('custom-end-date'),
    // Event fields
    eventFields: document.getElementById('event-fields'),
    modalAllDay: document.getElementById('modal-all-day'),
    modalStartTime: document.getElementById('modal-start-time'),
    modalEndTime: document.getElementById('modal-end-time'),
    modalLocation: document.getElementById('modal-location'),
    timeStartField: document.getElementById('time-start-field'),
    timeEndField: document.getElementById('time-end-field'),
    // Reclassify
    reclassifyBtn: document.getElementById('reclassify-btn'),
    reclassifyPicker: document.getElementById('reclassify-picker')
};

// --- VOICE LOGIC (Android-safe: continuous=false with multi-utterance accumulation) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;
let fullTranscript = '';
let submitTimer = null;
let countdownInterval = null;
let isRestarting = false;
let sessionHadResults = false;
let lastThoughtId = null;
let lastThoughtContent = null;  // Store content for "Edit Last"
let lastThoughtMeta = null;     // Store metadata for "Edit Last" modal
const SUBMIT_DELAY = 4000;

// --- MIC MUTE STATE ---
let micMuted = false;

// --- EDIT MODE STATE ---
let editingThoughtId = null;
let cancelEditBtn = null; // Created dynamically

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        sessionHadResults = false;
        dom.orb.classList.add('listening');
        if (!isRestarting) {
            clearTimeout(submitTimer);
            submitTimer = null;
            fullTranscript = '';
            // We NO LONGER hide the chat immediately on onstart. 
            // We wait until the user actually starts speaking in onresult.
            dom.orbContainer.style.transform = 'translateY(0)';
        }
        isRestarting = false;
        if (!fullTranscript) {
            dom.status.innerText = 'Listening...';
            dom.actionButtons.classList.add('hidden');
        }
    };

    recognition.onresult = (event) => {
        sessionHadResults = true;
        clearTimeout(submitTimer);
        submitTimer = null;
        stopCountdown();

        // Hide the previous chat box only when we actually get new speech results
        dom.chat.style.display = 'none';

        const transcript = event.results[0][0].transcript;
        dom.status.innerText = (fullTranscript + transcript).trim();
    };

    recognition.onend = () => {
        isListening = false;

        if (sessionHadResults) {
            // This session had real speech - update transcript and start countdown
            const currentDisplay = dom.status.innerText;
            fullTranscript = currentDisplay + ' ';
            dom.orb.classList.add('listening');

            startCountdown();
            submitTimer = setTimeout(() => {
                const text = fullTranscript.trim();
                fullTranscript = '';
                submitTimer = null;
                stopCountdown();
                dom.orb.classList.remove('listening');
                if (text) askMaximus(text);
            }, SUBMIT_DELAY);

            // Restart to catch more speech
            setTimeout(() => {
                if (submitTimer) {
                    isRestarting = true;
                    try { recognition.start(); } catch (e) { }
                }
            }, 300);

        } else if (fullTranscript.trim() && submitTimer) {
            // Silent session but we have pending text - DON'T restart again
            // Just let the existing submit timer fire naturally

        } else if (!fullTranscript.trim()) {
            // Nothing at all
            dom.status.innerText = 'Tap to speak to Maximus';
            dom.orb.classList.remove('listening');
            stopCountdown();
        }
    };

    function startCountdown() {
        stopCountdown();
        let start = Date.now();
        dom.countdownBar.style.opacity = '1';
        dom.countdownBar.style.width = '60px';
        
        countdownInterval = setInterval(() => {
            let elapsed = Date.now() - start;
            let remaining = Math.max(0, SUBMIT_DELAY - elapsed);
            let width = (remaining / SUBMIT_DELAY) * 60;
            dom.countdownBar.style.width = width + 'px';
            if (remaining <= 0) stopCountdown();
        }, 50);
    }

    function stopCountdown() {
        clearInterval(countdownInterval);
        dom.countdownBar.style.opacity = '0';
    }

    recognition.onerror = (event) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
            dom.status.innerText = 'Error: ' + event.error;
        }
        isListening = false;
        // no-speech during a silent restart - let the timer fire
    };
}

function startListening() {
    if (!SpeechRecognition) {
        alert("Voice not supported. Please use Chrome.");
        return;
    }
    if (isListening) return;
    if (isSpeaking) return;
    if (micMuted) return;  // Don't start if mic is muted
    try { recognition.start(); } catch (e) { console.log("Start failed:", e.message); }
}

function toggleMicMute() {
    micMuted = !micMuted;
    if (micMuted) {
        // Stop any active listening
        clearTimeout(submitTimer); submitTimer = null;
        stopCountdown();
        try { recognition.stop(); } catch(e) {}
        isListening = false;
        fullTranscript = '';
        dom.orb.classList.remove('listening');
        dom.orb.classList.add('muted');
        dom.status.innerText = '🔇 Double tap to speak to Maximus';
    } else {
        dom.orb.classList.remove('muted');
        dom.status.innerText = 'Tap to speak to Maximus';
        // Don't auto-start; let user tap when ready
    }
}

// --- API ---
async function askMaximus(text) {
    dom.status.innerText = 'Consulting Maximus...';
    try {
        const res = await fetch(CONFIG.ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ text, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
        });
        const data = await res.json();
        const answer = data.text || "Couldn't reach your brain.";
        lastInputText = text; // Store for reclassification
        
        // Handle "Captured as" responses to show action buttons
        if (answer.toLowerCase().includes('captured as') && data.thoughtId) {
            lastThoughtId = data.thoughtId;
            lastThoughtContent = text;
            lastThoughtMeta = data.thoughtMeta || null;
            dom.actionButtons.classList.remove('hidden');
        } else if (data.debug?.mode === 'capture') {
            lastThoughtId = data.debug?.thoughtId; 
            lastThoughtContent = text;
            lastThoughtMeta = data.thoughtMeta || null;
            if (lastThoughtId) dom.actionButtons.classList.remove('hidden');
        }

        displayResponse(answer, data.debug || {});
        speakResponse(answer);
        // Show reclassify button after every interaction
        dom.reclassifyPicker.classList.add('hidden');
    } catch (e) {
        console.error(e);
        displayResponse("Error connecting to Maximus.", {});
    }
}

// Track last raw input for reclassification
let lastInputText = '';

// --- RECLASSIFY LOGIC ---
dom.reclassifyBtn.addEventListener('click', () => {
    dom.reclassifyPicker.classList.toggle('hidden');
});

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (!lastInputText) return;
        const forceMode = btn.dataset.mode;
        dom.reclassifyPicker.classList.add('hidden');
        dom.status.innerText = `Re-processing as ${forceMode}...`;
        
        // If the previous input was captured, delete it first
        if (lastThoughtId && forceMode !== 'capture') {
            await fetch(CONFIG.MANAGE_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
                body: JSON.stringify({ action: 'delete', id: lastThoughtId })
            }).catch(() => {});
            lastThoughtId = null;
        }
        
        try {
            const res = await fetch(CONFIG.ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
                body: JSON.stringify({
                    text: lastInputText,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    forceMode: forceMode
                })
            });
            const data = await res.json();
            const answer = data.text || "Couldn't process that.";
            
            if (data.thoughtId) {
                lastThoughtId = data.thoughtId;
                lastThoughtContent = lastInputText;
                lastThoughtMeta = data.thoughtMeta || null;
                dom.actionButtons.classList.remove('hidden');
            }
            
            displayResponse(`↻ ${answer}`, data.debug || {});
            speakResponse(answer);
        } catch (e) {
            displayResponse("Error re-processing.", {});
        }
    });
});

function displayResponse(text, debug) {
    dom.status.innerText = 'Tap to speak to Maximus';
    let html = `<div>${text}</div>`;
    if (debug.received) {
        html += `<div class="debug-line">Sent: "${debug.received}" → ${debug.mode}</div>`;
    }
    dom.chat.innerHTML = html;
    dom.chat.style.display = 'block';
    dom.orbContainer.style.transform = 'translateY(-15px)';
}

// --- TTS ---
let isSpeaking = false;
let currentResponseText = ''; // Track for dynamic delay

function speakResponse(text) {
    currentResponseText = text;
    if (!('speechSynthesis' in window)) { 
        const delay = Math.max(3000, text.split(' ').length * 250);
        setTimeout(startListening, delay); 
        return; 
    }
    // Stop listening so the mic doesn't pick up our own voice
    isSpeaking = true;
    try { recognition.stop(); } catch(e) {}
    clearTimeout(submitTimer); submitTimer = null;
    fullTranscript = '';

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const best = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural'))) ||
                 voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                 voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (best) u.voice = best;
    u.rate = 0.95;
    u.onend = () => {
        isSpeaking = false;
        // Dynamic delay: 250ms per word + 2s base, capped at 15s
        const wordCount = currentResponseText.split(' ').length;
        const readingDelay = Math.min(15000, Math.max(2500, wordCount * 250));
        setTimeout(startListening, readingDelay);
    };
    window.speechSynthesis.speak(u);
}
window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();

// --- EDIT MODE ---
function enterEditMode(thoughtId, content) {
    editingThoughtId = thoughtId;
    dom.input.value = content;
    // Programmatically trigger auto-expand for long edits
    dom.input.style.height = '1px';
    dom.input.style.height = (dom.input.scrollHeight) + 'px';
    dom.input.placeholder = 'Editing thought... (× to cancel)';
    dom.inputTray.classList.add('edit-mode');
    dom.send.classList.add('edit-mode');
    dom.actionButtons.classList.add('hidden');
    
    // Create cancel button if it doesn't exist
    if (!cancelEditBtn) {
        cancelEditBtn = document.createElement('button');
        cancelEditBtn.id = 'cancel-edit-btn';
        cancelEditBtn.innerHTML = '×';
        cancelEditBtn.title = 'Cancel edit';
        cancelEditBtn.addEventListener('click', exitEditMode);
    }
    // Insert cancel button before the send button
    if (!dom.inputTray.contains(cancelEditBtn)) {
        dom.inputTray.insertBefore(cancelEditBtn, dom.send);
    }
    
    dom.input.focus();
}

function exitEditMode() {
    editingThoughtId = null;
    dom.input.value = '';
    dom.input.style.height = '24px'; // Reset to CSS default visually
    dom.input.placeholder = 'Type a thought...';
    dom.inputTray.classList.remove('edit-mode');
    dom.send.classList.remove('edit-mode');
    
    if (cancelEditBtn && dom.inputTray.contains(cancelEditBtn)) {
        dom.inputTray.removeChild(cancelEditBtn);
    }
}

async function submitEdit() {
    const id = editingThoughtId;
    const content = dom.input.value.trim();
    if (!id || !content) return;
    
    exitEditMode();
    dom.status.innerText = 'Updating thought...';
    
    try {
        const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'update', id, content })
        });
        const data = await res.json();
        if (data.success) {
            displayResponse('✓ Thought updated and re-embedded.', {});
        } else {
            displayResponse('Update failed: ' + (data.error || 'Unknown error'), {});
        }
    } catch (e) {
        console.error(e);
        displayResponse('Error updating thought.', {});
    }
}

// --- EVENTS ---
let lastOrbClick = 0;
dom.orb.addEventListener('click', () => {
    const now = Date.now();
    if (now - lastOrbClick < 400) {
        // Double-click: toggle mic mute
        toggleMicMute();
        lastOrbClick = 0; // Reset to prevent triple-click
        return;
    }
    lastOrbClick = now;
    
    // Delay single-click action to wait for possible double-click
    setTimeout(() => {
        if (lastOrbClick === 0) return; // A double-click happened and reset it
        if (micMuted) {
            // If muted, single tap does nothing (user must double-tap to unmute)
            return;
        }
        if (isListening || submitTimer) {
            clearTimeout(submitTimer); submitTimer = null;
            stopCountdown();
            try { recognition.stop(); } catch(e) {}
            isListening = false;
            dom.orb.classList.remove('listening');
            const text = fullTranscript.trim();
            fullTranscript = '';
            if (text && text !== 'Listening...' && text !== 'Tap to speak to Maximus') askMaximus(text);
            else dom.status.innerText = 'Tap to speak to Maximus';
        } else { startListening(); }
    }, 350);
});

dom.send.addEventListener('click', () => {
    // If in edit mode, submit the edit
    if (editingThoughtId) {
        submitEdit();
        return;
    }
    // Otherwise, normal new thought submission
    const t = dom.input.value.trim();
    if (t) { 
        dom.input.value = ''; 
        dom.input.style.height = '24px'; // Reset to CSS default visually
        askMaximus(t); 
    }
});
dom.input.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent adding a new line
        dom.send.click(); 
    }
});
dom.input.addEventListener('input', function() {
    this.style.height = '1px'; // Shrink to absolute minimum to accurately measure scrollHeight on mobile
    this.style.height = (this.scrollHeight) + 'px';
});

// --- HISTORY ---
dom.historyBtn.addEventListener('click', () => { dom.historyPanel.classList.remove('hidden'); loadHistory(); });
dom.closeHistory.addEventListener('click', () => dom.historyPanel.classList.add('hidden'));

async function loadHistory() {
    dom.historyList.innerHTML = '<div class="history-empty">Loading...</div>';
    try {
        const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'list', limit: 30 })
        });
        const data = await res.json();
        if (!data.thoughts?.length) { dom.historyList.innerHTML = '<div class="history-empty">No thoughts yet.</div>'; return; }
        dom.historyList.innerHTML = '';
        data.thoughts.forEach(t => {
            const d = new Date(t.created_at);
            const ds = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const type = t.metadata?.type || t.payload?.type || 'thought';
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `<div class="thought-content">${t.content}</div>
                <div class="thought-meta"><span>${ds}</span><span class="thought-type">${type}</span></div>
                <div class="item-actions">
                    <button class="edit-btn" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="delete-btn" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>`;
            el.querySelector('.edit-btn').addEventListener('click', () => {
                dom.historyPanel.classList.add('hidden');
                enterEditMode(t.id, t.content);
            });
            el.querySelector('.delete-btn').addEventListener('click', () => deleteThought(t.id, el));
            dom.historyList.appendChild(el);
        });
    } catch (e) { dom.historyList.innerHTML = '<div class="history-empty">Error loading.</div>'; }
}

async function deleteThought(id, el) {
    if (!confirm('Delete this thought?')) return;
    el.classList.add('deleting');
    try {
        await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'delete', id })
        });
        el.remove();
    } catch (e) { el.classList.remove('deleting'); alert('Delete failed.'); }
}

async function undoLastThought() {
    if (!lastThoughtId) return;
    const id = lastThoughtId;
    lastThoughtId = null;
    lastThoughtContent = null;
    dom.actionButtons.classList.add('hidden');
    dom.status.innerText = 'Undoing last capture...';
    
    try {
        await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'delete', id })
        });
        dom.status.innerText = 'Deleted last thought.';
        dom.chat.innerHTML = '<div style="opacity:0.5; font-style:italic;">Last thought deleted.</div>';
        setTimeout(() => { dom.status.innerText = 'Tap to speak to Maximus'; }, 2000);
    } catch (e) {
        alert('Undo failed.');
        dom.status.innerText = 'Undo failed.';
    }
}

function editLastThought() {
    if (!lastThoughtId || !lastThoughtContent) return;
    const meta = lastThoughtMeta || {};
    const type = meta.type || '';
    // If it's a task or event, open the full Task Detail Modal
    if (type === 'task' || type === 'event') {
        openTaskModal(lastThoughtId, lastThoughtContent, meta);
    } else {
        // For other types, use inline edit mode
        enterEditMode(lastThoughtId, lastThoughtContent);
    }
}

dom.undoBtn.addEventListener('click', undoLastThought);
dom.editLastBtn.addEventListener('click', editLastThought);

// --- TASKS DASHBOARD ---
dom.tasksBtn.addEventListener('click', () => { dom.tasksPanel.classList.remove('hidden'); loadTasksDashboard(); });
dom.closeTasks.addEventListener('click', () => dom.tasksPanel.classList.add('hidden'));

let draggedTask = null;

async function loadTasksDashboard() {
    dom.tasksList.innerHTML = '<div class="history-empty">Loading Tasks...</div>';
    try {
        const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'list', limit: 300 })
        });
        const data = await res.json();
        if (!data.thoughts) return;
        
        // Filter pending tasks and events
        const activeItems = data.thoughts.filter(t => {
            const meta = t.metadata || t.payload?.metadata || {};
            const type = meta.type || '';
            const status = meta.status || 'pending';
            return (type === 'task' || type === 'event') && status === 'pending';
        });

        // Sort: Bumped > Events with Dates > Tasks with Dates > Unscheduled
        activeItems.sort((a, b) => {
            const m_a = a.metadata || {};
            const m_b = b.metadata || {};
            
            // Explicit order field from drag and drop
            if (m_a.order !== undefined && m_b.order !== undefined) return m_a.order - m_b.order;

            // Bumped to top
            if (m_a.bumped_at && !m_b.bumped_at) return -1;
            if (!m_a.bumped_at && m_b.bumped_at) return 1;
            if (m_a.bumped_at && m_b.bumped_at) return new Date(m_b.bumped_at) - new Date(m_a.bumped_at);
            
            return new Date(b.created_at) - new Date(a.created_at);
        });

        // Separate recurring templates from actionable items
        const recurring = [];
        const actionable = [];

        const todayStr_pre = getLocalDateStr();
        activeItems.forEach(t => {
            const meta = t.metadata || {};
            const rec = (meta.recurrence || '').toLowerCase();
            const isDailyType = rec === 'daily' || rec === 'every_other_day';
            // Recurring template: has recurrence but not due today
            // Daily tasks with no date are actionable (due today by default)
            // Daily tasks with a FUTURE date are recurring templates until that date
            if (meta.recurrence && !meta.due_date && !isDailyType) {
                recurring.push(t);
            } else if (isDailyType && meta.due_date && meta.due_date > todayStr_pre) {
                recurring.push(t); // Daily task not yet due → recurring
            } else {
                actionable.push(t);
            }
        });

        const events = [];
        const todayTasks = [];
        const unscheduled = [];
        const todayStr = getLocalDateStr();

        actionable.forEach(t => {
            const meta = t.metadata || {};
            const rec = (meta.recurrence || '').toLowerCase();
            const isDailyType = rec === 'daily' || rec === 'every_other_day';
            if (meta.type === 'event') {
                events.push(t);
            } else if (isDailyType && (!meta.due_date || meta.due_date <= todayStr)) {
                // Daily task due today (or no date yet) → Today's Priorities
                todayTasks.push(t);
            } else if (meta.due_date && meta.due_date <= todayStr) {
                // Due today or overdue → Today's Priorities
                todayTasks.push(t);
            } else if (meta.bumped_at) {
                // Check if bumped today
                const bumpedDate = meta.bumped_at.split('T')[0];
                if (bumpedDate === todayStr) {
                    todayTasks.push(t); // Bumped today → Today's Priorities
                } else {
                    // Bumped yesterday or earlier → top of Unscheduled
                    t._wasBumped = true;
                    unscheduled.push(t);
                }
            } else {
                unscheduled.push(t);
            }
        });

        // Sort unscheduled: previously-bumped items float to top
        unscheduled.sort((a, b) => {
            if (a._wasBumped && !b._wasBumped) return -1;
            if (!a._wasBumped && b._wasBumped) return 1;
            return 0; // preserve original order otherwise
        });

        dom.tasksList.innerHTML = '';

        // Jump link to recurring section (only if there are recurring items)
        if (recurring.length) {
            const jumpLink = document.createElement('div');
            jumpLink.className = 'jump-link';
            jumpLink.innerHTML = `<a href="#recurring-section">↓ ${recurring.length} Recurring Template${recurring.length > 1 ? 's' : ''}</a>`;
            dom.tasksList.appendChild(jumpLink);
        }

        if (events.length) renderTaskSection('Upcoming Events', events);
        if (todayTasks.length) renderTaskSection('Today\'s Priorities', todayTasks);
        if (unscheduled.length) renderTaskSection('Unscheduled Tasks', unscheduled);
        
        // Recurring templates at the bottom
        if (recurring.length) {
            const anchor = document.createElement('div');
            anchor.id = 'recurring-section';
            dom.tasksList.appendChild(anchor);
            renderTaskSection('↺ Recurring Templates', recurring);
        }

        if (!events.length && !todayTasks.length && !unscheduled.length && !recurring.length) {
            dom.tasksList.innerHTML = '<div class="history-empty">All caught up!</div>';
        }

    } catch (e) {
        dom.tasksList.innerHTML = '<div class="history-empty">Error loading tasks.</div>';
    }
}

function renderTaskSection(title, items) {
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerText = title;
    dom.tasksList.appendChild(header);

    const container = document.createElement('div');
    container.className = 'task-section-container';
    
    // Dropzone logic for reordering
    container.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(container, e.clientY);
        if (draggedTask) {
            if (afterElement == null) container.appendChild(draggedTask);
            else container.insertBefore(draggedTask, afterElement);
        }
    });

    items.forEach((t, index) => {
        const meta = t.metadata || {};
        const el = document.createElement('div');
        el.className = 'task-item';
        el.draggable = true;
        el.dataset.id = t.id;
        el.dataset.meta = JSON.stringify(meta);
        
        const dueMeta = meta.due_date ? `Due: ${meta.due_date}` : '';
        const recMeta = meta.recurrence ? `↺ ${meta.recurrence}` : '';
        const metaStr = [dueMeta, recMeta].filter(Boolean).join(' | ');

        el.innerHTML = `
            <div class="task-checkbox"></div>
            <div class="task-content-wrapper">
                <div class="task-content">${t.content}</div>
                ${metaStr ? `<div class="task-meta">${metaStr}</div>` : ''}
            </div>
            <div class="task-actions">
                <button class="bump-btn" title="Bump to Top">↑</button>
            </div>
        `;

        // Drag and Drop Handlers
        el.addEventListener('dragstart', () => {
            draggedTask = el;
            el.classList.add('drag-ghost');
        });

        el.addEventListener('dragend', () => {
            el.classList.remove('drag-ghost');
            draggedTask = null;
            saveNewOrder(container);
        });

        // Checkbox complete
        el.querySelector('.task-checkbox').addEventListener('click', async function(e) {
            e.stopPropagation();
            this.classList.add('checked');
            el.style.opacity = '0.5';
            try {
                if (meta.recurrence) {
                    // Recurring task: DON'T mark as completed — roll due_date forward
                    const nextDate = getNextRecurrenceDate(meta.recurrence, meta.due_date);
                    // Check if recurrence has ended
                    const endDate = meta.recurrence_end;
                    if (endDate && nextDate > endDate) {
                        // Recurrence is over — mark as completed
                        await fetch(CONFIG.MANAGE_ENDPOINT, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
                            body: JSON.stringify({ action: 'update', id: t.id, metadata: { ...meta, status: 'completed' }})
                        });
                    } else {
                        // Update due_date to next occurrence
                        await fetch(CONFIG.MANAGE_ENDPOINT, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
                            body: JSON.stringify({ action: 'update', id: t.id, metadata: { ...meta, due_date: nextDate, bumped_at: null }})
                        });
                    }
                } else {
                    // Non-recurring: mark as completed
                    await fetch(CONFIG.MANAGE_ENDPOINT, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
                        body: JSON.stringify({ action: 'update', id: t.id, metadata: { ...meta, status: 'completed' }})
                    });
                }

                setTimeout(() => { el.remove(); loadTasksDashboard(); }, 500);
            } catch(err) {
                this.classList.remove('checked');
                el.style.opacity = '1';
                alert('Error completing task.');
            }
        });

        // Bump to Top
        el.querySelector('.bump-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            el.style.opacity = '0.5';
            try {
                await fetch(CONFIG.MANAGE_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
                    body: JSON.stringify({ action: 'update', id: t.id, metadata: { ...meta, bumped_at: new Date().toISOString(), order: 0 }})
                });
                loadTasksDashboard();
            } catch(err) {
                el.style.opacity = '1';
                alert('Error bumping task.');
            }
        });

        // Click to open Task Detail Modal
        el.querySelector('.task-content-wrapper').addEventListener('click', () => {
            openTaskModal(t.id, t.content, meta);
        });

        container.appendChild(el);
    });

    dom.tasksList.appendChild(container);
}

// --- RECURRENCE DATE CALCULATOR ---
function getNextRecurrenceDate(recurrence, currentDueDate) {
    const today = new Date();
    const base = currentDueDate ? new Date(currentDueDate + 'T12:00:00') : today;
    let next = new Date(base);
    
    const rec = (recurrence || '').toLowerCase();
    
    if (rec === 'daily') {
        next = new Date(today);
        next.setDate(next.getDate() + 1);
    } else if (rec === 'every_other_day') {
        next = new Date(today);
        next.setDate(next.getDate() + 2);
    } else if (rec === 'every_other_week') {
        next.setDate(next.getDate() + 14);
        while (next <= today) next.setDate(next.getDate() + 14);
    } else if (rec.startsWith('custom:')) {
        // custom:2:weeks:mon,wed or custom:3:days
        const parts = rec.replace('custom:', '').split(':');
        const interval = parseInt(parts[0]) || 1;
        const unit = parts[1] || 'weeks';
        const days = parts[2] ? parts[2].split(',') : [];
        
        if (unit === 'days') {
            next = new Date(today);
            next.setDate(next.getDate() + interval);
        } else {
            // weeks - find next matching day
            if (days.length) {
                const dayMap = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
                const targetDays = days.map(d => dayMap[d]).filter(d => d !== undefined).sort();
                next = new Date(today);
                next.setDate(next.getDate() + 1); // Start from tomorrow
                let found = false;
                for (let i = 0; i < interval * 7 + 7; i++) {
                    if (targetDays.includes(next.getDay())) { found = true; break; }
                    next.setDate(next.getDate() + 1);
                }
                if (!found) next.setDate(today.getDate() + interval * 7);
            } else {
                next.setDate(next.getDate() + interval * 7);
                while (next <= today) next.setDate(next.getDate() + interval * 7);
            }
        }
    } else if (rec.startsWith('weekly')) {
        // weekly or weekly:monday or weekly:monday,wednesday
        next.setDate(next.getDate() + 7);
        // If next is in the past, fast-forward to next week from today
        while (next <= today) next.setDate(next.getDate() + 7);
    } else if (rec.startsWith('monthly')) {
        // monthly or monthly:15
        const dayMatch = rec.match(/monthly:(\d+)/);
        if (dayMatch) {
            next.setMonth(next.getMonth() + 1);
            next.setDate(parseInt(dayMatch[1]));
        } else {
            next.setMonth(next.getMonth() + 1);
        }
        while (next <= today) next.setMonth(next.getMonth() + 1);
    } else if (rec.startsWith('yearly')) {
        next.setFullYear(next.getFullYear() + 1);
        while (next <= today) next.setFullYear(next.getFullYear() + 1);
    } else {
        // Fallback: add 7 days
        next = new Date(today);
        next.setDate(next.getDate() + 7);
    }
    
    return getLocalDateStr(next); // YYYY-MM-DD in local timezone
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.drag-ghost)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function saveNewOrder(container) {
    const items = [...container.querySelectorAll('.task-item')];
    // We update the order in the background so the UI feels instant
    items.forEach((el, index) => {
        const id = el.dataset.id;
        const meta = JSON.parse(el.dataset.meta || '{}');
        fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'update', id: id, metadata: { ...meta, order: index }})
        }).catch(() => {});
    });
}

// --- TASK DETAIL MODAL ---
let modalThoughtId = null;

function openTaskModal(id, content, meta) {
    modalThoughtId = id;
    dom.modalContent.value = content;
    dom.modalNotes.value = meta.notes || '';
    dom.modalType.value = meta.type || 'task';
    dom.modalPriority.value = meta.priority || 'normal';
    dom.modalDueDate.value = meta.due_date || '';
    dom.customEndDate.value = meta.recurrence_end || '';
    
    // Event fields
    toggleEventFields(meta.type === 'event');
    dom.modalAllDay.checked = meta.all_day !== false; // default true
    dom.modalStartTime.value = meta.start_time || '';
    dom.modalEndTime.value = meta.end_time || '';
    dom.modalLocation.value = meta.location || '';
    toggleTimeFields(!dom.modalAllDay.checked);
    
    // Parse recurrence into the UI
    const rec = meta.recurrence || '';
    if (rec.startsWith('custom:')) {
        dom.modalRecurrence.value = 'custom';
        dom.customPanel.classList.remove('hidden');
        parseCustomRecurrenceToUI(rec);
    } else if (rec === 'every_other_day' || rec === 'every_other_week') {
        dom.modalRecurrence.value = rec;
        dom.customPanel.classList.add('hidden');
    } else {
        dom.modalRecurrence.value = rec;
        dom.customPanel.classList.add('hidden');
    }
    if (!rec.startsWith('custom:')) resetDayButtons();
    
    dom.modal.classList.remove('hidden');
}

function toggleEventFields(show) {
    if (show) {
        dom.eventFields.classList.remove('hidden');
    } else {
        dom.eventFields.classList.add('hidden');
    }
}

function toggleTimeFields(show) {
    dom.timeStartField.style.display = show ? '' : 'none';
    dom.timeEndField.style.display = show ? '' : 'none';
}

function parseCustomRecurrenceToUI(rec) {
    // Format: "custom:1:weeks:mon,wed,fri" or "custom:2:days"
    const parts = rec.replace('custom:', '').split(':');
    dom.customInterval.value = parts[0] || '1';
    dom.customIntervalUnit.value = parts[1] || 'weeks';
    resetDayButtons();
    if (parts[2]) {
        parts[2].split(',').forEach(d => {
            const btn = document.querySelector(`.day-btn[data-day="${d}"]`);
            if (btn) btn.classList.add('active');
        });
    }
}

function resetDayButtons() {
    document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
}

function getCustomRecurrenceValue() {
    const interval = dom.customInterval.value || '1';
    const unit = dom.customIntervalUnit.value || 'weeks';
    const days = [...document.querySelectorAll('.day-btn.active')].map(b => b.dataset.day);
    let val = `custom:${interval}:${unit}`;
    if (days.length) val += ':' + days.join(',');
    return val;
}

function closeTaskModal() {
    dom.modal.classList.add('hidden');
    dom.customPanel.classList.add('hidden');
    dom.eventFields.classList.add('hidden');
    resetDayButtons();
    modalThoughtId = null;
}

dom.modalClose.addEventListener('click', closeTaskModal);
dom.modal.addEventListener('click', (e) => {
    if (e.target === dom.modal) closeTaskModal();
});

// Show/hide custom recurrence panel
dom.modalRecurrence.addEventListener('change', () => {
    if (dom.modalRecurrence.value === 'custom') {
        dom.customPanel.classList.remove('hidden');
    } else {
        dom.customPanel.classList.add('hidden');
    }
});

// Day button toggles
document.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
});

// Show/hide event fields when type changes
dom.modalType.addEventListener('change', () => {
    toggleEventFields(dom.modalType.value === 'event');
});

// Show/hide time fields when all-day changes
dom.modalAllDay.addEventListener('change', () => {
    toggleTimeFields(!dom.modalAllDay.checked);
});

dom.modalSave.addEventListener('click', async () => {
    if (!modalThoughtId) return;
    const id = modalThoughtId;
    const newContent = dom.modalContent.value.trim();
    if (!newContent) { alert('Content cannot be empty.'); return; }

    dom.modalSave.textContent = 'Saving...';
    dom.modalSave.disabled = true;

    try {
        // Build the recurrence value
        let recurrenceValue = dom.modalRecurrence.value || null;
        if (recurrenceValue === 'custom') {
            recurrenceValue = getCustomRecurrenceValue();
        }

        const updatePayload = {
            action: 'update',
            id,
            content: newContent,
            metadata: {
                type: dom.modalType.value,
                priority: dom.modalPriority.value,
                due_date: dom.modalDueDate.value || null,
                recurrence: recurrenceValue,
                recurrence_end: dom.customEndDate.value || null,
                notes: dom.modalNotes.value.trim() || null,
                // Event-specific fields
                all_day: dom.modalType.value === 'event' ? dom.modalAllDay.checked : null,
                start_time: dom.modalType.value === 'event' && !dom.modalAllDay.checked ? dom.modalStartTime.value || null : null,
                end_time: dom.modalType.value === 'event' && !dom.modalAllDay.checked ? dom.modalEndTime.value || null : null,
                location: dom.modalType.value === 'event' ? dom.modalLocation.value.trim() || null : null
            }
        };

        const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify(updatePayload)
        });
        const data = await res.json();
        if (data.success) {
            closeTaskModal();
            loadTasksDashboard();
        } else {
            alert('Save failed: ' + (data.error || 'Unknown error'));
        }
    } catch (e) {
        alert('Error saving changes.');
    } finally {
        dom.modalSave.textContent = 'Save Changes';
        dom.modalSave.disabled = false;
    }
});

dom.modalDelete.addEventListener('click', async () => {
    if (!modalThoughtId) return;
    if (!confirm('Delete this thought permanently?')) return;
    
    try {
        await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'delete', id: modalThoughtId })
        });
        closeTaskModal();
        loadTasksDashboard();
    } catch (e) {
        alert('Delete failed.');
    }
});

// --- AUTO-START ---
window.addEventListener('load', () => { setTimeout(() => { try { recognition?.start(); } catch(e){} }, 1000); });

// --- PWA ---
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; document.getElementById('install-banner').classList.remove('hidden'); });
document.getElementById('install-btn').addEventListener('click', () => {
    if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(r => { if (r.outcome === 'accepted') document.getElementById('install-banner').classList.add('hidden'); deferredPrompt = null; }); }
});
