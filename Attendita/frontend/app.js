import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = { databaseURL: "https://attendance-portal-e81f3-default-rtdb.europe-west1.firebasedatabase.app" };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let state = {
    screen: 'login',
    user: null, 
    universities: {},
    selectedUni: null,
    selectedCollege: null,
    selectedDept: null,
    selectedLevel: null,
    selectedSemester: null
};

const MOUAU_MATRIC_MAP = {
    "CME": { college: "CEET", deptName: "Computer Engineering" },
    "EEE": { college: "CEET", deptName: "Electrical & Electronics Engineering" },
    "MCE": { college: "CEET", deptName: "Mechanical Engineering" },
    "CVE": { college: "CEET", deptName: "Civil Engineering" },
    "CHE": { college: "CHE", deptName: "Chemical Engineering" },
    "ABE": { college: "CEET", deptName: "Agricultural & Bioresources Engineering" },
    "CMP": { college: "COLPAS", deptName: "Computer Science" },
    "CHM": { college: "COLPAS", deptName: "Chemistry" },
    "MTH": { college: "COLPAS", deptName: "Mathematics" },
    "PHY": { college: "COLPAS", deptName: "Physics" },
    "STA": { college: "COLPAS", deptName: "Statistics" },
    "GEL": { college: "COLPAS", deptName: "Geology" },
    "ACC": { college: "COLMAS", deptName: "Accounting" },
    "BKF": { college: "COLMAS", deptName: "Banking & Finance" },
    "BUS": { college: "COLMAS", deptName: "Business Administration" },
    "ECN": { college: "COLMAS", deptName: "Economics" },
    "ENS": { college: "COLMAS", deptName: "Entrepreneurial Studies" },
    "HRM": { college: "COLMAS", deptName: "Human Resource Management" },
    "IRM": { college: "COLMAS", deptName: "Industrial Relations" },
    "BCH": { college: "COLNAS", deptName: "Biochemistry" },
    "MCB": { college: "COLNAS", deptName: "Microbiology" },
    "PSB": { college: "COLNAS", deptName: "Plant Science & Biotechnology" },
    "ZEB": { college: "COLNAS", deptName: "Zoology & Environmental Biology" },
    "SED": { college: "COED", deptName: "Science Education" },
    "AED": { college: "COED", deptName: "Agricultural/Home Economics Education" },
    "EDF": { college: "COED", deptName: "Educational Foundations" },
    "ITE": { college: "COED", deptName: "Industrial Technology Education" },
    "LIS": { college: "COED", deptName: "Library and Information Science" },
    "FST": { college: "CAFST", deptName: "Food Science & Technology" },
    "HND": { college: "CAFST", deptName: "Human Nutrition & Dietetics" },
    "HMT": { college: "CAFST", deptName: "Home Science / Hospitality Management & Tourism" },
    "AEC": { college: "CAERSE", deptName: "Agricultural Economics" },
    "ABM": { college: "CAERSE", deptName: "Agribusiness & Management" },
    "AEX": { college: "CAERSE", deptName: "Agricultural Extension & Rural Sociology" },
    "AGN": { college: "CCSS", deptName: "Agronomy" },
    "PHM": { college: "CCSS", deptName: "Plant Health Management" },
    "SSM": { college: "CCSS", deptName: "Soil Science & Meteorology" },
    "WRM": { college: "CCSS", deptName: "Water Resources Management & Agrometeorology" },
    "ABP": { college: "CASAP", deptName: "Animal Breeding & Physiology" },
    "ANF": { college: "CASAP", deptName: "Animal Nutrition & Forage Science" },
    "APM": { college: "CASAP", deptName: "Animal Production & Livestock Management" },
    "EMT": { college: "CNREM", deptName: "Environmental Management & Toxicology" },
    "FRM": { college: "CNREM", deptName: "Fisheries & Aquatic Resources Management" },
    "FEM": { college: "CNREM", deptName: "Forestry & Environmental Management" },
    "VET": { college: "CVM", deptName: "Veterinary Medicine" },
    "CVM": { college: "CVM", deptName: "Veterinary Medicine" }
};

