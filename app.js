// LabSimplifier — Main Application Controller
// =============================================================================
// Comprehensive application logic including:
// - Cryptographic auth (SHA-256) with show/hide password toggle
// - Reliable forgot-password flow with verification
// - Full localStorage state lifecycle management
// - Bento grid reactivity and live search
// - Complete 7-step experiment workflow
// - Full-screen simulation integration
// - Dynamically editable observation table with recalculations
// - Event-driven interactive MCQ Quiz with Retry & Questions-Only mode
// - Real 3D flip card Viva examination prep
// - Step-by-step worked calculation overview
// =============================================================================

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Data Definitions & Catalogs
  // ---------------------------------------------------------------------------
  const LABS_CATALOG = [
    {
      id: "exp-11",
      code: "PH101-11",
      name: "Laser Light Diffraction",
      fullName: "Determination of Wavelength of Diode Laser using Diffraction Grating",
      tag: "Optics",
      tags: ["laser", "diffraction", "wavelength", "optics", "physics", "grating", "exp 11"],
      duration: "25 mins",
      ready: true,
      description: "Measure the wavelength of a 670 nm diode laser using transmission grating and verify with Bragg-style diffraction."
    },
    {
      id: "exp-12",
      code: "PH101-12",
      name: "Newton's Rings",
      fullName: "Determination of Radius of Curvature using Newton's Rings",
      tag: "Optics",
      tags: ["newton", "rings", "curvature", "optics", "interference"],
      duration: "30 mins",
      ready: false,
      description: "Form circular interference fringes using a plano-convex lens and optical flat to find the radius of curvature."
    },
    {
      id: "exp-13",
      code: "PH101-13",
      name: "Optical Fiber Numerical Aperture",
      fullName: "Measurement of Numerical Aperture & Acceptance Angle of Optical Fiber",
      tag: "Photonics",
      tags: ["fiber", "optical", "numerical aperture", "acceptance angle"],
      duration: "20 mins",
      ready: false,
      description: "Determine the light-gathering capacity and acceptance cone angle of a multimode optical fiber."
    },
    {
      id: "exp-14",
      code: "PH101-14",
      name: "Hall Effect",
      fullName: "Measurement of Hall Coefficient & Carrier Concentration",
      tag: "Solid State",
      tags: ["hall", "effect", "magnetic", "semiconductor", "carrier"],
      duration: "35 mins",
      ready: false,
      description: "Measure transverse Hall voltage under perpendicular magnetic field to identify semiconductor carrier type."
    },
    {
      id: "exp-15",
      code: "PH101-15",
      name: "Photoelectric Effect",
      fullName: "Determination of Planck's Constant using Photoelectric Effect",
      tag: "Quantum",
      tags: ["photoelectric", "planck", "stopping potential", "quantum"],
      duration: "25 mins",
      ready: false,
      description: "Verify Einstein's photoelectric equation and compute Planck's constant (h) by varying monochromatic filters."
    }
  ];

  const QUIZ_QUESTIONS = [
    {
      q: "What is the wavelength of the laser used (as per the manual)?",
      options: [
        "670 nm (6700 × 10⁻⁸ cm)",
        "450 nm",
        "532 nm",
        "1064 nm"
      ],
      correct: 0,
      explanation: "Standard diode lasers in university optics labs emit in the red region at 670 nm (6700 Å)."
    },
    {
      q: "Which relation gives λ in this experiment?",
      options: [
        "λ = sin φ / (N n)",
        "λ = N n / sin φ",
        "λ = N sin φ · n",
        "λ = D / Yₙ"
      ],
      correct: 0,
      explanation: "From grating equation (a + b) sin φ = n λ, with grating element (a + b) = 1/N, we get λ = sin φ / (N n)."
    },
    {
      q: "What does N represent?",
      options: [
        "Number of lines per cm of the grating",
        "Order of diffraction",
        "Distance to the wall",
        "Number of readings"
      ],
      correct: 0,
      explanation: "N is the ruling density, typically specified as 2500, 3000, or 4000 lines per centimeter."
    },
    {
      q: "Why is a laser preferred over an ordinary lamp?",
      options: [
        "It is monochromatic and coherent",
        "It is hotter",
        "It is brighter only",
        "It needs no power"
      ],
      correct: 0,
      explanation: "Monochromaticity and high spatial/temporal coherence give razor-sharp, distinct interference maxima."
    },
    {
      q: "If N increases, the angle of diffraction for the same order…",
      options: [
        "Increases",
        "Decreases",
        "Stays the same",
        "Becomes zero"
      ],
      correct: 0,
      explanation: "Since sin φ = n N λ, as N increases, sin φ increases, causing the diffraction angle φ to increase."
    },
    {
      q: "Which maximum is the brightest?",
      options: [
        "Central (zeroth order)",
        "First order",
        "Second order",
        "All equal"
      ],
      correct: 0,
      explanation: "The central zeroth-order beam (n = 0) has zero path difference and contains the maximum transmitted intensity."
    }
  ];

  const VIVA_QUESTIONS = [
    {
      q: "What is the aim of this experiment?",
      a: "To find the wavelength of laser light using a diffraction grating."
    },
    {
      q: "What is diffraction?",
      a: "The bending and spreading of light around obstacles or through narrow openings, comparable to its wavelength."
    },
    {
      q: "What is a diffraction grating?",
      a: "A plate with a large number of equally spaced parallel lines or slits (N lines per cm)."
    },
    {
      q: "State the grating equation.",
      a: "n λ = (a + b) sin φ, where (a + b) = 1/N is the grating element. So λ = sin φ / (N n)."
    },
    {
      q: "Why do we use a diode laser?",
      a: "It gives a narrow, intense, monochromatic and coherent beam, so sharp maxima are seen."
    },
    {
      q: "Why must the grating be normal to the beam?",
      a: "The grating equation assumes normal incidence. Tilting changes the path difference and gives wrong angles."
    },
    {
      q: "What is the central maximum?",
      a: "The bright spot straight ahead (n = 0) where all slits are in phase."
    },
    {
      q: "How are D and Yₙ measured?",
      a: "D with a thin rope between grating and wall, then read on a scale. Yₙ is measured on the wall with a scale."
    },
    {
      q: "Why repeat with different gratings?",
      a: "To get several independent readings of λ and reduce random error by averaging."
    },
    {
      q: "What limits the maximum order seen?",
      a: "sin φ cannot exceed 1, so n < 1/(Nλ)."
    }
  ];

  // ---------------------------------------------------------------------------
  // Cryptographic Helper Functions
  // ---------------------------------------------------------------------------
  async function sha256(message) {
    const text = String(message).trim();
    if (window.crypto && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    }
    // Fallback simple hash for older contexts (SHA-256 standard format)
    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    for (let i = 0; i < text.length; i++) {
      h0 = (h0 ^ text.charCodeAt(i)) * 0x5bd1e995;
      h1 = (h1 ^ text.charCodeAt(i)) * 0x27d4eb2f;
      h2 = (h2 ^ text.charCodeAt(i)) * 0x165667b1;
      h3 = (h3 ^ text.charCodeAt(i)) * 0xd3a2646c;
    }
    return [h0, h1, h2, h3].map(h => (h >>> 0).toString(16).padStart(8, "0")).join("") + "00000000000000000000000000000000";
  }

  // ---------------------------------------------------------------------------
  // State Management & Versioned Persistence
  // ---------------------------------------------------------------------------
  const STORAGE_KEYS = {
    VERSION: "ls_version",
    SESSION: "ls_session",
    USERS: "ls_users",
    PROGRESS: "ls_progress",
    THEME: "ls_theme"
  };

  const CURRENT_SCHEMA_VERSION = "1.2";

  function getDefaultProgress() {
    return {
      currentStep: 1, // 1 to 7
      readings: [],
      quizAnswers: {},
      quizScore: null,
      quizCompleted: false,
      vivaIndex: 0,
      experimentCompleted: false,
      completedAt: null,
      meanLambda: null,
      meanError: null
    };
  }

  // ---------------------------------------------------------------------------
  // API Base URL — points to Python server when running locally.
  // On Vercel (static deploy) the server is not available; app falls back to
  // localStorage automatically. Set this to your server URL when hosted.
  // ---------------------------------------------------------------------------
  const API_BASE = "http://127.0.0.1:5000/api";

  // Try calling the Python server; fall back silently if unavailable.
  async function apiCall(path, method = "GET", body = null) {
    try {
      const opts = {
        method,
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(4000),
      };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`${API_BASE}${path}`, opts);
      return await res.json();
    } catch (e) {
      // Server offline or CORS error — return null so caller uses localStorage
      return null;
    }
  }

  let AppState = {
    session: null, // { idHash, name, idLast4 }
    progress: getDefaultProgress(),
    currentView: "auth", // 'auth', 'home', 'labs', 'experiment', 'profile', 'support'
    authTab: "login",    // 'login', 'signup' (forgot is a small link, not a full tab)
    simController: null,
    quizQuestionsOnly: false,
    vivaFlipped: false,
    serverOnline: false  // set to true if /api/health responds
  };

  function loadState() {
    try {
      const ver = localStorage.getItem(STORAGE_KEYS.VERSION);
      if (ver !== CURRENT_SCHEMA_VERSION) {
        localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_SCHEMA_VERSION);
      }

      const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (savedSession) {
        AppState.session = JSON.parse(savedSession);
      }

      const savedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (savedProgress) {
        AppState.progress = Object.assign(getDefaultProgress(), JSON.parse(savedProgress));
      }
    } catch (e) {
      console.warn("Storage load fallback:", e);
      AppState.progress = getDefaultProgress();
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(AppState.progress));
    } catch (e) {
      console.error("Failed to save progress:", e);
    }
    // Also sync to Python server (non-blocking, best-effort)
    if (AppState.session && AppState.serverOnline) {
      apiCall("/progress/exp-11", "POST", {
        id_hash: AppState.session.idHash,
        progress: AppState.progress
      }).catch(() => {});
    }
  }

  function getUsersMap() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveUsersMap(map) {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(map));
    } catch (e) {
      console.error("Failed to save user map:", e);
    }
  }

  // ---------------------------------------------------------------------------
  // UI Toast System
  // ---------------------------------------------------------------------------
  function showToast(message, type = "info") {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "toast-error" : type === "success" ? "toast-success" : ""}`;

    const icon = type === "error" ? "⚠" : type === "success" ? "✓" : "ℹ";
    toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 320);
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ---------------------------------------------------------------------------
  // Theme Manager
  // ---------------------------------------------------------------------------
  function toggleTheme() {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, next);
    } catch (e) {}

    // Redraw sim canvases if active
    if (AppState.simController) {
      AppState.simController.draw();
    }
  }

  // ---------------------------------------------------------------------------
  // Routing & Navigation System
  // ---------------------------------------------------------------------------
  function showView(viewName, params = {}) {
    // If not authenticated and trying to access private views, redirect to auth
    if (!AppState.session && viewName !== "auth") {
      viewName = "auth";
    }

    // Clean up active simulation if leaving experiment step 3
    if (AppState.simController && (viewName !== "experiment" || AppState.progress.currentStep !== 3)) {
      AppState.simController.destroy();
      AppState.simController = null;
      document.body.classList.remove("sim-open");
    }

    AppState.currentView = viewName;
    const viewContainer = document.getElementById("view");
    const bottomNav = document.getElementById("bottom-nav");

    if (viewName === "auth") {
      document.body.classList.add("auth-mode");
      if (bottomNav) bottomNav.hidden = true;
      renderAuth(viewContainer);
      return;
    }

    document.body.classList.remove("auth-mode");
    if (bottomNav) {
      bottomNav.hidden = false;
      // Update nav active tab
      bottomNav.querySelectorAll("button").forEach(btn => {
        const navId = btn.getAttribute("data-nav");
        btn.classList.toggle("active", navId === viewName);
      });
    }

    window.scrollTo({ top: 0, behavior: "instant" });

    switch (viewName) {
      case "home":
        renderHome(viewContainer);
        break;
      case "labs":
        renderLabs(viewContainer);
        break;
      case "experiment":
        renderExperiment(viewContainer);
        break;
      case "profile":
        renderProfile(viewContainer);
        break;
      case "support":
        renderSupport(viewContainer);
        break;
      default:
        renderHome(viewContainer);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Auth View (Login / Sign-Up — Forgot password is a small inline link)
  // ---------------------------------------------------------------------------
  function renderAuth(container) {
    const tab = AppState.authTab; // 'login' | 'signup' | 'forgot'

    container.innerHTML = `
      <div class="auth-container">
        <div class="auth-header">
          <div class="brand-logo-icon">λ</div>
          <h1 class="brand-name">Lab<span>Simplifier</span></h1>
          <p class="text-muted" style="font-size:0.9rem; margin-top:4px;">B.Tech CSE Practical Lab Exam Portal</p>
        </div>

        <div class="auth-card">
          ${tab !== 'forgot' ? `
          <div class="auth-tabs" role="tablist">
            <button class="auth-tab-btn ${tab === 'login' ? 'active' : ''}" data-tab="login" role="tab">Log In</button>
            <button class="auth-tab-btn ${tab === 'signup' ? 'active' : ''}" data-tab="signup" role="tab">Sign Up</button>
          </div>` : `
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
            <button class="btn-ghost" id="forgot-back-btn" style="padding:4px 8px; font-size:0.85rem;">← Back to Log In</button>
            <span style="font-weight:700; font-size:1.05rem;">Reset Password</span>
          </div>`}

          <form id="auth-form" autocomplete="off">
            ${tab === 'signup' ? `
              <div class="form-group">
                <label class="form-label" for="auth-name">Full Name</label>
                <div class="input-wrapper">
                  <span class="input-icon">👤</span>
                  <input type="text" id="auth-name" class="form-control" placeholder="e.g. Raja Sekhar" required>
                </div>
              </div>
            ` : ''}

            <div class="form-group">
              <label class="form-label" for="auth-id">GITAM Registration ID</label>
              <div class="input-wrapper">
                <span class="input-icon">🆔</span>
                <input type="tel" id="auth-id" class="form-control" placeholder="10-11 digit numeric ID" maxlength="11" required>
              </div>
              <p class="form-helper">Enter your registered student roll number</p>
            </div>

            ${tab === 'forgot' ? `
              <div class="form-group">
                <label class="form-label" for="auth-name-verify">Name Used at Sign-Up</label>
                <div class="input-wrapper">
                  <span class="input-icon">👤</span>
                  <input type="text" id="auth-name-verify" class="form-control" placeholder="Full name registered on account" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="auth-password">New Password</label>
                <div class="input-wrapper">
                  <span class="input-icon">🔒</span>
                  <input type="password" id="auth-password" class="form-control has-toggle" placeholder="Minimum 6 characters" minlength="6" required>
                  <button type="button" class="btn-toggle-eye" aria-label="Toggle password visibility">👁</button>
                </div>
              </div>
            ` : `
              <div class="form-group">
                <label class="form-label" for="auth-password">Password</label>
                <div class="input-wrapper">
                  <span class="input-icon">🔒</span>
                  <input type="password" id="auth-password" class="form-control has-toggle" placeholder="Minimum 6 characters" minlength="6" required>
                  <button type="button" class="btn-toggle-eye" aria-label="Toggle password visibility">👁</button>
                </div>
              </div>
              ${tab === 'login' ? `<div style="text-align:right; margin:-4px 0 10px;">
                <button type="button" id="show-forgot-link" style="background:none;border:none;color:var(--acc2);font:0.82rem inherit;cursor:pointer;text-decoration:underline;padding:0;">Forgot password?</button>
              </div>` : ''}
            `}

            <button type="submit" class="btn btn-primary" style="width:100%; margin-top:8px;" id="auth-submit-btn">
              ${tab === 'login' ? 'Log In to Lab Bench' : tab === 'signup' ? 'Create Account & Start' : 'Reset Password'}
            </button>
          </form>

          <div class="auth-links">
            <button type="button" class="btn-ghost" style="padding:4px 8px; font-size:0.85rem;" id="toggle-theme-auth">🌓 Toggle Theme</button>
            <span class="text-muted" style="font-size:0.8rem;">GITAM CSE Portal</span>
          </div>
        </div>
      </div>
    `;

    // Bind Tab switching (only login / signup tabs)
    container.querySelectorAll(".auth-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        AppState.authTab = btn.getAttribute("data-tab");
        renderAuth(container);
      });
    });

    // "Forgot password?" small link inside login tab
    const forgotLink = container.querySelector("#show-forgot-link");
    if (forgotLink) {
      forgotLink.addEventListener("click", () => {
        AppState.authTab = "forgot";
        renderAuth(container);
      });
    }

    // Back button inside forgot form
    const forgotBackBtn = container.querySelector("#forgot-back-btn");
    if (forgotBackBtn) {
      forgotBackBtn.addEventListener("click", () => {
        AppState.authTab = "login";
        renderAuth(container);
      });
    }

    // Theme toggle button on auth
    const themeBtn = container.querySelector("#toggle-theme-auth");
    if (themeBtn) {
      themeBtn.addEventListener("click", toggleTheme);
    }

    // Password Show/Hide Toggle Button
    const eyeBtn = container.querySelector(".btn-toggle-eye");
    const pwdInput = container.querySelector("#auth-password");
    if (eyeBtn && pwdInput) {
      eyeBtn.addEventListener("click", () => {
        if (pwdInput.type === "password") {
          pwdInput.type = "text";
          eyeBtn.textContent = "🙈";
        } else {
          pwdInput.type = "password";
          eyeBtn.textContent = "👁";
        }
      });
    }

    // Auth Form Submission
    const form = container.querySelector("#auth-form");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = container.querySelector("#auth-submit-btn");
        submitBtn.disabled = true;

        const idInput = container.querySelector("#auth-id").value.trim();
        const pwd = pwdInput.value;

        // Validation for registration ID
        if (!/^\d{10,11}$/.test(idInput)) {
          showToast("Registration ID must be 10 or 11 numeric digits.", "error");
          submitBtn.disabled = false;
          return;
        }

        if (pwd.length < 6) {
          showToast("Password must be at least 6 characters.", "error");
          submitBtn.disabled = false;
          return;
        }

        try {
          const idHash = await sha256(idInput);
          const authList = window.AUTHORISED_IDS || [];

          // Verify if ID is authorized
          const isAuthorized = authList.includes(idHash);
          if (!isAuthorized) {
            showToast("Registration ID not recognized in authorised student list.", "error");
            submitBtn.disabled = false;
            return;
          }

          const users = getUsersMap();

          if (AppState.authTab === "signup") {
            const nameInput = container.querySelector("#auth-name").value.trim();
            if (nameInput.length < 2) {
              showToast("Please provide your full name.", "error");
              submitBtn.disabled = false;
              return;
            }

            if (users[idHash]) {
              showToast("Account already exists with this ID. Please Log In.", "error");
              AppState.authTab = "login";
              renderAuth(container);
              return;
            }

            // Create account in localStorage
            const passwordHash = await sha256(idInput + ":" + pwd);
            users[idHash] = {
              name: nameInput,
              passwordHash: passwordHash,
              createdAt: new Date().toISOString()
            };
            saveUsersMap(users);

            // Also try to register with Python server
            apiCall("/signup", "POST", {
              id_hash: idHash,
              full_name: nameInput,
              password_hash_client: passwordHash
            }).then(res => {
              if (res && res.success) AppState.serverOnline = true;
            });

            // Immediate redirect after account creation
            AppState.session = {
              idHash: idHash,
              name: nameInput,
              idLast4: idInput.slice(-4)
            };
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(AppState.session));
            showToast(`Welcome to LabSimplifier, ${nameInput}!`, "success");
            showView("home");
            return;

          } else if (AppState.authTab === "login") {
            const user = users[idHash];

            // Try Python server first
            const pwHashForServer = await sha256(idInput + ":" + pwd);
            const serverRes = await apiCall("/login", "POST", {
              id_hash: idHash,
              password_hash_client: pwHashForServer
            });

            if (serverRes && serverRes.success) {
              // Server auth succeeded — update local cache
              AppState.serverOnline = true;
              if (!users[idHash]) {
                users[idHash] = { name: serverRes.name, passwordHash: pwHashForServer };
                saveUsersMap(users);
              }
              AppState.session = { idHash, name: serverRes.name, idLast4: idInput.slice(-4) };
              localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(AppState.session));
              showToast(`Welcome back, ${serverRes.name}!`, "success");
              showView("home");
              return;
            }

            // Fall back to localStorage auth
            if (!user) {
              showToast("Account not found. Please Sign Up first.", "error");
              AppState.authTab = "signup";
              renderAuth(container);
              return;
            }

            const expectedHash = await sha256(idInput + ":" + pwd);
            if (expectedHash !== user.passwordHash) {
              showToast("Incorrect password. Please try again.", "error");
              submitBtn.disabled = false;
              return;
            }

            // Successful local login
            AppState.session = {
              idHash: idHash,
              name: user.name,
              idLast4: idInput.slice(-4)
            };
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(AppState.session));
            showToast(`Welcome back, ${user.name}!`, "success");
            showView("home");
            return;

          } else if (AppState.authTab === "forgot") {
            const nameVerify = container.querySelector("#auth-name-verify").value.trim();
            const user = users[idHash];
            const newPwHash = await sha256(idInput + ":" + pwd);

            // Try Python server for reset
            const serverRes = await apiCall("/reset-password", "POST", {
              id_hash: idHash,
              full_name: nameVerify,
              new_password_hash_client: newPwHash
            });

            if (serverRes && serverRes.success) {
              AppState.serverOnline = true;
              // Sync local storage too
              if (users[idHash]) {
                users[idHash].passwordHash = newPwHash;
                saveUsersMap(users);
              }
              showToast("Password reset. Log in.", "success");
              AppState.authTab = "login";
              renderAuth(container);
              return;
            }

            // Local fallback
            if (!user) {
              showToast("No account exists with this Registration ID.", "error");
              submitBtn.disabled = false;
              return;
            }

            if (user.name.toLowerCase() !== nameVerify.toLowerCase()) {
              showToast("Name does not match our registration records.", "error");
              submitBtn.disabled = false;
              return;
            }

            user.passwordHash = newPwHash;
            users[idHash] = user;
            saveUsersMap(users);

            showToast("Password reset. Log in.", "success");
            AppState.authTab = "login";
            renderAuth(container);
            return;
          }
        } catch (err) {
          console.error("Auth error:", err);
          showToast("Authentication error occurred. Please try again.", "error");
          submitBtn.disabled = false;
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Home View & Bento Grid
  // ---------------------------------------------------------------------------
  function renderHome(container) {
    const user = AppState.session || { name: "Student", idLast4: "0000" };
    const firstName = user.name ? user.name.split(" ")[0] : "Student";

    // Greeting logic
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    // Progress stats
    const p = AppState.progress;
    const isCompleted = p.experimentCompleted;
    const inProgress = p.currentStep > 1 && !isCompleted;
    const stepPct = Math.min(100, Math.round(((p.currentStep - 1) / 7) * 100));

    container.innerHTML = `
      <div class="top-bar">
        <div class="brand-wrapper">
          <div class="brand-logo-icon">λ</div>
          <div class="brand-name">Lab<span>Simplifier</span></div>
        </div>
        <div class="header-actions">
          <button class="btn btn-icon" id="theme-toggle-btn" aria-label="Toggle Dark Mode">🌓</button>
          <button class="btn btn-icon" id="profile-quick-btn" aria-label="View Profile">☺</button>
        </div>
      </div>

      <section class="greeting-section">
        <h1 class="greeting-text">${timeGreeting}, ${escapeHtml(firstName)}!</h1>
        <p class="greeting-subtitle">Your physics practical prep is ready. Let's get bench-ready.</p>
      </section>

      <!-- Live Search Bar -->
      <section class="search-container">
        <div class="search-input-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="lab-search-input" class="search-input" placeholder="Search experiments, apparatus, formulas...">
          <button id="search-clear" class="search-clear-btn" style="display:none;" aria-label="Clear search">✕</button>
        </div>
        <div id="search-results-box" class="search-results" style="display:none;"></div>
      </section>

      <!-- Bento Grid (Reactive to single source of truth) -->
      <section class="bento-grid">
        <!-- 1. Featured "For You" Recommended Card -->
        <div class="card bento-card bento-for-you bento-col-span-2">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="badge badge-acc">Recommended for Practical Exam</span>
              <span class="badge ${isCompleted ? 'badge-ready' : 'badge-indigo'}">${isCompleted ? '✓ Completed' : 'Exp 11'}</span>
            </div>
            <h2 class="bento-title" style="font-size:1.35rem; margin-top:12px;">Laser Light Diffraction</h2>
            <p class="bento-desc">Determination of Wavelength of Diode Laser using Transmission Grating (Exp 11). High-yield exam lab with 10 viva questions.</p>
            <div class="chip-group">
              <span class="chip">Diode Laser (670 nm)</span>
              <span class="chip">Grating (2500-4000 l/cm)</span>
              <span class="chip">Bragg Orders</span>
              <span class="chip">Viva Prep</span>
            </div>
          </div>
          <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center;">
            <span class="text-muted" style="font-size:0.85rem;">Approx. 20-25 mins</span>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              ${isCompleted ? `<button class="btn btn-outline" id="btn-practice-again-home" style="font-size:0.85rem; padding:8px 14px;">↺ Again</button>` : ''}
              <button class="btn btn-primary" id="btn-start-exp-11">
                ${isCompleted ? 'Review →' : inProgress ? 'Resume →' : 'Start →'}
              </button>
            </div>
          </div>
        </div>

        <!-- 2. "Continue" In-Progress Card -->
        <div class="card bento-card">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="badge badge-indigo">Progress Track</span>
              <span style="font-size:0.82rem; font-weight:700; color:var(--acc);">${isCompleted ? '100%' : stepPct + '%'}</span>
            </div>
            <h3 class="bento-title">${isCompleted ? 'Experiment 11 Completed' : inProgress ? 'Continue Experiment' : 'Bench Ready'}</h3>
            <p class="bento-desc">
              ${isCompleted
                ? `You completed all 7 steps including viva & quiz.`
                : inProgress
                  ? `Currently at Step ${p.currentStep} of 7 (${getStepTitle(p.currentStep)}).`
                  : `Start your first lab simulation to track completion.`
              }
            </p>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${isCompleted ? '100%' : inProgress ? stepPct + '%' : '10%'}"></div>
            </div>
          </div>
          <button class="btn btn-outline" style="width:100%; margin-top:12px;" id="btn-continue-card">
            ${isCompleted ? 'View Results & Calculation' : inProgress ? 'Continue →' : 'Launch Exp 11'}
          </button>
        </div>

        <!-- 3. "Recent" Activity Card -->
        <div class="card bento-card">
          <div>
            <span class="badge badge-ready">Recent Activity</span>
            <h3 class="bento-title">${isCompleted ? 'Exp 11: Laser Diffraction' : 'No Recent Runs'}</h3>
            <p class="bento-desc">
              ${isCompleted
                ? `Quiz Score: ${p.quizScore !== null ? p.quizScore + ' / 6' : 'Passed'} • Mean λ: ${p.meanLambda ? p.meanLambda + ' × 10⁻⁸ cm' : '668 × 10⁻⁸ cm'}`
                : 'Nothing yet. Complete your first experiment to see your calculated accuracy here.'}
            </p>
          </div>
          <div style="margin-top:10px;">
            ${isCompleted
              ? `<span class="badge badge-ready" style="font-size:0.75rem;">Verified Practical Result</span>`
              : `<span class="text-muted" style="font-size:0.8rem;">Ready for first attempt</span>`
            }
          </div>
        </div>

        <!-- 4. "Coming Soon" Experiments Card -->
        <div class="card bento-card bento-col-span-2">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="font-size:1.1rem; font-weight:700;">Upcoming Practical Labs</h3>
            <span class="badge badge-soon">Syllabus Expansion</span>
          </div>
          <div>
            ${LABS_CATALOG.filter(l => !l.ready).map(lab => `
              <div class="upcoming-item">
                <div>
                  <div style="font-weight:600; font-size:0.95rem;">${escapeHtml(lab.name)}</div>
                  <div class="text-muted" style="font-size:0.8rem;">${escapeHtml(lab.fullName)}</div>
                </div>
                <span class="badge badge-soon">Coming Soon</span>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;

    // Event Bindings
    container.querySelector("#theme-toggle-btn").addEventListener("click", toggleTheme);
    container.querySelector("#profile-quick-btn").addEventListener("click", () => showView("profile"));

    container.querySelector("#btn-start-exp-11").addEventListener("click", () => {
      showView("experiment");
    });

    container.querySelector("#btn-continue-card").addEventListener("click", () => {
      showView("experiment");
    });

    // "Practice Again" button on bento card (shown only when completed)
    const againBtn = container.querySelector("#btn-practice-again-home");
    if (againBtn) {
      againBtn.addEventListener("click", () => {
        if (confirm("Reset Experiment 11 and start fresh from Step 1?")) {
          AppState.progress = getDefaultProgress();
          saveProgress();
          if (AppState.session && AppState.serverOnline) {
            apiCall("/progress/exp-11/reset", "POST", { id_hash: AppState.session.idHash });
          }
          showToast("Progress reset. Ready to go again!", "info");
          showView("experiment");
        }
      });
    }

    // Live Search Logic
    const searchInput = container.querySelector("#lab-search-input");
    const clearBtn = container.querySelector("#search-clear");
    const resultsBox = container.querySelector("#search-results-box");

    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        clearBtn.style.display = "none";
        resultsBox.style.display = "none";
        return;
      }
      clearBtn.style.display = "block";

      const matched = LABS_CATALOG.filter(lab => {
        const inName = lab.name.toLowerCase().includes(q);
        const inFullName = lab.fullName.toLowerCase().includes(q);
        const inTags = lab.tags.some(t => t.toLowerCase().includes(q));
        return inName || inFullName || inTags;
      });

      if (matched.length === 0) {
        resultsBox.innerHTML = `<div style="padding:8px; text-align:center; color:var(--mut); font-size:0.9rem;">No matching experiments found for "${escapeHtml(q)}"</div>`;
        resultsBox.style.display = "block";
        return;
      }

      resultsBox.innerHTML = matched.map(lab => `
        <div class="search-item ${lab.ready ? '' : 'disabled'}" data-lab="${lab.id}">
          <div>
            <div style="font-weight:600; font-size:0.95rem;">${escapeHtml(lab.name)}</div>
            <div class="text-muted" style="font-size:0.8rem;">${escapeHtml(lab.code)} • ${escapeHtml(lab.tag)}</div>
          </div>
          <span class="badge ${lab.ready ? 'badge-ready' : 'badge-soon'}">${lab.ready ? 'Start' : 'Coming soon'}</span>
        </div>
      `).join('');
      resultsBox.style.display = "block";

      resultsBox.querySelectorAll(".search-item").forEach(item => {
        item.addEventListener("click", () => {
          const labId = item.getAttribute("data-lab");
          const targetLab = LABS_CATALOG.find(l => l.id === labId);
          if (targetLab && targetLab.ready) {
            showView("experiment");
          } else {
            showToast("This experiment is in development for next semester.", "info");
          }
        });
      });
    });

    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      clearBtn.style.display = "none";
      resultsBox.style.display = "none";
      searchInput.focus();
    });
  }

  function getStepTitle(step) {
    const titles = [
      "Intro & Aim",
      "Formula & Theory",
      "Simulation Lab",
      "Observation Table",
      "MCQ Quiz",
      "Viva Voce Prep",
      "Result & Overview"
    ];
    return titles[step - 1] || "Overview";
  }

  // ---------------------------------------------------------------------------
  // 3. Labs List View
  // ---------------------------------------------------------------------------
  function renderLabs(container) {
    container.innerHTML = `
      <div class="top-bar">
        <div class="brand-wrapper">
          <div class="brand-logo-icon">⚗</div>
          <div>
            <h2 style="font-size:1.2rem;">Physics Lab Practicals</h2>
            <p class="text-muted" style="font-size:0.8rem;">GITAM 1st Year Engineering Physics Manual</p>
          </div>
        </div>
        <button class="btn btn-icon" id="theme-toggle-labs">🌓</button>
      </div>

      <div style="display:flex; gap:8px; margin-bottom:18px; overflow-x:auto; padding-bottom:4px;">
        <span class="chip active">All Labs (${LABS_CATALOG.length})</span>
        <span class="chip">Optics & Lasers</span>
        <span class="chip">Solid State</span>
        <span class="chip">Fiber Optics</span>
      </div>

      <div style="display:flex; flex-direction:column; gap:16px;">
        ${LABS_CATALOG.map(lab => `
          <div class="card card-hover" style="display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <span class="badge ${lab.ready ? 'badge-ready' : 'badge-soon'}" style="margin-bottom:6px;">
                  ${lab.ready ? '● Ready for Practical' : 'Coming Soon'}
                </span>
                <h3 style="font-size:1.15rem; font-weight:700;">${escapeHtml(lab.name)}</h3>
                <p class="text-muted" style="font-size:0.88rem; margin-top:2px;">${escapeHtml(lab.fullName)}</p>
              </div>
              <span class="badge badge-indigo">${escapeHtml(lab.code)}</span>
            </div>
            <p style="font-size:0.9rem; color:var(--ink);">${escapeHtml(lab.description)}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
              <span class="text-muted" style="font-size:0.82rem;">Duration: ${escapeHtml(lab.duration)}</span>
              ${lab.ready ? `
                <button class="btn btn-primary" data-launch="${lab.id}">Launch Experiment →</button>
              ` : `
                <button class="btn btn-outline" disabled>Not Available</button>
              `}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector("#theme-toggle-labs").addEventListener("click", toggleTheme);
    container.querySelectorAll("button[data-launch]").forEach(btn => {
      btn.addEventListener("click", () => {
        showView("experiment");
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Experiment Workflow (7 Steps)
  // ---------------------------------------------------------------------------
  function renderExperiment(container) {
    const currentStep = AppState.progress.currentStep;

    container.innerHTML = `
      <div class="exp-header">
        <div class="exp-nav-top">
          <button class="btn btn-icon" id="exp-exit-btn" title="Return to Home" aria-label="Exit to Home">⌂</button>
          <div style="text-align:center;">
            <div class="step-label">Experiment 11 • Step ${currentStep} of 7</div>
            <h2 style="font-size:1.1rem; font-weight:800;">${getStepTitle(currentStep)}</h2>
          </div>
          <button class="btn btn-icon" id="exp-theme-btn" aria-label="Toggle Theme">🌓</button>
        </div>

        <div class="step-dots">
          ${[1, 2, 3, 4, 5, 6, 7].map(st => `
            <div class="step-dot ${st === currentStep ? 'active' : st < currentStep ? 'done' : ''}"></div>
          `).join('')}
        </div>
      </div>

      <!-- Step Content Container -->
      <div id="step-content-host"></div>

      <!-- Sticky Footer Navigation Bar -->
      <div class="exp-footer-nav" id="exp-footer-bar">
        <div id="gate-helper" class="gate-helper-text" style="display:none;"></div>
        <div class="exp-footer-buttons">
          <button class="btn btn-outline" id="exp-prev-btn" ${currentStep === 1 ? 'disabled' : ''}>← Previous</button>
          <button class="btn btn-primary" id="exp-next-btn">Next Step →</button>
        </div>
      </div>
    `;

    // Bind Header Controls
    container.querySelector("#exp-exit-btn").addEventListener("click", () => {
      showView("home");
    });
    container.querySelector("#exp-theme-btn").addEventListener("click", toggleTheme);

    const host = container.querySelector("#step-content-host");
    const prevBtn = container.querySelector("#exp-prev-btn");
    const nextBtn = container.querySelector("#exp-next-btn");
    const helperText = container.querySelector("#gate-helper");

    // Render active step
    switch (currentStep) {
      case 1:
        renderStep1Intro(host);
        break;
      case 2:
        renderStep2Formula(host);
        break;
      case 3:
        renderStep3Simulation(host, nextBtn, helperText);
        break;
      case 4:
        renderStep4Result(host);
        break;
      case 5:
        renderStep5Quiz(host, nextBtn, helperText);
        break;
      case 6:
        renderStep6Viva(host);
        break;
      case 7:
        renderStep7Overview(host, nextBtn);
        break;
    }

    // Step 3 3-reading gate check
    if (currentStep === 3) {
      const readings = AppState.progress.readings || [];
      if (readings.length < 3) {
        nextBtn.disabled = true;
        helperText.textContent = "Record 3 different readings to continue";
        helperText.style.display = "block";
      } else {
        nextBtn.disabled = false;
        helperText.style.display = "none";
      }
    }

    // Step 5 Quiz gate check
    if (currentStep === 5) {
      if (!AppState.progress.quizCompleted) {
        nextBtn.disabled = true;
        helperText.textContent = "Answer all 6 quiz questions to proceed";
        helperText.style.display = "block";
      } else {
        nextBtn.disabled = false;
        helperText.style.display = "none";
      }
    }

    // Bind Footer Navigation
    prevBtn.addEventListener("click", () => {
      if (AppState.progress.currentStep > 1) {
        AppState.progress.currentStep--;
        saveProgress();
        renderExperiment(container);
      }
    });

    nextBtn.addEventListener("click", () => {
      if (AppState.progress.currentStep < 7) {
        AppState.progress.currentStep++;
        saveProgress();
        renderExperiment(container);
      } else {
        showView("home");
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Step 1: Intro
  // ---------------------------------------------------------------------------
  function renderStep1Intro(host) {
    host.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <span class="badge badge-acc">Experiment 11</span>
        <h2 style="font-size:1.35rem; margin-top:8px; margin-bottom:12px;">Determination of Wavelength of Diode Laser using Diffraction Grating</h2>
        
        <div style="background:var(--card-subtle); padding:16px; border-radius:12px; border-left:4px solid var(--acc); margin-bottom:16px;">
          <h4 style="font-size:0.95rem; text-transform:uppercase; color:var(--mut); margin-bottom:4px;">Aim of Experiment</h4>
          <p style="font-weight:600; font-size:1.05rem;">To determine the wavelength of the given semiconductor diode laser light using a plane transmission diffraction grating.</p>
        </div>

        <h3 style="font-size:1.05rem; margin-top:20px; margin-bottom:8px;">Apparatus Required</h3>
        <p class="text-muted" style="font-size:0.88rem;">Verify the presence of all components on your optical table:</p>
        
        <div class="apparatus-grid">
          <div class="apparatus-card">
            <div class="apparatus-icon">🔴</div>
            <div>Diode laser</div>
          </div>
          <div class="apparatus-card">
            <div class="apparatus-icon">▦</div>
            <div>Diffraction grating</div>
          </div>
          <div class="apparatus-card">
            <div class="apparatus-icon">▭</div>
            <div>Screen/wall</div>
          </div>
          <div class="apparatus-card">
            <div class="apparatus-icon">📏</div>
            <div>Scale</div>
          </div>
          <div class="apparatus-card">
            <div class="apparatus-icon">➰</div>
            <div>Thin rope</div>
          </div>
        </div>

        <div style="margin-top:16px; font-size:0.9rem; line-height:1.6;">
          <p><strong>Practical Exam Note:</strong> The thin rope is used to accurately measure the distance <em>D</em> between the transmission grating and the wall along the optical bench line, which is then verified against the meter scale.</p>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Step 2: Formula & Theory
  // ---------------------------------------------------------------------------
  function renderStep2Formula(host) {
    host.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <span class="badge badge-indigo">Governing Physics</span>
        <h2 style="font-size:1.35rem; margin-top:8px; margin-bottom:16px;">Diffraction Grating Formula</h2>

        <div class="formula-hero">
          <div class="formula-main">λ = sin φ / (N · n)</div>
          <div class="formula-sub">sin φ = Yₙ / D</div>
        </div>

        <h3 style="font-size:1.05rem; margin-bottom:8px;">Symbols & Variable Table</h3>
        <div class="table-responsive" style="margin-bottom:16px;">
          <table class="symbols-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Physical Quantity</th>
                <th>Standard Unit</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong class="math-font" style="font-size:1.15rem;">λ</strong></td>
                <td>Wavelength of Laser Light</td>
                <td>cm (or Å / nm)</td>
                <td>Target wavelength to be calculated (expected ≈ 670 nm)</td>
              </tr>
              <tr>
                <td><strong class="math-font" style="font-size:1.15rem;">N</strong></td>
                <td>Grating Density</td>
                <td>lines / cm</td>
                <td>Number of parallel rulings per centimeter (e.g. 2500, 3000, 4000)</td>
              </tr>
              <tr>
                <td><strong class="math-font" style="font-size:1.15rem;">n</strong></td>
                <td>Diffraction Order</td>
                <td>dimensionless</td>
                <td>Integer spectral order (n = 1 for 1st order, n = 2 for 2nd order)</td>
              </tr>
              <tr>
                <td><strong class="math-font" style="font-size:1.15rem;">φ</strong></td>
                <td>Diffraction Angle</td>
                <td>degrees / radians</td>
                <td>Angle between central maximum and nth order maximum</td>
              </tr>
              <tr>
                <td><strong class="math-font" style="font-size:1.15rem;">D</strong></td>
                <td>Bench-to-Wall Distance</td>
                <td>cm</td>
                <td>Distance measured from diffraction grating surface to the wall</td>
              </tr>
              <tr>
                <td><strong class="math-font" style="font-size:1.15rem;">Yₙ</strong></td>
                <td>Spot Displacement</td>
                <td>cm</td>
                <td>Distance from central maximum (n = 0) to the nth order spot on wall</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Collapsible Derivation -->
        <div class="accordion" id="formula-accordion">
          <div class="accordion-header" id="accordion-toggle">
            <span>Why does this work? (Theory & Derivation)</span>
            <span id="accordion-arrow">▼</span>
          </div>
          <div class="accordion-body">
            <p>1. A transmission diffraction grating consists of an array of parallel equidistant transparent slits separated by opaque strips.</p>
            <p style="margin-top:8px;">2. Let <em>a</em> be the width of each slit and <em>b</em> the width of each opaque ruling. The grating element is defined as:</p>
            <p style="text-align:center; margin:8px 0; font-family:var(--font-math); font-size:1.2rem;">(a + b) = 1 / N</p>
            <p>3. For normal incident monochromatic beam of wavelength λ, the condition for principal maxima at diffraction angle φ is:</p>
            <p style="text-align:center; margin:8px 0; font-family:var(--font-math); font-size:1.2rem;">(a + b) sin φ = n λ</p>
            <p>4. Substituting (a + b) = 1/N gives:</p>
            <p style="text-align:center; margin:8px 0; font-family:var(--font-math); font-size:1.2rem;">(1 / N) sin φ = n λ &nbsp;⟹&nbsp; λ = sin φ / (N · n)</p>
            <p>5. In practical setup, since the screen distance <em>D</em> is very large compared to the spot separation <em>Yₙ</em>, the angle φ is small. Therefore:</p>
            <p style="text-align:center; margin:8px 0; font-family:var(--font-math); font-size:1.2rem;">sin φ ≈ tan φ = Yₙ / D</p>
          </div>
        </div>
      </div>
    `;

    // Accordion Toggle
    const acc = host.querySelector("#formula-accordion");
    const toggle = host.querySelector("#accordion-toggle");
    const arrow = host.querySelector("#accordion-arrow");
    toggle.addEventListener("click", () => {
      acc.classList.toggle("open");
      arrow.textContent = acc.classList.contains("open") ? "▲" : "▼";
    });
  }

  // ---------------------------------------------------------------------------
  // Step 3: Simulation (FULL-SCREEN MODE)
  // ---------------------------------------------------------------------------
  function renderStep3Simulation(host, nextBtn, helperText) {
    document.body.classList.add("sim-open");

    // Full screen overlay container
    host.innerHTML = `
      <div class="sim-fullscreen" id="sim-fullscreen-container">
        <!-- Top Sim Navigation Bar with Close Button -->
        <div class="sim-top-nav">
          <div class="sim-title-group">
            <span class="badge badge-acc">Full Screen Sim</span>
            <span class="sim-title">Exp 11: Laser Diffraction Bench</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button class="btn btn-outline" style="padding:6px 12px; font-size:0.85rem;" id="sim-exit-top-btn" title="Minimize Sim">✕ Close Sim</button>
          </div>
        </div>

        <div class="sim-workspace">
          <!-- Procedure Banner (User-Triggered Step Control) -->
          <div class="procedure-banner">
            <div>
              <div class="procedure-step-badge" id="proc-step-badge">Procedure Step 1 of 5</div>
              <div class="procedure-text" id="proc-step-text">Switch on the laser.</div>
            </div>
            <button class="btn btn-indigo" id="proc-next-btn">Next Step →</button>
          </div>

          <!-- Top Half: Optical Bench Canvas -->
          <div class="sim-canvas-card">
            <div class="sim-canvas-header">
              <span>TOP VIEW: Optical Bench Layout</span>
              <span id="bench-status-badge">Aligning components</span>
            </div>
            <div class="sim-canvas-wrapper">
              <canvas id="sim-bench-canvas" class="sim-canvas"></canvas>
            </div>
          </div>

          <!-- Bottom Half: Wall Screen View -->
          <div class="sim-canvas-card">
            <div class="sim-canvas-header">
              <span>WALL / SCREEN VIEW: Millimeter Ruler & Glowing Spot Pattern</span>
              <span style="color:var(--acc);">670 nm Diode Laser</span>
            </div>
            <div class="sim-wall-wrapper">
              <canvas id="sim-wall-canvas" class="sim-canvas"></canvas>
            </div>
          </div>

          <!-- Interactive Controls (Displayed prominently, active after step 5) -->
          <div class="sim-controls-panel" id="sim-controls-panel" style="opacity:0.75; pointer-events:none;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h3 style="font-size:1.05rem; font-weight:700;">Experiment Parameter Controls</h3>
              <span class="badge badge-indigo" id="sim-mode-badge">Unlocks after Procedure Step 5</span>
            </div>

            <div class="controls-grid">
              <!-- Grating N Selector -->
              <div class="control-item">
                <label class="control-label">
                  <span>Grating Density (N)</span>
                  <span class="control-val-badge" id="val-badge-n">2500 lines/cm</span>
                </label>
                <div class="segmented-control" id="control-n-group">
                  <button class="segmented-btn active" data-val="2500">2500</button>
                  <button class="segmented-btn" data-val="3000">3000</button>
                  <button class="segmented-btn" data-val="4000">4000</button>
                </div>
              </div>

              <!-- Distance D Slider -->
              <div class="control-item">
                <label class="control-label">
                  <span>Grating-to-Wall Distance (D)</span>
                  <span class="control-val-badge" id="val-badge-d">150 cm</span>
                </label>
                <input type="range" id="control-d-slider" class="slider-custom" min="100" max="300" step="5" value="150">
              </div>

              <!-- Order n Selector -->
              <div class="control-item">
                <label class="control-label">
                  <span>Diffraction Order (n)</span>
                  <span class="control-val-badge" id="val-badge-order">n = 1</span>
                </label>
                <div class="segmented-control" id="control-order-group">
                  <button class="segmented-btn active" data-val="1">n = 1</button>
                  <button class="segmented-btn" data-val="2">n = 2</button>
                </div>
              </div>
            </div>

            <!-- Live Physics Readout & Record Button -->
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-top:4px;">
              <div style="font-size:0.92rem; font-family:var(--font-mono);">
                <span>Current Spot Displacement Yₙ: <strong id="live-yn-val" style="color:var(--acc);">-- cm</strong></span>
                <span style="margin-left:14px; color:var(--mut);">sin φ: <strong id="live-sin-val">--</strong></span>
              </div>
              <button class="btn btn-primary" id="btn-record-reading" style="min-width:180px;">
                ● Record Reading
              </button>
            </div>
          </div>

          <!-- Recorded Readings Status Bar -->
          <div class="sim-readings-box">
            <div class="readings-counter" id="readings-counter-text">
              0 of 3 readings recorded
            </div>
            <div class="readings-chips-list" id="readings-chips-list">
              <!-- Dynamically rendered pills -->
            </div>
            <button class="btn btn-outline" id="sim-bottom-finish-btn" style="min-height:38px; padding:6px 14px; font-size:0.85rem;">
              Continue to Results →
            </button>
          </div>
        </div>
      </div>
    `;

    // Instantiate SimController
    const benchCanvas = host.querySelector("#sim-bench-canvas");
    const wallCanvas = host.querySelector("#sim-wall-canvas");
    const procStepBadge = host.querySelector("#proc-step-badge");
    const procStepText = host.querySelector("#proc-step-text");
    const procNextBtn = host.querySelector("#proc-next-btn");
    const controlsPanel = host.querySelector("#sim-controls-panel");
    const modeBadge = host.querySelector("#sim-mode-badge");
    const liveYn = host.querySelector("#live-yn-val");
    const liveSin = host.querySelector("#live-sin-val");
    const counterText = host.querySelector("#readings-counter-text");
    const chipsList = host.querySelector("#readings-chips-list");
    const recordBtn = host.querySelector("#btn-record-reading");
    const bottomFinishBtn = host.querySelector("#sim-bottom-finish-btn");

    const sim = new (window.SimController || SimController)();
    AppState.simController = sim;

    function updateSimUI(state) {
      if (state.procedureStep <= state.maxProcedureSteps) {
        procStepBadge.textContent = `Procedure Step ${state.procedureStep} of ${state.maxProcedureSteps}`;
        procStepText.textContent = state.stepDescription;
        procNextBtn.textContent = state.procedureStep === state.maxProcedureSteps ? "Start Measuring →" : "Next Step →";
        controlsPanel.style.opacity = "0.75";
        controlsPanel.style.pointerEvents = "none";
        modeBadge.textContent = "Unlocks after Step 5";
      } else {
        procStepBadge.textContent = "Interactive Mode";
        procStepText.textContent = "Vary N, D, or n, and record at least 3 distinct readings for your table.";
        procNextBtn.style.display = "none";
        controlsPanel.style.opacity = "1";
        controlsPanel.style.pointerEvents = "auto";
        modeBadge.textContent = "Controls Active";
      }

      // Physics readout
      if (state.physics) {
        liveYn.textContent = `${state.physics.Yn} cm`;
        liveSin.textContent = state.physics.sinPhi;
      } else {
        liveYn.textContent = "Not formed";
        liveSin.textContent = "≥ 1.0";
      }

      // Readings Counter & Gate
      const count = state.readingsCount;
      counterText.textContent = `${count} of 3 readings recorded`;
      AppState.progress.readings = sim.getReadings();
      saveProgress();

      // Render pills
      const readings = sim.getReadings();
      chipsList.innerHTML = readings.map((r, i) => `
        <span class="reading-pill">#${r.sNo}: N=${r.N}, D=${r.D}cm, n=${r.n} ➔ Y=${r.Yn}cm</span>
      `).join('');

      if (count >= 3) {
        nextBtn.disabled = false;
        helperText.style.display = "none";
        counterText.style.color = "var(--ok)";
        bottomFinishBtn.classList.remove("btn-outline");
        bottomFinishBtn.classList.add("btn-primary");
      } else {
        nextBtn.disabled = true;
        helperText.textContent = "Record 3 different readings to continue";
        helperText.style.display = "block";
        counterText.style.color = "var(--ink)";
      }
    }

    sim.init({
      benchCanvas: benchCanvas,
      wallCanvas: wallCanvas,
      existingReadings: AppState.progress.readings || [],
      onUpdate: updateSimUI
    });

    updateSimUI(sim.getState());

    // Procedure Next Step Button (User-Triggered)
    procNextBtn.addEventListener("click", () => {
      sim.nextStep();
    });

    // Grating Buttons
    host.querySelectorAll("#control-n-group .segmented-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        host.querySelectorAll("#control-n-group .segmented-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const val = btn.getAttribute("data-val");
        host.querySelector("#val-badge-n").textContent = `${val} lines/cm`;
        sim.setGrating(val);
      });
    });

    // Distance Slider
    const dSlider = host.querySelector("#control-d-slider");
    dSlider.addEventListener("input", (e) => {
      const val = e.target.value;
      host.querySelector("#val-badge-d").textContent = `${val} cm`;
      sim.setDistance(val);
    });

    // Order Buttons
    host.querySelectorAll("#control-order-group .segmented-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        host.querySelectorAll("#control-order-group .segmented-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const val = btn.getAttribute("data-val");
        host.querySelector("#val-badge-order").textContent = `n = ${val}`;
        sim.setOrder(val);
      });
    });

    // Record Reading Button
    recordBtn.addEventListener("click", () => {
      const res = sim.recordReading();
      if (!res.success) {
        showToast(res.reason, "error");
      } else {
        showToast(`Reading #${res.count} recorded successfully!`, "success");
      }
    });

    // Close Sim button top
    const exitTopBtn = host.querySelector("#sim-exit-top-btn");
    exitTopBtn.addEventListener("click", () => {
      document.body.classList.remove("sim-open");
      // Advance or refresh experiment view
      renderExperiment(document.getElementById("view"));
    });

    bottomFinishBtn.addEventListener("click", () => {
      if (sim.getReadings().length < 3) {
        showToast("Please record at least 3 distinct readings to proceed.", "error");
        return;
      }
      document.body.classList.remove("sim-open");
      AppState.progress.currentStep = 4;
      saveProgress();
      renderExperiment(document.getElementById("view"));
    });

    // Resize listener for responsive canvas
    const onResize = () => {
      if (AppState.simController) {
        AppState.simController.resizeCanvases();
      }
    };
    window.addEventListener("resize", onResize);
  }

  // ---------------------------------------------------------------------------
  // Step 4: Result & Observation Table (Editable Inputs)
  // ---------------------------------------------------------------------------
  function renderStep4Result(host) {
    let readings = AppState.progress.readings || [];

    // Fallback standard readings if student navigated directly
    if (readings.length === 0) {
      readings = [
        { sNo: 1, N: 2500, D: 150, n: 1, Yn: 25.4, sinPhi: 0.1672, lambda: 6688.0, lambdaCm: 6.688e-5, percentError: 0.18 },
        { sNo: 2, N: 3000, D: 160, n: 1, Yn: 32.6, sinPhi: 0.2001, lambda: 6670.0, lambdaCm: 6.670e-5, percentError: 0.45 },
        { sNo: 3, N: 4000, D: 140, n: 1, Yn: 38.3, sinPhi: 0.2641, lambda: 6602.5, lambdaCm: 6.6025e-5, percentError: 1.45 }
      ];
      AppState.progress.readings = readings;
      saveProgress();
    }

    function recalculateRow(r) {
      const D = Number(r.D);
      const Yn = Number(r.Yn);
      const N = Number(r.N);
      const n = Number(r.n);

      if (D <= 0 || Yn <= 0 || N <= 0 || n <= 0) return r;

      const sinPhi = Yn / Math.sqrt(D * D + Yn * Yn);
      const lambdaCm = sinPhi / (N * n);
      const lambdaAngstrom = lambdaCm * 1e8;
      const actual = 6.7e-5;
      const percentError = Math.abs((lambdaCm - actual) / actual) * 100;

      r.sinPhi = parseFloat(sinPhi.toFixed(4));
      r.lambda = parseFloat(lambdaAngstrom.toFixed(1));
      r.lambdaCm = lambdaCm;
      r.percentError = parseFloat(percentError.toFixed(2));
      return r;
    }

    function getSummary(readingsArr) {
      const valid = readingsArr.filter(r => r.lambdaCm > 0);
      if (valid.length === 0) return { meanLambda: "0.00", meanNm: "0.0", meanError: "0.00" };
      const sumLambda = valid.reduce((acc, r) => acc + r.lambdaCm, 0);
      const mean = sumLambda / valid.length;
      const actual = 6.7e-5;
      const meanError = Math.abs((mean - actual) / actual) * 100;

      return {
        meanLambda: (mean * 1e5).toFixed(3), // e.g. 6.685 x 10^-5 cm
        meanAngstrom: (mean * 1e8).toFixed(1), // e.g. 6685 Å
        meanNm: (mean * 1e7).toFixed(1),      // e.g. 668.5 nm
        meanError: meanError.toFixed(2)
      };
    }

    function renderTableHTML() {
      const summary = getSummary(readings);
      AppState.progress.meanLambda = summary.meanAngstrom;
      AppState.progress.meanError = summary.meanError;
      saveProgress();

      return `
        <div class="card" style="margin-bottom:16px;">
          <span class="badge badge-acc">Observation Data</span>
          <h2 style="font-size:1.35rem; margin-top:8px; margin-bottom:12px;">Observation Table</h2>
          <p class="text-muted" style="font-size:0.88rem; margin-bottom:16px;">
            The values of <strong>D</strong> and <strong>Yₙ</strong> are directly editable below. The table dynamically recalculates sin φ, λ, and % error upon editing.
          </p>

          <div class="table-responsive">
            <table class="obs-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>N (lines/cm)</th>
                  <th>n</th>
                  <th>D (cm) [Edit]</th>
                  <th>Yₙ (cm) [Edit]</th>
                  <th>sin φ</th>
                  <th>λ (× 10⁻⁸ cm)</th>
                  <th>% Error</th>
                </tr>
              </thead>
              <tbody>
                ${readings.map((r, i) => `
                  <tr>
                    <td>${r.sNo}</td>
                    <td>${r.N}</td>
                    <td>${r.n}</td>
                    <td>
                      <input type="number" class="obs-input d-input" data-index="${i}" value="${r.D}" step="1" min="50" max="400">
                    </td>
                    <td>
                      <input type="number" class="obs-input yn-input" data-index="${i}" value="${r.Yn}" step="0.1" min="1" max="150">
                    </td>
                    <td>${r.sinPhi}</td>
                    <td><strong>${r.lambda}</strong></td>
                    <td style="color:${r.percentError < 3 ? 'var(--ok)' : 'var(--warn)'};">${r.percentError}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Mean Summary Card -->
          <div class="result-summary-card">
            <h3 style="font-size:1.15rem; margin-bottom:12px;">Experimental Mean Result</h3>
            <div class="result-val-row">
              <span class="text-muted">Mean Calculated Wavelength (λ):</span>
              <strong style="font-family:var(--font-math); font-size:1.15rem; color:var(--acc);">
                ${summary.meanLambda} × 10⁻⁵ cm (${summary.meanNm} nm / ${summary.meanAngstrom} Å)
              </strong>
            </div>
            <div class="result-val-row">
              <span class="text-muted">Standard Diode Laser Value:</span>
              <strong style="font-family:var(--font-math); font-size:1.05rem;">
                6.700 × 10⁻⁵ cm (670.0 nm / 6700 Å)
              </strong>
            </div>
            <div class="result-val-row">
              <span class="text-muted">Percentage Experimental Error:</span>
              <strong style="color:var(--ok); font-size:1.05rem;">
                ${summary.meanError}%
              </strong>
            </div>
          </div>

          <div style="background:var(--card-subtle); border-radius:12px; padding:14px; font-size:0.86rem; border:1px solid var(--line);">
            <strong>Note on Small-Angle Approximation:</strong>
            Since the distance to the wall <em>D</em> (≈ 150 cm) is substantially larger than spot displacement <em>Yₙ</em> (≈ 25-40 cm), sin φ is computed using the exact triangle relation <code>sin φ = Yₙ / √(D² + Yₙ²)</code>, which smoothly aligns with the small angle assumption <code>sin φ ≈ Yₙ / D</code>.
          </div>
        </div>
      `;
    }

    host.innerHTML = renderTableHTML();

    function bindTableEvents() {
      host.querySelectorAll(".d-input").forEach(input => {
        input.addEventListener("change", (e) => {
          const idx = parseInt(e.target.getAttribute("data-index"), 10);
          const val = parseFloat(e.target.value);
          if (val > 0) {
            readings[idx].D = val;
            recalculateRow(readings[idx]);
            host.innerHTML = renderTableHTML();
            bindTableEvents();
          }
        });
      });

      host.querySelectorAll(".yn-input").forEach(input => {
        input.addEventListener("change", (e) => {
          const idx = parseInt(e.target.getAttribute("data-index"), 10);
          const val = parseFloat(e.target.value);
          if (val > 0) {
            readings[idx].Yn = val;
            recalculateRow(readings[idx]);
            host.innerHTML = renderTableHTML();
            bindTableEvents();
          }
        });
      });
    }

    bindTableEvents();
  }

  // ---------------------------------------------------------------------------
  // Step 5: Quiz (Clickable Options, Retry Mechanism, Questions-Only Mode)
  // ---------------------------------------------------------------------------
  function renderStep5Quiz(host, nextBtn, helperText) {
    const isQuestionsOnly = AppState.quizQuestionsOnly;
    const userAnswers = AppState.progress.quizAnswers || {};

    let answeredCount = Object.keys(userAnswers).length;
    let correctCount = 0;
    QUIZ_QUESTIONS.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct) correctCount++;
    });

    const isFinished = answeredCount === QUIZ_QUESTIONS.length;
    AppState.progress.quizScore = isFinished ? correctCount : AppState.progress.quizScore;
    AppState.progress.quizCompleted = isFinished;
    saveProgress();

    if (isFinished) {
      nextBtn.disabled = false;
      helperText.style.display = "none";
    }

    host.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <div class="quiz-header">
          <div>
            <span class="badge badge-acc">Assessment</span>
            <h2 style="font-size:1.35rem; margin-top:4px;">Practical Exam MCQ Quiz</h2>
          </div>
          <button class="chip ${isQuestionsOnly ? 'active' : ''}" id="btn-toggle-quiz-mode">
            ${isQuestionsOnly ? '✓ Questions Only Mode' : 'Switch to Questions Only'}
          </button>
        </div>
        <p class="text-muted" style="font-size:0.88rem; margin-bottom:18px;">
          ${isQuestionsOnly
            ? 'Flashcard review mode: read each question and expand to reveal the answer.'
            : 'Answer all 6 multiple choice questions. Tap an option to submit your answer.'}
        </p>

        <!-- Quiz List -->
        <div id="quiz-list-container">
          ${QUIZ_QUESTIONS.map((item, qIdx) => {
            const chosen = userAnswers[qIdx];
            const isAnswered = chosen !== undefined;

            if (isQuestionsOnly) {
              return `
                <div class="quiz-card">
                  <div class="quiz-q-num">Question ${qIdx + 1} of ${QUIZ_QUESTIONS.length}</div>
                  <div class="quiz-q-text">${escapeHtml(item.q)}</div>
                  <details style="margin-top:10px; cursor:pointer;">
                    <summary style="font-weight:600; color:var(--acc2);">Reveal Correct Answer</summary>
                    <div style="background:var(--ok-bg); padding:12px; border-radius:10px; margin-top:8px; border:1px solid var(--ok);">
                      <strong>Answer:</strong> ${escapeHtml(item.options[item.correct])}
                      <p style="margin-top:4px; font-size:0.85rem; color:var(--ink);">${escapeHtml(item.explanation)}</p>
                    </div>
                  </details>
                </div>
              `;
            }

            return `
              <div class="quiz-card" data-q-index="${qIdx}">
                <div class="quiz-q-num">Question ${qIdx + 1} of ${QUIZ_QUESTIONS.length}</div>
                <div class="quiz-q-text">${escapeHtml(item.q)}</div>

                <div class="quiz-options-list">
                  ${item.options.map((opt, optIdx) => {
                    let optClass = "quiz-option";
                    if (isAnswered) {
                      if (optIdx === item.correct) {
                        optClass += " correct";
                      } else if (optIdx === chosen) {
                        optClass += " incorrect";
                      }
                    }

                    return `
                      <button class="${optClass}" data-q="${qIdx}" data-opt="${optIdx}" ${isAnswered ? 'disabled' : ''}>
                        <span>${escapeHtml(opt)}</span>
                        ${isAnswered && optIdx === item.correct ? '<span>✓</span>' : ''}
                        ${isAnswered && optIdx === chosen && chosen !== item.correct ? '<span>✕</span>' : ''}
                      </button>
                    `;
                  }).join('')}
                </div>

                ${isAnswered ? `
                  <div style="margin-top:12px; padding:10px 14px; border-radius:10px; font-size:0.85rem; background:var(--card-subtle); border-left:3px solid var(--acc2);">
                    <strong>Explanation:</strong> ${escapeHtml(item.explanation)}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Completion & Retry Banner -->
        ${isFinished ? `
          <div class="quiz-score-banner">
            <h3 style="font-size:1.25rem;">Quiz Complete! 🎉</h3>
            <p style="font-size:1.1rem; font-weight:700; color:var(--acc); margin:8px 0;">
              Your Score: ${correctCount} / ${QUIZ_QUESTIONS.length} (${Math.round((correctCount / QUIZ_QUESTIONS.length) * 100)}%)
            </p>
            <p class="text-muted" style="font-size:0.9rem; margin-bottom:16px;">
              ${correctCount === 6 ? 'Outstanding! You have mastered the optical theory.' : 'Good effort! Review the viva cards next to strengthen key concepts.'}
            </p>
            <div style="display:flex; justify-content:center; gap:12px;">
              <button class="btn btn-outline" id="btn-retry-quiz">🔄 Retry Quiz</button>
              <button class="btn btn-primary" id="btn-quiz-proceed">Proceed to Viva →</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Mode Toggle Button
    const toggleBtn = host.querySelector("#btn-toggle-quiz-mode");
    toggleBtn.addEventListener("click", () => {
      AppState.quizQuestionsOnly = !AppState.quizQuestionsOnly;
      renderStep5Quiz(host, nextBtn, helperText);
    });

    // CRITICAL FIX: Interactive Quiz Options Event Listeners
    host.querySelectorAll(".quiz-option").forEach(btn => {
      btn.addEventListener("click", () => {
        const qIdx = parseInt(btn.getAttribute("data-q"), 10);
        const optIdx = parseInt(btn.getAttribute("data-opt"), 10);

        if (AppState.progress.quizAnswers[qIdx] !== undefined) return; // already answered

        AppState.progress.quizAnswers[qIdx] = optIdx;
        saveProgress();
        renderStep5Quiz(host, nextBtn, helperText);
      });
    });

    // Retry Quiz Button
    const retryBtn = host.querySelector("#btn-retry-quiz");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        AppState.progress.quizAnswers = {};
        AppState.progress.quizScore = null;
        AppState.progress.quizCompleted = false;
        saveProgress();
        renderStep5Quiz(host, nextBtn, helperText);
      });
    }

    const proceedBtn = host.querySelector("#btn-quiz-proceed");
    if (proceedBtn) {
      proceedBtn.addEventListener("click", () => {
        AppState.progress.currentStep = 6;
        saveProgress();
        renderExperiment(document.getElementById("view"));
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Step 6: Viva 3D Flip Card System
  // ---------------------------------------------------------------------------
  function renderStep6Viva(host) {
    let activeIdx = AppState.progress.vivaIndex || 0;
    if (activeIdx < 0 || activeIdx >= VIVA_QUESTIONS.length) activeIdx = 0;

    const currentQ = VIVA_QUESTIONS[activeIdx];
    let isFlipped = AppState.vivaFlipped || false;

    host.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <span class="badge badge-indigo">Oral Exam Preparation</span>
        <h2 style="font-size:1.35rem; margin-top:8px; margin-bottom:6px;">External Viva Voce Examination</h2>
        <p class="text-muted" style="font-size:0.88rem; margin-bottom:20px;">
          Tap the 3D card below to flip between the examiner's question and model answer.
        </p>

        <div class="viva-section">
          <!-- Meta Navigation Row -->
          <div class="viva-meta">
            <span class="viva-badge">Question ${activeIdx + 1} of ${VIVA_QUESTIONS.length}</span>
            <span class="text-muted" style="font-size:0.82rem;">Tap card to flip ↻</span>
          </div>

          <!-- Real 3D Flip Card Container -->
          <div class="flip-card ${isFlipped ? 'flipped' : ''}" id="viva-interactive-card" role="button" aria-label="Viva Question Card">
            <div class="flip-card-inner">
              <!-- Front Side: Question -->
              <div class="flip-card-front">
                <div class="viva-badge">Question ${activeIdx + 1}</div>
                <div class="viva-q-text">"${escapeHtml(currentQ.q)}"</div>
                <div class="viva-hint">
                  <span>💡</span> Tap anywhere on card to reveal model answer
                </div>
              </div>

              <!-- Back Side: Answer -->
              <div class="flip-card-back">
                <div class="viva-badge" style="color:var(--acc2);">Model Viva Answer</div>
                <div class="viva-a-text">${escapeHtml(currentQ.a)}</div>
                <div class="viva-hint" style="color:var(--acc2);">
                  <span>✓</span> Standard answer accepted by external examiners
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Navigation Controls -->
          <div class="viva-nav-controls">
            <button class="btn btn-outline" id="viva-prev-btn" ${activeIdx === 0 ? 'disabled' : ''}>← Prev</button>
            <button class="btn btn-indigo" id="viva-flip-btn">Flip Card ↻</button>
            <button class="btn btn-outline" id="viva-next-btn" ${activeIdx === VIVA_QUESTIONS.length - 1 ? 'disabled' : ''}>Next →</button>
          </div>

          <!-- Direct Question Number Jump Pills -->
          <div class="viva-pills-row">
            ${VIVA_QUESTIONS.map((_, i) => `
              <button class="viva-pill ${i === activeIdx ? 'active' : ''}" data-idx="${i}">Q${i + 1}</button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // 3D Flip Event
    const cardEl = host.querySelector("#viva-interactive-card");
    const flipBtn = host.querySelector("#viva-flip-btn");

    function doFlip() {
      isFlipped = !isFlipped;
      AppState.vivaFlipped = isFlipped;
      cardEl.classList.toggle("flipped", isFlipped);
    }

    cardEl.addEventListener("click", doFlip);
    flipBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      doFlip();
    });

    // Prev / Next Navigation
    host.querySelector("#viva-prev-btn").addEventListener("click", () => {
      if (activeIdx > 0) {
        AppState.progress.vivaIndex = activeIdx - 1;
        AppState.vivaFlipped = false;
        saveProgress();
        renderStep6Viva(host);
      }
    });

    host.querySelector("#viva-next-btn").addEventListener("click", () => {
      if (activeIdx < VIVA_QUESTIONS.length - 1) {
        AppState.progress.vivaIndex = activeIdx + 1;
        AppState.vivaFlipped = false;
        saveProgress();
        renderStep6Viva(host);
      }
    });

    // Jump pills
    host.querySelectorAll(".viva-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        const idx = parseInt(pill.getAttribute("data-idx"), 10);
        AppState.progress.vivaIndex = idx;
        AppState.vivaFlipped = false;
        saveProgress();
        renderStep6Viva(host);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Step 7: Overview & Celebration
  // ---------------------------------------------------------------------------
  function renderStep7Overview(host, nextBtn) {
    // Mark experiment as completed
    AppState.progress.experimentCompleted = true;
    AppState.progress.completedAt = new Date().toISOString();
    saveProgress();

    if (nextBtn) {
      nextBtn.textContent = "Finish & Return Home ⌂";
    }

    const readings = AppState.progress.readings || [];
    const r1 = readings[0] || { N: 2500, D: 150, n: 1, Yn: 25.4, sinPhi: 0.1672, lambda: 6688.0 };

    const meanLambdaVal = AppState.progress.meanLambda || "6680.0";
    const meanErrorVal = AppState.progress.meanError || "0.30";
    const quizScore = AppState.progress.quizScore !== null ? `${AppState.progress.quizScore} / 6` : "6 / 6";

    host.innerHTML = `
      <div class="celebrate-card">
        <div class="celebrate-emoji">🎉</div>
        <h2 style="font-size:1.6rem; font-weight:800; margin-bottom:6px;">Great job, you completed the experiment!</h2>
        <p class="text-muted" style="font-size:0.95rem; max-width:520px; margin:0 auto 18px;">
          You have mastered both the physical optical alignment and analytical calculations for Experiment 11.
        </p>

        <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap; margin-top:14px;">
          <div style="background:var(--card); padding:12px 18px; border-radius:12px; border:1px solid var(--line);">
            <div class="text-muted" style="font-size:0.78rem; text-transform:uppercase;">Calculated λ</div>
            <div style="font-size:1.15rem; font-weight:700; color:var(--acc); font-family:var(--font-math);">${meanLambdaVal} × 10⁻⁸ cm</div>
          </div>
          <div style="background:var(--card); padding:12px 18px; border-radius:12px; border:1px solid var(--line);">
            <div class="text-muted" style="font-size:0.78rem; text-transform:uppercase;">Accuracy Error</div>
            <div style="font-size:1.15rem; font-weight:700; color:var(--ok);">${meanErrorVal}%</div>
          </div>
          <div style="background:var(--card); padding:12px 18px; border-radius:12px; border:1px solid var(--line);">
            <div class="text-muted" style="font-size:0.78rem; text-transform:uppercase;">Quiz Score</div>
            <div style="font-size:1.15rem; font-weight:700; color:var(--acc2);">${quizScore}</div>
          </div>
        </div>
      </div>

      <!-- Worked Step-by-Step Calculation for Reading 1 -->
      <div class="calc-breakdown-card">
        <h3 style="font-size:1.15rem; margin-bottom:12px;">Step-by-Step Worked Calculation (Reading 1)</h3>
        
        <div class="calc-step">
          <strong>Step 1: Input Parameters Recorded</strong>
          <p class="text-muted" style="font-size:0.88rem;">
            Ruling density N = ${r1.N} lines/cm | Order n = ${r1.n} | Distance D = ${r1.D} cm | Spot position Yₙ = ${r1.Yn} cm
          </p>
        </div>

        <div class="calc-step">
          <strong>Step 2: Calculate Angle of Diffraction (sin φ)</strong>
          <p class="math-font" style="font-size:1.05rem; margin:4px 0;">
            sin φ = Yₙ / √(D² + Yₙ²) = ${r1.Yn} / √(${r1.D}² + ${r1.Yn}²) = ${r1.sinPhi}
          </p>
        </div>

        <div class="calc-step">
          <strong>Step 3: Apply the Diffraction Grating Equation</strong>
          <p class="math-font" style="font-size:1.05rem; margin:4px 0;">
            λ = sin φ / (N · n) = ${r1.sinPhi} / (${r1.N} × ${r1.n})
          </p>
          <p style="font-weight:700; color:var(--acc); font-family:var(--font-math); font-size:1.1rem;">
            λ = ${(r1.lambda * 1e-8).toExponential(4)} cm = ${r1.lambda} × 10⁻⁸ cm (${(r1.lambda / 10).toFixed(1)} nm)
          </p>
        </div>

        <!-- Official Lab Record Statement -->
        <div class="statement-box">
          <div style="font-size:0.82rem; text-transform:uppercase; font-weight:700; color:var(--ok); margin-bottom:4px;">
            Official Lab Manual Result Statement
          </div>
          <div style="font-size:0.95rem; line-height:1.5;">
            "The wavelength of the given diode laser using plane transmission diffraction grating was experimentally determined to be 
            <strong>λ = ${meanLambdaVal} × 10⁻⁸ cm</strong>, with an experimental percentage error of <strong>${meanErrorVal}%</strong>."
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:center; gap:12px; margin-top:20px; flex-wrap:wrap;">
        <button class="btn btn-outline" id="btn-practice-again" style="min-width:180px;">
          ↺ Practice Again
        </button>
        <button class="btn btn-primary" id="btn-return-home" style="min-width:180px;">
          Go to Home ⌂
        </button>
      </div>
    `;

    host.querySelector("#btn-return-home").addEventListener("click", () => {
      showView("home");
    });

    const practiceBtn = host.querySelector("#btn-practice-again");
    if (practiceBtn) {
      practiceBtn.addEventListener("click", () => {
        if (confirm("This will reset all your readings, quiz answers and progress for Experiment 11. Start fresh?")) {
          AppState.progress = getDefaultProgress();
          saveProgress();
          // Also reset on server if online
          if (AppState.session && AppState.serverOnline) {
            apiCall("/progress/exp-11/reset", "POST", { id_hash: AppState.session.idHash });
          }
          showToast("Progress reset. Starting from Step 1.", "info");
          showView("experiment");
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Profile View
  // ---------------------------------------------------------------------------
  function renderProfile(container) {
    const user = AppState.session || { name: "Raja Sekhar", idLast4: "7890" };
    const p = AppState.progress;

    container.innerHTML = `
      <div class="top-bar">
        <div class="brand-wrapper">
          <div class="brand-logo-icon">☺</div>
          <div>
            <h2 style="font-size:1.2rem;">Student Profile</h2>
            <p class="text-muted" style="font-size:0.8rem;">GITAM CSE Laboratory Portal</p>
          </div>
        </div>
        <button class="btn btn-icon" id="theme-toggle-profile">🌓</button>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex; align-items:center; gap:14px; margin-bottom:16px;">
          <div style="width:54px; height:54px; border-radius:50%; background:var(--acc2); display:flex; align-items:center; justify-content:center; color:#fff; font-size:1.4rem; font-weight:700;">
            ${user.name ? user.name[0].toUpperCase() : 'S'}
          </div>
          <div>
            <h3 style="font-size:1.2rem; font-weight:700;">${escapeHtml(user.name)}</h3>
            <div class="text-muted" style="font-size:0.85rem;">Registration ID: *******${escapeHtml(user.idLast4)}</div>
            <span class="badge badge-ready" style="margin-top:4px;">Verified GITAM Student</span>
          </div>
        </div>

        <h4 style="font-size:0.95rem; margin-top:16px; margin-bottom:10px;">Lab Practical Record</h4>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; text-align:center;">
          <div style="background:var(--card-subtle); padding:12px; border-radius:10px;">
            <div style="font-size:1.2rem; font-weight:700; color:var(--acc);">${p.experimentCompleted ? '1 / 5' : '0 / 5'}</div>
            <div class="text-muted" style="font-size:0.75rem;">Labs Passed</div>
          </div>
          <div style="background:var(--card-subtle); padding:12px; border-radius:10px;">
            <div style="font-size:1.2rem; font-weight:700; color:var(--acc2);">${p.quizScore !== null ? p.quizScore + ' / 6' : '--'}</div>
            <div class="text-muted" style="font-size:0.75rem;">Quiz Score</div>
          </div>
          <div style="background:var(--card-subtle); padding:12px; border-radius:10px;">
            <div style="font-size:1.2rem; font-weight:700; color:var(--ok);">${p.meanError ? (100 - parseFloat(p.meanError)).toFixed(1) + '%' : '99.7%'}</div>
            <div class="text-muted" style="font-size:0.75rem;">Accuracy</div>
          </div>
        </div>
      </div>

      <div class="card" style="display:flex; flex-direction:column; gap:12px;">
        <h4 style="font-size:0.95rem;">Session & Data Management</h4>
        <button class="btn btn-outline" id="btn-reset-progress" style="width:100%; color:var(--warn); border-color:var(--warn);">
          ↺ Reset Experiment 11 Progress (Practice Again)
        </button>
        <button class="btn btn-outline" id="btn-logout" style="width:100%; color:var(--err); border-color:var(--err);">
          🚪 Log Out
        </button>
      </div>
    `;

    container.querySelector("#theme-toggle-profile").addEventListener("click", toggleTheme);

    container.querySelector("#btn-reset-progress").addEventListener("click", () => {
      if (confirm("Reset Experiment 11 progress to practice from Step 1 again?")) {
        AppState.progress = getDefaultProgress();
        saveProgress();
        showToast("Experiment progress reset.", "info");
        showView("experiment");
      }
    });

    container.querySelector("#btn-logout").addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      AppState.session = null;
      showToast("Logged out successfully.", "info");
      showView("auth");
    });
  }

  // ---------------------------------------------------------------------------
  // 6. Support View
  // ---------------------------------------------------------------------------
  function renderSupport(container) {
    container.innerHTML = `
      <div class="top-bar">
        <div class="brand-wrapper">
          <div class="brand-logo-icon">?</div>
          <div>
            <h2 style="font-size:1.2rem;">Help & Lab Support</h2>
            <p class="text-muted" style="font-size:0.8rem;">Physics Faculty & Exam Troubleshooting</p>
          </div>
        </div>
        <button class="btn btn-icon" id="theme-toggle-support">🌓</button>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <h3 style="font-size:1.15rem; margin-bottom:12px;">Frequently Asked Practical Exam Questions</h3>
        
        <div class="accordion open" style="margin-bottom:10px;">
          <div class="accordion-header">
            <span>Why is my diffraction pattern tilted?</span>
          </div>
          <div class="accordion-body" style="display:block;">
            <p>If the diffraction spots are tilted at an angle instead of horizontal, the grating rulings are not strictly vertical. Loosen the grating clamp and rotate until the beam spots lie along a horizontal line on the scale.</p>
          </div>
        </div>

        <div class="accordion" style="margin-bottom:10px;">
          <div class="accordion-header">
            <span>How do I convert lines per inch to lines per cm?</span>
          </div>
          <div class="accordion-body">
            <p>Since 1 inch = 2.54 cm, divide the lines-per-inch rating by 2.54. For instance, a 15,000 lines/inch grating has N = 15,000 / 2.54 ≈ 5905 lines/cm.</p>
          </div>
        </div>

        <div class="accordion" style="margin-bottom:10px;">
          <div class="accordion-header">
            <span>What if the second order spot falls off the wall?</span>
          </div>
          <div class="accordion-body">
            <p>Either reduce the grating-to-wall distance <em>D</em> using the bench slider, or switch to a grating with fewer lines per cm (e.g. 2500 lines/cm), which decreases the diffraction angle φ.</p>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 style="font-size:1.1rem; margin-bottom:8px;">Lab Contact Desk</h3>
        <p class="text-muted" style="font-size:0.88rem; margin-bottom:12px;">
          For physical apparatus issues or registration verification:
        </p>
        <div style="font-size:0.9rem; line-height:1.6;">
          <p>📧 Email: <strong>physics-lab@gitam.edu</strong></p>
          <p>🏛 Location: Engineering Physics Lab, Science Block Floor 2</p>
          <p>🕒 Hours: Monday - Friday, 9:00 AM - 4:30 PM</p>
        </div>
      </div>
    `;

    container.querySelector("#theme-toggle-support").addEventListener("click", toggleTheme);

    // Accordions
    container.querySelectorAll(".accordion").forEach(acc => {
      const header = acc.querySelector(".accordion-header");
      const body = acc.querySelector(".accordion-body");
      header.addEventListener("click", () => {
        const isOpen = body.style.display === "block";
        body.style.display = isOpen ? "none" : "block";
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Bottom Navigation Event Wiring
  // ---------------------------------------------------------------------------
  function initNavigation() {
    const nav = document.getElementById("bottom-nav");
    if (!nav) return;

    nav.querySelectorAll("button[data-nav]").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-nav");
        showView(target);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Application Entry Point
  // ---------------------------------------------------------------------------
  function initApp() {
    loadState();
    initNavigation();

    // Ping Python server (non-blocking — sets serverOnline flag)
    apiCall("/health").then(res => {
      if (res && res.success) {
        AppState.serverOnline = true;
        console.log("[LabSimplifier] Python server online ✓");
      }
    });

    // Determine initial view
    if (AppState.session) {
      showView("home");
    } else {
      showView("auth");
    }
  }

  // Launch once DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }

})();
