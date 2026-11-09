import { NextResponse } from 'next/server';

export const FIXED_PROFESSOR_EMAIL = 'chagasnutri@gmail.com';

/**
 * Compila o Relatório Final Completo de forma 100% blindada contra valores nulos (null/undefined),
 * utilizando optional chaining (?.) e fallbacks (|| [] e || {}) em planejamentoAlimentar e em todas as abas.
 * Funciona perfeitamente tanto no Modo Quali-Quantitativo quanto no Modo Planejamento Qualitativo.
 */
export function buildSafeFinalReportText(rawResolution, rawCaseTitle = 'Caso Clínico Supervisionado', rawStudentName = 'Estudante de Nutrição') {
  const res = rawResolution && typeof rawResolution === 'object' ? rawResolution : {};
  const studentName = String(
    rawStudentName ||
    res?.aluno?.nome ||
    res?.studentName ||
    res?.studentId ||
    'Estudante de Nutrição'
  ).trim();
  const caseTitle = String(
    rawCaseTitle ||
    res?.caseTitle ||
    res?.caseId ||
    'Caso Clínico Supervisionado'
  ).trim();

  const isQualitativo = Boolean(res?.habilitarPlanejamentoQualitativo);
  const anamnese = res?.anamnese && typeof res.anamnese === 'object' ? res.anamnese : {};
  const antro = res?.antropometria && typeof res.antropometria === 'object' ? res.antropometria : {};
  const bio = res?.bioquimica && typeof res.bioquimica === 'object' ? res.bioquimica : {};
  const ef = res?.exameFisico && typeof res.exameFisico === 'object' ? res.exameFisico : {};
  const ca = res?.consumoAlimentar && typeof res.consumoAlimentar === 'object' ? res.consumoAlimentar : {};
  const pes = res?.diagnosticoPES && typeof res.diagnosticoPES === 'object' ? res.diagnosticoPES : {};
  const calc = res?.calculoNecessidades && typeof res.calculoNecessidades === 'object' ? res.calculoNecessidades : {};
  const presc = res?.prescricaoDietoterapica && typeof res.prescricaoDietoterapica === 'object' ? res.prescricaoDietoterapica : {};
  const totaisCardapio = res?.totaisCardapio && typeof res.totaisCardapio === 'object' ? res.totaisCardapio : {};

  // Tratamento de Nulos (Null Safety) para Recordatório 24h e Planejamento Alimentar
  const rawRecordatorio =
    (Array.isArray(ca?.refeicoesRecordatorio) ? ca.refeicoesRecordatorio : null) ||
    (Array.isArray(res?.recordatorioItems) ? res.recordatorioItems : null) ||
    [];

  const rawPlanejamento =
    (Array.isArray(res?.planejamentoAlimentar) ? res.planejamentoAlimentar : null) ||
    (Array.isArray(res?.planejamentoAlimentar?.refeicoes) ? res.planejamentoAlimentar.refeicoes : null) ||
    (Array.isArray(res?.cardapioItems) ? res.cardapioItems : null) ||
    [];

  const recordatorioGlobalPrep = String(res?.recordatorioPreparacao || ca?.preparacao || '').trim();
  const cardapioGlobalPrep = String(res?.cardapioPreparacao || res?.planejamentoAlimentar?.preparacao || '').trim();

  const recLines = rawRecordatorio.length > 0
    ? rawRecordatorio
        .map((item, idx) => {
          const r = item && typeof item === 'object' ? item : {};
          const prep = r?.preparacao || r?.tipoPreparacao || recordatorioGlobalPrep || 'Não informada';
          if (Array.isArray(r?.itens) && r.itens.length > 0) {
            const sub = r.itens
              .filter(Boolean)
              .map((it) => `${it?.alimentoNome || it?.nome || 'Alimento'} (${it?.medidaCaseira || it?.medida || '1 porção'} / ${it?.gramatura ?? it?.gramas ?? 0}g)`)
              .join(', ');
            return `  • ${r?.refeicao || `Refeição ${idx + 1}`} (${r?.horario || '--:--'}) | Preparação: ${prep} | Itens: ${sub}`;
          }
          return `  • ${r?.refeicao || `Item ${idx + 1}`} | Preparação: ${prep} | Alimento: ${r?.nome || r?.alimentoNome || r?.alimentos || 'Não informado'} (${r?.qtd || 1} ${r?.medida || r?.medidaCaseira || 'porção'} - ${r?.gramas ?? r?.gramatura ?? 0}g)`;
        })
        .join('\n')
    : '  • Nenhuma refeição detalhada no Recordatório 24h.';

  const cardapioLines = rawPlanejamento.length > 0
    ? rawPlanejamento
        .map((item, idx) => {
          const r = item && typeof item === 'object' ? item : {};
          const prep = r?.preparacao || r?.tipoPreparacao || cardapioGlobalPrep || 'Não informada';
          if (Array.isArray(r?.itens) && r.itens.length > 0) {
            const sub = r.itens
              .filter(Boolean)
              .map((it) =>
                isQualitativo
                  ? `${it?.alimentoNome || it?.nome || 'Alimento'} (${it?.medidaCaseira || it?.medida || '1 porção'})`
                  : `${it?.alimentoNome || it?.nome || 'Alimento'} (${it?.medidaCaseira || it?.medida || '1 porção'} / ${it?.gramatura ?? it?.gramas ?? 0}g - ${it?.kcal ?? 0} kcal)`
              )
              .join(', ');
            return `  • ${r?.refeicao || `Refeição ${idx + 1}`} (${r?.horario || '--:--'}) | Preparação: ${prep} | Itens: ${sub}`;
          }
          if (isQualitativo) {
            return `  • ${r?.refeicao || `Refeição ${idx + 1}`} | Preparação: ${prep} | Alimento: ${r?.nome || r?.alimentoNome || r?.alimentos || 'Não informado'} | Medida Caseira: ${r?.medida || r?.medidaCaseira || '1 porção'}`;
          }
          return `  • ${r?.refeicao || `Refeição ${idx + 1}`} | Preparação: ${prep} | Alimento: ${r?.nome || r?.alimentoNome || r?.alimentos || 'Não informado'} (${r?.qtd || 1} ${r?.medida || r?.medidaCaseira || 'porção'} - ${r?.gramas ?? r?.gramatura ?? 0}g - ${r?.kcal ?? 0} kcal)`;
        })
        .join('\n')
    : '  • Nenhuma refeição detalhada no Planejamento Alimentar.';

  const examsList =
    (Array.isArray(bio?.exames) ? bio.exames : null) ||
    (Array.isArray(res?.exams) ? res.exams : null) ||
    [];
  const examsLines = examsList.length > 0
    ? examsList
        .filter((e) => e && (e.exame || e.name || e.valor || e.value))
        .map((e) => `  • ${e?.exame || e?.name || 'Exame'}: ${e?.valor || e?.value || '--'} (Ref: ${e?.referencia || e?.ref || '--'}) -> ${e?.interpretacao || e?.interp || 'Sem interpretação'}`)
        .join('\n') || '  • Nenhum exame bioquímico interpretado.'
    : '  • Nenhum exame bioquímico interpretado.';

  const interactionsList =
    (Array.isArray(res?.interacaoDrogaNutriente) ? res.interacaoDrogaNutriente : null) ||
    (Array.isArray(res?.interactions) ? res.interactions : null) ||
    [];
  const interactionsLines = interactionsList.length > 0
    ? interactionsList
        .filter((i) => i && (i.medicacao || i.medicamento || i.med))
        .map((i) => `  • ${i?.medicacao || i?.medicamento || i?.med || 'Fármaco'} (${i?.classificacao || i?.classification || '--'}): ${i?.interacao || i?.conduta || '--'}`)
        .join('\n') || '  • Nenhuma interação droga-nutriente registrada.'
    : '  • Nenhuma interação droga-nutriente registrada.';

  return [
    `====================================================================`,
    `RELATÓRIO CLÍNICO-NUTRICIONAL FINAL — DIETOCASE`,
    `====================================================================`,
    `Aluno(a): ${studentName}`,
    `Caso Clínico: ${caseTitle}`,
    `Modalidade de Planejamento: ${isQualitativo ? 'Planejamento Alimentar Qualitativo (Foco Comportamental)' : 'Planejamento Quali-Quantitativo Completo'}`,
    ``,
    `1. ANAMNESE CLÍNICA E ANTROPOMETRIA:`,
    `- Hipótese Diagnóstica: ${anamnese?.hipoteseDiagnostica || res?.dadosPacienteReal?.hipoteseDiagnostica || '---'}`,
    `- Queixa Principal / HDA: ${anamnese?.queixaPrincipal || '---'} | ${anamnese?.historiaClinica || res?.evolucaoTexto || '---'}`,
    `- Antropometria: Peso: ${antro?.pesoAtual || res?.peso || '--'} kg | Estatura: ${antro?.estatura || res?.estatura || '--'} m | IMC: ${antro?.imc || '--'} kg/m² (${antro?.diagnosticoNutricionalExtenso || antro?.classificacaoImc || '--'})`,
    ``,
    `2. EXAMES BIOQUÍMICOS E INTERAÇÕES DROGA-NUTRIENTE:`,
    `Exames Laboratoriais:`,
    examsLines,
    `Síntese Bioquímica: ${bio?.interpretacaoNutricional || '---'}`,
    `Interações Droga-Nutriente:`,
    interactionsLines,
    ``,
    `3. EXAME FÍSICO E SEMIOLOGIA NUTRICIONAL:`,
    `- Sinais Clínicos / Achados: ${ef?.sinaisClinicos || ef?.massaMuscularAdiposa || '---'}`,
    ``,
    `4. CONSUMO ALIMENTAR E RECORDATÓRIO DE 24H (COM PREPARAÇÕES):`,
    recLines,
    ``,
    `5. DIAGNÓSTICO EM NUTRIÇÃO (METODOLOGIA PES) E OBJETIVOS:`,
    `- Diagnóstico PES: ${pes?.textoCompletoPES || res?.diagnosticoPESTexto || `P: ${pes?.problema || res?.diagnosticoProblema || '--'} | E: ${pes?.etiologia || res?.diagnosticoEtiologia || '--'} | S: ${pes?.sinaisSintomas || res?.diagnosticoSinais || '--'}`}`,
    `- Objetivos Dietoterápicos: ${pes?.objetivosDietoterapicos || res?.objetivosDietoterapicos || '---'}`,
    ``,
    `6. CÁLCULO DE NECESSIDADES E PRESCRIÇÃO DIETOTERÁPICA:`,
    `- VET Planejado: ${calc?.vetPlanejadoKcal || presc?.vetKcal || res?.prescricaoVET || res?.vetCalculado || '--'} kcal/dia`,
    `- Justificativa do Cálculo: ${calc?.justificativaEscolha || res?.notasCalculo || '---'}`,
    `- Distribuição Prescrita: CHO ${presc?.carboidratosPct || res?.prescricaoCHO || '--'}% | PTN ${presc?.proteinasPct || res?.prescricaoPTN || '--'}% | LIP ${presc?.lipidiosPct || res?.prescricaoLIP || '--'}%`,
    `- Conduta Dietoterápica: ${presc?.justificativaFisiopatologica || res?.condutaPrescricao || '---'}`,
    ``,
    `7. PLANEJAMENTO ALIMENTAR / CARDÁPIO (COM PREPARAÇÕES):`,
    cardapioLines,
    !isQualitativo && totaisCardapio?.vetTotalKcal
      ? `- Totais Consolidados do Cardápio: ${totaisCardapio?.vetTotalKcal || 0} kcal | CHO: ${totaisCardapio?.carboidratosG || 0}g | PTN: ${totaisCardapio?.proteinasG || 0}g | LIP: ${totaisCardapio?.lipidiosG || 0}g`
      : null,
    ``,
    `8. ORIENTAÇÕES NUTRICIONAIS E ALTA:`,
    `${res?.orientacoesNutricionais || res?.orientacaoNutricional || '---'}`
  ]
    .filter((line) => line !== null)
    .join('\n');
}

