/**
 * BASE DE DADOS OFICIAL DRIs (Dietary Reference Intakes - IOM / NASEM)
 * Análise de Adequação de Micronutrientes para Recordatório 24h e Planejamento Dietético
 *
 * REGRAS DE NEGÓCIO IMPLEMENTADAS:
 * 1. Categorização por Faixa Etária e Sexo com chaves RDA, EAR, AI e UL.
 * 2. Seleção automática vinculada à idade e ao sexo do paciente cadastrado no caso clínico.
 * 3. Hierarquia de validação por micronutriente (Fallback):
 *    - Prioridade 1: RDA (Recommended Dietary Allowance)
 *    - Prioridade 2: EAR (Estimated Average Requirement) - se RDA for null ou 0
 *    - Prioridade 3: AI (Adequate Intake) - se EAR também não existir
 *    - Sempre carregar UL (Tolerable Upper Intake Level) como limite máximo de segurança.
 * 4. Classificação de Status em Tempo Real:
 *    - 'Inadequado (Abaixo)': Valor ingerido < Referência (RDA/EAR/AI)
 *    - 'Adequado': Valor ingerido >= Referência e (UL ausente ou Valor <= UL)
 *    - 'Inadequado (Acima do Limite / Risco)': Valor ingerido > UL
 */

