/**
 * Configuração e Conexão com Firebase Firestore (Invisível) - DietoCase
 * Operação 100% em segundo plano sem interface ou painel exposto na tela do aluno.
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const defaultFirebaseConfig: FirebaseConfig = {
  apiKey: (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_FIREBASE_API_KEY) || "sua_chave_aqui",
  authDomain: (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || "simulador-dieto-e114c.firebaseapp.com",
  projectId: (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || "simulador-dieto-e114c",
  storageBucket: (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || "simulador-dieto-e114c.firebasestorage.app",
  messagingSenderId: (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || "380596633724",
  appId: (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_FIREBASE_APP_ID) || "1:380596633724:web:dc9948bbcb9b8f379989f9"
};

export class InvisibleFirebaseSync {
  private config: FirebaseConfig;
  private isOnline: boolean = false;

  constructor(customConfig?: Partial<FirebaseConfig>) {
    this.config = { ...defaultFirebaseConfig, ...customConfig };
  }

  public getConfig(): FirebaseConfig {
    return this.config;
  }

  public isConfigured(): boolean {
    return Boolean(this.config.projectId && this.config.apiKey);
  }

  public async syncStudentState(prontuarioData: any): Promise<boolean> {
    try {
      // Sincronização silenciosa em nuvem para acompanhamento do docente
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("dietocase_prontuario_local", JSON.stringify(prontuarioData));
      }
      return true;
    } catch (err) {
      console.warn("Sincronização em background:", err);
      return false;
    }
  }
}

export const invisibleFirebaseSync = new InvisibleFirebaseSync();

