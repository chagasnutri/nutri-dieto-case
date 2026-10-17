/**
 * Biblioteca de Análise de Adequação de Micronutrientes baseada nas DRIs (Dietary Reference Intakes)
 * Categorizada por Faixa Etária e Sexo com suporte a RDA, EAR, AI e UL.
 */

export interface MicronutrientDriReference {
  nome: string;
  icone: string;
  unidade: string;
  RDA: number | null;
  EAR: number | null;
  AI: number | null;
  UL: number | null;
}

export interface DriProfile {
  id: string;
  faixaEtaria: string;
  idadeMin: number;
  idadeMax: number;
  sexo: 'Masculino' | 'Feminino' | 'Ambos';
  micronutrientes: {
    calcio: MicronutrientDriReference;
    ferro: MicronutrientDriReference;
    sodio: MicronutrientDriReference;
    potassio: MicronutrientDriReference;
    vitA: MicronutrientDriReference;
    vitC: MicronutrientDriReference;
  };
}

export type MicronutrientKey = 'calcio' | 'ferro' | 'sodio' | 'potassio' | 'vitA' | 'vitC';

export interface ResolvedDriTarget {
  targetValue: number;
  targetType: 'RDA' | 'EAR' | 'AI' | 'N/A';
  ulValue: number | null;
  rda: number | null;
  ear: number | null;
  ai: number | null;
}

export interface MicronutrientEvaluationItem {
  key: MicronutrientKey;
  nome: string;
  icone: string;
  unidade: string;
  ingerido: number;
  referencia: number;
  tipoReferencia: 'RDA' | 'EAR' | 'AI' | 'N/A';
  ul: number | null;
  rda: number | null;
  ear: number | null;
  ai: number | null;
  adequacaoPct: number;
  status: 'Inadequado (Abaixo)' | 'Adequado' | 'Inadequado (Acima do Limite / Risco)';
  statusKey: 'abaixo' | 'adequado' | 'acima_ul';
  badgeClass: string;
}

