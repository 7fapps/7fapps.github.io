import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = { databaseURL: "https://attendance-portal-e81f3-default-rtdb.europe-west1.firebasedatabase.app" };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let state = {
    screen: 'login',
    user: null, 
    sessions: {},
    editingSession: null,
    repMarkCount: 0 
};

const $ = id => document.getElementById(id);

// --- GEOLOCATION ---
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const dLat = (lat2-lat1) * Math.PI/180;
    const dLon = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

// --- SCREENS ---
function renderLogin() {
    return `
    <div class="centered-card card" style="border-top: 4px solid var(--accent-blue);">
        <div class="logo-area" style="text-align:center; margin-bottom: 2.5rem;">
            <img src="logo.png" alt="Attendita" style="width:120px; display:block; margin: 0 auto 1.5rem auto;">
            <h1 style="line-height: 0.9;">ATTENDITA</h1>
            <h2 style="color: var(--text-dim); font-size: 11px; letter-spacing: 2px; margin-top: 30px;">ATTENDANCE PORTAL</h2>
            <p style="color: var(--accent-blue); font-size: 9px; letter-spacing: 2px; margin-top: 10px; font-weight: 700; opacity: 0.9;">7FAPPS IDENTITY MANAGEMENT</p>
        </div>
        <div class="col" style="gap:1.2rem; width:100%;">
            <input id="email" type="text" placeholder="Username" autocomplete="off" />
            <input id="password" type="password" placeholder="••••••••" />
            <button class="btn btn-primary btn-full" id="loginBtn">AUTHORIZE ACCESS</button>
        </div>
    </div>`;
}

function renderDashboard() {
    const sessions = Object.entries(state.sessions);
    const { role, name } = state.user;
    return `
    <div class="portal-layout">
        <div class="row" style="justify-content: space-between; width: 100%;">
            <img src="logo.png" style="width: 45px;">
            <div class="row" style="gap: 15px;">
                <div class="col" style="align-items: flex-end;">
                    <span style="font-size: 12px; font-weight: 800; color: var(--accent-amber);">${name.toUpperCase()}</span>
                    <span style="font-size: 10px; opacity: 0.6; letter-spacing: 1px;">${role}</span>
                </div>
                <button class="btn" id="logoutBtn" style="border:1px solid #EF4444; color:#EF4444; background:none; font-size:10px; padding: 8px 12px;">LOG OUT</button>
            </div>
        </div>
        <div class="card">
            <div class="row" style="justify-content: space-between; margin-bottom: 2rem;">
                <h1>${role === 'SUPER_ADMIN' ? 'NEXUS GRID' : 'ACTIVE SESSIONS'}</h1>
                ${['SUPER_ADMIN', 'LECTURER', 'COURSE_REP'].includes(role) ? `<button class="btn btn-primary" id="goCreateBtn">+ NEW SESSION</button>` : ''}
            </div>
            <div class="scroll-area">
                ${sessions.length > 0 ? sessions.map(([id, s]) => `
                    <div class="session-item card" data-id="${id}" style="margin-bottom: 1rem; padding: 1.2rem; background: var(--bg-input); display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-left: 3px solid ${s.active ? 'var(--accent-blue)' : 'transparent'};">
                        <div class="col">
                            <span style="font-weight: 700; font-size: 16px;">${s.title}</span>
                            <span style="font-size: 10px; color: var(--accent-blue); font-weight: 700;">ACCESS CODE: ${s.code}</span>
                        </div>
                        <div class="row" style="gap: 15px;">
                            ${role === 'SUPER_ADMIN' ? `<button class="delete-btn btn" data-id="${id}" style="background:#EF4444; color:#fff; font-size:9px; padding: 6px 12px;">WIPE</button>` : ''}
                            <div class="row" style="gap: 5px;">
                                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${s.active ? '#10B981' : '#EF4444'}; box-shadow: 0 0 8px ${s.active ? '#10B981' : '#EF4444'};"></div>
                                <span style="font-size: 9px; font-weight: 700; opacity: 0.7;">${s.active ? 'LIVE' : 'CLOSED'}</span>
                            </div>
                        </div>
                    </div>
                `).join('') : '<p style="text-align:center; opacity:0.5;">No active sessions found.</p>'}
            </div>
        </div>
    </div>`;
}

function renderCreateSession() {
    return `
    <div class="portal-layout">
        <div class="row" style="justify-content: space-between;">
             <h2>NEW SESSION</h2>
             <button class="btn" id="backBtn">BACK</button>
        </div>
        <div class="card col" style="gap:1.5rem;">
            <input id="sess-title" type="text" placeholder="COURSE TITLE (E.G. CSC 311)" />
            <textarea id="sess-students" rows="8" placeholder="STUDENT NAMES (ONE PER LINE)"></textarea>
            <button class="btn btn-primary btn-full" id="saveSessionBtn">LAUNCH PORTAL</button>
        </div>
    </div>`;
}

