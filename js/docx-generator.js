// Gerador do Relatório Clínico Completo e Resolução Dietoterápica em formato Microsoft Word (.docx)
// Constrói o documento com tabelas formatadas, seções estilizadas e metadados.

class DietoterapiaDocxReport {

  // Checa se uma aba ou seção específica está liberada para o aluno neste caso clínico
  // Suporta objetos de configuração flexíveis como caseConfig.abasLiberadas, clinicalCase.blockedTabs, etc.
  static isSectionLiberada(sectionKey, clinicalCase = {}) {
    if (!clinicalCase) return true;

    // Normalizador de strings (remove acentos, pontuação, espaços)
    const norm = (s) => String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const normSec = norm(sectionKey);

    const aliasesMap = {
      anamnese: ["anamnese", "historia", "historiaclinica", "anamneseclinica", "1", "1anamnese", "identificacao"],
      antropometria: ["antropometria", "antropo", "triagem", "2", "2antropometria", "avaliacaoantropometrica"],
      bioquimica: ["bioquimica", "exames", "examesbioquimicos", "laboratorio", "laboratorial", "3", "3bioquimica", "perfilbioquimico"],
      examefisico: ["examefisico", "exame_fisico", "exame-fisico", "examesfisicos", "exames_fisicos", "exames-fisicos", "semiologia", "exames fisicos", "exame fisico", "4", "4examefisico"],
      droganutriente: ["droganutriente", "droga_nutriente", "droga-nutriente", "interacoes", "farmacoterapia", "droga nutriente", "interacaodroganutriente"],
      consumo: ["consumo", "consumoalimentar", "r24h", "recordatorio", "inquerito", "5", "5consumo", "5consumor24h"],
      pes: ["pes", "diagnostico", "diagnosticonutricional", "diagnosticopes", "6", "6diagnosticopes"],
      necessidades: ["necessidades", "calculos", "calculosnecessidades", "formulas", "7", "7calculosdenecessidades", "calculosdenecessidades"],
      prescricao: ["prescricao", "prescricaodietetica", "prescricaodietoterapica", "conduta", "8", "8prescricaodietetica"],
      cardapio: ["cardapio", "planejamento", "planejamentoalimentar", "tne", "9", "9cardapio"],
      questoes: ["questoes", "questoesavaliativas", "perguntas", "avaliacao", "questoes avaliativas", "10", "10questoesavaliativas"],
      orientacao: ["orientacao", "orientacaonutricional", "orientacoes", "orientacoesnutricionais", "orientacao nutricional", "orientacoes nutricionais", "11", "11orientacao"]
    };

    // Identifica a chave canônica correspondente
    let canonical = sectionKey;
    for (const [canon, aliases] of Object.entries(aliasesMap)) {
      if (canon === normSec || aliases.some(a => norm(a) === normSec)) {
        canonical = canon;
        break;
      }
    }

    const currentAliases = aliasesMap[canonical] || [normSec];
    const matchesSection = (val) => {
      const n = norm(val);
      return currentAliases.some(a => norm(a) === n || n.includes(norm(a)) || norm(a).includes(n));
    };

    // Objeto de configuração do caso (suporta caseConfig ou propriedades diretas no caso clínico)
    const config = clinicalCase.caseConfig || clinicalCase;
    const abasLiberadas = config.abasLiberadas !== undefined ? config.abasLiberadas : clinicalCase.abasLiberadas;
    const blockedTabs = config.blockedTabs || clinicalCase.blockedTabs;
    const abasBloqueadas = config.abasBloqueadas || clinicalCase.abasBloqueadas;
    const trancadas = config.trancadas || clinicalCase.trancadas;

    // Regra específica para questões avaliativas
    if (canonical === "questoes") {
      if (clinicalCase.habilitarQuestoesAvaliativas === false || config.habilitarQuestoesAvaliativas === false) {
        return false;
      }
    }

    // Regra para arrays de bloqueio do professor (blockedTabs, abasBloqueadas, trancadas)
    const checkBlockedArray = (arr) => {
      if (!Array.isArray(arr)) return false;
      return arr.some(item => matchesSection(item));
    };

    if (checkBlockedArray(blockedTabs) || checkBlockedArray(abasBloqueadas) || checkBlockedArray(trancadas)) {
      return false;
    }

    // Regra para abasLiberadas (objeto ou array configurado pelo professor)
    if (abasLiberadas !== undefined && abasLiberadas !== null) {
      // Se for um Array de abas liberadas (allowlist): deve estar presente no array
      if (Array.isArray(abasLiberadas)) {
        return abasLiberadas.some(item => matchesSection(item));
      }

      // Se for um Objeto { [aba]: boolean | string }
      if (typeof abasLiberadas === "object") {
        let hasExplicitMatch = false;
        let matchResult = true;

        for (const [key, val] of Object.entries(abasLiberadas)) {
          if (matchesSection(key)) {
            hasExplicitMatch = true;
            // Se marcado como false, trancada, bloqueada ou oculta pelo professor
            if (val === false || val === "false" || val === 0 || val === "bloqueada" || val === "trancada" || val === "oculta" || val === "hidden") {
              return false;
            }
            if (val === true || val === "true" || val === 1 || val === "liberada" || val === "aberta" || val === "visible") {
              matchResult = true;
            }
          }
        }

        if (hasExplicitMatch) {
          return matchResult;
        }

        // Se o objeto abasLiberadas funciona como uma allowlist exclusiva (ex: apenas certas abas têm true e nenhuma false)
        const entries = Object.entries(abasLiberadas);
        const hasAnyExplicitFalse = entries.some(([_, v]) => v === false || v === "false" || v === "bloqueada" || v === "trancada" || v === "oculta");
        const hasAnyExplicitTrue = entries.some(([_, v]) => v === true || v === "true" || v === "liberada" || v === 1);

        if (hasAnyExplicitTrue && !hasAnyExplicitFalse) {
          // Allowlist estrita: só o que foi marcado como true está liberado
          return false;
        }
      }
    }

    // Por padrão, se não foi explicitamente bloqueada ou trancada, está liberada
    return true;
  }

