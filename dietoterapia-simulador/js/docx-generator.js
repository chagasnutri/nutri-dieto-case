// Gerador do Relatório Clínico Completo e Resolução Dietoterápica em formato Microsoft Word (.docx)
// Constrói o documento com tabelas formatadas, seções estilizadas e metadados.

class DietoterapiaDocxReport {
  static buildReportDocument(studentData, clinicalCase) {
    const doc = new MiniDocx();

    const aluno = studentData.aluno || {};
    const anamnese = studentData.anamnese || {};
    const antro = studentData.antropometria || {};
    const bio = studentData.bioquimica || {};
    const ef = studentData.exameFisico || {};
    const ca = studentData.consumoAlimentar || {};
    const pes = studentData.diagnosticoPES || {};
    const presc = studentData.prescricaoDietoterapica || {};
    const rawPlano = studentData.planejamentoAlimentar;
    const plano = Array.isArray(rawPlano) ? rawPlano : (Array.isArray(rawPlano?.refeicoes) ? rawPlano.refeicoes : []);
    const respostas = studentData.respostasQuestoes || {};

    const isRealPatient = studentData.isRealPatient === true || clinicalCase?.isRealCase === true;
    const realPat = studentData.dadosPacienteReal || {};
    const patient = isRealPatient ? (realPat.nome ? realPat : clinicalCase.patient || {}) : (clinicalCase.patient || {});
    const patName = isRealPatient ? (realPat.nome || "Paciente Real") : (patient.name || "Paciente");
    const patAge = isRealPatient ? (realPat.idade ? `${realPat.idade} anos` : "--") : (patient.age ? `${patient.age} anos` : "--");
    const patGender = isRealPatient ? (realPat.sexo || "--") : (patient.gender || "--");
    const patOccupation = isRealPatient ? (realPat.ocupacao || patient.occupation || "Não informada") : (patient.occupation || "Não informada");

    // Hipótese Diagnóstica / Diagnóstico Médico de Base
    const hipoteseDiagnostica = realPat.hipoteseDiagnostica || anamnese.hipoteseDiagnostica || clinicalCase.hipoteseDiagnostica || clinicalCase.history?.hipoteseDiagnostica || "Não informada";

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
    const dataFormatada = (isRealPatient && realPat.dataAtendimento)
      ? realPat.dataAtendimento.split("-").reverse().join("/")
      : (aluno.data ? aluno.data.split("-").reverse().join("/") : new Date().toLocaleDateString("pt-BR"));

    const identRows = [
      ["Estudante de Nutrição:", aluno.nome || "Não informado"],
      ["Matrícula / Turma:", aluno.matriculaTurma || "Não informado"],
      ["Data do Atendimento:", dataFormatada],
      ["Modalidade da Prática:", isRealPatient ? "Atendimento Presencial Real (Consulta Ambulatorial / Hospitalar)" : "Simulação Clínica Baseada em Casos"]
    ];

    if (!isRealPatient && clinicalCase.title) {
      identRows.push(["Caso Clínico da Disciplina:", clinicalCase.title]);
    }

    identRows.push([isRealPatient ? "Paciente Real:" : "Paciente Simulado:", `${patName}, ${patAge}, ${patGender} (Ocupação: ${patOccupation})`]);
    identRows.push(["Hipótese Diagnóstica / Diagnóstico Médico:", hipoteseDiagnostica]);

    doc.addTable(
      ["DADOS DA AVALIAÇÃO PRÁTICA", "INFORMAÇÕES"],
      identRows,
      [3500, 5500]
    );

    // 3. SEÇÃO I: PRONTUÁRIO CLÍNICO-NUTRICIONAL CONSTRUÍDO
    doc.addHeading("1. PRONTUÁRIO CLÍNICO-NUTRICIONAL (ANAMNESE)", 1);

    // 1.1. Identificação do Paciente & Histórico Social
    doc.addHeading("1.1. Identificação do Paciente & Histórico Social", 2);
    const patIdentRows = [
      ["Nome do Paciente:", patName || "Não informado / ---"],
      ["Idade:", patAge || "Não informada / ---"],
      ["Gênero / Sexo:", patGender || "Não informado / ---"],
      ["Naturalidade:", realPat.naturalidade || anamnese.naturalidade || patient.naturalidade || "Não informada / ---"],
      ["Procedência:", realPat.procedencia || anamnese.procedencia || patient.procedencia || "Não informada / ---"],
      ["Estado Civil:", realPat.historicoSocial?.estadoCivil || realPat.estadoCivil || anamnese.estadoCivil || patient.estadoCivil || "Não informado / ---"],
      ["Renda Familiar:", realPat.historicoSocial?.renda || realPat.renda || anamnese.renda || patient.renda || "Não informada / ---"],
      ["Profissão / Ocupação:", patOccupation || "Não informada / ---"],
      ["Condições de Moradia:", realPat.historicoSocial?.moradia || realPat.moradia || anamnese.moradia || patient.moradia || "Não informada / ---"],
      ["Escolaridade:", realPat.historicoSocial?.escolaridade || realPat.escolaridade || anamnese.escolaridade || patient.escolaridade || "Não informada / ---"]
    ];
    doc.addTable(
      ["CAMPO DE IDENTIFICAÇÃO / HISTÓRICO SOCIAL", "INFORMAÇÃO REGISTRADA"],
      patIdentRows,
      [3800, 5200]
    );

    doc.addHeading("1.2. Diagnóstico Médico de Base & Queixa Principal", 2);
    doc.addCallout("Hipótese Diagnóstica / Diagnóstico Médico:", hipoteseDiagnostica, "991b1b", "fef2f2");
    doc.addParagraph(`Queixa Principal: ${anamnese.queixaPrincipal || "Não preenchida / ---"}`);
    doc.addParagraph(`História da Doença Atual (HDA): ${anamnese.historiaClinica || "Não preenchida / ---"}`);

    doc.addHeading("1.3. Antecedentes Patológicos, Medicamentos e Estilo de Vida", 2);
    doc.addParagraph(`Antecedentes Patológicos e Medicamentos: ${anamnese.antecedentesMedicamentos || "Não preenchido / ---"}`);
    doc.addParagraph(`Hábitos e Estilo de Vida: ${anamnese.habitosEstiloVida || "Não preenchido / ---"}`);

    // 1.4. INTERAÇÕES DROGA-NUTRIENTE (3 COLUNAS EXATAS - ESQUELETO IMUTÁVEL)
    doc.addHeading("1.4. Interações Droga-Nutriente & Farmacoterapia Aplicada", 2);
    const interacoes = studentData.interacaoDrogaNutriente || [];
    const rowsInteracoes = (Array.isArray(interacoes) && interacoes.length > 0)
      ? interacoes.map(item => [
          item.medicacao || item.medicamento || "---",
          item.classificacao || item.nutrientes || "---",
          item.interacao || item.conduta || "Não preenchido / ---"
        ])
      : [["---", "---", "Nenhuma interação medicamentosa registrada / Não preenchido"]];

    doc.addTable(
      ["Medicação (Nome do remédio em uso)", "Classificação (Classe farmacológica)", "Interação (Descrição manual da interação)"],
      rowsInteracoes,
      [2800, 2800, 3400]
    );
    doc.addParagraph(`Observações Farmacoterapêuticas: ${studentData.observacoesFarmacoterapia || "Não preenchido / ---"}`);

    doc.addHeading("1.5. Avaliação Antropométrica e Estado Nutricional", 2);

    // Triagem Nutricional no topo da Seção Antropométrica (ESQUELETO IMUTÁVEL)
    const triagem = antro.triagemNutricional || {};
    if (triagem.tipo === "hospitalar") {
      doc.addHeading("1.5.1. Triagem Nutricional (Ambiente Hospitalar)", 3);
      doc.addTable(
        ["Parâmetro da Triagem Hospitalar", "Dado Registrado"],
        [
          ["Modalidade do Atendimento:", "Hospitalar"],
          ["Triagem Utilizada:", triagem.ferramenta || "Não informada / ---"],
          ["Pontuação Obtida:", triagem.pontuacao !== undefined && triagem.pontuacao !== null && triagem.pontuacao !== "" ? String(triagem.pontuacao) : "---"],
          ["Diagnóstico da Triagem:", triagem.diagnostico || "Não preenchido / ---"]
        ],
        [3500, 5500]
      );
    } else {
      doc.addHeading("1.5.1. Triagem Nutricional (Ambiente Ambulatorial)", 3);
      doc.addTable(
        ["Parâmetro da Triagem Nutricional", "Dado Registrado"],
        [
          ["Modalidade do Atendimento:", "Ambulatorial"],
          ["Triagem Hospitalar (NRS/MUST):", "Dispensada no atendimento ambulatorial / Não realizada"]
        ],
        [3500, 5500]
      );
    }
    const antroTableRows = [
      ["Peso Atual (Aferido)", antro.pesoAtual ? `${antro.pesoAtual} kg` : (antro.pesoEstimadoChumlea ? `${antro.pesoEstimadoChumlea} kg (Estimado Chumlea)` : "Não aferido / ---"), antro.pesoAtual ? "Medição direta" : (antro.pesoEstimadoChumlea ? "Estimado por CB e AJ" : "-")],
      ["Estatura (Aferida)", antro.estatura ? `${antro.estatura} m` : (antro.estaturaEstimadaChumlea ? `${antro.estaturaEstimadaChumlea} m (Estimada Chumlea)` : "Não aferida / ---"), antro.estatura ? "Medição direta" : (antro.estaturaEstimadaChumlea ? "Estimada por AJ e Idade" : "-")],
      ["Peso Habitual", antro.pesoHabitual ? `${antro.pesoHabitual} kg` : "Não informado / ---", "-"],
      ["Altura do Joelho (AJ)", antro.alturaJoelho ? `${antro.alturaJoelho} cm` : "Não aferida / ---", "Parâmetro para equações de Chumlea"],
      ["Circunferência do Braço (CB)", antro.circBraco ? `${antro.circBraco} cm` : "Não aferida / ---", "Reserva muscular / Estimativa Chumlea"],
      ["Peso Estimado (Chumlea 1985)", antro.pesoEstimadoChumlea ? `${antro.pesoEstimadoChumlea} kg` : "Não calculado / ---", "Equação indireta (sem peso aferido)"],
      ["Estatura Estimada (Chumlea 1985)", antro.estaturaEstimadaChumlea ? `${antro.estaturaEstimadaChumlea} m` : "Não calculada / ---", "Equação indireta (sem estatura aferida)"],
      ["Índice de Massa Corporal (IMC)", antro.imc ? `${antro.imc} kg/m²` : "Não calculado / ---", antro.classificacaoImc ? `${antro.classificacaoImc} (${antro.criterioClassificacao || 'Critério Clínico'})` : "Não classificado / ---"],
      ["Percentual de Perda Ponderal", antro.percentualPerda ? `${antro.percentualPerda} %` : "Não informado / ---", antro.percentualPerda ? `${antro.percentualPerda}% de alteração` : "-"],
      ["Circunferência da Cintura (CC)", antro.circCintura ? `${antro.circCintura} cm` : "Não aferida / ---", "Risco cardiovascular e adiposidade central"],
      ["Circunferência do Quadril (CQ)", antro.circQuadril ? `${antro.circQuadril} cm` : "Não aferida / ---", "Ginoide / Relação RCQ"],
      ["Circunferência da Panturrilha (CP)", antro.circPanturrilha ? `${antro.circPanturrilha} cm` : "Não aferida / ---", "Massa muscular esquelética"],
      ["Circunferência do Punho", antro.circPunho ? `${antro.circPunho} cm` : "Não aferida / ---", "Determinação da compleição física"],
      ["Relação Cintura-Quadril (RCQ)", antro.rcq || "Não calculada / ---", "Distribuição corporal de gordura"],
      ["Dobras Cutâneas (DCT, DCSE, DCB, DCSI)", (antro.dobraTricipital || antro.dobraSubescapular || antro.dobraBicipital || antro.dobraSuprailiaca) ? `DCT: ${antro.dobraTricipital || '--'}mm | DCSE: ${antro.dobraSubescapular || '--'}mm | DCB: ${antro.dobraBicipital || '--'}mm | DCSI: ${antro.dobraSuprailiaca || '--'}mm` : "Não aferidas / ---", "Adiposidade subcutânea periférica e troncular"],
      ["Dobras Abdominal e Coxa", (antro.dobraAbdominal || antro.dobraCoxa) ? `Abdominal: ${antro.dobraAbdominal || '--'}mm | Coxa: ${antro.dobraCoxa || '--'}mm` : "Não aferidas / ---", "Adiposidade regional"],
      ["Demais Avaliações (CMB, AMB, RCQ)", antro.demaisAvaliacoes || "Não preenchido / ---", "Relações (RCQ, CMB, AMB)"],
      ["Resumo Síntese Antropométrica", antro.circunferenciasDobras || "Não preenchido / ---", "Síntese descritiva do aluno"]
    ];

    doc.addTable(
      ["Parâmetro Antropométrico", "Valor Coletado / Calculado", "Classificação / Observação Clínica"],
      antroTableRows,
      [3000, 2800, 3200]
    );

    const diagExtenso = antro.diagnosticoNutricionalExtenso || "Não preenchido / ---";
    doc.addCallout(
      "DIAGNÓSTICO NUTRICIONAL POR EXTENSO (ESTADO PONDERAL):",
      `${diagExtenso} (Critério: ${antro.criterioClassificacao || 'OMS / Lipschitz'})`,
      "2563eb",
      "eff6ff"
    );

    doc.addHeading("1.6. Avaliação Bioquímica Relevante e Raciocínio Clínico", 2);
    const caseBio = (Array.isArray(clinicalCase.bioquimica) && clinicalCase.bioquimica.length > 0)
      ? clinicalCase.bioquimica
      : (Array.isArray(bio.listaCustom) && bio.listaCustom.length > 0 ? bio.listaCustom : []);
    const interps = bio.interpretacoes || {};

    if (Array.isArray(caseBio) && caseBio.length > 0) {
      const bioRows = caseBio.map(item => {
        const evalRes = (typeof evaluateBiochemicalExam === "function")
          ? evaluateBiochemicalExam(item.valor, item.referencia)
          : { label: "Apurado", seta: "" };
        const statusStr = evalRes.seta ? `${item.valor} [${evalRes.label} ${evalRes.seta}]` : `${item.valor} [${evalRes.label}]`;
        // Imprime estritamente e apenas o texto livre digitado pelo estudante (ou sinaliza ausência de preenchimento)
        const interpAluno = (interps && typeof interps[item.exame] === "string" && interps[item.exame].trim()) 
          ? interps[item.exame].trim() 
          : "Não preenchido / ---";
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

    doc.addHeading("1.7. Exame Físico Nutricional e Semiologia Clínica", 2);

    // Parte A - Avaliação dos Órgãos e Sistemas
    doc.addHeading("Parte A - Avaliação dos Órgãos e Sistemas", 3);
    const sis = ef.orgaosSistemas || {};
    const sisRows = [
      ["Neurológico", sis.neurologico || "Sem alterações relatadas / Não preenchido"],
      ["Respiratório", sis.respiratorio || "Sem alterações relatadas / Não preenchido"],
      ["Circulatório", sis.circulatorio || "Sem alterações relatadas / Não preenchido"],
      ["Digestório", sis.digestorio || "Sem alterações relatadas / Não preenchido"],
      ["Urinário", sis.urinario || "Sem alterações relatadas / Não preenchido"],
      ["Muscular", sis.muscular || "Sem alterações relatadas / Não preenchido"]
    ];
    doc.addTable(
      ["Sistema Orgânico", "Avaliação Clínica / Achados"],
      sisRows,
      [2800, 6200]
    );

    // Parte B - Semiologia Nutricional por Compartimentos Anatômicos
    doc.addHeading("Parte B - Semiologia Nutricional (Exame Físico por Compartimentos)", 3);
    const comp = ef.compartimentos || {};
    const compRows = [
      ["Cabeça (Fácies, cavidade oral, olhos, cabelos, bochechas)", comp.cabeca || "Sem alterações evidentes / Não preenchido"],
      ["Tronco (Clavícula, tórax, costelas, coluna, região lombar/sacral)", comp.tronco || "Sem alterações evidentes / Não preenchido"],
      ["Membros Superiores - MMSS (Bíceps, tríceps, deltoide, mãos, unhas)", comp.mmss || "Sem alterações evidentes / Não preenchido"],
      ["Membros Inferiores - MMII (Coxa, quadríceps, joelho, panturrilha, tornozelo, edemas)", comp.mmii || "Sem alterações evidentes / Não preenchido"]
    ];
    doc.addTable(
      ["Compartimento Anatômico", "Semiologia Nutricional / Reserva Muscular e Adiposa"],
      compRows,
      [3600, 5400]
    );
    doc.addParagraph(`Sinais Clínicos e Achados Adicionais: ${ef.sinaisClinicos || "Não preenchido / ---"}`);

    doc.addHeading("1.8. Consumo Alimentar e Inquérito Nutricional", 2);
    doc.addParagraph(`Resumo do Recordatório Alimentar / Padrão Dietético: ${ca.inqueritoResumo || "Não preenchido / ---"}`);
    doc.addParagraph(`Ingestão Hídrica, Preferências e Aversões: ${ca.aguaPreferenciasAversoes || "Não preenchido / ---"}`);

    // Detalhamento das refeições cadastradas no Recordatório de 24h (ESQUELETO IMUTÁVEL)
    doc.addHeading("1.8.1. Refeições e Alimentos Referidos no Recordatório de 24h", 3);
    const recMeals = ca.refeicoesRecordatorio || [];
    const recRows = [];
    if (Array.isArray(recMeals) && recMeals.some(r => r.itens && r.itens.length > 0)) {
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
    }
    if (recRows.length === 0) {
      recRows.push(["---", "Nenhuma refeição detalhada no recordatório alimentar / Não preenchido"]);
    }
    doc.addTable(
      ["Refeição e Horário", "Alimentos, Medidas Caseiras e Gramaturas (TACO)"],
      recRows,
      [3000, 6000]
    );

    // Tabela Quantitativa Consolidada do Recordatório de 24h (OBRIGATÓRIA - ESQUELETO IMUTÁVEL)
    doc.addHeading("1.8.2. Avaliação Quantitativa Consolidada do Recordatório de 24h (Macros e Micros)", 3);
    const recTotals = ca.totaisRecordatorio || {};
    const rowsRecTotais = [
      ["VET Consumido no Recordatório", recTotals.vetTotalKcal ? `${recTotals.vetTotalKcal} kcal/dia` : (ca.vetRecordatorio ? `${ca.vetRecordatorio} kcal/dia` : "Não preenchido / ---"), `NEE do Caso: ${ca.neeCaso ? ca.neeCaso + ' kcal/dia' : '---'} (${ca.adequacaoVetPct || recTotals.adequacaoVetPct || '---'}% da meta)`],
      ["Carboidratos Consumidos", recTotals.carboidratosG !== undefined ? `${recTotals.carboidratosG} g (${recTotals.carboidratosPct || 0}% do VET)` : "Não preenchido / ---", recTotals.statusMacros?.cho ? `Status frente à prescrição: ${recTotals.statusMacros.cho.label}` : "---"],
      ["Proteínas Consumidas", recTotals.proteinasG !== undefined ? `${recTotals.proteinasG} g (${recTotals.proteinasGKg ? recTotals.proteinasGKg + ' g/kg' : '--'}, ${recTotals.proteinasPct || 0}%)` : "Não preenchido / ---", recTotals.statusMacros?.ptn ? `Status frente à prescrição: ${recTotals.statusMacros.ptn.label}` : "---"],
      ["Lipídios Consumidos", recTotals.lipidiosG !== undefined ? `${recTotals.lipidiosG} g (${recTotals.lipidiosPct || 0}% do VET)` : "Não preenchido / ---", recTotals.statusMacros?.lip ? `Status frente à prescrição: ${recTotals.statusMacros.lip.label}` : "---"],
      ["Fibras Alimentares Totais", recTotals.fibrasG !== undefined ? `${recTotals.fibrasG} g/dia` : "Não preenchido / ---", "Tabela TACO (UNICAMP, 4ª edição)"],
      ["Cálcio (Ca) Consumido", recTotals.calcioMg !== undefined ? `${recTotals.calcioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
      ["Ferro (Fe) Consumido", recTotals.ferroMg !== undefined ? `${recTotals.ferroMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
      ["Sódio (Na) Consumido", recTotals.sodioMg !== undefined ? `${recTotals.sodioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
      ["Potássio (K) Consumido", recTotals.potassioMg !== undefined ? `${recTotals.potassioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"]
    ];
    doc.addTable(
      ["Parâmetro Nutricional Consumido", "Total Ingerido no R24h", "Régua da Prescrição / Observação Oficial"],
      rowsRecTotais,
      [3400, 2800, 2800]
    );

    // 4. SEÇÃO II: RESOLUÇÃO DIETOTERÁPICA DO CASO
    doc.addHeading("2. RESOLUÇÃO DIETOTERÁPICA E CONDUTA NUTRICIONAL", 1);

    doc.addHeading("2.1. Diagnóstico em Nutrição (Metodologia PES)", 2);
    const pesText = pes.textoCompletoPES || 
      `Problema (P): ${pes.problema || 'Não informado'} | Relacionado a (E): ${pes.etiologia || 'Não informada'} | Evidenciado por (S): ${pes.sinaisSintomas || 'Não informado'}`;
    
    doc.addCallout("DIAGNÓSTICO EM NUTRIÇÃO (PES):", pesText, "15803d", "f0fdf4");

    // 2.1.1. OBJETIVOS DIETOTERÁPICOS E METAS DO CUIDADO (IMPRESSOS OBRIGATORIAMENTE APÓS O PES)
    doc.addHeading("2.1.1. Objetivos Dietoterápicos e Metas do Cuidado", 3);
    doc.addParagraph(pes.objetivosDietoterapicos || "Não preenchido");

    // 2.2. Cálculos de Necessidades Energéticas e Equações Preditivas (Fórmulas Abertas - ESQUELETO IMUTÁVEL)
    doc.addHeading("2.2. Cálculos de Necessidades Energéticas e Equações Preditivas", 2);
    const calc = studentData.calculoNecessidades || {};
    const formulasSel = Array.isArray(calc.formulasSelecionadas) ? calc.formulasSelecionadas : [];
    const formulaRows = [];

    if (formulasSel.includes("bolso") || calc.bolso?.resultadoKcal || calc.bolso?.equacaoDescritiva) {
      const b = calc.bolso || {};
      const faixa = b.faixaKcal || ((b.minKcalKg || b.maxKcalKg) ? `${b.minKcalKg || '--'} a ${b.maxKcalKg || '--'} kcal/kg (Peso: ${b.pesoKg || '--'} kg)` : "Faixa personalizada");
      const resolucao = b.equacaoDescritiva || `[${b.minKcalKg || '--'} a ${b.maxKcalKg || '--'} kcal/kg] × ${b.pesoKg || '--'} kg`;
      formulaRows.push(["Fórmula de Bolso (Regra Prática)", resolucao, b.resultadoKcal ? `${b.resultadoKcal} kcal/dia` : faixa]);
    }
    if (formulasSel.includes("harrisBenedict") || calc.harrisBenedict?.resultadoKcal || calc.harrisBenedict?.equacaoDescritiva) {
      const h = calc.harrisBenedict || {};
      const gen = h.genero || calc.generoUtilizado || "Masculino";
      const resolucao = h.equacaoDescritiva || (h.pesoKg ? `GEB (${gen}): Peso ${h.pesoKg}kg, Alt ${h.alturaCm}cm, Idade ${h.idadeAnos}a | FA: ${h.fa || '1.2'}, FI: ${h.fi || '1.0'}` : "GEB × FA × FI");
      const resTxt = h.resultadoKcal ? `${h.resultadoKcal} kcal/dia (GEB: ${h.gebKcal || '--'} kcal)` : "Não informado";
      formulaRows.push([`Harris-Benedict (1919) - ${gen}`, resolucao, resTxt]);
    }
    if (formulasSel.includes("mifflin") || calc.mifflin?.resultadoKcal || calc.mifflin?.equacaoDescritiva) {
      const m = calc.mifflin || {};
      const gen = m.genero || calc.generoUtilizado || "Masculino";
      const resolucao = m.equacaoDescritiva || (m.pesoKg ? `GEB (${gen}): Peso ${m.pesoKg}kg, Alt ${m.alturaCm}cm, Idade ${m.idadeAnos}a | FA: ${m.fa || '1.2'}, FI: ${m.fi || '1.0'}` : "TMB × NAF (Diretriz AND)");
      const resTxt = m.resultadoKcal ? `${m.resultadoKcal} kcal/dia (GEB: ${m.gebKcal || '--'} kcal)` : "Não informado";
      formulaRows.push([`Mifflin-St Jeor (1990) - ${gen}`, resolucao, resTxt]);
    }
    if (formulasSel.includes("faoOms") || calc.faoOms?.resultadoKcal || calc.faoOms?.equacaoDescritiva) {
      const f = calc.faoOms || {};
      const resolucao = f.equacaoDescritiva || (f.pesoKg ? `GEB: (${f.constanteIdade} × ${f.pesoKg}kg) + ${f.constanteFixa} | FA: ${f.fa || '1.2'}, FI: ${f.fi || '1.0'}` : "TMB por idade/peso × FA × FI");
      const resTxt = f.resultadoKcal ? `${f.resultadoKcal} kcal/dia (GEB: ${f.gebKcal || '--'} kcal)` : "Não informado";
      formulaRows.push(["FAO / OMS (1985 / 2004)", resolucao, resTxt]);
    }
    if (formulasSel.includes("eerIom") || calc.eerIom?.resultadoKcal || calc.eerIom?.equacaoDescritiva) {
      const e = calc.eerIom || {};
      const resolucao = e.equacaoDescritiva || (e.pesoKg ? `EER = ${e.constanteEer} - (${e.fatorIdade} × ${e.idadeAnos}a) + ${e.naf} × (${e.fatorPeso}×P + ${e.fatorAltura}×A)` : "Necessidade Estimada com CAF");
      const resTxt = e.resultadoKcal ? `${e.resultadoKcal} kcal/dia (EER: ${e.eerKcal || '--'} kcal)` : "Não informado";
      formulaRows.push(["EER / IOM (DRI 2002 / 2005)", resolucao, resTxt]);
    }

    if (formulaRows.length === 0) {
      formulaRows.push(["1. Fórmula de Bolso (Regra Prática)", "[Kcal Mín a Máx] × Peso (kg)", "Não preenchido / ---"]);
      formulaRows.push(["2. Harris-Benedict (1919)", "GEB (peso, altura, idade, sexo) × FA × FI", "Não preenchido / ---"]);
      formulaRows.push(["3. Mifflin-St Jeor (1990)", "GEB (peso, altura, idade, sexo) × FA × FI", "Não preenchido / ---"]);
      formulaRows.push(["4. FAO / OMS (1985 / 2004)", "GEB = (Constante Idade × Peso) + Constante Fixa × FA × FI", "Não preenchido / ---"]);
      formulaRows.push(["5. EER / IOM (DRI 2002 / 2005)", "EER = Constante - (Fator × Idade) + NAF × (FatorPeso×P + FatorAlt×A)", "Não preenchido / ---"]);
    }

    doc.addTable(
      ["Equação Preditiva Selecionada", "Desenvolvimento Matemático Aberto (Variáveis Digitadas)", "Resultado Calculado"],
      formulaRows,
      [2600, 4400, 2000]
    );

    const taxaTexto = calc.taxaMetabolicaCalculada ? `${calc.taxaMetabolicaCalculada} kcal/kg` : (presc.regraBolsoKcalKg || "---");
    const vetFinalPlan = calc.vetPlanejadoKcal ? `${calc.vetPlanejadoKcal} kcal/dia` : "Não preenchido / ---";
    doc.addCallout(
      "DECISÃO CLÍNICA E VET PLANEJADO:",
      `VET Planejado: ${vetFinalPlan} | Taxa Metabólica Resultante: ${taxaTexto}\nJustificativa da Escolha Clínica: ${calc.justificativaEscolha || 'Não preenchido / ---'}`,
      "0d9488",
      "f0fdfa"
    );

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

    doc.addParagraph(`Fibras e Micronutrientes Alvo: ${presc.fibrasMicronutrientes || "Não preenchido / ---"}`);

    doc.addHeading("2.4. Justificativa Fisiopatológica da Conduta", 2);
    doc.addParagraph(presc.justificativaFisiopatologica || "Não preenchido / ---");

    // 5. SEÇÃO III: PLANEJAMENTO ALIMENTAR (CARDÁPIO ORAL OU TNE)
    const tne = studentData.tne || {};
    if (tne.viaAlimentacao === "tne") {
      doc.addHeading("3. PRESCRIÇÃO DE TERAPIA NUTRICIONAL ENTERAL (TNE)", 1);
      const viaAdminText = tne.viaAdministracao === "bomba" 
        ? "Bomba de Infusão Contínua / Automatizada" 
        : "Infusão Gravitacional Intermitente";
      
      const tneRows = [
        ["Via de Nutrição", "Terapia Nutricional Enteral (TNE)", "Via especializada não-oral"],
        ["Nome Comercial da Dieta Enteral", tne.nomeComercial || "Não informado", "Identificação comercial da fórmula"],
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

      if (tne.tabelaNutricionalManual) {
        const man = tne.tabelaNutricionalManual;
        const manualRows = [
          ["Valor Energético Total (VET)", `${man.vet || '0'} kcal/dia`, "Aporte calórico diário da fórmula"],
          ["Carboidratos (CHO)", `${man.cho || '0'} g/dia`, "4 kcal/g"],
          ["Proteínas (PTN)", `${man.ptn || '0'} g/dia`, "4 kcal/g"],
          ["Lipídios (LIP)", `${man.lip || '0'} g/dia`, "9 kcal/g"],
          ["Fibras Alimentares", `${man.fibra || '0'} g/dia`, "Aporte de fibras solúveis/insolúveis"],
          ["Sódio (Na)", `${man.sodio || '0'} mg/dia`, "Eletrólito"],
          ["Potássio (K)", `${man.potassio || '0'} mg/dia`, "Eletrólito"],
          ["Cálcio (Ca)", `${man.calcio || '0'} mg/dia`, "Mineral"],
          ["Fósforo (P)", `${man.fosforo || '0'} mg/dia`, "Balanço fosfocálcico"]
        ];
        doc.addHeading("3.1. Tabela Nutricional Manual da Fórmula Enteral", 2);
        doc.addTable(
          ["Nutriente / Marcador", "Quantidade Total Diária", "Especificação Técnica"],
          manualRows,
          [3200, 2800, 3000]
        );
      }

      const totaisTne = studentData.totaisCardapio;
      if (totaisTne && (totaisTne.vetTotalKcal > 0 || (tne.tabelaNutricionalManual && tne.tabelaNutricionalManual.vet))) {
        doc.addHeading("3.2. Consolidação Nutricional da TNE vs Metas Prescritas", 2);
        const rowsTotaisTne = [
          ["VET Fornecido pela TNE", `${totaisTne.vetTotalKcal || 0} kcal/dia`, `Meta Prescrita: ${presc.vetKcal || '--'} kcal`],
          ["Adequação do VET da TNE", `${totaisTne.adequacaoVetPct ? totaisTne.adequacaoVetPct + '%' : '--'}`, `${totaisTne.classificacaoAdequacao || 'Adequação calórica da TNE'}`],
          [
            "Carboidratos da TNE", 
            `${totaisTne.carboidratosG || 0} g (${totaisTne.carboidratosPct || 0}% do VET)`, 
            totaisTne.statusMacros?.cho ? `Status: ${totaisTne.statusMacros.cho.label} (${presc.distribuicaoMacros?.cho?.minG || '--'}g a ${presc.distribuicaoMacros?.cho?.maxG || '--'}g)` : `Prescrito: ${presc.carboidratosG || '--'} g`
          ],
          [
            "Proteínas da TNE", 
            `${totaisTne.proteinasG || 0} g (${totaisTne.proteinasGKg ? totaisTne.proteinasGKg + ' g/kg' : '--'}, ${totaisTne.proteinasPct || 0}%)`, 
            totaisTne.statusMacros?.ptn ? `Status: ${totaisTne.statusMacros.ptn.label} (${presc.distribuicaoMacros?.ptn?.minG || '--'}g a ${presc.distribuicaoMacros?.ptn?.maxG || '--'}g)` : `Prescrito: ${presc.proteinasG || '--'} g`
          ],
          [
            "Lipídios da TNE", 
            `${totaisTne.lipidiosG || 0} g (${totaisTne.lipidiosPct || 0}% do VET)`, 
            totaisTne.statusMacros?.lip ? `Status: ${totaisTne.statusMacros.lip.label} (${presc.distribuicaoMacros?.lip?.minG || '--'}g a ${presc.distribuicaoMacros?.lip?.maxG || '--'}g)` : `Prescrito: ${presc.lipidiosG || '--'} g`
          ],
          ["Fibras Alimentares Totais", `${totaisTne.fibrasG || 0} g/dia`, "Composição da fórmula"],
          ["Cálcio (Ca)", `${totaisTne.calcioMg || 0} mg/dia`, "Micronutriente"],
          ["Sódio (Na)", `${totaisTne.sodioMg || 0} mg/dia`, "Micronutriente"],
          ["Potássio (K)", `${totaisTne.potassioMg || 0} mg/dia`, "Micronutriente"],
          ["Fósforo (P)", `${totaisTne.fosforoMg || 0} mg/dia`, "Balanço fosfocálcico na TNE"]
        ];
        doc.addTable(
          ["Parâmetro Nutricional da TNE", "Aporte Obtido pela Fórmula", "Régua da Prescrição Dietética"],
          rowsTotaisTne,
          [3400, 2800, 2800]
        );
      }

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
      const consistenciaOral = studentData.consistenciaDietaOral || presc.consistencia || "Dieta Livre / Normal";
      doc.addParagraph(`Tipo / Consistência da Dieta Oral Definida: ${consistenciaOral}`);
      
      const cardapioRows = [];
      plano.forEach(ref => {
        let alimentosFormatados = ref.alimentos && typeof ref.alimentos === "string" ? ref.alimentos : "";
        const itemsList = Array.isArray(ref.itens) ? ref.itens : (Array.isArray(ref.alimentos) ? ref.alimentos : []);
        if (itemsList.length > 0) {
          const itemLines = itemsList.map(it => {
            const parts = [];
            if (it.medidaCaseira && String(it.medidaCaseira).trim()) {
              parts.push(String(it.medidaCaseira).trim());
            }
            if (it.gramatura || it.quantidade) {
              parts.push(it.gramatura ? `${it.gramatura}g` : String(it.quantidade));
            }
            let line = it.alimentoNome || it.nome || "Alimento";
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

        const mealName = ref.refeicao || ref.nome || "Refeição";
        cardapioRows.push([
          `${mealName}\n(${ref.horario || '--:--'})`,
          alimentosFormatados || "Alimentos não especificados",
          ref.substituicoes || "Não descrita"
        ]);
      });

      if (cardapioRows.length === 0) {
        cardapioRows.push(["---", "Nenhuma refeição detalhada no planejamento alimentar / Não preenchido", "---"]);
      }

      doc.addTable(
        ["Refeição e Horário", "Tipo de Preparação, Alimentos e Gramaturas (TACO)", "Opções de Substituição"],
        cardapioRows,
        [2400, 5000, 1600]
      );

      // Tabela de Totais Consolidados do Cardápio vs Metas Prescritas (OBRIGATÓRIA - ESQUELETO IMUTÁVEL)
      let totais = studentData.totaisCardapio || {};
      if (!totais.vetTotalKcal) {
        let sumKcal = 0, sumCho = 0, sumPtn = 0, sumLip = 0, sumFib = 0, sumCa = 0, sumFe = 0, sumNa = 0, sumK = 0;
        plano.forEach(ref => {
          const items = Array.isArray(ref.itens) ? ref.itens : (Array.isArray(ref.alimentos) ? ref.alimentos : []);
          items.forEach(it => {
            sumKcal += parseFloat(it.kcal || 0) || 0;
            sumCho += parseFloat(it.cho || 0) || 0;
            sumPtn += parseFloat(it.ptn || 0) || 0;
            sumLip += parseFloat(it.lip || 0) || 0;
            sumFib += parseFloat(it.fibras || it.fibra || 0) || 0;
            sumCa += parseFloat(it.ca || it.calcio || 0) || 0;
            sumFe += parseFloat(it.fe || it.ferro || 0) || 0;
            sumNa += parseFloat(it.na || it.sodio || 0) || 0;
            sumK += parseFloat(it.k || it.potassio || 0) || 0;
          });
        });
        if (sumKcal > 0) {
          totais = {
            vetTotalKcal: Math.round(sumKcal),
            carboidratosG: Math.round(sumCho * 10) / 10,
            carboidratosPct: Math.round(((sumCho * 4) / sumKcal) * 100),
            proteinasG: Math.round(sumPtn * 10) / 10,
            proteinasPct: Math.round(((sumPtn * 4) / sumKcal) * 100),
            lipidiosG: Math.round(sumLip * 10) / 10,
            lipidiosPct: Math.round(((sumLip * 9) / sumKcal) * 100),
            fibrasG: Math.round(sumFib * 10) / 10,
            calcioMg: Math.round(sumCa),
            ferroMg: Math.round(sumFe * 10) / 10,
            sodioMg: Math.round(sumNa),
            potassioMg: Math.round(sumK),
            adequacaoVetPct: presc.vetKcal ? Math.round((sumKcal / parseFloat(presc.vetKcal)) * 100) : null
          };
        }
      }
      doc.addHeading("3.1. Consolidação Nutricional do Cardápio vs Metas Prescritas (Análises Quantitativas)", 2);
      const rowsTotais = [
        ["VET Total Planejado no Cardápio", totais.vetTotalKcal ? `${totais.vetTotalKcal} kcal/dia` : "Não preenchido / ---", `Meta Prescrita: ${presc.vetKcal ? presc.vetKcal + ' kcal' : '---'}`],
        ["Adequação do VET do Cardápio", totais.adequacaoVetPct ? `${totais.adequacaoVetPct}%` : "Não calculada / ---", `${totais.classificacaoAdequacao || 'Adequação calórica do cardápio'}`],
        [
          "Carboidratos do Cardápio", 
          totais.carboidratosG !== undefined ? `${totais.carboidratosG} g (${totais.carboidratosPct || 0}% do VET)` : "Não preenchido / ---", 
          totais.statusMacros?.cho ? `Status: ${totais.statusMacros.cho.label} (${presc.distribuicaoMacros?.cho?.minG || '--'}g a ${presc.distribuicaoMacros?.cho?.maxG || '--'}g)` : `Prescrito: ${presc.carboidratosG || '--'} g`
        ],
        [
          "Proteínas do Cardápio", 
          totais.proteinasG !== undefined ? `${totais.proteinasG} g (${totais.proteinasGKg ? totais.proteinasGKg + ' g/kg' : '--'}, ${totais.proteinasPct || 0}%)` : "Não preenchido / ---", 
          totais.statusMacros?.ptn ? `Status: ${totais.statusMacros.ptn.label} (${presc.distribuicaoMacros?.ptn?.minG || '--'}g a ${presc.distribuicaoMacros?.ptn?.maxG || '--'}g)` : `Prescrito: ${presc.proteinasG || '--'} g`
        ],
        [
          "Lipídios do Cardápio", 
          totais.lipidiosG !== undefined ? `${totais.lipidiosG} g (${totais.lipidiosPct || 0}% do VET)` : "Não preenchido / ---", 
          totais.statusMacros?.lip ? `Status: ${totais.statusMacros.lip.label} (${presc.distribuicaoMacros?.lip?.minG || '--'}g a ${presc.distribuicaoMacros?.lip?.maxG || '--'}g)` : `Prescrito: ${presc.lipidiosG || '--'} g`
        ],
        ["Fibras Alimentares Totais", totais.fibrasG !== undefined ? `${totais.fibrasG} g/dia` : "Não preenchido / ---", "Composição oficial TACO (UNICAMP)"],
        ["Cálcio (Ca) no Cardápio", totais.calcioMg !== undefined ? `${totais.calcioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
        ["Ferro (Fe) no Cardápio", totais.ferroMg !== undefined ? `${totais.ferroMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
        ["Sódio (Na) no Cardápio", totais.sodioMg !== undefined ? `${totais.sodioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
        ["Potássio (K) no Cardápio", totais.potassioMg !== undefined ? `${totais.potassioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"]
      ];
      doc.addTable(
        ["Parâmetro Nutricional Consolidado", "Aporte Obtido no Cardápio", "Régua da Prescrição Dietética"],
        rowsTotais,
        [3400, 2800, 2800]
      );
    }

    doc.addHeading("3.2. Recomendações e Orientações Dietoterápicas de Alta/Acompanhamento", 2);
    doc.addParagraph(studentData.orientacoesNutricionais || "Nenhuma orientação nutricional específica registrada / Não preenchido.");

    // 6. SEÇÃO IV: RESPOSTAS ÀS QUESTÕES AVALIATIVAS DO CASO
    if (isRealPatient) {
      doc.addHeading("4. MODALIDADE PRÁTICA: ATENDIMENTO CLÍNICO PRESENCIAL REAL", 1);
      doc.addParagraph("Prontuário dietoterápico ambulatorial/hospitalar preenchido livremente pelo acadêmico durante a consulta presencial com paciente real. Conduta dietoterápica avaliada diretamente pela preceptoria clínica docente.");
    } else if (clinicalCase.habilitarQuestoesAvaliativas === false) {
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

  // Constrói relatório HTML completo (espelho 100% fiel com esqueleto imutável) para visualização e impressão direta em PDF
  static buildHtmlReport(studentData, clinicalCase = {}) {
    const isRealPatient = studentData.isRealPatient === true || clinicalCase?.isRealCase === true;
    const aluno = studentData.aluno || {};
    const anamnese = studentData.anamnese || {};
    const antro = studentData.antropometria || {};
    const bio = studentData.bioquimica || {};
    const ef = studentData.exameFisico || {};
    const ca = studentData.consumoAlimentar || {};
    const pes = studentData.diagnosticoPES || {};
    const presc = studentData.prescricaoDietoterapica || {};
    const rawPlano = studentData.planejamentoAlimentar;
    const plano = Array.isArray(rawPlano) ? rawPlano : (Array.isArray(rawPlano?.refeicoes) ? rawPlano.refeicoes : []);
    const tne = studentData.tne || {};
    const calc = studentData.calculoNecessidades || {};
    const respostas = studentData.respostasQuestoes || {};

    const realPat = studentData.dadosPacienteReal || {};
    const patient = isRealPatient ? (realPat.nome ? realPat : clinicalCase.patient || {}) : (clinicalCase.patient || {});
    const patName = isRealPatient ? (realPat.nome || "Paciente Real") : (patient.name || "Paciente Simulado");
    const patAge = isRealPatient ? (realPat.idade ? `${realPat.idade} anos` : "Não informada / ---") : (patient.age ? `${patient.age} anos` : "Não informada / ---");
    const patGender = isRealPatient ? (realPat.genero || realPat.sexo || "Não informado / ---") : (patient.gender || "Não informado / ---");
    const patOccupation = isRealPatient ? (realPat.historicoSocial?.profissao || realPat.profissao || realPat.ocupacao || patient.occupation || "Não informada / ---") : (patient.occupation || "Não informada / ---");
    const hipoteseDiagnostica = realPat.hipoteseDiagnostica || anamnese.hipoteseDiagnostica || clinicalCase.hipoteseDiagnostica || clinicalCase.history?.hipoteseDiagnostica || "Não informada / ---";

    const dataFormatada = (isRealPatient && realPat.dataAtendimento)
      ? realPat.dataAtendimento.split("-").reverse().join("/")
      : (aluno.data ? aluno.data.split("-").reverse().join("/") : new Date().toLocaleDateString("pt-BR"));

    let totaisCardapio = studentData.totaisCardapio || {};
    if (!totaisCardapio.vetTotalKcal) {
      let sumKcal = 0, sumCho = 0, sumPtn = 0, sumLip = 0, sumFib = 0, sumCa = 0, sumFe = 0, sumNa = 0, sumK = 0;
      plano.forEach(ref => {
        const items = Array.isArray(ref.itens) ? ref.itens : (Array.isArray(ref.alimentos) ? ref.alimentos : []);
        items.forEach(it => {
          sumKcal += parseFloat(it.kcal || 0) || 0;
          sumCho += parseFloat(it.cho || 0) || 0;
          sumPtn += parseFloat(it.ptn || 0) || 0;
          sumLip += parseFloat(it.lip || 0) || 0;
          sumFib += parseFloat(it.fibras || it.fibra || 0) || 0;
          sumCa += parseFloat(it.ca || it.calcio || 0) || 0;
          sumFe += parseFloat(it.fe || it.ferro || 0) || 0;
          sumNa += parseFloat(it.na || it.sodio || 0) || 0;
          sumK += parseFloat(it.k || it.potassio || 0) || 0;
        });
      });
      if (sumKcal > 0) {
        totaisCardapio = {
          vetTotalKcal: Math.round(sumKcal),
          carboidratosG: Math.round(sumCho * 10) / 10,
          carboidratosPct: Math.round(((sumCho * 4) / sumKcal) * 100),
          proteinasG: Math.round(sumPtn * 10) / 10,
          proteinasPct: Math.round(((sumPtn * 4) / sumKcal) * 100),
          lipidiosG: Math.round(sumLip * 10) / 10,
          lipidiosPct: Math.round(((sumLip * 9) / sumKcal) * 100),
          fibrasG: Math.round(sumFib * 10) / 10,
          calcioMg: Math.round(sumCa),
          ferroMg: Math.round(sumFe * 10) / 10,
          sodioMg: Math.round(sumNa),
          potassioMg: Math.round(sumK),
          adequacaoVetPct: presc.vetKcal ? Math.round((sumKcal / parseFloat(presc.vetKcal)) * 100) : null
        };
      }
    }

    function renderTableHtml(headers, rows) {
      let ths = headers.map(h => `<th style="border: 1px solid #cbd5e1; background-color: #f1f5f9; padding: 6px 10px; font-size: 11px; text-align: left; color: #1e293b;">${h}</th>`).join("");
      let trs = rows.map((r, idx) => {
        let bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
        let tds = r.map(c => `<td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 11px; color: #334155; vertical-align: top; white-space: pre-wrap;">${c || '---'}</td>`).join("");
        return `<tr style="background-color: ${bg};">${tds}</tr>`;
      }).join("");
      return `<table style="width: 100%; border-collapse: collapse; margin: 8px 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
    }

    function renderCalloutHtml(title, content, borderColor = "#15803d", bgColor = "#f0fdf4") {
      return `
        <div style="border-left: 4px solid ${borderColor}; background-color: ${bgColor}; padding: 10px 14px; margin: 10px 0; border-radius: 4px; font-family: inherit;">
          <div style="font-weight: bold; font-size: 11px; text-transform: uppercase; color: ${borderColor}; margin-bottom: 4px;">${title}</div>
          <div style="font-size: 12px; color: #1e293b; white-space: pre-wrap;">${content || 'Não preenchido'}</div>
        </div>
      `;
    }

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Clínico - ${patName} - DietoCase</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 12mm 15mm 12mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.45;
      font-size: 12px;
      margin: 0;
      padding: 15px;
      background-color: #ffffff;
    }
    h1.report-title {
      color: #166534;
      font-size: 18px;
      text-align: center;
      margin: 0 0 4px 0;
      font-weight: 800;
    }
    h2.report-subtitle {
      color: #475569;
      font-size: 13px;
      text-align: center;
      margin: 0 0 16px 0;
      font-weight: 700;
    }
    h2.sec-heading {
      color: #0f172a;
      font-size: 14px;
      font-weight: 800;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 4px;
      margin: 20px 0 10px 0;
      text-transform: uppercase;
      page-break-after: avoid;
    }
    h3.subsec-heading {
      color: #1e293b;
      font-size: 12px;
      font-weight: 700;
      margin: 12px 0 6px 0;
      page-break-after: avoid;
    }
    p {
      margin: 4px 0 8px 0;
      font-size: 11px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 20px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
    <div>
      <strong style="color: #0f172a; font-size: 13px;">Visualização para Impressão e Salvamento em PDF</strong>
      <p style="margin: 2px 0 0 0; color: #64748b; font-size: 11px;">Relatório consolidado com esqueleto imutável. Clique no botão ao lado para salvar em PDF no seu computador.</p>
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()" style="background-color: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 12px; cursor: pointer;">
        🖨️ Imprimir / Salvar como PDF
      </button>
      <button onclick="window.close()" style="background-color: #e2e8f0; color: #334155; border: none; padding: 8px 12px; border-radius: 6px; font-weight: bold; font-size: 12px; cursor: pointer;">
        Fechar
      </button>
    </div>
  </div>

  <h1 class="report-title">DIETOCASE - DISCIPLINA DE DIETOTERAPIA</h1>
  <h2 class="report-subtitle">RELATÓRIO CLÍNICO-NUTRICIONAL E CONDUTA DIETOTERÁPICA</h2>

  ${renderTableHtml(
    ["DADOS DA AVALIAÇÃO PRÁTICA", "INFORMAÇÕES REGISTRADAS"],
    [
      ["Estudante de Nutrição:", aluno.nome || "Não informado / ---"],
      ["Matrícula / Turma:", aluno.matriculaTurma || "Não informado / ---"],
      ["Data do Atendimento:", dataFormatada || "Não informada / ---"],
      ["Modalidade da Prática:", isRealPatient ? "Atendimento Presencial Real (Consulta Ambulatorial / Hospitalar)" : "Simulação Clínica Baseada em Casos"],
      ["Caso Clínico da Disciplina:", isRealPatient ? "Atendimento Clínico Presencial Real (Prontuário Livre)" : (clinicalCase.title || "Caso Simulado DietoCase")],
      [isRealPatient ? "Paciente Real:" : "Paciente Simulado:", `${patName}, ${patAge}, ${patGender} (Ocupação: ${patOccupation})`],
      ["Hipótese Diagnóstica / Diagnóstico Médico:", hipoteseDiagnostica]
    ]
  )}

  <h2 class="sec-heading">1. PRONTUÁRIO CLÍNICO-NUTRICIONAL (ANAMNESE)</h2>
  
  <h3 class="subsec-heading">1.1. Identificação do Paciente & Histórico Social</h3>
  ${renderTableHtml(
    ["CAMPO DE IDENTIFICAÇÃO / HISTÓRICO SOCIAL", "INFORMAÇÃO REGISTRADA"],
    [
      ["Nome do Paciente:", patName || "Não informado / ---"],
      ["Idade:", patAge || "Não informada / ---"],
      ["Gênero / Sexo:", patGender || "Não informado / ---"],
      ["Naturalidade:", realPat.naturalidade || anamnese.naturalidade || patient.naturalidade || "Não informada / ---"],
      ["Procedência:", realPat.procedencia || anamnese.procedencia || patient.procedencia || "Não informada / ---"],
      ["Estado Civil:", realPat.historicoSocial?.estadoCivil || realPat.estadoCivil || anamnese.estadoCivil || patient.estadoCivil || "Não informado / ---"],
      ["Renda Familiar:", realPat.historicoSocial?.renda || realPat.renda || anamnese.renda || patient.renda || "Não informada / ---"],
      ["Profissão / Ocupação:", patOccupation || "Não informada / ---"],
      ["Condições de Moradia:", realPat.historicoSocial?.moradia || realPat.moradia || anamnese.moradia || patient.moradia || "Não informada / ---"],
      ["Escolaridade:", realPat.historicoSocial?.escolaridade || realPat.escolaridade || anamnese.escolaridade || patient.escolaridade || "Não informada / ---"]
    ]
  )}

  <h3 class="subsec-heading">1.2. Diagnóstico Médico de Base & Queixa Principal</h3>
  ${renderCalloutHtml("Hipótese Diagnóstica / Diagnóstico Médico:", hipoteseDiagnostica, "#991b1b", "#fef2f2")}
  <p><strong>Queixa Principal:</strong> ${anamnese.queixaPrincipal || "Não preenchida / ---"}</p>
  <p><strong>História da Doença Atual (HDA):</strong> ${anamnese.historiaClinica || "Não preenchida / ---"}</p>

  <h3 class="subsec-heading">1.3. Antecedentes Patológicos, Medicamentos e Estilo de Vida</h3>
  <p><strong>Antecedentes Patológicos e Medicamentos:</strong> ${anamnese.antecedentesMedicamentos || "Não preenchido / ---"}</p>
  <p><strong>Hábitos e Estilo de Vida:</strong> ${anamnese.habitosEstiloVida || "Não preenchido / ---"}</p>

  <h3 class="subsec-heading">1.4. Interações Droga-Nutriente & Farmacoterapia Aplicada</h3>
  ${renderTableHtml(
    ["Medicação (Nome do remédio em uso)", "Classificação (Classe farmacológica)", "Interação (Descrição manual da interação)"],
    (Array.isArray(studentData.interacaoDrogaNutriente) && studentData.interacaoDrogaNutriente.length > 0)
      ? studentData.interacaoDrogaNutriente.map(i => [i.medicacao || i.medicamento || "---", i.classificacao || i.nutrientes || "---", i.interacao || i.conduta || "---"])
      : [["---", "---", "Nenhuma interação medicamentosa registrada / Não preenchido"]]
  )}
  <p><strong>Observações Farmacoterapêuticas:</strong> ${studentData.observacoesFarmacoterapia || "Não preenchido / ---"}</p>

  <h3 class="subsec-heading">1.5. Avaliação Antropométrica e Estado Nutricional</h3>
  ${antro.triagemNutricional?.tipo === "hospitalar"
    ? renderTableHtml(
        ["Parâmetro da Triagem Hospitalar", "Dado Registrado"],
        [
          ["Modalidade do Atendimento:", "Hospitalar"],
          ["Triagem Utilizada:", antro.triagemNutricional.ferramenta || "Não informada / ---"],
          ["Pontuação Obtida:", antro.triagemNutricional.pontuacao !== undefined && antro.triagemNutricional.pontuacao !== null ? String(antro.triagemNutricional.pontuacao) : "---"],
          ["Diagnóstico da Triagem:", antro.triagemNutricional.diagnostico || "Não preenchido / ---"]
        ]
      )
    : renderTableHtml(
        ["Parâmetro da Triagem Nutricional", "Dado Registrado"],
        [
          ["Modalidade do Atendimento:", "Ambulatorial"],
          ["Triagem Hospitalar (NRS/MUST):", "Dispensada no atendimento ambulatorial / Não realizada"]
        ]
      )
  }

  ${renderTableHtml(
    ["Parâmetro Antropométrico", "Valor Coletado / Calculado", "Classificação / Observação Clínica"],
    [
      ["Peso Atual (Aferido)", antro.pesoAtual ? `${antro.pesoAtual} kg` : (antro.pesoEstimadoChumlea ? `${antro.pesoEstimadoChumlea} kg (Estimado Chumlea)` : "Não aferido / ---"), antro.pesoAtual ? "Medição direta" : (antro.pesoEstimadoChumlea ? "Estimado por CB e AJ" : "-")],
      ["Estatura (Aferida)", antro.estatura ? `${antro.estatura} m` : (antro.estaturaEstimadaChumlea ? `${antro.estaturaEstimadaChumlea} m (Estimada Chumlea)` : "Não aferida / ---"), antro.estatura ? "Medição direta" : (antro.estaturaEstimadaChumlea ? "Estimada por AJ e Idade" : "-")],
      ["Peso Habitual", antro.pesoHabitual ? `${antro.pesoHabitual} kg` : "Não informado / ---", "-"],
      ["Altura do Joelho (AJ)", antro.alturaJoelho ? `${antro.alturaJoelho} cm` : "Não aferida / ---", "Parâmetro para equações de Chumlea"],
      ["Circunferência do Braço (CB)", antro.circBraco ? `${antro.circBraco} cm` : "Não aferida / ---", "Reserva muscular / Estimativa Chumlea"],
      ["Peso Estimado (Chumlea 1985)", antro.pesoEstimadoChumlea ? `${antro.pesoEstimadoChumlea} kg` : "Não calculado / ---", "Equação indireta (sem peso aferido)"],
      ["Estatura Estimada (Chumlea 1985)", antro.estaturaEstimadaChumlea ? `${antro.estaturaEstimadaChumlea} m` : "Não calculada / ---", "Equação indireta (sem estatura aferida)"],
      ["Índice de Massa Corporal (IMC)", antro.imc ? `${antro.imc} kg/m²` : "Não calculado / ---", antro.classificacaoImc ? `${antro.classificacaoImc} (${antro.criterioClassificacao || 'Critério Clínico'})` : "Não classificado / ---"],
      ["Percentual de Perda Ponderal", antro.percentualPerda ? `${antro.percentualPerda} %` : "Não informado / ---", "-"],
      ["Circunferência da Cintura (CC)", antro.circCintura ? `${antro.circCintura} cm` : "Não aferida / ---", "Risco cardiovascular e adiposidade central"],
      ["Circunferência do Quadril (CQ)", antro.circQuadril ? `${antro.circQuadril} cm` : "Não aferida / ---", "Ginoide / Relação RCQ"],
      ["Circunferência da Panturrilha (CP)", antro.circPanturrilha ? `${antro.circPanturrilha} cm` : "Não aferida / ---", "Massa muscular esquelética"],
      ["Circunferência do Punho", antro.circPunho ? `${antro.circPunho} cm` : "Não aferida / ---", "Determinação da compleição física"],
      ["Relação Cintura-Quadril (RCQ)", antro.rcq || "Não calculada / ---", "Distribuição corporal de gordura"],
      ["Dobras Cutâneas (DCT, DCSE, DCB, DCSI)", (antro.dobraTricipital || antro.dobraSubescapular || antro.dobraBicipital || antro.dobraSuprailiaca) ? `DCT: ${antro.dobraTricipital || '--'}mm | DCSE: ${antro.dobraSubescapular || '--'}mm | DCB: ${antro.dobraBicipital || '--'}mm | DCSI: ${antro.dobraSuprailiaca || '--'}mm` : "Não aferidas / ---", "Adiposidade subcutânea periférica e troncular"],
      ["Dobras Abdominal e Coxa", (antro.dobraAbdominal || antro.dobraCoxa) ? `Abdominal: ${antro.dobraAbdominal || '--'}mm | Coxa: ${antro.dobraCoxa || '--'}mm` : "Não aferidas / ---", "Adiposidade regional"],
      ["Demais Avaliações (CMB, AMB, RCQ)", antro.demaisAvaliacoes || "Não preenchido / ---", "Relações (RCQ, CMB, AMB)"],
      ["Resumo Síntese Antropométrica", antro.circunferenciasDobras || "Não preenchido / ---", "Síntese descritiva do aluno"]
    ]
  )}
  ${renderCalloutHtml(
    "DIAGNÓSTICO NUTRICIONAL POR EXTENSO (ESTADO PONDERAL):",
    `${antro.diagnosticoNutricionalExtenso || "Não preenchido / ---"} (Critério: ${antro.criterioClassificacao || 'OMS / Lipschitz'})`,
    "#2563eb",
    "#eff6ff"
  )}

  <h3 class="subsec-heading">1.6. Avaliação Bioquímica Relevante e Raciocínio Clínico</h3>
  ${renderTableHtml(
    ["Exame Bioquímico", "Valor de Referência", "Valor Achado", "Interpretação Clínica do Aluno"],
    (Array.isArray(clinicalCase.bioquimica) && clinicalCase.bioquimica.length > 0)
      ? clinicalCase.bioquimica.map(item => [item.exame, item.referencia, item.valor, (bio.interpretacoes && typeof bio.interpretacoes[item.exame] === "string" && bio.interpretacoes[item.exame].trim()) ? bio.interpretacoes[item.exame].trim() : "Não preenchido / ---"])
      : (Array.isArray(bio.listaCustom) && bio.listaCustom.length > 0)
        ? bio.listaCustom.map(item => [item.exame, item.referencia, item.valor, (bio.interpretacoes && typeof bio.interpretacoes[item.exame] === "string" && bio.interpretacoes[item.exame].trim()) ? bio.interpretacoes[item.exame].trim() : "Não preenchido / ---"])
        : [["---", "---", "Não preenchido", "Nenhum exame laboratorial registrado nesta avaliação"]]
  )}
  <p><strong>Exames Laboratoriais Apurados / Anotações:</strong> ${bio.examesRelevantes || "Não preenchido / ---"}</p>
  ${renderCalloutHtml(
    "SÍNTESE E RACIOCÍNIO CLÍNICO-NUTRICIONAL GLOBAL:",
    bio.interpretacaoNutricional || "Não preenchido / ---",
    "#059669",
    "#ecfdf5"
  )}

  <h3 class="subsec-heading">1.7. Exame Físico Nutricional e Semiologia Clínica</h3>
  ${renderTableHtml(
    ["Sistema Orgânico", "Avaliação Clínica / Achados"],
    [
      ["Neurológico", ef.orgaosSistemas?.neurologico || "Sem alterações relatadas / Não preenchido"],
      ["Respiratório", ef.orgaosSistemas?.respiratorio || "Sem alterações relatadas / Não preenchido"],
      ["Circulatório", ef.orgaosSistemas?.circulatorio || "Sem alterações relatadas / Não preenchido"],
      ["Digestório", ef.orgaosSistemas?.digestorio || "Sem alterações relatadas / Não preenchido"],
      ["Urinário", ef.orgaosSistemas?.urinario || "Sem alterações relatadas / Não preenchido"],
      ["Muscular", ef.orgaosSistemas?.muscular || "Sem alterações relatadas / Não preenchido"]
    ]
  )}
  ${renderTableHtml(
    ["Compartimento Anatômico", "Semiologia Nutricional / Reserva Muscular e Adiposa"],
    [
      ["Cabeça (Fácies, cavidade oral, olhos, cabelos, bochechas)", ef.compartimentos?.cabeca || "Sem alterações evidentes / Não preenchido"],
      ["Tronco (Clavícula, tórax, costelas, coluna, região lombar/sacral)", ef.compartimentos?.tronco || "Sem alterações evidentes / Não preenchido"],
      ["Membros Superiores - MMSS (Bíceps, tríceps, deltoide, mãos, unhas)", ef.compartimentos?.mmss || "Sem alterações evidentes / Não preenchido"],
      ["Membros Inferiores - MMII (Coxa, quadríceps, joelho, panturrilha, tornozelo, edemas)", ef.compartimentos?.mmii || "Sem alterações evidentes / Não preenchido"]
    ]
  )}
  <p><strong>Sinais Clínicos e Achados Adicionais:</strong> ${ef.sinaisClinicos || "Não preenchido / ---"}</p>

  <h3 class="subsec-heading">1.8. Consumo Alimentar e Inquérito Nutricional</h3>
  <p><strong>Resumo do Recordatório Alimentar / Padrão Dietético:</strong> ${ca.inqueritoResumo || "Não preenchido / ---"}</p>
  <p><strong>Ingestão Hídrica, Preferências e Aversões:</strong> ${ca.aguaPreferenciasAversoes || "Não preenchido / ---"}</p>
  
  <h3 class="subsec-heading">1.8.1. Refeições e Alimentos no Recordatório de 24h</h3>
  ${renderTableHtml(
    ["Refeição e Horário", "Alimentos, Medidas Caseiras e Gramaturas (TACO)"],
    (Array.isArray(ca.refeicoesRecordatorio) && ca.refeicoesRecordatorio.some(r => r.itens && r.itens.length > 0))
      ? ca.refeicoesRecordatorio.filter(r => r.itens && r.itens.length > 0).map(r => [
          `${r.refeicao} (${r.horario || '--:--'})`,
          r.itens.map(it => `• ${it.alimentoNome || 'Alimento'} (${it.medidaCaseira || ''} - ${it.gramatura || 0}g) [${it.kcal || 0} kcal]`).join("\n") + (r.tipoPreparacao ? `\nPreparação: ${r.tipoPreparacao}` : "")
        ])
      : [["---", "Nenhuma refeição detalhada no recordatório alimentar / Não preenchido"]]
  )}

  <h3 class="subsec-heading">1.8.2. Avaliação Quantitativa Consolidada do Recordatório de 24h (Macros e Micros)</h3>
  ${renderTableHtml(
    ["Parâmetro Nutricional Consumido", "Total Ingerido no R24h", "Régua da Prescrição / Observação Oficial"],
    [
      ["VET Consumido no Recordatório", ca.totaisRecordatorio?.vetTotalKcal ? `${ca.totaisRecordatorio.vetTotalKcal} kcal/dia` : (ca.vetRecordatorio ? `${ca.vetRecordatorio} kcal/dia` : "Não preenchido / ---"), `NEE do Caso: ${ca.neeCaso ? ca.neeCaso + ' kcal/dia' : '---'} (${ca.adequacaoVetPct || ca.totaisRecordatorio?.adequacaoVetPct || '---'}% da meta)`],
      ["Carboidratos Consumidos", ca.totaisRecordatorio?.carboidratosG !== undefined ? `${ca.totaisRecordatorio.carboidratosG} g (${ca.totaisRecordatorio.carboidratosPct || 0}% do VET)` : "Não preenchido / ---", ca.totaisRecordatorio?.statusMacros?.cho ? `Status: ${ca.totaisRecordatorio.statusMacros.cho.label}` : "---"],
      ["Proteínas Consumidas", ca.totaisRecordatorio?.proteinasG !== undefined ? `${ca.totaisRecordatorio.proteinasG} g (${ca.totaisRecordatorio.proteinasGKg ? ca.totaisRecordatorio.proteinasGKg + ' g/kg' : '--'}, ${ca.totaisRecordatorio.proteinasPct || 0}%)` : "Não preenchido / ---", ca.totaisRecordatorio?.statusMacros?.ptn ? `Status: ${ca.totaisRecordatorio.statusMacros.ptn.label}` : "---"],
      ["Lipídios Consumidos", ca.totaisRecordatorio?.lipidiosG !== undefined ? `${ca.totaisRecordatorio.lipidiosG} g (${ca.totaisRecordatorio.lipidiosPct || 0}% do VET)` : "Não preenchido / ---", ca.totaisRecordatorio?.statusMacros?.lip ? `Status: ${ca.totaisRecordatorio.statusMacros.lip.label}` : "---"],
      ["Fibras Alimentares Totais", ca.totaisRecordatorio?.fibrasG !== undefined ? `${ca.totaisRecordatorio.fibrasG} g/dia` : "Não preenchido / ---", "Tabela TACO (UNICAMP, 4ª edição)"],
      ["Cálcio (Ca) Consumido", ca.totaisRecordatorio?.calcioMg !== undefined ? `${ca.totaisRecordatorio.calcioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
      ["Ferro (Fe) Consumido", ca.totaisRecordatorio?.ferroMg !== undefined ? `${ca.totaisRecordatorio.ferroMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
      ["Sódio (Na) Consumido", ca.totaisRecordatorio?.sodioMg !== undefined ? `${ca.totaisRecordatorio.sodioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
      ["Potássio (K) Consumido", ca.totaisRecordatorio?.potassioMg !== undefined ? `${ca.totaisRecordatorio.potassioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"]
    ]
  )}

  <h2 class="sec-heading">2. RESOLUÇÃO DIETOTERÁPICA E CONDUTA NUTRICIONAL</h2>

  <h3 class="subsec-heading">2.1. Diagnóstico em Nutrição (Metodologia PES)</h3>
  ${renderCalloutHtml(
    "DIAGNÓSTICO EM NUTRIÇÃO (PES):",
    pes.textoCompletoPES || `Problema (P): ${pes.problema || 'Não informado'} | Relacionado a (E): ${pes.etiologia || 'Não informada'} | Evidenciado por (S): ${pes.sinaisSintomas || 'Não informado'}`,
    "#15803d",
    "#f0fdf4"
  )}

  <!-- 2.1.1. OBJETIVOS DIETOTERÁPICOS E METAS DO CUIDADO (OBRIGATÓRIO LOGO APÓS O PES) -->
  <h3 class="subsec-heading">2.1.1. Objetivos Dietoterápicos e Metas do Cuidado</h3>
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; font-size: 11px; white-space: pre-wrap;">
    ${pes.objetivosDietoterapicos || "Não preenchido"}
  </div>

  <h3 class="subsec-heading">2.2. Cálculos de Necessidades Energéticas e Equações Preditivas</h3>
  ${renderTableHtml(
    ["Equação Preditiva Selecionada", "Desenvolvimento Matemático Aberto (Variáveis Digitadas)", "Resultado Calculado"],
    (() => {
      const fRows = [];
      const fSel = Array.isArray(calc.formulasSelecionadas) ? calc.formulasSelecionadas : [];
      if (fSel.includes("bolso") || calc.bolso?.resultadoKcal || calc.bolso?.equacaoDescritiva) {
        fRows.push(["Fórmula de Bolso (Regra Prática)", calc.bolso?.equacaoDescritiva || `[${calc.bolso?.minKcalKg || '--'} a ${calc.bolso?.maxKcalKg || '--'} kcal/kg] × ${calc.bolso?.pesoKg || '--'} kg`, calc.bolso?.resultadoKcal ? `${calc.bolso.resultadoKcal} kcal/dia` : "Faixa calculada"]);
      }
      if (fSel.includes("harrisBenedict") || calc.harrisBenedict?.resultadoKcal || calc.harrisBenedict?.equacaoDescritiva) {
        fRows.push([`Harris-Benedict (1919) - ${calc.harrisBenedict?.genero || calc.generoUtilizado || 'Masculino'}`, calc.harrisBenedict?.equacaoDescritiva || "GEB × FA × FI", calc.harrisBenedict?.resultadoKcal ? `${calc.harrisBenedict.resultadoKcal} kcal/dia` : "Não informado"]);
      }
      if (fSel.includes("mifflin") || calc.mifflin?.resultadoKcal || calc.mifflin?.equacaoDescritiva) {
        fRows.push([`Mifflin-St Jeor (1990) - ${calc.mifflin?.genero || calc.generoUtilizado || 'Masculino'}`, calc.mifflin?.equacaoDescritiva || "TMB × NAF (Diretriz AND)", calc.mifflin?.resultadoKcal ? `${calc.mifflin.resultadoKcal} kcal/dia` : "Não informado"]);
      }
      if (fSel.includes("faoOms") || calc.faoOms?.resultadoKcal || calc.faoOms?.equacaoDescritiva) {
        fRows.push(["FAO / OMS (1985 / 2004)", calc.faoOms?.equacaoDescritiva || "TMB por idade/peso × FA × FI", calc.faoOms?.resultadoKcal ? `${calc.faoOms.resultadoKcal} kcal/dia` : "Não informado"]);
      }
      if (fSel.includes("eerIom") || calc.eerIom?.resultadoKcal || calc.eerIom?.equacaoDescritiva) {
        fRows.push(["EER / IOM (DRI 2002 / 2005)", calc.eerIom?.equacaoDescritiva || "Necessidade Estimada com CAF", calc.eerIom?.resultadoKcal ? `${calc.eerIom.resultadoKcal} kcal/dia` : "Não informado"]);
      }
      if (fRows.length === 0) {
        fRows.push(["1. Fórmula de Bolso (Regra Prática)", "[Kcal Mín a Máx] × Peso (kg)", "Não preenchido / ---"]);
        fRows.push(["2. Harris-Benedict (1919)", "GEB (peso, altura, idade, sexo) × FA × FI", "Não preenchido / ---"]);
        fRows.push(["3. Mifflin-St Jeor (1990)", "GEB (peso, altura, idade, sexo) × FA × FI", "Não preenchido / ---"]);
        fRows.push(["4. FAO / OMS (1985 / 2004)", "GEB = (Constante Idade × Peso) + Constante Fixa × FA × FI", "Não preenchido / ---"]);
        fRows.push(["5. EER / IOM (DRI 2002 / 2005)", "EER = Constante - (Fator × Idade) + NAF × (FatorPeso×P + FatorAlt×A)", "Não preenchido / ---"]);
      }
      return fRows;
    })()
  )}
  ${renderCalloutHtml(
    "DECISÃO CLÍNICA E VET PLANEJADO:",
    `VET Planejado: ${calc.vetPlanejadoKcal ? calc.vetPlanejadoKcal + ' kcal/dia' : 'Não preenchido / ---'} | Taxa Metabólica Resultante: ${calc.taxaMetabolicaCalculada ? calc.taxaMetabolicaCalculada + ' kcal/kg' : (presc.regraBolsoKcalKg || '---')}\nJustificativa da Escolha Clínica: ${calc.justificativaEscolha || 'Não preenchido / ---'}`,
    "#0d9488",
    "#f0fdfa"
  )}

  <h3 class="subsec-heading">2.3. Determinação das Necessidades Energéticas e Distribuição Dinâmica de Macronutrientes</h3>
  ${renderTableHtml(
    ["Parâmetro Prescrito", "Faixa / Valor Numérico", "Kcal e Gramas Calculadas"],
    [
      ["Valor Energético Total (VET)", `${presc.vetKcal ? presc.vetKcal + ' kcal/dia' : 'Não calculado / ---'}`, `Regra de bolso: ${presc.regraBolsoKcalKg || '---'}`],
      ["Carboidratos (CHO - 4 kcal/g)", presc.distribuicaoMacros?.cho ? `${presc.distribuicaoMacros.cho.minPct}% a ${presc.distribuicaoMacros.cho.maxPct}%` : `${presc.carboidratosPct || '--'}%`, presc.distribuicaoMacros?.cho ? `${presc.distribuicaoMacros.cho.minKcal} a ${presc.distribuicaoMacros.cho.maxKcal} kcal (${presc.distribuicaoMacros.cho.minG}g a ${presc.distribuicaoMacros.cho.maxG}g)` : `${presc.carboidratosG || '--'} g`],
      ["Proteínas (PTN - 4 kcal/g)", presc.distribuicaoMacros?.ptn ? `${presc.distribuicaoMacros.ptn.minPct}% a ${presc.distribuicaoMacros.ptn.maxPct}%` : `${presc.proteinasPct || '--'}%`, presc.distribuicaoMacros?.ptn ? `${presc.distribuicaoMacros.ptn.minKcal} a ${presc.distribuicaoMacros.ptn.maxKcal} kcal (${presc.distribuicaoMacros.ptn.minG}g a ${presc.distribuicaoMacros.ptn.maxG}g)` : `${presc.proteinasG || '--'} g`],
      ["Recomendação de Proteína (g/kg)", presc.recomendacaoProteinaGKg?.minGKg ? `${presc.recomendacaoProteinaGKg.minGKg} a ${presc.recomendacaoProteinaGKg.maxGKg} g/kg/dia` : `${presc.proteinasGKg || '--'} g/kg`, presc.recomendacaoProteinaGKg?.minTotalG ? `${presc.recomendacaoProteinaGKg.minTotalG}g a ${presc.recomendacaoProteinaGKg.maxTotalG}g` : "Baseado no peso do paciente"],
      ["Lipídios (LIP - 9 kcal/g)", presc.distribuicaoMacros?.lip ? `${presc.distribuicaoMacros.lip.minPct}% a ${presc.distribuicaoMacros.lip.maxPct}%` : `${presc.lipidiosPct || '--'}%`, presc.distribuicaoMacros?.lip ? `${presc.distribuicaoMacros.lip.minKcal} a ${presc.distribuicaoMacros.lip.maxKcal} kcal (${presc.distribuicaoMacros.lip.minG}g a ${presc.distribuicaoMacros.lip.maxG}g)` : `${presc.lipidiosG || '--'} g`],
      ["Consistência da Dieta", presc.consistencia || "Normal", "-"],
      ["Fracionamento", presc.fracionamento || "5 a 6 refeições", "-"]
    ]
  )}
  <p><strong>Fibras e Micronutrientes Alvo:</strong> ${presc.fibrasMicronutrientes || "Não preenchido / ---"}</p>

  <h3 class="subsec-heading">2.4. Justificativa Fisiopatológica da Conduta</h3>
  <p>${presc.justificativaFisiopatologica || "Não preenchido / ---"}</p>

  <!-- 3. PLANEJAMENTO ALIMENTAR -->
  ${tne.viaAlimentacao === "tne"
    ? `
      <h2 class="sec-heading">3. PRESCRIÇÃO DE TERAPIA NUTRICIONAL ENTERAL (TNE)</h2>
      ${renderTableHtml(
        ["Parâmetro de TNE Prescrito", "Especificação / Cálculo do Aluno", "Finalidade Técnica"],
        [
          ["Via de Nutrição", "Terapia Nutricional Enteral (TNE)", "Via especializada não-oral"],
          ["Nome Comercial da Dieta Enteral", tne.nomeComercial || "Não informado / ---", "Fórmula enteral padronizada"],
          ["Tipo de Dieta Enteral", tne.tipoDieta || "Não especificado / ---", "-"],
          ["Densidade Calórica", tne.densidadeCalorica || "Não informada / ---", "kcal/mL"],
          ["Fracionamento / Horários", tne.fracionamento || "Não informado / ---", "Distribuição diária"],
          ["Método de Infusão", tne.viaAdministracao === "bomba" ? "Bomba de Infusão Contínua" : "Gravitacional Intermitente", "Via programada"]
        ]
      )}
      <h3 class="subsec-heading">3.1. Tabela Nutricional da Fórmula Enteral</h3>
      ${renderTableHtml(
        ["Nutriente / Marcador", "Quantidade Total Diária", "Especificação Técnica"],
        [
          ["Valor Energético Total (VET)", `${tne.tabelaNutricionalManual?.vet || '0'} kcal/dia`, "Aporte calórico diário"],
          ["Carboidratos (CHO)", `${tne.tabelaNutricionalManual?.cho || '0'} g/dia`, "4 kcal/g"],
          ["Proteínas (PTN)", `${tne.tabelaNutricionalManual?.ptn || '0'} g/dia`, "4 kcal/g"],
          ["Lipídios (LIP)", `${tne.tabelaNutricionalManual?.lip || '0'} g/dia`, "9 kcal/g"],
          ["Fibras Alimentares", `${tne.tabelaNutricionalManual?.fibra || '0'} g/dia`, "Aporte de fibras"],
          ["Sódio (Na)", `${tne.tabelaNutricionalManual?.sodio || '0'} mg/dia`, "Eletrólito"],
          ["Potássio (K)", `${tne.tabelaNutricionalManual?.potassio || '0'} mg/dia`, "Eletrólito"],
          ["Cálcio (Ca)", `${tne.tabelaNutricionalManual?.calcio || '0'} mg/dia`, "Mineral"],
          ["Fósforo (P)", `${tne.tabelaNutricionalManual?.fosforo || '0'} mg/dia`, "Mineral"]
        ]
      )}
      <h3 class="subsec-heading">3.2. Consolidação Nutricional da TNE vs Metas Prescritas (Análises Quantitativas)</h3>
      ${renderTableHtml(
        ["Parâmetro Nutricional da TNE", "Aporte Obtido pela Fórmula", "Régua da Prescrição Dietética"],
        [
          ["VET Fornecido pela TNE", `${studentData.totaisCardapio?.vetTotalKcal || 0} kcal/dia`, `Meta: ${presc.vetKcal || '--'} kcal`],
          ["Adequação do VET da TNE", `${studentData.totaisCardapio?.adequacaoVetPct ? studentData.totaisCardapio.adequacaoVetPct + '%' : '--'}`, studentData.totaisCardapio?.classificacaoAdequacao || "---"],
          ["Carboidratos da TNE", `${studentData.totaisCardapio?.carboidratosG || 0} g (${studentData.totaisCardapio?.carboidratosPct || 0}%)`, `Prescrito: ${presc.carboidratosG || '--'} g`],
          ["Proteínas da TNE", `${studentData.totaisCardapio?.proteinasG || 0} g (${studentData.totaisCardapio?.proteinasGKg ? studentData.totaisCardapio.proteinasGKg + ' g/kg' : '--'}, ${studentData.totaisCardapio?.proteinasPct || 0}%)`, `Prescrito: ${presc.proteinasG || '--'} g`],
          ["Lipídios da TNE", `${studentData.totaisCardapio?.lipidiosG || 0} g (${studentData.totaisCardapio?.lipidiosPct || 0}%)`, `Prescrito: ${presc.lipidiosG || '--'} g`]
        ]
      )}
    `
    : `
      <h2 class="sec-heading">3. PLANEJAMENTO ALIMENTAR QUALI-QUANTITATIVO (CARDÁPIO)</h2>
      <p><strong>Tipo / Consistência da Dieta Oral Definida:</strong> ${studentData.consistenciaDietaOral || presc.consistencia || "Dieta Livre / Normal"}</p>
      
      <h3 class="subsec-heading">Refeições e Alimentos do Cardápio</h3>
      ${renderTableHtml(
        ["Refeição e Horário", "Tipo de Preparação, Alimentos e Gramaturas (TACO)", "Opções de Substituição"],
        (Array.isArray(plano) && plano.length > 0)
          ? plano.map(r => {
              const mealName = r.refeicao || r.nome || "Refeição";
              const items = Array.isArray(r.itens) ? r.itens : (Array.isArray(r.alimentos) ? r.alimentos : []);
              return [
                `${mealName} (${r.horario || '--:--'})`,
                (items.length > 0)
                  ? (r.tipoPreparacao ? `Preparação: ${r.tipoPreparacao}\n` : "") + items.map(it => `• ${it.alimentoNome || it.nome || 'Alimento'} (${it.medidaCaseira || ''} - ${it.gramatura || it.quantidade || 0}g) [${it.kcal || 0} kcal]`).join("\n")
                  : (r.tipoPreparacao ? `Preparação: ${r.tipoPreparacao}\n` : "") + (r.alimentos && typeof r.alimentos === 'string' ? r.alimentos : "Alimentos não especificados"),
                r.substituicoes || "Não descrita"
              ];
            })
          : [["---", "Nenhuma refeição detalhada no planejamento alimentar / Não preenchido", "---"]]
      )}

      <!-- 3.1. CONSOLIDAÇÃO NUTRICIONAL DO CARDÁPIO (ANÁLISES QUANTITATIVAS OBRIGATÓRIAS) -->
      <h3 class="subsec-heading">3.1. Consolidação Nutricional do Cardápio vs Metas Prescritas (Análises Quantitativas)</h3>
      ${renderTableHtml(
        ["Parâmetro Nutricional Consolidado", "Aporte Obtido no Cardápio", "Régua da Prescrição Dietética"],
        [
          ["VET Total Planejado no Cardápio", totaisCardapio?.vetTotalKcal ? `${totaisCardapio.vetTotalKcal} kcal/dia` : "Não preenchido / ---", `Meta Prescrita: ${presc.vetKcal ? presc.vetKcal + ' kcal' : '---'}`],
          ["Adequação do VET do Cardápio", totaisCardapio?.adequacaoVetPct ? `${totaisCardapio.adequacaoVetPct}%` : "Não calculada / ---", `${totaisCardapio?.classificacaoAdequacao || 'Adequação calórica do cardápio'}`],
          ["Carboidratos do Cardápio", totaisCardapio?.carboidratosG !== undefined ? `${totaisCardapio.carboidratosG} g (${totaisCardapio.carboidratosPct || 0}% do VET)` : "Não preenchido / ---", totaisCardapio?.statusMacros?.cho ? `Status: ${totaisCardapio.statusMacros.cho.label}` : `Prescrito: ${presc.carboidratosG || '--'} g`],
          ["Proteínas do Cardápio", totaisCardapio?.proteinasG !== undefined ? `${totaisCardapio.proteinasG} g (${totaisCardapio.proteinasGKg ? totaisCardapio.proteinasGKg + ' g/kg' : '--'}, ${totaisCardapio.proteinasPct || 0}%)` : "Não preenchido / ---", totaisCardapio?.statusMacros?.ptn ? `Status: ${totaisCardapio.statusMacros.ptn.label}` : `Prescrito: ${presc.proteinasG || '--'} g`],
          ["Lipídios do Cardápio", totaisCardapio?.lipidiosG !== undefined ? `${totaisCardapio.lipidiosG} g (${totaisCardapio.lipidiosPct || 0}% do VET)` : "Não preenchido / ---", totaisCardapio?.statusMacros?.lip ? `Status: ${totaisCardapio.statusMacros.lip.label}` : `Prescrito: ${presc.lipidiosG || '--'} g`],
          ["Fibras Alimentares Totais", totaisCardapio?.fibrasG !== undefined ? `${totaisCardapio.fibrasG} g/dia` : "Não preenchido / ---", "Composição oficial TACO (UNICAMP)"],
          ["Cálcio (Ca) no Cardápio", totaisCardapio?.calcioMg !== undefined ? `${totaisCardapio.calcioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
          ["Ferro (Fe) no Cardápio", totaisCardapio?.ferroMg !== undefined ? `${totaisCardapio.ferroMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
          ["Sódio (Na) no Cardápio", totaisCardapio?.sodioMg !== undefined ? `${totaisCardapio.sodioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
          ["Potássio (K) no Cardápio", totaisCardapio?.potassioMg !== undefined ? `${totaisCardapio.potassioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"]
        ]
      )}
    `
  }

  <h3 class="subsec-heading">3.2. Recomendações e Orientações Dietoterápicas de Alta/Acompanhamento</h3>
  <p>${studentData.orientacoesNutricionais || "Nenhuma orientação nutricional específica registrada / Não preenchido."}</p>

  <h2 class="sec-heading">4. AVALIAÇÃO ACADÊMICA & PRECEPTORIA CLÍNICA</h2>
  ${isRealPatient
    ? `<p>Prontuário dietoterápico ambulatorial/hospitalar preenchido livremente pelo acadêmico durante a consulta presencial com paciente real. Conduta dietoterápica avaliada diretamente pela preceptoria clínica docente.</p>`
    : (clinicalCase.questoesAvaliativas && clinicalCase.questoesAvaliativas.length > 0)
      ? clinicalCase.questoesAvaliativas.map((q, idx) => `
          <div style="margin-bottom: 10px;">
            <strong style="font-size: 11px;">Questão ${idx + 1}: ${q.pergunta}</strong>
            ${renderCalloutHtml("Resposta do Estudante:", respostas[q.id] || "Questão não respondida pelo estudante.", "#0284c7", "#f0f9ff")}
          </div>
        `).join("")
      : `<p>Não foram cadastradas questões avaliativas específicas para este caso clínico.</p>`
  }

  <div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 10px; color: #64748b; text-align: center;">
    DietoCase • Simulador e Prontuário Clínico-Nutricional Baseado em Evidências • Emissão em ${dataFormatada}
  </div>
</body>
</html>
    `;
  }

  // Abre janela com visualização de impressão e dispara o diálogo nativo do navegador para Salvar em PDF
  static openPrintableReport(studentData, clinicalCase) {
    const html = this.buildHtmlReport(studentData, clinicalCase);
    const printWin = window.open("", "_blank", "width=900,height=800,menubar=no,toolbar=no,location=no,status=no");
    if (printWin) {
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        try {
          printWin.print();
        } catch (e) {
          console.warn("Diálogo de impressão bloqueado ou cancelado:", e);
        }
      }, 500);
      return printWin;
    } else {
      alert("A janela pop-up de impressão foi bloqueada pelo navegador. Permita pop-ups para visualizar e salvar o PDF.");
      return null;
    }
  }

  static generateReport(studentData, clinicalCase) {
    const doc = this.buildReportDocument(studentData, clinicalCase);
    const aluno = studentData.aluno || {};
    const cleanStudentName = (aluno.nome || "Estudante").replace(/[^a-zA-Z0-9]/g, "_");
    const isRealPatient = studentData.isRealPatient === true || clinicalCase?.isRealCase === true;
    const caseTag = isRealPatient ? "Atendimento_Real" : (clinicalCase.id || "caso");
    const filename = `DietoCase_Relatorio_${cleanStudentName}_${caseTag}.docx`;
    doc.download(filename);
    return doc;
  }
}

// Exportação global
if (typeof window !== "undefined") {
  window.DietoterapiaDocxReport = DietoterapiaDocxReport;
}
