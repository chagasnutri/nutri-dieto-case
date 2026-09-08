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

var firebaseConfig = {
  apiKey: "AIzaSyC-XzknUM5OahuO_frNkMG9uFdvZRRB0pk",
  authDomain: "simulador-dieto-e114c.firebaseapp.com",
  projectId: "simulador-dieto-e114c",
  storageBucket: "simulador-dieto-e114c.firebasestorage.app",
  messagingSenderId: "380596633724",
  appId: "1:380596633724:web:dc9948bbcb9b8f379989f9"
};

var FIREBASE_CONFIG = firebaseConfig;

// Permite carregar chaves salvas dinamicamente via painel do professor (localStorage)
(function initFirebaseConfig() {
  if (typeof window !== "undefined") {
    try {
      const storedConfig = localStorage.getItem("dietocase_custom_firebase_config");
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig);
        if (parsed && parsed.apiKey && parsed.projectId) {
          Object.assign(firebaseConfig, parsed);
          Object.assign(FIREBASE_CONFIG, parsed);
        }
      }
    } catch (e) {
      console.warn("Erro ao ler configuração personalizada do Firebase:", e);
    }
    window.firebaseConfig = firebaseConfig;
    window.FIREBASE_CONFIG = FIREBASE_CONFIG;
  }
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = { firebaseConfig, FIREBASE_CONFIG };
}