  static buildReportDocument(studentData, clinicalCase) {
    const doc = new MiniDocx();
    // Configuração do componente nativo de Rodapé (Footer) do Word para todas as páginas
    doc.setFooter("© 2026 DietoCase - Desenvolvido por Prof. Chagas Neto. Todos os direitos reservados.");

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

    const isLiberada = (sec) => this.isSectionLiberada(sec, clinicalCase);

    // 3. SEÇÃO I: PRONTUÁRIO CLÍNICO-NUTRICIONAL CONSTRUÍDO (Renderização Condicional por Aba)
    const hasSec1 = isLiberada("anamnese") || isLiberada("droganutriente") || isLiberada("antropometria") || isLiberada("bioquimica") || isLiberada("examefisico") || isLiberada("consumo");
    if (hasSec1) {
      doc.addHeading("1. PRONTUÁRIO CLÍNICO-NUTRICIONAL (ANAMNESE)", 1);
    }

    // 1.1, 1.2, 1.3: Anamnese e História Clínica
    if (isLiberada("anamnese")) {
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
    }

    // 1.4. INTERAÇÕES DROGA-NUTRIENTE
    if (isLiberada("droganutriente")) {
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
    }

    // 1.5. AVALIAÇÃO ANTROPOMÉTRICA
    if (isLiberada("antropometria")) {
      doc.addHeading("1.5. Avaliação Antropométrica e Estado Nutricional", 2);

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

      const antroRows = [
        ["Peso Atual (Aferido)", antro.pesoAtual ? `${antro.pesoAtual} kg` : (antro.pesoEstimadoChumlea ? `${antro.pesoEstimadoChumlea} kg (Estimado Chumlea)` : "Não aferido / ---"), antro.pesoAtual ? "Medição direta" : (antro.pesoEstimadoChumlea ? "Estimado por CB e AJ" : "-")],
        ["Estatura (Aferida)", antro.estatura ? `${antro.estatura} m` : (antro.estaturaEstimadaChumlea ? `${antro.estaturaEstimadaChumlea} m (Estimada Chumlea)` : "Não aferida / ---"), antro.estatura ? "Medição direta" : (antro.estaturaEstimadaChumlea ? "Estimada por AJ e Idade" : "-")],
        ["Peso Habitual (Opcional)", antro.pesoHabitual ? `${antro.pesoHabitual} kg` : "Não informado / ---", "-"],
        ["Altura do Joelho (AJ)", antro.alturaJoelho ? `${antro.alturaJoelho} cm` : "Não aferida / ---", "Parâmetro para equações de Chumlea"],
        ["Circunferência do Braço (CB)", antro.circBraco ? `${antro.circBraco} cm` : "Não aferida / ---", "Reserva muscular / Estimativa Chumlea"],
        ["Peso Estimado (Chumlea 1985)", antro.pesoEstimadoChumlea ? `${antro.pesoEstimadoChumlea} kg` : "Não calculado / ---", "Equação indireta (sem peso aferido)"],
        ["Estatura Estimada (Chumlea 1985)", antro.estaturaEstimadaChumlea ? `${antro.estaturaEstimadaChumlea} m` : "Não calculada / ---", "Equação indireta (sem estatura aferida)"],
        ["Índice de Massa Corporal (IMC)", antro.imc ? `${antro.imc} kg/m²` : "Não calculado / ---", antro.classificacaoImc ? `${antro.classificacaoImc} (${antro.criterioClassificacao || 'Critério Clínico'})` : "Não classificado / ---"],
        ["IMC Ideal (Opcional)", antro.imcIdeal ? `${antro.imcIdeal} kg/m²` : "Não informado / ---", "Meta clínica de adequação ponderal"],
        ["Percentual de Perda Ponderal (Opcional)", (antro.percentualPerda || antro.perdaPesoPct) ? `${antro.percentualPerda || antro.perdaPesoPct} %` : "Não informado / ---", (antro.percentualPerda || antro.perdaPesoPct) ? `${antro.percentualPerda || antro.perdaPesoPct}% de alteração` : "-"],
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
        antroRows,
        [3200, 2600, 3200]
      );

      doc.addCallout(
        "DIAGNÓSTICO NUTRICIONAL POR EXTENSO (ESTADO PONDERAL):",
        `${antro.diagnosticoNutricionalExtenso || "Não preenchido / ---"} (Critério: ${antro.criterioClassificacao || 'OMS / Lipschitz'})`,
        "2563eb",
        "eff6ff"
      );
    }

    // 1.6. AVALIAÇÃO BIOQUÍMICA
    if (isLiberada("bioquimica")) {
      doc.addHeading("1.6. Avaliação Bioquímica Relevante e Raciocínio Clínico", 2);
      let bioRows = [];
      if (Array.isArray(bio.exames) && bio.exames.length > 0) {
        bioRows = bio.exames.map(item => [
          item.exame || "Não preenchido",
          item.referencia || "---",
          item.valor || "Não preenchido",
          (item.interpretacao && typeof item.interpretacao === "string" && item.interpretacao.trim()) ? item.interpretacao.trim() : ((bio.interpretacoes && typeof bio.interpretacoes[item.exame] === "string" && bio.interpretacoes[item.exame].trim()) ? bio.interpretacoes[item.exame].trim() : "Não preenchido / ---")
        ]);
      } else if (Array.isArray(bio.listaCustom) && bio.listaCustom.length > 0) {
        bioRows = bio.listaCustom.map(item => [
          item.exame || "Não preenchido",
          item.referencia || "---",
          item.valor || "Não preenchido",
          (item.interpretacao && typeof item.interpretacao === "string" && item.interpretacao.trim()) ? item.interpretacao.trim() : ((bio.interpretacoes && typeof bio.interpretacoes[item.exame] === "string" && bio.interpretacoes[item.exame].trim()) ? bio.interpretacoes[item.exame].trim() : "Não preenchido / ---")
        ]);
      } else if (Array.isArray(clinicalCase?.bioquimica) && clinicalCase.bioquimica.length > 0) {
        bioRows = clinicalCase.bioquimica.map(item => [
          item.exame || "Não preenchido",
          item.referencia || "---",
          item.valor || "Não preenchido",
          (bio.interpretacoes && typeof bio.interpretacoes[item.exame] === "string" && bio.interpretacoes[item.exame].trim()) ? bio.interpretacoes[item.exame].trim() : "Não preenchido / ---"
        ]);
      } else {
        bioRows = [["---", "---", "Não preenchido", "Nenhum exame laboratorial registrado nesta avaliação"]];
      }

      doc.addTable(
        ["Exame Bioquímico", "Valor de Referência", "Valor Achado", "Interpretação Clínica do Aluno"],
        bioRows,
        [2400, 2000, 1800, 2800]
      );
      doc.addParagraph(`Exames Laboratoriais Apurados / Anotações: ${bio.examesRelevantes || "Não preenchido / ---"}`);
      doc.addCallout(
        "SÍNTESE E RACIOCÍNIO CLÍNICO-NUTRICIONAL GLOBAL:",
        bio.interpretacaoNutricional || "Não preenchido / ---",
        "059669",
        "ecfdf5"
      );
    }

    // 1.7. EXAME FÍSICO NUTRICIONAL
    if (isLiberada("examefisico")) {
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
    }

    // 1.8. CONSUMO ALIMENTAR
    if (isLiberada("consumo")) {
      doc.addHeading("1.8. Consumo Alimentar e Inquérito Nutricional", 2);
      doc.addParagraph(`Resumo do Recordatório Alimentar / Padrão Dietético: ${ca.inqueritoResumo || "Não preenchido / ---"}`);
      doc.addParagraph(`Ingestão Hídrica, Preferências e Aversões: ${ca.aguaPreferenciasAversoes || "Não preenchido / ---"}`);

      doc.addHeading("1.8.1. Refeições e Alimentos no Recordatório de 24h", 3);
      const r24Rows = [];
      if (Array.isArray(ca.refeicoesRecordatorio) && ca.refeicoesRecordatorio.some(r => r.itens && r.itens.length > 0)) {
        ca.refeicoesRecordatorio.filter(r => r.itens && r.itens.length > 0).forEach(r => {
          const itemsStr = r.itens.map(it => `• ${it.alimentoNome || 'Alimento'} (${it.medidaCaseira || ''} - ${it.gramatura || 0}g) [${it.kcal || 0} kcal]`).join("\n");
          r24Rows.push([
            `${r.refeicao} (${r.horario || '--:--'})`,
            itemsStr + (r.tipoPreparacao ? `\nPreparação: ${r.tipoPreparacao}` : "")
          ]);
        });
      }
      if (r24Rows.length === 0) {
        r24Rows.push(["---", "Nenhuma refeição detalhada no recordatório alimentar / Não preenchido"]);
      }
      doc.addTable(
        ["Refeição e Horário", "Alimentos, Medidas Caseiras e Gramaturas (TACO)"],
        r24Rows,
        [3000, 6000]
      );

      doc.addHeading("1.8.2. Avaliação Quantitativa Consolidada do Recordatório de 24h (Macros e Micros)", 3);
      const satStr = (ca.totaisRecordatorio?.gorduraSaturadaG || ca.totaisRecordatorio?.gorduraSaturadaPct)
        ? `${ca.totaisRecordatorio?.gorduraSaturadaG ? ca.totaisRecordatorio.gorduraSaturadaG + ' g' : ''}${ca.totaisRecordatorio?.gorduraSaturadaG && ca.totaisRecordatorio?.gorduraSaturadaPct ? ' (' + ca.totaisRecordatorio.gorduraSaturadaPct + '% do VET)' : (ca.totaisRecordatorio?.gorduraSaturadaPct ? ca.totaisRecordatorio.gorduraSaturadaPct + ' %' : '')}`
        : "Não preenchido / ---";
      const monoStr = (ca.totaisRecordatorio?.gorduraMonoinsaturadaG || ca.totaisRecordatorio?.gorduraMonoinsaturadaPct)
        ? `${ca.totaisRecordatorio?.gorduraMonoinsaturadaG ? ca.totaisRecordatorio.gorduraMonoinsaturadaG + ' g' : ''}${ca.totaisRecordatorio?.gorduraMonoinsaturadaG && ca.totaisRecordatorio?.gorduraMonoinsaturadaPct ? ' (' + ca.totaisRecordatorio.gorduraMonoinsaturadaPct + '% do VET)' : (ca.totaisRecordatorio?.gorduraMonoinsaturadaPct ? ca.totaisRecordatorio.gorduraMonoinsaturadaPct + ' %' : '')}`
        : "Não preenchido / ---";
      const poliStr = (ca.totaisRecordatorio?.gorduraPoliinsaturadaG || ca.totaisRecordatorio?.gorduraPoliinsaturadaPct)
        ? `${ca.totaisRecordatorio?.gorduraPoliinsaturadaG ? ca.totaisRecordatorio.gorduraPoliinsaturadaG + ' g' : ''}${ca.totaisRecordatorio?.gorduraPoliinsaturadaG && ca.totaisRecordatorio?.gorduraPoliinsaturadaPct ? ' (' + ca.totaisRecordatorio.gorduraPoliinsaturadaPct + '% do VET)' : (ca.totaisRecordatorio?.gorduraPoliinsaturadaPct ? ca.totaisRecordatorio.gorduraPoliinsaturadaPct + ' %' : '')}`
        : "Não preenchido / ---";

      doc.addTable(
        ["Parâmetro Nutricional Consumido", "Total Ingerido no R24h", "Régua da Prescrição / Observação Oficial"],
        [
          ["VET Consumido no Recordatório", ca.totaisRecordatorio?.vetTotalKcal ? `${ca.totaisRecordatorio.vetTotalKcal} kcal/dia` : (ca.vetRecordatorio ? `${ca.vetRecordatorio} kcal/dia` : "Não preenchido / ---"), `NEE do Caso: ${ca.neeCaso ? ca.neeCaso + ' kcal/dia' : '---'} (${ca.adequacaoVetPct || ca.totaisRecordatorio?.adequacaoVetPct || '---'}% da meta)`],
          ["Carboidratos Consumidos", ca.totaisRecordatorio?.carboidratosG !== undefined ? `${ca.totaisRecordatorio.carboidratosG} g (${ca.totaisRecordatorio.carboidratosPct || 0}% do VET)` : "Não preenchido / ---", ca.totaisRecordatorio?.statusMacros?.cho ? `Status: ${ca.totaisRecordatorio.statusMacros.cho.label}` : "---"],
          ["Proteínas Consumidas", ca.totaisRecordatorio?.proteinasG !== undefined ? `${ca.totaisRecordatorio.proteinasG} g (${ca.totaisRecordatorio.proteinasGKg ? ca.totaisRecordatorio.proteinasGKg + ' g/kg' : '--'}, ${ca.totaisRecordatorio.proteinasPct || 0}%)` : "Não preenchido / ---", ca.totaisRecordatorio?.statusMacros?.ptn ? `Status: ${ca.totaisRecordatorio.statusMacros.ptn.label}` : "---"],
          ["Lipídios Consumidos", ca.totaisRecordatorio?.lipidiosG !== undefined ? `${ca.totaisRecordatorio.lipidiosG} g (${ca.totaisRecordatorio.lipidiosPct || 0}% do VET)` : "Não preenchido / ---", ca.totaisRecordatorio?.statusMacros?.lip ? `Status: ${ca.totaisRecordatorio.statusMacros.lip.label}` : "---"],
          ["  • Gordura Saturada (%) [SAT]", satStr, `Meta: < 10% do VET [${ca.totaisRecordatorio?.statusLipidios?.sat?.label || (parseFloat(ca.totaisRecordatorio?.gorduraSaturadaPct) < 10 ? 'Adequado' : 'Inadequado')}]`],
          ["  • Gordura Monoinsaturada (%) [MONO]", monoStr, `Meta: Até 20% do VET [${ca.totaisRecordatorio?.statusLipidios?.mono?.label || (parseFloat(ca.totaisRecordatorio?.gorduraMonoinsaturadaPct) <= 20 ? 'Adequado' : 'Inadequado')}]`],
          ["  • Gordura Poli-insaturada (%) [POLI]", poliStr, `Meta: Em média 10% do VET [${ca.totaisRecordatorio?.statusLipidios?.poli?.label || (parseFloat(ca.totaisRecordatorio?.gorduraPoliinsaturadaPct) <= 10.5 ? 'Adequado' : 'Inadequado')}]`],
          ["Fibras Alimentares Totais", ca.totaisRecordatorio?.fibrasG !== undefined ? `${ca.totaisRecordatorio.fibrasG} g/dia` : "Não preenchido / ---", "Tabela TACO (UNICAMP, 4ª edição)"],
          ["Cálcio (Ca) Consumido", ca.totaisRecordatorio?.calcioMg !== undefined ? `${ca.totaisRecordatorio.calcioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
          ["Ferro (Fe) Consumido", ca.totaisRecordatorio?.ferroMg !== undefined ? `${ca.totaisRecordatorio.ferroMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
          ["Sódio (Na) Consumido", ca.totaisRecordatorio?.sodioMg !== undefined ? `${ca.totaisRecordatorio.sodioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
          ["Potássio (K) Consumido", ca.totaisRecordatorio?.potassioMg !== undefined ? `${ca.totaisRecordatorio.potassioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"]
        ],
        [3400, 2800, 2800]
      );
    }

    // 4. SEÇÃO II: RESOLUÇÃO DIETOTERÁPICA E CONDUTA NUTRICIONAL
    const hasSec2 = isLiberada("pes") || isLiberada("necessidades") || isLiberada("prescricao");
    if (hasSec2) {
      doc.addHeading("2. RESOLUÇÃO DIETOTERÁPICA E CONDUTA NUTRICIONAL", 1);
    }

    // 2.1. DIAGNÓSTICO EM NUTRIÇÃO (PES)
    if (isLiberada("pes")) {
      doc.addHeading("2.1. Diagnóstico em Nutrição (Metodologia PES)", 2);
      const pesTexto = pes.textoCompletoPES || `Problema (P): ${pes.problema || 'Não informado'} | Relacionado a (E): ${pes.etiologia || 'Não informada'} | Evidenciado por (S): ${pes.sinaisSintomas || 'Não informado'}`;
      doc.addCallout("DIAGNÓSTICO EM NUTRIÇÃO (PES):", pesTexto, "15803d", "f0fdf4");

      doc.addHeading("2.1.1. Objetivos Dietoterápicos e Metas do Cuidado", 2);
      doc.addParagraph(pes.objetivosDietoterapicos || "Não preenchido");
    }

    // 2.2. CÁLCULO DE NECESSIDADES ENERGÉTICAS (5 FÓRMULAS ABERTAS)
    const calc = studentData.calculoNecessidades || {};
    if (isLiberada("necessidades")) {
      doc.addHeading("2.2. Cálculos de Necessidades Energéticas e Equações Preditivas", 2);
      const formulasRows = [];
      const fSel = Array.isArray(calc.formulasSelecionadas) ? calc.formulasSelecionadas : [];

      if (fSel.includes("bolso") || calc.bolso?.resultadoKcal || calc.bolso?.equacaoDescritiva) {
        formulasRows.push(["Fórmula de Bolso (Regra Prática)", calc.bolso?.equacaoDescritiva || `[${calc.bolso?.minKcalKg || '--'} a ${calc.bolso?.maxKcalKg || '--'} kcal/kg] × ${calc.bolso?.pesoKg || '--'} kg`, calc.bolso?.resultadoKcal ? `${calc.bolso.resultadoKcal} kcal/dia` : "Faixa calculada"]);
      }
      if (fSel.includes("harrisBenedict") || calc.harrisBenedict?.resultadoKcal || calc.harrisBenedict?.equacaoDescritiva) {
        formulasRows.push([`Harris-Benedict (1919) - ${calc.harrisBenedict?.genero || calc.generoUtilizado || 'Masculino'}`, calc.harrisBenedict?.equacaoDescritiva || "GEB × FA × FI", calc.harrisBenedict?.resultadoKcal ? `${calc.harrisBenedict.resultadoKcal} kcal/dia` : "Não informado"]);
      }
      if (fSel.includes("mifflin") || calc.mifflin?.resultadoKcal || calc.mifflin?.equacaoDescritiva) {
        formulasRows.push([`Mifflin-St Jeor (1990) - ${calc.mifflin?.genero || calc.generoUtilizado || 'Masculino'}`, calc.mifflin?.equacaoDescritiva || "TMB × NAF (Diretriz AND)", calc.mifflin?.resultadoKcal ? `${calc.mifflin.resultadoKcal} kcal/dia` : "Não informado"]);
      }
      if (fSel.includes("faoOms") || calc.faoOms?.resultadoKcal || calc.faoOms?.equacaoDescritiva) {
        formulasRows.push(["FAO / OMS (1985 / 2004)", calc.faoOms?.equacaoDescritiva || "TMB por idade/peso × FA × FI", calc.faoOms?.resultadoKcal ? `${calc.faoOms.resultadoKcal} kcal/dia` : "Não informado"]);
      }
      if (fSel.includes("eerIom") || calc.eerIom?.resultadoKcal || calc.eerIom?.equacaoDescritiva) {
        formulasRows.push(["EER / IOM (DRI 2002 / 2005)", calc.eerIom?.equacaoDescritiva || "Necessidade Estimada com CAF", calc.eerIom?.resultadoKcal ? `${calc.eerIom.resultadoKcal} kcal/dia` : "Não informado"]);
      }
      if (formulasRows.length === 0) {
        formulasRows.push(["1. Fórmula de Bolso (Regra Prática)", "[Kcal Mín a Máx] × Peso (kg)", "Não preenchido / ---"]);
        formulasRows.push(["2. Harris-Benedict (1919)", "GEB (peso, altura, idade, sexo) × FA × FI", "Não preenchido / ---"]);
        formulasRows.push(["3. Mifflin-St Jeor (1990)", "GEB (peso, altura, idade, sexo) × FA × FI", "Não preenchido / ---"]);
        formulasRows.push(["4. FAO / OMS (1985 / 2004)", "GEB = (Constante Idade × Peso) + Constante Fixa × FA × FI", "Não preenchido / ---"]);
        formulasRows.push(["5. EER / IOM (DRI 2002 / 2005)", "EER = Constante - (Fator × Idade) + NAF × (FatorPeso×P + FatorAlt×A)", "Não preenchido / ---"]);
      }

      doc.addTable(
        ["Equação Preditiva Selecionada", "Desenvolvimento Matemático Aberto (Variáveis Digitadas)", "Resultado Calculado"],
        formulasRows,
        [3000, 3800, 2200]
      );

      const decisaoClinicaVET = `VET Planejado: ${calc.vetPlanejadoKcal ? calc.vetPlanejadoKcal + ' kcal/dia' : 'Não preenchido / ---'} | Taxa Metabólica Resultante: ${calc.taxaMetabolicaCalculada ? calc.taxaMetabolicaCalculada + ' kcal/kg' : (presc.regraBolsoKcalKg || '---')}\nJustificativa da Escolha Clínica: ${calc.justificativaEscolha || 'Não preenchido / ---'}`;
      doc.addCallout("DECISÃO CLÍNICA E VET PLANEJADO:", decisaoClinicaVET, "0d9488", "f0fdfa");
    }

    // 2.3. PRESCRIÇÃO DIETOTERÁPICA
    if (isLiberada("prescricao")) {
      const viaAlimentacao = (studentData.tne?.viaAlimentacao || studentData.viaAlimentacao || presc.viaAlimentacao || "oral").toLowerCase();
      const isTne = viaAlimentacao === "tne";

      doc.addHeading("2.3. Determinação das Necessidades Energéticas e Distribuição Dinâmica de Macronutrientes", 2);
      const prescRows = [
        ["Valor Energético Total (VET)", `${presc.vetKcal ? presc.vetKcal + ' kcal/dia' : 'Não calculado / ---'}`, `Regra de bolso: ${presc.regraBolsoKcalKg || '---'}`],
        ["Carboidratos (CHO - 4 kcal/g)", presc.distribuicaoMacros?.cho ? `${presc.distribuicaoMacros.cho.minPct}% a ${presc.distribuicaoMacros.cho.maxPct}%` : `${presc.carboidratosPct || '--'}%`, presc.distribuicaoMacros?.cho ? `${presc.distribuicaoMacros.cho.minKcal} a ${presc.distribuicaoMacros.cho.maxKcal} kcal (${presc.distribuicaoMacros.cho.minG}g a ${presc.distribuicaoMacros.cho.maxG}g)` : `${presc.carboidratosG || '--'} g`],
        ["Proteínas (PTN - 4 kcal/g)", presc.distribuicaoMacros?.ptn ? `${presc.distribuicaoMacros.ptn.minPct}% a ${presc.distribuicaoMacros.ptn.maxPct}%` : `${presc.proteinasPct || '--'}%`, presc.distribuicaoMacros?.ptn ? `${presc.distribuicaoMacros.ptn.minKcal} a ${presc.distribuicaoMacros.ptn.maxKcal} kcal (${presc.distribuicaoMacros.ptn.minG}g a ${presc.distribuicaoMacros.ptn.maxG}g)` : `${presc.proteinasG || '--'} g`],
        ["Recomendação de Proteína (g/kg)", presc.recomendacaoProteinaGKg?.minGKg ? `${presc.recomendacaoProteinaGKg.minGKg} a ${presc.recomendacaoProteinaGKg.maxGKg} g/kg/dia` : `${presc.proteinasGKg || '--'} g/kg`, presc.recomendacaoProteinaGKg?.minTotalG ? `${presc.recomendacaoProteinaGKg.minTotalG}g a ${presc.recomendacaoProteinaGKg.maxTotalG}g` : "Baseado no peso do paciente"],
        ["Lipídios (LIP - 9 kcal/g)", presc.distribuicaoMacros?.lip ? `${presc.distribuicaoMacros.lip.minPct}% a ${presc.distribuicaoMacros.lip.maxPct}%` : `${presc.lipidiosPct || '--'}%`, presc.distribuicaoMacros?.lip ? `${presc.distribuicaoMacros.lip.minKcal} a ${presc.distribuicaoMacros.lip.maxKcal} kcal (${presc.distribuicaoMacros.lip.minG}g a ${presc.distribuicaoMacros.lip.maxG}g)` : `${presc.lipidiosG || '--'} g`],
        ["Via de Alimentação Prescrita", isTne ? "Terapia Nutricional Enteral (TNE)" : "Via Oral", isTne ? "Aporte enteral especializado" : "Alimentação por via oral"],
        ...(isTne ? [] : [
          ["Consistência da Dieta", presc.consistencia || studentData.consistenciaDietaOral || "Normal", "-"],
          ["Fracionamento", presc.fracionamento || "5 a 6 refeições", "-"]
        ])
      ];

      doc.addTable(
        ["Parâmetro Prescrito", "Faixa / Valor Numérico", "Kcal e Gramas Calculadas"],
        prescRows,
        [3200, 2800, 3000]
      );
      doc.addParagraph(`Fibras e Micronutrientes Alvo: ${presc.fibrasMicronutrientes || "Não preenchido / ---"}`);

      doc.addHeading("2.4. Justificativa Fisiopatológica da Conduta", 2);
      doc.addParagraph(presc.justificativaFisiopatologica || "Não preenchido / ---");
    }

    // 5. SEÇÃO III: PLANEJAMENTO ALIMENTAR (CARDÁPIO TACO OU PRESCRIÇÃO DE TNE)
    if (isLiberada("cardapio")) {
      const viaAlimentacao = (studentData.tne?.viaAlimentacao || studentData.viaAlimentacao || presc.viaAlimentacao || "oral").toLowerCase();
      const isTne = viaAlimentacao === "tne";
      const tne = studentData.tne || {};

      if (isTne) {
        doc.addHeading("3. PRESCRIÇÃO DE TERAPIA NUTRICIONAL ENTERAL (TNE)", 1);
        const tneRows = [
          ["Via de Nutrição", "Terapia Nutricional Enteral (TNE)", "Via especializada não-oral"],
          ["Nome Comercial da Dieta Enteral", tne.nomeComercial || "Não informado / ---", "Fórmula enteral padronizada"],
          ["Tipo de Dieta Enteral", tne.tipoDieta || "Não especificado / ---", "-"],
          ["Densidade Calórica", tne.densidadeCalorica ? `${tne.densidadeCalorica} kcal/mL` : "Não informada", "Densidade calórica da fórmula"],
          ["Fracionamento / Horários", tne.fracionamento || "Não informado", "Distribuição diária da dieta"],
          ["Método de Infusão", tne.viaAdministracao === "bomba" ? "Bomba de Infusão Contínua" : "Gravitacional Intermitente", "Via programada"]
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
          doc.addHeading("Módulo de Suplementação Proteica em Pó", 3);
          doc.addParagraph(tne.moduloSuplementacaoProteica);
        }

        if (tne.tabelaNutricionalManual && (tne.tabelaNutricionalManual.vet || tne.tabelaNutricionalManual.ptn)) {
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
          doc.addHeading("3.2. Consolidação Nutricional da TNE vs Metas Prescritas e Balanço Fosfocálcico", 2);
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
      } else {
        doc.addHeading("3. PLANEJAMENTO ALIMENTAR QUALI-QUANTITATIVO (CARDÁPIO)", 1);
        doc.addParagraph(`Tipo / Consistência da Dieta Oral Definida: ${studentData.consistenciaDietaOral || presc.consistencia || "Dieta Livre / Normal"}`);

        const cardapioRows = [];
        plano.forEach(ref => {
          const items = Array.isArray(ref.itens) ? ref.itens : (Array.isArray(ref.alimentos) ? ref.alimentos : []);
          let alimentosFormatados = "";
          if (items.length > 0) {
            const itemLines = items.map(it => {
              let line = `${it.alimentoNome || it.nome || 'Alimento'} (${it.medidaCaseira || ''} - ${it.gramatura || it.quantidade || 0}g)`;
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
        const satStr = (totais.gorduraSaturadaG || totais.gorduraSaturadaPct)
          ? `${totais.gorduraSaturadaG ? totais.gorduraSaturadaG + ' g' : ''}${totais.gorduraSaturadaG && totais.gorduraSaturadaPct ? ' (' + totais.gorduraSaturadaPct + '% do VET)' : (totais.gorduraSaturadaPct ? totais.gorduraSaturadaPct + ' %' : '')}`
          : "Não preenchido / ---";
        const monoStr = (totais.gorduraMonoinsaturadaG || totais.gorduraMonoinsaturadaPct)
          ? `${totais.gorduraMonoinsaturadaG ? totais.gorduraMonoinsaturadaG + ' g' : ''}${totais.gorduraMonoinsaturadaG && totais.gorduraMonoinsaturadaPct ? ' (' + totais.gorduraMonoinsaturadaPct + '% do VET)' : (totais.gorduraMonoinsaturadaPct ? totais.gorduraMonoinsaturadaPct + ' %' : '')}`
          : "Não preenchido / ---";
        const poliStr = (totais.gorduraPoliinsaturadaG || totais.gorduraPoliinsaturadaPct)
          ? `${totais.gorduraPoliinsaturadaG ? totais.gorduraPoliinsaturadaG + ' g' : ''}${totais.gorduraPoliinsaturadaG && totais.gorduraPoliinsaturadaPct ? ' (' + totais.gorduraPoliinsaturadaPct + '% do VET)' : (totais.gorduraPoliinsaturadaPct ? totais.gorduraPoliinsaturadaPct + ' %' : '')}`
          : "Não preenchido / ---";

        doc.addTable(
          ["Parâmetro Nutricional Consolidado", "Aporte Obtido no Cardápio", "Régua da Prescrição Dietética"],
          [
            ["VET Total Planejado no Cardápio", totais.vetTotalKcal ? `${totais.vetTotalKcal} kcal/dia` : "Não preenchido / ---", `Meta Prescrita: ${presc.vetKcal ? presc.vetKcal + ' kcal' : '---'}`],
            ["Adequação do VET do Cardápio", totais.adequacaoVetPct ? `${totais.adequacaoVetPct}%` : "Não calculada / ---", `${totais.classificacaoAdequacao || 'Adequação calórica do cardápio'}`],
            ["Carboidratos do Cardápio", totais.carboidratosG !== undefined ? `${totais.carboidratosG} g (${totais.carboidratosPct || 0}% do VET)` : "Não preenchido / ---", totais.statusMacros?.cho ? `Status: ${totais.statusMacros.cho.label}` : `Prescrito: ${presc.carboidratosG || '--'} g`],
            ["Proteínas do Cardápio", totais.proteinasG !== undefined ? `${totais.proteinasG} g (${totais.proteinasGKg ? totais.proteinasGKg + ' g/kg' : '--'}, ${totais.proteinasPct || 0}%)` : "Não preenchido / ---", totais.statusMacros?.ptn ? `Status: ${totais.statusMacros.ptn.label}` : `Prescrito: ${presc.proteinasG || '--'} g`],
            ["Lipídios do Cardápio", totais.lipidiosG !== undefined ? `${totais.lipidiosG} g (${totais.lipidiosPct || 0}% do VET)` : "Não preenchido / ---", totais.statusMacros?.lip ? `Status: ${totais.statusMacros.lip.label}` : `Prescrito: ${presc.lipidiosG || '--'} g`],
            ["  • Gordura Saturada (%) [SAT]", satStr, `Meta: < 10% do VET [${totais.statusLipidios?.sat?.label || (parseFloat(totais.gorduraSaturadaPct) < 10 ? 'Adequado' : 'Inadequado')}]`],
            ["  • Gordura Monoinsaturada (%) [MONO]", monoStr, `Meta: Até 20% do VET [${totais.statusLipidios?.mono?.label || (parseFloat(totais.gorduraMonoinsaturadaPct) <= 20 ? 'Adequado' : 'Inadequado')}]`],
            ["  • Gordura Poli-insaturada (%) [POLI]", poliStr, `Meta: Em média 10% do VET [${totais.statusLipidios?.poli?.label || (parseFloat(totais.gorduraPoliinsaturadaPct) <= 10.5 ? 'Adequado' : 'Inadequado')}]`],
            ["Fibras Alimentares Totais", totais.fibrasG !== undefined ? `${totais.fibrasG} g/dia` : "Não preenchido / ---", "Composição oficial TACO (UNICAMP)"],
            ["Cálcio (Ca) no Cardápio", totais.calcioMg !== undefined ? `${totais.calcioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
            ["Ferro (Fe) no Cardápio", totais.ferroMg !== undefined ? `${totais.ferroMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
            ["Sódio (Na) no Cardápio", totais.sodioMg !== undefined ? `${totais.sodioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
            ["Potássio (K) no Cardápio", totais.potassioMg !== undefined ? `${totais.potassioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"]
          ],
          [3400, 2800, 2800]
        );
      }
    }

    // 6. SEÇÃO IV: RESPOSTAS ÀS QUESTÕES AVALIATIVAS DO CASO (Apenas no Modo Simulação)
    if (!isRealPatient && isLiberada("questoes")) {
      const questoes = clinicalCase.questoesAvaliativas || [];
      doc.addHeading("4. RESPOSTAS ÀS QUESTÕES AVALIATIVAS DO CASO CLÍNICO", 1);
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

    // 7. BLOCO FINAL CONDICIONAL: ORIENTAÇÕES NUTRICIONAIS (Simulação e Atendimento Real)
    // Só aparece se a aba estiver liberada para o aluno E se o aluno tiver preenchido algum conteúdo nela (ignorar se estiver vazia)
    const textoOrientacoesDocx = String(studentData?.orientacoesNutricionais || studentData?.orientacaoNutricional || "").trim();
    if (isLiberada("orientacao") && textoOrientacoesDocx.length > 0) {
      doc.addHeading("Orientações Nutricionais", 1);
      doc.addParagraph(textoOrientacoesDocx);
    }

    // Componente nativo de Rodapé (Footer) do Word para repetição obrigatória em todas as páginas
    doc.setFooter("© 2026 DietoCase - Desenvolvido por Prof. Chagas Neto. Todos os direitos reservados.");

    return doc;
  }

  // Métodos auxiliares de renderização de tabelas e caixas de destaque em HTML
  static renderTableHtml(headers, rows) {
    let ths = headers.map(h => `<th style="border: 1px solid #cbd5e1; background-color: #f1f5f9; padding: 6px 10px; font-size: 11px; text-align: left; color: #1e293b;">${h}</th>`).join("");
    let trs = rows.map((r, idx) => {
      let bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      let tds = r.map(c => `<td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 11px; color: #334155; vertical-align: top; white-space: pre-wrap;">${c || '---'}</td>`).join("");
      return `<tr style="background-color: ${bg};">${tds}</tr>`;
    }).join("");
    return `<table style="width: 100%; border-collapse: collapse; margin: 8px 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  }

  static renderCalloutHtml(title, content, borderColor = "#15803d", bgColor = "#f0fdf4") {
    return `
      <div style="border-left: 4px solid ${borderColor}; background-color: ${bgColor}; padding: 10px 14px; margin: 10px 0; border-radius: 4px; font-family: inherit;">
        <div style="font-weight: bold; font-size: 11px; text-transform: uppercase; color: ${borderColor}; margin-bottom: 4px;">${title}</div>
        <div style="font-size: 12px; color: #1e293b; white-space: pre-wrap;">${content || 'Não preenchido'}</div>
      </div>
    `;
  }

  // 1.1, 1.2, 1.3: Seção Anamnese & Histórico Clínico
  static renderAnamneseSectionHtml(studentData, clinicalCase = {}) {
    if (!this.isSectionLiberada("anamnese", clinicalCase)) return null;

    const isRealPatient = studentData.isRealPatient === true || clinicalCase?.isRealCase === true;
    const anamnese = studentData.anamnese || {};
    const realPat = studentData.dadosPacienteReal || {};
    const patient = isRealPatient ? (realPat.nome ? realPat : clinicalCase.patient || {}) : (clinicalCase.patient || {});
    const patName = isRealPatient ? (realPat.nome || "Paciente Real") : (patient.name || "Paciente Simulado");
    const patAge = isRealPatient ? (realPat.idade ? `${realPat.idade} anos` : "Não informada / ---") : (patient.age ? `${patient.age} anos` : "Não informada / ---");
    const patGender = isRealPatient ? (realPat.genero || realPat.sexo || "Não informado / ---") : (patient.gender || "Não informado / ---");
    const patOccupation = isRealPatient ? (realPat.historicoSocial?.profissao || realPat.profissao || realPat.ocupacao || patient.occupation || "Não informada / ---") : (patient.occupation || "Não informada / ---");
    const hipoteseDiagnostica = realPat.hipoteseDiagnostica || anamnese.hipoteseDiagnostica || clinicalCase.hipoteseDiagnostica || clinicalCase.history?.hipoteseDiagnostica || "Não informada / ---";

    return `
      <h3 class="subsec-heading">1.1. Identificação do Paciente & Histórico Social</h3>
      ${this.renderTableHtml(
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
      ${this.renderCalloutHtml("Hipótese Diagnóstica / Diagnóstico Médico:", hipoteseDiagnostica, "#991b1b", "#fef2f2")}
      <p><strong>Queixa Principal:</strong> ${anamnese.queixaPrincipal || "Não preenchida / ---"}</p>
      <p><strong>História da Doença Atual (HDA):</strong> ${anamnese.historiaClinica || "Não preenchida / ---"}</p>

      <h3 class="subsec-heading">1.3. Antecedentes Patológicos, Medicamentos e Estilo de Vida</h3>
      <p><strong>Antecedentes Patológicos e Medicamentos:</strong> ${anamnese.antecedentesMedicamentos || "Não preenchido / ---"}</p>
      <p><strong>Hábitos e Estilo de Vida:</strong> ${anamnese.habitosEstiloVida || "Não preenchido / ---"}</p>
    `;
  }

  // 1.4: Seção Interações Droga-Nutriente & Farmacoterapia
  static renderDrogaNutrienteSectionHtml(studentData, clinicalCase = {}) {
    if (!this.isSectionLiberada("droganutriente", clinicalCase)) return null;

    return `
      <h3 class="subsec-heading">1.4. Interações Droga-Nutriente & Farmacoterapia Aplicada</h3>
      ${this.renderTableHtml(
        ["Medicação (Nome do remédio em uso)", "Classificação (Classe farmacológica)", "Interação (Descrição manual da interação)"],
        (Array.isArray(studentData.interacaoDrogaNutriente) && studentData.interacaoDrogaNutriente.length > 0)
          ? studentData.interacaoDrogaNutriente.map(i => [i.medicacao || i.medicamento || "---", i.classificacao || i.nutrientes || "---", i.interacao || i.conduta || "---"])
          : [["---", "---", "Nenhuma interação medicamentosa registrada / Não preenchido"]]
      )}
      <p><strong>Observações Farmacoterapêuticas:</strong> ${studentData.observacoesFarmacoterapia || "Não preenchido / ---"}</p>
    `;
  }

  // 1.5: Seção Avaliação Antropométrica
  static renderAntropometriaSectionHtml(studentData, clinicalCase = {}) {
    if (!this.isSectionLiberada("antropometria", clinicalCase)) return null;

    const antro = studentData.antropometria || {};
    return `
      <h3 class="subsec-heading">1.5. Avaliação Antropométrica e Estado Nutricional</h3>
      ${antro.triagemNutricional?.tipo === "hospitalar"
        ? this.renderTableHtml(
            ["Parâmetro da Triagem Hospitalar", "Dado Registrado"],
            [
              ["Modalidade do Atendimento:", "Hospitalar"],
              ["Triagem Utilizada:", antro.triagemNutricional.ferramenta || "Não informada / ---"],
              ["Pontuação Obtida:", antro.triagemNutricional.pontuacao !== undefined && antro.triagemNutricional.pontuacao !== null ? String(antro.triagemNutricional.pontuacao) : "---"],
              ["Diagnóstico da Triagem:", antro.triagemNutricional.diagnostico || "Não preenchido / ---"]
            ]
          )
        : this.renderTableHtml(
            ["Parâmetro da Triagem Nutricional", "Dado Registrado"],
            [
              ["Modalidade do Atendimento:", "Ambulatorial"],
              ["Triagem Hospitalar (NRS/MUST):", "Dispensada no atendimento ambulatorial / Não realizada"]
            ]
          )
      }

      ${this.renderTableHtml(
        ["Parâmetro Antropométrico", "Valor Coletado / Calculado", "Classificação / Observação Clínica"],
        [
          ["Peso Atual (Aferido)", antro.pesoAtual ? `${antro.pesoAtual} kg` : (antro.pesoEstimadoChumlea ? `${antro.pesoEstimadoChumlea} kg (Estimado Chumlea)` : "Não aferido / ---"), antro.pesoAtual ? "Medição direta" : (antro.pesoEstimadoChumlea ? "Estimado por CB e AJ" : "-")],
          ["Estatura (Aferida)", antro.estatura ? `${antro.estatura} m` : (antro.estaturaEstimadaChumlea ? `${antro.estaturaEstimadaChumlea} m (Estimada Chumlea)` : "Não aferida / ---"), antro.estatura ? "Medição direta" : (antro.estaturaEstimadaChumlea ? "Estimada por AJ e Idade" : "-")],
          ["Peso Habitual (Opcional)", antro.pesoHabitual ? `${antro.pesoHabitual} kg` : "Não informado / ---", "-"],
          ["Altura do Joelho (AJ)", antro.alturaJoelho ? `${antro.alturaJoelho} cm` : "Não aferida / ---", "Parâmetro para equações de Chumlea"],
          ["Circunferência do Braço (CB)", antro.circBraco ? `${antro.circBraco} cm` : "Não aferida / ---", "Reserva muscular / Estimativa Chumlea"],
          ["Peso Estimado (Chumlea 1985)", antro.pesoEstimadoChumlea ? `${antro.pesoEstimadoChumlea} kg` : "Não calculado / ---", "Equação indireta (sem peso aferido)"],
          ["Estatura Estimada (Chumlea 1985)", antro.estaturaEstimadaChumlea ? `${antro.estaturaEstimadaChumlea} m` : "Não calculada / ---", "Equação indireta (sem estatura aferida)"],
          ["Índice de Massa Corporal (IMC)", antro.imc ? `${antro.imc} kg/m²` : "Não calculado / ---", antro.classificacaoImc ? `${antro.classificacaoImc} (${antro.criterioClassificacao || 'Critério Clínico'})` : "Não classificado / ---"],
          ["IMC Ideal (Opcional)", antro.imcIdeal ? `${antro.imcIdeal} kg/m²` : "Não informado / ---", "Meta clínica de adequação ponderal"],
          ["Percentual de Perda Ponderal (Opcional)", (antro.percentualPerda || antro.perdaPesoPct) ? `${antro.percentualPerda || antro.perdaPesoPct} %` : "Não informado / ---", (antro.percentualPerda || antro.perdaPesoPct) ? `${antro.percentualPerda || antro.perdaPesoPct}% de alteração` : "-"],
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
      ${this.renderCalloutHtml(
        "DIAGNÓSTICO NUTRICIONAL POR EXTENSO (ESTADO PONDERAL):",
        `${antro.diagnosticoNutricionalExtenso || "Não preenchido / ---"} (Critério: ${antro.criterioClassificacao || 'OMS / Lipschitz'})`,
        "#2563eb",
        "#eff6ff"
      )}
    `;
  }

  // 1.6: Seção Avaliação Bioquímica
  static renderBioquimicaSectionHtml(studentData, clinicalCase = {}) {
    if (!this.isSectionLiberada("bioquimica", clinicalCase)) return null;

    const bio = studentData.bioquimica || {};
    return `
      <h3 class="subsec-heading">1.6. Avaliação Bioquímica Relevante e Raciocínio Clínico</h3>
      ${this.renderTableHtml(
        ["Exame Bioquímico", "Valor de Referência", "Valor Achado", "Interpretação Clínica do Aluno"],
        (Array.isArray(bio.exames) && bio.exames.length > 0)
          ? bio.exames.map(item => [item.exame || "Não preenchido", item.referencia || "---", item.valor || "Não preenchido", (item.interpretacao && typeof item.interpretacao === "string" && item.interpretacao.trim()) ? item.interpretacao.trim() : ((bio.interpretacoes && typeof bio.interpretacoes[item.exame] === "string" && bio.interpretacoes[item.exame].trim()) ? bio.interpretacoes[item.exame].trim() : "Não preenchido / ---")])
          : ((Array.isArray(bio.listaCustom) && bio.listaCustom.length > 0)
            ? bio.listaCustom.map(item => [item.exame || "Não preenchido", item.referencia || "---", item.valor || "Não preenchido", (item.interpretacao && typeof item.interpretacao === "string" && item.interpretacao.trim()) ? item.interpretacao.trim() : ((bio.interpretacoes && typeof bio.interpretacoes[item.exame] === "string" && bio.interpretacoes[item.exame].trim()) ? bio.interpretacoes[item.exame].trim() : "Não preenchido / ---")])
            : ((Array.isArray(clinicalCase?.bioquimica) && clinicalCase.bioquimica.length > 0)
              ? clinicalCase.bioquimica.map(item => [item.exame || "Não preenchido", item.referencia || "---", item.valor || "Não preenchido", (bio.interpretacoes && typeof bio.interpretacoes[item.exame] === "string" && bio.interpretacoes[item.exame].trim()) ? bio.interpretacoes[item.exame].trim() : "Não preenchido / ---"])
              : [["---", "---", "Não preenchido", "Nenhum exame laboratorial registrado nesta avaliação"]]))
      )}
      <p><strong>Exames Laboratoriais Apurados / Anotações:</strong> ${bio.examesRelevantes || "Não preenchido / ---"}</p>
      ${this.renderCalloutHtml(
        "SÍNTESE E RACIOCÍNIO CLÍNICO-NUTRICIONAL GLOBAL:",
        bio.interpretacaoNutricional || "Não preenchido / ---",
        "#059669",
        "#ecfdf5"
      )}
    `;
  }

  // 1.7: Seção Exame Físico Nutricional
  static renderExameFisicoSectionHtml(studentData, clinicalCase = {}) {
    if (!this.isSectionLiberada("examefisico", clinicalCase)) return null;

    const ef = studentData.exameFisico || {};
    return `
      <h3 class="subsec-heading">1.7. Exame Físico Nutricional e Semiologia Clínica</h3>
      ${this.renderTableHtml(
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
      ${this.renderTableHtml(
        ["Compartimento Anatômico", "Semiologia Nutricional / Reserva Muscular e Adiposa"],
        [
          ["Cabeça (Fácies, cavidade oral, olhos, cabelos, bochechas)", ef.compartimentos?.cabeca || "Sem alterações evidentes / Não preenchido"],
          ["Tronco (Clavícula, tórax, costelas, coluna, região lombar/sacral)", ef.compartimentos?.tronco || "Sem alterações evidentes / Não preenchido"],
          ["Membros Superiores - MMSS (Bíceps, tríceps, deltoide, mãos, unhas)", ef.compartimentos?.mmss || "Sem alterações evidentes / Não preenchido"],
          ["Membros Inferiores - MMII (Coxa, quadríceps, joelho, panturrilha, tornozelo, edemas)", ef.compartimentos?.mmii || "Sem alterações evidentes / Não preenchido"]
        ]
      )}
      <p><strong>Sinais Clínicos e Achados Adicionais:</strong> ${ef.sinaisClinicos || "Não preenchido / ---"}</p>
    `;
  }

  // 1.8: Seção Consumo Alimentar & R24h
  static renderConsumoSectionHtml(studentData, clinicalCase = {}) {
    if (!this.isSectionLiberada("consumo", clinicalCase)) return null;

    const ca = studentData.consumoAlimentar || {};
    return `
      <h3 class="subsec-heading">1.8. Consumo Alimentar e Inquérito Nutricional</h3>
      <p><strong>Resumo do Recordatório Alimentar / Padrão Dietético:</strong> ${ca.inqueritoResumo || "Não preenchido / ---"}</p>
      <p><strong>Ingestão Hídrica, Preferências e Aversões:</strong> ${ca.aguaPreferenciasAversoes || "Não preenchido / ---"}</p>
      
      <h3 class="subsec-heading">1.8.1. Refeições e Alimentos no Recordatório de 24h</h3>
      ${this.renderTableHtml(
        ["Refeição e Horário", "Alimentos, Medidas Caseiras e Gramaturas (TACO)"],
        (Array.isArray(ca.refeicoesRecordatorio) && ca.refeicoesRecordatorio.some(r => r.itens && r.itens.length > 0))
          ? ca.refeicoesRecordatorio.filter(r => r.itens && r.itens.length > 0).map(r => [
              `${r.refeicao} (${r.horario || '--:--'})`,
              r.itens.map(it => `• ${it.alimentoNome || 'Alimento'} (${it.medidaCaseira || ''} - ${it.gramatura || 0}g) [${it.kcal || 0} kcal]`).join("\n") + (r.tipoPreparacao ? `\nPreparação: ${r.tipoPreparacao}` : "")
            ])
          : [["---", "Nenhuma refeição detalhada no recordatório alimentar / Não preenchido"]]
      )}

      <h3 class="subsec-heading">1.8.2. Avaliação Quantitativa Consolidada do Recordatório de 24h (Macros e Micros)</h3>
      ${this.renderTableHtml(
        ["Parâmetro Nutricional Consumido", "Total Ingerido no R24h", "Régua da Prescrição / Observação Oficial"],
        [
          ["VET Consumido no Recordatório", ca.totaisRecordatorio?.vetTotalKcal ? `${ca.totaisRecordatorio.vetTotalKcal} kcal/dia` : (ca.vetRecordatorio ? `${ca.vetRecordatorio} kcal/dia` : "Não preenchido / ---"), `NEE do Caso: ${ca.neeCaso ? ca.neeCaso + ' kcal/dia' : '---'} (${ca.adequacaoVetPct || ca.totaisRecordatorio?.adequacaoVetPct || '---'}% da meta)`],
          ["Carboidratos Consumidos", ca.totaisRecordatorio?.carboidratosG !== undefined ? `${ca.totaisRecordatorio.carboidratosG} g (${ca.totaisRecordatorio.carboidratosPct || 0}% do VET)` : "Não preenchido / ---", ca.totaisRecordatorio?.statusMacros?.cho ? `Status: ${ca.totaisRecordatorio.statusMacros.cho.label}` : "---"],
          ["Proteínas Consumidas", ca.totaisRecordatorio?.proteinasG !== undefined ? `${ca.totaisRecordatorio.proteinasG} g (${ca.totaisRecordatorio.proteinasGKg ? ca.totaisRecordatorio.proteinasGKg + ' g/kg' : '--'}, ${ca.totaisRecordatorio.proteinasPct || 0}%)` : "Não preenchido / ---", ca.totaisRecordatorio?.statusMacros?.ptn ? `Status: ${ca.totaisRecordatorio.statusMacros.ptn.label}` : "---"],
          ["Lipídios Consumidos", ca.totaisRecordatorio?.lipidiosG !== undefined ? `${ca.totaisRecordatorio.lipidiosG} g (${ca.totaisRecordatorio.lipidiosPct || 0}% do VET)` : "Não preenchido / ---", ca.totaisRecordatorio?.statusMacros?.lip ? `Status: ${ca.totaisRecordatorio.statusMacros.lip.label}` : "---"],
          ["  • Gordura Saturada (%) [SAT]", (ca.totaisRecordatorio?.gorduraSaturadaG || ca.totaisRecordatorio?.gorduraSaturadaPct) ? `${ca.totaisRecordatorio?.gorduraSaturadaG ? ca.totaisRecordatorio.gorduraSaturadaG + ' g' : ''}${ca.totaisRecordatorio?.gorduraSaturadaG && ca.totaisRecordatorio?.gorduraSaturadaPct ? ' (' + ca.totaisRecordatorio.gorduraSaturadaPct + '% do VET)' : (ca.totaisRecordatorio?.gorduraSaturadaPct ? ca.totaisRecordatorio.gorduraSaturadaPct + ' %' : '')}` : "Não preenchido / ---", `Meta: < 10% do VET [${ca.totaisRecordatorio?.statusLipidios?.sat?.label || (parseFloat(ca.totaisRecordatorio?.gorduraSaturadaPct) < 10 ? 'Adequado' : 'Inadequado')}]`],
          ["  • Gordura Monoinsaturada (%) [MONO]", (ca.totaisRecordatorio?.gorduraMonoinsaturadaG || ca.totaisRecordatorio?.gorduraMonoinsaturadaPct) ? `${ca.totaisRecordatorio?.gorduraMonoinsaturadaG ? ca.totaisRecordatorio.gorduraMonoinsaturadaG + ' g' : ''}${ca.totaisRecordatorio?.gorduraMonoinsaturadaG && ca.totaisRecordatorio?.gorduraMonoinsaturadaPct ? ' (' + ca.totaisRecordatorio.gorduraMonoinsaturadaPct + '% do VET)' : (ca.totaisRecordatorio?.gorduraMonoinsaturadaPct ? ca.totaisRecordatorio.gorduraMonoinsaturadaPct + ' %' : '')}` : "Não preenchido / ---", `Meta: Até 20% do VET [${ca.totaisRecordatorio?.statusLipidios?.mono?.label || (parseFloat(ca.totaisRecordatorio?.gorduraMonoinsaturadaPct) <= 20 ? 'Adequado' : 'Inadequado')}]`],
          ["  • Gordura Poli-insaturada (%) [POLI]", (ca.totaisRecordatorio?.gorduraPoliinsaturadaG || ca.totaisRecordatorio?.gorduraPoliinsaturadaPct) ? `${ca.totaisRecordatorio?.gorduraPoliinsaturadaG ? ca.totaisRecordatorio.gorduraPoliinsaturadaG + ' g' : ''}${ca.totaisRecordatorio?.gorduraPoliinsaturadaG && ca.totaisRecordatorio?.gorduraPoliinsaturadaPct ? ' (' + ca.totaisRecordatorio.gorduraPoliinsaturadaPct + '% do VET)' : (ca.totaisRecordatorio?.gorduraPoliinsaturadaPct ? ca.totaisRecordatorio.gorduraPoliinsaturadaPct + ' %' : '')}` : "Não preenchido / ---", `Meta: Em média 10% do VET [${ca.totaisRecordatorio?.statusLipidios?.poli?.label || (parseFloat(ca.totaisRecordatorio?.gorduraPoliinsaturadaPct) <= 10.5 ? 'Adequado' : 'Inadequado')}]`],
          ["Fibras Alimentares Totais", ca.totaisRecordatorio?.fibrasG !== undefined ? `${ca.totaisRecordatorio.fibrasG} g/dia` : "Não preenchido / ---", "Tabela TACO (UNICAMP, 4ª edição)"],
          ["Cálcio (Ca) Consumido", ca.totaisRecordatorio?.calcioMg !== undefined ? `${ca.totaisRecordatorio.calcioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
          ["Ferro (Fe) Consumido", ca.totaisRecordatorio?.ferroMg !== undefined ? `${ca.totaisRecordatorio.ferroMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
          ["Sódio (Na) Consumido", ca.totaisRecordatorio?.sodioMg !== undefined ? `${ca.totaisRecordatorio.sodioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
          ["Potássio (K) Consumido", ca.totaisRecordatorio?.potassioMg !== undefined ? `${ca.totaisRecordatorio.potassioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"]
        ]
      )}
    `;
  }

  // 2.1: Diagnóstico PES e Metas
  static renderPesSectionHtml(studentData, clinicalCase = {}) {
    if (!this.isSectionLiberada("pes", clinicalCase)) return null;

    const pes = studentData.diagnosticoPES || {};
    return `
      <h3 class="subsec-heading">2.1. Diagnóstico em Nutrição (Metodologia PES)</h3>
      ${this.renderCalloutHtml(
        "DIAGNÓSTICO EM NUTRIÇÃO (PES):",
        pes.textoCompletoPES || `Problema (P): ${pes.problema || 'Não informado'} | Relacionado a (E): ${pes.etiologia || 'Não informada'} | Evidenciado por (S): ${pes.sinaisSintomas || 'Não informado'}`,
        "#15803d",
        "#f0fdf4"
      )}

      <h3 class="subsec-heading">2.1.1. Objetivos Dietoterápicos e Metas do Cuidado</h3>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; font-size: 11px; white-space: pre-wrap;">
        ${pes.objetivosDietoterapicos || "Não preenchido"}
      </div>
    `;
  }

  // 2.2: Cálculos de Necessidades Energéticas
  static renderNecessidadesSectionHtml(studentData, clinicalCase = {}) {
    if (!this.isSectionLiberada("necessidades", clinicalCase)) return null;

    const calc = studentData.calculoNecessidades || {};
    const presc = studentData.prescricaoDietoterapica || {};
    return `
      <h3 class="subsec-heading">2.2. Cálculos de Necessidades Energéticas e Equações Preditivas</h3>
      ${this.renderTableHtml(
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
      ${this.renderCalloutHtml(
        "DECISÃO CLÍNICA E VET PLANEJADO:",
        `VET Planejado: ${calc.vetPlanejadoKcal ? calc.vetPlanejadoKcal + ' kcal/dia' : 'Não preenchido / ---'} | Taxa Metabólica Resultante: ${calc.taxaMetabolicaCalculada ? calc.taxaMetabolicaCalculada + ' kcal/kg' : (presc.regraBolsoKcalKg || '---')}\nJustificativa da Escolha Clínica: ${calc.justificativaEscolha || 'Não preenchido / ---'}`,
        "#0d9488",
        "#f0fdfa"
      )}
    `;
  }

  // 2.3 & 2.4: Prescrição Dietoterápica & Conduta
  static renderPrescricaoSectionHtml(studentData, clinicalCase = {}) {
    if (!this.isSectionLiberada("prescricao", clinicalCase)) return null;

    const presc = studentData.prescricaoDietoterapica || {};
    const viaAlimentacao = (studentData.tne?.viaAlimentacao || studentData.viaAlimentacao || presc.viaAlimentacao || "oral").toLowerCase();
    const isTne = viaAlimentacao === "tne";

    return `
      <h3 class="subsec-heading">2.3. Determinação das Necessidades Energéticas e Distribuição Dinâmica de Macronutrientes</h3>
      ${this.renderTableHtml(
        ["Parâmetro Prescrito", "Faixa / Valor Numérico", "Kcal e Gramas Calculadas"],
        [
          ["Valor Energético Total (VET)", `${presc.vetKcal ? presc.vetKcal + ' kcal/dia' : 'Não calculado / ---'}`, `Regra de bolso: ${presc.regraBolsoKcalKg || '---'}`],
          ["Carboidratos (CHO - 4 kcal/g)", presc.distribuicaoMacros?.cho ? `${presc.distribuicaoMacros.cho.minPct}% a ${presc.distribuicaoMacros.cho.maxPct}%` : `${presc.carboidratosPct || '--'}%`, presc.distribuicaoMacros?.cho ? `${presc.distribuicaoMacros.cho.minKcal} a ${presc.distribuicaoMacros.cho.maxKcal} kcal (${presc.distribuicaoMacros.cho.minG}g a ${presc.distribuicaoMacros.cho.maxG}g)` : `${presc.carboidratosG || '--'} g`],
          ["Proteínas (PTN - 4 kcal/g)", presc.distribuicaoMacros?.ptn ? `${presc.distribuicaoMacros.ptn.minPct}% a ${presc.distribuicaoMacros.ptn.maxPct}%` : `${presc.proteinasPct || '--'}%`, presc.distribuicaoMacros?.ptn ? `${presc.distribuicaoMacros.ptn.minKcal} a ${presc.distribuicaoMacros.ptn.maxKcal} kcal (${presc.distribuicaoMacros.ptn.minG}g a ${presc.distribuicaoMacros.ptn.maxG}g)` : `${presc.proteinasG || '--'} g`],
          ["Recomendação de Proteína (g/kg)", presc.recomendacaoProteinaGKg?.minGKg ? `${presc.recomendacaoProteinaGKg.minGKg} a ${presc.recomendacaoProteinaGKg.maxGKg} g/kg/dia` : `${presc.proteinasGKg || '--'} g/kg`, presc.recomendacaoProteinaGKg?.minTotalG ? `${presc.recomendacaoProteinaGKg.minTotalG}g a ${presc.recomendacaoProteinaGKg.maxTotalG}g` : "Baseado no peso do paciente"],
          ["Lipídios (LIP - 9 kcal/g)", presc.distribuicaoMacros?.lip ? `${presc.distribuicaoMacros.lip.minPct}% a ${presc.distribuicaoMacros.lip.maxPct}%` : `${presc.lipidiosPct || '--'}%`, presc.distribuicaoMacros?.lip ? `${presc.distribuicaoMacros.lip.minKcal} a ${presc.distribuicaoMacros.lip.maxKcal} kcal (${presc.distribuicaoMacros.lip.minG}g a ${presc.distribuicaoMacros.lip.maxG}g)` : `${presc.lipidiosG || '--'} g`],
          ["Via de Alimentação Prescrita", isTne ? "Terapia Nutricional Enteral (TNE)" : "Via Oral", isTne ? "Aporte enteral especializado" : "Alimentação por via oral"],
          ...(isTne ? [] : [
            ["Consistência da Dieta", presc.consistencia || studentData.consistenciaDietaOral || "Normal", "-"],
            ["Fracionamento", presc.fracionamento || "5 a 6 refeições", "-"]
          ])
        ]
      )}
      <p><strong>Fibras e Micronutrientes Alvo:</strong> ${presc.fibrasMicronutrientes || "Não preenchido / ---"}</p>

      <h3 class="subsec-heading">2.4. Justificativa Fisiopatológica da Conduta</h3>
      <p>${presc.justificativaFisiopatologica || "Não preenchido / ---"}</p>
    `;
  }

  // Seção 3: Cardápio TACO ou TNE
  static renderCardapioSectionHtml(studentData, clinicalCase = {}) {
    if (!this.isSectionLiberada("cardapio", clinicalCase)) return null;

    const presc = studentData.prescricaoDietoterapica || {};
    const rawPlano = studentData.planejamentoAlimentar;
    const plano = Array.isArray(rawPlano) ? rawPlano : (Array.isArray(rawPlano?.refeicoes) ? rawPlano.refeicoes : []);
    const viaAlimentacao = (studentData.tne?.viaAlimentacao || studentData.viaAlimentacao || presc.viaAlimentacao || "oral").toLowerCase();
    const isTne = viaAlimentacao === "tne";
    const tne = studentData.tne || {};

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
          gorduraSaturadaPct: studentData.totaisCardapio?.gorduraSaturadaPct || "",
          gorduraMonoinsaturadaPct: studentData.totaisCardapio?.gorduraMonoinsaturadaPct || "",
          gorduraPoliinsaturadaPct: studentData.totaisCardapio?.gorduraPoliinsaturadaPct || "",
          fibrasG: Math.round(sumFib * 10) / 10,
          calcioMg: Math.round(sumCa),
          ferroMg: Math.round(sumFe * 10) / 10,
          sodioMg: Math.round(sumNa),
          potassioMg: Math.round(sumK),
          adequacaoVetPct: presc.vetKcal ? Math.round((sumKcal / parseFloat(presc.vetKcal)) * 100) : null
        };
      }
    }

    if (isTne) {
      return `
        <h2 class="sec-heading">3. PRESCRIÇÃO DE TERAPIA NUTRICIONAL ENTERAL (TNE)</h2>
        ${this.renderTableHtml(
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
        ${this.renderTableHtml(
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
        ${this.renderTableHtml(
          ["Parâmetro Nutricional da TNE", "Aporte Obtido pela Fórmula", "Régua da Prescrição Dietética"],
          [
            ["VET Fornecido pela TNE", `${studentData.totaisCardapio?.vetTotalKcal || 0} kcal/dia`, `Meta: ${presc.vetKcal || '--'} kcal`],
            ["Adequação do VET da TNE", `${studentData.totaisCardapio?.adequacaoVetPct ? studentData.totaisCardapio.adequacaoVetPct + '%' : '--'}`, studentData.totaisCardapio?.classificacaoAdequacao || "---"],
            ["Carboidratos da TNE", `${studentData.totaisCardapio?.carboidratosG || 0} g (${studentData.totaisCardapio?.carboidratosPct || 0}%)`, `Prescrito: ${presc.carboidratosG || '--'} g`],
            ["Proteínas da TNE", `${studentData.totaisCardapio?.proteinasG || 0} g (${studentData.totaisCardapio?.proteinasGKg ? studentData.totaisCardapio.proteinasGKg + ' g/kg' : '--'}, ${studentData.totaisCardapio?.proteinasPct || 0}%)`, `Prescrito: ${presc.proteinasG || '--'} g`],
            ["Lipídios da TNE", `${studentData.totaisCardapio?.lipidiosG || 0} g (${studentData.totaisCardapio?.lipidiosPct || 0}%)`, `Prescrito: ${presc.lipidiosG || '--'} g`]
          ]
        )}
        <h3 class="subsec-heading">3.3. Recomendações e Orientações Dietoterápicas de Alta/Acompanhamento</h3>
        <p>${studentData.orientacoesNutricionais || "Nenhuma orientação nutricional específica registrada / Não preenchido."}</p>
      `;
    }

    return `
      <h2 class="sec-heading">3. PLANEJAMENTO ALIMENTAR QUALI-QUANTITATIVO (CARDÁPIO)</h2>
      <p><strong>Tipo / Consistência da Dieta Oral Definida:</strong> ${studentData.consistenciaDietaOral || presc.consistencia || "Dieta Livre / Normal"}</p>
      
      <h3 class="subsec-heading">Refeições e Alimentos do Cardápio</h3>
      ${this.renderTableHtml(
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
      ${this.renderTableHtml(
        ["Parâmetro Nutricional Consolidado", "Aporte Obtido no Cardápio", "Régua da Prescrição Dietética"],
        [
          ["VET Total Planejado no Cardápio", totaisCardapio?.vetTotalKcal ? `${totaisCardapio.vetTotalKcal} kcal/dia` : "Não preenchido / ---", `Meta Prescrita: ${presc.vetKcal ? presc.vetKcal + ' kcal' : '---'}`],
          ["Adequação do VET do Cardápio", totaisCardapio?.adequacaoVetPct ? `${totaisCardapio.adequacaoVetPct}%` : "Não calculada / ---", `${totaisCardapio?.classificacaoAdequacao || 'Adequação calórica do cardápio'}`],
          ["Carboidratos do Cardápio", totaisCardapio?.carboidratosG !== undefined ? `${totaisCardapio.carboidratosG} g (${totaisCardapio.carboidratosPct || 0}% do VET)` : "Não preenchido / ---", totaisCardapio?.statusMacros?.cho ? `Status: ${totaisCardapio.statusMacros.cho.label}` : `Prescrito: ${presc.carboidratosG || '--'} g`],
          ["Proteínas do Cardápio", totaisCardapio?.proteinasG !== undefined ? `${totaisCardapio.proteinasG} g (${totaisCardapio.proteinasGKg ? totaisCardapio.proteinasGKg + ' g/kg' : '--'}, ${totaisCardapio.proteinasPct || 0}%)` : "Não preenchido / ---", totaisCardapio?.statusMacros?.ptn ? `Status: ${totaisCardapio.statusMacros.ptn.label}` : `Prescrito: ${presc.proteinasG || '--'} g`],
          ["Lipídios do Cardápio", totaisCardapio?.lipidiosG !== undefined ? `${totaisCardapio.lipidiosG} g (${totaisCardapio.lipidiosPct || 0}% do VET)` : "Não preenchido / ---", totaisCardapio?.statusMacros?.lip ? `Status: ${totaisCardapio.statusMacros.lip.label}` : `Prescrito: ${presc.lipidiosG || '--'} g`],
          ["  • Gordura Saturada (%) [SAT]", (totaisCardapio?.gorduraSaturadaG || totaisCardapio?.gorduraSaturadaPct) ? `${totaisCardapio?.gorduraSaturadaG ? totaisCardapio.gorduraSaturadaG + ' g' : ''}${totaisCardapio?.gorduraSaturadaG && totaisCardapio?.gorduraSaturadaPct ? ' (' + totaisCardapio.gorduraSaturadaPct + '% do VET)' : (totaisCardapio?.gorduraSaturadaPct ? totaisCardapio.gorduraSaturadaPct + ' %' : '')}` : "Não preenchido / ---", `Meta: < 10% do VET [${totaisCardapio?.statusLipidios?.sat?.label || (parseFloat(totaisCardapio?.gorduraSaturadaPct) < 10 ? 'Adequado' : 'Inadequado')}]`],
          ["  • Gordura Monoinsaturada (%) [MONO]", (totaisCardapio?.gorduraMonoinsaturadaG || totaisCardapio?.gorduraMonoinsaturadaPct) ? `${totaisCardapio?.gorduraMonoinsaturadaG ? totaisCardapio.gorduraMonoinsaturadaG + ' g' : ''}${totaisCardapio?.gorduraMonoinsaturadaG && totaisCardapio?.gorduraMonoinsaturadaPct ? ' (' + totaisCardapio.gorduraMonoinsaturadaPct + '% do VET)' : (totaisCardapio?.gorduraMonoinsaturadaPct ? totaisCardapio.gorduraMonoinsaturadaPct + ' %' : '')}` : "Não preenchido / ---", `Meta: Até 20% do VET [${totaisCardapio?.statusLipidios?.mono?.label || (parseFloat(totaisCardapio?.gorduraMonoinsaturadaPct) <= 20 ? 'Adequado' : 'Inadequado')}]`],
          ["  • Gordura Poli-insaturada (%) [POLI]", (totaisCardapio?.gorduraPoliinsaturadaG || totaisCardapio?.gorduraPoliinsaturadaPct) ? `${totaisCardapio?.gorduraPoliinsaturadaG ? totaisCardapio.gorduraPoliinsaturadaG + ' g' : ''}${totaisCardapio?.gorduraPoliinsaturadaG && totaisCardapio?.gorduraPoliinsaturadaPct ? ' (' + totaisCardapio.gorduraPoliinsaturadaPct + '% do VET)' : (totaisCardapio?.gorduraPoliinsaturadaPct ? totaisCardapio.gorduraPoliinsaturadaPct + ' %' : '')}` : "Não preenchido / ---", `Meta: Em média 10% do VET [${totaisCardapio?.statusLipidios?.poli?.label || (parseFloat(totaisCardapio?.gorduraPoliinsaturadaPct) <= 10.5 ? 'Adequado' : 'Inadequado')}]`],
          ["Fibras Alimentares Totais", totaisCardapio?.fibrasG !== undefined ? `${totaisCardapio.fibrasG} g/dia` : "Não preenchido / ---", "Composição oficial TACO (UNICAMP)"],
          ["Cálcio (Ca) no Cardápio", totaisCardapio?.calcioMg !== undefined ? `${totaisCardapio.calcioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
          ["Ferro (Fe) no Cardápio", totaisCardapio?.ferroMg !== undefined ? `${totaisCardapio.ferroMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
          ["Sódio (Na) no Cardápio", totaisCardapio?.sodioMg !== undefined ? `${totaisCardapio.sodioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"],
          ["Potássio (K) no Cardápio", totaisCardapio?.potassioMg !== undefined ? `${totaisCardapio.potassioMg} mg/dia` : "Não preenchido / ---", "Micronutriente oficial TACO"]
        ]
      )}
    `;
  }

  // Seção 4: Questões Avaliativas
  static renderQuestoesSectionHtml(studentData, clinicalCase = {}) {
    const isRealPatient = studentData.isRealPatient === true || clinicalCase?.isRealCase === true;
    if (isRealPatient || !this.isSectionLiberada("questoes", clinicalCase)) return null;

    const respostas = studentData.respostasQuestoes || {};
    return `
      <h2 class="sec-heading">4. AVALIAÇÃO ACADÊMICA & PRECEPTORIA CLÍNICA</h2>
      ${(clinicalCase.questoesAvaliativas && clinicalCase.questoesAvaliativas.length > 0)
          ? clinicalCase.questoesAvaliativas.map((q, idx) => `
              <div style="margin-bottom: 10px;">
                <strong style="font-size: 11px;">Questão ${idx + 1}: ${q.pergunta}</strong>
                ${this.renderCalloutHtml("Resposta do Estudante:", respostas[q.id] || "Questão não respondida pelo estudante.", "#0284c7", "#f0f9ff")}
              </div>
            `).join("")
          : `<p>Não foram cadastradas questões avaliativas específicas para este caso clínico.</p>`
      }
    `;
  }

  // Seção Final Condicional: Orientações Nutricionais (Simulação e Atendimento Real)
  // Só deve aparecer no PDF/Relatório se a aba estiver liberada para o aluno (nas configurações do professor)
  // E se o aluno tiver de fato preenchido algum conteúdo nela (ignorar se estiver vazia).
  static renderOrientacoesSectionHtml(studentData, clinicalCase = {}) {
    if (!this.isSectionLiberada("orientacao", clinicalCase)) return null;
    const texto = String(studentData?.orientacoesNutricionais || studentData?.orientacaoNutricional || "").trim();
    if (!texto) return null;

    return `
      <h2 class="sec-heading">Orientações Nutricionais</h2>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; padding: 10px 14px; border-radius: 6px; margin-bottom: 12px; white-space: pre-line; font-size: 11px; color: #1e293b;">${texto}</div>
    `;
  }

  // Constrói relatório HTML completo (espelho 100% fiel com esqueleto imutável) para visualização e impressão direta em PDF
  static buildHtmlReport(studentData, clinicalCase = {}) {
    const isRealPatient = studentData.isRealPatient === true || clinicalCase?.isRealCase === true;
    const aluno = studentData.aluno || {};
    const realPat = studentData.dadosPacienteReal || {};
    const patient = isRealPatient ? (realPat.nome ? realPat : clinicalCase.patient || {}) : (clinicalCase.patient || {});
    const patName = isRealPatient ? (realPat.nome || "Paciente Real") : (patient.name || "Paciente Simulado");
    const patAge = isRealPatient ? (realPat.idade ? `${realPat.idade} anos` : "Não informada / ---") : (patient.age ? `${patient.age} anos` : "Não informada / ---");
    const patGender = isRealPatient ? (realPat.genero || realPat.sexo || "Não informado / ---") : (patient.gender || "Não informado / ---");
    const patOccupation = isRealPatient ? (realPat.historicoSocial?.profissao || realPat.profissao || realPat.ocupacao || patient.occupation || "Não informada / ---") : (patient.occupation || "Não informada / ---");
    const hipoteseDiagnostica = realPat.hipoteseDiagnostica || studentData.anamnese?.hipoteseDiagnostica || clinicalCase.hipoteseDiagnostica || clinicalCase.history?.hipoteseDiagnostica || "Não informada / ---";

    const dataFormatada = (isRealPatient && realPat.dataAtendimento)
      ? realPat.dataAtendimento.split("-").reverse().join("/")
      : (aluno.data ? aluno.data.split("-").reverse().join("/") : new Date().toLocaleDateString("pt-BR"));

    // Renderização modular condicional: cada seção checa isSectionLiberada e retorna null se bloqueada/trancada/oculta
    const secAnamnese = this.renderAnamneseSectionHtml(studentData, clinicalCase);
    const secDroga = this.renderDrogaNutrienteSectionHtml(studentData, clinicalCase);
    const secAntro = this.renderAntropometriaSectionHtml(studentData, clinicalCase);
    const secBio = this.renderBioquimicaSectionHtml(studentData, clinicalCase);
    const secEF = this.renderExameFisicoSectionHtml(studentData, clinicalCase);
    const secConsumo = this.renderConsumoSectionHtml(studentData, clinicalCase);

    const sec1Blocks = [secAnamnese, secDroga, secAntro, secBio, secEF, secConsumo].filter(Boolean);
    const sec1Html = sec1Blocks.length > 0
      ? `<h2 class="sec-heading">1. PRONTUÁRIO CLÍNICO-NUTRICIONAL (ANAMNESE)</h2>\n${sec1Blocks.join("\n")}`
      : "";

    const secPES = this.renderPesSectionHtml(studentData, clinicalCase);
    const secNec = this.renderNecessidadesSectionHtml(studentData, clinicalCase);
    const secPresc = this.renderPrescricaoSectionHtml(studentData, clinicalCase);

    const sec2Blocks = [secPES, secNec, secPresc].filter(Boolean);
    const sec2Html = sec2Blocks.length > 0
      ? `<h2 class="sec-heading">2. RESOLUÇÃO DIETOTERÁPICA E CONDUTA NUTRICIONAL</h2>\n${sec2Blocks.join("\n")}`
      : "";

    const secCardapioHtml = this.renderCardapioSectionHtml(studentData, clinicalCase) || "";
    const secQuestoesHtml = this.renderQuestoesSectionHtml(studentData, clinicalCase) || "";
    const secOrientacoesHtml = this.renderOrientacoesSectionHtml(studentData, clinicalCase) || "";

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
      @page {
        size: A4;
        margin: 12mm 15mm 15mm 15mm;
      }
      body {
        padding: 0 !important;
        margin: 0 !important;
        background-color: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print { display: none !important; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }

      /* Contêiner de Layout Nativo para Impressão com Repetição via table-footer-group */
      .report-print-container,
      .report-print-layout-table {
        width: 100% !important;
        border: none !important;
        border-collapse: collapse !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .report-print-container > thead,
      .report-print-layout-table > thead {
        display: table-header-group !important;
      }
      .report-print-container > tbody,
      .report-print-layout-table > tbody {
        display: table-row-group !important;
      }
      .report-print-container > tfoot,
      .report-print-layout-table > tfoot {
        display: table-footer-group !important;
      }

      /* Trava de Segurança nos Direitos Autorais do Relatório: CSS Nativo */
      .report-print-footer,
      .report-copyright-footer {
        position: static !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        background-color: #ffffff !important;
        color: #1e293b !important;
        border-top: 1.5px solid #0f172a !important;
        padding: 6px 0 2px 0 !important;
        margin-top: 12px !important;
        font-size: 9.5pt !important;
        font-weight: 600 !important;
        text-align: center !important;
        width: 100% !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
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

  <table class="report-print-container report-print-layout-table" style="width: 100%; border: none; border-collapse: collapse; margin: 0; padding: 0;">
    <thead>
      <tr><td style="border: none; padding: 0; height: 0;"></td></tr>
    </thead>
    <tbody>
      <tr>
        <td style="border: none; padding: 0; vertical-align: top;">
          <h1 class="report-title">DIETOCASE - DISCIPLINA DE DIETOTERAPIA</h1>
          <h2 class="report-subtitle">RELATÓRIO CLÍNICO-NUTRICIONAL E CONDUTA DIETOTERÁPICA</h2>

          ${this.renderTableHtml(
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

          ${sec1Html}
          ${sec2Html}
          ${secCardapioHtml}
          ${secQuestoesHtml}
          ${secOrientacoesHtml}
        </td>
      </tr>
    </tbody>
    <tfoot style="display: table-footer-group;">
      <tr>
        <td style="border: none; padding: 0; vertical-align: bottom;">
          <!-- TRAVA DE SEGURANÇA: RODAPÉ DE DIREITOS AUTORAIS OBRIGATÓRIO (REPETIDO NA MARGEM INFERIOR DE CADA PÁGINA VIA TABLE-FOOTER-GROUP) -->
          <footer class="report-print-footer report-copyright-footer" style="border-top: 1.5px solid #0f172a; padding-top: 8px; margin-top: 16px; font-size: 10px; color: #334155; text-align: center; width: 100%;">
            <p style="margin: 0; font-size: 10pt; font-weight: 700; color: #0f172a;">
              © 2026 DietoCase - Desenvolvido por Prof. Chagas Neto. Todos os direitos reservados.
            </p>
            <p style="margin: 2px 0 0 0; font-size: 8.5pt; color: #64748b;">
              Laboratório interativo de Nutrição Clínica: Simulação clínica, anamnese interativa e prontuário virtual • Emissão em ${dataFormatada}
            </p>
          </footer>
        </td>
      </tr>
    </tfoot>
  </table>
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
