import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = { databaseURL: "https://attendance-portal-e81f3-default-rtdb.europe-west1.firebasedatabase.app" };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let state = {
    screen: 'login',
    user: null, 
    universities: {},
    // Tracking navigation path for Super Admin Dashboard
    selectedUni: null,
    selectedLevel: null,
    selectedSemester: null
};

const $ = id => document.getElementById(id);

// --- HARDCODED DEMO DATA BUILDER (If Firebase path is empty) ---
function seedDatabaseIfEmpty() {
    const sampleData = {
        "MOUAU": {
            name: "Michael Okpara University",
            levels: {
                "100": {
                    semesters: {
                        "First Semester": {
                            courses: {
                                "BIO_121": { title: "Introductory Biology I", lecturer: "Dr. Evans" },
                                "CSC_111": { title: "Introduction to Computer Science", lecturer: "Prof. Okoro" }
                            }
                        },
                        "Second Semester": { courses: { "CSC_122": { title: "Object Oriented Programming", lecturer: "Engr. Chibuzor" } } }
                    }
                },
                "200": { semesters: { "First Semester": { courses: { "CSC_211": { title: "Data Structures", lecturer: "Dr. Asagba" } } } } }
            }
        },
        "UNN": {
            name: "University of Nigeria Nsukka",
            levels: {
                "100": { semesters: { "First Semester": { courses: { "MTH_111": { title: "General Mathematics I", lecturer: "Prof. Obi" } } } } }
            }
        }
    };
    set(ref(db, 'academic_structure'), sampleData);
}

// --- RENDERING VIEWS ---
function renderLogin() {
    return `
    <div class="login-wrapper">
        <div class="login-card">
            <div style="text-align:center; margin-bottom: 2rem;">
                <img src="logo.png" style="width:100px; display:block; margin: 0 auto 1rem auto;">
                <h1>ATTENDITA</h1>
                <p style="color: var(--accent-blue); font-size: 9px; letter-spacing: 2px; font-weight: 700; margin: 5px 0 0 0;">7FAPPS IDENTITY MANAGEMENT</p>
            </div>
            <div class="col" style="gap:1rem;">
                <input id="email" type="text" placeholder="Username" autocomplete="off" />
                <input id="password" type="password" placeholder="••••••••" />
                <button class="btn btn-primary btn-full" id="loginBtn">AUTHORIZE ACCESS</button>
            </div>
        </div>
    </div>`;
}

function renderSuperAdminDashboard() {
    const unis = Object.entries(state.universities);
    
    // 1. GENERATE THE SIDEBAR NAVIGATION TREE
    let sidebarHtml = `
    <div class="sidebar">
        <div class="col" style="gap:5px;">
            <img src="logo.png" style="width: 40px; margin-bottom: 10px;">
            <h2>NEXUS GRID</h2>
            <span style="font-size:10px; color:var(--accent-amber); font-weight:700;">SYSTEM ROOT OVERRIDE</span>
        </div>
        <hr style="width:100%; border:none; border-top:1px solid var(--border); margin:0;">
        <div class="tree-section">
            <span class="tree-title">Universities</span>
            ${unis.map(([id, u]) => `
                <div class="tree-item ${state.selectedUni === id ? 'active' : ''}" data-uni="${id}">
                    🏛️ ${id}
                </div>
            `).join('')}
        </div>
        <button class="btn" id="logoutBtn" style="margin-top:auto; background:none; border:1px solid #EF4444; color:#EF4444; font-size:11px;">LOG OUT</button>
    </div>`;

    // 2. GENERATE THE DRILL DOWN WORKSPACE PANELS
    let workspaceHtml = `<div class="workspace">`;
    
    if (!state.selectedUni) {
        workspaceHtml += `
        <div class="card" style="text-align:center; padding: 4rem 2rem;">
            <h2>Welcome to Central Control</h2>
            <p style="color:var(--text-dim); max-width:400px; margin: 10px auto;">Select a university from the system navigation tree on the left to review operational metadata levels.</p>
        </div>`;
    } else {
        const uniData = state.universities[state.selectedUni];
        workspaceHtml += `
        <div class="card" style="margin-bottom:1.5rem;">
            <span style="font-size:11px; color:var(--accent-blue); font-weight:700; text-transform:uppercase;">Active Domain</span>
            <h1 style="margin-top:5px;">${uniData.name}</h1>
        </div>`;

        // LEVEL CONTROLLER VIEW
        if (!state.selectedLevel) {
            const levels = Object.keys(uniData.levels || {});
            workspaceHtml += `
            <h3>Select Level Workspace</h3>
            <div class="data-grid">
                ${levels.map(lvl => `
                    <div class="grid-box level-box" data-lvl="${lvl}">
                        <span style="font-size:24px; font-weight:800; color:var(--accent-blue);">${lvl}L</span>
                        <span style="font-size:11px; color:var(--text-dim);">Academic Structure Tracks</span>
                    </div>
                `).join('')}
            </div>`;
        } 
        // SEMESTER CONTROLLER VIEW
        else if (state.selectedLevel && !state.selectedSemester) {
            const semesters = Object.keys(uniData.levels[state.selectedLevel].semesters || {});
            workspaceHtml += `
            <div class="row" style="gap:10px; margin-bottom:1.5rem;">
                <button class="btn" id="clearLevelBtn" style="padding:6px 12px; font-size:11px; background:var(--bg-input); color:var(--text-main);">< BACK</button>
                <h3>Path: Level ${state.selectedLevel}</h3>
            </div>
            <div class="data-grid">
                ${semesters.map(sem => `
                    <div class="grid-box semester-box" data-sem="${sem}">
                        <span style="font-size:16px; font-weight:700;">${sem}</span>
                        <span style="font-size:11px; color:var(--accent-amber); font-weight:700;">Open Catalog</span>
                    </div>
                `).join('')}
            </div>`;
        }
        // COURSE & LECTURER CATELOGUE DATA GRID VIEW
        else {
            const courses = Object.entries(uniData.levels[state.selectedLevel].semesters[state.selectedSemester].courses || {});
            workspaceHtml += `
            <div class="row" style="gap:10px; margin-bottom:1.5rem;">
                <button class="btn" id="clearSemesterBtn" style="padding:6px 12px; font-size:11px; background:var(--bg-input); color:var(--text-main);">< BACK</button>
                <h3>Path: Level ${state.selectedLevel} > ${state.selectedSemester}</h3>
            </div>
            <div class="card">
                <h2 style="margin-bottom:1.5rem; font-size:20px; color:var(--accent-blue);">Course Allocations</h2>
                ${courses.length > 0 ? courses.map(([code, data]) => `
                    <div style="display:flex; justify-content:space-between; padding:16px 0; border-bottom:1px solid var(--border); align-items:center;">
                        <div class="col">
                            <span style="font-weight:700; font-size:15px; color:var(--text-main);">${code}: ${data.title}</span>
                        </div>
                        <div class="col" style="align-items:flex-end;">
                            <span style="font-size:12px; font-weight:700; color:var(--text-main);">👨‍🏫 ${data.lecturer}</span>
                            <span style="font-size:10px; color:var(--text-dim);">Course Instructor Allocation</span>
                        </div>
                    </div>
                `).join('') : '<p style="color:var(--text-dim); text-align:center;">No course profiles initialized for this semester track.</p>'}
            </div>`;
        }
    }

    workspaceHtml += `</div>`; // Close workspace layout div

    return `<div class="admin-container">${sidebarHtml}${workspaceHtml}</div>`;
}

