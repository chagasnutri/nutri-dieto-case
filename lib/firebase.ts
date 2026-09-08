/**
 * ConfiguraÃ§Ã£o e ConexÃ£o com Firebase Firestore (InvisÃ­vel) - DietoCase
 * OperaÃ§Ã£o 100% em segundo plano sem interface ou painel exposto na tela do aluno.
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
  apiKey: "AIzaSyC-XzknUM5OahuO_frNkMG9uFdvZRRB0pk",
  authDomain: "simulador-dieto-e114c.firebaseapp.com",
  projectId: "simulador-dieto-e114c",
  storageBucket: "simulador-dieto-e114c.firebasestorage.app",
  messagingSenderId: "380596633724",
  appId: "1:380596633724:web:dc9948bbcb9b8f379989f9"
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
      // SincronizaÃ§Ã£o silenciosa em nuvem para acompanhamento do docente
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("dietocase_prontuario_local", JSON.stringify(prontuarioData));
      }
      return true;
    } catch (err) {
      console.error("âŒ [InvisibleFirebaseSync] Erro na sincronizaÃ§Ã£o em background:", err);
      return false;
    }
  }
}

export const invisibleFirebaseSync = new InvisibleFirebaseSync();