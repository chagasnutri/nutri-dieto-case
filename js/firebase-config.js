/**
 * Configuração do Google Firebase (Firestore) - DietoCase
 * 
 * Insira abaixo as chaves do seu projeto do Firebase Console:
 * https://console.firebase.google.com/
 * 
 * 1. Acesse seu projeto no Firebase Console.
 * 2. Clique na engrenagem ⚙️ (Configurações do Projeto) > Geral.
 * 3. Role até "Seus aplicativos" e adicione/selecione um aplicativo Web (</>).
 * 4. Copie os valores e cole abaixo entre as aspas:
 */

const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// Permite também carregar chaves salvas dinamicamente via painel do professor (localStorage)
(function initFirebaseConfig() {
  if (typeof window !== "undefined") {
    try {
      const storedConfig = localStorage.getItem("dietocase_custom_firebase_config");
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig);
        if (parsed && parsed.apiKey && parsed.projectId) {
          Object.assign(FIREBASE_CONFIG, parsed);
        }
      }
    } catch (e) {
      console.warn("Erro ao ler configuração personalizada do Firebase:", e);
    }
    window.FIREBASE_CONFIG = FIREBASE_CONFIG;
  }
})();
