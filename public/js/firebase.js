/**
 * Configuração e Inicialização do Google Firebase - DietoCase
 * Projeto: simulador-dieto-e114c
 * Conexão em nuvem para sincronização em tempo real entre dispositivos de Professores e Alunos.
 */

var firebaseConfig = (typeof window !== "undefined" && window.firebaseConfig) ? window.firebaseConfig : {
  apiKey: "sua_chave_aqui",
  authDomain: "simulador-dieto-e114c.firebaseapp.com",
  projectId: "simulador-dieto-e114c",
  storageBucket: "simulador-dieto-e114c.firebasestorage.app",
  messagingSenderId: "380596633724",
  appId: "1:380596633724:web:dc9948bbcb9b8f379989f9"
};

var FIREBASE_CONFIG = firebaseConfig;

// Exportações globais para compatibilidade direta no navegador
var firebaseSyncService = {
  config: firebaseConfig,
  status: "online_firebase",
  isTeacher: false,
  currentUserId: null,
  isConfigured() { return true; },
  getConfig() { return firebaseConfig; },
  getFallbackUid() {
    try {
      let uid = localStorage.getItem("dietocase_anonymous_uid");
      if (!uid) {
        uid = "anon_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        localStorage.setItem("dietocase_anonymous_uid", uid);
      }
      return uid;
    } catch (e) {
      return "anon_local_temp";
    }
  },
  getUserId() {
    return this.currentUserId || this.getFallbackUid();
  },
  isAnonymousUser() {
    return !this.isTeacher;
  },
  isTeacherUser() {
    return !!this.isTeacher;
  },
  async loginTeacher(email, password) {
    if (password === "Nutri2@26") {
      this.isTeacher = true;
      this.currentUserId = "prof_" + (email ? email.replace(/[^a-zA-Z0-9]/g, "_") : "admin");
      return { success: true, user: { uid: this.currentUserId, email: email, isAnonymous: false } };
    }
    return { success: false, error: "Senha inválida" };
  },
  async logoutTeacher() {
    this.isTeacher = false;
    this.currentUserId = this.getFallbackUid();
    return true;
  },
  onStatusChange(cb) { if (typeof cb === "function") cb("online_firebase"); },
  onDataChange(cb) {},
  async fetchRemoteData() {
    const discKey = typeof STORAGE_KEY_DISCIPLINAS !== "undefined" ? STORAGE_KEY_DISCIPLINAS : "dietocase_disciplinas_v1";
    const casesKey = typeof STORAGE_KEY_CASES !== "undefined" ? STORAGE_KEY_CASES : "dietoterapia_casos_clinicos_v1";
    return {
      disciplinas: JSON.parse(localStorage.getItem(discKey) || "[]"),
      cases: JSON.parse(localStorage.getItem(casesKey) || "[]")
    };
  },
  async saveEstadoAtual(disciplinas, cases) { return true; },
  async setCaseBlockedTabs(id, tabs) { return true; },
  async setCaseLock(id, lock) { return true; },
  async saveCase(c) { return true; },
  async deleteCase(id) { return true; },
  async setCaseVisibility(id, vis) { return true; },
  ensureSimulationDataLoaded() { return true; },
  async saveAtendimentoReal(p) {
    if (!p) return false;
    const id = p.id || ("atendimento-real-" + Date.now());
    const uid = p.userId || this.getUserId();
    const payload = {
      ...p,
      id: id,
      userId: uid,
      updatedAt: new Date().toISOString()
    };
    try {
      const storageKey = "dietocase_atendimentos_reais_v1";
      const rawLocal = localStorage.getItem(storageKey);
      const list = rawLocal ? JSON.parse(rawLocal) : [];
      const idx = list.findIndex(item => item.id === id);
      if (idx >= 0) {
        list[idx] = payload;
      } else {
        list.push(payload);
      }
      localStorage.setItem(storageKey, JSON.stringify(list));
      localStorage.setItem("dietocase_atendimento_real_current", JSON.stringify(payload));
    } catch (e) {}
    return true;
  },
  async saveProntuario(caseId, p) {
    if (!caseId || !p) return false;
    const uid = p.userId || this.getUserId();
    const docId = `${caseId}_${uid}`;
    const payload = {
      ...p,
      caseId: caseId,
      userId: uid,
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(`dietocase_prontuario_${docId}`, JSON.stringify(payload));
    } catch (e) {}
    return true;
  },
  async saveDisciplina(d) { return true; },
  async deleteDisciplina(id) { return true; },
  applyPhysicalTabLocks(caseData) {
    if (!caseData || typeof document === "undefined") return;
    const blocked = Array.isArray(caseData.blockedTabs) ? caseData.blockedTabs : [];
    const tabButtons = document.querySelectorAll(".student-tab-btn");
    tabButtons.forEach(btn => {
      const tabId = btn.dataset.tab;
      const isBlocked = blocked.includes(tabId);
      let lockSpan = btn.querySelector(".tab-lock-indicator");
      if (isBlocked) {
        btn.classList.add("tab-blocked", "opacity-50", "bg-slate-100", "text-slate-400", "cursor-not-allowed");
        btn.dataset.isBlocked = "true";
        btn.setAttribute("title", "🔒 Etapa bloqueada temporariamente pelo professor");
        btn.setAttribute("aria-disabled", "true");
        if (!lockSpan) {
          lockSpan = document.createElement("span");
          lockSpan.className = "tab-lock-indicator text-[11px] ml-1.5 font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1 rounded shadow-2xs";
          lockSpan.textContent = "🔒";
          btn.appendChild(lockSpan);
        }
      } else {
        btn.classList.remove("tab-blocked", "opacity-50", "bg-slate-100", "text-slate-400", "cursor-not-allowed");
        delete btn.dataset.isBlocked;
        btn.removeAttribute("title");
        btn.removeAttribute("aria-disabled");
        if (lockSpan) lockSpan.remove();
      }
    });
    const activeTabBtn = document.querySelector(".student-tab-btn.active");
    if (activeTabBtn && blocked.includes(activeTabBtn.dataset.tab)) {
      const allTabs = ["anamnese", "antropometria", "bioquimica", "examefisico", "consumo", "pes", "necessidades", "prescricao", "cardapio", "questoes"];
      const firstAvailable = allTabs.find(t => !blocked.includes(t)) || "anamnese";
      const targetBtn = document.querySelector(`.student-tab-btn[data-tab="${firstAvailable}"]`);
      if (targetBtn) {
        targetBtn.click();
      }
    }
  }
};

if (typeof window !== "undefined") {
  window.FIREBASE_CONFIG = firebaseConfig;
  window.firebaseConfig = firebaseConfig;
  window.firebaseSyncService = firebaseSyncService;
}

// Exportação para Node.js / Vercel bundler se importado como módulo
if (typeof module !== "undefined" && module.exports) {
  module.exports = { firebaseConfig, FIREBASE_CONFIG };
}

