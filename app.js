const CONFIG = {
    ENDPOINT: 'https://xbrhqaztkqtlruocvwal.supabase.co/functions/v1/voice-gateway',
    MANAGE_ENDPOINT: 'https://xbrhqaztkqtlruocvwal.supabase.co/functions/v1/manage-thoughts',
    KEY: 'eddaa00be5289a5cd4130b01055cdef8123fa72994a9ad9784256806c2339ace',
    EMAIL: 'Fra_roderic@outlook.com'
};

const dom = {
    orb: document.getElementById('voice-trigger'),
    status: document.getElementById('status-text'),
    chat: document.getElementById('chat-output'),
    input: document.getElementById('text-input'),
    send: document.getElementById('send-btn'),
    orbContainer: document.querySelector('.orb-container'),
    historyBtn: document.getElementById('history-btn'),
    emailBtn: document.getElementById('email-btn'),
    historyPanel: document.getElementById('history-panel'),
    closeHistory: document.getElementById('close-history'),
    historyList: document.getElementById('history-list'),
    undoBtn: document.getElementById('undo-btn'),
    countdownBar: document.getElementById('countdown-bar')
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
const SUBMIT_DELAY = 4000; // Increased to 4 seconds for better thought gathering

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
            dom.chat.style.display = 'none';
            dom.orbContainer.style.transform = 'translateY(0)';
        }
        isRestarting = false;
        if (!fullTranscript) {
            dom.status.innerText = 'Listening...';
            dom.undoBtn.classList.add('hidden');
        }
    };

    recognition.onresult = (event) => {
        sessionHadResults = true;
        clearTimeout(submitTimer);
        submitTimer = null;
        stopCountdown();
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
    if (isSpeaking) return;  // Don't start while Maximus is talking
    try { recognition.start(); } catch (e) { console.log("Start failed:", e.message); }
}

// --- API ---
async function askMaximus(text) {
    dom.status.innerText = 'Consulting Maximus...';
    try {
        const res = await fetch(CONFIG.ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ text })
        });
        const data = await res.json();
        const answer = data.text || "Couldn't reach your brain.";
        
        // Handle "Captured as" responses to show Undo button
        if (answer.toLowerCase().includes('captured as') && data.thoughtId) {
            lastThoughtId = data.thoughtId;
            dom.undoBtn.classList.remove('hidden');
        } else if (data.debug?.mode === 'capture') {
            // Check debug info if the answer text changed but it was a capture
            // We need the edge function to return the ID. 
            // I will update the edge function next.
            lastThoughtId = data.debug?.thoughtId; 
            if (lastThoughtId) dom.undoBtn.classList.remove('hidden');
        }

        displayResponse(answer, data.debug || {});
        speakResponse(answer);
    } catch (e) {
        console.error(e);
        displayResponse("Error connecting to Maximus.", {});
    }
}

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
function speakResponse(text) {
    if (!('speechSynthesis' in window)) { setTimeout(startListening, 2000); return; }
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
        setTimeout(startListening, 1500); // Longer delay to avoid echo
    };
    window.speechSynthesis.speak(u);
}
window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();

// --- EVENTS ---
dom.orb.addEventListener('click', () => {
    if (isListening || submitTimer) {
        clearTimeout(submitTimer); submitTimer = null;
        try { recognition.stop(); } catch(e) {}
        isListening = false;
        dom.orb.classList.remove('listening');
        const text = fullTranscript.trim();
        fullTranscript = '';
        if (text && text !== 'Listening...' && text !== 'Tap to speak to Maximus') askMaximus(text);
        else dom.status.innerText = 'Tap to speak to Maximus';
    } else { startListening(); }
});

dom.send.addEventListener('click', () => {
    const t = dom.input.value.trim();
    if (t) { dom.input.value = ''; askMaximus(t); }
});
dom.input.addEventListener('keypress', (e) => { if (e.key === 'Enter') dom.send.click(); });

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
            const type = t.metadata?.type || 'thought';
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `<div class="thought-content">${t.content}</div>
                <div class="thought-meta"><span>${ds}</span><span class="thought-type">${type}</span></div>
                <button class="delete-btn" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>`;
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
    dom.undoBtn.classList.add('hidden');
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

dom.undoBtn.addEventListener('click', undoLastThought);

// --- EMAIL ---
dom.emailBtn.addEventListener('click', async () => {
    dom.emailBtn.style.opacity = '0.3';
    try {
        const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'list', limit: 10 })
        });
        const data = await res.json();
        if (!data.thoughts?.length) { alert('No thoughts to email.'); dom.emailBtn.style.opacity = '1'; return; }
        let body = 'Last 10 Maximus Brain Entries:\n\n';
        data.thoughts.forEach((t, i) => {
            const d = new Date(t.created_at);
            const ds = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            body += `${i+1}. [${ds}] (${t.metadata?.type || 'thought'})\n   ${t.content}\n\n`;
        });
        window.location.href = `mailto:${CONFIG.EMAIL}?subject=${encodeURIComponent('Maximus Export - ' + new Date().toLocaleDateString())}&body=${encodeURIComponent(body)}`;
    } catch (e) { alert('Error fetching thoughts.'); }
    dom.emailBtn.style.opacity = '1';
});

// --- AUTO-START ---
window.addEventListener('load', () => { setTimeout(() => { try { recognition?.start(); } catch(e){} }, 1000); });

// --- PWA ---
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; document.getElementById('install-banner').classList.remove('hidden'); });
document.getElementById('install-btn').addEventListener('click', () => {
    if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(r => { if (r.outcome === 'accepted') document.getElementById('install-banner').classList.add('hidden'); deferredPrompt = null; }); }
});
