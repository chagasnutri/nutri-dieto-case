/**
 * DietoCase - Serviço de Sincronização Firebase Firestore (v9 Modular)
 * Conexão direta em nuvem para sincronização em tempo real entre Aluno e Professor.
 * 
 * Estrutura no Cloud Firestore:
 * - Coleção: 'configuracoes'
 * - Documento: 'estado_atual'
 *   Contém: { disciplinas, cases, updatedAt, updatedBy }
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyC-XzknUM5OahuO_frNkMG9uFdvZRRB0pk",
  authDomain: "simulador-dieto-e114c.firebaseapp.com",
  projectId: "simulador-dieto-e114c",
  storageBucket: "simulador-dieto-e114c.firebasestorage.app",
  messagingSenderId: "380596633724",
  appId: "1:380596633724:web:dc9948bbcb9b8f379989f9"
};

const COLLECTION_NAME = "configuracoes";
const DOCUMENT_ID = "estado_atual";

class FirebaseSyncService {
  constructor() {
    this.config = (typeof window !== "undefined" && window.firebaseConfig) ? window.firebaseConfig : firebaseConfig;
    this.app = null;
    this.db = null;
    this.status = "connecting";
    this.statusListeners = [];
    this.dataListeners = [];
    this.unsubscribeSnapshot = null;
    this.isApplyingRemote = false;
    this.isListenerActive = false;

    this.init(false); // Inicializa conexão com Firestore em repouso (lazy-loading: sem carregar casos simulados na tela inicial)
  }

  isConfigured() {
    return !!(this.config && this.config.apiKey && this.config.projectId && !this.config.apiKey.includes("SUA_API_KEY"));
  }

  getConfig() {
    return this.config;
  }

  onStatusChange(callback) {
    if (typeof callback === "function") {
      this.statusListeners.push(callback);
      callback(this.status);
    }
  }

  onDataChange(callback) {
    if (typeof callback === "function") {
      this.dataListeners.push(callback);
    }
  }

  setStatus(newStatus, detail = null) {
    this.status = newStatus;
    this.statusListeners.forEach(cb => {
      try { cb(newStatus, detail); } catch (e) { console.error(e); }
    });
  }

  init(startListener = false) {
    if (!this.isConfigured()) {
      this.setStatus("unconfigured_firebase");
      return false;
    }

    try {
      if (!this.app) {
        this.app = initializeApp(this.config);
        this.db = getFirestore(this.app);
      }
      this.setStatus("online_firebase");
      console.log("☁️ [Firebase v9 Modular] Firestore conectado com sucesso para o projeto:", this.config.projectId);

      // Inicia a escuta em tempo real somente se explicitamente solicitado (Lazy-loading)
      if (startListener) {
        this.startRealtimeListener();
      }
      return true;
    } catch (err) {
      console.error("❌ Erro ao inicializar Firebase v9 Modular:", err);
      this.setStatus("error_firebase");
      return false;
    }
  }

  // Ativação sob demanda da escuta de disciplinas e casos do professor
  ensureSimulationDataLoaded() {
    return this.startRealtimeListener();
  }

  // Escuta em tempo real no documento: configuracoes/estado_atual
  startRealtimeListener() {
    if (!this.db) {
      this.init(true);
      return;
    }
    if (this.isListenerActive) return;
    this.isListenerActive = true;

    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
    }

    const estadoRef = doc(this.db, COLLECTION_NAME, DOCUMENT_ID);

    this.unsubscribeSnapshot = onSnapshot(estadoRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("📡 [Firestore onSnapshot] Alteração recebida em tempo real:", data.updatedAt);
        this.handleRemoteUpdate(data);
      } else {
        console.log("ℹ️ Documento configuracoes/estado_atual não existe ainda. Criando com dados padrão (auto-seed)...");
        this.seedInitialState();
      }
    }, (error) => {
      console.warn("⚠️ Aviso no onSnapshot do Firestore:", error.message);
      this.setStatus("error_firebase");
    });
  }

  // Processa atualização recebida da nuvem e bloqueia a tela do aluno em tempo real
  handleRemoteUpdate(data) {
    if (!data) return;
    this.isApplyingRemote = true;
    this.latestData = data;

    try {
      const cases = Array.isArray(data.cases) ? data.cases : [];
      const disciplinas = Array.isArray(data.disciplinas) ? data.disciplinas : [];

      if (typeof window !== "undefined" && window.location && (window.location.search.includes("demo=visibilidade") || window.location.search.includes("demo=visibilidade-aluno"))) {
        const c2 = cases.find(c => c.id === "caso-drc-idoso");
        if (c2) c2.visivel = false;
      }

      // 1. Atualiza cache local com todas as chaves do sistema
      const discKey = (typeof window !== "undefined" && window.STORAGE_KEY_DISCIPLINAS) ? window.STORAGE_KEY_DISCIPLINAS : "dietocase_disciplinas_v1";
      const casesKey = (typeof window !== "undefined" && window.STORAGE_KEY_CASES) ? window.STORAGE_KEY_CASES : "dietoterapia_casos_clinicos_v1";

      if (disciplinas.length > 0) {
        localStorage.setItem(discKey, JSON.stringify(disciplinas));
        localStorage.setItem("dietocase_disciplinas_v1", JSON.stringify(disciplinas));
        localStorage.setItem("dietocase_disciplinas_data", JSON.stringify(disciplinas));
      }
      if (cases.length > 0) {
        localStorage.setItem(casesKey, JSON.stringify(cases));
        localStorage.setItem("dietoterapia_casos_clinicos_v1", JSON.stringify(cases));
        localStorage.setItem("dietocase_cases_data", JSON.stringify(cases));
      }
      if (data.updatedAt) {
        localStorage.setItem("dietocase_last_sync_ts", data.updatedAt);
      }

      // Função interna para aplicar as alterações nos modelos em memória e no DOM
      const applyUpdateToDOM = () => {
        if (typeof window === "undefined") return;

        // 2. Atualiza modelos do AdminManager em memória
        if (window.adminManager) {
          window.adminManager.disciplinas = disciplinas;
          window.adminManager.cases = cases;
        }

        // 3. Localiza caso clínico ativo do aluno
        let activeCaseId = null;
        if (window.appState) {
          activeCaseId = window.appState.currentCaseId || (window.appState.currentCase ? window.appState.currentCase.id : null);
        }
        if (!activeCaseId) {
          const sel = document.getElementById("caseSelectDropdown");
          if (sel && sel.value) activeCaseId = sel.value;
        }
        if (!activeCaseId && cases.length > 0) {
          activeCaseId = cases[0].id;
        }

        const updatedCase = activeCaseId ? cases.find(c => c.id === activeCaseId) : (cases[0] || null);
        if (updatedCase) {
          if (window.appState) {
            window.appState.currentCase = updatedCase;
            window.appState.currentCaseId = updatedCase.id;
          }

          // Bloqueio físico direto e visual imediato no DOM dos botões de abas
          this.applyPhysicalTabLocks(updatedCase);
          if (typeof window.applyStudentTabBlockingState === "function") {
            window.applyStudentTabBlockingState(updatedCase);
          }
        }

        // 4. Re-renderiza toda a interface do aplicativo (Catálogo de Casos, Prontuário e Abas)
        if (typeof window.syncAppStateAndNotify === "function") {
          window.syncAppStateAndNotify(null, false);
          // Re-aplica após renderização para garantir persistência visual
          if (updatedCase) {
            this.applyPhysicalTabLocks(updatedCase);
          }
        } else if (window.dietoSyncEngine) {
          window.dietoSyncEngine.notifyDataListeners({ disciplinas, cases, isRemote: true });
        }
      };

      // Se o DOM ainda estiver carregando, agenda para quando estiver pronto
      if (typeof document !== "undefined" && document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          applyUpdateToDOM();
          setTimeout(applyUpdateToDOM, 100);
        });
      } else {
        applyUpdateToDOM();
        setTimeout(applyUpdateToDOM, 100);
      }

      // 5. Notifica ouvintes registrados no serviço
      this.dataListeners.forEach(cb => {
        try { cb({ disciplinas, cases, isRemote: true, updatedAt: data.updatedAt }); } catch (e) {}
      });
    } catch (err) {
      console.error("Erro ao aplicar atualização remota:", err);
    } finally {
      setTimeout(() => { this.isApplyingRemote = false; }, 300);
    }
  }

  // Aplica classes de bloqueio e travas físicas diretamente no DOM do aluno
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

    // Se o aluno estiver em uma aba bloqueada, redireciona para a primeira desimpedida
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

  // Cria o estado inicial no Firestore caso o banco esteja vazio
  async seedInitialState() {
    if (!this.db) return;
    try {
      const initialCases = (typeof window !== "undefined" && window.adminManager)
        ? window.adminManager.cases
        : (typeof getCases === "function" ? getCases() : []);
      const initialDisc = (typeof window !== "undefined" && window.adminManager)
        ? window.adminManager.disciplinas
        : (typeof getDisciplinas === "function" ? getDisciplinas() : []);

      await this.saveEstadoAtual(initialDisc, initialCases, { seeded: true });
    } catch (e) {
      console.warn("Aviso ao semear dados iniciais no Firestore:", e);
    }
  }

  // Salva o estado completo no Firestore: configuracoes/estado_atual
  async saveEstadoAtual(disciplinas, cases, meta = {}) {
    const discKey = typeof STORAGE_KEY_DISCIPLINAS !== "undefined" ? STORAGE_KEY_DISCIPLINAS : "dietocase_disciplinas_v1";
    const casesKey = typeof STORAGE_KEY_CASES !== "undefined" ? STORAGE_KEY_CASES : "dietoterapia_casos_clinicos_v1";

    const safeDisciplinas = Array.isArray(disciplinas) ? disciplinas : [];
    const safeCases = Array.isArray(cases) ? cases : [];

    // Salva imediatamente no localStorage local
    if (safeDisciplinas.length > 0) {
      localStorage.setItem(discKey, JSON.stringify(safeDisciplinas));
      localStorage.setItem("dietocase_disciplinas_data", JSON.stringify(safeDisciplinas));
    }
    if (safeCases.length > 0) {
      localStorage.setItem(casesKey, JSON.stringify(safeCases));
      localStorage.setItem("dietocase_cases_data", JSON.stringify(safeCases));
    }

    if (!this.db) {
      console.warn("Firestore não inicializado para gravação.");
      return false;
    }

    try {
      const estadoRef = doc(this.db, COLLECTION_NAME, DOCUMENT_ID);
      const payload = {
        disciplinas: safeDisciplinas,
        cases: safeCases,
        updatedAt: new Date().toISOString(),
        updatedBy: "professor",
        ...meta
      };

      await setDoc(estadoRef, payload, { merge: true });
      console.log("☁️ [Firestore] Estado salvo com sucesso em configuracoes/estado_atual:", payload.updatedAt);
      this.setStatus("online_firebase");
      return true;
    } catch (err) {
      console.error("❌ Erro ao salvar estado no Firestore:", err);
      this.setStatus("error_firebase");
      return false;
    }
  }

  // Aba do Professor: Trancar ou destravar abas de um caso
  async setCaseBlockedTabs(caseId, blockedTabs) {
    const cases = (window.adminManager ? window.adminManager.cases : (typeof getCases === "function" ? getCases() : []));
    const c = cases.find(item => item.id === caseId);
    if (c) {
      c.blockedTabs = Array.isArray(blockedTabs) ? blockedTabs : [];
    }
    const disciplinas = (window.adminManager ? window.adminManager.disciplinas : (typeof getDisciplinas === "function" ? getDisciplinas() : []));
    return await this.saveEstadoAtual(disciplinas, cases, { action: "setBlockedTabs", caseId });
  }

  // Aba do Professor: Trancar ou liberar um caso clínico
  async setCaseLock(caseId, isLocked) {
    const cases = (window.adminManager ? window.adminManager.cases : (typeof getCases === "function" ? getCases() : []));
    const c = cases.find(item => item.id === caseId);
    if (c) {
      c.isLocked = isLocked === true;
    }
    const disciplinas = (window.adminManager ? window.adminManager.disciplinas : (typeof getDisciplinas === "function" ? getDisciplinas() : []));
    return await this.saveEstadoAtual(disciplinas, cases, { action: "setLock", caseId });
  }

  // Aba do Professor: Ocultar ou mostrar um caso clínico para os alunos
  async setCaseVisibility(caseId, visivel) {
    const cases = (window.adminManager ? window.adminManager.cases : (typeof getCases === "function" ? getCases() : []));
    const c = cases.find(item => item.id === caseId);
    if (c) {
      c.visivel = visivel === true;
    }
    const disciplinas = (window.adminManager ? window.adminManager.disciplinas : (typeof getDisciplinas === "function" ? getDisciplinas() : []));
    return await this.saveEstadoAtual(disciplinas, cases, { action: "setVisibility", caseId, visivel });
  }

  // Aba do Professor: Salvar caso (criar ou editar)
  async saveCase(caseData) {
    const cases = (window.adminManager ? window.adminManager.cases : (typeof getCases === "function" ? getCases() : []));
    const idx = cases.findIndex(c => c.id === caseData.id);
    if (idx >= 0) {
      cases[idx] = caseData;
    } else {
      cases.push(caseData);
    }
    const disciplinas = (window.adminManager ? window.adminManager.disciplinas : (typeof getDisciplinas === "function" ? getDisciplinas() : []));
    return await this.saveEstadoAtual(disciplinas, cases, { action: "saveCase", caseId: caseData.id });
  }

  // Aba do Professor: Excluir caso
  async deleteCase(caseId) {
    let cases = (window.adminManager ? window.adminManager.cases : (typeof getCases === "function" ? getCases() : []));
    cases = cases.filter(c => c.id !== caseId);
    if (window.adminManager) window.adminManager.cases = cases;
    const disciplinas = (window.adminManager ? window.adminManager.disciplinas : (typeof getDisciplinas === "function" ? getDisciplinas() : []));
    return await this.saveEstadoAtual(disciplinas, cases, { action: "deleteCase", caseId });
  }

  // Aba do Professor: Salvar disciplina
  async saveDisciplina(discData) {
    const disciplinas = (window.adminManager ? window.adminManager.disciplinas : (typeof getDisciplinas === "function" ? getDisciplinas() : []));
    const idx = disciplinas.findIndex(d => d.id === discData.id);
    if (idx >= 0) {
      disciplinas[idx] = discData;
    } else {
      disciplinas.push(discData);
    }
    const cases = (window.adminManager ? window.adminManager.cases : (typeof getCases === "function" ? getCases() : []));
    return await this.saveEstadoAtual(disciplinas, cases, { action: "saveDisciplina", disciplinaId: discData.id });
  }

  // Aba do Professor: Excluir disciplina
  async deleteDisciplina(discId) {
    let disciplinas = (window.adminManager ? window.adminManager.disciplinas : (typeof getDisciplinas === "function" ? getDisciplinas() : []));
    disciplinas = disciplinas.filter(d => d.id !== discId);
    if (window.adminManager) window.adminManager.disciplinas = disciplinas;
    const cases = (window.adminManager ? window.adminManager.cases : (typeof getCases === "function" ? getCases() : []));
    return await this.saveEstadoAtual(disciplinas, cases, { action: "deleteDisciplina", disciplinaId: discId });
  }

  // Salva atendimento presencial real na coleção dedicada 'atendimentos_reais'
  async saveAtendimentoReal(atendimentoData) {
    const id = atendimentoData.id || ("atendimento-real-" + Date.now());
    const storageKey = "dietocase_atendimentos_reais_v1";

    // 1. Persistência local imediata em localStorage para redundância e modo offline
    try {
      const rawLocal = localStorage.getItem(storageKey);
      const list = rawLocal ? JSON.parse(rawLocal) : [];
      const idx = list.findIndex(item => item.id === id);
      const payload = {
        ...atendimentoData,
        id: id,
        updatedAt: new Date().toISOString()
      };
      if (idx >= 0) {
        list[idx] = payload;
      } else {
        list.push(payload);
      }
      localStorage.setItem(storageKey, JSON.stringify(list));
      localStorage.setItem("dietocase_atendimento_real_current", JSON.stringify(payload));
    } catch (e) {
      console.warn("Aviso ao salvar atendimento real no localStorage:", e);
    }

    // 2. Persistência em nuvem no Cloud Firestore v9 Modular
    if (!this.db || !this.isConfigured()) {
      console.log("☁️ Atendimento real salvo em cache local (Firestore offline ou não inicializado).");
      return true;
    }

    try {
      const atendimentoRef = doc(this.db, "atendimentos_reais", id);
      await setDoc(atendimentoRef, {
        ...atendimentoData,
        id: id,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`☁️ [Firebase v9] Atendimento real salvo na coleção 'atendimentos_reais/${id}' com sucesso!`);
      return true;
    } catch (err) {
      console.error("❌ Erro ao salvar atendimento real no Cloud Firestore:", err);
      return false;
    }
  }

  // Leitura direta sob demanda do documento configuracoes/estado_atual
  async fetchRemoteData() {
    if (!this.db) return null;
    try {
      const estadoRef = doc(this.db, COLLECTION_NAME, DOCUMENT_ID);
      const snap = await getDoc(estadoRef);
      if (snap.exists()) {
        return snap.data();
      }
    } catch (e) {
      console.warn("Aviso ao buscar estado no Firestore:", e.message);
    }
    return null;
  }
}

// Instanciação singleton
const firebaseSyncService = new FirebaseSyncService();
if (typeof window !== "undefined") {
  window.firebaseSyncService = firebaseSyncService;
}

export { FirebaseSyncService, firebaseSyncService };