const DRI_REFERENCE_DATABASE = {
  meta: {
    titulo: "Dietary Reference Intakes (DRIs) - Vitaminas e Minerais",
    fonte: "Institute of Medicine (IOM) / National Academies of Sciences, Engineering, and Medicine (NASEM)",
    descricao: "Tabela de referência de micronutrientes categorizada por Faixa Etária e Sexo com valores de RDA, EAR, AI e UL."
  },
  perfis: [
    {
      id: "crianca-1-3",
      faixaEtaria: "1 a 3 anos",
      idadeMin: 1,
      idadeMax: 3,
      sexo: "Ambos",
      micronutrientes: {
        calcio: { nome: "Cálcio (Ca)", icone: "🥛", unidade: "mg", RDA: 700, EAR: 500, AI: null, UL: 2500 },
        ferro: { nome: "Ferro (Fe)", icone: "🥩", unidade: "mg", RDA: 7, EAR: 3.0, AI: null, UL: 40 },
        sodio: { nome: "Sódio (Na)", icone: "🧂", unidade: "mg", RDA: null, EAR: null, AI: 800, UL: 1200 },
        potassio: { nome: "Potássio (K)", icone: "🍌", unidade: "mg", RDA: null, EAR: null, AI: 2000, UL: null },
        vitA: { nome: "Vitamina A", icone: "🥕", unidade: "mcg", RDA: 300, EAR: 210, AI: null, UL: 600 },
        vitC: { nome: "Vitamina C", icone: "🍊", unidade: "mg", RDA: 15, EAR: 13, AI: null, UL: 400 }
      }
    },
    {
      id: "crianca-4-8",
      faixaEtaria: "4 a 8 anos",
      idadeMin: 4,
      idadeMax: 8,
      sexo: "Ambos",
      micronutrientes: {
        calcio: { nome: "Cálcio (Ca)", icone: "🥛", unidade: "mg", RDA: 1000, EAR: 800, AI: null, UL: 2500 },
        ferro: { nome: "Ferro (Fe)", icone: "🥩", unidade: "mg", RDA: 10, EAR: 4.1, AI: null, UL: 40 },
        sodio: { nome: "Sódio (Na)", icone: "🧂", unidade: "mg", RDA: null, EAR: null, AI: 1000, UL: 1500 },
        potassio: { nome: "Potássio (K)", icone: "🍌", unidade: "mg", RDA: null, EAR: null, AI: 2300, UL: null },
        vitA: { nome: "Vitamina A", icone: "🥕", unidade: "mcg", RDA: 400, EAR: 275, AI: null, UL: 900 },
        vitC: { nome: "Vitamina C", icone: "🍊", unidade: "mg", RDA: 25, EAR: 22, AI: null, UL: 650 }
      }
    },
    {
      id: "masc-9-13",
      faixaEtaria: "9 a 13 anos",
      idadeMin: 9,
      idadeMax: 13,
      sexo: "Masculino",
      micronutrientes: {
        calcio: { nome: "Cálcio (Ca)", icone: "🥛", unidade: "mg", RDA: 1300, EAR: 1100, AI: null, UL: 3000 },
        ferro: { nome: "Ferro (Fe)", icone: "🥩", unidade: "mg", RDA: 8, EAR: 5.9, AI: null, UL: 40 },
        sodio: { nome: "Sódio (Na)", icone: "🧂", unidade: "mg", RDA: null, EAR: null, AI: 1200, UL: 1800 },
        potassio: { nome: "Potássio (K)", icone: "🍌", unidade: "mg", RDA: null, EAR: null, AI: 2500, UL: null },
        vitA: { nome: "Vitamina A", icone: "🥕", unidade: "mcg", RDA: 600, EAR: 445, AI: null, UL: 1700 },
        vitC: { nome: "Vitamina C", icone: "🍊", unidade: "mg", RDA: 45, EAR: 39, AI: null, UL: 1200 }
      }
    },
    {
      id: "fem-9-13",
      faixaEtaria: "9 a 13 anos",
      idadeMin: 9,
      idadeMax: 13,
      sexo: "Feminino",
      micronutrientes: {
        calcio: { nome: "Cálcio (Ca)", icone: "🥛", unidade: "mg", RDA: 1300, EAR: 1100, AI: null, UL: 3000 },
        ferro: { nome: "Ferro (Fe)", icone: "🥩", unidade: "mg", RDA: 8, EAR: 5.7, AI: null, UL: 40 },
        sodio: { nome: "Sódio (Na)", icone: "🧂", unidade: "mg", RDA: null, EAR: null, AI: 1200, UL: 1800 },
        potassio: { nome: "Potássio (K)", icone: "🍌", unidade: "mg", RDA: null, EAR: null, AI: 2300, UL: null },
        vitA: { nome: "Vitamina A", icone: "🥕", unidade: "mcg", RDA: 600, EAR: 420, AI: null, UL: 1700 },
        vitC: { nome: "Vitamina C", icone: "🍊", unidade: "mg", RDA: 45, EAR: 39, AI: null, UL: 1200 }
      }
    },
    {
      id: "masc-14-18",
      faixaEtaria: "14 a 18 anos",
      idadeMin: 14,
      idadeMax: 18,
      sexo: "Masculino",
      micronutrientes: {
        calcio: { nome: "Cálcio (Ca)", icone: "🥛", unidade: "mg", RDA: 1300, EAR: 1100, AI: null, UL: 3000 },
        ferro: { nome: "Ferro (Fe)", icone: "🥩", unidade: "mg", RDA: 11, EAR: 7.7, AI: null, UL: 45 },
        sodio: { nome: "Sódio (Na)", icone: "🧂", unidade: "mg", RDA: null, EAR: null, AI: 1500, UL: 2300 },
        potassio: { nome: "Potássio (K)", icone: "🍌", unidade: "mg", RDA: null, EAR: null, AI: 3000, UL: null },
        vitA: { nome: "Vitamina A", icone: "🥕", unidade: "mcg", RDA: 900, EAR: 630, AI: null, UL: 2800 },
        vitC: { nome: "Vitamina C", icone: "🍊", unidade: "mg", RDA: 75, EAR: 63, AI: null, UL: 1800 }
      }
    },
    {
      id: "fem-14-18",
      faixaEtaria: "14 a 18 anos",
      idadeMin: 14,
      idadeMax: 18,
      sexo: "Feminino",
      micronutrientes: {
        calcio: { nome: "Cálcio (Ca)", icone: "🥛", unidade: "mg", RDA: 1300, EAR: 1100, AI: null, UL: 3000 },
        ferro: { nome: "Ferro (Fe)", icone: "🥩", unidade: "mg", RDA: 15, EAR: 7.9, AI: null, UL: 45 },
        sodio: { nome: "Sódio (Na)", icone: "🧂", unidade: "mg", RDA: null, EAR: null, AI: 1500, UL: 2300 },
        potassio: { nome: "Potássio (K)", icone: "🍌", unidade: "mg", RDA: null, EAR: null, AI: 2300, UL: null },
        vitA: { nome: "Vitamina A", icone: "🥕", unidade: "mcg", RDA: 700, EAR: 485, AI: null, UL: 2800 },
        vitC: { nome: "Vitamina C", icone: "🍊", unidade: "mg", RDA: 65, EAR: 56, AI: null, UL: 1800 }
      }
    },
    {
      id: "masc-19-30",
      faixaEtaria: "19 a 30 anos",
      idadeMin: 19,
      idadeMax: 30,
      sexo: "Masculino",
      micronutrientes: {
        calcio: { nome: "Cálcio (Ca)", icone: "🥛", unidade: "mg", RDA: 1000, EAR: 800, AI: null, UL: 2500 },
        ferro: { nome: "Ferro (Fe)", icone: "🥩", unidade: "mg", RDA: 8, EAR: 6.0, AI: null, UL: 45 },
        sodio: { nome: "Sódio (Na)", icone: "🧂", unidade: "mg", RDA: null, EAR: null, AI: 1500, UL: 2300 },
        potassio: { nome: "Potássio (K)", icone: "🍌", unidade: "mg", RDA: null, EAR: null, AI: 3400, UL: null },
        vitA: { nome: "Vitamina A", icone: "🥕", unidade: "mcg", RDA: 900, EAR: 625, AI: null, UL: 3000 },
        vitC: { nome: "Vitamina C", icone: "🍊", unidade: "mg", RDA: 90, EAR: 75, AI: null, UL: 2000 }
      }
    },
    {
      id: "fem-19-30",
      faixaEtaria: "19 a 30 anos",
      idadeMin: 19,
      idadeMax: 30,
      sexo: "Feminino",
      micronutrientes: {
        calcio: { nome: "Cálcio (Ca)", icone: "🥛", unidade: "mg", RDA: 1000, EAR: 800, AI: null, UL: 2500 },
        ferro: { nome: "Ferro (Fe)", icone: "🥩", unidade: "mg", RDA: 18, EAR: 8.1, AI: null, UL: 45 },
        sodio: { nome: "Sódio (Na)", icone: "🧂", unidade: "mg", RDA: null, EAR: null, AI: 1500, UL: 2300 },
        potassio: { nome: "Potássio (K)", icone: "🍌", unidade: "mg", RDA: null, EAR: null, AI: 2600, UL: null },
        vitA: { nome: "Vitamina A", icone: "🥕", unidade: "mcg", RDA: 700, EAR: 500, AI: null, UL: 3000 },
        vitC: { nome: "Vitamina C", icone: "🍊", unidade: "mg", RDA: 75, EAR: 60, AI: null, UL: 2000 }
      }
    },
    {
      id: "masc-31-50",
      faixaEtaria: "31 a 50 anos",
      idadeMin: 31,
      idadeMax: 50,
      sexo: "Masculino",
      micronutrientes: {
        calcio: { nome: "Cálcio (Ca)", icone: "🥛", unidade: "mg", RDA: 1000, EAR: 800, AI: null, UL: 2500 },
        ferro: { nome: "Ferro (Fe)", icone: "🥩", unidade: "mg", RDA: 8, EAR: 6.0, AI: null, UL: 45 },
        sodio: { nome: "Sódio (Na)", icone: "🧂", unidade: "mg", RDA: null, EAR: null, AI: 1500, UL: 2300 },
        potassio: { nome: "Potássio (K)", icone: "🍌", unidade: "mg", RDA: null, EAR: null, AI: 3400, UL: null },
        vitA: { nome: "Vitamina A", icone: "🥕", unidade: "mcg", RDA: 900, EAR: 625, AI: null, UL: 3000 },
        vitC: { nome: "Vitamina C", icone: "🍊", unidade: "mg", RDA: 90, EAR: 75, AI: null, UL: 2000 }
      }
    },
    {
      id: "fem-31-50",
      faixaEtaria: "31 a 50 anos",
      idadeMin: 31,
      idadeMax: 50,
      sexo: "Feminino",
      micronutrientes: {
        calcio: { nome: "Cálcio (Ca)", icone: "🥛", unidade: "mg", RDA: 1000, EAR: 800, AI: null, UL: 2500 },
        ferro: { nome: "Ferro (Fe)", icone: "🥩", unidade: "mg", RDA: 18, EAR: 8.1, AI: null, UL: 45 },
        sodio: { nome: "Sódio (Na)", icone: "🧂", unidade: "mg", RDA: null, EAR: null, AI: 1500, UL: 2300 },
        potassio: { nome: "Potássio (K)", icone: "🍌", unidade: "mg", RDA: null, EAR: null, AI: 2600, UL: null },
        vitA: { nome: "Vitamina A", icone: "🥕", unidade: "mcg", RDA: 700, EAR: 500, AI: null, UL: 3000 },
        vitC: { nome: "Vitamina C", icone: "🍊", unidade: "mg", RDA: 75, EAR: 60, AI: null, UL: 2000 }
      }
    },
    {
      id: "masc-51-70",
      faixaEtaria: "51 a 70 anos",
      idadeMin: 51,
      idadeMax: 70,
      sexo: "Masculino",
      micronutrientes: {
        calcio: { nome: "Cálcio (Ca)", icone: "🥛", unidade: "mg", RDA: 1000, EAR: 800, AI: null, UL: 2000 },
        ferro: { nome: "Ferro (Fe)", icone: "🥩", unidade: "mg", RDA: 8, EAR: 6.0, AI: null, UL: 45 },
        sodio: { nome: "Sódio (Na)", icone: "🧂", unidade: "mg", RDA: null, EAR: null, AI: 1500, UL: 2300 },
        potassio: { nome: "Potássio (K)", icone: "🍌", unidade: "mg", RDA: null, EAR: null, AI: 3400, UL: null },
        vitA: { nome: "Vitamina A", icone: "🥕", unidade: "mcg", RDA: 900, EAR: 625, AI: null, UL: 3000 },
        vitC: { nome: "Vitamina C", icone: "🍊", unidade: "mg", RDA: 90, EAR: 75, AI: null, UL: 2000 }
      }
    },
    {
      id: "fem-51-70",
      faixaEtaria: "51 a 70 anos",
      idadeMin: 51,
      idadeMax: 70,
      sexo: "Feminino",
      micronutrientes: {
        calcio: { nome: "Cálcio (Ca)", icone: "🥛", unidade: "mg", RDA: 1200, EAR: 1000, AI: null, UL: 2000 },
        ferro: { nome: "Ferro (Fe)", icone: "🥩", unidade: "mg", RDA: 8, EAR: 5.0, AI: null, UL: 45 },
        sodio: { nome: "Sódio (Na)", icone: "🧂", unidade: "mg", RDA: null, EAR: null, AI: 1500, UL: 2300 },
        potassio: { nome: "Potássio (K)", icone: "🍌", unidade: "mg", RDA: null, EAR: null, AI: 2600, UL: null },
        vitA: { nome: "Vitamina A", icone: "🥕", unidade: "mcg", RDA: 700, EAR: 500, AI: null, UL: 3000 },
        vitC: { nome: "Vitamina C", icone: "🍊", unidade: "mg", RDA: 75, EAR: 60, AI: null, UL: 2000 }
      }
    },
    {
      id: "masc-71-mais",
      faixaEtaria: "Acima de 70 anos",
      idadeMin: 71,
      idadeMax: 130,
      sexo: "Masculino",
      micronutrientes: {
        calcio: { nome: "Cálcio (Ca)", icone: "🥛", unidade: "mg", RDA: 1200, EAR: 1000, AI: null, UL: 2000 },
        ferro: { nome: "Ferro (Fe)", icone: "🥩", unidade: "mg", RDA: 8, EAR: 6.0, AI: null, UL: 45 },
        sodio: { nome: "Sódio (Na)", icone: "🧂", unidade: "mg", RDA: null, EAR: null, AI: 1500, UL: 2300 },
        potassio: { nome: "Potássio (K)", icone: "🍌", unidade: "mg", RDA: null, EAR: null, AI: 3400, UL: null },
        vitA: { nome: "Vitamina A", icone: "🥕", unidade: "mcg", RDA: 900, EAR: 625, AI: null, UL: 3000 },
        vitC: { nome: "Vitamina C", icone: "🍊", unidade: "mg", RDA: 90, EAR: 75, AI: null, UL: 2000 }
      }
    },
    {
      id: "fem-71-mais",
      faixaEtaria: "Acima de 70 anos",
      idadeMin: 71,
      idadeMax: 130,
      sexo: "Feminino",
      micronutrientes: {
        calcio: { nome: "Cálcio (Ca)", icone: "🥛", unidade: "mg", RDA: 1200, EAR: 1000, AI: null, UL: 2000 },
        ferro: { nome: "Ferro (Fe)", icone: "🥩", unidade: "mg", RDA: 8, EAR: 5.0, AI: null, UL: 45 },
        sodio: { nome: "Sódio (Na)", icone: "🧂", unidade: "mg", RDA: null, EAR: null, AI: 1500, UL: 2300 },
        potassio: { nome: "Potássio (K)", icone: "🍌", unidade: "mg", RDA: null, EAR: null, AI: 2600, UL: null },
        vitA: { nome: "Vitamina A", icone: "🥕", unidade: "mcg", RDA: 700, EAR: 500, AI: null, UL: 3000 },
        vitC: { nome: "Vitamina C", icone: "🍊", unidade: "mg", RDA: 75, EAR: 60, AI: null, UL: 2000 }
      }
    }
  ]
};

