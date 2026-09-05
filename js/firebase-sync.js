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

    this.init();
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

  init() {
    if (!this.isConfigured()) {
      this.setStatus("unconfigured_firebase");
      return false;
    }

    try {
      this.app = initializeApp(this.config);
      this.db = getFirestore(this.app);
      this.setStatus("online_firebase");
      console.log("☁️ [Firebase v9 Modular] Firestore conectado com sucesso para o projeto:", this.config.projectId);

      // Inicia a escuta em tempo real do documento estado_atual
      this.startRealtimeListener();
      return true;
    } catch (err) {
      console.error("❌ Erro ao inicializar Firebase v9 Modular:", err);
      this.setStatus("error_firebase");
      return false;
    }
  }

  // Escuta em tempo real no documento: configuracoes/estado_atual
  startRealtimeListener() {
    if (!this.db) return;
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

    try {
      const cases = Array.isArray(data.cases) ? data.cases : [];
      const disciplinas = Array.isArray(data.disciplinas) ? data.disciplinas : [];

      // Atualiza o cache local (localStorage) para permitir funcionamento offline e persistência
      if (disciplinas.length > 0) {
        localStorage.setItem("dietocase_disciplinas_data", JSON.stringify(disciplinas));
      }
      if (cases.length > 0) {
        localStorage.setItem("dietocase_cases_data", JSON.stringify(cases));
      }
      if (data.updatedAt) {
        localStorage.setItem("dietocase_last_sync_ts", data.updatedAt);
      }

      // Atualiza os modelos do AdminManager
      if (typeof window !== "undefined" && window.adminManager) {
        window.adminManager.disciplinas = disciplinas;
        window.adminManager.cases = cases;
      }

      // Notifica ouvintes registrados (ex: sync-engine)
      this.dataListeners.forEach(cb => {
        try { cb({ disciplinas, cases, isRemote: true, updatedAt: data.updatedAt }); } catch (e) {}
      });

      // Se o app já estiver ativo na janela, atualiza imediatamente a interface do aluno
      if (typeof window !== "undefined") {
        if (typeof window.syncAppStateAndNotify === "function") {
          window.syncAppStateAndNotify(null, false);
        } else if (window.dietoSyncEngine) {
          window.dietoSyncEngine.notifyDataListeners({ disciplinas, cases, isRemote: true });
        }

        // Se o aluno estiver dentro de um caso clínico, atualiza travas de abas e bloqueios instantaneamente
        if (window.appState && window.appState.currentCase) {
          const currentId = window.appState.currentCase.id;
          const updatedCase = cases.find(c => c.id === currentId);
          if (updatedCase) {
            window.appState.currentCase = updatedCase;
            if (typeof window.applyStudentTabBlockingState === "function") {
              window.applyStudentTabBlockingState(updatedCase);
            }
          }
        }
      }
    } finally {
      setTimeout(() => { this.isApplyingRemote = false; }, 300);
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
    if (!this.db) {
      console.warn("Firestore não inicializado para gravação.");
      return false;
    }

    try {
      const estadoRef = doc(this.db, COLLECTION_NAME, DOCUMENT_ID);
      const payload = {
        disciplinas: Array.isArray(disciplinas) ? disciplinas : [],
        cases: Array.isArray(cases) ? cases : [],
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
    const cases = (window.adminManager ? window.adminManager.cases : []);
    const c = cases.find(item => item.id === caseId);
    if (c) {
      c.blockedTabs = Array.isArray(blockedTabs) ? blockedTabs : [];
    }
    const disciplinas = (window.adminManager ? window.adminManager.disciplinas : []);
    return await this.saveEstadoAtual(disciplinas, cases, { action: "setBlockedTabs", caseId });
  }

  // Aba do Professor: Trancar ou liberar um caso clínico
  async setCaseLock(caseId, isLocked) {
    const cases = (window.adminManager ? window.adminManager.cases : []);
    const c = cases.find(item => item.id === caseId);
    if (c) {
      c.isLocked = isLocked === true;
    }
    const disciplinas = (window.adminManager ? window.adminManager.disciplinas : []);
    return await this.saveEstadoAtual(disciplinas, cases, { action: "setLock", caseId });
  }

  // Aba do Professor: Salvar caso (criar ou editar)
  async saveCase(caseData) {
    const cases = (window.adminManager ? window.adminManager.cases : []);
    const idx = cases.findIndex(c => c.id === caseData.id);
    if (idx >= 0) {
      cases[idx] = caseData;
    } else {
      cases.push(caseData);
    }
    const disciplinas = (window.adminManager ? window.adminManager.disciplinas : []);
    return await this.saveEstadoAtual(disciplinas, cases, { action: "saveCase", caseId: caseData.id });
  }

  // Aba do Professor: Excluir caso
  async deleteCase(caseId) {
    let cases = (window.adminManager ? window.adminManager.cases : []);
    cases = cases.filter(c => c.id !== caseId);
    if (window.adminManager) window.adminManager.cases = cases;
    const disciplinas = (window.adminManager ? window.adminManager.disciplinas : []);
    return await this.saveEstadoAtual(disciplinas, cases, { action: "deleteCase", caseId });
  }

  // Aba do Professor: Salvar disciplina
  async saveDisciplina(discData) {
    const disciplinas = (window.adminManager ? window.adminManager.disciplinas : []);
    const idx = disciplinas.findIndex(d => d.id === discData.id);
    if (idx >= 0) {
      disciplinas[idx] = discData;
    } else {
      disciplinas.push(discData);
    }
    const cases = (window.adminManager ? window.adminManager.cases : []);
    return await this.saveEstadoAtual(disciplinas, cases, { action: "saveDisciplina", disciplinaId: discData.id });
  }

  // Aba do Professor: Excluir disciplina
  async deleteDisciplina(discId) {
    let disciplinas = (window.adminManager ? window.adminManager.disciplinas : []);
    disciplinas = disciplinas.filter(d => d.id !== discId);
    if (window.adminManager) window.adminManager.disciplinas = disciplinas;
    const cases = (window.adminManager ? window.adminManager.cases : []);
    return await this.saveEstadoAtual(disciplinas, cases, { action: "deleteDisciplina", disciplinaId: discId });
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

