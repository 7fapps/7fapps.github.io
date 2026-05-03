import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, update, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyArgI-tse9J1P9KtnGvkk1DucPpBVVs8gM",
  authDomain: "attendance-portal-e81f3.firebaseapp.com",
  databaseURL: "https://attendance-portal-e81f3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "attendance-portal-e81f3",
  storageBucket: "attendance-portal-e81f3.firebasestorage.app",
  messagingSenderId: "169620903370",
  appId: "1:169620903370:web:e8d860bc34d9c6602ceb33"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

const USERS = [
  { id:"lecturer1", username:"lecturer1", password:"pass123", role:"lecturer", name:"Dr. Emeka Obi" },
  { id:"courserep1", username:"courserep1", password:"pass123", role:"courserep", name:"Sara (Course Rep)" },
  { id:"student1", username:"student1", password:"pass123", role:"student", name:"Chidi Nwosu" },
  { id:"student2", username:"student2", password:"pass123", role:"student", name:"Amara Bello" },
  { id:"student3", username:"student3", password:"pass123", role:"student", name:"Tunde Adeyemi" },
  { id:"student4", username:"student4", password:"pass123", role:"student", name:"Ngozi Eze" },
  { id:"student5", username:"student5", password:"pass123", role:"student", name:"Emeka Dike" },
];

let state = {
  user: null,
  screen: "login",
  sessions: {},
  alert: null,
  newSession: { title:"", radius:100, students:[] },
  checkinCode: null,
  selectedStudent: null,
  locationStatus: null,
  editingSession: null,
};

function $(id) { return document.getElementById(id); }

function loadUser() {
  try {
    const u = localStorage.getItem("att_user");
    if(u) {
      state.user = JSON.parse(u);
      state.screen = state.user.role === "student" ? "student_home" : "dashboard";
    }
  } catch(e) {}
}

function listenToSessions() {
  onValue(ref(db, "sessions"), snapshot => {
    state.sessions = snapshot.val() || {};
    render();
  });
}

function genCode() {
  return Math.random().toString(36).substr(2,6).toUpperCase();
}

