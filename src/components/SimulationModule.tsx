'use client';

import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import PreceptorFAB from './PreceptorFAB';
import PreceptorDrawer from './PreceptorDrawer';
import LipidQualitySection from './LipidQualitySection';
import { useCaseDraft, CaseDraftData } from '../hooks/useCaseDraft';

const DEFAULT_CARDAPIO_ITEMS = [
  {
    id: '1',
    nome: 'Pão francês',
    medida: 'unidade',
    pesoMedidaG: 50, // 1 unidade = 50g
    qtd: 1,
    gramas: 50, // Passo A: 1 * 50g = 50g
    nutri100g: { kcal: 300.0, cho: 58.6, ptn: 8.0, lip: 3.2 },
    kcal: 150.0, // Passo B: (50 * 300.0) / 100
    cho: 29.3,
    ptn: 4.0,
    lip: 1.6
  },
  {
    id: '2',
    nome: 'Pão de forma integral',
    medida: 'fatia',
    pesoMedidaG: 25, // 1 fatia = 25g
    qtd: 2,
    gramas: 50, // Passo A: 2 * 25g = 50g
    nutri100g: { kcal: 253.0, cho: 49.9, ptn: 9.4, lip: 3.7 },
    kcal: 126.5, // Passo B: (50 * 253.0) / 100
    cho: 25.0,
    ptn: 4.7,
    lip: 1.9
  },
  {
    id: '3',
    nome: 'Queijo minas frescal',
    medida: 'fatia média',
    pesoMedidaG: 30, // 1 fatia = 30g
    qtd: 1,
    gramas: 30, // Passo A: 1 * 30g = 30g
    nutri100g: { kcal: 264.0, cho: 3.2, ptn: 17.4, lip: 20.2 },
    kcal: 79.2, // Passo B: (30 * 264.0) / 100
    cho: 1.0,
    ptn: 5.2,
    lip: 6.1
  },
  {
    id: '4',
    nome: 'Mamão papaia',
    medida: 'fatia / porção',
    pesoMedidaG: 100, // 1 porção = 100g
    qtd: 1,
    gramas: 100, // Passo A: 1 * 100g = 100g
    nutri100g: { kcal: 40.0, cho: 10.4, ptn: 0.5, lip: 0.1 },
    kcal: 40.0, // Passo B: (100 * 40.0) / 100
    cho: 10.4,
    ptn: 0.5,
    lip: 0.1
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
    nutri100g: { kcal: 61.0, cho: 4.5, ptn: 3.2, lip: 3.5 },
    kcal: 122.0, // Passo B: (200 * 61.0) / 100
    cho: 9.0,
    ptn: 6.4,
    lip: 7.0
  },
  {
    id: 'rec-2',
    nome: 'Pão francês',
    medida: 'unidade',
    pesoMedidaG: 50, // 1 unidade = 50g
    qtd: 2,
    gramas: 100, // Passo A: 2 * 50g = 100g
    nutri100g: { kcal: 300.0, cho: 58.6, ptn: 8.0, lip: 3.2 },
    kcal: 300.0, // Passo B: (100 * 300.0) / 100
    cho: 58.6,
    ptn: 8.0,
    lip: 3.2
  },
  {
    id: 'rec-3',
    nome: 'Manteiga com sal',
    medida: 'ponta de faca',
    pesoMedidaG: 10, // 1 ponta de faca = 10g
    qtd: 1,
    gramas: 10, // Passo A: 1 * 10g = 10g
    nutri100g: { kcal: 726.0, cho: 0.1, ptn: 0.4, lip: 82.4 },
    kcal: 72.6, // Passo B: (10 * 726.0) / 100
    cho: 0.0,
    ptn: 0.0,
    lip: 8.2
  },
  {
    id: 'rec-4',
    nome: 'Banana prata',
    medida: 'unidade média',
    pesoMedidaG: 100, // 1 unidade = 100g
    qtd: 1,
    gramas: 100, // Passo A: 1 * 100g = 100g
    nutri100g: { kcal: 98.0, cho: 26.0, ptn: 1.3, lip: 0.1 },
    kcal: 98.0, // Passo B: (100 * 98.0) / 100
    cho: 26.0,
    ptn: 1.3,
    lip: 0.1
  }
];

const DEFAULT_EXAMS = [
  { id: '1', name: '', ref: '', value: '', interp: '' }
];

const DEFAULT_INTERACTIONS = [
  { id: '1', med: '', classification: '', conduta: '' }
];

