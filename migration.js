const CONFIG = {
    ENDPOINT: 'https://xbrhqaztkqtlruocvwal.supabase.co/functions/v1/voice-gateway',
    MANAGE_ENDPOINT: 'https://xbrhqaztkqtlruocvwal.supabase.co/functions/v1/manage-thoughts',
    SYNC_ENDPOINT: 'https://xbrhqaztkqtlruocvwal.supabase.co/functions/v1/sync-google',
    KEY: 'eddaa00be5289a5cd4130b01055cdef8123fa72994a9ad9784256806c2339ace'
};

const dom = {
    btnRefresh: document.getElementById('refresh-btn'),
    status: document.getElementById('status-message'),
    listGoogle: document.getElementById('list-google'),
    listBrain: document.getElementById('list-brain'),
    listMatched: document.getElementById('list-matched'),
    countGoogle: document.getElementById('count-google'),
    countBrain: document.getElementById('count-brain'),
    countMatched: document.getElementById('count-matched')
};

let rawGoogle = [];
let rawBrain = [];

dom.btnRefresh.addEventListener('click', loadData);

async function loadData() {
    dom.status.innerText = 'Loading data from Google and Supabase...';
    dom.btnRefresh.disabled = true;
    
    try {
        const res = await fetch(CONFIG.SYNC_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'get_migration_data' })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to fetch');
        
        rawGoogle = data.googleTasks || [];
        rawBrain = data.brainTasks || [];
        
        processData();
        dom.status.innerText = 'Data loaded successfully.';
    } catch (e) {
        console.error(e);
        dom.status.innerText = 'Error: ' + e.message;
    } finally {
        dom.btnRefresh.disabled = false;
    }
}

function processData() {
    const matched = [];
    const googleOnly = [];
    const brainOnly = [...rawBrain];

    // Find matches
    rawGoogle.forEach(gt => {
        // Find matching brain task
        const matchIdx = brainOnly.findIndex(bt => 
            (bt.metadata && bt.metadata.google_task_id === gt.id) ||
            (bt.content && gt.title && bt.content.toLowerCase().includes(gt.title.toLowerCase())) ||
            (bt.content && gt.title && gt.title.toLowerCase().includes(bt.content.toLowerCase()))
        );

        if (matchIdx !== -1) {
            const matchBrain = brainOnly.splice(matchIdx, 1)[0];
            matched.push({ google: gt, brain: matchBrain });
        } else {
            googleOnly.push(gt);
        }
    });

    renderGoogleOnly(googleOnly);
    renderBrainOnly(brainOnly);
    renderMatched(matched);
}

function renderGoogleOnly(tasks) {
    dom.countGoogle.innerText = tasks.length;
    dom.listGoogle.innerHTML = '';
    tasks.forEach(t => {
        const el = document.createElement('div');
        el.className = 'mig-task';
        const notes = t.notes ? `<div class="meta">Notes: ${t.notes}</div>` : '';
        const due = t.due ? `<div class="meta">Due: ${t.due.substring(0,10)}</div>` : '';
        el.innerHTML = `
            <h3>${t.title}</h3>
            ${notes}${due}
            <div class="mig-task-actions">
                <button class="btn-small" onclick="importToBrain('${t.id}')">Import to Brain</button>
                <button class="btn-small danger" onclick="deleteFromGoogle('${t.id}')">Delete from Google</button>
            </div>
        `;
        dom.listGoogle.appendChild(el);
    });
}

function renderBrainOnly(tasks) {
    dom.countBrain.innerText = tasks.length;
    dom.listBrain.innerHTML = '';
    tasks.forEach(t => {
        const el = document.createElement('div');
        el.className = 'mig-task';
        const metaStr = t.metadata ? `<div class="meta">Meta: ${JSON.stringify(t.metadata)}</div>` : '';
        el.innerHTML = `
            <h3>${t.content}</h3>
            ${metaStr}
            <div class="mig-task-actions">
                <button class="btn-small" onclick="pushToGoogle('${t.id}')">Push to Google</button>
                <button class="btn-small danger" onclick="deleteFromBrain('${t.id}')">Delete from Brain</button>
            </div>
        `;
        dom.listBrain.appendChild(el);
    });
}