function renderEditSession() {
    const s = state.sessions[state.editingSession];
    const students = Object.values(s.students || {});
    const role = state.user.role;
    return `
    <div class="portal-layout">
        <div class="row" style="justify-content: space-between;">
             <h2>${s.title}</h2>
             <button class="btn" id="backBtn">EXIT</button>
        </div>
        <div class="card row" style="justify-content: space-between; margin-bottom: 1rem;">
             <span style="font-weight:800;">CODE: <span style="color:var(--accent-blue);">${s.code}</span></span>
             ${role === 'LECTURER' || role === 'SUPER_ADMIN' ? `<button class="btn" id="downloadBtn" style="border:1px solid var(--accent-blue); color:var(--accent-blue); background:none; font-size:10px;">CSV</button>` : ''}
        </div>
        <div class="card">
            ${students.map(st => `
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border);">
                    <span style="font-size: 13px;">${st.name}</span>
                    <div class="row" style="gap:10px;">
                        <span style="font-size: 10px; font-weight: 700; color: ${st.present ? '#10B981' : '#F59E0B'};">${st.present ? 'VERIFIED' : 'ABSENT'}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>`;
}

// --- LOGIC ---
function bindEvents() {
    const tBtn = $('themeBtn');
    if(tBtn) tBtn.onclick = () => document.body.classList.toggle('light-mode');

    $('loginBtn')?.addEventListener('click', () => {
        const u = $('email').value.trim().toLowerCase();
        const p = $('password').value;
        
        $('app').style.display = 'none';
        $('loader').style.display = 'flex';

        setTimeout(() => {
            navigator.geolocation.getCurrentPosition(pos => {
                let foundUser = null;
                if (u === 'damian' && p === 'nexus123') {
                    foundUser = { role: 'SUPER_ADMIN', name: 'Damian', lat: pos.coords.latitude, lng: pos.coords.longitude };
                } else if (u.includes('lecturer')) {
                    foundUser = { role: 'LECTURER', name: 'Lecturer', lat: pos.coords.latitude, lng: pos.coords.longitude };
                } else if (u.includes('rep')) {
                    foundUser = { role: 'COURSE_REP', name: 'Rep', lat: pos.coords.latitude, lng: pos.coords.longitude };
                } else {
                    foundUser = { role: 'STUDENT', name: u || 'Student', lat: pos.coords.latitude, lng: pos.coords.longitude };
                }

                if(foundUser) {
                    state.user = foundUser;
                    fetchSessions(); // This will trigger the first real render once data arrives
                }
            }, err => {
                alert("GPS AUTHENTICATION FAILED.");
                $('loader').style.display = 'none';
                $('app').style.display = 'flex';
            });
        }, 3000);
    });

    $('logoutBtn')?.addEventListener('click', () => { 
        state.user = null;
        state.screen = 'login'; 
        render(); 
    });
    
    $('goCreateBtn')?.addEventListener('click', () => { state.screen = 'create_session'; render(); });
    $('backBtn')?.addEventListener('click', () => { state.screen = 'dashboard'; render(); });

    $('saveSessionBtn')?.addEventListener('click', () => {
        const title = $('sess-title').value;
        const lines = $('sess-students').value.split('\n').filter(n => n.trim() !== "");
        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
        const studs = {};
        lines.forEach(n => { studs[n.replace(/\s/g, '_').toLowerCase()] = { name: n, present: false }; });
        set(ref(db, `sessions/${code}`), { title, code, active: true, students: studs, lat: state.user.lat, lng: state.user.lng })
        .then(() => { state.screen = 'dashboard'; render(); });
    });

    document.querySelectorAll('.session-item').forEach(el => {
        el.addEventListener('click', () => {
            state.editingSession = el.dataset.id;
            state.screen = 'edit_session';
            render();
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if(confirm("WIPE DATA?")) remove(ref(db, `sessions/${e.target.dataset.id}`));
        });
    });
}

function fetchSessions() {
    onValue(ref(db, 'sessions'), (snap) => {
        state.sessions = snap.val() || {};
        state.screen = 'dashboard';
        $('loader').style.display = 'none';
        $('app').style.display = 'flex';
        render();
    }, { onlyOnce: false });
}

function render() {
    const root = $('app');
    // Security check: if no user and not on login screen, force login
    if (!state.user) {
        root.innerHTML = renderLogin();
    } else {
        if (state.screen === 'login') root.innerHTML = renderDashboard(); // auto-redirect if logged in
        else if (state.screen === 'dashboard') root.innerHTML = renderDashboard();
        else if (state.screen === 'create_session') root.innerHTML = renderCreateSession();
        else if (state.screen === 'edit_session') root.innerHTML = renderEditSession();
    }
    bindEvents();
}
// --- PWA INSTALLATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Nexus Service Worker Active', reg.scope))
            .catch(err => console.log('Service Worker Failed', err));
    });
}
render();