/**
 * Normaliza o sexo do paciente para 'Masculino' ou 'Feminino'
 */
function normalizeDriSex(sexoRaw) {
  if (!sexoRaw) return "Masculino";
  const s = String(sexoRaw).trim().toLowerCase();
  if (s.startsWith("f") || s === "mulher" || s === "feminino") return "Feminino";
  return "Masculino";
}

/**
 * 2. Lógica de Seleção Automática (Vínculo com o Paciente):
 * Resgata automaticamente a idade e o sexo do paciente e seleciona o perfil exato das DRIs.
 */
function selectDriProfileForPatient(age, gender) {
  const parsedAge = parseInt(String(age || 35), 10);
  const cleanAge = isNaN(parsedAge) || parsedAge <= 0 ? 35 : parsedAge;
  const cleanSex = normalizeDriSex(gender);

  const matched = DRI_REFERENCE_DATABASE.perfis.find(p => {
    const ageOk = cleanAge >= p.idadeMin && cleanAge <= p.idadeMax;
    const sexOk = p.sexo === "Ambos" || p.sexo.toLowerCase() === cleanSex.toLowerCase();
    return ageOk && sexOk;
  });

  if (matched) return matched;

  // Fallback seguro para adulto 31-50 anos caso idade esteja fora do intervalo
  return DRI_REFERENCE_DATABASE.perfis.find(
    p => p.idadeMin === 31 && p.sexo.toLowerCase() === cleanSex.toLowerCase()
  ) || DRI_REFERENCE_DATABASE.perfis[8];
}

