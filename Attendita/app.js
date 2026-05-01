// ─── DATABASE ───────────────────────────────────────────────────────────────
const DB = {
  users: [
    { id: 2, username: "lecturer1",  password: "pass123", role: "lecturer",  name: "Dr. Emeka Obi" },
    { id: 3, username: "courserep1", password: "pass123", role: "courserep", name: "Davis (Course Rep)" },
    { id: 4, username: "courserep2", password: "pass123", role: "courserep", name: "Amaka (Course Rep)" },
    { id: 5, username: "student1",   password: "pass123", role: "student",   name: "Chidi Victor" },
    { id: 6, username: "student2",   password: "pass123", role: "student",   name: "Damian Egwuonwu" },
    { id: 7, username: "student3",   password: "pass123", role: "student",   name: "Chibuike Somtochukwu" },
    { id: 8, username: "student4",   password: "pass123", role: "student",   name: "Agubata Chidubem" },
    { id: 9, username: "student5",   password: "pass123", role: "student",   name: "Okechukwu Fortune" },
  ],
  sessions: {},
};


// ─── STATE ───────────────────────────────────────────────────────────────────
let state = {
  user: null,
  screen: "login",
  sessions: DB.sessions,
  alert: null,
  newSession: { title: "", radius: 100, students: [] },
  studentInput: "",
  checkinCode: null,
  selectedStudent: null,
  locationStatus: null,
  editingSession: null,
};


// ─── UTILITIES ───────────────────────────────────────────────────────────────
function genCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function calcDist(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function alertHtml() {
  if (!state.alert) return "";
  return `<div class="alert alert-${state.alert.type}">${state.alert.msg}</div>`;
}


// ─── RENDERER ────────────────────────────────────────────────────────────────
function render() {
  const app = document.getElementById("app");
  if (!app) return;
  const screens = {
    login:           renderLogin,
    dashboard:       renderDashboard,
    create_session:  renderCreateSession,
    student_checkin: renderStudentCheckin,
    edit_session:    renderEditSession,
  };
  app.innerHTML = `<div class="screen">${(screens[state.screen] || renderLogin)()}</div>`;
  bindEvents();
}


// ─── SCREENS ─────────────────────────────────────────────────────────────────
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
          <input id="un" type="text" placeholder="e.g. lecturer1" />
        </div>
        <div class="col">
          <label>Password</label>
          <input id="pw" type="password" placeholder="••••••••" />
        </div>
        <button class="btn btn-primary btn-full" id="loginBtn">Sign In</button>
      </div>
      <div class="hint-box">
        <strong>Demo accounts (all passwords: pass123)</strong>
        lecturer1 &bull; courserep1 &bull; courserep2 &bull; student1 to student5
      </div>
    </div>
  </div>`;
}

function renderDashboard() {
  const u = state.user;
  const sessions = Object.values(state.sessions);
  const mySessions = sessions.filter(s => s.creatorId === u.id);
  const roleColor = { lecturer: "amber", courserep: "green", student: "purple" }[u.role] || "blue";
  const roleLabel = { lecturer: "Lecturer", courserep: "Course Rep", student: "Student" }[u.role];

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
      ${renderAdminDash(mySessions)}
    </div>
  </div>`;
}

