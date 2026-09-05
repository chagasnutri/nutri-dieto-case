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

    doc.addHeading("1.4. Avaliação Bioquímica Relevante e Raciocínio Clínico", 2);
    const caseBio = clinicalCase.bioquimica || [];
    const interps = bio.interpretacoes || {};

    if (Array.isArray(caseBio) && caseBio.length > 0) {
      const bioRows = caseBio.map(item => {
        const evalRes = (typeof evaluateBiochemicalExam === "function")
          ? evaluateBiochemicalExam(item.valor, item.referencia)
          : { label: "Apurado", seta: "" };
        const statusStr = evalRes.seta ? `${item.valor} [${evalRes.label} ${evalRes.seta}]` : `${item.valor} [${evalRes.label}]`;
        const interpAluno = interps[item.exame] || "Não informada individualmente.";
        return [
          item.exame || "Exame",
          item.referencia || "-",
          statusStr,
          interpAluno
        ];
      });

      doc.addTable(
        ["Exame Bioquímico", "Valor de Referência", "Valor Achado (Status)", "Interpretação Clínica do Aluno"],
        bioRows,
        [2600, 2000, 2000, 2400]
      );
    } else if (bio.examesRelevantes) {
      doc.addParagraph(`Exames laboratoriais apurados: ${bio.examesRelevantes}`);
    } else {
      doc.addParagraph("Nenhum exame laboratorial relatado.");
    }

    if (bio.interpretacaoNutricional) {
      doc.addCallout(
        "SÍNTESE E RACIOCÍNIO CLÍNICO-NUTRICIONAL GLOBAL:",
        bio.interpretacaoNutricional,
        "059669",
        "ecfdf5"
      );
    }

    doc.addHeading("1.5. Exame Físico Nutricional e Sinais Clínicos", 2);
    doc.addParagraph(ef.sinaisClinicos ? `Sinais clínicos de carência / integridade: ${ef.sinaisClinicos}` : "Sinais clínicos: Não relatados.");
    doc.addParagraph(ef.massaMuscularAdiposa ? `Avaliação de massa muscular e tecido adiposo: ${ef.massaMuscularAdiposa}` : "Massa muscular/adiposa: Não descrita.");
    doc.addParagraph(ef.condicoesTGIeEdemas ? `Condições orais, TGI e presença de edemas: ${ef.condicoesTGIeEdemas}` : "TGI e edemas: Não informado.");

    doc.addHeading("1.6. Consumo Alimentar e Inquérito Nutricional", 2);
    doc.addParagraph(ca.inqueritoResumo ? `Resumo do Recordatório Alimentar: ${ca.inqueritoResumo}` : "Recordatório: Não preenchido.");
    doc.addParagraph(ca.aguaPreferenciasAversoes ? `Ingestão hídrica, preferências e aversões: ${ca.aguaPreferenciasAversoes}` : "Preferências e aversões: Não informado.");

    // Detalhamento das refeições cadastradas no Recordatório de 24h
    const recMeals = ca.refeicoesRecordatorio || [];
    if (Array.isArray(recMeals) && recMeals.some(r => r.itens && r.itens.length > 0)) {
      doc.addHeading("1.6.1. Refeições e Alimentos Referidos no Recordatório de 24h", 3);
      const recRows = [];
      recMeals.forEach(ref => {
        if (ref.itens && ref.itens.length > 0) {
          const itemLines = ref.itens.map(it => {
            const parts = [];
            if (it.medidaCaseira && String(it.medidaCaseira).trim()) parts.push(String(it.medidaCaseira).trim());
            if (it.gramatura) parts.push(`${it.gramatura}g`);
            let line = it.alimentoNome || "Alimento";
            if (parts.length > 0) line += ` (${parts.join(" - ")})`;
            if (it.kcal !== undefined && it.kcal !== null && it.kcal !== "") line += ` [${it.kcal} kcal]`;
            return "• " + line;
          });
          let desc = itemLines.join("\n");
          if (ref.tipoPreparacao) {
            desc = `Preparação: ${ref.tipoPreparacao}\n` + desc;
          }
          if (ref.subtotal) {
            desc += `\n[Subtotal: ${ref.subtotal.kcal || 0} kcal | CHO: ${ref.subtotal.cho || 0}g | PTN: ${ref.subtotal.ptn || 0}g | LIP: ${ref.subtotal.lip || 0}g]`;
          }
          recRows.push([
            `${ref.refeicao}\n(${ref.horario || '--:--'})`,
            desc
          ]);
        }
      });
      if (recRows.length > 0) {
        doc.addTable(
          ["Refeição e Horário", "Alimentos, Medidas Caseiras e Gramaturas (TACO)"],
          recRows,
          [3000, 6000]
        );
      }
    }

    // Tabela Quantitativa Consolidada do Recordatório de 24h
    const recTotals = ca.totaisRecordatorio;
    if (recTotals && (recTotals.vetTotalKcal > 0 || ca.vetRecordatorio)) {
      doc.addHeading("1.6.2. Avaliação Quantitativa Consolidada do Recordatório de 24h (Macros e Micros)", 3);
      const rowsRecTotais = [
        ["VET Consumido no Recordatório", `${recTotals.vetTotalKcal || ca.vetRecordatorio || '--'} kcal/dia`, `NEE do Caso: ${ca.neeCaso || '--'} kcal/dia (${ca.adequacaoVetPct || recTotals.adequacaoVetPct || '--'}% da meta)`],
        ["Carboidratos Consumidos", `${recTotals.carboidratosG || 0} g (${recTotals.carboidratosPct || 0}% do VET)`, recTotals.statusMacros?.cho ? `Status frente à prescrição: ${recTotals.statusMacros.cho.label}` : "--"],
        ["Proteínas Consumidas", `${recTotals.proteinasG || 0} g (${recTotals.proteinasGKg ? recTotals.proteinasGKg + ' g/kg' : '--'}, ${recTotals.proteinasPct || 0}%)`, recTotals.statusMacros?.ptn ? `Status frente à prescrição: ${recTotals.statusMacros.ptn.label}` : "--"],
        ["Lipídios Consumidos", `${recTotals.lipidiosG || 0} g (${recTotals.lipidiosPct || 0}% do VET)`, recTotals.statusMacros?.lip ? `Status frente à prescrição: ${recTotals.statusMacros.lip.label}` : "--"],
        ["Fibras Alimentares Totais", `${recTotals.fibrasG || 0} g/dia`, "TACO (UNICAMP, 4ª edição)"],
        ["Cálcio (Ca) Consumido", `${recTotals.calcioMg || 0} mg/dia`, "Micronutriente oficial TACO"],
        ["Ferro (Fe) Consumido", `${recTotals.ferroMg || 0} mg/dia`, "Micronutriente oficial TACO"],
        ["Sódio (Na) Consumido", `${recTotals.sodioMg || 0} mg/dia`, "Micronutriente oficial TACO"],
        ["Potássio (K) Consumido", `${recTotals.potassioMg || 0} mg/dia`, "Micronutriente oficial TACO"]
      ];
      doc.addTable(
        ["Parâmetro Nutricional Consumido", "Total Ingerido no R24h", "Régua da Prescrição / Observação Oficial"],
        rowsRecTotais,
        [3400, 2800, 2800]
      );
    }

    // 4. SEÇÃO II: RESOLUÇÃO DIETOTERÁPICA DO CASO
    doc.addHeading("2. RESOLUÇÃO DIETOTERÁPICA E CONDUTA NUTRICIONAL", 1);

    doc.addHeading("2.1. Diagnóstico em Nutrição (Metodologia PES)", 2);
    const pesText = pes.textoCompletoPES || 
      `Problema (P): ${pes.problema || 'Não informado'} | Relacionado a (E): ${pes.etiologia || 'Não informada'} | Evidenciado por (S): ${pes.sinaisSintomas || 'Não informado'}`;
    
    doc.addCallout("DIAGNÓSTICO EM NUTRIÇÃO (PES):", pesText, "15803d", "f0fdf4");

    if (pes.objetivosDietoterapicos) {
      doc.addHeading("2.1.1. Objetivos Dietoterápicos e Metas do Cuidado", 3);
      doc.addParagraph(pes.objetivosDietoterapicos);
    }

    // 2.2. Cálculos de Necessidades Energéticas e Equações Preditivas
    const calc = studentData.calculoNecessidades || {};
    const formulasSel = Array.isArray(calc.formulasSelecionadas) ? calc.formulasSelecionadas : [];
    if (formulasSel.length > 0 || calc.vetPlanejadoKcal) {
      doc.addHeading("2.2. Cálculos de Necessidades Energéticas e Equações Preditivas", 2);
      
      const formulaRows = [];

      if (formulasSel.includes("bolso") || calc.bolso?.resultadoKcal) {
        const b = calc.bolso || {};
        const faixa = (b.minKcalKg || b.maxKcalKg) ? `${b.minKcalKg || '--'} a ${b.maxKcalKg || '--'} kcal/kg` : "Faixa personalizada";
        formulaRows.push(["Fórmula de Bolso (Regra Prática)", faixa, b.resultadoKcal ? `${b.resultadoKcal} kcal/dia` : "Não informado"]);
      }
      if (formulasSel.includes("harrisBenedict") || calc.harrisBenedict?.resultadoKcal) {
        formulaRows.push(["Harris-Benedict (1919/1984)", "GEB × Fator Atividade × Fator Injúria", calc.harrisBenedict?.resultadoKcal ? `${calc.harrisBenedict.resultadoKcal} kcal/dia` : "Não informado"]);
      }
      if (formulasSel.includes("mifflin") || calc.mifflin?.resultadoKcal) {
        formulaRows.push(["Mifflin-St Jeor (1990)", "TMB × NAF (Diretriz AND)", calc.mifflin?.resultadoKcal ? `${calc.mifflin.resultadoKcal} kcal/dia` : "Não informado"]);
      }
      if (formulasSel.includes("eerIom") || calc.eerIom?.resultadoKcal) {
        formulaRows.push(["EER / IOM (DRI 2002/2005)", "Necessidade Estimada com CAF", calc.eerIom?.resultadoKcal ? `${calc.eerIom.resultadoKcal} kcal/dia` : "Não informado"]);
      }
      if (formulasSel.includes("faoOms") || calc.faoOms?.resultadoKcal) {
        formulaRows.push(["FAO / OMS (1985/2004)", "TMB por idade/peso × NAF", calc.faoOms?.resultadoKcal ? `${calc.faoOms.resultadoKcal} kcal/dia` : "Não informado"]);
      }

      if (formulaRows.length > 0) {
        doc.addTable(
          ["Equação Preditiva Selecionada", "Metodologia / Parâmetros Adotados", "Resultado Calculado"],
          formulaRows,
          [3500, 3200, 2300]
        );
      }

      if (calc.vetPlanejadoKcal) {
        const taxaTexto = calc.taxaMetabolicaCalculada ? `${calc.taxaMetabolicaCalculada} kcal/kg` : (presc.regraBolsoKcalKg || "--");
        doc.addCallout(
          "DECISÃO CLÍNICA E VET PLANEJADO:",
          `VET Planejado: ${calc.vetPlanejadoKcal} kcal/dia | Taxa Metabólica Utilizada: ${taxaTexto}\nJustificativa da Escolha: ${calc.justificativaEscolha || 'Não informada'}`,
          "0d9488",
          "f0fdfa"
        );
      }
    }

    doc.addHeading("2.3. Determinação das Necessidades Energéticas e Distribuição Dinâmica de Macronutrientes", 2);
    
    const dm = presc.distribuicaoMacros || {};
    const rp = presc.recomendacaoProteinaGKg || {};
    doc.addTable(
      ["Parâmetro Prescrito", "Faixa / Valor Numérico", "Kcal e Gramas Calculadas"],
      [
        ["Valor Energético Total (VET)", `${presc.vetKcal || 'Não calculado'} kcal/dia`, `Regra de bolso: ${presc.regraBolsoKcalKg || '--'}`],
        [
          "Carboidratos (CHO - 4 kcal/g)", 
          dm.cho ? `${dm.cho.minPct}% a ${dm.cho.maxPct}%` : `${presc.carboidratosPct || '--'}%`, 
          dm.cho ? `${dm.cho.minKcal} a ${dm.cho.maxKcal} kcal (${dm.cho.minG}g a ${dm.cho.maxG}g)` : `${presc.carboidratosG || '--'} g`
        ],
        [
          "Proteínas (PTN - 4 kcal/g)", 
          dm.ptn ? `${dm.ptn.minPct}% a ${dm.ptn.maxPct}%` : `${presc.proteinasPct || '--'}%`, 
          dm.ptn ? `${dm.ptn.minKcal} a ${dm.ptn.maxKcal} kcal (${dm.ptn.minG}g a ${dm.ptn.maxG}g)` : `${presc.proteinasG || '--'} g`
        ],
        [
          "Recomendação de Proteína (g/kg)",
          rp.minGKg ? `${rp.minGKg} a ${rp.maxGKg} g/kg/dia` : `${presc.proteinasGKg || '--'} g/kg`,
          rp.minTotalG ? `${rp.minTotalG}g a ${rp.maxTotalG}g de proteína esperada` : "Baseado no peso do paciente"
        ],
        [
          "Lipídios (LIP - 9 kcal/g)", 
          dm.lip ? `${dm.lip.minPct}% a ${dm.lip.maxPct}%` : `${presc.lipidiosPct || '--'}%`, 
          dm.lip ? `${dm.lip.minKcal} a ${dm.lip.maxKcal} kcal (${dm.lip.minG}g a ${dm.lip.maxG}g)` : `${presc.lipidiosG || '--'} g`
        ],
        ["Consistência da Dieta", presc.consistencia || "Normal", "-"],
        ["Fracionamento", presc.fracionamento || "5 a 6 refeições", "-"]
      ],
      [3400, 2600, 3000]
    );

    if (presc.fibrasMicronutrientes) {
      doc.addParagraph(`Fibras e Micronutrientes Alvo: ${presc.fibrasMicronutrientes}`);
    }

    if (presc.justificativaFisiopatologica) {
      doc.addHeading("2.4. Justificativa Fisiopatológica da Conduta", 2);
      doc.addParagraph(presc.justificativaFisiopatologica);
    }

    // 5. SEÇÃO III: PLANEJAMENTO ALIMENTAR (CARDÁPIO ORAL OU TNE)
    const tne = studentData.tne || {};
    if (tne.viaAlimentacao === "tne") {
      doc.addHeading("3. PRESCRIÇÃO DE TERAPIA NUTRICIONAL ENTERAL (TNE)", 1);
      const viaAdminText = tne.viaAdministracao === "bomba" 
        ? "Bomba de Infusão Contínua / Automatizada" 
        : "Infusão Gravitacional Intermitente";
      
      const tneRows = [
        ["Via de Nutrição", "Terapia Nutricional Enteral (TNE)", "Via especializada não-oral"],
        ["Tipo de Dieta Enteral", tne.tipoDieta || "Não especificado", "Fórmula enteral padronizada"],
        ["Densidade Calórica", tne.densidadeCalorica || "Não informada", "Concentração calórica (kcal/mL)"],
        ["Fracionamento / Horários", tne.fracionamento || "Não informado", "Distribuição diária"],
        ["Método de Infusão", viaAdminText, "Via de administração programada"]
      ];

      if (tne.viaAdministracao === "bomba") {
        const b = tne.bombaInfusao || {};
        tneRows.push(["Tempo de Infusão Programado", b.tempoInfusaoHoras ? `${b.tempoInfusaoHoras} horas/dia` : "Não informado", "Infusão contínua na bomba"]);
        tneRows.push(["Meta-Vazão Horária", b.metaVazaoMlHora ? `${b.metaVazaoMlHora} mL/h` : "Não calculada", "Taxa de infusão horária"]);
      } else {
        const g = tne.gravitacional || {};
        tneRows.push(["Distribuição / Volume por Refeição", g.volumePorRefeicao ? `${g.volumePorRefeicao} mL` : "Não informado", "Volume por frasco/etapa"]);
        tneRows.push(["Quantidade de Frascos / Etapas", g.quantidadeFrascosEtapas ? `${g.quantidadeFrascosEtapas} frascos/etapas` : "Não informado", "Fracionamento diário"]);
        tneRows.push(["Meta-Vazão Calculada", g.metaVazaoGotasMin ? `${g.metaVazaoGotasMin} gotas/min` : "Não calculada", "Gotejamento gravitacional"]);
      }

      doc.addTable(
        ["Parâmetro de TNE Prescrito", "Especificação / Cálculo do Aluno", "Finalidade Técnica"],
        tneRows,
        [3200, 3000, 2800]
      );

      if (tne.moduloSuplementacaoProteica) {
        doc.addCallout(
          "MÓDULO DE SUPLEMENTAÇÃO PROTEICA:",
          tne.moduloSuplementacaoProteica,
          "0284c7",
          "f0f9ff"
        );
      }
    } else {
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
          if (ref.tipoPreparacao) {
            alimentosFormatados = `Tipo de Preparação: ${ref.tipoPreparacao}\n` + alimentosFormatados;
          }
          if (ref.subtotal && (ref.subtotal.kcal || ref.subtotal.cho || ref.subtotal.ptn || ref.subtotal.lip)) {
            alimentosFormatados += `\n[Subtotal: ${ref.subtotal.kcal || 0} kcal | CHO: ${ref.subtotal.cho || 0}g | PTN: ${ref.subtotal.ptn || 0}g | LIP: ${ref.subtotal.lip || 0}g]`;
          }
        } else if (ref.tipoPreparacao) {
          alimentosFormatados = `Tipo de Preparação: ${ref.tipoPreparacao}\n` + alimentosFormatados;
        }

        cardapioRows.push([
          `${ref.refeicao}\n(${ref.horario || '--:--'})`,
          alimentosFormatados || "Alimentos não especificados",
          ref.substituicoes || "Não descrita"
        ]);
      });

      if (cardapioRows.length > 0) {
        doc.addTable(
          ["Refeição e Horário", "Tipo de Preparação, Alimentos e Gramaturas (TACO)", "Opções de Substituição"],
          cardapioRows,
          [2400, 5000, 1600]
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
          [
            "Carboidratos do Cardápio", 
            `${totais.carboidratosG || 0} g (${totais.carboidratosPct || 0}% do VET)`, 
            totais.statusMacros?.cho ? `Status: ${totais.statusMacros.cho.label} (${presc.distribuicaoMacros?.cho?.minG || '--'}g a ${presc.distribuicaoMacros?.cho?.maxG || '--'}g)` : `Prescrito: ${presc.carboidratosG || '--'} g`
          ],
          [
            "Proteínas do Cardápio", 
            `${totais.proteinasG || 0} g (${totais.proteinasGKg ? totais.proteinasGKg + ' g/kg' : '--'}, ${totais.proteinasPct || 0}%)`, 
            totais.statusMacros?.ptn ? `Status: ${totais.statusMacros.ptn.label} (${presc.distribuicaoMacros?.ptn?.minG || '--'}g a ${presc.distribuicaoMacros?.ptn?.maxG || '--'}g)` : `Prescrito: ${presc.proteinasG || '--'} g`
          ],
          [
            "Lipídios do Cardápio", 
            `${totais.lipidiosG || 0} g (${totais.lipidiosPct || 0}% do VET)`, 
            totais.statusMacros?.lip ? `Status: ${totais.statusMacros.lip.label} (${presc.distribuicaoMacros?.lip?.minG || '--'}g a ${presc.distribuicaoMacros?.lip?.maxG || '--'}g)` : `Prescrito: ${presc.lipidiosG || '--'} g`
          ],
          ["Fibras Alimentares Totais", `${totais.fibrasG || 0} g/dia`, "Composição oficial TACO (UNICAMP)"],
          ["Cálcio (Ca) no Cardápio", `${totais.calcioMg || 0} mg/dia`, "Micronutriente oficial TACO"],
          ["Ferro (Fe) no Cardápio", `${totais.ferroMg || 0} mg/dia`, "Micronutriente oficial TACO"],
          ["Sódio (Na) no Cardápio", `${totais.sodioMg || 0} mg/dia`, "Micronutriente oficial TACO"],
          ["Potássio (K) no Cardápio", `${totais.potassioMg || 0} mg/dia`, "Micronutriente oficial TACO"]
        ];
        doc.addTable(
          ["Parâmetro Nutricional Consolidado", "Aporte Obtido no Cardápio", "Régua da Prescrição Dietética"],
          rowsTotais,
          [3400, 2800, 2800]
        );
      }
    }

    doc.addHeading("3.2. Recomendações e Orientações Dietoterápicas de Alta/Acompanhamento", 2);
    doc.addParagraph(studentData.orientacoesNutricionais || "Nenhuma orientação nutricional específica registrada.");

    // 6. SEÇÃO IV: RESPOSTAS ÀS QUESTÕES AVALIATIVAS DO CASO
    if (clinicalCase.habilitarQuestoesAvaliativas === false) {
      doc.addHeading("4. QUESTÕES AVALIATIVAS DO CASO CLÍNICO", 1);
      doc.addParagraph("Aba de questões avaliativas opcional desabilitada para este caso clínico pelo docente.");
    } else {
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
