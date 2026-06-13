const CONFIG = {
    ENDPOINT: 'https://xbrhqaztkqtlruocvwal.supabase.co/functions/v1/voice-gateway',
    MANAGE_ENDPOINT: 'https://xbrhqaztkqtlruocvwal.supabase.co/functions/v1/manage-thoughts',
    SYNC_ENDPOINT: 'https://xbrhqaztkqtlruocvwal.supabase.co/functions/v1/sync-google',
    GEMINI_LIVE_TOKEN: 'https://xbrhqaztkqtlruocvwal.supabase.co/functions/v1/gemini-live/token',
    GEMINI_LIVE_TOOL: 'https://xbrhqaztkqtlruocvwal.supabase.co/functions/v1/gemini-live/tool',
    KEY: '4f4bfce4ae96af52c35c0f6c4491a9b5e20caea9c52489a07ccd6083f1d2455d',
    EMAIL: 'Fra_roderic@outlook.com'
};

// Session/Auth Initialization
function initAuth() {
    const token = localStorage.getItem('maximus_session_token');
    const overlay = document.getElementById('login-overlay');
    
    if (token) {
        CONFIG.KEY = token;
        if (overlay) overlay.classList.add('hidden');
    } else {
        CONFIG.KEY = ''; // Clear default key to force authentication
        if (overlay) overlay.classList.remove('hidden');
    }
}

// Attach event listener to the login form
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const errorEl = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnSpinner = submitBtn?.querySelector('.btn-spinner');

    const username = usernameInput?.value.trim();
    const password = passwordInput?.value;

    if (!username || !password) return;

    // Show loading spinner
    if (btnText) btnText.classList.add('hidden');
    if (btnSpinner) btnSpinner.classList.remove('hidden');
    if (submitBtn) submitBtn.disabled = true;
    if (errorEl) errorEl.classList.add('hidden');

    try {
        const response = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'login',
                username: username,
                password: password
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || 'Invalid credentials');
        }

        const data = await response.json();
        if (data.token) {
            localStorage.setItem('maximus_session_token', data.token);
            CONFIG.KEY = data.token;
            
            // Hide login overlay with transition
            const overlay = document.getElementById('login-overlay');
            if (overlay) overlay.classList.add('hidden');
            
            // Auto start speech recognition if active
            try { recognition?.start(); } catch(err){}
        } else {
            throw new Error('Authentication did not return a session token.');
        }
    } catch (err) {
        console.error('Authentication error:', err);
        if (errorEl) {
            errorEl.textContent = err.message || 'Connection error';
            errorEl.classList.remove('hidden');
        }
    } finally {
        // Hide loading spinner
        if (btnText) btnText.classList.remove('hidden');
        if (btnSpinner) btnSpinner.classList.add('hidden');
        if (submitBtn) submitBtn.disabled = false;
    }
});

// Logout handler
document.getElementById('logout-btn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('maximus_session_token');
        CONFIG.KEY = ''; // Clear key
        try { recognition?.stop(); } catch(e){}
        const overlay = document.getElementById('login-overlay');
        if (overlay) overlay.classList.remove('hidden');
    }
});

initAuth();

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
    syncTasksBtn: document.getElementById('sync-tasks'),
    tasksList: document.getElementById('tasks-list'),
    historyPanel: document.getElementById('history-panel'),
    closeHistory: document.getElementById('close-history'),
    historyList: document.getElementById('history-list'),
    historySearch: document.getElementById('history-search'),
    tasksSearch: document.getElementById('tasks-search'),
    actionButtons: document.getElementById('action-buttons'),
    undoBtn: document.getElementById('undo-btn'),
    editLastBtn: document.getElementById('edit-last-btn'),
    detailsLastBtn: document.getElementById('details-last-btn'),
    countdownBar: document.getElementById('countdown-bar'),
    inputTray: document.querySelector('.input-tray'),
    // Modal
    modal: document.getElementById('task-detail-modal'),
    modalContent: document.getElementById('modal-content-input'),
    modalSummary: document.getElementById('modal-summary-input'),
    modalNotes: document.getElementById('modal-notes-input'),
    modalNotesLinks: document.getElementById('modal-notes-links'),
    modalType: document.getElementById('modal-type'),
    modalPriority: document.getElementById('modal-priority'),
    modalDueDate: document.getElementById('modal-due-date'),
    modalRecurrence: document.getElementById('modal-recurrence'),
    modalSave: document.getElementById('modal-save-btn'),
    modalDelete: document.getElementById('modal-delete-btn'),
    modalComplete: document.getElementById('modal-complete-btn'),
    modalClose: document.getElementById('close-modal'),
    // Declutter Mode
    declutterBtn: document.getElementById('declutter-btn'),
    bulkActionsBar: document.getElementById('bulk-actions-bar'),
    bulkCount: document.getElementById('bulk-count'),
    bulkDeleteBtn: document.getElementById('bulk-delete-btn'),
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
    // Coding Task fields in modal
    codingTaskFields: document.getElementById('coding-task-fields'),
    modalCtProject: document.getElementById('modal-ct-project'),
    modalCtComplexity: document.getElementById('modal-ct-complexity'),
    modalCtStatus: document.getElementById('modal-ct-status'),
    modalCtImproveBtn: document.getElementById('modal-ct-improve-btn'),
    // Reclassify
    reclassifyBtn: document.getElementById('reclassify-btn'),
    reclassifyPicker: document.getElementById('reclassify-picker'),
    modalTitle: document.getElementById('modal-title'),
    // Quick Capture
    quickCaptureBtns: document.querySelectorAll('.quick-capture-trigger'),
    quickCaptureOverlay: document.getElementById('quick-capture-overlay'),
    quickCaptureClose: document.getElementById('quick-capture-close'),
    quickCaptureInput: document.getElementById('quick-capture-input'),
    quickCaptureSubmit: document.getElementById('quick-capture-submit'),
    quickCaptureStatus: document.getElementById('quick-capture-status'),
    showCompletedBtn: document.getElementById('show-completed-btn'),
    // Saint Max Live Voice Call Panel
    liveVoiceBtn: document.getElementById('live-voice-btn'),
    liveVoicePanel: document.getElementById('live-voice-panel'),
    liveVoiceClose: document.getElementById('live-voice-close'),
    liveVoiceMute: document.getElementById('live-voice-mute'),
    liveVoiceEnd: document.getElementById('live-voice-end'),
    liveVoiceStatus: document.getElementById('live-voice-status'),
    liveVoiceCaption: document.getElementById('live-voice-caption'),
    voiceWaveform: document.getElementById('voice-waveform')
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

// --- SAINT MAX LIVE VOICE STATE ---
let liveVoiceSocket = null;
let audioContext = null;
let micStream = null;
let processorNode = null;
let liveVoiceActive = false;
let liveVoiceMuted = false;
let nextAudioStartTime = 0;
let waveformTimer = null;

// --- EDIT MODE STATE ---
let editingThoughtId = null;
let cancelEditBtn = null; // Created dynamically
let editSource = null;       // Tracks 'history' or 'tasks' origin for active edits
let historyScrollTop = 0;    // Temporarily stores vertical scroll offset of History list
let tasksScrollTop = 0;      // Temporarily stores vertical scroll offset of Tasks list

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
let followUpContext = null; // Stores { userInput, maximusResponse } for conversational replies

async function askMaximus(text, options = {}) {
    dom.status.innerText = 'Consulting Maximus...';
    try {
        const payload = {
            text,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
        // If forcing capture (user clicked "Add Anyway"), set the flag
        if (options.forceCapture) {
            payload.forceCapture = true;
        }
        
        // If in follow-up mode, include conversation context
        if (followUpContext) {
            payload.followUp = followUpContext;
            exitFollowUpMode();
        }
        
        const res = await fetch(CONFIG.ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        const answer = data.text || "Couldn't reach your brain.";
        lastInputText = text;
        
        // --- DUPLICATE DETECTION ---
        if (data.duplicateCandidate) {
            displayDuplicateAlert(data.duplicateCandidate, text);
            speakResponse(`Possible duplicate detected. You already have a similar ${data.duplicateCandidate.similarity}% match in your brain.`);
            return;
        }
        
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
        dom.reclassifyPicker.classList.add('hidden');
        
        // If Maximus asked a question, enter follow-up mode
        if (answer.includes('?')) {
            enterFollowUpMode(text, answer);
        }
    } catch (e) {
        console.error(e);
        displayResponse("Error connecting to Maximus.", {});
    }
}

function displayDuplicateAlert(candidate, originalText) {
    dom.status.innerText = 'Duplicate detected';
    dom.actionButtons.classList.add('hidden');
    
    const html = `
        <div class="duplicate-alert">
            <div class="duplicate-header">⚠️ Possible Duplicate</div>
            <div class="duplicate-body">
                <div class="duplicate-label">You already have a similar entry:</div>
                <div class="duplicate-existing">${candidate.content}</div>
                <div class="duplicate-similarity">${candidate.similarity}% match</div>
            </div>
            <div class="duplicate-actions">
                <button id="dup-add-btn" class="dup-btn dup-btn-add">Add Anyway</button>
                <button id="dup-skip-btn" class="dup-btn dup-btn-skip">Don't Add</button>
            </div>
        </div>
    `;
    
    dom.chat.innerHTML = html;
    dom.chat.style.display = 'block';
    dom.orbContainer.style.transform = 'translateY(-15px)';
    
    // "Add Anyway" — force-save bypassing dedup
    document.getElementById('dup-add-btn').addEventListener('click', () => {
        dom.chat.innerHTML = '';
        dom.chat.style.display = 'none';
        askMaximus(originalText, { forceCapture: true });
    });
    
    // "Don't Add" — dismiss
    document.getElementById('dup-skip-btn').addEventListener('click', () => {
        dom.chat.innerHTML = '<div style="opacity:0.5; font-style:italic;">No duplicate added.</div>';
        dom.status.innerText = 'Tap to speak to Maximus';
        setTimeout(() => {
            dom.chat.style.display = 'none';
            dom.orbContainer.style.transform = 'translateY(0)';
        }, 2000);
    });
}

function enterFollowUpMode(userInput, maximusResponse) {
    followUpContext = { userInput, maximusResponse };
    dom.input.placeholder = '💬 Reply to Maximus...';
    dom.input.classList.add('reply-mode');
    dom.status.innerText = '💬 Maximus is waiting for your reply';
}

function exitFollowUpMode() {
    followUpContext = null;
    dom.input.placeholder = 'Type a thought or question...';
    dom.input.classList.remove('reply-mode');
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

function exitEditMode(isSubmit = false) {
    editingThoughtId = null;
    dom.input.value = '';
    dom.input.style.height = '24px'; // Reset to CSS default visually
    dom.input.placeholder = 'Type a thought...';
    dom.inputTray.classList.remove('edit-mode');
    dom.send.classList.remove('edit-mode');
    
    if (cancelEditBtn && dom.inputTray.contains(cancelEditBtn)) {
        dom.inputTray.removeChild(cancelEditBtn);
    }

    if (isSubmit !== true && editSource === 'history') {
        dom.historyPanel.classList.remove('hidden');
        dom.historyList.scrollTop = historyScrollTop;
        editSource = null;
    }
}

async function submitEdit() {
    const id = editingThoughtId;
    const content = dom.input.value.trim();
    if (!id || !content) return;
    
    const source = editSource;
    const scrollTop = historyScrollTop;
    
    exitEditMode(true);
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
            if (source === 'history') {
                dom.historyPanel.classList.remove('hidden');
                await loadHistory();
                dom.historyList.scrollTop = scrollTop;
            }
        } else {
            displayResponse('Update failed: ' + (data.error || 'Unknown error'), {});
            if (source === 'history') {
                dom.historyPanel.classList.remove('hidden');
                dom.historyList.scrollTop = scrollTop;
            }
        }
    } catch (e) {
        console.error(e);
        displayResponse('Error updating thought.', {});
        if (source === 'history') {
            dom.historyPanel.classList.remove('hidden');
            dom.historyList.scrollTop = scrollTop;
        }
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
dom.input.addEventListener('focus', () => {
    if (isListening || submitTimer || fullTranscript.trim()) {
        clearTimeout(submitTimer);
        submitTimer = null;
        stopCountdown();
        try { recognition.stop(); } catch(e) {}
        isListening = false;
        fullTranscript = '';
        dom.orb.classList.remove('listening');
        dom.status.innerText = 'Tap to speak to Maximus';
    }
});

// --- HISTORY ---
let isDeclutterMode = false;
let selectedJunkIds = new Set();

dom.declutterBtn.addEventListener('click', () => {
    isDeclutterMode = !isDeclutterMode;
    selectedJunkIds.clear();
    dom.declutterBtn.classList.toggle('active', isDeclutterMode);
    
    if (isDeclutterMode) {
        dom.bulkActionsBar.classList.remove('hidden');
        dom.historySearch.value = '';
        dom.historySearch.disabled = true;
        loadJunkHistory();
    } else {
        dom.bulkActionsBar.classList.add('hidden');
        dom.historySearch.disabled = false;
        loadHistory();
    }
    updateBulkCount();
});

dom.historyBtn.addEventListener('click', () => { dom.historyPanel.classList.remove('hidden'); loadHistory(); });
dom.closeHistory.addEventListener('click', () => {
    dom.historyPanel.classList.add('hidden');
    isDeclutterMode = false;
    dom.declutterBtn.classList.remove('active');
    dom.bulkActionsBar.classList.add('hidden');
    dom.historySearch.disabled = false;
});

async function loadJunkHistory() {
    dom.historyList.innerHTML = '<div class="history-empty">Scanning for short, accidental thoughts...</div>';
    try {
        const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'list_junk' })
        });
        const data = await res.json();
        renderHistoryList(data.thoughts);
    } catch (e) { dom.historyList.innerHTML = '<div class="history-empty">Error loading junk.</div>'; }
}

