/**
 * Inicialização do Google Firebase Firestore - DietoCase
 * Projeto: simulador-dieto-e114c
 * Conexão em nuvem para sincronização em tempo real entre dispositivos de Professores e Alunos.
 */

const firebaseConfig = {
  apiKey: AIzaSyC-XzknUM5OahuO_frNkMG9uFdvZRRB0pk,
  authDomain: simulador-dieto-e114c.firebaseapp.com,
  projectId: simulador-dieto-e114c,
  storageBucket: simulador-dieto-e114c.firebasestorage.app,
  messagingSenderId: 380596633724,
  appId: 1:380596633724:web:dc9948bbcb9b8f379989f9
};

// Exportações globais para compatibilidade direta no navegador
if (typeof window !== undefined) {
  window.FIREBASE_CONFIG = firebaseConfig;
  window.firebaseConfig = firebaseConfig;

  // Se o SDK compat do Firebase estiver carregado, conecta o app
  if (typeof firebase !== undefined) {
    try {
      if (!firebase.apps || firebase.apps.length === 0) {
        window.firebaseApp = firebase.initializeApp(firebaseConfig);
      } else {
        window.firebaseApp = firebase.apps[0];
      }
      if (typeof firebase.firestore === function) {
        window.firestoreDb = firebase.firestore();
      }
    } catch (err) {
      console.warn(Aviso ao conectar Firebase em firebase.js:, err);
    }
  }
}

// Exportação para Node.js / Vercel bundler se importado como módulo
if (typeof module !== undefined && module.exports) {
  module.exports = { firebaseConfig };
}
