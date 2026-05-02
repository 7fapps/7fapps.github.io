// ─── Persist to localStorage ──────────────────────────────────────────────────
function saveState() {
  localStorage.setItem("att_sessions", JSON.stringify(state.sessions));
  if(state.user) localStorage.setItem("att_user", JSON.stringify(state.user));
}

function loadState() {
  try {
    const sessions = localStorage.getItem("att_sessions");
    const user = localStorage.getItem("att_user");
    if(sessions) state.sessions = JSON.parse(sessions);
    if(user) {
      state.user = JSON.parse(user);
      state.screen = state.user.role === "student" ? "student_home" : "dashboard";
    }
  } catch(e) { console.error(e); }
}

// ─── DB ───────────────────────────────────────────────────────────────────────
const DB = {
  users: [
    { id:2, username:"lecturer1", password:"pass123", role:"lecturer", name:"Dr. Emeka Obi" },
    { id:3, username:"courserep1", password:"pass123", role:"courserep", name:"Sara (Course Rep)" },
    { id:4, username:"student1", password:"pass123", role:"student", name:"Chidi Nwosu" },
    { id:5, username:"student2", password:"pass123", role:"student", name:"Amara Bello" },
    { id:6, username:"student3", password:"pass123", role:"student", name:"Tunde Adeyemi" },
    { id:7, username:"student4", password:"pass123", role:"student", name:"Ngozi Eze" },
    { id:8, username:"student5", password:"pass123", role:"student", name:"Emeka Dike" },
  ],
};

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
  joinCodeInput: "",
};

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

function alertHtml() {
  if(!state.alert) return "";
  return `<div class="alert alert-${state.alert.type}">${state.alert.msg}</div>`;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
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

// ─── LECTURER / COURSE REP DASHBOARD ─────────────────────────────────────────
function renderDashboard() {
  const u = state.user;
  const mySessions = Object.values(state.sessions).filter(s => s.creatorId === u.id);
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
        : mySessions.map(s => `
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
            ${s.students.filter(st=>st.present).length}/${s.students.length} present &bull;
            Status: <strong style="color:${s.active?'#34d399':'#fbbf24'}">${s.active?'Active':'Closed'}</strong>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
            ${s.students.map(st=>`
              <span class="chip" style="background:${st.present?'#10b98120':'#f59e0b20'};color:${st.present?'#34d399':'#fbbf24'};">
                ${st.name} ${st.present?'✓':'–'}
              </span>`).join("")}
          </div>
          <div class="session-link">
            Share this code with students: <strong style="color:#e2e8f0;font-size:15px;letter-spacing:2px;">${s.code}</strong>
          </div>
        </div>`).join("")}
    </div>
  </div>`;
}

// ─── CREATE SESSION ───────────────────────────────────────────────────────────
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

// ─── EDIT SESSION (Course Rep only) ──────────────────────────────────────────
function renderEditSession() {
  const s = state.editingSession;
  if(!s) return "";
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
          ${s.students.map((st,i) => `
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

// ─── STUDENT HOME (choose session) ───────────────────────────────────────────
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

      <!-- Join by code -->
      <div class="card col" style="gap:0.75rem;margin-bottom:1.25rem;">
        <div style="font-size:14px;font-weight:700;">Enter Session Code</div>
        <div style="font-size:12px;color:#64748b;">Ask your lecturer or course rep for the session code.</div>
        <div class="row">
          <input id="join-code-input" type="text" placeholder="e.g. AB12CD" maxlength="6"
            style="flex:1;text-transform:uppercase;letter-spacing:3px;font-size:16px;font-weight:700;" />
          <button class="btn btn-primary btn-sm" id="joinByCodeBtn">Join</button>
        </div>
      </div>

      <!-- Active sessions list -->
      <div style="font-size:14px;font-weight:700;margin-bottom:8px;">
        Active Sessions
        <span style="font-weight:400;color:#64748b;font-size:12px;">(auto-detected)</span>
      </div>
      ${activeSessions.length === 0
        ? `<div class="empty card">No active sessions right now.<br>Use the code above if your lecturer shared one.</div>`
        : activeSessions.map(s => `
        <div class="card session-card" style="cursor:pointer;" data-join="${s.code}">
          <div class="row" style="justify-content:space-between;">
            <div>
              <div style="font-weight:700;">${s.title}</div>
              <div class="session-meta" style="margin-top:4px;">By ${s.creatorName} &bull; Code: <strong style="color:#60a5fa;letter-spacing:2px;">${s.code}</strong></div>
            </div>
            <span class="badge badge-green">Active</span>
          </div>
        </div>`).join("")}
    </div>
  </div>`;
}

// ─── STUDENT CHECK-IN ─────────────────────────────────────────────────────────
function renderStudentCheckin() {
  const s = state.sessions[state.checkinCode];
  if(!s) return `<div style="padding:2rem;text-align:center;color:#64748b;">Session not found. Check the code and try again.</div>`;
  const sel = state.selectedStudent;
  const alreadyPresent = sel !== null && s.students[sel]?.present;
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
        Select your name from the list below, then scroll down and tap <strong style="color:#e2e8f0;">Mark Present</strong>.
      </div>
      ${alertHtml()}
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;">
        Select your name
        <span style="font-weight:400;color:#64748b;">(${s.students.length} students)</span>
      </div>
      <div class="scroll-area" style="margin-bottom:1rem;">
        ${s.students.map((st,i) => `
        <div class="student-row ${st.present?'present':sel===i?'selected':''}" data-select="${i}">
          <span style="font-size:14px;">${i+1}. ${st.name}</span>
          <span class="badge badge-${st.present?'green':'amber'}">${st.present?'✓ Present':'Absent'}</span>
        </div>`).join("")}
      </div>

      ${loc ? `<div class="alert alert-${loc.ok?'success':'danger'}" style="font-size:13px;">${loc.msg}</div>` : ""}

      <div style="background:#0e1420;border-radius:8px;padding:10px;font-size:12px;color:#64748b;margin-bottom:1rem;">
        📍 Required GPS radius: <strong style="color:#e2e8f0;">${s.radius}m</strong> from classroom.
        Your device must allow location access.
      </div>

      <button class="btn btn-primary btn-full" id="markPresentBtn"
        ${sel === null || alreadyPresent ? "disabled" : ""}>
        ${sel === null ? "Select your name first" : alreadyPresent ? "✓ Already Marked Present" : "Mark Present"}
      </button>
    </div>
  </div>`;
}

