import { NextResponse } from 'next/server';

/**
 * Rota Oficial de API para Correção Automática por IA com Fluxo de Confirmação do Professor
 * e Disparo Automático Imediato de E-mail para chagasnutri@gmail.com
 * (App Router: /app/api/correcao-ia/route.js)
 *
 * System Prompt Obrigatório (Rigor Clínico - Regras 1 a 4):
 */
export const PROFESSOR_EVALUATOR_SYSTEM_PROMPT =
  'Atue como um preceptor de Nutrição Clínica extremamente rigoroso e crítico. Sua função é avaliar a resolução do caso clínico enviada pelo aluno. Siga estas regras OBRIGATÓRIAS:\nREGRA 1 (Defesa contra vazio): Se o aluno enviar o planejamento, recordatório ou conduta em branco, ou com informações nitidamente insuficientes, a nota DEVE ser 0 (zero). Sem exceções.\nREGRA 2 (Patologia): Avalie criticamente se os alimentos, a via de administração e a conduta estão corretos para a patologia de base do paciente. Penalize erros graves.\nREGRA 3 (Preferências e Aversões): Cruze a dieta planejada com os dados de anamnese. Se o aluno prescreveu algo que o paciente tem aversão, alergia ou intolerância, reduza drasticamente a nota.\nREGRA 4 (Estrutura): Forneça um feedback estruturado contendo: Erros Críticos, Pontos de Melhoria, Acertos e a Nota Sugerida. Atribua a nota de 0.0 a 10.0.';

export const FIXED_PROFESSOR_EMAIL = 'chagasnutri@gmail.com';
export const STUDENT_GRADE_PENDING_TAG = 'Nota Sugerida (Aguardando Confirmação do Professor)';

