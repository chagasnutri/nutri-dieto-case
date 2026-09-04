// Gerador do Relatório Clínico Completo e Resolução Dietoterápica em formato Microsoft Word (.docx)
// Constrói o documento com tabelas formatadas, seções estilizadas e metadados.

class DietoterapiaDocxReport {
  static buildReportDocument(studentData, clinicalCase) {
    const doc = new MiniDocx();

    const aluno = studentData.aluno || {};
    const patient = clinicalCase.patient || {};
    const anamnese = studentData.anamnese || {};
    const antro = studentData.antropometria || {};
    const bio = studentData.bioquimica || {};
    const ef = studentData.exameFisico || {};
    const ca = studentData.consumoAlimentar || {};
    const pes = studentData.diagnosticoPES || {};
    const presc = studentData.prescricaoDietoterapica || {};
    const plano = studentData.planejamentoAlimentar || [];
    const respostas = studentData.respostasQuestoes || {};

    // 1. CABEÇALHO INSTITUCIONAL
    doc.addParagraph("DIETOCASE - DISCIPLINA DE DIETOTERAPIA", {
      bold: true,
      size: 16,
      color: "166534",
      align: "center",
      spaceBefore: 100,
      spaceAfter: 60
    });

    doc.addParagraph("RELATÓRIO CLÍNICO-NUTRICIONAL E CONDUTA DIETOTERÁPICA", {
      bold: true,
      size: 13,
      color: "334155",
      align: "center",
      spaceBefore: 40,
      spaceAfter: 180
    });

    // 2. IDENTIFICAÇÃO DO ALUNO E CASO (TABELA RESUMO)
    const dataFormatada = aluno.data ? aluno.data.split("-").reverse().join("/") : new Date().toLocaleDateString("pt-BR");
    
    doc.addTable(
      ["DADOS DA AVALIAÇÃO PRÁTICA", "INFORMAÇÕES"],
      [
        ["Estudante de Nutrição:", aluno.nome || "Não informado"],
        ["Matrícula / Turma:", aluno.matriculaTurma || "Não informado"],
        ["Data do Atendimento:", dataFormatada],
        ["Caso Clínico Selecionado:", clinicalCase.title || "Caso Clínico"],
        ["Paciente Simulado:", `${patient.name || 'Paciente'}, ${patient.age || '--'} anos, ${patient.gender || '--'}`]
      ],
      [3500, 5500]
    );

    // 3. SEÇÃO I: PRONTUÁRIO CLÍNICO-NUTRICIONAL CONSTRUÍDO
    doc.addHeading("1. PRONTUÁRIO CLÍNICO-NUTRICIONAL (ANAMNESE)", 1);

    doc.addHeading("1.1. Queixa Principal e História da Doença Atual (HDA)", 2);
    doc.addParagraph(anamnese.queixaPrincipal ? `Queixa Principal: ${anamnese.queixaPrincipal}` : "Queixa Principal: Não preenchida.");
    doc.addParagraph(anamnese.historiaClinica ? `História da Doença Atual: ${anamnese.historiaClinica}` : "História Clínica: Não preenchida.");

    doc.addHeading("1.2. Antecedentes Patológicos, Medicamentos e Estilo de Vida", 2);
    doc.addParagraph(anamnese.antecedentesMedicamentos ? `Antecedentes e Medicamentos: ${anamnese.antecedentesMedicamentos}` : "Antecedentes e Medicamentos: Não preenchido.");
    doc.addParagraph(anamnese.habitosEstiloVida ? `Hábitos de Vida: ${anamnese.habitosEstiloVida}` : "Hábitos de Vida: Não preenchido.");

    doc.addHeading("1.3. Avaliação Antropométrica e Estado Nutricional", 2);
    const antroTableRows = [
      ["Peso Atual", `${antro.pesoAtual || '--'} kg`, "-"],
      ["Peso Habitual", `${antro.pesoHabitual || '--'} kg`, "-"],
      ["Estatura", `${antro.estatura || '--'} m`, "-"],
      ["Altura do Joelho (AJ)", antro.alturaJoelho ? `${antro.alturaJoelho} cm` : "--", "Estimativa de estatura (Chumlea)"],
      ["Índice de Massa Corporal (IMC)", `${antro.imc || '--'} kg/m²`, antro.classificacaoImc || "Não classificado"],
      ["Percentual de Perda Ponderal", `${antro.percentualPerda || '--'} %`, antro.percentualPerda ? `${antro.percentualPerda}% de alteração` : "-"]
    ];

    if (antro.circCintura || antro.circQuadril || antro.circBraco || antro.circPanturrilha) {
      const circs = [];
      if (antro.circCintura) circs.push(`Cintura: ${antro.circCintura} cm`);
      if (antro.circQuadril) circs.push(`Quadril: ${antro.circQuadril} cm`);
      if (antro.circBraco) circs.push(`Braço (CB): ${antro.circBraco} cm`);
      if (antro.circPanturrilha) circs.push(`Panturrilha (CP): ${antro.circPanturrilha} cm`);
      antroTableRows.push(["Circunferências Corporais", circs.join(" | "), "Adiposidade e reserva muscular"]);
    }

    if (antro.dobraTricipital || antro.dobraSubescapular || antro.dobraSuprailiaca || antro.dobraAbdominal) {
      const dobras = [];
      if (antro.dobraTricipital) dobras.push(`DCT: ${antro.dobraTricipital} mm`);
      if (antro.dobraSubescapular) dobras.push(`Subescapular: ${antro.dobraSubescapular} mm`);
      if (antro.dobraSuprailiaca) dobras.push(`Supra-ilíaca: ${antro.dobraSuprailiaca} mm`);
      if (antro.dobraAbdominal) dobras.push(`Abdominal: ${antro.dobraAbdominal} mm`);
      antroTableRows.push(["Dobras Cutâneas", dobras.join(" | "), "Compartimento subcutâneo"]);
    }

    if (antro.demaisAvaliacoes) {
      antroTableRows.push(["Demais Avaliações", antro.demaisAvaliacoes, "Relações (RCQ, CMB, AMB)"]);
    }

    if (antro.circunferenciasDobras) {
      antroTableRows.push(["Resumo Síntese Antropométrica", antro.circunferenciasDobras, "Síntese clínica"]);
    }

    doc.addTable(
      ["Parâmetro Antropométrico", "Valor Coletado", "Classificação / Interpretação"],
      antroTableRows,
      [3000, 2800, 3200]
    );

    doc.addHeading("1.4. Avaliação Bioquímica Relevante", 2);
    doc.addParagraph(bio.examesRelevantes ? `Exames laboratoriais apurados: ${bio.examesRelevantes}` : "Exames apurados: Nenhum exame relatado.");
    doc.addParagraph(bio.interpretacaoNutricional ? `Interpretação nutricional dos exames: ${bio.interpretacaoNutricional}` : "Interpretação nutricional: Não informada.");

    doc.addHeading("1.5. Exame Físico Nutricional e Sinais Clínicos", 2);
    doc.addParagraph(ef.sinaisClinicos ? `Sinais clínicos de carência / integridade: ${ef.sinaisClinicos}` : "Sinais clínicos: Não relatados.");
    doc.addParagraph(ef.massaMuscularAdiposa ? `Avaliação de massa muscular e tecido adiposo: ${ef.massaMuscularAdiposa}` : "Massa muscular/adiposa: Não descrita.");
    doc.addParagraph(ef.condicoesTGIeEdemas ? `Condições orais, TGI e presença de edemas: ${ef.condicoesTGIeEdemas}` : "TGI e edemas: Não informado.");

    doc.addHeading("1.6. Consumo Alimentar e Inquérito Nutricional", 2);
    doc.addParagraph(ca.inqueritoResumo ? `Resumo do Recordatório Alimentar: ${ca.inqueritoResumo}` : "Recordatório: Não preenchido.");
    doc.addParagraph(ca.aguaPreferenciasAversoes ? `Ingestão hídrica, preferências e aversões: ${ca.aguaPreferenciasAversoes}` : "Preferências e aversões: Não informado.");

    // 4. SEÇÃO II: RESOLUÇÃO DIETOTERÁPICA DO CASO
    doc.addHeading("2. RESOLUÇÃO DIETOTERÁPICA E CONDUTA NUTRICIONAL", 1);

    doc.addHeading("2.1. Diagnóstico em Nutrição (Metodologia PES)", 2);
    const pesText = pes.textoCompletoPES || 
      `Problema (P): ${pes.problema || 'Não informado'} | Relacionado a (E): ${pes.etiologia || 'Não informada'} | Evidenciado por (S): ${pes.sinaisSintomas || 'Não informado'}`;
    
    doc.addCallout("DIAGNÓSTICO EM NUTRIÇÃO (PES):", pesText, "15803d", "f0fdf4");

    doc.addHeading("2.2. Determinação das Necessidades Energéticas e de Macronutrientes", 2);
    doc.addTable(
      ["Parâmetro Prescrito", "Valor Numérico", "Unidade / Percentual"],
      [
        ["Valor Energético Total (VET)", presc.vetKcal || "Não calculado", "kcal/dia"],
        ["Regra de bolso / Taxa metabólica", presc.regraBolsoKcalKg || "--", "kcal/kg de peso/dia"],
        ["Carboidratos", `${presc.carboidratosG || '--'} g`, `${presc.carboidratosPct || '--'} % do VET`],
        ["Proteínas", `${presc.proteinasG || '--'} g (${presc.proteinasGKg || '--'} g/kg)`, `${presc.proteinasPct || '--'} % do VET`],
        ["Lipídios", `${presc.lipidiosG || '--'} g`, `${presc.lipidiosPct || '--'} % do VET`],
        ["Consistência da Dieta", presc.consistencia || "Normal", "-"],
        ["Fracionamento", presc.fracionamento || "5 a 6 refeições", "-"]
      ],
      [3500, 2500, 3000]
    );

    if (presc.fibrasMicronutrientes) {
      doc.addParagraph(`Fibras e Micronutrientes Alvo: ${presc.fibrasMicronutrientes}`);
    }

    if (presc.justificativaFisiopatologica) {
      doc.addHeading("2.3. Justificativa Fisiopatológica da Conduta", 2);
      doc.addParagraph(presc.justificativaFisiopatologica);
    }

    // 5. SEÇÃO III: PLANEJAMENTO ALIMENTAR (CARDÁPIO)
    doc.addHeading("3. PLANEJAMENTO ALIMENTAR QUALI-QUANTITATIVO (CARDÁPIO)", 1);
    
    const cardapioRows = [];
    plano.forEach(ref => {
      cardapioRows.push([
        `${ref.refeicao}\n(${ref.horario || '--:--'})`,
        ref.alimentos || "Alimentos não especificados",
        ref.substituicoes || "Não descrita"
      ]);
    });

    if (cardapioRows.length > 0) {
      doc.addTable(
        ["Refeição e Horário", "Alimentos e Medidas Caseiras", "Opções de Substituição"],
        cardapioRows,
        [2500, 4500, 2000]
      );
    } else {
      doc.addParagraph("Nenhuma refeição detalhada no planejamento alimentar.");
    }

    doc.addHeading("3.1. Recomendações e Orientações Dietoterápicas de Alta/Acompanhamento", 2);
    doc.addParagraph(studentData.orientacoesNutricionais || "Nenhuma orientação nutricional específica registrada.");

    // 6. SEÇÃO IV: RESPOSTAS ÀS QUESTÕES AVALIATIVAS DO CASO
    doc.addHeading("4. RESPOSTAS ÀS QUESTÕES AVALIATIVAS DO CASO CLÍNICO", 1);
    const questoes = clinicalCase.questoesAvaliativas || [];

    if (questoes.length === 0) {
      doc.addParagraph("Não foram cadastradas questões avaliativas específicas para este caso clínico.");
    } else {
      questoes.forEach((q, idx) => {
        doc.addHeading(`Questão ${idx + 1}: ${q.pergunta}`, 2);
        const respostaAluno = respostas[q.id] || "Questão não respondida pelo estudante.";
        doc.addCallout(`Resposta do Estudante:`, respostaAluno, "0284c7", "f0f9ff");
      });
    }
    return doc;
  }

  static generateReport(studentData, clinicalCase) {
    const doc = this.buildReportDocument(studentData, clinicalCase);
    const aluno = studentData.aluno || {};
    const cleanStudentName = (aluno.nome || "Estudante").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `DietoCase_Relatorio_${cleanStudentName}_${clinicalCase.id || "caso"}.docx`;
    doc.download(filename);
    return doc;
  }
}