// ─── BIND EVENTS ──────────────────────────────────────────────────────────────
function bindEvents() {
  const $ = id => document.getElementById(id);

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
    state.selectedStudent = null; state.locationStatus = null;
    render();
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
  $("join-code-input")?.addEventListener("input", e => {
    e.target.value = e.target.value.toUpperCase();
  });

  $("saveEditBtn")?.addEventListener("click", () => {
    saveState();
    state.alert = { type:"success", msg:"Attendance list saved." };
    state.screen = "dashboard"; render();
  });

  $("addEditStudentBtn")?.addEventListener("click", addEditStudent);
  $("edit-student-input")?.addEventListener("keydown", e => e.key === "Enter" && addEditStudent());

  document.querySelectorAll("[data-remove]").forEach(btn => btn.addEventListener("click", e => {
    state.newSession.students.splice(parseInt(e.target.dataset.remove), 1); render();
  }));

  document.querySelectorAll("[data-toggle]").forEach(btn => btn.addEventListener("click", e => {
    const s = state.sessions[e.target.dataset.toggle];
    if(s) { s.active = !s.active; saveState(); render(); }
  }));

  document.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", e => {
    state.editingSession = state.sessions[e.target.dataset.edit];
    state.screen = "edit_session"; state.alert = null; render();
  }));

  document.querySelectorAll("[data-join]").forEach(card => card.addEventListener("click", e => {
    const code = e.currentTarget.dataset.join;
    state.checkinCode = code;
    state.selectedStudent = null;
    state.locationStatus = null;
    state.alert = null;
    state.screen = "student_checkin"; render();
  }));

  document.querySelectorAll("[data-select]").forEach(row => row.addEventListener("click", e => {
    const i = parseInt(e.currentTarget.dataset.select);
    const s = state.sessions[state.checkinCode];
    if(s?.students[i]?.present) return;
    state.selectedStudent = i; render();
  }));

  document.querySelectorAll("[data-mark]").forEach(row => row.addEventListener("click", e => {
    const i = parseInt(e.currentTarget.dataset.mark);
    if(state.editingSession) {
      state.editingSession.students[i].present = !state.editingSession.students[i].present;
      saveState(); render();
    }
  }));
}

