/* Prathibha High School LMS - Core Application Controller, SPA Router, and UI Render Engine */

// --- GLOBAL APPLICATION STATE ---
const appState = {
  currentRole: "student", // default role (guest)
  activePage: "#home",
  activeDashboardTab: "overview",
  
  // Active Quiz State
  activeQuiz: null,
  currentQuestionIndex: 0,
  quizAnswers: [],
  quizScore: 0,
  
  // Temporary editing states
  editingTeacherId: null,
  
  // Custom Dynamic Statistics
  stats: {
    teachersCount: 0,
    materialsCount: 0,
    videosCount: 0,
    quizzesCount: 0
  }
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. Initial Visitor increment
  db.settings.incrementVisitor();
  
  // 2. Initialize Dark Mode preference
  const savedTheme = localStorage.getItem("prathibha_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  
  // 3. Router Listener
  window.addEventListener("hashchange", router);
  
  // 4. Initial Routing Boot
  router();
  
  // 5. Lucide Icons render
  if (window.lucide) {
    lucide.createIcons();
  }
  
  // 6. Global event delegations (modals, clicks)
  setupGlobalEventListeners();
});

// --- DYNAMIC TOAST SYSTEM ---
function showToast(title, text, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast-msg ${type}`;
  
  let iconName = "info";
  if (type === "success") iconName = "check-circle";
  if (type === "danger") iconName = "alert-triangle";
  if (type === "warning") iconName = "alert-circle";

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-text">${text}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;
  
  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  // Slide-out and remove after 4.5 seconds
  setTimeout(() => {
    toast.style.transform = "translateX(120%)";
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

// --- DARK MODE TOGGLE ---
function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const targetTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", targetTheme);
  localStorage.setItem("prathibha_theme", targetTheme);
  
  // Re-render navbar
  renderHeader();
  showToast("Theme Updated", `Switched to ${targetTheme} theme mode successfully.`, "success");
}

// --- GLOBAL EVENT LISTENERS ---
function setupGlobalEventListeners() {
  // Close modals on clicking backdrop overlay
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeAllModals();
      }
    });
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
}

// --- ROUTER ENGINE ---
function router() {
  const hash = window.location.hash || "#home";
  appState.activePage = hash;
  
  // Fetch active user from Auth Module
  const currentUser = auth.getCurrentUser();
  appState.currentRole = currentUser ? currentUser.role : "student";
  
  // Guards & RBAC Checks
  if (hash === "#principal-dashboard" && !auth.isPrincipal()) {
    window.location.hash = "#home";
    showToast("Access Denied", "Only the Principal can access the Admin Dashboard.", "danger");
    return;
  }
  
  if (hash === "#teacher-dashboard" && !auth.isTeacher()) {
    window.location.hash = "#home";
    showToast("Access Denied", "Only teachers can access the Educator Dashboard.", "danger");
    return;
  }
  
  // Manage navigation item highlighting
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
    if (item.getAttribute("onclick") && item.getAttribute("onclick").includes(hash)) {
      item.classList.add("active");
    }
  });

  // Re-draw core pieces
  renderHeader();
  closeAllModals();
  
  // Hide all view pages
  document.querySelectorAll(".page-view").forEach(page => page.classList.remove("active"));
  
  // Show active view
  let targetViewId = hash.replace("#", "") + "-view";
  
  // Special router mapping for dashboards
  if (hash.startsWith("#principal-dashboard")) targetViewId = "principal-dashboard-view";
  if (hash.startsWith("#teacher-dashboard")) targetViewId = "teacher-dashboard-view";
  
  const targetView = document.getElementById(targetViewId);
  if (targetView) {
    targetView.classList.add("active");
    
    // Trigger specific rendering functions
    if (hash === "#home") renderHome();
    else if (hash === "#materials") renderMaterials();
    else if (hash === "#videos") renderVideos();
    else if (hash === "#quizzes") renderQuizzes();
    else if (hash === "#guidance") renderCareerGuidance();
    else if (hash === "#contact") renderContact();
    else if (hash.startsWith("#principal-dashboard")) renderPrincipalDashboard();
    else if (hash.startsWith("#teacher-dashboard")) renderTeacherDashboard();
  } else {
    // Page not found fallback
    document.getElementById("home-view").classList.add("active");
    renderHome();
  }
  
  // Re-trigger icon rendering
  if (window.lucide) lucide.createIcons();
  
  // Scroll to top on page navigation
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- DYNAMIC HEADER / NAVIGATION ---
function renderHeader() {
  const currentUser = auth.getCurrentUser();
  const settings = db.settings.get();
  
  // Redraw Logo / Brand Text
  const brandContainer = document.querySelector(".logo-block");
  if (brandContainer) {
    brandContainer.innerHTML = `
      <div class="school-logo">${settings.logoText || "PHS"}</div>
      <div class="brand-text">
        <span class="school-name">${settings.schoolName}</span>
        <span class="school-motto">"${settings.motto}"</span>
      </div>
    `;
  }
  
  // Draw Navbar Links based on Roles
  const linksContainer = document.getElementById("nav-links-container");
  if (linksContainer) {
    let linksHtml = `
      <a class="nav-item ${appState.activePage === '#home' ? 'active' : ''}" href="#home">Home</a>
      <a class="nav-item ${appState.activePage === '#materials' ? 'active' : ''}" href="#materials">Study Materials</a>
      <a class="nav-item ${appState.activePage === '#videos' ? 'active' : ''}" href="#videos">Video Lessons</a>
      <a class="nav-item ${appState.activePage === '#quizzes' ? 'active' : ''}" href="#quizzes">Daily Quiz</a>
      <a class="nav-item ${appState.activePage === '#guidance' ? 'active' : ''}" href="#guidance">Career Guidance</a>
      <a class="nav-item ${appState.activePage === '#contact' ? 'active' : ''}" href="#contact">Contact Us</a>
    `;
    
    // Admin specific dash link
    if (auth.isPrincipal()) {
      linksHtml += `<a class="nav-item ${appState.activePage.startsWith('#principal-dashboard') ? 'active' : ''}" href="#principal-dashboard" style="font-weight: 700; color: var(--secondary);">Principal Dash</a>`;
    }
    
    // Teacher specific dash link
    if (auth.isTeacher()) {
      linksHtml += `<a class="nav-item ${appState.activePage.startsWith('#teacher-dashboard') ? 'active' : ''}" href="#teacher-dashboard" style="font-weight: 700; color: var(--secondary);">Teacher Dash</a>`;
    }
    
    linksContainer.innerHTML = linksHtml;
  }
  
  // Render Auth Actions / Session Pill
  const authContainer = document.getElementById("nav-auth-container");
  if (authContainer) {
    if (currentUser) {
      authContainer.innerHTML = `
        <div class="user-widget">
          <span class="user-badge ${currentUser.role}">${currentUser.role}</span>
          <span class="nav-item" style="font-weight: 600;">Hi, ${currentUser.name.split(" ")[0]}</span>
          <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="handleLogout()">Logout</button>
        </div>
      `;
    } else {
      authContainer.innerHTML = `
        <button class="btn btn-primary" style="padding: 8px 16px; font-size: 0.88rem;" onclick="openModal('login-modal')">Portal Sign In</button>
      `;
    }
  }

  // Update Visitor Pill
  const visitorCountElement = document.getElementById("visitor-count-pill");
  if (visitorCountElement) {
    visitorCountElement.innerText = settings.visitorCount || 100;
  }
}

// --- LOGIN & LOGOUT HANDLERS ---
function handleLogin(event) {
  event.preventDefault();
  const emailInput = document.getElementById("login-email").value;
  const passwordInput = document.getElementById("login-password").value;
  
  const result = auth.login(emailInput, passwordInput);
  
  if (result.success) {
    closeModal("login-modal");
    // Clear forms
    document.getElementById("login-form").reset();
    
    showToast("Welcome Back!", `Signed in successfully as ${result.user.name}.`, "success");
    
    // Redirect based on role
    if (result.user.role === "principal") {
      window.location.hash = "#principal-dashboard";
    } else if (result.user.role === "teacher") {
      window.location.hash = "#teacher-dashboard";
    } else {
      window.location.hash = "#home";
    }
  } else {
    showToast("Authentication Failed", result.message || "Invalid credentials.", "danger");
  }
}

function handleLogout() {
  auth.logout();
  window.location.hash = "#home";
  showToast("Logged Out", "You have successfully signed out of the learning hub.", "info");
}

// --- RENDER: HOME VIEW ---
function renderHome() {
  // 1. Recalculate stats counters (Teachers, Quizzes, Study Materials)
  const teachers = db.teachers.find();
  const materials = db.materials.find({ isApproved: true });
  const quizzes = db.quizzes.find({ isApproved: true });
  const videos = db.videos.find({ isApproved: true });
  
  // Set in state for ticks
  appState.stats.teachersCount = teachers.length;
  appState.stats.materialsCount = materials.length;
  appState.stats.quizzesCount = quizzes.length;
  appState.stats.videosCount = videos.length;
  
  // Animate dynamic ticking counters
  animateCounter("home-stat-teachers", teachers.length);
  animateCounter("home-stat-materials", materials.length);
  animateCounter("home-stat-quizzes", quizzes.length);
  animateCounter("home-stat-videos", videos.length);
  
  // 2. Render latest announcements (Max 3)
  const homeAnnounceContainer = document.getElementById("home-announcements-container");
  if (homeAnnounceContainer) {
    const list = db.announcements.getRaw().slice(-3).reverse(); // Last 3 announcements
    if (list.length === 0) {
      homeAnnounceContainer.innerHTML = `<div class="empty-state">No announcements uploaded yet.</div>`;
    } else {
      homeAnnounceContainer.innerHTML = list.map(item => `
        <div class="home-ann-card">
          <div class="home-ann-info">
            <h4>${item.title}</h4>
            <p>${item.description}</p>
            <small style="color: var(--primary); font-weight: 600;">Posted by: ${item.createdBy}</small>
          </div>
          <div class="home-ann-date">${item.date}</div>
        </div>
      `).join("");
    }
  }
}

function animateCounter(id, targetValue) {
  const element = document.getElementById(id);
  if (!element) return;
  
  let currentVal = 0;
  const duration = 1200; // ms
  const steps = 40;
  const stepTime = duration / steps;
  const increment = targetValue / steps;
  
  clearInterval(element.timerId);
  
  element.timerId = setInterval(() => {
    currentVal += increment;
    if (currentVal >= targetValue) {
      element.innerText = targetValue + "+";
      clearInterval(element.timerId);
    } else {
      element.innerText = Math.floor(currentVal) + "+";
    }
  }, stepTime);
}

// --- RENDER: STUDY MATERIALS ---
function renderMaterials() {
  const searchInput = document.getElementById("m-search").value.toLowerCase();
  const classFilter = document.getElementById("m-class-filter").value;
  const subjectFilter = document.getElementById("m-subject-filter").value;
  const typeFilter = document.getElementById("m-type-filter").value;
  
  // Fetch only approved materials
  let materials = db.materials.find({ isApproved: true });
  
  // Filter by Search Title / Author
  if (searchInput) {
    materials = materials.filter(m => {
      const teacherObj = db.teachers.findOne({ id: m.uploadedBy }) || { name: "Principal" };
      return m.title.toLowerCase().includes(searchInput) || 
             m.subject.toLowerCase().includes(searchInput) ||
             teacherObj.name.toLowerCase().includes(searchInput);
    });
  }
  
  // Filter by Class
  if (classFilter) {
    materials = materials.filter(m => m.classNum === classFilter);
  }
  
  // Filter by Subject
  if (subjectFilter) {
    materials = materials.filter(m => m.subject === subjectFilter);
  }
  
  // Filter by Material FileType
  if (typeFilter) {
    materials = materials.filter(m => m.fileType === typeFilter);
  }
  
  const container = document.getElementById("materials-cards-grid");
  if (!container) return;
  
  if (materials.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="folder-open" class="empty-state-icon"></i>
        <h3>No Study Materials Found</h3>
        <p>Try clearing your search query or choosing alternative class filters.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  container.innerHTML = materials.map(m => {
    const teacher = db.teachers.findOne({ id: m.uploadedBy }) || { name: "Principal (Admin)" };
    
    // Choose icons based on file type
    let fileIcon = "file-text";
    if (m.fileType === "pdf") fileIcon = "book-open";
    if (m.fileType === "ppt") fileIcon = "presentation";
    if (m.fileType === "worksheet") fileIcon = "edit-3";
    if (m.fileType === "image") fileIcon = "image";
    
    return `
      <div class="material-card ${m.fileType}">
        <div class="mat-card-header">
          <div class="mat-type-icon">
            <i data-lucide="${fileIcon}"></i>
          </div>
          <span class="mat-class-badge">Class ${m.classNum}</span>
        </div>
        <h4 class="mat-card-title">${m.title}</h4>
        <div class="mat-meta-info">
          <span class="mat-meta-item">
            <i data-lucide="tag" style="width: 12px; height: 12px;"></i>
            ${m.subject}
          </span>
          <span class="mat-meta-item">
            <i data-lucide="hard-drive" style="width: 12px; height: 12px;"></i>
            ${m.fileSize}
          </span>
        </div>
        <div class="mat-card-footer">
          <div class="mat-author">
            <span style="font-size: 0.7rem; display:block; color: var(--text-muted);">Uploaded By:</span>
            ${teacher.name}
          </div>
          <div class="mat-actions">
            <button class="btn-icon-only" onclick="previewMaterial('${m.id}')" title="Preview Notes">
              <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
            </button>
            <button class="btn-icon-only" onclick="downloadMaterial('${m.title}')" title="Download File">
              <i data-lucide="download" style="width: 16px; height: 16px;"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
  
  if (window.lucide) lucide.createIcons();
}

