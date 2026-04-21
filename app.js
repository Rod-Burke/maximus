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

// --- VOICE LOGIC ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;
let silenceTimer = null;
const SILENCE_THRESHOLD = 2500; // 2.5 seconds of silence before auto-submitting

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        dom.orb.classList.add('listening');
        dom.status.innerText = 'Listening...';
        dom.chat.style.display = 'none';
        dom.orbContainer.style.transform = 'translateY(0)';
    };

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');

        dom.status.innerText = transcript;

        // Reset the silence timer every time the user speaks
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
            if (isListening) recognition.stop();
        }, SILENCE_THRESHOLD);
    };

    recognition.onend = () => {
        isListening = false;
        dom.orb.classList.remove('listening');
        clearTimeout(silenceTimer);
        const text = dom.status.innerText;
        if (text && text !== 'Listening...' && text !== 'Tap to speak to Maximus') {
            askMaximus(text);
        } else {
            dom.status.innerText = 'Tap to speak to Maximus';
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        // Don't show "aborted" errors (happens during normal stop/restart cycles)
        if (event.error !== 'aborted') {
            dom.status.innerText = 'Error: ' + event.error;
        }
        isListening = false;
        dom.orb.classList.remove('listening');
    };
}

function startListening() {
    if (!SpeechRecognition) {
        alert("Your browser does not support voice recognition. Please try Chrome on Android.");
        return;
    }
    if (isListening) return;
    try {
        recognition.start();
    } catch (err) {
        console.log("Could not start recognition:", err.message);
    }
}

// --- API LOGIC ---
async function askMaximus(text) {
    dom.status.innerText = 'Consulting Maximus...';

    try {
        const response = await fetch(CONFIG.ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-brain-key': CONFIG.KEY
            },
            body: JSON.stringify({ text: text })
        });

        const data = await response.json();
        const answer = data.text || "I'm sorry, I couldn't reach your brain.";
        const debug = data.debug || {};

        displayResponse(answer, debug);
        speakResponse(answer);

    } catch (error) {
        console.error(error);
        displayResponse("There was an error connecting to Maximus.", {});
    }
}

function displayResponse(text, debug) {
    dom.status.innerText = 'Tap to speak to Maximus';

    let html = `<div>${text}</div>`;
    if (debug && debug.received) {
        html += `<div class="debug-line">Sent: "${debug.received}" → Routed as: ${debug.mode || '?'}</div>`;
    }

    dom.chat.innerHTML = html;
    dom.chat.style.display = 'block';
    dom.orbContainer.style.transform = 'translateY(-15px)';
}

// --- TTS LOGIC ---
function speakResponse(text) {
    if (!('speechSynthesis' in window)) {
        // If no TTS, auto-restart listening after a short delay
        setTimeout(() => startListening(), 2000);
        return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    let voices = window.speechSynthesis.getVoices();

    const findBestVoice = () => {
        voices = window.speechSynthesis.getVoices();
        return voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural'))) ||
               voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
               voices.find(v => v.lang.startsWith('en')) ||
               voices[0];
    };

    const bestVoice = findBestVoice();
    if (bestVoice) {
        console.log('Selected Voice:', bestVoice.name);
        utterance.voice = bestVoice;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // AUTO-RESTART LISTENING after Maximus finishes speaking
    utterance.onend = () => {
        setTimeout(() => startListening(), 800);
    };

    window.speechSynthesis.speak(utterance);
}

window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};

// --- EVENT LISTENERS ---
dom.orb.addEventListener('click', () => {
    if (isListening) {
        recognition.stop();
    } else {
        startListening();
    }
});

dom.send.addEventListener('click', () => {
    const text = dom.input.value.trim();
    if (text) {
        dom.input.value = '';
        askMaximus(text);
    }
});

dom.input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        dom.send.click();
    }
});

// --- HISTORY PANEL ---
dom.historyBtn.addEventListener('click', () => {
    dom.historyPanel.classList.remove('hidden');
    loadHistory();
});

dom.closeHistory.addEventListener('click', () => {
    dom.historyPanel.classList.add('hidden');
});

async function loadHistory() {
    dom.historyList.innerHTML = '<div class="history-empty">Loading...</div>';

    try {
        const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-brain-key': CONFIG.KEY
            },
            body: JSON.stringify({ action: 'list', limit: 30 })
        });
        const data = await res.json();

        if (!data.thoughts || data.thoughts.length === 0) {
            dom.historyList.innerHTML = '<div class="history-empty">No thoughts captured yet.</div>';
            return;
        }

        dom.historyList.innerHTML = '';
        data.thoughts.forEach(thought => {
            const date = new Date(thought.created_at);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const meta = thought.payload?.metadata || {};
            const type = meta.type || 'thought';

            const el = document.createElement('div');
            el.className = 'history-item';
            el.dataset.id = thought.id;
            el.innerHTML = `
                <div class="thought-content">${thought.content}</div>
                <div class="thought-meta">
                    <span>${dateStr}</span>
                    <span class="thought-type">${type}</span>
                </div>
                <button class="delete-btn" title="Delete this thought">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            `;

            el.querySelector('.delete-btn').addEventListener('click', () => deleteThought(thought.id, el));
            dom.historyList.appendChild(el);
        });

    } catch (err) {
        dom.historyList.innerHTML = '<div class="history-empty">Error loading history.</div>';
        console.error(err);
    }
}

async function deleteThought(id, element) {
    if (!confirm('Delete this thought?')) return;

    element.classList.add('deleting');

    try {
        await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-brain-key': CONFIG.KEY
            },
            body: JSON.stringify({ action: 'delete', id: id })
        });
        element.remove();
    } catch (err) {
        element.classList.remove('deleting');
        alert('Failed to delete. Please try again.');
    }
}

// --- EMAIL EXPORT ---
dom.emailBtn.addEventListener('click', async () => {
    dom.emailBtn.style.opacity = '0.3';

    try {
        const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-brain-key': CONFIG.KEY
            },
            body: JSON.stringify({ action: 'list', limit: 10 })
        });
        const data = await res.json();

        if (!data.thoughts || data.thoughts.length === 0) {
            alert('No thoughts to email.');
            dom.emailBtn.style.opacity = '1';
            return;
        }

        let body = 'Last 10 Maximus Brain Entries:\n\n';
        data.thoughts.forEach((t, i) => {
            const date = new Date(t.created_at);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const meta = t.payload?.metadata || {};
            body += `${i + 1}. [${dateStr}] (${meta.type || 'thought'})\n`;
            body += `   ${t.content}\n\n`;
        });

        const subject = encodeURIComponent('Maximus Brain Export - ' + new Date().toLocaleDateString());
        const encodedBody = encodeURIComponent(body);
        window.location.href = `mailto:${CONFIG.EMAIL}?subject=${subject}&body=${encodedBody}`;

    } catch (err) {
        alert('Error fetching thoughts for email.');
        console.error(err);
    }
    dom.emailBtn.style.opacity = '1';
});

// --- AUTO-START ON LOAD ---
window.addEventListener('load', () => {
    setTimeout(() => {
        if (recognition && !isListening) {
            try {
                recognition.start();
            } catch (err) {
                console.log("Auto-start blocked by browser. Awaiting manual tap.");
            }
        }
    }, 1000);
});

// PWA Install Logic
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('install-banner').classList.remove('hidden');
});

document.getElementById('install-btn').addEventListener('click', () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                document.getElementById('install-banner').classList.add('hidden');
            }
            deferredPrompt = null;
        });
    }
});
