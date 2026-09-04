// Gerenciador do Prontuário Eletrônico de Dietoterapia e Sessão do Estudante
// Gerencia preenchimento dos dados clínicos, cálculos automáticos (IMC, % perda, VET) e envio sem feedback de certo/errado.

class StudentProntuarioManager {
  constructor() {
    this.currentCaseId = null;
    this.draftKeyPrefix = "dietoterapia_prontuario_draft_";
  }

  // Gera chave de rascunho baseada no ID do caso
  getStorageKey(caseId) {
    return `${this.draftKeyPrefix}${caseId}`;
  }

  // Carrega rascunho salvo para o caso atual
  loadDraft(caseId) {
    this.currentCaseId = caseId;
    const raw = localStorage.getItem(this.getStorageKey(caseId));
    if (!raw) {
      return this.getEmptyProntuario(caseId);
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("Erro ao carregar rascunho do prontuário:", e);
      return this.getEmptyProntuario(caseId);
    }
  }

  // Salva rascunho no localStorage
  saveDraft(caseId, data) {
    this.currentCaseId = caseId;
    localStorage.setItem(this.getStorageKey(caseId), JSON.stringify(data));
  }

  // Limpa rascunho
  clearDraft(caseId) {
    localStorage.removeItem(this.getStorageKey(caseId));
  }

  // Modelo de prontuário em branco
  getEmptyProntuario(caseId) {
    return {
      caseId: caseId,
      aluno: {
        nome: "",
        matriculaTurma: "",
        data: new Date().toISOString().split("T")[0]
      },
      anamnese: {
        queixaPrincipal: "",
        historiaClinica: "",
        antecedentesMedicamentos: "",
        habitosEstiloVida: ""
      },
      antropometria: {
        pesoAtual: "",
        pesoHabitual: "",
        estatura: "",
        alturaJoelho: "",
        imc: "",
        classificacaoImc: "",
        percentualPerda: "",
        circunferenciasDobras: "",
        circCintura: "",
        circQuadril: "",
        circBraco: "",
        circPanturrilha: "",
        dobraTricipital: "",
        dobraSubescapular: "",
        dobraSuprailiaca: "",
        dobraAbdominal: "",
        demaisAvaliacoes: ""
      },
      bioquimica: {
        examesRelevantes: "",
        interpretacaoNutricional: ""
      },
      exameFisico: {
        sinaisClinicos: "",
        massaMuscularAdiposa: "",
        condicoesTGIeEdemas: ""
      },
      consumoAlimentar: {
        inqueritoResumo: "",
        aguaPreferenciasAversoes: ""
      },
      diagnosticoPES: {
        problema: "",
        etiologia: "",
        sinaisSintomas: "",
        textoCompletoPES: ""
      },
      prescricaoDietoterapica: {
        vetKcal: "",
        regraBolsoKcalKg: "",
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
      planejamentoAlimentar: [
        { refeicao: "Desjejum / Café da Manhã", horario: "07:00", alimentos: "", substituicoes: "" },
        { refeicao: "Colação / Lanche da Manhã", horario: "09:30", alimentos: "", substituicoes: "" },
        { refeicao: "Almoço", horario: "12:30", alimentos: "", substituicoes: "" },
        { refeicao: "Lanche da Tarde", horario: "16:00", alimentos: "", substituicoes: "" },
        { refeicao: "Jantar", horario: "19:30", alimentos: "", substituicoes: "" },
        { refeicao: "Ceia", horario: "22:00", alimentos: "", substituicoes: "" }
      ],
      orientacoesNutricionais: "",
      respostasQuestoes: {} // id da questão -> resposta do aluno
    };
  }

  // Cálculo de IMC e Classificação automática (OMS para Adultos ou Lipschitz para Idosos)
  calculateIMC(peso, altura, idade = 40) {
    let p = typeof peso === "string" ? parseFloat(peso.replace(",", ".")) : parseFloat(peso);
    let h = typeof altura === "string" ? parseFloat(altura.replace(",", ".")) : parseFloat(altura);
    if (!p || !h || h <= 0) {
      return { imc: "", classificacao: "" };
    }
    // Converte cm para metros se digitado como 170 em vez de 1.70
    if (h > 100) {
      h = h / 100;
    }

    const imc = p / (h * h);
    const imcFormatted = imc.toFixed(2);
    let classificacao = "";

    const isIdoso = idade >= 60;

    if (isIdoso) {
      // Critério de Lipschitz (1994) para Idosos
      if (imc < 22.0) {
        classificacao = "Baixo Peso / Desnutrição (Lipschitz)";
      } else if (imc <= 27.0) {
        classificacao = "Eutrofia (Lipschitz)";
      } else {
        classificacao = "Sobrepeso / Obesidade (Lipschitz)";
      }
    } else {
      // Critério da OMS para Adultos
      if (imc < 18.5) {
        classificacao = "Baixo Peso (OMS)";
      } else if (imc < 25.0) {
        classificacao = "Eutrofia (OMS)";
      } else if (imc < 30.0) {
        classificacao = "Sobrepeso / Pré-obesidade (OMS)";
      } else if (imc < 35.0) {
        classificacao = "Obesidade Grau I (OMS)";
      } else if (imc < 40.0) {
        classificacao = "Obesidade Grau II (OMS)";
      } else {
        classificacao = "Obesidade Grau III / Grave (OMS)";
      }
    }

    return { imc: imcFormatted, classificacao };
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
}