export const DRI_PROFILES: DriProfile[] = [
  {
    id: 'crianca-1-3',
    faixaEtaria: '1 a 3 anos',
    idadeMin: 1,
    idadeMax: 3,
    sexo: 'Ambos',
    micronutrientes: {
      calcio: { nome: 'Cálcio (Ca)', icone: '🥛', unidade: 'mg', RDA: 700, EAR: 500, AI: null, UL: 2500 },
      ferro: { nome: 'Ferro (Fe)', icone: '🥩', unidade: 'mg', RDA: 7, EAR: 3.0, AI: null, UL: 40 },
      sodio: { nome: 'Sódio (Na)', icone: '🧂', unidade: 'mg', RDA: null, EAR: null, AI: 800, UL: 1200 },
      potassio: { nome: 'Potássio (K)', icone: '🍌', unidade: 'mg', RDA: null, EAR: null, AI: 2000, UL: null },
      vitA: { nome: 'Vitamina A', icone: '🥕', unidade: 'mcg', RDA: 300, EAR: 210, AI: null, UL: 600 },
      vitC: { nome: 'Vitamina C', icone: '🍊', unidade: 'mg', RDA: 15, EAR: 13, AI: null, UL: 400 }
    }
  },
  {
    id: 'crianca-4-8',
    faixaEtaria: '4 a 8 anos',
    idadeMin: 4,
    idadeMax: 8,
    sexo: 'Ambos',
    micronutrientes: {
      calcio: { nome: 'Cálcio (Ca)', icone: '🥛', unidade: 'mg', RDA: 1000, EAR: 800, AI: null, UL: 2500 },
      ferro: { nome: 'Ferro (Fe)', icone: '🥩', unidade: 'mg', RDA: 10, EAR: 4.1, AI: null, UL: 40 },
      sodio: { nome: 'Sódio (Na)', icone: '🧂', unidade: 'mg', RDA: null, EAR: null, AI: 1000, UL: 1500 },
      potassio: { nome: 'Potássio (K)', icone: '🍌', unidade: 'mg', RDA: null, EAR: null, AI: 2300, UL: null },
      vitA: { nome: 'Vitamina A', icone: '🥕', unidade: 'mcg', RDA: 400, EAR: 275, AI: null, UL: 900 },
      vitC: { nome: 'Vitamina C', icone: '🍊', unidade: 'mg', RDA: 25, EAR: 22, AI: null, UL: 650 }
    }
  },
  {
    id: 'masc-9-13',
    faixaEtaria: '9 a 13 anos',
    idadeMin: 9,
    idadeMax: 13,
    sexo: 'Masculino',
    micronutrientes: {
      calcio: { nome: 'Cálcio (Ca)', icone: '🥛', unidade: 'mg', RDA: 1300, EAR: 1100, AI: null, UL: 3000 },
      ferro: { nome: 'Ferro (Fe)', icone: '🥩', unidade: 'mg', RDA: 8, EAR: 5.9, AI: null, UL: 40 },
      sodio: { nome: 'Sódio (Na)', icone: '🧂', unidade: 'mg', RDA: null, EAR: null, AI: 1200, UL: 1800 },
      potassio: { nome: 'Potássio (K)', icone: '🍌', unidade: 'mg', RDA: null, EAR: null, AI: 2500, UL: null },
      vitA: { nome: 'Vitamina A', icone: '🥕', unidade: 'mcg', RDA: 600, EAR: 445, AI: null, UL: 1700 },
      vitC: { nome: 'Vitamina C', icone: '🍊', unidade: 'mg', RDA: 45, EAR: 39, AI: null, UL: 1200 }
    }
  },
  {
    id: 'fem-9-13',
    faixaEtaria: '9 a 13 anos',
    idadeMin: 9,
    idadeMax: 13,
    sexo: 'Feminino',
    micronutrientes: {
      calcio: { nome: 'Cálcio (Ca)', icone: '🥛', unidade: 'mg', RDA: 1300, EAR: 1100, AI: null, UL: 3000 },
      ferro: { nome: 'Ferro (Fe)', icone: '🥩', unidade: 'mg', RDA: 8, EAR: 5.7, AI: null, UL: 40 },
      sodio: { nome: 'Sódio (Na)', icone: '🧂', unidade: 'mg', RDA: null, EAR: null, AI: 1200, UL: 1800 },
      potassio: { nome: 'Potássio (K)', icone: '🍌', unidade: 'mg', RDA: null, EAR: null, AI: 2300, UL: null },
      vitA: { nome: 'Vitamina A', icone: '🥕', unidade: 'mcg', RDA: 600, EAR: 420, AI: null, UL: 1700 },
      vitC: { nome: 'Vitamina C', icone: '🍊', unidade: 'mg', RDA: 45, EAR: 39, AI: null, UL: 1200 }
    }
  },
  {
    id: 'masc-14-18',
    faixaEtaria: '14 a 18 anos',
    idadeMin: 14,
    idadeMax: 18,
    sexo: 'Masculino',
    micronutrientes: {
      calcio: { nome: 'Cálcio (Ca)', icone: '🥛', unidade: 'mg', RDA: 1300, EAR: 1100, AI: null, UL: 3000 },
      ferro: { nome: 'Ferro (Fe)', icone: '🥩', unidade: 'mg', RDA: 11, EAR: 7.7, AI: null, UL: 45 },
      sodio: { nome: 'Sódio (Na)', icone: '🧂', unidade: 'mg', RDA: null, EAR: null, AI: 1500, UL: 2300 },
      potassio: { nome: 'Potássio (K)', icone: '🍌', unidade: 'mg', RDA: null, EAR: null, AI: 3000, UL: null },
      vitA: { nome: 'Vitamina A', icone: '🥕', unidade: 'mcg', RDA: 900, EAR: 630, AI: null, UL: 2800 },
      vitC: { nome: 'Vitamina C', icone: '🍊', unidade: 'mg', RDA: 75, EAR: 63, AI: null, UL: 1800 }
    }
  },
  {
    id: 'fem-14-18',
    faixaEtaria: '14 a 18 anos',
    idadeMin: 14,
    idadeMax: 18,
    sexo: 'Feminino',
    micronutrientes: {
      calcio: { nome: 'Cálcio (Ca)', icone: '🥛', unidade: 'mg', RDA: 1300, EAR: 1100, AI: null, UL: 3000 },
      ferro: { nome: 'Ferro (Fe)', icone: '🥩', unidade: 'mg', RDA: 15, EAR: 7.9, AI: null, UL: 45 },
      sodio: { nome: 'Sódio (Na)', icone: '🧂', unidade: 'mg', RDA: null, EAR: null, AI: 1500, UL: 2300 },
      potassio: { nome: 'Potássio (K)', icone: '🍌', unidade: 'mg', RDA: null, EAR: null, AI: 2300, UL: null },
      vitA: { nome: 'Vitamina A', icone: '🥕', unidade: 'mcg', RDA: 700, EAR: 485, AI: null, UL: 2800 },
      vitC: { nome: 'Vitamina C', icone: '🍊', unidade: 'mg', RDA: 65, EAR: 56, AI: null, UL: 1800 }
    }
  },
  {
    id: 'masc-19-30',
    faixaEtaria: '19 a 30 anos',
    idadeMin: 19,
    idadeMax: 30,
    sexo: 'Masculino',
    micronutrientes: {
      calcio: { nome: 'Cálcio (Ca)', icone: '🥛', unidade: 'mg', RDA: 1000, EAR: 800, AI: null, UL: 2500 },
      ferro: { nome: 'Ferro (Fe)', icone: '🥩', unidade: 'mg', RDA: 8, EAR: 6.0, AI: null, UL: 45 },
      sodio: { nome: 'Sódio (Na)', icone: '🧂', unidade: 'mg', RDA: null, EAR: null, AI: 1500, UL: 2300 },
      potassio: { nome: 'Potássio (K)', icone: '🍌', unidade: 'mg', RDA: null, EAR: null, AI: 3400, UL: null },
      vitA: { nome: 'Vitamina A', icone: '🥕', unidade: 'mcg', RDA: 900, EAR: 625, AI: null, UL: 3000 },
      vitC: { nome: 'Vitamina C', icone: '🍊', unidade: 'mg', RDA: 90, EAR: 75, AI: null, UL: 2000 }
    }
  },
  {
    id: 'fem-19-30',
    faixaEtaria: '19 a 30 anos',
    idadeMin: 19,
    idadeMax: 30,
    sexo: 'Feminino',
    micronutrientes: {
      calcio: { nome: 'Cálcio (Ca)', icone: '🥛', unidade: 'mg', RDA: 1000, EAR: 800, AI: null, UL: 2500 },
      ferro: { nome: 'Ferro (Fe)', icone: '🥩', unidade: 'mg', RDA: 18, EAR: 8.1, AI: null, UL: 45 },
      sodio: { nome: 'Sódio (Na)', icone: '🧂', unidade: 'mg', RDA: null, EAR: null, AI: 1500, UL: 2300 },
      potassio: { nome: 'Potássio (K)', icone: '🍌', unidade: 'mg', RDA: null, EAR: null, AI: 2600, UL: null },
      vitA: { nome: 'Vitamina A', icone: '🥕', unidade: 'mcg', RDA: 700, EAR: 500, AI: null, UL: 3000 },
      vitC: { nome: 'Vitamina C', icone: '🍊', unidade: 'mg', RDA: 75, EAR: 60, AI: null, UL: 2000 }
    }
  },
  {
    id: 'masc-31-50',
    faixaEtaria: '31 a 50 anos',
    idadeMin: 31,
    idadeMax: 50,
    sexo: 'Masculino',
    micronutrientes: {
      calcio: { nome: 'Cálcio (Ca)', icone: '🥛', unidade: 'mg', RDA: 1000, EAR: 800, AI: null, UL: 2500 },
      ferro: { nome: 'Ferro (Fe)', icone: '🥩', unidade: 'mg', RDA: 8, EAR: 6.0, AI: null, UL: 45 },
      sodio: { nome: 'Sódio (Na)', icone: '🧂', unidade: 'mg', RDA: null, EAR: null, AI: 1500, UL: 2300 },
      potassio: { nome: 'Potássio (K)', icone: '🍌', unidade: 'mg', RDA: null, EAR: null, AI: 3400, UL: null },
      vitA: { nome: 'Vitamina A', icone: '🥕', unidade: 'mcg', RDA: 900, EAR: 625, AI: null, UL: 3000 },
      vitC: { nome: 'Vitamina C', icone: '🍊', unidade: 'mg', RDA: 90, EAR: 75, AI: null, UL: 2000 }
    }
  },
  {
    id: 'fem-31-50',
    faixaEtaria: '31 a 50 anos',
    idadeMin: 31,
    idadeMax: 50,
    sexo: 'Feminino',
    micronutrientes: {
      calcio: { nome: 'Cálcio (Ca)', icone: '🥛', unidade: 'mg', RDA: 1000, EAR: 800, AI: null, UL: 2500 },
      ferro: { nome: 'Ferro (Fe)', icone: '🥩', unidade: 'mg', RDA: 18, EAR: 8.1, AI: null, UL: 45 },
      sodio: { nome: 'Sódio (Na)', icone: '🧂', unidade: 'mg', RDA: null, EAR: null, AI: 1500, UL: 2300 },
      potassio: { nome: 'Potássio (K)', icone: '🍌', unidade: 'mg', RDA: null, EAR: null, AI: 2600, UL: null },
      vitA: { nome: 'Vitamina A', icone: '🥕', unidade: 'mcg', RDA: 700, EAR: 500, AI: null, UL: 3000 },
      vitC: { nome: 'Vitamina C', icone: '🍊', unidade: 'mg', RDA: 75, EAR: 60, AI: null, UL: 2000 }
    }
  },
  {
    id: 'masc-51-70',
    faixaEtaria: '51 a 70 anos',
    idadeMin: 51,
    idadeMax: 70,
    sexo: 'Masculino',
    micronutrientes: {
      calcio: { nome: 'Cálcio (Ca)', icone: '🥛', unidade: 'mg', RDA: 1000, EAR: 800, AI: null, UL: 2000 },
      ferro: { nome: 'Ferro (Fe)', icone: '🥩', unidade: 'mg', RDA: 8, EAR: 6.0, AI: null, UL: 45 },
      sodio: { nome: 'Sódio (Na)', icone: '🧂', unidade: 'mg', RDA: null, EAR: null, AI: 1500, UL: 2300 },
      potassio: { nome: 'Potássio (K)', icone: '🍌', unidade: 'mg', RDA: null, EAR: null, AI: 3400, UL: null },
      vitA: { nome: 'Vitamina A', icone: '🥕', unidade: 'mcg', RDA: 900, EAR: 625, AI: null, UL: 3000 },
      vitC: { nome: 'Vitamina C', icone: '🍊', unidade: 'mg', RDA: 90, EAR: 75, AI: null, UL: 2000 }
    }
  },
  {
    id: 'fem-51-70',
    faixaEtaria: '51 a 70 anos',
    idadeMin: 51,
    idadeMax: 70,
    sexo: 'Feminino',
    micronutrientes: {
      calcio: { nome: 'Cálcio (Ca)', icone: '🥛', unidade: 'mg', RDA: 1200, EAR: 1000, AI: null, UL: 2000 },
      ferro: { nome: 'Ferro (Fe)', icone: '🥩', unidade: 'mg', RDA: 8, EAR: 5.0, AI: null, UL: 45 },
      sodio: { nome: 'Sódio (Na)', icone: '🧂', unidade: 'mg', RDA: null, EAR: null, AI: 1500, UL: 2300 },
      potassio: { nome: 'Potássio (K)', icone: '🍌', unidade: 'mg', RDA: null, EAR: null, AI: 2600, UL: null },
      vitA: { nome: 'Vitamina A', icone: '🥕', unidade: 'mcg', RDA: 700, EAR: 500, AI: null, UL: 3000 },
      vitC: { nome: 'Vitamina C', icone: '🍊', unidade: 'mg', RDA: 75, EAR: 60, AI: null, UL: 2000 }
    }
  },
  {
    id: 'masc-71-mais',
    faixaEtaria: 'Acima de 70 anos',
    idadeMin: 71,
    idadeMax: 130,
    sexo: 'Masculino',
    micronutrientes: {
      calcio: { nome: 'Cálcio (Ca)', icone: '🥛', unidade: 'mg', RDA: 1200, EAR: 1000, AI: null, UL: 2000 },
      ferro: { nome: 'Ferro (Fe)', icone: '🥩', unidade: 'mg', RDA: 8, EAR: 6.0, AI: null, UL: 45 },
      sodio: { nome: 'Sódio (Na)', icone: '🧂', unidade: 'mg', RDA: null, EAR: null, AI: 1500, UL: 2300 },
      potassio: { nome: 'Potássio (K)', icone: '🍌', unidade: 'mg', RDA: null, EAR: null, AI: 3400, UL: null },
      vitA: { nome: 'Vitamina A', icone: '🥕', unidade: 'mcg', RDA: 900, EAR: 625, AI: null, UL: 3000 },
      vitC: { nome: 'Vitamina C', icone: '🍊', unidade: 'mg', RDA: 90, EAR: 75, AI: null, UL: 2000 }
    }
  },
  {
    id: 'fem-71-mais',
    faixaEtaria: 'Acima de 70 anos',
    idadeMin: 71,
    idadeMax: 130,
    sexo: 'Feminino',
    micronutrientes: {
      calcio: { nome: 'Cálcio (Ca)', icone: '🥛', unidade: 'mg', RDA: 1200, EAR: 1000, AI: null, UL: 2000 },
      ferro: { nome: 'Ferro (Fe)', icone: '🥩', unidade: 'mg', RDA: 8, EAR: 5.0, AI: null, UL: 45 },
      sodio: { nome: 'Sódio (Na)', icone: '🧂', unidade: 'mg', RDA: null, EAR: null, AI: 1500, UL: 2300 },
      potassio: { nome: 'Potássio (K)', icone: '🍌', unidade: 'mg', RDA: null, EAR: null, AI: 2600, UL: null },
      vitA: { nome: 'Vitamina A', icone: '🥕', unidade: 'mcg', RDA: 700, EAR: 500, AI: null, UL: 3000 },
      vitC: { nome: 'Vitamina C', icone: '🍊', unidade: 'mg', RDA: 75, EAR: 60, AI: null, UL: 2000 }
    }
  }
];

