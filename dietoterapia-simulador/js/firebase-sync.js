// Gerenciador de Nuvem Firebase Firestore em Tempo Real - DietoCase
// Conecta os dispositivos dos professores e dos alunos em tempo real utilizando o Google Cloud Firestore.

class FirebaseSyncService {
  constructor() {
    this.app = null;
    this.db = null;
    this.status = "unconfigured"; // unconfigured, connecting, online, syncing, error
    this.statusListeners = [];
    this.dataListeners = [];
    this.casosUnsubscribe = null;
    this.disciplinasUnsubscribe = null;
    this.isSeeding = false;
    this.hasReceivedInitialSnapshot = false;
  }

  isConfigured() {
    const cfg = (typeof window !== "undefined" && window.FIREBASE_CONFIG) ? window.FIREBASE_CONFIG : null;
    return !!(cfg && cfg.apiKey && cfg.projectId && cfg.apiKey.trim() !== "" && cfg.projectId.trim() !== "");
  }

  getConfig() {
    return (typeof window !== "undefined" && window.FIREBASE_CONFIG) ? window.FIREBASE_CONFIG : {};
  }

  onStatusChange(callback) {
    if (typeof callback === "function") {
      this.statusListeners.push(callback);
      callback(this.status);
    }
  }

  setStatus(newStatus, detail = null) {
    this.status = newStatus;
    this.statusListeners.forEach(cb => {
      try { cb(newStatus, detail); } catch (e) {}
    });
  }

  onDataChange(callback) {
    if (typeof callback === "function") {
      this.dataListeners.push(callback);
    }
  }

  // Inicializa o Firebase Firestore
  async init() {
    if (!this.isConfigured()) {
      this.setStatus("unconfigured", "Chaves do Firebase não configuradas. Operando em modo local.");
      console.log("☁️ Firebase: chaves pendentes em js/firebase-config.js. Sistema rodando em cache local.");
      return false;
    }

    if (typeof firebase === "undefined") {
      this.setStatus("error", "SDK do Firebase não foi carregado pelo navegador.");
      console.warn("Firebase SDK compat não disponível.");
      return false;
    }

    try {
      this.setStatus("connecting");
      const config = this.getConfig();

      // Evita duplicar inicialização se o app já existir
      if (!firebase.apps || firebase.apps.length === 0) {
        this.app = firebase.initializeApp(config);
      } else {
        this.app = firebase.apps[0];
      }

      this.db = firebase.firestore();

      // Habilita persistência offline se possível
      try {
        await this.db.enablePersistence({ synchronizeTabs: true });
      } catch (err) {
        // Ignora erros de múltiplas abas ou navegador não suportado
      }

      this.setStatus("online");
      this.setupRealtimeListeners();
      return true;
    } catch (err) {
      console.error("Erro ao inicializar Firebase Firestore:", err);
      this.setStatus("error", err.message);
      return false;
    }
  }

  // Configura ouvintes em tempo real (onSnapshot) para sincronização instantânea
  setupRealtimeListeners() {
    if (!this.db) return;

    // Cancela ouvintes anteriores se existirem
    if (this.casosUnsubscribe) this.casosUnsubscribe();
    if (this.disciplinasUnsubscribe) this.disciplinasUnsubscribe();

    let cachedCasos = [];
    let cachedDisciplinas = [];
    let casosLoaded = false;
    let discLoaded = false;

    const checkInitialSeed = async () => {
      if (casosLoaded && discLoaded && !this.hasReceivedInitialSnapshot) {
        this.hasReceivedInitialSnapshot = true;
        // Se o banco de dados estiver completamente virgem, faz o seed dos dados padrão
        if (cachedCasos.length === 0 && cachedDisciplinas.length === 0) {
          await this.seedInitialDataIfEmpty();
        }
      }
    };

    // Ouvinte da coleção 'disciplinas'
    this.disciplinasUnsubscribe = this.db.collection("disciplinas").onSnapshot(snapshot => {
      const disciplinas = [];
      snapshot.forEach(doc => {
        disciplinas.push({ id: doc.id, ...doc.data() });
      });
      cachedDisciplinas = disciplinas;
      discLoaded = true;
      this.notifyListenersIfReady(cachedDisciplinas, cachedCasos);
      checkInitialSeed();
    }, error => {
      console.error("Erro no listener do Firestore (disciplinas):", error);
      this.setStatus("error", error.message);
    });

    // Ouvinte da coleção 'casos'
    this.casosUnsubscribe = this.db.collection("casos").onSnapshot(snapshot => {
      const casos = [];
      snapshot.forEach(doc => {
        casos.push({ id: doc.id, ...doc.data() });
      });
      cachedCasos = casos;
      casosLoaded = true;
      this.notifyListenersIfReady(cachedDisciplinas, cachedCasos);
      checkInitialSeed();
    }, error => {
      console.error("Erro no listener do Firestore (casos):", error);
      this.setStatus("error", error.message);
    });
  }

