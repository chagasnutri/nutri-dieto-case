// Motor de Sincronização Automática em Tempo Real - DietoCase
// Sincroniza automaticamente qualquer adição de disciplina, novo caso clínico ou alteração
// realizada pelo professor/administrador com o servidor central e os dispositivos dos alunos.

class DietoSyncEngine {
  constructor() {
    this.apiEndpoint = "/api/data";
    this.lastSyncTimestamp = localStorage.getItem("dietocase_last_sync_ts") || null;
    this.isSyncing = false;
    this.pollInterval = 15000; // Verificação periódica a cada 15 segundos
    this.pollTimerId = null;
    this.status = "connecting"; // connecting, online, syncing, offline
    this.statusListeners = [];
    this.dataListeners = [];
    
    // Canal de difusão entre abas do mesmo dispositivo
    try {
      if (typeof BroadcastChannel !== "undefined") {
        this.broadcastChannel = new BroadcastChannel("dietocase_sync_channel");
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === "DATA_UPDATED") {
            console.log("⚡ Atualização recebida via BroadcastChannel");
            this.notifyDataListenersFromStorage();
            this.pullFromServer(false);
          }
        };
      }
    } catch (e) {
      console.warn("BroadcastChannel não suportado neste navegador:", e);
    }
  }

  notifyDataListenersFromStorage() {
    try {
      const rawCases = localStorage.getItem(STORAGE_KEY_CASES);
      const rawDisc = localStorage.getItem(STORAGE_KEY_DISCIPLINAS);
      if (rawCases && rawDisc) {
        const cases = JSON.parse(rawCases);
        const disciplinas = JSON.parse(rawDisc);
        this.dataListeners.forEach(cb => {
          try {
            cb({ disciplinas, cases, isInitial: false });
          } catch (e) {}
        });
      }
    } catch (e) {}
  }

  // Inicializa o motor, ouve eventos de foco/visibilidade e inicia auto-sync
  async init() {
    // Sincronização imediata ao abrir o aplicativo
    await this.pullFromServer(true);

    // Sincroniza quando o aluno ou professor volta para a aba do navegador
    window.addEventListener("focus", () => {
      this.pullFromServer(false);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.pullFromServer(false);
      }
    });

    // Inicia verificação contínua em segundo plano
    this.startAutoSync();
  }

  // Registra ouvinte para alterações de dados
  onDataUpdated(callback) {
    if (typeof callback === "function") {
      this.dataListeners.push(callback);
    }
  }

  // Registra ouvinte para alterações de status de conexão
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

  // Busca dados do servidor central e atualiza alunos se houver novidades
  async pullFromServer(isInitial = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const response = await fetch(this.apiEndpoint, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const serverData = await response.json();
      this.setStatus("online");

      const serverTimestamp = serverData.updatedAt || null;
      const hasNewerData = !this.lastSyncTimestamp || (serverTimestamp && serverTimestamp !== this.lastSyncTimestamp);

      if (serverData && Array.isArray(serverData.disciplinas) && Array.isArray(serverData.cases)) {
        if (hasNewerData || isInitial) {
          // Atualiza o cache local (localStorage) com a verdade do servidor
          localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(serverData.cases));
          localStorage.setItem(STORAGE_KEY_DISCIPLINAS, JSON.stringify(serverData.disciplinas));
          
          if (serverTimestamp) {
            this.lastSyncTimestamp = serverTimestamp;
            localStorage.setItem("dietocase_last_sync_ts", serverTimestamp);
          }

          // Notifica a aplicação para re-renderizar vitrines e abas
          this.dataListeners.forEach(cb => {
            try {
              cb({
                disciplinas: serverData.disciplinas,
                cases: serverData.cases,
                isInitial: isInitial,
                updatedAt: serverTimestamp
              });
            } catch (e) {
              console.error("Erro no callback de dados sincronizados:", e);
            }
          });
        }
      }
    } catch (error) {
      // Se não houver backend ativo (ex: aberto direto via file://), opera em modo offline/local
      this.setStatus("offline");
      console.log("Servidor central offline ou inacessível no momento. Utilizando cache local:", error.message);
      this.notifyDataListenersFromStorage();
    } finally {
      this.isSyncing = false;
    }
  }

  // Notifica os ouvintes a partir dos dados persistidos no cache local (localStorage)
  notifyDataListenersFromStorage() {
    try {
      const casesStr = localStorage.getItem(STORAGE_KEY_CASES);
      const discStr = localStorage.getItem(STORAGE_KEY_DISCIPLINAS);
      const cases = casesStr ? JSON.parse(casesStr) : [];
      const disciplinas = discStr ? JSON.parse(discStr) : [];
      const serverTimestamp = localStorage.getItem("dietocase_last_sync_ts") || new Date().toISOString();

      this.dataListeners.forEach(cb => {
        try {
          cb({
            disciplinas: disciplinas,
            cases: cases,
            isInitial: false,
            updatedAt: serverTimestamp
          });
        } catch (e) {
          console.error("Erro no callback de dados locais sincronizados:", e);
        }
      });
    } catch (e) {
      console.error("Erro ao ler dados locais para sincronização:", e);
    }
  }

  // Envia as alterações do professor/administrador diretamente para o servidor central
  async pushToServer(disciplinas, cases, password = "Nutri2@26") {
    this.setStatus("syncing");

    // Atualiza imediatamente o localStorage local por segurança
    if (Array.isArray(disciplinas)) {
      localStorage.setItem(STORAGE_KEY_DISCIPLINAS, JSON.stringify(disciplinas));
    }
    if (Array.isArray(cases)) {
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases));
    }

    try {
      const payload = {
        password: password,
        disciplinas: disciplinas,
        cases: cases
      };

      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Teacher-Password": password
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const resJson = await response.json();
      if (resJson.updatedAt) {
        this.lastSyncTimestamp = resJson.updatedAt;
        localStorage.setItem("dietocase_last_sync_ts", resJson.updatedAt);
      }

      this.setStatus("online");

      // Avisa outras abas do mesmo navegador
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage({
            type: "DATA_UPDATED",
            updatedAt: resJson.updatedAt
          });
        } catch (e) {}
      }

      return { success: true, message: resJson.message || "Sincronizado com sucesso!", serverOnline: true };
    } catch (error) {
      this.setStatus("offline");
      console.warn("Não foi possível enviar dados para o servidor central (modo local mantido):", error.message);
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage({
            type: "DATA_UPDATED",
            updatedAt: new Date().toISOString()
          });
        } catch (e) {}
      }
      return { success: true, message: "Salvo localmente neste aparelho (servidor indisponível no momento)", serverOnline: false };
    }
  }

  startAutoSync() {
    if (this.pollTimerId) clearInterval(this.pollTimerId);
    this.pollTimerId = setInterval(() => {
      this.pullFromServer(false);
    }, this.pollInterval);
  }

  stopAutoSync() {
    if (this.pollTimerId) {
      clearInterval(this.pollTimerId);
      this.pollTimerId = null;
    }
  }
}

// Instância global única
const dietoSyncEngine = new DietoSyncEngine();
if (typeof window !== "undefined") {
  window.dietoSyncEngine = dietoSyncEngine;
}
