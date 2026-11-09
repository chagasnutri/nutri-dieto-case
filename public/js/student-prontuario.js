// Gerenciador do Prontuário Eletrônico de Dietoterapia e Sessão do Estudante
// Gerencia preenchimento dos dados clínicos, cálculos automáticos (IMC, % perda, VET) e envio sem feedback de certo/errado.

class StudentProntuarioManager {
  constructor() {
    this.currentCaseId = null;
    this.draftKeyPrefix = "dietoterapia_prontuario_draft_";
  }

  // Gera chave de rascunho dinâmica e única combinando ID do Caso e ID do Aluno (ex: draft_caso_{caseId}_aluno_{studentId})
  getStorageKey(caseId, studentId) {
    if (studentId) {
      return `draft_caso_${caseId}_aluno_${studentId}`;
    }
    const currentUid = (typeof window !== "undefined" && window.firebaseSyncService && typeof window.firebaseSyncService.getUserId === "function")
      ? window.firebaseSyncService.getUserId()
      : (typeof localStorage !== "undefined" ? localStorage.getItem("dietocase_student_id") || "aluno_padrao" : "aluno_padrao");
    return `draft_caso_${caseId}_aluno_${currentUid}`;
  }

  // Carrega rascunho salvo para o caso atual
  loadDraft(caseId, studentId) {
    this.currentCaseId = caseId;
    const dynamicKey = this.getStorageKey(caseId, studentId);
    let raw = localStorage.getItem(dynamicKey);
    // Fallback de compatibilidade caso ainda exista sob o formato legado
    if (!raw) {
      raw = localStorage.getItem(`${this.draftKeyPrefix}${caseId}`);
    }
    if (!raw) {
      return this.getEmptyProntuario(caseId);
    }
    try {
      const parsed = JSON.parse(raw);
      return this.sanitizeProntuarioPayload(parsed, caseId);
    } catch (e) {
      console.error("Erro ao carregar rascunho do prontuário:", e);
      return this.getEmptyProntuario(caseId);
    }
  }

  // Sanitiza e blinda o prontuário contra estados nulos (null/undefined) usando optional chaining (?.) e fallbacks (|| [] e || {})
  sanitizeProntuarioPayload(rawProntuario, fallbackCaseId = null) {
    const raw = (rawProntuario && typeof rawProntuario === "object") ? rawProntuario : {};
    const cId = raw?.caseId || fallbackCaseId || this.currentCaseId || "caso-padrao";
    const empty = this.getEmptyProntuario(cId);

    const isQualitativo = raw?.tipoPlanejamentoCardapio === "qualitativo" || Boolean(raw?.habilitarPlanejamentoQualitativo);
    const tipoPlanejamentoCardapio = isQualitativo ? "qualitativo" : "quantitativo";

    const rawPlano = Array.isArray(raw?.planejamentoAlimentar)
      ? raw.planejamentoAlimentar.filter(Boolean)
      : (Array.isArray(raw?.planejamentoQualitativoBlocos) && isQualitativo
          ? raw.planejamentoQualitativoBlocos.filter(Boolean)
          : (Array.isArray(raw?.planejamentoAlimentar?.refeicoes)
              ? raw.planejamentoAlimentar.refeicoes.filter(Boolean)
              : (Array.isArray(raw?.cardapioItems) ? raw.cardapioItems.filter(Boolean) : null)));

    const safePlanejamento = (Array.isArray(rawPlano) && rawPlano.length > 0 ? rawPlano : (empty.planejamentoAlimentar || [])).map((m, idx) => ({
      id: m?.id || `ref-${idx + 1}`,
      refeicao: m?.refeicao || m?.nome || `Refeição ${idx + 1}`,
      horario: m?.horario || "08:00",
      preparacao: m?.preparacao ?? m?.tipoPreparacao ?? "",
      tipoPreparacao: m?.tipoPreparacao ?? m?.preparacao ?? "",
      tipoPlanejamento: m?.tipoPlanejamento || tipoPlanejamentoCardapio,
      itens: Array.isArray(m?.itens)
        ? m.itens.filter(Boolean).map((it, itIdx) => ({
            ...it,
            id: it?.id || `it-${idx + 1}-${itIdx + 1}`,
            alimento: it?.alimento ?? it?.alimentoNome ?? it?.nome ?? "",
            alimentoNome: it?.alimentoNome ?? it?.alimento ?? it?.nome ?? "",
            nome: it?.nome ?? it?.alimentoNome ?? it?.alimento ?? "",
            medidaCaseira: it?.medidaCaseira ?? it?.medida ?? "",
            medida: it?.medida ?? it?.medidaCaseira ?? "",
            gramatura: it?.gramatura ?? it?.gramas ?? 0,
            kcal: it?.kcal ?? 0,
            cho: it?.cho ?? 0,
            ptn: it?.ptn ?? 0,
            lip: it?.lip ?? 0
          }))
        : [],
      alimentos: m?.alimentos || "",
      substituicoes: m?.substituicoes || "",
      subtotal: (m?.subtotal && typeof m.subtotal === "object") ? m.subtotal : { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 }
    }));

    const rawConsumo = (raw?.consumoAlimentar && typeof raw.consumoAlimentar === "object") ? raw.consumoAlimentar : {};
    const rawRefRec = Array.isArray(rawConsumo?.refeicoesRecordatorio)
      ? rawConsumo.refeicoesRecordatorio.filter(Boolean)
      : null;

    const safeRefRec = (Array.isArray(rawRefRec) && rawRefRec.length > 0 ? rawRefRec : (empty.consumoAlimentar?.refeicoesRecordatorio || [])).map((m, idx) => ({
      id: m?.id || `rec-${idx + 1}`,
      refeicao: m?.refeicao || m?.nome || `Refeição ${idx + 1}`,
      horario: m?.horario || "08:00",
      preparacao: m?.preparacao ?? m?.tipoPreparacao ?? "",
      tipoPreparacao: m?.tipoPreparacao ?? m?.preparacao ?? "",
      itens: Array.isArray(m?.itens) ? m.itens.filter(Boolean) : [],
      substituicoes: m?.substituicoes || "",
      subtotal: (m?.subtotal && typeof m.subtotal === "object") ? m.subtotal : { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 }
    }));

    const orientacoes = String(raw?.orientacoesNutricionais ?? raw?.orientacaoNutricional ?? "").trim();

    return {
      ...empty,
      ...raw,
      caseId: cId,
      aluno: { ...(empty.aluno || {}), ...(raw?.aluno && typeof raw.aluno === "object" ? raw.aluno : {}) },
      dadosPacienteReal: { ...(empty.dadosPacienteReal || {}), ...(raw?.dadosPacienteReal && typeof raw.dadosPacienteReal === "object" ? raw.dadosPacienteReal : {}) },
      anamnese: { ...(empty.anamnese || {}), ...(raw?.anamnese && typeof raw.anamnese === "object" ? raw.anamnese : {}) },
      antropometria: { ...(empty.antropometria || {}), ...(raw?.antropometria && typeof raw.antropometria === "object" ? raw.antropometria : {}) },
      bioquimica: {
        ...(empty.bioquimica || {}),
        ...(raw?.bioquimica && typeof raw.bioquimica === "object" ? raw.bioquimica : {}),
        interpretacoes: (raw?.bioquimica?.interpretacoes && typeof raw.bioquimica.interpretacoes === "object") ? raw.bioquimica.interpretacoes : {},
        exames: Array.isArray(raw?.bioquimica?.exames) ? raw.bioquimica.exames.filter(Boolean) : [],
        listaCustom: Array.isArray(raw?.bioquimica?.listaCustom) ? raw.bioquimica.listaCustom.filter(Boolean) : []
      },
      interacaoDrogaNutriente: Array.isArray(raw?.interacaoDrogaNutriente) ? raw.interacaoDrogaNutriente.filter(Boolean) : [],
      exameFisico: {
        ...(empty.exameFisico || {}),
        ...(raw?.exameFisico && typeof raw.exameFisico === "object" ? raw.exameFisico : {}),
        orgaosSistemas: { ...(empty.exameFisico?.orgaosSistemas || {}), ...(raw?.exameFisico?.orgaosSistemas || {}) },
        compartimentos: { ...(empty.exameFisico?.compartimentos || {}), ...(raw?.exameFisico?.compartimentos || {}) }
      },
      consumoAlimentar: {
        ...(empty.consumoAlimentar || {}),
        ...rawConsumo,
        refeicoesRecordatorio: safeRefRec,
        totaisRecordatorio: { ...(empty.consumoAlimentar?.totaisRecordatorio || {}), ...(rawConsumo?.totaisRecordatorio || {}) }
      },
      diagnosticoPES: { ...(empty.diagnosticoPES || {}), ...(raw?.diagnosticoPES && typeof raw.diagnosticoPES === "object" ? raw.diagnosticoPES : {}) },
      calculoNecessidades: {
        ...(empty.calculoNecessidades || {}),
        ...(raw?.calculoNecessidades && typeof raw.calculoNecessidades === "object" ? raw.calculoNecessidades : {}),
        formulasSelecionadas: Array.isArray(raw?.calculoNecessidades?.formulasSelecionadas) ? raw.calculoNecessidades.formulasSelecionadas : []
      },
      prescricaoDietoterapica: { ...(empty.prescricaoDietoterapica || {}), ...(raw?.prescricaoDietoterapica && typeof raw.prescricaoDietoterapica === "object" ? raw.prescricaoDietoterapica : {}) },
      tipoPlanejamentoCardapio,
      habilitarPlanejamentoQualitativo: isQualitativo,
      planejamentoAlimentar: safePlanejamento,
      totaisCardapio: { ...(empty.totaisCardapio || {}), ...(raw?.totaisCardapio && typeof raw.totaisCardapio === "object" ? raw.totaisCardapio : {}) },
      tne: { ...(empty.tne || {}), ...(raw?.tne && typeof raw.tne === "object" ? raw.tne : {}) },
      respostasQuestoes: (raw?.respostasQuestoes && typeof raw.respostasQuestoes === "object") ? raw.respostasQuestoes : {},
      orientacoesNutricionais: orientacoes
    };
  }

  // Salva rascunho no localStorage
  saveDraft(caseId, data, studentId) {
    this.currentCaseId = caseId;
    const safeData = this.sanitizeProntuarioPayload(data, caseId);
    const sId = studentId || safeData?.userId || safeData?.aluno?.id || null;
    const dynamicKey = this.getStorageKey(caseId, sId);
    const json = JSON.stringify(safeData);
    localStorage.setItem(dynamicKey, json);
    // Mantém chave legada para retrocompatibilidade
    localStorage.setItem(`${this.draftKeyPrefix}${caseId}`, json);
  }

  // Alterna com segurança entre 'Planejamento Qualitativo' e 'Planejamento Quantitativo' gerenciando o estado planejamentoAlimentar
  switchCardapioPlanningMode(prontuario, mode = "quantitativo") {
    const cleanMode = mode === "qualitativo" ? "qualitativo" : "quantitativo";
    const isQualitativo = cleanMode === "qualitativo";
    const safe = this.sanitizeProntuarioPayload(prontuario, prontuario?.caseId);
    safe.tipoPlanejamentoCardapio = cleanMode;
    safe.habilitarPlanejamentoQualitativo = isQualitativo;
    safe.planejamentoAlimentar = (safe.planejamentoAlimentar || []).map((meal, idx) => ({
      ...meal,
      id: meal?.id || `ref-${idx + 1}`,
      refeicao: meal?.refeicao || "Desjejum",
      horario: meal?.horario || "07:00",
      preparacao: meal?.preparacao ?? meal?.tipoPreparacao ?? "",
      tipoPreparacao: meal?.tipoPreparacao ?? meal?.preparacao ?? "",
      tipoPlanejamento: cleanMode,
      itens: Array.isArray(meal?.itens)
        ? meal.itens.filter(Boolean).map((it, itIdx) => ({
            ...it,
            id: it?.id || `it-${idx + 1}-${itIdx + 1}`,
            alimento: it?.alimento ?? it?.alimentoNome ?? it?.nome ?? "",
            alimentoNome: it?.alimentoNome ?? it?.alimento ?? it?.nome ?? "",
            nome: it?.nome ?? it?.alimentoNome ?? it?.alimento ?? "",
            medidaCaseira: it?.medidaCaseira ?? it?.medida ?? "",
            medida: it?.medida ?? it?.medidaCaseira ?? "",
            gramatura: isQualitativo ? 0 : (it?.gramatura ?? it?.gramas ?? 0),
            kcal: isQualitativo ? 0 : (it?.kcal ?? 0),
            cho: isQualitativo ? 0 : (it?.cho ?? 0),
            ptn: isQualitativo ? 0 : (it?.ptn ?? 0),
            lip: isQualitativo ? 0 : (it?.lip ?? 0)
          }))
        : []
    }));
    return safe;
  }

  // Constrói o payload final padronizado enviado ao Firebase (Simulação e Atendimento Real)
  buildSubmissionPayload(data = {}) {
    const safeData = this.sanitizeProntuarioPayload(data, data?.caseId);
    const orientacoes = String(safeData?.orientacoesNutricionais ?? safeData?.orientacaoNutricional ?? "").trim();
    return {
      ...safeData,
      planejamentoAlimentar: safeData?.planejamentoAlimentar || [],
      orientacoesNutricionais: orientacoes,
      dataFinalizacao: safeData?.dataFinalizacao || new Date().toISOString()
    };
  }

  // Limpa rascunho local
  clearDraft(caseId, studentId) {
    localStorage.removeItem(this.getStorageKey(caseId, studentId));
    localStorage.removeItem(`${this.draftKeyPrefix}${caseId}`);
  }

