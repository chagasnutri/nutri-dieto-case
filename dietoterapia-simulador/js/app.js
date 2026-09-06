// Controlador Principal da Aplicação - Simulador Clínico de Dietoterapia

document.addEventListener("DOMContentLoaded", () => {
  // Instâncias dos controladores
  const chatEngine = new ClinicalChatEngine();
  const prontuarioManager = new StudentProntuarioManager();
  const adminManager = new AdminManager();

  // Estado da aplicação
  let appState = {
    mode: "student", // 'student' ou 'admin'
    workflowMode: "simulation", // 'simulation' ou 'real'
    currentCaseId: null,
    currentCase: null,
    activeInterlocutor: "paciente",
    activeStudentTab: "anamnese",
    activeAdminTab: "identificacao",
    chatHistories: {}, // caseId -> { role -> [messages] }
    currentProntuario: null,
    studentSelectedDisciplinaId: null
  };

  // Exposição global para que os listeners do Firebase Firestore atualizem a UI diretamente
  window.adminManager = adminManager;
  window.appState = appState;
  window.chatEngine = chatEngine;
  window.prontuarioManager = prontuarioManager;

  // Constante de segurança para acesso exclusivo do docente
  const TEACHER_PASSWORD = "Nutri2@26";
  let isTeacherAuthenticated = false;

  // Elementos do DOM principais
  const modeBadge = document.getElementById("modeBadge");
  const switchModeBtn = document.getElementById("switchModeBtn");
  const teacherBtnText = document.getElementById("teacherBtnText");
  const navBrandBtn = document.getElementById("navBrandBtn");
  const navStudentCatalogBtn = document.getElementById("navStudentCatalogBtn");
  const backToCatalogBtn = document.getElementById("backToCatalogBtn");
  
  const studentView = document.getElementById("studentView");
  const studentCatalogSection = document.getElementById("studentCatalogSection");
  const studentSimulationContainer = document.getElementById("studentSimulationContainer");
  const studentCasesGrid = document.getElementById("studentCasesGrid");
  const catalogSearchInput = document.getElementById("catalogSearchInput");
  
  const adminView = document.getElementById("adminView");
  const caseSelectDropdown = document.getElementById("caseSelectDropdown");
  const interlocutorSelect = document.getElementById("interlocutorSelect");
  const interlocutorAvatar = document.getElementById("interlocutorAvatar");
  const interlocutorName = document.getElementById("interlocutorName");
  const interlocutorRole = document.getElementById("interlocutorRole");
  const chatMessagesList = document.getElementById("chatMessagesList");
  const chatInput = document.getElementById("chatInput");
  const sendChatBtn = document.getElementById("sendChatBtn");
  const clearChatBtn = document.getElementById("clearChatBtn");
  const saveDraftBtn = document.getElementById("saveDraftBtn");
  const finalizeAndExportDocxBtn = document.getElementById("finalizeAndExportDocxBtn");
  const apiKeyModal = document.getElementById("apiKeyModal");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const saveApiKeyBtn = document.getElementById("saveApiKeyBtn");
  const openApiKeyBtn = document.getElementById("openApiKeyBtn");
  const closeApiKeyModalBtn = document.getElementById("closeApiKeyModalBtn");
  const submissionConfirmModal = document.getElementById("submissionConfirmModal");
  const closeSubmissionModalBtn = document.getElementById("closeSubmissionModalBtn");

  // Elementos do modal de acesso restrito do professor
  const teacherPasswordModal = document.getElementById("teacherPasswordModal");
  const teacherPasswordForm = document.getElementById("teacherPasswordForm");
  const teacherPasswordInput = document.getElementById("teacherPasswordInput");
  const teacherPasswordError = document.getElementById("teacherPasswordError");
  const closeTeacherPasswordModalBtn = document.getElementById("closeTeacherPasswordModalBtn");
  const adminLockSessionBtn = document.getElementById("adminLockSessionBtn");

  // Filtros ativos do catálogo do aluno
  let currentCatalogFilter = "all"; // 'all', 'available', 'locked'
  let currentCatalogSearch = "";

  // Inicialização
  function initApp() {
    loadCasesIntoDropdown();
    setupEventListeners();
    setupAdminUI();
    renderStudentDisciplinePortal();
    renderAdminDisciplineTabs();
    showStudentCatalog();

    // Inicializa o Motor de Sincronização Automática com o Servidor Central / Firebase
    if (typeof dietoSyncEngine !== "undefined") {
      const badge = document.getElementById("navSyncBadge");
      if (badge) {
        badge.style.cursor = "pointer";
        badge.addEventListener("click", () => {
          openFirebaseConfigModal();
        });
      }

      dietoSyncEngine.onStatusChange((status) => {
        const badge = document.getElementById("navSyncBadge");
        const dot = document.getElementById("navSyncDot");
        const text = document.getElementById("navSyncText");
        if (!badge || !dot || !text) return;
        badge.classList.remove("hidden");

        if (status === "online_firebase") {
          dot.className = "w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5";
          text.textContent = "Nuvem Ativa (Firestore)";
          badge.className = "hidden sm:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs cursor-pointer hover:bg-emerald-100 transition";
          badge.title = "Conectado ao Firebase Firestore em tempo real. Clique para gerenciar.";
        } else if (status === "syncing") {
          dot.className = "w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-1.5";
          text.textContent = "Sincronizando...";
          badge.className = "hidden sm:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs cursor-pointer";
        } else if (status === "unconfigured_firebase") {
          dot.className = "w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5";
          text.textContent = "Nuvem: Chaves Pendentes";
          badge.className = "hidden sm:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs cursor-pointer hover:bg-amber-100 transition";
          badge.title = "Chaves do Firebase pendentes. Operando em modo local. Clique para inserir.";
        } else if (status === "error_firebase") {
          dot.className = "w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5";
          text.textContent = "Nuvem com Erro";
          badge.className = "hidden sm:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs cursor-pointer hover:bg-rose-100 transition";
          badge.title = "Erro ao comunicar com o Firebase. Clique para verificar credenciais.";
        } else if (status === "online") {
          dot.className = "w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5";
          text.textContent = "Servidor Conectado";
          badge.className = "hidden sm:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs cursor-pointer";
        } else {
          dot.className = "w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5";
          text.textContent = "Modo Local";
          badge.className = "hidden sm:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs cursor-pointer hover:bg-slate-100 transition";
          badge.title = "Operando em modo local neste navegador. Clique para conectar à nuvem.";
        }
      });

      dietoSyncEngine.onDataUpdated(({ disciplinas, cases, isInitial, isRemote }) => {
        syncAppStateAndNotify(null, false);
        if (!isTeacherAuthenticated && !isInitial) {
          showToast("🔄 Disciplinas, casos e travas atualizados em tempo real pelo professor!");
        }
      });

      dietoSyncEngine.init();
    }

    // Ouvinte instantâneo de alterações realizadas em outras abas ou janelas
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY_CASES || e.key === STORAGE_KEY_DISCIPLINAS) {
        console.log("⚡ Alteração sincronizada via storage event:", e.key);
        syncAppStateAndNotify();
      }
    });

    // Suporte a parâmetro de visualização na URL (ex: ?view=simulation, ?view=password, ?view=admin, ?view=upload)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("demo") === "visibilidade-aluno") {
      adminManager.refreshCases();
      const c2 = adminManager.getCaseById("caso-drc-idoso");
      if (c2) {
        c2.visivel = false;
        if (typeof saveCases === "function") saveCases(adminManager.cases);
      }
      openStudentDiscipline("dietoterapia");
    } else if (urlParams.get("demo") === "visibilidade") {
      adminManager.refreshCases();
      const c2 = adminManager.getCaseById("caso-drc-idoso");
      if (c2) {
        c2.visivel = false;
        if (typeof saveCases === "function") saveCases(adminManager.cases);
      }
    }

    const requestedView = urlParams.get("view");
    if (requestedView === "real" || urlParams.get("demo") === "real-patient") {
      startRealPatientSession();
      if (appState.currentProntuario) {
        appState.currentProntuario.aluno = {
          nome: "Mariana Aluna",
          matriculaTurma: "NUT-2026-A",
          data: "2026-09-05"
        };
        appState.currentProntuario.dadosPacienteReal = {
          nome: "Carlos Eduardo Silva",
          idade: "52",
          sexo: "Masculino",
          ocupacao: "Contador",
          hipoteseDiagnostica: "Síndrome Metabólica e Esteatose Hepática Não Alcoólica Grau II"
        };
        appState.currentProntuario.anamnese.hipoteseDiagnostica = "Síndrome Metabólica e Esteatose Hepática Não Alcoólica Grau II";
        appState.currentProntuario.interacaoDrogaNutriente = [
          {
            medicamento: "Metformina 850mg (2x/dia)",
            nutrientes: "Vitamina B12 e Ácido Fólico",
            conduta: "Monitorar dosagem sérica de Vitamina B12 anualmente e suplementar se necessário."
          },
          {
            medicamento: "Furosemida 40mg (1x/dia)",
            nutrientes: "Potássio, Magnésio, Cálcio, Zinco e Tiamina",
            conduta: "Estimular fontes dietéticas de potássio e magnésio; acompanhar eletrólitos séricos."
          },
          {
            medicamento: "Atorvastatina 20mg",
            nutrientes: "Coenzima Q10 (CoQ10)",
            conduta: "Atentar para queixas de mialgias; prescrever fontes de antioxidantes na dieta."
          }
        ];
        appState.currentProntuario.observacoesFarmacoterapia = "Paciente relata uso contínuo e pontual das medicações após o almoço e jantar. Monitorar níveis séricos de B12 e transaminases.";
      }
      populateProntuarioForm();
      renderDrugNutrientTable();
    } else if (requestedView === "simulation") {
      showStudentSimulation("caso-dm2-has");
    } else if (requestedView === "password") {
      showTeacherPanel();
    } else if (requestedView === "admin") {
      isTeacherAuthenticated = true;
      showTeacherPanel();
      if (urlParams.get("action") === "edit") {
        const cId = urlParams.get("caseId") || adminManager.cases[0]?.id;
        const c = adminManager.getCaseById(cId) || adminManager.cases[0];
        if (c) {
          adminManager.editingCaseId = c.id;
          populateAdminEditor(c);
          openAdminEditor();
        }
      }
    } else if (requestedView === "upload") {
      isTeacherAuthenticated = true;
      showTeacherPanel();
      showAdminUploadCase();
    } else if (requestedView === "discipline") {
      const discId = urlParams.get("id") || "dietoterapia";
      openStudentDiscipline(discId);
    }

    const requestedTab = urlParams.get("tab");
    if (requestedTab) {
      setTimeout(() => {
        const tabBtn = document.querySelector(`.student-tab-btn[data-tab="${requestedTab}"]`);
        if (tabBtn) tabBtn.click();
        if (urlParams.get("demo") === "necessidades") {
          if (appState.currentProntuario) {
            if (!appState.currentProntuario.antropometria) appState.currentProntuario.antropometria = {};
            appState.currentProntuario.antropometria.pesoAtual = "74";
            appState.currentProntuario.calculoNecessidades = {
              formulasSelecionadas: ["bolso", "mifflin", "eerIom"],
              bolso: { minKcalKg: "25", maxKcalKg: "30", resultadoKcal: "1850" },
              harrisBenedict: { resultadoKcal: "" },
              mifflin: { resultadoKcal: "1820" },
              eerIom: { resultadoKcal: "1910" },
              faoOms: { resultadoKcal: "" },
              vetPlanejadoKcal: "1850",
              taxaMetabolicaCalculada: "25.0 kcal/kg",
              justificativaEscolha: "Adoção de meta normocalórica com 25 kcal/kg de peso atual (1850 kcal/dia), em harmonia com as equações de Mifflin-St Jeor e DRI/EER."
            };
          }
          const pesoInput = document.getElementById("prontPesoAtual");
          if (pesoInput) pesoInput.value = "74";
          const vetPlanInput = document.getElementById("prontCalcVetPlanejado");
          if (vetPlanInput) vetPlanInput.value = "1850";
          populateProntuarioForm();
          updateCalculoNecessidadesDisplay();
          updatePrescriptionCalculations();
        }
        if (urlParams.get("demo") === "bioquimica") {
          if (appState.currentProntuario) {
            if (!appState.currentProntuario.bioquimica) appState.currentProntuario.bioquimica = {};
            appState.currentProntuario.bioquimica.interpretacoes = {
              "Glicemia de Jejum": "Hiperglicemia acentuada (> 126 mg/dL), indicando descontrole glicêmico grave e resistência periférica à insulina.",
              "Hemoglobina Glicada (HbA1c)": "Controle glicêmico crônico inadequado (> 7.0%), com elevado risco micro e macrovascular.",
              "Colesterol Total": "Hipercolesterolemia moderada associada ao descontrole metabólico e perfil lipídico aterogênico.",
              "HDL-Colesterol": "HDL reduzido (< 40 mg/dL), configurando fator de risco cardiovascular independente.",
              "Triglicerídeos": "Hipertrigliceridemia moderada (> 150 mg/dL), fortemente ligada à dieta hiperglicídica de alto índice glicêmico."
            };
            appState.currentProntuario.bioquimica.interpretacaoNutricional = "Quadro de descompensação metabólica com síndrome de resistência insulínica e dislipidemia mista aterogênica. A intervenção dietoterápica prioritária deve focar no controle de carboidratos refinados, aumento de fibras solúveis e substituição de gorduras saturadas por mono e poli-insaturadas.";
          }
          populateProntuarioForm();
        }
        if (urlParams.get("demo") === "prescricao") {
          if (appState.currentProntuario) {
            if (!appState.currentProntuario.antropometria) appState.currentProntuario.antropometria = {};
            appState.currentProntuario.antropometria.pesoAtual = "70";
          }
          const pesoInput = document.getElementById("prontPesoAtual");
          if (pesoInput) pesoInput.value = "70";
          const vetInput = document.getElementById("prontVetKcal");
          if (vetInput) {
            vetInput.value = "1800";
            document.getElementById("prontChoMinPct").value = "50";
            document.getElementById("prontChoMaxPct").value = "60";
            document.getElementById("prontPtnMinPct").value = "15";
            document.getElementById("prontPtnMaxPct").value = "20";
            document.getElementById("prontLipMinPct").value = "25";
            document.getElementById("prontLipMaxPct").value = "30";
            document.getElementById("prontPtnMinGKg").value = "1.2";
            document.getElementById("prontPtnMaxGKg").value = "1.5";
            updatePrescriptionCalculations();
          }
        }
        if (urlParams.get("demo") === "consumo") {
          if (appState.currentProntuario) {
            if (!appState.currentProntuario.antropometria) appState.currentProntuario.antropometria = {};
            appState.currentProntuario.antropometria.pesoAtual = "70";
            appState.currentProntuario.prescricaoDietoterapica.vetKcal = "1800";
            appState.currentProntuario.prescricaoDietoterapica.distribuicaoMacros = {
              cho: { minPct: 50, maxPct: 60, minKcal: 900, maxKcal: 1080, minG: 225, maxG: 270 },
              ptn: { minPct: 15, maxPct: 20, minKcal: 270, maxKcal: 360, minG: 67.5, maxG: 90 },
              lip: { minPct: 25, maxPct: 30, minKcal: 450, maxKcal: 540, minG: 50, maxG: 60 }
            };
            if (!appState.currentProntuario.consumoAlimentar) appState.currentProntuario.consumoAlimentar = {};
            appState.currentProntuario.consumoAlimentar.refeicoesRecordatorio = [
              {
                id: "rec-demo-1",
                refeicao: "Café da Manhã (Recordatório)",
                horario: "07:30",
                itens: [
                  {
                    id: "rec-item-1",
                    tacoId: "taco-13",
                    alimentoNome: "Pão, de trigo, francês",
                    medidaCaseira: "1 unidade média bem quentinha",
                    gramatura: 50,
                    kcal: 150.0,
                    cho: 29.3,
                    ptn: 4.0,
                    lip: 1.6,
                    fibra: 1.2,
                    calcio: 19.5,
                    ferro: 0.5,
                    sodio: 324.0,
                    potassio: 58.5
                  },
                  {
                    id: "rec-item-2",
                    tacoId: "taco-19",
                    alimentoNome: "Queijo, minas frescal",
                    medidaCaseira: "1 fatia média generosa",
                    gramatura: 35,
                    kcal: 92.4,
                    cho: 1.1,
                    ptn: 6.1,
                    lip: 7.1,
                    fibra: 0.0,
                    calcio: 178.5,
                    ferro: 0.1,
                    sodio: 108.5,
                    potassio: 31.5
                  },
                  {
                    id: "rec-item-3",
                    tacoId: "taco-17",
                    alimentoNome: "Leite, de vaca, integral",
                    medidaCaseira: "1 xícara com café",
                    gramatura: 150,
                    kcal: 91.5,
                    cho: 6.8,
                    ptn: 4.8,
                    lip: 5.3,
                    fibra: 0.0,
                    calcio: 184.5,
                    ferro: 0.2,
                    sodio: 87.0,
                    potassio: 202.5
                  }
                ]
              },
              {
                id: "rec-demo-2",
                refeicao: "Almoço (Recordatório)",
                horario: "12:30",
                itens: [
                  {
                    id: "rec-item-4",
                    tacoId: "taco-01",
                    alimentoNome: "Arroz, tipo 1, cozido",
                    medidaCaseira: "4 colheres de sopa cheias",
                    gramatura: 150,
                    kcal: 192.0,
                    cho: 42.2,
                    ptn: 3.8,
                    lip: 0.3,
                    fibra: 2.4,
                    calcio: 6.0,
                    ferro: 0.2,
                    sodio: 1.5,
                    potassio: 22.5
                  },
                  {
                    id: "rec-item-5",
                    tacoId: "taco-03",
                    alimentoNome: "Feijão, carioca, cozido",
                    medidaCaseira: "1 concha média",
                    gramatura: 100,
                    kcal: 76.0,
                    cho: 13.6,
                    ptn: 4.8,
                    lip: 0.5,
                    fibra: 8.5,
                    calcio: 27.0,
                    ferro: 1.3,
                    sodio: 2.0,
                    potassio: 255.0
                  },
                  {
                    id: "rec-item-6",
                    tacoId: "taco-21",
                    alimentoNome: "Peito de frango, sem pele, grelhado",
                    medidaCaseira: "1 filé médio",
                    gramatura: 120,
                    kcal: 190.8,
                    cho: 0.0,
                    ptn: 38.4,
                    lip: 3.8,
                    fibra: 0.0,
                    calcio: 10.8,
                    ferro: 0.6,
                    sodio: 67.2,
                    potassio: 388.8
                  }
                ]
              }
            ];
            renderRecordatorioMeals();
            updateRecordatorioTotalsDisplay();
          }
        }
        if (urlParams.get("demo") === "cardapio") {
          if (appState.currentProntuario) {
            appState.currentProntuario.prescricaoDietoterapica.vetKcal = "1800";
            appState.currentProntuario.prescricaoDietoterapica.distribuicaoMacros = {
              cho: { minPct: 50, maxPct: 60, minKcal: 900, maxKcal: 1080, minG: 225, maxG: 270 },
              ptn: { minPct: 15, maxPct: 20, minKcal: 270, maxKcal: 360, minG: 67.5, maxG: 90 },
              lip: { minPct: 25, maxPct: 30, minKcal: 450, maxKcal: 540, minG: 50, maxG: 60 }
            };
            const meal = appState.currentProntuario?.planejamentoAlimentar?.[0];
            if (meal) {
              meal.tipoPreparacao = "Sanduíche Natural Integral com Queijo Branco e Bebida Láctea";
              meal.itens = [
                {
                  id: "demo-1",
                  tacoId: "taco-13",
                  alimentoNome: "Pão, de trigo, francês",
                  medidaCaseira: "1 unidade média bem quentinha",
                  gramatura: 50,
                  kcal: 150.0,
                  cho: 29.3,
                  ptn: 4.0,
                  lip: 1.6,
                  fibra: 1.2,
                  calcio: 19.5,
                  ferro: 0.5,
                  sodio: 324.0,
                  potassio: 58.5
                },
                {
                  id: "demo-2",
                  tacoId: "taco-19",
                  alimentoNome: "Queijo, minas frescal",
                  medidaCaseira: "1 fatia média",
                  gramatura: 30,
                  kcal: 79.2,
                  cho: 1.0,
                  ptn: 5.2,
                  lip: 6.1,
                  fibra: 0.0,
                  calcio: 153.0,
                  ferro: 0.1,
                  sodio: 93.0,
                  potassio: 27.0
                },
                {
                  id: "demo-3",
                  tacoId: "taco-17",
                  alimentoNome: "Leite de vaca, pasteurizado, integral",
                  medidaCaseira: "1 caneca com café (150mL)",
                  gramatura: 150,
                  kcal: 91.5,
                  cho: 6.8,
                  ptn: 4.8,
                  lip: 5.3,
                  fibra: 0.0,
                  calcio: 184.5,
                  ferro: 0.2,
                  sodio: 87.0,
                  potassio: 202.5
                }
              ];
              renderCardapioTable();
              updateCardapioTotalsDisplay();
            }
          }
        }
        if (urlParams.get("demo") === "pes-objetivos") {
          if (appState.currentProntuario) {
            if (!appState.currentProntuario.diagnosticoPES) appState.currentProntuario.diagnosticoPES = {};
            appState.currentProntuario.diagnosticoPES.problema = "Ingestão excessiva de carboidratos simples e gorduras saturadas";
            appState.currentProntuario.diagnosticoPES.etiologia = "Consumo frequente de lanches e alimentos ultraprocessados associado à rotina de trabalho";
            appState.currentProntuario.diagnosticoPES.sinaisSintomas = "Glicemia de jejum de 188 mg/dL, HbA1c de 8.9% e ganho de peso involuntário";
            appState.currentProntuario.diagnosticoPES.textoCompletoPES = "Ingestão excessiva de carboidratos simples e gorduras saturadas relacionado ao consumo frequente de ultraprocessados na rotina de trabalho evidenciado por HbA1c 8.9% e ganho de 8 kg.";
            appState.currentProntuario.diagnosticoPES.objetivosDietoterapicos = "• Promover otimização do controle glicêmico com ênfase em carboidratos complexos e fibras (> 25g/dia)\n• Reduzir sobrecarga cardiovascular e aterogênica com restrição de gorduras saturadas (< 7% do VET)\n• Promover perda ponderal gradual e sustentável de 5% a 10% em 6 meses\n• Estimular rotina regular de hidratação e horários consistentes de refeições";
          }
          populateProntuarioForm();
        }
        if (urlParams.get("demo") === "tne-gravitacional") {
          if (appState.currentProntuario) {
            appState.currentProntuario.tne = {
              viaAlimentacao: "tne",
              tipoDieta: "Polimérica normocalórica e hiperproteica com fibras",
              densidadeCalorica: "1.2 kcal/mL",
              fracionamento: "5 etapas ao dia (a cada 3 horas)",
              viaAdministracao: "gravitacional",
              gravitacional: {
                volumePorRefeicao: "300 mL por etapa",
                quantidadeFrascosEtapas: "5 frascos de 300 mL (Total: 1500 mL/dia)",
                metaVazaoGotasMin: "42 gotas/minuto (infusão em 60 a 70 min)"
              },
              bombaInfusao: {
                tempoInfusaoHoras: "20 horas",
                metaVazaoMlHora: "75 mL/h"
              },
              moduloSuplementacaoProteica: "Prescrito módulo de Whey Protein isolado (2 tomadas de 15g ao dia) diluído em 100mL de água, administrado às 10h e 16h para atingir meta de 1.4 g/kg/dia."
            };
          }
          populateProntuarioForm();
        }
        if (urlParams.get("demo") === "tne-bomba") {
          if (appState.currentProntuario) {
            appState.currentProntuario.tne = {
              viaAlimentacao: "tne",
              tipoDieta: "Polimérica hipercalórica e hiperproteica sem lactose",
              densidadeCalorica: "1.5 kcal/mL",
              fracionamento: "Contínuo em 20 horas/dia (pausa de 4h para cuidados)",
              viaAdministracao: "bomba",
              gravitacional: {
                volumePorRefeicao: "",
                quantidadeFrascosEtapas: "",
                metaVazaoGotasMin: ""
              },
              bombaInfusao: {
                tempoInfusaoHoras: "20 horas/dia",
                metaVazaoMlHora: "65 mL/hora (Volume Total: 1300 mL/dia)"
              },
              moduloSuplementacaoProteica: "Adição de módulo proteico de caseinato de cálcio (1 medida de 20g) para atingir meta proteica de 1.5 g/kg/dia."
            };
          }
          populateProntuarioForm();
        }
        if (urlParams.get("demo") === "cardapio-oral-consistencia") {
          if (appState.currentProntuario) {
            appState.currentProntuario.consistenciaDietaOral = "Dieta Branda";
            if (appState.currentProntuario.tne) appState.currentProntuario.tne.viaAlimentacao = "oral";
          }
          populateProntuarioForm();
          setNutritionRouteSelection("oral");
        }
        if (urlParams.get("demo") === "tne-quantitativo") {
          if (appState.currentProntuario) {
            appState.currentProntuario.tne = {
              viaAlimentacao: "tne",
              nomeComercial: "Fresubin HP Energy (Fresenius)",
              tipoDieta: "Polimérica normocalórica e hiperproteica com fibras",
              densidadeCalorica: "1.5 kcal/mL",
              fracionamento: "Contínuo em 20 horas/dia",
              viaAdministracao: "bomba",
              gravitacional: { volumePorRefeicao: "", quantidadeFrascosEtapas: "", metaVazaoGotasMin: "" },
              bombaInfusao: { tempoInfusaoHoras: "20 horas/dia", metaVazaoMlHora: "65 mL/h (Volume: 1300 mL)" },
              tabelaNutricionalManual: {
                vet: "1950",
                cho: "234",
                ptn: "97.5",
                lip: "65",
                fibra: "24",
                sodio: "1250",
                potassio: "1850",
                calcio: "1000",
                fosforo: "800"
              },
              moduloSuplementacaoProteica: "Módulo proteico isolado (1 dose de 15g de Whey) para atingir meta de 1.4 g/kg/dia."
            };
          }
          populateProntuarioForm();
          setNutritionRouteSelection("tne");
          updateCardapioTotalsDisplay();
        }
        if (urlParams.get("demo") === "real-patient" || urlParams.get("view") === "real") {
          startRealPatientSession();
          if (appState.currentProntuario) {
            appState.currentProntuario.aluno = {
              nome: "Mariana Aluna",
              matriculaTurma: "NUT-2026-A",
              data: "2026-09-05"
            };
            appState.currentProntuario.dadosPacienteReal = {
              nome: "Carlos Eduardo Silva",
              idade: "52",
              sexo: "Masculino",
              ocupacao: "Contador",
              hipoteseDiagnostica: "Síndrome Metabólica e Esteatose Hepática Não Alcoólica Grau II"
            };
            appState.currentProntuario.anamnese.hipoteseDiagnostica = "Síndrome Metabólica e Esteatose Hepática Não Alcoólica Grau II";
            appState.currentProntuario.interacaoDrogaNutriente = [
              {
                medicamento: "Metformina 850mg (2x/dia)",
                nutrientes: "Vitamina B12 e Ácido Fólico",
                conduta: "Monitorar dosagem sérica de Vitamina B12 anualmente e suplementar se necessário."
              },
              {
                medicamento: "Furosemida 40mg (1x/dia)",
                nutrientes: "Potássio, Magnésio, Cálcio, Zinco e Tiamina",
                conduta: "Estimular fontes dietéticas de potássio e magnésio; acompanhar eletrólitos séricos."
              },
              {
                medicamento: "Atorvastatina 20mg",
                nutrientes: "Coenzima Q10 (CoQ10)",
                conduta: "Atentar para queixas de mialgias; prescrever fontes de antioxidantes na dieta."
              }
            ];
            appState.currentProntuario.observacoesFarmacoterapia = "Paciente relata uso contínuo e pontual das medicações após o almoço e jantar. Monitorar níveis séricos de B12 e transaminases.";
          }
          populateProntuarioForm();
          renderDrugNutrientTable();
          if (requestedTab) {
            const tBtn = document.querySelector(`.student-tab-btn[data-tab="${requestedTab}"]`);
            if (tBtn) tBtn.click();
          }
        }
        if (urlParams.get("scroll") === "totals") {
          setTimeout(() => {
            const panel = document.getElementById("cardapioTotalsPanel");
            if (panel) panel.scrollIntoView({ behavior: "instant", block: "center" });
          }, 300);
        }
        if (urlParams.get("scroll") === "rectotals") {
          setTimeout(() => {
            const panel = document.getElementById("recordatorioTotalsPanel");
            if (panel) panel.scrollIntoView({ behavior: "instant", block: "center" });
          }, 300);
        }
      }, 150);
    }

    const requestedAdminTab = urlParams.get("admintab");
    if (requestedAdminTab) {
      setTimeout(() => {
        const admTabBtn = document.querySelector(`.admin-editor-tab-btn[data-admintab="${requestedAdminTab}"]`);
        if (admTabBtn) admTabBtn.click();
      }, 150);
    }

    const openModalParam = urlParams.get("openModal");
    if (openModalParam === "firebase") {
      setTimeout(() => openFirebaseConfigModal(), 200);
    } else if (openModalParam === "blocked") {
      setTimeout(() => openStudentBlockedTabModal("bioquimica"), 200);
    }

    if (urlParams.get("demo") === "student_blocked") {
      setTimeout(() => {
        if (appState.currentCase) {
          appState.currentCase.blockedTabs = ["bioquimica", "pes", "prescricao"];
          applyStudentTabBlockingState(appState.currentCase);
        }
      }, 200);
    }

    if (urlParams.get("modal") === "newdisc") {
      document.getElementById("adminNewDisciplineBtn")?.click();
    } else if (urlParams.get("modal") === "install") {
      document.getElementById("navInstallAppBtn")?.click();
    } else if (urlParams.get("modal") === "deletedisc") {
      setTimeout(() => document.getElementById("adminDeleteDisciplineBtn")?.click(), 200);
    }
  }

  // Exibe o Painel do Aluno (Portal de Disciplinas inicialmente; casos só aparecem após o clique na disciplina)
  function showStudentCatalog(disciplinaId = null) {
    isTeacherAuthenticated = false;
    appState.mode = "student-catalog";
    studentView.classList.remove("hidden");
    adminView.classList.add("hidden");
    
    if (studentCatalogSection) studentCatalogSection.classList.remove("hidden");
    if (studentSimulationContainer) studentSimulationContainer.classList.add("hidden");

    modeBadge.textContent = "PAINEL DO ALUNO";
    modeBadge.className = "badge-clinical bg-emerald-100 text-emerald-800 border border-emerald-300";
    
    if (navStudentCatalogBtn) {
      navStudentCatalogBtn.className = "bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center space-x-1.5";
    }
    if (switchModeBtn) {
      switchModeBtn.className = "bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition flex items-center space-x-1.5";
    }
    if (teacherBtnText) teacherBtnText.textContent = "Painel do Professor";

    if (disciplinaId) {
      openStudentDiscipline(disciplinaId);
    } else if (appState.studentSelectedDisciplinaId) {
      openStudentDiscipline(appState.studentSelectedDisciplinaId);
    } else {
      backToStudentDisciplinePortal();
    }
  }

  // Exibe a Tela de Simulação e Prontuário do Caso Selecionado
  function showStudentSimulation(caseId) {
    const found = adminManager.getCaseById(caseId);
    if (!found) return;

    if (found.visivel === false && !isTeacherAuthenticated) {
      showToast("Caso clínico oculto. Aguardando liberação do professor.", "warning");
      return;
    }

    if (found.isLocked) {
      showToast("🔒 Este caso está bloqueado pelo professor. Aguarde a liberação para realizar o atendimento.", "warning");
      return;
    }

    appState.mode = "student-simulation";
    selectCase(caseId);

    studentView.classList.remove("hidden");
    adminView.classList.add("hidden");
    
    if (studentCatalogSection) studentCatalogSection.classList.add("hidden");
    if (studentSimulationContainer) studentSimulationContainer.classList.remove("hidden");

    modeBadge.textContent = "SIMULAÇÃO DO CASO";
    modeBadge.className = "badge-clinical bg-emerald-100 text-emerald-800 border border-emerald-300";

    if (navStudentCatalogBtn) {
      navStudentCatalogBtn.className = "bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition flex items-center space-x-1.5";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Alterna o modo de trabalho do aluno (Simulação vs Atendimento Real)
  function setStudentWorkflowMode(mode) {
    appState.workflowMode = mode;
    const badge = document.getElementById("activeWorkflowModeBadge");
    if (badge) {
      if (mode === "real") {
        badge.textContent = "Modo Atual: 🩺 Atendimento Real";
        badge.className = "badge-clinical bg-sky-50 text-sky-700 border border-sky-300 text-[11px]";
      } else {
        badge.textContent = "Modo Atual: 🎓 Simulação";
        badge.className = "badge-clinical bg-emerald-50 text-emerald-700 border border-emerald-300 text-[11px]";
      }
    }
  }

  // Inicia uma nova sessão de Atendimento Presencial Real (Prontuário em Branco)
  function startRealPatientSession() {
    setStudentWorkflowMode("real");
    appState.mode = "student-real";
    appState.currentCaseId = "atendimento-real";
    
    // Tenta carregar rascunho de atendimento real do localStorage
    let p = null;
    try {
      const saved = localStorage.getItem("dietocase_atendimento_real_current");
      if (saved) {
        p = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Aviso ao carregar rascunho de atendimento real:", e);
    }
    
    if (!p) {
      p = prontuarioManager.getEmptyProntuario("atendimento-real");
      p.isRealPatient = true;
    } else {
      p.isRealPatient = true;
    }

    appState.currentProntuario = p;

    // Constrói objeto de caso clínico virtual para o atendimento real
    appState.currentCase = {
      id: "atendimento-real",
      title: "Atendimento Presencial Real",
      category: "Consulta Ambulatorial / Hospitalar",
      description: "Prontuário de atendimento presencial clínico-nutricional registrado pelo estudante.",
      isRealCase: true,
      habilitarQuestoesAvaliativas: false,
      blockedTabs: [],
      patient: {
        name: p.dadosPacienteReal?.nome || "Paciente Real",
        age: p.dadosPacienteReal?.idade || "--",
        gender: p.dadosPacienteReal?.sexo || "Feminino",
        avatar: "🩺"
      },
      hipoteseDiagnostica: p.dadosPacienteReal?.hipoteseDiagnostica || p.anamnese?.hipoteseDiagnostica || "",
      bioquimica: Array.isArray(p.bioquimica?.listaCustom) ? p.bioquimica.listaCustom : []
    };

    // Ajusta layout visual para Modo Atendimento Real
    studentView.classList.remove("hidden");
    adminView.classList.add("hidden");
    if (studentCatalogSection) studentCatalogSection.classList.add("hidden");
    if (studentSimulationContainer) studentSimulationContainer.classList.remove("hidden");

    // Oculta a coluna do chat e expande o prontuário para 12 colunas
    const chatColumn = document.querySelector("#studentSimulationContent > section:first-child");
    const prontColumn = document.querySelector("#studentSimulationContent > section:last-child");
    if (chatColumn) {
      chatColumn.classList.add("hidden");
      chatColumn.style.display = "none";
    }
    if (prontColumn) {
      prontColumn.classList.remove("lg:col-span-7");
      prontColumn.classList.add("lg:col-span-12");
      prontColumn.style.gridColumn = "span 12 / span 12";
    }

    // Exibe o card de identificação do paciente real
    const realHeaderCard = document.getElementById("realPatientHeaderCard");
    if (realHeaderCard) {
      realHeaderCard.classList.remove("hidden");
      realHeaderCard.style.display = "block";
    }

    // Ajusta controles no cabeçalho
    const simWrapper = document.getElementById("simCaseSelectWrapper");
    const realWrapper = document.getElementById("realPatientActionsWrapper");
    if (simWrapper) {
      simWrapper.classList.add("hidden");
      simWrapper.style.display = "none";
    }
    if (realWrapper) {
      realWrapper.classList.remove("hidden");
      realWrapper.style.display = "flex";
    }

    // Oculta aba de questões avaliativas (não se aplica para consulta real)
    const questoesTabBtn = document.querySelector('.student-tab-btn[data-tab="questoes"]');
    if (questoesTabBtn) {
      questoesTabBtn.classList.add("hidden");
      questoesTabBtn.style.display = "none";
    }

    // Atualiza badges do cabeçalho
    document.getElementById("casePatientNameHeader").textContent = p.dadosPacienteReal?.nome || "Novo Atendimento Presencial";
    document.getElementById("caseCategoryHeader").textContent = "Atendimento Real";
    document.getElementById("caseCategoryHeader").className = "badge-clinical bg-sky-100 text-sky-800 border border-sky-300";
    document.getElementById("caseDescHeader").textContent = "Preencha os dados da consulta, avaliação antropométrica, interações droga-nutriente, exames e conduta.";
    
    const hipBadge = document.getElementById("caseHipoteseDiagnosticaHeader");
    if (hipBadge) {
      const hip = p.dadosPacienteReal?.hipoteseDiagnostica || p.anamnese?.hipoteseDiagnostica || "";
      hipBadge.textContent = hip ? `🩺 ${hip}` : "🩺 Definir Diagnóstico Médico";
      hipBadge.title = hip;
    }

    modeBadge.textContent = "ATENDIMENTO REAL";
    modeBadge.className = "badge-clinical bg-sky-100 text-sky-800 border border-sky-300";

    // Garante que todas as etapas clínicas fiquem liberadas
    applyStudentTabBlockingState(appState.currentCase);

    // Preenche o formulário do prontuário
    populateProntuarioForm();

    // Renderiza a tabela de exames com a lista customizada
    renderStudentBioTable(appState.currentCase.bioquimica, p.bioquimica?.interpretacoes);

    // Renderiza a tabela de interações droga-nutriente
    renderDrugNutrientTable();

    // Seleciona a aba Anamnese inicialmente
    const anamneseBtn = document.querySelector('.student-tab-btn[data-tab="anamnese"]');
    if (anamneseBtn) anamneseBtn.click();

    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("🩺 Modo Atendimento Real iniciado! Preencha a identificação e o diagnóstico médico.", "info");
  }

  // Salva atendimento presencial real
  async function saveRealPatientSession(showFeedback = true) {
    const p = readProntuarioFromForm();
    if (!p) return;
    p.isRealPatient = true;
    p.updatedAt = new Date().toISOString();

    // 1. Salva no localStorage
    localStorage.setItem("dietocase_atendimento_real_current", JSON.stringify(p));

    // 2. Salva no Firestore se configurado
    if (typeof firebaseSyncService !== "undefined" && typeof firebaseSyncService.saveAtendimentoReal === "function") {
      await firebaseSyncService.saveAtendimentoReal(p);
    }

    if (showFeedback) {
      showToast("💾 Prontuário de Atendimento Real salvo com sucesso!", "success");
    }
  }

  // Exporta documento Word (.docx) do Atendimento Real
  function exportRealPatientDocx() {
    const p = readProntuarioFromForm();
    if (!p) return;
    
    if (!p.aluno.nome) {
      showToast("Por favor, preencha o Nome do Estudante antes de gerar o relatório.", "warning");
      const alunoInput = document.getElementById("alunoNome");
      if (alunoInput) alunoInput.focus();
      return;
    }

    const hip = p.dadosPacienteReal?.hipoteseDiagnostica || p.anamnese?.hipoteseDiagnostica;
    if (!hip) {
      showToast("A Hipótese Diagnóstica / Diagnóstico Médico é obrigatória para gerar o relatório.", "warning");
      const hipInput = document.getElementById("realPatHipoteseDiagnostica") || document.getElementById("prontHipoteseDiagnostica");
      if (hipInput) hipInput.focus();
      return;
    }

    const realCase = {
      id: p.id || ("atendimento-real-" + Date.now()),
      title: "Atendimento Presencial Real",
      category: "Consulta Ambulatorial / Hospitalar",
      description: `Consulta presencial de ${p.dadosPacienteReal?.nome || "Paciente Real"}`,
      isRealCase: true,
      patient: {
        name: p.dadosPacienteReal?.nome || "Paciente Real",
        age: p.dadosPacienteReal?.idade || "--",
        gender: p.dadosPacienteReal?.sexo || "--",
        occupation: p.dadosPacienteReal?.ocupacao || ""
      },
      hipoteseDiagnostica: hip,
      habilitarQuestoesAvaliativas: false
    };

    DietoterapiaDocxReport.generateReport(p, realCase);
    saveRealPatientSession(false);
    showToast("📄 Relatório Word (.docx) do Atendimento Real gerado com sucesso!", "success");
  }

  // Renderiza a Tabela Dinâmica de Interações Droga-Nutriente
  function renderDrugNutrientTable() {
    const tbody = document.getElementById("drugNutrientTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const p = appState.currentProntuario;
    if (!p) return;
    if (!Array.isArray(p.interacaoDrogaNutriente)) {
      p.interacaoDrogaNutriente = [];
    }

    if (p.interacaoDrogaNutriente.length === 0) {
      tbody.innerHTML = `
        <tr id="drugNutrientEmptyRow">
          <td colspan="4" class="py-6 text-center text-slate-400 text-xs italic">
            Nenhuma interação medicamentosa registrada. Clique em "Adicionar Fármaco / Interação" acima ou selecione uma das sugestões rápidas.
          </td>
        </tr>
      `;
      return;
    }

    p.interacaoDrogaNutriente.forEach((item, index) => {
      const tr = document.createElement("tr");
      tr.className = index % 2 === 0 ? "bg-white hover:bg-slate-50/60 transition" : "bg-slate-50/30 hover:bg-slate-50/80 transition";
      tr.innerHTML = `
        <td class="p-2.5 align-top">
          <input type="text" class="drug-item-med w-full text-xs p-1.5 border border-slate-300 rounded font-semibold text-slate-800 focus:border-emerald-500" data-idx="${index}" placeholder="Ex: Metformina 850mg" value="${escapeHtml(item.medicamento || '')}">
        </td>
        <td class="p-2.5 align-top">
          <textarea class="drug-item-nutr w-full text-xs p-1.5 border border-slate-300 rounded text-slate-700 focus:border-emerald-500" rows="2" data-idx="${index}" placeholder="Nutrientes afetados / mecanismo (ex: depleção de Vit B12)...">${escapeHtml(item.nutrientes || '')}</textarea>
        </td>
        <td class="p-2.5 align-top">
          <textarea class="drug-item-cond w-full text-xs p-1.5 border border-slate-300 rounded text-slate-700 focus:border-emerald-500" rows="2" data-idx="${index}" placeholder="Conduta nutricional / horário (ex: monitorar B12 sérica)...">${escapeHtml(item.conduta || '')}</textarea>
        </td>
        <td class="p-2.5 text-center align-middle">
          <button type="button" class="remove-drug-btn text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition cursor-pointer" data-idx="${index}" title="Remover este fármaco">
            🗑️
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".drug-item-med").forEach(inp => {
      inp.addEventListener("input", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        if (p.interacaoDrogaNutriente[idx]) {
          p.interacaoDrogaNutriente[idx].medicamento = e.target.value;
        }
      });
    });

    tbody.querySelectorAll(".drug-item-nutr").forEach(inp => {
      inp.addEventListener("input", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        if (p.interacaoDrogaNutriente[idx]) {
          p.interacaoDrogaNutriente[idx].nutrientes = e.target.value;
        }
      });
    });

    tbody.querySelectorAll(".drug-item-cond").forEach(inp => {
      inp.addEventListener("input", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        if (p.interacaoDrogaNutriente[idx]) {
          p.interacaoDrogaNutriente[idx].conduta = e.target.value;
        }
      });
    });

    tbody.querySelectorAll(".remove-drug-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx);
        prontuarioManager.removeInteracaoDrogaNutriente(p, idx);
        renderDrugNutrientTable();
      });
    });
  }

  // Adiciona novo exame laboratorial na tabela de bioquímica
  function handleAddCustomBioExam() {
    const nome = prompt("Nome do Exame Laboratorial (ex: Glicemia de Jejum, Hemoglobina Glicada, Triglicerídeos, Ureia):");
    if (!nome || !nome.trim()) return;
    const ref = prompt("Valor de Referência (ex: 70 - 99 mg/dL ou < 150 mg/dL):", "Normal");
    const valor = prompt("Valor Achado do Paciente (ex: 110 mg/dL):", "");
    const interp = prompt("Interpretação Clínica Preliminar (opcional):", "");

    if (!appState.currentCase) return;
    if (!Array.isArray(appState.currentCase.bioquimica)) {
      appState.currentCase.bioquimica = [];
    }

    const novoExame = {
      exame: nome.trim(),
      referencia: (ref || "-").trim(),
      valor: (valor || "-").trim(),
      interpretacao: (interp || "").trim()
    };

    appState.currentCase.bioquimica.push(novoExame);

    if (appState.currentProntuario) {
      if (!appState.currentProntuario.bioquimica) appState.currentProntuario.bioquimica = {};
      if (!appState.currentProntuario.bioquimica.interpretacoes) appState.currentProntuario.bioquimica.interpretacoes = {};
      if (interp) {
        appState.currentProntuario.bioquimica.interpretacoes[novoExame.exame] = interp;
      }
      if (!Array.isArray(appState.currentProntuario.bioquimica.listaCustom)) {
        appState.currentProntuario.bioquimica.listaCustom = [];
      }
      appState.currentProntuario.bioquimica.listaCustom.push(novoExame);
    }

    renderStudentBioTable(appState.currentCase.bioquimica, appState.currentProntuario?.bioquimica?.interpretacoes);
    syncBioquimicaExamesRelevantesText();
    showToast(`Exame "${novoExame.exame}" adicionado à tabela com sucesso!`, "success");
  }

  // Exibe o Template 2: Painel do Professor / Administrador (requer senha Nutri2@26)
  function showTeacherPanel() {
    if (!isTeacherAuthenticated) {
      teacherPasswordInput.value = "";
      teacherPasswordError.classList.add("hidden");
      teacherPasswordModal.classList.remove("hidden");
      setTimeout(() => teacherPasswordInput.focus(), 100);
      return;
    }

    appState.mode = "admin";
    studentView.classList.add("hidden");
    adminView.classList.remove("hidden");

    document.getElementById("adminCasesListSection").classList.remove("hidden");
    document.getElementById("adminCaseEditorSection").classList.add("hidden");
    document.getElementById("adminUploadCaseSection")?.classList.add("hidden");

    modeBadge.textContent = "PAINEL DO PROFESSOR";
    modeBadge.className = "badge-clinical bg-purple-100 text-purple-800 border border-purple-300";

    if (navStudentCatalogBtn) {
      navStudentCatalogBtn.className = "bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition flex items-center space-x-1.5";
    }
    if (switchModeBtn) {
      switchModeBtn.className = "bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition flex items-center space-x-1.5";
    }
    if (teacherBtnText) teacherBtnText.textContent = "Professor (Ativo)";

    renderAdminDisciplineTabs();
    updateAdminMetrics();
    renderAdminCasesList();
  }

  // Preenche os selects de disciplinas no editor e na área de upload
  function populateDisciplineDropdowns() {
    const disciplinas = adminManager.refreshDisciplinas();

    // Dropdown no editor do caso (Aba 1)
    const editorSelect = document.getElementById("admCaseDiscipline");
    if (editorSelect) {
      const currentVal = editorSelect.value;
      editorSelect.innerHTML = "";
      disciplinas.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = `${d.icone || '📚'} ${d.nome} ${d.codigo ? '(' + d.codigo + ')' : ''}`;
        editorSelect.appendChild(opt);
      });
      if (currentVal && disciplinas.some(d => d.id === currentVal)) {
        editorSelect.value = currentVal;
      }
    }

    // Dropdown na seção de upload
    const uploadSelect = document.getElementById("adminUploadCaseDiscipline");
    if (uploadSelect) {
      const currentVal = uploadSelect.value;
      uploadSelect.innerHTML = "";
      disciplinas.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = `${d.icone || '📚'} ${d.nome} ${d.codigo ? '(' + d.codigo + ')' : ''}`;
        uploadSelect.appendChild(opt);
      });
      if (currentVal && disciplinas.some(d => d.id === currentVal)) {
        uploadSelect.value = currentVal;
      } else {
        uploadSelect.value = adminManager.activeDisciplinaId || "dietoterapia";
      }
    }
  }

  // Renderiza a barra de abas de disciplinas no Painel do Professor
  function renderAdminDisciplineTabs() {
    const container = document.getElementById("adminDisciplineTabsContainer");
    if (!container) return;
    container.innerHTML = "";

    const disciplinas = adminManager.refreshDisciplinas();
    const activeId = adminManager.activeDisciplinaId || "dietoterapia";

    disciplinas.forEach(d => {
      const caseCount = adminManager.cases.filter(c => (c.disciplinaId || "dietoterapia") === d.id).length;
      const isActive = d.id === activeId;

      const tabBtn = document.createElement("button");
      tabBtn.type = "button";
      tabBtn.className = `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
        isActive 
          ? 'bg-indigo-600 text-white shadow-xs' 
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
      }`;
      tabBtn.innerHTML = `
        <span class="text-sm">${d.icone || '📚'}</span>
        <span>${escapeHtml(d.nome)}</span>
        ${d.codigo ? `<span class="text-[10px] px-1 py-0.2 rounded font-mono ${isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-600'}">${escapeHtml(d.codigo)}</span>` : ''}
        <span class="ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-700'}">${caseCount}</span>
      `;

      tabBtn.addEventListener("click", () => {
        adminManager.activeDisciplinaId = d.id;
        renderAdminDisciplineTabs();
        renderAdminCasesList();
      });

      container.appendChild(tabBtn);
    });

    populateDisciplineDropdowns();
  }

  // Renderiza a vitrine de disciplinas no painel do aluno (casos ocultos nesta tela)
  function renderStudentDisciplinePortal() {
    const container = document.getElementById("studentDisciplinesCardsContainer");
    if (!container) return;
    container.innerHTML = "";

    adminManager.refreshCases();
    const disciplinas = adminManager.refreshDisciplinas();
    let totalAvailAcrossAll = 0;

    const portalTotalDisciplinas = document.getElementById("portalTotalDisciplinasCount");
    const portalTotalCases = document.getElementById("portalTotalCasesAvailable");
    if (portalTotalDisciplinas) portalTotalDisciplinas.textContent = disciplinas.length;

    disciplinas.forEach(d => {
      const casesInDisc = adminManager.cases.filter(c => (c.disciplinaId || "dietoterapia") === d.id);
      const totalCount = casesInDisc.length;
      const availCount = casesInDisc.filter(c => !c.isLocked).length;
      totalAvailAcrossAll += availCount;

      const card = document.createElement("div");
      card.className = "bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between group cursor-pointer";

      card.innerHTML = `
        <div>
          <div class="flex items-start justify-between gap-2 mb-3.5">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition">
              ${d.icone || '📚'}
            </div>
            <div class="flex flex-col items-end">
              ${d.codigo ? `<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">${escapeHtml(d.codigo)}</span>` : ''}
              <span class="text-[11px] font-bold mt-1 ${availCount > 0 ? 'text-emerald-700' : 'text-slate-400'}">
                ${availCount > 0 ? `🟢 ${availCount} liberado(s)` : '🔒 Em preparação'}
              </span>
            </div>
          </div>

          <h3 class="text-base font-black text-slate-900 mb-1 group-hover:text-emerald-700 transition">
            ${escapeHtml(d.nome)}
          </h3>
          <p class="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
            ${escapeHtml(d.descricao || 'Casos clínicos simulados e prontuários direcionados para esta disciplina.')}
          </p>

          <div class="flex items-center space-x-3 text-xs text-slate-500 border-t border-slate-100 pt-3 mb-4">
            <span class="font-semibold text-slate-700">📁 ${totalCount} caso(s) cadastrado(s)</span>
          </div>
        </div>

        <button class="student-enter-disc-btn w-full bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs group-hover:bg-emerald-600 transition flex items-center justify-center space-x-1.5 cursor-pointer">
          <span>Acessar Casos da Disciplina</span>
          <span>→</span>
        </button>
      `;

      card.querySelector(".student-enter-disc-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        openStudentDiscipline(d.id);
      });
      card.addEventListener("click", () => {
        openStudentDiscipline(d.id);
      });

      container.appendChild(card);
    });

    if (portalTotalCases) portalTotalCases.textContent = totalAvailAcrossAll;
  }

  // Abre os casos de uma disciplina específica no painel do aluno
  function openStudentDiscipline(disciplinaId) {
    appState.studentSelectedDisciplinaId = disciplinaId;

    const portalSection = document.getElementById("studentDisciplinePortalSection");
    const casesSection = document.getElementById("studentDisciplineCasesSection");
    if (portalSection) portalSection.classList.add("hidden");
    if (casesSection) casesSection.classList.remove("hidden");

    const disc = adminManager.getDisciplinaById(disciplinaId) || {
      nome: "Disciplina",
      icone: "📚",
      descricao: "Casos clínicos da disciplina"
    };

    const iconEl = document.getElementById("studentSelectedDisciplineIcon");
    const titleEl = document.getElementById("studentSelectedDisciplineTitle");
    const descEl = document.getElementById("studentSelectedDisciplineDesc");

    if (iconEl) iconEl.textContent = disc.icone || "📚";
    if (titleEl) titleEl.textContent = disc.nome;
    if (descEl) descEl.textContent = disc.descricao || "Casos clínicos da disciplina";

    renderStudentQuickDisciplineTabs();
    renderStudentCatalog(currentCatalogFilter, currentCatalogSearch);
  }

  // Renderiza as abas horizontais de disciplinas no topo dos casos para troca rápida
  function renderStudentQuickDisciplineTabs() {
    const container = document.getElementById("studentQuickDisciplineTabs");
    if (!container) return;
    container.innerHTML = "";

    const disciplinas = adminManager.refreshDisciplinas();
    const activeId = appState.studentSelectedDisciplinaId;

    disciplinas.forEach(d => {
      const casesInDisc = adminManager.cases.filter(c => (c.disciplinaId || "dietoterapia") === d.id);
      const availCount = casesInDisc.filter(c => !c.isLocked).length;
      const isActive = d.id === activeId;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
        isActive
          ? 'bg-emerald-600 text-white shadow-xs'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
      }`;

      btn.innerHTML = `
        <span>${d.icone || '📚'}</span>
        <span>${escapeHtml(d.nome)}</span>
        <span class="ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-700'}">${availCount}</span>
      `;

      btn.addEventListener("click", () => {
        openStudentDiscipline(d.id);
      });

      container.appendChild(btn);
    });
  }

  // Retorna à visualização de disciplinas (sem casos aparecendo)
  function backToStudentDisciplinePortal() {
    appState.studentSelectedDisciplinaId = null;
    const portalSection = document.getElementById("studentDisciplinePortalSection");
    const casesSection = document.getElementById("studentDisciplineCasesSection");
    if (portalSection) portalSection.classList.remove("hidden");
    if (casesSection) casesSection.classList.add("hidden");
    renderStudentDisciplinePortal();
  }

  // Atualiza os contadores de métricas no topo do painel do professor
  function updateAdminMetrics() {
    adminManager.refreshCases();
    const cases = adminManager.cases;
    const total = cases.length;
    const unlocked = cases.filter(c => !c.isLocked).length;
    const locked = cases.filter(c => c.isLocked).length;

    const elTotal = document.getElementById("admMetricTotalCases");
    const elUnlocked = document.getElementById("admMetricUnlockedCases");
    const elLocked = document.getElementById("admMetricLockedCases");

    if (elTotal) elTotal.textContent = total;
    if (elUnlocked) elUnlocked.textContent = unlocked;
    if (elLocked) elLocked.textContent = locked;
  }

  // Renderiza a Vitrine de Casos do Aluno filtrada pela disciplina selecionada
  function renderStudentCatalog(filter = currentCatalogFilter, search = currentCatalogSearch) {
    adminManager.refreshCases();
    const allCases = adminManager.cases;
    const selectedDiscId = appState.studentSelectedDisciplinaId || "dietoterapia";
    const selectedDisc = adminManager.getDisciplinaById(selectedDiscId);

    // Filtra casos pertencentes à disciplina selecionada pelo aluno
    const discCases = allCases.filter(c => (c.disciplinaId || "dietoterapia") === selectedDiscId);
    const total = discCases.length;
    const available = discCases.filter(c => !c.isLocked).length;
    const locked = discCases.filter(c => c.isLocked).length;

    // Atualiza contadores visuais
    const elAvail = document.getElementById("catalogAvailableCount");
    const elLock = document.getElementById("catalogLockedCount");
    const elCountAll = document.getElementById("countAllFilter");
    const elCountAvail = document.getElementById("countAvailableFilter");
    const elCountLock = document.getElementById("countLockedFilter");

    if (elAvail) elAvail.textContent = available;
    if (elLock) elLock.textContent = locked;
    if (elCountAll) elCountAll.textContent = total;
    if (elCountAvail) elCountAvail.textContent = available;
    if (elCountLock) elCountLock.textContent = locked;

    // Aplica filtro de status
    let filtered = discCases;
    if (filter === "available") {
      filtered = filtered.filter(c => !c.isLocked);
    } else if (filter === "locked") {
      filtered = filtered.filter(c => c.isLocked);
    }

    // Aplica busca por texto
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(c => {
        return (c.title && c.title.toLowerCase().includes(q)) ||
               (c.description && c.description.toLowerCase().includes(q)) ||
               (c.patient?.name && c.patient.name.toLowerCase().includes(q)) ||
               (c.patient?.occupation && c.patient.occupation.toLowerCase().includes(q)) ||
               (c.history?.queixaPrincipal && c.history.queixaPrincipal.toLowerCase().includes(q));
      });
    }

    if (!studentCasesGrid) return;
    studentCasesGrid.innerHTML = "";

    if (filtered.length === 0) {
      if (discCases.length === 0) {
        studentCasesGrid.innerHTML = `
          <div class="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500">
            <div class="text-3xl mb-2">${selectedDisc?.icone || '📁'}</div>
            <h4 class="font-bold text-sm text-slate-700 mb-1">Nenhum caso clínico cadastrado ainda</h4>
            <p class="text-xs text-slate-400">A disciplina "${escapeHtml(selectedDisc?.nome || 'selecionada')}" ainda não possui casos clínicos publicados. Aguarde a liberação pelo professor.</p>
          </div>
        `;
      } else {
        studentCasesGrid.innerHTML = `
          <div class="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500">
            <div class="text-3xl mb-2">🔍</div>
            <h4 class="font-bold text-sm text-slate-700 mb-1">Nenhum caso encontrado para este filtro</h4>
            <p class="text-xs text-slate-400">Tente ajustar os filtros de status ou o termo de pesquisa.</p>
          </div>
        `;
      }
      return;
    }

    filtered.forEach(c => {
      // Se o caso estiver oculto pelo professor na visão do aluno, oculta os dados do caso e exibe estritamente o aviso
      if (c.visivel === false && !isTeacherAuthenticated) {
        const card = document.createElement("div");
        card.className = "catalog-case-card bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden";
        card.innerHTML = `
          <div class="absolute top-0 left-0 right-0 h-1 bg-slate-300"></div>
          <div class="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center text-2xl mb-3 shadow-inner">
            🙈
          </div>
          <p class="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 max-w-xs shadow-2xs">
            Caso clínico oculto. Aguardando liberação do professor.
          </p>
        `;
        studentCasesGrid.appendChild(card);
        return;
      }

      const isLocked = !!c.isLocked;
      const card = document.createElement("div");
      card.className = `catalog-case-card bg-white border ${isLocked ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'} rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden`;

      card.innerHTML = `
        ${isLocked 
          ? '<div class="absolute top-0 left-0 right-0 h-1 bg-amber-400"></div>' 
          : '<div class="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>'
        }
        <div>
          <!-- Header do Card -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="badge-clinical bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">
              ${escapeHtml(c.category || 'Ambulatorial')}
            </span>
            ${isLocked ? `
              <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <span>🔒</span> <span>Travado pelo Professor</span>
              </span>
            ` : `
              <span class="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Disponível</span>
              </span>
            `}
          </div>

          <!-- Identificação do Paciente -->
          <div class="flex items-start space-x-3 mb-2.5">
            <div class="w-12 h-12 rounded-xl ${isLocked ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-800'} flex items-center justify-center text-2xl flex-shrink-0 shadow-2xs">
              ${c.patient?.avatar || (c.patient?.gender === 'F' ? '👵' : '👴')}
            </div>
            <div>
              <h3 class="font-bold text-base text-slate-800 leading-snug">${escapeHtml(c.title)}</h3>
              <p class="text-xs text-slate-500 font-medium">Paciente: <strong>${escapeHtml(c.patient?.name || 'Paciente')}</strong>, ${c.patient?.age || '--'} anos</p>
            </div>
          </div>

          <!-- Queixa / Descrição -->
          <p class="text-xs text-slate-600 line-clamp-2 mb-3.5 leading-relaxed">
            ${escapeHtml(c.description || c.history?.queixaPrincipal || 'Caso clínico de atendimento nutricional para estudo de conduta dietoterápica.')}
          </p>

          <!-- Badges de Informações Clínicas -->
          <div class="flex flex-wrap gap-1.5 mb-4 text-[10px]">
            <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">💼 ${escapeHtml(c.patient?.occupation || 'Atividade')}</span>
            <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">⚖️ Peso: ${c.antropometria?.pesoAtual || '--'} kg</span>
            <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">🧪 ${(c.bioquimica || []).length} exames</span>
            <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">❓ ${(c.questoesAvaliativas || []).length} questões</span>
          </div>
        </div>

        <!-- Ação do Card -->
        <div class="pt-3 border-t border-slate-100">
          ${isLocked ? `
            <button onclick="window.notifyCaseLocked('${c.id}')" class="w-full bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-800 border border-slate-200 hover:border-amber-300 text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 shadow-2xs">
              <span>🔒</span>
              <span>Caso Bloqueado pelo Docente</span>
            </button>
          ` : `
            <button onclick="window.startCaseFromCatalog('${c.id}')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5">
              <span>▶</span>
              <span>Acessar e Iniciar Atendimento</span>
            </button>
          `}
        </div>
      `;

      studentCasesGrid.appendChild(card);
    });
  }

  // Helpers globais para cliques nos cards do catálogo
  window.startCaseFromCatalog = function(caseId) {
    showStudentSimulation(caseId);
  };

  window.notifyCaseLocked = function(caseId) {
    showToast("🔒 Este caso está bloqueado pelo professor. Aguarde a liberação pelo docente para realizar a simulação.", "warning");
  };

  // Preenche dropdown de seleção de casos (filtrando casos liberados para os alunos)
  function loadCasesIntoDropdown() {
    adminManager.refreshCases();
    caseSelectDropdown.innerHTML = "";

    // Filtra casos que NÃO estão travados pelo professor e NÃO estão ocultos para os alunos
    const availableCases = adminManager.cases.filter(c => !c.isLocked && (isTeacherAuthenticated || c.visivel !== false));

    if (availableCases.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Nenhum caso liberado pelo professor";
      opt.disabled = true;
      opt.selected = true;
      caseSelectDropdown.appendChild(opt);
      return;
    }

    availableCases.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.title} (${c.patient.name})`;
      caseSelectDropdown.appendChild(opt);
    });

    // Se o modo ativo for Atendimento Real, não sobrescreve com um caso simulado
    if (appState.workflowMode === "real" || appState.currentCaseId === "atendimento-real") {
      return;
    }

    // Se o caso atual for nulo ou não estiver liberado, seleciona o primeiro disponível
    if (!appState.currentCaseId || !availableCases.some(c => c.id === appState.currentCaseId)) {
      selectCase(availableCases[0].id);
    } else {
      caseSelectDropdown.value = appState.currentCaseId;
    }
  }

  // Preenche dinamicamente o seletor de interlocutores do chat com os profissionais configurados para o caso
  function updateInterlocutorDropdown(currentCase) {
    if (!interlocutorSelect || !currentCase) return;
    interlocutorSelect.innerHTML = "";

    // 1. Sempre inclui Paciente e Acompanhante
    const optPac = document.createElement("option");
    optPac.value = "paciente";
    optPac.textContent = `👤 ${currentCase.patient?.name || "Paciente"}`;
    interlocutorSelect.appendChild(optPac);

    const optAcomp = document.createElement("option");
    optAcomp.value = "acompanhante";
    optAcomp.textContent = "👥 Acompanhante / Familiar";
    interlocutorSelect.appendChild(optAcomp);

    // 2. Inclui estritamente os profissionais ativos configurados pelo docente
    const equipe = (typeof normalizeEquipeMultiprofissional === "function")
      ? normalizeEquipeMultiprofissional(currentCase.equipeMultiprofissional)
      : [];

    equipe.forEach(prof => {
      const opt = document.createElement("option");
      opt.value = prof.id;
      opt.textContent = `${prof.avatar || '🩺'} ${prof.nome}`;
      interlocutorSelect.appendChild(opt);
    });

    // 3. Verifica se o interlocutor selecionado anteriormente ainda está disponível no caso
    const exists = Array.from(interlocutorSelect.options).some(o => o.value === appState.activeInterlocutor);
    if (exists) {
      interlocutorSelect.value = appState.activeInterlocutor;
    } else {
      appState.activeInterlocutor = "paciente";
      interlocutorSelect.value = "paciente";
    }
  }

  // Sincronização centralizada e re-renderização imediata de todas as telas (Aluno e Professor)
  function syncAppStateAndNotify(toastMessage = null, shouldTriggerSync = true) {
    adminManager.refreshDisciplinas();
    adminManager.refreshCases();

    // 1. Atualiza interface do Aluno
    renderStudentDisciplinePortal();
    if (appState.studentSelectedDisciplinaId) {
      if (!adminManager.getDisciplinaById(appState.studentSelectedDisciplinaId)) {
        appState.studentSelectedDisciplinaId = null;
        backToStudentDisciplinePortal();
      } else {
        renderStudentQuickDisciplineTabs();
        renderStudentCatalog();
      }
    }
    // Se estiver em modo Atendimento Real, não sobrescreve com dados de caso simulado
    if (appState.workflowMode === "real" || appState.currentCaseId === "atendimento-real") {
      renderAdminDisciplineTabs();
      renderAdminCasesList();
      updateAdminMetrics();
      populateDisciplineDropdowns();
      return;
    }

    // Se o aluno estiver dentro da simulação e o caso ativo foi atualizado
    const activeCaseId = appState.currentCaseId || (appState.currentCase ? appState.currentCase.id : null) || document.getElementById("caseSelectDropdown")?.value;
    if (activeCaseId) {
      const updated = adminManager.getCaseById(activeCaseId);
      if (updated) {
        const wasLocked = appState.currentCase ? appState.currentCase.isLocked : false;
        const wasVisible = appState.currentCase ? (appState.currentCase.visivel !== false) : true;
        appState.currentCase = updated;
        appState.currentCaseId = updated.id;

        // Controle de visibilidade em tempo real do caso ativo para o aluno
        const hiddenOverlay = document.getElementById("studentCaseHiddenOverlay");
        const simContent = document.getElementById("studentSimulationContent");
        if (!isTeacherAuthenticated && updated.visivel === false) {
          if (hiddenOverlay) hiddenOverlay.classList.remove("hidden");
          if (simContent) simContent.classList.add("hidden");
        } else {
          if (hiddenOverlay) hiddenOverlay.classList.add("hidden");
          if (simContent) simContent.classList.remove("hidden");
        }

        const patHeader = document.getElementById("simPatientHeaderName");
        if (patHeader) patHeader.textContent = (updated.visivel === false && !isTeacherAuthenticated) ? "Caso Oculto" : (updated.patient?.name || updated.title);
        updateInterlocutorDropdown(updated);

        // Aplica bloqueio de abas em tempo real fisicamente no DOM
        applyStudentTabBlockingState(updated);

        // Notifica aluno se o caso foi trancado ou liberado pelo professor em tempo real
        if (!wasLocked && updated.isLocked && !isTeacherAuthenticated) {
          showToast("🔒 Atenção: este caso clínico foi trancado pelo professor em tempo real.");
        } else if (wasLocked && !updated.isLocked && !isTeacherAuthenticated) {
          showToast("🔓 Este caso clínico foi liberado pelo professor em tempo real!");
        }

        // Notifica aluno se a visibilidade foi alterada pelo professor em tempo real
        if (wasVisible && updated.visivel === false && !isTeacherAuthenticated) {
          showToast("Caso clínico oculto. Aguardando liberação do professor.", "warning");
        } else if (!wasVisible && updated.visivel !== false && !isTeacherAuthenticated) {
          showToast("👁️ Este caso clínico foi tornado visível pelo professor!", "success");
        }
      }
    }

    // 2. Atualiza interface do Professor
    renderAdminDisciplineTabs();
    renderAdminCasesList();
    updateAdminMetrics();
    populateDisciplineDropdowns();

    // 3. Sincroniza com o servidor central e difunde para outras abas (apenas se originado localmente)
    if (shouldTriggerSync) {
      adminManager.triggerServerSync();
    }

    if (toastMessage) {
      showToast(toastMessage);
    }
  }
  window.syncAppStateAndNotify = syncAppStateAndNotify;

  // Seleciona caso clínico ativo
  function selectCase(caseId) {
    setStudentWorkflowMode("simulation");
    const found = adminManager.getCaseById(caseId);
    if (!found) return;

    appState.currentCaseId = caseId;
    appState.currentCase = found;
    caseSelectDropdown.value = caseId;

    // Restaura layout de 5 colunas para o chat e 7 colunas para o prontuário
    const chatColumn = document.querySelector("#studentSimulationContent > section:first-child");
    const prontColumn = document.querySelector("#studentSimulationContent > section:last-child");
    if (chatColumn) {
      chatColumn.classList.remove("hidden");
      chatColumn.style.display = "";
    }
    if (prontColumn) {
      prontColumn.classList.remove("lg:col-span-12");
      prontColumn.classList.add("lg:col-span-7");
      prontColumn.style.gridColumn = "";
    }

    // Oculta cabeçalho de atendimento real
    const realHeaderCard = document.getElementById("realPatientHeaderCard");
    if (realHeaderCard) {
      realHeaderCard.classList.add("hidden");
      realHeaderCard.style.display = "none";
    }

    // Restaura controles do topo
    const simWrapper = document.getElementById("simCaseSelectWrapper");
    const realWrapper = document.getElementById("realPatientActionsWrapper");
    if (simWrapper) {
      simWrapper.classList.remove("hidden");
      simWrapper.style.display = "";
    }
    if (realWrapper) {
      realWrapper.classList.add("hidden");
      realWrapper.style.display = "none";
    }

    // Carrega prontuário do aluno (ou rascunho salvo)
    appState.currentProntuario = prontuarioManager.loadDraft(caseId);
    if (appState.currentProntuario) {
      appState.currentProntuario.isRealPatient = false;
    }

    // Atualiza cabeçalho do caso
    document.getElementById("casePatientNameHeader").textContent = found.patient.name;
    document.getElementById("caseCategoryHeader").textContent = found.category;
    document.getElementById("caseCategoryHeader").className = "badge-clinical bg-slate-100 text-slate-700";
    document.getElementById("caseDescHeader").textContent = found.description;

    const hipBadge = document.getElementById("caseHipoteseDiagnosticaHeader");
    if (hipBadge) {
      const hip = found.hipoteseDiagnostica || found.history?.hipoteseDiagnostica || "";
      hipBadge.textContent = hip ? `🩺 ${hip}` : "🩺 Não informada";
      hipBadge.title = hip;
    }

    // Atualiza lista dinâmica de interlocutores do caso no chat
    updateInterlocutorDropdown(found);

    // Atualiza interlocutor
    updateInterlocutorUI();

    // Renderiza mensagens do chat
    renderChatMessages();

    // Preenche campos do formulário do prontuário
    populateProntuarioForm();

    // Renderiza abas dinâmicas (exames laboratoriais, questões avaliativas)
    renderCaseLabExamsBadge();
    renderStudentBioTable();
    renderDrugNutrientTable();
    renderStudentEvaluationQuestions();

    // Aplica bloqueio de abas configurado para este caso
    applyStudentTabBlockingState(found);
  }

  // Alterna entre Modo Aluno e Modo Administrador (mantido para compatibilidade)
  function switchMode(newMode) {
    if (newMode === "admin") {
      showTeacherPanel();
    } else {
      showStudentCatalog();
    }
  }

  // Atualiza UI do interlocutor no chat
  function updateInterlocutorUI() {
    const role = appState.activeInterlocutor;
    chatEngine.setRole(role);
    const info = chatEngine.getRoleInfo(role, appState.currentCase);

    interlocutorAvatar.textContent = info.avatar;
    interlocutorName.textContent = info.title;
    interlocutorRole.textContent = info.subtitle;
    renderChatMessages();
  }

  // Renderiza histórico de chat
  function renderChatMessages() {
    const caseId = appState.currentCaseId;
    const role = appState.activeInterlocutor;

    if (!appState.chatHistories[caseId]) {
      appState.chatHistories[caseId] = {};
    }
    if (!appState.chatHistories[caseId][role]) {
      // Mensagem inicial de acolhimento
      let defaultGreeting = "";
      const pName = appState.currentCase?.patient?.name || "o paciente";
      if (role === "paciente") {
        defaultGreeting = `Olá, doutor(a)! Bom dia/boa tarde. Eu sou ${pName}. Vim para a consulta de nutrição. Em que posso lhe ajudar?`;
      } else if (role === "acompanhante") {
        defaultGreeting = `Olá! Estou acompanhando ${pName} para ajudar a passar todas as informações da rotina e alimentação.`;
      } else if (role === "medico") {
        defaultGreeting = `Olá, colega nutricionista. Estou à disposição para alinhar as condutas e fornecer o parecer médico e prescrições deste caso.`;
      } else if (role === "enfermagem") {
        defaultGreeting = `Olá! Enfermagem do plantão à disposição. Pode perguntar sobre sinais vitais, balanço hídrico ou aceitação da dieta.`;
      } else if (role === "fono") {
        defaultGreeting = `Olá! Equipe de fonoaudiologia disponível para esclarecimentos sobre a deglutição, consistências e mastigação.`;
      } else if (role === "psicologia") {
        defaultGreeting = `Olá! Psicologia e Serviço Social à disposição para compartilhar os aspectos emocionais e apoio familiar.`;
      } else {
        const info = chatEngine.getRoleInfo(role, appState.currentCase);
        defaultGreeting = `Olá, colega nutricionista! Sou o(a) ${info.title}. Estou à disposição para discutir o caso clínico e fornecer as informações da nossa área.`;
      }

      appState.chatHistories[caseId][role] = [
        { sender: "bot", text: defaultGreeting, time: "Agora" }
      ];
    }

    const messages = appState.chatHistories[caseId][role];
    chatMessagesList.innerHTML = "";

    messages.forEach(msg => {
      const msgDiv = document.createElement("div");
      msgDiv.className = `flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`;

      if (msg.sender === "user") {
        msgDiv.innerHTML = `
          <div class="chat-bubble-user max-w-[82%] px-4 py-2 text-sm leading-relaxed">
            <p>${escapeHtml(msg.text)}</p>
            <span class="text-[10px] text-sky-100 block text-right mt-1 opacity-80">${msg.time}</span>
          </div>
        `;
      } else {
        const info = chatEngine.getRoleInfo(role, appState.currentCase);
        msgDiv.innerHTML = `
          <div class="flex items-start max-w-[85%] space-x-2">
            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-lg flex-shrink-0 shadow-sm border border-slate-200">
              ${info.avatar}
            </div>
            <div class="chat-bubble-bot px-4 py-2.5 text-sm leading-relaxed">
              <span class="text-[11px] font-semibold text-emerald-700 block mb-0.5">${info.title}</span>
              <p class="whitespace-pre-line text-slate-800">${escapeHtml(msg.text)}</p>
              <span class="text-[10px] text-slate-400 block text-right mt-1">${msg.time}</span>
            </div>
          </div>
        `;
      }
      chatMessagesList.appendChild(msgDiv);
    });

    // Auto-scroll para a última mensagem
    chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
  }

  // Envia mensagem no chat
  async function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text || !appState.currentCase) return;

    chatInput.value = "";
    const caseId = appState.currentCaseId;
    const role = appState.activeInterlocutor;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Adiciona pergunta do aluno
    appState.chatHistories[caseId][role].push({
      sender: "user",
      text: text,
      time: now
    });
    renderChatMessages();

    // Indicador de digitação
    const typingIndicator = document.createElement("div");
    typingIndicator.id = "typingIndicator";
    typingIndicator.className = "flex items-center space-x-2 text-xs text-slate-500 italic mb-2";
    typingIndicator.innerHTML = `
      <span class="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
      <span>${chatEngine.getRoleInfo(role, appState.currentCase).title} está respondendo...</span>
    `;
    chatMessagesList.appendChild(typingIndicator);
    chatMessagesList.scrollTop = chatMessagesList.scrollHeight;

    // Processamento da resposta estrita anti-alucinação
    try {
      const reply = await chatEngine.processQuestion(text, appState.currentCase, role);
      const indicator = document.getElementById("typingIndicator");
      if (indicator) indicator.remove();

      appState.chatHistories[caseId][role].push({
        sender: "bot",
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      renderChatMessages();
    } catch (err) {
      console.error("Erro no processamento da resposta:", err);
      const indicator = document.getElementById("typingIndicator");
      if (indicator) indicator.remove();

      appState.chatHistories[caseId][role].push({
        sender: "bot",
        text: "Desculpe, ocorreu uma instabilidade momentânea ao processar a resposta. Por favor, tente novamente.",
        time: now
      });
      renderChatMessages();
    }
  }

  // Alternância visual da via nutricional (Oral vs TNE)
  function setNutritionRouteSelection(route) {
    const isTne = route === "tne";
    const radioOral = document.getElementById("radioViaOral");
    const radioTne = document.getElementById("radioViaTne");
    const labelOral = document.getElementById("labelViaOral");
    const labelTne = document.getElementById("labelViaTne");
    const containerOral = document.getElementById("cardapioOralContainer");
    const containerTne = document.getElementById("cardapioTneContainer");

    if (radioOral) radioOral.checked = !isTne;
    if (radioTne) radioTne.checked = isTne;

    if (labelOral) {
      if (!isTne) {
        labelOral.className = "relative flex items-center p-3 rounded-xl border-2 cursor-pointer transition select-none border-emerald-500 bg-emerald-50/60 shadow-xs";
        const dot = labelOral.querySelector(".rounded-full .rounded-full");
        if (dot) dot.className = "w-2 h-2 rounded-full bg-emerald-600";
      } else {
        labelOral.className = "relative flex items-center p-3 rounded-xl border-2 cursor-pointer transition select-none border-slate-200 bg-white hover:border-slate-300";
        const dot = labelOral.querySelector(".rounded-full .rounded-full");
        if (dot) dot.className = "w-2 h-2 rounded-full bg-transparent";
      }
    }

    if (labelTne) {
      if (isTne) {
        labelTne.className = "relative flex items-center p-3 rounded-xl border-2 cursor-pointer transition select-none border-sky-500 bg-sky-50/60 shadow-xs";
        const dot = labelTne.querySelector(".rounded-full .rounded-full");
        if (dot) dot.className = "w-2 h-2 rounded-full bg-sky-600";
      } else {
        labelTne.className = "relative flex items-center p-3 rounded-xl border-2 cursor-pointer transition select-none border-slate-200 bg-white hover:border-slate-300";
        const dot = labelTne.querySelector(".rounded-full .rounded-full");
        if (dot) dot.className = "w-2 h-2 rounded-full bg-transparent";
      }
    }

    if (containerOral) {
      if (!isTne) containerOral.classList.remove("hidden");
      else containerOral.classList.add("hidden");
    }

    if (containerTne) {
      if (isTne) containerTne.classList.remove("hidden");
      else containerTne.classList.add("hidden");
    }

    if (typeof updateCardapioTotalsDisplay === "function") {
      updateCardapioTotalsDisplay();
    }
  }
  window.setNutritionRouteSelection = setNutritionRouteSelection;

  // Alternância condicional dos campos de via da TNE (Gravitacional vs Bomba)
  function updateTneAdministrationRouteDisplay(via) {
    const isBomba = via === "bomba";
    const gravFields = document.getElementById("tneGravitacionalFields");
    const bombaFields = document.getElementById("tneBombaFields");

    if (gravFields) {
      if (!isBomba) gravFields.classList.remove("hidden");
      else gravFields.classList.add("hidden");
    }

    if (bombaFields) {
      if (isBomba) bombaFields.classList.remove("hidden");
      else bombaFields.classList.add("hidden");
    }
  }
  window.updateTneAdministrationRouteDisplay = updateTneAdministrationRouteDisplay;

  // Preenche formulário do prontuário
  function populateProntuarioForm() {
    const p = appState.currentProntuario;
    if (!p) return;

    // Aluno
    document.getElementById("alunoNome").value = p.aluno.nome || "";
    document.getElementById("alunoMatricula").value = p.aluno.matriculaTurma || "";
    document.getElementById("alunoData").value = p.aluno.data || new Date().toISOString().split("T")[0];

    // Atendimento Real: Campos do Paciente Real
    if (p.isRealPatient || appState.workflowMode === "real") {
      const rp = p.dadosPacienteReal || {};
      if (document.getElementById("realPatName")) document.getElementById("realPatName").value = rp.nome || "";
      if (document.getElementById("realPatAge")) document.getElementById("realPatAge").value = rp.idade || "";
      if (document.getElementById("realPatGender")) document.getElementById("realPatGender").value = rp.sexo || "Feminino";
      if (document.getElementById("realPatOccupation")) document.getElementById("realPatOccupation").value = rp.ocupacao || "";
      if (document.getElementById("realPatHipoteseDiagnostica")) {
        document.getElementById("realPatHipoteseDiagnostica").value = rp.hipoteseDiagnostica || p.anamnese?.hipoteseDiagnostica || "";
      }
    }

    // Anamnese & Hipótese Diagnóstica
    if (document.getElementById("prontHipoteseDiagnostica")) {
      const hip = p.anamnese?.hipoteseDiagnostica || p.dadosPacienteReal?.hipoteseDiagnostica || appState.currentCase?.hipoteseDiagnostica || appState.currentCase?.history?.hipoteseDiagnostica || "";
      document.getElementById("prontHipoteseDiagnostica").value = hip;
      if (p.anamnese) p.anamnese.hipoteseDiagnostica = hip;
    }
    document.getElementById("prontQueixaPrincipal").value = p.anamnese.queixaPrincipal || "";
    document.getElementById("prontHistoriaClinica").value = p.anamnese.historiaClinica || "";
    document.getElementById("prontAntecedentesMed").value = p.anamnese.antecedentesMedicamentos || "";
    document.getElementById("prontHabitosEstiloVida").value = p.anamnese.habitosEstiloVida || "";

    // Interações Droga-Nutriente
    renderDrugNutrientTable();
    if (document.getElementById("prontObsFarmacoterapia")) {
      document.getElementById("prontObsFarmacoterapia").value = p.observacoesFarmacoterapia || "";
    }

    // Antropometria
    document.getElementById("prontPesoAtual").value = p.antropometria.pesoAtual || "";
    document.getElementById("prontPesoHabitual").value = p.antropometria.pesoHabitual || "";
    document.getElementById("prontEstatura").value = p.antropometria.estatura || "";
    if (document.getElementById("prontAlturaJoelho")) {
      document.getElementById("prontAlturaJoelho").value = p.antropometria.alturaJoelho || "";
    }
    if (document.getElementById("prontCircBraco")) {
      document.getElementById("prontCircBraco").value = p.antropometria.circBraco || "";
    }
    if (document.getElementById("prontCircCintura")) {
      document.getElementById("prontCircCintura").value = p.antropometria.circCintura || "";
    }
    if (document.getElementById("prontCircQuadril")) {
      document.getElementById("prontCircQuadril").value = p.antropometria.circQuadril || "";
    }
    if (document.getElementById("prontCircPanturrilha")) {
      document.getElementById("prontCircPanturrilha").value = p.antropometria.circPanturrilha || "";
    }
    if (document.getElementById("prontCircPunho")) {
      document.getElementById("prontCircPunho").value = p.antropometria.circPunho || "";
    }
    if (document.getElementById("prontDobraTricipital")) {
      document.getElementById("prontDobraTricipital").value = p.antropometria.dobraTricipital || "";
    }
    if (document.getElementById("prontDobraSubescapular")) {
      document.getElementById("prontDobraSubescapular").value = p.antropometria.dobraSubescapular || "";
    }
    if (document.getElementById("prontDobraBicipital")) {
      document.getElementById("prontDobraBicipital").value = p.antropometria.dobraBicipital || "";
    }
    if (document.getElementById("prontDobraSuprailiaca")) {
      document.getElementById("prontDobraSuprailiaca").value = p.antropometria.dobraSuprailiaca || "";
    }
    if (document.getElementById("prontDobraAbdominal")) {
      document.getElementById("prontDobraAbdominal").value = p.antropometria.dobraAbdominal || "";
    }
    if (document.getElementById("prontDobraCoxa")) {
      document.getElementById("prontDobraCoxa").value = p.antropometria.dobraCoxa || "";
    }
    if (document.getElementById("prontDemaisAvaliacoes")) {
      document.getElementById("prontDemaisAvaliacoes").value = p.antropometria.demaisAvaliacoes || "";
    }
    document.getElementById("prontCircunferencias").value = p.antropometria.circunferenciasDobras || "";
    updateAnthropometricCalculations();

    // Bioquímica (Tabela Moderna de 4 Colunas e Raciocínio Clínico)
    if (!p.bioquimica) p.bioquimica = {};
    if (!p.bioquimica.interpretacoes) p.bioquimica.interpretacoes = {};
    renderStudentBioTable(appState.currentCase?.bioquimica || [], p.bioquimica.interpretacoes);
    if (document.getElementById("prontExamesRelevantes")) {
      document.getElementById("prontExamesRelevantes").value = p.bioquimica.examesRelevantes || "";
    }
    if (document.getElementById("prontInterpretacaoBioq")) {
      document.getElementById("prontInterpretacaoBioq").value = p.bioquimica.interpretacaoNutricional || "";
    }

    // Exame Físico
    document.getElementById("prontSinaisClinicos").value = p.exameFisico.sinaisClinicos || "";
    document.getElementById("prontMassaMuscular").value = p.exameFisico.massaMuscularAdiposa || "";
    document.getElementById("prontTGIEdemas").value = p.exameFisico.condicoesTGIeEdemas || "";

    // Consumo Alimentar (Recordatório de 24h)
    if (document.getElementById("prontVetRecordatorio")) {
      document.getElementById("prontVetRecordatorio").value = p.consumoAlimentar.vetRecordatorio || "";
    }
    document.getElementById("prontInqueritoResumo").value = p.consumoAlimentar.inqueritoResumo || "";
    document.getElementById("prontAguaPreferencias").value = p.consumoAlimentar.aguaPreferenciasAversoes || "";
    renderRecordatorioMeals();
    updateVetAdequacyCalculations();

    // Diagnóstico PES
    document.getElementById("prontPesProblema").value = p.diagnosticoPES.problema || "";
    document.getElementById("prontPesEtiologia").value = p.diagnosticoPES.etiologia || "";
    document.getElementById("prontPesSinais").value = p.diagnosticoPES.sinaisSintomas || "";
    document.getElementById("prontPesTextoCompleto").value = p.diagnosticoPES.textoCompletoPES || "";
    if (document.getElementById("prontObjetivosDietoterapicos")) {
      document.getElementById("prontObjetivosDietoterapicos").value = p.diagnosticoPES.objetivosDietoterapicos || "";
    }

    // Cálculos de Necessidades
    const calc = p.calculoNecessidades || {};
    const formulasSel = Array.isArray(calc.formulasSelecionadas) ? calc.formulasSelecionadas : [];
    
    const formulaConfig = {
      bolso: { checkId: "calcFormulaBolsoCheck", containerId: "calcBolsoFieldsContainer" },
      harrisBenedict: { checkId: "calcFormulaHarrisCheck", containerId: "calcHarrisFieldsContainer" },
      mifflin: { checkId: "calcFormulaMifflinCheck", containerId: "calcMifflinFieldsContainer" },
      eerIom: { checkId: "calcFormulaEerCheck", containerId: "calcEerFieldsContainer" },
      faoOms: { checkId: "calcFormulaFaoCheck", containerId: "calcFaoFieldsContainer" }
    };

    Object.keys(formulaConfig).forEach(key => {
      const cfg = formulaConfig[key];
      const cb = document.getElementById(cfg.checkId);
      const container = document.getElementById(cfg.containerId);
      const isSelected = formulasSel.includes(key);
      if (cb) cb.checked = isSelected;
      if (container) {
        if (isSelected) container.classList.remove("hidden");
        else container.classList.add("hidden");
      }
    });

    const countEl = document.getElementById("calcFormulasSelectedCount");
    if (countEl) countEl.textContent = formulasSel.length;

    if (document.getElementById("calcBolsoMinKcalKg")) document.getElementById("calcBolsoMinKcalKg").value = calc.bolso?.minKcalKg || "";
    if (document.getElementById("calcBolsoMaxKcalKg")) document.getElementById("calcBolsoMaxKcalKg").value = calc.bolso?.maxKcalKg || "";
    if (document.getElementById("calcBolsoResultadoKcal")) document.getElementById("calcBolsoResultadoKcal").value = calc.bolso?.resultadoKcal || "";
    if (document.getElementById("calcHarrisResultadoKcal")) document.getElementById("calcHarrisResultadoKcal").value = calc.harrisBenedict?.resultadoKcal || "";
    if (document.getElementById("calcMifflinResultadoKcal")) document.getElementById("calcMifflinResultadoKcal").value = calc.mifflin?.resultadoKcal || "";
    if (document.getElementById("calcEerResultadoKcal")) document.getElementById("calcEerResultadoKcal").value = calc.eerIom?.resultadoKcal || "";
    if (document.getElementById("calcFaoResultadoKcal")) document.getElementById("calcFaoResultadoKcal").value = calc.faoOms?.resultadoKcal || "";

    if (document.getElementById("prontCalcVetPlanejado")) document.getElementById("prontCalcVetPlanejado").value = calc.vetPlanejadoKcal || "";
    if (document.getElementById("prontCalcJustificativa")) document.getElementById("prontCalcJustificativa").value = calc.justificativaEscolha || "";

    // Prescrição Dietoterápica
    if (p.prescricaoDietoterapica) {
      if (document.getElementById("prontVetKcal")) document.getElementById("prontVetKcal").value = p.prescricaoDietoterapica.vetKcal || "";
      if (document.getElementById("prontRegraBolso")) document.getElementById("prontRegraBolso").value = p.prescricaoDietoterapica.regraBolsoKcalKg || "";
      if (p.prescricaoDietoterapica.distribuicaoMacros) {
        const dm = p.prescricaoDietoterapica.distribuicaoMacros;
        if (dm.cho) {
          if (document.getElementById("prontChoMinPct")) document.getElementById("prontChoMinPct").value = dm.cho.minPct ?? "45";
          if (document.getElementById("prontChoMaxPct")) document.getElementById("prontChoMaxPct").value = dm.cho.maxPct ?? "55";
        }
        if (dm.ptn) {
          if (document.getElementById("prontPtnMinPct")) document.getElementById("prontPtnMinPct").value = dm.ptn.minPct ?? "15";
          if (document.getElementById("prontPtnMaxPct")) document.getElementById("prontPtnMaxPct").value = dm.ptn.maxPct ?? "20";
        }
        if (dm.lip) {
          if (document.getElementById("prontLipMinPct")) document.getElementById("prontLipMinPct").value = dm.lip.minPct ?? "25";
          if (document.getElementById("prontLipMaxPct")) document.getElementById("prontLipMaxPct").value = dm.lip.maxPct ?? "30";
        }
        if (p.prescricaoDietoterapica.recomendacaoProteinaGKg) {
          const rp = p.prescricaoDietoterapica.recomendacaoProteinaGKg;
          if (document.getElementById("prontPtnMinGKg")) document.getElementById("prontPtnMinGKg").value = rp.minGKg ?? "1.0";
          if (document.getElementById("prontPtnMaxGKg")) document.getElementById("prontPtnMaxGKg").value = rp.maxGKg ?? "1.2";
        }
      }
    }
    updateCalculoNecessidadesDisplay();
    updatePrescriptionCalculations();

    if (document.getElementById("prontChoG")) document.getElementById("prontChoG").value = p.prescricaoDietoterapica.carboidratosG || "";
    if (document.getElementById("prontChoPct")) document.getElementById("prontChoPct").value = p.prescricaoDietoterapica.carboidratosPct || "";
    if (document.getElementById("prontPtnG")) document.getElementById("prontPtnG").value = p.prescricaoDietoterapica.proteinasG || "";
    if (document.getElementById("prontPtnGKg")) document.getElementById("prontPtnGKg").value = p.prescricaoDietoterapica.proteinasGKg || "";
    if (document.getElementById("prontPtnPct")) document.getElementById("prontPtnPct").value = p.prescricaoDietoterapica.proteinasPct || "";
    if (document.getElementById("prontLipG")) document.getElementById("prontLipG").value = p.prescricaoDietoterapica.lipidiosG || "";
    if (document.getElementById("prontLipPct")) document.getElementById("prontLipPct").value = p.prescricaoDietoterapica.lipidiosPct || "";
    document.getElementById("prontConsistencia").value = p.prescricaoDietoterapica.consistencia || "Normal / Livre";
    document.getElementById("prontFracionamento").value = p.prescricaoDietoterapica.fracionamento || "5 a 6 refeições/dia";
    document.getElementById("prontFibrasMicronutrientes").value = p.prescricaoDietoterapica.fibrasMicronutrientes || "";
    document.getElementById("prontJustificativa").value = p.prescricaoDietoterapica.justificativaFisiopatologica || "";

    // Consistência da Dieta Oral no Cardápio
    const oralCons = p.consistenciaDietaOral || p.prescricaoDietoterapica.consistencia || "Dieta Livre / Normal";
    const selectOralCons = document.getElementById("prontCardapioConsistencia");
    const customOralCons = document.getElementById("prontCardapioConsistenciaCustom");
    if (selectOralCons) {
      const existsInSelect = Array.from(selectOralCons.options).some(o => o.value === oralCons);
      if (existsInSelect) {
        selectOralCons.value = oralCons;
        if (customOralCons) customOralCons.value = "";
      } else {
        selectOralCons.value = "Personalizada";
        if (customOralCons) customOralCons.value = oralCons;
      }
    }

    // Planejamento Alimentar (Cardápio Oral & TNE)
    renderCardapioTable();

    const tne = p.tne || {
      viaAlimentacao: "oral",
      nomeComercial: "",
      tipoDieta: "",
      densidadeCalorica: "",
      fracionamento: "",
      viaAdministracao: "gravitacional",
      gravitacional: { volumePorRefeicao: "", quantidadeFrascosEtapas: "", metaVazaoGotasMin: "" },
      bombaInfusao: { tempoInfusaoHoras: "", metaVazaoMlHora: "" },
      tabelaNutricionalManual: { vet: "", cho: "", ptn: "", lip: "", fibra: "", sodio: "", potassio: "", calcio: "", fosforo: "" },
      moduloSuplementacaoProteica: ""
    };
    p.tne = tne;
    setNutritionRouteSelection(tne.viaAlimentacao || "oral");
    if (document.getElementById("tneNomeComercial")) document.getElementById("tneNomeComercial").value = tne.nomeComercial || "";
    if (document.getElementById("tneTipoDieta")) document.getElementById("tneTipoDieta").value = tne.tipoDieta || "";
    if (document.getElementById("tneDensidadeCalorica")) document.getElementById("tneDensidadeCalorica").value = tne.densidadeCalorica || "";
    if (document.getElementById("tneFracionamento")) document.getElementById("tneFracionamento").value = tne.fracionamento || "";
    if (document.getElementById("tneViaAdministracao")) {
      document.getElementById("tneViaAdministracao").value = tne.viaAdministracao || "gravitacional";
      updateTneAdministrationRouteDisplay(tne.viaAdministracao || "gravitacional");
    }
    if (document.getElementById("tneGravVolumePorRefeicao")) document.getElementById("tneGravVolumePorRefeicao").value = tne.gravitacional?.volumePorRefeicao || "";
    if (document.getElementById("tneGravQtdFrascos")) document.getElementById("tneGravQtdFrascos").value = tne.gravitacional?.quantidadeFrascosEtapas || "";
    if (document.getElementById("tneGravMetaVazao")) document.getElementById("tneGravMetaVazao").value = tne.gravitacional?.metaVazaoGotasMin || "";
    if (document.getElementById("tneBombaTempoInfusao")) document.getElementById("tneBombaTempoInfusao").value = tne.bombaInfusao?.tempoInfusaoHoras || "";
    if (document.getElementById("tneBombaMetaVazao")) document.getElementById("tneBombaMetaVazao").value = tne.bombaInfusao?.metaVazaoMlHora || "";
    if (document.getElementById("tneModuloProteico")) document.getElementById("tneModuloProteico").value = tne.moduloSuplementacaoProteica || "";

    // Tabela Nutricional Manual da TNE
    const manTne = tne.tabelaNutricionalManual || {};
    if (document.getElementById("tneManualVet")) document.getElementById("tneManualVet").value = manTne.vet ?? "";
    if (document.getElementById("tneManualCho")) document.getElementById("tneManualCho").value = manTne.cho ?? "";
    if (document.getElementById("tneManualPtn")) document.getElementById("tneManualPtn").value = manTne.ptn ?? "";
    if (document.getElementById("tneManualLip")) document.getElementById("tneManualLip").value = manTne.lip ?? "";
    if (document.getElementById("tneManualFibra")) document.getElementById("tneManualFibra").value = manTne.fibra ?? "";
    if (document.getElementById("tneManualSodio")) document.getElementById("tneManualSodio").value = manTne.sodio ?? "";
    if (document.getElementById("tneManualPotassio")) document.getElementById("tneManualPotassio").value = manTne.potassio ?? "";
    if (document.getElementById("tneManualCalcio")) document.getElementById("tneManualCalcio").value = manTne.calcio ?? "";
    if (document.getElementById("tneManualFosforo")) document.getElementById("tneManualFosforo").value = manTne.fosforo ?? "";

    // Orientações Nutricionais
    document.getElementById("prontOrientacoesGerais").value = p.orientacoesNutricionais || "";
  }

  // Coleta dados digitados pelo aluno
  function readProntuarioFromForm() {
    const p = appState.currentProntuario;
    if (!p) return null;

    // Aluno
    p.aluno.nome = document.getElementById("alunoNome").value.trim();
    p.aluno.matriculaTurma = document.getElementById("alunoMatricula").value.trim();
    p.aluno.data = document.getElementById("alunoData").value;

    // Atendimento Real: Coleta dadosPacienteReal
    if (p.isRealPatient || appState.workflowMode === "real") {
      if (!p.dadosPacienteReal) p.dadosPacienteReal = {};
      p.dadosPacienteReal.nome = document.getElementById("realPatName") ? document.getElementById("realPatName").value.trim() : "";
      p.dadosPacienteReal.idade = document.getElementById("realPatAge") ? document.getElementById("realPatAge").value.trim() : "";
      p.dadosPacienteReal.sexo = document.getElementById("realPatGender") ? document.getElementById("realPatGender").value : "Feminino";
      p.dadosPacienteReal.ocupacao = document.getElementById("realPatOccupation") ? document.getElementById("realPatOccupation").value.trim() : "";
      p.dadosPacienteReal.hipoteseDiagnostica = document.getElementById("realPatHipoteseDiagnostica") ? document.getElementById("realPatHipoteseDiagnostica").value.trim() : "";
    }

    // Anamnese & Hipótese Diagnóstica
    const hip = (document.getElementById("prontHipoteseDiagnostica") ? document.getElementById("prontHipoteseDiagnostica").value.trim() : "") ||
                (document.getElementById("realPatHipoteseDiagnostica") ? document.getElementById("realPatHipoteseDiagnostica").value.trim() : "");
    if (p.anamnese) {
      p.anamnese.hipoteseDiagnostica = hip;
    }
    if (p.isRealPatient && p.dadosPacienteReal && !p.dadosPacienteReal.hipoteseDiagnostica) {
      p.dadosPacienteReal.hipoteseDiagnostica = hip;
    }
    p.anamnese.queixaPrincipal = document.getElementById("prontQueixaPrincipal").value.trim();
    p.anamnese.historiaClinica = document.getElementById("prontHistoriaClinica").value.trim();
    p.anamnese.antecedentesMedicamentos = document.getElementById("prontAntecedentesMed").value.trim();
    p.anamnese.habitosEstiloVida = document.getElementById("prontHabitosEstiloVida").value.trim();

    // Interações Droga-Nutriente & Farmacoterapia
    if (document.getElementById("prontObsFarmacoterapia")) {
      p.observacoesFarmacoterapia = document.getElementById("prontObsFarmacoterapia").value.trim();
    }
    const drugRows = document.querySelectorAll("#drugNutrientTableBody tr:not(#drugNutrientEmptyRow)");
    if (drugRows.length > 0) {
      p.interacaoDrogaNutriente = [];
      drugRows.forEach(row => {
        const med = row.querySelector(".drug-item-med")?.value.trim() || "";
        const nutr = row.querySelector(".drug-item-nutr")?.value.trim() || "";
        const cond = row.querySelector(".drug-item-cond")?.value.trim() || "";
        if (med || nutr || cond) {
          p.interacaoDrogaNutriente.push({ medicamento: med, nutrientes: nutr, conduta: cond });
        }
      });
    }

    // Antropometria
    p.antropometria.pesoAtual = document.getElementById("prontPesoAtual").value.trim();
    p.antropometria.pesoHabitual = document.getElementById("prontPesoHabitual").value.trim();
    p.antropometria.estatura = document.getElementById("prontEstatura").value.trim();
    p.antropometria.alturaJoelho = document.getElementById("prontAlturaJoelho") ? document.getElementById("prontAlturaJoelho").value.trim() : "";
    p.antropometria.circBraco = document.getElementById("prontCircBraco") ? document.getElementById("prontCircBraco").value.trim() : "";
    p.antropometria.circCintura = document.getElementById("prontCircCintura") ? document.getElementById("prontCircCintura").value.trim() : "";
    p.antropometria.circQuadril = document.getElementById("prontCircQuadril") ? document.getElementById("prontCircQuadril").value.trim() : "";
    p.antropometria.circPanturrilha = document.getElementById("prontCircPanturrilha") ? document.getElementById("prontCircPanturrilha").value.trim() : "";
    p.antropometria.circPunho = document.getElementById("prontCircPunho") ? document.getElementById("prontCircPunho").value.trim() : "";
    p.antropometria.dobraTricipital = document.getElementById("prontDobraTricipital") ? document.getElementById("prontDobraTricipital").value.trim() : "";
    p.antropometria.dobraSubescapular = document.getElementById("prontDobraSubescapular") ? document.getElementById("prontDobraSubescapular").value.trim() : "";
    p.antropometria.dobraBicipital = document.getElementById("prontDobraBicipital") ? document.getElementById("prontDobraBicipital").value.trim() : "";
    p.antropometria.dobraSuprailiaca = document.getElementById("prontDobraSuprailiaca") ? document.getElementById("prontDobraSuprailiaca").value.trim() : "";
    p.antropometria.dobraAbdominal = document.getElementById("prontDobraAbdominal") ? document.getElementById("prontDobraAbdominal").value.trim() : "";
    p.antropometria.dobraCoxa = document.getElementById("prontDobraCoxa") ? document.getElementById("prontDobraCoxa").value.trim() : "";
    p.antropometria.demaisAvaliacoes = document.getElementById("prontDemaisAvaliacoes") ? document.getElementById("prontDemaisAvaliacoes").value.trim() : "";
    p.antropometria.imc = document.getElementById("calculatedImcDisplay").textContent.trim();
    p.antropometria.classificacaoImc = document.getElementById("calculatedImcClassDisplay").textContent.trim();
    p.antropometria.diagnosticoNutricionalExtenso = document.getElementById("calculatedImcExtensoDisplay") ? document.getElementById("calculatedImcExtensoDisplay").textContent.trim() : "";
    p.antropometria.percentualPerda = document.getElementById("calculatedLossDisplay").textContent.trim();
    p.antropometria.circunferenciasDobras = document.getElementById("prontCircunferencias").value.trim();

    // Bioquímica (Tabela Moderna de 4 Colunas e Raciocínio Clínico)
    if (!p.bioquimica) p.bioquimica = {};
    if (!p.bioquimica.interpretacoes) p.bioquimica.interpretacoes = {};
    const bioTextareas = document.querySelectorAll("#studentBioTableBody .student-bio-interp");
    bioTextareas.forEach(ta => {
      const examName = ta.dataset.exam;
      if (examName) {
        p.bioquimica.interpretacoes[examName] = ta.value.trim();
      }
    });
    syncBioquimicaExamesRelevantesText();
    if (document.getElementById("prontExamesRelevantes")) {
      p.bioquimica.examesRelevantes = document.getElementById("prontExamesRelevantes").value.trim();
    }
    if (document.getElementById("prontInterpretacaoBioq")) {
      p.bioquimica.interpretacaoNutricional = document.getElementById("prontInterpretacaoBioq").value.trim();
    }

    // Exame Físico
    p.exameFisico.sinaisClinicos = document.getElementById("prontSinaisClinicos").value.trim();
    p.exameFisico.massaMuscularAdiposa = document.getElementById("prontMassaMuscular").value.trim();
    p.exameFisico.condicoesTGIeEdemas = document.getElementById("prontTGIEdemas").value.trim();

    // Consumo Alimentar (Recordatório de 24h)
    p.consumoAlimentar.vetRecordatorio = document.getElementById("prontVetRecordatorio") ? document.getElementById("prontVetRecordatorio").value.trim() : "";
    p.consumoAlimentar.inqueritoResumo = document.getElementById("prontInqueritoResumo").value.trim();
    p.consumoAlimentar.aguaPreferenciasAversoes = document.getElementById("prontAguaPreferencias").value.trim();
    p.consumoAlimentar.refeicoesRecordatorio = readRecordatorioFromDOM();

    // Diagnóstico PES
    p.diagnosticoPES.problema = document.getElementById("prontPesProblema").value.trim();
    p.diagnosticoPES.etiologia = document.getElementById("prontPesEtiologia").value.trim();
    p.diagnosticoPES.sinaisSintomas = document.getElementById("prontPesSinais").value.trim();
    p.diagnosticoPES.textoCompletoPES = document.getElementById("prontPesTextoCompleto").value.trim();
    p.diagnosticoPES.objetivosDietoterapicos = document.getElementById("prontObjetivosDietoterapicos")?.value.trim() || "";

    // Cálculos de Necessidades
    if (!p.calculoNecessidades) p.calculoNecessidades = {};
    const formulasSel = [];
    document.querySelectorAll(".calc-formula-checkbox").forEach(cb => {
      if (cb.checked && cb.dataset.formula) {
        formulasSel.push(cb.dataset.formula);
      }
    });
    p.calculoNecessidades.formulasSelecionadas = formulasSel;
    p.calculoNecessidades.bolso = {
      minKcalKg: document.getElementById("calcBolsoMinKcalKg")?.value.trim() || "",
      maxKcalKg: document.getElementById("calcBolsoMaxKcalKg")?.value.trim() || "",
      resultadoKcal: document.getElementById("calcBolsoResultadoKcal")?.value.trim() || ""
    };
    p.calculoNecessidades.harrisBenedict = {
      resultadoKcal: document.getElementById("calcHarrisResultadoKcal")?.value.trim() || ""
    };
    p.calculoNecessidades.mifflin = {
      resultadoKcal: document.getElementById("calcMifflinResultadoKcal")?.value.trim() || ""
    };
    p.calculoNecessidades.eerIom = {
      resultadoKcal: document.getElementById("calcEerResultadoKcal")?.value.trim() || ""
    };
    p.calculoNecessidades.faoOms = {
      resultadoKcal: document.getElementById("calcFaoResultadoKcal")?.value.trim() || ""
    };
    p.calculoNecessidades.vetPlanejadoKcal = document.getElementById("prontCalcVetPlanejado")?.value.trim() || "";
    p.calculoNecessidades.justificativaEscolha = document.getElementById("prontCalcJustificativa")?.value.trim() || "";
    p.calculoNecessidades.taxaMetabolicaCalculada = document.getElementById("dispTaxaMetabolicaCalculada")?.textContent.replace(" kcal/kg", "").trim() || "";

    // Prescrição Dietoterápica
    p.prescricaoDietoterapica.vetKcal = document.getElementById("prontVetKcal").value.trim();
    p.prescricaoDietoterapica.regraBolsoKcalKg = document.getElementById("prontRegraBolso").value.trim();
    p.prescricaoDietoterapica.distribuicaoMacros = {
      cho: {
        minPct: document.getElementById("prontChoMinPct")?.value.trim() || "45",
        maxPct: document.getElementById("prontChoMaxPct")?.value.trim() || "55"
      },
      ptn: {
        minPct: document.getElementById("prontPtnMinPct")?.value.trim() || "15",
        maxPct: document.getElementById("prontPtnMaxPct")?.value.trim() || "20"
      },
      lip: {
        minPct: document.getElementById("prontLipMinPct")?.value.trim() || "25",
        maxPct: document.getElementById("prontLipMaxPct")?.value.trim() || "30"
      }
    };
    p.prescricaoDietoterapica.recomendacaoProteinaGKg = {
      minGKg: document.getElementById("prontPtnMinGKg")?.value.trim() || "1.0",
      maxGKg: document.getElementById("prontPtnMaxGKg")?.value.trim() || "1.2"
    };
    updatePrescriptionCalculations();

    p.prescricaoDietoterapica.carboidratosG = document.getElementById("prontChoG")?.value.trim() || "";
    p.prescricaoDietoterapica.carboidratosPct = document.getElementById("prontChoPct")?.value.trim() || "";
    p.prescricaoDietoterapica.proteinasG = document.getElementById("prontPtnG")?.value.trim() || "";
    p.prescricaoDietoterapica.proteinasGKg = document.getElementById("prontPtnGKg")?.value.trim() || "";
    p.prescricaoDietoterapica.proteinasPct = document.getElementById("prontPtnPct")?.value.trim() || "";
    p.prescricaoDietoterapica.lipidiosG = document.getElementById("prontLipG")?.value.trim() || "";
    p.prescricaoDietoterapica.lipidiosPct = document.getElementById("prontLipPct")?.value.trim() || "";
    const selectOralCons = document.getElementById("prontCardapioConsistencia")?.value || "";
    const customOralCons = document.getElementById("prontCardapioConsistenciaCustom")?.value.trim() || "";
    const finalOralCons = selectOralCons === "Personalizada" && customOralCons ? customOralCons : (selectOralCons || document.getElementById("prontConsistencia")?.value || "Dieta Livre / Normal");
    p.consistenciaDietaOral = finalOralCons;
    p.prescricaoDietoterapica.consistencia = finalOralCons;
    p.prescricaoDietoterapica.fracionamento = document.getElementById("prontFracionamento").value;
    p.prescricaoDietoterapica.fibrasMicronutrientes = document.getElementById("prontFibrasMicronutrientes").value.trim();
    p.prescricaoDietoterapica.justificativaFisiopatologica = document.getElementById("prontJustificativa").value.trim();

    // Planejamento Alimentar (Cardápio Oral)
    p.planejamentoAlimentar = readCardapioFromDOM();

    // Terapia Nutricional Enteral (TNE)
    const viaAlimentacao = document.querySelector('input[name="prontViaAlimentacao"]:checked')?.value || "oral";
    p.tne = {
      viaAlimentacao: viaAlimentacao,
      nomeComercial: document.getElementById("tneNomeComercial")?.value.trim() || "",
      tipoDieta: document.getElementById("tneTipoDieta")?.value.trim() || "",
      densidadeCalorica: document.getElementById("tneDensidadeCalorica")?.value.trim() || "",
      fracionamento: document.getElementById("tneFracionamento")?.value.trim() || "",
      viaAdministracao: document.getElementById("tneViaAdministracao")?.value || "gravitacional",
      gravitacional: {
        volumePorRefeicao: document.getElementById("tneGravVolumePorRefeicao")?.value.trim() || "",
        quantidadeFrascosEtapas: document.getElementById("tneGravQtdFrascos")?.value.trim() || "",
        metaVazaoGotasMin: document.getElementById("tneGravMetaVazao")?.value.trim() || ""
      },
      bombaInfusao: {
        tempoInfusaoHoras: document.getElementById("tneBombaTempoInfusao")?.value.trim() || "",
        metaVazaoMlHora: document.getElementById("tneBombaMetaVazao")?.value.trim() || ""
      },
      tabelaNutricionalManual: {
        vet: document.getElementById("tneManualVet")?.value.trim() || "",
        cho: document.getElementById("tneManualCho")?.value.trim() || "",
        ptn: document.getElementById("tneManualPtn")?.value.trim() || "",
        lip: document.getElementById("tneManualLip")?.value.trim() || "",
        fibra: document.getElementById("tneManualFibra")?.value.trim() || "",
        sodio: document.getElementById("tneManualSodio")?.value.trim() || "",
        potassio: document.getElementById("tneManualPotassio")?.value.trim() || "",
        calcio: document.getElementById("tneManualCalcio")?.value.trim() || "",
        fosforo: document.getElementById("tneManualFosforo")?.value.trim() || ""
      },
      moduloSuplementacaoProteica: document.getElementById("tneModuloProteico")?.value.trim() || ""
    };

    // Orientações Nutricionais
    p.orientacoesNutricionais = document.getElementById("prontOrientacoesGerais").value.trim();

    // Questões avaliativas
    const questions = appState.currentCase?.questoesAvaliativas || [];
    p.respostasQuestoes = {};
    questions.forEach(q => {
      const textarea = document.getElementById(`resp_quest_${q.id}`);
      if (textarea) {
        p.respostasQuestoes[q.id] = textarea.value.trim();
      }
    });

    return p;
  }

  // Estima estatura pela fórmula de Chumlea (1985)
  function estimateChumleaStature(aj, age, gender) {
    return prontuarioManager.estimateChumleaStature(aj, age, gender);
  }

  // Atualiza cálculos antropométricos em tempo real (Chumlea, IMC dinâmico e Diagnóstico por Extenso)
  function updateAnthropometricCalculations() {
    const pesoAtual = document.getElementById("prontPesoAtual")?.value || "";
    const pesoHabitual = document.getElementById("prontPesoHabitual")?.value || "";
    const estatura = document.getElementById("prontEstatura")?.value || "";
    const aj = document.getElementById("prontAlturaJoelho")?.value || "";
    const cb = document.getElementById("prontCircBraco")?.value || "";
    const cp = document.getElementById("prontCircPanturrilha")?.value || "";
    const dcse = document.getElementById("prontDobraSubescapular")?.value || "";

    const idade = appState.currentCase?.patient?.age || 40;
    const genero = appState.currentCase?.patient?.gender || "Feminino";

    // 1. Estatura Efetiva: se tem estatura direta informada, usa direta; senão estima por Chumlea (1985)
    let estVal = null;
    let estOrigem = "Aguardando estatura ou AJ";
    let estM = null;

    if (estatura && !isNaN(parseFloat(estatura.replace(",", ".")))) {
      let h = parseFloat(estatura.replace(",", "."));
      if (h > 100) h = h / 100;
      estVal = h.toFixed(2);
      estOrigem = "Estatura Real (Aferida)";
      estM = h;
    } else if (aj) {
      const chumEst = prontuarioManager.estimateChumleaStature(aj, idade, genero);
      if (chumEst) {
        estVal = chumEst.m;
        estOrigem = `Chumlea 1985 (AJ: ${aj} cm, Idade: ${idade}a)`;
        estM = chumEst.rawM;
      }
    }

    // 2. Peso Efetivo: se tem peso direto informado, usa direto; senão estima por Chumlea (CB + AJ)
    let pesoVal = null;
    let pesoOrigem = "Aguardando peso ou CB + AJ";
    let pesoKg = null;

    if (pesoAtual && !isNaN(parseFloat(pesoAtual.replace(",", ".")))) {
      let w = parseFloat(pesoAtual.replace(",", "."));
      pesoVal = w.toFixed(1);
      pesoOrigem = "Peso Real (Aferido)";
      pesoKg = w;
    } else if (cb && aj) {
      const chumPeso = prontuarioManager.estimateChumleaWeight(cb, aj, genero, cp, dcse);
      if (chumPeso) {
        pesoVal = chumPeso.kg;
        pesoOrigem = `${chumPeso.metodo} (CB: ${cb} cm, AJ: ${aj} cm)`;
        pesoKg = chumPeso.rawKg;
      }
    }

    // Atualiza displays de Estatura e Peso Efetivos
    const dispEst = document.getElementById("dispEstaturaEfetiva");
    const dispEstOrigem = document.getElementById("dispEstaturaOrigem");
    if (dispEst) dispEst.textContent = estVal ? `${estVal} m` : "--";
    if (dispEstOrigem) dispEstOrigem.textContent = estOrigem;

    const dispPeso = document.getElementById("dispPesoEfetivo");
    const dispPesoOrigem = document.getElementById("dispPesoOrigem");
    if (dispPeso) dispPeso.textContent = pesoVal ? `${pesoVal} kg` : "--";
    if (dispPesoOrigem) dispPesoOrigem.textContent = pesoOrigem;

    // Helper de sugestão no campo de AJ
    const chumleaHelper = document.getElementById("ajChumleaHelper");
    const chumleaVal = document.getElementById("ajChumleaValue");
    if (chumleaHelper && chumleaVal) {
      const chumEst = prontuarioManager.estimateChumleaStature(aj, idade, genero);
      if (chumEst) {
        chumleaVal.textContent = `${chumEst.m} m (${chumEst.cm} cm)`;
        chumleaHelper.classList.remove("hidden");
      } else {
        chumleaHelper.classList.add("hidden");
      }
    }

    // 3. Cálculo do IMC com Peso e Estatura (reais ou estimados)
    const imcResult = prontuarioManager.calculateIMC(pesoKg, estM, idade);
    const imcDisp = document.getElementById("calculatedImcDisplay");
    const imcClassDisp = document.getElementById("calculatedImcClassDisplay");
    const imcExtensoDisp = document.getElementById("calculatedImcExtensoDisplay");
    const criterioTag = document.getElementById("calculatedCriterioTag");

    if (imcDisp) imcDisp.textContent = imcResult.imc || "--";
    if (imcClassDisp) {
      imcClassDisp.textContent = imcResult.classificacao || "Aguardando peso e altura";
      if (imcResult.statusColor === "emerald") {
        imcClassDisp.className = "font-bold text-emerald-700 text-xs ml-2";
      } else if (imcResult.statusColor === "amber") {
        imcClassDisp.className = "font-bold text-amber-700 text-xs ml-2";
      } else if (imcResult.statusColor === "rose") {
        imcClassDisp.className = "font-bold text-rose-700 text-xs ml-2";
      } else {
        imcClassDisp.className = "font-bold text-slate-500 text-xs ml-2";
      }
    }
    if (imcExtensoDisp) {
      imcExtensoDisp.textContent = imcResult.diagnosticoExtenso;
      if (imcResult.statusColor === "emerald") {
        imcExtensoDisp.className = "font-bold text-xs text-emerald-900 leading-snug mt-0.5";
      } else if (imcResult.statusColor === "amber") {
        imcExtensoDisp.className = "font-bold text-xs text-amber-900 leading-snug mt-0.5";
      } else if (imcResult.statusColor === "rose") {
        imcExtensoDisp.className = "font-bold text-xs text-rose-900 leading-snug mt-0.5";
      } else {
        imcExtensoDisp.className = "font-bold text-xs text-slate-700 leading-snug mt-0.5";
      }
    }
    if (criterioTag) {
      criterioTag.textContent = imcResult.criterio || (idade >= 60 ? "Lipschitz (1994)" : "OMS");
    }

    // 4. Perda Ponderal (compara habitual com real ou estimado)
    const lossResult = prontuarioManager.calculateWeightLoss(pesoHabitual, pesoKg);
    const lossDisp = document.getElementById("calculatedLossDisplay");
    const lossClassDisp = document.getElementById("calculatedLossClassDisplay");
    if (lossDisp) lossDisp.textContent = lossResult.percentual ? `${lossResult.percentual}%` : "--";
    if (lossClassDisp) lossClassDisp.textContent = lossResult.interpretacao || "-";

    // Grava no prontuário atual se existir
    if (appState.currentProntuario?.antropometria) {
      const a = appState.currentProntuario.antropometria;
      a.pesoEfetivo = pesoVal || "";
      a.estaturaEfetiva = estVal || "";
      a.origemDadosAntro = `Peso: ${pesoOrigem} | Estatura: ${estOrigem}`;
      a.imc = imcResult.imc || "";
      a.classificacaoImc = imcResult.classificacao || "";
      a.diagnosticoNutricionalExtenso = imcResult.diagnosticoExtenso || "";
      a.criterioClassificacao = imcResult.criterio || "";
    }
    updateCalculoNecessidadesDisplay();
  }

  // Atualiza avaliação quantitativa do consumo alimentar e adequação energética do VET
  function updateVetAdequacyCalculations() {
    const vetInput = document.getElementById("prontVetRecordatorio")?.value || "";
    const neeCaso = appState.currentCase?.neeKcal || 2000;

    const res = prontuarioManager.calculateVetAdequacy(vetInput, neeCaso);

    const dispVet = document.getElementById("dispVetRecordatorioVal");
    const dispNee = document.getElementById("dispNeeCasoVal");
    const dispPct = document.getElementById("dispAdequacaoVetPct");
    const dispClass = document.getElementById("dispAdequacaoVetClass");
    const dispInterp = document.getElementById("dispAdequacaoVetInterpretacao");

    if (dispVet) dispVet.textContent = vetInput ? vetInput : "--";
    if (dispNee) dispNee.textContent = neeCaso ? neeCaso : "--";
    if (dispPct) dispPct.textContent = res.percentual ? res.percentual : "--";
    if (dispClass) {
      dispClass.textContent = res.classificacao;
      if (res.statusColor === "emerald") {
        dispClass.className = "text-[10px] font-bold text-emerald-700 block mt-0.5";
      } else if (res.statusColor === "amber") {
        dispClass.className = "text-[10px] font-bold text-amber-700 block mt-0.5";
      } else if (res.statusColor === "rose") {
        dispClass.className = "text-[10px] font-bold text-rose-700 block mt-0.5";
      } else {
        dispClass.className = "text-[10px] font-bold text-slate-500 block mt-0.5";
      }
    }
    if (dispInterp) dispInterp.textContent = res.interpretacao;

    if (appState.currentProntuario?.consumoAlimentar) {
      const c = appState.currentProntuario.consumoAlimentar;
      c.vetRecordatorio = vetInput;
      c.neeCaso = neeCaso;
      c.adequacaoVetPct = res.percentual || "";
      c.adequacaoVetClassificacao = res.classificacao || "";
    }
  }

  // Inicializa o buscador de alimentos da Tabela Oficial TACO
  function setupTacoSearch() {
    const input = document.getElementById("tacoSearchInput");
    const container = document.getElementById("tacoSearchResults");
    if (!input || !container) return;

    function renderTacoList(filter = "") {
      const list = window.TACO_FOODS_DATABASE || [];
      const term = filter.toLowerCase().trim();
      const filtered = list.filter(f => !term || f.nome.toLowerCase().includes(term) || f.categoria.toLowerCase().includes(term));

      if (filtered.length === 0) {
        container.innerHTML = `<div class="text-slate-400 text-center py-2 text-xs">Nenhum alimento encontrado na base oficial TACO para "${filter}".</div>`;
        return;
      }

      container.innerHTML = filtered.map(item => `
        <div class="py-1.5 px-2 flex items-center justify-between hover:bg-emerald-50/60 rounded transition">
          <div>
            <div class="flex items-center space-x-1.5">
              <strong class="text-slate-800 text-xs">${escapeHtml(item.nome)}</strong>
              <span class="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">${escapeHtml(item.categoria)}</span>
            </div>
            <div class="text-[10px] text-slate-500 mt-0.5">
              Porção: <span class="text-slate-700 font-medium">${escapeHtml(item.porcao)}</span> • 
              <strong class="text-emerald-800">${item.kcal} kcal</strong> • 
              CHO: ${item.cho}g • PTN: ${item.ptn}g • LIP: ${item.lip}g • Fibras: ${item.fibra || 0}g
            </div>
          </div>
          <button type="button" class="btn-copy-taco text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold px-2.5 py-1 rounded transition ml-2 whitespace-nowrap shadow-2xs" data-food="${escapeHtml(item.nome + ' (' + item.porcao + ': ' + item.kcal + ' kcal, CHO ' + item.cho + 'g, PTN ' + item.ptn + 'g, LIP ' + item.lip + 'g)')}">
            + Inserir no R24h
          </button>
        </div>
      `).join("");

      container.querySelectorAll(".btn-copy-taco").forEach(btn => {
        btn.addEventListener("click", () => {
          const foodText = btn.getAttribute("data-food");
          const resumoTextarea = document.getElementById("prontInqueritoResumo");
          if (resumoTextarea) {
            const current = resumoTextarea.value.trim();
            resumoTextarea.value = current ? `${current}\n- ${foodText}` : `- ${foodText}`;
            showToast("Item da TACO inserido no Recordatório!");
            triggerProntuarioAutoSave();
          }
        });
      });
    }

    input.addEventListener("input", () => {
      renderTacoList(input.value);
    });

    renderTacoList("");
  }

  // Obtém a lista oficial de alimentos TACO isolada
  function getTacoFoodsList() {
    if (typeof TACO_DATABASE !== "undefined" && Array.isArray(TACO_DATABASE)) {
      return TACO_DATABASE;
    }
    if (typeof window !== "undefined" && Array.isArray(window.TACO_DATABASE)) {
      return window.TACO_DATABASE;
    }
    return [];
  }

  // Obtém o peso adotado/efetivo do paciente de forma robusta
  function getEffectivePatientWeight() {
    const dispPesoTxt = document.getElementById("dispPesoEfetivo")?.textContent?.replace("kg", "").trim();
    if (dispPesoTxt && !isNaN(parseFloat(dispPesoTxt.replace(",", ".")))) {
      return parseFloat(dispPesoTxt.replace(",", "."));
    }
    const formPeso = document.getElementById("prontPesoAtual")?.value?.trim();
    if (formPeso && !isNaN(parseFloat(formPeso.replace(",", ".")))) {
      return parseFloat(formPeso.replace(",", "."));
    }
    if (appState.currentCase?.patient?.weight) {
      const caseW = parseFloat(String(appState.currentCase.patient.weight).replace(",", "."));
      if (!isNaN(caseW)) return caseW;
    }
    return null;
  }

  // Atualiza em tempo real o VET planejado, taxa metabólica resultante (kcal/kg) e espelhamento na Prescrição
  function updateCalculoNecessidadesDisplay() {
    const vetInput = document.getElementById("prontCalcVetPlanejado");
    const vetRaw = vetInput ? vetInput.value.trim() : "";
    const vet = vetRaw ? parseFloat(vetRaw.replace(",", ".")) : 0;

    const peso = getEffectivePatientWeight();

    const dispTaxa = document.getElementById("dispTaxaMetabolicaCalculada");
    const dispPesoInfo = document.getElementById("dispTaxaMetabolicaPesoInfo");
    const prescVetInput = document.getElementById("prontVetKcal");
    const prescRegraBolso = document.getElementById("prontRegraBolso");

    let taxaStr = "--";
    if (vet > 0 && peso > 0) {
      const taxa = (vet / peso).toFixed(1);
      taxaStr = `${taxa} kcal/kg`;
      if (dispTaxa) dispTaxa.textContent = taxaStr;
      if (dispPesoInfo) dispPesoInfo.textContent = `(Baseado em ${peso} kg)`;
      if (prescRegraBolso) prescRegraBolso.value = `${taxa} kcal/kg (Peso: ${peso} kg)`;
    } else {
      if (dispTaxa) dispTaxa.textContent = "-- kcal/kg";
      if (dispPesoInfo) dispPesoInfo.textContent = "(Baseado no peso atual)";
      if (prescRegraBolso) prescRegraBolso.value = vet > 0 ? `${vet} kcal/dia` : "";
    }

    // Espelhamento direto e bloqueio na aba Prescrição Dietética
    if (prescVetInput) {
      prescVetInput.value = vet > 0 ? `${vet} kcal/dia` : "";
    }

    // Salva no objeto atual do prontuário
    if (appState.currentProntuario?.calculoNecessidades) {
      appState.currentProntuario.calculoNecessidades.vetPlanejadoKcal = vetRaw;
      appState.currentProntuario.calculoNecessidades.taxaMetabolicaCalculada = taxaStr !== "--" ? taxaStr : "";
    }
    if (appState.currentProntuario?.prescricaoDietoterapica) {
      appState.currentProntuario.prescricaoDietoterapica.vetKcal = prescVetInput ? prescVetInput.value : "";
      appState.currentProntuario.prescricaoDietoterapica.regraBolsoKcalKg = prescRegraBolso ? prescRegraBolso.value : "";
    }

    // Dispara recálculo da prescrição
    updatePrescriptionCalculations();
  }
  window.updateCalculoNecessidadesDisplay = updateCalculoNecessidadesDisplay;

  // Atualiza em tempo real a tabela dinâmica da prescrição e cálculo de proteína g/kg
  function updatePrescriptionCalculations() {
    const vetRaw = document.getElementById("prontVetKcal")?.value || "";
    const vetMatch = vetRaw.match(/[\d.,]+/);
    const vet = vetMatch ? parseFloat(vetMatch[0].replace(",", ".")) : 0;

    const choMinPct = document.getElementById("prontChoMinPct")?.value || "45";
    const choMaxPct = document.getElementById("prontChoMaxPct")?.value || "55";
    const ptnMinPct = document.getElementById("prontPtnMinPct")?.value || "15";
    const ptnMaxPct = document.getElementById("prontPtnMaxPct")?.value || "20";
    const lipMinPct = document.getElementById("prontLipMinPct")?.value || "25";
    const lipMaxPct = document.getElementById("prontLipMaxPct")?.value || "30";

    const distribuicaoInput = {
      cho: { minPct: choMinPct, maxPct: choMaxPct },
      ptn: { minPct: ptnMinPct, maxPct: ptnMaxPct },
      lip: { minPct: lipMinPct, maxPct: lipMaxPct }
    };

    const distCalc = prontuarioManager.calculatePrescriptionDistribution(vet, distribuicaoInput);

    // Atualiza ranges na tabela dinâmica
    const dispChoKcal = document.getElementById("dispChoKcalRange");
    const dispChoG = document.getElementById("dispChoGramasRange");
    const dispPtnKcal = document.getElementById("dispPtnKcalRange");
    const dispPtnG = document.getElementById("dispPtnGramasRange");
    const dispLipKcal = document.getElementById("dispLipKcalRange");
    const dispLipG = document.getElementById("dispLipGramasRange");

    if (dispChoKcal) dispChoKcal.textContent = vet > 0 ? `${distCalc.cho.minKcal} a ${distCalc.cho.maxKcal} kcal` : "-- kcal";
    if (dispChoG) dispChoG.textContent = vet > 0 ? `${distCalc.cho.minG}g a ${distCalc.cho.maxG}g` : "-- g";

    if (dispPtnKcal) dispPtnKcal.textContent = vet > 0 ? `${distCalc.ptn.minKcal} a ${distCalc.ptn.maxKcal} kcal` : "-- kcal";
    if (dispPtnG) dispPtnG.textContent = vet > 0 ? `${distCalc.ptn.minG}g a ${distCalc.ptn.maxG}g` : "-- g";

    if (dispLipKcal) dispLipKcal.textContent = vet > 0 ? `${distCalc.lip.minKcal} a ${distCalc.lip.maxKcal} kcal` : "-- kcal";
    if (dispLipG) dispLipG.textContent = vet > 0 ? `${distCalc.lip.minG}g a ${distCalc.lip.maxG}g` : "-- g";

    // Cálculo da Proteína g/kg com o peso adotado do paciente
    const pesoPaciente = getEffectivePatientWeight();

    const ptnMinGKg = document.getElementById("prontPtnMinGKg")?.value || "1.0";
    const ptnMaxGKg = document.getElementById("prontPtnMaxGKg")?.value || "1.2";

    const protExpected = prontuarioManager.calculateProteinGKgExpected(pesoPaciente, ptnMinGKg, ptnMaxGKg);

    const dispPtnExpTotal = document.getElementById("dispPtnGKgExpectedTotal");
    const dispPtnWeightRef = document.getElementById("dispPtnGKgWeightRef");

    if (dispPtnExpTotal) {
      if (protExpected.peso > 0 && protExpected.minTotalG > 0) {
        dispPtnExpTotal.textContent = `${protExpected.minTotalG}g a ${protExpected.maxTotalG}g`;
      } else {
        dispPtnExpTotal.textContent = "-- g a -- g";
      }
    }
    if (dispPtnWeightRef) {
      dispPtnWeightRef.textContent = protExpected.peso > 0 ? `(Peso adotado: ${protExpected.peso} kg)` : "(Aguardando peso do paciente)";
    }

    // Salva no estado
    if (appState.currentProntuario?.prescricaoDietoterapica) {
      const p = appState.currentProntuario.prescricaoDietoterapica;
      p.distribuicaoMacros = distCalc;
      p.recomendacaoProteinaGKg = {
        minGKg: ptnMinGKg,
        maxGKg: ptnMaxGKg,
        minTotalG: protExpected.minTotalG,
        maxTotalG: protExpected.maxTotalG
      };
      // Retrocompatibilidade de campos em texto
      if (document.getElementById("prontChoG")) document.getElementById("prontChoG").value = `${distCalc.cho.minG}-${distCalc.cho.maxG}g`;
      if (document.getElementById("prontChoPct")) document.getElementById("prontChoPct").value = `${choMinPct}-${choMaxPct}%`;
      if (document.getElementById("prontPtnG")) document.getElementById("prontPtnG").value = `${distCalc.ptn.minG}-${distCalc.ptn.maxG}g`;
      if (document.getElementById("prontPtnPct")) document.getElementById("prontPtnPct").value = `${ptnMinPct}-${ptnMaxPct}%`;
      if (document.getElementById("prontPtnGKg")) document.getElementById("prontPtnGKg").value = `${ptnMinGKg}-${ptnMaxGKg} g/kg`;
      if (document.getElementById("prontLipG")) document.getElementById("prontLipG").value = `${distCalc.lip.minG}-${distCalc.lip.maxG}g`;
      if (document.getElementById("prontLipPct")) document.getElementById("prontLipPct").value = `${lipMinPct}-${lipMaxPct}%`;
    }

    // Conecta imediatamente com os painéis do Recordatório e do Cardápio para atualizar os alertas e réguas
    updateRecordatorioTotalsDisplay();
    updateCardapioTotalsDisplay();
  }

  // Renderiza as refeições do Recordatório de 24h com mecânica idêntica à do Cardápio
  function renderRecordatorioMeals() {
    const container = document.getElementById("recordatorioMealsContainer");
    if (!container) return;

    if (!appState.currentProntuario?.consumoAlimentar?.refeicoesRecordatorio || appState.currentProntuario.consumoAlimentar.refeicoesRecordatorio.length === 0) {
      if (!appState.currentProntuario.consumoAlimentar) {
        appState.currentProntuario.consumoAlimentar = {};
      }
      appState.currentProntuario.consumoAlimentar.refeicoesRecordatorio = [
        { id: "rec-1", refeicao: "Desjejum / Café da Manhã", horario: "07:00", tipoPreparacao: "", itens: [], substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
        { id: "rec-2", refeicao: "Colação / Lanche da Manhã", horario: "09:30", tipoPreparacao: "", itens: [], substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
        { id: "rec-3", refeicao: "Almoço", horario: "12:30", tipoPreparacao: "", itens: [], substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
        { id: "rec-4", refeicao: "Lanche da Tarde", horario: "16:00", tipoPreparacao: "", itens: [], substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
        { id: "rec-5", refeicao: "Jantar", horario: "19:30", tipoPreparacao: "", itens: [], substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
        { id: "rec-6", refeicao: "Ceia", horario: "22:00", tipoPreparacao: "", itens: [], substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } }
      ];
    }

    const list = appState.currentProntuario.consumoAlimentar.refeicoesRecordatorio;
    container.innerHTML = "";

    list.forEach((meal, mealIdx) => {
      meal.itens = meal.itens || [];
      const subtotal = prontuarioManager.calculateMealSubtotal(meal);
      meal.subtotal = subtotal;

      const card = document.createElement("div");
      card.className = "recordatorio-meal-card bg-white border border-indigo-200 rounded-xl p-3.5 shadow-2xs space-y-3 transition";
      card.dataset.mealId = meal.id || `rec-${mealIdx + 1}`;
      card.dataset.mealIdx = mealIdx;

      // Cabeçalho da refeição
      let headerHtml = `
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2">
          <div class="flex items-center space-x-2 flex-1 min-w-[200px]">
            <span class="text-base">🍎</span>
            <input type="text" class="rec-ref-name font-bold text-slate-800 text-xs sm:text-sm border border-transparent hover:border-slate-300 focus:border-indigo-600 rounded px-1.5 py-0.5 bg-transparent flex-1" value="${escapeHtml(meal.refeicao || `Refeição ${mealIdx + 1}`)}">
            <input type="time" class="rec-ref-time text-xs border border-slate-300 rounded px-2 py-0.5 w-24 bg-white" value="${escapeHtml(meal.horario || '08:00')}">
          </div>
          <div class="flex items-center space-x-2">
            <span class="rec-subtotal-badge text-[11px] font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-2xs">
              ${subtotal.kcal} kcal | CHO: ${subtotal.cho}g | PTN: ${subtotal.ptn}g | LIP: ${subtotal.lip}g
            </span>
            <button type="button" class="remove-rec-meal-btn text-slate-400 hover:text-rose-600 p-1 text-sm rounded transition cursor-pointer" data-meal-idx="${mealIdx}" title="Excluir esta refeição do R24h">
              🗑️
            </button>
          </div>
        </div>
        <div class="bg-indigo-50/40 border border-indigo-100 rounded-lg p-2 flex items-center space-x-2">
          <label class="text-[11px] font-bold text-indigo-950 whitespace-nowrap flex items-center space-x-1">
            <span>🍳</span>
            <span>Tipo de Preparação (opcional):</span>
          </label>
          <input type="text" class="rec-ref-tipo-prep w-full border border-indigo-200 rounded px-2.5 py-1 text-xs bg-white text-slate-800 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium" placeholder="Ex: Café com leite e pão com manteiga..." value="${escapeHtml(meal.tipoPreparacao || '')}">
        </div>
      `;

      // Tabela de itens do Recordatório
      let itemsTableHtml = `
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
              <tr>
                <th class="py-1.5 px-2 min-w-[200px]">Alimento Oficial (TACO)</th>
                <th class="py-1.5 px-2 min-w-[170px]">Medida Caseira (Texto Livre)</th>
                <th class="py-1.5 px-2 text-right w-24">Gramatura (g)</th>
                <th class="py-1.5 px-2 text-right w-16 text-indigo-900 font-bold">Kcal</th>
                <th class="py-1.5 px-2 text-right w-16 text-amber-800">CHO</th>
                <th class="py-1.5 px-2 text-right w-16 text-sky-800">PTN</th>
                <th class="py-1.5 px-2 text-right w-16 text-rose-800">LIP</th>
                <th class="py-1.5 px-1 text-center w-8">Ação</th>
              </tr>
            </thead>
            <tbody class="recordatorio-items-tbody divide-y divide-slate-100">
      `;

      if (meal.itens.length === 0) {
        itemsTableHtml += `
          <tr class="empty-rec-items-row">
            <td colspan="8" class="text-center py-2.5 text-slate-400 italic text-[11px]">
              Nenhum alimento referido nesta refeição. Clique no botão abaixo para adicionar itens da TACO.
            </td>
          </tr>
        `;
      } else {
        meal.itens.forEach((it, itIdx) => {
          itemsTableHtml += `
            <tr class="rec-item-row hover:bg-slate-50/80 transition" data-item-id="${it.id || `rec-it-${itIdx}`}" data-item-idx="${itIdx}">
              <td class="py-1.5 px-2">
                <select class="rec-item-food w-full border border-slate-300 rounded px-1.5 py-1 text-xs bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600">
                  ${buildTacoSelectOptions(it.tacoId)}
                </select>
              </td>
              <td class="py-1.5 px-2">
                <input type="text" class="rec-item-medida w-full border border-slate-300 rounded px-2 py-1 text-xs placeholder:text-slate-400 focus:border-indigo-600" placeholder="Ex: 1 xícara, 2 colheres..." value="${escapeHtml(it.medidaCaseira || '')}" title="Medida Caseira: texto descritivo livre, não interfere nos cálculos">
              </td>
              <td class="py-1.5 px-2 text-right">
                <input type="number" min="0" step="5" class="rec-item-gramas w-20 border border-slate-300 rounded px-1.5 py-1 text-xs text-right font-bold text-slate-800 focus:border-indigo-600" placeholder="g" value="${it.gramatura || ''}">
              </td>
              <td class="py-1.5 px-2 text-right font-bold text-indigo-900 rec-item-kcal">${it.kcal !== undefined ? it.kcal : 0}</td>
              <td class="py-1.5 px-2 text-right font-semibold text-slate-700 rec-item-cho">${it.cho !== undefined ? it.cho : 0}</td>
              <td class="py-1.5 px-2 text-right font-semibold text-slate-700 rec-item-ptn">${it.ptn !== undefined ? it.ptn : 0}</td>
              <td class="py-1.5 px-2 text-right font-semibold text-slate-700 rec-item-lip">${it.lip !== undefined ? it.lip : 0}</td>
              <td class="py-1.5 px-1 text-center">
                <button type="button" class="remove-rec-item-btn text-rose-400 hover:text-rose-700 font-bold px-1 text-xs cursor-pointer" data-meal-idx="${mealIdx}" data-item-idx="${itIdx}" title="Remover alimento">
                  ✕
                </button>
              </td>
            </tr>
          `;
        });
      }

      itemsTableHtml += `
            </tbody>
          </table>
        </div>
      `;

      // Rodapé da refeição
      let footerHtml = `
        <div class="flex items-center justify-between pt-1 border-t border-indigo-50">
          <button type="button" class="add-rec-food-btn bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition" data-meal-idx="${mealIdx}">
            <span>➕</span>
            <span>Adicionar Alimento no R24h (TACO)</span>
          </button>
        </div>
      `;

      card.innerHTML = headerHtml + itemsTableHtml + footerHtml;
      container.appendChild(card);
    });

    attachRecordatorioEventListeners();
    readRecordatorioFromDOM();
  }

  function attachRecordatorioEventListeners() {
    const container = document.getElementById("recordatorioMealsContainer");
    if (!container) return;

    // 1. Mudança no alimento selecionado da TACO
    container.querySelectorAll(".rec-item-food").forEach(select => {
      select.addEventListener("change", (e) => {
        const row = e.target.closest(".rec-item-row");
        if (!row) return;
        const foodId = e.target.value;
        const food = (typeof getTacoFoodById === "function") ? getTacoFoodById(foodId) : getTacoFoodsList().find(f => f.id === foodId);

        const gramasInput = row.querySelector(".rec-item-gramas");
        const medidaInput = row.querySelector(".rec-item-medida");

        if (food && food.porcaoSugerida && (!medidaInput.value || !medidaInput.value.trim())) {
          medidaInput.placeholder = `Sugestão: ${food.porcaoSugerida}`;
        }

        const gramas = parseFloat(gramasInput.value.replace(",", ".")) || 0;
        const nutri = prontuarioManager.calculateItemNutrition(food, gramas);

        row.querySelector(".rec-item-kcal").textContent = nutri.kcal;
        row.querySelector(".rec-item-cho").textContent = nutri.cho;
        row.querySelector(".rec-item-ptn").textContent = nutri.ptn;
        row.querySelector(".rec-item-lip").textContent = nutri.lip;

        readRecordatorioFromDOM();
      });
    });

    // 2. Gramatura (g) -> Regra de três da TACO
    container.querySelectorAll(".rec-item-gramas").forEach(input => {
      input.addEventListener("input", (e) => {
        const row = e.target.closest(".rec-item-row");
        if (!row) return;

        const foodSelect = row.querySelector(".rec-item-food");
        const foodId = foodSelect ? foodSelect.value : "";
        const food = (typeof getTacoFoodById === "function") ? getTacoFoodById(foodId) : getTacoFoodsList().find(f => f.id === foodId);

        const gramas = parseFloat(e.target.value.replace(",", ".")) || 0;
        const nutri = prontuarioManager.calculateItemNutrition(food, gramas);

        row.querySelector(".rec-item-kcal").textContent = nutri.kcal;
        row.querySelector(".rec-item-cho").textContent = nutri.cho;
        row.querySelector(".rec-item-ptn").textContent = nutri.ptn;
        row.querySelector(".rec-item-lip").textContent = nutri.lip;

        readRecordatorioFromDOM();
      });
    });

    // 3. Medida Caseira Livre
    container.querySelectorAll(".rec-item-medida").forEach(input => {
      input.addEventListener("input", () => {
        readRecordatorioFromDOM();
      });
    });

    // 4. Edição de nomes, horários, tipo preparação
    container.querySelectorAll(".rec-ref-name, .rec-ref-time, .rec-ref-tipo-prep").forEach(input => {
      input.addEventListener("input", () => {
        readRecordatorioFromDOM();
      });
    });

    // 5. Botão Adicionar Alimento
    container.querySelectorAll(".add-rec-food-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        readRecordatorioFromDOM();
        const mealIdx = parseInt(e.currentTarget.dataset.mealIdx);
        if (!isNaN(mealIdx) && appState.currentProntuario?.consumoAlimentar?.refeicoesRecordatorio?.[mealIdx]) {
          const meal = appState.currentProntuario.consumoAlimentar.refeicoesRecordatorio[mealIdx];
          meal.itens = meal.itens || [];
          meal.itens.push({
            id: `rec-it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            tacoId: "",
            alimentoNome: "",
            medidaCaseira: "",
            gramatura: "",
            kcal: 0,
            cho: 0,
            ptn: 0,
            lip: 0,
            fibra: 0,
            calcio: 0,
            ferro: 0,
            sodio: 0,
            potassio: 0
          });
          renderRecordatorioMeals();
        }
      });
    });

    // 6. Botão Remover Alimento
    container.querySelectorAll(".remove-rec-item-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        readRecordatorioFromDOM();
        const mealIdx = parseInt(e.currentTarget.dataset.mealIdx);
        const itemIdx = parseInt(e.currentTarget.dataset.itemIdx);
        if (!isNaN(mealIdx) && !isNaN(itemIdx) && appState.currentProntuario?.consumoAlimentar?.refeicoesRecordatorio?.[mealIdx]?.itens) {
          appState.currentProntuario.consumoAlimentar.refeicoesRecordatorio[mealIdx].itens.splice(itemIdx, 1);
          renderRecordatorioMeals();
        }
      });
    });

    // 7. Botão Remover Refeição do Recordatório
    container.querySelectorAll(".remove-rec-meal-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        readRecordatorioFromDOM();
        const mealIdx = parseInt(e.currentTarget.dataset.mealIdx);
        if (!isNaN(mealIdx) && appState.currentProntuario?.consumoAlimentar?.refeicoesRecordatorio) {
          appState.currentProntuario.consumoAlimentar.refeicoesRecordatorio.splice(mealIdx, 1);
          renderRecordatorioMeals();
        }
      });
    });
  }

  // Lê os dados do Recordatório do DOM
  function readRecordatorioFromDOM() {
    const container = document.getElementById("recordatorioMealsContainer");
    const list = [];
    if (container && container.querySelectorAll(".recordatorio-meal-card").length > 0) {
      const cards = container.querySelectorAll(".recordatorio-meal-card");
      cards.forEach((card, mealIdx) => {
        const refName = card.querySelector(".rec-ref-name")?.value.trim() || `Refeição ${mealIdx + 1}`;
        const refTime = card.querySelector(".rec-ref-time")?.value.trim() || "08:00";
        const refTipoPrep = card.querySelector(".rec-ref-tipo-prep")?.value.trim() || "";

        const itens = [];
        card.querySelectorAll(".rec-item-row").forEach(row => {
          const tacoSelect = row.querySelector(".rec-item-food");
          const tacoId = tacoSelect ? tacoSelect.value : "";
          const food = (typeof getTacoFoodById === "function") ? getTacoFoodById(tacoId) : getTacoFoodsList().find(f => f.id === tacoId);
          const alimentoNome = food ? food.nome : "";

          const medidaInput = row.querySelector(".rec-item-medida");
          const medidaCaseira = medidaInput ? medidaInput.value.trim() : "";

          const gramasInput = row.querySelector(".rec-item-gramas");
          const gramatura = parseFloat(gramasInput?.value?.replace(",", ".")) || 0;

          const nutri = prontuarioManager.calculateItemNutrition(food, gramatura);

          itens.push({
            id: row.dataset.itemId || `rec-it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            tacoId: tacoId,
            alimentoNome: alimentoNome,
            medidaCaseira: medidaCaseira,
            gramatura: gramatura,
            kcal: nutri.kcal,
            cho: nutri.cho,
            ptn: nutri.ptn,
            lip: nutri.lip,
            fibra: nutri.fibra,
            calcio: nutri.calcio,
            ferro: nutri.ferro,
            sodio: nutri.sodio,
            potassio: nutri.potassio
          });
        });

        const mealObj = {
          id: card.dataset.mealId || `rec-${mealIdx + 1}`,
          refeicao: refName,
          horario: refTime,
          tipoPreparacao: refTipoPrep,
          itens: itens,
          substituicoes: ""
        };

        mealObj.subtotal = prontuarioManager.calculateMealSubtotal(mealObj);
        mealObj.alimentos = prontuarioManager.formatMealFoodsSummary(mealObj);
        list.push(mealObj);
      });
    }

    if (appState.currentProntuario?.consumoAlimentar) {
      appState.currentProntuario.consumoAlimentar.refeicoesRecordatorio = list;
    }

    updateRecordatorioTotalsDisplay();
    return list;
  }

  // Atualiza painel consolidado do Recordatório (macros, micros e régua de status da prescrição)
  function updateRecordatorioTotalsDisplay() {
    const list = appState.currentProntuario?.consumoAlimentar?.refeicoesRecordatorio || [];
    const pesoPaciente = getEffectivePatientWeight();

    const prescVetRaw = document.getElementById("prontVetKcal")?.value || "";
    const prescVetMatch = prescVetRaw.match(/[\d.,]+/);
    const prescVet = prescVetMatch ? parseFloat(prescVetMatch[0].replace(",", ".")) : null;

    const prescDist = appState.currentProntuario?.prescricaoDietoterapica?.distribuicaoMacros || null;
    const totals = prontuarioManager.calculateNutritionalTotals(list, pesoPaciente, prescVet, prescDist);

    if (appState.currentProntuario?.consumoAlimentar) {
      appState.currentProntuario.consumoAlimentar.totaisRecordatorio = totals;
    }

    const dispVet = document.getElementById("dispRecVetTotal");
    const dispMeta = document.getElementById("dispRecMetaVet");
    const dispAdeq = document.getElementById("dispRecVetAdeq");
    const dispBadge = document.getElementById("dispRecVetStatusBadge");

    const dispChoG = document.getElementById("dispRecChoTotalG");
    const dispChoPct = document.getElementById("dispRecChoTotalPct");
    const dispMetaCho = document.getElementById("dispRecMetaCho");
    const dispChoStatus = document.getElementById("dispRecChoStatusBadge");

    const dispPtnG = document.getElementById("dispRecPtnTotalG");
    const dispPtnPct = document.getElementById("dispRecPtnTotalPct");
    const dispPtnGKg = document.getElementById("dispRecPtnGKg");
    const dispMetaPtn = document.getElementById("dispRecMetaPtn");
    const dispPtnStatus = document.getElementById("dispRecPtnStatusBadge");

    const dispLipG = document.getElementById("dispRecLipTotalG");
    const dispLipPct = document.getElementById("dispRecLipTotalPct");
    const dispMetaLip = document.getElementById("dispRecMetaLip");
    const dispLipStatus = document.getElementById("dispRecLipStatusBadge");

    const dispFibra = document.getElementById("dispRecFibraTotal");
    const dispBalancoMsg = document.getElementById("dispRecBalancoMsg");

    if (dispVet) dispVet.textContent = totals.vetTotalKcal || 0;
    if (dispMeta) dispMeta.textContent = prescVet ? `${prescVet}` : "--";
    if (dispAdeq) dispAdeq.textContent = totals.adequacaoVetPct > 0 ? `${totals.adequacaoVetPct}%` : "--%";

    if (dispBadge) {
      if (!prescVet || totals.vetTotalKcal === 0) {
        dispBadge.className = "text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-900 text-indigo-200 border border-indigo-700";
        dispBadge.textContent = totals.vetTotalKcal > 0 ? "Aguardando VET na Prescrição" : "Aguardando Alimentos";
      } else if (totals.adequacaoVetPct < 90) {
        dispBadge.className = "text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-900";
        dispBadge.textContent = `Consumo Hipocalórico (${totals.adequacaoVetPct}%)`;
      } else if (totals.adequacaoVetPct <= 110) {
        dispBadge.className = "text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white";
        dispBadge.textContent = `Consumo Adequado (${totals.adequacaoVetPct}%)`;
      } else {
        dispBadge.className = "text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500 text-white";
        dispBadge.textContent = `Consumo Hipercalórico (${totals.adequacaoVetPct}%)`;
      }
    }

    if (dispChoG) dispChoG.textContent = totals.carboidratosG || 0;
    if (dispChoPct) dispChoPct.textContent = totals.carboidratosPct || 0;
    if (dispMetaCho) {
      if (prescDist?.cho?.minG && prescDist?.cho?.maxG) {
        dispMetaCho.textContent = `${prescDist.cho.minG}g - ${prescDist.cho.maxG}g`;
      } else {
        dispMetaCho.textContent = document.getElementById("prontChoG")?.value || "--";
      }
    }
    if (dispChoStatus && totals.statusMacros?.cho) {
      dispChoStatus.textContent = totals.statusMacros.cho.label;
      dispChoStatus.className = `text-[9px] font-bold px-1.5 py-0.5 rounded border ${totals.statusMacros.cho.badgeClass}`;
    }

    if (dispPtnG) dispPtnG.textContent = totals.proteinasG || 0;
    if (dispPtnPct) dispPtnPct.textContent = totals.proteinasPct || 0;
    if (dispPtnGKg) dispPtnGKg.textContent = totals.proteinasGKg ? `${totals.proteinasGKg} g/kg` : "0 g/kg";
    if (dispMetaPtn) {
      if (prescDist?.ptn?.minG && prescDist?.ptn?.maxG) {
        dispMetaPtn.textContent = `${prescDist.ptn.minG}g - ${prescDist.ptn.maxG}g`;
      } else {
        dispMetaPtn.textContent = document.getElementById("prontPtnG")?.value || "--";
      }
    }
    if (dispPtnStatus && totals.statusMacros?.ptn) {
      dispPtnStatus.textContent = totals.statusMacros.ptn.label;
      dispPtnStatus.className = `text-[9px] font-bold px-1.5 py-0.5 rounded border ${totals.statusMacros.ptn.badgeClass}`;
    }

    if (dispLipG) dispLipG.textContent = totals.lipidiosG || 0;
    if (dispLipPct) dispLipPct.textContent = totals.lipidiosPct || 0;
    if (dispMetaLip) {
      if (prescDist?.lip?.minG && prescDist?.lip?.maxG) {
        dispMetaLip.textContent = `${prescDist.lip.minG}g - ${prescDist.lip.maxG}g`;
      } else {
        dispMetaLip.textContent = document.getElementById("prontLipG")?.value || "--";
      }
    }
    if (dispLipStatus && totals.statusMacros?.lip) {
      dispLipStatus.textContent = totals.statusMacros.lip.label;
      dispLipStatus.className = `text-[9px] font-bold px-1.5 py-0.5 rounded border ${totals.statusMacros.lip.badgeClass}`;
    }

    if (dispFibra) dispFibra.textContent = (totals.fibrasG || 0).toFixed(1);

    // Micronutrientes do Recordatório
    const dispCalcio = document.getElementById("dispRecCalcioTotal");
    const dispFerro = document.getElementById("dispRecFerroTotal");
    const dispSodio = document.getElementById("dispRecSodioTotal");
    const dispPotassio = document.getElementById("dispRecPotassioTotal");
    if (dispCalcio) dispCalcio.textContent = totals.calcioMg || 0;
    if (dispFerro) dispFerro.textContent = totals.ferroMg || 0;
    if (dispSodio) dispSodio.textContent = totals.sodioMg || 0;
    if (dispPotassio) dispPotassio.textContent = totals.potassioMg || 0;

    if (dispBalancoMsg) {
      if (totals.vetTotalKcal === 0) {
        dispBalancoMsg.textContent = "Insira os alimentos para comparar com a régua da prescrição.";
      } else if (prescVet) {
        dispBalancoMsg.textContent = `Recordatório totalizado em ${totals.vetTotalKcal} kcal (${totals.adequacaoVetPct}% da meta prescrita).`;
      } else {
        dispBalancoMsg.textContent = `Recordatório totalizado em ${totals.vetTotalKcal} kcal. Defina a prescrição para verificar as faixas adequadas.`;
      }
    }

    // Atualiza automaticamente o campo VET do Recordatório e a adequação da NEE se alimentos foram inseridos
    const vetInput = document.getElementById("prontVetRecordatorio");
    if (vetInput && totals.vetTotalKcal > 0) {
      vetInput.value = totals.vetTotalKcal;
      updateVetAdequacyCalculations();
    }
  }

  // Atualiza em tempo real o painel consolidado do cardápio/TNE vs metas prescritas
  function updateCardapioTotalsDisplay() {
    const viaAlimentacao = document.querySelector('input[name="prontViaAlimentacao"]:checked')?.value || appState.currentProntuario?.tne?.viaAlimentacao || "oral";
    const isTne = viaAlimentacao === "tne";
    const pesoPaciente = getEffectivePatientWeight();

    const prescVetRaw = document.getElementById("prontVetKcal")?.value || "";
    const prescVetMatch = prescVetRaw.match(/[\d.,]+/);
    const prescVet = prescVetMatch ? parseFloat(prescVetMatch[0].replace(",", ".")) : null;

    const prescDist = appState.currentProntuario?.prescricaoDietoterapica?.distribuicaoMacros || null;

    const dispTitle = document.getElementById("dispCardapioTotalsTitle");
    let totals;

    if (isTne) {
      if (dispTitle) dispTitle.textContent = "Consolidação Nutricional da TNE & Suplementação vs Metas Prescritas";
      const manualData = {
        vet: document.getElementById("tneManualVet")?.value ?? appState.currentProntuario?.tne?.tabelaNutricionalManual?.vet ?? "",
        cho: document.getElementById("tneManualCho")?.value ?? appState.currentProntuario?.tne?.tabelaNutricionalManual?.cho ?? "",
        ptn: document.getElementById("tneManualPtn")?.value ?? appState.currentProntuario?.tne?.tabelaNutricionalManual?.ptn ?? "",
        lip: document.getElementById("tneManualLip")?.value ?? appState.currentProntuario?.tne?.tabelaNutricionalManual?.lip ?? "",
        fibra: document.getElementById("tneManualFibra")?.value ?? appState.currentProntuario?.tne?.tabelaNutricionalManual?.fibra ?? "",
        sodio: document.getElementById("tneManualSodio")?.value ?? appState.currentProntuario?.tne?.tabelaNutricionalManual?.sodio ?? "",
        potassio: document.getElementById("tneManualPotassio")?.value ?? appState.currentProntuario?.tne?.tabelaNutricionalManual?.potassio ?? "",
        calcio: document.getElementById("tneManualCalcio")?.value ?? appState.currentProntuario?.tne?.tabelaNutricionalManual?.calcio ?? "",
        fosforo: document.getElementById("tneManualFosforo")?.value ?? appState.currentProntuario?.tne?.tabelaNutricionalManual?.fosforo ?? ""
      };
      totals = prontuarioManager.calculateTneManualNutritionalTotals(manualData, pesoPaciente, prescVet, prescDist);
    } else {
      if (dispTitle) dispTitle.textContent = "Consolidação Nutricional do Cardápio Oral vs Metas Prescritas";
      const list = appState.currentProntuario?.planejamentoAlimentar || [];
      totals = prontuarioManager.calculateNutritionalTotals(list, pesoPaciente, prescVet, prescDist);
    }

    if (appState.currentProntuario) {
      appState.currentProntuario.totaisCardapio = totals;
    }

    const dispVet = document.getElementById("dispCardapioVetTotal");
    const dispMeta = document.getElementById("dispCardapioMetaVet");
    const dispAdeq = document.getElementById("dispCardapioVetAdeq");
    const dispBadge = document.getElementById("dispCardapioVetStatusBadge");
    const dispChoG = document.getElementById("dispCardapioChoTotalG");
    const dispChoPct = document.getElementById("dispCardapioChoTotalPct");
    const dispMetaCho = document.getElementById("dispCardapioMetaCho");
    const dispPtnG = document.getElementById("dispCardapioPtnTotalG");
    const dispPtnPct = document.getElementById("dispCardapioPtnTotalPct");
    const dispPtnGKg = document.getElementById("dispCardapioPtnGKg");
    const dispMetaPtn = document.getElementById("dispCardapioMetaPtn");
    const dispLipG = document.getElementById("dispCardapioLipTotalG");
    const dispLipPct = document.getElementById("dispCardapioLipTotalPct");
    const dispMetaLip = document.getElementById("dispCardapioMetaLip");
    const dispFibra = document.getElementById("dispCardapioFibraTotal");
    const dispBalancoMsg = document.getElementById("dispCardapioBalancoMsg");

    if (dispVet) dispVet.textContent = totals.vetTotalKcal || 0;
    if (dispMeta) dispMeta.textContent = prescVet ? `${prescVet}` : "--";
    if (dispAdeq) dispAdeq.textContent = totals.adequacaoVetPct > 0 ? `${totals.adequacaoVetPct}%` : "--%";

    if (dispBadge) {
      if (!prescVet || totals.vetTotalKcal === 0) {
        dispBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300";
        dispBadge.textContent = totals.vetTotalKcal > 0 ? "Defina a meta de VET" : "Aguardando Itens";
      } else if (totals.adequacaoVetPct < 90) {
        dispBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-900";
        dispBadge.textContent = `Hipocalórico (${totals.adequacaoVetPct}%)`;
      } else if (totals.adequacaoVetPct <= 110) {
        dispBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white";
        dispBadge.textContent = `Adequado / Eucalórico (${totals.adequacaoVetPct}%)`;
      } else {
        dispBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white";
        dispBadge.textContent = `Hipercalórico (${totals.adequacaoVetPct}%)`;
      }
    }

    if (dispChoG) dispChoG.textContent = totals.carboidratosG || 0;
    if (dispChoPct) dispChoPct.textContent = totals.carboidratosPct || 0;
    if (dispMetaCho) {
      if (prescDist?.cho?.minG && prescDist?.cho?.maxG) {
        dispMetaCho.textContent = `${prescDist.cho.minG}g - ${prescDist.cho.maxG}g`;
      } else {
        dispMetaCho.textContent = document.getElementById("prontChoG")?.value || "--";
      }
    }
    const dispChoStatus = document.getElementById("dispCardapioChoStatusBadge");
    if (dispChoStatus && totals.statusMacros?.cho) {
      dispChoStatus.textContent = totals.statusMacros.cho.label;
      dispChoStatus.className = `text-[9px] font-bold px-1.5 py-0.5 rounded border ${totals.statusMacros.cho.badgeClass}`;
    }

    if (dispPtnG) dispPtnG.textContent = totals.proteinasG || 0;
    if (dispPtnPct) dispPtnPct.textContent = totals.proteinasPct || 0;
    if (dispPtnGKg) dispPtnGKg.textContent = totals.proteinasGKg ? `${totals.proteinasGKg} g/kg` : "0 g/kg";
    if (dispMetaPtn) {
      if (prescDist?.ptn?.minG && prescDist?.ptn?.maxG) {
        dispMetaPtn.textContent = `${prescDist.ptn.minG}g - ${prescDist.ptn.maxG}g`;
      } else {
        dispMetaPtn.textContent = document.getElementById("prontPtnG")?.value || "--";
      }
    }
    const dispPtnStatus = document.getElementById("dispCardapioPtnStatusBadge");
    if (dispPtnStatus && totals.statusMacros?.ptn) {
      dispPtnStatus.textContent = totals.statusMacros.ptn.label;
      dispPtnStatus.className = `text-[9px] font-bold px-1.5 py-0.5 rounded border ${totals.statusMacros.ptn.badgeClass}`;
    }

    if (dispLipG) dispLipG.textContent = totals.lipidiosG || 0;
    if (dispLipPct) dispLipPct.textContent = totals.lipidiosPct || 0;
    if (dispMetaLip) {
      if (prescDist?.lip?.minG && prescDist?.lip?.maxG) {
        dispMetaLip.textContent = `${prescDist.lip.minG}g - ${prescDist.lip.maxG}g`;
      } else {
        dispMetaLip.textContent = document.getElementById("prontLipG")?.value || "--";
      }
    }
    const dispLipStatus = document.getElementById("dispCardapioLipStatusBadge");
    if (dispLipStatus && totals.statusMacros?.lip) {
      dispLipStatus.textContent = totals.statusMacros.lip.label;
      dispLipStatus.className = `text-[9px] font-bold px-1.5 py-0.5 rounded border ${totals.statusMacros.lip.badgeClass}`;
    }

    if (dispFibra) dispFibra.textContent = (totals.fibrasG || 0).toFixed(1);

    // Micronutrientes Consolidados
    const dispCalcio = document.getElementById("dispCardapioCalcioTotal");
    const dispFerro = document.getElementById("dispCardapioFerroTotal");
    const dispSodio = document.getElementById("dispCardapioSodioTotal");
    const dispPotassio = document.getElementById("dispCardapioPotassioTotal");
    const dispFosforo = document.getElementById("dispCardapioFosforoTotal");
    if (dispCalcio) dispCalcio.textContent = totals.calcioMg || 0;
    if (dispFerro) dispFerro.textContent = isTne ? "--" : (totals.ferroMg || 0);
    if (dispSodio) dispSodio.textContent = totals.sodioMg || 0;
    if (dispPotassio) dispPotassio.textContent = totals.potassioMg || 0;
    if (dispFosforo) dispFosforo.textContent = totals.fosforoMg ?? (isTne ? 0 : "--");

    if (dispBalancoMsg) {
      if (totals.vetTotalKcal === 0) {
        dispBalancoMsg.textContent = isTne
          ? "Preencha a Tabela Nutricional Manual da TNE para confrontar os totais com a prescrição."
          : "Adicione alimentos às refeições para confrontar os totais com a prescrição.";
      } else if (prescVet) {
        dispBalancoMsg.textContent = `${isTne ? 'TNE' : 'Cardápio'} consolidado com ${totals.vetTotalKcal} kcal (${totals.adequacaoVetPct}% da meta de ${prescVet} kcal).`;
      } else {
        dispBalancoMsg.textContent = `${isTne ? 'TNE' : 'Cardápio'} consolidado com ${totals.vetTotalKcal} kcal. Defina o VET na aba Prescrição para o cálculo de adequação.`;
      }
    }
  }

  // Lê os dados digitados na interface do cardápio do DOM
  function readCardapioFromDOM() {
    const mealsContainer = document.getElementById("cardapioMealsContainer");
    const list = [];

    if (mealsContainer && mealsContainer.querySelectorAll(".cardapio-meal-card").length > 0) {
      const mealCards = mealsContainer.querySelectorAll(".cardapio-meal-card");
      mealCards.forEach((card, mealIdx) => {
        const refName = card.querySelector(".cardapio-ref-name")?.value.trim() || `Refeição ${mealIdx + 1}`;
        const refTime = card.querySelector(".cardapio-ref-time")?.value.trim() || "08:00";
        const refTipoPrep = card.querySelector(".cardapio-ref-tipo-prep")?.value.trim() || "";
        const refSubs = card.querySelector(".cardapio-ref-subs")?.value.trim() || "";

        const itens = [];
        const itemRows = card.querySelectorAll(".cardapio-item-row");
        itemRows.forEach(row => {
          const tacoSelect = row.querySelector(".cardapio-item-food");
          const tacoId = tacoSelect ? tacoSelect.value : "";
          const food = (typeof getTacoFoodById === "function") ? getTacoFoodById(tacoId) : getTacoFoodsList().find(f => f.id === tacoId);
          const alimentoNome = food ? food.nome : "";

          const medidaInput = row.querySelector(".cardapio-item-medida");
          const medidaCaseira = medidaInput ? medidaInput.value.trim() : ""; 

          const gramasInput = row.querySelector(".cardapio-item-gramas");
          const gramasVal = gramasInput ? gramasInput.value.trim() : "";
          const gramatura = parseFloat(gramasVal.replace(",", ".")) || 0;

          // Regra de três da TACO
          const nutri = prontuarioManager.calculateItemNutrition(food, gramatura);

          itens.push({
            id: row.dataset.itemId || `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            tacoId: tacoId,
            alimentoNome: alimentoNome,
            medidaCaseira: medidaCaseira,
            gramatura: gramatura,
            kcal: nutri.kcal,
            cho: nutri.cho,
            ptn: nutri.ptn,
            lip: nutri.lip,
            fibra: nutri.fibra,
            calcio: nutri.calcio,
            ferro: nutri.ferro,
            sodio: nutri.sodio,
            potassio: nutri.potassio
          });
        });

        const mealObj = {
          id: card.dataset.mealId || `ref-${mealIdx + 1}`,
          refeicao: refName,
          horario: refTime,
          tipoPreparacao: refTipoPrep,
          itens: itens,
          substituicoes: refSubs
        };

        mealObj.subtotal = prontuarioManager.calculateMealSubtotal(mealObj);
        mealObj.alimentos = prontuarioManager.formatMealFoodsSummary(mealObj);

        list.push(mealObj);
      });
    } else {
      // Fallback para tabela legada caso o container não exista
      const legacyRows = document.querySelectorAll("#cardapioTableBody tr");
      legacyRows.forEach(row => {
        const refInput = row.querySelector(".cardapio-ref");
        const timeInput = row.querySelector(".cardapio-time");
        const foodsInput = row.querySelector(".cardapio-foods");
        const subsInput = row.querySelector(".cardapio-subs");
        if (refInput) {
          list.push({
            refeicao: refInput.value.trim(),
            horario: timeInput ? timeInput.value.trim() : "08:00",
            tipoPreparacao: "",
            itens: [],
            alimentos: foodsInput ? foodsInput.value.trim() : "",
            substituicoes: subsInput ? subsInput.value.trim() : "",
            subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 }
          });
        }
      });
    }

    if (appState.currentProntuario) {
      appState.currentProntuario.planejamentoAlimentar = list;
    }

    updateCardapioTotalsDisplay();
    return list;
  }

  // Gera as opções do dropdown de alimentos TACO agrupados por categoria
  function buildTacoSelectOptions(selectedTacoId = "") {
    const foods = getTacoFoodsList();
    const categories = {};

    foods.forEach(f => {
      const cat = f.categoria || "Outros";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(f);
    });

    let html = `<option value="">-- Selecione o alimento da TACO --</option>`;
    Object.keys(categories).sort().forEach(cat => {
      html += `<optgroup label="${escapeHtml(cat)}">`;
      categories[cat].forEach(f => {
        const isSel = f.id === selectedTacoId ? "selected" : "";
        html += `<option value="${escapeHtml(f.id)}" ${isSel}>${escapeHtml(f.nome)} (100g = ${f.kcal} kcal, CHO ${f.cho}g, PTN ${f.ptn}g, LIP ${f.lip}g)</option>`;
      });
      html += `</optgroup>`;
    });

    return html;
  }

  // Renderiza a estrutura completa do cardápio com suporte a TACO, tipo de preparação, regra de três e medida caseira
  function renderCardapioTable() {
    const container = document.getElementById("cardapioMealsContainer");
    if (!container) return;

    if (!appState.currentProntuario.planejamentoAlimentar || appState.currentProntuario.planejamentoAlimentar.length === 0) {
      appState.currentProntuario.planejamentoAlimentar = [
        { id: "ref-1", refeicao: "Desjejum / Café da Manhã", horario: "07:00", tipoPreparacao: "", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
        { id: "ref-2", refeicao: "Colação / Lanche da Manhã", horario: "09:30", tipoPreparacao: "", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
        { id: "ref-3", refeicao: "Almoço", horario: "12:30", tipoPreparacao: "", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
        { id: "ref-4", refeicao: "Lanche da Tarde", horario: "16:00", tipoPreparacao: "", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
        { id: "ref-5", refeicao: "Jantar", horario: "19:30", tipoPreparacao: "", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
        { id: "ref-6", refeicao: "Ceia", horario: "22:00", tipoPreparacao: "", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } }
      ];
    }

    const list = appState.currentProntuario.planejamentoAlimentar;
    container.innerHTML = "";

    list.forEach((meal, mealIdx) => {
      meal.itens = meal.itens || [];
      const subtotal = prontuarioManager.calculateMealSubtotal(meal);
      meal.subtotal = subtotal;

      const card = document.createElement("div");
      card.className = "cardapio-meal-card bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-3 transition";
      card.dataset.mealId = meal.id || `ref-${mealIdx + 1}`;
      card.dataset.mealIdx = mealIdx;

      // Cabeçalho da refeição: Nome/Horário seguido pelo Tipo de Preparação
      let headerHtml = `
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div class="flex items-center space-x-2 flex-1 min-w-[200px]">
            <span class="text-base">🥣</span>
            <input type="text" class="cardapio-ref-name font-bold text-slate-800 text-xs sm:text-sm border border-transparent hover:border-slate-300 focus:border-emerald-600 rounded px-1.5 py-0.5 bg-transparent flex-1" value="${escapeHtml(meal.refeicao || `Refeição ${mealIdx + 1}`)}">
            <input type="time" class="cardapio-ref-time text-xs border border-slate-300 rounded px-2 py-0.5 w-24 bg-white" value="${escapeHtml(meal.horario || '08:00')}">
          </div>
          <div class="flex items-center space-x-2">
            <span class="meal-subtotal-badge text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              ${subtotal.kcal} kcal | CHO: ${subtotal.cho}g | PTN: ${subtotal.ptn}g | LIP: ${subtotal.lip}g
            </span>
            <button type="button" class="remove-meal-btn text-slate-400 hover:text-rose-600 p-1 text-sm rounded transition cursor-pointer" data-meal-idx="${mealIdx}" title="Excluir esta refeição">
              🗑️
            </button>
          </div>
        </div>

        <!-- ESTRUTURA VISUAL: TIPO DE PREPARAÇÃO LOGO APÓS NOME/HORÁRIO -->
        <div class="bg-emerald-50/50 border border-emerald-200/80 rounded-lg p-2 flex items-center space-x-2">
          <label class="text-[11px] font-bold text-emerald-950 whitespace-nowrap flex items-center space-x-1">
            <span>🍳</span>
            <span>Tipo de Preparação:</span>
          </label>
          <input type="text" class="cardapio-ref-tipo-prep w-full border border-emerald-300 rounded px-2.5 py-1 text-xs bg-white text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium" placeholder="Ex: Vitamina de banana, Omelete de claras com aveia, Sanduíche natural, Salada mista..." value="${escapeHtml(meal.tipoPreparacao || '')}" title="Defina a preparação culinária desta refeição antes dos alimentos da TACO">
        </div>
      `;

      // Tabela de itens da refeição
      let itemsTableHtml = `
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
              <tr>
                <th class="py-1.5 px-2 min-w-[200px]">Alimento Oficial (TACO)</th>
                <th class="py-1.5 px-2 min-w-[170px]">Medida Caseira (Texto Livre)</th>
                <th class="py-1.5 px-2 text-right w-24">Gramatura (g)</th>
                <th class="py-1.5 px-2 text-right w-16 text-emerald-800 font-bold">Kcal</th>
                <th class="py-1.5 px-2 text-right w-16 text-amber-800">CHO</th>
                <th class="py-1.5 px-2 text-right w-16 text-sky-800">PTN</th>
                <th class="py-1.5 px-2 text-right w-16 text-rose-800">LIP</th>
                <th class="py-1.5 px-1 text-center w-8">Ação</th>
              </tr>
            </thead>
            <tbody class="cardapio-items-tbody divide-y divide-slate-100">
      `;

      if (meal.itens.length === 0) {
        itemsTableHtml += `
          <tr class="empty-items-row">
            <td colspan="8" class="text-center py-2.5 text-slate-400 italic text-[11px]">
              Nenhum alimento cadastrado nesta refeição. Clique no botão verde abaixo para adicionar alimentos da TACO.
            </td>
          </tr>
        `;
      } else {
        meal.itens.forEach((it, itIdx) => {
          itemsTableHtml += `
            <tr class="cardapio-item-row hover:bg-slate-50/80 transition" data-item-id="${it.id || `it-${itIdx}`}" data-item-idx="${itIdx}">
              <td class="py-1.5 px-2">
                <select class="cardapio-item-food w-full border border-slate-300 rounded px-1.5 py-1 text-xs bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600">
                  ${buildTacoSelectOptions(it.tacoId)}
                </select>
              </td>
              <td class="py-1.5 px-2">
                <input type="text" class="cardapio-item-medida w-full border border-slate-300 rounded px-2 py-1 text-xs placeholder:text-slate-400 focus:border-emerald-600" placeholder="Ex: 1 colher de sopa, 2 fatias..." value="${escapeHtml(it.medidaCaseira || '')}" title="Medida Caseira: texto descritivo livre, não interfere nos cálculos">
              </td>
              <td class="py-1.5 px-2 text-right">
                <input type="number" min="0" step="5" class="cardapio-item-gramas w-20 border border-slate-300 rounded px-1.5 py-1 text-xs text-right font-bold text-slate-800 focus:border-emerald-600" placeholder="g" value="${it.gramatura || ''}">
              </td>
              <td class="py-1.5 px-2 text-right font-bold text-emerald-800 cardapio-item-kcal">${it.kcal !== undefined ? it.kcal : 0}</td>
              <td class="py-1.5 px-2 text-right font-semibold text-slate-700 cardapio-item-cho">${it.cho !== undefined ? it.cho : 0}</td>
              <td class="py-1.5 px-2 text-right font-semibold text-slate-700 cardapio-item-ptn">${it.ptn !== undefined ? it.ptn : 0}</td>
              <td class="py-1.5 px-2 text-right font-semibold text-slate-700 cardapio-item-lip">${it.lip !== undefined ? it.lip : 0}</td>
              <td class="py-1.5 px-1 text-center">
                <button type="button" class="remove-item-btn text-rose-400 hover:text-rose-700 font-bold px-1 text-xs cursor-pointer" data-meal-idx="${mealIdx}" data-item-idx="${itIdx}" title="Remover alimento">
                  ✕
                </button>
              </td>
            </tr>
          `;
        });
      }

      itemsTableHtml += `
            </tbody>
          </table>
        </div>
      `;

      // Rodapé da refeição (botão adicionar alimento e campo de substituições)
      let footerHtml = `
        <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <button type="button" class="add-food-item-btn bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition" data-meal-idx="${mealIdx}">
            <span>➕</span>
            <span>Adicionar Alimento (TACO)</span>
          </button>
          
          <div class="flex-1 min-w-[260px]">
            <input type="text" class="cardapio-ref-subs w-full border border-slate-200 rounded px-2.5 py-1 text-xs bg-slate-50 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600" placeholder="Opções de substituição para esta refeição..." value="${escapeHtml(meal.substituicoes || '')}">
          </div>
        </div>
      `;

      card.innerHTML = headerHtml + itemsTableHtml + footerHtml;
      container.appendChild(card);
    });

    // Anexa os event listeners dinâmicos a todos os elementos renderizados
    attachCardapioEventListeners();

    // Sincroniza a tabela legada e atualiza o painel consolidado
    readCardapioFromDOM();
  }

  // Anexa event listeners com suporte a cálculos por Regra de Três em tempo real
  function attachCardapioEventListeners() {
    const container = document.getElementById("cardapioMealsContainer");
    if (!container) return;

    // 1. Mudança no alimento selecionado da TACO
    container.querySelectorAll(".cardapio-item-food").forEach(select => {
      select.addEventListener("change", (e) => {
        const row = e.target.closest(".cardapio-item-row");
        if (!row) return;
        const foodId = e.target.value;
        const food = (typeof getTacoFoodById === "function") ? getTacoFoodById(foodId) : getTacoFoodsList().find(f => f.id === foodId);
        
        const gramasInput = row.querySelector(".cardapio-item-gramas");
        const medidaInput = row.querySelector(".cardapio-item-medida");

        // Se o aluno ainda não digitou medida caseira e a TACO possui porção sugerida, sugere
        if (food && food.porcaoSugerida && (!medidaInput.value || !medidaInput.value.trim())) {
          medidaInput.placeholder = `Sugestão: ${food.porcaoSugerida}`;
        }

        const gramas = parseFloat(gramasInput.value.replace(",", ".")) || 0;
        const nutri = prontuarioManager.calculateItemNutrition(food, gramas);

        row.querySelector(".cardapio-item-kcal").textContent = nutri.kcal;
        row.querySelector(".cardapio-item-cho").textContent = nutri.cho;
        row.querySelector(".cardapio-item-ptn").textContent = nutri.ptn;
        row.querySelector(".cardapio-item-lip").textContent = nutri.lip;

        readCardapioFromDOM();
      });
    });

    // 2. Digitação na Gramatura (g) -> Dispara Regra de Três da TACO instantaneamente
    container.querySelectorAll(".cardapio-item-gramas").forEach(input => {
      input.addEventListener("input", (e) => {
        const row = e.target.closest(".cardapio-item-row");
        if (!row) return;

        const foodSelect = row.querySelector(".cardapio-item-food");
        const foodId = foodSelect ? foodSelect.value : "";
        const food = (typeof getTacoFoodById === "function") ? getTacoFoodById(foodId) : getTacoFoodsList().find(f => f.id === foodId);

        const gramas = parseFloat(e.target.value.replace(",", ".")) || 0;
        const nutri = prontuarioManager.calculateItemNutrition(food, gramas);

        row.querySelector(".cardapio-item-kcal").textContent = nutri.kcal;
        row.querySelector(".cardapio-item-cho").textContent = nutri.cho;
        row.querySelector(".cardapio-item-ptn").textContent = nutri.ptn;
        row.querySelector(".cardapio-item-lip").textContent = nutri.lip;

        // Atualiza os subtotais da refeição e consolidação global
        readCardapioFromDOM();
      });
    });

    // 3. Medida Caseira Livre -> Atualiza texto sem acionar cálculos matemáticos
    container.querySelectorAll(".cardapio-item-medida").forEach(input => {
      input.addEventListener("input", () => {
        readCardapioFromDOM();
      });
    });

    // 4. Edição de nomes, horários, tipo preparação e substituições
    container.querySelectorAll(".cardapio-ref-name, .cardapio-ref-time, .cardapio-ref-tipo-prep, .cardapio-ref-subs").forEach(input => {
      input.addEventListener("input", () => {
        readCardapioFromDOM();
      });
    });

    // 5. Botão de Adicionar Alimento da TACO à refeição
    container.querySelectorAll(".add-food-item-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        readCardapioFromDOM();
        const mealIdx = parseInt(e.currentTarget.dataset.mealIdx);
        if (!isNaN(mealIdx) && appState.currentProntuario?.planejamentoAlimentar?.[mealIdx]) {
          const meal = appState.currentProntuario.planejamentoAlimentar[mealIdx];
          meal.itens = meal.itens || [];
          meal.itens.push({
            id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            tacoId: "",
            alimentoNome: "",
            medidaCaseira: "",
            gramatura: "",
            kcal: 0,
            cho: 0,
            ptn: 0,
            lip: 0,
            fibra: 0,
            calcio: 0,
            ferro: 0,
            sodio: 0,
            potassio: 0
          });
          renderCardapioTable();
        }
      });
    });

    // 6. Botão de Remover Alimento da refeição
    container.querySelectorAll(".remove-item-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        readCardapioFromDOM();
        const mealIdx = parseInt(e.currentTarget.dataset.mealIdx);
        const itemIdx = parseInt(e.currentTarget.dataset.itemIdx);
        if (!isNaN(mealIdx) && !isNaN(itemIdx) && appState.currentProntuario?.planejamentoAlimentar?.[mealIdx]?.itens) {
          appState.currentProntuario.planejamentoAlimentar[mealIdx].itens.splice(itemIdx, 1);
          renderCardapioTable();
        }
      });
    });

    // 7. Botão de Remover Refeição completa
    container.querySelectorAll(".remove-meal-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        readCardapioFromDOM();
        const mealIdx = parseInt(e.currentTarget.dataset.mealIdx);
        if (!isNaN(mealIdx) && appState.currentProntuario?.planejamentoAlimentar) {
          appState.currentProntuario.planejamentoAlimentar.splice(mealIdx, 1);
          renderCardapioTable();
        }
      });
    });
  }

  // Adicionar nova refeição ao cardápio
  const addMealBtn = document.getElementById("addCardapioMealBtn");
  if (addMealBtn) {
    addMealBtn.addEventListener("click", () => {
      readCardapioFromDOM();
      if (!appState.currentProntuario.planejamentoAlimentar) {
        appState.currentProntuario.planejamentoAlimentar = [];
      }
      const nextNum = appState.currentProntuario.planejamentoAlimentar.length + 1;
      appState.currentProntuario.planejamentoAlimentar.push({
        id: `ref-${Date.now()}`,
        refeicao: `Refeição ${nextNum}`,
        horario: "15:00",
        tipoPreparacao: "",
        itens: [],
        alimentos: "",
        substituicoes: "",
        subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 }
      });
      renderCardapioTable();
    });
  }

  // Adicionar nova refeição ao recordatório
  const addRecMealBtn = document.getElementById("addRecordatorioMealBtn");
  if (addRecMealBtn) {
    addRecMealBtn.addEventListener("click", () => {
      readRecordatorioFromDOM();
      if (!appState.currentProntuario.consumoAlimentar) {
        appState.currentProntuario.consumoAlimentar = {};
      }
      if (!appState.currentProntuario.consumoAlimentar.refeicoesRecordatorio) {
        appState.currentProntuario.consumoAlimentar.refeicoesRecordatorio = [];
      }
      const nextNum = appState.currentProntuario.consumoAlimentar.refeicoesRecordatorio.length + 1;
      appState.currentProntuario.consumoAlimentar.refeicoesRecordatorio.push({
        id: `rec-${Date.now()}`,
        refeicao: `Refeição ${nextNum}`,
        horario: "15:00",
        tipoPreparacao: "",
        itens: [],
        substituicoes: "",
        subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 }
      });
      renderRecordatorioMeals();
    });
  }

  // Listeners nos inputs de prescrição para atualizar tabela dinâmica, proteína g/kg e réguas do R24h e Cardápio
  [
    "prontVetKcal", 
    "prontChoMinPct", "prontChoMaxPct", 
    "prontPtnMinPct", "prontPtnMaxPct", 
    "prontLipMinPct", "prontLipMaxPct",
    "prontPtnMinGKg", "prontPtnMaxGKg",
    "prontChoG", "prontPtnG", "prontLipG"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => {
        updatePrescriptionCalculations();
      });
    }
  });

  // Configura listeners da aba Cálculos de Necessidades (limite de 3 fórmulas, inputs dinâmicos, VET planejado)
  function setupCalculoNecessidadesListeners() {
    const formulaContainers = {
      bolso: "calcBolsoFieldsContainer",
      harrisBenedict: "calcHarrisFieldsContainer",
      mifflin: "calcMifflinFieldsContainer",
      eerIom: "calcEerFieldsContainer",
      faoOms: "calcFaoFieldsContainer"
    };

    const checkboxes = document.querySelectorAll(".calc-formula-checkbox");
    const countEl = document.getElementById("calcFormulasSelectedCount");

    checkboxes.forEach(cb => {
      cb.addEventListener("change", () => {
        const formulaKey = cb.dataset.formula;
        const checkedList = Array.from(checkboxes).filter(c => c.checked);

        if (checkedList.length > 3) {
          cb.checked = false;
          showToast("⚠️ Selecione no máximo 3 fórmulas preditivas para o cálculo manual.");
          return;
        }

        if (countEl) countEl.textContent = checkedList.length;

        const containerId = formulaContainers[formulaKey];
        if (containerId) {
          const container = document.getElementById(containerId);
          if (container) {
            if (cb.checked) {
              container.classList.remove("hidden");
            } else {
              container.classList.add("hidden");
            }
          }
        }
      });
    });

    const vetPlanejadoInput = document.getElementById("prontCalcVetPlanejado");
    if (vetPlanejadoInput) {
      vetPlanejadoInput.addEventListener("input", () => {
        updateCalculoNecessidadesDisplay();
      });
    }

    const justificativaInput = document.getElementById("prontCalcJustificativa");
    if (justificativaInput) {
      justificativaInput.addEventListener("input", () => {
        if (appState.currentProntuario?.calculoNecessidades) {
          appState.currentProntuario.calculoNecessidades.justificativaEscolha = justificativaInput.value;
        }
      });
    }
  }
  setupCalculoNecessidadesListeners();
  window.setupCalculoNecessidadesListeners = setupCalculoNecessidadesListeners;

  // Renderiza a Tabela Moderna de Exames Bioquímicos do Aluno (4 Colunas)
  function renderStudentBioTable(bioList = null, existingInterpretacoes = null) {
    const list = bioList || appState.currentCase?.bioquimica || [];
    const interps = existingInterpretacoes || appState.currentProntuario?.bioquimica?.interpretacoes || {};
    const tbody = document.getElementById("studentBioTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!Array.isArray(list) || list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="py-8 text-center text-slate-400 text-xs italic">
            Nenhum exame laboratorial apurado para este caso clínico.
          </td>
        </tr>
      `;
      return;
    }

    list.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.className = idx % 2 === 0 ? "bg-white hover:bg-slate-50/70 transition" : "bg-slate-50/40 hover:bg-slate-50/90 transition";

      const exameNome = item.exame || `Exame ${idx + 1}`;
      const refStr = item.referencia || "-";
      const valorAchado = item.valor || "-";
      const savedInterp = (interps && interps[exameNome] !== undefined)
        ? interps[exameNome]
        : (interps && interps[idx] !== undefined ? interps[idx] : "");

      const badgeHtml = (typeof renderBiochemicalValueCell === "function")
        ? renderBiochemicalValueCell(valorAchado, refStr)
        : `<span class="font-bold text-slate-800">${escapeHtml(valorAchado)}</span>`;

      tr.innerHTML = `
        <td class="py-3 px-4 align-top">
          <div class="flex items-start space-x-2">
            <span class="text-indigo-600 text-xs mt-0.5">🧪</span>
            <div>
              <div class="font-bold text-slate-800 text-xs leading-snug">${escapeHtml(exameNome)}</div>
              <div class="text-[10px] text-slate-400 font-medium">Marcador bioquímico</div>
            </div>
          </div>
        </td>
        <td class="py-3 px-3 align-top">
          <span class="inline-block font-mono text-[11px] text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded border border-slate-200">
            ${escapeHtml(refStr)}
          </span>
        </td>
        <td class="py-3 px-3 align-top">
          ${badgeHtml}
        </td>
        <td class="py-2.5 px-4 align-top">
          <textarea 
            class="student-bio-interp w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:bg-emerald-50/20 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition resize-y shadow-2xs" 
            rows="2" 
            data-exam="${escapeHtml(exameNome)}" 
            data-idx="${idx}" 
            placeholder="Interprete este achado clínico (ex: diagnóstico provável, risco metabólico e impacto dietoterápico)..."
          >${escapeHtml(savedInterp)}</textarea>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Sincronização imediata no estado ao digitar
    tbody.querySelectorAll(".student-bio-interp").forEach(textarea => {
      textarea.addEventListener("input", (e) => {
        const exam = e.target.dataset.exam;
        const val = e.target.value;
        if (appState.currentProntuario) {
          if (!appState.currentProntuario.bioquimica) appState.currentProntuario.bioquimica = {};
          if (!appState.currentProntuario.bioquimica.interpretacoes) appState.currentProntuario.bioquimica.interpretacoes = {};
          appState.currentProntuario.bioquimica.interpretacoes[exam] = val;
          syncBioquimicaExamesRelevantesText();
        }
      });
    });
  }

  // Gera texto consolidado de exames para compatibilidade com relatórios e validações
  function syncBioquimicaExamesRelevantesText() {
    if (!appState.currentProntuario || !appState.currentCase) return;
    const bioList = appState.currentCase.bioquimica || [];
    const interps = appState.currentProntuario.bioquimica?.interpretacoes || {};
    const relevantSummary = bioList.map(item => {
      const interp = interps[item.exame] ? ` [Interpretação: ${interps[item.exame]}]` : "";
      return `${item.exame}: ${item.valor} (Ref: ${item.referencia})${interp}`;
    }).join("; ");

    const hiddenInput = document.getElementById("prontExamesRelevantes");
    if (hiddenInput) hiddenInput.value = relevantSummary;
    if (appState.currentProntuario.bioquimica) {
      appState.currentProntuario.bioquimica.examesRelevantes = relevantSummary;
    }
  }

  function renderCaseLabExamsBadge() {
    const list = appState.currentCase?.bioquimica || [];
    const container = document.getElementById("labExamsContainer");
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `<span class="text-xs text-slate-400">Nenhum exame cadastrado para este caso.</span>`;
      return;
    }

    container.innerHTML = list.map(item => {
      const badge = (typeof renderBiochemicalValueCell === "function")
        ? renderBiochemicalValueCell(item.valor, item.referencia)
        : `<span class="text-emerald-700 font-semibold">${escapeHtml(item.valor)}</span>`;
      return `
        <div class="bg-white border border-slate-200 rounded-lg p-2 text-[11px] mb-1.5 shadow-2xs">
          <div class="font-bold text-slate-800 mb-1 flex items-center justify-between">
            <span>${escapeHtml(item.exame)}</span>
            <span class="text-[10px] text-slate-400 font-mono">Ref: ${escapeHtml(item.referencia)}</span>
          </div>
          <div>${badge}</div>
        </div>
      `;
    }).join("");
  }

  // Renderiza perguntas avaliativas específicas do caso
  function renderStudentEvaluationQuestions() {
    const questions = appState.currentCase?.questoesAvaliativas || [];
    const container = document.getElementById("studentQuestionsList");
    const countBadge = document.getElementById("questionsCountBadge");
    if (countBadge) countBadge.textContent = `${questions.length} questão(ões)`;

    if (!container) return;

    if (questions.length === 0) {
      container.innerHTML = `
        <div class="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg text-sm">
          Este caso clínico não possui perguntas avaliativas configuradas pelo professor.
        </div>
      `;
      return;
    }

    container.innerHTML = "";
    const savedResponses = appState.currentProntuario?.respostasQuestoes || {};

    questions.forEach((q, idx) => {
      const qCard = document.createElement("div");
      qCard.className = "bg-white border border-slate-200 rounded-lg p-4 shadow-sm mb-4";
      qCard.innerHTML = `
        <label class="block font-semibold text-sm text-slate-800 mb-2">
          ${escapeHtml(q.pergunta)}
        </label>
        <textarea id="resp_quest_${q.id}" class="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" rows="4" placeholder="Digite sua resposta e justificativa técnica detalhada...">${escapeHtml(savedResponses[q.id] || '')}</textarea>
      `;
      container.appendChild(qCard);
    });
  }

  // Configuração de Event Listeners
  function setupEventListeners() {
    // Navegação no Cabeçalho
    if (navBrandBtn) {
      navBrandBtn.addEventListener("click", () => backToStudentDisciplinePortal());
    }

    if (navStudentCatalogBtn) {
      navStudentCatalogBtn.addEventListener("click", () => backToStudentDisciplinePortal());
    }

    // Botão Trocar de Disciplina (retorna ao portal de disciplinas sem casos)
    const backToDiscBtn = document.getElementById("studentBackToDisciplinesBtn");
    if (backToDiscBtn) {
      backToDiscBtn.addEventListener("click", () => {
        backToStudentDisciplinePortal();
      });
    }

    // Botão Voltar ao Catálogo dentro da Simulação
    if (backToCatalogBtn) {
      backToCatalogBtn.addEventListener("click", () => {
        readProntuarioFromForm();
        if (appState.currentCaseId && appState.currentProntuario) {
          prontuarioManager.saveDraft(appState.currentCaseId, appState.currentProntuario);
        }
        showStudentCatalog();
      });
    }

    // Alternância de modo (Acesso restrito ao Painel do Professor)
    switchModeBtn.addEventListener("click", () => {
      if (appState.mode === "admin") {
        showStudentCatalog();
      } else {
        showTeacherPanel();
      }
    });

    // Filtros de Status no Catálogo de Casos do Aluno
    document.querySelectorAll(".catalog-filter-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".catalog-filter-btn").forEach(b => {
          b.classList.remove("active", "bg-emerald-600", "text-white");
          b.classList.add("bg-slate-100", "text-slate-700");
        });
        const target = e.currentTarget;
        target.classList.add("active", "bg-emerald-600", "text-white");
        target.classList.remove("bg-slate-100", "text-slate-700");
        currentCatalogFilter = target.dataset.filter || "all";
        renderStudentCatalog(currentCatalogFilter, currentCatalogSearch);
      });
    });

    // Campo de Busca no Catálogo de Casos
    if (catalogSearchInput) {
      catalogSearchInput.addEventListener("input", (e) => {
        currentCatalogSearch = e.target.value;
        renderStudentCatalog(currentCatalogFilter, currentCatalogSearch);
      });
    }

    // Validação do formulário de senha do professor
    teacherPasswordForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const entered = teacherPasswordInput.value.trim();
      if (entered === TEACHER_PASSWORD) {
        isTeacherAuthenticated = true;
        teacherPasswordError.classList.add("hidden");
        teacherPasswordModal.classList.add("hidden");
        showTeacherPanel();
        showToast("Acesso docente autorizado! Bem-vindo(a) ao Painel do Professor.");
      } else {
        teacherPasswordError.classList.remove("hidden");
        teacherPasswordInput.focus();
        teacherPasswordInput.select();
      }
    });

    // Fechar modal de senha do professor
    closeTeacherPasswordModalBtn.addEventListener("click", () => {
      teacherPasswordModal.classList.add("hidden");
    });

    teacherPasswordModal.addEventListener("click", (e) => {
      if (e.target === teacherPasswordModal) {
        teacherPasswordModal.classList.add("hidden");
      }
    });

    // Botão de Bloquear Sessão do Docente / Sair
    if (adminLockSessionBtn) {
      adminLockSessionBtn.addEventListener("click", () => {
        isTeacherAuthenticated = false;
        showStudentCatalog();
        showToast("Sessão do professor bloqueada com sucesso.");
      });
    }

    // Troca de caso clínico no dropdown
    caseSelectDropdown.addEventListener("change", (e) => {
      // Salva rascunho anterior antes de trocar
      readProntuarioFromForm();
      prontuarioManager.saveDraft(appState.currentCaseId, appState.currentProntuario);
      selectCase(e.target.value);
    });

    // Troca de interlocutor no chat
    interlocutorSelect.addEventListener("change", (e) => {
      appState.activeInterlocutor = e.target.value;
      updateInterlocutorUI();
    });

    // Envio no chat
    sendChatBtn.addEventListener("click", handleSendMessage);
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });

    // Limpar histórico de chat
    clearChatBtn.addEventListener("click", () => {
      if (confirm("Deseja reiniciar a conversa com este personagem?")) {
        const caseId = appState.currentCaseId;
        const role = appState.activeInterlocutor;
        if (appState.chatHistories[caseId]) {
          delete appState.chatHistories[caseId][role];
        }
        renderChatMessages();
      }
    });

    // Chips de perguntas rápidas
    document.querySelectorAll(".prompt-chip").forEach(chip => {
      chip.addEventListener("click", (e) => {
        chatInput.value = e.target.textContent.replace(/^[💬👤🩺🍎]\s*/, "");
        handleSendMessage();
      });
    });

    // Input listeners para cálculos antropométricos (Chumlea, IMC e Diagnóstico)
    [
      "prontPesoAtual", "prontPesoHabitual", "prontEstatura", "prontAlturaJoelho",
      "prontCircBraco", "prontCircCintura", "prontCircQuadril", "prontCircPanturrilha", "prontCircPunho",
      "prontDobraTricipital", "prontDobraSubescapular", "prontDobraBicipital", "prontDobraSuprailiaca", "prontDobraAbdominal", "prontDobraCoxa"
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", updateAnthropometricCalculations);
      }
    });

    // Input listener para VET do Recordatório e Adequação com a NEE
    const vetRecInput = document.getElementById("prontVetRecordatorio");
    if (vetRecInput) {
      vetRecInput.addEventListener("input", updateVetAdequacyCalculations);
    }

    // Inicializa a ferramenta de busca oficial TACO
    setupTacoSearch();

    // Botão de aplicar estatura estimada de Chumlea
    const btnApplyChumlea = document.getElementById("btnApplyChumlea");
    if (btnApplyChumlea) {
      btnApplyChumlea.addEventListener("click", () => {
        const aj = document.getElementById("prontAlturaJoelho")?.value || "";
        const idade = appState.currentCase?.patient?.age || 40;
        const genero = appState.currentCase?.patient?.gender || "Feminino";
        const chum = estimateChumleaStature(aj, idade, genero);
        if (chum) {
          const estEl = document.getElementById("prontEstatura");
          if (estEl) {
            estEl.value = chum.m;
            updateAnthropometricCalculations();
            triggerProntuarioAutoSave();
            showToast(`Estatura estimada por Chumlea (${chum.m} m) aplicada!`);
          }
        }
      });
    }

    // Botão Sintetizar Medidas Antropométricas
    const btnSintetizar = document.getElementById("btnSintetizarMedidas");
    if (btnSintetizar) {
      btnSintetizar.addEventListener("click", () => {
        const parts = [];
        const peso = document.getElementById("dispPesoEfetivo")?.textContent.trim();
        const est = document.getElementById("dispEstaturaEfetiva")?.textContent.trim();
        const imc = document.getElementById("calculatedImcDisplay")?.textContent.trim();
        const diag = document.getElementById("calculatedImcExtensoDisplay")?.textContent.trim();

        const cc = document.getElementById("prontCircCintura")?.value.trim();
        const cq = document.getElementById("prontCircQuadril")?.value.trim();
        const cb = document.getElementById("prontCircBraco")?.value.trim();
        const cp = document.getElementById("prontCircPanturrilha")?.value.trim();
        const punho = document.getElementById("prontCircPunho")?.value.trim();
        const dct = document.getElementById("prontDobraTricipital")?.value.trim();
        const dcse = document.getElementById("prontDobraSubescapular")?.value.trim();
        const dcb = document.getElementById("prontDobraBicipital")?.value.trim();
        const dcsi = document.getElementById("prontDobraSuprailiaca")?.value.trim();
        const dca = document.getElementById("prontDobraAbdominal")?.value.trim();
        const dcc = document.getElementById("prontDobraCoxa")?.value.trim();
        const aj = document.getElementById("prontAlturaJoelho")?.value.trim();
        const demais = document.getElementById("prontDemaisAvaliacoes")?.value.trim();

        if (peso && peso !== "--") parts.push(`Peso: ${peso}`);
        if (est && est !== "--") parts.push(`Estatura: ${est}`);
        if (imc && imc !== "--") parts.push(`IMC: ${imc} kg/m²`);
        if (diag && !diag.includes("Aguardando")) parts.push(`Diagnóstico: ${diag}`);
        if (aj) parts.push(`Altura do Joelho (AJ): ${aj} cm`);
        if (cb) parts.push(`CB: ${cb} cm`);
        if (cc) parts.push(`Circunf. Cintura: ${cc} cm`);
        if (cq) parts.push(`Circunf. Quadril: ${cq} cm`);
        if (cp) parts.push(`CP: ${cp} cm`);
        if (punho) parts.push(`Punho: ${punho} cm`);
        if (dct) parts.push(`Dobra Tricipital (DCT): ${dct} mm`);
        if (dcse) parts.push(`Dobra Subescapular: ${dcse} mm`);
        if (dcb) parts.push(`Dobra Bicipital: ${dcb} mm`);
        if (dcsi) parts.push(`Dobra Supra-ilíaca: ${dcsi} mm`);
        if (dca) parts.push(`Dobra Abdominal: ${dca} mm`);
        if (dcc) parts.push(`Dobra da Coxa: ${dcc} mm`);
        if (demais) parts.push(demais);

        const summaryBox = document.getElementById("prontCircunferencias");
        if (summaryBox) {
          summaryBox.value = parts.join("; ");
          triggerProntuarioAutoSave();
          showToast("Resumo das medidas sintetizado com sucesso!");
        }
      });
    }

    // Botão Montar Frase Completa do PES
    const btnPes = document.getElementById("btnGerarPesCompleto");
    if (btnPes) {
      btnPes.addEventListener("click", () => {
        const p = document.getElementById("prontPesProblema")?.value.trim() || "";
        const e = document.getElementById("prontPesEtiologia")?.value.trim() || "";
        const s = document.getElementById("prontPesSinais")?.value.trim() || "";
        if (!p && !e && !s) {
          showToast("Preencha o Problema, Etiologia e Sinais primeiro.", "warning");
          return;
        }
        const fullText = `${p || '[Problema não informado]'} relacionado a ${e || '[Etiologia não informada]'} evidenciado por ${s || '[Sinais/Sintomas não informados]'}.`;
        const pesBox = document.getElementById("prontPesTextoCompleto");
        if (pesBox) {
          pesBox.value = fullText;
          triggerProntuarioAutoSave();
          showToast("Frase PES estruturada com sucesso!");
        }
      });
    }

    // Inserção de tópico (bullet point) nos Objetivos Dietoterápicos
    const btnTopico = document.getElementById("btnInserirTopicoObjetivo");
    const txtObjetivos = document.getElementById("prontObjetivosDietoterapicos");
    if (btnTopico && txtObjetivos) {
      btnTopico.addEventListener("click", () => {
        const start = txtObjetivos.selectionStart;
        const end = txtObjetivos.selectionEnd;
        const val = txtObjetivos.value;
        const prefix = (start > 0 && val[start - 1] !== "\n") ? "\n• " : "• ";
        txtObjetivos.value = val.substring(0, start) + prefix + val.substring(end);
        txtObjetivos.focus();
        txtObjetivos.selectionStart = txtObjetivos.selectionEnd = start + prefix.length;
        triggerProntuarioAutoSave();
      });

      txtObjetivos.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const start = txtObjetivos.selectionStart;
          const val = txtObjetivos.value;
          const lineStart = val.lastIndexOf("\n", start - 1) + 1;
          const currentLine = val.substring(lineStart, start);
          if (currentLine.trim().startsWith("• ") || currentLine.trim().startsWith("* ")) {
            if (currentLine.trim().length > 2) {
              e.preventDefault();
              const insertText = "\n• ";
              txtObjetivos.value = val.substring(0, start) + insertText + val.substring(start);
              txtObjetivos.selectionStart = txtObjetivos.selectionEnd = start + insertText.length;
              triggerProntuarioAutoSave();
            }
          }
        }
      });
    }

    // Seletor de Via de Alimentação Prescrita: Dieta Oral vs TNE
    document.querySelectorAll('input[name="prontViaAlimentacao"]').forEach(r => {
      r.addEventListener("change", (e) => {
        setNutritionRouteSelection(e.target.value);
        triggerProntuarioAutoSave();
      });
    });

    document.getElementById("labelViaOral")?.addEventListener("click", () => {
      const r = document.getElementById("radioViaOral");
      if (r && !r.checked) {
        r.checked = true;
        setNutritionRouteSelection("oral");
        triggerProntuarioAutoSave();
      }
    });

    document.getElementById("labelViaTne")?.addEventListener("click", () => {
      const r = document.getElementById("radioViaTne");
      if (r && !r.checked) {
        r.checked = true;
        setNutritionRouteSelection("tne");
        triggerProntuarioAutoSave();
      }
    });

    // Seletor de Via de Administração da TNE: Gravitacional vs Bomba de Infusão
    const selectTneVia = document.getElementById("tneViaAdministracao");
    if (selectTneVia) {
      selectTneVia.addEventListener("change", (e) => {
        updateTneAdministrationRouteDisplay(e.target.value);
        triggerProntuarioAutoSave();
      });
    }

    // Recálculo da consolidação nutricional para inputs da TNE manual
    const tneManualInputIds = [
      "tneManualVet", "tneManualCho", "tneManualPtn", "tneManualLip", 
      "tneManualFibra", "tneManualSodio", "tneManualPotassio", "tneManualCalcio", "tneManualFosforo"
    ];
    tneManualInputIds.forEach(id => {
      document.getElementById(id)?.addEventListener("input", () => {
        updateCardapioTotalsDisplay();
      });
    });

    // Sincronização e listener de consistência do cardápio oral
    document.getElementById("prontCardapioConsistencia")?.addEventListener("change", (e) => {
      const val = e.target.value;
      const customInput = document.getElementById("prontCardapioConsistenciaCustom");
      if (val === "Personalizada") {
        if (customInput) {
          customInput.focus();
        }
      }
      const pCons = document.getElementById("prontConsistencia");
      if (pCons && val !== "Personalizada") {
        pCons.value = val;
      }
      triggerProntuarioAutoSave();
    });

    document.getElementById("prontCardapioConsistenciaCustom")?.addEventListener("input", (e) => {
      const pCons = document.getElementById("prontConsistencia");
      if (pCons && e.target.value.trim()) {
        pCons.value = e.target.value.trim();
      }
      triggerProntuarioAutoSave();
    });

    // Auto-salvamento debounced do prontuário
    let studentAutoSaveTimer = null;
    function triggerProntuarioAutoSave() {
      if (studentAutoSaveTimer) clearTimeout(studentAutoSaveTimer);
      studentAutoSaveTimer = setTimeout(() => {
        if (appState.currentCaseId && appState.mode === "student") {
          const data = readProntuarioFromForm();
          if (data) {
            prontuarioManager.saveDraft(appState.currentCaseId, data);
            const indicator = document.getElementById("prontAutoSaveIndicator");
            if (indicator) {
              const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              indicator.textContent = `Salvo às ${time}`;
            }
          }
        }
      }, 700);
    }

    // Listeners de input/change para auto-salvar no prontuário do aluno
    const studentFormArea = document.querySelector(".student-tab-content")?.parentElement;
    if (studentFormArea) {
      studentFormArea.addEventListener("input", () => {
        triggerProntuarioAutoSave();
      });
      studentFormArea.addEventListener("change", () => {
        triggerProntuarioAutoSave();
      });
    }

    // Abas do Prontuário do Aluno (CORREÇÃO DE BUGS DE CLIQUE E PREENCHIMENTO)
    document.querySelectorAll(".student-tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        // 1. Localiza o botão pai corretamente mesmo se o clique foi no <span> interno ou emoji
        const btnEl = e.currentTarget || e.target.closest(".student-tab-btn");
        if (!btnEl) return;
        const tabId = btnEl.dataset.tab;
        if (!tabId) return;

        // Se a aba estiver bloqueada pelo professor para este caso clínico (Tempo Real):
        if (isStudentTabBlocked(tabId)) {
          e.preventDefault();
          e.stopPropagation();
          openStudentBlockedTabModal(tabId);
          return;
        }

        // 2. Salva o rascunho dos campos da aba atual antes de alternar
        readProntuarioFromForm();
        if (appState.workflowMode === "real" || appState.currentProntuario?.isRealPatient) {
          saveRealPatientSession(false);
        } else if (appState.currentCaseId && appState.currentProntuario) {
          prontuarioManager.saveDraft(appState.currentCaseId, appState.currentProntuario);
        }

        // 3. Atualiza estado das abas
        document.querySelectorAll(".student-tab-btn").forEach(b => b.classList.remove("active"));
        btnEl.classList.add("active");
        appState.activeStudentTab = tabId;

        // 4. Exibe o conteúdo correto da aba
        document.querySelectorAll(".student-tab-content").forEach(c => c.classList.add("hidden"));
        const activeContent = document.getElementById(`tab-content-${tabId}`);
        if (activeContent) {
          activeContent.classList.remove("hidden");
        }
      });
    });

    // Salvar rascunho
    saveDraftBtn.addEventListener("click", () => {
      if (appState.workflowMode === "real" || appState.currentProntuario?.isRealPatient) {
        saveRealPatientSession(true);
        return;
      }
      readProntuarioFromForm();
      prontuarioManager.saveDraft(appState.currentCaseId, appState.currentProntuario);
      showToast("Rascunho salvo com sucesso no navegador!");
    });

    // Finalizar caso e gerar Word (.docx)
    finalizeAndExportDocxBtn.addEventListener("click", () => {
      if (appState.workflowMode === "real" || appState.currentProntuario?.isRealPatient) {
        exportRealPatientDocx();
        return;
      }
      const data = readProntuarioFromForm();
      if (!data) return;

      // Validação amigável
      if (!data.aluno.nome) {
        alert("Por favor, preencha o seu nome completo na identificação do prontuário.");
        document.querySelector('[data-tab="anamnese"]').click();
        document.getElementById("alunoNome").focus();
        return;
      }

      // Salva rascunho final
      prontuarioManager.saveDraft(appState.currentCaseId, data);

      // REGRA SOLICITADA:
      // "A proposta é que o aluno não receba feedback final do que acertou ou do que errou."
      // "Gere um documento em Word e que ele crie no final todo o relatório necessário do caso clínico e resolução dietoterápica, com o planejamento alimentar do paciente."

      // 1. Gera e baixa o documento Word (.docx) imediatamente
      DietoterapiaDocxReport.generateReport(data, appState.currentCase);

      // 2. Abre modal confirmando a submissão e informando que a avaliação será feita pelo docente (sem mostrar erros/acertos)
      document.getElementById("modalStudentName").textContent = data.aluno.nome;
      document.getElementById("modalCaseTitle").textContent = appState.currentCase.title;
      submissionConfirmModal.classList.remove("hidden");
    });

    // ==========================================
    // MODO ATENDIMENTO REAL & DROGA-NUTRIENTE
    // ==========================================

    // Bifurcação: Modo Simulação
    const selModeSimBtn = document.getElementById("selectModeSimulationBtn");
    if (selModeSimBtn) {
      selModeSimBtn.addEventListener("click", () => {
        setStudentWorkflowMode("simulation");
        const catalogSection = document.getElementById("studentCatalogSection");
        if (catalogSection && !catalogSection.classList.contains("hidden")) {
          catalogSection.scrollIntoView({ behavior: "smooth" });
        }
      });
    }

    // Bifurcação: Modo Atendimento Real
    const selModeRealBtn = document.getElementById("selectModeRealBtn");
    if (selModeRealBtn) {
      selModeRealBtn.addEventListener("click", () => {
        startRealPatientSession();
      });
    }

    // Botão Salvar Prontuário no Topo do Atendimento Real
    const realSaveTopBtn = document.getElementById("realSaveTopBtn");
    if (realSaveTopBtn) {
      realSaveTopBtn.addEventListener("click", () => {
        saveRealPatientSession(true);
      });
    }

    // Botão Gerar Relatório Word (.docx) no Topo do Atendimento Real
    const realExportTopBtn = document.getElementById("realExportDocxTopBtn");
    if (realExportTopBtn) {
      realExportTopBtn.addEventListener("click", () => {
        exportRealPatientDocx();
      });
    }

    // Botão Adicionar Exame Dinâmico na Bioquímica
    const studentAddBioBtn = document.getElementById("studentAddCustomBioExamBtn");
    if (studentAddBioBtn) {
      studentAddBioBtn.addEventListener("click", () => {
        handleAddCustomBioExam();
      });
    }

    // Botão Adicionar Fármaco / Interação na Aba Interação Droga-Nutriente
    const addDrugBtn = document.getElementById("addDrugInteractionBtn");
    if (addDrugBtn) {
      addDrugBtn.addEventListener("click", () => {
        const p = appState.currentProntuario;
        if (!p) return;
        prontuarioManager.addInteracaoDrogaNutriente(p, {
          medicamento: "",
          nutrientes: "",
          conduta: ""
        });
        renderDrugNutrientTable();
      });
    }

    // Chips de Sugestão Rápida de Interações Farmacológicas
    document.querySelectorAll(".drug-chip").forEach(chip => {
      chip.addEventListener("click", (e) => {
        const p = appState.currentProntuario;
        if (!p) return;
        const med = chip.dataset.med || chip.textContent.trim();
        const nutr = chip.dataset.nutr || "";
        const cond = chip.dataset.cond || "";
        prontuarioManager.addInteracaoDrogaNutriente(p, {
          medicamento: med,
          nutrientes: nutr,
          conduta: cond
        });
        renderDrugNutrientTable();
        showToast(`Interação com "${med}" inserida na tabela!`, "success");
      });
    });

    // Sincronização em tempo real da Hipótese Diagnóstica entre o Card e a Anamnese
    const realHip = document.getElementById("realPatHipoteseDiagnostica");
    const prontHip = document.getElementById("prontHipoteseDiagnostica");
    if (realHip && prontHip) {
      realHip.addEventListener("input", (e) => {
        prontHip.value = e.target.value;
      });
      prontHip.addEventListener("input", (e) => {
        realHip.value = e.target.value;
      });
    }

    closeSubmissionModalBtn.addEventListener("click", () => {
      submissionConfirmModal.classList.add("hidden");
    });

    // Modal de API Key Gemini
    openApiKeyBtn.addEventListener("click", () => {
      apiKeyInput.value = chatEngine.getApiKey();
      apiKeyModal.classList.remove("hidden");
    });

    closeApiKeyModalBtn.addEventListener("click", () => {
      apiKeyModal.classList.add("hidden");
    });

    saveApiKeyBtn.addEventListener("click", () => {
      chatEngine.setApiKey(apiKeyInput.value);
      apiKeyModal.classList.add("hidden");
      showToast(apiKeyInput.value ? "Chave da Gemini API salva com sucesso!" : "Chave da Gemini API removida. Usando motor nativo offline.");
    });

    // Modal de Aba Bloqueada (Aluno)
    const closeBlockedTabModalBtn = document.getElementById("closeBlockedTabModalBtn");
    if (closeBlockedTabModalBtn) {
      closeBlockedTabModalBtn.addEventListener("click", () => closeStudentBlockedTabModal());
    }
    const studentBlockedTabModal = document.getElementById("studentBlockedTabModal");
    if (studentBlockedTabModal) {
      studentBlockedTabModal.addEventListener("click", (e) => {
        if (e.target === studentBlockedTabModal) closeStudentBlockedTabModal();
      });
    }

    // Modal de Configuração do Firebase (Banco em Nuvem)
    const closeFbModalBtn = document.getElementById("closeFirebaseConfigModalBtn");
    if (closeFbModalBtn) {
      closeFbModalBtn.addEventListener("click", () => closeFirebaseConfigModal());
    }
    const cancelFbBtn = document.getElementById("fbCancelConfigBtn");
    if (cancelFbBtn) {
      cancelFbBtn.addEventListener("click", () => closeFirebaseConfigModal());
    }
    const saveFbBtn = document.getElementById("fbSaveConfigBtn");
    if (saveFbBtn) {
      saveFbBtn.addEventListener("click", () => saveFirebaseConfigFromModal());
    }
    const clearFbBtn = document.getElementById("fbClearConfigBtn");
    if (clearFbBtn) {
      clearFbBtn.addEventListener("click", () => clearFirebaseConfigFromModal());
    }
    const firebaseConfigModal = document.getElementById("firebaseConfigModal");
    if (firebaseConfigModal) {
      firebaseConfigModal.addEventListener("click", (e) => {
        if (e.target === firebaseConfigModal) closeFirebaseConfigModal();
      });
    }
  }

  // Setup do Painel do Professor / Administrador
  function setupAdminUI() {
    // Abas de edição do caso no Admin
    document.querySelectorAll(".admin-editor-tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const btnEl = e.currentTarget || e.target.closest(".admin-editor-tab-btn");
        if (!btnEl) return;
        const tabId = btnEl.dataset.admintab;
        if (!tabId) return;

        document.querySelectorAll(".admin-editor-tab-btn").forEach(b => b.classList.remove("active"));
        btnEl.classList.add("active");
        appState.activeAdminTab = tabId;

        document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.add("hidden"));
        const targetContent = document.getElementById(`adm-tab-${tabId}`);
        if (targetContent) targetContent.classList.remove("hidden");
      });
    });

    // Botões de Bloqueio em Massa de Abas no Editor do Professor (Tempo Real)
    const blockAllBtn = document.getElementById("adminBlockAllTabsBtn");
    if (blockAllBtn) {
      blockAllBtn.addEventListener("click", () => {
        document.querySelectorAll(".adm-tab-block-checkbox").forEach(cb => {
          cb.checked = true;
        });
        updateBlockedTabsCountLabel();
      });
    }

    const unblockAllBtn = document.getElementById("adminUnblockAllTabsBtn");
    if (unblockAllBtn) {
      unblockAllBtn.addEventListener("click", () => {
        document.querySelectorAll(".adm-tab-block-checkbox").forEach(cb => {
          cb.checked = false;
        });
        updateBlockedTabsCountLabel();
      });
    }

    // Checkboxes individuais de bloqueio de abas
    document.querySelectorAll(".adm-tab-block-checkbox").forEach(cb => {
      cb.addEventListener("change", () => {
        updateBlockedTabsCountLabel();
      });
    });

    // Botão Criar Novo Caso
    document.getElementById("adminNewCaseBtn").addEventListener("click", () => {
      const newCase = adminManager.getEmptyCase();
      adminManager.editingCaseId = newCase.id;
      populateAdminEditor(newCase);
      openAdminEditor();
    });

    // Botão Restaurar Casos Padrão
    document.getElementById("adminResetDefaultsBtn").addEventListener("click", () => {
      if (confirm("Deseja restaurar os 3 casos clínicos padrão da disciplina? Isso resetará alterações feitas nos casos de fábrica.")) {
        resetDefaultCases();
        syncAppStateAndNotify("Casos padrão restaurados com sucesso!");
      }
    });

    // Exportar Casos para JSON
    document.getElementById("adminExportJsonBtn").addEventListener("click", () => {
      adminManager.exportCasesJson();
    });

    // Importar Casos de JSON
    const fileInput = document.getElementById("adminImportJsonInput");
    document.getElementById("adminImportJsonBtn").addEventListener("click", () => {
      fileInput.click();
    });
    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        adminManager.importCasesJson(e.target.files[0], (success, msg) => {
          if (success) {
            syncAppStateAndNotify("Casos importados e atualizados no sistema!");
          } else {
            showToast(msg, "error");
          }
        });
      }
    });

    // Botão Salvar Caso no Editor
    document.getElementById("adminSaveCaseBtn").addEventListener("click", () => {
      let savedCase = readCaseFromAdminEditor();
      if (!savedCase.title) {
        alert("Por favor, preencha o título do caso.");
        return;
      }
      if (typeof ClinicalPortugueseReviser !== "undefined" && ClinicalPortugueseReviser.reviewCase) {
        savedCase = ClinicalPortugueseReviser.reviewCase(savedCase);
      }
      adminManager.saveCase(savedCase);
      closeAdminEditor();
      syncAppStateAndNotify("✨ Caso clínico salvo e atualizado para os alunos!");
    });

    // Botão Revisar Português & Verbos no Editor
    const reviewPortBtn = document.getElementById("adminReviewPortugueseBtn");
    if (reviewPortBtn) {
      reviewPortBtn.addEventListener("click", () => {
        let currentCase = readCaseFromAdminEditor();
        if (typeof ClinicalPortugueseReviser !== "undefined" && ClinicalPortugueseReviser.reviewCase) {
          const reviewed = ClinicalPortugueseReviser.reviewCase(currentCase);
          populateAdminEditor(reviewed);
          showToast("✨ Português e tempos verbais revisados com sucesso em todas as abas!");
        }
      });
    }

    // Botão Cancelar Edição
    document.getElementById("adminCancelEditBtn").addEventListener("click", () => {
      closeAdminEditor();
    });

    // Toggle de trava dentro do editor
    const lockCheckbox = document.getElementById("admCaseIsUnlocked");
    if (lockCheckbox) {
      lockCheckbox.addEventListener("change", (e) => {
        updateCaseLockLabel(e.target.checked);
      });
    }

    // Toggle de visibilidade dentro do editor
    const visCheckbox = document.getElementById("admCaseIsVisible");
    if (visCheckbox) {
      visCheckbox.addEventListener("change", (e) => {
        updateCaseVisibilityLabel(e.target.checked);
      });
    }

    // Toggle de questões avaliativas dentro do editor (principal e espelho na aba 7)
    const questionsCheckbox = document.getElementById("admCaseEnableQuestions");
    if (questionsCheckbox) {
      questionsCheckbox.addEventListener("change", (e) => {
        updateCaseQuestionsLabel(e.target.checked);
      });
    }
    const mirrorQuestionsCheckbox = document.getElementById("admTabQuestionsMirrorToggle");
    if (mirrorQuestionsCheckbox) {
      mirrorQuestionsCheckbox.addEventListener("change", (e) => {
        updateCaseQuestionsLabel(e.target.checked);
      });
    }

    // Inicializa catálogo de modelos rápidos de profissionais na Aba 6
    const presetSelect = document.getElementById("adminAddProfPresetSelect");
    if (presetSelect && typeof PROFESSIONAL_PRESETS !== "undefined") {
      presetSelect.innerHTML = "";
      PROFESSIONAL_PRESETS.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.avatar} ${p.nome}`;
        presetSelect.appendChild(opt);
      });
    }

    // Botão "+ Acrescentar Profissional" na Aba 6
    const addProfBtn = document.getElementById("adminAddProfBtn");
    if (addProfBtn) {
      addProfBtn.addEventListener("click", () => {
        const presetId = document.getElementById("adminAddProfPresetSelect")?.value || "personalizado";
        const preset = (typeof PROFESSIONAL_PRESETS !== "undefined")
          ? PROFESSIONAL_PRESETS.find(p => p.id === presetId)
          : null;

        const defaultData = preset || {
          id: `prof_${Date.now()}`,
          nome: "Novo Especialista",
          avatar: "🏥",
          especialidade: "Equipe Multiprofissional",
          defaultParecer: ""
        };

        const container = document.getElementById("adminEquipeListContainer");
        const emptyBanner = document.getElementById("adminEquipeEmptyBanner");
        if (emptyBanner) emptyBanner.remove();

        const uniqueId = `${defaultData.id}_${Date.now()}`;
        const newProf = {
          id: uniqueId,
          nome: defaultData.nome,
          avatar: defaultData.avatar,
          especialidade: defaultData.especialidade,
          parecer: defaultData.defaultParecer || ""
        };

        const card = createAdminProfCard(newProf);
        container.appendChild(card);

        const textarea = card.querySelector(".prof-parecer-input");
        if (textarea) textarea.focus();
        showToast(`Profissional "${newProf.nome}" acrescentado com sucesso!`);
      });
    }

    // Navegação para a tela de subir arquivo e montar caso
    const uploadNavBtn = document.getElementById("adminUploadCaseNavBtn");
    if (uploadNavBtn) {
      uploadNavBtn.addEventListener("click", () => {
        showAdminUploadCase();
      });
    }

    const cancelUploadBtn = document.getElementById("adminCancelUploadBtn");
    if (cancelUploadBtn) {
      cancelUploadBtn.addEventListener("click", () => {
        hideAdminUploadCase();
      });
    }

    // Dropzone e upload de arquivo de caso
    const dropzone = document.getElementById("adminCaseDropzone");
    const caseFileInput = document.getElementById("adminCaseFileInput");
    const selectedFileInfo = document.getElementById("adminSelectedFileInfo");
    const selectedFileName = document.getElementById("adminFileName");
    const selectedFileSize = document.getElementById("adminFileSize");
    const selectedFileIcon = document.getElementById("adminFileIcon");
    const removeFileBtn = document.getElementById("adminRemoveFileBtn");
    const extractedTextArea = document.getElementById("adminCaseExtractedText");
    const clearTextBtn = document.getElementById("adminClearTextBtn");
    const processCaseBtn = document.getElementById("adminProcessAndBuildCaseBtn");

    if (dropzone && caseFileInput) {
      dropzone.addEventListener("click", () => {
        caseFileInput.click();
      });

      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("border-indigo-600", "bg-indigo-100/60");
      });

      dropzone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        dropzone.classList.remove("border-indigo-600", "bg-indigo-100/60");
      });

      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("border-indigo-600", "bg-indigo-100/60");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleCaseFileSelected(e.dataTransfer.files[0]);
        }
      });

      caseFileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          handleCaseFileSelected(e.target.files[0]);
        }
      });
    }

    async function handleCaseFileSelected(file) {
      if (!file) return;

      const ext = file.name.split(".").pop().toLowerCase();
      const sizeKb = (file.size / 1024).toFixed(1);

      if (selectedFileName) selectedFileName.textContent = file.name;
      if (selectedFileSize) selectedFileSize.textContent = `${sizeKb} KB`;
      if (selectedFileIcon) {
        selectedFileIcon.textContent = ext === "docx" ? "📘" : (ext === "json" ? "📋" : "📝");
      }
      if (selectedFileInfo) selectedFileInfo.classList.remove("hidden");

      try {
        if (ext === "docx") {
          showToast("Lendo e extraindo conteúdo do arquivo Word (.docx)...");
          if (typeof DocxTextExtractor !== "undefined") {
            const text = await DocxTextExtractor.extractTextFromFile(file);
            if (text && text.trim()) {
              if (extractedTextArea) extractedTextArea.value = text;
              showToast("Documento Word (.docx) extraído com sucesso!");
            } else {
              showToast("Não foi possível extrair o texto do arquivo Word. Você pode colar o texto diretamente.", "warning");
            }
          }
        } else if (ext === "json") {
          const text = await file.text();
          if (extractedTextArea) extractedTextArea.value = text;
          showToast("Arquivo JSON carregado com sucesso!");
        } else {
          // Arquivos de texto (.txt, .md, etc.)
          const text = await file.text();
          if (extractedTextArea) extractedTextArea.value = text;
          showToast("Arquivo de texto carregado com sucesso!");
        }
      } catch (err) {
        console.error("Erro ao ler arquivo:", err);
        showToast("Erro ao ler arquivo: " + err.message, "error");
      }
    }

    if (removeFileBtn) {
      removeFileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (caseFileInput) caseFileInput.value = "";
        if (selectedFileInfo) selectedFileInfo.classList.add("hidden");
      });
    }

    if (clearTextBtn) {
      clearTextBtn.addEventListener("click", () => {
        if (extractedTextArea) extractedTextArea.value = "";
        if (caseFileInput) caseFileInput.value = "";
        if (selectedFileInfo) selectedFileInfo.classList.add("hidden");
        showToast("Texto limpo.");
      });
    }

    // Botão de processar texto e montar o caso clínico nas 8 abas
    if (processCaseBtn) {
      processCaseBtn.addEventListener("click", () => {
        const raw = extractedTextArea?.value?.trim() || "";
        if (!raw) {
          showToast("Por favor, selecione um arquivo ou cole o texto do caso clínico primeiro.", "warning");
          return;
        }

        try {
          showToast("Analisando dados clínicos e estruturando as 8 abas...");
          const targetDisc = document.getElementById("adminUploadCaseDiscipline")?.value || adminManager.activeDisciplinaId || "dietoterapia";
          const builtCase = CaseBuilderEngine.buildCaseFromText(raw, targetDisc);
          builtCase.disciplinaId = targetDisc;
          
          adminManager.editingCaseId = builtCase.id;
          populateAdminEditor(builtCase);
          openAdminEditor();
          window.scrollTo({ top: 0, behavior: "smooth" });

          showToast(`✨ Caso "${builtCase.title}" montado com sucesso! Revise os dados e clique em "Salvar Caso".`, 5000);
        } catch (err) {
          console.error("Erro na montagem do caso:", err);
          showToast("Erro ao montar caso clínico: " + err.message, "error");
        }
      });
    }

    // Listeners do Gerenciamento de Disciplinas pelo Professor
    const newDiscBtn = document.getElementById("adminNewDisciplineBtn");
    if (newDiscBtn) {
      newDiscBtn.addEventListener("click", () => {
        document.getElementById("adminDisciplineId").value = "";
        document.getElementById("adminDisciplineName").value = "";
        document.getElementById("adminDisciplineCode").value = "";
        document.getElementById("adminDisciplineIcon").value = "📚";
        document.getElementById("adminDisciplineDesc").value = "";
        document.getElementById("adminDisciplineModalTitle").textContent = "Cadastrar Nova Disciplina";
        document.getElementById("adminDisciplineModalIconHeader").textContent = "📚";
        document.getElementById("adminDisciplineModal").classList.remove("hidden");
        setTimeout(() => document.getElementById("adminDisciplineName").focus(), 100);
      });
    }

    const editDiscBtn = document.getElementById("adminEditDisciplineBtn");
    if (editDiscBtn) {
      editDiscBtn.addEventListener("click", () => {
        const currentDisc = adminManager.getDisciplinaById(adminManager.activeDisciplinaId);
        if (!currentDisc) return;
        document.getElementById("adminDisciplineId").value = currentDisc.id;
        document.getElementById("adminDisciplineName").value = currentDisc.nome || "";
        document.getElementById("adminDisciplineCode").value = currentDisc.codigo || "";
        document.getElementById("adminDisciplineIcon").value = currentDisc.icone || "📚";
        document.getElementById("adminDisciplineDesc").value = currentDisc.descricao || "";
        document.getElementById("adminDisciplineModalTitle").textContent = `Editar Disciplina: ${currentDisc.nome}`;
        document.getElementById("adminDisciplineModalIconHeader").textContent = currentDisc.icone || "✏️";
        document.getElementById("adminDisciplineModal").classList.remove("hidden");
        setTimeout(() => document.getElementById("adminDisciplineName").focus(), 100);
      });
    }

    const deleteDiscBtn = document.getElementById("adminDeleteDisciplineBtn");
    if (deleteDiscBtn) {
      deleteDiscBtn.addEventListener("click", () => {
        const currentDisc = adminManager.getDisciplinaById(adminManager.activeDisciplinaId);
        if (!currentDisc) return;

        if (adminManager.disciplinas.length <= 1) {
          alert("Não é possível excluir a única disciplina cadastrada no sistema.");
          return;
        }

        const casesInDisc = adminManager.cases.filter(c => (c.disciplinaId || "dietoterapia") === currentDisc.id);
        const modal = document.getElementById("adminDeleteDisciplineModal");
        const nameEl = document.getElementById("adminDeleteDiscName");
        const badgeEl = document.getElementById("adminDeleteDiscCountBadge");
        const withCasesBox = document.getElementById("adminDeleteDiscWithCasesBox");
        const emptyBox = document.getElementById("adminDeleteDiscEmptyBox");
        const targetSelect = document.getElementById("adminDeleteDiscTargetSelect");

        if (nameEl) nameEl.textContent = `${currentDisc.icone || '📚'} ${currentDisc.nome}`;
        if (badgeEl) {
          badgeEl.textContent = `${casesInDisc.length} caso(s) clínico(s)`;
          badgeEl.className = casesInDisc.length > 0
            ? "font-bold px-2 py-0.5 rounded text-[11px] bg-amber-100 text-amber-800 border border-amber-300"
            : "font-bold px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700";
        }

        if (casesInDisc.length > 0) {
          if (withCasesBox) withCasesBox.classList.remove("hidden");
          if (emptyBox) emptyBox.classList.add("hidden");

          if (targetSelect) {
            targetSelect.innerHTML = "";
            adminManager.disciplinas
              .filter(d => d.id !== currentDisc.id)
              .forEach(d => {
                const opt = document.createElement("option");
                opt.value = d.id;
                opt.textContent = `${d.icone || '📚'} ${d.nome} (${d.codigo || 'Sem código'})`;
                targetSelect.appendChild(opt);
              });
          }
        } else {
          if (withCasesBox) withCasesBox.classList.add("hidden");
          if (emptyBox) emptyBox.classList.remove("hidden");
        }

        if (modal) modal.classList.remove("hidden");
      });
    }

    // Confirmação de exclusão da disciplina no modal inteligente
    const confirmDelBtn = document.getElementById("adminConfirmDeleteDiscBtn");
    if (confirmDelBtn) {
      confirmDelBtn.addEventListener("click", () => {
        const currentDisc = adminManager.getDisciplinaById(adminManager.activeDisciplinaId);
        if (!currentDisc) return;

        const casesInDisc = adminManager.cases.filter(c => (c.disciplinaId || "dietoterapia") === currentDisc.id);
        let options = {};

        if (casesInDisc.length > 0) {
          const chosenAction = document.querySelector('input[name="adminDeleteDiscAction"]:checked')?.value || "move";
          if (chosenAction === "move") {
            const targetId = document.getElementById("adminDeleteDiscTargetSelect")?.value;
            options = { action: "move", targetDisciplinaId: targetId };
          } else {
            options = { action: "cascade" };
          }
        }

        const res = adminManager.deleteDisciplina(currentDisc.id, options);
        document.getElementById("adminDeleteDisciplineModal")?.classList.add("hidden");

        if (!res.success) {
          alert(res.message);
        } else {
          syncAppStateAndNotify(res.message);
        }
      });
    }

    document.getElementById("adminCancelDeleteDiscBtn")?.addEventListener("click", () => {
      document.getElementById("adminDeleteDisciplineModal")?.classList.add("hidden");
    });
    document.getElementById("adminCloseDeleteDiscModalBtn")?.addEventListener("click", () => {
      document.getElementById("adminDeleteDisciplineModal")?.classList.add("hidden");
    });
    document.getElementById("adminDeleteDisciplineModal")?.addEventListener("click", (e) => {
      if (e.target === document.getElementById("adminDeleteDisciplineModal")) {
        document.getElementById("adminDeleteDisciplineModal")?.classList.add("hidden");
      }
    });

    const discForm = document.getElementById("adminDisciplineForm");
    if (discForm) {
      discForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = document.getElementById("adminDisciplineId").value;
        const nome = document.getElementById("adminDisciplineName").value.trim();
        const codigo = document.getElementById("adminDisciplineCode").value.trim();
        const icone = document.getElementById("adminDisciplineIcon").value.trim() || "📚";
        const descricao = document.getElementById("adminDisciplineDesc").value.trim();

        if (!nome) {
          alert("Por favor, preencha o nome da disciplina.");
          return;
        }

        let msg = "";
        if (id) {
          adminManager.updateDisciplina(id, { nome, codigo, icone, descricao });
          msg = `Disciplina "${nome}" atualizada com sucesso!`;
        } else {
          const created = adminManager.createDisciplina({ nome, codigo, icone, descricao });
          msg = `Disciplina "${created.nome}" criada com sucesso!`;
        }

        document.getElementById("adminDisciplineModal").classList.add("hidden");
        syncAppStateAndNotify(msg);
      });
    }

    document.querySelectorAll(".disc-icon-preset-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const iconInput = document.getElementById("adminDisciplineIcon");
        if (iconInput) iconInput.value = btn.textContent.trim();
      });
    });

    document.getElementById("closeDisciplineModalBtn")?.addEventListener("click", () => {
      document.getElementById("adminDisciplineModal").classList.add("hidden");
    });
    document.getElementById("adminCancelDisciplineBtn")?.addEventListener("click", () => {
      document.getElementById("adminDisciplineModal").classList.add("hidden");
    });
    document.getElementById("adminDisciplineModal")?.addEventListener("click", (e) => {
      if (e.target === document.getElementById("adminDisciplineModal")) {
        document.getElementById("adminDisciplineModal").classList.add("hidden");
      }
    });

    // Registro de Service Worker para PWA (Progressive Web App)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
          console.log('✅ DietoCase Service Worker registrado com escopo:', reg.scope);
        }).catch((err) => {
          console.warn('Falha ao registrar Service Worker:', err);
        });
      });
    }

    // Suporte ao evento nativo de instalação do PWA (Progressive Web App)
    let deferredPwaPrompt = null;
    const installAppNavBtn = document.getElementById("navInstallAppBtn");
    const installAppModal = document.getElementById("installAppModal");
    const pwaTriggerBtn = document.getElementById("pwaTriggerInstallBtn");
    const pwaInstallBox = document.getElementById("pwaNativeInstallBox");
    const closeInstallAppModalBtn = document.getElementById("closeInstallAppModalBtn");
    const closeInstallAppModalBtn2 = document.getElementById("closeInstallAppModalBtn2");

    // Verifica se o app já está rodando em tela cheia / standalone (já instalado)
    const isAppRunningStandalone = window.matchMedia('(display-mode: standalone)').matches || (typeof navigator !== 'undefined' && navigator.standalone === true);
    if (isAppRunningStandalone && installAppNavBtn) {
      installAppNavBtn.classList.add("hidden");
    }

    // Captura o evento beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      // Previne a barra padrão automática do navegador para controlar a exibição pelo botão
      e.preventDefault();
      deferredPwaPrompt = e;
      console.log('📲 [PWA] Evento beforeinstallprompt capturado com sucesso!');

      // Destaca visualmente o botão "Instalar Aplicativo" no topo
      if (installAppNavBtn && !isAppRunningStandalone) {
        installAppNavBtn.classList.remove("bg-emerald-50", "text-emerald-800", "border-emerald-300");
        installAppNavBtn.classList.add("bg-emerald-600", "hover:bg-emerald-700", "text-white", "border-emerald-500", "shadow-sm");
        installAppNavBtn.setAttribute("title", "Clique para instalar o aplicativo no seu dispositivo");
      }

      if (pwaInstallBox) {
        pwaInstallBox.classList.remove("hidden");
      }
    });

    // Função central para acionar o prompt nativo de instalação
    async function triggerPwaInstallationFlow() {
      if (deferredPwaPrompt) {
        try {
          deferredPwaPrompt.prompt();
          const choiceResult = await deferredPwaPrompt.userChoice;
          console.log(`📲 [PWA] Resposta do usuário ao prompt de instalação: ${choiceResult.outcome}`);
          if (choiceResult.outcome === 'accepted') {
            showToast("🎉 Instalando DietoCase na tela inicial...");
            if (installAppNavBtn) installAppNavBtn.classList.add("hidden");
          }
        } catch (err) {
          console.warn("Aviso no prompt de instalação:", err);
        } finally {
          deferredPwaPrompt = null;
          if (pwaInstallBox) pwaInstallBox.classList.add("hidden");
          if (installAppModal) installAppModal.classList.add("hidden");
        }
      } else {
        // Se o navegador não suportar beforeinstallprompt (ex: iOS Safari), abre o modal com o guia ilustrado
        if (installAppModal) {
          installAppModal.classList.remove("hidden");
        }
      }
    }

    // Evento disparado quando o app é instalado com sucesso
    window.addEventListener('appinstalled', (evt) => {
      console.log('📲 [PWA] DietoCase instalado com sucesso na tela inicial!');
      deferredPwaPrompt = null;
      if (installAppNavBtn) installAppNavBtn.classList.add("hidden");
      if (pwaInstallBox) pwaInstallBox.classList.add("hidden");
      if (installAppModal) installAppModal.classList.add("hidden");
      showToast("🎉 DietoCase instalado com sucesso! Você já pode abrir direto pelo ícone na tela inicial.");
    });

    // Cliques nos botões de instalação
    if (installAppNavBtn) {
      installAppNavBtn.addEventListener("click", () => {
        triggerPwaInstallationFlow();
      });
    }

    if (pwaTriggerBtn) {
      pwaTriggerBtn.addEventListener("click", () => {
        triggerPwaInstallationFlow();
      });
    }

    if (closeInstallAppModalBtn && installAppModal) {
      closeInstallAppModalBtn.addEventListener("click", () => {
        installAppModal.classList.add("hidden");
      });
    }
    if (closeInstallAppModalBtn2 && installAppModal) {
      closeInstallAppModalBtn2.addEventListener("click", () => {
        installAppModal.classList.add("hidden");
      });
    }
    if (installAppModal) {
      installAppModal.addEventListener("click", (e) => {
        if (e.target === installAppModal) {
          installAppModal.classList.add("hidden");
        }
      });
    }
  }

  // Atualiza label do toggle de trava do caso
  function updateCaseLockLabel(isUnlocked) {
    const label = document.getElementById("admCaseLockLabel");
    if (!label) return;
    if (isUnlocked) {
      label.textContent = "Liberado para Alunos";
      label.className = "ml-2.5 text-xs font-bold text-emerald-800";
    } else {
      label.textContent = "Travado (Bloqueia Atendimento)";
      label.className = "ml-2.5 text-xs font-bold text-rose-700";
    }
  }

  // Atualiza label do toggle de visibilidade do caso
  function updateCaseVisibilityLabel(isVisible) {
    const label = document.getElementById("admCaseVisibilityLabel");
    if (!label) return;
    if (isVisible) {
      label.textContent = "Visível para Alunos";
      label.className = "ml-2.5 text-xs font-bold text-sky-800";
    } else {
      label.textContent = "Oculto para Alunos";
      label.className = "ml-2.5 text-xs font-bold text-slate-700";
    }
  }

  // Atualiza label do toggle de questões avaliativas do caso (principal e espelho na aba 7)
  function updateCaseQuestionsLabel(isEnabled) {
    const label = document.getElementById("admCaseEnableQuestionsLabel");
    const mirrorLabel = document.getElementById("admTabQuestionsMirrorLabel");
    const text = isEnabled ? "Habilitada" : "Desabilitada";
    const className = isEnabled ? "ml-2.5 text-xs font-bold text-amber-800 whitespace-nowrap" : "ml-2.5 text-xs font-bold text-slate-600 whitespace-nowrap";
    const mirrorClass = isEnabled ? "ml-2 text-xs font-bold text-amber-800 whitespace-nowrap" : "ml-2 text-xs font-bold text-slate-600 whitespace-nowrap";

    if (label) {
      label.textContent = text;
      label.className = className;
    }
    if (mirrorLabel) {
      mirrorLabel.textContent = text;
      mirrorLabel.className = mirrorClass;
    }

    const mainCb = document.getElementById("admCaseEnableQuestions");
    const mirrorCb = document.getElementById("admTabQuestionsMirrorToggle");
    if (mainCb && mainCb.checked !== isEnabled) mainCb.checked = isEnabled;
    if (mirrorCb && mirrorCb.checked !== isEnabled) mirrorCb.checked = isEnabled;
  }
  window.updateCaseQuestionsLabel = updateCaseQuestionsLabel;

  // Mapeamento amigável dos nomes das abas do prontuário
  const TAB_NAMES = {
    anamnese: "1. Anamnese e História Clínica",
    antropometria: "2. Antropometria e Composição Corporal",
    bioquimica: "3. Bioquímica e Exames Laboratoriais",
    examefisico: "4. Exame Físico e Sinais Clínicos",
    consumo: "5. Avaliação do Consumo Alimentar (R24h)",
    droganutriente: "Interações Droga-Nutriente",
    pes: "6. Diagnóstico Nutricional (PES)",
    necessidades: "7. Cálculos de Necessidades",
    prescricao: "8. Prescrição Dietética",
    cardapio: "9. Elaboração do Cardápio",
    questoes: "10. Questões Avaliativas"
  };

  // Verifica se uma aba está bloqueada para o aluno neste caso clínico
  function isStudentTabBlocked(tabId) {
    if (isTeacherAuthenticated) return false; // Professor tem acesso completo
    if (appState.workflowMode === "real" || appState.currentProntuario?.isRealPatient) return false; // Modo Atendimento Real é totalmente livre
    const btn = document.querySelector(`.student-tab-btn[data-tab="${tabId}"]`);
    if (btn && btn.dataset.isBlocked === "true") return true;
    const currentCase = appState.currentCase;
    if (!currentCase) return false;
    const blocked = Array.isArray(currentCase.blockedTabs) ? currentCase.blockedTabs : [];
    return blocked.includes(tabId);
  }

  // Aplica classes visuais de bloqueio nos botões das abas do aluno e controla exibição de questões
  function applyStudentTabBlockingState(caseData) {
    // No Atendimento Real, todas as abas clínicas ficam desimpedidas e a de questões avaliativas fica oculta
    if (appState.workflowMode === "real" || appState.currentProntuario?.isRealPatient) {
      const questionsTabBtn = document.querySelector('.student-tab-btn[data-tab="questoes"]');
      if (questionsTabBtn) questionsTabBtn.classList.add("hidden");
      document.querySelectorAll(".student-tab-btn").forEach(btn => {
        btn.classList.remove("opacity-50", "bg-slate-100", "text-slate-400", "cursor-not-allowed");
        delete btn.dataset.isBlocked;
        btn.removeAttribute("title");
        const lockSpan = btn.querySelector(".tab-lock-indicator");
        if (lockSpan) lockSpan.remove();
      });
      return;
    }

    if (!caseData) return;
    const blockedTabs = Array.isArray(caseData.blockedTabs) ? caseData.blockedTabs : [];
    const questionsEnabled = caseData.habilitarQuestoesAvaliativas !== false;

    // Controle de exibição da aba 'Questões Avaliativas' para o aluno
    const questionsTabBtn = document.querySelector('.student-tab-btn[data-tab="questoes"]');
    if (questionsTabBtn) {
      if (!questionsEnabled) {
        questionsTabBtn.classList.add("hidden");
        // Se o aluno estiver na aba de questões e ela estiver desabilitada, redireciona
        if (appState.activeStudentTab === "questoes") {
          const targetBtn = document.querySelector('.student-tab-btn[data-tab="cardapio"]') || document.querySelector('.student-tab-btn[data-tab="anamnese"]');
          if (targetBtn) targetBtn.click();
        }
      } else {
        questionsTabBtn.classList.remove("hidden");
      }
    }

    document.querySelectorAll(".student-tab-btn").forEach(btn => {
      const tabId = btn.dataset.tab;
      const isBlocked = blockedTabs.includes(tabId);
      let lockSpan = btn.querySelector(".tab-lock-indicator");

      if (isBlocked) {
        btn.classList.add("opacity-50", "bg-slate-100", "text-slate-400", "cursor-not-allowed");
        btn.dataset.isBlocked = "true";
        btn.setAttribute("title", `🔒 Etapa bloqueada pelo professor: ${TAB_NAMES[tabId] || tabId}`);
        if (!lockSpan) {
          lockSpan = document.createElement("span");
          lockSpan.className = "tab-lock-indicator text-[11px] ml-1.5 font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1 rounded shadow-2xs";
          lockSpan.textContent = "🔒";
          btn.appendChild(lockSpan);
        }
      } else {
        btn.classList.remove("opacity-50", "bg-slate-100", "text-slate-400", "cursor-not-allowed");
        delete btn.dataset.isBlocked;
        btn.removeAttribute("title");
        if (lockSpan) lockSpan.remove();
      }
    });

    // Se o aluno estiver atualmente em uma aba bloqueada, redireciona para a primeira desimpedida
    if (!isTeacherAuthenticated && appState.activeStudentTab && blockedTabs.includes(appState.activeStudentTab)) {
      const allTabs = ["anamnese", "antropometria", "bioquimica", "examefisico", "consumo", "droganutriente", "pes", "necessidades", "prescricao", "cardapio"];
      if (questionsEnabled) allTabs.push("questoes");
      const firstAvailable = allTabs.find(t => !blockedTabs.includes(t)) || "anamnese";
      const targetBtn = document.querySelector(`.student-tab-btn[data-tab="${firstAvailable}"]`);
      if (targetBtn) {
        targetBtn.click();
      }
      showToast(`🔒 A etapa '${TAB_NAMES[appState.activeStudentTab] || appState.activeStudentTab}' foi bloqueada pelo professor.`);
    }
  }
  window.applyStudentTabBlockingState = applyStudentTabBlockingState;

  // Abre modal informando que a etapa foi bloqueada pelo professor
  function openStudentBlockedTabModal(tabId) {
    const modal = document.getElementById("studentBlockedTabModal");
    const tabNameEl = document.getElementById("blockedTabModalTabName");
    if (tabNameEl) {
      tabNameEl.textContent = TAB_NAMES[tabId] || tabId;
    }
    if (modal) modal.classList.remove("hidden");
  }

  function closeStudentBlockedTabModal() {
    const modal = document.getElementById("studentBlockedTabModal");
    if (modal) modal.classList.add("hidden");
  }
  window.openStudentBlockedTabModal = openStudentBlockedTabModal;
  window.closeStudentBlockedTabModal = closeStudentBlockedTabModal;

  // Preenche checkboxes de bloqueio de abas na Aba 9 do Editor do Professor
  function populateBlockedTabsInEditor(blockedTabs = []) {
    const safeBlocked = Array.isArray(blockedTabs) ? blockedTabs : [];
    document.querySelectorAll(".adm-tab-block-checkbox").forEach(cb => {
      const tabId = cb.dataset.tabId;
      cb.checked = safeBlocked.includes(tabId);
    });
    updateBlockedTabsCountLabel();
  }

  // Lê abas selecionadas para bloqueio no Editor do Professor
  function readBlockedTabsFromEditor() {
    const blocked = [];
    document.querySelectorAll(".adm-tab-block-checkbox").forEach(cb => {
      if (cb.checked && cb.dataset.tabId) {
        blocked.push(cb.dataset.tabId);
      }
    });
    return blocked;
  }

  // Atualiza label do contador de abas bloqueadas no editor
  function updateBlockedTabsCountLabel() {
    const label = document.getElementById("admBlockedCountLabel");
    if (!label) return;
    const count = document.querySelectorAll(".adm-tab-block-checkbox:checked").length;
    label.textContent = `${count} ${count === 1 ? "aba bloqueada" : "abas bloqueadas"} neste caso`;
    if (count > 0) {
      label.className = "text-[11px] font-bold text-rose-700";
    } else {
      label.className = "text-[11px] font-semibold text-slate-700";
    }
  }

  // Modal de Configuração do Firebase
  function openFirebaseConfigModal() {
    const modal = document.getElementById("firebaseConfigModal");
    if (!modal) return;

    const currentCfg = (typeof firebaseSyncService !== "undefined" && firebaseSyncService.config)
      ? firebaseSyncService.config
      : (window.FIREBASE_CONFIG || {});

    const apiKeyInput = document.getElementById("fbInputApiKey");
    const projIdInput = document.getElementById("fbInputProjectId");
    const authDomInput = document.getElementById("fbInputAuthDomain");
    const bucketInput = document.getElementById("fbInputStorageBucket");
    const appIdInput = document.getElementById("fbInputAppId");

    if (apiKeyInput) apiKeyInput.value = currentCfg.apiKey || "";
    if (projIdInput) projIdInput.value = currentCfg.projectId || "";
    if (authDomInput) authDomInput.value = currentCfg.authDomain || "";
    if (bucketInput) bucketInput.value = currentCfg.storageBucket || "";
    if (appIdInput) appIdInput.value = currentCfg.appId || "";

    const badge = document.getElementById("fbModalStatusBadge");
    if (badge) {
      const isConfigured = (typeof firebaseSyncService !== "undefined" && firebaseSyncService.isConfigured());
      if (isConfigured) {
        badge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800";
        badge.textContent = "Conectado ao Firestore";
      } else {
        badge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800";
        badge.textContent = "Chaves Pendentes";
      }
    }

    modal.classList.remove("hidden");
  }

  function closeFirebaseConfigModal() {
    const modal = document.getElementById("firebaseConfigModal");
    if (modal) modal.classList.add("hidden");
  }

  function saveFirebaseConfigFromModal() {
    const apiKey = document.getElementById("fbInputApiKey")?.value.trim() || "";
    const projectId = document.getElementById("fbInputProjectId")?.value.trim() || "";
    const authDomain = document.getElementById("fbInputAuthDomain")?.value.trim() || "";
    const storageBucket = document.getElementById("fbInputStorageBucket")?.value.trim() || "";
    const appId = document.getElementById("fbInputAppId")?.value.trim() || "";

    if (!apiKey || !projectId) {
      alert("Por favor, preencha ao menos o 'API Key' e o 'Project ID' fornecidos pelo console do Firebase.");
      return;
    }

    const newConfig = { apiKey, projectId, authDomain, storageBucket, appId };

    try {
      localStorage.setItem("dietocase_custom_firebase_config", JSON.stringify(newConfig));
      if (window.FIREBASE_CONFIG) {
        Object.assign(window.FIREBASE_CONFIG, newConfig);
      }
      if (typeof firebaseSyncService !== "undefined") {
        firebaseSyncService.config = newConfig;
        firebaseSyncService.init();
      }
      if (typeof dietoSyncEngine !== "undefined") {
        dietoSyncEngine.init();
      }
      closeFirebaseConfigModal();
      showToast("Configuração do Firebase salva com sucesso! Conectando à nuvem...");
    } catch (e) {
      console.error("Erro ao salvar configuração do Firebase:", e);
      alert("Erro ao salvar credenciais no navegador: " + e.message);
    }
  }

  function clearFirebaseConfigFromModal() {
    if (!confirm("Deseja remover as credenciais personalizadas do Firebase? O aplicativo voltará a operar em modo local.")) {
      return;
    }

    try {
      localStorage.removeItem("dietocase_custom_firebase_config");
      const emptyConfig = { apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "" };
      if (window.FIREBASE_CONFIG) {
        Object.assign(window.FIREBASE_CONFIG, emptyConfig);
      }
      if (typeof firebaseSyncService !== "undefined") {
        firebaseSyncService.config = emptyConfig;
        firebaseSyncService.status = "unconfigured";
        firebaseSyncService.listeners.forEach(cb => cb("unconfigured_firebase"));
      }

      const apiKeyInput = document.getElementById("fbInputApiKey");
      const projIdInput = document.getElementById("fbInputProjectId");
      const authDomInput = document.getElementById("fbInputAuthDomain");
      const bucketInput = document.getElementById("fbInputStorageBucket");
      const appIdInput = document.getElementById("fbInputAppId");
      if (apiKeyInput) apiKeyInput.value = "";
      if (projIdInput) projIdInput.value = "";
      if (authDomInput) authDomInput.value = "";
      if (bucketInput) bucketInput.value = "";
      if (appIdInput) appIdInput.value = "";

      closeFirebaseConfigModal();
      showToast("Credenciais do Firebase removidas. Operando em modo local.");
    } catch (e) {
      console.error("Erro ao limpar configuração do Firebase:", e);
    }
  }

  // Renderiza a lista dinâmica de profissionais na Aba 6 do editor de caso
  function renderAdminEquipeList(equipeList) {
    const container = document.getElementById("adminEquipeListContainer");
    if (!container) return;
    container.innerHTML = "";

    const list = Array.isArray(equipeList) ? equipeList : [];

    if (list.length === 0) {
      container.innerHTML = `
        <div id="adminEquipeEmptyBanner" class="bg-amber-50/70 border border-amber-200 rounded-xl p-5 text-center text-xs text-amber-800">
          <div class="text-2xl mb-1">👥</div>
          <strong class="block mb-1">Nenhum profissional cadastrado na equipe deste caso clínico.</strong>
          <p class="text-amber-700">Selecione uma especialidade acima e clique em <strong>"+ Acrescentar Profissional"</strong> para incluir médicos, enfermeiros, fonoaudiólogos, fisioterapeutas, psicólogos ou outros especialistas.</p>
        </div>
      `;
      return;
    }

    list.forEach((prof, idx) => {
      const card = createAdminProfCard(prof, idx);
      container.appendChild(card);
    });
  }

  // Cria elemento visual do card de profissional para edição e retirada na Aba 6
  function createAdminProfCard(prof, idx = Date.now()) {
    const card = document.createElement("div");
    card.className = "admin-prof-card bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 transition hover:border-slate-300";
    card.dataset.profId = prof.id || `prof_${idx}`;

    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div class="flex items-center space-x-2 flex-1 min-w-[240px]">
          <!-- Avatar Emoji -->
          <input type="text" class="prof-avatar-input w-11 text-center text-lg border border-slate-300 rounded-lg p-1 bg-slate-50 focus:bg-white" value="${escapeHtml(prof.avatar || '🩺')}" title="Emoji ou ícone do profissional">
          
          <!-- Cargo / Especialidade -->
          <div class="flex-1">
            <input type="text" class="prof-name-input w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:border-emerald-500" value="${escapeHtml(prof.nome || 'Profissional de Saúde')}" placeholder="Nome ou cargo (Ex: Fisioterapeuta Respiratório)">
          </div>
        </div>

        <!-- Botão Retirar Profissional da Equipe -->
        <button type="button" class="admin-remove-prof-btn text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 text-xs font-semibold px-2.5 py-1 rounded-lg transition flex items-center space-x-1" title="Retirar este profissional da equipe do caso">
          <span>✕</span>
          <span>Retirar da Equipe</span>
        </button>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="block text-[11px] font-bold text-slate-700">
            Parecer Clínico, Avaliação e Conduta:
          </label>
          <span class="text-[10px] text-slate-400">Dados repassados ao estudante no chat</span>
        </div>
        <textarea class="prof-parecer-input w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 leading-relaxed" rows="3" placeholder="Insira a avaliação clínica, sinais vitais, hipóteses, evolução ou conduta deste profissional para o caso...">${escapeHtml(prof.parecer || '')}</textarea>
      </div>
    `;

    // Ação do botão retirar da equipe
    card.querySelector(".admin-remove-prof-btn").addEventListener("click", () => {
      const nomeProf = card.querySelector(".prof-name-input")?.value.trim() || "Profissional";
      card.remove();
      
      const container = document.getElementById("adminEquipeListContainer");
      if (container && container.querySelectorAll(".admin-prof-card").length === 0) {
        renderAdminEquipeList([]);
      }
      showToast(`Profissional "${nomeProf}" retirado da equipe.`);
    });

    return card;
  }

  // Renderiza a lista de casos no painel do professor filtrada pela disciplina ativa
  function renderAdminCasesList() {
    adminManager.refreshCases();
    adminManager.refreshDisciplinas();
    updateAdminMetrics();
    renderStudentCatalog();
    const container = document.getElementById("adminCasesListContainer");
    if (!container) return;
    container.innerHTML = "";

    const activeDiscId = adminManager.activeDisciplinaId || "dietoterapia";
    const activeDisc = adminManager.getDisciplinaById(activeDiscId);
    const discCases = adminManager.cases.filter(c => (c.disciplinaId || "dietoterapia") === activeDiscId);

    if (discCases.length === 0) {
      container.innerHTML = `
        <div class="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500">
          <div class="text-3xl mb-2">${activeDisc?.icone || '📁'}</div>
          <h4 class="font-bold text-sm text-slate-700 mb-1">Nenhum caso clínico cadastrado nesta disciplina</h4>
          <p class="text-xs text-slate-400 mb-4">A disciplina "${escapeHtml(activeDisc?.nome || 'Selecionada')}" ainda não possui casos clínicos cadastrados.</p>
          <div class="flex flex-wrap items-center justify-center gap-2">
            <button id="adminEmptyCreateCaseBtn" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer">
              + Criar Caso Nesta Disciplina
            </button>
            <button id="adminEmptyUploadCaseBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer">
              📄 Subir Arquivo para Esta Disciplina
            </button>
          </div>
        </div>
      `;

      document.getElementById("adminEmptyCreateCaseBtn")?.addEventListener("click", () => {
        const newCase = adminManager.getEmptyCase();
        newCase.disciplinaId = activeDiscId;
        adminManager.editingCaseId = newCase.id;
        populateAdminEditor(newCase);
        openAdminEditor();
      });

      document.getElementById("adminEmptyUploadCaseBtn")?.addEventListener("click", () => {
        showAdminUploadCase();
        const uploadDiscSelect = document.getElementById("adminUploadCaseDiscipline");
        if (uploadDiscSelect) uploadDiscSelect.value = activeDiscId;
      });

      return;
    }

    discCases.forEach(c => {
      const card = document.createElement("div");
      card.className = `bg-white border ${c.isLocked ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'} rounded-xl p-5 shadow-sm hover:shadow transition flex flex-col justify-between`;
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-1.5">
              <span class="badge-clinical bg-slate-100 text-slate-800">${escapeHtml(c.category || 'Clínica')}</span>
              <span class="badge-clinical bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px]">${activeDisc?.icone || '📚'} ${escapeHtml(activeDisc?.nome || 'Disciplina')}</span>
            </div>
            <div class="flex items-center space-x-1.5">
              ${c.visivel === false
                ? '<span class="badge-clinical bg-slate-200 text-slate-800 border border-slate-300">🙈 Oculto</span>'
                : '<span class="badge-clinical bg-sky-100 text-sky-800 border border-sky-300">👁️ Visível</span>'
              }
              ${c.isLocked 
                ? '<span class="badge-clinical bg-rose-100 text-rose-800 border border-rose-300">🔒 Travado</span>' 
                : '<span class="badge-clinical bg-emerald-100 text-emerald-800 border border-emerald-300">🔓 Liberado</span>'
              }
            </div>
          </div>
          <h3 class="font-bold text-slate-800 text-base mb-1">${escapeHtml(c.title)}</h3>
          <p class="text-xs text-slate-500 mb-3 flex items-center">
            <span class="text-lg mr-1.5">${c.patient?.avatar || '👤'}</span>
            <strong>${escapeHtml(c.patient?.name || 'Paciente')}</strong>, ${c.patient?.age || '--'} anos (${c.patient?.gender || '--'})
          </p>
          <p class="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">${escapeHtml(c.description || '')}</p>
          <div class="flex items-center space-x-3 text-xs text-slate-500 border-t border-slate-100 pt-2 mb-4">
            <span>🧪 ${(c.bioquimica || []).length} exames</span>
            <span>❓ ${(c.questoesAvaliativas || []).length} questões</span>
          </div>
        </div>
        <div class="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
          <button class="px-2.5 py-1.5 text-xs font-semibold ${c.visivel === false ? 'bg-slate-700 hover:bg-slate-800 text-white' : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300'} rounded transition adm-vis-btn" data-id="${c.id}" title="${c.visivel === false ? 'Caso oculto para os alunos. Clique para mostrar.' : 'Caso visível para os alunos. Clique para ocultar.'}">
            ${c.visivel === false ? '🙈 Oculto' : '👁️ Visível'}
          </button>
          <button class="px-2.5 py-1.5 text-xs font-semibold ${c.isLocked ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'} rounded transition adm-lock-btn" data-id="${c.id}" title="${c.isLocked ? 'Liberar caso para os alunos' : 'Travar caso'}">
            ${c.isLocked ? '🔓 Liberar' : '🔒 Travar'}
          </button>
          <button class="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition adm-dup-btn" data-id="${c.id}">Duplicar</button>
          <button class="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded transition adm-edit-btn" data-id="${c.id}">Editar</button>
          <button class="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded transition adm-del-btn" data-id="${c.id}">Excluir</button>
        </div>
      `;
      container.appendChild(card);
    });

    // Listeners do botão Ocultar / Mostrar caso (Visibilidade)
    container.querySelectorAll(".adm-vis-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const btnEl = e.currentTarget || e.target.closest(".adm-vis-btn");
        const id = btnEl?.dataset?.id;
        if (!id) return;
        const isNowVisible = adminManager.toggleCaseVisibility(id);
        syncAppStateAndNotify(isNowVisible ? "Caso agora visível para os alunos!" : "Caso ocultado para os alunos!");
      });
    });

    // Listeners do botão Travar / Liberar caso
    container.querySelectorAll(".adm-lock-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const btnEl = e.currentTarget || e.target.closest(".adm-lock-btn");
        const id = btnEl?.dataset?.id;
        if (!id) return;
        const isNowLocked = adminManager.toggleCaseLock(id);
        syncAppStateAndNotify(isNowLocked ? "Caso travado (bloqueado para os alunos)!" : "Caso liberado para os alunos com sucesso!");
      });
    });

    // Listeners dos botões de ação nos cartões
    container.querySelectorAll(".adm-edit-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const btnEl = e.currentTarget || e.target.closest(".adm-edit-btn");
        const id = btnEl?.dataset?.id;
        if (!id) return;
        const c = adminManager.getCaseById(id);
        if (c) {
          adminManager.editingCaseId = id;
          populateAdminEditor(c);
          openAdminEditor();
        }
      });
    });

    container.querySelectorAll(".adm-dup-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const btnEl = e.currentTarget || e.target.closest(".adm-dup-btn");
        const id = btnEl?.dataset?.id;
        if (!id) return;
        adminManager.duplicateCase(id);
        syncAppStateAndNotify("Caso duplicado com sucesso!");
      });
    });

    container.querySelectorAll(".adm-del-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const btnEl = e.currentTarget || e.target.closest(".adm-del-btn");
        const id = btnEl?.dataset?.id;
        if (!id) return;
        if (confirm("Tem certeza que deseja excluir este caso clínico?")) {
          adminManager.deleteCase(id);
          syncAppStateAndNotify("Caso clínico excluído com sucesso.");
        }
      });
    });
  }

  function openAdminEditor() {
    document.getElementById("adminCasesListSection").classList.add("hidden");
    document.getElementById("adminUploadCaseSection")?.classList.add("hidden");
    document.getElementById("adminCaseEditorSection").classList.remove("hidden");
    // Seleciona a primeira aba
    document.querySelector('[data-admintab="identificacao"]').click();
  }

  function closeAdminEditor() {
    document.getElementById("adminCaseEditorSection").classList.add("hidden");
    document.getElementById("adminUploadCaseSection")?.classList.add("hidden");
    document.getElementById("adminCasesListSection").classList.remove("hidden");
  }

  function showAdminUploadCase() {
    document.getElementById("adminCasesListSection").classList.add("hidden");
    document.getElementById("adminCaseEditorSection").classList.add("hidden");
    const uploadSection = document.getElementById("adminUploadCaseSection");
    if (uploadSection) {
      uploadSection.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function hideAdminUploadCase() {
    const uploadSection = document.getElementById("adminUploadCaseSection");
    if (uploadSection) uploadSection.classList.add("hidden");
    document.getElementById("adminCasesListSection").classList.remove("hidden");
  }

  // Preenche o formulário do editor de casos com dados do caso
  function populateAdminEditor(c) {
    populateDisciplineDropdowns();
    document.getElementById("admCaseTitle").value = c.title || "";
    const discSelect = document.getElementById("admCaseDiscipline");
    if (discSelect) {
      discSelect.value = c.disciplinaId || adminManager.activeDisciplinaId || "dietoterapia";
    }
    document.getElementById("admCaseCategory").value = c.category || "";
    document.getElementById("admCaseDesc").value = c.description || "";
    
    // Status de Trava / Liberação
    const isUnlocked = c.isLocked !== true;
    const lockCheckbox = document.getElementById("admCaseIsUnlocked");
    if (lockCheckbox) {
      lockCheckbox.checked = isUnlocked;
      updateCaseLockLabel(isUnlocked);
    }

    // Status de Visibilidade (Ocultar / Mostrar)
    const isVisible = c.visivel !== false;
    const visCheckbox = document.getElementById("admCaseIsVisible");
    if (visCheckbox) {
      visCheckbox.checked = isVisible;
      updateCaseVisibilityLabel(isVisible);
    }

    // Status de Questões Avaliativas (Habilitar / Desabilitar)
    const isQuestionsEnabled = c.habilitarQuestoesAvaliativas !== false;
    updateCaseQuestionsLabel(isQuestionsEnabled);
    
    // Bloqueio de Abas do Aluno (Tempo Real)
    populateBlockedTabsInEditor(c.blockedTabs || []);
    
    // Paciente
    document.getElementById("admPatName").value = c.patient?.name || "";
    document.getElementById("admPatAge").value = c.patient?.age || "";
    document.getElementById("admPatGender").value = c.patient?.gender || "Feminino";
    document.getElementById("admPatOccupation").value = c.patient?.occupation || "";
    document.getElementById("admPatMarital").value = c.patient?.maritalStatus || "";
    document.getElementById("admPatResidence").value = c.patient?.residence || "";
    document.getElementById("admPatAvatar").value = c.patient?.avatar || "👤";
    if (document.getElementById("admHipoteseDiagnostica")) {
      document.getElementById("admHipoteseDiagnostica").value = c.hipoteseDiagnostica || c.history?.hipoteseDiagnostica || "";
    }

    // História Clínica
    document.getElementById("admHistQP").value = c.history?.queixaPrincipal || "";
    document.getElementById("admHistHDA").value = c.history?.hda || "";
    document.getElementById("admHistHPP").value = c.history?.hpp || "";
    document.getElementById("admHistFamilia").value = c.history?.historiaFamiliar || "";
    document.getElementById("admHistMeds").value = c.history?.medicamentos || "";
    document.getElementById("admHistHabitos").value = c.history?.habitosVida || "";
    document.getElementById("admHistEliminacoes").value = c.history?.funcaoIntestinalDiurese || "";

    // Antropometria
    document.getElementById("admAntroPesoAtual").value = c.antropometria?.pesoAtual || "";
    document.getElementById("admAntroPesoHab").value = c.antropometria?.pesoHabitual || "";
    document.getElementById("admAntroAltura").value = c.antropometria?.estatura || "";
    if (document.getElementById("admAntroAJ")) {
      document.getElementById("admAntroAJ").value = c.antropometria?.alturaJoelho || "";
    }
    document.getElementById("admAntroCC").value = c.antropometria?.circunferenciaCintura || "";
    document.getElementById("admAntroCB").value = c.antropometria?.circunferenciaBraco || "";
    document.getElementById("admAntroDCT").value = c.antropometria?.dobraTricipital || "";
    document.getElementById("admAntroCP").value = c.antropometria?.circunferenciaPanturrilha || "";
    if (document.getElementById("admAntroDemaisAvaliacoes")) {
      document.getElementById("admAntroDemaisAvaliacoes").value = c.antropometria?.demaisAvaliacoes || "";
    }
    document.getElementById("admAntroPerda").value = c.antropometria?.historicoPerdaPonderal || "";

    // Bioquímica
    renderAdminBioTable(c.bioquimica || []);

    // Exame Físico
    document.getElementById("admEfEstadoGeral").value = c.exameFisico?.estadoGeral || "";
    document.getElementById("admEfSinais").value = c.exameFisico?.sinaisEspecificos || "";
    document.getElementById("admEfEdema").value = c.exameFisico?.edema || "";
    document.getElementById("admEfBoca").value = c.exameFisico?.cavidadeOral || "";
    document.getElementById("admEfTGI").value = c.exameFisico?.tgi || "";

    // Consumo Alimentar
    document.getElementById("admCaPadrao").value = c.consumoAlimentar?.padraoDiario || "";
    renderAdminRecTable(c.consumoAlimentar?.recordatorio24h || []);
    document.getElementById("admCaAgua").value = c.consumoAlimentar?.ingestaoHidrica || "";
    document.getElementById("admCaPreferencias").value = c.consumoAlimentar?.preferencias || "";
    document.getElementById("admCaAversoes").value = c.consumoAlimentar?.aversoesIntolerancias || "";
    document.getElementById("admCaQuemPrepara").value = c.consumoAlimentar?.quemPrepara || "";

    // Equipe Multiprofissional Dinâmica
    const equipeNormalizada = (typeof normalizeEquipeMultiprofissional === "function")
      ? normalizeEquipeMultiprofissional(c.equipeMultiprofissional)
      : [];
    renderAdminEquipeList(equipeNormalizada);

    // Questões Avaliativas
    renderAdminQuestionsList(c.questoesAvaliativas || []);

    // Gabarito / Resolução
    document.getElementById("admGabDiag").value = c.resolucaoGabarito?.diagnosticoNutricional || "";
    document.getElementById("admGabCalc").value = c.resolucaoGabarito?.calculoEnergetico || "";
    document.getElementById("admGabMacros").value = c.resolucaoGabarito?.distribuicaoMacronutrientes || "";
    document.getElementById("admGabConduta").value = c.resolucaoGabarito?.condutaPlanejamento || "";
  }

  // Tabela de Bioquímica no Admin
  function renderAdminBioTable(bioList) {
    const tbody = document.getElementById("adminBioTableBody");
    tbody.innerHTML = "";
    bioList.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-slate-100";
      const evalBadge = (typeof renderBiochemicalValueCell === "function")
        ? renderBiochemicalValueCell(item.valor || "", item.referencia || "")
        : "";

      tr.innerHTML = `
        <td class="p-1.5"><input type="text" class="w-full border rounded px-2 py-1 text-xs bio-exame" value="${escapeHtml(item.exame || '')}"></td>
        <td class="p-1.5">
          <div class="space-y-1">
            <input type="text" class="w-full border rounded px-2 py-1 text-xs bio-valor font-semibold text-slate-800" value="${escapeHtml(item.valor || '')}">
            <div class="admin-bio-eval-preview text-[10px]">${evalBadge}</div>
          </div>
        </td>
        <td class="p-1.5"><input type="text" class="w-full border rounded px-2 py-1 text-xs bio-ref font-mono" value="${escapeHtml(item.referencia || '')}"></td>
        <td class="p-1.5"><input type="text" class="w-full border rounded px-2 py-1 text-xs bio-interp" value="${escapeHtml(item.interpretacao || '')}"></td>
        <td class="p-1.5 text-center"><button type="button" class="text-rose-500 font-bold hover:text-rose-700 remove-bio-row cursor-pointer" data-idx="${idx}">✕</button></td>
      `;
      tbody.appendChild(tr);
    });

    // Atualiza preview ao vivo ao digitar valor ou referência no painel do professor
    tbody.querySelectorAll("tr").forEach(row => {
      const valInput = row.querySelector(".bio-valor");
      const refInput = row.querySelector(".bio-ref");
      const preview = row.querySelector(".admin-bio-eval-preview");
      const updatePreview = () => {
        if (preview && typeof renderBiochemicalValueCell === "function") {
          preview.innerHTML = renderBiochemicalValueCell(valInput.value, refInput.value);
        }
      };
      if (valInput) valInput.addEventListener("input", updatePreview);
      if (refInput) refInput.addEventListener("input", updatePreview);
    });

    tbody.querySelectorAll(".remove-bio-row").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.target.closest("tr").remove();
      });
    });
  }

  const QUICK_BIO_CATALOG = {
    glicemia: { exame: "Glicemia de Jejum", valor: "", referencia: "< 99 mg/dL", interpretacao: "Normal" },
    hba1c: { exame: "Hemoglobina Glicada (HbA1c)", valor: "", referencia: "< 5.7%", interpretacao: "Normal" },
    colesterol_total: { exame: "Colesterol Total", valor: "", referencia: "< 190 mg/dL", interpretacao: "Desejável" },
    hdl: { exame: "Colesterol HDL", valor: "", referencia: "> 40 mg/dL", interpretacao: "Desejável" },
    ldl: { exame: "Colesterol LDL", valor: "", referencia: "< 100 mg/dL", interpretacao: "Ótimo" },
    triglicerideos: { exame: "Triglicerídeos", valor: "", referencia: "< 150 mg/dL", interpretacao: "Normal" },
    creatinina: { exame: "Creatinina Sérica", valor: "", referencia: "0.7 - 1.2 mg/dL", interpretacao: "Normal" },
    ureia: { exame: "Ureia Sérica", valor: "", referencia: "15 - 40 mg/dL", interpretacao: "Normal" },
    hemoglobina: { exame: "Hemoglobina", valor: "", referencia: "12.0 - 16.0 g/dL", interpretacao: "Normal" },
    hematocrito: { exame: "Hematócrito", valor: "", referencia: "36 - 48%", interpretacao: "Normal" },
    albumina: { exame: "Albumina Sérica", valor: "", referencia: "3.5 - 5.0 g/dL", interpretacao: "Normal" },
    potassio: { exame: "Potássio (K+)", valor: "", referencia: "3.5 - 5.1 mEq/L", interpretacao: "Normal" },
    sodio: { exame: "Sódio (Na+)", valor: "", referencia: "135 - 145 mEq/L", interpretacao: "Normal" },
    tgo: { exame: "TGO / AST", valor: "", referencia: "< 35 U/L", interpretacao: "Normal" },
    tgp: { exame: "TGP / ALT", valor: "", referencia: "< 35 U/L", interpretacao: "Normal" },
    ferritina: { exame: "Ferritina", valor: "", referencia: "30 - 300 ng/mL", interpretacao: "Normal" },
    pcr: { exame: "Proteína C Reativa (PCR)", valor: "", referencia: "< 5.0 mg/L", interpretacao: "Normal" },
    acido_urico: { exame: "Ácido Úrico", valor: "", referencia: "3.0 - 7.0 mg/dL", interpretacao: "Normal" }
  };

  function addBioRow(exame = "", valor = "", referencia = "", interpretacao = "") {
    const tbody = document.getElementById("adminBioTableBody");
    if (!tbody) return;
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.innerHTML = `
      <td class="p-1.5"><input type="text" class="w-full border rounded px-2 py-1 text-xs bio-exame" value="${escapeHtml(exame)}" placeholder="Ex: Creatinina Sérica"></td>
      <td class="p-1.5"><input type="text" class="w-full border rounded px-2 py-1 text-xs bio-valor" value="${escapeHtml(valor)}" placeholder="Ex: 1.2 mg/dL"></td>
      <td class="p-1.5"><input type="text" class="w-full border rounded px-2 py-1 text-xs bio-ref" value="${escapeHtml(referencia)}" placeholder="Ex: 0.7 - 1.2 mg/dL"></td>
      <td class="p-1.5"><input type="text" class="w-full border rounded px-2 py-1 text-xs bio-interp" value="${escapeHtml(interpretacao)}" placeholder="Ex: Normal"></td>
      <td class="p-1.5 text-center"><button type="button" class="text-rose-500 font-bold hover:text-rose-700 remove-bio-row">✕</button></td>
    `;
    tr.querySelector(".remove-bio-row").addEventListener("click", () => tr.remove());
    tbody.appendChild(tr);
    const valInput = tr.querySelector(".bio-valor");
    if (valInput) valInput.focus();
    return tr;
  }

  document.getElementById("adminAddBioRowBtn")?.addEventListener("click", () => {
    addBioRow();
  });

  document.getElementById("adminAddQuickBioBtn")?.addEventListener("click", () => {
    const select = document.getElementById("adminQuickBioSelect");
    const key = select?.value;
    if (!key || !QUICK_BIO_CATALOG[key]) {
      showToast("Selecione um exame do catálogo primeiro.", "warning");
      return;
    }
    const item = QUICK_BIO_CATALOG[key];
    addBioRow(item.exame, item.valor, item.referencia, item.interpretacao);
    showToast(`Exame "${item.exame}" inserido com valores de referência!`);
  });

  // Tabela de Recordatório no Admin
  function renderAdminRecTable(recList) {
    const tbody = document.getElementById("adminRecTableBody");
    tbody.innerHTML = "";
    recList.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-slate-100";
      tr.innerHTML = `
        <td class="p-1.5 w-44"><input type="text" class="w-full border rounded px-2 py-1 text-xs rec-ref" value="${escapeHtml(item.refeicao || '')}"></td>
        <td class="p-1.5"><textarea class="w-full border rounded px-2 py-1 text-xs rec-alimentos" rows="2">${escapeHtml(item.alimentos || '')}</textarea></td>
        <td class="p-1.5 text-center w-12"><button type="button" class="text-rose-500 font-bold hover:text-rose-700 remove-rec-row">✕</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".remove-rec-row").forEach(btn => {
      btn.addEventListener("click", (e) => e.target.closest("tr").remove());
    });
  }

  function addRecRow(refeicao = "", alimentos = "") {
    const tbody = document.getElementById("adminRecTableBody");
    if (!tbody) return;
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.innerHTML = `
      <td class="p-1.5 w-44"><input type="text" class="w-full border rounded px-2 py-1 text-xs rec-ref" value="${escapeHtml(refeicao)}" placeholder="Ex: Café da manhã"></td>
      <td class="p-1.5"><textarea class="w-full border rounded px-2 py-1 text-xs rec-alimentos" rows="2" placeholder="Descreva os alimentos ingeridos">${escapeHtml(alimentos)}</textarea></td>
      <td class="p-1.5 text-center w-12"><button type="button" class="text-rose-500 font-bold hover:text-rose-700 remove-rec-row">✕</button></td>
    `;
    tr.querySelector(".remove-rec-row").addEventListener("click", () => tr.remove());
    tbody.appendChild(tr);
    const textarea = tr.querySelector(".rec-alimentos");
    if (textarea) textarea.focus();
    return tr;
  }

  document.getElementById("adminAddRecRowBtn")?.addEventListener("click", () => {
    addRecRow();
  });

  document.querySelectorAll(".admin-quick-rec-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const meal = btn.dataset.refeicao || "Refeição";
      addRecRow(meal, "");
      showToast(`Refeição "${meal}" adicionada ao recordatório.`);
    });
  });

  // Helper de tags para Demais Avaliações Antropométricas
  document.querySelectorAll(".admin-antro-tag-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tag = btn.dataset.tag || "";
      const textarea = document.getElementById("admAntroDemaisAvaliacoes");
      if (textarea) {
        const cur = textarea.value.trim();
        textarea.value = cur ? `${cur}; ${tag}` : tag;
        textarea.focus();
        showToast("Medida inserida em Demais Avaliações.");
      }
    });
  });

  // Lista de Questões Avaliativas no Admin
  function renderAdminQuestionsList(qList) {
    const container = document.getElementById("adminQuestionsContainer");
    container.innerHTML = "";
    qList.forEach((q, idx) => {
      const div = document.createElement("div");
      div.className = "border border-slate-200 rounded-lg p-3 mb-3 bg-slate-50 question-admin-item";
      div.innerHTML = `
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-bold text-slate-700">Questão ${idx + 1}</span>
          <button type="button" class="text-rose-600 hover:text-rose-800 text-xs font-semibold remove-quest-btn">Excluir</button>
        </div>
        <textarea class="w-full border border-slate-300 rounded p-2 text-xs q-pergunta-text" rows="2" placeholder="Digite a pergunta avaliativa">${escapeHtml(q.pergunta || '')}</textarea>
      `;
      div.querySelector(".remove-quest-btn").addEventListener("click", () => div.remove());
      container.appendChild(div);
    });
  }

  function addQuestionItem(pergunta = "") {
    const container = document.getElementById("adminQuestionsContainer");
    if (!container) return;
    const div = document.createElement("div");
    div.className = "border border-slate-200 rounded-lg p-3 mb-3 bg-slate-50 question-admin-item";
    const nextNum = container.querySelectorAll(".question-admin-item").length + 1;
    div.innerHTML = `
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-xs font-bold text-slate-700">Questão ${nextNum}</span>
        <button type="button" class="text-rose-600 hover:text-rose-800 text-xs font-semibold remove-quest-btn">Excluir</button>
      </div>
      <textarea class="w-full border border-slate-300 rounded p-2 text-xs q-pergunta-text" rows="2" placeholder="Digite o enunciado da questão para o aluno">${escapeHtml(pergunta)}</textarea>
    `;
    div.querySelector(".remove-quest-btn").addEventListener("click", () => div.remove());
    container.appendChild(div);
    const textarea = div.querySelector(".q-pergunta-text");
    if (textarea) textarea.focus();
    return div;
  }

  document.getElementById("adminAddQuestionBtn")?.addEventListener("click", () => {
    addQuestionItem();
  });

  document.querySelectorAll(".admin-quick-q-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const qText = btn.dataset.q || "";
      addQuestionItem(qText);
      showToast("Questão adicionada ao caso!");
    });
  });

  // Lê dados do editor do Admin para salvar o caso
  function readCaseFromAdminEditor() {
    const id = adminManager.editingCaseId || ("caso-" + Date.now());

    // Bioquímica
    const bioquimica = [];
    document.querySelectorAll("#adminBioTableBody tr").forEach(row => {
      const ex = row.querySelector(".bio-exame")?.value.trim();
      const val = row.querySelector(".bio-valor")?.value.trim();
      const ref = row.querySelector(".bio-ref")?.value.trim();
      const interp = row.querySelector(".bio-interp")?.value.trim();
      if (ex) bioquimica.push({ exame: ex, valor: val, referencia: ref, interpretacao: interp });
    });

    // Recordatório
    const recordatorio24h = [];
    document.querySelectorAll("#adminRecTableBody tr").forEach(row => {
      const ref = row.querySelector(".rec-ref")?.value.trim();
      const alim = row.querySelector(".rec-alimentos")?.value.trim();
      if (ref) recordatorio24h.push({ refeicao: ref, alimentos: alim });
    });

    // Questões
    const questoesAvaliativas = [];
    document.querySelectorAll(".question-admin-item").forEach((item, idx) => {
      const txt = item.querySelector(".q-pergunta-text")?.value.trim();
      if (txt) questoesAvaliativas.push({ id: `q${idx + 1}`, pergunta: txt, tipo: "discursiva" });
    });

    return {
      id: id,
      disciplinaId: document.getElementById("admCaseDiscipline")?.value || adminManager.activeDisciplinaId || "dietoterapia",
      title: document.getElementById("admCaseTitle").value.trim(),
      category: document.getElementById("admCaseCategory").value.trim(),
      description: document.getElementById("admCaseDesc").value.trim(),
      isLocked: !(document.getElementById("admCaseIsUnlocked")?.checked),
      visivel: document.getElementById("admCaseIsVisible") ? document.getElementById("admCaseIsVisible").checked : true,
      habilitarQuestoesAvaliativas: document.getElementById("admCaseEnableQuestions") ? document.getElementById("admCaseEnableQuestions").checked : true,
      blockedTabs: readBlockedTabsFromEditor(),
      patient: {
        name: document.getElementById("admPatName").value.trim(),
        age: parseInt(document.getElementById("admPatAge").value) || 0,
        gender: document.getElementById("admPatGender").value,
        occupation: document.getElementById("admPatOccupation").value.trim(),
        maritalStatus: document.getElementById("admPatMarital").value.trim(),
        residence: document.getElementById("admPatResidence").value.trim(),
        avatar: document.getElementById("admPatAvatar").value.trim() || "👤"
      },
      hipoteseDiagnostica: document.getElementById("admHipoteseDiagnostica") ? document.getElementById("admHipoteseDiagnostica").value.trim() : "",
      history: {
        hipoteseDiagnostica: document.getElementById("admHipoteseDiagnostica") ? document.getElementById("admHipoteseDiagnostica").value.trim() : "",
        queixaPrincipal: document.getElementById("admHistQP").value.trim(),
        hda: document.getElementById("admHistHDA").value.trim(),
        hpp: document.getElementById("admHistHPP").value.trim(),
        historiaFamiliar: document.getElementById("admHistFamilia").value.trim(),
        medicamentos: document.getElementById("admHistMeds").value.trim(),
        habitosVida: document.getElementById("admHistHabitos").value.trim(),
        funcaoIntestinalDiurese: document.getElementById("admHistEliminacoes").value.trim()
      },
      antropometria: {
        pesoAtual: parseFloat(document.getElementById("admAntroPesoAtual").value) || 0,
        pesoHabitual: parseFloat(document.getElementById("admAntroPesoHab").value) || 0,
        estatura: parseFloat(document.getElementById("admAntroAltura").value) || 0,
        alturaJoelho: parseFloat(document.getElementById("admAntroAJ")?.value) || null,
        circunferenciaCintura: parseFloat(document.getElementById("admAntroCC").value) || null,
        circunferenciaBraco: parseFloat(document.getElementById("admAntroCB").value) || null,
        dobraTricipital: parseFloat(document.getElementById("admAntroDCT").value) || null,
        circunferenciaPanturrilha: parseFloat(document.getElementById("admAntroCP").value) || null,
        demaisAvaliacoes: document.getElementById("admAntroDemaisAvaliacoes")?.value?.trim() || "",
        historicoPerdaPonderal: document.getElementById("admAntroPerda").value.trim()
      },
      bioquimica: bioquimica,
      exameFisico: {
        estadoGeral: document.getElementById("admEfEstadoGeral").value.trim(),
        sinaisEspecificos: document.getElementById("admEfSinais").value.trim(),
        edema: document.getElementById("admEfEdema").value.trim(),
        cavidadeOral: document.getElementById("admEfBoca").value.trim(),
        tgi: document.getElementById("admEfTGI").value.trim()
      },
      consumoAlimentar: {
        padraoDiario: document.getElementById("admCaPadrao").value.trim(),
        recordatorio24h: recordatorio24h,
        ingestaoHidrica: document.getElementById("admCaAgua").value.trim(),
        preferencias: document.getElementById("admCaPreferencias").value.trim(),
        aversoesIntolerancias: document.getElementById("admCaAversoes").value.trim(),
        quemPrepara: document.getElementById("admCaQuemPrepara").value.trim()
      },
      equipeMultiprofissional: (() => {
        const equipe = [];
        document.querySelectorAll("#adminEquipeListContainer .admin-prof-card").forEach((card, idx) => {
          const id = card.dataset.profId || `prof_${idx}_${Date.now()}`;
          const nome = card.querySelector(".prof-name-input")?.value.trim() || "Profissional de Saúde";
          const avatar = card.querySelector(".prof-avatar-input")?.value.trim() || "🩺";
          const parecer = card.querySelector(".prof-parecer-input")?.value.trim() || "";
          equipe.push({ id, nome, avatar, parecer });
        });
        return equipe;
      })(),
      questoesAvaliativas: questoesAvaliativas,
      resolucaoGabarito: {
        diagnosticoNutricional: document.getElementById("admGabDiag").value.trim(),
        calculoEnergetico: document.getElementById("admGabCalc").value.trim(),
        distribuicaoMacronutrientes: document.getElementById("admGabMacros").value.trim(),
        condutaPlanejamento: document.getElementById("admGabConduta").value.trim()
      }
    };
  }

  // Notificação Toast rápida
  function showToast(msg) {
    let toast = document.getElementById("appToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "appToast";
      toast.className = "fixed bottom-5 right-5 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg z-50 transition-opacity duration-300 opacity-0 pointer-events-none";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.remove("opacity-0");
    setTimeout(() => {
      toast.classList.add("opacity-0");
    }, 2800);
  }

  // Utilitário de escape HTML
  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Iniciar App
  initApp();
});