function calcDist(lat1,lon1,lat2,lon2) {
  const R=6371000;
  const dLat=(lat2-lat1)*Math.PI/180;
  const dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function alertHtml() {
  if(!state.alert) return "";
  return `<div class="alert alert-${state.alert.type}">${state.alert.msg}</div>`;
}

function render() {
  const app = document.getElementById("app");
  if(!app) return;
  const screens = {
    login: renderLogin,
    dashboard: renderDashboard,
    create_session: renderCreateSession,
    student_home: renderStudentHome,
    student_checkin: renderStudentCheckin,
    edit_session: renderEditSession,
  };
  app.innerHTML = `<div class="screen">${(screens[state.screen] || renderLogin)()}</div>`;
  bindEvents();
}

function renderLogin() {
  return `
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;">
    <div style="width:100%;max-width:380px;">
      <div style="text-align:center;margin-bottom:2rem;">
        <div style="font-size:26px;font-weight:800;margin-bottom:4px;">Attendance Portal</div>
        <div style="font-size:13px;color:#64748b;">Sign in to your account</div>
      </div>
      ${alertHtml()}
      <div class="card col" style="gap:1rem;">
        <div class="col">
          <label>Username</label>
          <input id="un" type="text" placeholder="e.g. lecturer1" autocomplete="username" />
        </div>
        <div class="col">
          <label>Password</label>
          <input id="pw" type="password" placeholder="••••••••" autocomplete="current-password" />
        </div>
        <button class="btn btn-primary btn-full" id="loginBtn">Sign In</button>
      </div>
      <div class="hint-box">
        <strong>Demo accounts (all passwords: pass123)</strong>
        lecturer1 &bull; courserep1 &bull; student1 to student5
      </div>
    </div>
  </div>`;
}

function renderDashboard() {
  const u = state.user;
  const mySessions = Object.values(state.sessions);
  const roleColor = { lecturer:"amber", courserep:"green" }[u.role] || "blue";
  const roleLabel = { lecturer:"Lecturer", courserep:"Course Rep" }[u.role];
  return `
  <div>
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-weight:700;font-size:15px;">${u.name}</span>
        <span class="badge badge-${roleColor}">${roleLabel}</span>
      </div>
      <button class="btn btn-sm" id="logoutBtn">Sign out</button>
    </div>
    <div class="main">
      ${alertHtml()}
      <div class="row" style="justify-content:space-between;margin-bottom:1rem;">
        <div style="font-size:18px;font-weight:700;">My Sessions</div>
        <button class="btn btn-primary btn-sm" id="createSessionBtn">+ New Session</button>
      </div>
      ${mySessions.length === 0
        ? `<div class="empty card">No sessions yet. Create one to get started.</div>`
        : mySessions.map(s => {
            const students = Object.values(s.students || {});
            return `
            <div class="card session-card">
              <div class="row" style="justify-content:space-between;margin-bottom:6px;">
                <div>
                  <span style="font-weight:700;">${s.title}</span>
                  <span class="badge badge-blue" style="margin-left:6px;">${s.code}</span>
                </div>
                <div class="row" style="gap:6px;">
                  ${u.role === "courserep" ? `<button class="btn btn-sm" data-edit="${s.code}">Edit</button>` : ""}
                  <button class="btn btn-sm ${s.active?'btn-danger':''}" data-toggle="${s.code}">
                    ${s.active?'Close':'Reopen'}
                  </button>
                </div>
              </div>
              <div class="session-meta">
                Radius: ${s.radius}m &bull;
                ${students.filter(st=>st.present).length}/${students.length} present &bull;
                Status: <strong style="color:${s.active?'#34d399':'#fbbf24'}">${s.active?'Active':'Closed'}</strong>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
                ${students.map(st=>`
                  <span class="chip" style="background:${st.present?'#10b98120':'#f59e0b20'};color:${st.present?'#34d399':'#fbbf24'};">
                    ${st.name} ${st.present?'✓':'–'}
                  </span>`).join("")}
              </div>
              <div class="session-link">
                Share code with students: <strong style="color:#e2e8f0;font-size:15px;letter-spacing:2px;">${s.code}</strong>
              </div>
            </div>`;
          }).join("")}
    </div>
  </div>`;
}

function renderCreateSession() {
  const ns = state.newSession;
  return `
  <div>
    <div class="topbar">
      <div style="font-weight:700;">Create Session</div>
      <button class="btn btn-sm" id="backBtn">← Back</button>
    </div>
    <div class="main">
      ${alertHtml()}
      <div class="card col" style="gap:1rem;">
        <div class="col">
          <label>Session title / class name</label>
          <input id="sess-title" type="text" placeholder="e.g. MTH301 – Chapter 5" value="${ns.title}" />
        </div>
        <div class="col">
          <label>GPS check-in radius: <strong id="radius-val">${ns.radius}m</strong></label>
          <input id="sess-radius" type="range" min="20" max="500" step="10" value="${ns.radius}" />
        </div>
        <div class="divider"></div>
        <div style="font-size:14px;font-weight:700;">
          Student list
          <span style="font-weight:400;color:#64748b;font-size:12px;">(${ns.students.length} added)</span>
        </div>
        <div class="row">
          <input id="student-input" type="text" placeholder="Type student name, press Enter or Add" style="flex:1;" />
          <button class="btn btn-sm" id="addStudentBtn">Add</button>
        </div>
        <div class="scroll-area">
          ${ns.students.length === 0
            ? `<div class="empty">No students added yet</div>`
            : ns.students.map((st,i) => `
            <div class="row" style="padding:7px 10px;border-radius:8px;border:1px solid #1e2d4a;margin-bottom:6px;justify-content:space-between;">
              <span style="font-size:13px;">${i+1}. ${st}</span>
              <button class="btn btn-sm" data-remove="${i}">× Remove</button>
            </div>`).join("")}
        </div>
        <button class="btn btn-primary btn-full" id="saveSessionBtn">Create Session</button>
      </div>
    </div>
  </div>`;
}

function renderEditSession() {
  const s = state.editingSession;
  if(!s) return "";
  const students = Object.values(s.students || {});
  return `
  <div>
    <div class="topbar">
      <div style="font-weight:700;">Edit — ${s.title}</div>
      <button class="btn btn-sm" id="backBtn">← Back</button>
    </div>
    <div class="main">
      ${alertHtml()}
      <div class="card col" style="gap:1rem;">
        <div style="font-size:14px;font-weight:700;">
          Toggle attendance
          <span style="font-weight:400;color:#64748b;font-size:12px;">(tap to mark present/absent)</span>
        </div>
        <div class="scroll-area">
          ${students.map((st,i) => `
          <div class="student-row ${st.present?'present':''}" data-mark="${i}">
            <span style="font-size:14px;">${i+1}. ${st.name}</span>
            <span class="badge badge-${st.present?'green':'amber'}">${st.present?'Present':'Absent'}</span>
          </div>`).join("")}
        </div>
        <div class="divider"></div>
        <div style="font-size:14px;font-weight:700;">Add new student</div>
        <div class="row">
          <input id="edit-student-input" type="text" placeholder="New student name" style="flex:1;" />
          <button class="btn btn-sm" id="addEditStudentBtn">Add</button>
        </div>
        <button class="btn btn-primary btn-full" id="saveEditBtn">Save Changes</button>
      </div>
    </div>
  </div>`;
}

function renderStudentHome() {
  const u = state.user;
  const activeSessions = Object.values(state.sessions).filter(s => s.active);
  return `
  <div>
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-weight:700;font-size:15px;">${u.name}</span>
        <span class="badge badge-purple">Student</span>
      </div>
      <button class="btn btn-sm" id="logoutBtn">Sign out</button>
    </div>
    <div class="main">
      ${alertHtml()}
      <div class="card col" style="gap:0.75rem;margin-bottom:1.25rem;">
        <div style="font-size:14px;font-weight:700;">Enter Session Code</div>
        <div style="font-size:12px;color:#64748b;">Ask your lecturer or course rep for the 6-digit code.</div>
        <div class="row">
          <input id="join-code-input" type="text" placeholder="e.g. AB12CD" maxlength="6"
            style="flex:1;text-transform:uppercase;letter-spacing:3px;font-size:16px;font-weight:700;" />
          <button class="btn btn-primary btn-sm" id="joinByCodeBtn">Join</button>
        </div>
      </div>
      <div style="font-size:14px;font-weight:700;margin-bottom:8px;">
        Active Sessions
        <span style="font-weight:400;color:#64748b;font-size:12px;">(live)</span>
      </div>
      ${activeSessions.length === 0
        ? `<div class="empty card">No active sessions right now.<br>Use the code above if your lecturer shared one.</div>`
        : activeSessions.map(s => `
        <div class="card session-card" style="cursor:pointer;" data-join="${s.code}">
          <div class="row" style="justify-content:space-between;">
            <div>
              <div style="font-weight:700;">${s.title}</div>
              <div class="session-meta" style="margin-top:4px;">
                By ${s.creatorName} &bull; Code: <strong style="color:#60a5fa;letter-spacing:2px;">${s.code}</strong>
              </div>
            </div>
            <span class="badge badge-green">Active</span>
          </div>
        </div>`).join("")}
    </div>
  </div>`;
}

function renderStudentCheckin() {
  const s = state.sessions[state.checkinCode];
  if(!s) return `<div style="padding:2rem;text-align:center;color:#64748b;">Session not found.</div>`;
  const students = Object.values(s.students || {});
  const sel = state.selectedStudent;
  const alreadyPresent = sel !== null && students[sel]?.present;
  const loc = state.locationStatus;
  return `
  <div>
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-weight:700;">${s.title}</span>
        <span class="badge badge-blue">${s.code}</span>
      </div>
      <button class="btn btn-sm" id="backToHomeBtn">← Back</button>
    </div>
    <div class="main">
      <div style="font-size:13px;color:#64748b;margin-bottom:1rem;">
        Select your name, scroll down, then tap <strong style="color:#e2e8f0;">Mark Present</strong>.
      </div>
      ${alertHtml()}
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;">
        Select your name
        <span style="font-weight:400;color:#64748b;">(${students.length} students)</span>
      </div>
      <div class="scroll-area" style="margin-bottom:1rem;">
        ${students.map((st,i) => `
        <div class="student-row ${st.present?'present':sel===i?'selected':''}" data-select="${i}">
          <span style="font-size:14px;">${i+1}. ${st.name}</span>
          <span class="badge badge-${st.present?'green':'amber'}">${st.present?'✓ Present':'Absent'}</span>
        </div>`).join("")}
      </div>
      ${loc ? `<div class="alert alert-${loc.ok?'success':'danger'}">${loc.msg}</div>` : ""}
      <div style="background:#0e1420;border-radius:8px;padding:10px;font-size:12px;color:#64748b;margin-bottom:1rem;">
        📍 Required GPS radius: <strong style="color:#e2e8f0;">${s.radius}m</strong> from classroom.
      </div>
      <button class="btn btn-primary btn-full" id="markPresentBtn"
        ${sel === null || alreadyPresent ? "disabled" : ""}>
        ${sel === null ? "Select your name first" : alreadyPresent ? "✓ Already Marked Present" : "Mark Present"}
      </button>
    </div>
  </div>`;
}

function bindEvents() {
  $("loginBtn")?.addEventListener("click", doLogin);
  $("pw")?.addEventListener("keydown", e => e.key === "Enter" && doLogin());

  $("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("att_user");
    state = { ...state, user:null, screen:"login", alert:null };
    render();
  });

  $("backBtn")?.addEventListener("click", () => {
    state.screen = "dashboard"; state.alert = null; render();
  });

  $("backToHomeBtn")?.addEventListener("click", () => {
    state.screen = "student_home"; state.alert = null;
    state.selectedStudent = null; state.locationStatus = null; render();
  });

  $("createSessionBtn")?.addEventListener("click", () => {
    state.screen = "create_session";
    state.newSession = { title:"", radius:100, students:[] };
    state.alert = null; render();
  });

  $("sess-radius")?.addEventListener("input", e => {
    state.newSession.radius = parseInt(e.target.value);
    const rv = $("radius-val");
    if(rv) rv.textContent = e.target.value + "m";
  });

  $("sess-title")?.addEventListener("input", e => state.newSession.title = e.target.value);
  $("student-input")?.addEventListener("keydown", e => e.key === "Enter" && addStudent());
  $("addStudentBtn")?.addEventListener("click", addStudent);
  $("saveSessionBtn")?.addEventListener("click", saveSession);
  $("markPresentBtn")?.addEventListener("click", doMarkPresent);
  $("joinByCodeBtn")?.addEventListener("click", joinByCode);
  $("join-code-input")?.addEventListener("keydown", e => e.key === "Enter" && joinByCode());
  $("join-code-input")?.addEventListener("input", e => e.target.value = e.target.value.toUpperCase());
  $("saveEditBtn")?.addEventListener("click", saveEdit);
  $("addEditStudentBtn")?.addEventListener("click", addEditStudent);
  $("edit-student-input")?.addEventListener("keydown", e => e.key === "Enter" && addEditStudent());

  document.querySelectorAll("[data-remove]").forEach(btn => btn.addEventListener("click", e => {
    state.newSession.students.splice(parseInt(e.target.dataset.remove), 1); render();
  }));

  document.querySelectorAll("[data-toggle]").forEach(btn => btn.addEventListener("click", e => {
    const code = e.target.dataset.toggle;
    const s = state.sessions[code];
    if(s) update(ref(db, `sessions/${code}`), { active: !s.active });
  }));

  document.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", e => {
    state.editingSession = JSON.parse(JSON.stringify(state.sessions[e.target.dataset.edit]));
    state.screen = "edit_session"; state.alert = null; render();
  }));

  document.querySelectorAll("[data-join]").forEach(card => card.addEventListener("click", e => {
    state.checkinCode = e.currentTarget.dataset.join;
    state.selectedStudent = null; state.locationStatus = null;
    state.alert = null; state.screen = "student_checkin"; render();
  }));

  document.querySelectorAll("[data-select]").forEach(row => row.addEventListener("click", e => {
    const i = parseInt(e.currentTarget.dataset.select);
    const students = Object.values(state.sessions[state.checkinCode]?.students || {});
    if(students[i]?.present) return;
    state.selectedStudent = i; render();
  }));

  document.querySelectorAll("[data-mark]").forEach(row => row.addEventListener("click", e => {
    const i = parseInt(e.currentTarget.dataset.mark);
    const students = Object.values(state.editingSession?.students || {});
    if(students[i]) {
      students[i].present = !students[i].present;
      state.editingSession.students = students;
      render();
    }
  }));
}