const $ = id => document.getElementById(id);

function seedDatabaseIfEmpty() {
    const sampleStructure = {
        "MOUAU": {
            name: "Michael Okpara University of Agriculture Umudike",
            colleges: {
                "CEET": {
                    name: "College of Engineering & Engineering Technology",
                    departments: {
                        "CME": { name: "Computer Engineering", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "EEE": { name: "Electrical & Electronics Engineering", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "MCE": { name: "Mechanical Engineering", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "CVE": { name: "Civil Engineering", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "CHE": { name: "Chemical Engineering", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "ABE": { name: "Agricultural & Bioresources Engineering", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } }
                    }
                },
                "COLPAS": {
                    name: "College of Physical & Applied Sciences",
                    departments: {
                        "CMP": { 
                            name: "Computer Science", 
                            levels: { 
                                "100": { 
                                    semesters: { 
                                        "First Semester": { 
                                            courses: { 
                                                "CSC_111": { title: "Introduction to Computer Science", lecturer: "Prof. Okoro" }, 
                                                "BIO_121": { title: "Introductory Biology I", lecturer: "Dr. Evans" } 
                                            } 
                                        },
                                        "Second Semester": { courses: {} }
                                    } 
                                } 
                            } 
                        },
                        "CSC": { name: "Computer Science (Legacy Code Mapping)", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "CHM": { name: "Chemistry", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "MTH": { name: "Mathematics", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "PHY": { name: "Physics", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "STA": { name: "Statistics", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "GEL": { name: "Geology", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } }
                    }
                },
                "COLMAS": {
                    name: "College of Management Sciences",
                    departments: {
                        "ACC": { name: "Accounting", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "BKF": { name: "Banking & Finance", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "BUS": { name: "Business Administration", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "ECN": { name: "Economics", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "ENS": { name: "Entrepreneurial Studies", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "HRM": { name: "Human Resource Management", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "IRM": { name: "Industrial Relations", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } }
                    }
                },
                "COLNAS": {
                    name: "College of Natural Sciences",
                    departments: {
                        "BCH": { name: "Biochemistry", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "MCB": { name: "Microbiology", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "PSB": { name: "Plant Science & Biotechnology", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "ZEB": { name: "Zoology & Environmental Biology", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } }
                    }
                },
                "COED": {
                    name: "College of Education",
                    departments: {
                        "SED": { name: "Science Education", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "AED": { name: "Agricultural/Home Economics Education", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "EDF": { name: "Educational Foundations", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "ITE": { name: "Industrial Technology Education", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "LIS": { name: "Library and Information Science", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } }
                    }
                },
                "CAFST": {
                    name: "College of Applied Food Science & Tourism",
                    departments: {
                        "FST": { name: "Food Science & Technology", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "HND": { name: "Human Nutrition & Dietetics", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "HMT": { name: "Home Science / Hospitality Management & Tourism", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } }
                    }
                },
                "CAERSE": {
                    name: "College of Agricultural Economics, Rural Sociology & Extension",
                    departments: {
                        "AEC": { name: "Agricultural Economics", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "ABM": { name: "Agribusiness & Management", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "AEX": { name: "Agricultural Extension & Rural Sociology", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } }
                    }
                },
                "CCSS": {
                    name: "College of Crop & Soil Sciences",
                    departments: {
                        "AGN": { name: "Agronomy", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "PHM": { name: "Plant Health Management", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "SSM": { name: "Soil Science & Meteorology", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "WRM": { name: "Water Resources Management & Agrometeorology", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } }
                    }
                },
                "CASAP": {
                    name: "College of Animal Science & Animal Production",
                    departments: {
                        "ABP": { name: "Animal Breeding & Physiology", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "ANF": { name: "Animal Nutrition & Forage Science", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "APM": { name: "Animal Production & Livestock Management", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } }
                    }
                },
                "CNREM": {
                    name: "College of Natural Resources & Environmental Management",
                    departments: {
                        "EMT": { name: "Environmental Management & Toxicology", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "FRM": { name: "Fisheries & Aquatic Resources Management", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } },
                        "FEM": { name: "Forestry & Environmental Management", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } }
                    }
                },
                "CVM": {
                    name: "College of Veterinary Medicine",
                    departments: {
                        "VET": { name: "Veterinary Medicine", levels: { "100": { semesters: { "First Semester": { courses: {} }, "Second Semester": { courses: {} } } } } }
                    }
                }
            }
        }
    };
    set(ref(db, 'academic_structure'), sampleStructure);
}

function parseMouauMatric(matricString) {
    const cleanString = matricString.replace(/\s+/g, '').toUpperCase();
    const components = cleanString.split('/');
    if (components.length !== 4 || components[0] !== 'MOUAU') {
        return { valid: false, error: "Invalid layout pattern. Must follow standard MOUAU format." };
    }
    const deptCode = components[1];
    const entryYear = components[2];
    const serialNumber = components[3];

    const match = MOUAU_MATRIC_MAP[deptCode];
    if (!match) {
        return { valid: false, error: `Department classification code '${deptCode}' not listed inside MOUAU records.` };
    }

    return {
        valid: true,
        institution: "MOUAU",
        collegeCode: match.college,
        departmentCode: deptCode,
        departmentName: match.deptName,
        yearOfEntry: `20${entryYear}`,
        serial: serialNumber
    };
}

// --- INTERFACE LAYOUT MODULES ---
function renderLogin() {
    return `
    <div class="login-wrapper">
        <div class="login-card">
            <div style="text-align:center; margin-bottom: 1.5rem;">
                <h1>ATTENDITA</h1>
                <p style="color: var(--accent-blue); font-size: 9px; letter-spacing: 2px; font-weight: 700; margin: 5px 0 0 0;">SYSTEM IDENTITY MANAGEMENT</p>
            </div>
            <div class="col" style="gap:1rem;">
                <input id="email" type="text" placeholder="Username or Matric No. (MOUAU/...)" autocomplete="off" />
                <input id="password" type="password" placeholder="••••••••" />
                <button class="btn btn-primary btn-full" id="loginBtn">AUTHORIZE ACCESS</button>
                <p style="font-size:12px; text-align:center; color:var(--text-dim); margin:0;">
                    New Student? <span id="toSignup" style="color:var(--accent-blue); cursor:pointer; font-weight:700;">Create Profile</span>
                </p>
            </div>
        </div>
    </div>`;
}

function renderSignup() {
    return `
    <div class="login-wrapper">
        <div class="login-card" style="border-top-color: var(--accent-amber);">
            <div style="text-align:center; margin-bottom: 1.5rem;">
                <h1>SIGN UP</h1>
                <p style="color: var(--accent-amber); font-size: 9px; letter-spacing: 2px; font-weight: 700; margin: 5px 0 0 0;">STUDENT REGISTRATION CORE</p>
            </div>
            <div class="col" style="gap:1rem;">
                <input id="regName" type="text" placeholder="Full Name (Surname First)" autocomplete="off"/>
                <input id="regMatric" type="text" placeholder="Matric No: MOUAU/CMP/24/1234" autocomplete="off"/>
                <input id="regPassword" type="password" placeholder="Choose Password Pin" />
                <button class="btn btn-primary btn-full" id="submitSignupBtn" style="background: var(--accent-amber);">REGISTER PROFILE</button>
                <p style="font-size:12px; text-align:center; color:var(--text-dim); margin:0;">
                    Already configured? <span id="toLogin" style="color:var(--accent-blue); cursor:pointer; font-weight:700;">Back to Login</span>
                </p>
            </div>
        </div>
    </div>`;
}

function renderSuperAdminDashboard() {
    const unis = Object.entries(state.universities);
    
    let sidebarHtml = `
    <div class="sidebar">
        <div class="col" style="gap:5px;">
            <h2>NEXUS GRID</h2>
            <span style="font-size:10px; color:var(--accent-amber); font-weight:700;">SYSTEM ROOT OVERRIDE</span>
        </div>
        <hr style="width:100%; border:none; border-top:1px solid var(--border); margin:0;">
        <div class="tree-section">
            <span class="tree-title">Universities</span>
            ${unis.map(([id, u]) => `<div class="tree-item ${state.selectedUni === id ? 'active' : ''}" data-uni="${id}">🏛️ ${id}</div>`).join('')}
        </div>
        <button class="btn" id="logoutBtn" style="margin-top:auto; background:none; border:1px solid #EF4444; color:#EF4444; font-size:11px;">LOG OUT</button>
    </div>`;

    let workspaceHtml = `<div class="workspace">`;
    
    if (!state.selectedUni) {
        workspaceHtml += `
        <div class="card" style="text-align:center; padding: 4rem 2rem;">
            <h2>Welcome to Central Control</h2>
            <p style="color:var(--text-dim); max-width:400px; margin: 10px auto;">Select a university node to manage college tracks.</p>
        </div>`;
    } else {
        const uniData = state.universities[state.selectedUni] || { name: "Unknown University", colleges: {} };
        
        workspaceHtml += `
        <div class="card" style="margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <span style="font-size:11px; color:var(--accent-blue); font-weight:700; text-transform:uppercase;">Active Domain</span>
                <h1 style="margin-top:5px; font-size:22px;">${uniData.name}</h1>
            </div>
            <button class="btn" id="forceSyncDbBtn" style="font-size:10px; padding:6px 12px; background:var(--accent-amber); color:#fff;">RESET MATRIX MAP</button>
        </div>`;

        if (!state.selectedCollege) {
            const colleges = Object.entries(uniData.colleges || {});
            workspaceHtml += `
            <h3>Colleges Configuration Matrix</h3>
            <div class="data-grid">
                ${colleges.map(([code, c]) => `
                    <div class="grid-box college-box" data-coll="${code}">
                        <span style="font-size:16px; font-weight:800; color:var(--accent-blue);">${code}</span>
                        <span style="font-size:11px; font-weight:500; margin-top:5px; line-height:1.3;">${c.name}</span>
                    </div>
                `).join('')}
            </div>`;
        } 
        else if (state.selectedCollege && !state.selectedDept) {
            const collegeNode = uniData.colleges[state.selectedCollege] || { name: "", departments: {} };
            const depts = Object.entries(collegeNode.departments || {});
            workspaceHtml += `
            <div class="row" style="gap:10px; margin-bottom:1.5rem;">
                <button class="btn" id="clearCollBtn" style="padding:6px 12px; font-size:11px; background:var(--bg-input); color:var(--text-main);">< BACK</button>
                <h3>Path: ${state.selectedCollege}</h3>
            </div>
            <div class="data-grid">
                ${depts.length > 0 ? depts.map(([code, d]) => `
                    <div class="grid-box dept-box" data-dept="${code}">
                        <span style="font-size:18px; font-weight:700; color:var(--accent-blue);">${code}</span>
                        <span style="font-size:12px; font-weight:500;">${d.name}</span>
                    </div>
                `).join('') : '<p style="padding:1rem; color:var(--text-dim); font-size:12px;">No active departments registered yet.</p>'}
            </div>`;
        }
        else if (state.selectedCollege && state.selectedDept && !state.selectedLevel) {
            const deptNode = uniData.colleges[state.selectedCollege].departments[state.selectedDept] || { levels: {} };
            const levels = Object.keys(deptNode.levels || {});
            workspaceHtml += `
            <div class="row" style="gap:10px; margin-bottom:1.5rem;">
                <button class="btn" id="clearDeptBtn" style="padding:6px 12px; font-size:11px; background:var(--bg-input); color:var(--text-main);">< BACK</button>
                <h3>Path: ${state.selectedCollege} > ${state.selectedDept}</h3>
            </div>
            <div class="data-grid">
                ${levels.length > 0 ? levels.map(lvl => `
                    <div class="grid-box level-box" data-lvl="${lvl}">
                        <span style="font-size:24px; font-weight:800; color:var(--accent-blue);">${lvl}L</span>
                    </div>
                `).join('') : '<p style="padding:1rem; color:var(--text-dim); font-size:12px;">No level parameters generated under this path code index yet.</p>'}
            </div>`;
        }
        else if (state.selectedCollege && state.selectedDept && state.selectedLevel && !state.selectedSemester) {
            const levelNode = uniData.colleges[state.selectedCollege].departments[state.selectedDept].levels[state.selectedLevel] || { semesters: {} };
            const semesters = Object.keys(levelNode.semesters || {});
            workspaceHtml += `
            <div class="row" style="gap:10px; margin-bottom:1.5rem;">
                <button class="btn" id="clearLevelBtn" style="padding:6px 12px; font-size:11px; background:var(--bg-input); color:var(--text-main);">< BACK</button>
                <h3>Path: L${state.selectedLevel} Semesters</h3>
            </div>
            <div class="data-grid">
                ${semesters.length > 0 ? semesters.map(sem => `
                    <div class="grid-box semester-box" data-sem="${sem}">
                        <span style="font-size:16px; font-weight:700;">${sem}</span>
                    </div>
                `).join('') : '<p style="padding:1rem; color:var(--text-dim);">No semester catalogs found here.</p>'}
            </div>`;
        }
        else {
            const semNode = uniData.colleges[state.selectedCollege].departments[state.selectedDept].levels[state.selectedLevel].semesters[state.selectedSemester] || { courses: {} };
            const courses = Object.entries(semNode.courses || {});
            workspaceHtml += `
            <div class="row" style="gap:10px; margin-bottom:1.5rem;">
                <button class="btn" id="clearSemesterBtn" style="padding:6px 12px; font-size:11px; background:var(--bg-input); color:var(--text-main);">< BACK</button>
                <h3>Path: L${state.selectedLevel} > ${state.selectedSemester}</h3>
            </div>
            <div class="card">
                ${courses.length > 0 ? courses.map(([code, data]) => `
                    <div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--border);">
                        <span><b>${code}</b>: ${data.title}</span>
                        <span style="color:var(--accent-blue); font-weight:700;">👨‍🏫 ${data.lecturer}</span>
                    </div>
                `).join('') : '<p style="color:var(--text-dim); text-align:center; font-size:12px;">No active classes listed.</p>'}
            </div>`;
        }
    }
    workspaceHtml += `</div>`;
    return `<div class="admin-container">${sidebarHtml}${workspaceHtml}</div>`;
}

function renderStandardDashboard() {
    const syncSource = localStorage.getItem("active_user_session") ? "LOCAL CACHE" : "LIVE CLOUD";
    return `
    <div style="padding:2rem; width:100%; max-width:600px; margin:0 auto;">
        <div class="card" style="text-align:center;">
            <h1>Welcome, ${state.user.name}</h1>
            <p style="color:var(--accent-blue); font-weight:700; font-size:12px; letter-spacing:1px; margin:5px 0;">ROLE: ${state.user.role}</p>
            <p style="font-size:11px; color:var(--text-dim);">PATH: ${state.user.college || 'COLPAS'} > ${state.user.departmentCode || 'CMP'}</p>
            <span style="font-size:9px; background:var(--bg-input); padding:4px 8px; border-radius:4px; font-weight:700; color:var(--accent-amber);">SYNC: ${syncSource}</span>
            <hr style="border:none; border-top:1px solid var(--border); margin:1.5rem 0;">
            <p style="font-size:13px; color:var(--text-dim);">Your attendance portal interface configuration engine is functional.</p>
            <button class="btn" id="logoutBtn" style="margin-top:2rem; background:#EF4444; color:#fff;">LOG OUT</button>
        </div>
    </div>`;
}

// --- LOGIC HUB ---
function bindEvents() {
    if($('themeBtn')) $('themeBtn').onclick = () => document.body.classList.toggle('dark-mode');

    if($('toSignup')) $('toSignup').onclick = () => { state.screen = 'signup'; render(); };
    if($('toLogin')) $('toLogin').onclick = () => { state.screen = 'login'; render(); };

    if($('forceSyncDbBtn')) {
        $('forceSyncDbBtn').onclick = () => {
            if(confirm("Initialize complete multi-college map structural overlay?")) {
                seedDatabaseIfEmpty();
                alert("Matrix structures applied successfully.");
            }
        };
    }

    const submitSignupBtn = $('submitSignupBtn');
    if (submitSignupBtn) {
        submitSignupBtn.onclick = () => {
            const name = $('regName').value.trim();
            const matric = $('regMatric').value.trim();
            const password = $('regPassword').value;

            if(!name || !matric || !password) {
                alert("All setup fields are required.");
                return;
            }

            const parsed = parseMouauMatric(matric);
            if (!parsed.valid) {
                alert(`REGISTRATION ERROR: ${parsed.error}`);
                return;
            }

            if($('app')) $('app').style.display = 'none';
            if($('loader')) $('loader').style.display = 'flex';

            const dbMatricKey = matric.replace(/\//g, "-").toUpperCase();
            const studentObject = {
                fullName: name,
                matricNumber: matric.toUpperCase(),
                password: password,
                college: parsed.collegeCode,
                department: parsed.departmentCode,
                departmentName: parsed.departmentName,
                entryYear: parsed.yearOfEntry,
                role: "STUDENT"
            };

            localStorage.setItem(`local_user_${dbMatricKey}`, JSON.stringify(studentObject));

            set(ref(db, `users/${dbMatricKey}`), studentObject).then(() => {
                set(ref(db, `academic_structure/MOUAU/colleges/${parsed.collegeCode}/departments/${parsed.departmentCode}/name`), parsed.departmentName);
                alert("Profile structured successfully!");
                state.screen = 'login';
                finishLogin();
            }).catch(() => {
                alert("Firebase offline fallback mode triggered.");
                state.screen = 'login';
                finishLogin();
            });
        };
    }

    const loginBtn = $('loginBtn');
    if (loginBtn) {
        loginBtn.onclick = () => {
            const usernameInput = $('email').value.trim().toUpperCase();
            const passwordInput = $('password').value;
            
            if($('app')) $('app').style.display = 'none';
            if($('loader')) $('loader').style.display = 'flex';

            if (usernameInput === 'DAMIAN' && passwordInput === 'nexus123') {
                state.user = { role: 'SUPER_ADMIN', name: 'Damian' };
                fetchAcademicStructure();
                return;
            }

            const cleanUserKey = usernameInput.replace(/\//g, "-");
            const localCachedProfile = localStorage.getItem(`local_user_${cleanUserKey}`);
            
            get(ref(db, `users/${cleanUserKey}`)).then((snapshot) => {
                if(snapshot.exists()) {
                    const userData = snapshot.val();
                    if(userData.password === passwordInput) {
                        localStorage.setItem(`local_user_${cleanUserKey}`, JSON.stringify(userData));
                        localStorage.setItem("active_user_session", JSON.stringify(userData));

                        state.user = { 
                            role: userData.role, 
                            name: userData.fullName,
                            college: userData.college,
                            departmentCode: userData.department
                        };
                        state.screen = 'standard_dashboard';
                        finishLogin();
                    } else {
                        alert("SECURITY BREACH: Password pin rejected.");
                        finishLogin();
                    }
                } else {
                    handleLocalAuthenFallback(localCachedProfile, passwordInput);
                }
            }).catch(() => {
                handleLocalAuthenFallback(localCachedProfile, passwordInput);
            });
        };
    }

    document.querySelectorAll('[data-uni]').forEach(el => el.onclick = () => { state.selectedUni = el.dataset.uni; clearDrills(0); render(); });
    document.querySelectorAll('.college-box').forEach(el => el.onclick = () => { state.selectedCollege = el.dataset.coll; clearDrills(1); render(); });
    document.querySelectorAll('.dept-box').forEach(el => el.onclick = () => { state.selectedDept = el.dataset.dept; clearDrills(2); render(); });
    document.querySelectorAll('.level-box').forEach(el => el.onclick = () => { state.selectedLevel = el.dataset.lvl; clearDrills(3); render(); });
    document.querySelectorAll('.semester-box').forEach(el => el.onclick = () => { state.selectedSemester = el.dataset.sem; render(); });

    if($('clearCollBtn')) $('clearCollBtn').onclick = () => { state.selectedCollege = null; render(); };
    if($('clearDeptBtn')) $('clearDeptBtn').onclick = () => { state.selectedDept = null; render(); };
    if($('clearLevelBtn')) $('clearLevelBtn').onclick = () => { state.selectedLevel = null; render(); };
    if($('clearSemesterBtn')) $('clearSemesterBtn').onclick = () => { state.selectedSemester = null; render(); };

    if($('logoutBtn')) {
        $('logoutBtn').onclick = () => {
            localStorage.removeItem("active_user_session");
            state.user = null; state.screen = 'login'; clearDrills(0); state.selectedUni = null; render();
        };
    }
}

function handleLocalAuthenFallback(cachedStringData, passwordInput) {
    if(cachedStringData) {
        const userData = JSON.parse(cachedStringData);
        if(userData.password === passwordInput) {
            localStorage.setItem("active_user_session", JSON.stringify(userData));
            state.user = { 
                role: userData.role, 
                name: userData.fullName,
                college: userData.college,
                departmentCode: userData.department
            };
            state.screen = 'standard_dashboard';
            finishLogin();
        } else {
            alert("LOCAL LOCKOUT: Password mismatch.");
            finishLogin();
        }
    } else {
        alert("ACCESS DENIED: Credentials invalid.");
        finishLogin();
    }
}

function clearDrills(level) {
    if(level <= 0) state.selectedCollege = null;
    if(level <= 1) state.selectedDept = null;
    if(level <= 2) state.selectedLevel = null;
    if(level <= 3) state.selectedSemester = null;
}

function finishLogin() {
    if($('loader')) $('loader').style.display = 'none';
    if($('app')) $('app').style.display = 'flex';
    render();
}

function fetchAcademicStructure() {
    onValue(ref(db, 'academic_structure'), (snap) => {
        state.universities = snap.val() || {};
        state.screen = 'super_dashboard';
        finishLogin();
    });
}

function checkActiveSessionCache() {
    try {
        const activeSession = localStorage.getItem("active_user_session");
        if(activeSession) {
            const userData = JSON.parse(activeSession);
            state.user = { 
                role: userData.role, 
                name: userData.fullName,
                college: userData.college,
                departmentCode: userData.department
            };
            state.screen = 'standard_dashboard';
        }
    } catch (e) {
        console.error("Local session parsing failed", e);
    }
}

// --- GLOBAL INITIALIZATION EXECUTION ---
function render() {
    const root = $('app');
    if (!root) return;
    
    if (!state.user) {
        root.innerHTML = state.screen === 'signup' ? renderSignup() : renderLogin();
    } else {
        if (state.screen === 'super_dashboard') root.innerHTML = renderSuperAdminDashboard();
        else if (state.screen === 'standard_dashboard') root.innerHTML = renderStandardDashboard();
    }
    bindEvents();
}

// Fire the baseline engine calls explicitly in sequence
checkActiveSessionCache();
render();