function renderMatched(pairs) {
    dom.countMatched.innerText = pairs.length;
    dom.listMatched.innerHTML = '';
    pairs.forEach(p => {
        const el = document.createElement('div');
        el.className = 'mig-task';
        
        const isLinked = p.brain.metadata && p.brain.metadata.google_task_id === p.google.id;
        const linkBadge = isLinked ? '<span class="badge" style="background:green">Linked</span>' : '<span class="badge" style="background:orange">Title Match Only</span>';

        el.innerHTML = `
            <div style="margin-bottom:8px;">${linkBadge}</div>
            <div class="match-compare">
                <div class="match-side">
                    <strong>Google:</strong> ${p.google.title}
                </div>
                <div class="match-side">
                    <strong>Brain:</strong> ${p.brain.content}
                </div>
            </div>
            <div class="mig-task-actions">
                <button class="btn-small" onclick="linkTasks('${p.brain.id}', '${p.google.id}')">Brain Wins (Link & Push)</button>
            </div>
        `;
        dom.listMatched.appendChild(el);
    });
}

// --- ACTIONS ---

async function importToBrain(googleId) {
    dom.status.innerText = 'Importing to Brain...';
    const task = rawGoogle.find(t => t.id === googleId);
    if (!task) return;

    try {
        // 1. Capture via Voice Gateway (skipSync to avoid dupe in Google)
        const text = `Task: ${task.title}` + (task.notes ? ` Notes: ${task.notes}` : '') + (task.due ? ` Due: ${task.due}` : '');
        const res1 = await fetch(CONFIG.ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ text: text, source: 'migration_ui', skipSync: true })
        });
        const r1 = await res1.json();
        if (!r1.thoughtId) throw new Error('Failed to capture');

        // 2. Update with google_task_id
        await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'update', id: r1.thoughtId, metadata: { google_task_id: task.id } })
        });

        await loadData();
    } catch(e) {
        alert(e.message);
    }
}

async function deleteFromGoogle(googleId) {
    if (!confirm('Permanently delete from Google Tasks?')) return;
    dom.status.innerText = 'Deleting from Google...';
    try {
        await fetch(CONFIG.SYNC_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'delete_task', googleTaskId: googleId })
        });
        await loadData();
    } catch(e) { alert(e.message); }
}

async function pushToGoogle(brainId) {
    dom.status.innerText = 'Pushing to Google...';
    const task = rawBrain.find(t => t.id === brainId);
    if (!task) return;

    try {
        await fetch(CONFIG.SYNC_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'push_task', thoughtId: task.id, content: task.content, metadata: task.metadata || {} })
        });
        await loadData();
    } catch(e) { alert(e.message); }
}

async function deleteFromBrain(brainId) {
    if (!confirm('Permanently delete from Open Brain?')) return;
    dom.status.innerText = 'Deleting from Brain...';
    try {
        // By calling manage-thoughts delete, it will also try to delete from Google IF linked.
        // Since it's in Brain-only, it has no link, so it just deletes locally.
        await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'delete', id: brainId })
        });
        await loadData();
    } catch(e) { alert(e.message); }
}

async function linkTasks(brainId, googleId) {
    dom.status.innerText = 'Linking and syncing...';
    try {
        // Update brain with google ID
        const res = await fetch(CONFIG.MANAGE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-brain-key': CONFIG.KEY },
            body: JSON.stringify({ action: 'update', id: brainId, metadata: { google_task_id: googleId } })
        });
        // The manage-thoughts endpoint will automatically push_task to Google after update!
        await loadData();
    } catch(e) { alert(e.message); }
}