// --- LOGIC AND RUNTIME ROUTERS ---
function bindEvents() {
    const tBtn = $('themeBtn');
    if(tBtn) tBtn.onclick = () => document.body.classList.toggle('dark-mode');

    const loginBtn = $('loginBtn');
    if (loginBtn) {
        loginBtn.onclick = () => {
            const u = $('email').value.trim().toLowerCase();
            const p = $('password').value;
            
            $('app').style.display = 'none';
            $('loader').style.display = 'flex';

            setTimeout(() => {
                if (u === 'damian' && p === 'nexus123') {
                    state.user = { role: 'SUPER_ADMIN', name: 'Damian' };
                    fetchAcademicStructure();
                } else {
                    alert("ACCESS DENIED: Credentials rejected outside global system node.");
                    $('loader').style.display = 'none';
                    $('app').style.display = 'flex';
                }
            }, 1500);
        };
    }

    const passwordField = $('password');
    if (passwordField && loginBtn) {
        passwordField.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) loginBtn.click();
        });
    }

    // Navigation Tree Interceptors
    document.querySelectorAll('[data-uni]').forEach(el => {
        el.onclick = () => {
            state.selectedUni = el.dataset.uni;
            state.selectedLevel = null;
            state.selectedSemester = null;
            render();
        };
    });

    document.querySelectorAll('.level-box').forEach(el => {
        el.onclick = () => {
            state.selectedLevel = el.dataset.lvl;
            state.selectedSemester = null;
            render();
        };
    });

    document.querySelectorAll('.semester-box').forEach(el => {
        el.onclick = () => {
            state.selectedSemester = el.dataset.sem;
            render();
        };
    });

    $('clearLevelBtn').onclick = () => { state.selectedLevel = null; render(); };
    $('clearSemesterBtn').onclick = () => { state.selectedSemester = null; render(); };

    $('logoutBtn').onclick = () => {
        state.user = null;
        state.screen = 'login';
        state.selectedUni = null;
        state.selectedLevel = null;
        state.selectedSemester = null;
        render();
    };
}

function fetchAcademicStructure() {
    onValue(ref(db, 'academic_structure'), (snap) => {
        const val = snap.val();
        if(!val) {
            seedDatabaseIfEmpty(); // Inject placeholder profiles if database node is dead
        } else {
            state.universities = val;
            state.screen = 'super_dashboard';
            $('loader').style.display = 'none';
            $('app').style.display = 'flex';
            render();
        }
    });
}

function render() {
    const root = $('app');
    if (!state.user) {
        root.innerHTML = renderLogin();
    } else {
        if (state.screen === 'super_dashboard') root.innerHTML = renderSuperAdminDashboard();
    }
    bindEvents();
}

document.body.classList.remove('dark-mode');
render();