  notifyListenersIfReady(disciplinas, cases) {
    if (disciplinas.length === 0 && cases.length === 0 && !this.hasReceivedInitialSnapshot) {
      return;
    }
    // Atualiza localmente para caso o usuário fique offline depois
    if (Array.isArray(disciplinas) && disciplinas.length > 0) {
      localStorage.setItem(STORAGE_KEY_DISCIPLINAS, JSON.stringify(disciplinas));
    }
    if (Array.isArray(cases) && cases.length > 0) {
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases));
    }

    this.dataListeners.forEach(cb => {
      try {
        cb({
          disciplinas: disciplinas,
          cases: cases,
          isRemote: true,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error("Erro no callback do listener de dados do Firebase:", e);
      }
    });
  }

  // Popula o Firestore virgem com os casos e disciplinas padrão locais
  async seedInitialDataIfEmpty() {
    if (this.isSeeding || !this.db) return;
    this.isSeeding = true;
    console.log("☁️ Firestore virgem detectado: realizando envio inicial dos dados padrão...");
    try {
      const defaultDisciplinas = (typeof getDisciplinas === "function") ? getDisciplinas() : [];
      const defaultCases = (typeof getCases === "function") ? getCases() : [];

      const batch = this.db.batch();

      defaultDisciplinas.forEach(d => {
        const ref = this.db.collection("disciplinas").doc(d.id);
        batch.set(ref, this.sanitizeForFirestore(d));
      });

      defaultCases.forEach(c => {
        const ref = this.db.collection("casos").doc(c.id);
        const data = {
          ...c,
          isLocked: c.isLocked === true,
          blockedTabs: Array.isArray(c.blockedTabs) ? c.blockedTabs : []
        };
        batch.set(ref, this.sanitizeForFirestore(data));
      });

      await batch.commit();
      console.log("✅ Dados padrão enviados com sucesso ao Firestore!");
    } catch (e) {
      console.warn("Erro ao fazer seed inicial no Firestore:", e);
    } finally {
      this.isSeeding = false;
    }
  }

  // Remove valores undefined para compatibilidade estrita com Firestore
  sanitizeForFirestore(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeForFirestore(item));
    }
    const clean = {};
    Object.keys(obj).forEach(key => {
      const val = obj[key];
      if (val !== undefined) {
        clean[key] = this.sanitizeForFirestore(val);
      }
    });
    return clean;
  }

  // Salva ou atualiza uma disciplina no Firestore
  async saveDisciplina(disciplina) {
    if (!this.db || !this.isConfigured()) return { success: false, localOnly: true };
    this.setStatus("syncing");
    try {
      await this.db.collection("disciplinas").doc(disciplina.id).set(this.sanitizeForFirestore(disciplina), { merge: true });
      this.setStatus("online");
      return { success: true };
    } catch (err) {
      console.error("Erro ao salvar disciplina no Firestore:", err);
      this.setStatus("error", err.message);
      return { success: false, error: err.message };
    }
  }

  // Exclui uma disciplina no Firestore
  async deleteDisciplina(disciplinaId) {
    if (!this.db || !this.isConfigured()) return { success: false, localOnly: true };
    this.setStatus("syncing");
    try {
      await this.db.collection("disciplinas").doc(disciplinaId).delete();
      this.setStatus("online");
      return { success: true };
    } catch (err) {
      console.error("Erro ao excluir disciplina no Firestore:", err);
      this.setStatus("error", err.message);
      return { success: false, error: err.message };
    }
  }

  // Salva ou atualiza um caso clínico no Firestore
  async saveCase(caseData) {
    if (!this.db || !this.isConfigured()) return { success: false, localOnly: true };
    this.setStatus("syncing");
    try {
      const dataToSave = {
        ...caseData,
        isLocked: caseData.isLocked === true,
        blockedTabs: Array.isArray(caseData.blockedTabs) ? caseData.blockedTabs : [],
        updatedAt: new Date().toISOString()
      };
      await this.db.collection("casos").doc(caseData.id).set(this.sanitizeForFirestore(dataToSave), { merge: true });
      this.setStatus("online");
      return { success: true };
    } catch (err) {
      console.error("Erro ao salvar caso clínico no Firestore:", err);
      this.setStatus("error", err.message);
      return { success: false, error: err.message };
    }
  }

  // Exclui um caso clínico no Firestore
  async deleteCase(caseId) {
    if (!this.db || !this.isConfigured()) return { success: false, localOnly: true };
    this.setStatus("syncing");
    try {
      await this.db.collection("casos").doc(caseId).delete();
      this.setStatus("online");
      return { success: true };
    } catch (err) {
      console.error("Erro ao excluir caso no Firestore:", err);
      this.setStatus("error", err.message);
      return { success: false, error: err.message };
    }
  }

  // Tranca ou libera um caso clínico no Firestore (Tempo Real)
  async setCaseLock(caseId, isLocked) {
    if (!this.db || !this.isConfigured()) return { success: false, localOnly: true };
    this.setStatus("syncing");
    try {
      await this.db.collection("casos").doc(caseId).set({
        isLocked: !!isLocked,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      this.setStatus("online");
      return { success: true, isLocked: !!isLocked };
    } catch (err) {
      console.error("Erro ao atualizar trava do caso no Firestore:", err);
      this.setStatus("error", err.message);
      return { success: false, error: err.message };
    }
  }

  // Atualiza as abas bloqueadas de um caso clínico no Firestore (Tempo Real)
  async setCaseBlockedTabs(caseId, blockedTabs) {
    if (!this.db || !this.isConfigured()) return { success: false, localOnly: true };
    this.setStatus("syncing");
    try {
      const list = Array.isArray(blockedTabs) ? blockedTabs : [];
      await this.db.collection("casos").doc(caseId).set({
        blockedTabs: list,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      this.setStatus("online");
      return { success: true, blockedTabs: list };
    } catch (err) {
      console.error("Erro ao atualizar abas bloqueadas no Firestore:", err);
      this.setStatus("error", err.message);
      return { success: false, error: err.message };
    }
  }
}

// Instância global
const firebaseSyncService = new FirebaseSyncService();
if (typeof window !== "undefined") {
  window.firebaseSyncService = firebaseSyncService;
}