export function normalizeSex(sexo?: string): 'Masculino' | 'Feminino' {
  if (!sexo) return 'Masculino';
  const s = sexo.trim().toLowerCase();
  if (s.startsWith('f') || s === 'mulher' || s === 'feminino') return 'Feminino';
  return 'Masculino';
}

/**
 * 2. Lógica de Seleção Automática (Vínculo com o Paciente):
 * Resgata automaticamente a idade e o sexo do paciente e seleciona o perfil DRI.
 */
export function selectDriProfileForPatient(age?: number | string, gender?: string): DriProfile {
  const parsedAge = parseInt(String(age || 35), 10);
  const cleanAge = isNaN(parsedAge) || parsedAge <= 0 ? 35 : parsedAge;
  const cleanSex = normalizeSex(gender);

  const matched = DRI_PROFILES.find(p => {
    const ageOk = cleanAge >= p.idadeMin && cleanAge <= p.idadeMax;
    const sexOk = p.sexo === 'Ambos' || p.sexo === cleanSex;
    return ageOk && sexOk;
  });

  if (matched) return matched;
  return DRI_PROFILES.find(p => p.idadeMin === 31 && p.sexo === cleanSex) || DRI_PROFILES[8];
}

/**
 * 3. Regras de Negócio para o Parâmetro de Referência (Fallback):
 * - Prioridade 1: Utilizar a RDA
 * - Prioridade 2: Se a RDA não existir (for null ou 0), utilizar a EAR
 * - Prioridade 3: Se a EAR também não existir, utilizar a AI
 * - Sempre carregar a UL como limite máximo de segurança
 */