const HISTORY_PAGE_SIZE = 30;
let historyOffset = 0;
let historyTotal = 0;

async function loadHistory(offset = 0) {
    historyOffset = offset;
    dom.historyList.innerHTML = '<div class="history-empty">Loading...</div>';
    try {
        const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'list', limit: HISTORY_PAGE_SIZE, offset: historyOffset })
        });
        const data = await res.json();
        historyTotal = data.total || 0;
        renderHistoryList(data.thoughts);
        renderPaginationControls();
    } catch (e) { dom.historyList.innerHTML = '<div class="history-empty">Error loading.</div>'; }
}

function renderPaginationControls() {
    // Remove existing pagination if any
    const existing = dom.historyList.querySelector('.history-pagination');
    if (existing) existing.remove();
    
    const hasMore = (historyOffset + HISTORY_PAGE_SIZE) < historyTotal;
    const isFirstPage = historyOffset === 0;
    const currentPage = Math.floor(historyOffset / HISTORY_PAGE_SIZE) + 1;
    const totalPages = Math.ceil(historyTotal / HISTORY_PAGE_SIZE);
    
    if (!hasMore && isFirstPage) return; // Only one page, no controls needed
    
    const pagination = document.createElement('div');
    pagination.className = 'history-pagination';
    
    let html = `<span class="page-indicator">Page ${currentPage} of ${totalPages}</span>`;
    
    if (!isFirstPage) {
        html += `<button class="pagination-btn first-page-btn">← First Page</button>`;
    }
    if (hasMore) {
        html += `<button class="pagination-btn next-page-btn">Load Next Page →</button>`;
    }
    
    pagination.innerHTML = html;
    
    const nextBtn = pagination.querySelector('.next-page-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            loadHistory(historyOffset + HISTORY_PAGE_SIZE);
            dom.historyList.scrollTop = 0;
        });
    }
    
    const firstBtn = pagination.querySelector('.first-page-btn');
    if (firstBtn) {
        firstBtn.addEventListener('click', () => {
            loadHistory(0);
            dom.historyList.scrollTop = 0;
        });
    }
    
    dom.historyList.appendChild(pagination);
}

function updateBulkCount() {
    dom.bulkCount.innerText = `${selectedJunkIds.size} selected`;
    dom.bulkDeleteBtn.style.opacity = selectedJunkIds.size > 0 ? '1' : '0.5';
    dom.bulkDeleteBtn.disabled = selectedJunkIds.size === 0;
}

dom.bulkDeleteBtn.addEventListener('click', async () => {
    if (selectedJunkIds.size === 0) return;
    if (!confirm(`Do you really want to permanently Delete ${selectedJunkIds.size} thoughts?`)) return;
    
    dom.bulkDeleteBtn.innerText = 'Deleting...';
    dom.bulkDeleteBtn.disabled = true;
    try {
        await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'bulk_delete', ids: Array.from(selectedJunkIds) })
        });
        selectedJunkIds.clear();
        updateBulkCount();
        loadJunkHistory();
    } catch(err) {
        alert('Bulk delete failed.');
    } finally {
        dom.bulkDeleteBtn.innerText = 'Delete Selected';
    }
});

function renderHistoryList(thoughts) {
    if (!thoughts?.length) { dom.historyList.innerHTML = '<div class="history-empty">No thoughts found.</div>'; return; }
    dom.historyList.innerHTML = '';
    thoughts.forEach(t => {
        const d = new Date(t.created_at);
        const ds = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const type = t.metadata?.type || t.payload?.type || 'thought';
        let matchStr = '';
        if (t.similarity) {
            const perc = Math.round(t.similarity * 100);
            matchStr = ` <span style="color:var(--accent-gold);margin-left:5px;">${perc}% Match</span>`;
        }
        
        const el = document.createElement('div');
        el.className = 'history-item';
        
        if (isDeclutterMode) {
            el.classList.add('selectable');
            const isSelected = selectedJunkIds.has(t.id);
            const checkClass = isSelected ? 'junk-checkbox checked' : 'junk-checkbox';
            
            el.innerHTML = `
                <div class="${checkClass}"></div>
                <div style="flex:1;">
                    <div class="thought-content">${t.content}</div>
                    <div class="thought-meta"><span>${ds}</span><span class="thought-type">${type}${matchStr}</span></div>
                </div>
            `;
            
            el.addEventListener('click', () => {
                const box = el.querySelector('.junk-checkbox');
                if (selectedJunkIds.has(t.id)) {
                    selectedJunkIds.delete(t.id);
                    box.classList.remove('checked');
                } else {
                    selectedJunkIds.add(t.id);
                    box.classList.add('checked');
                }
                updateBulkCount();
            });
        } else {
            el.innerHTML = `<div class="thought-content">${t.content}</div>
                <div class="thought-meta"><span>${ds}</span><span class="thought-type">${type}${matchStr}</span></div>
                <div class="item-actions">
                    <button class="edit-btn" title="Edit Text">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="details-btn" title="Edit Details / Change Type">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>
                        </svg>
                    </button>
                    <button class="delete-btn" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>`;
            el.querySelector('.edit-btn').addEventListener('click', () => {
                editSource = 'history';
                historyScrollTop = dom.historyList.scrollTop;
                dom.historyPanel.classList.add('hidden');
                enterEditMode(t.id, t.content);
            });
            el.querySelector('.details-btn').addEventListener('click', () => {
                editSource = 'history';
                historyScrollTop = dom.historyList.scrollTop;
                dom.historyPanel.classList.add('hidden');
                openTaskModal(t.id, t.content, t.metadata || t.payload || {});
            });
            el.querySelector('.delete-btn').addEventListener('click', () => deleteThought(t.id, el));
        }
        
        dom.historyList.appendChild(el);
    });
}

let historySearchTimeout = null;
dom.historySearch.addEventListener('input', function() {
    clearTimeout(historySearchTimeout);
    const q = this.value;
    if (isDeclutterMode) return; // Disable search while in declutter mode
    historySearchTimeout = setTimeout(async () => {
        if (!q.trim()) {
            loadHistory();
        } else {
            dom.historyList.innerHTML = '<div class="history-empty">Searching meaning...</div>';
            try {
                const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
                    body: JSON.stringify({ action: 'search', query: q, limit: 30 })
                });
                const data = await res.json();
                renderHistoryList(data.thoughts);
            } catch (e) { dom.historyList.innerHTML = '<div class="history-empty">Error searching.</div>'; }
        }
    }, 500);
});

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
    enterEditMode(lastThoughtId, lastThoughtContent);
}

function detailsLastThought() {
    if (!lastThoughtId || !lastThoughtContent) return;
    const meta = lastThoughtMeta || {};
    openTaskModal(lastThoughtId, lastThoughtContent, meta);
}

dom.undoBtn.addEventListener('click', undoLastThought);
dom.editLastBtn.addEventListener('click', editLastThought);
dom.detailsLastBtn.addEventListener('click', detailsLastThought);

// --- TASKS DASHBOARD ---
dom.tasksBtn.addEventListener('click', () => { dom.tasksPanel.classList.remove('hidden'); loadTasksDashboard(); });
dom.closeTasks.addEventListener('click', () => dom.tasksPanel.classList.add('hidden'));

