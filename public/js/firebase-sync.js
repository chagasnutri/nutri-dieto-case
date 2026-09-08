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
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, getDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

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
const COLLECTION_CASES = "casos_clinicos";
const COLLECTION_DISCIPLINAS = "disciplinas";
const COLLECTION_PACIENTES = "pacientes_virtuais";
const COLLECTION_CONFIG = "configuracoes";

class FirebaseSyncService {
  constructor() {
    this.config = (typeof window !== "undefined" && window.firebaseConfig) ? window.firebaseConfig : firebaseConfig;
    this.app = null;
    this.db = null;
    this.auth = null;
    this.currentUser = null;
    this.currentUid = null;
    this.isTeacher = false;
    this.authListeners = [];
    this.status = "connecting";
    this.statusListeners = [];
    this.dataListeners = [];
    this.unsubscribeSnapshot = null;
    this.unsubscribeCasesSnapshot = null;
    this.unsubscribeDiscSnapshot = null;
    this.isApplyingRemote = false;
    this.isListenerActive = false;

    this.init(true); // Conecta imediatamente ao Firestore e ativa listeners em tempo real nas coleções
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
        try {
          this.auth = getAuth(this.app);
          this.setupAuthListener();
        } catch (authInitErr) {
          console.warn("⚠️ Firebase Auth não inicializado diretamente:", authInitErr.message);
        }
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

  // ==========================================
  // AUTENTICAÇÃO E RASTREAMENTO DE USUÁRIOS
  // ==========================================

  setupAuthListener() {
    if (!this.auth) return;
    try {
      onAuthStateChanged(this.auth, async (user) => {
        if (user) {
          this.currentUser = user;
          this.currentUid = user.uid;
          this.isTeacher = !user.isAnonymous;
          console.log(`🔐 [Firebase Auth] Sessão ativa: ${user.uid} (${user.isAnonymous ? 'Aluno Anônimo' : 'Docente / Admin'})`);
          this.notifyAuthListeners(user);
        } else {
          // Autenticação anônima silenciosa
          console.log("🔐 [Firebase Auth] Conectando silenciosamente como Aluno Anônimo...");
          try {
            const cred = await signInAnonymously(this.auth);
            this.currentUser = cred.user;
            this.currentUid = cred.user.uid;
            this.isTeacher = false;
            console.log("✅ [Firebase Auth] Aluno conectado anonimamente com UID:", cred.user.uid);
            this.notifyAuthListeners(cred.user);
          } catch (authErr) {
            console.warn("⚠️ Aviso na autenticação anônima silenciosa do Firebase:", authErr.message);
            this.currentUid = this.getFallbackUid();
            this.notifyAuthListeners({ uid: this.currentUid, isAnonymous: true });
          }
        }
      });
    } catch (e) {
      console.warn("⚠️ Erro ao configurar listener de autenticação Firebase:", e);
    }
  }

  onAuthChange(callback) {
    if (typeof callback === "function") {
      this.authListeners.push(callback);
      if (this.currentUser) callback(this.currentUser);
    }
  }

  notifyAuthListeners(user) {
    this.authListeners.forEach(cb => {
      try { cb(user); } catch (e) { console.error(e); }
    });
  }

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
  }

  getUserId() {
    return this.currentUid || this.currentUser?.uid || this.getFallbackUid();
  }

  isAnonymousUser() {
    return this.currentUser ? this.currentUser.isAnonymous : !this.isTeacher;
  }

  isTeacherUser() {
    return this.isTeacher || (!this.isAnonymousUser());
  }