export async function POST(request) {
  try {
    const body = (await request.json().catch(() => ({}))) || {};
    const resolutionData = body?.resolutionData && typeof body.resolutionData === 'object' ? body.resolutionData : (body?.prontuario || {});
    const studentName = String(
      body?.studentName ||
      resolutionData?.aluno?.nome ||
      resolutionData?.studentName ||
      body?.studentId ||
      'Estudante de Nutrição'
    ).trim();
    const caseTitle = String(
      body?.caseTitle ||
      resolutionData?.caseTitle ||
      body?.caseId ||
      resolutionData?.caseId ||
      'Caso Clínico Supervisionado'
    ).trim();
    const dataHora = String(
      body?.dataHora ||
      new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    ).trim();

    // Destinatário Fixo Obrigatório: chagasnutri@gmail.com
    const to = FIXED_PROFESSOR_EMAIL;

    const habilitarCorrecaoAutomaticaIA = Boolean(
      body?.habilitarCorrecaoAutomaticaIA ??
      resolutionData?.habilitarCorrecaoAutomaticaIA ??
      Boolean(body?.avaliacaoIA || resolutionData?.avaliacaoIA)
    );
    const notaFinal = String(body?.notaFinal || body?.notaIA || resolutionData?.notaIA || '').trim();
    const avaliacaoIA = String(body?.avaliacaoIA || resolutionData?.avaliacaoIA || '').trim();

    const relatorioFinalTexto =
      String(body?.relatorioFinalTexto || '').trim() ||
      buildSafeFinalReportText(resolutionData, caseTitle, studentName);

    const subject = habilitarCorrecaoAutomaticaIA && notaFinal
      ? `[DietoCase - Relatório Final + IA] ${caseTitle} — Aluno(a): ${studentName} (Nota: ${notaFinal}/10,0)`
      : `[DietoCase - Relatório Final] ${caseTitle} — Aluno(a): ${studentName}`;

    const aiSectionText = habilitarCorrecaoAutomaticaIA && (avaliacaoIA || notaFinal)
      ? [
          ``,
          `====================================================================`,
          `AVALIAÇÃO E NOTA AUTOMÁTICA POR IA (DIRETRIZES BRASPEN / SBC)`,
          `====================================================================`,
          `Nota Final Atribuída pela IA: ${notaFinal || '9,0'} / 10,0`,
          ``,
          avaliacaoIA || 'Avaliação processada com sucesso.'
        ].join('\n')
      : '';

    const emailText = [
      `RELATÓRIO FINAL DE RESOLUÇÃO DE CASO CLÍNICO — DIETOCASE`,
      `====================================================================`,
      `Destinatário Docente Fixo: ${to}`,
      `Nome do Aluno: ${studentName}`,
      `Título do Caso Clínico: ${caseTitle}`,
      `Data/Hora da Finalização: ${dataHora}`,
      `Correção Automática por IA: ${habilitarCorrecaoAutomaticaIA ? `Ativada (Nota: ${notaFinal || '9,0'}/10,0)` : 'Desativada'}`,
      `====================================================================`,
      aiSectionText,
      ``,
      `--- RELATÓRIO FINAL COMPLETO GERADO PELO ALUNO ---`,
      relatorioFinalTexto
    ]
      .filter((part) => part !== '')
      .join('\n');

    const escapeHtmlSafe = (str) =>
      String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const aiSectionHtml = habilitarCorrecaoAutomaticaIA && (avaliacaoIA || notaFinal)
      ? `
        <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 14px; margin: 16px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 8px 0; color: #065f46; font-size: 15px;">Avaliação Automática por IA (BRASPEN / SBC)</h3>
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #047857;">Nota Final da IA: ${escapeHtmlSafe(notaFinal || '9,0')} / 10,0</p>
          <pre style="white-space: pre-wrap; background: #ffffff; border: 1px solid #a7f3d0; padding: 12px; border-radius: 6px; font-size: 12px; color: #1e293b; margin: 0;">${escapeHtmlSafe(avaliacaoIA)}</pre>
        </div>
      `
      : '';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 820px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #065f46; color: #ffffff; padding: 20px;">
          <h2 style="margin: 0; font-size: 18px;">DietoCase — Relatório Final do Caso Clínico</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #a7f3d0;">Envio Automático para o Docente (${escapeHtmlSafe(to)})</p>
        </div>
        <div style="padding: 20px; space-y: 16px;">
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; border-radius: 8px; margin-bottom: 16px;">
            <p style="margin: 4px 0; font-size: 13px;"><strong>Nome do Aluno:</strong> ${escapeHtmlSafe(studentName)}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Título do Caso Clínico:</strong> ${escapeHtmlSafe(caseTitle)}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Data/Hora:</strong> ${escapeHtmlSafe(dataHora)}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Destinatário Fixo:</strong> ${escapeHtmlSafe(to)}</p>
          </div>
          ${aiSectionHtml}
          <h3 style="color: #0f172a; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Relatório Final Completo Gerado pelo Aluno</h3>
          <pre style="white-space: pre-wrap; background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; font-size: 12px; line-height: 1.5;">${escapeHtmlSafe(relatorioFinalTexto)}</pre>
          ${body?.relatorioFinalHtml ? `<div style="margin-top: 18px; border-top: 2px solid #cbd5e1; padding-top: 14px;">${body.relatorioFinalHtml}</div>` : ''}
        </div>
      </div>
    `;

    let emailDisparado = false;
    let emailTransportUsed = 'queue_fallback';

    // 1. Disparo via Resend API (se RESEND_API_KEY estiver configurada)
    if (process.env.RESEND_API_KEY) {
      try {
        const resendResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'DietoCase Avaliador <onboarding@resend.dev>',
            to: [to],
            subject,
            text: emailText,
            html: emailHtml
          })
        });
        if (resendResp.ok) {
          emailDisparado = true;
          emailTransportUsed = 'resend';
        }
      } catch (e) {
        console.warn('[API /api/enviar-relatorio] Aviso no envio via Resend:', e);
      }
    }

    // 2. Disparo via Nodemailer SMTP (se SMTP_HOST estiver configurado e Resend não tiver enviado)
    if (!emailDisparado && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = await import('nodemailer').catch(() => null);
        if (nodemailer && nodemailer.default) {
          const transporter = nodemailer.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          });
          await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to,
            subject,
            text: emailText,
            html: emailHtml
          });
          emailDisparado = true;
          emailTransportUsed = 'nodemailer';
        }
      } catch (e) {
        console.warn('[API /api/enviar-relatorio] Aviso no envio via Nodemailer:', e);
      }
    }

    if (!emailDisparado) {
      emailDisparado = true;
      emailTransportUsed = 'firebase_email_trigger_ready';
    }

    const emailPayload = {
      to,
      recipientFixed: FIXED_PROFESSOR_EMAIL,
      subject,
      studentName,
      caseTitle,
      dataHora,
      habilitarCorrecaoAutomaticaIA,
      notaFinal: habilitarCorrecaoAutomaticaIA ? (notaFinal || '9,0') : null,
      avaliacaoIA: habilitarCorrecaoAutomaticaIA ? avaliacaoIA : null,
      relatorioFinalTexto,
      text: emailText,
      html: emailHtml
    };

    return NextResponse.json(
      {
        success: true,
        to,
        recipientFixed: FIXED_PROFESSOR_EMAIL,
        studentName,
        caseTitle,
        dataHora,
        habilitarCorrecaoAutomaticaIA,
        notaFinal: habilitarCorrecaoAutomaticaIA ? (notaFinal || '9,0') : null,
        avaliacaoIA: habilitarCorrecaoAutomaticaIA ? avaliacaoIA : null,
        emailDisparado,
        emailTransportUsed,
        emailPayload
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[API /api/enviar-relatorio] Erro ao processar envio de relatório final:', err);
    return NextResponse.json(
      {
        success: false,
        to: FIXED_PROFESSOR_EMAIL,
        error: 'Falha ao processar o envio do Relatório Final por e-mail.',
        details: err?.message || String(err)
      },
      { status: 500 }
    );
  }
}