dom.syncTasksBtn.addEventListener('click', async () => {
    dom.tasksList.innerHTML = '<div class="history-empty">Syncing with Google...</div>';
    try {
        const res = await fetch(CONFIG.SYNC_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'pull' })
        });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Server returned status ${res.status}`);
        }
        loadTasksDashboard();
    } catch (e) {
        alert('Sync failed: ' + e.message);
        loadTasksDashboard();
    }
});

dom.showCompletedBtn.addEventListener('click', () => {
    dom.showCompletedBtn.classList.toggle('active');
    loadTasksDashboard();
});

let tasksSearchTimeout = null;
dom.tasksSearch.addEventListener('input', function() {
    clearTimeout(tasksSearchTimeout);
    const q = this.value;
    tasksSearchTimeout = setTimeout(async () => {
        if (!q.trim()) {
            loadTasksDashboard();
        } else {
            dom.tasksList.innerHTML = '<div class="history-empty">Searching tasks semantics...</div>';
            try {
                const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
                    body: JSON.stringify({ action: 'search', query: q, limit: 50 })
                });
                const data = await res.json();
                
                // Filter to only actionable items for the tasks board
                const filtered = data.thoughts.filter(t => {
                    const type = t.metadata?.type || t.payload?.type || '';
                    return type === 'task' || type === 'event';
                });
                
                dom.tasksList.innerHTML = '';
                if (!filtered.length) {
                    dom.tasksList.innerHTML = '<div class="history-empty">No matching tasks found.</div>';
                } else {
                    renderTaskSection(`Semantic Matches for "${q}"`, filtered);
                }
            } catch (e) {
                dom.tasksList.innerHTML = '<div class="history-empty">Error searching.</div>';
            }
        }
    }, 500);
});

let draggedTask = null;

async function loadTasksDashboard() {
    dom.tasksList.innerHTML = '<div class="history-empty">Loading Tasks...</div>';
    try {
        const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'list', limit: 1000, types: ['task', 'event'] })
        });
        const data = await res.json();
        if (!data.thoughts) return;
        
        // Filter tasks and events
        const showCompleted = dom.showCompletedBtn.classList.contains('active');
        const activeItems = data.thoughts.filter(t => {
            const meta = t.metadata || t.payload?.metadata || {};
            const type = meta.type || '';
            const status = meta.status || 'pending';
            if (type !== 'task' && type !== 'event') return false;
            if (status === 'completed' && !showCompleted) return false;
            return true;
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

        const upcomingEvents = [];
        const pastEvents = [];
        const todayTasks = [];
        const unscheduled = [];
        const todayStr = getLocalDateStr();

        actionable.forEach(t => {
            const meta = t.metadata || {};
            const rec = (meta.recurrence || '').toLowerCase();
            const isDailyType = rec === 'daily' || rec === 'every_other_day';
            
            if (meta.type === 'event') {
                if (meta.due_date && meta.due_date < todayStr) {
                    pastEvents.push(t);
                } else {
                    upcomingEvents.push(t);
                }
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

        if (pastEvents.length) renderTaskSection('Past Events', pastEvents.slice(0, 2));
        if (upcomingEvents.length) renderTaskSection('Upcoming Events', upcomingEvents.slice(0, 4));
        if (todayTasks.length) renderTaskSection('Today\'s Priorities', todayTasks);
        if (unscheduled.length) renderTaskSection('Unscheduled Tasks', unscheduled);
        
        // Completed section (only when toggle is on)
        if (showCompleted) {
            const completedItems = activeItems.filter(t => (t.metadata || {}).status === 'completed');
            if (completedItems.length) renderTaskSection('✓ Completed', completedItems);
        }
        
        // Recurring templates at the bottom
        if (recurring.length) {
            const anchor = document.createElement('div');
            anchor.id = 'recurring-section';
            dom.tasksList.appendChild(anchor);
            renderTaskSection('↺ Recurring Templates', recurring);
        }

        if (!pastEvents.length && !upcomingEvents.length && !todayTasks.length && !unscheduled.length && !recurring.length) {
            dom.tasksList.innerHTML = '<div class="history-empty">All caught up!</div>';
        }

        if (editSource === 'tasks') {
            dom.tasksList.scrollTop = tasksScrollTop;
            editSource = null;
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
    container.dataset.sectionTitle = title;
    
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

        const isCompleted = meta.status === 'completed';
        const checkboxClass = isCompleted ? 'task-checkbox checked' : 'task-checkbox';
        const displayText = meta.summary || t.content;
        const hasMore = meta.summary && meta.summary !== t.content;

        el.innerHTML = `
            <div class="${checkboxClass}"></div>
            <div class="task-content-wrapper">
                <div class="task-content">${displayText}${hasMore ? ' <span class="more-indicator">+</span>' : ''}</div>
                ${metaStr ? `<div class="task-meta">${metaStr}</div>` : ''}
            </div>
            <div class="task-actions">
                <button class="bump-btn" title="Bump to Top">↑</button>
            </div>
        `;

        if (isCompleted) {
            el.style.opacity = '0.5';
        }

        // Drag and Drop Handlers
        el.addEventListener('dragstart', () => {
            draggedTask = el;
            el.classList.add('drag-ghost');
        });

        el.addEventListener('dragend', async () => {
            el.classList.remove('drag-ghost');
            draggedTask = null;
            
            const newContainer = el.closest('.task-section-container');
            const oldContainer = container;
            
            if (newContainer && newContainer !== oldContainer) {
                const newSection = newContainer.dataset.sectionTitle;
                let taskMeta = JSON.parse(el.dataset.meta || '{}');
                const todayStr = getLocalDateStr();
                
                if (newSection === "Today's Priorities") {
                    if (!taskMeta.due_date) {
                        taskMeta.due_date = todayStr;
                    }
                    taskMeta.bumped_at = null;
                } else if (newSection === "Unscheduled Tasks") {
                    taskMeta.due_date = null;
                    taskMeta.bumped_at = null;
                }
                
                el.dataset.meta = JSON.stringify(taskMeta);
                
                // Update UI metadata string immediately
                const metaTextEl = el.querySelector('.task-meta');
                const newDueMeta = taskMeta.due_date ? `Due: ${taskMeta.due_date}` : '';
                const newRecMeta = taskMeta.recurrence ? `↺ ${taskMeta.recurrence}` : '';
                const newMetaStr = [newDueMeta, newRecMeta].filter(Boolean).join(' | ');
                
                if (metaTextEl) {
                    if (newMetaStr) {
                        metaTextEl.innerText = newMetaStr;
                    } else {
                        metaTextEl.remove();
                    }
                } else if (newMetaStr) {
                    const wrapper = el.querySelector('.task-content-wrapper');
                    const newMetaEl = document.createElement('div');
                    newMetaEl.className = 'task-meta';
                    newMetaEl.innerText = newMetaStr;
                    wrapper.appendChild(newMetaEl);
                }

                try {
                    await fetch(CONFIG.MANAGE_ENDPOINT, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
                        body: JSON.stringify({ action: 'update', id: t.id, metadata: taskMeta })
                    });
                } catch (err) {
                    console.error("Failed to update transitioned task metadata:", err);
                }
            }
            
            await saveNewOrder();
        });

        // Checkbox complete / uncomplete
        el.querySelector('.task-checkbox').addEventListener('click', function(e) {
            e.stopPropagation();

            // If there's an active undo button on this item, treat clicking the checkbox as an UNDO
            const activeUndoBtn = el.querySelector('.undo-complete-btn');
            if (activeUndoBtn) {
                activeUndoBtn.click();
                return;
            }

            const wasCompleted = meta.status === 'completed';
            const contentEl = el.querySelector('.task-content');

            if (wasCompleted) {
                // UNCOMPLETE TASK
                this.classList.remove('checked');
                el.style.opacity = '1';
                if (contentEl) contentEl.style.textDecoration = 'none';
                meta.status = 'pending';
                
                fetch(CONFIG.MANAGE_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
                    body: JSON.stringify({ action: 'update', id: t.id, metadata: { ...meta, status: 'pending' }})
                }).catch(err => {
                    this.classList.add('checked');
                    el.style.opacity = '0.5';
                    if (contentEl) contentEl.style.textDecoration = 'line-through';
                    meta.status = 'completed';
                    alert('Error uncompleting task.');
                });
            } else {
                // COMPLETE TASK (with 3-second Undo countdown)
                const checkboxEl = this;
                checkboxEl.classList.add('checked');
                el.style.opacity = '0.5';
                if (contentEl) contentEl.style.textDecoration = 'line-through';

                const actionContainer = el.querySelector('.task-actions');
                const bumpBtn = actionContainer.querySelector('.bump-btn');
                if (bumpBtn) bumpBtn.style.display = 'none';

                const undoBtn = document.createElement('span');
                undoBtn.className = 'undo-complete-btn';
                undoBtn.style.cssText = 'color: var(--accent-light, #00a8cc); font-weight: 600; cursor: pointer; padding: 4px 8px; border-radius: 4px; background: rgba(0, 168, 204, 0.15); font-size: 0.8rem; user-select: none;';
                undoBtn.innerText = 'Undo 3s';
                actionContainer.appendChild(undoBtn);

                let remaining = 3;
                const countdownInterval = setInterval(() => {
                    remaining--;
                    if (remaining > 0) {
                        undoBtn.innerText = `Undo ${remaining}s`;
                    } else {
                        clearInterval(countdownInterval);
                    }
                }, 1000);

                const saveTimeout = setTimeout(() => {
                    undoBtn.remove();
                    if (bumpBtn) bumpBtn.style.display = '';

                    let updatePromise;
                    if (meta.recurrence) {
                        // Recurring task: roll due_date forward
                        const nextDate = getNextRecurrenceDate(meta.recurrence, meta.due_date);
                        const endDate = meta.recurrence_end;
                        if (endDate && nextDate > endDate) {
                            meta.status = 'completed';
                            updatePromise = fetch(CONFIG.MANAGE_ENDPOINT, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
                                body: JSON.stringify({ action: 'update', id: t.id, metadata: { ...meta, status: 'completed' }})
                            });
                        } else {
                            meta.due_date = nextDate;
                            meta.bumped_at = null;
                            updatePromise = fetch(CONFIG.MANAGE_ENDPOINT, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
                                body: JSON.stringify({ action: 'update', id: t.id, metadata: { ...meta, due_date: nextDate, bumped_at: null }})
                            });
                        }
                    } else {
                        meta.status = 'completed';
                        updatePromise = fetch(CONFIG.MANAGE_ENDPOINT, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
                            body: JSON.stringify({ action: 'update', id: t.id, metadata: { ...meta, status: 'completed' }})
                        });
                    }

                    updatePromise.catch(err => {
                        checkboxEl.classList.remove('checked');
                        el.style.opacity = '1';
                        if (contentEl) contentEl.style.textDecoration = 'none';
                        if (!meta.recurrence) meta.status = 'pending';
                        alert('Error completing task.');
                    });

                    // Only remove the element visually if we aren't in semantic search view
                    if (!document.querySelector('.section-header')?.innerText.includes('Semantic Matches')) {
                        setTimeout(() => { 
                            el.remove(); 
                            if (container.querySelectorAll('.task-item').length === 0) {
                                if (header) header.remove();
                                container.remove();
                            }
                        }, 500);
                    }
                }, 3000);

                undoBtn.addEventListener('click', (undoEvent) => {
                    undoEvent.stopPropagation();
                    clearInterval(countdownInterval);
                    clearTimeout(saveTimeout);

                    undoBtn.remove();
                    if (bumpBtn) bumpBtn.style.display = '';

                    checkboxEl.classList.remove('checked');
                    el.style.opacity = '1';
                    if (contentEl) contentEl.style.textDecoration = 'none';
                });
            }
        });

        // Bump to Top (AJAX — no page reload, keeps scroll position)
        el.querySelector('.bump-btn').addEventListener('click', async (e) => {
            e.stopPropagation();

            // --- Optimistic DOM move ---
            // Find the "Today's Priorities" section, or fall back to the first section
            let targetContainer = null;
            const sectionHeaders = dom.tasksList.querySelectorAll('.section-header');
            for (const h of sectionHeaders) {
                if (h.innerText.includes("Today")) {
                    targetContainer = h.nextElementSibling;
                    break;
                }
            }
            // If no "Today's Priorities" section exists yet, create one
            if (!targetContainer) {
                const firstHeader = sectionHeaders[0];
                const newHeader = document.createElement('div');
                newHeader.className = 'section-header';
                newHeader.innerText = "Today's Priorities";
                const newContainer = document.createElement('div');
                newContainer.className = 'task-section-container';
                if (firstHeader) {
                    dom.tasksList.insertBefore(newContainer, firstHeader);
                    dom.tasksList.insertBefore(newHeader, newContainer);
                } else {
                    dom.tasksList.appendChild(newHeader);
                    dom.tasksList.appendChild(newContainer);
                }
                targetContainer = newContainer;
            }

            // Remove from old container, clean up empty section
            const oldContainer = el.closest('.task-section-container');
            const oldHeader = oldContainer ? oldContainer.previousElementSibling : null;

            // Animate the bump: shrink out from old position
            el.style.transition = 'opacity 0.2s, transform 0.2s';
            el.style.opacity = '0.3';
            el.style.transform = 'scale(0.95)';

            setTimeout(() => {
                // Move element to top of target section
                el.remove();
                targetContainer.prepend(el);

                // Clean up empty old section
                if (oldContainer && oldContainer !== targetContainer && oldContainer.querySelectorAll('.task-item').length === 0) {
                    if (oldHeader && oldHeader.classList.contains('section-header')) oldHeader.remove();
                    oldContainer.remove();
                }

                // Animate in at new position
                el.style.opacity = '1';
                el.style.transform = 'scale(1)';
                el.style.background = 'rgba(76, 175, 80, 0.15)';
                setTimeout(() => { el.style.background = ''; el.style.transition = ''; }, 800);

                // Update the stored metadata so future actions have the bumped_at
                meta.bumped_at = new Date().toISOString();
                meta.order = 0;
                el.dataset.meta = JSON.stringify(meta);
            }, 200);

            // Fire-and-forget API call in background
            fetch(CONFIG.MANAGE_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
                body: JSON.stringify({ action: 'update', id: t.id, metadata: { ...meta, bumped_at: new Date().toISOString(), order: 0 }})
            }).catch(err => {
                console.error('Bump save failed:', err);
            });
        });

        // Click to open Task Detail Modal
        el.querySelector('.task-content-wrapper').addEventListener('click', () => {
            editSource = 'tasks';
            tasksScrollTop = dom.tasksList.scrollTop;
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

async function saveNewOrder() {
    const items = [...dom.tasksList.querySelectorAll('.task-item')];
    const tasks = items.map((el, index) => {
        return {
            id: el.dataset.id,
            order: index
        };
    });

    if (tasks.length === 0) return;

    const oldStatus = dom.status.innerText;
    dom.status.innerText = "Saving task order...";

    try {
        const response = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({
                action: 'batch_update_order',
                tasks: tasks
            })
        });
        const data = await response.json();
        if (data.success) {
            dom.status.innerText = "Order saved and syncing to Google Tasks...";
            setTimeout(() => {
                if (dom.status.innerText === "Order saved and syncing to Google Tasks...") {
                    dom.status.innerText = "Tap to speak to Maximus";
                }
            }, 3000);
        } else {
            dom.status.innerText = "Error saving task order";
            setTimeout(() => { dom.status.innerText = oldStatus; }, 3000);
        }
    } catch (e) {
        console.error("Batch save order failed:", e);
        dom.status.innerText = "Connection error saving order";
        setTimeout(() => { dom.status.innerText = oldStatus; }, 3000);
    }
}

// --- TASK DETAIL MODAL ---
let modalThoughtId = null;

function renderNotesLinks(text) {
    if (!text) {
        dom.modalNotesLinks.innerHTML = '';
        return;
    }
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links = text.match(urlRegex) || [];
    if (links.length > 0) {
        dom.modalNotesLinks.innerHTML = links.map(url => 
            `<a href="${url}" target="_blank" style="color: var(--accent-blue); text-decoration: underline;">${url}</a>`
        ).join('');
    } else {
        dom.modalNotesLinks.innerHTML = '';
    }
}

function openTaskModal(id, content, meta) {
    modalThoughtId = id;
    dom.modalContent.innerHTML = simpleMarkdownToHtml(content);
    dom.modalSummary.value = meta.summary || content;
    dom.modalNotes.value = meta.notes || '';
    renderNotesLinks(meta.notes);
    
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
    
    // Set modal title based on type
    updateModalTitle(meta.type || 'task');
    
    // Coding task fields
    const isCodingTask = (meta.type === 'coding_task');
    toggleCodingTaskFields(isCodingTask);
    if (isCodingTask && meta.coding_task) {
        dom.modalCtProject.value = meta.coding_task.project || 'uncategorized';
        dom.modalCtComplexity.value = meta.coding_task.complexity || 'moderate';
        dom.modalCtStatus.value = meta.coding_task.status || 'draft';
    } else {
        dom.modalCtProject.value = 'uncategorized';
        dom.modalCtComplexity.value = 'moderate';
        dom.modalCtStatus.value = 'draft';
    }
    
    // Toggle Complete button label based on current status
    const isCompleted = meta.status === 'completed';
    dom.modalComplete.textContent = isCompleted ? '↩ Reopen' : '✓ Complete';
    dom.modalComplete.className = isCompleted ? 'modal-btn modal-btn-danger' : 'modal-btn modal-btn-success';
    
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

function updateModalTitle(type) {
    const titles = {
        task: 'Task Details',
        coding_task: '⚡ Coding Task Details',
        event: 'Event Details',
        observation: 'Observation Details',
        idea: 'Idea Details',
        reference: 'Reference Details',
        person_note: 'Person Note Details'
    };
    dom.modalTitle.textContent = titles[type] || 'Details';
}

function toggleCodingTaskFields(show) {
    if (show) {
        dom.codingTaskFields.classList.remove('hidden');
    } else {
        dom.codingTaskFields.classList.add('hidden');
    }
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
    dom.codingTaskFields.classList.add('hidden');
    resetDayButtons();
    modalThoughtId = null;

    if (editSource === 'history') {
        dom.historyPanel.classList.remove('hidden');
        dom.historyList.scrollTop = historyScrollTop;
        editSource = null;
    }
}

dom.modalClose.addEventListener('click', closeTaskModal);
dom.modal.addEventListener('click', (e) => {
    if (e.target === dom.modal) closeTaskModal();
});

// Live update links while typing in notes
dom.modalNotes.addEventListener('input', () => {
    renderNotesLinks(dom.modalNotes.value);
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
    const newType = dom.modalType.value;
    toggleEventFields(newType === 'event');
    toggleCodingTaskFields(newType === 'coding_task');
    updateModalTitle(newType);
});

// Improve button in task detail modal → launches the same improve dialog
dom.modalCtImproveBtn.addEventListener('click', () => {
    if (!modalThoughtId) return;
    const content = dom.modalContent.innerText;
    const meta = { coding_task: { project: dom.modalCtProject.value, status: dom.modalCtStatus.value } };
    openImproveDialog(modalThoughtId, content, meta);
});

// Show/hide time fields when all-day changes
dom.modalAllDay.addEventListener('change', () => {
    toggleTimeFields(!dom.modalAllDay.checked);
});

dom.modalSave.addEventListener('click', async () => {
    if (!modalThoughtId) return;
    const id = modalThoughtId;
    const newContent = dom.modalContent.innerText.trim();
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
                summary: dom.modalSummary.value.trim() || null,
                notes: dom.modalNotes.value.trim() || null,
                // Event-specific fields
                all_day: dom.modalType.value === 'event' ? dom.modalAllDay.checked : null,
                start_time: dom.modalType.value === 'event' && !dom.modalAllDay.checked ? dom.modalStartTime.value || null : null,
                end_time: dom.modalType.value === 'event' && !dom.modalAllDay.checked ? dom.modalEndTime.value || null : null,
                location: dom.modalType.value === 'event' ? dom.modalLocation.value.trim() || null : null,
                // Coding task fields
                ...(dom.modalType.value === 'coding_task' ? {
                    coding_task: {
                        project: dom.modalCtProject.value,
                        complexity: dom.modalCtComplexity.value,
                        status: dom.modalCtStatus.value,
                        priority: dom.modalPriority.value === 'high' ? 'high' : dom.modalPriority.value === 'low' ? 'low' : 'medium',
                        workspace: ['chatops','quote_manager','liturgy_explorer','homily_pipeline','stream_management','backups_devops'].includes(dom.modalCtProject.value) ? 'airmaria' : 'openbrain',
                    }
                } : {})
            }
        };

        const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify(updatePayload)
        });
        const data = await res.json();
        if (data.success) {
            const source = editSource;
            const scrollTop = historyScrollTop;
            closeTaskModal();
            if (source === 'history') {
                await loadHistory();
                dom.historyList.scrollTop = scrollTop;
            } else if (source === 'coding_tasks') {
                await loadCodingTasks();
            } else {
                loadTasksDashboard();
            }
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
        
        const taskEl = document.querySelector(`.task-item[data-id="${modalThoughtId}"]`) || document.querySelector(`.ct-card[data-id="${modalThoughtId}"]`);
        if (taskEl) {
            if (taskEl.classList.contains('task-item')) {
                const container = taskEl.closest('.task-section-container');
                const header = container ? container.previousElementSibling : null;
                taskEl.remove();
                if (container && container.querySelectorAll('.task-item').length === 0) {
                    if (header && header.classList.contains('section-header')) header.remove();
                    container.remove();
                }
            } else {
                taskEl.remove();
            }
        }
        const source = editSource;
        const scrollTop = historyScrollTop;
        closeTaskModal();
        if (source === 'history') {
            await loadHistory();
            dom.historyList.scrollTop = scrollTop;
        } else if (source === 'coding_tasks') {
            await loadCodingTasks();
        }
    } catch (e) {
        alert('Delete failed.');
    }
});

dom.modalComplete.addEventListener('click', async () => {
    if (!modalThoughtId) return;
    
    const taskEl = document.querySelector(`.task-item[data-id="${modalThoughtId}"]`);
    const currentMeta = taskEl ? JSON.parse(taskEl.dataset.meta || '{}') : {};
    const isCurrentlyCompleted = currentMeta.status === 'completed';
    const newStatus = isCurrentlyCompleted ? 'pending' : 'completed';
    
    dom.modalComplete.textContent = 'Saving...';
    dom.modalComplete.disabled = true;
    
    try {
        await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'update', id: modalThoughtId, metadata: { ...currentMeta, status: newStatus }})
        });
        
        if (taskEl && newStatus === 'completed') {
            // Visual feedback then remove
            taskEl.style.opacity = '0.5';
            const contentEl = taskEl.querySelector('.task-content');
            if (contentEl) contentEl.style.textDecoration = 'line-through';
            const checkbox = taskEl.querySelector('.task-checkbox');
            if (checkbox) checkbox.classList.add('checked');
            
            setTimeout(() => {
                const container = taskEl.closest('.task-section-container');
                const header = container ? container.previousElementSibling : null;
                taskEl.remove();
                if (container && container.querySelectorAll('.task-item').length === 0) {
                    if (header && header.classList.contains('section-header')) header.remove();
                    container.remove();
                }
            }, 500);
        } else if (taskEl && newStatus === 'pending') {
            taskEl.style.opacity = '1';
            const contentEl = taskEl.querySelector('.task-content');
            if (contentEl) contentEl.style.textDecoration = 'none';
            const checkbox = taskEl.querySelector('.task-checkbox');
            if (checkbox) checkbox.classList.remove('checked');
            taskEl.dataset.meta = JSON.stringify({ ...currentMeta, status: 'pending' });
        }
        
        const source = editSource;
        const scrollTop = historyScrollTop;
        closeTaskModal();
        if (source === 'history') {
            await loadHistory();
            dom.historyList.scrollTop = scrollTop;
        }
    } catch (e) {
        alert('Error updating task status.');
    } finally {
        dom.modalComplete.disabled = false;
    }
});

// --- QUICK CAPTURE ---
dom.quickCaptureBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        dom.quickCaptureOverlay.classList.remove('hidden');
        dom.quickCaptureInput.value = '';
        dom.quickCaptureStatus.textContent = '';
        dom.quickCaptureSubmit.textContent = 'Capture';
        dom.quickCaptureSubmit.disabled = false;
        setTimeout(() => dom.quickCaptureInput.focus(), 100);
    });
});

function closeQuickCapture() {
    dom.quickCaptureOverlay.classList.add('hidden');
    dom.quickCaptureInput.value = '';
    dom.quickCaptureStatus.textContent = '';
}

dom.quickCaptureClose.addEventListener('click', closeQuickCapture);
dom.quickCaptureOverlay.addEventListener('click', (e) => {
    if (e.target === dom.quickCaptureOverlay) closeQuickCapture();
});

dom.quickCaptureSubmit.addEventListener('click', async () => {
    const text = dom.quickCaptureInput.value.trim();
    if (!text) return;
    
    dom.quickCaptureSubmit.textContent = 'Capturing...';
    dom.quickCaptureSubmit.disabled = true;
    dom.quickCaptureStatus.textContent = '';
    
    try {
        const res = await fetch(CONFIG.ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ text, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
        });
        const data = await res.json();
        
        dom.quickCaptureStatus.textContent = data.text || 'Captured!';
        dom.quickCaptureInput.value = '';
        dom.quickCaptureSubmit.textContent = 'Capture';
        dom.quickCaptureSubmit.disabled = false;
        
        // Auto-close after a brief delay so user sees the confirmation
        setTimeout(() => {
            closeQuickCapture();
            // Refresh tasks if the tasks panel is open
            if (!dom.tasksPanel.classList.contains('hidden')) loadTasksDashboard();
        }, 1200);
    } catch (e) {
        dom.quickCaptureStatus.textContent = 'Error capturing.';
        dom.quickCaptureSubmit.textContent = 'Retry';
        dom.quickCaptureSubmit.disabled = false;
    }
});

// Submit on Enter (Shift+Enter for newline)
dom.quickCaptureInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        dom.quickCaptureSubmit.click();
    }
});

// --- SAINT MAX LIVE VOICE REAL-TIME ORCHESTRATION ---

// Float32 input downsampler to 16 kHz mono PCM
function resampleTo16k(inputBuffer, fromSampleRate) {
    const ratio = fromSampleRate / 16000;
    const newLength = Math.round(inputBuffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetInput = 0;
    while (offsetResult < result.length) {
        const nextOffsetInput = Math.round((offsetResult + 1) * ratio);
        let accum = 0, count = 0;
        for (let i = offsetInput; i < nextOffsetInput && i < inputBuffer.length; i++) {
            accum += inputBuffer[i];
            count++;
        }
        result[offsetResult] = count > 0 ? accum / count : 0;
        offsetResult++;
        offsetInput = nextOffsetInput;
    }
    return result;
}

// Convert float32 array (-1.0 to 1.0) to raw Little-Endian 16-bit PCM ArrayBuffer
function float32ToPcm16(float32Array) {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
}

// Convert raw Little-Endian 16-bit PCM ArrayBuffer to Float32Array
function pcm16ToFloat32(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const length = arrayBuffer.byteLength / 2;
    const result = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        result[i] = view.getInt16(i * 2, true) / 32768.0;
    }
    return result;
}

// Convert ArrayBuffer to Base64 String
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Convert Base64 String to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return buffer;
}

// Set Webflow visual states
function setWaveformState(state) {
    if (!dom.voiceWaveform) return;
    if (state === "speaking") {
        dom.voiceWaveform.classList.remove('listening');
        dom.voiceWaveform.classList.add('speaking');
    } else if (state === "listening") {
        dom.voiceWaveform.classList.remove('speaking');
        dom.voiceWaveform.classList.add('listening');
    } else {
        dom.voiceWaveform.classList.remove('speaking', 'listening');
    }
}

// Web Audio API buffer scheduling queue (eliminates speaker clicks & gaps)
function queueLiveAudio(float32Chunk) {
    if (!audioContext || audioContext.state === 'suspended') return;
    
    const audioBuffer = audioContext.createBuffer(1, float32Chunk.length, 24000);
    audioBuffer.getChannelData(0).set(float32Chunk);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    const now = audioContext.currentTime;
    if (nextAudioStartTime < now) {
        nextAudioStartTime = now + 0.04;
    }
    
    source.start(nextAudioStartTime);
    nextAudioStartTime += audioBuffer.duration;
    
    // Wave animation sync
    setWaveformState("speaking");
    clearTimeout(waveformTimer);
    waveformTimer = setTimeout(() => {
        if (audioContext.currentTime >= nextAudioStartTime) {
            setWaveformState("listening");
        }
    }, (nextAudioStartTime - now) * 1000);
}

// Microphone capture initialization
async function initMicrophone() {
    micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        }
    });
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    nextAudioStartTime = audioContext.currentTime;
    
    const sourceNode = audioContext.createMediaStreamSource(micStream);
    const nativeSampleRate = audioContext.sampleRate;
    console.log("Mic AudioContext sample rate:", nativeSampleRate);
    
    processorNode = audioContext.createScriptProcessor(4096, 1, 1);
    
    processorNode.onaudioprocess = (event) => {
        if (!liveVoiceActive || liveVoiceMuted) return;
        if (!liveVoiceSocket || liveVoiceSocket.readyState !== WebSocket.OPEN) return;
        
        const inputData = event.inputBuffer.getChannelData(0);
        const resampledData = resampleTo16k(inputData, nativeSampleRate);
        const pcmBuffer = float32ToPcm16(resampledData);
        const base64Data = arrayBufferToBase64(pcmBuffer);
        
        liveVoiceSocket.send(JSON.stringify({
            realtimeInput: {
                audio: {
                    data: base64Data,
                    mimeType: "audio/pcm"
                }
            }
        }));
    };
    
    sourceNode.connect(processorNode);
    processorNode.connect(audioContext.destination);
}

// Establish real-time WebSocket connection to Supabase Proxy
async function startLiveVoice() {
    if (liveVoiceActive) return;
    
    // Deactivate standard dictation recognition while live voice call is active
    try { recognition?.stop(); } catch(e){}
    isListening = false;
    
    dom.liveVoicePanel.classList.remove('hidden');
    dom.liveVoiceBtn.classList.add('active');
    dom.liveVoiceStatus.textContent = "Connecting to Saint Max...";
    dom.liveVoiceCaption.textContent = '"Listening..."';
    setWaveformState("listening");
    
    liveVoiceActive = true;
    liveVoiceMuted = false;
    dom.liveVoiceMute.textContent = "Mute Mic";
    dom.liveVoiceMute.classList.remove('muted');
    
    // Step 1: Fetch ephemeral token from our server
    let token;
    try {
        const tokenRes = await fetch(CONFIG.GEMINI_LIVE_TOKEN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY }
        });
        if (!tokenRes.ok) throw new Error(`Token fetch failed: ${tokenRes.status}`);
        const tokenData = await tokenRes.json();
        token = tokenData.token;
        console.log("Ephemeral token obtained.");
    } catch (err) {
        console.error("Failed to get ephemeral token:", err);
        dom.liveVoiceStatus.textContent = "Failed to connect. Try again.";
        setTimeout(() => endLiveVoice(), 2000);
        return;
    }
    
    // Step 2: Connect directly to Google's Live API using the ephemeral token
    const googleWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${token}`;
    liveVoiceSocket = new WebSocket(googleWsUrl);
    
    let micStarted = false;
    
    async function startMicIfNeeded() {
        if (micStarted) return;
        micStarted = true;
        try {
            await initMicrophone();
            dom.liveVoiceStatus.textContent = "Saint Max is listening!";
        } catch (err) {
            console.error("Microphone access failed:", err);
            dom.liveVoiceStatus.textContent = "Microphone access denied.";
        }
    }
    
    liveVoiceSocket.onopen = () => {
        dom.liveVoiceStatus.textContent = "Establishing voice tunnel...";
        
        // Step 3: Send setup message directly to Google
        const localDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        
        const setupPayload = {
            setup: {
                model: 'models/gemini-2.5-flash-native-audio-latest',
                generationConfig: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Puck' }
                        }
                    }
                },
                systemInstruction: {
                    parts: [{
                        text: `You are Roderic's private Open Brain real-time voice assistant called Saint Max. Today is ${localDate}.
Speak in complete, natural, and flowing sentences. Do not mention system or code details.
CRITICAL INSTRUCTIONS:
- You have access to Roderic's private memories and to-dos via function tools (search_thoughts and capture_thought).
- You have access to Google Search natively (via googleSearch). If he asks for weather, news, or current facts, automatically perform a web search to answer.
- Always use the tools when he asks about his notes, tasks, yesterday, or today's priorities.
- NEVER speak in markdown. Do not use asterisks, lists, bold formatting, or bullet points. Speak as a companion in flowing plain-text speech only.`
                    }]
                },
                tools: [
                    { googleSearch: {} },
                    {
                        functionDeclarations: [
                            {
                                name: 'search_thoughts',
                                description: "Searches Roderic's personal Open Brain memories, tasks, and historical notes for past facts, reminders, or ideas.",
                                parameters: {
                                    type: 'OBJECT',
                                    properties: { query: { type: 'STRING', description: 'The semantic query to search for' } },
                                    required: ['query']
                                }
                            },
                            {
                                name: 'capture_thought',
                                description: "Records a new task, event, observation, or reference in Roderic's private brain database.",
                                parameters: {
                                    type: 'OBJECT',
                                    properties: { content: { type: 'STRING', description: 'The clear text thought content to capture' } },
                                    required: ['content']
                                }
                            }
                        ]
                    }
                ]
            }
        };
        
        liveVoiceSocket.send(JSON.stringify(setupPayload));
        
        // Fallback: start mic after 3s if setupComplete doesn't arrive
        setTimeout(() => {
            if (!micStarted) {
                console.warn("setupComplete not received within 3s, starting mic anyway.");
                startMicIfNeeded();
            }
        }, 3000);
    };
    
    liveVoiceSocket.onmessage = async (event) => {
        try {
            // Handle Blob data from WebSocket
            let rawData = event.data;
            if (rawData instanceof Blob) {
                rawData = await rawData.text();
            }
            const msg = JSON.parse(rawData);
            
            // Handle setupComplete
            if (msg.setupComplete) {
                console.log("Gemini Live setup complete.");
                startMicIfNeeded();
                return;
            }
            
            // Handle tool calls — execute via our Supabase HTTP endpoint
            if (msg.toolCall) {
                const { functionCalls } = msg.toolCall;
                const responses = [];
                
                for (const call of functionCalls) {
                    try {
                        const toolRes = await fetch(CONFIG.GEMINI_LIVE_TOOL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
                            body: JSON.stringify({ name: call.name, args: call.args, id: call.id })
                        });
                        const result = await toolRes.json();
                        responses.push({ response: result.response, id: result.id });
                    } catch (toolErr) {
                        console.error(`Tool ${call.name} failed:`, toolErr);
                        responses.push({ response: { output: { error: 'Tool execution failed' } }, id: call.id });
                    }
                }
                
                // Send tool responses back to Google
                liveVoiceSocket.send(JSON.stringify({
                    toolResponse: { functionResponses: responses }
                }));
                return;
            }
            
            // Intercept synthesized speech chunks
            if (msg.serverContent && msg.serverContent.modelTurn) {
                const parts = msg.serverContent.modelTurn.parts;
                for (const part of parts) {
                    if (part.inlineData && part.inlineData.data) {
                        const base64Audio = part.inlineData.data;
                        const arrayBuffer = base64ToArrayBuffer(base64Audio);
                        const float32Data = pcm16ToFloat32(arrayBuffer);
                        queueLiveAudio(float32Data);
                    }
                    if (part.text) {
                        dom.liveVoiceCaption.textContent = `"${part.text}"`;
                    }
                }
            }
            
            // Handle turn complete
            if (msg.serverContent && msg.serverContent.turnComplete) {
                setWaveformState("listening");
            }
        } catch (err) {
            console.error("Error processing Live response:", err);
        }
    };
    
    liveVoiceSocket.onclose = () => {
        endLiveVoice();
    };
    
    liveVoiceSocket.onerror = (err) => {
        console.error("WebSocket failure:", err);
        dom.liveVoiceStatus.textContent = "Connection issue.";
    };
}

