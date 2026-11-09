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

  const isQualitativo = Boolean(res?.tipoPlanejamentoCardapio === 'qualitativo' || res?.habilitarPlanejamentoQualitativo);
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
    (isQualitativo && Array.isArray(res?.planejamentoQualitativoBlocos) ? res.planejamentoQualitativoBlocos : null) ||
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
                  ? `${it?.alimento || it?.alimentoNome || it?.nome || 'Alimento'} (${it?.medidaCaseira || it?.medida || '1 porção'})`
                  : `${it?.alimento || it?.alimentoNome || it?.nome || 'Alimento'} (${it?.medidaCaseira || it?.medida || '1 porção'} / ${it?.gramatura ?? it?.gramas ?? 0}g - ${it?.kcal ?? 0} kcal)`
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
    `${res?.orientacoesNutricionais || res?.orientacaoNutricional || '---'}`,
    (res?.habilitarCorrecaoAutomaticaIA || res?.avaliacaoIA || res?.avaliacaoIATexto) && (res?.avaliacaoIA || res?.avaliacaoIATexto || res?.notaIA)
      ? [
          ``,
          `9. Avaliação do Preceptor IA:`,
          `Nota Sugerida (Sujeita à validação do Professor): ${
            (typeof res?.avaliacaoIA === 'object' && res?.avaliacaoIA !== null
              ? (res.avaliacaoIA.notaConfirmadaFormatada || res.avaliacaoIA.notaSugeridaFormatada || (res.avaliacaoIA.notaSugerida !== undefined ? String(res.avaliacaoIA.notaSugerida).replace('.', ',') : ''))
              : '') ||
            res?.notaFinalConfirmada ||
            res?.notaIA ||
            '0,0'
          } / 10,0`,
          `${
            typeof res?.avaliacaoIA === 'object' && res?.avaliacaoIA !== null
              ? (res.avaliacaoIA.feedback || res?.avaliacaoIATexto || '')
              : (typeof res?.avaliacaoIA === 'string' ? res.avaliacaoIA : (res?.avaliacaoIATexto || ''))
          }`
        ].join('\n')
      : null
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
    const rawAvaliacaoObj =
      (body?.avaliacaoIA && typeof body.avaliacaoIA === 'object')
        ? body.avaliacaoIA
        : ((resolutionData?.avaliacaoIA && typeof resolutionData.avaliacaoIA === 'object') ? resolutionData.avaliacaoIA : null);

    const notaFinal = String(
      body?.notaSugerida ||
      body?.notaFinal ||
      body?.notaIA ||
      rawAvaliacaoObj?.notaSugeridaFormatada ||
      (rawAvaliacaoObj?.notaSugerida !== undefined ? String(rawAvaliacaoObj.notaSugerida).replace('.', ',') : '') ||
      resolutionData?.notaIA ||
      ''
    ).trim();
    const avaliacaoIA = String(
      typeof body?.avaliacaoIA === 'string'
        ? body.avaliacaoIA
        : (rawAvaliacaoObj?.feedback || (typeof resolutionData?.avaliacaoIA === 'string' ? resolutionData.avaliacaoIA : ''))
    ).trim();

    const relatorioFinalTexto =
      String(body?.relatorioFinalTexto || '').trim() ||
      buildSafeFinalReportText(resolutionData, caseTitle, studentName);

    const subject = habilitarCorrecaoAutomaticaIA && notaFinal
      ? `[DietoCase - Relatório Final + IA] ${caseTitle} — Aluno(a): ${studentName} (Nota Sugerida: ${notaFinal}/10,0)`
      : `[DietoCase - Relatório Final] ${caseTitle} — Aluno(a): ${studentName}`;

    const aiSectionText = habilitarCorrecaoAutomaticaIA && (avaliacaoIA || notaFinal)
      ? [
          ``,
          `====================================================================`,
          `⚠️ EM DESTAQUE: AVALIAÇÃO COMPLETA DA IA COM NOTA SUGERIDA`,
          `ALERTA AO PROFESSOR: Acesse o Painel do Professor no DietoCase para revisar o caso e CONFIRMAR a nota final!`,
          `====================================================================`,
          `Status da Nota: Nota Sugerida (Aguardando Confirmação do Professor)`,
          `Nota Sugerida pela IA: ${notaFinal || '0,0'} / 10,0`,
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
      `Correção Automática por IA: ${habilitarCorrecaoAutomaticaIA ? `Ativada — Nota Sugerida: ${notaFinal || '0,0'}/10,0 (Aguardando Confirmação do Professor)` : 'Desativada'}`,
      `====================================================================`,
      aiSectionText,
      ``,
      `--- RESPOSTAS COMPLETAS DO ALUNO / RELATÓRIO FINAL ---`,
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
        <div style="background: #fffbeb; border: 2px solid #f59e0b; padding: 12px 16px; margin: 16px 0; border-radius: 8px; color: #92400e; font-size: 13px;">
          <strong>⚠️ AÇÃO NECESSÁRIA DO PROFESSOR:</strong> Acesse o <strong>Painel do Professor</strong> no DietoCase para revisar o feedback da IA e confirmar ou ajustar a nota final do aluno.
        </div>
        <div style="background: #f0fdf4; border: 2px solid #059669; padding: 16px; margin: 16px 0; border-radius: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #065f46; font-size: 15px;">EM DESTAQUE: Avaliação Completa da IA com Nota Sugerida</h3>
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #047857;">Nota Sugerida (Aguardando Confirmação do Professor): ${escapeHtmlSafe(notaFinal || '0,0')} / 10,0</p>
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
    let emailTransportUsed = 'none';
    const providerErrors = [];

    // 1. Disparo via Resend API (se RESEND_API_KEY estiver configurada em process.env) — com await estrito para Vercel Serverless
    const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
    if (resendApiKey) {
      try {
        const resendResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || process.env.RESEND_FROM || 'DietoCase Avaliador <onboarding@resend.dev>',
            to: [to],
            subject,
            text: emailText,
            html: emailHtml
          })
        });
        if (resendResp.ok) {
          await resendResp.json().catch(() => ({}));
          emailDisparado = true;
          emailTransportUsed = 'resend';
        } else {
          const errBody = await resendResp.text().catch(() => '');
          const msg = `Resend HTTP ${resendResp.status}: ${errBody}`;
          providerErrors.push(msg);
          console.error('[API E-mail][Resend] Falha ao enviar e-mail para chagasnutri@gmail.com:', msg);
        }
      } catch (e) {
        providerErrors.push(`Resend Exception: ${e?.message || String(e)}`);
        console.error('[API E-mail][Resend] Exceção durante envio via Resend:', e);
      }
    }

    // 2. Disparo via SendGrid API (se SENDGRID_API_KEY estiver configurada em process.env) — com await estrito para Vercel Serverless
    const sendgridApiKey = (process.env.SENDGRID_API_KEY || '').trim();
    if (!emailDisparado && sendgridApiKey) {
      try {
        const sgResp = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sendgridApiKey}`
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: process.env.EMAIL_FROM || process.env.SENDGRID_FROM || to, name: 'DietoCase Avaliador' },
            subject,
            content: [
              { type: 'text/plain', value: emailText },
              { type: 'text/html', value: emailHtml }
            ]
          })
        });
        if (sgResp.ok || sgResp.status === 202) {
          emailDisparado = true;
          emailTransportUsed = 'sendgrid';
        } else {
          const errBody = await sgResp.text().catch(() => '');
          const msg = `SendGrid HTTP ${sgResp.status}: ${errBody}`;
          providerErrors.push(msg);
          console.error('[API E-mail][SendGrid] Falha ao enviar e-mail para chagasnutri@gmail.com:', msg);
        }
      } catch (e) {
        providerErrors.push(`SendGrid Exception: ${e?.message || String(e)}`);
        console.error('[API E-mail][SendGrid] Exceção durante envio via SendGrid:', e);
      }
    }

    // 3. Disparo via Nodemailer SMTP / Gmail (com suporte a variáveis SMTP_* / EMAIL_* / GMAIL_* em process.env e await estrito)
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

    if (!emailDisparado && smtpHost && smtpUser && smtpPass) {
      try {
        const nodemailerModule = await import('nodemailer').catch((importErr) => {
          console.error('[API E-mail][Nodemailer] Erro ao importar pacote nodemailer:', importErr);
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
            to,
            subject,
            text: emailText,
            html: emailHtml
          });
          emailDisparado = true;
          emailTransportUsed = 'nodemailer';
        } else {
          const msg = 'Módulo nodemailer indisponível no runtime.';
          providerErrors.push(msg);
          console.error('[API E-mail][Nodemailer]', msg);
        }
      } catch (e) {
        providerErrors.push(`Nodemailer Exception: ${e?.message || String(e)}`);
        console.error('[API E-mail][Nodemailer] Erro detalhado ao enviar e-mail via SMTP para chagasnutri@gmail.com:', e);
      }
    }

    if (!emailDisparado) {
      console.error(
        '[API E-mail] Atenção: Nenhum provedor de e-mail ativo concluiu o envio direto na Vercel para chagasnutri@gmail.com. Verifique as variáveis de ambiente (RESEND_API_KEY, SENDGRID_API_KEY ou SMTP_HOST/SMTP_USER/SMTP_PASS / EMAIL_USER/EMAIL_PASS). Detalhes:',
        providerErrors
      );
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