function renderAdminDash(mySessions) {
  const canCreate = state.user.role === "lecturer" || state.user.role === "courserep";
  return `
  <div class="row" style="justify-content:space-between;margin-bottom:1rem;">
    <div style="font-size:18px;font-weight:700;">My Sessions</div>
    ${canCreate
      ? `<button class="btn btn-primary btn-sm" id="createSessionBtn">+ New Session</button>`
      : `<span style="font-size:12px;color:#64748b;">View only</span>`
    }
  </div>
  ${mySessions.length === 0
    ? `<div class="empty card">No sessions yet. ${canCreate ? "Create one to get started." : "No sessions assigned to you."}</div>`
    : mySessions.map(s => `
      <div class="card session-card">
        <div class="row" style="justify-content:space-between;margin-bottom:6px;">
          <div>
            <span style="font-weight:700;">${s.title}</span>
            <span class="badge badge-blue" style="margin-left:6px;">${s.code}</span>
          </div>
          <div class="row" style="gap:6px;">
            ${canCreate ? `<button class="btn btn-sm" data-edit="${s.code}">Edit</button>` : ""}
            ${canCreate ? `<button class="btn btn-sm ${s.active ? "btn-danger" : ""}" data-toggle="${s.code}">${s.active ? "Close" : "Reopen"}</button>` : ""}
          </div>
        </div>
        <div class="session-meta">
          Radius: ${s.radius}m &bull;
          ${s.students.filter(st => st.present).length}/${s.students.length} present
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
          ${s.students.map(st => `
            <span class="chip" style="background:${st.present ? "#10b98120" : "#f59e0b20"};color:${st.present ? "#34d399" : "#fbbf24"};">
              ${st.name} ${st.present ? "✓" : "–"}
            </span>`).join("")}
        </div>
        <div class="session-link">
          Code: ${s.code} &bull;
          <button class="btn btn-sm" data-sim="${s.code}">Simulate Student View</button>
        </div>
      </div>`).join("")}`;
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
          <input id="student-input" type="text" placeholder="Type student name and press Add" style="flex:1;" />
          <button class="btn btn-sm" id="addStudentBtn">Add</button>
        </div>
        <div class="scroll-area">
          ${ns.students.length === 0
            ? `<div class="empty">No students added yet</div>`
            : ns.students.map((st, i) => `
              <div class="row" style="padding:7px 10px;border-radius:8px;border:1px solid #1e2d4a;margin-bottom:6px;justify-content:space-between;">
                <span style="font-size:13px;">${i + 1}. ${st}</span>
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
  if (!s) return "";
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
          <span style="font-weight:400;color:#64748b;font-size:12px;">(tap name to mark present/absent)</span>
        </div>
        <div class="scroll-area">
          ${s.students.map((st, i) => `
            <div class="student-row ${st.present ? "present" : ""}" data-mark="${i}">
              <span style="font-size:14px;">${i + 1}. ${st.name}</span>
              <span class="badge badge-${st.present ? "green" : "amber"}">${st.present ? "Present" : "Absent"}</span>
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

function renderStudentCheckin() {
  const s = state.sessions[state.checkinCode];
  if (!s) return `<div style="padding:2rem;text-align:center;color:#64748b;">Session not found.</div>`;
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
      <button class="btn btn-sm" id="backBtn">← Back</button>
    </div>
    <div class="main">
      <div style="font-size:13px;color:#64748b;margin-bottom:1rem;">
        Select your name from the list, then tap Mark Present.
      </div>
      ${alertHtml()}
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;">Select your name</div>
      <div class="scroll-area" style="margin-bottom:1rem;">
        ${s.students.map((st, i) => `
          <div class="student-row ${st.present ? "present" : sel === i ? "selected" : ""}" data-select="${i}">
            <span style="font-size:14px;">${i + 1}. ${st.name}</span>
            <span class="badge badge-${st.present ? "green" : "amber"}">${st.present ? "Present" : "Absent"}</span>
          </div>`).join("")}
      </div>
      ${loc ? `<div class="alert alert-${loc.ok ? "success" : "danger"}">${loc.msg}</div>` : ""}
      <div style="background:#0e1420;border-radius:8px;padding:10px;font-size:12px;color:#64748b;margin-bottom:1rem;">
        GPS radius: <strong style="color:#e2e8f0;">${s.radius}m</strong>. You must be within this range to check in.
      </div>
      <button class="btn btn-primary btn-full" id="markPresentBtn" ${sel === null || alreadyPresent ? "disabled" : ""}>
        ${alreadyPresent ? "✓ Already Marked Present" : "Mark Present"}
      </button>
    </div>
  </div>`;
}


// ─── EVENT BINDING ────────────────────────────────────────────────────────────
function bindEvents() {
  const $ = id => document.getElementById(id);

  // Auth
  $("loginBtn")?.addEventListener("click", doLogin);
  $("pw")?.addEventListener("keydown", e => e.key === "Enter" && doLogin());
  $("logoutBtn")?.addEventListener("click", () => {
    state = { ...state, user: null, screen: "login", alert: null };
    render();
  });

  // Navigation
  $("backBtn")?.addEventListener("click", () => {
    state.screen = "dashboard";
    state.alert = null;
    render();
  });
  $("createSessionBtn")?.addEventListener("click", () => {
    state.screen = "create_session";
    state.newSession = { title: "", radius: 100, students: [] };
    state.alert = null;
    render();
  });

  // Create session form
  $("sess-radius")?.addEventListener("input", e => {
    state.newSession.radius = parseInt(e.target.value);
    const rv = document.getElementById("radius-val");
    if (rv) rv.textContent = e.target.value + "m";
  });
  $("sess-title")?.addEventListener("input", e => state.newSession.title = e.target.value);
  $("student-input")?.addEventListener("keydown", e => e.key === "Enter" && addStudent());
  $("addStudentBtn")?.addEventListener("click", addStudent);
  $("saveSessionBtn")?.addEventListener("click", saveSession);

  // Edit session
  $("addEditStudentBtn")?.addEventListener("click", addEditStudent);
  $("edit-student-input")?.addEventListener("keydown", e => e.key === "Enter" && addEditStudent());
  $("saveEditBtn")?.addEventListener("click", () => {
    state.alert = { type: "success", msg: "Attendance list saved." };
    state.screen = "dashboard";
    render();
  });

  // Student check-in
  $("markPresentBtn")?.addEventListener("click", doMarkPresent);

  // Dynamic buttons
  document.querySelectorAll("[data-remove]").forEach(btn =>
    btn.addEventListener("click", e => {
      state.newSession.students.splice(parseInt(e.target.dataset.remove), 1);
      render();
    })
  );
  document.querySelectorAll("[data-toggle]").forEach(btn =>
    btn.addEventListener("click", e => {
      const s = state.sessions[e.target.dataset.toggle];
      if (s) s.active = !s.active;
      render();
    })
  );
  document.querySelectorAll("[data-sim]").forEach(btn =>
    btn.addEventListener("click", e => {
      state.checkinCode = e.target.dataset.sim;
      state.selectedStudent = null;
      state.locationStatus = null;
      state.alert = null;
      state.screen = "student_checkin";
      render();
    })
  );
  document.querySelectorAll("[data-edit]").forEach(btn =>
    btn.addEventListener("click", e => {
      state.editingSession = state.sessions[e.target.dataset.edit];
      state.screen = "edit_session";
      state.alert = null;
      render();
    })
  );
  document.querySelectorAll("[data-select]").forEach(row =>
    row.addEventListener("click", e => {
      const i = parseInt(e.currentTarget.dataset.select);
      const s = state.sessions[state.checkinCode];
      if (s.students[i].present) return;
      state.selectedStudent = i;
      render();
    })
  );
  document.querySelectorAll("[data-mark]").forEach(row =>
    row.addEventListener("click", e => {
      const i = parseInt(e.currentTarget.dataset.mark);
      if (state.editingSession) {
        state.editingSession.students[i].present = !state.editingSession.students[i].present;
        render();
      }
    })
  );
}


// ─── ACTIONS ─────────────────────────────────────────────────────────────────
function doLogin() {
  const un = (document.getElementById("un")?.value || "").trim();
  const pw = (document.getElementById("pw")?.value || "").trim();
  const user = DB.users.find(u => u.username === un && u.password === pw);
  if (!user) {
    state.alert = { type: "danger", msg: "Invalid username or password." };
    render();
    return;
  }
  state.user = user;
  state.alert = null;
  if (user.role === "student") {
    const open = Object.values(state.sessions).filter(s => s.active);
    if (open.length === 0) {
      state.alert = { type: "info", msg: "No active sessions right now. Check back later." };
      state.screen = "dashboard";
    } else {
      state.checkinCode = open[0].code;
      state.selectedStudent = null;
      state.locationStatus = null;
      state.screen = "student_checkin";
    }
  } else {
    state.screen = "dashboard";
  }
  render();
}

function addStudent() {
  const inp = document.getElementById("student-input");
  const name = inp?.value.trim();
  if (!name) return;
  state.newSession.students.push(name);
  inp.value = "";
  render();
}

function addEditStudent() {
  const inp = document.getElementById("edit-student-input");
  if (inp?.value.trim()) {
    state.editingSession.students.push({ name: inp.value.trim(), present: false });
    inp.value = "";
    render();
  }
}

function saveSession() {
  const title = (document.getElementById("sess-title")?.value || state.newSession.title).trim();
  if (!title) {
    state.alert = { type: "danger", msg: "Please enter a session title." };
    render();
    return;
  }
  if (state.newSession.students.length === 0) {
    state.alert = { type: "danger", msg: "Add at least one student." };
    render();
    return;
  }
  const code = genCode();
  state.sessions[code] = {
    code,
    title,
    radius: state.newSession.radius,
    creatorId: state.user.id,
    creatorName: state.user.name,
    active: true,
    students: state.newSession.students.map(name => ({ name, present: false })),
    lat: 6.5244 + (Math.random() - 0.5) * 0.001,
    lon: 3.3792 + (Math.random() - 0.5) * 0.001,
  };
  state.alert = { type: "success", msg: `Session created! Code: ${code}` };
  state.screen = "dashboard";
  render();
}

function doMarkPresent() {
  const s = state.sessions[state.checkinCode];
  const i = state.selectedStudent;
  if (i === null || !s) return;
  if (!navigator.geolocation) {
    confirmPresent(s, i, "GPS unavailable — marked present (demo).");
    return;
  }
  state.locationStatus = { ok: null, msg: "Getting your location..." };
  render();
  navigator.geolocation.getCurrentPosition(
    pos => {
      const dist = calcDist(pos.coords.latitude, pos.coords.longitude, s.lat, s.lon);
      if (dist <= s.radius) {
        confirmPresent(s, i, `Checked in! You are ${Math.round(dist)}m from the classroom.`);
      } else {
        state.locationStatus = { ok: false, msg: `You are ${Math.round(dist)}m away. Must be within ${s.radius}m.` };
        render();
      }
    },
    () => confirmPresent(s, i, "Location unavailable — marked present (demo mode).")
  );
}

function confirmPresent(s, i, msg) {
  s.students[i].present = true;
  state.locationStatus = { ok: true, msg };
  state.alert = { type: "success", msg };
  render();
}


// ─── INIT ─────────────────────────────────────────────────────────────────────
render();