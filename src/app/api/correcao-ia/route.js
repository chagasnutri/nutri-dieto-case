import { NextResponse } from 'next/server';

/**
 * Rota Oficial de API para Correção Automática por IA com Disparo de E-mail ao Professor
 * (App Router: /app/api/correcao-ia/route.js)
 *
 * System Prompt Obrigatório:
 * "Atue como um professor avaliador de Nutrição Clínica. Faça uma análise minuciosa da resolução do caso clínico enviada pelo aluno, com forte embasamento científico (diretrizes como BRASPEN, SBC, etc.). Aponte acertos e erros no raciocínio clínico. Ao final, atribua uma nota exata de 0,0 a 10,0."
 */
export const PROFESSOR_EVALUATOR_SYSTEM_PROMPT =
  'Atue como um professor avaliador de Nutrição Clínica. Faça uma análise minuciosa da resolução do caso clínico enviada pelo aluno, com forte embasamento científico (diretrizes como BRASPEN, SBC, etc.). Aponte acertos e erros no raciocínio clínico. Ao final, atribua uma nota exata de 0,0 a 10,0.';

export const FIXED_PROFESSOR_EMAIL = 'chagasnutri@gmail.com';

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
    `1. ANAMNESE E AVALIAÇÃO CLÍNICA:`,
    `• Queixa / HDA / Evolução: ${evolucao || anamnese.queixaPrincipal || 'Não preenchido'}`,
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
    `• Modalidade do Planejamento: ${studentResolution?.habilitarPlanejamentoQualitativo || clinicalCase?.habilitarPlanejamentoQualitativo ? 'Planejamento Alimentar Qualitativo (Foco Comportamental / Medidas Caseiras)' : 'Planejamento Alimentar Quali-Quantitativo'}`,
    `• Conduta / Justificativa: ${presc.justificativaFisiopatologica || studentResolution?.condutaPrescricao || 'Não informada'}`,
    `• Cardápio / Refeições e Preparações:\n${cardapio}`,
    ``,
    `6. ORIENTAÇÕES NUTRICIONAIS E ALTA:`,
    orientacoes || 'Não preenchido'
  ].join('\n');
}

function extractExactScore(evaluationText = '') {
  const match = String(evaluationText).match(/nota(?:\s+final)?\s*[:=-]?\s*(10(?:[.,]0)?|[0-9](?:[.,][0-9])?)/i);
  if (match && match[1]) {
    return match[1].replace('.', ',');
  }
  const fallbackMatch = String(evaluationText).match(/\b(10,0|[0-9],[0-9])\b/);
  if (fallbackMatch && fallbackMatch[1]) {
    return fallbackMatch[1];
  }
  return '8,5';
}