function doLogin() {
  const un = ($("un")?.value || "").trim();
  const pw = ($("pw")?.value || "").trim();
  const user = USERS.find(u => u.username === un && u.password === pw);
  if(!user) { state.alert = { type:"danger", msg:"Invalid username or password." }; render(); return; }
  state.user = user;
  state.alert = null;
  localStorage.setItem("att_user", JSON.stringify(user));
  state.screen = user.role === "student" ? "student_home" : "dashboard";
  render();
}

function joinByCode() {
  const code = ($("join-code-input")?.value || "").trim().toUpperCase();
  if(!code) { state.alert = { type:"danger", msg:"Please enter a session code." }; render(); return; }
  const s = state.sessions[code];
  if(!s) { state.alert = { type:"danger", msg:`No session found with code "${code}".` }; render(); return; }
  if(!s.active) { state.alert = { type:"danger", msg:"This session is closed." }; render(); return; }
  state.checkinCode = code; state.selectedStudent = null;
  state.locationStatus = null; state.alert = null;
  state.screen = "student_checkin"; render();
}

function addStudent() {
  const inp = $("student-input");
  const name = inp?.value.trim();
  if(!name) return;
  state.newSession.students.push(name);
  inp.value = ""; render();
}

function addEditStudent() {
  const inp = $("edit-student-input");
  if(inp?.value.trim()) {
    if(!Array.isArray(state.editingSession.students)) {
      state.editingSession.students = Object.values(state.editingSession.students || {});
    }
    state.editingSession.students.push({ name: inp.value.trim(), present: false });
    inp.value = ""; render();
  }
}

