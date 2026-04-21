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
    historyList: document.getElementById('history-list')
};

// --- VOICE LOGIC (Android-safe: continuous=false with multi-utterance accumulation) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;
let fullTranscript = '';
let submitTimer = null;
let isRestarting = false;
const SUBMIT_DELAY = 2500;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;  // KEY FIX: single utterance mode for Android
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        dom.orb.classList.add('listening');
        if (!isRestarting) {
            clearTimeout(submitTimer);
            submitTimer = null;
            fullTranscript = '';
            dom.chat.style.display = 'none';
            dom.orbContainer.style.transform = 'translateY(0)';
        }
        isRestarting = false;
        if (!fullTranscript) dom.status.innerText = 'Listening...';
    };

    recognition.onresult = (event) => {
        // New speech detected - cancel any pending submission
        clearTimeout(submitTimer);
        submitTimer = null;
        const transcript = event.results[0][0].transcript;
        dom.status.innerText = (fullTranscript + transcript).trim();
    };

    recognition.onend = () => {
        isListening = false;
        const currentDisplay = dom.status.innerText;

        if (currentDisplay && currentDisplay !== 'Listening...' && currentDisplay !== 'Tap to speak to Maximus') {
            fullTranscript = currentDisplay + ' ';
            dom.orb.classList.add('listening'); // Keep orb glowing

            // Submit after silence
            submitTimer = setTimeout(() => {
                const text = fullTranscript.trim();
                fullTranscript = '';
                submitTimer = null;
                dom.orb.classList.remove('listening');
                if (text) askMaximus(text);
            }, SUBMIT_DELAY);

            // Auto-restart to catch more speech
            setTimeout(() => {
                if (submitTimer) {
                    isRestarting = true;
                    try { recognition.start(); } catch (e) {
                        clearTimeout(submitTimer);
                        submitTimer = null;
                        const text = fullTranscript.trim();
                        fullTranscript = '';
                        dom.orb.classList.remove('listening');
                        if (text) askMaximus(text);
                    }
                }
            }, 300);
        } else if (!fullTranscript.trim()) {
            fullTranscript = '';
            dom.status.innerText = 'Tap to speak to Maximus';
            dom.orb.classList.remove('listening');
        }
    };

    recognition.onerror = (event) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
            dom.status.innerText = 'Error: ' + event.error;
        }
        isListening = false;
        // If we were restarting and got no-speech, just submit what we have
        if (event.error === 'no-speech' && fullTranscript.trim()) {
            clearTimeout(submitTimer);
            submitTimer = null;
            const text = fullTranscript.trim();
            fullTranscript = '';
            dom.orb.classList.remove('listening');
            askMaximus(text);
        }
    };
}

function startListening() {
    if (!SpeechRecognition) {
        alert("Voice not supported. Please use Chrome.");
        return;
    }
    if (isListening) return;
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
function speakResponse(text) {
    if (!('speechSynthesis' in window)) { setTimeout(startListening, 2000); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const best = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural'))) ||
                 voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                 voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (best) u.voice = best;
    u.rate = 0.95;
    u.onend = () => setTimeout(startListening, 800);
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
            const type = t.payload?.metadata?.type || 'thought';
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
            body += `${i+1}. [${ds}] (${t.payload?.metadata?.type || 'thought'})\n   ${t.content}\n\n`;
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
