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

  // Notifica os ouvintes a partir dos dados em memória
  notifyDataListenersFromStorage() {
    try {
      const cases = typeof getCases === "function" ? getCases() : [];
      const disciplinas = typeof getDisciplinas === "function" ? getDisciplinas() : [];
      if (cases.length > 0 || disciplinas.length > 0) {
        this.notifyDataListeners({ disciplinas, cases, isInitial: false, isRemote: false });
      }
    } catch (e) {
      console.error("Erro ao ler dados para sincronização:", e);
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

  // Busca dados diretamente do Firestore (ou memória) sem qualquer chamada fetch HTTP
  async pullFromServer(isInitial = false) {
    let discToNotify = null;
    let casesToNotify = null;

    if (typeof firebaseSyncService !== "undefined" && firebaseSyncService.isConfigured()) {
      const remote = await firebaseSyncService.fetchRemoteData();
      if (remote && Array.isArray(remote.disciplinas) && Array.isArray(remote.cases)) {
        discToNotify = [...remote.disciplinas];
        casesToNotify = [...remote.cases];
      }
    }

    // Se a instância local enviou dados recentemente (ex: durante testes ou antes de propagação da nuvem)
    if (this.lastPushedData) {
      if (!discToNotify) discToNotify = [...(this.lastPushedData.disciplinas || [])];
      if (!casesToNotify) casesToNotify = [...(this.lastPushedData.cases || [])];

      if (Array.isArray(this.lastPushedData.disciplinas)) {
        this.lastPushedData.disciplinas.forEach(d => {
          if (!discToNotify.some(item => item.id === d.id)) discToNotify.push(d);
        });
      }
      if (Array.isArray(this.lastPushedData.cases)) {
        this.lastPushedData.cases.forEach(c => {
          if (!casesToNotify.some(item => item.id === c.id)) casesToNotify.push(c);
        });
      }
    }

    if (discToNotify && casesToNotify) {
      if (typeof window !== "undefined") {
        if (typeof window.setDisciplinasStore === "function") {
          window.setDisciplinasStore(discToNotify);
        }
        if (typeof window.setCasesStore === "function") {
          window.setCasesStore(casesToNotify);
        }
      }
      this.notifyDataListeners({ disciplinas: discToNotify, cases: casesToNotify, isInitial, isRemote: true });
      return { success: true, serverOnline: true };
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
    this.lastPushedData = {
      disciplinas: Array.isArray(disciplinas) ? [...disciplinas] : [],
      cases: Array.isArray(cases) ? [...cases] : [],
      updatedAt: new Date().toISOString()
    };

    // Atualiza as stores em memória
    if (typeof window !== "undefined") {
      if (Array.isArray(disciplinas) && typeof window.setDisciplinasStore === "function") {
        window.setDisciplinasStore(disciplinas);
      }
      if (Array.isArray(cases) && typeof window.setCasesStore === "function") {
        window.setCasesStore(cases);
      }
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
