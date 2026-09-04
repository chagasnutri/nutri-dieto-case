// Controlador Principal da Aplicação - Simulador Clínico de Dietoterapia

document.addEventListener("DOMContentLoaded", () => {
  // Instâncias dos controladores
  const chatEngine = new ClinicalChatEngine();
  const prontuarioManager = new StudentProntuarioManager();
  const adminManager = new AdminManager();

  // Estado da aplicação
  let appState = {
    mode: "student", // 'student' ou 'admin'
    currentCaseId: null,
    currentCase: null,
    activeInterlocutor: "paciente",
    activeStudentTab: "anamnese",
    activeAdminTab: "identificacao",
    chatHistories: {}, // caseId -> { role -> [messages] }
    currentProntuario: null,
    studentSelectedDisciplinaId: null
  };

  // Constante de segurança para acesso exclusivo do docente
  const TEACHER_PASSWORD = "Nutri2@26";
  let isTeacherAuthenticated = false;

  // Elementos do DOM principais
  const modeBadge = document.getElementById("modeBadge");
  const switchModeBtn = document.getElementById("switchModeBtn");
  const teacherBtnText = document.getElementById("teacherBtnText");
  const navBrandBtn = document.getElementById("navBrandBtn");
  const navStudentCatalogBtn = document.getElementById("navStudentCatalogBtn");
  const backToCatalogBtn = document.getElementById("backToCatalogBtn");
  
  const studentView = document.getElementById("studentView");
  const studentCatalogSection = document.getElementById("studentCatalogSection");
  const studentSimulationContainer = document.getElementById("studentSimulationContainer");
  const studentCasesGrid = document.getElementById("studentCasesGrid");
  const catalogSearchInput = document.getElementById("catalogSearchInput");
  
  const adminView = document.getElementById("adminView");
  const caseSelectDropdown = document.getElementById("caseSelectDropdown");
  const interlocutorSelect = document.getElementById("interlocutorSelect");
  const interlocutorAvatar = document.getElementById("interlocutorAvatar");
  const interlocutorName = document.getElementById("interlocutorName");
  const interlocutorRole = document.getElementById("interlocutorRole");
  const chatMessagesList = document.getElementById("chatMessagesList");
  const chatInput = document.getElementById("chatInput");
  const sendChatBtn = document.getElementById("sendChatBtn");
  const clearChatBtn = document.getElementById("clearChatBtn");
  const saveDraftBtn = document.getElementById("saveDraftBtn");
  const finalizeAndExportDocxBtn = document.getElementById("finalizeAndExportDocxBtn");
  const apiKeyModal = document.getElementById("apiKeyModal");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const saveApiKeyBtn = document.getElementById("saveApiKeyBtn");
  const openApiKeyBtn = document.getElementById("openApiKeyBtn");
  const closeApiKeyModalBtn = document.getElementById("closeApiKeyModalBtn");
  const submissionConfirmModal = document.getElementById("submissionConfirmModal");
  const closeSubmissionModalBtn = document.getElementById("closeSubmissionModalBtn");

  // Elementos do modal de acesso restrito do professor
  const teacherPasswordModal = document.getElementById("teacherPasswordModal");
  const teacherPasswordForm = document.getElementById("teacherPasswordForm");
  const teacherPasswordInput = document.getElementById("teacherPasswordInput");
  const teacherPasswordError = document.getElementById("teacherPasswordError");
  const closeTeacherPasswordModalBtn = document.getElementById("closeTeacherPasswordModalBtn");
  const adminLockSessionBtn = document.getElementById("adminLockSessionBtn");

  // Filtros ativos do catálogo do aluno
  let currentCatalogFilter = "all"; // 'all', 'available', 'locked'
  let currentCatalogSearch = "";

  // Inicialização
  function initApp() {
    loadCasesIntoDropdown();
    setupEventListeners();
    setupAdminUI();
    renderStudentDisciplinePortal();
    renderAdminDisciplineTabs();
    showStudentCatalog();

    // Inicializa o Motor de Sincronização Automática com o Servidor Central
    if (typeof dietoSyncEngine !== "undefined") {
      dietoSyncEngine.onStatusChange((status) => {
        const badge = document.getElementById("navSyncBadge");
        const dot = document.getElementById("navSyncDot");
        const text = document.getElementById("navSyncText");
        if (!badge || !dot || !text) return;
        badge.classList.remove("hidden");
        if (status === "syncing") {
          dot.className = "w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-1.5";
          text.textContent = "Sincronizando...";
          badge.className = "hidden sm:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs";
        } else if (status === "online") {
          dot.className = "w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5";
          text.textContent = "Servidor Conectado";
          badge.className = "hidden sm:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs";
        } else {
          dot.className = "w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5";
          text.textContent = "Modo Local";
          badge.className = "hidden sm:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs";
        }
      });

      dietoSyncEngine.onDataUpdated(({ disciplinas, cases, isInitial }) => {
        syncAppStateAndNotify();
        if (!isTeacherAuthenticated && !isInitial) {
          showToast("🔄 Disciplinas e casos atualizados em tempo real pelo professor!");
        }
      });

      dietoSyncEngine.init();
    }

    // Ouvinte instantâneo de alterações realizadas em outras abas ou janelas
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY_CASES || e.key === STORAGE_KEY_DISCIPLINAS) {
        console.log("⚡ Alteração sincronizada via storage event:", e.key);
        syncAppStateAndNotify();
      }
    });

    // Suporte a parâmetro de visualização na URL (ex: ?view=simulation, ?view=password, ?view=admin, ?view=upload)
    const urlParams = new URLSearchParams(window.location.search);
    const requestedView = urlParams.get("view");
    if (requestedView === "simulation") {
      showStudentSimulation("caso-dm2-has");
    } else if (requestedView === "password") {
      showTeacherPanel();
    } else if (requestedView === "admin") {
      isTeacherAuthenticated = true;
      showTeacherPanel();
      if (urlParams.get("action") === "edit") {
        const cId = urlParams.get("caseId") || adminManager.cases[0]?.id;
        const c = adminManager.getCaseById(cId) || adminManager.cases[0];
        if (c) {
          adminManager.editingCaseId = c.id;
          populateAdminEditor(c);
          openAdminEditor();
        }
      }
    } else if (requestedView === "upload") {
      isTeacherAuthenticated = true;
      showTeacherPanel();
      showAdminUploadCase();
    } else if (requestedView === "discipline") {
      const discId = urlParams.get("id") || "dietoterapia";
      openStudentDiscipline(discId);
    }

    const requestedTab = urlParams.get("tab");
    if (requestedTab) {
      setTimeout(() => {
        const tabBtn = document.querySelector(`.student-tab-btn[data-tab="${requestedTab}"]`);
        if (tabBtn) tabBtn.click();
      }, 150);
    }

    const requestedAdminTab = urlParams.get("admintab");
    if (requestedAdminTab) {
      setTimeout(() => {
        const admTabBtn = document.querySelector(`.admin-editor-tab-btn[data-admintab="${requestedAdminTab}"]`);
        if (admTabBtn) admTabBtn.click();
      }, 150);
    }

    if (urlParams.get("modal") === "newdisc") {
      document.getElementById("adminNewDisciplineBtn")?.click();
    } else if (urlParams.get("modal") === "install") {
      document.getElementById("navInstallAppBtn")?.click();
    } else if (urlParams.get("modal") === "deletedisc") {
      setTimeout(() => document.getElementById("adminDeleteDisciplineBtn")?.click(), 200);
    }
  }

  // Exibe o Painel do Aluno (Portal de Disciplinas inicialmente; casos só aparecem após o clique na disciplina)
  function showStudentCatalog(disciplinaId = null) {
    isTeacherAuthenticated = false;
    appState.mode = "student-catalog";
    studentView.classList.remove("hidden");
    adminView.classList.add("hidden");
    
    if (studentCatalogSection) studentCatalogSection.classList.remove("hidden");
    if (studentSimulationContainer) studentSimulationContainer.classList.add("hidden");

    modeBadge.textContent = "PAINEL DO ALUNO";
    modeBadge.className = "badge-clinical bg-emerald-100 text-emerald-800 border border-emerald-300";
    
    if (navStudentCatalogBtn) {
      navStudentCatalogBtn.className = "bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center space-x-1.5";
    }
    if (switchModeBtn) {
      switchModeBtn.className = "bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition flex items-center space-x-1.5";
    }
    if (teacherBtnText) teacherBtnText.textContent = "Painel do Professor";

    if (disciplinaId) {
      openStudentDiscipline(disciplinaId);
    } else if (appState.studentSelectedDisciplinaId) {
      openStudentDiscipline(appState.studentSelectedDisciplinaId);
    } else {
      backToStudentDisciplinePortal();
    }
  }

  // Exibe a Tela de Simulação e Prontuário do Caso Selecionado
  function showStudentSimulation(caseId) {
    const found = adminManager.getCaseById(caseId);
    if (!found) return;

    if (found.isLocked) {
      showToast("🔒 Este caso está bloqueado pelo professor. Aguarde a liberação para realizar o atendimento.", "warning");
      return;
    }

    appState.mode = "student-simulation";
    selectCase(caseId);

    studentView.classList.remove("hidden");
    adminView.classList.add("hidden");
    
    if (studentCatalogSection) studentCatalogSection.classList.add("hidden");
    if (studentSimulationContainer) studentSimulationContainer.classList.remove("hidden");

    modeBadge.textContent = "SIMULAÇÃO DO CASO";
    modeBadge.className = "badge-clinical bg-emerald-100 text-emerald-800 border border-emerald-300";

    if (navStudentCatalogBtn) {
      navStudentCatalogBtn.className = "bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition flex items-center space-x-1.5";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Exibe o Template 2: Painel do Professor / Administrador (requer senha Nutri2@26)
  function showTeacherPanel() {
    if (!isTeacherAuthenticated) {
      teacherPasswordInput.value = "";
      teacherPasswordError.classList.add("hidden");
      teacherPasswordModal.classList.remove("hidden");
      setTimeout(() => teacherPasswordInput.focus(), 100);
      return;
    }

    appState.mode = "admin";
    studentView.classList.add("hidden");
    adminView.classList.remove("hidden");

    document.getElementById("adminCasesListSection").classList.remove("hidden");
    document.getElementById("adminCaseEditorSection").classList.add("hidden");
    document.getElementById("adminUploadCaseSection")?.classList.add("hidden");

    modeBadge.textContent = "PAINEL DO PROFESSOR";
    modeBadge.className = "badge-clinical bg-purple-100 text-purple-800 border border-purple-300";

    if (navStudentCatalogBtn) {
      navStudentCatalogBtn.className = "bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition flex items-center space-x-1.5";
    }
    if (switchModeBtn) {
      switchModeBtn.className = "bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition flex items-center space-x-1.5";
    }
    if (teacherBtnText) teacherBtnText.textContent = "Professor (Ativo)";

    renderAdminDisciplineTabs();
    updateAdminMetrics();
    renderAdminCasesList();
  }

  // Preenche os selects de disciplinas no editor e na área de upload
  function populateDisciplineDropdowns() {
    const disciplinas = adminManager.refreshDisciplinas();

    // Dropdown no editor do caso (Aba 1)
    const editorSelect = document.getElementById("admCaseDiscipline");
    if (editorSelect) {
      const currentVal = editorSelect.value;
      editorSelect.innerHTML = "";
      disciplinas.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = `${d.icone || '📚'} ${d.nome} ${d.codigo ? '(' + d.codigo + ')' : ''}`;
        editorSelect.appendChild(opt);
      });
      if (currentVal && disciplinas.some(d => d.id === currentVal)) {
        editorSelect.value = currentVal;
      }
    }

    // Dropdown na seção de upload
    const uploadSelect = document.getElementById("adminUploadCaseDiscipline");
    if (uploadSelect) {
      const currentVal = uploadSelect.value;
      uploadSelect.innerHTML = "";
      disciplinas.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = `${d.icone || '📚'} ${d.nome} ${d.codigo ? '(' + d.codigo + ')' : ''}`;
        uploadSelect.appendChild(opt);
      });
      if (currentVal && disciplinas.some(d => d.id === currentVal)) {
        uploadSelect.value = currentVal;
      } else {
        uploadSelect.value = adminManager.activeDisciplinaId || "dietoterapia";
      }
    }
  }

  // Renderiza a barra de abas de disciplinas no Painel do Professor
  function renderAdminDisciplineTabs() {
    const container = document.getElementById("adminDisciplineTabsContainer");
    if (!container) return;
    container.innerHTML = "";

    const disciplinas = adminManager.refreshDisciplinas();
    const activeId = adminManager.activeDisciplinaId || "dietoterapia";

    disciplinas.forEach(d => {
      const caseCount = adminManager.cases.filter(c => (c.disciplinaId || "dietoterapia") === d.id).length;
      const isActive = d.id === activeId;

      const tabBtn = document.createElement("button");
      tabBtn.type = "button";
      tabBtn.className = `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
        isActive 
          ? 'bg-indigo-600 text-white shadow-xs' 
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
      }`;
      tabBtn.innerHTML = `
        <span class="text-sm">${d.icone || '📚'}</span>
        <span>${escapeHtml(d.nome)}</span>
        ${d.codigo ? `<span class="text-[10px] px-1 py-0.2 rounded font-mono ${isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-600'}">${escapeHtml(d.codigo)}</span>` : ''}
        <span class="ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-700'}">${caseCount}</span>
      `;

      tabBtn.addEventListener("click", () => {
        adminManager.activeDisciplinaId = d.id;
        renderAdminDisciplineTabs();
        renderAdminCasesList();
      });

      container.appendChild(tabBtn);
    });

    populateDisciplineDropdowns();
  }

  // Renderiza a vitrine de disciplinas no painel do aluno (casos ocultos nesta tela)
  function renderStudentDisciplinePortal() {
    const container = document.getElementById("studentDisciplinesCardsContainer");
    if (!container) return;
    container.innerHTML = "";

    adminManager.refreshCases();
    const disciplinas = adminManager.refreshDisciplinas();
    let totalAvailAcrossAll = 0;

    const portalTotalDisciplinas = document.getElementById("portalTotalDisciplinasCount");
    const portalTotalCases = document.getElementById("portalTotalCasesAvailable");
    if (portalTotalDisciplinas) portalTotalDisciplinas.textContent = disciplinas.length;

    disciplinas.forEach(d => {
      const casesInDisc = adminManager.cases.filter(c => (c.disciplinaId || "dietoterapia") === d.id);
      const totalCount = casesInDisc.length;
      const availCount = casesInDisc.filter(c => !c.isLocked).length;
      totalAvailAcrossAll += availCount;

      const card = document.createElement("div");
      card.className = "bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between group cursor-pointer";

      card.innerHTML = `
        <div>
          <div class="flex items-start justify-between gap-2 mb-3.5">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition">
              ${d.icone || '📚'}
            </div>
            <div class="flex flex-col items-end">
              ${d.codigo ? `<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">${escapeHtml(d.codigo)}</span>` : ''}
              <span class="text-[11px] font-bold mt-1 ${availCount > 0 ? 'text-emerald-700' : 'text-slate-400'}">
                ${availCount > 0 ? `🟢 ${availCount} liberado(s)` : '🔒 Em preparação'}
              </span>
            </div>
          </div>

          <h3 class="text-base font-black text-slate-900 mb-1 group-hover:text-emerald-700 transition">
            ${escapeHtml(d.nome)}
          </h3>
          <p class="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
            ${escapeHtml(d.descricao || 'Casos clínicos simulados e prontuários direcionados para esta disciplina.')}
          </p>

          <div class="flex items-center space-x-3 text-xs text-slate-500 border-t border-slate-100 pt-3 mb-4">
            <span class="font-semibold text-slate-700">📁 ${totalCount} caso(s) cadastrado(s)</span>
          </div>
        </div>

        <button class="student-enter-disc-btn w-full bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs group-hover:bg-emerald-600 transition flex items-center justify-center space-x-1.5 cursor-pointer">
          <span>Acessar Casos da Disciplina</span>
          <span>→</span>
        </button>
      `;

      card.querySelector(".student-enter-disc-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        openStudentDiscipline(d.id);
      });
      card.addEventListener("click", () => {
        openStudentDiscipline(d.id);
      });

      container.appendChild(card);
    });

    if (portalTotalCases) portalTotalCases.textContent = totalAvailAcrossAll;
  }

  // Abre os casos de uma disciplina específica no painel do aluno
  function openStudentDiscipline(disciplinaId) {
    appState.studentSelectedDisciplinaId = disciplinaId;

    const portalSection = document.getElementById("studentDisciplinePortalSection");
    const casesSection = document.getElementById("studentDisciplineCasesSection");
    if (portalSection) portalSection.classList.add("hidden");
    if (casesSection) casesSection.classList.remove("hidden");

    const disc = adminManager.getDisciplinaById(disciplinaId) || {
      nome: "Disciplina",
      icone: "📚",
      descricao: "Casos clínicos da disciplina"
    };

    const iconEl = document.getElementById("studentSelectedDisciplineIcon");
    const titleEl = document.getElementById("studentSelectedDisciplineTitle");
    const descEl = document.getElementById("studentSelectedDisciplineDesc");

    if (iconEl) iconEl.textContent = disc.icone || "📚";
    if (titleEl) titleEl.textContent = disc.nome;
    if (descEl) descEl.textContent = disc.descricao || "Casos clínicos da disciplina";

    renderStudentQuickDisciplineTabs();
    renderStudentCatalog(currentCatalogFilter, currentCatalogSearch);
  }

  // Renderiza as abas horizontais de disciplinas no topo dos casos para troca rápida
  function renderStudentQuickDisciplineTabs() {
    const container = document.getElementById("studentQuickDisciplineTabs");
    if (!container) return;
    container.innerHTML = "";

    const disciplinas = adminManager.refreshDisciplinas();
    const activeId = appState.studentSelectedDisciplinaId;

    disciplinas.forEach(d => {
      const casesInDisc = adminManager.cases.filter(c => (c.disciplinaId || "dietoterapia") === d.id);
      const availCount = casesInDisc.filter(c => !c.isLocked).length;
      const isActive = d.id === activeId;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
        isActive
          ? 'bg-emerald-600 text-white shadow-xs'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
      }`;

      btn.innerHTML = `
        <span>${d.icone || '📚'}</span>
        <span>${escapeHtml(d.nome)}</span>
        <span class="ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-700'}">${availCount}</span>
      `;

      btn.addEventListener("click", () => {
        openStudentDiscipline(d.id);
      });

      container.appendChild(btn);
    });
  }

  // Retorna à visualização de disciplinas (sem casos aparecendo)
  function backToStudentDisciplinePortal() {
    appState.studentSelectedDisciplinaId = null;
    const portalSection = document.getElementById("studentDisciplinePortalSection");
    const casesSection = document.getElementById("studentDisciplineCasesSection");
    if (portalSection) portalSection.classList.remove("hidden");
    if (casesSection) casesSection.classList.add("hidden");
    renderStudentDisciplinePortal();
  }

  // Atualiza os contadores de métricas no topo do painel do professor
  function updateAdminMetrics() {
    adminManager.refreshCases();
    const cases = adminManager.cases;
    const total = cases.length;
    const unlocked = cases.filter(c => !c.isLocked).length;
    const locked = cases.filter(c => c.isLocked).length;

    const elTotal = document.getElementById("admMetricTotalCases");
    const elUnlocked = document.getElementById("admMetricUnlockedCases");
    const elLocked = document.getElementById("admMetricLockedCases");

    if (elTotal) elTotal.textContent = total;
    if (elUnlocked) elUnlocked.textContent = unlocked;
    if (elLocked) elLocked.textContent = locked;
  }

  // Renderiza a Vitrine de Casos do Aluno filtrada pela disciplina selecionada
  function renderStudentCatalog(filter = currentCatalogFilter, search = currentCatalogSearch) {
    adminManager.refreshCases();
    const allCases = adminManager.cases;
    const selectedDiscId = appState.studentSelectedDisciplinaId || "dietoterapia";
    const selectedDisc = adminManager.getDisciplinaById(selectedDiscId);

    // Filtra casos pertencentes à disciplina selecionada pelo aluno
    const discCases = allCases.filter(c => (c.disciplinaId || "dietoterapia") === selectedDiscId);
    const total = discCases.length;
    const available = discCases.filter(c => !c.isLocked).length;
    const locked = discCases.filter(c => c.isLocked).length;

    // Atualiza contadores visuais
    const elAvail = document.getElementById("catalogAvailableCount");
    const elLock = document.getElementById("catalogLockedCount");
    const elCountAll = document.getElementById("countAllFilter");
    const elCountAvail = document.getElementById("countAvailableFilter");
    const elCountLock = document.getElementById("countLockedFilter");

    if (elAvail) elAvail.textContent = available;
    if (elLock) elLock.textContent = locked;
    if (elCountAll) elCountAll.textContent = total;
    if (elCountAvail) elCountAvail.textContent = available;
    if (elCountLock) elCountLock.textContent = locked;

    // Aplica filtro de status
    let filtered = discCases;
    if (filter === "available") {
      filtered = filtered.filter(c => !c.isLocked);
    } else if (filter === "locked") {
      filtered = filtered.filter(c => c.isLocked);
    }

    // Aplica busca por texto
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(c => {
        return (c.title && c.title.toLowerCase().includes(q)) ||
               (c.description && c.description.toLowerCase().includes(q)) ||
               (c.patient?.name && c.patient.name.toLowerCase().includes(q)) ||
               (c.patient?.occupation && c.patient.occupation.toLowerCase().includes(q)) ||
               (c.history?.queixaPrincipal && c.history.queixaPrincipal.toLowerCase().includes(q));
      });
    }

    if (!studentCasesGrid) return;
    studentCasesGrid.innerHTML = "";

    if (filtered.length === 0) {
      if (discCases.length === 0) {
        studentCasesGrid.innerHTML = `
          <div class="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500">
            <div class="text-3xl mb-2">${selectedDisc?.icone || '📁'}</div>
            <h4 class="font-bold text-sm text-slate-700 mb-1">Nenhum caso clínico cadastrado ainda</h4>
            <p class="text-xs text-slate-400">A disciplina "${escapeHtml(selectedDisc?.nome || 'selecionada')}" ainda não possui casos clínicos publicados. Aguarde a liberação pelo professor.</p>
          </div>
        `;
      } else {
        studentCasesGrid.innerHTML = `
          <div class="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500">
            <div class="text-3xl mb-2">🔍</div>
            <h4 class="font-bold text-sm text-slate-700 mb-1">Nenhum caso encontrado para este filtro</h4>
            <p class="text-xs text-slate-400">Tente ajustar os filtros de status ou o termo de pesquisa.</p>
          </div>
        `;
      }
      return;
    }

    filtered.forEach(c => {
      const isLocked = !!c.isLocked;
      const card = document.createElement("div");
      card.className = `catalog-case-card bg-white border ${isLocked ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'} rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden`;

      card.innerHTML = `
        ${isLocked 
          ? '<div class="absolute top-0 left-0 right-0 h-1 bg-amber-400"></div>' 
          : '<div class="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>'
        }
        <div>
          <!-- Header do Card -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="badge-clinical bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">
              ${escapeHtml(c.category || 'Ambulatorial')}
            </span>
            ${isLocked ? `
              <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <span>🔒</span> <span>Travado pelo Professor</span>
              </span>
            ` : `
              <span class="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Disponível</span>
              </span>
            `}
          </div>

          <!-- Identificação do Paciente -->
          <div class="flex items-start space-x-3 mb-2.5">
            <div class="w-12 h-12 rounded-xl ${isLocked ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-800'} flex items-center justify-center text-2xl flex-shrink-0 shadow-2xs">
              ${c.patient?.avatar || (c.patient?.gender === 'F' ? '👵' : '👴')}
            </div>
            <div>
              <h3 class="font-bold text-base text-slate-800 leading-snug">${escapeHtml(c.title)}</h3>
              <p class="text-xs text-slate-500 font-medium">Paciente: <strong>${escapeHtml(c.patient?.name || 'Paciente')}</strong>, ${c.patient?.age || '--'} anos</p>
            </div>
          </div>

          <!-- Queixa / Descrição -->
          <p class="text-xs text-slate-600 line-clamp-2 mb-3.5 leading-relaxed">
            ${escapeHtml(c.description || c.history?.queixaPrincipal || 'Caso clínico de atendimento nutricional para estudo de conduta dietoterápica.')}
          </p>

          <!-- Badges de Informações Clínicas -->
          <div class="flex flex-wrap gap-1.5 mb-4 text-[10px]">
            <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">💼 ${escapeHtml(c.patient?.occupation || 'Atividade')}</span>
            <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">⚖️ Peso: ${c.antropometria?.pesoAtual || '--'} kg</span>
            <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">🧪 ${(c.bioquimica || []).length} exames</span>
            <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">❓ ${(c.questoesAvaliativas || []).length} questões</span>
          </div>
        </div>

        <!-- Ação do Card -->
        <div class="pt-3 border-t border-slate-100">
          ${isLocked ? `
            <button onclick="window.notifyCaseLocked('${c.id}')" class="w-full bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-800 border border-slate-200 hover:border-amber-300 text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 shadow-2xs">
              <span>🔒</span>
              <span>Caso Bloqueado pelo Docente</span>
            </button>
          ` : `
            <button onclick="window.startCaseFromCatalog('${c.id}')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5">
              <span>▶</span>
              <span>Acessar e Iniciar Atendimento</span>
            </button>
          `}
        </div>
      `;

      studentCasesGrid.appendChild(card);
    });
  }

  // Helpers globais para cliques nos cards do catálogo
  window.startCaseFromCatalog = function(caseId) {
    showStudentSimulation(caseId);
  };

  window.notifyCaseLocked = function(caseId) {
    showToast("🔒 Este caso está bloqueado pelo professor. Aguarde a liberação pelo docente para realizar a simulação.", "warning");
  };

  // Preenche dropdown de seleção de casos (filtrando casos liberados para os alunos)
  function loadCasesIntoDropdown() {
    adminManager.refreshCases();
    caseSelectDropdown.innerHTML = "";

    // Filtra casos que NÃO estão travados pelo professor
    const availableCases = adminManager.cases.filter(c => !c.isLocked);

    if (availableCases.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Nenhum caso liberado pelo professor";
      opt.disabled = true;
      opt.selected = true;
      caseSelectDropdown.appendChild(opt);
      return;
    }

    availableCases.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.title} (${c.patient.name})`;
      caseSelectDropdown.appendChild(opt);
    });

    // Se o caso atual for nulo ou não estiver liberado, seleciona o primeiro disponível
    if (!appState.currentCaseId || !availableCases.some(c => c.id === appState.currentCaseId)) {
      selectCase(availableCases[0].id);
    }
  }

  // Preenche dinamicamente o seletor de interlocutores do chat com os profissionais configurados para o caso
  function updateInterlocutorDropdown(currentCase) {
    if (!interlocutorSelect || !currentCase) return;
    interlocutorSelect.innerHTML = "";

    // 1. Sempre inclui Paciente e Acompanhante
    const optPac = document.createElement("option");
    optPac.value = "paciente";
    optPac.textContent = `👤 ${currentCase.patient?.name || "Paciente"}`;
    interlocutorSelect.appendChild(optPac);

    const optAcomp = document.createElement("option");
    optAcomp.value = "acompanhante";
    optAcomp.textContent = "👥 Acompanhante / Familiar";
    interlocutorSelect.appendChild(optAcomp);

    // 2. Inclui estritamente os profissionais ativos configurados pelo docente
    const equipe = (typeof normalizeEquipeMultiprofissional === "function")
      ? normalizeEquipeMultiprofissional(currentCase.equipeMultiprofissional)
      : [];

    equipe.forEach(prof => {
      const opt = document.createElement("option");
      opt.value = prof.id;
      opt.textContent = `${prof.avatar || '🩺'} ${prof.nome}`;
      interlocutorSelect.appendChild(opt);
    });

    // 3. Verifica se o interlocutor selecionado anteriormente ainda está disponível no caso
    const exists = Array.from(interlocutorSelect.options).some(o => o.value === appState.activeInterlocutor);
    if (exists) {
      interlocutorSelect.value = appState.activeInterlocutor;
    } else {
      appState.activeInterlocutor = "paciente";
      interlocutorSelect.value = "paciente";
    }
  }

  // Sincronização centralizada e re-renderização imediata de todas as telas (Aluno e Professor)
  function syncAppStateAndNotify(toastMessage = null) {
    adminManager.refreshDisciplinas();
    adminManager.refreshCases();

    // 1. Atualiza interface do Aluno
    renderStudentDisciplinePortal();
    if (appState.studentSelectedDisciplinaId) {
      if (!adminManager.getDisciplinaById(appState.studentSelectedDisciplinaId)) {
        appState.studentSelectedDisciplinaId = null;
        backToStudentDisciplinePortal();
      } else {
        renderStudentQuickDisciplineTabs();
        renderStudentCatalog();
      }
    }
    loadCasesIntoDropdown();

    // Se o aluno estiver dentro da simulação e o caso ativo foi atualizado
    if (appState.currentCase) {
      const updated = adminManager.getCaseById(appState.currentCase.id);
      if (updated) {
        appState.currentCase = updated;
        const patHeader = document.getElementById("simPatientHeaderName");
        if (patHeader) patHeader.textContent = updated.patient?.name || updated.title;
        updateInterlocutorDropdown(updated);
      }
    }

    // 2. Atualiza interface do Professor
    renderAdminDisciplineTabs();
    renderAdminCasesList();
    updateAdminMetrics();
    populateDisciplineDropdowns();

    // 3. Sincroniza com o servidor central e difunde para outras abas
    adminManager.triggerServerSync();

    if (toastMessage) {
      showToast(toastMessage);
    }
  }

  // Seleciona caso clínico ativo
  function selectCase(caseId) {
    const found = adminManager.getCaseById(caseId);
    if (!found) return;

    appState.currentCaseId = caseId;
    appState.currentCase = found;
    caseSelectDropdown.value = caseId;

    // Carrega prontuário do aluno (ou rascunho salvo)
    appState.currentProntuario = prontuarioManager.loadDraft(caseId);

    // Atualiza cabeçalho do caso
    document.getElementById("casePatientNameHeader").textContent = found.patient.name;
    document.getElementById("caseCategoryHeader").textContent = found.category;
    document.getElementById("caseDescHeader").textContent = found.description;

    // Atualiza lista dinâmica de interlocutores do caso no chat
    updateInterlocutorDropdown(found);

    // Atualiza interlocutor
    updateInterlocutorUI();

    // Renderiza mensagens do chat
    renderChatMessages();

    // Preenche campos do formulário do prontuário
    populateProntuarioForm();

    // Renderiza abas dinâmicas (exames laboratoriais, questões avaliativas)
    renderCaseLabExamsBadge();
    renderStudentEvaluationQuestions();
  }

  // Alterna entre Modo Aluno e Modo Administrador (mantido para compatibilidade)
  function switchMode(newMode) {
    if (newMode === "admin") {
      showTeacherPanel();
    } else {
      showStudentCatalog();
    }
  }

  // Atualiza UI do interlocutor no chat
  function updateInterlocutorUI() {
    const role = appState.activeInterlocutor;
    chatEngine.setRole(role);
    const info = chatEngine.getRoleInfo(role, appState.currentCase);

    interlocutorAvatar.textContent = info.avatar;
    interlocutorName.textContent = info.title;
    interlocutorRole.textContent = info.subtitle;
    renderChatMessages();
  }

  // Renderiza histórico de chat
  function renderChatMessages() {
    const caseId = appState.currentCaseId;
    const role = appState.activeInterlocutor;

    if (!appState.chatHistories[caseId]) {
      appState.chatHistories[caseId] = {};
    }
    if (!appState.chatHistories[caseId][role]) {
      // Mensagem inicial de acolhimento
      let defaultGreeting = "";
      const pName = appState.currentCase?.patient?.name || "o paciente";
      if (role === "paciente") {
        defaultGreeting = `Olá, doutor(a)! Bom dia/boa tarde. Eu sou ${pName}. Vim para a consulta de nutrição. Em que posso lhe ajudar?`;
      } else if (role === "acompanhante") {
        defaultGreeting = `Olá! Estou acompanhando ${pName} para ajudar a passar todas as informações da rotina e alimentação.`;
      } else if (role === "medico") {
        defaultGreeting = `Olá, colega nutricionista. Estou à disposição para alinhar as condutas e fornecer o parecer médico e prescrições deste caso.`;
      } else if (role === "enfermagem") {
        defaultGreeting = `Olá! Enfermagem do plantão à disposição. Pode perguntar sobre sinais vitais, balanço hídrico ou aceitação da dieta.`;
      } else if (role === "fono") {
        defaultGreeting = `Olá! Equipe de fonoaudiologia disponível para esclarecimentos sobre a deglutição, consistências e mastigação.`;
      } else if (role === "psicologia") {
        defaultGreeting = `Olá! Psicologia e Serviço Social à disposição para compartilhar os aspectos emocionais e apoio familiar.`;
      } else {
        const info = chatEngine.getRoleInfo(role, appState.currentCase);
        defaultGreeting = `Olá, colega nutricionista! Sou o(a) ${info.title}. Estou à disposição para discutir o caso clínico e fornecer as informações da nossa área.`;
      }

      appState.chatHistories[caseId][role] = [
        { sender: "bot", text: defaultGreeting, time: "Agora" }
      ];
    }

    const messages = appState.chatHistories[caseId][role];
    chatMessagesList.innerHTML = "";

    messages.forEach(msg => {
      const msgDiv = document.createElement("div");
      msgDiv.className = `flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`;

      if (msg.sender === "user") {
        msgDiv.innerHTML = `
          <div class="chat-bubble-user max-w-[82%] px-4 py-2 text-sm leading-relaxed">
            <p>${escapeHtml(msg.text)}</p>
            <span class="text-[10px] text-sky-100 block text-right mt-1 opacity-80">${msg.time}</span>
          </div>
        `;
      } else {
        const info = chatEngine.getRoleInfo(role, appState.currentCase);
        msgDiv.innerHTML = `
          <div class="flex items-start max-w-[85%] space-x-2">
            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-lg flex-shrink-0 shadow-sm border border-slate-200">
              ${info.avatar}
            </div>
            <div class="chat-bubble-bot px-4 py-2.5 text-sm leading-relaxed">
              <span class="text-[11px] font-semibold text-emerald-700 block mb-0.5">${info.title}</span>
              <p class="whitespace-pre-line text-slate-800">${escapeHtml(msg.text)}</p>
              <span class="text-[10px] text-slate-400 block text-right mt-1">${msg.time}</span>
            </div>
          </div>
        `;
      }
      chatMessagesList.appendChild(msgDiv);
    });

    // Auto-scroll para a última mensagem
    chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
  }

  // Envia mensagem no chat
  async function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text || !appState.currentCase) return;

    chatInput.value = "";
    const caseId = appState.currentCaseId;
    const role = appState.activeInterlocutor;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Adiciona pergunta do aluno
    appState.chatHistories[caseId][role].push({
      sender: "user",
      text: text,
      time: now
    });
    renderChatMessages();

    // Indicador de digitação
    const typingIndicator = document.createElement("div");
    typingIndicator.id = "typingIndicator";
    typingIndicator.className = "flex items-center space-x-2 text-xs text-slate-500 italic mb-2";
    typingIndicator.innerHTML = `
      <span class="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
      <span>${chatEngine.getRoleInfo(role, appState.currentCase).title} está respondendo...</span>
    `;
    chatMessagesList.appendChild(typingIndicator);
    chatMessagesList.scrollTop = chatMessagesList.scrollHeight;

    // Processamento da resposta estrita anti-alucinação
    try {
      const reply = await chatEngine.processQuestion(text, appState.currentCase, role);
      const indicator = document.getElementById("typingIndicator");
      if (indicator) indicator.remove();

      appState.chatHistories[caseId][role].push({
        sender: "bot",
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      renderChatMessages();
    } catch (err) {
      console.error("Erro no processamento da resposta:", err);
      const indicator = document.getElementById("typingIndicator");
      if (indicator) indicator.remove();

      appState.chatHistories[caseId][role].push({
        sender: "bot",
        text: "Desculpe, ocorreu uma instabilidade momentânea ao processar a resposta. Por favor, tente novamente.",
        time: now
      });
      renderChatMessages();
    }
  }

  // Preenche formulário do prontuário
  function populateProntuarioForm() {
    const p = appState.currentProntuario;
    if (!p) return;

    // Aluno
    document.getElementById("alunoNome").value = p.aluno.nome || "";
    document.getElementById("alunoMatricula").value = p.aluno.matriculaTurma || "";
    document.getElementById("alunoData").value = p.aluno.data || new Date().toISOString().split("T")[0];

    // Anamnese
    document.getElementById("prontQueixaPrincipal").value = p.anamnese.queixaPrincipal || "";
    document.getElementById("prontHistoriaClinica").value = p.anamnese.historiaClinica || "";
    document.getElementById("prontAntecedentesMed").value = p.anamnese.antecedentesMedicamentos || "";
    document.getElementById("prontHabitosEstiloVida").value = p.anamnese.habitosEstiloVida || "";

    // Antropometria
    document.getElementById("prontPesoAtual").value = p.antropometria.pesoAtual || "";
    document.getElementById("prontPesoHabitual").value = p.antropometria.pesoHabitual || "";
    document.getElementById("prontEstatura").value = p.antropometria.estatura || "";
    if (document.getElementById("prontAlturaJoelho")) {
      document.getElementById("prontAlturaJoelho").value = p.antropometria.alturaJoelho || "";
    }
    if (document.getElementById("prontCircCintura")) {
      document.getElementById("prontCircCintura").value = p.antropometria.circCintura || "";
    }
    if (document.getElementById("prontCircQuadril")) {
      document.getElementById("prontCircQuadril").value = p.antropometria.circQuadril || "";
    }
    if (document.getElementById("prontCircBraco")) {
      document.getElementById("prontCircBraco").value = p.antropometria.circBraco || "";
    }
    if (document.getElementById("prontCircPanturrilha")) {
      document.getElementById("prontCircPanturrilha").value = p.antropometria.circPanturrilha || "";
    }
    if (document.getElementById("prontDobraTricipital")) {
      document.getElementById("prontDobraTricipital").value = p.antropometria.dobraTricipital || "";
    }
    if (document.getElementById("prontDobraSubescapular")) {
      document.getElementById("prontDobraSubescapular").value = p.antropometria.dobraSubescapular || "";
    }
    if (document.getElementById("prontDobraSuprailiaca")) {
      document.getElementById("prontDobraSuprailiaca").value = p.antropometria.dobraSuprailiaca || "";
    }
    if (document.getElementById("prontDobraAbdominal")) {
      document.getElementById("prontDobraAbdominal").value = p.antropometria.dobraAbdominal || "";
    }
    if (document.getElementById("prontDemaisAvaliacoes")) {
      document.getElementById("prontDemaisAvaliacoes").value = p.antropometria.demaisAvaliacoes || "";
    }
    document.getElementById("prontCircunferencias").value = p.antropometria.circunferenciasDobras || "";
    updateAnthropometricCalculations();

    // Bioquímica
    document.getElementById("prontExamesRelevantes").value = p.bioquimica.examesRelevantes || "";
    document.getElementById("prontInterpretacaoBioq").value = p.bioquimica.interpretacaoNutricional || "";

    // Exame Físico
    document.getElementById("prontSinaisClinicos").value = p.exameFisico.sinaisClinicos || "";
    document.getElementById("prontMassaMuscular").value = p.exameFisico.massaMuscularAdiposa || "";
    document.getElementById("prontTGIEdemas").value = p.exameFisico.condicoesTGIeEdemas || "";

    // Consumo Alimentar
    document.getElementById("prontInqueritoResumo").value = p.consumoAlimentar.inqueritoResumo || "";
    document.getElementById("prontAguaPreferencias").value = p.consumoAlimentar.aguaPreferenciasAversoes || "";

    // Diagnóstico PES
    document.getElementById("prontPesProblema").value = p.diagnosticoPES.problema || "";
    document.getElementById("prontPesEtiologia").value = p.diagnosticoPES.etiologia || "";
    document.getElementById("prontPesSinais").value = p.diagnosticoPES.sinaisSintomas || "";
    document.getElementById("prontPesTextoCompleto").value = p.diagnosticoPES.textoCompletoPES || "";

    // Prescrição Dietoterápica
    document.getElementById("prontVetKcal").value = p.prescricaoDietoterapica.vetKcal || "";
    document.getElementById("prontRegraBolso").value = p.prescricaoDietoterapica.regraBolsoKcalKg || "";
    document.getElementById("prontChoG").value = p.prescricaoDietoterapica.carboidratosG || "";
    document.getElementById("prontChoPct").value = p.prescricaoDietoterapica.carboidratosPct || "";
    document.getElementById("prontPtnG").value = p.prescricaoDietoterapica.proteinasG || "";
    document.getElementById("prontPtnGKg").value = p.prescricaoDietoterapica.proteinasGKg || "";
    document.getElementById("prontPtnPct").value = p.prescricaoDietoterapica.proteinasPct || "";
    document.getElementById("prontLipG").value = p.prescricaoDietoterapica.lipidiosG || "";
    document.getElementById("prontLipPct").value = p.prescricaoDietoterapica.lipidiosPct || "";
    document.getElementById("prontConsistencia").value = p.prescricaoDietoterapica.consistencia || "Normal / Livre";
    document.getElementById("prontFracionamento").value = p.prescricaoDietoterapica.fracionamento || "5 a 6 refeições/dia";
    document.getElementById("prontFibrasMicronutrientes").value = p.prescricaoDietoterapica.fibrasMicronutrientes || "";
    document.getElementById("prontJustificativa").value = p.prescricaoDietoterapica.justificativaFisiopatologica || "";

    // Planejamento Alimentar (Cardápio)
    renderCardapioTable();

    // Orientações Nutricionais
    document.getElementById("prontOrientacoesGerais").value = p.orientacoesNutricionais || "";
  }

  // Coleta dados digitados pelo aluno
  function readProntuarioFromForm() {
    const p = appState.currentProntuario;
    if (!p) return null;

    // Aluno
    p.aluno.nome = document.getElementById("alunoNome").value.trim();
    p.aluno.matriculaTurma = document.getElementById("alunoMatricula").value.trim();
    p.aluno.data = document.getElementById("alunoData").value;

    // Anamnese
    p.anamnese.queixaPrincipal = document.getElementById("prontQueixaPrincipal").value.trim();
    p.anamnese.historiaClinica = document.getElementById("prontHistoriaClinica").value.trim();
    p.anamnese.antecedentesMedicamentos = document.getElementById("prontAntecedentesMed").value.trim();
    p.anamnese.habitosEstiloVida = document.getElementById("prontHabitosEstiloVida").value.trim();

    // Antropometria
    p.antropometria.pesoAtual = document.getElementById("prontPesoAtual").value.trim();
    p.antropometria.pesoHabitual = document.getElementById("prontPesoHabitual").value.trim();
    p.antropometria.estatura = document.getElementById("prontEstatura").value.trim();
    p.antropometria.alturaJoelho = document.getElementById("prontAlturaJoelho") ? document.getElementById("prontAlturaJoelho").value.trim() : "";
    p.antropometria.circCintura = document.getElementById("prontCircCintura") ? document.getElementById("prontCircCintura").value.trim() : "";
    p.antropometria.circQuadril = document.getElementById("prontCircQuadril") ? document.getElementById("prontCircQuadril").value.trim() : "";
    p.antropometria.circBraco = document.getElementById("prontCircBraco") ? document.getElementById("prontCircBraco").value.trim() : "";
    p.antropometria.circPanturrilha = document.getElementById("prontCircPanturrilha") ? document.getElementById("prontCircPanturrilha").value.trim() : "";
    p.antropometria.dobraTricipital = document.getElementById("prontDobraTricipital") ? document.getElementById("prontDobraTricipital").value.trim() : "";
    p.antropometria.dobraSubescapular = document.getElementById("prontDobraSubescapular") ? document.getElementById("prontDobraSubescapular").value.trim() : "";
    p.antropometria.dobraSuprailiaca = document.getElementById("prontDobraSuprailiaca") ? document.getElementById("prontDobraSuprailiaca").value.trim() : "";
    p.antropometria.dobraAbdominal = document.getElementById("prontDobraAbdominal") ? document.getElementById("prontDobraAbdominal").value.trim() : "";
    p.antropometria.demaisAvaliacoes = document.getElementById("prontDemaisAvaliacoes") ? document.getElementById("prontDemaisAvaliacoes").value.trim() : "";
    p.antropometria.imc = document.getElementById("calculatedImcDisplay").textContent.trim();
    p.antropometria.classificacaoImc = document.getElementById("calculatedImcClassDisplay").textContent.trim();
    p.antropometria.percentualPerda = document.getElementById("calculatedLossDisplay").textContent.trim();
    p.antropometria.circunferenciasDobras = document.getElementById("prontCircunferencias").value.trim();

    // Bioquímica
    p.bioquimica.examesRelevantes = document.getElementById("prontExamesRelevantes").value.trim();
    p.bioquimica.interpretacaoNutricional = document.getElementById("prontInterpretacaoBioq").value.trim();

    // Exame Físico
    p.exameFisico.sinaisClinicos = document.getElementById("prontSinaisClinicos").value.trim();
    p.exameFisico.massaMuscularAdiposa = document.getElementById("prontMassaMuscular").value.trim();
    p.exameFisico.condicoesTGIeEdemas = document.getElementById("prontTGIEdemas").value.trim();

    // Consumo Alimentar
    p.consumoAlimentar.inqueritoResumo = document.getElementById("prontInqueritoResumo").value.trim();
    p.consumoAlimentar.aguaPreferenciasAversoes = document.getElementById("prontAguaPreferencias").value.trim();

    // Diagnóstico PES
    p.diagnosticoPES.problema = document.getElementById("prontPesProblema").value.trim();
    p.diagnosticoPES.etiologia = document.getElementById("prontPesEtiologia").value.trim();
    p.diagnosticoPES.sinaisSintomas = document.getElementById("prontPesSinais").value.trim();
    p.diagnosticoPES.textoCompletoPES = document.getElementById("prontPesTextoCompleto").value.trim();

    // Prescrição Dietoterápica
    p.prescricaoDietoterapica.vetKcal = document.getElementById("prontVetKcal").value.trim();
    p.prescricaoDietoterapica.regraBolsoKcalKg = document.getElementById("prontRegraBolso").value.trim();
    p.prescricaoDietoterapica.carboidratosG = document.getElementById("prontChoG").value.trim();
    p.prescricaoDietoterapica.carboidratosPct = document.getElementById("prontChoPct").value.trim();
    p.prescricaoDietoterapica.proteinasG = document.getElementById("prontPtnG").value.trim();
    p.prescricaoDietoterapica.proteinasGKg = document.getElementById("prontPtnGKg").value.trim();
    p.prescricaoDietoterapica.proteinasPct = document.getElementById("prontPtnPct").value.trim();
    p.prescricaoDietoterapica.lipidiosG = document.getElementById("prontLipG").value.trim();
    p.prescricaoDietoterapica.lipidiosPct = document.getElementById("prontLipPct").value.trim();
    p.prescricaoDietoterapica.consistencia = document.getElementById("prontConsistencia").value;
    p.prescricaoDietoterapica.fracionamento = document.getElementById("prontFracionamento").value;
    p.prescricaoDietoterapica.fibrasMicronutrientes = document.getElementById("prontFibrasMicronutrientes").value.trim();
    p.prescricaoDietoterapica.justificativaFisiopatologica = document.getElementById("prontJustificativa").value.trim();

    // Planejamento Alimentar (Cardápio)
    p.planejamentoAlimentar = readCardapioFromDOM();

    // Orientações Nutricionais
    p.orientacoesNutricionais = document.getElementById("prontOrientacoesGerais").value.trim();

    // Questões avaliativas
    const questions = appState.currentCase?.questoesAvaliativas || [];
    p.respostasQuestoes = {};
    questions.forEach(q => {
      const textarea = document.getElementById(`resp_quest_${q.id}`);
      if (textarea) {
        p.respostasQuestoes[q.id] = textarea.value.trim();
      }
    });

    return p;
  }

  // Estima estatura pela fórmula de Chumlea (usada para idosos e acamados)
  function estimateChumleaStature(aj, age, gender) {
    if (!aj || isNaN(aj) || aj <= 0) return null;
    const ajNum = parseFloat(aj);
    const ageNum = parseInt(age) || 40;
    const isFemale = (gender || "").toLowerCase().includes("fem");
    let cm = 0;
    if (isFemale) {
      cm = 84.88 - (0.24 * ageNum) + (1.83 * ajNum);
    } else {
      cm = 64.19 - (0.04 * ageNum) + (2.02 * ajNum);
    }
    const m = (cm / 100).toFixed(2);
    return { cm: cm.toFixed(1), m: m };
  }

  // Atualiza cálculos antropométricos em tempo real
  function updateAnthropometricCalculations() {
    const pesoAtual = document.getElementById("prontPesoAtual")?.value || "";
    const pesoHabitual = document.getElementById("prontPesoHabitual")?.value || "";
    const estatura = document.getElementById("prontEstatura")?.value || "";
    const aj = document.getElementById("prontAlturaJoelho")?.value || "";
    const idade = appState.currentCase?.patient?.age || 40;
    const genero = appState.currentCase?.patient?.gender || "Feminino";

    const imcResult = prontuarioManager.calculateIMC(pesoAtual, estatura, idade);
    const imcDisp = document.getElementById("calculatedImcDisplay");
    const imcClassDisp = document.getElementById("calculatedImcClassDisplay");
    if (imcDisp) imcDisp.textContent = imcResult.imc || "--";
    if (imcClassDisp) imcClassDisp.textContent = imcResult.classificacao || "Aguardando peso e altura";

    const lossResult = prontuarioManager.calculateWeightLoss(pesoHabitual, pesoAtual);
    const lossDisp = document.getElementById("calculatedLossDisplay");
    const lossClassDisp = document.getElementById("calculatedLossClassDisplay");
    if (lossDisp) lossDisp.textContent = lossResult.percentual ? `${lossResult.percentual}%` : "--";
    if (lossClassDisp) lossClassDisp.textContent = lossResult.interpretacao || "-";

    // Helper de estimativa por Chumlea
    const chumleaHelper = document.getElementById("ajChumleaHelper");
    const chumleaVal = document.getElementById("ajChumleaValue");
    if (chumleaHelper && chumleaVal) {
      const chum = estimateChumleaStature(aj, idade, genero);
      if (chum) {
        chumleaVal.textContent = `${chum.m} m (${chum.cm} cm)`;
        chumleaHelper.classList.remove("hidden");
      } else {
        chumleaHelper.classList.add("hidden");
      }
    }
  }

  // Lê dados atuais digitados na tabela de cardápio do DOM
  function readCardapioFromDOM() {
    const cardapioRows = document.querySelectorAll("#cardapioTableBody tr");
    const list = [];
    cardapioRows.forEach(row => {
      const refInput = row.querySelector(".cardapio-ref");
      const timeInput = row.querySelector(".cardapio-time");
      const foodsInput = row.querySelector(".cardapio-foods");
      const subsInput = row.querySelector(".cardapio-subs");
      if (refInput) {
        list.push({
          refeicao: refInput.value.trim(),
          horario: timeInput ? timeInput.value.trim() : "08:00",
          alimentos: foodsInput ? foodsInput.value.trim() : "",
          substituicoes: subsInput ? subsInput.value.trim() : ""
        });
      }
    });
    if (appState.currentProntuario) {
      appState.currentProntuario.planejamentoAlimentar = list;
    }
    return list;
  }

  // Renderiza tabela dinâmica de cardápio
  function renderCardapioTable() {
    const tbody = document.getElementById("cardapioTableBody");
    tbody.innerHTML = "";
    const list = appState.currentProntuario?.planejamentoAlimentar || [];

    list.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-slate-100 hover:bg-slate-50";
      tr.innerHTML = `
        <td class="p-2">
          <input type="text" class="cardapio-ref w-full border border-slate-300 rounded px-2 py-1 text-xs font-medium" value="${escapeHtml(item.refeicao || '')}">
        </td>
        <td class="p-2 w-24">
          <input type="time" class="cardapio-time w-full border border-slate-300 rounded px-2 py-1 text-xs" value="${escapeHtml(item.horario || '08:00')}">
        </td>
        <td class="p-2">
          <textarea class="cardapio-foods w-full border border-slate-300 rounded px-2 py-1 text-xs" rows="2" placeholder="Alimentos, porções e medidas caseiras">${escapeHtml(item.alimentos || '')}</textarea>
        </td>
        <td class="p-2">
          <textarea class="cardapio-subs w-full border border-slate-300 rounded px-2 py-1 text-xs" rows="2" placeholder="Substituições">${escapeHtml(item.substituicoes || '')}</textarea>
        </td>
        <td class="p-2 text-center">
          <button type="button" class="text-rose-500 hover:text-rose-700 font-bold p-1 text-sm remove-meal-btn" data-idx="${idx}" title="Remover refeição">✕</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Listener para remoção de linhas do cardápio preservando o que já foi digitado
    tbody.querySelectorAll(".remove-meal-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        readCardapioFromDOM();
        const targetBtn = e.currentTarget || e.target.closest(".remove-meal-btn");
        const index = parseInt(targetBtn?.dataset?.idx);
        if (!isNaN(index) && appState.currentProntuario?.planejamentoAlimentar) {
          appState.currentProntuario.planejamentoAlimentar.splice(index, 1);
          renderCardapioTable();
        }
      });
    });
  }

  // Adicionar refeição ao cardápio preservando o que já foi digitado
  document.getElementById("addCardapioMealBtn").addEventListener("click", () => {
    readCardapioFromDOM();
    if (!appState.currentProntuario.planejamentoAlimentar) {
      appState.currentProntuario.planejamentoAlimentar = [];
    }
    const nextNum = appState.currentProntuario.planejamentoAlimentar.length + 1;
    appState.currentProntuario.planejamentoAlimentar.push({
      refeicao: `Refeição ${nextNum}`,
      horario: "12:00",
      alimentos: "",
      substituicoes: ""
    });
    renderCardapioTable();
  });

  // Renderiza exames laboratoriais na barra lateral do aluno
  function renderCaseLabExamsBadge() {
    const list = appState.currentCase?.bioquimica || [];
    const container = document.getElementById("labExamsContainer");
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `<span class="text-xs text-slate-400">Nenhum exame cadastrado para este caso.</span>`;
      return;
    }

    container.innerHTML = list.map(item => `
      <div class="bg-slate-50 border border-slate-200 rounded p-1.5 text-[11px] mb-1">
        <div class="font-medium text-slate-800">${escapeHtml(item.exame)}</div>
        <div class="text-emerald-700 font-semibold">${escapeHtml(item.valor)} <span class="text-slate-400 font-normal">(${escapeHtml(item.referencia)})</span></div>
      </div>
    `).join("");
  }

  // Renderiza perguntas avaliativas específicas do caso
  function renderStudentEvaluationQuestions() {
    const questions = appState.currentCase?.questoesAvaliativas || [];
    const container = document.getElementById("studentQuestionsList");
    const countBadge = document.getElementById("questionsCountBadge");
    if (countBadge) countBadge.textContent = `${questions.length} questão(ões)`;

    if (!container) return;

    if (questions.length === 0) {
      container.innerHTML = `
        <div class="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg text-sm">
          Este caso clínico não possui perguntas avaliativas configuradas pelo professor.
        </div>
      `;
      return;
    }

    container.innerHTML = "";
    const savedResponses = appState.currentProntuario?.respostasQuestoes || {};

    questions.forEach((q, idx) => {
      const qCard = document.createElement("div");
      qCard.className = "bg-white border border-slate-200 rounded-lg p-4 shadow-sm mb-4";
      qCard.innerHTML = `
        <label class="block font-semibold text-sm text-slate-800 mb-2">
          ${escapeHtml(q.pergunta)}
        </label>
        <textarea id="resp_quest_${q.id}" class="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" rows="4" placeholder="Digite sua resposta e justificativa técnica detalhada...">${escapeHtml(savedResponses[q.id] || '')}</textarea>
      `;
      container.appendChild(qCard);
    });
  }

  // Configuração de Event Listeners
  function setupEventListeners() {
    // Navegação no Cabeçalho
    if (navBrandBtn) {
      navBrandBtn.addEventListener("click", () => backToStudentDisciplinePortal());
    }

    if (navStudentCatalogBtn) {
      navStudentCatalogBtn.addEventListener("click", () => backToStudentDisciplinePortal());
    }

    // Botão Trocar de Disciplina (retorna ao portal de disciplinas sem casos)
    const backToDiscBtn = document.getElementById("studentBackToDisciplinesBtn");
    if (backToDiscBtn) {
      backToDiscBtn.addEventListener("click", () => {
        backToStudentDisciplinePortal();
      });
    }

    // Botão Voltar ao Catálogo dentro da Simulação
    if (backToCatalogBtn) {
      backToCatalogBtn.addEventListener("click", () => {
        readProntuarioFromForm();
        if (appState.currentCaseId && appState.currentProntuario) {
          prontuarioManager.saveDraft(appState.currentCaseId, appState.currentProntuario);
        }
        showStudentCatalog();
      });
    }

    // Alternância de modo (Acesso restrito ao Painel do Professor)
    switchModeBtn.addEventListener("click", () => {
      if (appState.mode === "admin") {
        showStudentCatalog();
      } else {
        showTeacherPanel();
      }
    });

    // Filtros de Status no Catálogo de Casos do Aluno
    document.querySelectorAll(".catalog-filter-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".catalog-filter-btn").forEach(b => {
          b.classList.remove("active", "bg-emerald-600", "text-white");
          b.classList.add("bg-slate-100", "text-slate-700");
        });
        const target = e.currentTarget;
        target.classList.add("active", "bg-emerald-600", "text-white");
        target.classList.remove("bg-slate-100", "text-slate-700");
        currentCatalogFilter = target.dataset.filter || "all";
        renderStudentCatalog(currentCatalogFilter, currentCatalogSearch);
      });
    });

    // Campo de Busca no Catálogo de Casos
    if (catalogSearchInput) {
      catalogSearchInput.addEventListener("input", (e) => {
        currentCatalogSearch = e.target.value;
        renderStudentCatalog(currentCatalogFilter, currentCatalogSearch);
      });
    }

    // Validação do formulário de senha do professor
    teacherPasswordForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const entered = teacherPasswordInput.value.trim();
      if (entered === TEACHER_PASSWORD) {
        isTeacherAuthenticated = true;
        teacherPasswordError.classList.add("hidden");
        teacherPasswordModal.classList.add("hidden");
        showTeacherPanel();
        showToast("Acesso docente autorizado! Bem-vindo(a) ao Painel do Professor.");
      } else {
        teacherPasswordError.classList.remove("hidden");
        teacherPasswordInput.focus();
        teacherPasswordInput.select();
      }
    });

    // Fechar modal de senha do professor
    closeTeacherPasswordModalBtn.addEventListener("click", () => {
      teacherPasswordModal.classList.add("hidden");
    });

    teacherPasswordModal.addEventListener("click", (e) => {
      if (e.target === teacherPasswordModal) {
        teacherPasswordModal.classList.add("hidden");
      }
    });

    // Botão de Bloquear Sessão do Docente / Sair
    if (adminLockSessionBtn) {
      adminLockSessionBtn.addEventListener("click", () => {
        isTeacherAuthenticated = false;
        showStudentCatalog();
        showToast("Sessão do professor bloqueada com sucesso.");
      });
    }

    // Troca de caso clínico no dropdown
    caseSelectDropdown.addEventListener("change", (e) => {
      // Salva rascunho anterior antes de trocar
      readProntuarioFromForm();
      prontuarioManager.saveDraft(appState.currentCaseId, appState.currentProntuario);
      selectCase(e.target.value);
    });

    // Troca de interlocutor no chat
    interlocutorSelect.addEventListener("change", (e) => {
      appState.activeInterlocutor = e.target.value;
      updateInterlocutorUI();
    });

    // Envio no chat
    sendChatBtn.addEventListener("click", handleSendMessage);
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });

    // Limpar histórico de chat
    clearChatBtn.addEventListener("click", () => {
      if (confirm("Deseja reiniciar a conversa com este personagem?")) {
        const caseId = appState.currentCaseId;
        const role = appState.activeInterlocutor;
        if (appState.chatHistories[caseId]) {
          delete appState.chatHistories[caseId][role];
        }
        renderChatMessages();
      }
    });

    // Chips de perguntas rápidas
    document.querySelectorAll(".prompt-chip").forEach(chip => {
      chip.addEventListener("click", (e) => {
        chatInput.value = e.target.textContent.replace(/^[💬👤🩺🍎]\s*/, "");
        handleSendMessage();
      });
    });

    // Input listeners para cálculos antropométricos
    ["prontPesoAtual", "prontPesoHabitual", "prontEstatura", "prontAlturaJoelho"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", updateAnthropometricCalculations);
      }
    });

    // Botão de aplicar estatura estimada de Chumlea
    const btnApplyChumlea = document.getElementById("btnApplyChumlea");
    if (btnApplyChumlea) {
      btnApplyChumlea.addEventListener("click", () => {
        const aj = document.getElementById("prontAlturaJoelho")?.value || "";
        const idade = appState.currentCase?.patient?.age || 40;
        const genero = appState.currentCase?.patient?.gender || "Feminino";
        const chum = estimateChumleaStature(aj, idade, genero);
        if (chum) {
          const estEl = document.getElementById("prontEstatura");
          if (estEl) {
            estEl.value = chum.m;
            updateAnthropometricCalculations();
            triggerProntuarioAutoSave();
            showToast(`Estatura estimada por Chumlea (${chum.m} m) aplicada!`);
          }
        }
      });
    }

    // Botão Sintetizar Medidas Antropométricas
    const btnSintetizar = document.getElementById("btnSintetizarMedidas");
    if (btnSintetizar) {
      btnSintetizar.addEventListener("click", () => {
        const parts = [];
        const cc = document.getElementById("prontCircCintura")?.value.trim();
        const cq = document.getElementById("prontCircQuadril")?.value.trim();
        const cb = document.getElementById("prontCircBraco")?.value.trim();
        const cp = document.getElementById("prontCircPanturrilha")?.value.trim();
        const dct = document.getElementById("prontDobraTricipital")?.value.trim();
        const dcse = document.getElementById("prontDobraSubescapular")?.value.trim();
        const dcsi = document.getElementById("prontDobraSuprailiaca")?.value.trim();
        const dca = document.getElementById("prontDobraAbdominal")?.value.trim();
        const aj = document.getElementById("prontAlturaJoelho")?.value.trim();
        const demais = document.getElementById("prontDemaisAvaliacoes")?.value.trim();

        if (aj) parts.push(`Altura do Joelho (AJ): ${aj} cm`);
        if (cc) parts.push(`Circunf. Cintura: ${cc} cm`);
        if (cq) parts.push(`Circunf. Quadril: ${cq} cm`);
        if (cb) parts.push(`CB: ${cb} cm`);
        if (cp) parts.push(`CP: ${cp} cm`);
        if (dct) parts.push(`Dobra Tricipital (DCT): ${dct} mm`);
        if (dcse) parts.push(`Dobra Subescapular: ${dcse} mm`);
        if (dcsi) parts.push(`Dobra Supra-ilíaca: ${dcsi} mm`);
        if (dca) parts.push(`Dobra Abdominal: ${dca} mm`);
        if (demais) parts.push(demais);

        const summaryBox = document.getElementById("prontCircunferencias");
        if (summaryBox) {
          summaryBox.value = parts.join("; ");
          triggerProntuarioAutoSave();
          showToast("Resumo das medidas sintetizado com sucesso!");
        }
      });
    }

    // Botão Montar Frase Completa do PES
    const btnPes = document.getElementById("btnGerarPesCompleto");
    if (btnPes) {
      btnPes.addEventListener("click", () => {
        const p = document.getElementById("prontPesProblema")?.value.trim() || "";
        const e = document.getElementById("prontPesEtiologia")?.value.trim() || "";
        const s = document.getElementById("prontPesSinais")?.value.trim() || "";
        if (!p && !e && !s) {
          showToast("Preencha o Problema, Etiologia e Sinais primeiro.", "warning");
          return;
        }
        const fullText = `${p || '[Problema não informado]'} relacionado a ${e || '[Etiologia não informada]'} evidenciado por ${s || '[Sinais/Sintomas não informados]'}.`;
        const pesBox = document.getElementById("prontPesTextoCompleto");
        if (pesBox) {
          pesBox.value = fullText;
          triggerProntuarioAutoSave();
          showToast("Frase PES estruturada com sucesso!");
        }
      });
    }

    // Auto-salvamento debounced do prontuário
    let studentAutoSaveTimer = null;
    function triggerProntuarioAutoSave() {
      if (studentAutoSaveTimer) clearTimeout(studentAutoSaveTimer);
      studentAutoSaveTimer = setTimeout(() => {
        if (appState.currentCaseId && appState.mode === "student") {
          const data = readProntuarioFromForm();
          if (data) {
            prontuarioManager.saveDraft(appState.currentCaseId, data);
            const indicator = document.getElementById("prontAutoSaveIndicator");
            if (indicator) {
              const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              indicator.textContent = `Salvo às ${time}`;
            }
          }
        }
      }, 700);
    }

    // Listeners de input/change para auto-salvar no prontuário do aluno
    const studentFormArea = document.querySelector(".student-tab-content")?.parentElement;
    if (studentFormArea) {
      studentFormArea.addEventListener("input", () => {
        triggerProntuarioAutoSave();
      });
      studentFormArea.addEventListener("change", () => {
        triggerProntuarioAutoSave();
      });
    }

    // Abas do Prontuário do Aluno (CORREÇÃO DE BUGS DE CLIQUE E PREENCHIMENTO)
    document.querySelectorAll(".student-tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        // 1. Salva o rascunho dos campos da aba atual antes de alternar
        readProntuarioFromForm();
        if (appState.currentCaseId && appState.currentProntuario) {
          prontuarioManager.saveDraft(appState.currentCaseId, appState.currentProntuario);
        }

        // 2. Localiza o botão pai corretamente mesmo se o clique foi no <span> interno ou emoji
        const btnEl = e.currentTarget || e.target.closest(".student-tab-btn");
        if (!btnEl) return;
        const tabId = btnEl.dataset.tab;
        if (!tabId) return;

        // 3. Atualiza estado das abas
        document.querySelectorAll(".student-tab-btn").forEach(b => b.classList.remove("active"));
        btnEl.classList.add("active");
        appState.activeStudentTab = tabId;

        // 4. Exibe o conteúdo correto da aba
        document.querySelectorAll(".student-tab-content").forEach(c => c.classList.add("hidden"));
        const activeContent = document.getElementById(`tab-content-${tabId}`);
        if (activeContent) {
          activeContent.classList.remove("hidden");
        }
      });
    });

    // Salvar rascunho
    saveDraftBtn.addEventListener("click", () => {
      readProntuarioFromForm();
      prontuarioManager.saveDraft(appState.currentCaseId, appState.currentProntuario);
      showToast("Rascunho salvo com sucesso no navegador!");
    });

    // Finalizar caso e gerar Word (.docx)
    finalizeAndExportDocxBtn.addEventListener("click", () => {
      const data = readProntuarioFromForm();
      if (!data) return;

      // Validação amigável
      if (!data.aluno.nome) {
        alert("Por favor, preencha o seu nome completo na identificação do prontuário.");
        document.querySelector('[data-tab="anamnese"]').click();
        document.getElementById("alunoNome").focus();
        return;
      }

      // Salva rascunho final
      prontuarioManager.saveDraft(appState.currentCaseId, data);

      // REGRA SOLICITADA:
      // "A proposta é que o aluno não receba feedback final do que acertou ou do que errou."
      // "Gere um documento em Word e que ele crie no final todo o relatório necessário do caso clínico e resolução dietoterápica, com o planejamento alimentar do paciente."

      // 1. Gera e baixa o documento Word (.docx) imediatamente
      DietoterapiaDocxReport.generateReport(data, appState.currentCase);

      // 2. Abre modal confirmando a submissão e informando que a avaliação será feita pelo docente (sem mostrar erros/acertos)
      document.getElementById("modalStudentName").textContent = data.aluno.nome;
      document.getElementById("modalCaseTitle").textContent = appState.currentCase.title;
      submissionConfirmModal.classList.remove("hidden");
    });

    closeSubmissionModalBtn.addEventListener("click", () => {
      submissionConfirmModal.classList.add("hidden");
    });

    // Modal de API Key Gemini
    openApiKeyBtn.addEventListener("click", () => {
      apiKeyInput.value = chatEngine.getApiKey();
      apiKeyModal.classList.remove("hidden");
    });

    closeApiKeyModalBtn.addEventListener("click", () => {
      apiKeyModal.classList.add("hidden");
    });

    saveApiKeyBtn.addEventListener("click", () => {
      chatEngine.setApiKey(apiKeyInput.value);
      apiKeyModal.classList.add("hidden");
      showToast(apiKeyInput.value ? "Chave da Gemini API salva com sucesso!" : "Chave da Gemini API removida. Usando motor nativo offline.");
    });
  }

  // Setup do Painel do Professor / Administrador
  function setupAdminUI() {
    // Abas de edição do caso no Admin
    document.querySelectorAll(".admin-editor-tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const btnEl = e.currentTarget || e.target.closest(".admin-editor-tab-btn");
        if (!btnEl) return;
        const tabId = btnEl.dataset.admintab;
        if (!tabId) return;

        document.querySelectorAll(".admin-editor-tab-btn").forEach(b => b.classList.remove("active"));
        btnEl.classList.add("active");
        appState.activeAdminTab = tabId;

        document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.add("hidden"));
        const targetContent = document.getElementById(`adm-tab-${tabId}`);
        if (targetContent) targetContent.classList.remove("hidden");
      });
    });

    // Botão Criar Novo Caso
    document.getElementById("adminNewCaseBtn").addEventListener("click", () => {
      const newCase = adminManager.getEmptyCase();
      adminManager.editingCaseId = newCase.id;
      populateAdminEditor(newCase);
      openAdminEditor();
    });

    // Botão Restaurar Casos Padrão
    document.getElementById("adminResetDefaultsBtn").addEventListener("click", () => {
      if (confirm("Deseja restaurar os 3 casos clínicos padrão da disciplina? Isso resetará alterações feitas nos casos de fábrica.")) {
        resetDefaultCases();
        syncAppStateAndNotify("Casos padrão restaurados com sucesso!");
      }
    });

    // Exportar Casos para JSON
    document.getElementById("adminExportJsonBtn").addEventListener("click", () => {
      adminManager.exportCasesJson();
    });

    // Importar Casos de JSON
    const fileInput = document.getElementById("adminImportJsonInput");
    document.getElementById("adminImportJsonBtn").addEventListener("click", () => {
      fileInput.click();
    });
    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        adminManager.importCasesJson(e.target.files[0], (success, msg) => {
          if (success) {
            syncAppStateAndNotify("Casos importados e atualizados no sistema!");
          } else {
            showToast(msg, "error");
          }
        });
      }
    });

    // Botão Salvar Caso no Editor
    document.getElementById("adminSaveCaseBtn").addEventListener("click", () => {
      let savedCase = readCaseFromAdminEditor();
      if (!savedCase.title) {
        alert("Por favor, preencha o título do caso.");
        return;
      }
      if (typeof ClinicalPortugueseReviser !== "undefined" && ClinicalPortugueseReviser.reviewCase) {
        savedCase = ClinicalPortugueseReviser.reviewCase(savedCase);
      }
      adminManager.saveCase(savedCase);
      closeAdminEditor();
      syncAppStateAndNotify("✨ Caso clínico salvo e atualizado para os alunos!");
    });

    // Botão Revisar Português & Verbos no Editor
    const reviewPortBtn = document.getElementById("adminReviewPortugueseBtn");
    if (reviewPortBtn) {
      reviewPortBtn.addEventListener("click", () => {
        let currentCase = readCaseFromAdminEditor();
        if (typeof ClinicalPortugueseReviser !== "undefined" && ClinicalPortugueseReviser.reviewCase) {
          const reviewed = ClinicalPortugueseReviser.reviewCase(currentCase);
          populateAdminEditor(reviewed);
          showToast("✨ Português e tempos verbais revisados com sucesso em todas as abas!");
        }
      });
    }

    // Botão Cancelar Edição
    document.getElementById("adminCancelEditBtn").addEventListener("click", () => {
      closeAdminEditor();
    });

    // Toggle de trava dentro do editor
    const lockCheckbox = document.getElementById("admCaseIsUnlocked");
    if (lockCheckbox) {
      lockCheckbox.addEventListener("change", (e) => {
        updateCaseLockLabel(e.target.checked);
      });
    }

    // Inicializa catálogo de modelos rápidos de profissionais na Aba 6
    const presetSelect = document.getElementById("adminAddProfPresetSelect");
    if (presetSelect && typeof PROFESSIONAL_PRESETS !== "undefined") {
      presetSelect.innerHTML = "";
      PROFESSIONAL_PRESETS.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.avatar} ${p.nome}`;
        presetSelect.appendChild(opt);
      });
    }

    // Botão "+ Acrescentar Profissional" na Aba 6
    const addProfBtn = document.getElementById("adminAddProfBtn");
    if (addProfBtn) {
      addProfBtn.addEventListener("click", () => {
        const presetId = document.getElementById("adminAddProfPresetSelect")?.value || "personalizado";
        const preset = (typeof PROFESSIONAL_PRESETS !== "undefined")
          ? PROFESSIONAL_PRESETS.find(p => p.id === presetId)
          : null;

        const defaultData = preset || {
          id: `prof_${Date.now()}`,
          nome: "Novo Especialista",
          avatar: "🏥",
          especialidade: "Equipe Multiprofissional",
          defaultParecer: ""
        };

        const container = document.getElementById("adminEquipeListContainer");
        const emptyBanner = document.getElementById("adminEquipeEmptyBanner");
        if (emptyBanner) emptyBanner.remove();

        const uniqueId = `${defaultData.id}_${Date.now()}`;
        const newProf = {
          id: uniqueId,
          nome: defaultData.nome,
          avatar: defaultData.avatar,
          especialidade: defaultData.especialidade,
          parecer: defaultData.defaultParecer || ""
        };

        const card = createAdminProfCard(newProf);
        container.appendChild(card);

        const textarea = card.querySelector(".prof-parecer-input");
        if (textarea) textarea.focus();
        showToast(`Profissional "${newProf.nome}" acrescentado com sucesso!`);
      });
    }

    // Navegação para a tela de subir arquivo e montar caso
    const uploadNavBtn = document.getElementById("adminUploadCaseNavBtn");
    if (uploadNavBtn) {
      uploadNavBtn.addEventListener("click", () => {
        showAdminUploadCase();
      });
    }

    const cancelUploadBtn = document.getElementById("adminCancelUploadBtn");
    if (cancelUploadBtn) {
      cancelUploadBtn.addEventListener("click", () => {
        hideAdminUploadCase();
      });
    }

    // Dropzone e upload de arquivo de caso
    const dropzone = document.getElementById("adminCaseDropzone");
    const caseFileInput = document.getElementById("adminCaseFileInput");
    const selectedFileInfo = document.getElementById("adminSelectedFileInfo");
    const selectedFileName = document.getElementById("adminFileName");
    const selectedFileSize = document.getElementById("adminFileSize");
    const selectedFileIcon = document.getElementById("adminFileIcon");
    const removeFileBtn = document.getElementById("adminRemoveFileBtn");
    const extractedTextArea = document.getElementById("adminCaseExtractedText");
    const clearTextBtn = document.getElementById("adminClearTextBtn");
    const processCaseBtn = document.getElementById("adminProcessAndBuildCaseBtn");

    if (dropzone && caseFileInput) {
      dropzone.addEventListener("click", () => {
        caseFileInput.click();
      });

      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("border-indigo-600", "bg-indigo-100/60");
      });

      dropzone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        dropzone.classList.remove("border-indigo-600", "bg-indigo-100/60");
      });

      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("border-indigo-600", "bg-indigo-100/60");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleCaseFileSelected(e.dataTransfer.files[0]);
        }
      });

      caseFileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          handleCaseFileSelected(e.target.files[0]);
        }
      });
    }

    async function handleCaseFileSelected(file) {
      if (!file) return;

      const ext = file.name.split(".").pop().toLowerCase();
      const sizeKb = (file.size / 1024).toFixed(1);

      if (selectedFileName) selectedFileName.textContent = file.name;
      if (selectedFileSize) selectedFileSize.textContent = `${sizeKb} KB`;
      if (selectedFileIcon) {
        selectedFileIcon.textContent = ext === "docx" ? "📘" : (ext === "json" ? "📋" : "📝");
      }
      if (selectedFileInfo) selectedFileInfo.classList.remove("hidden");

      try {
        if (ext === "docx") {
          showToast("Lendo e extraindo conteúdo do arquivo Word (.docx)...");
          if (typeof DocxTextExtractor !== "undefined") {
            const text = await DocxTextExtractor.extractTextFromFile(file);
            if (text && text.trim()) {
              if (extractedTextArea) extractedTextArea.value = text;
              showToast("Documento Word (.docx) extraído com sucesso!");
            } else {
              showToast("Não foi possível extrair o texto do arquivo Word. Você pode colar o texto diretamente.", "warning");
            }
          }
        } else if (ext === "json") {
          const text = await file.text();
          if (extractedTextArea) extractedTextArea.value = text;
          showToast("Arquivo JSON carregado com sucesso!");
        } else {
          // Arquivos de texto (.txt, .md, etc.)
          const text = await file.text();
          if (extractedTextArea) extractedTextArea.value = text;
          showToast("Arquivo de texto carregado com sucesso!");
        }
      } catch (err) {
        console.error("Erro ao ler arquivo:", err);
        showToast("Erro ao ler arquivo: " + err.message, "error");
      }
    }

    if (removeFileBtn) {
      removeFileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (caseFileInput) caseFileInput.value = "";
        if (selectedFileInfo) selectedFileInfo.classList.add("hidden");
      });
    }

    if (clearTextBtn) {
      clearTextBtn.addEventListener("click", () => {
        if (extractedTextArea) extractedTextArea.value = "";
        if (caseFileInput) caseFileInput.value = "";
        if (selectedFileInfo) selectedFileInfo.classList.add("hidden");
        showToast("Texto limpo.");
      });
    }

    // Botão de processar texto e montar o caso clínico nas 8 abas
    if (processCaseBtn) {
      processCaseBtn.addEventListener("click", () => {
        const raw = extractedTextArea?.value?.trim() || "";
        if (!raw) {
          showToast("Por favor, selecione um arquivo ou cole o texto do caso clínico primeiro.", "warning");
          return;
        }

        try {
          showToast("Analisando dados clínicos e estruturando as 8 abas...");
          const targetDisc = document.getElementById("adminUploadCaseDiscipline")?.value || adminManager.activeDisciplinaId || "dietoterapia";
          const builtCase = CaseBuilderEngine.buildCaseFromText(raw, targetDisc);
          builtCase.disciplinaId = targetDisc;
          
          adminManager.editingCaseId = builtCase.id;
          populateAdminEditor(builtCase);
          openAdminEditor();
          window.scrollTo({ top: 0, behavior: "smooth" });

          showToast(`✨ Caso "${builtCase.title}" montado com sucesso! Revise os dados e clique em "Salvar Caso".`, 5000);
        } catch (err) {
          console.error("Erro na montagem do caso:", err);
          showToast("Erro ao montar caso clínico: " + err.message, "error");
        }
      });
    }

    // Listeners do Gerenciamento de Disciplinas pelo Professor
    const newDiscBtn = document.getElementById("adminNewDisciplineBtn");
    if (newDiscBtn) {
      newDiscBtn.addEventListener("click", () => {
        document.getElementById("adminDisciplineId").value = "";
        document.getElementById("adminDisciplineName").value = "";
        document.getElementById("adminDisciplineCode").value = "";
        document.getElementById("adminDisciplineIcon").value = "📚";
        document.getElementById("adminDisciplineDesc").value = "";
        document.getElementById("adminDisciplineModalTitle").textContent = "Cadastrar Nova Disciplina";
        document.getElementById("adminDisciplineModalIconHeader").textContent = "📚";
        document.getElementById("adminDisciplineModal").classList.remove("hidden");
        setTimeout(() => document.getElementById("adminDisciplineName").focus(), 100);
      });
    }

    const editDiscBtn = document.getElementById("adminEditDisciplineBtn");
    if (editDiscBtn) {
      editDiscBtn.addEventListener("click", () => {
        const currentDisc = adminManager.getDisciplinaById(adminManager.activeDisciplinaId);
        if (!currentDisc) return;
        document.getElementById("adminDisciplineId").value = currentDisc.id;
        document.getElementById("adminDisciplineName").value = currentDisc.nome || "";
        document.getElementById("adminDisciplineCode").value = currentDisc.codigo || "";
        document.getElementById("adminDisciplineIcon").value = currentDisc.icone || "📚";
        document.getElementById("adminDisciplineDesc").value = currentDisc.descricao || "";
        document.getElementById("adminDisciplineModalTitle").textContent = `Editar Disciplina: ${currentDisc.nome}`;
        document.getElementById("adminDisciplineModalIconHeader").textContent = currentDisc.icone || "✏️";
        document.getElementById("adminDisciplineModal").classList.remove("hidden");
        setTimeout(() => document.getElementById("adminDisciplineName").focus(), 100);
      });
    }

    const deleteDiscBtn = document.getElementById("adminDeleteDisciplineBtn");
    if (deleteDiscBtn) {
      deleteDiscBtn.addEventListener("click", () => {
        const currentDisc = adminManager.getDisciplinaById(adminManager.activeDisciplinaId);
        if (!currentDisc) return;

        if (adminManager.disciplinas.length <= 1) {
          alert("Não é possível excluir a única disciplina cadastrada no sistema.");
          return;
        }

        const casesInDisc = adminManager.cases.filter(c => (c.disciplinaId || "dietoterapia") === currentDisc.id);
        const modal = document.getElementById("adminDeleteDisciplineModal");
        const nameEl = document.getElementById("adminDeleteDiscName");
        const badgeEl = document.getElementById("adminDeleteDiscCountBadge");
        const withCasesBox = document.getElementById("adminDeleteDiscWithCasesBox");
        const emptyBox = document.getElementById("adminDeleteDiscEmptyBox");
        const targetSelect = document.getElementById("adminDeleteDiscTargetSelect");

        if (nameEl) nameEl.textContent = `${currentDisc.icone || '📚'} ${currentDisc.nome}`;
        if (badgeEl) {
          badgeEl.textContent = `${casesInDisc.length} caso(s) clínico(s)`;
          badgeEl.className = casesInDisc.length > 0
            ? "font-bold px-2 py-0.5 rounded text-[11px] bg-amber-100 text-amber-800 border border-amber-300"
            : "font-bold px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700";
        }

        if (casesInDisc.length > 0) {
          if (withCasesBox) withCasesBox.classList.remove("hidden");
          if (emptyBox) emptyBox.classList.add("hidden");

          if (targetSelect) {
            targetSelect.innerHTML = "";
            adminManager.disciplinas
              .filter(d => d.id !== currentDisc.id)
              .forEach(d => {
                const opt = document.createElement("option");
                opt.value = d.id;
                opt.textContent = `${d.icone || '📚'} ${d.nome} (${d.codigo || 'Sem código'})`;
                targetSelect.appendChild(opt);
              });
          }
        } else {
          if (withCasesBox) withCasesBox.classList.add("hidden");
          if (emptyBox) emptyBox.classList.remove("hidden");
        }

        if (modal) modal.classList.remove("hidden");
      });
    }

    // Confirmação de exclusão da disciplina no modal inteligente
    const confirmDelBtn = document.getElementById("adminConfirmDeleteDiscBtn");
    if (confirmDelBtn) {
      confirmDelBtn.addEventListener("click", () => {
        const currentDisc = adminManager.getDisciplinaById(adminManager.activeDisciplinaId);
        if (!currentDisc) return;

        const casesInDisc = adminManager.cases.filter(c => (c.disciplinaId || "dietoterapia") === currentDisc.id);
        let options = {};

        if (casesInDisc.length > 0) {
          const chosenAction = document.querySelector('input[name="adminDeleteDiscAction"]:checked')?.value || "move";
          if (chosenAction === "move") {
            const targetId = document.getElementById("adminDeleteDiscTargetSelect")?.value;
            options = { action: "move", targetDisciplinaId: targetId };
          } else {
            options = { action: "cascade" };
          }
        }

        const res = adminManager.deleteDisciplina(currentDisc.id, options);
        document.getElementById("adminDeleteDisciplineModal")?.classList.add("hidden");

        if (!res.success) {
          alert(res.message);
        } else {
          syncAppStateAndNotify(res.message);
        }
      });
    }

    document.getElementById("adminCancelDeleteDiscBtn")?.addEventListener("click", () => {
      document.getElementById("adminDeleteDisciplineModal")?.classList.add("hidden");
    });
    document.getElementById("adminCloseDeleteDiscModalBtn")?.addEventListener("click", () => {
      document.getElementById("adminDeleteDisciplineModal")?.classList.add("hidden");
    });
    document.getElementById("adminDeleteDisciplineModal")?.addEventListener("click", (e) => {
      if (e.target === document.getElementById("adminDeleteDisciplineModal")) {
        document.getElementById("adminDeleteDisciplineModal")?.classList.add("hidden");
      }
    });

    const discForm = document.getElementById("adminDisciplineForm");
    if (discForm) {
      discForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = document.getElementById("adminDisciplineId").value;
        const nome = document.getElementById("adminDisciplineName").value.trim();
        const codigo = document.getElementById("adminDisciplineCode").value.trim();
        const icone = document.getElementById("adminDisciplineIcon").value.trim() || "📚";
        const descricao = document.getElementById("adminDisciplineDesc").value.trim();

        if (!nome) {
          alert("Por favor, preencha o nome da disciplina.");
          return;
        }

        let msg = "";
        if (id) {
          adminManager.updateDisciplina(id, { nome, codigo, icone, descricao });
          msg = `Disciplina "${nome}" atualizada com sucesso!`;
        } else {
          const created = adminManager.createDisciplina({ nome, codigo, icone, descricao });
          msg = `Disciplina "${created.nome}" criada com sucesso!`;
        }

        document.getElementById("adminDisciplineModal").classList.add("hidden");
        syncAppStateAndNotify(msg);
      });
    }

    document.querySelectorAll(".disc-icon-preset-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const iconInput = document.getElementById("adminDisciplineIcon");
        if (iconInput) iconInput.value = btn.textContent.trim();
      });
    });

    document.getElementById("closeDisciplineModalBtn")?.addEventListener("click", () => {
      document.getElementById("adminDisciplineModal").classList.add("hidden");
    });
    document.getElementById("adminCancelDisciplineBtn")?.addEventListener("click", () => {
      document.getElementById("adminDisciplineModal").classList.add("hidden");
    });
    document.getElementById("adminDisciplineModal")?.addEventListener("click", (e) => {
      if (e.target === document.getElementById("adminDisciplineModal")) {
        document.getElementById("adminDisciplineModal").classList.add("hidden");
      }
    });

    // Registro de Service Worker para PWA (Progressive Web App)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
          console.log('DietoCase Service Worker registrado:', reg.scope);
        }).catch((err) => {
          console.log('Falha ao registrar Service Worker:', err);
        });
      });
    }

    // Suporte ao evento nativo de instalação do PWA (Android / Chrome Desktop)
    let deferredPwaPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPwaPrompt = e;
      const installBox = document.getElementById("pwaNativeInstallBox");
      if (installBox) installBox.classList.remove("hidden");
    });

    const pwaTriggerBtn = document.getElementById("pwaTriggerInstallBtn");
    if (pwaTriggerBtn) {
      pwaTriggerBtn.addEventListener("click", async () => {
        if (deferredPwaPrompt) {
          deferredPwaPrompt.prompt();
          const { outcome } = await deferredPwaPrompt.userChoice;
          console.log(`Resposta do usuário ao prompt de instalação: ${outcome}`);
          deferredPwaPrompt = null;
          const installBox = document.getElementById("pwaNativeInstallBox");
          if (installBox) installBox.classList.add("hidden");
          document.getElementById("installAppModal")?.classList.add("hidden");
        }
      });
    }

    // Modal de Instalação no Celular (iOS / Android)
    const installAppNavBtn = document.getElementById("navInstallAppBtn");
    const installAppModal = document.getElementById("installAppModal");
    const closeInstallAppModalBtn = document.getElementById("closeInstallAppModalBtn");
    const closeInstallAppModalBtn2 = document.getElementById("closeInstallAppModalBtn2");

    if (installAppNavBtn && installAppModal) {
      installAppNavBtn.addEventListener("click", () => {
        installAppModal.classList.remove("hidden");
      });
    }
    if (closeInstallAppModalBtn && installAppModal) {
      closeInstallAppModalBtn.addEventListener("click", () => {
        installAppModal.classList.add("hidden");
      });
    }
    if (closeInstallAppModalBtn2 && installAppModal) {
      closeInstallAppModalBtn2.addEventListener("click", () => {
        installAppModal.classList.add("hidden");
      });
    }
    if (installAppModal) {
      installAppModal.addEventListener("click", (e) => {
        if (e.target === installAppModal) {
          installAppModal.classList.add("hidden");
        }
      });
    }
  }

  // Atualiza label do toggle de trava do caso
  function updateCaseLockLabel(isUnlocked) {
    const label = document.getElementById("admCaseLockLabel");
    if (!label) return;
    if (isUnlocked) {
      label.textContent = "Liberado para Alunos";
      label.className = "ml-2.5 text-xs font-bold text-emerald-800";
    } else {
      label.textContent = "Travado (Oculto para Alunos)";
      label.className = "ml-2.5 text-xs font-bold text-rose-700";
    }
  }

  // Renderiza a lista dinâmica de profissionais na Aba 6 do editor de caso
  function renderAdminEquipeList(equipeList) {
    const container = document.getElementById("adminEquipeListContainer");
    if (!container) return;
    container.innerHTML = "";

    const list = Array.isArray(equipeList) ? equipeList : [];

    if (list.length === 0) {
      container.innerHTML = `
        <div id="adminEquipeEmptyBanner" class="bg-amber-50/70 border border-amber-200 rounded-xl p-5 text-center text-xs text-amber-800">
          <div class="text-2xl mb-1">👥</div>
          <strong class="block mb-1">Nenhum profissional cadastrado na equipe deste caso clínico.</strong>
          <p class="text-amber-700">Selecione uma especialidade acima e clique em <strong>"+ Acrescentar Profissional"</strong> para incluir médicos, enfermeiros, fonoaudiólogos, fisioterapeutas, psicólogos ou outros especialistas.</p>
        </div>
      `;
      return;
    }

    list.forEach((prof, idx) => {
      const card = createAdminProfCard(prof, idx);
      container.appendChild(card);
    });
  }

  // Cria elemento visual do card de profissional para edição e retirada na Aba 6
  function createAdminProfCard(prof, idx = Date.now()) {
    const card = document.createElement("div");
    card.className = "admin-prof-card bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 transition hover:border-slate-300";
    card.dataset.profId = prof.id || `prof_${idx}`;

    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div class="flex items-center space-x-2 flex-1 min-w-[240px]">
          <!-- Avatar Emoji -->
          <input type="text" class="prof-avatar-input w-11 text-center text-lg border border-slate-300 rounded-lg p-1 bg-slate-50 focus:bg-white" value="${escapeHtml(prof.avatar || '🩺')}" title="Emoji ou ícone do profissional">
          
          <!-- Cargo / Especialidade -->
          <div class="flex-1">
            <input type="text" class="prof-name-input w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:border-emerald-500" value="${escapeHtml(prof.nome || 'Profissional de Saúde')}" placeholder="Nome ou cargo (Ex: Fisioterapeuta Respiratório)">
          </div>
        </div>

        <!-- Botão Retirar Profissional da Equipe -->
        <button type="button" class="admin-remove-prof-btn text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 text-xs font-semibold px-2.5 py-1 rounded-lg transition flex items-center space-x-1" title="Retirar este profissional da equipe do caso">
          <span>✕</span>
          <span>Retirar da Equipe</span>
        </button>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="block text-[11px] font-bold text-slate-700">
            Parecer Clínico, Avaliação e Conduta:
          </label>
          <span class="text-[10px] text-slate-400">Dados repassados ao estudante no chat</span>
        </div>
        <textarea class="prof-parecer-input w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 leading-relaxed" rows="3" placeholder="Insira a avaliação clínica, sinais vitais, hipóteses, evolução ou conduta deste profissional para o caso...">${escapeHtml(prof.parecer || '')}</textarea>
      </div>
    `;

    // Ação do botão retirar da equipe
    card.querySelector(".admin-remove-prof-btn").addEventListener("click", () => {
      const nomeProf = card.querySelector(".prof-name-input")?.value.trim() || "Profissional";
      card.remove();
      
      const container = document.getElementById("adminEquipeListContainer");
      if (container && container.querySelectorAll(".admin-prof-card").length === 0) {
        renderAdminEquipeList([]);
      }
      showToast(`Profissional "${nomeProf}" retirado da equipe.`);
    });

    return card;
  }

  // Renderiza a lista de casos no painel do professor filtrada pela disciplina ativa
  function renderAdminCasesList() {
    adminManager.refreshCases();
    adminManager.refreshDisciplinas();
    updateAdminMetrics();
    renderStudentCatalog();
    const container = document.getElementById("adminCasesListContainer");
    if (!container) return;
    container.innerHTML = "";

    const activeDiscId = adminManager.activeDisciplinaId || "dietoterapia";
    const activeDisc = adminManager.getDisciplinaById(activeDiscId);
    const discCases = adminManager.cases.filter(c => (c.disciplinaId || "dietoterapia") === activeDiscId);

    if (discCases.length === 0) {
      container.innerHTML = `
        <div class="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500">
          <div class="text-3xl mb-2">${activeDisc?.icone || '📁'}</div>
          <h4 class="font-bold text-sm text-slate-700 mb-1">Nenhum caso clínico cadastrado nesta disciplina</h4>
          <p class="text-xs text-slate-400 mb-4">A disciplina "${escapeHtml(activeDisc?.nome || 'Selecionada')}" ainda não possui casos clínicos cadastrados.</p>
          <div class="flex flex-wrap items-center justify-center gap-2">
            <button id="adminEmptyCreateCaseBtn" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer">
              + Criar Caso Nesta Disciplina
            </button>
            <button id="adminEmptyUploadCaseBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer">
              📄 Subir Arquivo para Esta Disciplina
            </button>
          </div>
        </div>
      `;

      document.getElementById("adminEmptyCreateCaseBtn")?.addEventListener("click", () => {
        const newCase = adminManager.getEmptyCase();
        newCase.disciplinaId = activeDiscId;
        adminManager.editingCaseId = newCase.id;
        populateAdminEditor(newCase);
        openAdminEditor();
      });

      document.getElementById("adminEmptyUploadCaseBtn")?.addEventListener("click", () => {
        showAdminUploadCase();
        const uploadDiscSelect = document.getElementById("adminUploadCaseDiscipline");
        if (uploadDiscSelect) uploadDiscSelect.value = activeDiscId;
      });

      return;
    }

    discCases.forEach(c => {
      const card = document.createElement("div");
      card.className = `bg-white border ${c.isLocked ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'} rounded-xl p-5 shadow-sm hover:shadow transition flex flex-col justify-between`;
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-1.5">
              <span class="badge-clinical bg-slate-100 text-slate-800">${escapeHtml(c.category || 'Clínica')}</span>
              <span class="badge-clinical bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px]">${activeDisc?.icone || '📚'} ${escapeHtml(activeDisc?.nome || 'Disciplina')}</span>
            </div>
            <div>
              ${c.isLocked 
                ? '<span class="badge-clinical bg-rose-100 text-rose-800 border border-rose-300">🔒 Travado</span>' 
                : '<span class="badge-clinical bg-emerald-100 text-emerald-800 border border-emerald-300">🔓 Liberado</span>'
              }
            </div>
          </div>
          <h3 class="font-bold text-slate-800 text-base mb-1">${escapeHtml(c.title)}</h3>
          <p class="text-xs text-slate-500 mb-3 flex items-center">
            <span class="text-lg mr-1.5">${c.patient?.avatar || '👤'}</span>
            <strong>${escapeHtml(c.patient?.name || 'Paciente')}</strong>, ${c.patient?.age || '--'} anos (${c.patient?.gender || '--'})
          </p>
          <p class="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">${escapeHtml(c.description || '')}</p>
          <div class="flex items-center space-x-3 text-xs text-slate-500 border-t border-slate-100 pt-2 mb-4">
            <span>🧪 ${(c.bioquimica || []).length} exames</span>
            <span>❓ ${(c.questoesAvaliativas || []).length} questões</span>
          </div>
        </div>
        <div class="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
          <button class="px-2.5 py-1.5 text-xs font-semibold ${c.isLocked ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'} rounded transition adm-lock-btn" data-id="${c.id}" title="${c.isLocked ? 'Liberar caso para os alunos' : 'Travar e ocultar dos alunos'}">
            ${c.isLocked ? '🔓 Liberar' : '🔒 Travar'}
          </button>
          <button class="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition adm-dup-btn" data-id="${c.id}">Duplicar</button>
          <button class="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded transition adm-edit-btn" data-id="${c.id}">Editar</button>
          <button class="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded transition adm-del-btn" data-id="${c.id}">Excluir</button>
        </div>
      `;
      container.appendChild(card);
    });

    // Listeners do botão Travar / Liberar caso
    container.querySelectorAll(".adm-lock-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const btnEl = e.currentTarget || e.target.closest(".adm-lock-btn");
        const id = btnEl?.dataset?.id;
        if (!id) return;
        const isNowLocked = adminManager.toggleCaseLock(id);
        syncAppStateAndNotify(isNowLocked ? "Caso travado (oculto para os alunos)!" : "Caso liberado para os alunos com sucesso!");
      });
    });

    // Listeners dos botões de ação nos cartões
    container.querySelectorAll(".adm-edit-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const btnEl = e.currentTarget || e.target.closest(".adm-edit-btn");
        const id = btnEl?.dataset?.id;
        if (!id) return;
        const c = adminManager.getCaseById(id);
        if (c) {
          adminManager.editingCaseId = id;
          populateAdminEditor(c);
          openAdminEditor();
        }
      });
    });

    container.querySelectorAll(".adm-dup-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const btnEl = e.currentTarget || e.target.closest(".adm-dup-btn");
        const id = btnEl?.dataset?.id;
        if (!id) return;
        adminManager.duplicateCase(id);
        syncAppStateAndNotify("Caso duplicado com sucesso!");
      });
    });

    container.querySelectorAll(".adm-del-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const btnEl = e.currentTarget || e.target.closest(".adm-del-btn");
        const id = btnEl?.dataset?.id;
        if (!id) return;
        if (confirm("Tem certeza que deseja excluir este caso clínico?")) {
          adminManager.deleteCase(id);
          syncAppStateAndNotify("Caso clínico excluído com sucesso.");
        }
      });
    });
  }

  function openAdminEditor() {
    document.getElementById("adminCasesListSection").classList.add("hidden");
    document.getElementById("adminUploadCaseSection")?.classList.add("hidden");
    document.getElementById("adminCaseEditorSection").classList.remove("hidden");
    // Seleciona a primeira aba
    document.querySelector('[data-admintab="identificacao"]').click();
  }

  function closeAdminEditor() {
    document.getElementById("adminCaseEditorSection").classList.add("hidden");
    document.getElementById("adminUploadCaseSection")?.classList.add("hidden");
    document.getElementById("adminCasesListSection").classList.remove("hidden");
  }

  function showAdminUploadCase() {
    document.getElementById("adminCasesListSection").classList.add("hidden");
    document.getElementById("adminCaseEditorSection").classList.add("hidden");
    const uploadSection = document.getElementById("adminUploadCaseSection");
    if (uploadSection) {
      uploadSection.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function hideAdminUploadCase() {
    const uploadSection = document.getElementById("adminUploadCaseSection");
    if (uploadSection) uploadSection.classList.add("hidden");
    document.getElementById("adminCasesListSection").classList.remove("hidden");
  }

  // Preenche o formulário do editor de casos com dados do caso
  function populateAdminEditor(c) {
    populateDisciplineDropdowns();
    document.getElementById("admCaseTitle").value = c.title || "";
    const discSelect = document.getElementById("admCaseDiscipline");
    if (discSelect) {
      discSelect.value = c.disciplinaId || adminManager.activeDisciplinaId || "dietoterapia";
    }
    document.getElementById("admCaseCategory").value = c.category || "";
    document.getElementById("admCaseDesc").value = c.description || "";
    
    // Status de Trava / Liberação
    const isUnlocked = c.isLocked !== true;
    const lockCheckbox = document.getElementById("admCaseIsUnlocked");
    if (lockCheckbox) {
      lockCheckbox.checked = isUnlocked;
      updateCaseLockLabel(isUnlocked);
    }
    
    // Paciente
    document.getElementById("admPatName").value = c.patient?.name || "";
    document.getElementById("admPatAge").value = c.patient?.age || "";
    document.getElementById("admPatGender").value = c.patient?.gender || "Feminino";
    document.getElementById("admPatOccupation").value = c.patient?.occupation || "";
    document.getElementById("admPatMarital").value = c.patient?.maritalStatus || "";
    document.getElementById("admPatResidence").value = c.patient?.residence || "";
    document.getElementById("admPatAvatar").value = c.patient?.avatar || "👤";

    // História Clínica
    document.getElementById("admHistQP").value = c.history?.queixaPrincipal || "";
    document.getElementById("admHistHDA").value = c.history?.hda || "";
    document.getElementById("admHistHPP").value = c.history?.hpp || "";
    document.getElementById("admHistFamilia").value = c.history?.historiaFamiliar || "";
    document.getElementById("admHistMeds").value = c.history?.medicamentos || "";
    document.getElementById("admHistHabitos").value = c.history?.habitosVida || "";
    document.getElementById("admHistEliminacoes").value = c.history?.funcaoIntestinalDiurese || "";

    // Antropometria
    document.getElementById("admAntroPesoAtual").value = c.antropometria?.pesoAtual || "";
    document.getElementById("admAntroPesoHab").value = c.antropometria?.pesoHabitual || "";
    document.getElementById("admAntroAltura").value = c.antropometria?.estatura || "";
    if (document.getElementById("admAntroAJ")) {
      document.getElementById("admAntroAJ").value = c.antropometria?.alturaJoelho || "";
    }
    document.getElementById("admAntroCC").value = c.antropometria?.circunferenciaCintura || "";
    document.getElementById("admAntroCB").value = c.antropometria?.circunferenciaBraco || "";
    document.getElementById("admAntroDCT").value = c.antropometria?.dobraTricipital || "";
    document.getElementById("admAntroCP").value = c.antropometria?.circunferenciaPanturrilha || "";
    if (document.getElementById("admAntroDemaisAvaliacoes")) {
      document.getElementById("admAntroDemaisAvaliacoes").value = c.antropometria?.demaisAvaliacoes || "";
    }
    document.getElementById("admAntroPerda").value = c.antropometria?.historicoPerdaPonderal || "";

    // Bioquímica
    renderAdminBioTable(c.bioquimica || []);

    // Exame Físico
    document.getElementById("admEfEstadoGeral").value = c.exameFisico?.estadoGeral || "";
    document.getElementById("admEfSinais").value = c.exameFisico?.sinaisEspecificos || "";
    document.getElementById("admEfEdema").value = c.exameFisico?.edema || "";
    document.getElementById("admEfBoca").value = c.exameFisico?.cavidadeOral || "";
    document.getElementById("admEfTGI").value = c.exameFisico?.tgi || "";

    // Consumo Alimentar
    document.getElementById("admCaPadrao").value = c.consumoAlimentar?.padraoDiario || "";
    renderAdminRecTable(c.consumoAlimentar?.recordatorio24h || []);
    document.getElementById("admCaAgua").value = c.consumoAlimentar?.ingestaoHidrica || "";
    document.getElementById("admCaPreferencias").value = c.consumoAlimentar?.preferencias || "";
    document.getElementById("admCaAversoes").value = c.consumoAlimentar?.aversoesIntolerancias || "";
    document.getElementById("admCaQuemPrepara").value = c.consumoAlimentar?.quemPrepara || "";

    // Equipe Multiprofissional Dinâmica
    const equipeNormalizada = (typeof normalizeEquipeMultiprofissional === "function")
      ? normalizeEquipeMultiprofissional(c.equipeMultiprofissional)
      : [];
    renderAdminEquipeList(equipeNormalizada);

    // Questões Avaliativas
    renderAdminQuestionsList(c.questoesAvaliativas || []);

    // Gabarito / Resolução
    document.getElementById("admGabDiag").value = c.resolucaoGabarito?.diagnosticoNutricional || "";
    document.getElementById("admGabCalc").value = c.resolucaoGabarito?.calculoEnergetico || "";
    document.getElementById("admGabMacros").value = c.resolucaoGabarito?.distribuicaoMacronutrientes || "";
    document.getElementById("admGabConduta").value = c.resolucaoGabarito?.condutaPlanejamento || "";
  }

  // Tabela de Bioquímica no Admin
  function renderAdminBioTable(bioList) {
    const tbody = document.getElementById("adminBioTableBody");
    tbody.innerHTML = "";
    bioList.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-slate-100";
      tr.innerHTML = `
        <td class="p-1.5"><input type="text" class="w-full border rounded px-2 py-1 text-xs bio-exame" value="${escapeHtml(item.exame || '')}"></td>
        <td class="p-1.5"><input type="text" class="w-full border rounded px-2 py-1 text-xs bio-valor" value="${escapeHtml(item.valor || '')}"></td>
        <td class="p-1.5"><input type="text" class="w-full border rounded px-2 py-1 text-xs bio-ref" value="${escapeHtml(item.referencia || '')}"></td>
        <td class="p-1.5"><input type="text" class="w-full border rounded px-2 py-1 text-xs bio-interp" value="${escapeHtml(item.interpretacao || '')}"></td>
        <td class="p-1.5 text-center"><button type="button" class="text-rose-500 font-bold hover:text-rose-700 remove-bio-row" data-idx="${idx}">✕</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".remove-bio-row").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.target.closest("tr").remove();
      });
    });
  }

  const QUICK_BIO_CATALOG = {
    glicemia: { exame: "Glicemia de Jejum", valor: "", referencia: "< 99 mg/dL", interpretacao: "Normal" },
    hba1c: { exame: "Hemoglobina Glicada (HbA1c)", valor: "", referencia: "< 5.7%", interpretacao: "Normal" },
    colesterol_total: { exame: "Colesterol Total", valor: "", referencia: "< 190 mg/dL", interpretacao: "Desejável" },
    hdl: { exame: "Colesterol HDL", valor: "", referencia: "> 40 mg/dL", interpretacao: "Desejável" },
    ldl: { exame: "Colesterol LDL", valor: "", referencia: "< 100 mg/dL", interpretacao: "Ótimo" },
    triglicerideos: { exame: "Triglicerídeos", valor: "", referencia: "< 150 mg/dL", interpretacao: "Normal" },
    creatinina: { exame: "Creatinina Sérica", valor: "", referencia: "0.7 - 1.2 mg/dL", interpretacao: "Normal" },
    ureia: { exame: "Ureia Sérica", valor: "", referencia: "15 - 40 mg/dL", interpretacao: "Normal" },
    hemoglobina: { exame: "Hemoglobina", valor: "", referencia: "12.0 - 16.0 g/dL", interpretacao: "Normal" },
    hematocrito: { exame: "Hematócrito", valor: "", referencia: "36 - 48%", interpretacao: "Normal" },
    albumina: { exame: "Albumina Sérica", valor: "", referencia: "3.5 - 5.0 g/dL", interpretacao: "Normal" },
    potassio: { exame: "Potássio (K+)", valor: "", referencia: "3.5 - 5.1 mEq/L", interpretacao: "Normal" },
    sodio: { exame: "Sódio (Na+)", valor: "", referencia: "135 - 145 mEq/L", interpretacao: "Normal" },
    tgo: { exame: "TGO / AST", valor: "", referencia: "< 35 U/L", interpretacao: "Normal" },
    tgp: { exame: "TGP / ALT", valor: "", referencia: "< 35 U/L", interpretacao: "Normal" },
    ferritina: { exame: "Ferritina", valor: "", referencia: "30 - 300 ng/mL", interpretacao: "Normal" },
    pcr: { exame: "Proteína C Reativa (PCR)", valor: "", referencia: "< 5.0 mg/L", interpretacao: "Normal" },
    acido_urico: { exame: "Ácido Úrico", valor: "", referencia: "3.0 - 7.0 mg/dL", interpretacao: "Normal" }
  };

  function addBioRow(exame = "", valor = "", referencia = "", interpretacao = "") {
    const tbody = document.getElementById("adminBioTableBody");
    if (!tbody) return;
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.innerHTML = `
      <td class="p-1.5"><input type="text" class="w-full border rounded px-2 py-1 text-xs bio-exame" value="${escapeHtml(exame)}" placeholder="Ex: Creatinina Sérica"></td>
      <td class="p-1.5"><input type="text" class="w-full border rounded px-2 py-1 text-xs bio-valor" value="${escapeHtml(valor)}" placeholder="Ex: 1.2 mg/dL"></td>
      <td class="p-1.5"><input type="text" class="w-full border rounded px-2 py-1 text-xs bio-ref" value="${escapeHtml(referencia)}" placeholder="Ex: 0.7 - 1.2 mg/dL"></td>
      <td class="p-1.5"><input type="text" class="w-full border rounded px-2 py-1 text-xs bio-interp" value="${escapeHtml(interpretacao)}" placeholder="Ex: Normal"></td>
      <td class="p-1.5 text-center"><button type="button" class="text-rose-500 font-bold hover:text-rose-700 remove-bio-row">✕</button></td>
    `;
    tr.querySelector(".remove-bio-row").addEventListener("click", () => tr.remove());
    tbody.appendChild(tr);
    const valInput = tr.querySelector(".bio-valor");
    if (valInput) valInput.focus();
    return tr;
  }

  document.getElementById("adminAddBioRowBtn")?.addEventListener("click", () => {
    addBioRow();
  });

  document.getElementById("adminAddQuickBioBtn")?.addEventListener("click", () => {
    const select = document.getElementById("adminQuickBioSelect");
    const key = select?.value;
    if (!key || !QUICK_BIO_CATALOG[key]) {
      showToast("Selecione um exame do catálogo primeiro.", "warning");
      return;
    }
    const item = QUICK_BIO_CATALOG[key];
    addBioRow(item.exame, item.valor, item.referencia, item.interpretacao);
    showToast(`Exame "${item.exame}" inserido com valores de referência!`);
  });

  // Tabela de Recordatório no Admin
  function renderAdminRecTable(recList) {
    const tbody = document.getElementById("adminRecTableBody");
    tbody.innerHTML = "";
    recList.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-slate-100";
      tr.innerHTML = `
        <td class="p-1.5 w-44"><input type="text" class="w-full border rounded px-2 py-1 text-xs rec-ref" value="${escapeHtml(item.refeicao || '')}"></td>
        <td class="p-1.5"><textarea class="w-full border rounded px-2 py-1 text-xs rec-alimentos" rows="2">${escapeHtml(item.alimentos || '')}</textarea></td>
        <td class="p-1.5 text-center w-12"><button type="button" class="text-rose-500 font-bold hover:text-rose-700 remove-rec-row">✕</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".remove-rec-row").forEach(btn => {
      btn.addEventListener("click", (e) => e.target.closest("tr").remove());
    });
  }

  function addRecRow(refeicao = "", alimentos = "") {
    const tbody = document.getElementById("adminRecTableBody");
    if (!tbody) return;
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.innerHTML = `
      <td class="p-1.5 w-44"><input type="text" class="w-full border rounded px-2 py-1 text-xs rec-ref" value="${escapeHtml(refeicao)}" placeholder="Ex: Café da manhã"></td>
      <td class="p-1.5"><textarea class="w-full border rounded px-2 py-1 text-xs rec-alimentos" rows="2" placeholder="Descreva os alimentos ingeridos">${escapeHtml(alimentos)}</textarea></td>
      <td class="p-1.5 text-center w-12"><button type="button" class="text-rose-500 font-bold hover:text-rose-700 remove-rec-row">✕</button></td>
    `;
    tr.querySelector(".remove-rec-row").addEventListener("click", () => tr.remove());
    tbody.appendChild(tr);
    const textarea = tr.querySelector(".rec-alimentos");
    if (textarea) textarea.focus();
    return tr;
  }

  document.getElementById("adminAddRecRowBtn")?.addEventListener("click", () => {
    addRecRow();
  });

  document.querySelectorAll(".admin-quick-rec-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const meal = btn.dataset.refeicao || "Refeição";
      addRecRow(meal, "");
      showToast(`Refeição "${meal}" adicionada ao recordatório.`);
    });
  });

  // Helper de tags para Demais Avaliações Antropométricas
  document.querySelectorAll(".admin-antro-tag-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tag = btn.dataset.tag || "";
      const textarea = document.getElementById("admAntroDemaisAvaliacoes");
      if (textarea) {
        const cur = textarea.value.trim();
        textarea.value = cur ? `${cur}; ${tag}` : tag;
        textarea.focus();
        showToast("Medida inserida em Demais Avaliações.");
      }
    });
  });

  // Lista de Questões Avaliativas no Admin
  function renderAdminQuestionsList(qList) {
    const container = document.getElementById("adminQuestionsContainer");
    container.innerHTML = "";
    qList.forEach((q, idx) => {
      const div = document.createElement("div");
      div.className = "border border-slate-200 rounded-lg p-3 mb-3 bg-slate-50 question-admin-item";
      div.innerHTML = `
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-bold text-slate-700">Questão ${idx + 1}</span>
          <button type="button" class="text-rose-600 hover:text-rose-800 text-xs font-semibold remove-quest-btn">Excluir</button>
        </div>
        <textarea class="w-full border border-slate-300 rounded p-2 text-xs q-pergunta-text" rows="2" placeholder="Digite a pergunta avaliativa">${escapeHtml(q.pergunta || '')}</textarea>
      `;
      div.querySelector(".remove-quest-btn").addEventListener("click", () => div.remove());
      container.appendChild(div);
    });
  }

  function addQuestionItem(pergunta = "") {
    const container = document.getElementById("adminQuestionsContainer");
    if (!container) return;
    const div = document.createElement("div");
    div.className = "border border-slate-200 rounded-lg p-3 mb-3 bg-slate-50 question-admin-item";
    const nextNum = container.querySelectorAll(".question-admin-item").length + 1;
    div.innerHTML = `
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-xs font-bold text-slate-700">Questão ${nextNum}</span>
        <button type="button" class="text-rose-600 hover:text-rose-800 text-xs font-semibold remove-quest-btn">Excluir</button>
      </div>
      <textarea class="w-full border border-slate-300 rounded p-2 text-xs q-pergunta-text" rows="2" placeholder="Digite o enunciado da questão para o aluno">${escapeHtml(pergunta)}</textarea>
    `;
    div.querySelector(".remove-quest-btn").addEventListener("click", () => div.remove());
    container.appendChild(div);
    const textarea = div.querySelector(".q-pergunta-text");
    if (textarea) textarea.focus();
    return div;
  }

  document.getElementById("adminAddQuestionBtn")?.addEventListener("click", () => {
    addQuestionItem();
  });

  document.querySelectorAll(".admin-quick-q-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const qText = btn.dataset.q || "";
      addQuestionItem(qText);
      showToast("Questão adicionada ao caso!");
    });
  });

  // Lê dados do editor do Admin para salvar o caso
  function readCaseFromAdminEditor() {
    const id = adminManager.editingCaseId || ("caso-" + Date.now());

    // Bioquímica
    const bioquimica = [];
    document.querySelectorAll("#adminBioTableBody tr").forEach(row => {
      const ex = row.querySelector(".bio-exame")?.value.trim();
      const val = row.querySelector(".bio-valor")?.value.trim();
      const ref = row.querySelector(".bio-ref")?.value.trim();
      const interp = row.querySelector(".bio-interp")?.value.trim();
      if (ex) bioquimica.push({ exame: ex, valor: val, referencia: ref, interpretacao: interp });
    });

    // Recordatório
    const recordatorio24h = [];
    document.querySelectorAll("#adminRecTableBody tr").forEach(row => {
      const ref = row.querySelector(".rec-ref")?.value.trim();
      const alim = row.querySelector(".rec-alimentos")?.value.trim();
      if (ref) recordatorio24h.push({ refeicao: ref, alimentos: alim });
    });

    // Questões
    const questoesAvaliativas = [];
    document.querySelectorAll(".question-admin-item").forEach((item, idx) => {
      const txt = item.querySelector(".q-pergunta-text")?.value.trim();
      if (txt) questoesAvaliativas.push({ id: `q${idx + 1}`, pergunta: txt, tipo: "discursiva" });
    });

    return {
      id: id,
      disciplinaId: document.getElementById("admCaseDiscipline")?.value || adminManager.activeDisciplinaId || "dietoterapia",
      title: document.getElementById("admCaseTitle").value.trim(),
      category: document.getElementById("admCaseCategory").value.trim(),
      description: document.getElementById("admCaseDesc").value.trim(),
      isLocked: !(document.getElementById("admCaseIsUnlocked")?.checked),
      patient: {
        name: document.getElementById("admPatName").value.trim(),
        age: parseInt(document.getElementById("admPatAge").value) || 0,
        gender: document.getElementById("admPatGender").value,
        occupation: document.getElementById("admPatOccupation").value.trim(),
        maritalStatus: document.getElementById("admPatMarital").value.trim(),
        residence: document.getElementById("admPatResidence").value.trim(),
        avatar: document.getElementById("admPatAvatar").value.trim() || "👤"
      },
      history: {
        queixaPrincipal: document.getElementById("admHistQP").value.trim(),
        hda: document.getElementById("admHistHDA").value.trim(),
        hpp: document.getElementById("admHistHPP").value.trim(),
        historiaFamiliar: document.getElementById("admHistFamilia").value.trim(),
        medicamentos: document.getElementById("admHistMeds").value.trim(),
        habitosVida: document.getElementById("admHistHabitos").value.trim(),
        funcaoIntestinalDiurese: document.getElementById("admHistEliminacoes").value.trim()
      },
      antropometria: {
        pesoAtual: parseFloat(document.getElementById("admAntroPesoAtual").value) || 0,
        pesoHabitual: parseFloat(document.getElementById("admAntroPesoHab").value) || 0,
        estatura: parseFloat(document.getElementById("admAntroAltura").value) || 0,
        alturaJoelho: parseFloat(document.getElementById("admAntroAJ")?.value) || null,
        circunferenciaCintura: parseFloat(document.getElementById("admAntroCC").value) || null,
        circunferenciaBraco: parseFloat(document.getElementById("admAntroCB").value) || null,
        dobraTricipital: parseFloat(document.getElementById("admAntroDCT").value) || null,
        circunferenciaPanturrilha: parseFloat(document.getElementById("admAntroCP").value) || null,
        demaisAvaliacoes: document.getElementById("admAntroDemaisAvaliacoes")?.value?.trim() || "",
        historicoPerdaPonderal: document.getElementById("admAntroPerda").value.trim()
      },
      bioquimica: bioquimica,
      exameFisico: {
        estadoGeral: document.getElementById("admEfEstadoGeral").value.trim(),
        sinaisEspecificos: document.getElementById("admEfSinais").value.trim(),
        edema: document.getElementById("admEfEdema").value.trim(),
        cavidadeOral: document.getElementById("admEfBoca").value.trim(),
        tgi: document.getElementById("admEfTGI").value.trim()
      },
      consumoAlimentar: {
        padraoDiario: document.getElementById("admCaPadrao").value.trim(),
        recordatorio24h: recordatorio24h,
        ingestaoHidrica: document.getElementById("admCaAgua").value.trim(),
        preferencias: document.getElementById("admCaPreferencias").value.trim(),
        aversoesIntolerancias: document.getElementById("admCaAversoes").value.trim(),
        quemPrepara: document.getElementById("admCaQuemPrepara").value.trim()
      },
      equipeMultiprofissional: (() => {
        const equipe = [];
        document.querySelectorAll("#adminEquipeListContainer .admin-prof-card").forEach((card, idx) => {
          const id = card.dataset.profId || `prof_${idx}_${Date.now()}`;
          const nome = card.querySelector(".prof-name-input")?.value.trim() || "Profissional de Saúde";
          const avatar = card.querySelector(".prof-avatar-input")?.value.trim() || "🩺";
          const parecer = card.querySelector(".prof-parecer-input")?.value.trim() || "";
          equipe.push({ id, nome, avatar, parecer });
        });
        return equipe;
      })(),
      questoesAvaliativas: questoesAvaliativas,
      resolucaoGabarito: {
        diagnosticoNutricional: document.getElementById("admGabDiag").value.trim(),
        calculoEnergetico: document.getElementById("admGabCalc").value.trim(),
        distribuicaoMacronutrientes: document.getElementById("admGabMacros").value.trim(),
        condutaPlanejamento: document.getElementById("admGabConduta").value.trim()
      }
    };
  }

  // Notificação Toast rápida
  function showToast(msg) {
    let toast = document.getElementById("appToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "appToast";
      toast.className = "fixed bottom-5 right-5 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg z-50 transition-opacity duration-300 opacity-0 pointer-events-none";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.remove("opacity-0");
    setTimeout(() => {
      toast.classList.add("opacity-0");
    }, 2800);
  }

  // Utilitário de escape HTML
  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Iniciar App
  initApp();
});