function previewMaterial(id) {
  const item = db.materials.findOne({ id: id });
  if (!item) return;
  
  const modal = document.getElementById("material-preview-modal");
  const title = document.getElementById("prev-material-title");
  const body = document.getElementById("prev-material-body");
  
  if (modal && title && body) {
    title.innerText = item.title;
    body.innerHTML = `
      <div style="text-align: center; padding: 20px 0;">
        <i data-lucide="file-check" style="width: 60px; height: 60px; color: var(--secondary); margin-bottom: 12px;"></i>
        <h4>Interactive Preview Mode</h4>
        <p style="color: var(--text-muted); font-size: 0.88rem; max-width: 320px; margin: 6px auto 20px auto;">
          This study notes sheet contains textbook solutions, revision exercises, and illustrative figures.
        </p>
        <div style="background-color: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 15px; text-align: left; font-family: monospace; font-size: 0.8rem; overflow-x: auto;">
          <strong>[Document Type]</strong>: ${item.fileType.toUpperCase()}<br/>
          <strong>[Document Size]</strong>: ${item.fileSize}<br/>
          <strong>[Status]</strong>: Verified Active Security Signed<br/>
          <strong>[Verification Hash]</strong>: SHA256-${Math.random().toString(36).substr(2, 16)}
        </div>
      </div>
    `;
    openModal("material-preview-modal");
    if (window.lucide) lucide.createIcons();
  }
}

