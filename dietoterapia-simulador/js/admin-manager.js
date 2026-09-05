// Gerenciador do Painel do Professor / Administrador
// Responsável pela criação, edição em abas, duplicação, exclusão e importação/exportação de casos clínicos.

class AdminManager {
  constructor() {
    this.cases = getCases();
    this.disciplinas = (typeof getDisciplinas === "function") ? getDisciplinas() : [];
    this.activeDisciplinaId = this.disciplinas[0]?.id || "dietoterapia";
    this.editingCaseId = null;
  }

  refreshCases() {
    this.cases = getCases();
  }

  refreshDisciplinas() {
    if (typeof getDisciplinas === "function") {
      this.disciplinas = getDisciplinas();
    }
    if (!this.disciplinas.some(d => d.id === this.activeDisciplinaId)) {
      this.activeDisciplinaId = this.disciplinas[0]?.id || "dietoterapia";
    }
    return this.disciplinas;
  }

  getDisciplinaById(id) {
    this.refreshDisciplinas();
    return this.disciplinas.find(d => d.id === id);
  }

  createDisciplina(data) {
    this.refreshDisciplinas();
    const slug = (data.nome || "disciplina")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const baseId = slug || ("disc-" + Date.now());
    const finalId = this.disciplinas.some(d => d.id === baseId) ? `${baseId}-${Date.now()}` : baseId;

    const nova = {
      id: finalId,
      nome: (data.nome || "Nova Disciplina").trim(),
      codigo: (data.codigo || "").trim().toUpperCase(),
      icone: data.icone || "📚",
      descricao: (data.descricao || "").trim()
    };

    this.disciplinas.push(nova);
    if (typeof saveDisciplinas === "function") {
      saveDisciplinas(this.disciplinas);
    }
    this.activeDisciplinaId = finalId;
    if (typeof firebaseSyncService !== "undefined" && firebaseSyncService.isConfigured()) {
      firebaseSyncService.saveDisciplina(nova);
    }
    this.triggerServerSync();
    return nova;
  }

  updateDisciplina(id, data) {
    this.refreshDisciplinas();
    const idx = this.disciplinas.findIndex(d => d.id === id);
    if (idx >= 0) {
      this.disciplinas[idx] = {
        ...this.disciplinas[idx],
        nome: data.nome !== undefined ? data.nome.trim() : this.disciplinas[idx].nome,
        codigo: data.codigo !== undefined ? data.codigo.trim().toUpperCase() : this.disciplinas[idx].codigo,
        icone: data.icone || this.disciplinas[idx].icone,
        descricao: data.descricao !== undefined ? data.descricao.trim() : this.disciplinas[idx].descricao
      };
      if (typeof saveDisciplinas === "function") {
        saveDisciplinas(this.disciplinas);
      }
      if (typeof firebaseSyncService !== "undefined" && firebaseSyncService.isConfigured()) {
        firebaseSyncService.saveDisciplina(this.disciplinas[idx]);
      }
      this.triggerServerSync();
      return this.disciplinas[idx];
    }
    return null;
  }

  deleteDisciplina(id, options = {}) {
    this.refreshDisciplinas();
    this.refreshCases();
    if (this.disciplinas.length <= 1) {
      return { success: false, message: "Não é possível excluir a única disciplina cadastrada no sistema." };
    }

    const discAlvo = this.disciplinas.find(d => d.id === id);
    if (!discAlvo) {
      return { success: false, message: "Disciplina não encontrada." };
    }

    // Verifica se há casos vinculados a esta disciplina
    const casosVinculados = this.cases.filter(c => (c.disciplinaId || "dietoterapia") === id);
    if (casosVinculados.length > 0) {
      const action = options.action; // 'move' ou 'cascade'
      if (action === "move") {
        const targetId = options.targetDisciplinaId;
        const targetDisc = this.disciplinas.find(d => d.id === targetId && d.id !== id);
        if (!targetDisc) {
          return { success: false, message: "Selecione uma disciplina de destino válida para transferir os casos." };
        }
        casosVinculados.forEach(c => {
          c.disciplinaId = targetDisc.id;
        });
        saveCases(this.cases);
      } else if (action === "cascade") {
        this.cases = this.cases.filter(c => (c.disciplinaId || "dietoterapia") !== id);
        saveCases(this.cases);
      } else {
        return {
          success: false,
          requiresChoice: true,
          caseCount: casosVinculados.length,
          disciplinaNome: discAlvo.nome,
          message: `A disciplina "${discAlvo.nome}" possui ${casosVinculados.length} caso(s) clínico(s) vinculado(s). Escolha se deseja transferir os casos para outra disciplina ou excluí-los juntos.`
        };
      }
    }

    this.disciplinas = this.disciplinas.filter(d => d.id !== id);
    if (typeof saveDisciplinas === "function") {
      saveDisciplinas(this.disciplinas);
    }
    if (this.activeDisciplinaId === id) {
      this.activeDisciplinaId = this.disciplinas[0].id;
    }
    if (typeof firebaseSyncService !== "undefined" && firebaseSyncService.isConfigured()) {
      firebaseSyncService.deleteDisciplina(id);
    }
    this.triggerServerSync();
    return {
      success: true,
      message: casosVinculados.length > 0 && options.action === "move"
        ? `Disciplina excluída e ${casosVinculados.length} caso(s) transferido(s) com sucesso!`
        : `Disciplina excluída com sucesso!`
    };
  }

