const CONFIG = {
    ENDPOINT: 'https://xbrhqaztkqtlruocvwal.supabase.co/functions/v1/voice-gateway',
    KEY: 'eddaa00be5289a5cd4130b01055cdef8123fa72994a9ad9784256806c2339ace'
};

const dom = {
    orb: document.getElementById('voice-trigger'),
    status: document.getElementById('status-text'),
    chat: document.getElementById('chat-output'),
    input: document.getElementById('text-input'),
    send: document.getElementById('send-btn'),
    orbContainer: document.querySelector('.orb-container')
};

// --- VOICE LOGIC ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;
let silenceTimer = null;
const SILENCE_THRESHOLD = 2500; // 2.5 seconds of silence before auto-submitting

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true; // Stay alive even when user pauses
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
        const text = dom.status.innerText;
        if (text && text !== 'Listening...' && text !== 'Tap to speak to Maximus') {
            askMaximus(text);
        } else {
            dom.status.innerText = 'Tap to speak to Maximus';
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        dom.status.innerText = 'Error: ' + event.error;
        isListening = false;
        dom.orb.classList.remove('listening');
    };
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

        displayResponse(answer);
        speakResponse(answer);
        
    } catch (error) {
        console.error(error);
        displayResponse("There was an error connecting to Maximus.");
    }
}

function displayResponse(text) {
    dom.status.innerText = 'Tap to speak to Maximus';
    dom.chat.innerText = text;
    dom.chat.style.display = 'block';
    
    // Move orb up slightly when response is shown
    dom.orbContainer.style.transform = 'translateY(-20px)';
}

function speakResponse(text) {
    if (!('speechSynthesis' in window)) return;

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Get all available voices
    let voices = window.speechSynthesis.getVoices();

    // The "Saint Max" Voice Hunting Strategy
    // We look for "Natural", "Neural", or "Google" voices which are high quality.
    const findBestVoice = () => {
        voices = window.speechSynthesis.getVoices();
        
        // Priority 1: Google Natural/Neural (Android/Chrome)
        // Priority 2: Microsoft Natural (Windows 11)
        // Priority 3: Any "Google" voice
        // Priority 4: Default en-US
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

    // Warm up the tone slightly
    utterance.rate = 0.95; // Slightly slower for a more thoughtful, saintly pace
    utterance.pitch = 1.0; 
    
    window.speechSynthesis.speak(utterance);
}

// Ensure voices are loaded (some browsers load them asynchronously)
window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};

// --- EVENT LISTENERS ---
dom.orb.addEventListener('click', () => {
    if (!SpeechRecognition) {
        alert("Your browser does not support voice recognition. Please try Chrome on Android.");
        return;
    }
    
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
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

// Attempt Auto-Start on Load
window.addEventListener('load', () => {
    // Small delay to ensure everything is ready
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