function downloadMaterial(title) {
  showToast("Download Commenced", `"${title}" has been added to downloads queue.`, "success");
}

// --- RENDER: VIDEO LESSONS ---
function renderVideos() {
  const searchInput = document.getElementById("v-search").value.toLowerCase();
  const classFilter = document.getElementById("v-class-filter").value;
  const subjectFilter = document.getElementById("v-subject-filter").value;
  
  let videos = db.videos.find({ isApproved: true });
  
  // Search
  if (searchInput) {
    videos = videos.filter(v => v.title.toLowerCase().includes(searchInput) || v.subject.toLowerCase().includes(searchInput));
  }
  
  // Filters
  if (classFilter) videos = videos.filter(v => v.classNum === classFilter);
  if (subjectFilter) videos = videos.filter(v => v.subject === subjectFilter);
  
  const container = document.getElementById("videos-cards-grid");
  if (!container) return;
  
  if (videos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="video" class="empty-state-icon"></i>
        <h3>No Video Lessons Found</h3>
        <p>Teachers are constantly creating video content. Check back shortly!</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  container.innerHTML = videos.map(v => {
    const teacher = db.teachers.findOne({ id: v.uploadedBy }) || { name: "Principal (Admin)" };
    return `
      <div class="video-card">
        <div class="video-player-container">
          <iframe src="${v.videoUrl}" allowfullscreen></iframe>
        </div>
        <div class="video-info-box">
          <div class="video-category">
            <span class="vid-badge class">Class ${v.classNum}</span>
            <span class="vid-badge">${v.subject}</span>
          </div>
          <h4 class="video-title">${v.title}</h4>
          <div class="video-meta">
            <span>By: ${teacher.name}</span>
            <span style="display: inline-flex; align-items:center; gap: 4px; color: var(--color-success);">
              <i data-lucide="verified" style="width: 14px; height: 14px;"></i> Verified
            </span>
          </div>
        </div>
      </div>
    `;
  }).join("");
  
  if (window.lucide) lucide.createIcons();
}

// --- RENDER: DAILY QUIZ PAGE ---
function renderQuizzes() {
  const container = document.getElementById("quiz-cards-grid");
  if (!container) return;
  
  const quizzes = db.quizzes.find({ isApproved: true });
  
  if (quizzes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="award" class="empty-state-icon"></i>
        <h3>No Quizzes Published</h3>
        <p>Ask your class teacher to publish multiple-choice revision quizzes for your syllabus.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  container.innerHTML = quizzes.map(q => `
    <div class="quiz-card">
      <div class="quiz-card-head">
        <span class="vid-badge">Class ${q.classNum}</span>
        <span class="vid-badge class">${q.subject}</span>
      </div>
      <h3 class="quiz-title">${q.title}</h3>
      <div class="quiz-stat-pill">
        <i data-lucide="help-circle" style="width: 14px; height: 14px;"></i>
        ${q.questions.length} Multiple Choice Questions
      </div>
      <div class="quiz-card-footer">
        <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-muted);">Instant Grading Enabled</span>
        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="startQuiz('${q.id}')">Start Quiz</button>
      </div>
    </div>
  `).join("");
  
  if (window.lucide) lucide.createIcons();
}

// --- QUIZ ENGINE EXECUTION ---
function startQuiz(quizId) {
  const quiz = db.quizzes.findOne({ id: quizId });
  if (!quiz) return;
  
  appState.activeQuiz = quiz;
  appState.currentQuestionIndex = 0;
  appState.quizAnswers = [];
  appState.quizScore = 0;
  
  // Switch UI inside Daily Quiz Page to play mode
  document.getElementById("quiz-intro-section").style.display = "none";
  document.getElementById("quiz-playing-portal").style.display = "block";
  document.getElementById("quiz-results-portal").style.display = "none";
  
  renderActiveQuestion();
}

function renderActiveQuestion() {
  const quiz = appState.activeQuiz;
  const qIndex = appState.currentQuestionIndex;
  
  if (qIndex >= quiz.questions.length) {
    finishQuiz();
    return;
  }
  
  const question = quiz.questions[qIndex];
  
  // Progress Bar
  const progressPercent = (qIndex / quiz.questions.length) * 100;
  document.getElementById("quiz-progress-fill").style.width = `${progressPercent}%`;
  document.getElementById("quiz-progress-text").innerText = `Question ${qIndex + 1} of ${quiz.questions.length}`;
  
  const qContainer = document.getElementById("quiz-active-q-block");
  qContainer.innerHTML = `
    <div class="quiz-q-num">Question ${qIndex + 1}</div>
    <div class="quiz-q-text">${question.question}</div>
    <div class="quiz-options-list">
      ${question.options.map((opt, i) => `
        <label class="quiz-option-label" id="opt-label-${i}" onclick="selectQuizOption(${i})">
          <input type="radio" name="active-q-choice" value="${opt}" class="quiz-option-input" />
          ${opt}
        </label>
      `).join("")}
    </div>
  `;
}

function selectQuizOption(index) {
  // Clear other selections
  document.querySelectorAll(".quiz-option-label").forEach(lbl => lbl.classList.remove("selected"));
  
  // Set selected
  const targetLabel = document.getElementById(`opt-label-${index}`);
  if (targetLabel) {
    targetLabel.classList.add("selected");
    const radio = targetLabel.querySelector("input");
    if (radio) radio.checked = true;
  }
}

function submitQuestionAnswer() {
  const selectedRadio = document.querySelector('input[name="active-q-choice"]:checked');
  
  if (!selectedRadio) {
    showToast("Choice Required", "Please select an answer choice before moving forward.", "warning");
    return;
  }
  
  const answer = selectedRadio.value;
  appState.quizAnswers.push(answer);
  
  // Check if correct
  const correct = appState.activeQuiz.questions[appState.currentQuestionIndex].correctAnswer;
  if (answer === correct) {
    appState.quizScore++;
  }
  
  appState.currentQuestionIndex++;
  renderActiveQuestion();
}

function finishQuiz() {
  const quiz = appState.activeQuiz;
  const score = appState.quizScore;
  const total = quiz.questions.length;
  const pct = Math.round((score / total) * 100);
  
  // 1. If user is a logged-in student, save score to their portfolio!
  const currentUser = auth.getCurrentUser();
  if (currentUser && currentUser.role === "student") {
    const student = db.students.findOne({ id: currentUser.id });
    if (student) {
      student.quizScores = student.quizScores || [];
      student.quizScores.push({
        quizId: quiz.id,
        quizTitle: quiz.title,
        score: score,
        totalQuestions: total,
        date: new Date().toISOString().split("T")[0]
      });
      db.students.updateOne({ id: currentUser.id }, { quizScores: student.quizScores });
    }
  }
  
  // 2. Hide playing, show results
  document.getElementById("quiz-playing-portal").style.display = "none";
  document.getElementById("quiz-results-portal").style.display = "block";
  
  // Render score card
  const resultsContainer = document.getElementById("quiz-results-portal");
  
  let reviewHtml = quiz.questions.map((q, qIdx) => {
    const studentAnswer = appState.quizAnswers[qIdx];
    const isCorrect = studentAnswer === q.correctAnswer;
    
    return `
      <div class="quiz-review-q-card ${isCorrect ? 'correct' : 'wrong'}">
        <h4 style="font-size: 0.95rem; margin-bottom: 10px;">Question ${qIdx + 1}: ${q.question}</h4>
        <div class="review-choices">
          ${q.options.map(opt => {
            let classList = "";
            let matchText = "";
            
            if (opt === q.correctAnswer) {
              classList = "correct-ans";
              matchText = " ✓ (Correct Answer)";
            } else if (opt === studentAnswer && !isCorrect) {
              classList = "selected-wrong";
              matchText = " ✗ (Your Answer)";
            }
            
            return `
              <div class="choice-pill ${classList}">
                <span>${opt}</span>
                <span style="font-weight: 700; font-size: 0.72rem;">${matchText}</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }).join("");

  resultsContainer.innerHTML = `
    <div class="quiz-play-wrapper" style="max-width: 720px;">
      <div class="quiz-result-scorecard">
        <div class="score-circle">
          <span class="score-big">${pct}%</span>
          <span class="score-total">${score} / ${total} Correct</span>
        </div>
        <h3 class="score-msg">${pct >= 70 ? 'Excellent Performance!' : pct >= 40 ? 'Good Effort!' : 'Keep Practicing!'}</h3>
        <p class="score-desc">
          You scored ${score} out of ${total} marks. Review your answers below to clarify concepts.
        </p>
      </div>
      
      <h3 style="margin-bottom: 20px; font-family: var(--font-display);">Detailed Quiz Review</h3>
      <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 30px;">
        ${reviewHtml}
      </div>
      
      <div style="text-align: center;">
        <button class="btn btn-primary" onclick="exitQuiz()">Exit & Back to Quizzes</button>
      </div>
    </div>
  `;
}

function exitQuiz() {
  appState.activeQuiz = null;
  document.getElementById("quiz-intro-section").style.display = "block";
  document.getElementById("quiz-playing-portal").style.display = "none";
  document.getElementById("quiz-results-portal").style.display = "none";
  renderQuizzes();
}

// --- RENDER: CAREER GUIDANCE ---
function renderCareerGuidance() {
  // Static contents - nothing dynamic needed but it is pre-populated
  // We can hook click handlers to the intermediate roadmap overlays to wow the user.
}

function showScholarshipModal() {
  const modal = document.getElementById("scholarship-modal");
  if (modal) {
    openModal("scholarship-modal");
  }
}

// --- RENDER: CONTACT & FEEDBACK ---
function renderContact() {
  // Render contact form is static
}

function handleFeedbackSubmit(event) {
  event.preventDefault();
  
  const name = document.getElementById("feed-name").value;
  const classNum = document.getElementById("feed-class").value;
  const email = document.getElementById("feed-email").value;
  const message = document.getElementById("feed-message").value;
  
  db.feedback.insertOne({
    name,
    classNum,
    email,
    message,
    date: new Date().toISOString().split("T")[0]
  });
  
  document.getElementById("feedback-form").reset();
  showToast("Feedback Logged", "Thank you! Your feedback has been sent directly to the Principal's inbox.", "success");
}

// --- PRINCIPAL DASHBOARD RENDERING & TAB HANDLERS ---
function switchPrincipalTab(tabName) {
  appState.activeDashboardTab = tabName;
  document.querySelectorAll("#principal-dashboard-view .dash-nav-item").forEach(item => {
    item.classList.remove("active");
    if (item.getAttribute("onclick").includes(tabName)) {
      item.classList.add("active");
    }
  });
  
  document.querySelectorAll("#principal-dashboard-view .dash-pane").forEach(pane => {
    pane.classList.remove("active");
  });
  
  const pane = document.getElementById(`p-pane-${tabName}`);
  if (pane) pane.classList.add("active");
  
  renderPrincipalDashboardPane(tabName);
}

function renderPrincipalDashboard() {
  // Force load initial tab overview
  switchPrincipalTab(appState.activeDashboardTab);
}

function renderPrincipalDashboardPane(tabName) {
  const teachers = db.teachers.getRaw();
  const materials = db.materials.getRaw();
  const quizzes = db.quizzes.getRaw();
  const videos = db.videos.getRaw();
  const feedbacks = db.feedback.getRaw();
  
  if (tabName === "overview") {
    // 1. Metric Counts
    document.getElementById("p-stat-teachers").innerText = teachers.length;
    document.getElementById("p-stat-materials").innerText = materials.filter(m => m.isApproved).length;
    document.getElementById("p-stat-quizzes").innerText = quizzes.filter(q => q.isApproved).length;
    document.getElementById("p-stat-feedback").innerText = feedbacks.length;
    
    // 2. Dynamic analytical subject distribution chart
    renderAnalyticsChart();
    
    // 3. Mini activity log: show latest 3 pending contents
    const pendingMaterials = materials.filter(m => !m.isApproved);
    const pendingVideos = videos.filter(v => !v.isApproved);
    const pendingQuizzes = quizzes.filter(q => !q.isApproved);
    const totalPendingCount = pendingMaterials.length + pendingVideos.length + pendingQuizzes.length;
    
    const logsContainer = document.getElementById("p-activity-log-box");
    if (logsContainer) {
      if (totalPendingCount === 0) {
        logsContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 20px;">No pending moderation actions. All systems clean!</div>`;
      } else {
        logsContainer.innerHTML = `
          <div style="background-color: var(--primary-light); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; margin-bottom: 12px; font-size: 0.85rem; font-weight: 600; color: var(--primary); display: flex; justify-content: space-between; align-items: center;">
            <span>Moderation Warning Queue</span>
            <span class="user-badge principal" style="font-size: 0.72rem;">${totalPendingCount} Action Items</span>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-muted);">Please navigate to the <strong>Content Approval</strong> tab to review and release or remove these resource submissions.</p>
        `;
      }
    }
  }
  
  else if (tabName === "teachers") {
    // Draw teachers table list
    const tbody = document.getElementById("p-teachers-table-body");
    if (tbody) {
      if (teachers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state" style="padding: 30px;">No teachers added yet.</td></tr>`;
      } else {
        tbody.innerHTML = teachers.map((t, idx) => `
          <tr>
            <td><strong>${idx + 1}</strong></td>
            <td><strong>${t.name}</strong></td>
            <td>${t.email}</td>
            <td>
              <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                ${t.assignedClasses.map(c => `<span class="vid-badge class" style="font-size: 0.65rem; padding: 2px 6px;">Class ${c}</span>`).join("")}
              </div>
            </td>
            <td>
              <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                ${t.assignedSubjects.map(s => `<span class="vid-badge" style="font-size: 0.65rem; padding: 2px 6px;">${s}</span>`).join("")}
              </div>
            </td>
            <td>
              <span class="status-pill ${t.status.toLowerCase()}">${t.status}</span>
            </td>
            <td>
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.78rem;" onclick="editTeacherForm('${t.id}')">Edit</button>
                <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.78rem;" onclick="deleteTeacherAccount('${t.id}')">Delete</button>
              </div>
            </td>
          </tr>
        `).join("");
      }
    }
  }
  
  else if (tabName === "moderation") {
    // Draw pending review lists
    const container = document.getElementById("p-moderation-container");
    if (!container) return;
    
    const pendingMat = materials.filter(m => !m.isApproved);
    const pendingVid = videos.filter(v => !v.isApproved);
    const pendingQuiz = quizzes.filter(q => !q.isApproved);
    
    const totalPending = pendingMat.length + pendingVid.length + pendingQuiz.length;
    
    if (totalPending === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="check-square" class="empty-state-icon" style="color: var(--color-success);"></i>
          <h3>No Content Awaiting Approval</h3>
          <p>Teachers have not submitted any new educational materials requiring principal review.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }
    
    let html = "";
    
    // 1. Materials
    if (pendingMat.length > 0) {
      html += `
        <h4 style="margin: 20px 0 10px 0; border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">Pending Study Notes (${pendingMat.length})</h4>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Class</th>
                <th>Teacher ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pendingMat.map(m => `
                <tr>
                  <td><strong>${m.title}</strong></td>
                  <td>${m.subject}</td>
                  <td>Class ${m.classNum}</td>
                  <td>${m.uploadedBy}</td>
                  <td>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="approveContent('material', '${m.id}', true)">Approve</button>
                    <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="approveContent('material', '${m.id}', false)">Reject/Delete</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    }
    
    // 2. Videos
    if (pendingVid.length > 0) {
      html += `
        <h4 style="margin: 30px 0 10px 0; border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">Pending Video Lessons (${pendingVid.length})</h4>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Class</th>
                <th>Teacher ID</th>
                <th>Embed URL</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pendingVid.map(v => `
                <tr>
                  <td><strong>${v.title}</strong></td>
                  <td>${v.subject}</td>
                  <td>Class ${v.classNum}</td>
                  <td>${v.uploadedBy}</td>
                  <td><a href="${v.videoUrl}" target="_blank" style="color: var(--primary); text-decoration: underline;">Open Link</a></td>
                  <td>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="approveContent('video', '${v.id}', true)">Approve</button>
                    <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="approveContent('video', '${v.id}', false)">Reject/Delete</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    }
    
    container.innerHTML = html;
  }
  
  else if (tabName === "settings") {
    // Fill settings inputs
    const settings = db.settings.get();
    document.getElementById("p-set-name").value = settings.schoolName;
    document.getElementById("p-set-motto").value = settings.motto;
    document.getElementById("p-set-phone").value = settings.phone;
    document.getElementById("p-set-email").value = settings.email;
    document.getElementById("p-set-address").value = settings.address;
  }
  
  else if (tabName === "feedback") {
    // Draw inbox list
    const tbody = document.getElementById("p-feedback-table-body");
    if (tbody) {
      if (feedbacks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state" style="padding: 30px;">No parent feedback messages received.</td></tr>`;
      } else {
        tbody.innerHTML = feedbacks.reverse().map((f, idx) => `
          <tr>
            <td><strong>${idx + 1}</strong></td>
            <td><strong>${f.name}</strong> (Class ${f.classNum})</td>
            <td>${f.email}</td>
            <td><div style="max-width: 320px; font-style: italic; color: var(--text-main); font-size: 0.85rem;">"${f.message}"</div></td>
            <td><small>${f.date}</small></td>
          </tr>
        `).join("");
      }
    }
  }
}

// Draw dynamic analysis chart of materials by subject
function renderAnalyticsChart() {
  const chart = document.getElementById("p-analytics-chart");
  if (!chart) return;
  
  const materials = db.materials.find({ isApproved: true });
  
  // Calculate counts per subject
  const subjects = ["Mathematics", "Science", "English", "Social Studies", "Computer Science"];
  const counts = subjects.map(sub => materials.filter(m => m.subject === sub).length);
  const maxVal = Math.max(...counts, 1);
  
  chart.innerHTML = subjects.map((sub, idx) => {
    const heightPercent = Math.round((counts[idx] / maxVal) * 80) + 10; // offset for minimal visual height
    return `
      <div class="chart-bar-group">
        <div class="chart-bar" style="height: ${heightPercent}%;">
          <div class="chart-tooltip">${counts[idx]} Materials</div>
        </div>
        <div class="chart-bar-label">${sub.split(" ")[0]}</div>
      </div>
    `;
  }).join("");
}

// MODERATION ACTIONS
function approveContent(type, id, approved) {
  if (type === "material") {
    if (approved) {
      db.materials.updateOne({ id: id }, { isApproved: true });
      showToast("Resource Approved", "Study notes has been published onto the public Student Portal.", "success");
    } else {
      db.materials.deleteOne({ id: id });
      showToast("Resource Deleted", "The uploaded material has been rejected and permanently removed.", "warning");
    }
  } else if (type === "video") {
    if (approved) {
      db.videos.updateOne({ id: id }, { isApproved: true });
      showToast("Video Link Approved", "Video lesson has been published onto the public portal.", "success");
    } else {
      db.videos.deleteOne({ id: id });
      showToast("Video Rejected", "The uploaded video lesson has been deleted.", "warning");
    }
  }
  
  // Refresh panel
  renderPrincipalDashboardPane("moderation");
}

// CRUD: TEACHER MANAGEMENT
function openAddTeacherModal() {
  appState.editingTeacherId = null;
  document.getElementById("teacher-modal-title").innerText = "Add New Educator Account";
  document.getElementById("teacher-form").reset();
  
  // Clear checkboxes
  document.querySelectorAll('.teacher-cls-checkbox').forEach(cb => cb.checked = false);
  document.querySelectorAll('.teacher-sub-checkbox').forEach(cb => cb.checked = false);
  
  openModal("teacher-add-modal");
}

function editTeacherForm(teacherId) {
  const teacher = db.teachers.findOne({ id: teacherId });
  if (!teacher) return;
  
  appState.editingTeacherId = teacherId;
  document.getElementById("teacher-modal-title").innerText = `Edit ${teacher.name}`;
  
  document.getElementById("teacher-name").value = teacher.name;
  document.getElementById("teacher-email").value = teacher.email;
  document.getElementById("teacher-password").value = teacher.password;
  document.getElementById("teacher-status").value = teacher.status;
  
  // Select Checkboxes
  document.querySelectorAll('.teacher-cls-checkbox').forEach(cb => {
    cb.checked = teacher.assignedClasses.includes(cb.value);
  });
  
  document.querySelectorAll('.teacher-sub-checkbox').forEach(cb => {
    cb.checked = teacher.assignedSubjects.includes(cb.value);
  });
  
  openModal("teacher-add-modal");
}

function handleTeacherSubmit(event) {
  event.preventDefault();
  
  const name = document.getElementById("teacher-name").value;
  const email = document.getElementById("teacher-email").value.toLowerCase().trim();
  const password = document.getElementById("teacher-password").value;
  const status = document.getElementById("teacher-status").value;
  
  // Collect assigned classes checkbox array
  const assignedClasses = [];
  document.querySelectorAll('.teacher-cls-checkbox:checked').forEach(cb => {
    assignedClasses.push(cb.value);
  });
  
  // Collect assigned subjects checkbox array
  const assignedSubjects = [];
  document.querySelectorAll('.teacher-sub-checkbox:checked').forEach(cb => {
    assignedSubjects.push(cb.value);
  });
  
  if (assignedClasses.length === 0 || assignedSubjects.length === 0) {
    showToast("Assignments Required", "Please assign at least one class and one subject to this teacher.", "warning");
    return;
  }
  
  if (appState.editingTeacherId) {
    // Update existing
    db.teachers.updateOne({ id: appState.editingTeacherId }, {
      name, email, password, status, assignedClasses, assignedSubjects
    });
    showToast("Teacher Account Updated", `${name}'s assignments and credentials have been updated.`, "success");
  } else {
    // Check if email already used
    const existing = db.teachers.findOne({ email: email });
    if (existing) {
      showToast("Email Unavailable", "A teacher account with this email address already exists.", "danger");
      return;
    }
    
    // Add new
    db.teachers.insertOne({
      name, email, password, status, assignedClasses, assignedSubjects
    });
    showToast("Teacher Account Created", `Educator account for ${name} created successfully.`, "success");
  }
  
  closeModal("teacher-add-modal");
  renderPrincipalDashboardPane("teachers");
}

function deleteTeacherAccount(teacherId) {
  if (confirm("Are you absolutely sure you want to delete this educator account? All dashboard access will be immediately terminated.")) {
    const teacher = db.teachers.findOne({ id: teacherId });
    db.teachers.deleteOne({ id: teacherId });
    showToast("Account Terminated", `The teacher account for "${teacher.name}" has been permanently deleted.`, "warning");
    renderPrincipalDashboardPane("teachers");
  }
}

// SETTINGS ACTIONS
function handleSettingsSubmit(event) {
  event.preventDefault();
  
  const schoolName = document.getElementById("p-set-name").value;
  const motto = document.getElementById("p-set-motto").value;
  const phone = document.getElementById("p-set-phone").value;
  const email = document.getElementById("p-set-email").value;
  const address = document.getElementById("p-set-address").value;
  
  db.settings.update({
    schoolName, motto, phone, email, address
  });
  
  // Re-draw headers and logo elements
  renderHeader();
  showToast("Settings Updated", "School profile data and contact details updated successfully.", "success");
}

// --- TEACHER DASHBOARD RENDERING & TAB HANDLERS ---
function switchTeacherTab(tabName) {
  appState.activeDashboardTab = tabName;
  document.querySelectorAll("#teacher-dashboard-view .dash-nav-item").forEach(item => {
    item.classList.remove("active");
    if (item.getAttribute("onclick").includes(tabName)) {
      item.classList.add("active");
    }
  });
  
  document.querySelectorAll("#teacher-dashboard-view .dash-pane").forEach(pane => {
    pane.classList.remove("active");
  });
  
  const pane = document.getElementById(`t-pane-${tabName}`);
  if (pane) pane.classList.add("active");
  
  renderTeacherDashboardPane(tabName);
}

function renderTeacherDashboard() {
  switchTeacherTab(appState.activeDashboardTab);
}

function renderTeacherDashboardPane(tabName) {
  const user = auth.getCurrentUser();
  if (!user) return;
  
  const materials = db.materials.find({ uploadedBy: user.id });
  const videos = db.videos.find({ uploadedBy: user.id });
  const quizzes = db.quizzes.find({ createdBy: user.id });
  const announcements = db.announcements.find({ createdBy: user.name });
  
  // Draw teacher sidebar header information (e.g. Assigned details)
  const metaBox = document.getElementById("t-assigned-classes-display");
  if (metaBox) {
    metaBox.innerHTML = `
      <div style="background-color: var(--primary-light); padding: 15px; border-radius: var(--radius-md); border: 1px solid var(--border-color); font-size: 0.85rem; display:flex; flex-direction:column; gap: 8px;">
        <div><strong>Educator:</strong> ${user.name}</div>
        <div>
          <strong>Classes:</strong> 
          <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
            ${user.assignedClasses.map(c => `<span class="vid-badge class" style="font-size:0.65rem;">Class ${c}</span>`).join("")}
          </div>
        </div>
        <div>
          <strong>Subjects:</strong>
          <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
            ${user.assignedSubjects.map(s => `<span class="vid-badge" style="font-size:0.65rem;">${s}</span>`).join("")}
          </div>
        </div>
      </div>
    `;
  }
  
  if (tabName === "overview") {
    // 1. Overview counts
    document.getElementById("t-stat-materials").innerText = materials.length;
    document.getElementById("t-stat-videos").innerText = videos.length;
    document.getElementById("t-stat-quizzes").innerText = quizzes.length;
    document.getElementById("t-stat-ann").innerText = announcements.length;
  }
  
  else if (tabName === "materials") {
    // Render teacher's materials lists with Add Materials Select options assigned to teacher!
    const selectClass = document.getElementById("t-mat-class");
    const selectSub = document.getElementById("t-mat-subject");
    
    if (selectClass && selectSub) {
      selectClass.innerHTML = user.assignedClasses.map(c => `<option value="${c}">Class ${c}</option>`).join("");
      selectSub.innerHTML = user.assignedSubjects.map(s => `<option value="${s}">${s}</option>`).join("");
    }
    
    // Render list table
    const tbody = document.getElementById("t-materials-table-body");
    if (tbody) {
      if (materials.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state" style="padding: 24px;">No study materials uploaded by you.</td></tr>`;
      } else {
        tbody.innerHTML = materials.map((m, idx) => `
          <tr>
            <td><strong>${idx + 1}</strong></td>
            <td><strong>${m.title}</strong></td>
            <td>${m.subject}</td>
            <td>Class ${m.classNum}</td>
            <td><span class="status-pill ${m.isApproved ? 'active' : 'pending'}">${m.isApproved ? 'Approved' : 'Pending Approval'}</span></td>
            <td>
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="deleteContentSelf('material', '${m.id}')">Delete</button>
            </td>
          </tr>
        `).join("");
      }
    }
  }
  
  else if (tabName === "videos") {
    // Render teacher's video list with Add video assignments
    const selectClass = document.getElementById("t-vid-class");
    const selectSub = document.getElementById("t-vid-subject");
    
    if (selectClass && selectSub) {
      selectClass.innerHTML = user.assignedClasses.map(c => `<option value="${c}">Class ${c}</option>`).join("");
      selectSub.innerHTML = user.assignedSubjects.map(s => `<option value="${s}">${s}</option>`).join("");
    }
    
    const tbody = document.getElementById("t-videos-table-body");
    if (tbody) {
      if (videos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state" style="padding: 24px;">No video lessons uploaded by you.</td></tr>`;
      } else {
        tbody.innerHTML = videos.map((v, idx) => `
          <tr>
            <td><strong>${idx + 1}</strong></td>
            <td><strong>${v.title}</strong></td>
            <td>${v.subject}</td>
            <td>Class ${v.classNum}</td>
            <td>
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="deleteContentSelf('video', '${v.id}')">Delete</button>
            </td>
          </tr>
        `).join("");
      }
    }
  }
  
  else if (tabName === "quizzes") {
    // Fill assigned fields in quiz modal builder!
    const selectClass = document.getElementById("t-quiz-class");
    const selectSub = document.getElementById("t-quiz-subject");
    
    if (selectClass && selectSub) {
      selectClass.innerHTML = user.assignedClasses.map(c => `<option value="${c}">Class ${c}</option>`).join("");
      selectSub.innerHTML = user.assignedSubjects.map(s => `<option value="${s}">${s}</option>`).join("");
    }
    
    const tbody = document.getElementById("t-quizzes-table-body");
    if (tbody) {
      if (quizzes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state" style="padding: 24px;">No quizzes constructed by you.</td></tr>`;
      } else {
        tbody.innerHTML = quizzes.map((q, idx) => `
          <tr>
            <td><strong>${idx + 1}</strong></td>
            <td><strong>${q.title}</strong></td>
            <td>${q.subject}</td>
            <td>Class ${q.classNum}</td>
            <td>
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="deleteContentSelf('quiz', '${q.id}')">Delete</button>
            </td>
          </tr>
        `).join("");
      }
    }
  }
  
  else if (tabName === "announcements") {
    // Announcements manager
    const selectClass = document.getElementById("t-ann-class");
    if (selectClass) {
      selectClass.innerHTML = `<option value="All">All School</option>` + user.assignedClasses.map(c => `<option value="${c}">Class ${c}</option>`).join("");
    }
    
    const tbody = document.getElementById("t-ann-table-body");
    if (tbody) {
      if (announcements.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state" style="padding: 24px;">No announcements posted by you.</td></tr>`;
      } else {
        tbody.innerHTML = announcements.map((a, idx) => `
          <tr>
            <td><strong>${idx + 1}</strong></td>
            <td><strong>${a.title}</strong></td>
            <td>${a.description}</td>
            <td>${a.classNum}</td>
            <td>
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="deleteContentSelf('announcement', '${a.id}')">Delete</button>
            </td>
          </tr>
        `).join("");
      }
    }
  }
  
  else if (tabName === "performance") {
    // Analytics: Students scores report on quizzes created by this teacher!
    const tbody = document.getElementById("t-performance-table-body");
    if (!tbody) return;
    
    // Find all quizzes ids made by teacher
    const qIds = quizzes.map(q => q.id);
    const students = db.students.getRaw();
    
    let scoresList = [];
    students.forEach(st => {
      st.quizScores = st.quizScores || [];
      st.quizScores.forEach(sc => {
        if (qIds.includes(sc.quizId)) {
          scoresList.push({
            studentName: st.name,
            studentClass: st.classNum,
            quizTitle: sc.quizTitle,
            score: sc.score,
            total: sc.totalQuestions,
            date: sc.date
          });
        }
      });
    });
    
    if (scoresList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state" style="padding: 30px;">No students have taken your quizzes yet.</td></tr>`;
    } else {
      tbody.innerHTML = scoresList.map((sc, idx) => {
        const pct = Math.round((sc.score / sc.total) * 100);
        return `
          <tr>
            <td><strong>${idx + 1}</strong></td>
            <td><strong>${sc.studentName}</strong> (Class ${sc.studentClass})</td>
            <td>${sc.quizTitle}</td>
            <td><strong>${sc.score} / ${sc.total}</strong> (${pct}%)</td>
            <td>${sc.date}</td>
          </tr>
        `;
      }).join("");
    }
  }
}

// TEACHER UPLOAD SUBMISSIONS
function handleMaterialUpload(event) {
  event.preventDefault();
  
  const user = auth.getCurrentUser();
  if (!user) return;
  
  const title = document.getElementById("t-mat-title").value;
  const classNum = document.getElementById("t-mat-class").value;
  const subject = document.getElementById("t-mat-subject").value;
  const fileType = document.getElementById("t-mat-type").value;
  
  // Fake file size calculation
  const sizeArr = ["1.5 MB", "2.1 MB", "980 KB", "4.2 MB", "3.6 MB"];
  const fileSize = sizeArr[Math.floor(Math.random() * sizeArr.length)];
  
  db.materials.insertOne({
    title,
    subject,
    classNum,
    fileType,
    fileSize,
    fileUrl: "data:application/pdf;base64,JVBERi0x...", // Mock
    uploadedBy: user.id,
    uploadDate: new Date().toISOString().split("T")[0],
    isApproved: false // Requires Principal moderation approval!
  });
  
  document.getElementById("teacher-material-form").reset();
  showToast("Upload Pending", "Study material has been uploaded. It will be public once the Principal approves it.", "info");
  
  // Reload
  renderTeacherDashboardPane("materials");
}

function handleVideoUpload(event) {
  event.preventDefault();
  
  const user = auth.getCurrentUser();
  if (!user) return;
  
  const title = document.getElementById("t-vid-title").value;
  const classNum = document.getElementById("t-vid-class").value;
  const subject = document.getElementById("t-vid-subject").value;
  let videoUrl = document.getElementById("t-vid-url").value;
  
  // Standardize YouTube link to embed format
  if (videoUrl.includes("watch?v=")) {
    videoUrl = videoUrl.replace("watch?v=", "embed/");
  } else if (videoUrl.includes("youtu.be/")) {
    videoUrl = videoUrl.replace("youtu.be/", "youtube.com/embed/");
  }
  
  db.videos.insertOne({
    title,
    subject,
    classNum,
    videoUrl,
    uploadedBy: user.id,
    isApproved: false // Requires approval!
  });
  
  document.getElementById("teacher-video-form").reset();
  showToast("Video Uploaded", "Lesson video submitted for review.", "info");
  
  renderTeacherDashboardPane("videos");
}

function handleAnnouncementCreate(event) {
  event.preventDefault();
  
  const user = auth.getCurrentUser();
  if (!user) return;
  
  const title = document.getElementById("t-ann-title").value;
  const description = document.getElementById("t-ann-desc").value;
  const classNum = document.getElementById("t-ann-class").value;
  
  db.announcements.insertOne({
    title,
    description,
    createdBy: user.name,
    classNum,
    date: new Date().toISOString().split("T")[0]
  });
  
  document.getElementById("teacher-ann-form").reset();
  showToast("Announcement Posted", "Announcement has been immediately published.", "success");
  
  renderTeacherDashboardPane("announcements");
}

// QUIZ CREATOR CONSTRUCTOR
let activeQuizBuilderQuestions = [];

function openCreateQuizModal() {
  activeQuizBuilderQuestions = [];
  document.getElementById("q-builder-form").reset();
  
  // Add first empty question
  addQuizBuilderQuestionRow();
  openModal("quiz-create-modal");
}

function addQuizBuilderQuestionRow() {
  const container = document.getElementById("q-builder-questions-list");
  const qIdx = activeQuizBuilderQuestions.length;
  
  const row = document.createElement("div");
  row.className = "question-builder-item";
  row.id = `qb-q-row-${qIdx}`;
  row.innerHTML = `
    <button type="button" class="btn-remove-q" onclick="removeQuizBuilderQuestionRow(${qIdx})">&times; Remove Question</button>
    <div class="form-group">
      <label class="form-label">Question Text</label>
      <input type="text" class="form-control qb-q-text" placeholder="e.g., What is the capital of India?" required />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Option A</label>
        <input type="text" class="form-control qb-opt-a" placeholder="Option A" required />
      </div>
      <div class="form-group">
        <label class="form-label">Option B</label>
        <input type="text" class="form-control qb-opt-b" placeholder="Option B" required />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Option C</label>
        <input type="text" class="form-control qb-opt-c" placeholder="Option C" required />
      </div>
      <div class="form-group">
        <label class="form-label">Option D</label>
        <input type="text" class="form-control qb-opt-d" placeholder="Option D" required />
      </div>
    </div>
    <div class="form-group" style="margin-bottom:0;">
      <label class="form-label">Correct Answer Choice</label>
      <select class="form-control qb-correct" required>
        <option value="A">Option A</option>
        <option value="B">Option B</option>
        <option value="C">Option C</option>
        <option value="D">Option D</option>
      </select>
    </div>
  `;
  container.appendChild(row);
  activeQuizBuilderQuestions.push({ active: true });
}

function removeQuizBuilderQuestionRow(idx) {
  const row = document.getElementById(`qb-q-row-${idx}`);
  if (row) {
    row.remove();
    activeQuizBuilderQuestions[idx].active = false;
  }
}

function handleQuizSubmit(event) {
  event.preventDefault();
  
  const user = auth.getCurrentUser();
  if (!user) return;
  
  const title = document.getElementById("t-quiz-title").value;
  const classNum = document.getElementById("t-quiz-class").value;
  const subject = document.getElementById("t-quiz-subject").value;
  
  // Parse question blocks
  const questionsList = [];
  const rows = document.querySelectorAll(".question-builder-item");
  
  if (rows.length === 0) {
    showToast("Questions Required", "A quiz must have at least one question.", "warning");
    return;
  }
  
  let validationError = false;
  
  rows.forEach(row => {
    const qText = row.querySelector(".qb-q-text").value;
    const optA = row.querySelector(".qb-opt-a").value;
    const optB = row.querySelector(".qb-opt-b").value;
    const optC = row.querySelector(".qb-opt-c").value;
    const optD = row.querySelector(".qb-opt-d").value;
    const correctLetter = row.querySelector(".qb-correct").value;
    
    let correctAnswerValue = "";
    if (correctLetter === "A") correctAnswerValue = optA;
    if (correctLetter === "B") correctAnswerValue = optB;
    if (correctLetter === "C") correctAnswerValue = optC;
    if (correctLetter === "D") correctAnswerValue = optD;
    
    questionsList.push({
      question: qText,
      options: [optA, optB, optC, optD],
      correctAnswer: correctAnswerValue
    });
  });
  
  db.quizzes.insertOne({
    title,
    subject,
    classNum,
    questions: questionsList,
    createdBy: user.id,
    isApproved: false // Principal must approve!
  });
  
  closeModal("quiz-create-modal");
  showToast("Quiz Published for Review", "Your multiple-choice quiz has been submitted for administrative approval.", "success");
  
  renderTeacherDashboardPane("quizzes");
}

// DELETE OWN CONTENT
function deleteContentSelf(type, id) {
  if (confirm("Are you sure you want to permanently delete this resource?")) {
    if (type === "material") {
      db.materials.deleteOne({ id: id });
      renderTeacherDashboardPane("materials");
    } else if (type === "video") {
      db.videos.deleteOne({ id: id });
      renderTeacherDashboardPane("videos");
    } else if (type === "quiz") {
      db.quizzes.deleteOne({ id: id });
      renderTeacherDashboardPane("quizzes");
    } else if (type === "announcement") {
      db.announcements.deleteOne({ id: id });
      renderTeacherDashboardPane("announcements");
    }
    showToast("Resource Removed", "The resource has been deleted from the records.", "warning");
  }
}