/**
 * 3. Regras de Negócio para o Parâmetro de Referência (Fallback):
 * - Prioridade 1: Utilizar a RDA (DRI principal)
 * - Prioridade 2: Se RDA não existir (for null ou 0), utilizar a EAR
 * - Prioridade 3: Se EAR também não existir, utilizar a AI
 * - Sempre carregar a UL como limite máximo de segurança
 */
function resolveMicronutrientReference(microObj) {
  if (!microObj) {
    return { targetValue: 0, targetType: "N/A", ulValue: null, rda: null, ear: null, ai: null };
  }

  const rda = microObj.RDA !== undefined && microObj.RDA !== null && Number(microObj.RDA) > 0 ? Number(microObj.RDA) : null;
  const ear = microObj.EAR !== undefined && microObj.EAR !== null && Number(microObj.EAR) > 0 ? Number(microObj.EAR) : null;
  const ai = microObj.AI !== undefined && microObj.AI !== null && Number(microObj.AI) > 0 ? Number(microObj.AI) : null;
  const ul = microObj.UL !== undefined && microObj.UL !== null && Number(microObj.UL) > 0 ? Number(microObj.UL) : null;

  let targetValue = 0;
  let targetType = "N/A";

  if (rda !== null) {
    targetValue = rda;
    targetType = "RDA";
  } else if (ear !== null) {
    targetValue = ear;
    targetType = "EAR";
  } else if (ai !== null) {
    targetValue = ai;
    targetType = "AI";
  }

  return {
    targetValue,
    targetType,
    refValue: targetValue,
    refType: targetType,
    ulValue: ul,
    rda,
    ear,
    ai
  };
}

