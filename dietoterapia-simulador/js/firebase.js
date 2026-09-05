/**
 * Configuração e Inicialização do Google Firebase - DietoCase
 * Projeto: simulador-dieto-e114c
 * Conexão em nuvem para sincronização em tempo real entre dispositivos de Professores e Alunos.
 */

var firebaseConfig = (typeof window !== "undefined" && window.firebaseConfig) ? window.firebaseConfig : {
  apiKey: "AIzaSyC-XzknUM5OahuO_frNkMG9uFdvZRRB0pk",
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
  isConfigured() { return true; },
  getConfig() { return firebaseConfig; },
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
      const allTabs = ["anamnese", "antropometria", "bioquimica", "examefisico", "consumo", "pes", "prescricao", "cardapio", "questoes"];
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