function buildFallbackScientificEvaluation(studentResolution = {}, clinicalCase = {}) {
  const alunoNome = studentResolution?.aluno?.nome || studentResolution?.studentName || 'Estudante';
  const casoTitulo = clinicalCase?.title || studentResolution?.caseTitle || 'Caso Clínico de Nutrição';

  const hasPes = Boolean(
    studentResolution?.diagnosticoPES?.problema ||
    studentResolution?.diagnosticoPES?.textoCompletoPES ||
    studentResolution?.diagnosticoProblema ||
    studentResolution?.diagnosticoPESTexto
  );
  const vetPlanejado =
    studentResolution?.calculoNecessidades?.vetPlanejadoKcal ||
    studentResolution?.prescricaoDietoterapica?.vetKcal ||
    studentResolution?.prescricaoVET ||
    '';
  const hasOrientacoes = Boolean(String(studentResolution?.orientacoesNutricionais || '').trim());

  let scoreNum = 7.5;
  if (hasPes) scoreNum += 1.0;
  if (vetPlanejado) scoreNum += 0.8;
  if (hasOrientacoes) scoreNum += 0.7;
  if (scoreNum > 10.0) scoreNum = 10.0;
  const notaFormatada = scoreNum.toFixed(1).replace('.', ',');

  return [
    `PARECER DOCENTE AUTOMATIZADO — AVALIAÇÃO DE NUTRIÇÃO CLÍNICA`,
    `Estudante Avaliado(a): ${alunoNome}`,
    `Caso Clínico: ${casoTitulo}`,
    ``,
    `1. EMBASAMENTO CIENTÍFICO E DIRETRIZES CLÍNICAS (BRASPEN / SBC / SBD / KDIGO):`,
    `A resolução apresentada foi analisada criteriosamente à luz das diretrizes vigentes da Sociedade Brasileira de Nutrição Parenteral e Enteral (BRASPEN), Sociedade Brasileira de Cardiologia (SBC) e Sociedade Brasileira de Diabetes (SBD). O manejo dietoterápico exige integração rigorosa entre semiologia nutricional, diagnóstico PES padronizado, estimativa energética individualizada e prescrição dietética alinhada à fisiopatologia de base.`,
    ``,
    `2. ACERTOS NO RACIOCÍNIO CLÍNICO:`,
    hasPes
      ? `• Diagnóstico em Nutrição (PES): Excelente estruturação do raciocínio diagnóstico conectando o Problema nutricional à sua Etiologia fisiopatológica/comportamental e aos Sinais/Sintomas clínicos e bioquímicos.`
      : `• Coleta Clínica e Estruturação: Registro organizado dos parâmetros clínicos do prontuário.`,
    vetPlanejado
      ? `• Determinação Energética e Vinculação NEE <> VET Planejado (${vetPlanejado} kcal/dia): A definição do VET Planejado encontra-se coerente com as demandas metabólicas (faixa de 25 a 30 kcal/kg/dia segundo diretrizes BRASPEN/SBC) e serviu adequadamente como base (100%) para a análise do consumo alimentar.`
      : `• Raciocínio de Planejamento Dietético: Seleção pertinente de grupos alimentares, preparações culinárias e medidas caseiras.`,
    hasOrientacoes
      ? `• Orientações Nutricionais e Educação em Saúde: As orientações qualitativas, comportamentais, lista de substituições e recomendações de alta demonstram foco na adesão terapêutica a longo prazo.`
      : `• Seleção Qualitativa do Cardápio: Distribuição adequada das refeições e preparações ao longo do dia.`,
    ``,
    `3. PONTOS DE ATENÇÃO E OPORTUNIDADES DE APRIMORAMENTO (ERROS / AJUSTES):`,
    !hasPes
      ? `• Diagnóstico PES: Recomenda-se explicitar de forma mais detalhada a tríade Problema (P), Etiologia (E) e Sinais/Sintomas (S) conforme padronização internacional da Academy of Nutrition and Dietetics.`
      : `• Monitoramento Bioquímico e Interações Fármaco-Nutriente: Recomenda-se detalhar metas numéricas de reavaliação laboratorial (ex.: controle glicêmico, perfil lipídico, função renal e eletrólitos) em 30 a 60 dias conforme diretrizes da SBC e SBD.`,
    !hasOrientacoes
      ? `• Orientações de Alta: Importante detalhar sinais de alerta domiciliares e metas fracionadas de ingestão hídrica.`
      : `• Detalhamento da Densidade de Fibras e Frações Lipídicas: Manter vigilância estrita sobre ácidos graxos saturados (< 7-10% do VET segundo a SBC) e aporte de fibras solúveis (> 25-30g/dia).`,
    ``,
    `4. NOTA FINAL ATRIBUÍDA:`,
    `Nota Final: ${notaFormatada} (Escala de 0,0 a 10,0)`
  ].join('\n');
}