// Gracefully close all sockets, mic handles, and streams
function endLiveVoice() {
    if (!liveVoiceActive) return;
    liveVoiceActive = false;
    
    console.log("Shutting down real-time audio session.");
    
    if (liveVoiceSocket) {
        try { liveVoiceSocket.close(); } catch(e){}
        liveVoiceSocket = null;
    }
    
    if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        micStream = null;
    }
    
    if (processorNode) {
        try { processorNode.disconnect(); } catch(e){}
        processorNode = null;
    }
    
    if (audioContext) {
        try { audioContext.close(); } catch(e){}
        audioContext = null;
    }
    
    dom.liveVoicePanel.classList.add('hidden');
    dom.liveVoiceBtn.classList.remove('active');
    setWaveformState("none");
    
    // Automatically restart standard push-to-talk recognition
    setTimeout(() => {
        try { recognition?.start(); } catch(e){}
    }, 1200);
}

// Toggle mute state
function toggleLiveVoiceMute() {
    liveVoiceMuted = !liveVoiceMuted;
    if (liveVoiceMuted) {
        dom.liveVoiceMute.textContent = "Unmute Mic";
        dom.liveVoiceMute.classList.add('muted');
        dom.liveVoiceStatus.textContent = "Microphone muted";
        setWaveformState("none");
    } else {
        dom.liveVoiceMute.textContent = "Mute Mic";
        dom.liveVoiceMute.classList.remove('muted');
        dom.liveVoiceStatus.textContent = "Saint Max is listening!";
        setWaveformState("listening");
    }
}