function saveSession() {
  const title = ($("sess-title")?.value || "").trim();
  if(!title) { state.alert = { type:"danger", msg:"Please enter a session title." }; render(); return; }
  if(state.newSession.students.length === 0) { state.alert = { type:"danger", msg:"Add at least one student." }; render(); return; }
  const code = genCode();
  const sessionData = {
    code, title,
    radius: state.newSession.radius,
    creatorId: state.user.id,
    creatorName: state.user.name,
    active: true,
    students: state.newSession.students.map((name, i) => ({ id:i, name, present: false })),
    lat: null,
    lon: null,
    createdAt: Date.now(),
  };

  const doSave = () => set(ref(db, `sessions/${code}`), sessionData);

  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      sessionData.lat = pos.coords.latitude;
      sessionData.lon = pos.coords.longitude;
      doSave();
    }, () => doSave(), { enableHighAccuracy: true, timeout: 10000 });
  } else {
    doSave();
  }

  state.alert = { type:"success", msg:`Session created! Share code: ${code}` };
  state.screen = "dashboard"; render();
}

function saveEdit() {
  const s = state.editingSession;
  update(ref(db, `sessions/${s.code}`), { students: s.students }).then(() => {
    state.alert = { type:"success", msg:"Attendance list saved." };
    state.screen = "dashboard"; render();
  });
}