/**
 * 4. Análise de Adequação e Classificação de Status:
 * - 'Inadequado (Abaixo)': Se o valor ingerido for menor que a referência (RDA/EAR/AI).
 * - 'Adequado': Se o valor ingerido atingir a referência, mas for menor ou igual à UL.
 * - 'Inadequado (Acima do Limite / Risco)': Se o valor ingerido ultrapassar a UL.
 */
function evaluateMicronutrientAdequacy(intakeValue, microObj) {
  const intake = Math.round((Number(intakeValue) || 0) * 10) / 10;
  const ref = resolveMicronutrientReference(microObj);
  const target = ref.targetValue;
  const ul = ref.ulValue;

  const percentage = target > 0 ? Math.round(((intake / target) * 100) * 10) / 10 : 0;

  let status = "Adequado";
  let badgeClass = "bg-emerald-950/90 text-emerald-300 border-emerald-500/50";
  let lightBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300";
  let statusKey = "adequado";

  if (ul !== null && intake > ul) {
    status = "Inadequado (Acima do Limite / Risco)";
    badgeClass = "bg-rose-950/90 text-rose-300 border-rose-500/50";
    lightBadgeClass = "bg-rose-100 text-rose-800 border-rose-300";
    statusKey = "acima_ul";
  } else if (intake < target) {
    status = "Inadequado (Abaixo)";
    badgeClass = "bg-amber-950/90 text-amber-300 border-amber-500/50";
    lightBadgeClass = "bg-amber-100 text-amber-800 border-amber-300";
    statusKey = "abaixo";
  } else {
    status = "Adequado";
    badgeClass = "bg-emerald-950/90 text-emerald-300 border-emerald-500/50";
    lightBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300";
    statusKey = "adequado";
  }

  return {
    nome: microObj?.nome || "Micronutriente",
    icone: microObj?.icone || "🧪",
    unidade: microObj?.unidade || "mg",
    ingerido: intake,
    referencia: target,
    tipoReferencia: ref.targetType,
    refValue: target,
    refType: ref.targetType,
    ul: ul,
    ulValue: ul,
    rda: ref.rda,
    ear: ref.ear,
    ai: ref.ai,
    adequacaoPct: percentage,
    status,
    statusKey,
    badgeClass,
    lightBadgeClass
  };
}