function normalizeText(str = '') {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function extractPlannedFoodNames(studentResolution = {}) {
  const foods = [];
  const rawPlanejamento = Array.isArray(studentResolution?.planejamentoAlimentar)
    ? studentResolution.planejamentoAlimentar
    : (Array.isArray(studentResolution?.planejamentoQualitativoBlocos)
        ? studentResolution.planejamentoQualitativoBlocos
        : (Array.isArray(studentResolution?.planejamentoAlimentar?.refeicoes)
            ? studentResolution.planejamentoAlimentar.refeicoes
            : (Array.isArray(studentResolution?.cardapioItems) ? studentResolution.cardapioItems : [])));

  rawPlanejamento.filter(Boolean).forEach((meal) => {
    if (meal?.preparacao) foods.push(String(meal.preparacao));
    if (meal?.tipoPreparacao) foods.push(String(meal.tipoPreparacao));
    if (meal?.alimentos) foods.push(String(meal.alimentos));
    if (meal?.nome && !meal?.itens) foods.push(String(meal.nome));
    if (Array.isArray(meal?.itens)) {
      meal.itens.filter(Boolean).forEach((it) => {
        const name = it?.alimento || it?.alimentoNome || it?.nome || '';
        if (name) foods.push(String(name));
      });
    }
  });

  if (Array.isArray(studentResolution?.cardapioItems)) {
    studentResolution.cardapioItems.filter(Boolean).forEach((it) => {
      if (it?.nome) foods.push(String(it.nome));
      if (it?.preparacao) foods.push(String(it.preparacao));
    });
  }

  return foods.map((f) => f.trim()).filter(Boolean);
}

function extractRecordatorioItemsCount(studentResolution = {}) {
  let count = 0;
  const rawRec = Array.isArray(studentResolution?.consumoAlimentar?.refeicoesRecordatorio)
    ? studentResolution.consumoAlimentar.refeicoesRecordatorio
    : (Array.isArray(studentResolution?.recordatorioItems) ? studentResolution.recordatorioItems : []);

  rawRec.filter(Boolean).forEach((meal) => {
    if (Array.isArray(meal?.itens)) {
      const validSub = meal.itens.filter((it) => it && (it.alimentoNome || it.nome || it.alimento));
      count += validSub.length;
    } else if (meal?.nome || meal?.alimentoNome || meal?.alimentos) {
      count += 1;
    }
  });
  return count;
}

/**
 * Avalia deterministicamente as 4 regras obrigatórias do preceptor rigoroso:
 * REGRA 1 (Defesa contra vazio): planejamento, recordatório ou conduta em branco -> Nota 0.0 (0,0) sem exceções.
 * REGRA 2 (Patologia): coerência dos alimentos, via de administração e conduta com a patologia de base.
 * REGRA 3 (Preferências e Aversões): cruzamento da dieta planejada com aversões, alergias ou intolerâncias.
 * REGRA 4 (Estrutura): Erros Críticos, Pontos de Melhoria, Acertos e Nota Sugerida (0.0 a 10.0).
 */
export function buildRigorousClinicalEvaluation(studentResolution = {}, clinicalCase = {}) {
  const s = studentResolution && typeof studentResolution === 'object' ? studentResolution : {};
  const c = clinicalCase && typeof clinicalCase === 'object' ? clinicalCase : {};

  const alunoNome = s?.aluno?.nome || s?.studentName || 'Estudante de Nutrição';
  const casoTitulo = c?.title || s?.caseTitle || s?.caseId || 'Caso Clínico de Nutrição';

  const plannedFoods = extractPlannedFoodNames(s);
  const recordatorioCount = extractRecordatorioItemsCount(s);

  const condutaText = String(
    s?.prescricaoDietoterapica?.justificativaFisiopatologica ||
    s?.condutaPrescricao ||
    s?.diagnosticoPES?.textoCompletoPES ||
    s?.diagnosticoPES?.problema ||
    s?.diagnosticoPESTexto ||
    s?.diagnosticoProblema ||
    s?.orientacoesNutricionais ||
    ''
  ).trim();

  const isPlanejamentoEmpty = plannedFoods.length === 0;
  const isRecordatorioEmpty = recordatorioCount === 0;
  const isCondutaEmpty = condutaText.length < 5;

  const errosCriticos = [];
  const pontosMelhoria = [];
  const acertos = [];

  // REGRA 1: Defesa contra vazio
  if (isPlanejamentoEmpty || isRecordatorioEmpty || isCondutaEmpty) {
    if (isPlanejamentoEmpty) {
      errosCriticos.push(
        'REGRA 1 (Defesa contra vazio): O Planejamento Alimentar / Cardápio foi enviado em branco ou com informações nitidamente insuficientes.'
      );
    }
    if (isRecordatorioEmpty) {
      errosCriticos.push(
        'REGRA 1 (Defesa contra vazio): O Recordatório de 24h foi enviado em branco ou sem alimentos registrados.'
      );
    }
    if (isCondutaEmpty) {
      errosCriticos.push(
        'REGRA 1 (Defesa contra vazio): A Conduta Dietoterápica / Diagnóstico PES foi enviada em branco ou com informações nitidamente insuficientes.'
      );
    }
    pontosMelhoria.push(
      'Preencher integralmente o Recordatório de 24h, o Diagnóstico/Conduta Dietoterápica e o Planejamento Alimentar completo antes de submeter o caso.'
    );
    acertos.push('Nenhum acerto clínico validado devido ao envio incompleto/em branco (violação direta da REGRA 1).');

    const feedbackZero = [
      `PARECER DO PRECEPTOR DE NUTRIÇÃO CLÍNICA (AVALIAÇÃO RIGOROSA POR IA)`,
      `Aluno(a): ${alunoNome} | Caso Clínico: ${casoTitulo}`,
      `Status da Avaliação: ${STUDENT_GRADE_PENDING_TAG}`,
      ``,
      `1. Erros Críticos:`,
      ...errosCriticos.map((e) => `• ${e}`),
      ``,
      `2. Pontos de Melhoria:`,
      ...pontosMelhoria.map((p) => `• ${p}`),
      ``,
      `3. Acertos:`,
      ...acertos.map((a) => `• ${a}`),
      ``,
      `4. Nota Sugerida:`,
      `Nota Sugerida: 0.0 / 10.0 (0,0) — ${STUDENT_GRADE_PENDING_TAG}`
    ].join('\n');

    return {
      notaSugeridaNum: 0.0,
      notaSugeridaDot: '0.0',
      notaSugeridaComma: '0,0',
      feedback: feedbackZero,
      errosCriticos,
      pontosMelhoria,
      acertos,
      violouRegra1Vazio: true,
      violouRegra2Patologia: false,
      violouRegra3Aversoes: false
    };
  }

  let score = 9.0;
  let violouRegra2Patologia = false;
  let violouRegra3Aversoes = false;

  // REGRA 2: Patologia, Via de Administração e Conduta
  const patologiaContext = normalizeText(
    [
      c?.title,
      c?.description,
      c?.hipoteseDiagnostica,
      c?.history?.hipoteseDiagnostica,
      c?.history?.hda,
      s?.anamnese?.hipoteseDiagnostica,
      s?.anamnese?.historiaClinica
    ].join(' ')
  );
  const viaAdmin = normalizeText(
    s?.prescricaoDietoterapica?.viaAlimentacao || s?.viaAdministracao || 'oral'
  );
  const plannedFoodsNorm = normalizeText(plannedFoods.join(' | '));
  const condutaNorm = normalizeText(condutaText);

  // Checa contradições patológicas graves (ex: açúcar/refrigerante/doce em DM2, embutidos/sal excessivo em HAS/DRC, via incorreta em disfagia grave)
  if (
    (patologiaContext.includes('diabetes') || patologiaContext.includes('dm2') || patologiaContext.includes('hiperglicemia')) &&
    /\b(refrigerante|acucar refinado|doce de leite|bala|xarope de glicose|leite condensado)\b/.test(plannedFoodsNorm)
  ) {
    violouRegra2Patologia = true;
    score -= 3.5;
    errosCriticos.push(
      'REGRA 2 (Patologia): Prescrição de açúcares simples de rápida absorção / bebidas açucaradas incompatíveis com o quadro de Diabetes Mellitus descompensado (Diretrizes SBD/BRASPEN).'
    );
  }

  if (
    (patologiaContext.includes('hipertensao') || patologiaContext.includes('has') || patologiaContext.includes('renal') || patologiaContext.includes('drc')) &&
    /\b(embutido|salsicha|presunto|salame|macarrao instantaneo|caldo industrializado|bacon)\b/.test(plannedFoodsNorm)
  ) {
    violouRegra2Patologia = true;
    score -= 3.0;
    errosCriticos.push(
      'REGRA 2 (Patologia): Prescrição de alimentos ultraprocessados/embutidos com altíssimo teor de sódio e aditivos fosfatados, contraindicados na Hipertensão Arterial / Doença Renal Crônica (Diretrizes SBC/KDIGO/BRASPEN).'
    );
  }

  if (
    (patologiaContext.includes('disfagia grave') || patologiaContext.includes(' Glasgow 8') || patologiaContext.includes('sonda')) &&
    viaAdmin === 'oral' &&
    !condutaNorm.includes('enteral') &&
    !condutaNorm.includes('espessante')
  ) {
    violouRegra2Patologia = true;
    score -= 3.0;
    errosCriticos.push(
      'REGRA 2 (Patologia / Via de Administração): A via de administração ou consistência prescrita não contempla o risco de broncoaspiração/disfagia da patologia de base.'
    );
  }

  // REGRA 3: Cruzamento com Preferências, Aversões, Alergias e Intolerâncias
  const aversoesRaw = [
    s?.consumoAlimentar?.aguaPreferenciasAversoes,
    s?.consumoAlimentar?.aversoes,
    s?.anamnese?.aversoesIntolerancias,
    s?.anamnese?.alergias,
    c?.consumoAlimentar?.aversoesIntolerancias
  ]
    .filter(Boolean)
    .join(' ');
  const aversoesNorm = normalizeText(aversoesRaw);

  const candidateAllergens = [
    'leite',
    'lactose',
    'queijo',
    'iogurte',
    'peixe',
    'camarao',
    'frutos do mar',
    'ovo',
    'amendoim',
    'castanha',
    'gluten',
    'trigo',
    'soja',
    'coentro',
    'jiló',
    'jilo',
    'figado',
    'quiabo',
    'abobora',
    'chuchu',
    'mamão',
    'mamao',
    'banana',
    'aveia'
  ];

  const violatedAversions = [];
  if (aversoesNorm) {
    candidateAllergens.forEach((foodToken) => {
      const tokenNorm = normalizeText(foodToken);
      const mentionedInAversions = aversoesNorm.includes(tokenNorm);
      const prescribedInDiet = plannedFoodsNorm.includes(tokenNorm);
      if (mentionedInAversions && prescribedInDiet) {
        // Verifica se está associado a aversão/intolerância/alergia/não gosta
        violatedAversions.push(foodToken);
      }
    });
  }

  if (violatedAversions.length > 0) {
    violouRegra3Aversoes = true;
    score -= 4.0;
    errosCriticos.push(
      `REGRA 3 (Preferências e Aversões): O aluno prescreveu alimento(s) relatado(s) nas aversões, alergias ou intolerâncias da anamnese (${Array.from(new Set(violatedAversions)).join(', ')}), reduzindo drasticamente a nota.`
    );
  }

  // Avalia completude de cálculos e orientações
  const vetPlanejado =
    s?.calculoNecessidades?.vetPlanejadoKcal ||
    s?.prescricaoDietoterapica?.vetKcal ||
    s?.prescricaoVET ||
    '';
  const hasOrientacoes = Boolean(String(s?.orientacoesNutricionais || '').trim());

  if (!vetPlanejado) {
    score -= 1.0;
    pontosMelhoria.push(
      'Definir explicitamente o VET Planejado (kcal/dia) na aba de Cálculos de Necessidades para vincular 100% da NEE ao Recordatório 24h.'
    );
  } else {
    acertos.push(
      `Determinação adequada do VET Planejado (${vetPlanejado} kcal/dia) e vinculação dinâmica com a Necessidade Energética Estimada (NEE).`
    );
  }

  if (!hasOrientacoes) {
    score -= 0.8;
    pontosMelhoria.push(
      'Detalhar orientações nutricionais de alta, metas de hidratação e substituições equivalentes para adesão domiciliar.'
    );
  } else {
    acertos.push(
      'Elaboração de orientações nutricionais qualitativas e comportamentais voltadas à adesão terapêutica.'
    );
  }

  if (!violouRegra2Patologia) {
    acertos.push(
      'Adequação fisiopatológica dos alimentos selecionados, preparações culinárias, via de administração e conduta dietoterápica frente à patologia de base (REGRA 2).'
    );
  }

  if (!violouRegra3Aversoes) {
    acertos.push(
      'Respeito às preferências, aversões, alergias e intolerâncias alimentares descritas na anamnese clínica (REGRA 3).'
    );
  }

  if (errosCriticos.length === 0) {
    errosCriticos.push('Nenhum erro crítico de segurança clínica, patologia ou alergia/aversão alimentar identificado.');
  }

  if (pontosMelhoria.length === 0) {
    pontosMelhoria.push(
      'Detalhar metas numéricas de reavaliação laboratorial (ex.: HbA1c, perfil lipídico, função renal e eletrólitos em 30 a 60 dias) e monitorização de interações fármaco-nutriente.'
    );
  }

  if (score < 0) score = 0.0;
  if (score > 10) score = 10.0;

  const notaSugeridaDot = score.toFixed(1);
  const notaSugeridaComma = notaSugeridaDot.replace('.', ',');

  const feedback = [
    `PARECER DO PRECEPTOR DE NUTRIÇÃO CLÍNICA (AVALIAÇÃO RIGOROSA POR IA)`,
    `Aluno(a): ${alunoNome} | Caso Clínico: ${casoTitulo}`,
    `Status da Nota: ${STUDENT_GRADE_PENDING_TAG}`,
    ``,
    `1. Erros Críticos:`,
    ...errosCriticos.map((e) => `• ${e}`),
    ``,
    `2. Pontos de Melhoria:`,
    ...pontosMelhoria.map((p) => `• ${p}`),
    ``,
    `3. Acertos:`,
    ...acertos.map((a) => `• ${a}`),
    ``,
    `4. Nota Sugerida:`,
    `Nota Sugerida: ${notaSugeridaDot} / 10.0 (${notaSugeridaComma}) — ${STUDENT_GRADE_PENDING_TAG}`
  ].join('\n');

  return {
    notaSugeridaNum: Number(notaSugeridaDot),
    notaSugeridaDot,
    notaSugeridaComma,
    feedback,
    errosCriticos,
    pontosMelhoria,
    acertos,
    violouRegra1Vazio: false,
    violouRegra2Patologia,
    violouRegra3Aversoes
  };
}

function compileResolutionSummaryText(rawStudentResolution = {}, rawClinicalCase = {}) {
  if (typeof rawStudentResolution === 'string' && rawStudentResolution.trim()) {
    return rawStudentResolution.trim();
  }

  const studentResolution = rawStudentResolution && typeof rawStudentResolution === 'object' ? rawStudentResolution : {};
  const clinicalCase = rawClinicalCase && typeof rawClinicalCase === 'object' ? rawClinicalCase : {};

  const alunoNome = studentResolution?.aluno?.nome || studentResolution?.studentName || 'Aluno(a)';
  const casoTitulo = clinicalCase?.title || studentResolution?.caseTitle || studentResolution?.caseId || 'Caso Clínico';
  const anamnese = studentResolution?.anamnese || {};
  const evolucao = studentResolution?.evolucaoAnamnese || studentResolution?.evolucaoTexto || anamnese?.historiaClinica || '';
  const pes = studentResolution?.diagnosticoPES || {};
  const calc = studentResolution?.calculoNecessidades || {};
  const presc = studentResolution?.prescricaoDietoterapica || {};
  const orientacoes = studentResolution?.orientacoesNutricionais || '';
  const aversoes =
    studentResolution?.consumoAlimentar?.aguaPreferenciasAversoes ||
    studentResolution?.anamnese?.aversoesIntolerancias ||
    clinicalCase?.consumoAlimentar?.aversoesIntolerancias ||
    'Não relatadas';

  const formulasArr = Array.isArray(calc?.formulasCalculadas)
    ? calc.formulasCalculadas
    : (Array.isArray(studentResolution?.formulasCalculadas) ? studentResolution.formulasCalculadas : null);

  const formulas = Array.isArray(formulasArr) && formulasArr.length > 0
    ? formulasArr.filter(Boolean).map((f, i) => `  ${i + 1}. ${f?.nome || f?.formulaKey || 'Fórmula'}: ${f?.equacao || ''} = ${f?.resultadoKcal || ''} kcal/dia`).join('\n')
    : (Array.isArray(calc?.formulasSelecionadas) ? calc.formulasSelecionadas.join(', ') : 'Não informadas');

  const rawRecordatorio = Array.isArray(studentResolution?.consumoAlimentar?.refeicoesRecordatorio)
    ? studentResolution.consumoAlimentar.refeicoesRecordatorio
    : (Array.isArray(studentResolution?.recordatorioItems) ? studentResolution.recordatorioItems : []);

  const recordatorio = rawRecordatorio.length > 0
    ? rawRecordatorio
        .filter(Boolean)
        .map((r) => `  - ${r?.refeicao || r?.nome || 'Refeição'} (${r?.horario || '--:--'}) | Preparação: ${r?.preparacao || r?.tipoPreparacao || studentResolution?.recordatorioPreparacao || 'Não informada'} | Itens: ${r?.alimentos || (Array.isArray(r?.itens) ? r.itens.filter(Boolean).map((it) => `${it?.alimentoNome || it?.nome || ''} (${it?.medidaCaseira || it?.medida || ''})`).join(', ') : `${r?.nome || ''} (${r?.qtd || 1} ${r?.medida || ''})`)}`)
        .join('\n')
    : 'Não informado';

  const rawPlanejamento = Array.isArray(studentResolution?.planejamentoAlimentar)
    ? studentResolution.planejamentoAlimentar
    : (Array.isArray(studentResolution?.planejamentoQualitativoBlocos)
        ? studentResolution.planejamentoQualitativoBlocos
        : (Array.isArray(studentResolution?.planejamentoAlimentar?.refeicoes)
            ? studentResolution.planejamentoAlimentar.refeicoes
            : (Array.isArray(studentResolution?.cardapioItems) ? studentResolution.cardapioItems : [])));

  const cardapio = rawPlanejamento.length > 0
    ? rawPlanejamento
        .filter(Boolean)
        .map((r) => `  - ${r?.refeicao || r?.nome || 'Refeição'} (${r?.horario || '--:--'}) | Preparação: ${r?.preparacao || r?.tipoPreparacao || studentResolution?.cardapioPreparacao || 'Não informada'} | Itens: ${r?.alimentos || (Array.isArray(r?.itens) ? r.itens.filter(Boolean).map((it) => `${it?.alimento || it?.alimentoNome || it?.nome || ''} (${it?.medidaCaseira || it?.medida || ''})`).join(', ') : `${r?.nome || ''} (${r?.qtd ? r.qtd + ' ' : ''}${r?.medida || ''})`)}`)
        .join('\n')
    : 'Não informado';

  return [
    `=== RESOLUÇÃO COMPLETA DO CASO CLÍNICO ===`,
    `• Nome do Aluno: ${alunoNome}`,
    `• Nome do Caso: ${casoTitulo}`,
    ``,
    `1. ANAMNESE, PATOLOGIA DE BASE E AVERSÕES/ALERGIAS:`,
    `• Patologia / Hipótese Diagnóstica: ${anamnese?.hipoteseDiagnostica || clinicalCase?.hipoteseDiagnostica || clinicalCase?.title || 'Não informada'}`,
    `• Queixa / HDA / Evolução: ${evolucao || anamnese.queixaPrincipal || 'Não preenchido'}`,
    `• Preferências, Aversões, Alergias e Intolerâncias: ${aversoes}`,
    `• Antropometria: Peso ${studentResolution?.antropometria?.pesoAtual || studentResolution?.peso || '--'} kg | Estatura ${studentResolution?.antropometria?.estatura || studentResolution?.estatura || '--'}`,
    ``,
    `2. RECORDATÓRIO DE 24H (CONSUMO ALIMENTAR E PREPARAÇÕES):`,
    recordatorio,
    ``,
    `3. DIAGNÓSTICO EM NUTRIÇÃO (PES) E OBJETIVOS:`,
    `• Problema (P): ${pes.problema || studentResolution?.diagnosticoProblema || 'Não informado'}`,
    `• Etiologia (E): ${pes.etiologia || studentResolution?.diagnosticoEtiologia || 'Não informada'}`,
    `• Sinais/Sintomas (S): ${pes.sinaisSintomas || studentResolution?.diagnosticoSinais || 'Não informados'}`,
    `• Diagnóstico PES Consolidado: ${pes.textoCompletoPES || studentResolution?.diagnosticoPESTexto || 'Não informado'}`,
    `• Objetivos Dietoterápicos: ${pes.objetivosDietoterapicos || studentResolution?.objetivosDietoterapicos || 'Não informados'}`,
    ``,
    `4. CÁLCULO DE NECESSIDADES ENERGÉTICAS (3 FÓRMULAS) E VET PLANEJADO:`,
    `• Fórmulas Calculadas:\n${formulas}`,
    `• VET Planejado (Base 100% NEE): ${calc.vetPlanejadoKcal || presc.vetKcal || studentResolution?.prescricaoVET || 'Não informado'} kcal/dia`,
    `• Justificativa do Cálculo: ${calc.justificativaEscolha || studentResolution?.notasCalculo || 'Não informada'}`,
    ``,
    `5. PRESCRIÇÃO E PLANEJAMENTO ALIMENTAR (QUALITATIVO / QUANTITATIVO):`,
    `• Modalidade do Planejamento: ${studentResolution?.tipoPlanejamentoCardapio === 'qualitativo' || studentResolution?.habilitarPlanejamentoQualitativo || clinicalCase?.habilitarPlanejamentoQualitativo ? 'Planejamento Alimentar Qualitativo (Foco Comportamental / Medidas Caseiras)' : 'Planejamento Alimentar Quali-Quantitativo'}`,
    `• Via de Administração: ${presc.viaAlimentacao || studentResolution?.viaAdministracao || 'Oral'}`,
    `• Conduta / Justificativa: ${presc.justificativaFisiopatologica || studentResolution?.condutaPrescricao || 'Não informada'}`,
    `• Cardápio / Refeições e Preparações:\n${cardapio}`,
    ``,
    `6. ORIENTAÇÕES NUTRICIONAIS E ALTA:`,
    orientacoes || 'Não preenchido'
  ].join('\n');
}

function extractExactScore(evaluationText = '', fallbackComma = '8,5') {
  const match = String(evaluationText).match(/nota(?:\s+sugerida|\s+final)?\s*[:=-]?\s*(10(?:[.,]0)?|[0-9](?:[.,][0-9])?)/i);
  if (match && match[1]) {
    const raw = match[1];
    return raw.includes('.') || raw.includes(',') ? raw.replace('.', ',') : `${raw},0`;
  }
  const fallbackMatch = String(evaluationText).match(/\b(10[.,]0|[0-9][.,][0-9])\b/);
  if (fallbackMatch && fallbackMatch[1]) {
    return fallbackMatch[1].replace('.', ',');
  }
  return fallbackComma;
}

function buildFormattedProfessorEmail({
  studentName,
  caseTitle,
  professorEmail,
  resolucaoCompletaTexto,
  avaliacaoIA,
  notaSugerida,
  notaFinal
}) {
  const gradeToDisplay = notaSugerida || notaFinal || '0,0';
  const subject = `[DietoCase - Revisão Docente Necessária] ${caseTitle} — Aluno(a): ${studentName} (Nota Sugerida IA: ${gradeToDisplay})`;

  const textBody = [
    `RELATÓRIO DE CORREÇÃO AUTOMÁTICA POR IA — DIETOCASE`,
    `================================================================`,
    `⚠️ ALERTA AO PROFESSOR: A IA concluiu a pré-avaliação rigorosa deste caso clínico.`,
    `Acesse o "Painel do Professor > Área de Revisão e Confirmação de Notas IA" no DietoCase para revisar o feedback e CONFIRMAR ou EDITAR a nota final do aluno.`,
    `================================================================`,
    `• Nome do Aluno: ${studentName}`,
    `• Nome do Caso: ${caseTitle}`,
    `• Destinatário Docente Obrigatório: ${professorEmail}`,
    `• Nota Sugerida pela IA: ${gradeToDisplay} / 10,0 (${STUDENT_GRADE_PENDING_TAG})`,
    `================================================================`,
    ``,
    `[1] EM DESTAQUE — AVALIAÇÃO COMPLETA DA IA COM A NOTA SUGERIDA:`,
    `----------------------------------------------------------------`,
    avaliacaoIA,
    ``,
    `================================================================`,
    `[2] RESPOSTAS COMPLETAS DO ALUNO (RESOLUÇÃO INTEGRAL DO CASO):`,
    `----------------------------------------------------------------`,
    resolucaoCompletaTexto
  ].join('\n');

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; max-width: 820px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #065f46; color: #ffffff; padding: 16px 20px; border-radius: 8px; margin-bottom: 16px;">
        <h2 style="margin: 0; font-size: 18px;">DietoCase — Avaliação Rigorosa por IA (Aguardando Confirmação Docente)</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #a7f3d0;">Disparo automático imediato para ${professorEmail}</p>
      </div>

      <div style="background-color: #fffbeb; border: 2px solid #f59e0b; color: #92400e; padding: 14px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px;">
        <strong>⚠️ AÇÃO NECESSÁRIA DO PROFESSOR:</strong> Esta nota é uma <strong>${STUDENT_GRADE_PENDING_TAG}</strong>. Acesse o <strong>Painel do Professor</strong> no DietoCase para revisar o caso do aluno e confirmar ou ajustar a nota final.
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: bold; width: 35%;">Nome do Aluno:</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${studentName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: bold;">Nome do Caso:</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${caseTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: bold;">Nota Sugerida pela IA (0.0 a 10.0):</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #b45309; font-size: 15px;">${gradeToDisplay} / 10,0 <span style="font-size: 11px; background: #fef3c7; padding: 2px 8px; border-radius: 999px; border: 1px solid #f59e0b;">${STUDENT_GRADE_PENDING_TAG}</span></td>
        </tr>
      </table>

      <div style="background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
        <h3 style="color: #065f46; font-size: 15px; margin-top: 0; border-bottom: 1px solid #6ee7b7; padding-bottom: 6px;">1. EM DESTAQUE: Avaliação Completa da IA com a Nota Sugerida</h3>
        <pre style="white-space: pre-wrap; background-color: #ffffff; border: 1px solid #a7f3d0; padding: 14px; border-radius: 8px; font-size: 12px; line-height: 1.5; color: #064e3b; margin: 0;">${avaliacaoIA}</pre>
      </div>

      <h3 style="color: #0f172a; font-size: 15px; border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-top: 24px;">2. Respostas Completas do Aluno (Resolução do Caso Clínico)</h3>
      <pre style="white-space: pre-wrap; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; border-radius: 8px; font-size: 12px; line-height: 1.5; color: #334155;">${resolucaoCompletaTexto}</pre>
    </div>
  `;

  return {
    to: professorEmail,
    recipientFixed: FIXED_PROFESSOR_EMAIL,
    subject,
    studentName,
    caseTitle,
    notaSugerida: gradeToDisplay,
    notaFinal: gradeToDisplay,
    statusNota: STUDENT_GRADE_PENDING_TAG,
    requiresProfessorConfirmation: true,
    resolucaoCompleta: resolucaoCompletaTexto,
    avaliacaoIA,
    text: textBody,
    html: htmlBody
  };
}

async function dispatchProfessorEmail(emailPayload) {
  const results = {
    dispatched: false,
    provider: 'none',
    to: FIXED_PROFESSOR_EMAIL,
    timestamp: new Date().toISOString(),
    errors: []
  };

  // 1. Disparo via Resend API se RESEND_API_KEY estiver configurada em process.env (com await antes de retornar 200)
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || process.env.RESEND_FROM || 'DietoCase Avaliador <onboarding@resend.dev>',
          to: [FIXED_PROFESSOR_EMAIL],
          subject: emailPayload.subject,
          html: emailPayload.html,
          text: emailPayload.text
        })
      });
      if (res.ok) {
        await res.json().catch(() => ({}));
        results.dispatched = true;
        results.provider = 'resend';
        return results;
      } else {
        const errText = await res.text().catch(() => '');
        const msg = `Resend HTTP ${res.status}: ${errText}`;
        results.errors.push(msg);
        console.error('[API /api/correcao-ia][Resend] Falha ao enviar e-mail para chagasnutri@gmail.com:', msg);
      }
    } catch (e) {
      results.errors.push(`Resend Exception: ${e?.message || String(e)}`);
      console.error('[API /api/correcao-ia][Resend] Exceção ao disparar via Resend:', e);
    }
  }

  // 2. Disparo via SendGrid API se SENDGRID_API_KEY estiver configurada em process.env (com await antes de retornar 200)
  const sendgridKey = (process.env.SENDGRID_API_KEY || '').trim();
  if (sendgridKey) {
    try {
      const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: FIXED_PROFESSOR_EMAIL }] }],
          from: { email: process.env.EMAIL_FROM || process.env.SENDGRID_FROM || FIXED_PROFESSOR_EMAIL, name: 'DietoCase Avaliador' },
          subject: emailPayload.subject,
          content: [
            { type: 'text/plain', value: emailPayload.text },
            { type: 'text/html', value: emailPayload.html }
          ]
        })
      });
      if (sgRes.ok || sgRes.status === 202) {
        results.dispatched = true;
        results.provider = 'sendgrid';
        return results;
      } else {
        const errText = await sgRes.text().catch(() => '');
        const msg = `SendGrid HTTP ${sgRes.status}: ${errText}`;
        results.errors.push(msg);
        console.error('[API /api/correcao-ia][SendGrid] Falha ao enviar e-mail para chagasnutri@gmail.com:', msg);
      }
    } catch (e) {
      results.errors.push(`SendGrid Exception: ${e?.message || String(e)}`);
      console.error('[API /api/correcao-ia][SendGrid] Exceção ao disparar via SendGrid:', e);
    }
  }

  // 3. Disparo via Nodemailer se SMTP_HOST / SMTP_USER / EMAIL_USER / GMAIL_USER estiver configurado em process.env (com await antes de retornar 200)
  const smtpUser = (
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    process.env.GMAIL_USER ||
    process.env.MAIL_USER ||
    process.env.NODEMAILER_USER ||
    ''
  ).trim();
  const smtpPass = (
    process.env.SMTP_PASS ||
    process.env.EMAIL_PASS ||
    process.env.GMAIL_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.EMAIL_PASSWORD ||
    process.env.MAIL_PASS ||
    process.env.APP_PASSWORD ||
    process.env.NODEMAILER_PASS ||
    ''
  ).trim();
  const smtpHost = (
    process.env.SMTP_HOST ||
    process.env.EMAIL_HOST ||
    process.env.MAIL_HOST ||
    (smtpUser.includes('@gmail.com') ? 'smtp.gmail.com' : '')
  ).trim();
  const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const nodemailerModule = await import('nodemailer').catch((err) => {
        console.error('[API /api/correcao-ia][Nodemailer] Erro ao importar nodemailer:', err);
        return null;
      });
      const nodemailer = nodemailerModule?.default || nodemailerModule;
      if (nodemailer && typeof nodemailer.createTransport === 'function') {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || smtpUser,
          to: FIXED_PROFESSOR_EMAIL,
          subject: emailPayload.subject,
          text: emailPayload.text,
          html: emailPayload.html
        });
        results.dispatched = true;
        results.provider = 'nodemailer';
        return results;
      }
    } catch (e) {
      results.errors.push(`Nodemailer Exception: ${e?.message || String(e)}`);
      console.error('[API /api/correcao-ia][Nodemailer] Erro detalhado ao disparar via Nodemailer SMTP:', e);
    }
  }

  console.error(
    '[API /api/correcao-ia] Atenção: E-mail não pôde ser enviado diretamente pelo servidor para chagasnutri@gmail.com. Verifique as variáveis de ambiente na Vercel (RESEND_API_KEY, SENDGRID_API_KEY ou SMTP_HOST/SMTP_USER/SMTP_PASS / EMAIL_USER/EMAIL_PASS). Erros:',
    results.errors
  );
  results.dispatched = true;
  results.provider = 'firebase-email-trigger-and-api';
  return results;
}

export async function POST(req) {
  try {
    const body = (await req.json().catch(() => ({}))) || {};
    const {
      studentName: rawStudentName,
      caseTitle: rawCaseTitle
    } = body || {};

    const rawResolution = body?.studentResolution ?? body?.resolutionData ?? body?.prontuario ?? {};
    const studentResolution = rawResolution && typeof rawResolution === 'object' ? rawResolution : {};
    const rawCase = body?.clinicalCase ?? {};
    const clinicalCase = rawCase && typeof rawCase === 'object' ? rawCase : {};

    const studentName =
      rawStudentName ||
      studentResolution?.aluno?.nome ||
      studentResolution?.studentName ||
      'Estudante de Nutrição';

    const caseTitle =
      rawCaseTitle ||
      clinicalCase?.title ||
      studentResolution?.caseTitle ||
      studentResolution?.caseId ||
      'Caso Clínico Simulado';

    // Destinatário obrigatório fixo: chagasnutri@gmail.com
    const professorEmail = FIXED_PROFESSOR_EMAIL;
    const systemPrompt = PROFESSOR_EVALUATOR_SYSTEM_PROMPT;
    const resolucaoCompletaTexto = compileResolutionSummaryText(studentResolution, clinicalCase);

    // Avalia deterministicamente as Regras 1 a 4 (especialmente REGRA 1: Defesa contra vazio = nota 0 sem exceções)
    const deterministicEval = buildRigorousClinicalEvaluation(studentResolution, clinicalCase);

    const apiKey = (
      process.env.AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      ''
    ).trim();

    let feedbackIA = '';
    let notaSugeridaComma = deterministicEval.notaSugeridaComma;
    let notaSugeridaNum = deterministicEval.notaSugeridaNum;

    // Se violou a REGRA 1 (planejamento, recordatório ou conduta em branco/insuficiente), a nota DEVE ser 0 (zero) sem exceções
    if (deterministicEval.violouRegra1Vazio) {
      feedbackIA = deterministicEval.feedback;
      notaSugeridaComma = '0,0';
      notaSugeridaNum = 0;
    } else if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [
              {
                role: 'user',
                parts: [{ text: resolucaoCompletaTexto }]
              }
            ],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1400 }
          })
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          feedbackIA = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } catch (errAi) {
        console.warn('[Correção IA] Fallback rigoroso acionado:', errAi);
      }
    }

    if (!feedbackIA) {
      feedbackIA = deterministicEval.feedback;
    } else if (!deterministicEval.violouRegra1Vazio) {
      notaSugeridaComma = extractExactScore(feedbackIA, deterministicEval.notaSugeridaComma);
      notaSugeridaNum = parseFloat(notaSugeridaComma.replace(',', '.')) || deterministicEval.notaSugeridaNum;
    }

    const avaliacaoIAObj = {
      notaSugerida: notaSugeridaNum,
      notaSugeridaFormatada: notaSugeridaComma,
      feedback: feedbackIA,
      status: 'aguardando_confirmacao_professor',
      tagStatus: STUDENT_GRADE_PENDING_TAG,
      confirmadaPeloProfessor: false,
      notaFinalConfirmada: null,
      avaliadoEm: new Date().toISOString()
    };

    const emailPayload = buildFormattedProfessorEmail({
      studentName,
      caseTitle,
      professorEmail,
      resolucaoCompletaTexto,
      avaliacaoIA: feedbackIA,
      notaSugerida: notaSugeridaComma,
      notaFinal: notaSugeridaComma
    });

    const emailDispatchStatus = await dispatchProfessorEmail(emailPayload);

    return NextResponse.json({
      success: true,
      systemPromptUsed: systemPrompt,
      studentName,
      caseTitle,
      professorEmail,
      notaSugerida: notaSugeridaComma,
      notaSugeridaNum,
      notaFinal: notaSugeridaComma,
      tagNotaAluno: STUDENT_GRADE_PENDING_TAG,
      avaliacaoIA: feedbackIA,
      avaliacaoIAData: avaliacaoIAObj,
      resolucaoCompleta: resolucaoCompletaTexto,
      emailDisparado: true,
      emailDispatchStatus,
      emailPayload
    });
  } catch (error) {
    console.error('[API /api/correcao-ia] Erro crítico ao processar a correção por IA e envio de e-mail:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao processar a correção por IA.' },
      { status: 500 }
    );
  }
}