  getCasesByDisciplina(disciplinaId) {
    this.refreshCases();
    const targetId = disciplinaId || this.activeDisciplinaId || "dietoterapia";
    return this.cases.filter(c => (c.disciplinaId || "dietoterapia") === targetId);
  }

  getCaseById(id) {
    return this.cases.find(c => c.id === id);
  }

  saveCase(caseData) {
    this.refreshCases();
    // Sempre revisa o português e adequa os tempos verbais antes de persistir o caso clínico
    const reviewedCase = (typeof ClinicalPortugueseReviser !== "undefined" && ClinicalPortugueseReviser.reviewCase)
      ? ClinicalPortugueseReviser.reviewCase(caseData)
      : caseData;

    reviewedCase.blockedTabs = Array.isArray(reviewedCase.blockedTabs) ? reviewedCase.blockedTabs : [];
    reviewedCase.isLocked = reviewedCase.isLocked === true;
    reviewedCase.visivel = reviewedCase.visivel !== false;
    reviewedCase.habilitarQuestoesAvaliativas = reviewedCase.habilitarQuestoesAvaliativas !== false;

    const existingIndex = this.cases.findIndex(c => c.id === reviewedCase.id);
    if (existingIndex >= 0) {
      this.cases[existingIndex] = reviewedCase;
    } else {
      this.cases.push(reviewedCase);
    }
    saveCases(this.cases);
    if (typeof firebaseSyncService !== "undefined" && firebaseSyncService.isConfigured()) {
      firebaseSyncService.saveCase(reviewedCase);
    }
    this.triggerServerSync();
    return reviewedCase;
  }

  deleteCase(id) {
    this.refreshCases();
    this.cases = this.cases.filter(c => c.id !== id);
    saveCases(this.cases);
    if (typeof firebaseSyncService !== "undefined" && firebaseSyncService.isConfigured()) {
      firebaseSyncService.deleteCase(id);
    }
    this.triggerServerSync();
  }

  duplicateCase(id) {
    const original = this.getCaseById(id);
    if (!original) return;
    const copy = JSON.parse(JSON.stringify(original));
    copy.id = "caso-" + Date.now();
    copy.title = `${copy.title} (Cópia)`;
    copy.isLocked = true; // Por padrão, novas cópias nascem travadas
    copy.visivel = original.visivel !== false;
    copy.habilitarQuestoesAvaliativas = original.habilitarQuestoesAvaliativas !== false;
    copy.blockedTabs = Array.isArray(original.blockedTabs) ? [...original.blockedTabs] : [];
    copy.disciplinaId = original.disciplinaId || this.activeDisciplinaId || "dietoterapia";
    this.cases.push(copy);
    saveCases(this.cases);
    if (typeof firebaseSyncService !== "undefined" && firebaseSyncService.isConfigured()) {
      firebaseSyncService.saveCase(copy);
    }
    this.triggerServerSync();
    return copy;
  }

  toggleCaseLock(id) {
    this.refreshCases();
    const c = this.cases.find(item => item.id === id);
    if (c) {
      c.isLocked = !c.isLocked;
      saveCases(this.cases);
      if (typeof firebaseSyncService !== "undefined" && firebaseSyncService.isConfigured()) {
        firebaseSyncService.setCaseLock(id, c.isLocked);
      }
      this.triggerServerSync();
      return c.isLocked;
    }
    return false;
  }

  // Alterna a visibilidade do caso para os alunos (Ocultar / Mostrar)
  toggleCaseVisibility(id) {
    this.refreshCases();
    const c = this.cases.find(item => item.id === id);
    if (c) {
      c.visivel = c.visivel === false ? true : false;
      saveCases(this.cases);
      if (typeof firebaseSyncService !== "undefined" && firebaseSyncService.isConfigured()) {
        if (typeof firebaseSyncService.setCaseVisibility === "function") {
          firebaseSyncService.setCaseVisibility(id, c.visivel);
        } else {
          firebaseSyncService.saveCase(c);
        }
      }
      this.triggerServerSync();
      return c.visivel;
    }
    return true;
  }