/**
 * Avalia todos os micronutrientes consolidados para um paciente (idade e sexo)
 * @param {Object} totals - Objeto com { calcioMg, ferroMg, sodioMg, potassioMg, vitAMcg, vitCMg } ou chaves diretas { calcio, ferro, sodio, potassio, vitA, vitC }
 * @param {number|string} age - Idade do paciente
 * @param {string} gender - Sexo do paciente ('Masculino' ou 'Feminino')
 */
function analyzeAllMicronutrientsForPatient(totals = {}, age = 54, gender = "Masculino") {
  const profile = selectDriProfileForPatient(age, gender);
  const micros = profile.micronutrientes;

  const intakeMap = {
    calcio: totals.calcioMg !== undefined ? totals.calcioMg : (totals.calcio || 0),
    ferro: totals.ferroMg !== undefined ? totals.ferroMg : (totals.ferro || 0),
    sodio: totals.sodioMg !== undefined ? totals.sodioMg : (totals.sodio || 0),
    potassio: totals.potassioMg !== undefined ? totals.potassioMg : (totals.potassio || 0),
    vitA: totals.vitAMcg !== undefined ? totals.vitAMcg : (totals.vitA || 0),
    vitC: totals.vitCMg !== undefined ? totals.vitCMg : (totals.vitC || 0)
  };

  const keys = ["calcio", "ferro", "sodio", "potassio", "vitA", "vitC"];
  const results = keys.map(key => {
    const evalItem = evaluateMicronutrientAdequacy(intakeMap[key], micros[key]);
    return {
      key,
      ...evalItem
    };
  });

  const perfilInfo = {
    id: profile.id,
    faixaEtaria: profile.faixaEtaria,
    sexo: profile.sexo,
    idadePaciente: age || 54,
    sexoPaciente: normalizeDriSex(gender)
  };

  return {
    perfilSelecionado: perfilInfo,
    profile: perfilInfo,
    itens: results,
    items: results
  };
}