// Event bindings
dom.liveVoiceBtn.addEventListener('click', () => {
    if (liveVoiceActive) {
        endLiveVoice();
    } else {
        startLiveVoice();
    }
});

dom.liveVoiceClose.addEventListener('click', endLiveVoice);
dom.liveVoiceEnd.addEventListener('click', endLiveVoice);
dom.liveVoiceMute.addEventListener('click', toggleLiveVoiceMute);

// ===== CODING TASKS MODULE =====

const ctDom = {
    panel: document.getElementById('coding-tasks-panel'),
    btn: document.getElementById('coding-tasks-btn'),
    closeBtn: document.getElementById('close-coding-tasks'),
    list: document.getElementById('coding-tasks-list'),
    addBtn: document.getElementById('add-coding-task-btn'),
    filterProject: document.getElementById('ct-filter-project'),
    copySearchBtn: document.getElementById('ct-copy-search-btn'),
    projectInfoBtn: document.getElementById('ct-project-info-btn'),
    filterStatus: document.getElementById('ct-filter-status'),
    filterDraft: document.getElementById('ct-filter-draft'),
    filterNeedsInput: document.getElementById('ct-filter-needs-input'),
    filterAntigravGo: document.getElementById('ct-filter-antigrav-go'),
    ctSearch: document.getElementById('ct-search'),
    // Add Modal
    addModal: document.getElementById('add-ct-modal'),
    addContent: document.getElementById('add-ct-content'),
    addProject: document.getElementById('add-ct-project'),
    addPriority: document.getElementById('add-ct-priority'),
    addComplexity: document.getElementById('add-ct-complexity'),
    addStatus: document.getElementById('add-ct-status'),
    addSubmit: document.getElementById('add-ct-submit'),
    addCancel: document.getElementById('add-ct-cancel'),
    closeAddModal: document.getElementById('close-add-ct'),
    // Improve Dialog
    improveDialog: document.getElementById('improve-ct-dialog'),
    closeImprove: document.getElementById('close-improve-ct'),
    improveOriginal: document.getElementById('improve-original'),
    improveResult: document.getElementById('improve-result-rendered'),
    // improveResult is now the contenteditable div (was separate textarea+rendered)
    improveSuggestionsList: document.getElementById('improve-suggestions-list'),
    readinessBarFill: document.getElementById('readiness-bar-fill'),
    readinessLabel: document.getElementById('readiness-label'),
    readinessNotes: document.getElementById('readiness-notes'),
    improveAgainBtn: document.getElementById('improve-again-btn'),
    improveSubmitBtn: document.getElementById('improve-submit-btn'),
    // Project Info Modal
    projectInfoModal: document.getElementById('project-info-modal'),
    projectInfoTitle: document.getElementById('project-info-title'),
    projectInfoText: document.getElementById('project-info-text'),
    closeProjectInfo: document.getElementById('close-project-info'),
    projectInfoOk: document.getElementById('project-info-ok'),
};

// Simple markdown to HTML converter
function simpleMarkdownToHtml(md) {
    if (!md) return '';
    let html = md
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')  // escape HTML
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, (match) => '<ul>' + match + '</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    return '<p>' + html + '</p>';
}

function setImproveRenderedText(text) {
    // Store raw markdown as data attribute for Improve Again
    ctDom.improveResult.dataset.rawText = text;
    ctDom.improveResult.innerHTML = simpleMarkdownToHtml(text);
}

let ctImproveTaskId = null; // Track which task is being improved

const PROJECT_LABELS = {
    chatops: 'Chat Ops', quote_manager: 'Quote Mgr', liturgy_explorer: 'Liturgy',
    homily_pipeline: 'Homily', stream_management: 'Streams', backups_devops: 'DevOps',
    maximus_core: 'Maximus', open_brain: 'Open Brain', infrastructure: 'Infra',
    uncategorized: 'Other'
};

const STATUS_LABELS = {
    draft: 'Draft', needs_clarification: 'Needs Clarification', needs_plan: 'Needs Plan',
    ready_for_antigravity: 'Ready for Antigravity',
    rework_in_antigravity: 'Rework in Antigravity', in_progress: 'In Progress',
    needs_verification: 'Needs Verification', needs_logging: 'Needs Logging', done: 'Done'
};

const STATUS_GROUPS = {
    draft: ['draft'],
    needsInput: [
        'needs_clarification',
        'needs_verification',
        'in_progress'
    ],
    antigravGo: [
        'needs_plan',
        'ready_for_antigravity',
        'rework_in_antigravity',
        'needs_logging'
    ]
};

let activeQuickFilter = null; // 'draft' or 'needsInput' or 'antigravGo' or null

// Panel open/close
ctDom.btn.addEventListener('click', () => { ctDom.panel.classList.remove('hidden'); loadCodingTasks(); });
ctDom.closeBtn.addEventListener('click', () => ctDom.panel.classList.add('hidden'));
document.getElementById('refresh-coding-tasks').addEventListener('click', loadCodingTasks);

// Filters
ctDom.filterProject.addEventListener('change', () => {
    loadCodingTasks();
    updateProjectInfoTooltip();
});
ctDom.filterStatus.addEventListener('change', () => {
    activeQuickFilter = null;
    ctDom.filterDraft.classList.remove('active');
    ctDom.filterNeedsInput.classList.remove('active');
    ctDom.filterAntigravGo.classList.remove('active');
    loadCodingTasks();
});

function setQuickFilter(filterType) {
    if (activeQuickFilter === filterType) {
        activeQuickFilter = null;
        ctDom.filterDraft.classList.remove('active');
        ctDom.filterNeedsInput.classList.remove('active');
        ctDom.filterAntigravGo.classList.remove('active');
    } else {
        activeQuickFilter = filterType;
        ctDom.filterDraft.classList.toggle('active', filterType === 'draft');
        ctDom.filterNeedsInput.classList.toggle('active', filterType === 'needsInput');
        ctDom.filterAntigravGo.classList.toggle('active', filterType === 'antigravGo');
        ctDom.filterStatus.value = '';
    }
    loadCodingTasks();
}

ctDom.filterDraft.addEventListener('click', () => setQuickFilter('draft'));
ctDom.filterNeedsInput.addEventListener('click', () => setQuickFilter('needsInput'));
ctDom.filterAntigravGo.addEventListener('click', () => setQuickFilter('antigravGo'));