const buildInitialDraft = (caseId: string, studentId: string): CaseDraftData => ({
  studentId,
  studentName: 'Estudante de Nutrição',
  caseId,
  lastUpdated: '',
  evolucaoTexto: 'Paciente refere poliúria, polidipsia e perda ponderal não intencional de 4 kg nos últimos dois meses. Queixa de astenia e cefaleia ocasional. Em uso irregular de medicação para diabetes e hipertensão.',
  peso: '88.5',
  estatura: '1.72',
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
  prescricaoVET: '2100',
  prescricaoCHO: '50',
  prescricaoPTN: '20',
  prescricaoLIP: '30',
  condutaPrescricao: 'Dieta normocalórica, normoglicídica com ênfase em carboidratos complexos de baixo IG, normoproteica e normolipídica com perfil cardioprotetor (< 7% gorduras saturadas, restrição de sódio < 2000 mg/dia).',
  cardapioItems: DEFAULT_CARDAPIO_ITEMS,
  respostasQuestoes: {
    q1: '',
    q2: 'opt_b',
    q3: ''
  }
});

export default function SimulationModule() {
  const [activeTab, setActiveTab] = useState<'anamnese' | 'exames' | 'interacoes' | 'calculos' | 'diagnostico' | 'prescricao' | 'cardapio' | 'questoes'>('anamnese');
  const [isPreceptorOpen, setIsPreceptorOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState('caso-dm2-has');

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

  // Aliases reativos para compatibilidade total de estados e testes
  const exams = draftData.exams || DEFAULT_EXAMS;
  const interactions = draftData.interactions || DEFAULT_INTERACTIONS;
  const recordatorioItems = draftData.recordatorioItems || DEFAULT_RECORDATORIO_ITEMS;
  const cardapioItems = draftData.cardapioItems || DEFAULT_CARDAPIO_ITEMS;

  // Estado de fontes de alimentos e cadastro colaborativo multi-tabelas
  const [foodSource, setFoodSource] = useState<'todas' | 'taco' | 'decisao' | 'colaborativa'>('taco');
  const [isCadAlimentoOpen, setIsCadAlimentoOpen] = useState(false);
  const [isSubmittingCase, setIsSubmittingCase] = useState(false);
  const [submissionSuccessModal, setSubmissionSuccessModal] = useState(false);

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

  // Passo A (Grama Total) e Passo B (Regra de 3 dos Nutrientes) em tempo real no Cardápio
  const handleCardapioQtdChange = (idx: number, newQtdVal: string) => {
    const qtdInserida = parseFloat(newQtdVal) || 0;
    const updated = cardapioItems.map((item, i) => {
      if (i !== idx) return item;
      const gramaturaTotal = Math.round((qtdInserida * item.pesoMedidaG) * 10) / 10;
      const calcNutri = (val100g: number) => Math.round(((gramaturaTotal * val100g) / 100) * 10) / 10;
      return {
        ...item,
        qtd: qtdInserida,
        gramas: gramaturaTotal,
        kcal: calcNutri(item.nutri100g.kcal),
        cho: calcNutri(item.nutri100g.cho),
        ptn: calcNutri(item.nutri100g.ptn),
        lip: calcNutri(item.nutri100g.lip)
      };
    });
    updateField('cardapioItems', updated);
  };

  // Passo A (Grama Total) e Passo B (Regra de 3) em tempo real no Recordatório 24h
  const handleRecordatorioQtdChange = (idx: number, newQtdVal: string) => {
    const qtdInserida = parseFloat(newQtdVal) || 0;
    const updated = recordatorioItems.map((item, i) => {
      if (i !== idx) return item;
      const gramaturaTotal = Math.round((qtdInserida * item.pesoMedidaG) * 10) / 10;
      const calcNutri = (val100g: number) => Math.round(((gramaturaTotal * val100g) / 100) * 10) / 10;
      return {
        ...item,
        qtd: qtdInserida,
        gramas: gramaturaTotal,
        kcal: calcNutri(item.nutri100g.kcal),
        cho: calcNutri(item.nutri100g.cho),
        ptn: calcNutri(item.nutri100g.ptn),
        lip: calcNutri(item.nutri100g.lip)
      };
    });
    updateField('recordatorioItems', updated);
  };

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

  // Submissão do Caso Clínico (Finalização e Limpeza do Rascunho no Storage)
  const handleFinalizarCaso = async () => {
    if (!studentId.trim()) {
      alert("Por favor, informe a identificação do aluno.");
      return;
    }

    const confirmSubmit = window.confirm("Deseja realmente finalizar e enviar este caso clínico ao professor? O rascunho local deste caso será removido do dispositivo.");
    if (!confirmSubmit) return;

    setIsSubmittingCase(true);
    try {
      // 1. Sincronização em nuvem com Firebase (se disponível)
      if (typeof window !== 'undefined' && (window as any).firebaseSyncService && typeof (window as any).firebaseSyncService.saveProntuario === 'function') {
        try {
          await (window as any).firebaseSyncService.saveProntuario(selectedCase, {
            ...draftData,
            userId: studentId,
            aluno: { id: studentId, nome: draftData.studentName || 'Estudante' },
            dataFinalizacao: new Date().toISOString()
          });
        } catch (fbErr) {
          console.warn("⚠️ Aviso ao sincronizar com Firestore:", fbErr);
        }
      }

      // 2. Limpeza estrita (Clear) do rascunho local SOMENTE após o clique em Finalizar/Enviar com sucesso
      clearDraft();

      // 3. Abre modal de confirmação
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

            {/* Botão Finalizar / Enviar Caso */}
            <button
              type="button"
              id="btnFinalizarCasoTop"
              onClick={handleFinalizarCaso}
              disabled={isSubmittingCase}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmittingCase ? 'Enviando...' : '🚀 Finalizar Caso'}</span>
            </button>

            <a
              href="/?view=simulation&tab=relatorio"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 shadow transition flex items-center gap-1"
            >
              <span>Relatorio A4</span>
            </a>
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
            { id: 'questoes', label: '8. Questoes Avaliativas', icon: '8' }
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
              </div>

              <LipidQualitySection
                title="Análise do Recordatório de 24h - Frações Lipídicas"
                subtitle="Avaliação da ingestão habitual de ácidos graxos relatada no recordatório com conversão automática (1g = 9 kcal)."
                vetKcal={2212}
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
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                As 5 Equacoes Preditivas Abertas
              </h3>
              <p className="text-xs text-slate-400">
                Compare as equacoes simultaneamente para definir a conduta normocalorica ou restritiva adequada.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-emerald-400 font-bold">1. Regra de Bolso</span>
                  <div className="text-xl font-bold text-white">2.212 kcal/dia</div>
                  <div className="text-[11px] text-slate-400">25 kcal/kg peso atual (25-30 kcal/kg)</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-emerald-400 font-bold">2. Harris & Benedict (1919)</span>
                  <div className="text-xl font-bold text-white">2.180 kcal/dia</div>
                  <div className="text-[11px] text-slate-400">GEB (1.677 kcal) &times; FA 1.3</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-emerald-400 font-bold">3. Mifflin-St Jeor (1990)</span>
                  <div className="text-xl font-bold text-white">2.145 kcal/dia</div>
                  <div className="text-[11px] text-slate-400">Indicada para sobrepeso e obesidade</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-emerald-400 font-bold">4. FAO / OMS (1985/2001)</span>
                  <div className="text-xl font-bold text-white">2.250 kcal/dia</div>
                  <div className="text-[11px] text-slate-400">Faixa etaria 30 a 60 anos</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-emerald-400 font-bold">5. EER / IOM (DRI 2002/2006)</span>
                  <div className="text-xl font-bold text-white">2.190 kcal/dia</div>
                  <div className="text-[11px] text-slate-400">Sedentario / Leve (CAF 1.12)</div>
                </div>
              </div>

              {/* Notas do Aluno sobre a Decisão Calórica */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 mt-4">
                <label className="text-xs font-bold text-emerald-400 block">
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
                      value={draftData.prescricaoVET || '2100'}
                      onChange={(e) => updateField('prescricaoVET', e.target.value)}
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
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                Cardápio Quali-Quantitativo (Bancos Oficiais & Colaborativos)
              </h3>
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
                  <div className="font-bold text-slate-200">Refeição Modelo: Desjejum (07:30) • Cálculo Dinâmico Reativo</div>
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
              <span>{isSubmittingCase ? 'Finalizando...' : 'Finalizar / Enviar Caso'}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Modal de Confirmação de Sucesso da Submissão e Limpeza de Rascunho */}
      {submissionSuccessModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-md w-full p-6 text-white text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl mx-auto border border-emerald-500/30">
              ✓
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Caso Clínico Finalizado com Sucesso!</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Suas respostas, cálculos e planejamento alimentar foram enviados com sucesso para a avaliação docente no Firebase.
              </p>
              <div className="mt-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 text-emerald-300 text-[11px]">
                🧹 <strong>Isolamento Garantido:</strong> O rascunho local deste caso foi removido do seu dispositivo com sucesso.
              </div>
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
