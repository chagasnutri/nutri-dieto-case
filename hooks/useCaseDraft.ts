'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface RecordatorioDraftItem {
  id: string;
  nome: string;
  preparacao?: string;
  tipoPreparacao?: string;
  refeicao?: string;
  medida: string;
  pesoMedidaG: number;
  qtd: number;
  gramas: number;
  nutri100g: {
    kcal: number;
    cho: number;
    ptn: number;
    lip: number;
    calcio?: number;
    ferro?: number;
    sodio?: number;
    potassio?: number;
    vitA?: number;
    vitC?: number;
  };
  kcal: number;
  cho: number;
  ptn: number;
  lip: number;
  calcio?: number;
  ferro?: number;
  sodio?: number;
  potassio?: number;
  vitA?: number;
  vitC?: number;
}

export interface CardapioDraftItem {
  id: string;
  nome: string;
  preparacao?: string;
  tipoPreparacao?: string;
  refeicao?: string;
  medida: string;
  pesoMedidaG: number;
  qtd: number;
  gramas: number;
  nutri100g: {
    kcal: number;
    cho: number;
    ptn: number;
    lip: number;
    calcio?: number;
    ferro?: number;
    sodio?: number;
    potassio?: number;
    vitA?: number;
    vitC?: number;
  };
  kcal: number;
  cho: number;
  ptn: number;
  lip: number;
  calcio?: number;
  ferro?: number;
  sodio?: number;
  potassio?: number;
  vitA?: number;
  vitC?: number;
}

export interface QualitativeMealFoodItem {
  id: string;
  alimento: string;
  alimentoNome?: string;
  nome?: string;
  medidaCaseira: string;
  medida?: string;
}

export interface QualitativeMealBlock {
  id: string;
  refeicao: string;
  horario: string;
  preparacao: string;
  tipoPreparacao?: string;
  tipoPlanejamento?: 'qualitativo' | 'quantitativo';
  itens: QualitativeMealFoodItem[];
  substituicoes?: string;
}

export interface ExamDraftItem {
  id: string;
  name: string;
  ref: string;
  value: string;
  interp: string;
}

export interface InteractionDraftItem {
  id: string;
  med: string;
  classification: string;
  conduta: string;
}

export interface CaseDraftData {
  studentId: string;
  studentName?: string;
  caseId: string;
  lastUpdated: string;
  activeTab?: string;

  // 1. Anamnese & Evolução
  evolucaoTexto: string;
  peso: string;
  estatura: string;
  recordatorioPreparacao?: string;
  recordatorioItems: RecordatorioDraftItem[];

  // 2. Exames Bioquímicos
  exams: ExamDraftItem[];

  // 3. Interações Droga-Nutriente
  interactions: InteractionDraftItem[];

  // 4. Fórmulas / Cálculos (Trava de Validação: Exatas 3 Fórmulas)
  formulaSelecionada: string;
  vetCalculado: string;
  notasCalculo: string;
  formulasCalculadas?: Array<{
    id: string;
    formulaKey: string;
    nome: string;
    equacao: string;
    resultadoKcal: string;
  }>;

  // 5. Diagnóstico PES & Objetivos
  diagnosticoProblema: string;
  diagnosticoEtiologia: string;
  diagnosticoSinais: string;
  diagnosticoPESTexto: string;
  objetivosDietoterapicos: string;

  // 6. Prescrição Dietoterápica
  prescricaoVET: string;
  prescricaoCHO: string;
  prescricaoPTN: string;
  prescricaoLIP: string;
  condutaPrescricao: string;

  // 7. Cardápio TACO / Planejamento Dietético (Seletor do Aluno: Qualitativo vs Quantitativo)
  tipoPlanejamentoCardapio?: 'qualitativo' | 'quantitativo';
  cardapioPreparacao?: string;
  cardapioItems: CardapioDraftItem[];
  planejamentoQualitativoBlocos?: QualitativeMealBlock[];
  planejamentoAlimentar?: Array<CardapioDraftItem | QualitativeMealBlock | any>;
  habilitarPlanejamentoQualitativo?: boolean;