  // Alterna a habilitação da aba de questões avaliativas para o caso
  toggleCaseQuestions(id) {
    this.refreshCases();
    const c = this.cases.find(item => item.id === id);
    if (c) {
      c.habilitarQuestoesAvaliativas = c.habilitarQuestoesAvaliativas === false ? true : false;
      saveCases(this.cases);
      if (typeof firebaseSyncService !== "undefined" && firebaseSyncService.isConfigured()) {
        firebaseSyncService.saveCase(c);
      }
      this.triggerServerSync();
      return c.habilitarQuestoesAvaliativas;
    }
    return true;
  }

  // Alterna o bloqueio de uma aba específica para um caso clínico (Tempo Real)
  toggleCaseTabBlock(id, tabId) {
    this.refreshCases();
    const c = this.cases.find(item => item.id === id);
    if (!c) return false;
    c.blockedTabs = Array.isArray(c.blockedTabs) ? c.blockedTabs : [];
    const idx = c.blockedTabs.indexOf(tabId);
    if (idx >= 0) {
      c.blockedTabs.splice(idx, 1);
    } else {
      c.blockedTabs.push(tabId);
    }
    saveCases(this.cases);
    if (typeof firebaseSyncService !== "undefined" && firebaseSyncService.isConfigured()) {
      firebaseSyncService.setCaseBlockedTabs(id, c.blockedTabs);
    }
    this.triggerServerSync();
    return c.blockedTabs.includes(tabId);
  }

  // Define todas as abas bloqueadas de um caso clínico (Tempo Real)
  setCaseBlockedTabs(id, blockedTabs) {
    this.refreshCases();
    const c = this.cases.find(item => item.id === id);
    if (!c) return [];
    c.blockedTabs = Array.isArray(blockedTabs) ? blockedTabs : [];
    saveCases(this.cases);
    if (typeof firebaseSyncService !== "undefined" && firebaseSyncService.isConfigured()) {
      firebaseSyncService.setCaseBlockedTabs(id, c.blockedTabs);
    }
    this.triggerServerSync();
    return c.blockedTabs;
  }

  // Dispara sincronização em segundo plano com o Firebase Firestore (configuracoes/estado_atual)
  triggerServerSync() {
    if (typeof firebaseSyncService !== "undefined" && typeof firebaseSyncService.saveEstadoAtual === "function") {
      firebaseSyncService.saveEstadoAtual(this.disciplinas, this.cases);
    }
    if (typeof window !== "undefined" && window.dietoSyncEngine && typeof window.dietoSyncEngine.pushToServer === "function") {
      window.dietoSyncEngine.pushToServer(this.disciplinas, this.cases);
    }
  }

