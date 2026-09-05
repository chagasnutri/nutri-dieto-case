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
  async deleteDisciplina(id) { return true; }
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