// Copy Search Phrase
if (ctDom.copySearchBtn) {
    ctDom.copySearchBtn.addEventListener('click', () => {
        const projectVal = ctDom.filterProject.value;
        let textToCopy = '';
        if (!projectVal) {
            textToCopy = "Whats Ready?";
        } else {
            const selectedOption = ctDom.filterProject.options[ctDom.filterProject.selectedIndex];
            const projectName = selectedOption ? selectedOption.text : 'Other';
            textToCopy = `What's ready in ${projectName}?`;
        }
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = ctDom.copySearchBtn.textContent;
            ctDom.copySearchBtn.textContent = 'Copied!';
            ctDom.copySearchBtn.classList.add('copied');
            setTimeout(() => {
                ctDom.copySearchBtn.textContent = originalText;
                ctDom.copySearchBtn.classList.remove('copied');
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });
}

// Project Descriptions data and Event Handler
const PROJECT_DESCRIPTIONS = {
    chatops: "UI panel and administrative tools for chat moderation, message history, participant intentions, and prayer orchestration.",
    quote_manager: "Management of saint quotes, Eucharistic reflections, liturgical seasons, categories, and quote group tracking.",
    liturgy_explorer: "Liturgical readings, mass calendar explorer, weekday fetcher, readings parser, and missal database synchronization.",
    homily_pipeline: "AI homily processing pipeline, including audio uploads, FFmpeg/Whisper transcribing, text refinement, and YouTube publishing.",
    stream_management: "Live stream scheduler, title/description templates, stream state tracking, and canceled stream handlers.",
    backups_devops: "Database backups, data exports, system health monitoring, environment configs, and server integrations.",
    maximus_core: "Central PWA dashboard, voice capturing, voice agenda query system, task tracking, and sync pipelines.",
    open_brain: "Supabase vector database for storing thoughts, tasks, references, and embeddings for semantic search.",
    infrastructure: "Server configs, API routes, Supabase edge functions, database migrations, and performance optimization.",
    uncategorized: "General tasks and uncategorized features not tied to a specific sub-project."
};

function updateProjectInfoTooltip() {
    if (!ctDom.projectInfoBtn) return;
    const projectVal = ctDom.filterProject.value;
    const selectedOption = ctDom.filterProject.options[ctDom.filterProject.selectedIndex];
    const projectName = selectedOption ? selectedOption.text : 'All Projects';
    
    let desc = '';
    if (!projectVal) {
        desc = "Unified dashboard displaying coding tasks across all subsystems of Saint Max and AirMaria.";
    } else {
        desc = PROJECT_DESCRIPTIONS[projectVal] || "No description available for this project.";
    }
    
    const words = desc.split(/\s+/);
    const summary = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
    ctDom.projectInfoBtn.title = `${summary} - Click for more info`;
}

// Initialize tooltip on page load
updateProjectInfoTooltip();

if (ctDom.projectInfoBtn) {
    ctDom.projectInfoBtn.addEventListener('click', () => {
        const projectVal = ctDom.filterProject.value;
        const selectedOption = ctDom.filterProject.options[ctDom.filterProject.selectedIndex];
        const projectName = selectedOption ? selectedOption.text : 'All Projects';
        
        let descText = '';
        if (!projectVal) {
            descText = "Unified dashboard displaying coding tasks across all subsystems of Saint Max and AirMaria.";
        } else {
            descText = PROJECT_DESCRIPTIONS[projectVal] || "No description available for this project.";
        }
        
        if (ctDom.projectInfoTitle && ctDom.projectInfoText && ctDom.projectInfoModal) {
            ctDom.projectInfoTitle.textContent = `${projectName} Info`;
            ctDom.projectInfoText.textContent = descText;
            ctDom.projectInfoModal.classList.remove('hidden');
        }
    });
}

// Close Project Info modal
if (ctDom.closeProjectInfo && ctDom.projectInfoModal) {
    ctDom.closeProjectInfo.addEventListener('click', () => ctDom.projectInfoModal.classList.add('hidden'));
}
if (ctDom.projectInfoOk && ctDom.projectInfoModal) {
    ctDom.projectInfoOk.addEventListener('click', () => ctDom.projectInfoModal.classList.add('hidden'));
}
if (ctDom.projectInfoModal) {
    ctDom.projectInfoModal.addEventListener('click', (e) => {
        if (e.target === ctDom.projectInfoModal) {
            ctDom.projectInfoModal.classList.add('hidden');
        }
    });
}

// Search: client-side filter on rendered cards
let ctSearchTimeout = null;
ctDom.ctSearch.addEventListener('input', () => {
    clearTimeout(ctSearchTimeout);
    ctSearchTimeout = setTimeout(() => {
        const query = ctDom.ctSearch.value.toLowerCase().trim();
        const cards = ctDom.list.querySelectorAll('.ct-card');
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = query === '' || text.includes(query) ? '' : 'none';
        });
        // Also hide/show status counts bar
        const countsBar = ctDom.list.querySelector('.ct-status-counts');
        if (countsBar) countsBar.style.display = query ? 'none' : '';
    }, 200);
});

async function loadCodingTasks() {
    ctDom.list.innerHTML = '<div class="ct-loading"><div class="ct-spinner"></div>Loading coding tasks...</div>';
    try {
        const body = { action: 'list_coding_tasks' };
        const project = ctDom.filterProject.value;
        const status = ctDom.filterStatus.value;
        if (project) body.project = project;
        if (!activeQuickFilter && status) body.status = status;

        const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!data.thoughts) { ctDom.list.innerHTML = '<div class="history-empty">Error loading tasks.</div>'; return; }

        let tasks = data.thoughts;
        if (activeQuickFilter === 'draft') {
            tasks = tasks.filter(t => {
                const s = t.metadata?.coding_task?.status || 'draft';
                return STATUS_GROUPS.draft.includes(s);
            });
        } else if (activeQuickFilter === 'needsInput') {
            tasks = tasks.filter(t => {
                const s = t.metadata?.coding_task?.status || 'draft';
                return STATUS_GROUPS.needsInput.includes(s);
            });
        } else if (activeQuickFilter === 'antigravGo') {
            tasks = tasks.filter(t => {
                const s = t.metadata?.coding_task?.status || 'draft';
                return STATUS_GROUPS.antigravGo.includes(s);
            });
        }

        renderCodingTasksList(tasks);
    } catch (e) {
        console.error('Load coding tasks error:', e);
        ctDom.list.innerHTML = '<div class="history-empty">Error loading coding tasks.</div>';
    }
}