/**
 * Renderiza o HTML da Tabela Dinâmica de Adequação de Micronutrientes (DRIs) para o DOM Vanilla
 */
function renderDriAdequacyTableHTML(analysisResult, contextTitle = "Análise de Adequação de Micronutrientes (DRIs)") {
  if (!analysisResult || !Array.isArray(analysisResult.itens)) return "";
  const p = analysisResult.perfilSelecionado;

  const rowsHtml = analysisResult.itens.map(item => {
    const ulText = item.ul !== null ? `${item.ul} ${item.unidade}` : "ND (Sem UL)";
    return `
      <tr class="border-b border-slate-800/80 hover:bg-slate-800/40 transition">
        <td class="py-2 px-2.5 font-bold text-slate-200 flex items-center space-x-1.5">
          <span>${item.icone}</span>
          <span>${item.nome}</span>
        </td>
        <td class="py-2 px-2.5 text-right font-extrabold text-white">
          ${item.ingerido} <span class="text-[10px] text-slate-400 font-normal">${item.unidade}</span>
        </td>
        <td class="py-2 px-2.5 text-right text-slate-300 font-semibold">
          ${item.referencia} ${item.unidade}
          <span class="ml-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60" title="Critério selecionado pela hierarquia RDA > EAR > AI">
            ${item.tipoReferencia}
          </span>
        </td>
        <td class="py-2 px-2.5 text-right text-slate-400 text-[11px]">
          ${ulText}
        </td>
        <td class="py-2 px-2.5 text-right font-bold text-slate-300">
          ${item.adequacaoPct}%
        </td>
        <td class="py-2 px-2.5 text-center">
          <span class="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${item.badgeClass}">
            ${item.status}
          </span>
        </td>
      </tr>
    `;
  }).join("");

  return `
    <div class="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3.5 space-y-2.5 mt-2 shadow-inner">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div>
          <h6 class="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center space-x-1.5">
            <span>🧬</span>
            <span>${contextTitle}</span>
          </h6>
          <p class="text-[10px] text-slate-400 mt-0.5">
            Hierarquia automática: <strong>RDA</strong> (Prioridade 1) ➔ <strong>EAR</strong> (Prioridade 2) ➔ <strong>AI</strong> (Prioridade 3) | Limite Superior: <strong>UL</strong>
          </p>
        </div>
        <div class="flex items-center space-x-1.5 bg-slate-950 border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] text-slate-300">
          <span>👤 Perfil DRI Vinculado:</span>
          <strong class="text-emerald-400">${p.sexo} • ${p.faixaEtaria}</strong>
          <span class="text-slate-500">(${p.idadePaciente} anos)</span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
            <tr>
              <th class="py-2 px-2.5">Micronutriente</th>
              <th class="py-2 px-2.5 text-right">Total Apurado</th>
              <th class="py-2 px-2.5 text-right">Meta DRI (RDA/EAR/AI)</th>
              <th class="py-2 px-2.5 text-right">Limite Máx (UL)</th>
              <th class="py-2 px-2.5 text-right">% Adequação</th>
              <th class="py-2 px-2.5 text-center">Status de Adequação</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

DRI_REFERENCE_DATABASE.profiles = DRI_REFERENCE_DATABASE.perfis;

if (typeof window !== "undefined") {
  window.DRI_REFERENCE_DATABASE = DRI_REFERENCE_DATABASE;
  window.selectDriProfileForPatient = selectDriProfileForPatient;
  window.resolveMicronutrientReference = resolveMicronutrientReference;
  window.evaluateMicronutrientAdequacy = evaluateMicronutrientAdequacy;
  window.analyzeAllMicronutrientsForPatient = analyzeAllMicronutrientsForPatient;
  window.renderDriAdequacyTableHTML = renderDriAdequacyTableHTML;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DRI_REFERENCE_DATABASE,
    selectDriProfileForPatient,
    resolveMicronutrientReference,
    evaluateMicronutrientAdequacy,
    analyzeAllMicronutrientsForPatient,
    renderDriAdequacyTableHTML
  };
}