// ─── ACTIONS ──────────────────────────────────────────────────────────────────
function doLogin() {
  const un = ($("un")?.value || "").trim();
  const pw = ($("pw")?.value || "").trim();
  const user = DB.users.find(u => u.username === un && u.password === pw);
  if(!user) { state.alert = { type:"danger", msg:"Invalid username or password." }; render(); return; }
  state.user = user;
  state.alert = null;
  localStorage.setItem("att_user", JSON.stringify(user));
  if(user.role === "student") {
    state.screen = "student_home";
  } else {
    state.screen = "dashboard";
  }
  render();
}

function $(id) { return document.getElementById(id); }

function joinByCode() {
  const code = ($("join-code-input")?.value || "").trim().toUpperCase();
  if(!code) { state.alert = { type:"danger", msg:"Please enter a session code." }; render(); return; }
  const s = state.sessions[code];
  if(!s) { state.alert = { type:"danger", msg:`No session found with code "${code}". Ask your lecturer to confirm.` }; render(); return; }
  if(!s.active) { state.alert = { type:"danger", msg:"This session is closed." }; render(); return; }
  state.checkinCode = code;
  state.selectedStudent = null;
  state.locationStatus = null;
  state.alert = null;
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
    state.editingSession.students.push({ name: inp.value.trim(), present: false });
    inp.value = ""; saveState(); render();
  }
}

function saveSession() {
  const title = ($("sess-title")?.value || state.newSession.title).trim();
  if(!title) { state.alert = { type:"danger", msg:"Please enter a session title." }; render(); return; }
  if(state.newSession.students.length === 0) { state.alert = { type:"danger", msg:"Add at least one student." }; render(); return; }
  const code = genCode();
  state.sessions[code] = {
    code, title,
    radius: state.newSession.radius,
    creatorId: state.user.id,
    creatorName: state.user.name,
    active: true,
    students: state.newSession.students.map(name => ({ name, present: false })),
    lat: null,
    lon: null,
  };
  // Capture lecturer's actual location as the classroom anchor
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      state.sessions[code].lat = pos.coords.latitude;
      state.sessions[code].lon = pos.coords.longitude;
      saveState();
    }, () => { saveState(); }, { enableHighAccuracy: true, timeout: 10000 });
  } else { saveState(); }

  state.alert = { type:"success", msg:`Session created! Share code: ${code}` };
  state.screen = "dashboard";
  saveState(); render();
}

function doMarkPresent() {
  const s = state.sessions[state.checkinCode];
  const i = state.selectedStudent;
  if(i === null || !s) return;

  if(!navigator.geolocation) {
    confirmPresent(s, i, "GPS not supported on this device — marked present.");
    return;
  }

  if(!s.lat || !s.lon) {
    confirmPresent(s, i, "No classroom location set — marked present (demo mode).");
    return;
  }

  state.locationStatus = { ok: null, msg: "📍 Getting your precise location, please wait..." };
  render();

  navigator.geolocation.getCurrentPosition(pos => {
    const studentLat = pos.coords.latitude;
    const studentLon = pos.coords.longitude;
    const accuracy = pos.coords.accuracy;
    const dist = calcDist(studentLat, studentLon, s.lat, s.lon);
    const distRounded = Math.round(dist);

    if(dist <= s.radius) {
      confirmPresent(s, i,
        `✅ Checked in! You are ${distRounded}m from the classroom (accuracy: ±${Math.round(accuracy)}m).`
      );
    } else {
      state.locationStatus = {
        ok: false,
        msg: `❌ You are ${distRounded}m away from the classroom. Must be within ${s.radius}m. (GPS accuracy: ±${Math.round(accuracy)}m)`
      };
      render();
    }
  },
  err => {
    const msgs = {
      1: "Location permission denied. Please allow location access in your browser settings.",
      2: "Location unavailable. Try moving to an open area.",
      3: "Location request timed out. Please try again.",
    };
    state.locationStatus = { ok: false, msg: msgs[err.code] || "Location error. Please try again." };
    render();
  },
  {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  });
}

function confirmPresent(s, i, msg) {
  s.students[i].present = true;
  state.locationStatus = { ok: true, msg };
  state.alert = { type:"success", msg };
  saveState(); render();
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
loadState();
render();