function renderCodingTasksList(tasks) {
    ctDom.list.innerHTML = '';

    if (!tasks.length) {
        ctDom.list.innerHTML = '<div class="history-empty">No coding tasks found. Add one with the + button.</div>';
        return;
    }

    // Status counts
    const counts = {};
    tasks.forEach(t => {
        const s = t.metadata?.coding_task?.status || 'draft';
        counts[s] = (counts[s] || 0) + 1;
    });
    const countsBar = document.createElement('div');
    countsBar.className = 'ct-status-counts';
    for (const [s, c] of Object.entries(counts)) {
        const chip = document.createElement('span');
        chip.className = 'ct-count-chip';
        chip.innerHTML = `<strong>${c}</strong>${STATUS_LABELS[s] || s}`;
        countsBar.appendChild(chip);
    }
    ctDom.list.appendChild(countsBar);

    // Sort: priority high > medium > low, then by sort_order, then by created_at
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    tasks.sort((a, b) => {
        const pa = priorityOrder[a.metadata?.coding_task?.priority || 'medium'] ?? 1;
        const pb = priorityOrder[b.metadata?.coding_task?.priority || 'medium'] ?? 1;
        if (pa !== pb) return pa - pb;
        const sa = a.metadata?.coding_task?.sort_order ?? 50;
        const sb = b.metadata?.coding_task?.sort_order ?? 50;
        if (sa !== sb) return sa - sb;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    tasks.forEach(t => {
        const card = renderCodingTaskCard(t);
        ctDom.list.appendChild(card);
    });
}

// Mapping of task statuses to their corresponding markdown files
const STATUS_MD_FILES = {
    needs_plan: 'implementation_plan.md',
    ready_for_antigravity: 'task.md',
    rework_in_antigravity: 'task.md',
    in_progress: 'task.md',
    needs_verification: 'walkthrough.md',
    needs_logging: 'walkthrough.md'
};

function getPromptTextForStatus(status, summary, taskId) {
    const cleanSummary = summary.trim();
    
    switch (status) {
        case 'needs_plan':
            return `Please create an implementation plan for task: "${cleanSummary}" (ID: ${taskId}) in implementation_plan.md. The subsequent execution will follow in task.md once approved.`;
        case 'ready_for_antigravity':
            return `${cleanSummary}:\nThe task: "${cleanSummary}" (ID: ${taskId}) is ready. Please proceed with execution as per task.md. The follow-up walkthrough and verification will be documented in walkthrough.md.`;
        case 'rework_in_antigravity':
            return `Please review the verification feedback from the user to fix what is wrong or not complete for the task: "${cleanSummary}" (ID: ${taskId}) as per task.md. The follow-up walkthrough and verification will be documented in walkthrough.md.`;
        case 'in_progress':
            return `Please continue execution of task: "${cleanSummary}" (ID: ${taskId}) as per task.md. The follow-up walkthrough and verification will be documented in walkthrough.md.`;
        case 'needs_verification':
            return `Please verify the completed work for task: "${cleanSummary}" (ID: ${taskId}) using the checklist in walkthrough.md.`;
        case 'needs_logging':
            return `Please log the completed work for task: "${cleanSummary}" (ID: ${taskId}) in walkthrough.md and mark it done.`;
        default:
            return '';
    }
}

function renderCodingTaskCard(t) {
    const meta = t.metadata || {};
    const ct = meta.coding_task || {};
    const el = document.createElement('div');
    const doneStatuses = ['done', 'ready_for_antigravity', 'needs_plan', 'needs_logging'];
    el.className = 'ct-card' + (doneStatuses.includes(ct.status) ? ' ct-done' : '');
    el.dataset.id = t.id;

    const priority = ct.priority || 'medium';
    const status = ct.status || 'draft';
    const project = ct.project || 'uncategorized';
    const complexity = ct.complexity || 'moderate';
    const summary = meta.summary || t.content.substring(0, 80);

    el.innerHTML = `
        <div class="ct-card-header">
            <div class="ct-priority-dot ${priority}"></div>
            <div class="ct-card-main">
                <div class="ct-summary">${escapeHtml(summary)}</div>
                <div class="ct-meta-row">
                    <span class="ct-badge status-${status}">${STATUS_LABELS[status] || status}</span>
                    <span class="ct-badge project">${PROJECT_LABELS[project] || project}</span>
                    <span class="ct-badge priority-badge priority-${priority}">${priority === 'high' ? '🔴 High' : priority === 'low' ? '🟢 Low' : '🟡 Medium'}</span>
                    <span class="ct-badge complexity">⚙️ ${complexity}</span>
                </div>
            </div>
            <button class="ct-action-prompt-btn ${STATUS_GROUPS.antigravGo.includes(status) ? '' : 'hidden'}" title="Copy action prompt for Antigravity">📋 Action</button>
        </div>
        <div class="ct-expanded">
            <div class="ct-description-rendered improve-rendered improve-editable-rich" contenteditable="true">${simpleMarkdownToHtml(t.content)}</div>
            <textarea class="ct-description-area hidden" rows="6">${escapeHtml(t.content)}</textarea>
            <div class="ct-actions-row">
                <select class="ct-inline-select ct-status-select" title="Status">
                    ${Object.entries(STATUS_LABELS).map(([v, l]) =>
                        `<option value="${v}" ${v === status ? 'selected' : ''}>${l}</option>`
                    ).join('')}
                </select>
                <select class="ct-inline-select ct-priority-select" title="Priority">
                    <option value="high" ${priority === 'high' ? 'selected' : ''}>🔴 High</option>
                    <option value="medium" ${priority === 'medium' ? 'selected' : ''}>🟡 Medium</option>
                    <option value="low" ${priority === 'low' ? 'selected' : ''}>🟢 Low</option>
                </select>
                <button class="ct-action-btn ct-btn-improve">✨ Improve</button>
                <button class="ct-action-btn ct-btn-evaluate">🔄 Reevaluate</button>
                <button class="ct-action-btn ct-btn-rawtoggle">📝 Raw</button>
                <button class="ct-action-btn ct-btn-edit">📝 Edit</button>
                <button class="ct-action-btn ct-btn-save hidden">💾 Save</button>
                <button class="ct-action-btn ct-btn-delete">🗑</button>
            </div>
            <div class="ct-verification-section" style="display:${(ct.verification_items && ct.verification_items.length > 0) ? 'block' : 'none'}">
                <div class="ct-verification-header">
                    <span class="ct-verification-title">🔍 Verification Checklist</span>
                    <span class="ct-verification-progress"></span>
                </div>
                <ul class="ct-verification-list"></ul>
                <div class="ct-verification-actions">
                    <button class="ct-action-btn ct-btn-mark-done" style="display:none">✅ All Verified → Send for Logging</button>
                </div>
                <div class="ct-sendback-section" style="display:${status === 'needs_verification' ? 'block' : 'none'}">
                    <textarea class="ct-sendback-input" rows="2" placeholder="Describe what needs rework..."></textarea>
                    <button class="ct-action-btn ct-btn-sendback">↩ Send Back for Rework</button>
                </div>
            </div>
        </div>
    `;

    // Toggle expand on card click
    el.querySelector('.ct-card-header').addEventListener('click', () => {
        el.classList.toggle('expanded');
    });

    // Prevent clicks inside expanded from closing
    el.querySelector('.ct-expanded').addEventListener('click', (e) => e.stopPropagation());

    // Status change
    el.querySelector('.ct-status-select').addEventListener('change', async function() {
        const newStatus = this.value;
        const badge = el.querySelector('.ct-badge[class*="status-"]');
        badge.className = `ct-badge status-${newStatus}`;
        badge.textContent = STATUS_LABELS[newStatus] || newStatus;
        ct.status = newStatus;
        // Toggle done styling
        if (doneStatuses.includes(newStatus)) {
            el.classList.add('ct-done');
        } else {
            el.classList.remove('ct-done');
        }
        updatePromptBtnVisibility(newStatus);
        await updateCodingTaskMeta(t.id, meta);
    });

    // Priority change
    el.querySelector('.ct-priority-select').addEventListener('change', async function() {
        const newPriority = this.value;
        const dot = el.querySelector('.ct-priority-dot');
        dot.className = `ct-priority-dot ${newPriority}`;
        // Update the priority badge in header too
        const badge = el.querySelector('.priority-badge');
        if (badge) {
            badge.className = `ct-badge priority-badge priority-${newPriority}`;
            badge.textContent = newPriority === 'high' ? '🔴 High' : newPriority === 'low' ? '🟢 Low' : '🟡 Medium';
        }
        ct.priority = newPriority;
        await updateCodingTaskMeta(t.id, meta);
    });

    // Rich text editing + raw toggle refs
    const renderedDiv = el.querySelector('.ct-description-rendered');
    const rawTextarea = el.querySelector('.ct-description-area');
    const rawToggleBtn = el.querySelector('.ct-btn-rawtoggle');
    const saveBtn = el.querySelector('.ct-btn-save');

    // Track original content for dirty detection
    let savedContent = t.content;
    let isDirty = false;

    // Auto-show Save when rich text is edited
    renderedDiv.addEventListener('input', () => {
        isDirty = true;
        saveBtn.classList.remove('hidden');
    });

    rawToggleBtn.addEventListener('click', () => {
        const isRichVisible = !renderedDiv.classList.contains('hidden');
        if (isRichVisible) {
            // Switch to raw — sync current rich text to textarea
            rawTextarea.value = renderedDiv.innerText;
            renderedDiv.classList.add('hidden');
            rawTextarea.classList.remove('hidden');
            saveBtn.classList.remove('hidden');
            rawToggleBtn.textContent = '👁 Preview';
            rawTextarea.focus();
        } else {
            // Switch back to rich
            const rawVal = rawTextarea.value;
            renderedDiv.innerHTML = simpleMarkdownToHtml(rawVal);
            renderedDiv.classList.remove('hidden');
            rawTextarea.classList.add('hidden');
            if (!isDirty) saveBtn.classList.add('hidden');
            rawToggleBtn.textContent = '📝 Raw';
        }
    });

    // Improve button
    el.querySelector('.ct-btn-improve').addEventListener('click', () => {
        const currentText = rawTextarea.classList.contains('hidden') ? renderedDiv.innerText : rawTextarea.value;
        openImproveDialog(t.id, currentText, meta);
    });

    // Save button — reads from whichever mode is active
    el.querySelector('.ct-btn-save').addEventListener('click', async () => {
        const isRaw = !rawTextarea.classList.contains('hidden');
        const newContent = (isRaw ? rawTextarea.value : renderedDiv.innerText).trim();
        if (!newContent) return;
        t.content = newContent;
        savedContent = newContent;
        isDirty = false;
        await saveCodingTaskDescription(t.id, newContent, el);
        // Re-render rich preview with clean markdown
        renderedDiv.innerHTML = simpleMarkdownToHtml(newContent);
        // Hide save after successful save if in rich mode
        if (!isRaw) saveBtn.classList.add('hidden');
        // Auto-evaluate after save
        evaluateCodingTask(t.id, newContent, el, meta);
    });

    // Edit button → open full Task Detail Modal
    el.querySelector('.ct-btn-edit').addEventListener('click', () => {
        editSource = 'coding_tasks';
        openTaskModal(t.id, t.content, meta);
    });

    // Reevaluate button
    el.querySelector('.ct-btn-evaluate').addEventListener('click', () => {
        evaluateCodingTask(t.id, t.content, el, meta);
    });

    // Verification checklist logic
    const vList = el.querySelector('.ct-verification-list');
    const vProgress = el.querySelector('.ct-verification-progress');
    const markDoneBtn = el.querySelector('.ct-btn-mark-done');
    const sendbackSection = el.querySelector('.ct-sendback-section');
    const sendbackInput = el.querySelector('.ct-sendback-input');
    const sendbackBtn = el.querySelector('.ct-btn-sendback');

    function updateVerificationUI() {
        const items = ct.verification_items || [];
        if (items.length === 0) return;

        vList.innerHTML = '';
        let checkedCount = 0;

        items.forEach((item, idx) => {
            const li = document.createElement('li');
            li.className = 'ct-verification-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'ct-verification-cb';
            
            // Handle both plain strings and object structure
            const isObj = (typeof item === 'object' && item !== null);
            const labelText = isObj ? (item.label || '') : item;
            const isChecked = isObj ? !!item.checked : false;
            const itemNotes = isObj ? (item.notes || '') : '';

            checkbox.checked = isChecked;
            if (isChecked) checkedCount++;

            const label = document.createElement('span');
            label.className = 'ct-verification-label' + (isChecked ? ' verified' : '');
            label.textContent = labelText;

            const notesInput = document.createElement('input');
            notesInput.type = 'text';
            notesInput.className = 'ct-verification-item-notes';
            notesInput.placeholder = 'Add notes/assessment...';
            notesInput.value = itemNotes;

            checkbox.addEventListener('change', async () => {
                const currentChecked = checkbox.checked;
                if (typeof items[idx] === 'string') {
                    items[idx] = { label: items[idx], checked: currentChecked, notes: '' };
                } else {
                    items[idx].checked = currentChecked;
                }
                label.className = 'ct-verification-label' + (currentChecked ? ' verified' : '');
                updateVerificationUI();
                await updateCodingTaskMeta(t.id, meta);
            });

            notesInput.addEventListener('blur', async () => {
                const notesVal = notesInput.value.trim();
                const currentNotes = typeof items[idx] === 'string' ? '' : (items[idx].notes || '');
                if (currentNotes !== notesVal) {
                    if (typeof items[idx] === 'string') {
                        items[idx] = { label: items[idx], checked: false, notes: notesVal };
                    } else {
                        items[idx].notes = notesVal;
                    }
                    await updateCodingTaskMeta(t.id, meta);
                }
            });

            const topRow = document.createElement('div');
            topRow.className = 'ct-verification-item-row';
            topRow.appendChild(checkbox);
            topRow.appendChild(label);

            li.appendChild(topRow);
            li.appendChild(notesInput);
            vList.appendChild(li);
        });

        vProgress.textContent = `${checkedCount}/${items.length} verified`;

        if (checkedCount === items.length && items.length > 0 && status === 'needs_verification') {
            markDoneBtn.style.display = 'inline-block';
        } else {
            markDoneBtn.style.display = 'none';
        }
    }

    if (ct.verification_items && ct.verification_items.length > 0) {
        updateVerificationUI();
    }

    // Mark Done handler
    markDoneBtn.addEventListener('click', async () => {
        ct.status = 'needs_logging';
        const badge = el.querySelector('.ct-badge[class*="status-"]');
        badge.className = 'ct-badge status-needs_logging';
        badge.textContent = STATUS_LABELS['needs_logging'];
        el.querySelector('.ct-status-select').value = 'needs_logging';
        sendbackSection.style.display = 'none';
        markDoneBtn.style.display = 'none';
        el.classList.add('ct-done');
        updatePromptBtnVisibility('needs_logging');
        await updateCodingTaskMeta(t.id, meta);
    });

    const promptBtn = el.querySelector('.ct-action-prompt-btn');
    if (promptBtn) {
        promptBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentStatus = ct.status || 'draft';
            const promptText = getPromptTextForStatus(currentStatus, summary, t.id);
            if (promptText) {
                navigator.clipboard.writeText(promptText).then(() => {
                    const originalHTML = promptBtn.innerHTML;
                    promptBtn.innerHTML = '✅ Copied!';
                    promptBtn.classList.add('copied');
                    setTimeout(() => {
                        promptBtn.innerHTML = originalHTML;
                        promptBtn.classList.remove('copied');
                    }, 1500);
                });
            }
        });
    }

    function updatePromptBtnVisibility(currentStatus) {
        if (!promptBtn) return;
        if (STATUS_GROUPS.antigravGo.includes(currentStatus)) {
            promptBtn.classList.remove('hidden');
        } else {
            promptBtn.classList.add('hidden');
        }
    }

    // Send Back handler
    sendbackBtn.addEventListener('click', async () => {
        let reworkNotes = sendbackInput.value.trim();
        if (!reworkNotes) {
            // Aggregate notes from the checklist items
            const notesList = [];
            if (ct.verification_items) {
                ct.verification_items.forEach(item => {
                    const label = (typeof item === 'object' && item !== null) ? item.label : item;
                    const notes = (typeof item === 'object' && item !== null) ? (item.notes || '') : '';
                    if (notes.trim()) {
                        notesList.push(`- ${label}: ${notes.trim()}`);
                    }
                });
            }
            if (notesList.length > 0) {
                reworkNotes = "Feedback on checklist items:\n" + notesList.join('\n');
            }
        }

        if (!reworkNotes) {
            alert('Please describe what needs rework before sending back (either in the box below or by adding notes to checklist items).');
            return;
        }

        ct.status = 'rework_in_antigravity';
        ct.rework_notes = reworkNotes;
        
        const badge = el.querySelector('.ct-badge[class*="status-"]');
        badge.className = 'ct-badge status-rework_in_antigravity';
        badge.textContent = STATUS_LABELS['rework_in_antigravity'];
        el.querySelector('.ct-status-select').value = 'rework_in_antigravity';
        el.classList.remove('ct-done');
        
        sendbackSection.style.display = 'none';
        updateVerificationUI();
        
        await updateCodingTaskMeta(t.id, meta);
        alert('Task sent back to Antigravity.');
    });

    // Delete button
    el.querySelector('.ct-btn-delete').addEventListener('click', async () => {
        if (!confirm('Delete this coding task?')) return;
        await deleteCodingTask(t.id, el);
    });

    return el;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function evaluateCodingTask(id, content, cardEl, meta) {
    const evalBtn = cardEl.querySelector('.ct-btn-evaluate');
    const origText = evalBtn.textContent;
    evalBtn.textContent = '⏳ Evaluating...';
    evalBtn.disabled = true;

    try {
        const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'evaluate_coding_task', content })
        });
        const data = await res.json();

        if (data.suggested_status) {
            const ct = meta.coding_task || {};
            const newStatus = data.suggested_status;
            ct.status = newStatus;
            ct.readiness_score = data.readiness_score || 5;
            ct.readiness_notes = data.readiness_notes || '';
            meta.coding_task = ct;

            // Update the card UI
            const statusSelect = cardEl.querySelector('.ct-status-select');
            if (statusSelect) statusSelect.value = newStatus;
            const statusBadge = cardEl.querySelector('.ct-badge[class*="status-"]');
            if (statusBadge) {
                statusBadge.className = `ct-badge status-${newStatus}`;
                statusBadge.textContent = STATUS_LABELS[newStatus] || newStatus;
            }

            // Toggle done styling
            if (['done', 'ready_for_antigravity', 'needs_plan', 'needs_logging'].includes(newStatus)) {
                cardEl.classList.add('ct-done');
            } else {
                cardEl.classList.remove('ct-done');
            }
            const promptBtn = cardEl.querySelector('.ct-action-prompt-btn');
            if (promptBtn) {
                if (['needs_plan', 'ready_for_antigravity', 'rework_in_antigravity', 'in_progress', 'needs_verification', 'needs_logging'].includes(newStatus)) {
                    promptBtn.classList.remove('hidden');
                } else {
                    promptBtn.classList.add('hidden');
                }
            }

            // Persist to DB
            await updateCodingTaskMeta(id, meta);

            evalBtn.textContent = `✅ ${STATUS_LABELS[newStatus] || newStatus} (${data.readiness_score}/10)`;
            evalBtn.style.color = '#22c55e';
            setTimeout(() => {
                evalBtn.textContent = '🔄 Reevaluate';
                evalBtn.style.color = '';
                evalBtn.disabled = false;
            }, 3000);
        } else {
            evalBtn.textContent = origText;
            evalBtn.disabled = false;
        }
    } catch (e) {
        console.error('Evaluate error:', e);
        evalBtn.textContent = '✗ Failed';
        setTimeout(() => {
            evalBtn.textContent = origText;
            evalBtn.disabled = false;
        }, 2000);
    }
}

async function updateCodingTaskMeta(id, metadata) {
    try {
        await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'update', id, metadata })
        });
    } catch (e) {
        console.error('Update coding task meta error:', e);
    }
}

async function saveCodingTaskDescription(id, content, cardEl) {
    const saveBtn = cardEl.querySelector('.ct-btn-save');
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    try {
        await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'update', id, content })
        });
        saveBtn.textContent = '✓ Saved';
        saveBtn.style.color = '#22c55e';
        setTimeout(() => { saveBtn.textContent = '💾 Save'; saveBtn.style.color = ''; saveBtn.disabled = false; }, 1500);
    } catch (e) {
        saveBtn.textContent = '✗ Failed';
        setTimeout(() => { saveBtn.textContent = '💾 Save'; saveBtn.disabled = false; }, 2000);
    }
}