  // Modelo de prontuário em branco
  getEmptyProntuario(caseId) {
    const currentUid = (typeof window !== "undefined" && window.firebaseSyncService && typeof window.firebaseSyncService.getUserId === "function")
      ? window.firebaseSyncService.getUserId()
      : "";
    return {
      caseId: caseId,
      userId: currentUid,
      isRealPatient: false,
      dadosPacienteReal: {
        nome: "",
        idade: "",
        sexo: "Feminino",
        genero: "Feminino",
        ocupacao: "",
        profissao: "",
        naturalidade: "",
        procedencia: "",
        historicoSocial: {
          estadoCivil: "",
          renda: "",
          profissao: "",
          moradia: "",
          escolaridade: ""
        },
        hipoteseDiagnostica: "",
        dataAtendimento: new Date().toISOString().split("T")[0]
      },
      aluno: {
        nome: "",
        matriculaTurma: "",
        data: new Date().toISOString().split("T")[0]
      },
      anamnese: {
        hipoteseDiagnostica: "",
        queixaPrincipal: "",
        historiaClinica: "",
        antecedentesMedicamentos: "",
        habitosEstiloVida: ""
      },
      antropometria: {
        triagemNutricional: {
          tipo: "ambulatorio", // "ambulatorio" | "hospitalar"
          ferramenta: "",
          pontuacao: "",
          diagnostico: ""
        },
        pesoAtual: "",
        pesoHabitual: "",
        estatura: "",
        alturaJoelho: "",
        pesoEstimadoChumlea: "",
        estaturaEstimadaChumlea: "",
        pesoEfetivo: "",
        estaturaEfetiva: "",
        origemDadosAntro: "",
        imc: "",
        imcIdeal: "",
        classificacaoImc: "",
        diagnosticoNutricionalExtenso: "",
        criterioClassificacao: "",
        percentualPerda: "",
        circunferenciasDobras: "",
        circBraco: "",
        circCintura: "",
        circQuadril: "",
        circPanturrilha: "",
        circPunho: "",
        dobraTricipital: "",
        dobraSubescapular: "",
        dobraBicipital: "",
        dobraSuprailiaca: "",
        dobraAbdominal: "",
        dobraCoxa: "",
        demaisAvaliacoes: ""
      },
      bioquimica: {
        examesRelevantes: "",
        interpretacaoNutricional: "",
        interpretacoes: {},
        exames: [],
        listaCustom: []
      },
      interacaoDrogaNutriente: [],
      observacoesFarmacoterapia: "",
      exameFisico: {
        orgaosSistemas: {
          neurologico: "",
          respiratorio: "",
          circulatorio: "",
          digestorio: "",
          urinario: "",
          muscular: ""
        },
        compartimentos: {
          cabeca: "",
          tronco: "",
          mmss: "",
          mmii: ""
        },
        sinaisClinicos: "",
        massaMuscularAdiposa: "",
        condicoesTGIeEdemas: ""
      },
      consumoAlimentar: {
        inqueritoResumo: "",
        aguaPreferenciasAversoes: "",
        vetRecordatorio: "",
        neeCaso: "",
        adequacaoVetPct: "",
        adequacaoVetClassificacao: "",
        baseAlimentosReferencia: "TACO (Tabela Brasileira de Composição de Alimentos - UNICAMP, 4ª edição)"
      },
      diagnosticoPES: {
        problema: "",
        etiologia: "",
        sinaisSintomas: "",
        textoCompletoPES: "",
        objetivosDietoterapicos: ""
      },
      calculoNecessidades: {
        formulasSelecionadas: [],
        generoUtilizado: "Masculino",
        bolso: {
          minKcalKg: "",
          maxKcalKg: "",
          pesoKg: "",
          faixaKcal: "",
          resultadoKcal: "",
          equacaoDescritiva: ""
        },
        harrisBenedict: {
          genero: "Masculino",
          pesoKg: "",
          alturaCm: "",
          idadeAnos: "",
          gebKcal: "",
          fa: "1.2",
          fi: "1.0",
          vetKcal: "",
          resultadoKcal: "",
          equacaoDescritiva: ""
        },
        mifflin: {
          genero: "Masculino",
          pesoKg: "",
          alturaCm: "",
          idadeAnos: "",
          gebKcal: "",
          fa: "1.2",
          fi: "1.0",
          vetKcal: "",
          resultadoKcal: "",
          equacaoDescritiva: ""
        },
        faoOms: {
          genero: "Masculino",
          constanteIdade: "",
          pesoKg: "",
          constanteFixa: "",
          gebKcal: "",
          fa: "1.2",
          fi: "1.0",
          vetKcal: "",
          resultadoKcal: "",
          equacaoDescritiva: ""
        },
        eerIom: {
          genero: "Masculino",
          constanteEer: "",
          fatorIdade: "",
          idadeAnos: "",
          naf: "1.0",
          fatorPeso: "",
          pesoKg: "",
          fatorAltura: "",
          alturaM: "",
          eerKcal: "",
          fa: "1.0",
          fi: "1.0",
          vetKcal: "",
          resultadoKcal: "",
          equacaoDescritiva: ""
        },
        vetPlanejadoKcal: "",
        taxaMetabolicaCalculada: "",
        justificativaEscolha: ""
      },
      prescricaoDietoterapica: {
        vetKcal: "",
        regraBolsoKcalKg: "",
        distribuicaoMacros: {
          cho: { minPct: "45", maxPct: "55", minKcal: 0, maxKcal: 0, minG: 0, maxG: 0 },
          ptn: { minPct: "15", maxPct: "20", minKcal: 0, maxKcal: 0, minG: 0, maxG: 0 },
          lip: { minPct: "25", maxPct: "30", minKcal: 0, maxKcal: 0, minG: 0, maxG: 0 }
        },
        recomendacaoProteinaGKg: {
          minGKg: "1.0",
          maxGKg: "1.2",
          minTotalG: 0,
          maxTotalG: 0
        },
        carboidratosG: "",
        carboidratosPct: "",
        proteinasG: "",
        proteinasGKg: "",
        proteinasPct: "",
        lipidiosG: "",
        lipidiosPct: "",
        consistencia: "Normal / Livre",
        fracionamento: "5 a 6 refeições/dia",
        fibrasMicronutrientes: "",
        justificativaFisiopatologica: ""
      },
      consumoAlimentar: {
        vetRecordatorio: "",
        neeCaso: "",
        adequacaoVetPct: "",
        adequacaoVetClassificacao: "",
        baseAlimentosReferencia: "TACO (Tabela Brasileira de Composição de Alimentos - UNICAMP, 4ª edição)",
        inqueritoResumo: "",
        aguaPreferenciasAversoes: "",
        refeicoesRecordatorio: [
          { id: "rec-1", refeicao: "Desjejum / Café da Manhã", horario: "07:00", preparacao: "", tipoPreparacao: "", itens: [], substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
          { id: "rec-2", refeicao: "Colação / Lanche da Manhã", horario: "09:30", preparacao: "", tipoPreparacao: "", itens: [], substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
          { id: "rec-3", refeicao: "Almoço", horario: "12:30", preparacao: "", tipoPreparacao: "", itens: [], substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
          { id: "rec-4", refeicao: "Lanche da Tarde", horario: "16:00", preparacao: "", tipoPreparacao: "", itens: [], substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
          { id: "rec-5", refeicao: "Jantar", horario: "19:30", preparacao: "", tipoPreparacao: "", itens: [], substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
          { id: "rec-6", refeicao: "Ceia", horario: "22:00", preparacao: "", tipoPreparacao: "", itens: [], substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } }
        ],
        totaisRecordatorio: {
          vetTotalKcal: 0,
          carboidratosG: 0,
          carboidratosPct: 0,
          proteinasG: 0,
          proteinasGKg: 0,
          proteinasPct: 0,
          lipidiosG: 0,
          lipidiosPct: 0,
          gorduraSaturadaG: "",
          gorduraSaturadaPct: "",
          gorduraMonoinsaturadaG: "",
          gorduraMonoinsaturadaPct: "",
          gorduraPoliinsaturadaG: "",
          gorduraPoliinsaturadaPct: "",
          statusLipidios: {
            sat: { status: "Indefinido", label: "Aguardando Dados", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" },
            mono: { status: "Indefinido", label: "Aguardando Dados", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" },
            poli: { status: "Indefinido", label: "Aguardando Dados", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" }
          },
          fibrasG: 0,
          calcioMg: 0,
          ferroMg: 0,
          sodioMg: 0,
          potassioMg: 0,
          adequacaoVetPct: 0
        },
        statusMacrosRecordatorio: {
          cho: { status: "Indefinido", label: "Aguardando Prescrição", badgeClass: "bg-slate-100 text-slate-700 border-slate-300" },
          ptn: { status: "Indefinido", label: "Aguardando Prescrição", badgeClass: "bg-slate-100 text-slate-700 border-slate-300" },
          lip: { status: "Indefinido", label: "Aguardando Prescrição", badgeClass: "bg-slate-100 text-slate-700 border-slate-300" }
        }
      },
      planejamentoAlimentar: [
        { id: "ref-1", refeicao: "Desjejum / Café da Manhã", horario: "07:00", preparacao: "", tipoPreparacao: "", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
        { id: "ref-2", refeicao: "Colação / Lanche da Manhã", horario: "09:30", preparacao: "", tipoPreparacao: "", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
        { id: "ref-3", refeicao: "Almoço", horario: "12:30", preparacao: "", tipoPreparacao: "", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
        { id: "ref-4", refeicao: "Lanche da Tarde", horario: "16:00", preparacao: "", tipoPreparacao: "", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
        { id: "ref-5", refeicao: "Jantar", horario: "19:30", preparacao: "", tipoPreparacao: "", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } },
        { id: "ref-6", refeicao: "Ceia", horario: "22:00", preparacao: "", tipoPreparacao: "", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0 } }
      ],
      totaisCardapio: {
        vetTotalKcal: 0,
        carboidratosG: 0,
        carboidratosPct: 0,
        proteinasG: 0,
        proteinasGKg: 0,
        proteinasPct: 0,
        lipidiosG: 0,
        lipidiosPct: 0,
        gorduraSaturadaG: "",
        gorduraSaturadaPct: "",
        gorduraMonoinsaturadaG: "",
        gorduraMonoinsaturadaPct: "",
        gorduraPoliinsaturadaG: "",
        gorduraPoliinsaturadaPct: "",
        statusLipidios: {
          sat: { status: "Indefinido", label: "Aguardando Dados", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" },
          mono: { status: "Indefinido", label: "Aguardando Dados", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" },
          poli: { status: "Indefinido", label: "Aguardando Dados", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" }
        },
        fibrasG: 0,
        calcioMg: 0,
        ferroMg: 0,
        sodioMg: 0,
        potassioMg: 0,
        fosforoMg: 0,
        adequacaoVetPct: 0,
        statusMacros: {
          cho: { status: "Indefinido", label: "Aguardando Prescrição", badgeClass: "bg-slate-100 text-slate-700 border-slate-300" },
          ptn: { status: "Indefinido", label: "Aguardando Prescrição", badgeClass: "bg-slate-100 text-slate-700 border-slate-300" },
          lip: { status: "Indefinido", label: "Aguardando Prescrição", badgeClass: "bg-slate-100 text-slate-700 border-slate-300" }
        }
      },
      consistenciaDietaOral: "Dieta Livre / Normal",
      orientacoesNutricionais: "",
      respostasQuestoes: {}, // id da questão -> resposta do aluno
      tne: {
        viaAlimentacao: "oral", // "oral" | "tne"
        nomeComercial: "",
        tipoDieta: "",
        densidadeCalorica: "",
        fracionamento: "",
        viaAdministracao: "gravitacional", // "gravitacional" | "bomba"
        gravitacional: {
          volumePorRefeicao: "",
          quantidadeFrascosEtapas: "",
          metaVazaoGotasMin: ""
        },
        bombaInfusao: {
          tempoInfusaoHoras: "",
          metaVazaoMlHora: ""
        },
        tabelaNutricionalManual: {
          vet: "",
          cho: "",
          ptn: "",
          lip: "",
          fibra: "",
          sodio: "",
          potassio: "",
          calcio: "",
          fosforo: ""
        },
        moduloSuplementacaoProteica: ""
      }
    };
  }

  // Estima estatura pela fórmula de Chumlea (1985) a partir de AJ e Idade
  estimateChumleaStature(aj, age, gender) {
    if (!aj || isNaN(String(aj).replace(",", "."))) return null;
    const ajNum = parseFloat(String(aj).replace(",", "."));
    if (ajNum <= 0) return null;
    const ageNum = parseInt(age) || 40;
    const isFemale = (gender || "").toLowerCase().includes("fem") || (gender || "").toLowerCase().includes("mulher");
    
    let cm = 0;
    if (isFemale) {
      cm = 84.88 - (0.24 * ageNum) + (1.83 * ajNum);
    } else {
      cm = 64.19 - (0.04 * ageNum) + (2.02 * ajNum);
    }
    const m = (cm / 100).toFixed(2);
    return { cm: cm.toFixed(1), m: m, rawM: cm / 100 };
  }

  // Estima peso pela fórmula de Chumlea (1988/1985) a partir de CB e AJ (com suporte a CP e DCSE)
  estimateChumleaWeight(cb, aj, gender, cp = null, dcse = null) {
    if (!cb || !aj) return null;
    const cbNum = parseFloat(String(cb).replace(",", "."));
    const ajNum = parseFloat(String(aj).replace(",", "."));
    if (isNaN(cbNum) || isNaN(ajNum) || cbNum <= 0 || ajNum <= 0) return null;

    const cpNum = cp ? parseFloat(String(cp).replace(",", ".")) : null;
    const dcseNum = dcse ? parseFloat(String(dcse).replace(",", ".")) : null;
    const isFemale = (gender || "").toLowerCase().includes("fem") || (gender || "").toLowerCase().includes("mulher");

    let peso = 0;
    let metodo = "";

    // Se CP e DCSE também estiverem presentes, usa a equação completa de 4 variáveis
    if (cpNum && !isNaN(cpNum) && cpNum > 0 && dcseNum && !isNaN(dcseNum) && dcseNum > 0) {
      if (isFemale) {
        peso = (1.27 * cpNum) + (0.87 * ajNum) + (0.98 * cbNum) + (0.4 * dcseNum) - 62.35;
      } else {
        peso = (0.98 * cpNum) + (1.16 * ajNum) + (1.73 * cbNum) + (0.37 * dcseNum) - 81.69;
      }
      metodo = "Chumlea (4 variáveis: AJ, CB, CP, DCSE)";
    } else {
      // Equação padrão de Chumlea para AJ e CB
      if (isFemale) {
        peso = (ajNum * 1.01) + (cbNum * 2.81) - 66.04;
      } else {
        peso = (ajNum * 1.19) + (cbNum * 3.21) - 86.82;
      }
      metodo = "Chumlea (AJ e CB)";
    }

    if (peso <= 0) return null;
    return {
      kg: peso.toFixed(1),
      rawKg: peso,
      metodo: metodo
    };
  }

  // Cálculo de IMC e Classificação automática por extenso (OMS para Adultos ou Lipschitz para Idosos)
  calculateIMC(peso, altura, idade = 40) {
    let p = typeof peso === "string" ? parseFloat(peso.replace(",", ".")) : parseFloat(peso);
    let h = typeof altura === "string" ? parseFloat(altura.replace(",", ".")) : parseFloat(altura);
    if (!p || !h || h <= 0 || p <= 0) {
      return { 
        imc: "", 
        imcNumber: null, 
        classificacao: "", 
        diagnosticoExtenso: "Aguardando dados antropométricos",
        criterio: "" 
      };
    }
    // Converte cm para metros se digitado como 170 em vez de 1.70
    if (h > 100) {
      h = h / 100;
    }

    const imc = p / (h * h);
    const imcFormatted = imc.toFixed(2);
    let classificacao = "";
    let diagnosticoExtenso = "";
    let statusColor = "emerald"; // emerald, amber, rose

    const isIdoso = idade >= 60;
    const criterio = isIdoso ? "Lipschitz (1994)" : "OMS";

    if (isIdoso) {
      // Critério de Lipschitz (1994) para Idosos
      if (imc < 22.0) {
        classificacao = "Baixo Peso / Desnutrição (Lipschitz)";
        diagnosticoExtenso = "Baixo Peso / Desnutrição segundo o Critério de Lipschitz (1994) para Idosos";
        statusColor = "amber";
      } else if (imc <= 27.0) {
        classificacao = "Eutrofia (Lipschitz)";
        diagnosticoExtenso = "Eutrofia / Estado Nutricional Adequado segundo o Critério de Lipschitz (1994) para Idosos";
        statusColor = "emerald";
      } else {
        classificacao = "Sobrepeso / Obesidade (Lipschitz)";
        diagnosticoExtenso = "Sobrepeso / Obesidade segundo o Critério de Lipschitz (1994) para Idosos";
        statusColor = "rose";
      }
    } else {
      // Critério da OMS para Adultos
      if (imc < 18.5) {
        classificacao = "Baixo Peso (OMS)";
        diagnosticoExtenso = "Baixo Peso / Desnutrição segundo os Pontos de Corte da Organização Mundial da Saúde (OMS)";
        statusColor = "amber";
      } else if (imc < 25.0) {
        classificacao = "Eutrofia (OMS)";
        diagnosticoExtenso = "Eutrofia / Peso Normal segundo os Pontos de Corte da Organização Mundial da Saúde (OMS)";
        statusColor = "emerald";
      } else if (imc < 30.0) {
        classificacao = "Sobrepeso (OMS)";
        diagnosticoExtenso = "Sobrepeso / Pré-obesidade segundo os Pontos de Corte da Organização Mundial da Saúde (OMS)";
        statusColor = "amber";
      } else if (imc < 35.0) {
        classificacao = "Obesidade Grau I (OMS)";
        diagnosticoExtenso = "Obesidade Grau I segundo os Pontos de Corte da Organização Mundial da Saúde (OMS)";
        statusColor = "rose";
      } else if (imc < 40.0) {
        classificacao = "Obesidade Grau II (OMS)";
        diagnosticoExtenso = "Obesidade Grau II / Severa segundo os Pontos de Corte da Organização Mundial da Saúde (OMS)";
        statusColor = "rose";
      } else {
        classificacao = "Obesidade Grau III (OMS)";
        diagnosticoExtenso = "Obesidade Grau III / Grave ou Mórbida segundo os Pontos de Corte da Organização Mundial da Saúde (OMS)";
        statusColor = "rose";
      }
    }

    return { 
      imc: imcFormatted, 
      imcNumber: imc, 
      classificacao, 
      diagnosticoExtenso, 
      criterio, 
      statusColor 
    };
  }

  // Cálculo da % de Adequação do VET do Recordatório em relação à NEE
  calculateVetAdequacy(vetRecordatorio, nee) {
    const vr = typeof vetRecordatorio === "string" ? parseFloat(vetRecordatorio.replace(",", ".")) : parseFloat(vetRecordatorio);
    const n = typeof nee === "string" ? parseFloat(nee.replace(",", ".")) : parseFloat(nee);

    if (!vr || !n || vr <= 0 || n <= 0) {
      return {
        percentual: "",
        percentualNum: null,
        classificacao: "Aguardando VET do Recordatório e NEE",
        statusColor: "slate",
        diferencaKcal: 0,
        interpretacao: "Insira o VET do recordatório de 24h para calcular a adequação."
      };
    }

    const pct = (vr / n) * 100;
    const diff = Math.round(vr - n);
    const pctFormatted = pct.toFixed(1);

    let classificacao = "";
    let statusColor = "emerald";
    let interpretacao = "";

    if (pct < 90) {
      classificacao = "Ingestão Hipocalórica / Inadequada";
      statusColor = "amber";
      interpretacao = `Consumo abaixo das necessidades estimadas (déficit de ${Math.abs(diff)} kcal/dia; ${pctFormatted}% da NEE).`;
    } else if (pct <= 110) {
      classificacao = "Ingestão Normocalórica / Adequada";
      statusColor = "emerald";
      interpretacao = `Consumo adequado dentro da faixa recomendada de 90% a 110% da NEE (${pctFormatted}% da NEE; variação de ${diff >= 0 ? '+' : ''}${diff} kcal/dia).`;
    } else {
      classificacao = "Ingestão Hipercalórica / Inadequada";
      statusColor = "rose";
      interpretacao = `Consumo acima das necessidades estimadas (superávit de +${diff} kcal/dia; ${pctFormatted}% da NEE).`;
    }

    return {
      percentual: pctFormatted,
      percentualNum: pct,
      classificacao,
      statusColor,
      diferencaKcal: diff,
      interpretacao
    };
  }

  // Cálculo do % de perda de peso: ((Habitual - Atual) / Habitual) * 100
  calculateWeightLoss(pesoHabitual, pesoAtual) {
    const ph = typeof pesoHabitual === "string" ? parseFloat(pesoHabitual.replace(",", ".")) : parseFloat(pesoHabitual);
    const pa = typeof pesoAtual === "string" ? parseFloat(pesoAtual.replace(",", ".")) : parseFloat(pesoAtual);
    if (!ph || !pa || ph <= 0) {
      return { percentual: "", interpretacao: "" };
    }

    const diff = ph - pa;
    const pct = (diff / ph) * 100;
    const pctFormatted = pct.toFixed(1);

    let interpretacao = "";
    if (pct <= 0) {
      interpretacao = `Ganho de peso de ${Math.abs(pct).toFixed(1)}%`;
    } else if (pct < 5) {
      interpretacao = `Perda ponderal discreta (${pctFormatted}%)`;
    } else if (pct < 10) {
      interpretacao = `Perda ponderal moderada (${pctFormatted}%)`;
    } else {
      interpretacao = `Perda ponderal severa/grave (${pctFormatted}%)`;
    }

    return { percentual: pctFormatted, interpretacao };
  }

  // Calcula Taxa Metabólica Resultante (kcal/kg) baseada no VET e Peso Atual
  calculateKcalKgRate(vetKcal, weightKg) {
    if (!vetKcal || !weightKg) return null;
    const vet = typeof vetKcal === "string" ? parseFloat(vetKcal.replace(",", ".")) : parseFloat(vetKcal);
    const weight = typeof weightKg === "string" ? parseFloat(weightKg.replace(",", ".")) : parseFloat(weightKg);
    if (isNaN(vet) || isNaN(weight) || weight <= 0 || vet <= 0) return null;
    return (vet / weight).toFixed(1);
  }

  // Regra de três das Gramaturas (Padrão TACO/Tucunduva base 100g)
  // Passo B: Valor Final do Nutriente = (Gramatura Total * Valor do Nutriente em 100g) / 100
  calculateItemNutrition(foodTaco, gramatura) {
    if (!foodTaco) {
      return { gramatura: 0, kcal: 0, cho: 0, ptn: 0, lip: 0, sat: 0, mono: 0, poli: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0, vitA: 0, vitC: 0 };
    }
    const g = typeof gramatura === "string" ? parseFloat(gramatura.replace(",", ".")) : parseFloat(gramatura);
    if (isNaN(g) || g <= 0) {
      return { gramatura: 0, kcal: 0, cho: 0, ptn: 0, lip: 0, sat: 0, mono: 0, poli: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0, vitA: 0, vitC: 0 };
    }

    const base100g = Number(foodTaco.baseGramas || 100); // base 100g da TACO / Tucunduva
    // Passo B: Valor Final do Nutriente = (Gramatura Total * Valor do Nutriente em 100g) / 100
    const calcRegraDeTres = (val100g) => Math.round(((g * Number(val100g || 0)) / base100g) * 10) / 10;

    return {
      gramatura: g,
      kcal: calcRegraDeTres(foodTaco.kcal),
      cho: calcRegraDeTres(foodTaco.cho),
      ptn: calcRegraDeTres(foodTaco.ptn),
      lip: calcRegraDeTres(foodTaco.lip),
      sat: calcRegraDeTres(foodTaco.sat || 0),
      mono: calcRegraDeTres(foodTaco.mono || 0),
      poli: calcRegraDeTres(foodTaco.poli || 0),
      fibra: calcRegraDeTres(foodTaco.fibra),
      calcio: calcRegraDeTres(foodTaco.calcio),
      ferro: calcRegraDeTres(foodTaco.ferro),
      sodio: calcRegraDeTres(foodTaco.sodio),
      potassio: calcRegraDeTres(foodTaco.potassio),
      vitA: calcRegraDeTres(foodTaco.vitA || 0),
      vitC: calcRegraDeTres(foodTaco.vitC || 0)
    };
  }

  // Calcula subtotal nutricional de uma refeição somando todos os seus itens (TACO, Decisão Nutricional ou Colaborativa)
  calculateMealSubtotal(meal) {
    const sub = { kcal: 0, cho: 0, ptn: 0, lip: 0, sat: 0, mono: 0, poli: 0, fibra: 0, calcio: 0, ferro: 0, sodio: 0, potassio: 0, vitA: 0, vitC: 0 };
    if (!meal) return sub;
    const items = Array.isArray(meal.itens) ? meal.itens : (Array.isArray(meal.alimentos) ? meal.alimentos : []);

    items.forEach(rawItem => {
      let item = rawItem;
      const targetId = item.id || item.tacoId;
      if ((!item.kcal && !item.lip) && targetId && (item.gramas || item.gramatura) && typeof this.calculateItemNutrition === "function") {
        let food = null;
        if (typeof getFoodById === "function") {
          food = getFoodById(targetId);
        } else if (typeof getTacoFoodById === "function") {
          food = getTacoFoodById(targetId);
        } else if (typeof TACO_DATABASE !== "undefined") {
          food = TACO_DATABASE.find(f => f.id === targetId);
        }
        if (!food && typeof DECISAO_NUTRICIONAL_DATABASE !== "undefined") {
          food = DECISAO_NUTRICIONAL_DATABASE.find(f => f.id === targetId);
        }
        if (food) {
          item = this.calculateItemNutrition(food, item.gramas || item.gramatura);
        }
      }
      sub.kcal += Number(item.kcal || 0);
      sub.cho += Number(item.cho || 0);
      sub.ptn += Number(item.ptn || 0);
      sub.lip += Number(item.lip || 0);
      sub.sat += Number(item.sat || 0);
      sub.mono += Number(item.mono || 0);
      sub.poli += Number(item.poli || 0);
      sub.fibra += Number(item.fibra || item.fibras || 0);
      sub.calcio += Number(item.calcio || 0);
      sub.ferro += Number(item.ferro || 0);
      sub.sodio += Number(item.sodio || 0);
      sub.potassio += Number(item.potassio || 0);
      sub.vitA += Number(item.vitA || 0);
      sub.vitC += Number(item.vitC || 0);
    });

    const round1 = (val) => Math.round(val * 10) / 10;
    return {
      kcal: round1(sub.kcal),
      cho: round1(sub.cho),
      ptn: round1(sub.ptn),
      lip: round1(sub.lip),
      sat: round1(sub.sat),
      mono: round1(sub.mono),
      poli: round1(sub.poli),
      fibra: round1(sub.fibra),
      calcio: round1(sub.calcio),
      ferro: round1(sub.ferro),
      sodio: round1(sub.sodio),
      potassio: round1(sub.potassio),
      vitA: round1(sub.vitA),
      vitC: round1(sub.vitC)
    };
  }

  // Calcula faixas de calorias e gramas a partir do VET planejado e das faixas de % da prescrição
  calculatePrescriptionDistribution(vet, distribuicaoInput) {
    const v = typeof vet === "string" ? parseFloat(vet.replace(",", ".")) : parseFloat(vet);
    const round1 = (val) => Math.round(val * 10) / 10;
    const res = {
      cho: { minPct: 0, maxPct: 0, minKcal: 0, maxKcal: 0, minG: 0, maxG: 0 },
      ptn: { minPct: 0, maxPct: 0, minKcal: 0, maxKcal: 0, minG: 0, maxG: 0 },
      lip: { minPct: 0, maxPct: 0, minKcal: 0, maxKcal: 0, minG: 0, maxG: 0 }
    };

    if (!distribuicaoInput) return res;

    const parseNum = (val) => {
      if (val === null || val === undefined || val === "") return 0;
      const n = typeof val === "string" ? parseFloat(val.replace(",", ".")) : parseFloat(val);
      return isNaN(n) ? 0 : n;
    };

    const macros = [
      { key: "cho", factor: 4 },
      { key: "ptn", factor: 4 },
      { key: "lip", factor: 9 }
    ];

    macros.forEach(({ key, factor }) => {
      const src = distribuicaoInput[key] || {};
      const minP = parseNum(src.minPct);
      const maxP = parseNum(src.maxPct);
      res[key].minPct = minP;
      res[key].maxPct = maxP;

      if (v && v > 0) {
        const minK = round1((v * minP) / 100);
        const maxK = round1((v * maxP) / 100);
        res[key].minKcal = minK;
        res[key].maxKcal = maxK;
        res[key].minG = round1(minK / factor);
        res[key].maxG = round1(maxK / factor);
      }
    });

    return res;
  }

  // Calcula os gramas esperados de proteína baseados em g/kg e peso do paciente
  calculateProteinGKgExpected(peso, minGKg, maxGKg) {
    const p = typeof peso === "string" ? parseFloat(peso.replace(",", ".")) : parseFloat(peso);
    const minG = typeof minGKg === "string" ? parseFloat(minGKg.replace(",", ".")) : parseFloat(minGKg);
    const maxG = typeof maxGKg === "string" ? parseFloat(maxGKg.replace(",", ".")) : parseFloat(maxGKg);
    const round1 = (val) => Math.round(val * 10) / 10;

    const res = {
      peso: p || 0,
      minGKg: isNaN(minG) ? 0 : minG,
      maxGKg: isNaN(maxG) ? 0 : maxG,
      minTotalG: 0,
      maxTotalG: 0
    };

    if (p && p > 0) {
      if (!isNaN(minG) && minG > 0) res.minTotalG = round1(p * minG);
      if (!isNaN(maxG) && maxG > 0) res.maxTotalG = round1(p * maxG);
    }
    return res;
  }

  // Avalia o status de um macronutriente (em gramas) frente à faixa prescrita [minG, maxG]
  evaluateMacroStatus(gramas, minGramas, maxGramas) {
    const g = typeof gramas === "string" ? parseFloat(gramas.replace(",", ".")) : parseFloat(gramas);
    const minG = typeof minGramas === "string" ? parseFloat(minGramas.replace(",", ".")) : parseFloat(minGramas);
    const maxG = typeof maxGramas === "string" ? parseFloat(maxGramas.replace(",", ".")) : parseFloat(maxGramas);

    if (isNaN(minG) || isNaN(maxG) || minG <= 0 || maxG <= 0) {
      return {
        status: "Indefinido",
        label: "Aguardando Prescrição",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
        icon: "help_outline"
      };
    }

    const currentG = isNaN(g) ? 0 : g;

    if (currentG < minG) {
      return {
        status: "Abaixo",
        label: "Abaixo da Meta",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
        icon: "arrow_downward"
      };
    } else if (currentG > maxG) {
      return {
        status: "Acima",
        label: "Acima da Meta",
        badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
        icon: "arrow_upward"
      };
    } else {
      return {
        status: "Adequado",
        label: "Adequado",
        badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
        icon: "check_circle"
      };
    }
  }

  // Compara os totais de macronutrientes com a prescrição
  compareTotalsWithPrescription(totals, distribuicaoPrescrita) {
    if (!distribuicaoPrescrita) {
      return {
        cho: this.evaluateMacroStatus(totals?.carboidratosG, 0, 0),
        ptn: this.evaluateMacroStatus(totals?.proteinasG, 0, 0),
        lip: this.evaluateMacroStatus(totals?.lipidiosG, 0, 0)
      };
    }
    return {
      cho: this.evaluateMacroStatus(totals?.carboidratosG, distribuicaoPrescrita.cho?.minG, distribuicaoPrescrita.cho?.maxG),
      ptn: this.evaluateMacroStatus(totals?.proteinasG, distribuicaoPrescrita.ptn?.minG, distribuicaoPrescrita.ptn?.maxG),
      lip: this.evaluateMacroStatus(totals?.lipidiosG, distribuicaoPrescrita.lip?.minG, distribuicaoPrescrita.lip?.maxG)
    };
  }

  // Conversão matemática automática: 1g de lipídio = 9 kcal
  convertLipidGramToPct(grams, vet) {
    const g = typeof grams === "string" ? parseFloat(grams.replace(",", ".")) : parseFloat(grams);
    const v = typeof vet === "string" ? parseFloat(vet.replace(",", ".")) : parseFloat(vet);
    if (isNaN(g) || isNaN(v) || v <= 0) return "0.0";
    return ((g * 9 / v) * 100).toFixed(1);
  }

  convertLipidPctToGram(pct, vet) {
    const p = typeof pct === "string" ? parseFloat(pct.replace(",", ".")) : parseFloat(pct);
    const v = typeof vet === "string" ? parseFloat(vet.replace(",", ".")) : parseFloat(vet);
    if (isNaN(p) || isNaN(v) || v <= 0) return "0.0";
    return ((p * v / 100) / 9).toFixed(1);
  }

  // Avaliação rigorosa da qualidade dos lipídios segundo as diretrizes clínicas:
  // - Saturadas (SAT): < 10% do VET
  // - Monoinsaturadas (MONO): Até 20% do VET
  // - Poli-insaturadas (POLI): Em média 10% do VET
  evaluateLipidFractionsStatus(satPct, monoPct, poliPct, vet = 1) {
    const parse = (val) => {
      if (val === null || val === undefined || val === "") return null;
      const n = typeof val === "string" ? parseFloat(val.replace(",", ".")) : parseFloat(val);
      return isNaN(n) ? null : n;
    };
    const s = parse(satPct);
    const m = parse(monoPct);
    const p = parse(poliPct);

    // Saturadas: < 10% do VET
    let sat = { status: "indefinido", label: "Aguardando Dados", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" };
    if (s !== null) {
      if (s < 10.0) {
        sat = { status: "adequado", label: "Adequado (< 10%)", badgeClass: "bg-emerald-950 text-emerald-300 border-emerald-600" };
      } else {
        sat = { status: "inadequado", label: "Inadequado (≥ 10%)", badgeClass: "bg-rose-950 text-rose-300 border-rose-600" };
      }
    }

    // Monoinsaturadas: Até 20% do VET
    let mono = { status: "indefinido", label: "Aguardando Dados", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" };
    if (m !== null) {
      if (m <= 20.0) {
        mono = { status: "adequado", label: "Adequado (Até 20%)", badgeClass: "bg-emerald-950 text-emerald-300 border-emerald-600" };
      } else {
        mono = { status: "inadequado", label: "Inadequado (> 20%)", badgeClass: "bg-rose-950 text-rose-300 border-rose-600" };
      }
    }

    // Poli-insaturadas: Em média 10% do VET
    let poli = { status: "indefinido", label: "Aguardando Dados", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" };
    if (p !== null) {
      if (p <= 10.5) {
        poli = { status: "adequado", label: "Adequado (Média ~10%)", badgeClass: "bg-emerald-950 text-emerald-300 border-emerald-600" };
      } else {
        poli = { status: "inadequado", label: "Inadequado (> 10%)", badgeClass: "bg-rose-950 text-rose-300 border-rose-600" };
      }
    }

    return { sat, mono, poli };
  }

  // Calcula totais nutricionais completos (Macros, Lipídios e Micronutrientes: Cálcio, Ferro, Sódio, Potássio) para uma lista de refeições
  calculateNutritionalTotals(mealsList, pesoPaciente = null, vetPrescrito = null, distribuicaoPrescrita = null) {
    const totals = {
      vetTotalKcal: 0,
      carboidratosG: 0,
      carboidratosPct: 0,
      proteinasG: 0,
      proteinasGKg: 0,
      proteinasPct: 0,
      lipidiosG: 0,
      lipidiosPct: 0,
      gorduraSaturadaG: 0,
      gorduraSaturadaPct: 0,
      gorduraMonoinsaturadaG: 0,
      gorduraMonoinsaturadaPct: 0,
      gorduraPoliinsaturadaG: 0,
      gorduraPoliinsaturadaPct: 0,
      statusLipidios: {
        sat: { status: "Indefinido", label: "Aguardando Dados", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" },
        mono: { status: "Indefinido", label: "Aguardando Dados", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" },
        poli: { status: "Indefinido", label: "Aguardando Dados", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" }
      },
      fibrasG: 0,
      calcioMg: 0,
      ferroMg: 0,
      sodioMg: 0,
      potassioMg: 0,
      vitAMcg: 0,
      vitCMg: 0,
      adequacaoVetPct: 0,
      classificacaoAdequacao: "",
      statusMacros: {
        cho: { status: "Indefinido", label: "Aguardando Prescrição", badgeClass: "bg-slate-100 text-slate-700 border-slate-300" },
        ptn: { status: "Indefinido", label: "Aguardando Prescrição", badgeClass: "bg-slate-100 text-slate-700 border-slate-300" },
        lip: { status: "Indefinido", label: "Aguardando Prescrição", badgeClass: "bg-slate-100 text-slate-700 border-slate-300" }
      }
    };

    if (!Array.isArray(mealsList)) return totals;

    mealsList.forEach(meal => {
      const sub = this.calculateMealSubtotal(meal);
      totals.vetTotalKcal += sub.kcal;
      totals.carboidratosG += sub.cho;
      totals.proteinasG += sub.ptn;
      totals.lipidiosG += sub.lip;
      totals.gorduraSaturadaG += sub.sat || 0;
      totals.gorduraMonoinsaturadaG += sub.mono || 0;
      totals.gorduraPoliinsaturadaG += sub.poli || 0;
      totals.fibrasG += sub.fibra;
      totals.calcioMg += sub.calcio;
      totals.ferroMg += sub.ferro;
      totals.sodioMg += sub.sodio;
      totals.potassioMg += sub.potassio;
      totals.vitAMcg += sub.vitA || 0;
      totals.vitCMg += sub.vitC || 0;
    });

    const round1 = (val) => Math.round(val * 10) / 10;
    totals.vetTotalKcal = round1(totals.vetTotalKcal);
    totals.carboidratosG = round1(totals.carboidratosG);
    totals.proteinasG = round1(totals.proteinasG);
    totals.lipidiosG = round1(totals.lipidiosG);
    totals.gorduraSaturadaG = round1(totals.gorduraSaturadaG);
    totals.gorduraMonoinsaturadaG = round1(totals.gorduraMonoinsaturadaG);
    totals.gorduraPoliinsaturadaG = round1(totals.gorduraPoliinsaturadaG);
    totals.fibrasG = round1(totals.fibrasG);
    totals.calcioMg = round1(totals.calcioMg);
    totals.ferroMg = round1(totals.ferroMg);
    totals.sodioMg = round1(totals.sodioMg);
    totals.potassioMg = round1(totals.potassioMg);
    totals.vitAMcg = round1(totals.vitAMcg);
    totals.vitCMg = round1(totals.vitCMg);

    // Percentuais calóricos dos macronutrientes: CHO e PTN = 4 kcal/g, LIP = 9 kcal/g
    if (totals.vetTotalKcal > 0) {
      totals.carboidratosPct = round1(((totals.carboidratosG * 4) / totals.vetTotalKcal) * 100);
      totals.proteinasPct = round1(((totals.proteinasG * 4) / totals.vetTotalKcal) * 100);
      totals.lipidiosPct = round1(((totals.lipidiosG * 9) / totals.vetTotalKcal) * 100);
    }

    // % de adequação em relação ao VET planejado/prescrito
    const vPresc = vetPrescrito ? (typeof vetPrescrito === "string" ? parseFloat(vetPrescrito.replace(",", ".")) : parseFloat(vetPrescrito)) : null;
    if (vPresc && vPresc > 0 && totals.vetTotalKcal > 0) {
      totals.adequacaoVetPct = round1((totals.vetTotalKcal / vPresc) * 100);
      if (totals.adequacaoVetPct < 90) {
        totals.classificacaoAdequacao = "Hipocalórico em relação à meta prescrita";
      } else if (totals.adequacaoVetPct <= 110) {
        totals.classificacaoAdequacao = "Adequado à meta prescrita (90% - 110%)";
      } else {
        totals.classificacaoAdequacao = "Hipercalórico em relação à meta prescrita";
      }
    }

    // Conversão matemática de gramas para % do VET (1g lipídio = 9 kcal)
    const baseVetLip = totals.vetTotalKcal > 0 ? totals.vetTotalKcal : (vPresc && vPresc > 0 ? vPresc : 0);
    if (baseVetLip > 0) {
      totals.gorduraSaturadaPct = round1(((totals.gorduraSaturadaG * 9) / baseVetLip) * 100);
      totals.gorduraMonoinsaturadaPct = round1(((totals.gorduraMonoinsaturadaG * 9) / baseVetLip) * 100);
      totals.gorduraPoliinsaturadaPct = round1(((totals.gorduraPoliinsaturadaG * 9) / baseVetLip) * 100);
    }
    totals.statusLipidios = this.evaluateLipidFractionsStatus(totals.gorduraSaturadaPct, totals.gorduraMonoinsaturadaPct, totals.gorduraPoliinsaturadaPct, baseVetLip);

    // g/kg de proteína
    const pKg = pesoPaciente ? (typeof pesoPaciente === "string" ? parseFloat(pesoPaciente.replace(",", ".")) : parseFloat(pesoPaciente)) : null;
    if (pKg && pKg > 0 && totals.proteinasG > 0) {
      totals.proteinasGKg = round1(totals.proteinasG / pKg);
    }

    // Status dos macros frente à prescrição
    totals.statusMacros = this.compareTotalsWithPrescription(totals, distribuicaoPrescrita);

    if (typeof analyzeAllMicronutrientsForPatient === "function") {
      totals.analiseDriMicronutrientes = analyzeAllMicronutrientsForPatient(
        totals,
        typeof getEffectivePatientAge === "function" ? getEffectivePatientAge() : 54,
        typeof getEffectivePatientGender === "function" ? getEffectivePatientGender() : "Masculino"
      );
    }

    return totals;
  }

  // Seleciona automaticamente o perfil DRI exato de micronutrientes para a idade e sexo do paciente
  getPatientDriProfile(age, gender) {
    if (typeof selectDriProfileForPatient === "function") {
      return selectDriProfileForPatient(age, gender);
    }
    return null;
  }

  // Avalia a adequação de micronutrientes (Cálcio, Ferro, Sódio, Potássio, Vitamina A e Vitamina C) frente às DRIs (RDA > EAR > AI e UL)
  evaluateMicronutrientsDri(totals, age, gender) {
    if (typeof analyzeAllMicronutrientsForPatient === "function") {
      return analyzeAllMicronutrientsForPatient(totals, age, gender);
    }
    return null;
  }

  // Mantém compatibilidade com chamadas de calculateCardapioTotals
  calculateCardapioTotals(planejamentoAlimentar, pesoPaciente = null, vetPrescrito = null, distribuicaoPrescrita = null) {
    return this.calculateNutritionalTotals(planejamentoAlimentar, pesoPaciente, vetPrescrito, distribuicaoPrescrita);
  }

  // Calcula consolidação nutricional para Terapia Nutricional Enteral (TNE) com base na tabela manual
  calculateTneManualNutritionalTotals(manualData = {}, pesoPaciente = null, vetPrescrito = null, distribuicaoPrescrita = null) {
    const parseNum = (val) => {
      if (val === null || val === undefined || val === "") return 0;
      const parsed = parseFloat(String(val).replace(",", "."));
      return isNaN(parsed) ? 0 : parsed;
    };
    const round1 = (val) => Math.round(val * 10) / 10;

    const totals = {
      vetTotalKcal: round1(parseNum(manualData.vet)),
      carboidratosG: round1(parseNum(manualData.cho)),
      carboidratosPct: 0,
      proteinasG: round1(parseNum(manualData.ptn)),
      proteinasGKg: 0,
      proteinasPct: 0,
      lipidiosG: round1(parseNum(manualData.lip)),
      lipidiosPct: 0,
      fibrasG: round1(parseNum(manualData.fibra)),
      calcioMg: round1(parseNum(manualData.calcio)),
      ferroMg: 0,
      sodioMg: round1(parseNum(manualData.sodio)),
      potassioMg: round1(parseNum(manualData.potassio)),
      fosforoMg: round1(parseNum(manualData.fosforo)),
      adequacaoVetPct: 0,
      classificacaoAdequacao: "Aguardando definição",
      statusMacros: {
        cho: { status: "Indefinido", label: "Aguardando Prescrição", badgeClass: "bg-slate-100 text-slate-700 border-slate-300" },
        ptn: { status: "Indefinido", label: "Aguardando Prescrição", badgeClass: "bg-slate-100 text-slate-700 border-slate-300" },
        lip: { status: "Indefinido", label: "Aguardando Prescrição", badgeClass: "bg-slate-100 text-slate-700 border-slate-300" }
      }
    };

    // Percentuais calóricos dos macronutrientes: CHO e PTN = 4 kcal/g, LIP = 9 kcal/g
    if (totals.vetTotalKcal > 0) {
      totals.carboidratosPct = round1(((totals.carboidratosG * 4) / totals.vetTotalKcal) * 100);
      totals.proteinasPct = round1(((totals.proteinasG * 4) / totals.vetTotalKcal) * 100);
      totals.lipidiosPct = round1(((totals.lipidiosG * 9) / totals.vetTotalKcal) * 100);
    }

    // g/kg de proteína
    const pKg = pesoPaciente ? (typeof pesoPaciente === "string" ? parseFloat(pesoPaciente.replace(",", ".")) : parseFloat(pesoPaciente)) : null;
    if (pKg && pKg > 0 && totals.proteinasG > 0) {
      totals.proteinasGKg = round1(totals.proteinasG / pKg);
    }

    // % de adequação em relação ao VET planejado/prescrito
    const vPresc = vetPrescrito ? (typeof vetPrescrito === "string" ? parseFloat(vetPrescrito.replace(",", ".")) : parseFloat(vetPrescrito)) : null;
    if (vPresc && vPresc > 0 && totals.vetTotalKcal > 0) {
      totals.adequacaoVetPct = round1((totals.vetTotalKcal / vPresc) * 100);
      if (totals.adequacaoVetPct < 90) {
        totals.classificacaoAdequacao = "Hipocalórico em relação à meta prescrita";
      } else if (totals.adequacaoVetPct <= 110) {
        totals.classificacaoAdequacao = "Adequado à meta prescrita (90% - 110%)";
      } else {
        totals.classificacaoAdequacao = "Hipercalórico em relação à meta prescrita";
      }
    }

    // Status dos macros frente à prescrição
    totals.statusMacros = this.compareTotalsWithPrescription(totals, distribuicaoPrescrita);

    return totals;
  }

  // Gera síntese textual da refeição unindo preparação (preparacao / tipoPreparacao), alimento, medida caseira livre e gramatura
  formatMealFoodsSummary(meal) {
    if (!meal) return "";
    let prepPrefix = "";
    const prepVal = meal.preparacao || meal.tipoPreparacao || "";
    if (prepVal && String(prepVal).trim()) {
      prepPrefix = `[${String(prepVal).trim()}] `;
    }
    if (Array.isArray(meal.itens) && meal.itens.length > 0) {
      const itemsStr = meal.itens.map(item => {
        let desc = item.alimento || item.alimentoNome || item.nome || "Alimento";
        const parts = [];
        const med = item.medidaCaseira || item.medida || "";
        if (med && String(med).trim()) {
          parts.push(String(med).trim());
        }
        if (item.gramatura) {
          parts.push(`${item.gramatura}g`);
        }
        if (parts.length > 0) {
          desc += ` (${parts.join(" - ")})`;
        }
        if (item.kcal) {
          desc += ` [${item.kcal} kcal]`;
        }
        return desc;
      }).join("; ");
      return prepPrefix + itemsStr;
    }
    return prepPrefix + (meal.alimentos || "");
  }

  // Adiciona interação droga-nutriente ao prontuário
  addInteracaoDrogaNutriente(prontuario, item = {}) {
    if (!prontuario) return [];
    if (!Array.isArray(prontuario.interacaoDrogaNutriente)) {
      prontuario.interacaoDrogaNutriente = [];
    }
    const med = (item.medicacao || item.medicamento || "").trim();
    const classe = (item.classificacao || item.classe || item.nutrientes || "").trim();
    const inter = (item.interacao || item.conduta || "").trim();

    prontuario.interacaoDrogaNutriente.push({
      medicacao: med,
      classificacao: classe,
      interacao: inter,
      // Compatibilidade com propriedades legadas:
      medicamento: med,
      nutrientes: item.nutrientes || classe,
      conduta: item.conduta || inter
    });
    return prontuario.interacaoDrogaNutriente;
  }

  // Remove interação droga-nutriente do prontuário
  removeInteracaoDrogaNutriente(prontuario, index) {
    if (!prontuario || !Array.isArray(prontuario.interacaoDrogaNutriente)) return [];
    if (index >= 0 && index < prontuario.interacaoDrogaNutriente.length) {
      prontuario.interacaoDrogaNutriente.splice(index, 1);
    }
    return prontuario.interacaoDrogaNutriente;
  }

  // Adiciona exame laboratorial em branco ao prontuário
  addExameBioquimico(prontuario, item = {}) {
    if (!prontuario) return [];
    if (!prontuario.bioquimica) prontuario.bioquimica = {};
    if (!Array.isArray(prontuario.bioquimica.exames)) {
      prontuario.bioquimica.exames = [];
    }
    const exame = (item.exame || "").trim();
    const referencia = (item.referencia || "").trim();
    const valor = (item.valor || "").trim();
    const interpretacao = (item.interpretacao || "").trim();

    prontuario.bioquimica.exames.push({
      exame,
      referencia,
      valor,
      interpretacao
    });
    return prontuario.bioquimica.exames;
  }

  // Remove exame laboratorial do prontuário
  removeExameBioquimico(prontuario, index) {
    if (!prontuario || !prontuario.bioquimica || !Array.isArray(prontuario.bioquimica.exames)) return [];
    if (index >= 0 && index < prontuario.bioquimica.exames.length) {
      prontuario.bioquimica.exames.splice(index, 1);
    }
    return prontuario.bioquimica.exames;
  }

  // Regra 1: Vinculação Dinâmica da NEE (Recordatório 24h <> VET Planejado)
  // Remove qualquer valor fixo (hardcoded 2000 kcal) e reflete dinamicamente o valor numérico digitado pelo aluno em 'VET Planejado'
  resolveDynamicRecordatorioNee(prontuarioOrVet, vetPlanejadoOverride = null) {
    const extractNum = (val) => {
      if (val === null || val === undefined || val === "") return null;
      if (typeof val === "number") return !isNaN(val) && val > 0 ? val : null;
      const match = String(val).trim().match(/[\d.,]+/);
      if (!match) return null;
      const num = parseFloat(match[0].replace(",", "."));
      return !isNaN(num) && num > 0 ? num : null;
    };

    const fromOverride = extractNum(vetPlanejadoOverride);
    if (fromOverride !== null) return fromOverride;

    if (typeof prontuarioOrVet === "number" || typeof prontuarioOrVet === "string") {
      return extractNum(prontuarioOrVet);
    }

    if (prontuarioOrVet && typeof prontuarioOrVet === "object") {
      const candidates = [
        prontuarioOrVet.calculoNecessidades?.vetPlanejadoKcal,
        prontuarioOrVet.prescricaoDietoterapica?.vetKcal,
        prontuarioOrVet.prescricaoVET,
        prontuarioOrVet.vetPlanejado
      ];
      for (const c of candidates) {
        const parsed = extractNum(c);
        if (parsed !== null) return parsed;
      }
    }
    return null;
  }

  // Calcula adequação energética do Recordatório 24h usando dinamicamente o VET Planejado como base (100% NEE)
  calculateDynamicRecordatorioAdequacy(vetRecordatorio, prontuarioOrVetPlanejado, vetPlanejadoOverride = null) {
    const dynamicNee = this.resolveDynamicRecordatorioNee(prontuarioOrVetPlanejado, vetPlanejadoOverride);
    const res = this.calculateVetAdequacy(vetRecordatorio, dynamicNee);
    return {
      ...res,
      neeDinamicaKcal: dynamicNee,
      neeBaseKcal: dynamicNee
    };
  }

  // Regra 2: Trava de Validação Estrita de Exatas 3 Fórmulas no Cálculo de Necessidades
  evaluateThreeFormulasValidation(formulasOrCalcObj) {
    let items = [];

    if (Array.isArray(formulasOrCalcObj)) {
      items = formulasOrCalcObj;
    } else if (formulasOrCalcObj && typeof formulasOrCalcObj === "object") {
      if (Array.isArray(formulasOrCalcObj.formulasCalculadas) && formulasOrCalcObj.formulasCalculadas.length > 0) {
        items = formulasOrCalcObj.formulasCalculadas;
      } else if (Array.isArray(formulasOrCalcObj.formulasSelecionadas)) {
        items = formulasOrCalcObj.formulasSelecionadas.map((key) => {
          const detail = formulasOrCalcObj[key] || {};
          return {
            formulaKey: key,
            resultadoKcal: detail.resultadoKcal || detail.vetKcal || ""
          };
        });
      }
    }

    const validList = items.filter(Boolean).slice(0, 3);
    const totalInserted = validList.length;

    const completeCount = validList.filter((item) => {
      if (typeof item === "string") return item.trim().length > 0;
      const resRaw = item.resultadoKcal !== undefined ? item.resultadoKcal : item.vetKcal;
      const match = String(resRaw || "").trim().match(/[\d.,]+/);
      const num = match ? parseFloat(match[0].replace(",", ".")) : 0;
      return Boolean((item.formulaKey || item.nome || item.id) && !isNaN(num) && num > 0);
    }).length;

    const isAddLocked = totalInserted >= 3;
    const canAdvance = totalInserted === 3 && completeCount === 3;
    const isAdvanceLocked = !canAdvance;

    return {
      totalInserted,
      completeCount,
      maxAllowed: 3,
      isAddLocked,
      isAdvanceLocked,
      canAdvance
    };
  }

  // Adiciona uma fórmula respeitando a trava estrita de no máximo 3 fórmulas
  addFormulaCalculo(formulasList, formulaObj) {
    const current = Array.isArray(formulasList) ? [...formulasList] : [];
    if (current.length >= 3) {
      const validation = this.evaluateThreeFormulasValidation(current);
      const sliced = current.slice(0, 3);
      return {
        list: sliced,
        formulas: sliced,
        added: false,
        reason: "MAX_3_FORMULAS_REACHED",
        validation,
        ...validation
      };
    }
    const newItem = {
      id: formulaObj?.id || `formula-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      formulaKey: formulaObj?.formulaKey || "bolso",
      nome: formulaObj?.nome || formulaObj?.formulaKey || "Fórmula Preditiva",
      equacao: formulaObj?.equacao || "",
      resultadoKcal: String(formulaObj?.resultadoKcal ?? "")
    };
    const nextList = [...current, newItem].slice(0, 3);
    const validation = this.evaluateThreeFormulasValidation(nextList);
    return {
      list: nextList,
      formulas: nextList,
      added: true,
      validation,
      ...validation
    };
  }

  // Remove uma fórmula e destrava imediatamente a inclusão de novas fórmulas
  removeFormulaCalculo(formulasList, idOrKey) {
    const current = Array.isArray(formulasList) ? [...formulasList] : [];
    const nextList = current.filter(
      (item, index) => item?.id !== idOrKey && item?.formulaKey !== idOrKey && index !== idOrKey
    );
    const validation = this.evaluateThreeFormulasValidation(nextList);
    return {
      list: nextList,
      formulas: nextList,
      removed: nextList.length < current.length,
      validation,
      ...validation
    };
  }

  // Novo System Prompt Obrigatório para Correção Automática por IA (Rigor Clínico - Regras 1 a 4)
  getAiEvaluatorSystemPrompt() {
    return "Atue como um preceptor de Nutrição Clínica extremamente rigoroso e crítico. Sua função é avaliar a resolução do caso clínico enviada pelo aluno. Siga estas regras OBRIGATÓRIAS:\nREGRA 1 (Defesa contra vazio): Se o aluno enviar o planejamento, recordatório ou conduta em branco, ou com informações nitidamente insuficientes, a nota DEVE ser 0 (zero). Sem exceções.\nREGRA 2 (Patologia): Avalie criticamente se os alimentos, a via de administração e a conduta estão corretos para a patologia de base do paciente. Penalize erros graves.\nREGRA 3 (Preferências e Aversões): Cruze a dieta planejada com os dados de anamnese. Se o aluno prescreveu algo que o paciente tem aversão, alergia ou intolerância, reduza drasticamente a nota.\nREGRA 4 (Estrutura): Forneça um feedback estruturado contendo: Erros Críticos, Pontos de Melhoria, Acertos e a Nota Sugerida. Atribua a nota de 0.0 a 10.0.";
  }

  // Tag oficial exibida ao aluno enquanto aguarda validação do professor
  getStudentPendingGradeTag() {
    return "Nota Sugerida (Aguardando Confirmação do Professor)";
  }

  // Aviso oficial da seção Avaliação do Preceptor IA no Relatório Final e PDF
  getStudentValidationNotice() {
    return "Nota Sugerida (Sujeita à validação do Professor)";
  }

  // Mensagem de loading enquanto o Preceptor IA avalia o caso antes de liberar o Relatório Final / PDF
  getPreceptorLoadingMessage() {
    return "O Preceptor IA está avaliando o seu caso...";
  }

  // Destinatário Fixo Obrigatório do Professor para o Relatório Final
  getFixedProfessorEmail() {
    return "chagasnutri@gmail.com";
  }

  // Avaliador rigoroso determinístico (aplica Regras 1, 2, 3 e 4 com defesa estrita contra vazio = nota 0)
  evaluateRigorousClinicalRules(prontuario, clinicalCase = {}) {
    const p = (prontuario && typeof prontuario === "object") ? prontuario : {};
    const c = (clinicalCase && typeof clinicalCase === "object") ? clinicalCase : {};
    const norm = (str) => String(str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const studentName = p?.aluno?.nome || p?.studentName || "Estudante de Nutrição";
    const caseTitle = c?.title || p?.caseTitle || p?.caseId || "Caso Clínico Supervisionado";

    // Extrai alimentos do planejamento (qualitativo ou quantitativo)
    const rawPlano = Array.isArray(p?.planejamentoAlimentar)
      ? p.planejamentoAlimentar
      : (Array.isArray(p?.planejamentoQualitativoBlocos)
          ? p.planejamentoQualitativoBlocos
          : (Array.isArray(p?.planejamentoAlimentar?.refeicoes)
              ? p.planejamentoAlimentar.refeicoes
              : (Array.isArray(p?.cardapioItems) ? p.cardapioItems : [])));

    const plannedFoods = [];
    (rawPlano || []).filter(Boolean).forEach((meal) => {
      if (meal?.alimentos) plannedFoods.push(String(meal.alimentos));
      if (meal?.nome && !Array.isArray(meal?.itens)) plannedFoods.push(String(meal.nome));
      if (Array.isArray(meal?.itens)) {
        meal.itens.filter(Boolean).forEach((it) => {
          const foodName = String(it?.alimento || it?.alimentoNome || it?.nome || "").trim();
          if (foodName) plannedFoods.push(foodName);
        });
      }
    });
    if (Array.isArray(p?.cardapioItems)) {
      p.cardapioItems.filter(Boolean).forEach((it) => {
        if (it?.nome) plannedFoods.push(String(it.nome).trim());
      });
    }

    // Extrai alimentos do recordatório 24h
    const rawRec = Array.isArray(p?.consumoAlimentar?.refeicoesRecordatorio)
      ? p.consumoAlimentar.refeicoesRecordatorio
      : (Array.isArray(p?.recordatorioItems) ? p.recordatorioItems : []);

    const recFoods = [];
    (rawRec || []).filter(Boolean).forEach((meal) => {
      if (meal?.alimentos) recFoods.push(String(meal.alimentos));
      if (meal?.nome && !Array.isArray(meal?.itens)) recFoods.push(String(meal.nome));
      if (Array.isArray(meal?.itens)) {
        meal.itens.filter(Boolean).forEach((it) => {
          const foodName = String(it?.alimento || it?.alimentoNome || it?.nome || "").trim();
          if (foodName) recFoods.push(foodName);
        });
      }
    });

    // Conduta / Diagnóstico
    const condutaText = String(
      p?.prescricaoDietoterapica?.justificativaFisiopatologica ||
      p?.condutaPrescricao ||
      p?.diagnosticoPES?.textoCompletoPES ||
      p?.diagnosticoPES?.problema ||
      p?.diagnosticoPESTexto ||
      p?.diagnosticoProblema ||
      p?.orientacoesNutricionais ||
      ""
    ).trim();

    const isPlanejamentoEmpty = plannedFoods.filter(Boolean).length === 0;
    const isRecordatorioEmpty = recFoods.filter(Boolean).length === 0;
    const isCondutaEmpty = condutaText.length < 3;

    const errosCriticos = [];
    const pontosMelhoria = [];
    const acertos = [];

    // REGRA 1 (Defesa contra vazio): Se planejamento, recordatório ou conduta estiverem em branco ou nitidamente insuficientes -> Nota 0 (zero) sem exceções
    if (isPlanejamentoEmpty || isRecordatorioEmpty || isCondutaEmpty) {
      if (isPlanejamentoEmpty) {
        errosCriticos.push("REGRA 1 - Defesa contra vazio: Planejamento alimentar / cardápio enviado em branco ou nitidamente insuficiente.");
      }
      if (isRecordatorioEmpty) {
        errosCriticos.push("REGRA 1 - Defesa contra vazio: Recordatório de 24h enviado em branco ou sem alimentos descritos.");
      }
      if (isCondutaEmpty) {
        errosCriticos.push("REGRA 1 - Defesa contra vazio: Conduta dietoterápica / diagnóstico enviado em branco ou nitidamente insuficiente.");
      }
      pontosMelhoria.push("Preencher obrigatoriamente o Recordatório de 24h, a Conduta Dietoterápica e o Planejamento Alimentar completo antes de finalizar.");
      acertos.push("Nenhum acerto validado devido ao envio em branco ou nitidamente insuficiente (REGRA 1).");

      const feedbackZero = [
        `PARECER DO PRECEPTOR DE NUTRIÇÃO CLÍNICA (AVALIAÇÃO RIGOROSA POR IA)`,
        `Aluno(a): ${studentName} | Caso Clínico: ${caseTitle}`,
        `Status: ${this.getStudentPendingGradeTag()}`,
        ``,
        `1. Erros Críticos:`,
        ...errosCriticos.map((e) => `• ${e}`),
        ``,
        `2. Pontos de Melhoria:`,
        ...pontosMelhoria.map((m) => `• ${m}`),
        ``,
        `3. Acertos:`,
        ...acertos.map((a) => `• ${a}`),
        ``,
        `4. Nota Sugerida:`,
        `Nota Sugerida: 0.0 / 10.0 (0,0) — ${this.getStudentPendingGradeTag()}`
      ].join("\n");

      return {
        notaSugerida: 0,
        notaSugeridaDot: "0.0",
        notaSugeridaComma: "0,0",
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

    const patologiaNorm = norm(
      [
        c?.title,
        c?.description,
        c?.clinicalHistory,
        c?.hipoteseDiagnostica,
        c?.history?.hipoteseDiagnostica,
        p?.anamnese?.hipoteseDiagnostica,
        p?.anamnese?.historiaDoencaAtual,
        p?.anamnese?.historiaClinica
      ].join(" ")
    );
    const viaAdminNorm = norm(p?.prescricaoDietoterapica?.viaAlimentacao || p?.viaAdministracao || "oral");
    const plannedNorm = norm(plannedFoods.join(" | "));
    const condutaNorm = norm(condutaText);

    // REGRA 2 (Patologia)
    if (
      (patologiaNorm.includes("diabetes") || patologiaNorm.includes("dm2") || patologiaNorm.includes("hiperglicemia")) &&
      /\b(refrigerante|acucar refinado|doce de leite|leite condensado|bala|xarope)\b/.test(plannedNorm)
    ) {
      violouRegra2Patologia = true;
      score -= 3.5;
      errosCriticos.push("REGRA 2 (Patologia): Prescrição de açúcares simples ou bebidas açucaradas incompatíveis com o controle glicêmico no Diabetes Mellitus.");
    }

    if (
      (patologiaNorm.includes("hipertensao") || patologiaNorm.includes("has") || patologiaNorm.includes("renal") || patologiaNorm.includes("drc")) &&
      /\b(salsicha|presunto|salame|embutido|macarrao instantaneo|bacon|caldo industrializado)\b/.test(plannedNorm)
    ) {
      violouRegra2Patologia = true;
      score -= 3.0;
      errosCriticos.push("REGRA 2 (Patologia): Prescrição de embutidos/ultraprocessados ricos em sódio e fósforo inorgânico, contraindicados para a patologia de base.");
    }

    if (
      (patologiaNorm.includes("disfagia grave") || patologiaNorm.includes("sonda") || patologiaNorm.includes("enteral exclusiva")) &&
      viaAdminNorm === "oral" &&
      !condutaNorm.includes("enteral") &&
      !condutaNorm.includes("espessante")
    ) {
      violouRegra2Patologia = true;
      score -= 3.0;
      errosCriticos.push("REGRA 2 (Patologia / Via de Administração): Via de administração oral sem adaptação de segurança para o quadro de disfagia/via alternativa.");
    }

    // REGRA 3 (Preferências e Aversões)
    const aversoesText = norm(
      [
        p?.consumoAlimentar?.aguaPreferenciasAversoes,
        p?.consumoAlimentar?.aversoes,
        p?.consumoAlimentar?.aversoesAlimentares,
        p?.consumoAlimentar?.alergiasIntolerancias,
        p?.anamnese?.aversoesIntolerancias,
        p?.anamnese?.alergiasIntolerancias,
        p?.anamnese?.alergias,
        c?.consumoAlimentar?.aversoesIntolerancias,
        c?.dietaryAversions,
        c?.allergies
      ].filter(Boolean).join(" ")
    );

    const commonFoodsCheck = [
      "leite", "lactose", "queijo", "iogurte", "peixe", "camarao", "frutos do mar",
      "ovo", "amendoim", "castanha", "gluten", "trigo", "soja", "coentro", "jilo",
      "figado", "quiabo", "abobora", "chuchu", "mamao", "banana", "aveia"
    ];

    const violatedFoods = [];
    if (aversoesText) {
      commonFoodsCheck.forEach((token) => {
        if (aversoesText.includes(token) && plannedNorm.includes(token)) {
          violatedFoods.push(token);
        }
      });
    }

    if (violatedFoods.length > 0) {
      violouRegra3Aversoes = true;
      score -= 4.0;
      errosCriticos.push(
        `REGRA 3 - Preferências/Aversões/Alergias: Foram prescritos alimentos incompatíveis com as aversões, alergias ou intolerâncias do paciente na anamnese (${Array.from(new Set(violatedFoods)).join(", ")}).`
      );
    }

    if (!violouRegra2Patologia) {
      acertos.push("Coerência clínica entre patologia de base, escolhas alimentares, preparações, via de administração e conduta dietoterápica (REGRA 2).");
    }
    if (!violouRegra3Aversoes) {
      acertos.push("Respeito às preferências, aversões, alergias e intolerâncias alimentares relatadas na anamnese (REGRA 3).");
    }

    pontosMelhoria.push("Manter monitoramento ambulatorial periódico de metas bioquímicas, sinais clínicos e adesão comportamental.");

    if (errosCriticos.length === 0) {
      errosCriticos.push("Nenhum erro crítico identificado na conduta, via de administração ou segurança alimentar.");
    }

    if (score < 0) score = 0;
    if (score > 10) score = 10;

    const notaSugeridaDot = score.toFixed(1);
    const notaSugeridaComma = notaSugeridaDot.replace(".", ",");

    const feedback = [
      `PARECER DO PRECEPTOR DE NUTRIÇÃO CLÍNICA (AVALIAÇÃO RIGOROSA POR IA)`,
      `Aluno(a): ${studentName} | Caso Clínico: ${caseTitle}`,
      `Status: ${this.getStudentPendingGradeTag()}`,
      ``,
      `1. Erros Críticos:`,
      ...errosCriticos.map((e) => `• ${e}`),
      ``,
      `2. Pontos de Melhoria:`,
      ...pontosMelhoria.map((m) => `• ${m}`),
      ``,
      `3. Acertos:`,
      ...acertos.map((a) => `• ${a}`),
      ``,
      `4. Nota Sugerida:`,
      `Nota Sugerida: ${notaSugeridaDot} / 10.0 (${notaSugeridaComma}) — ${this.getStudentPendingGradeTag()}`
    ].join("\n");

    return {
      notaSugerida: Number(notaSugeridaDot),
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

  // Compila todas as respostas do aluno (anamnese, cálculos, conduta qualitativa/quantitativa) para envio à API de IA e E-mail
  // 100% blindado contra valores nulos (null/undefined) com optional chaining (?.) e fallbacks (|| [] e || {})
  compileStudentResolutionForAI(prontuario, clinicalCase = {}) {
    const p = (prontuario && typeof prontuario === "object") ? prontuario : {};
    const safeCase = (clinicalCase && typeof clinicalCase === "object") ? clinicalCase : {};
    const alunoNome = p?.aluno?.nome || p?.studentName || "Estudante de Nutrição";
    const casoNome = safeCase?.title || p?.caseTitle || p?.caseId || "Caso Clínico Supervisionado";
    const isQualitativo = Boolean(
      p?.tipoPlanejamentoCardapio === "qualitativo" ||
      safeCase?.habilitarPlanejamentoQualitativo ||
      p?.habilitarPlanejamentoQualitativo
    );

    const anamnese = (p?.anamnese && typeof p.anamnese === "object") ? p.anamnese : {};
    const antro = (p?.antropometria && typeof p.antropometria === "object") ? p.antropometria : {};
    const pes = (p?.diagnosticoPES && typeof p.diagnosticoPES === "object") ? p.diagnosticoPES : {};
    const calc = (p?.calculoNecessidades && typeof p.calculoNecessidades === "object") ? p.calculoNecessidades : {};
    const presc = (p?.prescricaoDietoterapica && typeof p.prescricaoDietoterapica === "object") ? p.prescricaoDietoterapica : {};
    const ca = (p?.consumoAlimentar && typeof p.consumoAlimentar === "object") ? p.consumoAlimentar : {};
    const refRec = Array.isArray(ca?.refeicoesRecordatorio)
      ? ca.refeicoesRecordatorio.filter(Boolean)
      : (Array.isArray(p?.recordatorioItems) ? p.recordatorioItems.filter(Boolean) : []);
    const rawPlano = Array.isArray(p?.planejamentoAlimentar)
      ? p.planejamentoAlimentar
      : (Array.isArray(p?.planejamentoAlimentar?.refeicoes)
          ? p.planejamentoAlimentar.refeicoes
          : (Array.isArray(p?.cardapioItems) ? p.cardapioItems : []));
    const plano = (rawPlano || []).filter(Boolean);

    const recLines = refRec
      .filter((r) => r && ((r?.preparacao || r?.tipoPreparacao) || (Array.isArray(r?.itens) && r.itens.length > 0) || r?.nome || r?.alimentos))
      .map((r) => {
        const prep = r?.preparacao || r?.tipoPreparacao || p?.recordatorioPreparacao || "Não informada";
        const itensStr = Array.isArray(r?.itens) && r.itens.length > 0
          ? r.itens.filter(Boolean).map((it) => `${it?.alimentoNome || it?.nome || "Alimento"} (${it?.medidaCaseira || it?.medida || "1 porção"} / ${it?.gramatura ?? it?.gramas ?? 0}g)`).join(", ")
          : (r?.alimentos || (r?.nome ? `${r.nome} (${r?.qtd || 1} ${r?.medida || "porção"} / ${r?.gramas || 0}g)` : ""));
        return `  • ${r?.refeicao || r?.nome || "Refeição"} (${r?.horario || "--:--"}) | Preparação: ${prep} | Ingredientes: ${itensStr}`;
      })
      .join("\n") || "  • Nenhuma refeição detalhada.";

    const planoLines = plano
      .filter((r) => r && ((r?.preparacao || r?.tipoPreparacao) || (Array.isArray(r?.itens) && r.itens.length > 0) || r?.alimentos || r?.nome))
      .map((r) => {
        const prep = r?.preparacao || r?.tipoPreparacao || p?.cardapioPreparacao || "Não informada";
        const itensStr = Array.isArray(r?.itens) && r.itens.length > 0
          ? r.itens.filter(Boolean).map((it) => isQualitativo
              ? `${it?.alimento || it?.alimentoNome || it?.nome || "Alimento"} (${it?.medidaCaseira || it?.medida || "1 porção"})`
              : `${it?.alimento || it?.alimentoNome || it?.nome || "Alimento"} (${it?.medidaCaseira || it?.medida || "1 porção"} / ${it?.gramatura ?? it?.gramas ?? 0}g - ${it?.kcal ?? 0} kcal)`
            ).join(", ")
          : (r?.alimentos || (r?.nome ? (isQualitativo ? `${r.nome} (${r?.medida || "1 porção"})` : `${r.nome} (${r?.medida || "1 porção"} / ${r?.gramas || 0}g - ${r?.kcal || 0} kcal)`) : "Não informado"));
        return `  • ${r?.refeicao || r?.nome || "Refeição"} (${r?.horario || "--:--"}) | Preparação: ${prep} | Alimentos: ${itensStr}`;
      })
      .join("\n") || "  • Nenhuma refeição planejada.";

    return [
      `=== RESOLUÇÃO COMPLETA DO CASO CLÍNICO ===`,
      `Nome do Aluno: ${alunoNome}`,
      `Nome do Caso: ${casoNome}`,
      `Modalidade de Planejamento: ${isQualitativo ? "Planejamento Alimentar Qualitativo (Foco Comportamental)" : "Planejamento Quali-Quantitativo Completo"}`,
      ``,
      `1. ANAMNESE E AVALIAÇÃO ANTROPOMÉTRICA:`,
      `- Queixa Principal / HDA: ${anamnese?.queixaPrincipal || "---"} / ${anamnese?.historiaClinica || p?.evolucaoTexto || "---"}`,
      `- Preferências / Aversões / Alergias: ${ca?.aguaPreferenciasAversoes || anamnese?.aversoesIntolerancias || "---"}`,
      `- Peso / Estatura / IMC: ${antro?.pesoAtual || p?.peso || "--"} kg | ${antro?.estatura || p?.estatura || "--"} m | IMC: ${antro?.imc || "--"} kg/m² (${antro?.diagnosticoNutricionalExtenso || "--"})`,
      ``,
      `2. RECORDATÓRIO DE 24H (CONSUMO HABITUAL E PREPARAÇÕES):`,
      recLines,
      ``,
      `3. DIAGNÓSTICO EM NUTRIÇÃO (PES) E OBJETIVOS:`,
      `- Diagnóstico PES: ${pes?.textoCompletoPES || p?.diagnosticoPESTexto || "---"}`,
      `- Objetivos Dietoterápicos: ${pes?.objetivosDietoterapicos || p?.objetivosDietoterapicos || "---"}`,
      ``,
      `4. CÁLCULO DE NECESSIDADES ENERGÉTICAS E PRESCRIÇÃO DIETOTERÁPICA:`,
      `- VET Planejado: ${calc?.vetPlanejadoKcal || presc?.vetKcal || p?.prescricaoVET || "---"} kcal/dia`,
      `- Justificativa do Cálculo: ${calc?.justificativaEscolha || p?.notasCalculo || "---"}`,
      `- Distribuição Prescrita: CHO ${presc?.carboidratosPct || p?.prescricaoCHO || "--"}% | PTN ${presc?.proteinasPct || p?.prescricaoPTN || "--"}% | LIP ${presc?.lipidiosPct || p?.prescricaoLIP || "--"}%`,
      `- Conduta Dietoterápica: ${presc?.justificativaFisiopatologica || p?.condutaPrescricao || "---"}`,
      ``,
      `5. PLANEJAMENTO ALIMENTAR / CARDÁPIO (COM PREPARAÇÕES):`,
      planoLines,
      ``,
      `6. ORIENTAÇÕES NUTRICIONAIS E ALTA:`,
      `${p?.orientacoesNutricionais || "---"}`,
      ...(
        (safeCase?.habilitarCorrecaoAutomaticaIA || p?.habilitarCorrecaoAutomaticaIA || p?.avaliacaoIA || p?.avaliacaoIATexto) &&
        (p?.avaliacaoIA || p?.avaliacaoIATexto || p?.notaIA)
          ? [
              ``,
              `7. Avaliação do Preceptor IA:`,
              `Nota Sugerida (Sujeita à validação do Professor): ${
                (typeof p?.avaliacaoIA === "object" && p?.avaliacaoIA !== null
                  ? (p.avaliacaoIA.notaConfirmadaFormatada || p.avaliacaoIA.notaSugeridaFormatada || (p.avaliacaoIA.notaSugerida !== undefined ? String(p.avaliacaoIA.notaSugerida).replace(".", ",") : ""))
                  : "") ||
                p?.notaFinalConfirmada ||
                p?.notaIA ||
                "0,0"
              } / 10,0`,
              `${
                typeof p?.avaliacaoIA === "object" && p?.avaliacaoIA !== null
                  ? (p.avaliacaoIA.feedback || p?.avaliacaoIATexto || "")
                  : (typeof p?.avaliacaoIA === "string" ? p.avaliacaoIA : (p?.avaliacaoIATexto || ""))
              }`
            ]
          : []
      )
    ].join("\n");
  }

  // Constrói o payload formatado de e-mail para o professor vinculado ao caso (Destinatário Fixo Obrigatório: chagasnutri@gmail.com)
  buildProfessorEvaluationEmailPayload(params = {}) {
    const {
      studentName,
      caseTitle,
      professorEmail,
      dataHora,
      resolutionText,
      relatorioFinalHtml,
      avaliacaoIA,
      notaSugerida,
      notaFinal,
      habilitarCorrecaoAutomaticaIA
    } = params || {};

    const to = this.getFixedProfessorEmail();
    const timestampStr = String(
      dataHora ||
      new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    ).trim();
    const evalText = typeof avaliacaoIA === "object" && avaliacaoIA !== null
      ? (avaliacaoIA.feedback || "")
      : String(avaliacaoIA || "");
    const gradeStr = String(
      notaSugerida ??
      notaFinal ??
      (typeof avaliacaoIA === "object" && avaliacaoIA !== null ? (avaliacaoIA.notaSugeridaFormatada || avaliacaoIA.notaSugerida) : "") ??
      "8,5"
    ).replace(".", ",");

    const hasAi = Boolean(habilitarCorrecaoAutomaticaIA ?? (evalText || notaSugerida !== undefined || notaFinal !== undefined));
    const subject = hasAi
      ? `[DietoCase - Revisão Docente Necessária + Correção IA] ${caseTitle || "Caso Clínico"} - Aluno(a): ${studentName || "Estudante"} (Nota Sugerida: ${gradeStr}/10,0)`
      : `[DietoCase - Relatório Final] ${caseTitle || "Caso Clínico"} - Aluno(a): ${studentName || "Estudante"}`;

    const aiSection = hasAi
      ? [
          `⚠️ ALERTA AO PROFESSOR: Você precisa acessar o painel para confirmar a nota final (ou editá-la) no Painel do Professor do DietoCase!`,
          `Status da Nota: ${this.getStudentPendingGradeTag()} | ${this.getStudentValidationNotice()}`,
          `Nota Sugerida pela IA: ${gradeStr} / 10,0`,
          `====================================================================`,
          ``,
          `--- EM DESTAQUE: AVALIAÇÃO COMPLETA DA IA COM A NOTA SUGERIDA (Avaliação do Preceptor IA) ---`,
          `Título da Seção no Relatório Final: Avaliação do Preceptor IA`,
          `Aviso: ${this.getStudentValidationNotice()}`,
          `Nota Final Gerada: ${gradeStr} / 10,0`,
          evalText
        ].join("\n")
      : `====================================================================`;

    const textBody = [
      `RELATÓRIO FINAL DO CASO CLÍNICO — DIETOCASE`,
      `====================================================================`,
      `Destinatário Fixo: ${to}`,
      `Nome do Aluno: ${studentName || "Estudante de Nutrição"}`,
      `Título do Caso Clínico / Nome do Caso: ${caseTitle || "Caso Clínico Supervisionado"}`,
      `Data/Hora de Finalização: ${timestampStr}`,
      aiSection,
      ``,
      `--- RESPOSTAS COMPLETAS DO ALUNO (RELATÓRIO FINAL GERADO PELO ALUNO) ---`,
      resolutionText || ""
    ].join("\n");

    return {
      to,
      recipientFixed: to,
      professorEmailSecondary: professorEmail || to,
      subject,
      studentName: studentName || "Estudante de Nutrição",
      caseTitle: caseTitle || "Caso Clínico Supervisionado",
      dataHora: timestampStr,
      habilitarCorrecaoAutomaticaIA: hasAi,
      notaSugerida: hasAi ? gradeStr : null,
      notaFinal: hasAi ? gradeStr : null,
      tagStatus: hasAi ? this.getStudentPendingGradeTag() : null,
      avisoValidacao: hasAi ? this.getStudentValidationNotice() : null,
      requiresProfessorConfirmation: hasAi,
      resolutionText: resolutionText || "",
      avaliacaoIA: hasAi ? evalText : null,
      html: relatorioFinalHtml || "",
      text: textBody
    };
  }

  // Disparo Automático e Assíncrono (Não-Bloqueante) de E-mail do Relatório Final para chagasnutri@gmail.com
  dispatchFinalReportEmailAsync(prontuario, clinicalCase = {}, options = {}) {
    const safeProntuario = this.sanitizeProntuarioPayload(prontuario, clinicalCase?.id || prontuario?.caseId);
    const safeCase = (clinicalCase && typeof clinicalCase === "object") ? clinicalCase : {};
    const studentName = String(
      options?.studentName ||
      safeProntuario?.aluno?.nome ||
      safeProntuario?.studentName ||
      "Estudante de Nutrição"
    ).trim();
    const caseTitle = String(
      options?.caseTitle ||
      safeCase?.title ||
      safeProntuario?.caseTitle ||
      safeProntuario?.caseId ||
      "Caso Clínico Supervisionado"
    ).trim();
    const dataHora = String(
      options?.dataHora ||
      new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    ).trim();
    const habilitarCorrecaoAutomaticaIA = Boolean(
      options?.habilitarCorrecaoAutomaticaIA ??
      safeCase?.habilitarCorrecaoAutomaticaIA ??
      safeProntuario?.habilitarCorrecaoAutomaticaIA
    );
    const rawEvalObj = (safeProntuario?.avaliacaoIA && typeof safeProntuario.avaliacaoIA === "object")
      ? safeProntuario.avaliacaoIA
      : null;
    const notaFinal = String(
      options?.notaSugerida ||
      options?.notaFinal ||
      rawEvalObj?.notaSugeridaFormatada ||
      (rawEvalObj?.notaSugerida !== undefined ? String(rawEvalObj.notaSugerida).replace(".", ",") : "") ||
      safeProntuario?.notaIA ||
      ""
    ).trim();
    const avaliacaoIA = String(
      typeof options?.avaliacaoIA === "string"
        ? options.avaliacaoIA
        : (rawEvalObj?.feedback || (typeof safeProntuario?.avaliacaoIA === "string" ? safeProntuario.avaliacaoIA : ""))
    ).trim();

    if (habilitarCorrecaoAutomaticaIA && (avaliacaoIA || notaFinal)) {
      safeProntuario.habilitarCorrecaoAutomaticaIA = true;
      safeProntuario.avaliacaoIATexto = avaliacaoIA;
      safeProntuario.notaIA = notaFinal;
      if (!safeProntuario.avaliacaoIA || typeof safeProntuario.avaliacaoIA !== "object") {
        safeProntuario.avaliacaoIA = {
          notaSugerida: parseFloat(String(notaFinal || "0").replace(",", ".")) || 0,
          notaSugeridaFormatada: notaFinal || "0,0",
          feedback: avaliacaoIA,
          avisoValidacao: this.getStudentValidationNotice(),
          tagStatus: this.getStudentPendingGradeTag()
        };
      }
    }

    const relatorioFinalTexto = String(
      options?.relatorioFinalTexto ||
      this.compileStudentResolutionForAI(safeProntuario, { ...safeCase, habilitarCorrecaoAutomaticaIA })
    ).trim();
    const relatorioFinalHtml = String(
      options?.relatorioFinalHtml ||
      ((typeof DietoterapiaDocxReport !== "undefined" && typeof DietoterapiaDocxReport.buildHtmlReport === "function")
        ? DietoterapiaDocxReport.buildHtmlReport(safeProntuario, { ...safeCase, habilitarCorrecaoAutomaticaIA })
        : "")
    ).trim();

    const emailPayload = this.buildProfessorEvaluationEmailPayload({
      studentName,
      caseTitle,
      professorEmail: this.getFixedProfessorEmail(),
      dataHora,
      resolutionText: relatorioFinalTexto,
      relatorioFinalHtml,
      avaliacaoIA: habilitarCorrecaoAutomaticaIA ? avaliacaoIA : "",
      notaSugerida: habilitarCorrecaoAutomaticaIA ? (notaFinal || "9,0") : "",
      notaFinal: habilitarCorrecaoAutomaticaIA ? (notaFinal || "9,0") : "",
      habilitarCorrecaoAutomaticaIA
    });

    // Processo assíncrono em background para não travar a tela de carregamento do usuário final
    const backgroundPromise = (async () => {
      let apiDispatched = false;
      try {
        if (typeof fetch === "function") {
          const resp = await fetch("/api/enviar-relatorio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: this.getFixedProfessorEmail(),
              studentName,
              caseTitle,
              dataHora,
              habilitarCorrecaoAutomaticaIA,
              notaSugerida: habilitarCorrecaoAutomaticaIA ? (notaFinal || "9,0") : null,
              notaFinal: habilitarCorrecaoAutomaticaIA ? (notaFinal || "9,0") : null,
              avaliacaoIA: habilitarCorrecaoAutomaticaIA ? avaliacaoIA : null,
              relatorioFinalTexto,
              relatorioFinalHtml,
              resolutionData: safeProntuario
            })
          });
          if (resp && resp.ok) {
            apiDispatched = true;
          }
        }
      } catch (e) {
        console.warn("⚠️ Aviso no disparo assíncrono via /api/enviar-relatorio:", e);
      }

      if (typeof firebaseSyncService !== "undefined" && firebaseSyncService && typeof firebaseSyncService.saveMailTrigger === "function") {
        try {
          await firebaseSyncService.saveMailTrigger(emailPayload);
        } catch (fbErr) {
          console.warn("⚠️ Aviso ao salvar trigger de e-mail no Firestore:", fbErr);
        }
      }

      return {
        success: true,
        to: this.getFixedProfessorEmail(),
        recipient: this.getFixedProfessorEmail(),
        studentName,
        caseTitle,
        dataHora,
        habilitarCorrecaoAutomaticaIA,
        notaSugerida: habilitarCorrecaoAutomaticaIA ? (notaFinal || "9,0") : null,
        notaFinal: habilitarCorrecaoAutomaticaIA ? (notaFinal || "9,0") : null,
        avaliacaoIA: habilitarCorrecaoAutomaticaIA ? avaliacaoIA : null,
        apiDispatched,
        emailPayload
      };
    })();

    return backgroundPromise;
  }

  // Confirma ou edita a nota sugerida pela IA no Painel do Professor, tornando a nota oficial/final
  confirmProfessorGrade(prontuarioOrSubmission, notaConfirmadaInput, professorComentario = "") {
    const p = (prontuarioOrSubmission && typeof prontuarioOrSubmission === "object")
      ? prontuarioOrSubmission
      : {};
    const parsedNum = Math.min(10, Math.max(0, parseFloat(String(notaConfirmadaInput ?? "0").replace(",", ".")) || 0));
    const formattedDot = parsedNum.toFixed(1);
    const formattedComma = formattedDot.replace(".", ",");

    const prevEval = (p.avaliacaoIA && typeof p.avaliacaoIA === "object")
      ? p.avaliacaoIA
      : {
          notaSugerida: p.notaIA ? parseFloat(String(p.notaIA).replace(",", ".")) : parsedNum,
          notaSugeridaFormatada: p.notaIA || formattedComma,
          feedback: typeof p.avaliacaoIA === "string" ? p.avaliacaoIA : ""
        };

    const confirmedAt = new Date().toISOString();
    const updatedAvaliacaoIA = {
      ...prevEval,
      notaSugerida: prevEval.notaSugerida ?? parsedNum,
      notaSugeridaFormatada: prevEval.notaSugeridaFormatada || formattedComma,
      feedback: prevEval.feedback || "",
      notaConfirmada: parsedNum,
      notaConfirmadaFormatada: formattedComma,
      notaFinal: parsedNum,
      notaFinalFormatada: formattedComma,
      status: "confirmada_pelo_professor",
      tagStatus: "Nota Final Confirmada pelo Professor",
      confirmadaPeloProfessor: true,
      comentarioProfessor: String(professorComentario || "").trim(),
      confirmadoEm: confirmedAt
    };

    p.avaliacaoIA = updatedAvaliacaoIA;
    p.avaliacaoIATexto = updatedAvaliacaoIA.feedback;
    p.notaIA = formattedComma;
    p.notaConfirmada = parsedNum;
    p.notaConfirmadaFormatada = formattedComma;
    p.notaFinal = parsedNum;
    p.notaFinalFormatada = formattedComma;
    p.notaFinalConfirmada = formattedComma;
    p.notaConfirmadaPeloProfessor = true;
    p.confirmadaPeloProfessor = true;
    p.status = "confirmada_pelo_professor";
    p.tagStatus = "Nota Final Confirmada pelo Professor";

    // Salva no localStorage de submissões para revisão do professor e sincroniza com Firestore em background
    this.saveSubmissionForProfessorReview(p);
    if (typeof firebaseSyncService !== "undefined" && firebaseSyncService && typeof firebaseSyncService.saveProntuario === "function") {
      try {
        Promise.resolve(firebaseSyncService.saveProntuario(p.caseId || "caso-clinico", p)).catch((e) => {
          console.warn("⚠️ Aviso ao confirmar nota no Firestore:", e);
        });
      } catch (e) {
        console.warn("⚠️ Aviso ao confirmar nota no Firestore:", e);
      }
    }

    return p;
  }

  // Persiste a submissão do aluno para listagem imediata na Área de Revisão do Painel do Professor
  saveSubmissionForProfessorReview(prontuarioData, clinicalCase = {}) {
    if (!prontuarioData || typeof prontuarioData !== "object") return null;
    const storageKey = "dietocase_submissoes_avaliacao_ia_v1";
    const caseId = prontuarioData.caseId || clinicalCase?.id || "caso-clinico";
    const uid = prontuarioData.userId || prontuarioData?.aluno?.id || prontuarioData?.studentId || "aluno-1";
    const subId = prontuarioData.submissionId || `${caseId}_${uid}`;

    const evalObj = (prontuarioData.avaliacaoIA && typeof prontuarioData.avaliacaoIA === "object")
      ? prontuarioData.avaliacaoIA
      : {
          notaSugerida: parseFloat(String(prontuarioData.notaIA || "0").replace(",", ".")) || 0,
          notaSugeridaFormatada: String(prontuarioData.notaIA || "0,0"),
          feedback: typeof prontuarioData.avaliacaoIA === "string" ? prontuarioData.avaliacaoIA : (prontuarioData.avaliacaoIATexto || ""),
          status: prontuarioData.notaConfirmadaPeloProfessor ? "confirmada_pelo_professor" : "aguardando_confirmacao_professor",
          tagStatus: prontuarioData.notaConfirmadaPeloProfessor ? "Nota Final Confirmada pelo Professor" : this.getStudentPendingGradeTag(),
          confirmadaPeloProfessor: Boolean(prontuarioData.notaConfirmadaPeloProfessor),
          notaConfirmada: prontuarioData.notaConfirmadaPeloProfessor ? (parseFloat(String(prontuarioData.notaFinalConfirmada || prontuarioData.notaIA || "0").replace(",", ".")) || 0) : null,
          notaFinalFormatada: prontuarioData.notaFinalConfirmada || null
        };

    const record = {
      ...prontuarioData,
      submissionId: subId,
      caseId,
      caseTitle: clinicalCase?.title || prontuarioData.caseTitle || caseId,
      studentName: prontuarioData?.aluno?.nome || prontuarioData.studentName || "Estudante de Nutrição",
      avaliacaoIA: evalObj,
      avaliacaoIATexto: evalObj.feedback,
      notaSugerida: evalObj.notaSugerida,
      notaSugeridaFormatada: evalObj.notaSugeridaFormatada,
      resolutionText: prontuarioData.resolutionText || this.compileStudentResolutionForAI(prontuarioData, clinicalCase),
      updatedAt: new Date().toISOString()
    };

    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(storageKey);
        const list = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex((item) => item.submissionId === subId);
        if (idx >= 0) {
          list[idx] = record;
        } else {
          list.unshift(record);
        }
        localStorage.setItem(storageKey, JSON.stringify(list));
      }
    } catch (e) {}

    return record;
  }

  getSubmissionsForProfessorReview() {
    const storageKey = "dietocase_submissoes_avaliacao_ia_v1";
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {}
    return [];
  }

  // Executa a avaliação automática por IA (com Regras 1 a 4 rigorosas), salva avaliacaoIA.{notaSugerida, feedback} e dispara o e-mail imediato para chagasnutri@gmail.com
  async evaluateCaseWithAI(prontuario, clinicalCase = {}) {
    const safeProntuario = this.sanitizeProntuarioPayload(prontuario, clinicalCase?.id || prontuario?.caseId);
    // Preserva os itens originais para verificação rigorosa de vazio (REGRA 1) caso o aluno tenha enviado arrays vazios
    const rawProntuarioForValidation = (prontuario && typeof prontuario === "object") ? prontuario : {};
    const systemPrompt = this.getAiEvaluatorSystemPrompt();
    const studentName = safeProntuario?.aluno?.nome || safeProntuario?.studentName || "Estudante de Nutrição";
    const caseTitle = clinicalCase?.title || safeProntuario?.caseTitle || safeProntuario?.caseId || "Caso Clínico Supervisionado";
    const professorEmail = this.getFixedProfessorEmail();
    const dataHora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const resolutionText = this.compileStudentResolutionForAI(safeProntuario, clinicalCase);

    // Avalia deterministicamente as Regras 1 a 4
    const rigorousCheck = this.evaluateRigorousClinicalRules(rawProntuarioForValidation, clinicalCase);

    let feedbackText = rigorousCheck.feedback;
    let notaSugeridaNum = rigorousCheck.notaSugerida;
    let notaSugeridaComma = rigorousCheck.notaSugeridaComma;
    let apiEmailPayload = null;

    // Se NÃO violou a REGRA 1 (vazio), consulta a API /api/correcao-ia se disponível
    if (!rigorousCheck.violouRegra1Vazio) {
      try {
        if (typeof fetch === "function") {
          const resp = await fetch("/api/correcao-ia", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: safeProntuario?.aluno?.id || safeProntuario?.studentId || "aluno-demo",
              studentName,
              caseId: clinicalCase?.id || safeProntuario?.caseId || "caso-clinico",
              caseTitle,
              professorEmail,
              dataHora,
              systemPrompt,
              studentResolution: rawProntuarioForValidation,
              resolutionData: rawProntuarioForValidation,
              clinicalCase
            })
          });
          if (resp && resp.ok) {
            const json = await resp.json();
            if (json && json.avaliacaoIA) {
              feedbackText = typeof json.avaliacaoIA === "string" ? json.avaliacaoIA : (json.avaliacaoIA.feedback || feedbackText);
              notaSugeridaComma = String(json.notaSugerida || json.notaFinal || notaSugeridaComma).replace(".", ",");
              notaSugeridaNum = parseFloat(notaSugeridaComma.replace(",", ".")) || 0;
              apiEmailPayload = json.emailPayload || null;
            }
          }
        }
      } catch (e) {
        // Continua com o avaliador rigoroso determinístico
      }
    }

    const avaliacaoIAData = {
      notaSugerida: notaSugeridaNum,
      notaSugeridaFormatada: notaSugeridaComma,
      feedback: feedbackText,
      status: "aguardando_confirmacao_professor",
      tagStatus: this.getStudentPendingGradeTag(),
      avisoValidacao: this.getStudentValidationNotice(),
      confirmadaPeloProfessor: false,
      notaConfirmada: null,
      notaFinalFormatada: null,
      avaliadoEm: new Date().toISOString()
    };

    safeProntuario.habilitarCorrecaoAutomaticaIA = true;
    safeProntuario.avaliacaoIA = avaliacaoIAData;
    safeProntuario.avaliacaoIATexto = feedbackText;
    safeProntuario.notaIA = notaSugeridaComma;
    safeProntuario.tagNotaIA = this.getStudentPendingGradeTag();
    safeProntuario.avisoValidacaoIA = this.getStudentValidationNotice();

    // Atualiza o prontuário com o formato estruturado para o Firestore: avaliacaoIA.notaSugerida e avaliacaoIA.feedback
    if (prontuario && typeof prontuario === "object") {
      prontuario.habilitarCorrecaoAutomaticaIA = true;
      prontuario.avaliacaoIA = avaliacaoIAData;
      prontuario.avaliacaoIATexto = feedbackText;
      prontuario.notaIA = notaSugeridaComma;
      prontuario.tagNotaIA = this.getStudentPendingGradeTag();
      prontuario.avisoValidacaoIA = this.getStudentValidationNotice();
      this.saveSubmissionForProfessorReview(prontuario, clinicalCase);
    }

    const consolidatedResolutionText = this.compileStudentResolutionForAI(safeProntuario, {
      ...clinicalCase,
      habilitarCorrecaoAutomaticaIA: true
    });
    const consolidatedReportHtml = (typeof DietoterapiaDocxReport !== "undefined" && typeof DietoterapiaDocxReport.buildHtmlReport === "function")
      ? DietoterapiaDocxReport.buildHtmlReport(safeProntuario, { ...clinicalCase, habilitarCorrecaoAutomaticaIA: true })
      : "";

    const emailPayload = apiEmailPayload || this.buildProfessorEvaluationEmailPayload({
      studentName,
      caseTitle,
      professorEmail,
      dataHora,
      resolutionText: consolidatedResolutionText,
      relatorioFinalHtml: consolidatedReportHtml,
      avaliacaoIA: feedbackText,
      notaSugerida: notaSugeridaComma,
      notaFinal: notaSugeridaComma,
      habilitarCorrecaoAutomaticaIA: true
    });

    // Se o Firebase estiver configurado, registra também na coleção 'mail' e salva no Firestore em 'prontuarios'
    if (typeof firebaseSyncService !== "undefined" && firebaseSyncService) {
      if (typeof firebaseSyncService.saveMailTrigger === "function") {
        try {
          await firebaseSyncService.saveMailTrigger(emailPayload);
        } catch (err) {
          console.warn("⚠️ Aviso ao disparar Firebase Email Trigger:", err);
        }
      }
      if (typeof firebaseSyncService.saveProntuario === "function" && prontuario && typeof prontuario === "object") {
        try {
          await firebaseSyncService.saveProntuario(clinicalCase?.id || prontuario?.caseId || "caso-clinico", prontuario);
        } catch (err) {
          console.warn("⚠️ Aviso ao salvar avaliacaoIA no Firestore:", err);
        }
      }
    }

    return {
      success: true,
      systemPromptUsed: systemPrompt,
      studentName,
      caseTitle,
      professorEmail,
      dataHora,
      notaSugerida: notaSugeridaNum,
      notaSugeridaFormatada: notaSugeridaComma,
      notaFinal: notaSugeridaComma,
      tagNotaAluno: this.getStudentPendingGradeTag(),
      avisoValidacao: this.getStudentValidationNotice(),
      avaliacaoIA: feedbackText,
      avaliacaoIAData,
      avaliacaoIAObjeto: avaliacaoIAData,
      resolutionText: consolidatedResolutionText,
      relatorioFinalHtml: consolidatedReportHtml,
      emailPayload,
      emailDispatched: true
    };
  }
}

// Avaliador Clínico Propedêutico de Exames Bioquímicos
// Compara o resultado com a faixa de referência e categoriza em Adequado (verde), Alto (vermelho ↑) ou Baixo (laranja/vermelho ↓)
function evaluateBiochemicalExam(valorStr, refStr) {
  if (!valorStr || typeof valorStr !== "string") {
    return { status: "indeterminado", badgeClass: "bg-slate-100 text-slate-700 border-slate-200", label: "Indeterminado", seta: "", textClass: "text-slate-700" };
  }

  // 1. Extrai número do valor achado
  const valClean = valorStr.replace(",", ".").trim();
  const valMatch = valClean.match(/[-+]?[0-9]*\.?[0-9]+/);
  if (!valMatch) {
    return { status: "indeterminado", badgeClass: "bg-slate-100 text-slate-700 border-slate-200", label: "Indeterminado", seta: "", textClass: "text-slate-700" };
  }
  const valNum = parseFloat(valMatch[0]);

  if (!refStr || typeof refStr !== "string") {
    return { status: "indeterminado", badgeClass: "bg-slate-100 text-slate-700 border-slate-200", label: "Sem Ref.", seta: "", textClass: "text-slate-700" };
  }

  // Remove notas em parênteses para focar na faixa principal, ex: "< 5.7 % (meta < 7.0%)" -> "< 5.7 %"
  const refClean = refStr.replace(/\(.*?\)/g, "").replace(",", ".").trim();

  // Caso 1: Intervalo com hífen ou ' a ' (ex: "70 - 99 mg/dL", "0.7 - 1.2", "135 - 145", "3.5 a 5.0")
  if (refClean.includes("-") || refClean.includes("–") || refClean.includes("—") || /\s+a\s+/i.test(refClean)) {
    const rangeParts = refClean.split(/[-–—]|\s+a\s+/i);
    if (rangeParts.length >= 2) {
      const minMatch = rangeParts[0].match(/[-+]?[0-9]*\.?[0-9]+/);
      const maxMatch = rangeParts[1].match(/[-+]?[0-9]*\.?[0-9]+/);
      if (minMatch && maxMatch) {
        const minVal = parseFloat(minMatch[0]);
        const maxVal = parseFloat(maxMatch[0]);
        if (valNum < minVal) {
          return {
            status: "baixo",
            badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
            label: "Baixo",
            seta: "↓",
            textClass: "text-amber-700"
          };
        } else if (valNum > maxVal) {
          return {
            status: "alto",
            badgeClass: "bg-rose-50 text-rose-700 border-rose-300",
            label: "Alto",
            seta: "↑",
            textClass: "text-rose-700"
          };
        } else {
          return {
            status: "adequado",
            badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300",
            label: "Adequado",
            seta: "",
            textClass: "text-emerald-700"
          };
        }
      }
    }
  }

  // Caso 2: Operador '<' ou '<=' ou 'inferior a'
  if (refClean.includes("<") || /inferior|menor/i.test(refClean)) {
    const maxMatch = refClean.match(/[-+]?[0-9]*\.?[0-9]+/);
    if (maxMatch) {
      const maxVal = parseFloat(maxMatch[0]);
      if (valNum > maxVal) {
        return {
          status: "alto",
          badgeClass: "bg-rose-50 text-rose-700 border-rose-300",
          label: "Alto",
          seta: "↑",
          textClass: "text-rose-700"
        };
      } else {
        return {
          status: "adequado",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300",
          label: "Adequado",
          seta: "",
          textClass: "text-emerald-700"
        };
      }
    }
  }

  // Caso 3: Operador '>' ou '>=' ou 'superior a'
  if (refClean.includes(">") || /superior|maior/i.test(refClean)) {
    const minMatch = refClean.match(/[-+]?[0-9]*\.?[0-9]+/);
    if (minMatch) {
      const minVal = parseFloat(minMatch[0]);
      if (valNum < minVal) {
        return {
          status: "baixo",
          badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
          label: "Baixo",
          seta: "↓",
          textClass: "text-amber-700"
        };
      } else {
        return {
          status: "adequado",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300",
          label: "Adequado",
          seta: "",
          textClass: "text-emerald-700"
        };
      }
    }
  }

  return {
    status: "adequado",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300",
    label: "Adequado",
    seta: "",
    textClass: "text-emerald-700"
  };
}

// Renderiza a célula de 'Valor Achado' com sinalização visual por cores e ícones de setas
function renderBiochemicalValueCell(valorStr, refStr) {
  const evalRes = evaluateBiochemicalExam(valorStr, refStr);
  const valEscaped = (typeof escapeHtml === "function") ? escapeHtml(valorStr || "") : (valorStr || "");

  if (evalRes.status === "alto") {
    return `
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
        <span class="font-extrabold text-slate-800">${valEscaped}</span>
        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 tracking-wider">
          Alto <span class="text-xs font-black ml-0.5 leading-none">↑</span>
        </span>
      </div>
    `;
  } else if (evalRes.status === "baixo") {
    return `
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
        <span class="font-extrabold text-slate-800">${valEscaped}</span>
        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 tracking-wider">
          Baixo <span class="text-xs font-black ml-0.5 leading-none">↓</span>
        </span>
      </div>
    `;
  } else if (evalRes.status === "adequado") {
    return `
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
        <span class="font-extrabold text-slate-800">${valEscaped}</span>
        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 tracking-wider">
          Adequado
        </span>
      </div>
    `;
  } else {
    return `
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-xs bg-slate-50 text-slate-700 border border-slate-200">
        <span>${valEscaped}</span>
      </div>
    `;
  }
}

if (typeof window !== "undefined") {
  window.evaluateBiochemicalExam = evaluateBiochemicalExam;
  window.renderBiochemicalValueCell = renderBiochemicalValueCell;
}
