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
    const antroTableRows = [];

    // Peso real ou estimado
    if (antro.pesoAtual) {
      antroTableRows.push(["Peso Atual (Aferido)", `${antro.pesoAtual} kg`, "-"]);
    } else if (antro.pesoEstimadoChumlea) {
      antroTableRows.push(["Peso Estimado (Chumlea 1985)", `${antro.pesoEstimadoChumlea} kg`, "Estimado por CB e AJ (sem peso aferido)"]);
    } else {
      antroTableRows.push(["Peso Atual", "--", "Não aferido"]);
    }

    // Estatura real ou estimada
    if (antro.estatura) {
      antroTableRows.push(["Estatura (Aferida)", `${antro.estatura} m`, "-"]);
    } else if (antro.estaturaEstimadaChumlea) {
      antroTableRows.push(["Estatura Estimada (Chumlea 1985)", `${antro.estaturaEstimadaChumlea} m`, "Estimada por AJ e Idade (sem estatura aferida)"]);
    } else {
      antroTableRows.push(["Estatura", "--", "Não aferida"]);
    }

    antroTableRows.push(["Peso Habitual", `${antro.pesoHabitual || '--'} kg`, "-"]);

    // Parâmetros para Chumlea
    if (antro.alturaJoelho || antro.circBraco) {
      if (antro.alturaJoelho) {
        antroTableRows.push(["Altura do Joelho (AJ)", `${antro.alturaJoelho} cm`, "Parâmetro para equações de Chumlea"]);
      }
      if (antro.circBraco) {
        antroTableRows.push(["Circunferência do Braço (CB)", `${antro.circBraco} cm`, "Obrigatória para estimativa de peso indireto"]);
      }
    }

    // IMC e Classificação
    antroTableRows.push([
      "Índice de Massa Corporal (IMC)",
      `${antro.imc || '--'} kg/m²`,
      antro.classificacaoImc ? `${antro.classificacaoImc} (${antro.criterioClassificacao || 'Critério Clínico'})` : "Não classificado"
    ]);

    if (antro.percentualPerda) {
      antroTableRows.push(["Percentual de Perda Ponderal", `${antro.percentualPerda} %`, `${antro.percentualPerda}% de alteração`]);
    }

    // Circunferências
    if (antro.circCintura || antro.circQuadril || antro.circPanturrilha || antro.circPunho) {
      const circs = [];
      if (antro.circCintura) circs.push(`Cintura: ${antro.circCintura} cm`);
      if (antro.circQuadril) circs.push(`Quadril: ${antro.circQuadril} cm`);
      if (antro.circPanturrilha) circs.push(`Panturrilha (CP): ${antro.circPanturrilha} cm`);
      if (antro.circPunho) circs.push(`Punho: ${antro.circPunho} cm`);
      antroTableRows.push(["Demais Circunferências Corporais", circs.join(" | "), "Adiposidade e reserva muscular"]);
    }

    // Dobras cutâneas
    if (antro.dobraTricipital || antro.dobraSubescapular || antro.dobraBicipital || antro.dobraSuprailiaca || antro.dobraAbdominal || antro.dobraCoxa) {
      const dobras = [];
      if (antro.dobraTricipital) dobras.push(`DCT: ${antro.dobraTricipital} mm`);
      if (antro.dobraSubescapular) dobras.push(`DCSE: ${antro.dobraSubescapular} mm`);
      if (antro.dobraBicipital) dobras.push(`DCB: ${antro.dobraBicipital} mm`);
      if (antro.dobraSuprailiaca) dobras.push(`DCSI: ${antro.dobraSuprailiaca} mm`);
      if (antro.dobraAbdominal) dobras.push(`Abdominal: ${antro.dobraAbdominal} mm`);
      if (antro.dobraCoxa) dobras.push(`Coxa: ${antro.dobraCoxa} mm`);
      antroTableRows.push(["Dobras Cutâneas", dobras.join(" | "), "Compartimento adiposo subcutâneo"]);
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

    if (antro.diagnosticoNutricionalExtenso) {
      doc.addCallout(
        "DIAGNÓSTICO NUTRICIONAL POR EXTENSO (ESTADO PONDERAL):",
        `${antro.diagnosticoNutricionalExtenso} (Critério: ${antro.criterioClassificacao || 'OMS / Lipschitz'})`,
        "2563eb",
        "eff6ff"
      );
    }

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

    if (ca.vetRecordatorio || ca.neeCaso || ca.adequacaoVetPct) {
      doc.addHeading("1.6.1. Avaliação Quantitativa do Recordatório de 24h e Adequação do VET", 3);
      doc.addTable(
        ["Parâmetro de Avaliação Quantitativa", "Valor Obtido", "Interpretação / Referência Oficial"],
        [
          ["VET Consumido (Recordatório 24h)", `${ca.vetRecordatorio || '--'} kcal/dia`, "Calculado a partir do R24h"],
          ["Necessidade Energética Estimada (NEE)", `${ca.neeCaso || '--'} kcal/dia`, "Meta calórica do caso clínico"],
          [
            "% de Adequação do VET",
            `${ca.adequacaoVetPct ? ca.adequacaoVetPct + '%' : '--'}`,
            ca.adequacaoVetClassificacao ? `${ca.adequacaoVetClassificacao}` : "Adequação do aporte calórico"
          ],
          [
            "Base de Dados de Composição Oficial",
            ca.baseAlimentosReferencia || "TACO (UNICAMP, 4ª edição)",
            "Tabela Brasileira de Composição de Alimentos e livros oficiais"
          ]
        ],
        [3200, 2600, 3200]
      );
    }

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
      let alimentosFormatados = ref.alimentos || "";
      if (Array.isArray(ref.itens) && ref.itens.length > 0) {
        const itemLines = ref.itens.map(it => {
          const parts = [];
          if (it.medidaCaseira && String(it.medidaCaseira).trim()) {
            parts.push(String(it.medidaCaseira).trim());
          }
          if (it.gramatura) {
            parts.push(`${it.gramatura}g`);
          }
          let line = it.alimentoNome || "Alimento";
          if (parts.length > 0) {
            line += ` (${parts.join(" - ")})`;
          }
          if (it.kcal !== undefined && it.kcal !== null && it.kcal !== "") {
            line += ` [${it.kcal} kcal]`;
          }
          return "• " + line;
        });
        alimentosFormatados = itemLines.join("\n");
        if (ref.subtotal && (ref.subtotal.kcal || ref.subtotal.cho || ref.subtotal.ptn || ref.subtotal.lip)) {
          alimentosFormatados += `\n[Subtotal: ${ref.subtotal.kcal || 0} kcal | CHO: ${ref.subtotal.cho || 0}g | PTN: ${ref.subtotal.ptn || 0}g | LIP: ${ref.subtotal.lip || 0}g]`;
        }
      }

      cardapioRows.push([
        `${ref.refeicao}\n(${ref.horario || '--:--'})`,
        alimentosFormatados || "Alimentos não especificados",
        ref.substituicoes || "Não descrita"
      ]);
    });

    if (cardapioRows.length > 0) {
      doc.addTable(
        ["Refeição e Horário", "Alimentos, Medidas Caseiras e Gramaturas (TACO)", "Opções de Substituição"],
        cardapioRows,
        [2500, 4800, 1700]
      );
    } else {
      doc.addParagraph("Nenhuma refeição detalhada no planejamento alimentar.");
    }

    // Tabela de Totais Consolidados do Cardápio vs Metas Prescritas
    const totais = studentData.totaisCardapio;
    const hasTotais = totais && (totais.vetTotalKcal > 0 || (Array.isArray(plano) && plano.some(r => r.itens && r.itens.length > 0)));
    if (hasTotais) {
      doc.addHeading("3.1. Consolidação Nutricional do Cardápio vs Metas Prescritas", 2);
      const rowsTotais = [
        ["VET Total Planejado no Cardápio", `${totais.vetTotalKcal || 0} kcal/dia`, `Meta Prescrita: ${presc.vetKcal || '--'} kcal`],
        ["Adequação do VET do Cardápio", `${totais.adequacaoVetPct ? totais.adequacaoVetPct + '%' : '--'}`, `${totais.classificacaoAdequacao || 'Adequação calórica do cardápio'}`],
        ["Carboidratos do Cardápio", `${totais.carboidratosG || 0} g (${totais.carboidratosPct || 0}% do VET)`, `Prescrito: ${presc.carboidratosG || '--'} g (${presc.carboidratosPct || '--'}%)`],
        ["Proteínas do Cardápio", `${totais.proteinasG || 0} g (${totais.proteinasGKg ? totais.proteinasGKg + ' g/kg' : '--'}, ${totais.proteinasPct || 0}%)`, `Prescrito: ${presc.proteinasG || '--'} g (${presc.proteinasGKg || '--'} g/kg)`],
        ["Lipídios do Cardápio", `${totais.lipidiosG || 0} g (${totais.lipidiosPct || 0}% do VET)`, `Prescrito: ${presc.lipidiosG || '--'} g (${presc.lipidiosPct || '--'}%)`],
        ["Fibras Alimentares Totais", `${totais.fibrasG || 0} g/dia`, "Composição oficial TACO (UNICAMP)"]
      ];
      doc.addTable(
        ["Parâmetro Nutricional Consolidado", "Aporte Obtido no Cardápio", "Meta da Prescrição Dietética"],
        rowsTotais,
        [3600, 2800, 2600]
      );
    }

    doc.addHeading(hasTotais ? "3.2. Recomendações e Orientações Dietoterápicas de Alta/Acompanhamento" : "3.1. Recomendações e Orientações Dietoterápicas de Alta/Acompanhamento", 2);
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