  async loginTeacher(email, password) {
    if (!this.auth) {
      if (password === "Nutri2@26") {
        this.isTeacher = true;
        this.currentUid = "prof_" + (email ? email.replace(/[^a-zA-Z0-9]/g, "_") : "admin");
        return { success: true, user: { uid: this.currentUid, email: email || "professor@dietocase.edu.br", isAnonymous: false } };
      }
      return { success: false, error: "Firebase Auth não inicializado" };
    }

    try {
      const emailToUse = (email && email.includes("@")) ? email.trim() : "professor@dietocase.edu.br";
      const userCredential = await signInWithEmailAndPassword(this.auth, emailToUse, password);
      this.currentUser = userCredential.user;
      this.currentUid = userCredential.user.uid;
      this.isTeacher = true;
      console.log("👨‍🏫 [Firebase Auth] Professor autenticado com sucesso:", userCredential.user.email, userCredential.user.uid);
      return { success: true, user: userCredential.user };
    } catch (err) {
      console.warn("⚠️ Login Firebase Auth retornou:", err.code, err.message);
      if (password === "Nutri2@26") {
        console.log("🔑 [Fallback] Acesso docente liberado via senha mestre local Nutri2@26");
        this.isTeacher = true;
        this.currentUid = "prof_master_docente";
        return { success: true, user: { uid: this.currentUid, email: email || "professor@dietocase.edu.br", isAnonymous: false }, isFallback: true };
      }
      return { success: false, error: err.message, code: err.code };
    }
  }

  async logoutTeacher() {
    this.isTeacher = false;
    if (this.auth) {
      try {
        await signOut(this.auth);
        await signInAnonymously(this.auth);
      } catch (e) {
        console.warn("Aviso ao deslogar do Firebase Auth:", e);
      }
    }
    this.currentUid = this.getFallbackUid();
    return true;
  }

  // Ativação sob demanda da escuta de disciplinas e casos do professor
  ensureSimulationDataLoaded() {
    return this.startRealtimeListener();
  }

