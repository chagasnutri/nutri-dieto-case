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
        pesoEstimadoChumlea: "",
        estaturaEstimadaChumlea: "",
        pesoEfetivo: "",
        estaturaEfetiva: "",
        origemDadosAntro: "",
        imc: "",
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
        interpretacaoNutricional: ""
      },
      exameFisico: {
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
        { id: "ref-1", refeicao: "Desjejum / Café da Manhã", horario: "07:00", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0 } },
        { id: "ref-2", refeicao: "Colação / Lanche da Manhã", horario: "09:30", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0 } },
        { id: "ref-3", refeicao: "Almoço", horario: "12:30", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0 } },
        { id: "ref-4", refeicao: "Lanche da Tarde", horario: "16:00", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0 } },
        { id: "ref-5", refeicao: "Jantar", horario: "19:30", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0 } },
        { id: "ref-6", refeicao: "Ceia", horario: "22:00", itens: [], alimentos: "", substituicoes: "", subtotal: { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0 } }
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
        fibrasG: 0,
        adequacaoVetPct: 0
      },
      orientacoesNutricionais: "",
      respostasQuestoes: {} // id da questão -> resposta do aluno
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

  // Regra de três das Gramaturas: calcula nutrientes proporcionais a partir da base de 100g da TACO
  calculateItemNutrition(foodTaco, gramatura) {
    if (!foodTaco) {
      return { gramatura: 0, kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0 };
    }
    const g = typeof gramatura === "string" ? parseFloat(gramatura.replace(",", ".")) : parseFloat(gramatura);
    if (isNaN(g) || g <= 0) {
      return { gramatura: 0, kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0 };
    }

    const base = foodTaco.baseGramas || 100; // sempre 100g na TACO
    const factor = g / base;

    const round1 = (val) => Math.round((Number(val || 0) * factor) * 10) / 10;

    return {
      gramatura: g,
      kcal: round1(foodTaco.kcal),
      cho: round1(foodTaco.cho),
      ptn: round1(foodTaco.ptn),
      lip: round1(foodTaco.lip),
      fibra: round1(foodTaco.fibra)
    };
  }

  // Calcula subtotal nutricional de uma refeição somando todos os seus itens
  calculateMealSubtotal(meal) {
    const sub = { kcal: 0, cho: 0, ptn: 0, lip: 0, fibra: 0 };
    if (!meal || !Array.isArray(meal.itens)) return sub;

    meal.itens.forEach(item => {
      sub.kcal += Number(item.kcal || 0);
      sub.cho += Number(item.cho || 0);
      sub.ptn += Number(item.ptn || 0);
      sub.lip += Number(item.lip || 0);
      sub.fibra += Number(item.fibra || 0);
    });

    const round1 = (val) => Math.round(val * 10) / 10;
    return {
      kcal: round1(sub.kcal),
      cho: round1(sub.cho),
      ptn: round1(sub.ptn),
      lip: round1(sub.lip),
      fibra: round1(sub.fibra)
    };
  }

  // Calcula os totais consolidados do Cardápio diário completo e compara com a prescrição
  calculateCardapioTotals(planejamentoAlimentar, pesoPaciente = null, vetPrescrito = null) {
    const totals = {
      vetTotalKcal: 0,
      carboidratosG: 0,
      carboidratosPct: 0,
      proteinasG: 0,
      proteinasGKg: 0,
      proteinasPct: 0,
      lipidiosG: 0,
      lipidiosPct: 0,
      fibrasG: 0,
      adequacaoVetPct: 0,
      classificacaoAdequacao: ""
    };

    if (!Array.isArray(planejamentoAlimentar)) return totals;

    planejamentoAlimentar.forEach(meal => {
      const sub = this.calculateMealSubtotal(meal);
      totals.vetTotalKcal += sub.kcal;
      totals.carboidratosG += sub.cho;
      totals.proteinasG += sub.ptn;
      totals.lipidiosG += sub.lip;
      totals.fibrasG += sub.fibra;
    });

    const round1 = (val) => Math.round(val * 10) / 10;
    totals.vetTotalKcal = round1(totals.vetTotalKcal);
    totals.carboidratosG = round1(totals.carboidratosG);
    totals.proteinasG = round1(totals.proteinasG);
    totals.lipidiosG = round1(totals.lipidiosG);
    totals.fibrasG = round1(totals.fibrasG);

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

    // % de adequação do Cardápio em relação ao VET planejado/prescrito
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

    return totals;
  }

  // Gera síntese textual da refeição unindo alimento, medida caseira livre e gramatura
  formatMealFoodsSummary(meal) {
    if (!meal) return "";
    if (Array.isArray(meal.itens) && meal.itens.length > 0) {
      return meal.itens.map(item => {
        let desc = item.alimentoNome || "Alimento";
        const parts = [];
        if (item.medidaCaseira && String(item.medidaCaseira).trim()) {
          parts.push(String(item.medidaCaseira).trim());
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
    }
    return meal.alimentos || "";
  }
}
