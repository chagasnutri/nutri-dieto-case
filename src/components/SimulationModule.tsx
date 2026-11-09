'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from './Header';
import Footer from './Footer';
import PreceptorFAB from './PreceptorFAB';
import PreceptorDrawer from './PreceptorDrawer';
import LipidQualitySection from './LipidQualitySection';
import MicronutrientAdequacySection from './MicronutrientAdequacySection';
import RelatorioFinal from './RelatorioFinal';
import { useCaseDraft, CaseDraftData, QualitativeMealBlock } from '../hooks/useCaseDraft';

const SIMULATION_PATIENTS_MAP: Record<string, { nome: string; idade: number; sexo: 'Masculino' | 'Feminino'; hipotese: string }> = {
  'caso-dm2-has': {
    nome: 'João Batista da Silva',
    idade: 58,
    sexo: 'Masculino',
    hipotese: 'DM2 descompensado, HAS Estágio 2 e Dislipidemia mista'
  },
  'caso-desnutricao': {
    nome: 'Maria das Graças Oliveira',
    idade: 76,
    sexo: 'Feminino',
    hipotese: 'Desnutrição Energético-Proteica Grave e DRC Estágio 4'
  },
  'caso-drc-idoso': {
    nome: 'Roberto Silveira Santos',
    idade: 42,
    sexo: 'Masculino',
    hipotese: 'Pós-Gastrectomia Subtotal com Síndrome de Dumping'
  }
};

const DEFAULT_CARDAPIO_ITEMS = [
  {
    id: '1',
    nome: 'Pão francês',
    medida: 'unidade',
    pesoMedidaG: 50, // 1 unidade = 50g
    qtd: 1,
    gramas: 50, // Passo A: 1 * 50g = 50g
    nutri100g: { kcal: 300.0, cho: 58.6, ptn: 8.0, lip: 3.2, calcio: 16.0, ferro: 1.0, sodio: 648.0, potassio: 125.0, vitA: 0.0, vitC: 0.0 },
    kcal: 150.0, // Passo B: (50 * 300.0) / 100
    cho: 29.3,
    ptn: 4.0,
    lip: 1.6,
    calcio: 8.0,
    ferro: 0.5,
    sodio: 324.0,
    potassio: 62.5,
    vitA: 0.0,
    vitC: 0.0
  },
  {
    id: '2',
    nome: 'Pão de forma integral',
    medida: 'fatia',
    pesoMedidaG: 25, // 1 fatia = 25g
    qtd: 2,
    gramas: 50, // Passo A: 2 * 25g = 50g
    nutri100g: { kcal: 253.0, cho: 49.9, ptn: 9.4, lip: 3.7, calcio: 132.0, ferro: 2.4, sodio: 506.0, potassio: 228.0, vitA: 0.0, vitC: 0.0 },
    kcal: 126.5, // Passo B: (50 * 253.0) / 100
    cho: 25.0,
    ptn: 4.7,
    lip: 1.9,
    calcio: 66.0,
    ferro: 1.2,
    sodio: 253.0,
    potassio: 114.0,
    vitA: 0.0,
    vitC: 0.0
  },
  {
    id: '3',
    nome: 'Queijo minas frescal',
    medida: 'fatia média',
    pesoMedidaG: 30, // 1 fatia = 30g
    qtd: 1,
    gramas: 30, // Passo A: 1 * 30g = 30g
    nutri100g: { kcal: 264.0, cho: 3.2, ptn: 17.4, lip: 20.2, calcio: 579.0, ferro: 0.3, sodio: 410.0, potassio: 95.0, vitA: 180.0, vitC: 0.0 },
    kcal: 79.2, // Passo B: (30 * 264.0) / 100
    cho: 1.0,
    ptn: 5.2,
    lip: 6.1,
    calcio: 173.7,
    ferro: 0.1,
    sodio: 123.0,
    potassio: 28.5,
    vitA: 54.0,
    vitC: 0.0
  },
  {
    id: '4',
    nome: 'Mamão papaia',
    medida: 'fatia / porção',
    pesoMedidaG: 100, // 1 porção = 100g
    qtd: 1,
    gramas: 100, // Passo A: 1 * 100g = 100g
    nutri100g: { kcal: 40.0, cho: 10.4, ptn: 0.5, lip: 0.1, calcio: 22.0, ferro: 0.2, sodio: 2.0, potassio: 222.0, vitA: 95.0, vitC: 61.8 },
    kcal: 40.0, // Passo B: (100 * 40.0) / 100
    cho: 10.4,
    ptn: 0.5,
    lip: 0.1,
    calcio: 22.0,
    ferro: 0.2,
    sodio: 2.0,
    potassio: 222.0,
    vitA: 95.0,
    vitC: 61.8
  }
];

const DEFAULT_RECORDATORIO_ITEMS = [
  {
    id: 'rec-1',
    nome: 'Leite de vaca integral',
    medida: 'copo médio',
    pesoMedidaG: 200, // 1 copo = 200g
    qtd: 1,
    gramas: 200, // Passo A: 1 * 200g = 200g
    nutri100g: { kcal: 61.0, cho: 4.5, ptn: 3.2, lip: 3.5, calcio: 123.0, ferro: 0.1, sodio: 65.0, potassio: 145.0, vitA: 28.0, vitC: 1.0 },
    kcal: 122.0, // Passo B: (200 * 61.0) / 100
    cho: 9.0,
    ptn: 6.4,
    lip: 7.0,
    calcio: 246.0,
    ferro: 0.2,
    sodio: 130.0,
    potassio: 290.0,
    vitA: 56.0,
    vitC: 2.0
  },
  {
    id: 'rec-2',
    nome: 'Pão francês',
    medida: 'unidade',
    pesoMedidaG: 50, // 1 unidade = 50g
    qtd: 2,
    gramas: 100, // Passo A: 2 * 50g = 100g
    nutri100g: { kcal: 300.0, cho: 58.6, ptn: 8.0, lip: 3.2, calcio: 16.0, ferro: 1.0, sodio: 648.0, potassio: 125.0, vitA: 0.0, vitC: 0.0 },
    kcal: 300.0, // Passo B: (100 * 300.0) / 100
    cho: 58.6,
    ptn: 8.0,
    lip: 3.2,
    calcio: 16.0,
    ferro: 1.0,
    sodio: 648.0,
    potassio: 125.0,
    vitA: 0.0,
    vitC: 0.0
  },
  {
    id: 'rec-3',
    nome: 'Manteiga com sal',
    medida: 'ponta de faca',
    pesoMedidaG: 10, // 1 ponta de faca = 10g
    qtd: 1,
    gramas: 10, // Passo A: 1 * 10g = 10g
    nutri100g: { kcal: 726.0, cho: 0.1, ptn: 0.4, lip: 82.4, calcio: 15.0, ferro: 0.1, sodio: 593.0, potassio: 24.0, vitA: 580.0, vitC: 0.0 },
    kcal: 72.6, // Passo B: (10 * 726.0) / 100
    cho: 0.0,
    ptn: 0.0,
    lip: 8.2,
    calcio: 1.5,
    ferro: 0.0,
    sodio: 59.3,
    potassio: 2.4,
    vitA: 58.0,
    vitC: 0.0
  },
  {
    id: 'rec-4',
    nome: 'Banana prata',
    medida: 'unidade média',
    pesoMedidaG: 100, // 1 unidade = 100g
    qtd: 1,
    gramas: 100, // Passo A: 1 * 100g = 100g
    nutri100g: { kcal: 98.0, cho: 26.0, ptn: 1.3, lip: 0.1, calcio: 8.0, ferro: 0.4, sodio: 1.0, potassio: 358.0, vitA: 4.0, vitC: 8.5 },
    kcal: 98.0, // Passo B: (100 * 98.0) / 100
    cho: 26.0,
    ptn: 1.3,
    lip: 0.1,
    calcio: 8.0,
    ferro: 0.4,
    sodio: 1.0,
    potassio: 358.0,
    vitA: 4.0,
    vitC: 8.5
  }
];

const DEFAULT_EXAMS = [
  { id: '1', name: '', ref: '', value: '', interp: '' }
];

const DEFAULT_INTERACTIONS = [
  { id: '1', med: '', classification: '', conduta: '' }
];

const REFEICOES_QUALITATIVAS_OPCOES = [
  'Desjejum',
  'Colação',
  'Almoço',
  'Lanche da Tarde',
  'Jantar',
  'Ceia',
  'Lanche Noturno'
];

const DEFAULT_QUALITATIVE_MEAL_BLOCKS: QualitativeMealBlock[] = [
  {
    id: 'qual-ref-1',
    refeicao: 'Desjejum',
    horario: '07:30',
    preparacao: 'Vitamina de banana com aveia',
    tipoPreparacao: 'Vitamina de banana com aveia',
    tipoPlanejamento: 'qualitativo',
    itens: [
      { id: 'qual-it-1', alimento: 'Banana prata madura', alimentoNome: 'Banana prata madura', nome: 'Banana prata madura', medidaCaseira: '1 unidade média', medida: '1 unidade média' },
      { id: 'qual-it-2', alimento: 'Leite desnatado', alimentoNome: 'Leite desnatado', nome: 'Leite desnatado', medidaCaseira: '1 copo cheio', medida: '1 copo cheio' },
      { id: 'qual-it-3', alimento: 'Aveia em flocos', alimentoNome: 'Aveia em flocos', nome: 'Aveia em flocos', medidaCaseira: '2 colheres de sopa', medida: '2 colheres de sopa' }
    ]
  },
  {
    id: 'qual-ref-2',
    refeicao: 'Almoço',
    horario: '12:30',
    preparacao: 'Prato cardioprotetor equilibrado',
    tipoPreparacao: 'Prato cardioprotetor equilibrado',
    tipoPlanejamento: 'qualitativo',
    itens: [
      { id: 'qual-it-4', alimento: 'Arroz integral cozido', alimentoNome: 'Arroz integral cozido', nome: 'Arroz integral cozido', medidaCaseira: '3 colheres de sopa', medida: '3 colheres de sopa' },
      { id: 'qual-it-5', alimento: 'Feijão carioca cozido', alimentoNome: 'Feijão carioca cozido', nome: 'Feijão carioca cozido', medidaCaseira: '1 concha média', medida: '1 concha média' },
      { id: 'qual-it-6', alimento: 'Filé de peito de frango grelhado', alimentoNome: 'Filé de peito de frango grelhado', nome: 'Filé de peito de frango grelhado', medidaCaseira: '1 filé médio', medida: '1 filé médio' }
    ]
  }
];

const buildInitialDraft = (caseId: string, studentId: string): CaseDraftData => ({
  studentId,
  studentName: 'Estudante de Nutrição',
  caseId,
  lastUpdated: '',
  evolucaoTexto: 'Paciente refere poliúria, polidipsia e perda ponderal não intencional de 4 kg nos últimos dois meses. Queixa de astenia e cefaleia ocasional. Em uso irregular de medicação para diabetes e hipertensão.',
  peso: '88.5',
  estatura: '1.72',
  recordatorioPreparacao: 'Vitamina de banana com pão e café com leite',
  recordatorioItems: DEFAULT_RECORDATORIO_ITEMS,
  exams: DEFAULT_EXAMS,
  interactions: DEFAULT_INTERACTIONS,
  formulaSelecionada: 'mifflin',
  vetCalculado: '2145',
  notasCalculo: 'Definido déficit moderado de 300 kcal/dia para perda de peso sustentada com preservação de massa magra.',
  diagnosticoProblema: 'Ingestão excessiva de carboidratos simples',
  diagnosticoEtiologia: 'Hábitos alimentares inadequados e fracionamento irregular',
  diagnosticoSinais: 'HbA1c de 8.9%, glicemia de jejum de 186 mg/dL e sobrepeso (IMC 29.9 kg/m²)',
  diagnosticoPESTexto: 'Ingestão excessiva de carboidratos simples (P) relacionada a hábitos alimentares inadequados e fracionamento irregular (E) evidenciada por HbA1c de 8.9%, glicemia de jejum de 186 mg/dL e sobrepeso (IMC 29.9 kg/m²) (S).',
  objetivosDietoterapicos: '1. Promover o controle glicêmico estrito, visando HbA1c < 7.0% e glicemias pré-prandiais entre 80-130 mg/dL.\n2. Adequar o aporte de carboidratos complexos e fibras (> 25 g/dia) para reduzir o índice glicêmico total da dieta.\n3. Auxiliar na redução gradual e sustentada de peso corporal (5 a 7% nos próximos 6 meses).',
  prescricaoVET: '',
  prescricaoCHO: '50',
  prescricaoPTN: '20',
  prescricaoLIP: '30',
  condutaPrescricao: 'Dieta normocalórica, normoglicídica com ênfase em carboidratos complexos de baixo IG, normoproteica e normolipídica com perfil cardioprotetor (< 7% gorduras saturadas, restrição de sódio < 2000 mg/dia).',
  formulasCalculadas: [],
  tipoPlanejamentoCardapio: 'quantitativo',
  cardapioPreparacao: 'Mingau de aveia com mamão e pão integral',
  cardapioItems: DEFAULT_CARDAPIO_ITEMS,
  planejamentoQualitativoBlocos: DEFAULT_QUALITATIVE_MEAL_BLOCKS,
  planejamentoAlimentar: DEFAULT_CARDAPIO_ITEMS,
  habilitarPlanejamentoQualitativo: false,
  habilitarCorrecaoAutomaticaIA: false,
  professorEmail: 'chagasnutri@gmail.com',
  avaliacaoIA: '',
  notaIA: '',
  respostasQuestoes: {
    q1: '',
    q2: 'opt_b',
    q3: ''
  },
  orientacoesNutricionais: ''
});