  // Escuta em tempo real nas coleções 'casos_clinicos', 'disciplinas' e 'configuracoes/estado_atual'
  startRealtimeListener() {
    if (!this.db) {
      this.init(true);
      return;
    }
    if (this.isListenerActive) return;
    this.isListenerActive = true;

    // 1. Escuta em tempo real na coleção 'casos_clinicos' (Professor -> Aluno instantâneo)
    try {
      if (this.unsubscribeCasesSnapshot) this.unsubscribeCasesSnapshot();
      const casesCol = collection(this.db, COLLECTION_CASES);
      this.unsubscribeCasesSnapshot = onSnapshot(casesCol, (snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data && data.id) {
              list.push(data);
            }
          });
          if (list.length > 0) {
            console.log(`📡 [Firestore onSnapshot: casos_clinicos] ${list.length} caso(s) recebido(s) em tempo real da nuvem!`);
            this.handleRemoteCasesUpdate(list);
          }
        } else {
          console.log("ℹ️ Coleção 'casos_clinicos' vazia no Firestore. Semeando casos padrão...");
          this.seedInitialCases();
        }
      }, (error) => {
        console.warn("⚠️ Aviso no onSnapshot de casos_clinicos:", error.message);
      });
    } catch (errCases) {
      console.warn("Erro ao configurar onSnapshot de casos_clinicos:", errCases);
    }

    // 2. Escuta em tempo real na coleção 'disciplinas'
    try {
      if (this.unsubscribeDiscSnapshot) this.unsubscribeDiscSnapshot();
      const discCol = collection(this.db, COLLECTION_DISCIPLINAS);
      this.unsubscribeDiscSnapshot = onSnapshot(discCol, (snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data && data.id) {
              list.push(data);
            }
          });
          if (list.length > 0) {
            console.log(`📡 [Firestore onSnapshot: disciplinas] ${list.length} disciplina(s) recebida(s) em tempo real da nuvem!`);
            this.handleRemoteDisciplinasUpdate(list);
          }
        } else {
          console.log("ℹ️ Coleção 'disciplinas' vazia no Firestore. Semeando disciplinas padrão...");
          this.seedInitialDisciplinas();
        }
      }, (error) => {
        console.warn("⚠️ Aviso no onSnapshot de disciplinas:", error.message);
      });
    } catch (errDisc) {
      console.warn("Erro ao configurar onSnapshot de disciplinas:", errDisc);
    }

    // 3. Escuta no documento configuracoes/estado_atual (para travas e configurações globais)
    try {
      if (this.unsubscribeSnapshot) this.unsubscribeSnapshot();
      const estadoRef = doc(this.db, COLLECTION_NAME, DOCUMENT_ID);
      this.unsubscribeSnapshot = onSnapshot(estadoRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("📡 [Firestore onSnapshot: estado_atual] Sincronização de travas recebida:", data.updatedAt);
          this.handleRemoteUpdate(data);
        } else {
          this.seedInitialState();
        }
      }, (error) => {
        console.warn("⚠️ Aviso no onSnapshot do Firestore estado_atual:", error.message);
        this.setStatus("error_firebase");
      });
    } catch (errConfig) {
      console.warn("Erro ao configurar onSnapshot de configuracoes/estado_atual:", errConfig);
    }
  }

  // Processa atualização recebida da coleção 'casos_clinicos' em tempo real
  handleRemoteCasesUpdate(cloudCases) {
    if (!Array.isArray(cloudCases) || cloudCases.length === 0) return;

    if (typeof window !== "undefined") {
      // 1. Atualiza stores em memória
      if (typeof window.setCasesStore === "function") {
        window.setCasesStore(cloudCases);
      }
      if (window.adminManager) {
        window.adminManager.cases = cloudCases;
      }

      // 2. Se houver caso ativo no aluno, atualiza os dados em tempo real
      let activeCaseId = null;
      if (window.appState) {
        activeCaseId = window.appState.currentCaseId || (window.appState.currentCase ? window.appState.currentCase.id : null);
      }
      if (activeCaseId) {
        const updated = cloudCases.find(c => c.id === activeCaseId);
        if (updated && window.appState) {
          window.appState.currentCase = updated;
          if (typeof this.applyPhysicalTabLocks === "function") {
            this.applyPhysicalTabLocks(updated);
          }
        }
      }

      // 3. Re-renderiza a interface do Aluno imediatamente (sem recarregar a página)
      if (typeof window.syncAppStateAndNotify === "function") {
        window.syncAppStateAndNotify(null, false);
      } else if (typeof window.renderStudentCatalog === "function") {
        window.renderStudentCatalog();
      }
    }

    // 4. Notifica listeners registrados
    this.dataListeners.forEach(cb => {
      try { cb({ cases: cloudCases, isRemote: true }); } catch (e) {}
    });
  }

  // Processa atualização recebida da coleção 'disciplinas' em tempo real
  handleRemoteDisciplinasUpdate(cloudDisc) {
    if (!Array.isArray(cloudDisc) || cloudDisc.length === 0) return;

    if (typeof window !== "undefined") {
      if (typeof window.setDisciplinasStore === "function") {
        window.setDisciplinasStore(cloudDisc);
      }
      if (window.adminManager) {
        window.adminManager.disciplinas = cloudDisc;
      }

      if (typeof window.syncAppStateAndNotify === "function") {
        window.syncAppStateAndNotify(null, false);
      } else if (typeof window.renderStudentDisciplinePortal === "function") {
        window.renderStudentDisciplinePortal();
      }
    }

    this.dataListeners.forEach(cb => {
      try { cb({ disciplinas: cloudDisc, isRemote: true }); } catch (e) {}
    });
  }

  // Semeia casos padrão diretamente na coleção 'casos_clinicos'
  async seedInitialCases() {
    if (!this.db) return;
    try {
      const initialCases = (typeof window !== "undefined" && window.adminManager)
        ? window.adminManager.cases
        : (typeof getCases === "function" ? getCases() : []);
      for (const c of initialCases) {
        if (c && c.id) {
          const caseRef = doc(this.db, COLLECTION_CASES, c.id);
          await setDoc(caseRef, c, { merge: true });
        }
      }
      console.log(`✅ [Firestore Auto-Seed] ${initialCases.length} caso(s) padrão semeado(s) em 'casos_clinicos'`);
    } catch (e) {
      console.warn("Aviso ao semear casos no Firestore:", e);
    }
  }

  // Semeia disciplinas padrão diretamente na coleção 'disciplinas'
  async seedInitialDisciplinas() {
    if (!this.db) return;
    try {
      const initialDisc = (typeof window !== "undefined" && window.adminManager)
        ? window.adminManager.disciplinas
        : (typeof getDisciplinas === "function" ? getDisciplinas() : []);
      for (const d of initialDisc) {
        if (d && d.id) {
          const discRef = doc(this.db, COLLECTION_DISCIPLINAS, d.id);
          await setDoc(discRef, d, { merge: true });
        }
      }
      console.log(`✅ [Firestore Auto-Seed] ${initialDisc.length} disciplina(s) padrão semeada(s) em 'disciplinas'`);
    } catch (e) {
      console.warn("Aviso ao semear disciplinas no Firestore:", e);
    }
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

      // 1. Atualiza stores e modelos em memória sem tocar em localStorage
      if (typeof window !== "undefined") {
        if (typeof window.setDisciplinasStore === "function" && disciplinas.length > 0) {
          window.setDisciplinasStore(disciplinas);
        }
        if (typeof window.setCasesStore === "function" && cases.length > 0) {
          window.setCasesStore(cases);
        }
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

  // Salva o estado completo no Firestore: configuracoes/estado_atual e sincroniza coleções dedicadas
  async saveEstadoAtual(disciplinas, cases, meta = {}) {
    const safeDisciplinas = Array.isArray(disciplinas) ? disciplinas : [];
    const safeCases = Array.isArray(cases) ? cases : [];

    // Atualiza stores em memória
    if (typeof window !== "undefined") {
      if (typeof window.setDisciplinasStore === "function" && safeDisciplinas.length > 0) {
        window.setDisciplinasStore(safeDisciplinas);
      }
      if (typeof window.setCasesStore === "function" && safeCases.length > 0) {
        window.setCasesStore(safeCases);
      }
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
        updatedBy: this.currentUser?.email || this.currentUser?.uid || "professor",
        ...meta
      };

      await setDoc(estadoRef, payload, { merge: true });
      console.log("☁️ [Firestore] Estado salvo com sucesso em configuracoes/estado_atual:", payload.updatedAt);

      // Sincroniza em segundo plano nas coleções dedicadas (casos_clinicos, disciplinas, pacientes_virtuais)
      for (const c of safeCases) {
        if (c && c.id) {
          const caseRef = doc(this.db, COLLECTION_CASES, c.id);
          setDoc(caseRef, c, { merge: true }).catch(() => {});

          const pacienteRef = doc(this.db, COLLECTION_PACIENTES, c.id);
          const pacienteData = {
            caseId: c.id,
            disciplinaId: c.disciplinaId || "dietoterapia",
            paciente: c.patient || c.paciente || {},
            historiaClinica: c.history?.hda || c.anamnese?.historiaClinica || "",
            queixaPrincipal: c.history?.queixaPrincipal || c.anamnese?.queixaPrincipal || "",
            diagnosticoClinico: c.hipoteseDiagnostica || c.paciente?.diagnosticoClinico || "",
            updatedAt: new Date().toISOString()
          };
          setDoc(pacienteRef, pacienteData, { merge: true }).catch(() => {});
        }
      }

      for (const d of safeDisciplinas) {
        if (d && d.id) {
          const discRef = doc(this.db, COLLECTION_DISCIPLINAS, d.id);
          setDoc(discRef, d, { merge: true }).catch(() => {});
        }
      }

      this.setStatus("online_firebase");
      return true;
    } catch (err) {
      console.error("❌ Erro ao salvar estado no Firestore:", err);
      this.setStatus("error_firebase");
      return false;
    }
  }

  // Aba do Professor: Trancar ou destravar abas de um caso (Exclusivo Docente)
  async setCaseBlockedTabs(caseId, blockedTabs) {
    if (!this.isTeacherUser()) {
      console.warn("⚠️ Permissão negada: Somente professores autenticados podem bloquear abas.");
      return false;
    }
    const cases = (window.adminManager ? window.adminManager.cases : (typeof getCases === "function" ? getCases() : []));
    const c = cases.find(item => item.id === caseId);
    if (c) {
      c.blockedTabs = Array.isArray(blockedTabs) ? blockedTabs : [];
    }
    const disciplinas = (window.adminManager ? window.adminManager.disciplinas : (typeof getDisciplinas === "function" ? getDisciplinas() : []));
    return await this.saveEstadoAtual(disciplinas, cases, { action: "setBlockedTabs", caseId });
  }

  // Aba do Professor: Trancar ou liberar um caso clínico (Exclusivo Docente)
  async setCaseLock(caseId, isLocked) {
    if (!this.isTeacherUser()) {
      console.warn("⚠️ Permissão negada: Somente professores autenticados podem travar casos.");
      return false;
    }
    const cases = (window.adminManager ? window.adminManager.cases : (typeof getCases === "function" ? getCases() : []));
    const c = cases.find(item => item.id === caseId);
    if (c) {
      c.isLocked = isLocked === true;
    }
    const disciplinas = (window.adminManager ? window.adminManager.disciplinas : (typeof getDisciplinas === "function" ? getDisciplinas() : []));
    return await this.saveEstadoAtual(disciplinas, cases, { action: "setLock", caseId });
  }

  // Aba do Professor: Ocultar ou mostrar um caso clínico para os alunos (Exclusivo Docente)
  async setCaseVisibility(caseId, visivel) {
    if (!this.isTeacherUser()) {
      console.warn("⚠️ Permissão negada: Somente professores autenticados podem alterar visibilidade de casos.");
      return false;
    }
    const cases = (window.adminManager ? window.adminManager.cases : (typeof getCases === "function" ? getCases() : []));
    const c = cases.find(item => item.id === caseId);
    if (c) {
      c.visivel = visivel === true;
    }
    const disciplinas = (window.adminManager ? window.adminManager.disciplinas : (typeof getDisciplinas === "function" ? getDisciplinas() : []));
    return await this.saveEstadoAtual(disciplinas, cases, { action: "setVisibility", caseId, visivel });
  }

  // Aba do Professor: Salvar caso (criar ou editar na coleção 'casos_clinicos' e 'pacientes_virtuais')
  async saveCase(caseData) {
    if (!this.isTeacherUser()) {
      console.warn("⚠️ Permissão negada: Somente professores autenticados podem criar ou editar casos clínicos.");
      return false;
    }
    const cases = (window.adminManager ? window.adminManager.cases : (typeof getCases === "function" ? getCases() : []));
    const idx = cases.findIndex(c => c.id === caseData.id);
    if (idx >= 0) {
      cases[idx] = caseData;
    } else {
      cases.push(caseData);
    }
    if (typeof window !== "undefined" && typeof window.setCasesStore === "function") {
      window.setCasesStore(cases);
    }

    if (this.db) {
      try {
        const caseRef = doc(this.db, COLLECTION_CASES, caseData.id);
        await setDoc(caseRef, caseData, { merge: true });

        const pacienteRef = doc(this.db, COLLECTION_PACIENTES, caseData.id);
        const pacienteData = {
          caseId: caseData.id,
          disciplinaId: caseData.disciplinaId || "dietoterapia",
          paciente: caseData.patient || caseData.paciente || {},
          historiaClinica: caseData.history?.hda || caseData.anamnese?.historiaClinica || "",
          queixaPrincipal: caseData.history?.queixaPrincipal || caseData.anamnese?.queixaPrincipal || "",
          diagnosticoClinico: caseData.hipoteseDiagnostica || caseData.paciente?.diagnosticoClinico || "",
          updatedAt: new Date().toISOString()
        };
        await setDoc(pacienteRef, pacienteData, { merge: true });
        console.log(`☁️ [Firestore] Caso '${caseData.id}' salvo em '${COLLECTION_CASES}' e '${COLLECTION_PACIENTES}'`);
      } catch (e) {
        console.warn("Aviso ao salvar caso nas coleções dedicadas do Firestore:", e);
      }
    }

    const disciplinas = (window.adminManager ? window.adminManager.disciplinas : (typeof getDisciplinas === "function" ? getDisciplinas() : []));
    return await this.saveEstadoAtual(disciplinas, cases, { action: "saveCase", caseId: caseData.id });
  }

  // Aba do Professor: Excluir caso (remover de 'casos_clinicos' e 'pacientes_virtuais')
  async deleteCase(caseId) {
    if (!this.isTeacherUser()) {
      console.warn("⚠️ Permissão negada: Somente professores autenticados podem excluir casos clínicos.");
      return false;
    }
    let cases = (window.adminManager ? window.adminManager.cases : (typeof getCases === "function" ? getCases() : []));
    cases = cases.filter(c => c.id !== caseId);
    if (window.adminManager) window.adminManager.cases = cases;
    if (typeof window !== "undefined" && typeof window.setCasesStore === "function") {
      window.setCasesStore(cases);
    }

    if (this.db) {
      try {
        const caseRef = doc(this.db, COLLECTION_CASES, caseId);
        await deleteDoc(caseRef);

        const pacienteRef = doc(this.db, COLLECTION_PACIENTES, caseId);
        await deleteDoc(pacienteRef);
        console.log(`☁️ [Firestore] Caso '${caseId}' removido de '${COLLECTION_CASES}' e '${COLLECTION_PACIENTES}'`);
      } catch (e) {
        console.warn("Aviso ao excluir caso nas coleções dedicadas do Firestore:", e);
      }
    }

    const disciplinas = (window.adminManager ? window.adminManager.disciplinas : (typeof getDisciplinas === "function" ? getDisciplinas() : []));
    return await this.saveEstadoAtual(disciplinas, cases, { action: "deleteCase", caseId });
  }

  // Aba do Professor: Salvar disciplina (salvar em 'disciplinas')
  async saveDisciplina(discData) {
    if (!this.isTeacherUser()) {
      console.warn("⚠️ Permissão negada: Somente professores autenticados podem criar ou editar disciplinas.");
      return false;
    }
    const disciplinas = (window.adminManager ? window.adminManager.disciplinas : (typeof getDisciplinas === "function" ? getDisciplinas() : []));
    const idx = disciplinas.findIndex(d => d.id === discData.id);
    if (idx >= 0) {
      disciplinas[idx] = discData;
    } else {
      disciplinas.push(discData);
    }
    if (typeof window !== "undefined" && typeof window.setDisciplinasStore === "function") {
      window.setDisciplinasStore(disciplinas);
    }

    if (this.db) {
      try {
        const discRef = doc(this.db, COLLECTION_DISCIPLINAS, discData.id);
        await setDoc(discRef, discData, { merge: true });
        console.log(`☁️ [Firestore] Disciplina '${discData.id}' salva na coleção '${COLLECTION_DISCIPLINAS}'`);
      } catch (e) {
        console.warn("Aviso ao salvar disciplina na coleção do Firestore:", e);
      }
    }

    const cases = (window.adminManager ? window.adminManager.cases : (typeof getCases === "function" ? getCases() : []));
    return await this.saveEstadoAtual(disciplinas, cases, { action: "saveDisciplina", disciplinaId: discData.id });
  }

  // Aba do Professor: Excluir disciplina (remover de 'disciplinas')
  async deleteDisciplina(discId) {
    if (!this.isTeacherUser()) {
      console.warn("⚠️ Permissão negada: Somente professores autenticados podem excluir disciplinas.");
      return false;
    }
    let disciplinas = (window.adminManager ? window.adminManager.disciplinas : (typeof getDisciplinas === "function" ? getDisciplinas() : []));
    disciplinas = disciplinas.filter(d => d.id !== discId);
    if (window.adminManager) window.adminManager.disciplinas = disciplinas;
    if (typeof window !== "undefined" && typeof window.setDisciplinasStore === "function") {
      window.setDisciplinasStore(disciplinas);
    }

    if (this.db) {
      try {
        const discRef = doc(this.db, COLLECTION_DISCIPLINAS, discId);
        await deleteDoc(discRef);
        console.log(`☁️ [Firestore] Disciplina '${discId}' removida da coleção '${COLLECTION_DISCIPLINAS}'`);
      } catch (e) {
        console.warn("Aviso ao excluir disciplina do Firestore:", e);
      }
    }

    const cases = (window.adminManager ? window.adminManager.cases : (typeof getCases === "function" ? getCases() : []));
    return await this.saveEstadoAtual(disciplinas, cases, { action: "deleteDisciplina", disciplinaId: discId });
  }

  // Salva atendimento presencial real na coleção dedicada 'atendimentos_reais'
  async saveAtendimentoReal(atendimentoData) {
    const id = atendimentoData.id || ("atendimento-real-" + Date.now());
    const uid = atendimentoData.userId || this.getUserId();
    const storageKey = "dietocase_atendimentos_reais_v1";

    const payload = {
      ...atendimentoData,
      id: id,
      userId: uid,
      updatedAt: new Date().toISOString()
    };

    // 1. Persistência local imediata em localStorage para redundância e modo offline
    try {
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
      await setDoc(atendimentoRef, payload, { merge: true });
      console.log(`☁️ [Firebase v9] Atendimento real salvo na coleção 'atendimentos_reais/${id}' com userId=${uid}!`);
      return true;
    } catch (err) {
      console.error("❌ Erro ao salvar atendimento real no Cloud Firestore:", err);
      return false;
    }
  }

  // Salva prontuário do modo simulação na coleção 'prontuarios'
  async saveProntuario(caseId, prontuarioData) {
    if (!caseId || !prontuarioData) return false;
    const uid = prontuarioData.userId || this.getUserId();
    const docId = `${caseId}_${uid}`;
    const payload = {
      ...prontuarioData,
      caseId: caseId,
      userId: uid,
      updatedAt: new Date().toISOString()
    };

    if (!this.db || !this.isConfigured()) {
      return true;
    }

    try {
      const prontRef = doc(this.db, "prontuarios", docId);
      await setDoc(prontRef, payload, { merge: true });
      console.log(`☁️ [Firebase v9] Prontuário '${docId}' salvo no Firestore com userId=${uid}!`);
      return true;
    } catch (err) {
      console.warn("⚠️ Aviso ao salvar prontuário no Firestore:", err.message);
      return false;
    }
  }

  // Salva alimento colaborativo cadastrado pelo usuário na coleção 'alimentos_colaborativos'
  async saveAlimentoColaborativo(alimentoData) {
    if (!alimentoData || !alimentoData.nome) return null;
    const id = alimentoData.id || ("colab-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6));
    const uid = alimentoData.userId || this.getUserId();
    const storageKey = "dietocase_alimentos_colaborativos_v1";

    const payload = {
      ...alimentoData,
      id: id,
      tabela: "Colaborativa",
      fonte: alimentoData.fonte || "Cadastro Colaborativo (Nuvem)",
      userId: uid,
      baseGramas: Number(alimentoData.baseGramas) || 100,
      kcal: Number(alimentoData.kcal) || 0,
      cho: Number(alimentoData.cho) || 0,
      ptn: Number(alimentoData.ptn) || 0,
      lip: Number(alimentoData.lip) || 0,
      sat: Number(alimentoData.sat) || 0,
      mono: Number(alimentoData.mono) || 0,
      poli: Number(alimentoData.poli) || 0,
      fibra: Number(alimentoData.fibra) || 0,
      calcio: Number(alimentoData.calcio) || 0,
      ferro: Number(alimentoData.ferro) || 0,
      sodio: Number(alimentoData.sodio) || 0,
      potassio: Number(alimentoData.potassio) || 0,
      vitA: Number(alimentoData.vitA) || 0,
      vitC: Number(alimentoData.vitC) || 0,
      porcaoSugerida: alimentoData.porcaoSugerida || `${alimentoData.baseGramas || 100}g`,
      updatedAt: new Date().toISOString()
    };

    // 1. Persistência local imediata e sincronização entre abas
    try {
      const rawLocal = localStorage.getItem(storageKey);
      const list = rawLocal ? JSON.parse(rawLocal) : [];
      const idx = list.findIndex(item => item.id === id);
      if (idx >= 0) {
        list[idx] = payload;
      } else {
        list.push(payload);
      }
      localStorage.setItem(storageKey, JSON.stringify(list));
      if (typeof window !== "undefined") {
        window.ALIMENTOS_COLABORATIVOS = list;
        try {
          const bc = new BroadcastChannel("dietocase_sync_channel");
          bc.postMessage({ type: "ALIMENTO_COLABORATIVO_SALVO", alimento: payload });
        } catch (e) {}
      }
    } catch (e) {
      console.warn("Aviso ao salvar alimento colaborativo em localStorage:", e);
    }

    // 2. Persistência em nuvem no Cloud Firestore
    if (!this.db || !this.isConfigured()) {
      console.log("☁️ Alimento colaborativo salvo em cache local (Firestore offline ou chave de exemplo).");
      return payload;
    }

    try {
      const colabRef = doc(this.db, "alimentos_colaborativos", id);
      await setDoc(colabRef, payload, { merge: true });
      console.log(`☁️ [Firebase v9] Alimento colaborativo '${payload.nome}' salvo no Firestore ('alimentos_colaborativos/${id}')!`);
      return payload;
    } catch (err) {
      console.warn("⚠️ Aviso ao salvar alimento colaborativo no Firestore:", err.message);
      return payload;
    }
  }

  // Busca todos os alimentos colaborativos em nuvem (Firestore) e consolida com cache local
  async fetchAlimentosColaborativos() {
    const storageKey = "dietocase_alimentos_colaborativos_v1";
    let localList = [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) localList = JSON.parse(raw) || [];
    } catch (e) {}

    if (!this.db || !this.isConfigured()) {
      if (typeof window !== "undefined") window.ALIMENTOS_COLABORATIVOS = localList;
      return localList;
    }

    try {
      const colRef = collection(this.db, "alimentos_colaborativos");
      const snap = await getDocs(colRef);
      const cloudList = [];
      snap.forEach(docSnap => {
        cloudList.push(docSnap.data());
      });

      const mergedMap = new Map();
      localList.forEach(item => mergedMap.set(item.id, item));
      cloudList.forEach(item => mergedMap.set(item.id, item));
      const merged = Array.from(mergedMap.values());

      try {
        localStorage.setItem(storageKey, JSON.stringify(merged));
      } catch (e) {}

      if (typeof window !== "undefined") {
        window.ALIMENTOS_COLABORATIVOS = merged;
      }
      return merged;
    } catch (err) {
      console.warn("⚠️ Aviso ao buscar alimentos colaborativos do Firestore:", err.message);
      if (typeof window !== "undefined") window.ALIMENTOS_COLABORATIVOS = localList;
      return localList;
    }
  }

  // Busca dados globais diretamente das coleções do Firestore (casos_clinicos, disciplinas, pacientes_virtuais)
  async fetchCloudCollections() {
    if (!this.db || !this.isConfigured()) {
      return {
        cases: typeof getCases === "function" ? getCases() : [],
        disciplinas: typeof getDisciplinas === "function" ? getDisciplinas() : []
      };
    }

    try {
      const discSnap = await getDocs(collection(this.db, COLLECTION_DISCIPLINAS));
      const cloudDisc = [];
      discSnap.forEach(d => cloudDisc.push(d.data()));

      const casesSnap = await getDocs(collection(this.db, COLLECTION_CASES));
      const cloudCases = [];
      casesSnap.forEach(d => cloudCases.push(d.data()));

      if (cloudDisc.length > 0 || cloudCases.length > 0) {
        if (typeof window !== "undefined") {
          if (cloudDisc.length > 0 && typeof window.setDisciplinasStore === "function") {
            window.setDisciplinasStore(cloudDisc);
          }
          if (cloudCases.length > 0 && typeof window.setCasesStore === "function") {
            window.setCasesStore(cloudCases);
          }
          if (window.adminManager) {
            if (cloudDisc.length > 0) window.adminManager.disciplinas = cloudDisc;
            if (cloudCases.length > 0) window.adminManager.cases = cloudCases;
          }
        }
        return { disciplinas: cloudDisc, cases: cloudCases };
      }

      // Fallback para estado consolidado se as coleções estiverem vazias
      const estadoRef = doc(this.db, COLLECTION_NAME, DOCUMENT_ID);
      const snap = await getDoc(estadoRef);
      if (snap.exists()) {
        const data = snap.data();
        const disc = Array.isArray(data.disciplinas) ? data.disciplinas : [];
        const cList = Array.isArray(data.cases) ? data.cases : [];
        if (typeof window !== "undefined") {
          if (disc.length > 0 && typeof window.setDisciplinasStore === "function") {
            window.setDisciplinasStore(disc);
          }
          if (cList.length > 0 && typeof window.setCasesStore === "function") {
            window.setCasesStore(cList);
          }
        }
        return { disciplinas: disc, cases: cList };
      }
    } catch (err) {
      console.warn("⚠️ Aviso ao buscar coleções dedicadas do Firestore:", err.message);
    }

    return {
      disciplinas: typeof getDisciplinas === "function" ? getDisciplinas() : [],
      cases: typeof getCases === "function" ? getCases() : []
    };
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