export function resolveMicronutrientReference(micro: MicronutrientDriReference): ResolvedDriTarget {
  const rda = micro.RDA !== null && micro.RDA !== undefined && micro.RDA > 0 ? micro.RDA : null;
  const ear = micro.EAR !== null && micro.EAR !== undefined && micro.EAR > 0 ? micro.EAR : null;
  const ai = micro.AI !== null && micro.AI !== undefined && micro.AI > 0 ? micro.AI : null;
  const ul = micro.UL !== null && micro.UL !== undefined && micro.UL > 0 ? micro.UL : null;

  let targetValue = 0;
  let targetType: 'RDA' | 'EAR' | 'AI' | 'N/A' = 'N/A';

  if (rda !== null) {
    targetValue = rda;
    targetType = 'RDA';
  } else if (ear !== null) {
    targetValue = ear;
    targetType = 'EAR';
  } else if (ai !== null) {
    targetValue = ai;
    targetType = 'AI';
  }

  return {
    targetValue,
    targetType,
    ulValue: ul,
    rda,
    ear,
    ai
  };
}

/**
 * 4. Análise de Adequação e Classificação Visual:
 * - 'Inadequado (Abaixo)': Se o valor ingerido for menor que a referência (RDA/EAR/AI).
 * - 'Adequado': Se o valor ingerido atingir a referência, mas for menor ou igual à UL.
 * - 'Inadequado (Acima do Limite / Risco)': Se o valor ingerido ultrapassar a UL.
 */