  exportCasesJson() {
    this.refreshCases();
    this.refreshDisciplinas();
    const exportPayload = {
      app: "DietoCase",
      version: 2,
      exportDate: new Date().toISOString(),
      disciplinas: this.disciplinas,
      cases: this.cases
    };
    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DietoCase_Backup_Completo_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  importCasesJson(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported && imported.cases && Array.isArray(imported.cases)) {
          // Formato rico v2 com disciplinas
          this.cases = imported.cases.map(c => ({
            ...c,
            isLocked: c.isLocked === true,
            disciplinaId: c.disciplinaId || "dietoterapia"
          }));
          saveCases(this.cases);

          if (Array.isArray(imported.disciplinas) && imported.disciplinas.length > 0) {
            this.disciplinas = imported.disciplinas;
            if (typeof saveDisciplinas === "function") {
              saveDisciplinas(this.disciplinas);
            }
          }
          this.triggerServerSync();
          callback(true, `Importação concluída! ${this.cases.length} casos e ${this.disciplinas.length} disciplinas carregados.`);
        } else if (Array.isArray(imported) && imported.length > 0 && imported[0].id) {
          // Formato legado v1 (array direto de casos)
          this.cases = imported.map(c => ({
            ...c,
            isLocked: c.isLocked === true,
            disciplinaId: c.disciplinaId || "dietoterapia"
          }));
          saveCases(this.cases);
          this.triggerServerSync();
          callback(true, `Importação concluída com sucesso! ${imported.length} caso(s) carregado(s).`);
        } else {
          callback(false, "Formato de arquivo JSON inválido para o DietoCase.");
        }
      } catch (err) {
        callback(false, `Erro ao processar arquivo: ${err.message}`);
      }
    };
    reader.readAsText(file);
  }

  getEmptyCase() {
    return {
      id: "caso-" + Date.now(),
      disciplinaId: this.activeDisciplinaId || "dietoterapia",
      title: "Novo Caso Clínico",
      category: "Ambulatorial / Hospitalar",
      description: "Descrição breve dos objetivos e patologia do caso clínico.",
      isLocked: false,
      visivel: true,
      blockedTabs: [],
      patient: {
        name: "Nome do Paciente",
        age: 45,
        gender: "Feminino",
        occupation: "Ocupação do paciente",
        maritalStatus: "Casada",
        residence: "Cidade - UF",
        avatar: "👤"
      },
      history: {
        queixaPrincipal: "Descreva a queixa do paciente em suas próprias palavras.",
        hda: "História detalhada da doença atual, início dos sintomas, evolução.",
        hpp: "História patológica pregressa, comorbidades, cirurgias anteriores.",
        historiaFamiliar: "Histórico familiar relevante para o quadro nutricional.",
        medicamentos: "Medicamentos em uso contínuo, doses e horários.",
        habitosVida: "Tabagismo, etilismo, nível de atividade física, rotina.",
        funcaoIntestinalDiurese: "Frequência e aspecto das fezes e da urina."
      },
      antropometria: {
        pesoAtual: 70.0,
        pesoHabitual: 70.0,
        estatura: 1.65,
        alturaJoelho: 50.0,
        circunferenciaCintura: 80.0,
        circunferenciaBraco: 28.0,
        dobraTricipital: 15.0,
        circunferenciaPanturrilha: 33.0,
        demaisAvaliacoes: "Circunferência do quadril: 98 cm; Dobra subescapular: 18 mm.",
        historicoPerdaPonderal: "Histórico de estabilidade ou perda/ganho ponderal."
      },
      bioquimica: [
        { exame: "Glicemia de Jejum", valor: "92 mg/dL", referencia: "< 99 mg/dL", interpretacao: "Normal" },
        { exame: "Hemoglobina", valor: "13.5 g/dL", referencia: "12.0 - 15.5 g/dL", interpretacao: "Normal" }
      ],
      exameFisico: {
        estadoGeral: "Estado geral, coloração de mucosas, hidratação.",
        sinaisEspecificos: "Sinais de carência nutricional ou alterações de pele/cabelo.",
        edema: "Presença ou ausência de edemas ou ascite.",
        cavidadeOral: "Dentição, uso de prótese, mastigação e deglutição.",
        tgi: "Condições do trato gastrointestinal (náuseas, dor, distensão)."
      },
      consumoAlimentar: {
        padraoDiario: "Resumo do padrão de ingestão alimentar habitual.",
        recordatorio24h: [
          { refeicao: "Café da manhã", alimentos: "Pão, café com leite" },
          { refeicao: "Almoço", alimentos: "Arroz, feijão, frango, salada" },
          { refeicao: "Jantar", alimentos: "Sopa de legumes ou repete almoço" }
        ],
        ingestaoHidrica: "Aproximadamente 1.5 L de água ao dia.",
        preferencias: "Alimentos preferidos do paciente.",
        aversoesIntolerancias: "Aversões ou intolerâncias relatadas.",
        quemPrepara: "Quem cozinha e organiza as refeições."
      },
      equipeMultiprofissional: [
        { id: "medico", nome: "Médico(a) Assistente", avatar: "🩺", especialidade: "Medicina Clínica", parecer: "Parecer médico, hipóteses diagnósticas, metas clínicas e terapêuticas." },
        { id: "enfermagem", nome: "Enfermeiro(a) do Plantão", avatar: "💉", especialidade: "Enfermagem e Sinais Vitais", parecer: "Sinais vitais (PA, FC, FR, Temp), cuidados de enfermagem, aceitação de dieta." }
      ],
      questoesAvaliativas: [
        {
          id: "q1",
          pergunta: "1. Formule o Diagnóstico em Nutrição (PES) prioritário para o caso.",
          tipo: "discursiva"
        },
        {
          id: "q2",
          pergunta: "2. Calcule o Valor Energético Total (VET) e estabeleça a distribuição de macronutrientes recomendada.",
          tipo: "discursiva"
        },
        {
          id: "q3",
          pergunta: "3. Descreva a conduta dietoterápica e as orientações nutricionais específicas para este paciente.",
          tipo: "discursiva"
        }
      ],
      resolucaoGabarito: {
        diagnosticoNutricional: "Diagnóstico PES de referência do professor.",
        calculoEnergetico: "Cálculo esperado do VET e regra de bolso.",
        distribuicaoMacronutrientes: "Distribuição esperada de carboidratos, proteínas e lipídios.",
        condutaPlanejamento: "Conduta dietoterápica e orientações padrão esperadas."
      }
    };
  }
}