async function deleteCodingTask(id, cardEl) {
    cardEl.style.opacity = '0.3';
    cardEl.style.transform = 'scale(0.95)';
    try {
        await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'delete', id })
        });
        setTimeout(() => cardEl.remove(), 300);
    } catch (e) {
        cardEl.style.opacity = '1';
        cardEl.style.transform = '';
        alert('Delete failed.');
    }
}

// --- INTERACTIVE SUGGESTIONS ---

function renderInteractiveSuggestions(suggestions) {
    ctDom.improveSuggestionsList.innerHTML = '';
    
    if (!suggestions || suggestions.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No additional clarifications needed.';
        li.style.color = '#22c55e';
        ctDom.improveSuggestionsList.appendChild(li);
        return;
    }

    suggestions.forEach((s, idx) => {
        // Handle legacy plain string suggestions
        if (typeof s === 'string') {
            s = { question: s, type: 'text_input' };
        }

        const li = document.createElement('li');
        li.className = 'suggestion-widget';
        li.dataset.idx = idx;
        li.dataset.type = s.type || 'text_input';

        const questionEl = document.createElement('div');
        questionEl.className = 'suggestion-question';
        questionEl.textContent = s.question;
        li.appendChild(questionEl);

        if (s.type === 'multiple_choice' && s.options) {
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'suggestion-options';

            // Render each option as a checkbox
            s.options.forEach((opt, optIdx) => {
                const label = document.createElement('label');
                label.className = 'suggestion-option';
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.className = 'suggestion-cb';
                cb.dataset.option = opt;
                label.appendChild(cb);
                label.appendChild(document.createTextNode(' ' + opt));
                optionsDiv.appendChild(label);
            });

            // "Other" option with text field
            const otherLabel = document.createElement('label');
            otherLabel.className = 'suggestion-option suggestion-other';
            const otherCb = document.createElement('input');
            otherCb.type = 'checkbox';
            otherCb.className = 'suggestion-cb suggestion-cb-other';
            otherLabel.appendChild(otherCb);
            otherLabel.appendChild(document.createTextNode(' Other: '));
            const otherInput = document.createElement('input');
            otherInput.type = 'text';
            otherInput.className = 'suggestion-other-input';
            otherInput.placeholder = 'specify...';
            otherInput.addEventListener('input', () => { otherCb.checked = otherInput.value.length > 0; });
            otherLabel.appendChild(otherInput);
            optionsDiv.appendChild(otherLabel);

            // "Not needed" option
            const notNeededLabel = document.createElement('label');
            notNeededLabel.className = 'suggestion-option suggestion-not-needed';
            const notNeededCb = document.createElement('input');
            notNeededCb.type = 'checkbox';
            notNeededCb.className = 'suggestion-cb suggestion-cb-not-needed';
            notNeededLabel.appendChild(notNeededCb);
            notNeededLabel.appendChild(document.createTextNode(' Not needed'));
            optionsDiv.appendChild(notNeededLabel);

            li.appendChild(optionsDiv);
        } else {
            // text_input type
            const inputDiv = document.createElement('div');
            inputDiv.className = 'suggestion-options';

            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.className = 'suggestion-text-answer';
            textInput.placeholder = 'Your answer...';
            inputDiv.appendChild(textInput);

            // "You decide" checkbox
            const youDecideLabel = document.createElement('label');
            youDecideLabel.className = 'suggestion-option';
            const youDecideCb = document.createElement('input');
            youDecideCb.type = 'checkbox';
            youDecideCb.className = 'suggestion-cb suggestion-cb-you-decide';
            youDecideCb.addEventListener('change', () => {
                if (youDecideCb.checked) textInput.value = '';
            });
            youDecideLabel.appendChild(youDecideCb);
            youDecideLabel.appendChild(document.createTextNode(' You decide'));
            inputDiv.appendChild(youDecideLabel);

            li.appendChild(inputDiv);
        }

        ctDom.improveSuggestionsList.appendChild(li);
    });
}

function collectClarificationAnswers() {
    const widgets = ctDom.improveSuggestionsList.querySelectorAll('.suggestion-widget');
    const answers = [];

    widgets.forEach(w => {
        const question = w.querySelector('.suggestion-question')?.textContent;
        if (!question) return;

        if (w.dataset.type === 'multiple_choice') {
            // Check for "Not needed"
            const notNeeded = w.querySelector('.suggestion-cb-not-needed');
            if (notNeeded?.checked) {
                answers.push(`**Q:** ${question}\n**A:** Not needed`);
                return;
            }

            // Collect checked options
            const selected = [];
            w.querySelectorAll('.suggestion-cb:not(.suggestion-cb-other):not(.suggestion-cb-not-needed)').forEach(cb => {
                if (cb.checked) selected.push(cb.dataset.option);
            });

            // Check "Other"
            const otherCb = w.querySelector('.suggestion-cb-other');
            const otherInput = w.querySelector('.suggestion-other-input');
            if (otherCb?.checked && otherInput?.value.trim()) {
                selected.push(otherInput.value.trim());
            }

            if (selected.length > 0) {
                answers.push(`**Q:** ${question}\n**A:** ${selected.join(', ')}`);
            }
        } else {
            // text_input
            const youDecide = w.querySelector('.suggestion-cb-you-decide');
            if (youDecide?.checked) {
                answers.push(`**Q:** ${question}\n**A:** You decide (agent's discretion)`);
                return;
            }

            const textInput = w.querySelector('.suggestion-text-answer');
            if (textInput?.value.trim()) {
                answers.push(`**Q:** ${question}\n**A:** ${textInput.value.trim()}`);
            }
        }
    });

    return answers.length > 0 ? answers.join('\n\n') : '';
}

// --- IMPROVE DIALOG ---

async function openImproveDialog(taskId, content, meta) {
    ctImproveTaskId = taskId;
    ctDom.improveOriginal.innerHTML = simpleMarkdownToHtml(content);
    ctDom.improveResult.innerHTML = '';
    ctDom.improveSuggestionsList.innerHTML = '';
    ctDom.readinessBarFill.style.width = '0%';
    ctDom.readinessLabel.textContent = '📊 Readiness: —/10';
    ctDom.readinessNotes.textContent = '';
    ctDom.improveDialog.classList.remove('hidden');

    // Call LLM
    ctDom.improveResult.innerHTML = '<div class="ct-loading"><div class="ct-spinner"></div>Improving with Gemini...</div>';
    ctDom.improveResult.contentEditable = 'false';

    try {
        const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'improve_coding_task', content })
        });
        const data = await res.json();

        setImproveRenderedText(data.improved_text || content);
        ctDom.improveResult.contentEditable = 'true';

        // Suggestions
        ctDom.improveSuggestionsList.innerHTML = '';
        renderInteractiveSuggestions(data.suggestions || []);

        // Readiness
        const score = data.readiness_score || 5;
        updateReadinessUI(score, data.readiness_notes || '');

    } catch (e) {
        setImproveRenderedText(content);
        ctDom.improveResult.contentEditable = 'true';
        console.error('Improve error:', e);
    }
}

function updateReadinessUI(score, notes) {
    const pct = (score / 10) * 100;
    ctDom.readinessBarFill.style.width = pct + '%';
    // Color: red < 4, yellow 4-6, green > 6
    if (score <= 3) ctDom.readinessBarFill.style.background = '#ef4444';
    else if (score <= 6) ctDom.readinessBarFill.style.background = '#fbbf24';
    else ctDom.readinessBarFill.style.background = '#22c55e';
    ctDom.readinessLabel.textContent = `📊 Readiness: ${score}/10`;
    ctDom.readinessNotes.textContent = notes;
}

// Improve Again
ctDom.improveAgainBtn.addEventListener('click', async () => {
    // Collect answers from clarifications and combine with improved text
    const currentImproved = ctDom.improveResult.innerText;
    const answers = collectClarificationAnswers();
    let combinedContent = currentImproved;
    if (answers) {
        combinedContent += '\n\n## User Clarifications\n' + answers;
    }
    ctDom.improveOriginal.innerHTML = simpleMarkdownToHtml(combinedContent);
    ctDom.improveResult.innerHTML = '<div class="ct-loading"><div class="ct-spinner"></div>Improving again...</div>';
    ctDom.improveResult.contentEditable = 'false';

    try {
        const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'improve_coding_task', content: combinedContent })
        });
        const data = await res.json();
        setImproveRenderedText(data.improved_text || combinedContent);
        ctDom.improveResult.contentEditable = 'true';

        ctDom.improveSuggestionsList.innerHTML = '';
        renderInteractiveSuggestions(data.suggestions || []);

        updateReadinessUI(data.readiness_score || 5, data.readiness_notes || '');
    } catch (e) {
        setImproveRenderedText(combinedContent);
        ctDom.improveResult.contentEditable = 'true';
    }
});

// Submit & Close
ctDom.improveSubmitBtn.addEventListener('click', async () => {
    if (!ctImproveTaskId) return;
    let improvedText = ctDom.improveResult.innerText.trim();
    if (!improvedText) return;

    // Append any answered clarifications to the saved content
    const answers = collectClarificationAnswers();
    if (answers) {
        improvedText += '\n\n## User Clarifications\n' + answers;
    }

    ctDom.improveSubmitBtn.textContent = 'Saving...';
    ctDom.improveSubmitBtn.disabled = true;

    try {
        // Update the content and set status to ready_for_antigravity
        await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({
                action: 'update',
                id: ctImproveTaskId,
                content: improvedText,
                metadata: {
                    coding_task: {
                        status: 'ready_for_antigravity',
                        last_improved_at: new Date().toISOString(),
                        readiness_score: parseInt(ctDom.readinessLabel.textContent.match(/\d+/)?.[0] || '5'),
                        readiness_notes: ctDom.readinessNotes.textContent
                    }
                }
            })
        });

        ctDom.improveDialog.classList.add('hidden');
        ctImproveTaskId = null;
        loadCodingTasks(); // Refresh the list
    } catch (e) {
        alert('Failed to save improvement.');
    } finally {
        ctDom.improveSubmitBtn.textContent = '✅ Submit & Close';
        ctDom.improveSubmitBtn.disabled = false;
    }
});

// Close improve dialog - only via X button, NOT backdrop click (prevents accidental loss of work)
ctDom.closeImprove.addEventListener('click', () => {
    ctDom.improveDialog.classList.add('hidden');
    ctImproveTaskId = null;
});

// --- ADD CODING TASK MODAL ---

ctDom.addBtn.addEventListener('click', () => {
    // Pre-fill project from current filter if one is selected
    const currentProject = ctDom.filterProject.value;
    if (currentProject) ctDom.addProject.value = currentProject;
    ctDom.addContent.value = '';
    ctDom.addModal.classList.remove('hidden');
    ctDom.addContent.focus();
});

function closeAddCtModal() {
    ctDom.addModal.classList.add('hidden');
}

ctDom.closeAddModal.addEventListener('click', closeAddCtModal);
ctDom.addCancel.addEventListener('click', closeAddCtModal);
ctDom.addModal.addEventListener('click', (e) => { if (e.target === ctDom.addModal) closeAddCtModal(); });

ctDom.addSubmit.addEventListener('click', async () => {
    const content = ctDom.addContent.value.trim();
    if (!content) { alert('Please enter a task description.'); return; }

    ctDom.addSubmit.textContent = 'Creating...';
    ctDom.addSubmit.disabled = true;

    try {
        await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({
                action: 'add_coding_task',
                content,
                project: ctDom.addProject.value,
                priority: ctDom.addPriority.value,
                complexity: ctDom.addComplexity.value,
                status: ctDom.addStatus.value
            })
        });

        closeAddCtModal();
        loadCodingTasks();
    } catch (e) {
        alert('Failed to create task.');
    } finally {
        ctDom.addSubmit.textContent = 'Create Task';
        ctDom.addSubmit.disabled = false;
    }
});

// --- AUTO-START ---

window.addEventListener('load', () => { 
    setTimeout(() => { 
        try { 
            if (localStorage.getItem('maximus_session_token')) {
                recognition?.start(); 
            }
        } catch(e){} 
    }, 1000); 
});

// --- PWA ---
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; document.getElementById('install-banner').classList.remove('hidden'); });
document.getElementById('install-btn').addEventListener('click', () => {
    if (deferredPrompt) { 
        deferredPrompt.prompt(); 
        deferredPrompt.userChoice.then(r => { 
            if (r.outcome === 'accepted') {
                document.getElementById('install-banner').classList.add('hidden');
            }
            deferredPrompt = null; 
        }); 
    }
});
document.getElementById('install-close-btn')?.addEventListener('click', () => {
    document.getElementById('install-banner').classList.add('hidden');
});

// --- DYNAMIC VERSION ---
const appScript = document.querySelector('script[src^="app.js"]');
if (appScript) {
    const urlParams = new URLSearchParams(appScript.src.split('?')[1] || '');
    const v = urlParams.get('v');
    if (v) {
        const versionEl = document.querySelector('.app-version');
        if (versionEl) {
            versionEl.textContent = `v${v}`;
        }
    }
}