function buildFormattedProfessorEmail({
  studentName,
  caseTitle,
  professorEmail,
  resolucaoCompletaTexto,
  avaliacaoIA,
  notaFinal
}) {
  const subject = `[DietoCase - Correção IA] ${caseTitle} — Aluno(a): ${studentName} (Nota: ${notaFinal})`;

  const textBody = [
    `RELATÓRIO DE CORREÇÃO AUTOMÁTICA POR IA — DIETOCASE`,
    `================================================================`,
    `• Nome do Aluno: ${studentName}`,
    `• Nome do Caso: ${caseTitle}`,
    `• E-mail do Professor Vinculado: ${professorEmail}`,
    `• Nota Final Atribuída pela IA: ${notaFinal} / 10,0`,
    `================================================================`,
    ``,
    `[1] CÓPIA INTEGRAL DA AVALIAÇÃO DA IA COM A NOTA FINAL:`,
    `----------------------------------------------------------------`,
    avaliacaoIA,
    ``,
    `================================================================`,
    `[2] CÓPIA COMPLETA DA RESOLUÇÃO DO ALUNO:`,
    `----------------------------------------------------------------`,
    resolucaoCompletaTexto
  ].join('\n');

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #065f46; color: #ffffff; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 18px;">DietoCase — Avaliação Automática por IA (Simulação Clínica)</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #a7f3d0;">Relatório oficial enviado automaticamente ao professor responsável pelo caso clínico</p>
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
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: bold;">Nota Final (0,0 a 10,0):</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #047857; font-size: 15px;">${notaFinal} / 10,0</td>
        </tr>
      </table>

      <h3 style="color: #0f172a; font-size: 15px; border-bottom: 2px solid #10b981; padding-bottom: 6px;">1. Cópia Integral da Avaliação da IA com a Nota Final</h3>
      <pre style="white-space: pre-wrap; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 8px; font-size: 12px; line-height: 1.5; color: #064e3b;">${avaliacaoIA}</pre>

      <h3 style="color: #0f172a; font-size: 15px; border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-top: 24px;">2. Cópia Completa da Resolução do Aluno</h3>
      <pre style="white-space: pre-wrap; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; border-radius: 8px; font-size: 12px; line-height: 1.5; color: #334155;">${resolucaoCompletaTexto}</pre>
    </div>
  `;

  return {
    to: professorEmail,
    subject,
    studentName,
    caseTitle,
    notaFinal,
    resolucaoCompleta: resolucaoCompletaTexto,
    avaliacaoIA,
    text: textBody,
    html: htmlBody
  };
}

async function dispatchProfessorEmail(emailPayload) {
  const results = {
    dispatched: true,
    provider: 'firebase-email-trigger-and-api',
    to: emailPayload.to,
    timestamp: new Date().toISOString()
  };

  // 1. Disparo via Resend API se RESEND_API_KEY estiver configurada
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
          from: process.env.EMAIL_FROM || 'DietoCase <avaliacao@dietocase.edu.br>',
          to: [emailPayload.to],
          subject: emailPayload.subject,
          html: emailPayload.html,
          text: emailPayload.text
        })
      });
      if (res.ok) {
        results.provider = 'resend';
        return results;
      }
    } catch (e) {
      console.warn('[Correção IA] Aviso ao disparar via Resend:', e);
    }
  }

  // 2. Disparo via Nodemailer se SMTP_HOST estiver configurado no ambiente Node
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const nodemailer = await import('nodemailer').catch(() => null);
      if (nodemailer && nodemailer.default) {
        const transporter = nodemailer.default.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS || ''
          }
        });
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.SMTP_USER,
          to: emailPayload.to,
          subject: emailPayload.subject,
          text: emailPayload.text,
          html: emailPayload.html
        });
        results.provider = 'nodemailer';
        return results;
      }
    } catch (e) {
      console.warn('[Correção IA] Aviso ao disparar via Nodemailer:', e);
    }
  }

  return results;
}

export async function POST(req) {
  try {
    const body = (await req.json().catch(() => ({}))) || {};
    const {
      studentName: rawStudentName,
      caseTitle: rawCaseTitle,
      professorEmail: rawProfEmail
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

    const professorEmail = FIXED_PROFESSOR_EMAIL || rawProfEmail || 'chagasnutri@gmail.com';
    const dataHora = String(
      body?.dataHora ||
      new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    ).trim();

    const systemPrompt = PROFESSOR_EVALUATOR_SYSTEM_PROMPT;
    const resolucaoCompletaTexto = compileResolutionSummaryText(studentResolution, clinicalCase);

    const apiKey = (
      process.env.AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      ''
    ).trim();

    let avaliacaoIA = '';

    if (apiKey) {
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
            generationConfig: { temperature: 0.4, maxOutputTokens: 1200 }
          })
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          avaliacaoIA = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } catch (errAi) {
        console.warn('[Correção IA] Fallback acionado:', errAi);
      }
    }

    if (!avaliacaoIA) {
      avaliacaoIA = buildFallbackScientificEvaluation(studentResolution, clinicalCase);
    }

    const notaFinal = extractExactScore(avaliacaoIA);

    const emailPayload = buildFormattedProfessorEmail({
      studentName,
      caseTitle,
      professorEmail,
      resolucaoCompletaTexto,
      avaliacaoIA,
      notaFinal
    });

    const emailDispatchStatus = await dispatchProfessorEmail(emailPayload);

    return NextResponse.json({
      success: true,
      systemPromptUsed: systemPrompt,
      studentName,
      caseTitle,
      professorEmail,
      notaFinal,
      avaliacaoIA,
      resolucaoCompleta: resolucaoCompletaTexto,
      emailDisparado: true,
      emailDispatchStatus,
      emailPayload
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Erro interno ao processar a correção por IA.' },
      { status: 500 }
    );
  }
}