  // 8. Questões Avaliativas (respostas discursivas e opções selecionadas)
  respostasQuestoes: Record<string, string>;

  // 9. Orientação Nutricional (qualitativa, comportamental, lista de substituições e alta)
  orientacoesNutricionais: string;

  // 10. Configurações e Resultado de Correção Automática por IA (Simulação Clínica)
  habilitarCorrecaoAutomaticaIA?: boolean;
  professorEmail?: string;
  avaliacaoIA?: string;
  notaIA?: string;
}

export interface UseCaseDraftOptions {
  debounceMs?: number;
  onAutoSave?: (key: string, data: CaseDraftData) => void;
  onLoad?: (key: string, data: CaseDraftData) => void;
}

/**
 * Custom Hook de Auto-Save para Simulação de Casos Clínicos do DietoCase
 * Chave única isolada: draft_caso_{caseId}_aluno_{studentId}
 */
export function useCaseDraft(
  caseId: string,
  studentId: string,
  initialData: CaseDraftData,
  options: UseCaseDraftOptions = {}
) {
  const { debounceMs = 800, onAutoSave, onLoad } = options;

  // Chave única dinâmica garantindo isolamento estrito por Aluno e Caso Clínico
  const cleanCaseId = (caseId || 'caso-padrao').trim();
  const cleanStudentId = (studentId || 'aluno-anon').trim();
  const draftKey = `draft_caso_${cleanCaseId}_aluno_${cleanStudentId}`;

  const [draftData, setDraftData] = useState<CaseDraftData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMountRef = useRef(true);

  // Recuperação Automática (Load) ao montar ou trocar de caso/aluno
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const safeParsed = (parsed && typeof parsed === 'object') ? parsed : {};
        const safeCardapio = Array.isArray(safeParsed?.cardapioItems) && safeParsed.cardapioItems.length > 0
          ? safeParsed.cardapioItems
          : (initialData?.cardapioItems || []);
        const safeQualitativoBlocos = Array.isArray(safeParsed?.planejamentoQualitativoBlocos) && safeParsed.planejamentoQualitativoBlocos.length > 0
          ? safeParsed.planejamentoQualitativoBlocos
          : (initialData?.planejamentoQualitativoBlocos || []);
        const isQualitativoAtivo = safeParsed?.tipoPlanejamentoCardapio === 'qualitativo' || Boolean(safeParsed?.habilitarPlanejamentoQualitativo);
        // Merge seguro garantindo integridade de arrays e campos novos (mesmo se planejamentoAlimentar estiver nulo/vazio)
        const merged: CaseDraftData = {
          ...initialData,
          ...safeParsed,
          caseId: cleanCaseId,
          studentId: cleanStudentId,
          tipoPlanejamentoCardapio: isQualitativoAtivo ? 'qualitativo' : 'quantitativo',
          habilitarPlanejamentoQualitativo: isQualitativoAtivo,
          exams: Array.isArray(safeParsed?.exams) && safeParsed.exams.length > 0 ? safeParsed.exams : (initialData?.exams || []),
          interactions: Array.isArray(safeParsed?.interactions) && safeParsed.interactions.length > 0 ? safeParsed.interactions : (initialData?.interactions || []),
          recordatorioItems: Array.isArray(safeParsed?.recordatorioItems) && safeParsed.recordatorioItems.length > 0 ? safeParsed.recordatorioItems : (initialData?.recordatorioItems || []),
          cardapioItems: safeCardapio,
          planejamentoQualitativoBlocos: safeQualitativoBlocos,
          planejamentoAlimentar: Array.isArray(safeParsed?.planejamentoAlimentar) && safeParsed.planejamentoAlimentar.length > 0
            ? safeParsed.planejamentoAlimentar
            : (isQualitativoAtivo ? safeQualitativoBlocos : safeCardapio),
          formulasCalculadas: Array.isArray(safeParsed?.formulasCalculadas) ? safeParsed.formulasCalculadas.slice(0, 3) : (initialData?.formulasCalculadas || []),
          respostasQuestoes: safeParsed?.respostasQuestoes || initialData?.respostasQuestoes || {},
          orientacoesNutricionais: typeof safeParsed?.orientacoesNutricionais === 'string'
            ? safeParsed.orientacoesNutricionais
            : (initialData?.orientacoesNutricionais || '')
        };
        setDraftData(merged);
        if (safeParsed?.lastUpdated) {
          setLastSaved(new Date(safeParsed.lastUpdated));
        }
        if (onLoad) onLoad(draftKey, merged);
        console.log(`📥 [Auto-Save] Rascunho recuperado com sucesso para "${draftKey}"`);
      } else {
        setDraftData({
          ...initialData,
          tipoPlanejamentoCardapio: initialData?.tipoPlanejamentoCardapio || (initialData?.habilitarPlanejamentoQualitativo ? 'qualitativo' : 'quantitativo'),
          planejamentoQualitativoBlocos: initialData?.planejamentoQualitativoBlocos || [],
          planejamentoAlimentar: initialData?.planejamentoAlimentar || initialData?.cardapioItems || [],
          caseId: cleanCaseId,
          studentId: cleanStudentId
        });
        setLastSaved(null);
      }
    } catch (e) {
      console.warn(`[Auto-Save] Falha ao carregar rascunho de "${draftKey}":`, e);
      setDraftData(initialData);
    } finally {
      setIsDraftLoaded(true);
      isFirstMountRef.current = false;
    }
  }, [draftKey, cleanCaseId, cleanStudentId]);

  // Salvamento Automático (Save) silencioso e debounced após mudanças
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isFirstMountRef.current) return;
    if (!isDraftLoaded) return;

    setIsSaving(true);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const payloadToSave: CaseDraftData = {
          ...draftData,
          caseId: cleanCaseId,
          studentId: cleanStudentId,
          lastUpdated: new Date().toISOString()
        };
        window.localStorage.setItem(draftKey, JSON.stringify(payloadToSave));
        const now = new Date();
        setLastSaved(now);
        setIsSaving(false);
        if (onAutoSave) onAutoSave(draftKey, payloadToSave);
      } catch (err) {
        console.error(`[Auto-Save] Erro ao persistir rascunho "${draftKey}":`, err);
        setIsSaving(false);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [draftData, draftKey, cleanCaseId, cleanStudentId, debounceMs, isDraftLoaded]);

  // Atualização granular de campos
  const updateField = useCallback(<K extends keyof CaseDraftData>(field: K, value: CaseDraftData[K]) => {
    setDraftData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Força o salvamento imediato sem esperar o debounce
  const forceSave = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const payload: CaseDraftData = {
        ...draftData,
        caseId: cleanCaseId,
        studentId: cleanStudentId,
        lastUpdated: new Date().toISOString()
      };
      window.localStorage.setItem(draftKey, JSON.stringify(payload));
      setLastSaved(new Date());
      setIsSaving(false);
    } catch (e) {
      console.error(`[Auto-Save] Erro no forceSave "${draftKey}":`, e);
    }
  }, [draftData, draftKey, cleanCaseId, cleanStudentId]);

  // Limpeza (Clear): Remove o rascunho do storage exclusivamente na submissão com sucesso
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(draftKey);
      setLastSaved(null);
      console.log(`🧹 [Auto-Save] Rascunho "${draftKey}" removido com sucesso.`);
    } catch (e) {
      console.error(`[Auto-Save] Erro ao limpar rascunho "${draftKey}":`, e);
    }
  }, [draftKey]);

  return {
    draftKey,
    draftData,
    setDraftData,
    updateField,
    isSaving,
    lastSaved,
    isDraftLoaded,
    clearDraft,
    forceSave
  };
}

export default useCaseDraft;