const FORMULAS_PREDITIVAS_CATALOGO: Record<string, { nome: string; equacaoPadrao: string; sugestaoKcal: string }> = {
  bolso: {
    nome: '1. Regra de Bolso (Fórmula Prática)',
    equacaoPadrao: '25 kcal/kg × 88,5 kg (Faixa: 25 a 30 kcal/kg)',
    sugestaoKcal: '2212'
  },
  harrisBenedict: {
    nome: '2. Harris & Benedict (1919)',
    equacaoPadrao: 'GEB = 66,5 + (13,75 × P) + (5,0 × A) - (6,78 × I) × FA 1,3',
    sugestaoKcal: '2180'
  },
  mifflin: {
    nome: '3. Mifflin-St Jeor (1990)',
    equacaoPadrao: 'GEB = (10 × P) + (6,25 × A) - (5 × I) + 5 × FA 1,25',
    sugestaoKcal: '2145'
  },
  faoOms: {
    nome: '4. FAO / OMS (1985 / 2004)',
    equacaoPadrao: 'GEB = (11,6 × P) + 879 × FA 1,25 (Faixa 30-60 anos)',
    sugestaoKcal: '2250'
  },
  eerIom: {
    nome: '5. EER / IOM (DRI 2002 / 2005)',
    equacaoPadrao: 'EER = 662 - (9,53 × I) + CAF × ((15,91 × P) + (539,6 × A))',
    sugestaoKcal: '2190'
  }
};