export function evaluateMicronutrientAdequacy(
  key: MicronutrientKey,
  intakeValue: number,
  micro: MicronutrientDriReference
): MicronutrientEvaluationItem {
  const intake = Math.round((Number(intakeValue) || 0) * 10) / 10;
  const ref = resolveMicronutrientReference(micro);
  const target = ref.targetValue;
  const ul = ref.ulValue;

  const adequacaoPct = target > 0 ? Math.round(((intake / target) * 100) * 10) / 10 : 0;

  let status: 'Inadequado (Abaixo)' | 'Adequado' | 'Inadequado (Acima do Limite / Risco)' = 'Adequado';
  let statusKey: 'abaixo' | 'adequado' | 'acima_ul' = 'adequado';
  let badgeClass = 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50';

  if (ul !== null && intake > ul) {
    status = 'Inadequado (Acima do Limite / Risco)';
    statusKey = 'acima_ul';
    badgeClass = 'bg-rose-950/90 text-rose-300 border-rose-500/50';
  } else if (intake < target) {
    status = 'Inadequado (Abaixo)';
    statusKey = 'abaixo';
    badgeClass = 'bg-amber-950/90 text-amber-300 border-amber-500/50';
  } else {
    status = 'Adequado';
    statusKey = 'adequado';
    badgeClass = 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50';
  }

  return {
    key,
    nome: micro.nome,
    icone: micro.icone,
    unidade: micro.unidade,
    ingerido: intake,
    referencia: target,
    tipoReferencia: ref.targetType,
    ul,
    rda: ref.rda,
    ear: ref.ear,
    ai: ref.ai,
    adequacaoPct,
    status,
    statusKey,
    badgeClass
  };
}

export function analyzePatientMicronutrients(
  intakes: Partial<Record<MicronutrientKey, number>>,
  age?: number | string,
  gender?: string
) {
  const profile = selectDriProfileForPatient(age, gender);
  const keys: MicronutrientKey[] = ['calcio', 'ferro', 'sodio', 'potassio', 'vitA', 'vitC'];

  const items = keys.map(key =>
    evaluateMicronutrientAdequacy(key, intakes[key] || 0, profile.micronutrientes[key])
  );

  return {
    profile,
    items
  };
}
