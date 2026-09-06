// Motor de Sincronização em Tempo Real via Firebase Firestore - DietoCase
// Sincroniza qualquer adição de disciplina, caso clínico, trava ou bloqueio de abas
// realizado pelo professor diretamente com o Google Cloud Firestore e os dispositivos dos alunos.

class DietoSyncEngine {
  constructor() {
    this.status = "connecting"; // connecting, online_firebase, syncing, error_firebase, unconfigured_firebase, local
    this.statusListeners = [];
    this.dataListeners = [];
    
    // Canal de difusão instantânea entre abas do mesmo dispositivo
    try {
      if (typeof BroadcastChannel !== "undefined") {
        this.broadcastChannel = new BroadcastChannel("dietocase_sync_channel");
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === "DATA_UPDATED") {
            this.notifyDataListenersFromStorage();
          }
        };
      }
    } catch (e) {
      console.warn("BroadcastChannel não suportado neste navegador:", e);
    }
  }

  notifyDataListeners({ disciplinas, cases, isInitial = false, isRemote = false }) {
    this.dataListeners.forEach(cb => {
      try {
        cb({ disciplinas, cases, isInitial, isRemote, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.error("Erro no callback de sincronização:", e);
      }
    });
  }

  // Notifica os ouvintes a partir dos dados locais
  notifyDataListenersFromStorage() {
    try {
      const rawCases = localStorage.getItem(STORAGE_KEY_CASES);
      const rawDisc = localStorage.getItem(STORAGE_KEY_DISCIPLINAS);
      if (rawCases && rawDisc) {
        const cases = JSON.parse(rawCases);
        const disciplinas = JSON.parse(rawDisc);
        this.notifyDataListeners({ disciplinas, cases, isInitial: false, isRemote: false });
      }
    } catch (e) {
      console.error("Erro ao ler dados locais para sincronização:", e);
    }
  }

  // Inicializa o motor conectando diretamente ao Firebase Firestore
  async init(startListener = true) {
    if (typeof firebaseSyncService !== "undefined") {
      firebaseSyncService.onStatusChange((fbStatus, detail) => {
        if (fbStatus === "online") {
          this.setStatus("online_firebase");
        } else if (fbStatus === "syncing") {
          this.setStatus("syncing");
        } else if (fbStatus === "unconfigured") {
          this.setStatus("unconfigured_firebase");
        } else if (fbStatus === "error") {
          this.setStatus("error_firebase");
        }
      });

      firebaseSyncService.onDataChange(({ disciplinas, cases, isRemote }) => {
        this.notifyDataListeners({ disciplinas, cases, isInitial: false, isRemote: true });
      });

      const fbStarted = await firebaseSyncService.init(startListener);
      if (fbStarted) {
        console.log("☁️ DietoSyncEngine conectado ao Firebase Firestore com sucesso!");
        if (startListener && typeof firebaseSyncService.startRealtimeListener === "function") {
          firebaseSyncService.startRealtimeListener();
        }
        return true;
      }
    }

    // Se o Firebase ainda não estiver pronto, opera em modo local resiliente (sem fetch de rotas inexistentes)
    this.setStatus("local");
    this.notifyDataListenersFromStorage();
    return false;
  }

  // Aciona lazy loading dos casos da simulação no Firestore
  ensureSimulationDataLoaded() {
    if (typeof firebaseSyncService !== "undefined" && typeof firebaseSyncService.startRealtimeListener === "function") {
      firebaseSyncService.startRealtimeListener();
    }
  }

  onDataUpdated(callback) {
    if (typeof callback === "function") {
      this.dataListeners.push(callback);
    }
  }

  onStatusChange(callback) {
    if (typeof callback === "function") {
      this.statusListeners.push(callback);
      callback(this.status);
    }
  }

  setStatus(newStatus) {
    this.status = newStatus;
    this.statusListeners.forEach(cb => {
      try { cb(newStatus); } catch (e) {}
    });
  }

  // Busca dados diretamente do Firestore (ou cache local) sem qualquer chamada fetch HTTP
  async pullFromServer(isInitial = false) {
    if (typeof firebaseSyncService !== "undefined" && firebaseSyncService.isConfigured()) {
      const remote = await firebaseSyncService.fetchRemoteData();
      if (remote && Array.isArray(remote.disciplinas) && Array.isArray(remote.cases)) {
        if (remote.disciplinas.length > 0) {
          localStorage.setItem(STORAGE_KEY_DISCIPLINAS, JSON.stringify(remote.disciplinas));
        }
        if (remote.cases.length > 0) {
          localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(remote.cases));
        }
        this.notifyDataListeners({ disciplinas: remote.disciplinas, cases: remote.cases, isInitial, isRemote: true });
        return { success: true, serverOnline: true };
      }
    }

    this.notifyDataListenersFromStorage();
    return { success: true, serverOnline: false, localOnly: true };
  }

  // Persiste as alterações do professor diretamente no Firestore e sincroniza com os alunos
  async pushToServer(disciplinas, cases, password = "Nutri2@26") {
    // Validação de segurança da senha docente
    if (password !== "Nutri2@26") {
      return {
        success: false,
        message: "Senha de docente incorreta. Acesso não autorizado.",
        serverOnline: false
      };
    }

    this.setStatus("syncing");

    // Atualiza o cache local imediatamente por segurança
    if (Array.isArray(disciplinas)) {
      localStorage.setItem(STORAGE_KEY_DISCIPLINAS, JSON.stringify(disciplinas));
    }
    if (Array.isArray(cases)) {
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases));
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: "DATA_UPDATED",
          updatedAt: new Date().toISOString()
        });
      } catch (e) {}
    }

    if (typeof firebaseSyncService !== "undefined" && firebaseSyncService.isConfigured()) {
      if (typeof firebaseSyncService.saveEstadoAtual === "function") {
        await firebaseSyncService.saveEstadoAtual(disciplinas, cases);
      }
      this.setStatus("online_firebase");
      return { success: true, message: "Sincronizado na Nuvem Firebase Firestore!", serverOnline: true };
    }

    this.setStatus("local");
    return { success: true, message: "Salvo localmente no navegador.", serverOnline: false };
  }

  startAutoSync() {
    // O Firestore já sincroniza ativamente via onSnapshot em tempo real,
    // não necessitando de polling HTTP contínuo.
  }

  stopAutoSync() {
    // Sem polling HTTP ativo.
  }
}

// Instância global única
const dietoSyncEngine = new DietoSyncEngine();
if (typeof window !== "undefined") {
  window.dietoSyncEngine = dietoSyncEngine;
}