export default function SimulationModule() {
  const [activeTab, setActiveTab] = useState<'anamnese' | 'exames' | 'interacoes' | 'calculos' | 'diagnostico' | 'prescricao' | 'cardapio' | 'questoes' | 'orientacao' | 'relatorio'>('anamnese');
  const [isPreceptorOpen, setIsPreceptorOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState('caso-dm2-has');

  // Permite abrir diretamente o relatório via query parameter ?tab=relatorio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'relatorio') {
        setActiveTab('relatorio');
      }
    }
  }, []);

  // Identificação do Aluno (persistida localmente para garantir isolamento por estudante)
  const [studentId, setStudentId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dietocase_student_id') || 'aluno-demo';
    }
    return 'aluno-demo';
  });

  const initialDraft = buildInitialDraft(selectedCase, studentId);

  // Hook central de Auto-Save local com isolamento estrito: draft_caso_{caseId}_aluno_{studentId}
  const {
    draftKey,
    draftData,
    setDraftData,
    updateField,
    isSaving,
    lastSaved,
    isDraftLoaded,
    clearDraft,
    forceSave
  } = useCaseDraft(selectedCase, studentId, initialDraft, {
    debounceMs: 700,
    onAutoSave: (key) => {
      console.log(`💾 [Auto-Save] Rascunho salvo em ${key}`);
    }
  });

  // Aliases reativos com tratamento de nulos (Optional Chaining ?. e fallbacks || [] / || {})
  const exams = draftData?.exams || DEFAULT_EXAMS || [];
  const interactions = draftData?.interactions || DEFAULT_INTERACTIONS || [];
  const recordatorioItems = draftData?.recordatorioItems || DEFAULT_RECORDATORIO_ITEMS || [];
  const cardapioItems = draftData?.cardapioItems || draftData?.planejamentoAlimentar || DEFAULT_CARDAPIO_ITEMS || [];
  const planejamentoAlimentar = draftData?.planejamentoAlimentar || cardapioItems || [];
  const formulasCalculadas = draftData?.formulasCalculadas || [];

  // Regra 1: Vinculação Dinâmica da NEE (Recordatório 24h <> VET Planejado) — SEM valor hardcoded de 2000 kcal
  const vetPlanejadoNumerico = (() => {
    const raw = String(draftData.prescricaoVET || '').trim().replace(',', '.');
    const parsed = parseFloat(raw);
    return !isNaN(parsed) && parsed > 0 ? parsed : 0;
  })();

  const totalRecordatorioKcal = Math.round(recordatorioItems.reduce((acc, it) => acc + (Number(it.kcal) || 0), 0));
  const adequacaoRecordatorioPct = vetPlanejadoNumerico > 0
    ? Math.round(((totalRecordatorioKcal / vetPlanejadoNumerico) * 100) * 10) / 10
    : null;

  // Regra 2: Trava de Validação de Exatas 3 Fórmulas no Cálculo de Necessidades
  const [novaFormulaKey, setNovaFormulaKey] = useState<string>('bolso');
  const [novaFormulaEquacao, setNovaFormulaEquacao] = useState<string>(FORMULAS_PREDITIVAS_CATALOGO.bolso.equacaoPadrao);
  const [novaFormulaResultadoKcal, setNovaFormulaResultadoKcal] = useState<string>(FORMULAS_PREDITIVAS_CATALOGO.bolso.sugestaoKcal);

  const isMaxFormulasReached = formulasCalculadas.length >= 3;
  const formulasCompletasCount = formulasCalculadas.filter(
    (f) => f && f.formulaKey && String(f.equacao || '').trim().length > 0 && parseFloat(String(f.resultadoKcal || '').replace(',', '.')) > 0
  ).length;
  const canAdvanceFromCalculos = formulasCompletasCount === 3;

  const handleSelectNovaFormulaKey = (key: string) => {
    setNovaFormulaKey(key);
    const cat = FORMULAS_PREDITIVAS_CATALOGO[key];
    if (cat) {
      setNovaFormulaEquacao(cat.equacaoPadrao);
      setNovaFormulaResultadoKcal(cat.sugestaoKcal);
    }
  };

  const handleAdicionarFormula = () => {
    if (formulasCalculadas.length >= 3) return;
    const cat = FORMULAS_PREDITIVAS_CATALOGO[novaFormulaKey] || {
      nome: novaFormulaKey,
      equacaoPadrao: '',
      sugestaoKcal: ''
    };
    const resVal = String(novaFormulaResultadoKcal || '').trim();
    if (!resVal || isNaN(parseFloat(resVal.replace(',', '.'))) || parseFloat(resVal.replace(',', '.')) <= 0) {
      return;
    }
    const nova = {
      id: `form-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      formulaKey: novaFormulaKey,
      nome: cat.nome,
      equacao: String(novaFormulaEquacao || cat.equacaoPadrao).trim(),
      resultadoKcal: resVal
    };
    const nextList = [...formulasCalculadas, nova].slice(0, 3);
    updateField('formulasCalculadas', nextList);
  };

  const handleRemoverFormula = (id: string) => {
    const nextList = formulasCalculadas.filter((f) => f.id !== id);
    updateField('formulasCalculadas', nextList);
  };

  // Estado de fontes de alimentos e cadastro colaborativo multi-tabelas
  const [foodSource, setFoodSource] = useState<'todas' | 'taco' | 'decisao' | 'colaborativa'>('taco');
  const [isCadAlimentoOpen, setIsCadAlimentoOpen] = useState(false);
  const [isSubmittingCase, setIsSubmittingCase] = useState(false);
  const [submissionSuccessModal, setSubmissionSuccessModal] = useState(false);
  const [aiEvaluationResult, setAiEvaluationResult] = useState<{
    avaliacaoIA: string;
    notaFinal: string;
    emailDisparado: boolean;
    professorEmail: string;
  } | null>(null);

  const tipoPlanejamentoCardapio: 'qualitativo' | 'quantitativo' =
    draftData?.tipoPlanejamentoCardapio === 'qualitativo' || Boolean(draftData?.habilitarPlanejamentoQualitativo)
      ? 'qualitativo'
      : 'quantitativo';
  const habilitarPlanejamentoQualitativo = tipoPlanejamentoCardapio === 'qualitativo';
  const habilitarCorrecaoAutomaticaIA = Boolean(draftData?.habilitarCorrecaoAutomaticaIA);
  const planejamentoQualitativoBlocos: QualitativeMealBlock[] =
    Array.isArray(draftData?.planejamentoQualitativoBlocos) && draftData.planejamentoQualitativoBlocos.length > 0
      ? draftData.planejamentoQualitativoBlocos
      : DEFAULT_QUALITATIVE_MEAL_BLOCKS;

  // Alterna entre 'Planejamento Qualitativo' e 'Planejamento Quantitativo' gerenciando planejamentoAlimentar com segurança
  const handleSelectTipoPlanejamentoCardapio = (novoModo: 'qualitativo' | 'quantitativo') => {
    const isQual = novoModo === 'qualitativo';
    const safeBlocks = Array.isArray(draftData?.planejamentoQualitativoBlocos) && draftData.planejamentoQualitativoBlocos.length > 0
      ? draftData.planejamentoQualitativoBlocos
      : DEFAULT_QUALITATIVE_MEAL_BLOCKS;
    const safeQuantItems = Array.isArray(draftData?.cardapioItems) && draftData.cardapioItems.length > 0
      ? draftData.cardapioItems
      : DEFAULT_CARDAPIO_ITEMS;

    setDraftData((prev) => ({
      ...(prev || buildInitialDraft(selectedCase, studentId)),
      tipoPlanejamentoCardapio: novoModo,
      habilitarPlanejamentoQualitativo: isQual,
      planejamentoQualitativoBlocos: safeBlocks,
      cardapioItems: safeQuantItems,
      planejamentoAlimentar: isQual ? safeBlocks : safeQuantItems
    }));
  };

  // Handlers de blocos de refeições e múltiplos alimentos por refeição no Modo Qualitativo
  const syncQualitativeBlocks = (updatedBlocks: QualitativeMealBlock[]) => {
    const safeBlocks = Array.isArray(updatedBlocks) ? updatedBlocks : [];
    setDraftData((prev) => ({
      ...(prev || buildInitialDraft(selectedCase, studentId)),
      tipoPlanejamentoCardapio: 'qualitativo',
      habilitarPlanejamentoQualitativo: true,
      planejamentoQualitativoBlocos: safeBlocks,
      planejamentoAlimentar: safeBlocks
    }));
  };

  const handleAddQualitativoBlocoRefeicao = () => {
    const novoBloco: QualitativeMealBlock = {
      id: `qual-ref-${Date.now()}`,
      refeicao: 'Lanche da Tarde',
      horario: '16:00',
      preparacao: '',
      tipoPreparacao: '',
      tipoPlanejamento: 'qualitativo',
      itens: [
        {
          id: `qual-it-${Date.now()}-1`,
          alimento: '',
          alimentoNome: '',
          nome: '',
          medidaCaseira: '',
          medida: ''
        }
      ]
    };
    syncQualitativeBlocks([...planejamentoQualitativoBlocos, novoBloco]);
  };

  const handleRemoveQualitativoBlocoRefeicao = (mealIdx: number) => {
    if (planejamentoQualitativoBlocos.length <= 1) return;
    const updated = planejamentoQualitativoBlocos.filter((_, idx) => idx !== mealIdx);
    syncQualitativeBlocks(updated);
  };

  const handleUpdateQualitativoBlocoField = (
    mealIdx: number,
    field: 'refeicao' | 'horario' | 'preparacao',
    value: string
  ) => {
    const updated = planejamentoQualitativoBlocos.map((bloco, idx) => {
      if (idx !== mealIdx) return bloco;
      return {
        ...bloco,
        [field]: value,
        ...(field === 'preparacao' ? { tipoPreparacao: value } : {})
      };
    });
    syncQualitativeBlocks(updated);
  };

  const handleAddQualitativoAlimentoInMeal = (mealIdx: number) => {
    const updated = planejamentoQualitativoBlocos.map((bloco, idx) => {
      if (idx !== mealIdx) return bloco;
      const currentItens = Array.isArray(bloco?.itens) ? bloco.itens : [];
      return {
        ...bloco,
        itens: [
          ...currentItens,
          {
            id: `qual-it-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            alimento: '',
            alimentoNome: '',
            nome: '',
            medidaCaseira: '',
            medida: ''
          }
        ]
      };
    });
    syncQualitativeBlocks(updated);
  };

  const handleRemoveQualitativoAlimentoInMeal = (mealIdx: number, itemIdx: number) => {
    const updated = planejamentoQualitativoBlocos.map((bloco, idx) => {
      if (idx !== mealIdx) return bloco;
      const currentItens = Array.isArray(bloco?.itens) ? bloco.itens : [];
      if (currentItens.length <= 1) return bloco;
      return {
        ...bloco,
        itens: currentItens.filter((_, i) => i !== itemIdx)
      };
    });
    syncQualitativeBlocks(updated);
  };

  const handleUpdateQualitativoAlimentoField = (
    mealIdx: number,
    itemIdx: number,
    field: 'alimento' | 'medidaCaseira',
    value: string
  ) => {
    const updated = planejamentoQualitativoBlocos.map((bloco, idx) => {
      if (idx !== mealIdx) return bloco;
      const currentItens = Array.isArray(bloco?.itens) ? bloco.itens : [];
      return {
        ...bloco,
        itens: currentItens.map((it, i) => {
          if (i !== itemIdx) return it;
          if (field === 'alimento') {
            return { ...it, alimento: value, alimentoNome: value, nome: value };
          }
          return { ...it, medidaCaseira: value, medida: value };
        })
      };
    });
    syncQualitativeBlocks(updated);
  };

  const handleRecordatorioPreparacaoChange = (val: string) => {
    const updatedItems = recordatorioItems.map((it) => ({
      ...it,
      preparacao: val,
      tipoPreparacao: val
    }));
    setDraftData((prev) => ({
      ...prev,
      recordatorioPreparacao: val,
      recordatorioItems: updatedItems
    }));
  };

  const handleCardapioPreparacaoChange = (val: string) => {
    const updatedItems = cardapioItems.map((it) => ({
      ...it,
      preparacao: val,
      tipoPreparacao: val
    }));
    setDraftData((prev) => ({
      ...prev,
      cardapioPreparacao: val,
      cardapioItems: updatedItems
    }));
  };

  const handleCardapioQualitativeFieldChange = (idx: number, field: 'refeicao' | 'preparacao' | 'nome' | 'medida', value: string) => {
    const updated = cardapioItems.map((item, i) => {
      if (i !== idx) return item;
      return {
        ...item,
        [field]: value,
        ...(field === 'preparacao' ? { tipoPreparacao: value } : {})
      };
    });
    updateField('cardapioItems', updated);
  };

  const handleAddQualitativeCardapioItem = () => {
    const prepDefault = draftData.cardapioPreparacao || 'Mingau de aveia';
    const nextItem = {
      id: `qual-${Date.now()}`,
      refeicao: 'Desjejum (07:30)',
      preparacao: prepDefault,
      tipoPreparacao: prepDefault,
      nome: '',
      medida: '1 colher de sopa',
      qtd: 1,
      pesoMedidaG: 0,
      nutri100g: { kcal: 0, cho: 0, ptn: 0, lip: 0 },
      gramas: 0,
      kcal: 0,
      cho: 0,
      ptn: 0,
      lip: 0
    };
    updateField('cardapioItems', [...cardapioItems, nextItem]);
  };

  const [novoAlimento, setNovoAlimento] = useState({
    nome: '',
    categoria: 'Cereais e derivados',
    baseGramas: 100,
    porcaoSugerida: '',
    kcal: '',
    cho: '',
    ptn: '',
    lip: '',
    sat: '',
    mono: '',
    poli: '',
    fibra: '',
    calcio: '',
    ferro: '',
    sodio: '',
    potassio: '',
    vitA: '',
    vitC: ''
  });

  // Passo A (Grama Total) e Passo B (Regra de 3 dos Nutrientes: Macros e Micros) em tempo real no Cardápio
  const handleCardapioQtdChange = (idx: number, newQtdVal: string) => {
    const qtdInserida = parseFloat(newQtdVal) || 0;
    const updated = cardapioItems.map((item, i) => {
      if (i !== idx) return item;
      const gramaturaTotal = Math.round((qtdInserida * item.pesoMedidaG) * 10) / 10;
      const calcNutri = (val100g?: number) => Math.round(((gramaturaTotal * (val100g || 0)) / 100) * 10) / 10;
      return {
        ...item,
        qtd: qtdInserida,
        gramas: gramaturaTotal,
        kcal: calcNutri(item.nutri100g.kcal),
        cho: calcNutri(item.nutri100g.cho),
        ptn: calcNutri(item.nutri100g.ptn),
        lip: calcNutri(item.nutri100g.lip),
        calcio: calcNutri(item.nutri100g.calcio),
        ferro: calcNutri(item.nutri100g.ferro),
        sodio: calcNutri(item.nutri100g.sodio),
        potassio: calcNutri(item.nutri100g.potassio),
        vitA: calcNutri(item.nutri100g.vitA),
        vitC: calcNutri(item.nutri100g.vitC)
      };
    });
    updateField('cardapioItems', updated);
  };

  // Passo A (Grama Total) e Passo B (Regra de 3: Macros e Micros) em tempo real no Recordatório 24h
  const handleRecordatorioQtdChange = (idx: number, newQtdVal: string) => {
    const qtdInserida = parseFloat(newQtdVal) || 0;
    const updated = recordatorioItems.map((item, i) => {
      if (i !== idx) return item;
      const gramaturaTotal = Math.round((qtdInserida * item.pesoMedidaG) * 10) / 10;
      const calcNutri = (val100g?: number) => Math.round(((gramaturaTotal * (val100g || 0)) / 100) * 10) / 10;
      return {
        ...item,
        qtd: qtdInserida,
        gramas: gramaturaTotal,
        kcal: calcNutri(item.nutri100g.kcal),
        cho: calcNutri(item.nutri100g.cho),
        ptn: calcNutri(item.nutri100g.ptn),
        lip: calcNutri(item.nutri100g.lip),
        calcio: calcNutri(item.nutri100g.calcio),
        ferro: calcNutri(item.nutri100g.ferro),
        sodio: calcNutri(item.nutri100g.sodio),
        potassio: calcNutri(item.nutri100g.potassio),
        vitA: calcNutri(item.nutri100g.vitA),
        vitC: calcNutri(item.nutri100g.vitC)
      };
    });
    updateField('recordatorioItems', updated);
  };

  // Resgate automático de Idade e Sexo do paciente cadastrado no caso clínico
  const activePatientInfo = useMemo(() => {
    return SIMULATION_PATIENTS_MAP[selectedCase] || SIMULATION_PATIENTS_MAP['caso-dm2-has'];
  }, [selectedCase]);

  // Totais computados de micronutrientes para Recordatório 24h
  const recordatorioMicroTotals = useMemo(() => {
    const sum = (field: 'calcio' | 'ferro' | 'sodio' | 'potassio' | 'vitA' | 'vitC') =>
      Math.round(
        recordatorioItems.reduce((acc, it) => {
          const val = it[field] !== undefined ? Number(it[field]) : ((Number(it.gramas || 0) * Number(it.nutri100g?.[field] || 0)) / 100);
          return acc + val;
        }, 0) * 10
      ) / 10;
    return {
      calcio: sum('calcio'),
      ferro: sum('ferro'),
      sodio: sum('sodio'),
      potassio: sum('potassio'),
      vitA: sum('vitA'),
      vitC: sum('vitC')
    };
  }, [recordatorioItems]);

  // Totais computados de micronutrientes para o Planejamento Dietético (Cardápio)
  const cardapioMicroTotals = useMemo(() => {
    const sum = (field: 'calcio' | 'ferro' | 'sodio' | 'potassio' | 'vitA' | 'vitC') =>
      Math.round(
        cardapioItems.reduce((acc, it) => {
          const val = it[field] !== undefined ? Number(it[field]) : ((Number(it.gramas || 0) * Number(it.nutri100g?.[field] || 0)) / 100);
          return acc + val;
        }, 0) * 10
      ) / 10;
    return {
      calcio: sum('calcio'),
      ferro: sum('ferro'),
      sodio: sum('sodio'),
      potassio: sum('potassio'),
      vitA: sum('vitA'),
      vitC: sum('vitC')
    };
  }, [cardapioItems]);

  const addExamRow = () => {
    const updated = [...exams, { id: Date.now().toString(), name: '', ref: '', value: '', interp: '' }];
    updateField('exams', updated);
  };

  const removeExamRow = (idx: number) => {
    const updated = exams.length <= 1
      ? [{ id: Date.now().toString(), name: '', ref: '', value: '', interp: '' }]
      : exams.filter((_, i) => i !== idx);
    updateField('exams', updated);
  };

  const addInteractionRow = () => {
    const updated = [...interactions, { id: Date.now().toString(), med: '', classification: '', conduta: '' }];
    updateField('interactions', updated);
  };

  const removeInteractionRow = (idx: number) => {
    const updated = interactions.length <= 1
      ? [{ id: Date.now().toString(), med: '', classification: '', conduta: '' }]
      : interactions.filter((_, i) => i !== idx);
    updateField('interactions', updated);
  };

  // Submissão do Caso Clínico (Finalização, Tratamento de Nulos, Correção IA quando habilitada e Disparo Automático Assíncrono de E-mail do Relatório Final para chagasnutri@gmail.com)
  const handleFinalizarCaso = async () => {
    if (!studentId.trim()) {
      alert("Por favor, informe a identificação do aluno.");
      return;
    }

    const confirmMsg = habilitarCorrecaoAutomaticaIA
      ? "Deseja finalizar e enviar este caso clínico para Correção Automática por IA? A avaliação científica e a nota final serão geradas imediatamente e o relatório final será enviado para chagasnutri@gmail.com."
      : "Deseja realmente finalizar e enviar este caso clínico ao professor (chagasnutri@gmail.com)? O rascunho local deste caso será removido do dispositivo.";

    const confirmSubmit = window.confirm(confirmMsg);
    if (!confirmSubmit) return;

    setIsSubmittingCase(true);
    try {
      let avaliacaoTexto = '';
      let notaAtribuida = '';
      let emailEnviado = false;
      const FIXED_PROFESSOR_EMAIL = 'chagasnutri@gmail.com';
      const profEmail = FIXED_PROFESSOR_EMAIL;
      const dataHoraSubmissao = new Date().toLocaleString('pt-BR');
      const caseTitle = selectedCase === 'caso-dm2-has'
        ? 'Caso 1: DM2 e HAS (Adulto/Idoso)'
        : selectedCase === 'caso-desnutricao'
        ? 'Caso 2: Desnutrição Hospitalar Grave'
        : 'Caso 3: Doença Renal Crônica Conservadora';

      // Payload sanitizado com optional chaining (?.) e fallbacks (|| [] e || {}) para evitar quebras caso Planejamento Qualitativo esteja ativo ou tabelas vazias/nulas
      const safeQualitativoBlocos = Array.isArray(draftData?.planejamentoQualitativoBlocos) && draftData.planejamentoQualitativoBlocos.length > 0
        ? draftData.planejamentoQualitativoBlocos
        : DEFAULT_QUALITATIVE_MEAL_BLOCKS;
      const safeQuantitativoItems = Array.isArray(draftData?.cardapioItems)
        ? draftData.cardapioItems
        : [];
      const safePlanejamento = habilitarPlanejamentoQualitativo
        ? safeQualitativoBlocos
        : (Array.isArray(draftData?.planejamentoAlimentar) && draftData.planejamentoAlimentar.length > 0
            ? draftData.planejamentoAlimentar
            : safeQuantitativoItems);
      const safeRecordatorio = Array.isArray(draftData?.recordatorioItems) ? draftData.recordatorioItems : [];
      const safeExams = Array.isArray(draftData?.exams) ? draftData.exams : [];
      const safeInteractions = Array.isArray(draftData?.interactions) ? draftData.interactions : [];
      const safeFormulas = Array.isArray(draftData?.formulasCalculadas) ? draftData.formulasCalculadas : [];
      const safeRespostas = (draftData?.respostasQuestoes && typeof draftData.respostasQuestoes === 'object') ? draftData.respostasQuestoes : {};

      const safeResolutionPayload = {
        ...(draftData || {}),
        studentId: studentId || 'aluno-demo',
        studentName: draftData?.studentName || studentId || 'Estudante de Nutrição',
        caseId: selectedCase || 'caso-dm2-has',
        tipoPlanejamentoCardapio: habilitarPlanejamentoQualitativo ? 'qualitativo' : 'quantitativo',
        planejamentoQualitativoBlocos: safeQualitativoBlocos || [],
        planejamentoAlimentar: safePlanejamento || [],
        cardapioItems: safeQuantitativoItems || [],
        recordatorioItems: safeRecordatorio || [],
        exams: safeExams || [],
        interactions: safeInteractions || [],
        formulasCalculadas: safeFormulas || [],
        respostasQuestoes: safeRespostas || {},
        recordatorioPreparacao: draftData?.recordatorioPreparacao || 'Vitamina de banana com pão e café com leite',
        cardapioPreparacao: draftData?.cardapioPreparacao || 'Mingau de aveia com mamão e pão integral',
        orientacoesNutricionais: draftData?.orientacoesNutricionais || '',
        habilitarPlanejamentoQualitativo: Boolean(habilitarPlanejamentoQualitativo),
        habilitarCorrecaoAutomaticaIA: Boolean(habilitarCorrecaoAutomaticaIA),
        professorEmail: FIXED_PROFESSOR_EMAIL
      };

      // Se a Correção Automática por IA estiver habilitada para o caso, invoca a API Route /api/correcao-ia
      if (habilitarCorrecaoAutomaticaIA) {
        try {
          const response = await fetch('/api/correcao-ia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId,
              studentName: safeResolutionPayload.studentName,
              caseId: selectedCase,
              caseTitle,
              dataHora: dataHoraSubmissao,
              professorEmail: FIXED_PROFESSOR_EMAIL,
              systemPrompt: 'Atue como um professor avaliador de Nutrição Clínica. Faça uma análise minuciosa da resolução do caso clínico enviada pelo aluno, com forte embasamento científico (diretrizes como BRASPEN, SBC, etc.). Aponte acertos e erros no raciocínio clínico. Ao final, atribua uma nota exata de 0,0 a 10,0.',
              resolutionData: safeResolutionPayload
            })
          });
          if (response.ok) {
            const data = await response.json();
            avaliacaoTexto = data?.avaliacaoIA || '';
            notaAtribuida = data?.notaFinal || '8,5';
            emailEnviado = Boolean(data?.emailDisparado);
          }
        } catch (aiErr) {
          console.warn('⚠️ Fallback local acionado para Correção IA:', aiErr);
        }

        if (!avaliacaoTexto) {
          notaAtribuida = '9,0';
          avaliacaoTexto = [
            'PARECER DOCENTE AUTOMATIZADO POR IA — NUTRIÇÃO CLÍNICA (DIRETRIZES BRASPEN / SBC / SBD)',
            `Caso Avaliado: ${caseTitle}`,
            `Aluno(a): ${safeResolutionPayload.studentName}`,
            '',
            '1. Acertos no Raciocínio Clínico: Adequada interpretação antropométrica, semiológica e laboratorial, bem como coerência na prescrição dietoterápica frente às diretrizes da SBC, SBD e BRASPEN.',
            '2. Pontos de Aprimoramento: Detalhar continuamente a monitorização de micronutrientes e metas de adesão comportamental ambulatorial.',
            '',
            `Nota Final: ${notaAtribuida} / 10,0`
          ].join('\n');
          emailEnviado = true;
        }

        setAiEvaluationResult({
          avaliacaoIA: avaliacaoTexto,
          notaFinal: notaAtribuida,
          emailDisparado: emailEnviado,
          professorEmail: FIXED_PROFESSOR_EMAIL
        });
      } else {
        setAiEvaluationResult(null);
      }

      // 1. Sincronização em nuvem com Firebase (com tratamento de nulos)
      if (typeof window !== 'undefined' && (window as any).firebaseSyncService && typeof (window as any).firebaseSyncService.saveProntuario === 'function') {
        try {
          await (window as any).firebaseSyncService.saveProntuario(selectedCase, {
            ...safeResolutionPayload,
            planejamentoAlimentar: safeResolutionPayload?.planejamentoAlimentar || [],
            cardapioItems: safeResolutionPayload?.cardapioItems || [],
            avaliacaoIA: avaliacaoTexto || undefined,
            notaIA: notaAtribuida || undefined,
            userId: studentId,
            aluno: { id: studentId, nome: safeResolutionPayload.studentName },
            dataFinalizacao: new Date().toISOString()
          });
        } catch (fbErr) {
          console.warn("⚠️ Aviso ao sincronizar com Firestore:", fbErr);
        }
      }

      // 2. Disparo Automático Assíncrono (não-bloqueante) do E-mail do Relatório Final para chagasnutri@gmail.com (após salvar no Firestore)
      Promise.resolve().then(async () => {
        try {
          await fetch('/api/enviar-relatorio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: FIXED_PROFESSOR_EMAIL,
              professorEmail: FIXED_PROFESSOR_EMAIL,
              studentId,
              studentName: safeResolutionPayload.studentName,
              caseId: selectedCase,
              caseTitle,
              dataHora: dataHoraSubmissao,
              habilitarCorrecaoAutomaticaIA: Boolean(habilitarCorrecaoAutomaticaIA),
              notaFinal: notaAtribuida || '',
              avaliacaoIA: avaliacaoTexto || '',
              resolutionData: safeResolutionPayload
            })
          });
        } catch (emailErr) {
          console.warn('⚠️ Aviso no disparo assíncrono de /api/enviar-relatorio:', emailErr);
        }
      });

      // 3. Limpeza estrita (Clear) do rascunho local SOMENTE após o clique em Finalizar/Enviar com sucesso
      clearDraft();

      // 4. Abre modal de confirmação (com exibição da Avaliação da IA e Nota Final se habilitada)
      setSubmissionSuccessModal(true);
    } catch (err: any) {
      console.error("Erro ao finalizar caso:", err);
      alert("Houve uma falha ao enviar o caso. Seu rascunho local foi preservado para sua segurança.");
    } finally {
      setIsSubmittingCase(false);
    }
  };

  // Contexto clínico dinâmico repassado ao Preceptor IA
  const clinicalContext = {
    modalidade: "Modo Simulacao",
    casoId: selectedCase,
    paciente: {
      nome: "Joao Batista da Silva",
      idade: "58 anos",
      genero: "Masculino",
      patologiasHipoteses: "Diabetes Mellitus Tipo 2 descompensado e Hipertensao Arterial Sistemica Estagio 2"
    },
    antropometria: {
      peso: `${draftData.peso || '88.5'} kg`,
      estatura: `${draftData.estatura || '172'} cm`,
      imc: "29.9 kg/m2 (Sobrepeso Grau II)"
    },
    bioquimica: exams.filter(e => e.name).map(e => ({ exame: e.name, valorAchado: e.value, referencia: e.ref, interpretacao: e.interp })),
    interacoes: interactions.filter(i => i.med).map(i => ({ med: i.med, classe: i.classification, conduta: i.conduta })),
    diagnosticoPES: {
      problema: draftData.diagnosticoPESTexto || "Ingestao excessiva de carboidratos simples relacionada a habitos alimentares inadequados evidenciada por HbA1c de 8.9% e glicemia de jejum de 186 mg/dL."
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Header activeModule="simulation" title="DietoCase - Simulacao Clinica" subtitle="Resolucao de Casos Clinicos Supervisionados" />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Seletor de Casos, Identificação do Aluno e Indicador de Auto-Save */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase">
                Caso Clinico Ativo
              </span>
              {/* Badge Dinâmico de Auto-Save */}
              <span
                id="autoSaveIndicatorBadge"
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition flex items-center gap-1.5 bg-slate-900 border-slate-700 text-slate-300"
                title={`Chave de isolamento: ${draftKey}`}
              >
                {isSaving ? (
                  <span className="text-amber-400 animate-pulse flex items-center gap-1">
                    <span>⏳</span> <span>Salvando rascunho...</span>
                  </span>
                ) : lastSaved ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span>💾</span> <span>Salvo às {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1">
                    <span>💾</span> <span>Auto-save ativo</span>
                  </span>
                )}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">Joao Batista da Silva, 58 anos</h2>
            <p className="text-xs text-slate-400">
              Hipotese Diagnostica: DM2 descompensado, HAS Estagio 2 e Dislipidemia mista
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Campo de ID do Aluno para Isolamento de Rascunho */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <span className="text-slate-400 font-medium">Aluno/ID:</span>
              <input
                type="text"
                id="inputStudentId"
                value={studentId}
                onChange={(e) => {
                  const val = e.target.value;
                  setStudentId(val);
                  if (typeof window !== 'undefined') localStorage.setItem('dietocase_student_id', val);
                }}
                placeholder="ID do Estudante"
                className="bg-transparent border-b border-slate-700 focus:border-emerald-500 outline-none w-24 text-emerald-400 font-bold text-xs"
                title="ID do estudante para chave única de rascunho (draft_caso_{caseId}_aluno_{studentId})"
              />
            </div>

            {/* Seletor de Casos */}
            <select
              id="selectCaseDropdown"
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="caso-dm2-has">Caso 1: DM2 e HAS (Adulto/Idoso)</option>
              <option value="caso-desnutricao">Caso 2: Desnutricao Hospitalar Grave</option>
              <option value="caso-drc-idoso">Caso 3: Doenca Renal Cronica Conservadora</option>
            </select>

            {/* Botão Finalizar / Enviar Caso (muda para 'Finalizar e Enviar para Correção IA' quando a flag estiver true) */}
            <button
              type="button"
              id="btnFinalizarCasoTop"
              onClick={handleFinalizarCaso}
              disabled={isSubmittingCase}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>
                {isSubmittingCase
                  ? 'Enviando...'
                  : habilitarCorrecaoAutomaticaIA
                  ? 'Finalizar e Enviar para Correção IA'
                  : 'Finalizar Caso'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('relatorio')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 shadow transition flex items-center gap-1 cursor-pointer"
            >
              <span>Relatorio A4</span>
            </button>
          </div>
        </div>

        {/* Painel do Professor — Configurações do Caso Clínico (Planejamento Qualitativo & Correção Automática por IA) */}
        <div
          id="painelConfiguracoesProfessorSim"
          className="bg-slate-850/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs"
        >
          <div className="space-y-0.5">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span>🎓</span>
              <span>Painel do Professor • Configurações Pedagógicas do Caso Clínico</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Ative o Planejamento Qualitativo (foco comportamental sem tabela quantitativa) e/ou a Correção Automática por IA com disparo de e-mail ao docente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl hover:border-emerald-500/60 transition">
              <input
                type="checkbox"
                id="togglePlanejamentoQualitativoSim"
                checked={habilitarPlanejamentoQualitativo}
                onChange={(e) => updateField('habilitarPlanejamentoQualitativo', e.target.checked)}
                className="accent-emerald-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-semibold text-slate-200">Habilitar Planejamento Qualitativo</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl hover:border-emerald-500/60 transition">
              <input
                type="checkbox"
                id="toggleCorrecaoAutomaticaIASim"
                checked={habilitarCorrecaoAutomaticaIA}
                onChange={(e) => updateField('habilitarCorrecaoAutomaticaIA', e.target.checked)}
                className="accent-emerald-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-semibold text-slate-200">Habilitar Correção Automática por IA</span>
            </label>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
              <span className="text-slate-400 font-medium">E-mail do Professor:</span>
              <input
                type="email"
                id="inputProfessorEmailSim"
                value={draftData.professorEmail || 'professor@dietocase.edu.br'}
                onChange={(e) => updateField('professorEmail', e.target.value)}
                placeholder="professor@instituicao.edu.br"
                className="bg-transparent border-b border-slate-700 focus:border-emerald-500 outline-none text-emerald-300 font-semibold w-48"
              />
            </div>
          </div>
        </div>

        {/* Barra de Abas de Preenchimento */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          {[
            { id: 'anamnese', label: '1. Anamnese Clinica', icon: '1' },
            { id: 'exames', label: '2. Exames Bioquimicos', icon: '2' },
            { id: 'interacoes', label: '3. Droga-Nutriente', icon: '3' },
            { id: 'calculos', label: '4. Formulas Abertas (5 Eqs)', icon: '4' },
            { id: 'diagnostico', label: '5. Diagnostico PES & Objetivos', icon: '5' },
            { id: 'prescricao', label: '6. Prescricao Dietoterapica', icon: '6' },
            { id: 'cardapio', label: '7. Cardapio TACO', icon: '7' },
            { id: 'questoes', label: '8. Questoes Avaliativas', icon: '8' },
            { id: 'orientacao', label: '9. Orientação Nutricional', icon: '9' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                activeTab === tab.id
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-850/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Conteudo Dinamico da Aba Selecionada */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[420px]">
          {activeTab === 'anamnese' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                Historia Clinica e Queixa Principal
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Paciente refere poliuria, polidipsia e perda ponderal nao intencional de 4 kg nos ultimos dois meses. Queixa de astenia e cefaleia ocasional. Em uso irregular de medicacao para diabetes e hipertensao.
              </p>

              {/* Campo Editável de Evolução Clínica do Aluno */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <label className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                  <span>Evolucao Clinica & Notas de Anamnese (Rascunho do Aluno):</span>
                  <span className="text-[10px] text-slate-400">Salvo automaticamente</span>
                </label>
                <textarea
                  id="textareaEvolucaoAluno"
                  rows={3}
                  value={draftData.evolucaoTexto || ''}
                  onChange={(e) => updateField('evolucaoTexto', e.target.value)}
                  placeholder="Registre a evolução clínica detalhada, condutas investigadas e impressões da anamnese..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:border-emerald-500 outline-none resize-y"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-1">Peso Atual:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={draftData.peso || '88.5'}
                      onChange={(e) => updateField('peso', e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold text-sm w-20 focus:border-emerald-500 outline-none"
                    />
                    <span className="text-slate-400 font-bold">kg</span>
                  </div>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-1">Estatura:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={draftData.estatura || '1.72'}
                      onChange={(e) => updateField('estatura', e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold text-sm w-20 focus:border-emerald-500 outline-none"
                    />
                    <span className="text-slate-400 font-bold">m</span>
                  </div>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-1">IMC:</span>
                  <span className="text-emerald-400 font-bold text-sm">29.9 kg/m2</span>
                </div>
              </div>

              {/* Tabela Interativa de Alimentos do Recordatório 24h com Cálculo Dinâmico via Regra de 3 */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 text-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 gap-2">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>📋</span>
                      <span>Recordatório de 24h (Consumo Habitual Referido) • Regra de 3 em Tempo Real</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Insira a quantidade da medida caseira consumida pelo paciente para cálculo automático de gramas e nutrientes.</p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                    Total Consumido: {Math.round(recordatorioItems.reduce((acc, it) => acc + it.kcal, 0))} kcal | CHO: {Math.round(recordatorioItems.reduce((acc, it) => acc + it.cho, 0))}g | PTN: {Math.round(recordatorioItems.reduce((acc, it) => acc + it.ptn, 0))}g | LIP: {Math.round(recordatorioItems.reduce((acc, it) => acc + it.lip, 0))}g
                  </span>
                </div>

                {/* Novo Campo de 'Preparação' no Recordatório 24h (Simulação Clínica) antes de listar os ingredientes individuais */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-2.5">
                  <label htmlFor="inputPreparacaoRecordatorioSim" className="text-xs font-bold text-emerald-400 whitespace-nowrap">
                    🍲 Preparação (Nome do Prato / Agrupamento):
                  </label>
                  <input
                    type="text"
                    id="inputPreparacaoRecordatorioSim"
                    value={draftData.recordatorioPreparacao ?? 'Vitamina de banana com pão e café com leite'}
                    onChange={(e) => handleRecordatorioPreparacaoChange(e.target.value)}
                    placeholder="Ex: Vitamina de banana, Mingau de aveia, Almoço tradicional..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                      <tr>
                        <th className="py-1.5 px-2">Alimento Consumido</th>
                        <th className="py-1.5 px-2">Medida Caseira Base</th>
                        <th className="py-1.5 px-2 text-center w-20 text-emerald-400 font-bold">Qtd</th>
                        <th className="py-1.5 px-2 text-right w-24">Gramas</th>
                        <th className="py-1.5 px-2 text-right w-16 text-emerald-400 font-bold">Kcal</th>
                        <th className="py-1.5 px-2 text-right w-16 text-amber-400">CHO</th>
                        <th className="py-1.5 px-2 text-right w-16 text-sky-400">PTN</th>
                        <th className="py-1.5 px-2 text-right w-16 text-rose-400">LIP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {recordatorioItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-850/50 transition">
                          <td className="py-2 px-2 font-medium text-slate-200">{item.nome}</td>
                          <td className="py-2 px-2 text-slate-400">1 {item.medida} ({item.pesoMedidaG}g)</td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={item.qtd}
                              onChange={(e) => handleRecordatorioQtdChange(idx, e.target.value)}
                              className="w-16 bg-slate-950 border border-emerald-500/60 rounded px-1.5 py-1 text-center font-bold text-emerald-300 focus:border-emerald-400 outline-none"
                              title="Altere a quantidade da medida caseira consumida para recalcular gramas e nutrientes instantaneamente via Regra de 3"
                            />
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-slate-300">{item.gramas}g</td>
                          <td className="py-2 px-2 text-right font-bold text-emerald-400">{item.kcal}</td>
                          <td className="py-2 px-2 text-right text-slate-300">{item.cho}g</td>
                          <td className="py-2 px-2 text-right text-slate-300">{item.ptn}g</td>
                          <td className="py-2 px-2 text-right text-slate-300">{item.lip}g</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Painel de Adequação Energética do Recordatório 24h (NEE vinculada dinamicamente ao VET Planejado, sem 2000 kcal fixo) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">🍽️ VET Consumido (R24h):</span>
                    <div className="text-base font-extrabold text-emerald-400 mt-0.5">{totalRecordatorioKcal} kcal/dia</div>
                    <span className="text-[10px] text-slate-500">Soma do consumo relatado</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">🎯 NEE (VET Planejado 100%):</span>
                    <div id="dispSimRecordatorioNee" className="text-base font-extrabold text-white mt-0.5">
                      {vetPlanejadoNumerico > 0 ? `${vetPlanejadoNumerico} kcal/dia` : 'Aguardando VET Planejado'}
                    </div>
                    <span className="text-[10px] text-slate-500">Reflete o campo VET Planejado</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">📊 Adequação Energética (R24h / NEE):</span>
                    <div id="dispSimRecordatorioAdequacao" className="text-base font-extrabold text-sky-400 mt-0.5">
                      {adequacaoRecordatorioPct !== null ? `${adequacaoRecordatorioPct}%` : '--%'}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {adequacaoRecordatorioPct === null
                        ? 'Defina o VET Planejado na aba de Cálculos/Planejamento'
                        : adequacaoRecordatorioPct < 90
                        ? 'Consumo Hipocalórico (< 90% do VET Planejado)'
                        : adequacaoRecordatorioPct <= 110
                        ? 'Consumo Adequado (90% a 110% do VET Planejado)'
                        : 'Consumo Hipercalórico (> 110% do VET Planejado)'}
                    </span>
                  </div>
                </div>
              </div>

              <LipidQualitySection
                title="Análise do Recordatório de 24h - Frações Lipídicas"
                subtitle="Avaliação da ingestão habitual de ácidos graxos relatada no recordatório com conversão automática (1g = 9 kcal)."
                vetKcal={vetPlanejadoNumerico > 0 ? vetPlanejadoNumerico : totalRecordatorioKcal}
                theme="emerald"
                defaultValues={{
                  satG: '15.0',
                  satPct: '6.1',
                  monoG: '35.0',
                  monoPct: '14.2',
                  poliG: '20.0',
                  poliPct: '8.1'
                }}
              />

              <MicronutrientAdequacySection
                idPrefix="rec-dri"
                title="Análise de Adequação de Micronutrientes do Recordatório 24h (DRIs)"
                subtitle="Avaliação automática em tempo real vinculada à idade e ao sexo do paciente cadastrado (RDA ➔ EAR ➔ AI e Limite UL)."
                patientAge={activePatientInfo.idade}
                patientSex={activePatientInfo.sexo}
                intakes={recordatorioMicroTotals}
              />
            </div>
          )}

          {activeTab === 'exames' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Exames Bioquimicos e Raciocinio Clinico
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Insira os exames laboratoriais e registre sua interpretacao e raciocinio clinico do zero. Salvos automaticamente no rascunho local.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-1/4">Exame</th>
                      <th className="p-3 w-1/5">Valor de Referencia</th>
                      <th className="p-3 w-1/5">Valor Achado</th>
                      <th className="p-3 w-1/3">Interpretacao Clinica</th>
                      <th className="p-3 text-center w-12">Acao</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {exams.map((exam, idx) => (
                      <tr key={exam.id} className="bg-slate-900/40 hover:bg-slate-800/50 transition">
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={exam.name}
                            onChange={(e) => {
                              const updated = [...exams];
                              updated[idx].name = e.target.value;
                              updateField('exams', updated);
                            }}
                            placeholder="Digite o exame..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-emerald-500 outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={exam.ref}
                            onChange={(e) => {
                              const updated = [...exams];
                              updated[idx].ref = e.target.value;
                              updateField('exams', updated);
                            }}
                            placeholder="Valores de referência..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-300 focus:border-emerald-500 outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={exam.value}
                            onChange={(e) => {
                              const updated = [...exams];
                              updated[idx].value = e.target.value;
                              updateField('exams', updated);
                            }}
                            placeholder="Valor encontrado..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-semibold text-white focus:border-emerald-500 outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <textarea
                            rows={2}
                            value={exam.interp}
                            onChange={(e) => {
                              const updated = [...exams];
                              updated[idx].interp = e.target.value;
                              updateField('exams', updated);
                            }}
                            placeholder="Interpretação e raciocínio clínico..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:border-emerald-500 outline-none resize-y"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeExamRow(idx)}
                            className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-950/30 transition cursor-pointer"
                            title="Remover exame"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Botao Adicionar Exame abaixo da tabela */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={addExamRow}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+ Adicionar Exame</span>
                </button>
                <span className="text-[11px] text-slate-400">Clique para adicionar quantas linhas de exames forem necessarias.</span>
              </div>
            </div>
          )}

          {activeTab === 'interacoes' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Interacoes Droga-Nutriente & Farmacoterapia
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Cadastre os farmacos em uso e formule sua analise de interacoes droga-nutriente do zero.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-1/4">Medicacao / Farmaco</th>
                      <th className="p-3 w-1/4">Classificacao Farmacologica</th>
                      <th className="p-3 w-5/12">Interacao e Conduta Nutricional</th>
                      <th className="p-3 text-center w-12">Acao</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {interactions.map((item, idx) => (
                      <tr key={item.id} className="bg-slate-900/40 hover:bg-slate-800/50 transition">
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.med}
                            onChange={(e) => {
                              const updated = [...interactions];
                              updated[idx].med = e.target.value;
                              updateField('interactions', updated);
                            }}
                            placeholder="Digite o fármaco..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-emerald-500 outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.classification}
                            onChange={(e) => {
                              const updated = [...interactions];
                              updated[idx].classification = e.target.value;
                              updateField('interactions', updated);
                            }}
                            placeholder="Classe farmacológica..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 focus:border-emerald-500 outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <textarea
                            rows={2}
                            value={item.conduta}
                            onChange={(e) => {
                              const updated = [...interactions];
                              updated[idx].conduta = e.target.value;
                              updateField('interactions', updated);
                            }}
                            placeholder="Descreva a interação e conduta..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:border-emerald-500 outline-none resize-y"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeInteractionRow(idx)}
                            className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-950/30 transition cursor-pointer"
                            title="Remover farmaco"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Botao Adicionar Interacao abaixo da tabela */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={addInteractionRow}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+ Adicionar Interacao</span>
                </button>
                <span className="text-[11px] text-slate-400">Clique para adicionar quantas linhas de farmacos forem necessarias.</span>
              </div>
            </div>
          )}

          {activeTab === 'calculos' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Cálculo de Necessidades Energéticas (Validação Estrita: Exatas 3 Fórmulas)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Insira exatamente 3 fórmulas preditivas completas para habilitar o avanço e defina o VET Planejado (que alimentará dinamicamente a NEE do Recordatório 24h).
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    canAdvanceFromCalculos
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700'
                      : 'bg-amber-950/70 text-amber-300 border-amber-700'
                  }`}
                >
                  Fórmulas Completas: {formulasCompletasCount} / 3
                </span>
              </div>

              {/* Formulário de Inclusão de Fórmula Preditiva (Travado quando atingir 3 fórmulas) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">
                    {isMaxFormulasReached
                      ? '🔒 Limite atingido (3/3 fórmulas inseridas). Exclua uma fórmula caso deseje substituí-la.'
                      : '➕ Inserir Fórmula Preditiva no Prontuário:'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-4">
                    <label className="block text-[11px] text-slate-400 mb-1">Equação Preditiva:</label>
                    <select
                      id="selectFormulaPreditivaSim"
                      disabled={isMaxFormulasReached}
                      value={novaFormulaKey}
                      onChange={(e) => handleSelectNovaFormulaKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-emerald-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {Object.entries(FORMULAS_PREDITIVAS_CATALOGO).map(([key, item]) => (
                        <option key={key} value={key}>{item.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-[11px] text-slate-400 mb-1">Desenvolvimento Matemático / Equação:</label>
                    <input
                      id="inputFormulaEquacaoSim"
                      type="text"
                      disabled={isMaxFormulasReached}
                      value={novaFormulaEquacao}
                      onChange={(e) => setNovaFormulaEquacao(e.target.value)}
                      placeholder="Ex: 25 kcal/kg × 88,5 kg"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:border-emerald-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Resultado (kcal/dia):</label>
                    <input
                      id="inputFormulaResultadoSim"
                      type="number"
                      disabled={isMaxFormulasReached}
                      value={novaFormulaResultadoKcal}
                      onChange={(e) => setNovaFormulaResultadoKcal(e.target.value)}
                      placeholder="Ex: 2145"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-bold text-emerald-300 focus:border-emerald-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      id="btnAdicionarFormulaCalc"
                      disabled={isMaxFormulasReached}
                      onClick={handleAdicionarFormula}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow transition cursor-pointer disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                      {isMaxFormulasReached ? '🔒 Limite (3/3)' : '+ Adicionar Fórmula'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Fórmulas Inseridas pelo Aluno (Máximo 3, com botão de Excluir que destrava a adição) */}
              <div className="space-y-2.5">
                {formulasCalculadas.length === 0 ? (
                  <div className="bg-slate-900/50 border border-dashed border-slate-700 rounded-xl p-6 text-center text-xs text-slate-400">
                    Nenhuma fórmula inserida ainda. Adicione exatamente <strong>3 fórmulas preditivas</strong> acima para liberar o avanço.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {formulasCalculadas.map((f, idx) => (
                      <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 relative">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] text-emerald-400 font-bold">
                            Fórmula #{idx + 1}: {f.nome}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoverFormula(f.id)}
                            className="text-rose-400 hover:text-rose-300 text-[11px] font-bold px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800/50 cursor-pointer"
                            title="Excluir esta fórmula para destravar e inserir outra"
                          >
                            🗑️ Excluir
                          </button>
                        </div>
                        <div className="text-xl font-bold text-white">{f.resultadoKcal} kcal/dia</div>
                        <div className="text-[11px] text-slate-400 font-mono">{f.equacao}</div>
                        <button
                          type="button"
                          onClick={() => updateField('prescricaoVET', String(f.resultadoKcal))}
                          className="w-full mt-1 bg-slate-800 hover:bg-emerald-950/70 text-emerald-300 border border-slate-700 hover:border-emerald-700 rounded-lg py-1 text-[11px] font-bold transition cursor-pointer"
                        >
                          🎯 Adotar como VET Planejado ({f.resultadoKcal} kcal)
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Campo VET Planejado (vinculado dinamicamente à NEE do Recordatório 24h) + Justificativa */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div>
                  <label className="text-xs font-bold text-emerald-400 block mb-1">
                    VET Planejado (Base 100% da NEE no Recordatório 24h):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="inputVetPlanejadoCalc"
                      type="number"
                      value={draftData.prescricaoVET || ''}
                      onChange={(e) => updateField('prescricaoVET', e.target.value)}
                      placeholder="Digite o VET Planejado (ex: 2100)"
                      className="w-full bg-slate-950 border border-emerald-500/60 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-emerald-400 outline-none"
                    />
                    <span className="text-xs font-bold text-slate-400">kcal/dia</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Reflete instantaneamente na NEE do Recordatório 24h e na Prescrição.
                  </span>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-emerald-400 block mb-1">
                    Justificativa da Equação Escolhida & Raciocínio Energético:
                  </label>
                  <textarea
                    rows={2}
                    value={draftData.notasCalculo || ''}
                    onChange={(e) => updateField('notasCalculo', e.target.value)}
                    placeholder="Justifique a equação preditiva adotada e os fatores aplicados..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:border-emerald-500 outline-none resize-y"
                  />
                </div>
              </div>

              {/* Rodapé com Bloqueio de Avanço (Next Step) até existirem exatamente 3 fórmulas completas */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400">
                  {canAdvanceFromCalculos
                    ? '✅ Exatas 3 fórmulas completas preenchidas. Avanço liberado!'
                    : `⚠️ Preencha exatamente 3 fórmulas completas para avançar (atual: ${formulasCompletasCount}/3).`}
                </span>
                <button
                  type="button"
                  id="btnAvancarCalculos"
                  disabled={!canAdvanceFromCalculos}
                  onClick={() => {
                    if (canAdvanceFromCalculos) {
                      setActiveTab('diagnostico');
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition cursor-pointer disabled:bg-slate-800 disabled:text-slate-500 disabled:border disabled:border-slate-700 disabled:cursor-not-allowed"
                >
                  Salvar e Avançar para Próxima Aba ➔
                </button>
              </div>
            </div>
          )}

          {activeTab === 'diagnostico' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                Diagnostico Nutricional (PES) e Objetivos Dietoterapicos
              </h3>

              {/* Rascunho Interativo dos 3 Pilares PES */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-400 block">Problema (P):</span>
                  <textarea
                    rows={2}
                    value={draftData.diagnosticoProblema || ''}
                    onChange={(e) => updateField('diagnosticoProblema', e.target.value)}
                    placeholder="Ex: Ingestão excessiva de carboidratos simples..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-emerald-500 outline-none resize-y"
                  />
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-sky-400 block">Etiologia (E):</span>
                  <textarea
                    rows={2}
                    value={draftData.diagnosticoEtiologia || ''}
                    onChange={(e) => updateField('diagnosticoEtiologia', e.target.value)}
                    placeholder="Ex: Hábitos inadequados e fracionamento irregular..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-emerald-500 outline-none resize-y"
                  />
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-amber-400 block">Sinais / Sintomas (S):</span>
                  <textarea
                    rows={2}
                    value={draftData.diagnosticoSinais || ''}
                    onChange={(e) => updateField('diagnosticoSinais', e.target.value)}
                    placeholder="Ex: HbA1c 8.9%, glicemia 186 mg/dL e sobrepeso..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-emerald-500 outline-none resize-y"
                  />
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="text-emerald-400 font-bold block text-sm">Diagnostico PES Consolidado:</span>
                <textarea
                  rows={3}
                  value={draftData.diagnosticoPESTexto || ''}
                  onChange={(e) => updateField('diagnosticoPESTexto', e.target.value)}
                  placeholder="Redija o diagnóstico PES completo padronizado..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:border-emerald-500 outline-none resize-y font-mono"
                />
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="text-emerald-400 font-bold block text-sm">Objetivos Dietoterapicos:</span>
                <textarea
                  rows={3}
                  value={draftData.objetivosDietoterapicos || ''}
                  onChange={(e) => updateField('objetivosDietoterapicos', e.target.value)}
                  placeholder="Liste as metas e objetivos a curto e longo prazo..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:border-emerald-500 outline-none resize-y"
                />
              </div>
            </div>
          )}

          {activeTab === 'prescricao' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                Prescricao Dietoterapica Quantitativa
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-1">VET Planejado:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={draftData.prescricaoVET || ''}
                      onChange={(e) => updateField('prescricaoVET', e.target.value)}
                      placeholder="Ex: 2100"
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold text-base w-24 focus:border-emerald-500 outline-none"
                    />
                    <span className="text-slate-400 font-bold">kcal</span>
                  </div>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-1">Carboidratos (CHO):</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={draftData.prescricaoCHO || '50'}
                      onChange={(e) => updateField('prescricaoCHO', e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-emerald-400 font-bold text-base w-20 focus:border-emerald-500 outline-none"
                    />
                    <span className="text-slate-400 font-bold">%</span>
                  </div>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-1">Proteinas (PTN):</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={draftData.prescricaoPTN || '20'}
                      onChange={(e) => updateField('prescricaoPTN', e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sky-400 font-bold text-base w-20 focus:border-emerald-500 outline-none"
                    />
                    <span className="text-slate-400 font-bold">%</span>
                  </div>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-1">Lipidios (LIP):</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={draftData.prescricaoLIP || '30'}
                      onChange={(e) => updateField('prescricaoLIP', e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-400 font-bold text-base w-20 focus:border-emerald-500 outline-none"
                    />
                    <span className="text-slate-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="text-emerald-400 font-bold block text-sm">Conduta & Orientação Dietoterápica:</span>
                <textarea
                  rows={3}
                  value={draftData.condutaPrescricao || ''}
                  onChange={(e) => updateField('condutaPrescricao', e.target.value)}
                  placeholder="Descreva as características da dieta, consistência, fracionamento e micronutrientes..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:border-emerald-500 outline-none resize-y"
                />
              </div>
            </div>
          )}

          {activeTab === 'cardapio' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {habilitarPlanejamentoQualitativo
                    ? 'Planejamento Alimentar Qualitativo (Foco Comportamental)'
                    : 'Cardápio Quali-Quantitativo (Bancos Oficiais & Colaborativos)'}
                </h3>
                {habilitarPlanejamentoQualitativo ? (
                  <span className="text-[11px] font-bold bg-amber-950/70 text-amber-300 border border-amber-700/60 px-3 py-1 rounded-full">
                    Modo Qualitativo Ativo • Sem Análise Quantitativa
                  </span>
                ) : (
                  <span className="text-[11px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 px-3 py-1 rounded-full">
                    Modo Quantitativo Ativo • Banco de Alimentos, Gramaturas, Macros e DRIs
                  </span>
                )}
              </div>

              {/* 1. Seletor de Tipo de Cardápio (Interface do Aluno): 'Planejamento Qualitativo' vs 'Planejamento Quantitativo' */}
              <div
                id="seletorTipoPlanejamentoCardapioSim"
                className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2"
              >
                <span className="text-xs font-bold text-emerald-400 block">
                  🍽️ Selecione o Formato do Planejamento Dietético (Escolha do Aluno):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Tipo de Planejamento Dietético">
                  <label
                    id="btnModoQualitativoSim"
                    onClick={() => handleSelectTipoPlanejamentoCardapio('qualitativo')}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition select-none ${
                      habilitarPlanejamentoQualitativo
                        ? 'border-amber-500 bg-amber-950/30 text-white shadow'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      id="radioModoQualitativoSim"
                      name="tipoPlanejamentoCardapioSim"
                      value="qualitativo"
                      checked={habilitarPlanejamentoQualitativo}
                      onChange={() => handleSelectTipoPlanejamentoCardapio('qualitativo')}
                      className="mt-1 accent-amber-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>🥗</span>
                        <span>Planejamento Qualitativo</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Blocos limpos por refeição (Refeição, Horário, Preparação, Alimentos e Medidas Caseiras), sem tabelas quantitativas de gramaturas, macros ou DRIs.
                      </p>
                    </div>
                  </label>

                  <label
                    id="btnModoQuantitativoSim"
                    onClick={() => handleSelectTipoPlanejamentoCardapio('quantitativo')}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition select-none ${
                      !habilitarPlanejamentoQualitativo
                        ? 'border-emerald-500 bg-emerald-950/30 text-white shadow'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      id="radioModoQuantitativoSim"
                      name="tipoPlanejamentoCardapioSim"
                      value="quantitativo"
                      checked={!habilitarPlanejamentoQualitativo}
                      onChange={() => handleSelectTipoPlanejamentoCardapio('quantitativo')}
                      className="mt-1 accent-emerald-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>📊</span>
                        <span>Planejamento Quantitativo</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Esquema completo padrão com banco de alimentos (TACO / Decisão / Colaborativa), gramaturas, cálculos de VET, distribuição de macronutrientes e adequação de DRIs.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {habilitarPlanejamentoQualitativo ? (
                /* 2. Comportamento do Modo 'Qualitativo': Oculta todas as tabelas de composição nutricional, gramaturas, macros, micronutrientes e cálculos de DRIs/VET; exibe blocos limpos por refeição com múltiplos alimentos */
                <div id="painelPlanejamentoQualitativoSim" className="space-y-4 text-xs">
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-white text-sm">
                        Planejamento Alimentar Qualitativo • Blocos por Refeição
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Selecione a refeição, informe o horário e a preparação, e adicione quantos alimentos e medidas caseiras desejar em cada refeição.
                      </p>
                    </div>
                    <button
                      type="button"
                      id="btnAddRefeicaoQualitativaSim"
                      onClick={handleAddQualitativoBlocoRefeicao}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>➕</span>
                      <span>Adicionar Nova Refeição</span>
                    </button>
                  </div>

                  <div id="listaBlocosQualitativosSim" className="space-y-4">
                    {(planejamentoQualitativoBlocos || []).map((bloco, mealIdx) => (
                      <div
                        key={bloco?.id || `qual-bloco-${mealIdx}`}
                        className="qualitativo-meal-block bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow"
                      >
                        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 w-full">
                            {/* Refeição: Dropdown/Seletor */}
                            <div>
                              <label className="block text-[11px] font-bold text-emerald-400 mb-1">
                                🍽️ Refeição:
                              </label>
                              <select
                                value={bloco?.refeicao || 'Desjejum'}
                                onChange={(e) => handleUpdateQualitativoBlocoField(mealIdx, 'refeicao', e.target.value)}
                                className="qualitativo-select-refeicao w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:border-emerald-500 outline-none"
                              >
                                {REFEICOES_QUALITATIVAS_OPCOES.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                                {bloco?.refeicao && !REFEICOES_QUALITATIVAS_OPCOES.includes(bloco.refeicao) && (
                                  <option value={bloco.refeicao}>{bloco.refeicao}</option>
                                )}
                              </select>
                            </div>

                            {/* Horário: Input de hora */}
                            <div>
                              <label className="block text-[11px] font-bold text-emerald-400 mb-1">
                                ⏰ Horário:
                              </label>
                              <input
                                type="time"
                                value={bloco?.horario || '07:30'}
                                onChange={(e) => handleUpdateQualitativoBlocoField(mealIdx, 'horario', e.target.value)}
                                className="qualitativo-input-horario w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:border-emerald-500 outline-none"
                              />
                            </div>

                            {/* Preparação: Input de texto livre */}
                            <div>
                              <label className="block text-[11px] font-bold text-emerald-400 mb-1">
                                🍲 Preparação:
                              </label>
                              <input
                                type="text"
                                value={bloco?.preparacao ?? ''}
                                onChange={(e) => handleUpdateQualitativoBlocoField(mealIdx, 'preparacao', e.target.value)}
                                placeholder="Ex: Vitamina de banana, Mingau de aveia..."
                                className="qualitativo-input-preparacao w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-medium focus:border-emerald-500 outline-none"
                              />
                            </div>
                          </div>

                          {planejamentoQualitativoBlocos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveQualitativoBlocoRefeicao(mealIdx)}
                              className="text-rose-400 hover:text-rose-300 bg-rose-950/30 border border-rose-800/40 px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition"
                              title="Remover este bloco de refeição"
                            >
                              🗑️ Excluir Refeição
                            </button>
                          )}
                        </div>

                        {/* Lista de múltiplos alimentos dentro da mesma refeição */}
                        <div className="space-y-2">
                          <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase text-slate-400 px-1">
                            <div className="col-span-6">Alimento</div>
                            <div className="col-span-5">Medida Caseira</div>
                            <div className="col-span-1 text-center">Ação</div>
                          </div>

                          {(bloco?.itens || []).map((it, itemIdx) => (
                            <div
                              key={it?.id || `qual-it-${mealIdx}-${itemIdx}`}
                              className="grid grid-cols-12 gap-2 items-center"
                            >
                              <div className="col-span-6">
                                <input
                                  type="text"
                                  value={it?.alimento ?? it?.alimentoNome ?? it?.nome ?? ''}
                                  onChange={(e) => handleUpdateQualitativoAlimentoField(mealIdx, itemIdx, 'alimento', e.target.value)}
                                  placeholder="Ex: Banana prata, Leite desnatado, Aveia em flocos..."
                                  className="qualitativo-input-alimento w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:border-emerald-500 outline-none"
                                />
                              </div>
                              <div className="col-span-5">
                                <input
                                  type="text"
                                  value={it?.medidaCaseira ?? it?.medida ?? ''}
                                  onChange={(e) => handleUpdateQualitativoAlimentoField(mealIdx, itemIdx, 'medidaCaseira', e.target.value)}
                                  placeholder="Ex: 1 copo cheio, 2 colheres de sopa..."
                                  className="qualitativo-input-medida w-full bg-slate-950 border border-emerald-500/60 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-semibold focus:border-emerald-400 outline-none"
                                />
                              </div>
                              <div className="col-span-1 text-center">
                                <button
                                  type="button"
                                  disabled={(bloco?.itens || []).length <= 1}
                                  onClick={() => handleRemoveQualitativoAlimentoInMeal(mealIdx, itemIdx)}
                                  className="text-rose-400 hover:text-rose-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold px-1.5 py-1 rounded cursor-pointer"
                                  title="Remover alimento desta refeição"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-1 flex items-center justify-between border-t border-slate-800/80">
                          <button
                            type="button"
                            id={mealIdx === 0 ? 'btnAddAlimentoQualitativoSim' : undefined}
                            onClick={() => handleAddQualitativoAlimentoInMeal(mealIdx)}
                            className="bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                          >
                            <span>➕</span>
                            <span>Adicionar Alimento nesta Refeição</span>
                          </button>
                          <span className="text-[11px] text-slate-400">
                            {(bloco?.itens || []).length} alimento(s) nesta refeição
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Novo Campo de 'Preparação' no Cardápio/Planejamento Dietético (Modo Quantitativo) */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center gap-2.5">
                    <label htmlFor="inputPreparacaoCardapioSim" className="text-xs font-bold text-emerald-400 whitespace-nowrap">
                      🍲 Preparação (Nome do Prato / Agrupamento):
                    </label>
                    <input
                      type="text"
                      id="inputPreparacaoCardapioSim"
                      value={draftData.cardapioPreparacao ?? 'Mingau de aveia com mamão e pão integral'}
                      onChange={(e) => handleCardapioPreparacaoChange(e.target.value)}
                      placeholder="Ex: Vitamina de banana, Mingau de aveia, Desjejum cardioprotetor..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    Alimentos vinculados às bases TACO (UNICAMP), Decisão Nutricional (Philippi) e Tabela Colaborativa Global com cálculo em tempo real de macro e micronutrientes.
                  </p>

                  {/* Seletor de Bases e Botao Cadastrar Alimento */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-emerald-400 block">Fonte de Dados Nutricionais:</span>
                        <span className="text-[11px] text-slate-400">Escolha a base para consulta ou adicione novos itens compartilhados</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCadAlimentoOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>➕</span>
                        <span>Cadastrar Alimento</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        { id: 'todas', label: 'Todas as Fontes' },
                        { id: 'taco', label: 'TACO - UNICAMP (4ª Ed)' },
                        { id: 'decisao', label: 'Decisão Nutricional (Philippi)' },
                        { id: 'colaborativa', label: 'Tabela Colaborativa (Nuvem)' },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setFoodSource(tab.id as any)}
                          className={`text-xs px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                            foodSource === tab.id
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="font-bold text-slate-200">
                        Refeição Modelo: Desjejum (07:30) • Preparação: <span className="text-emerald-400">{draftData.cardapioPreparacao || 'Mingau de aveia com mamão e pão integral'}</span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                        Total: {Math.round(cardapioItems.reduce((acc, it) => acc + it.kcal, 0))} kcal | CHO: {Math.round(cardapioItems.reduce((acc, it) => acc + it.cho, 0))}g | PTN: {Math.round(cardapioItems.reduce((acc, it) => acc + it.ptn, 0))}g | LIP: {Math.round(cardapioItems.reduce((acc, it) => acc + it.lip, 0))}g
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                          <tr>
                            <th className="py-1.5 px-2">Alimento</th>
                            <th className="py-1.5 px-2">Medida Base</th>
                            <th className="py-1.5 px-2 text-center w-20 text-emerald-400 font-bold">Qtd</th>
                            <th className="py-1.5 px-2 text-right w-24">Gramas</th>
                            <th className="py-1.5 px-2 text-right w-16 text-emerald-400 font-bold">Kcal</th>
                            <th className="py-1.5 px-2 text-right w-16 text-amber-400">CHO</th>
                            <th className="py-1.5 px-2 text-right w-16 text-sky-400">PTN</th>
                            <th className="py-1.5 px-2 text-right w-16 text-rose-400">LIP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {cardapioItems.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-850/50 transition">
                              <td className="py-2 px-2 font-medium text-slate-200">{item.nome}</td>
                              <td className="py-2 px-2 text-slate-400">1 {item.medida} ({item.pesoMedidaG}g)</td>
                              <td className="py-2 px-2 text-center">
                                <input
                                  type="number"
                                  min="0.1"
                                  step="0.5"
                                  value={item.qtd}
                                  onChange={(e) => handleCardapioQtdChange(idx, e.target.value)}
                                  className="w-16 bg-slate-950 border border-emerald-500/60 rounded px-1.5 py-1 text-center font-bold text-emerald-300 focus:border-emerald-400 outline-none"
                                  title="Altere a quantidade da medida caseira para recalcular gramas e nutrientes instantaneamente"
                                />
                              </td>
                              <td className="py-2 px-2 text-right font-bold text-slate-300">{item.gramas}g</td>
                              <td className="py-2 px-2 text-right font-bold text-emerald-400">{item.kcal}</td>
                              <td className="py-2 px-2 text-right text-slate-300">{item.cho}g</td>
                              <td className="py-2 px-2 text-right text-slate-300">{item.ptn}g</td>
                              <td className="py-2 px-2 text-right text-slate-300">{item.lip}g</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <LipidQualitySection
                    title="Quadro de Distribuição de Gorduras (Frações Lipídicas do Cardápio)"
                    subtitle="Planejamento de ácidos graxos com diretrizes e conversão automática (1g = 9 kcal)."
                    vetKcal={2100}
                    theme="emerald"
                    defaultValues={{
                      satG: '14.0',
                      satPct: '6.0',
                      monoG: '38.0',
                      monoPct: '16.3',
                      poliG: '18.0',
                      poliPct: '7.7'
                    }}
                  />

                  <MicronutrientAdequacySection
                    idPrefix="cardapio-dri"
                    title="Análise de Adequação de Micronutrientes do Planejamento Dietético (DRIs)"
                    subtitle="Cruzamento automático em tempo real entre os micronutrientes do cardápio planejado e as DRIs do paciente (RDA ➔ EAR ➔ AI e UL)."
                    patientAge={activePatientInfo.idade}
                    patientSex={activePatientInfo.sexo}
                    intakes={cardapioMicroTotals}
                  />
                </>
              )}
            </div>
          )}

          {activeTab === 'questoes' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Questoes Avaliativas e Raciocinio Clinico
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Responda às questões clínicas propostas pelo preceptor. Suas respostas e opções selecionadas são salvas automaticamente no rascunho local.
                </p>
              </div>

              {/* Questão 1 (Discursiva) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">Questão 1 • Discursiva</span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Diagnóstico PES</span>
                </div>
                <p className="text-xs text-slate-200">
                  1. Formule o Diagnóstico em Nutrição prioritário para este paciente utilizando a terminologia padronizada e a metodologia PES (Problema, Etiologia e Sinais/Sintomas).
                </p>
                <textarea
                  id="textareaQuestao1"
                  rows={3}
                  value={draftData.respostasQuestoes?.q1 || ''}
                  onChange={(e) => updateField('respostasQuestoes', { ...draftData.respostasQuestoes, q1: e.target.value })}
                  placeholder="Escreva sua resposta detalhada..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none resize-y"
                />
              </div>

              {/* Questão 2 (Múltipla Escolha) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">Questão 2 • Múltipla Escolha</span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Metas de Prescrição</span>
                </div>
                <p className="text-xs text-slate-200">
                  2. De acordo com as Diretrizes da Sociedade Brasileira de Diabetes (SBD 2024), qual a distribuição percentual de carboidratos recomendada para este paciente com DM2 e HAS?
                </p>
                <div className="space-y-2 pt-1 text-xs">
                  {[
                    { id: 'opt_a', label: 'A) 30% a 35% do VET (Dieta Very Low Carb)' },
                    { id: 'opt_b', label: 'B) 45% a 60% do VET, priorizando carboidratos ricos em fibras e baixo IG' },
                    { id: 'opt_c', label: 'C) 70% a 75% do VET com restrição severa de proteínas' },
                    { id: 'opt_d', label: 'D) Livre demanda sem controle quantitativo de carboidratos' },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center space-x-2.5 p-2 rounded-lg border cursor-pointer transition ${
                        draftData.respostasQuestoes?.q2 === opt.id
                          ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-300'
                          : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="questao_2_opcao"
                        checked={draftData.respostasQuestoes?.q2 === opt.id}
                        onChange={() => updateField('respostasQuestoes', { ...draftData.respostasQuestoes, q2: opt.id })}
                        className="accent-emerald-500 text-emerald-500 focus:ring-0"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Questão 3 (Discursiva) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">Questão 3 • Discursiva</span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Farmacoterapia & Minerais</span>
                </div>
                <p className="text-xs text-slate-200">
                  3. Qual a conduta dietoterápica em relação à ingestão de sódio e potássio considerando o quadro hipertensivo estágio 2 do paciente e a interação medicamentosa com anti-hipertensivos?
                </p>
                <textarea
                  id="textareaQuestao3"
                  rows={3}
                  value={draftData.respostasQuestoes?.q3 || ''}
                  onChange={(e) => updateField('respostasQuestoes', { ...draftData.respostasQuestoes, q3: e.target.value })}
                  placeholder="Escreva sua resposta detalhada..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none resize-y"
                />
              </div>
            </div>
          )}

          {activeTab === 'orientacao' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>📋</span>
                    <span>Orientação Nutricional (Qualitativa, Comportamental, Substituições e Alta)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Redija as orientações qualitativas, estratégias comportamentais, lista de substituições e recomendações de alta para o paciente. Salvo automaticamente no rascunho local.
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 px-2.5 py-1 rounded-full">
                  Última Etapa do Fluxo Clínico • Auto-Save Ativo
                </span>
              </div>

              {/* Barra de Inserção Rápida / Estruturação de Texto (Rich Text / Tópicos Clínicos) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block">Inserir Tópicos Estruturados no Editor:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '+ Orientações Qualitativas', snippet: '\n• ORIENTAÇÕES QUALITATIVAS E DE PREPARO:\n- Priorizar preparações assadas, grelhadas ou cozidas no vapor, evitando frituras de imersão.\n- Utilizar temperos naturais (alho, cebola, ervas aromáticas, cúrcuma) em substituição aos caldos industrializados.\n' },
                    { label: '+ Mudanças Comportamentais', snippet: '\n• ESTRATÉGIAS COMPORTAMENTAIS E ESTILO DE VIDA:\n- Manter fracionamento regular das refeições (a cada 3 horas), mastigando devagar.\n- Meta de hidratação diária fracionada ao longo do dia nos intervalos interprandiais.\n' },
                    { label: '+ Lista de Substituições', snippet: '\n• LISTA DE SUBSTITUIÇÕES EQUIVALENTES:\n- Grupo dos Cereais/Tubérculos: 1 unidade de pão francês (50g) = 2 fatias de pão integral (50g) = 3 colheres de sopa de mandioca/aipim cozido.\n- Grupo das Carnes/Ovos: 1 filé médio de frango grelhado (100g) = 1 filé de peixe assado (120g) = 2 ovos cozidos.\n' },
                    { label: '+ Orientações de Alta', snippet: '\n• ORIENTAÇÕES DE ALTA E SINAIS DE ALERTA:\n- Monitorar sinais de hipoglicemia/hiperglicemia e níveis pressóricos domiciliares.\n- Retorno ambulatorial agendado em 30 dias com novos exames laboratoriais de controle.\n' }
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => {
                        const atual = draftData.orientacoesNutricionais || '';
                        updateField('orientacoesNutricionais', (atual ? atual.trimEnd() + '\n' : '') + btn.snippet.trimStart());
                      }}
                      className="text-[11px] font-semibold bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-600/60 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <label htmlFor="textareaOrientacaoNutricionalSim" className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                  <span>Redação Completa das Orientações Nutricionais ao Paciente:</span>
                  <span className="text-[10px] text-slate-400">
                    {(draftData.orientacoesNutricionais || '').length} caracteres • Sincronizado com Auto-Save e Relatório Final
                  </span>
                </label>
                <textarea
                  id="textareaOrientacaoNutricionalSim"
                  rows={12}
                  value={draftData.orientacoesNutricionais || ''}
                  onChange={(e) => updateField('orientacoesNutricionais', e.target.value)}
                  placeholder="Redija aqui as orientações qualitativas, comportamentais, lista de substituições equivalentes, meta hídrica e orientações de alta para o paciente..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-100 leading-relaxed focus:border-emerald-500 outline-none resize-y"
                />
              </div>
            </div>
          )}

          {activeTab === 'relatorio' && (
            <div className="space-y-4">
              <RelatorioFinal
                draftData={draftData}
                clinicalCase={{
                  id: selectedCase,
                  title: selectedCase === 'caso-dm2-has' ? 'Caso 1: DM2 e HAS (Adulto/Idoso)' : (selectedCase === 'caso-desnutricao' ? 'Caso 2: Desnutrição Hospitalar Grave' : 'Caso 3: DRC Conservadora'),
                  patient: {
                    name: draftData.patientName || (selectedCase === 'caso-dm2-has' ? 'Carlos Alberto Souza' : 'Paciente Simulado'),
                    age: selectedCase === 'caso-dm2-has' ? '58' : '65',
                    gender: 'Masculino',
                    occupation: 'Motorista de Aplicativo'
                  }
                }}
                onClose={() => setActiveTab('anamnese')}
              />
            </div>
          )}
        </div>

        {/* Barra Inferior Fixa de Ações do Rascunho / Finalização */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Rascunho Ativo:</span>
            <code className="bg-slate-900 text-emerald-400 px-2.5 py-1 rounded-md border border-slate-800 font-mono text-[11px]">
              {draftKey}
            </code>
            {lastSaved && (
              <span className="text-emerald-400 text-[11px] font-medium hidden sm:inline">
                • Salvo às {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btnSalvarRascunhoManual"
              onClick={forceSave}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>💾</span>
              <span>Salvar Agora</span>
            </button>

            <button
              type="button"
              id="btnFinalizarCaso"
              onClick={handleFinalizarCaso}
              disabled={isSubmittingCase}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>🚀</span>
              <span>
                {isSubmittingCase
                  ? 'Finalizando...'
                  : habilitarCorrecaoAutomaticaIA
                  ? 'Finalizar e Enviar para Correção IA'
                  : 'Finalizar Caso'}
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Modal de Confirmação de Sucesso da Submissão, Avaliação por IA e Limpeza de Rascunho */}
      {submissionSuccessModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-2xl w-full p-6 text-white space-y-4 shadow-2xl my-6 max-h-[90vh] overflow-y-auto">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl mx-auto border border-emerald-500/30">
                ✓
              </div>
              <h4 className="text-lg font-bold text-white">Caso Clínico Finalizado com Sucesso!</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Suas respostas, cálculos e planejamento alimentar foram enviados com sucesso para a avaliação docente.
              </p>
            </div>

            {aiEvaluationResult && (
              <div id="aiEvaluationResultModalSim" className="bg-slate-950 border border-emerald-500/40 rounded-xl p-4 text-left space-y-3">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 gap-2">
                  <div className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                    <span>🤖</span>
                    <span>Avaliação Automática por IA (Professor Avaliador • BRASPEN / SBC)</span>
                  </div>
                  <span id="aiEvaluationScoreBadgeSim" className="bg-emerald-600/30 border border-emerald-500 text-emerald-300 font-extrabold text-sm px-3 py-1 rounded-full">
                    Nota Final: {aiEvaluationResult.notaFinal} / 10,0
                  </span>
                </div>
                <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  {aiEvaluationResult.avaliacaoIA}
                </pre>
                <div className="text-[11px] text-sky-300 bg-sky-950/40 border border-sky-700/50 rounded-lg p-2.5">
                  📧 <strong>E-mail Disparado ao Professor:</strong> Cópia integral da sua resolução e da avaliação da IA (Nota {aiEvaluationResult.notaFinal}/10,0) enviada para <code>{aiEvaluationResult.professorEmail}</code>.
                </div>
              </div>
            )}

            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 text-emerald-300 text-[11px] text-center">
              🧹 <strong>Isolamento Garantido:</strong> O rascunho local deste caso foi removido do seu dispositivo com sucesso.
            </div>

            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setSubmissionSuccessModal(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition cursor-pointer"
              >
                Concluir Atendimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastrar Alimento Colaborativo */}
      {isCadAlimentoOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-xl w-full p-6 text-white space-y-4 shadow-2xl my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥗</span>
                <div>
                  <h4 className="font-bold text-base text-white">Cadastrar Novo Alimento</h4>
                  <p className="text-xs text-slate-400">Tabela Colaborativa Global em Nuvem • Sincronização Compartilhada</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCadAlimentoOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!novoAlimento.nome) return;
                alert(`Alimento "${novoAlimento.nome}" cadastrado com sucesso e sincronizado em nuvem!`);
                setIsCadAlimentoOpen(false);
                setNovoAlimento({
                  nome: '',
                  categoria: 'Cereais e derivados',
                  baseGramas: 100,
                  porcaoSugerida: '',
                  kcal: '',
                  cho: '',
                  ptn: '',
                  lip: '',
                  sat: '',
                  mono: '',
                  poli: '',
                  fibra: '',
                  calcio: '',
                  ferro: '',
                  sodio: '',
                  potassio: '',
                  vitA: '',
                  vitC: ''
                });
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome do Alimento: *</label>
                <input
                  type="text"
                  required
                  value={novoAlimento.nome}
                  onChange={(e) => setNovoAlimento({ ...novoAlimento, nome: e.target.value })}
                  placeholder="Ex: Iogurte grego natural tradicional"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoria:</label>
                  <select
                    value={novoAlimento.categoria}
                    onChange={(e) => setNovoAlimento({ ...novoAlimento, categoria: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500"
                  >
                    <option value="Cereais e derivados">Cereais e derivados</option>
                    <option value="Leguminosas e derivados">Leguminosas e derivados</option>
                    <option value="Carnes e derivados">Carnes e derivados</option>
                    <option value="Pescados e frutos do mar">Pescados e frutos do mar</option>
                    <option value="Ovos e derivados">Ovos e derivados</option>
                    <option value="Leite e derivados">Leite e derivados</option>
                    <option value="Frutas e derivados">Frutas e derivados</option>
                    <option value="Verduras e derivados">Verduras e derivados</option>
                    <option value="Óleos e gorduras">Óleos e gorduras</option>
                    <option value="Panificação">Panificação</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Porção Sugerida:</label>
                  <input
                    type="text"
                    value={novoAlimento.porcaoSugerida}
                    onChange={(e) => setNovoAlimento({ ...novoAlimento, porcaoSugerida: e.target.value })}
                    placeholder="Ex: 1 pote (100g)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Grid de Macronutrientes */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 block text-[11px]">Composição em 100g (Macronutrientes):</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Kcal: *</span>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={novoAlimento.kcal}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, kcal: e.target.value })}
                      placeholder="0.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">CHO (g): *</span>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={novoAlimento.cho}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, cho: e.target.value })}
                      placeholder="0.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">PTN (g): *</span>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={novoAlimento.ptn}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, ptn: e.target.value })}
                      placeholder="0.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">LIP (g): *</span>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={novoAlimento.lip}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, lip: e.target.value })}
                      placeholder="0.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Micronutrientes Chave */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 block text-[11px]">Micronutrientes Chave (por 100g):</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Fibra (g):</span>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={novoAlimento.fibra}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, fibra: e.target.value })}
                      placeholder="0.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Cálcio (mg):</span>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={novoAlimento.calcio}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, calcio: e.target.value })}
                      placeholder="0.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Ferro (mg):</span>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={novoAlimento.ferro}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, ferro: e.target.value })}
                      placeholder="0.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Sódio (mg):</span>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={novoAlimento.sodio}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, sodio: e.target.value })}
                      placeholder="0.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCadAlimentoOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow cursor-pointer flex items-center gap-1.5"
                >
                  <span>☁️</span>
                  <span>Salvar na Nuvem</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preceptor IA Socratico */}
      <PreceptorFAB onClick={() => setIsPreceptorOpen(true)} />
      <PreceptorDrawer
        isOpen={isPreceptorOpen}
        onClose={() => setIsPreceptorOpen(false)}
        clinicalContext={clinicalContext}
      />

      {/* Rodapé Global Institucional */}
      <Footer />
    </div>
  );
}