function doMarkPresent() {
  const s = state.sessions[state.checkinCode];
  const students = Object.values(s?.students || {});
  const i = state.selectedStudent;
  if(i === null || !s) return;

  if(!navigator.geolocation) { confirmPresent(s, students, i, "GPS not supported — marked present."); return; }
  if(!s.lat || !s.lon) { confirmPresent(s, students, i, "No classroom location — marked present (demo)."); return; }

  state.locationStatus = { ok: null, msg: "📍 Getting your location, please wait..." };
  render();

  navigator.geolocation.getCurrentPosition(pos => {
    const dist = calcDist(pos.coords.latitude, pos.coords.longitude, s.lat, s.lon);
    const accuracy = Math.round(pos.coords.accuracy);
    if(dist <= s.radius) {
      confirmPresent(s, students, i, `✅ Checked in! You are ${Math.round(dist)}m away (±${accuracy}m accuracy).`);
    } else {
      state.locationStatus = {
        ok: false,
        msg: `❌ You are ${Math.round(dist)}m away. Must be within ${s.radius}m. (GPS accuracy: ±${accuracy}m)`
      };
      render();
    }
  }, err => {
    const msgs = { 1:"Location permission denied.", 2:"Location unavailable.", 3:"Location timed out." };
    state.locationStatus = { ok: false, msg: msgs[err.code] || "Location error." };
    render();
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
}

function confirmPresent(s, students, i, msg) {
  const studentKey = Object.keys(s.students)[i];
  update(ref(db, `sessions/${s.code}/students/${studentKey}`), { present: true }).then(() => {
    state.locationStatus = { ok: true, msg };
    state.alert = { type:"success", msg };
    render();
  });
}

loadUser();
listenToSessions();
