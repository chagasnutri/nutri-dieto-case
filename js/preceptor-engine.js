// Preceptor IA - Assistente Virtual Socrático de Nutrição Clínica
// Atua com exclusividade pedagógica através do Método Socrático, estimulando o raciocínio sem dar respostas prontas.

const PRECEPTOR_SYSTEM_PROMPT = `Você é o Preceptor Virtual do DietoCase, um preceptor clínico docente de nutrição clínica de excelência (padrão USP/Unifesp/HC-FMUSP).
Sua missão pedagógica é guiar estagiários e estudantes de nutrição através do MÉTODO SOCRÁTICO ESTRITO.

DIRETRIZES PEDAGÓGICAS INEGOCIÁVEIS:
1. NUNCA FORNEÇA CONDUTAS PRONTAS, CÁLCULOS FINAIS, PRESCRIÇÕES DIETÉTICAS OU RESPOSTAS DIRETAS. O aprendizado deve ser ativo.
2. ESTRUTURA OBRIGATÓRIA DA RESPOSTA:
Toda resposta sua DEVE conter obrigatoriamente e exatamente duas seções bem demarcadas:

[Parte 1 - Conceito]
Faça uma validação breve do raciocínio trazido pelo estudante e fundamente sucintamente a base fisiológica, bioquímica ou fisiopatológica subjacente. Destaque se o raciocínio clínico caminha na direção correta ou se há pontos de atenção fisiopatológica.

[Parte 2 - Pergunta Socrática]
Formule UMA pergunta reflexiva, instigante e precisa que estimule o estagiário a investigar, calcular ou deduzir por conta própria o próximo passo da conduta, a necessidade de ajuste de macronutriente, micronutriente, fração lipídica ou interação fármaco-nutriente.

3. CONCISÃO E IMPACTO: Mantenha as respostas curtas, densas em ciência da nutrição e termine SEMPRE com a pergunta reflexiva.`;

class PreceptorEngine {
  constructor() {
    this.messages = [];
    this.isOpen = false;
    this.isLoading = false;
    this.apiEndpoint = "/api/chat";
    this.geminiApiKey = localStorage.getItem("dietoterapia_gemini_api_key") || "";
    this.initDefaultWelcome();
  }

  initDefaultWelcome() {
    this.messages = [
      {
        id: "msg-welcome",
        role: "assistant",
        sender: "Preceptor IA",
        avatar: "🧠",
        content: "Olá! Sou seu **Preceptor de Nutrição Clínica**. Estou acompanhando seu atendimento neste caso.\n\nMeu papel aqui não é fornecer respostas prontas, fórmulas calculadas ou dizer se sua conduta está certa ou errada — mas sim instigar sua reflexão crítica e seu raciocínio clínico.\n\nQual aspecto fisiopatológico, diagnóstico ou conduta dietoterápica você gostaria de debater agora?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  }

  getSystemPrompt() {
    return PRECEPTOR_SYSTEM_PROMPT;
  }

  setApiKey(key) {
    this.geminiApiKey = (key || "").trim();
    if (this.geminiApiKey) {
      localStorage.setItem("dietoterapia_gemini_api_key", this.geminiApiKey);
    } else {
      localStorage.removeItem("dietoterapia_gemini_api_key");
    }
  }

  getApiKey() {
    return this.geminiApiKey || localStorage.getItem("dietoterapia_gemini_api_key") || "";
  }

  /**
   * Extrai o contexto clínico atual do prontuário em tempo real
   * Funciona perfeitamente tanto no Modo Simulação quanto no Modo Atendimento Real
   */
  extractClinicalContext(appState = {}) {
    const globalState = (typeof window !== "undefined" && window.appState) ? window.appState : {};
    const isReal = !!(appState.isRealPatient || globalState.workflowMode === "real" || (typeof window !== "undefined" && window.isRealPatientActive));
    const activeCase = appState.activeCase || globalState.currentCase || (typeof window !== "undefined" && window.activeCase) || null;
    const prontuario = appState.prontuario || globalState.currentProntuario || (typeof window !== "undefined" && window.currentProntuario) || {};

    let patientName = "Paciente em Atendimento";
    let age = "Não informada";
    let gender = "Não informado";
    let pathologies = "Não especificadas";
    let mode = isReal ? "Atendimento Presencial Real" : "Simulação Clínica Baseada em Casos";

    // 1. Identificação básica e diagnóstico médico
    if (isReal) {
      const realNameInput = document.getElementById("realPatName");
      const realAgeInput = document.getElementById("realPatAge");
      const realGenderInput = document.getElementById("realPatGender");
      const realHipoteseInput = document.getElementById("realPatHipoteseDiagnostica") || document.getElementById("realPatHipotese");

      patientName = (realNameInput?.value?.trim()) || prontuario.dadosPacienteReal?.nome || "Paciente Real";
      age = (realAgeInput?.value?.trim()) || prontuario.dadosPacienteReal?.idade || "Não informada";
      gender = (realGenderInput?.value?.trim()) || prontuario.dadosPacienteReal?.genero || prontuario.dadosPacienteReal?.sexo || "Não informado";
      pathologies = (realHipoteseInput?.value?.trim()) || prontuario.dadosPacienteReal?.hipoteseDiagnostica || "Em investigação clínica";
    } else if (activeCase) {
      patientName = activeCase.patient?.name || activeCase.title || "Caso Simulado";
      age = activeCase.patient?.age ? `${activeCase.patient.age} anos` : "Não informada";
      gender = activeCase.patient?.gender || "Não informado";
      pathologies = activeCase.history?.hipoteseDiagnostica || activeCase.hipoteseDiagnostica || activeCase.category || "Não informada";
    }

    // 2. Antropometria atual
    const pesoAtual = document.getElementById("prontPesoAtual")?.value || prontuario.antropometria?.pesoAtual || "";
    const estatura = document.getElementById("prontEstatura")?.value || prontuario.antropometria?.estatura || "";
    const imc = document.getElementById("prontImc")?.textContent || prontuario.antropometria?.imc || "";
    const diagNutricional = document.getElementById("prontDiagnosticoNutricional")?.value || prontuario.antropometria?.classificacaoImc || "";

    // 3. Exames Bioquímicos e Interpretações
    const biochemistry = [];
    if (activeCase && Array.isArray(activeCase.bioquimica)) {
      activeCase.bioquimica.forEach(item => {
        const inputInterp = document.getElementById(`bio-interp-${item.id}`);
        const interp = inputInterp?.value || (prontuario.bioquimica?.interpretacoes && prontuario.bioquimica.interpretacoes[item.exame]) || "";
        biochemistry.push({
          exame: item.exame,
          valorAchado: item.valorAchado,
          valorReferencia: item.valorReferencia,
          interpretacaoAluno: interp
        });
      });
    }

    // 4. Diagnóstico PES e Objetivos Dietoterápicos
    const pesProblema = document.getElementById("prontPesProblema")?.value || prontuario.diagnosticoPES?.problema || "";
    const pesEtiologia = document.getElementById("prontPesEtiologia")?.value || prontuario.diagnosticoPES?.etiologia || "";
    const pesSinais = document.getElementById("prontPesSinaisSintomas")?.value || prontuario.diagnosticoPES?.sinaisSintomas || "";
    const pesObjetivos = document.getElementById("prontPesObjetivos")?.value || prontuario.diagnosticoPES?.objetivosDietoterapicos || "";

    // 5. Necessidades Energéticas e Conduta
    const vetPlanejado = document.getElementById("prontCalcVetPlanejado")?.value || prontuario.calculoNecessidades?.vetPlanejadoKcal || "";
    const justificativaVet = document.getElementById("prontCalcJustificativa")?.value || prontuario.calculoNecessidades?.justificativaEscolha || "";
    const consistencia = document.getElementById("prontCardapioConsistencia")?.value || prontuario.consistenciaDietaOral || "";

    return {
      modalidade: mode,
      isRealPatient: isReal,
      paciente: {
        nome: patientName,
        idade: age,
        genero: gender,
        patologiasHipoteses: pathologies
      },
      antropometria: {
        peso: pesoAtual ? `${pesoAtual} kg` : "Não aferido",
        estatura: estatura ? `${estatura} m` : "Não aferida",
        imc: imc || "Não calculado",
        diagnosticoNutricional: diagNutricional || "Não definido"
      },
      bioquimica: biochemistry,
      diagnosticoPES: {
        problema: pesProblema,
        etiologia: pesEtiologia,
        sinaisSintomas: pesSinais,
        objetivosDietoterapicos: pesObjetivos
      },
      planejamentoConduta: {
        vetPlanejadoKcal: vetPlanejado ? `${vetPlanejado} kcal/dia` : "Não definido",
        justificativa: justificativaVet,
        consistenciaDieta: consistencia || "Não definida"
      }
    };
  }

  /**
   * Envia mensagem do aluno com o contexto clínico para o backend ou fallback socrático
   */
  async sendMessage(userText, appState = {}) {
    const text = (userText || "").trim();
    if (!text) return null;

    const userMsg = {
      id: "msg-" + Date.now(),
      role: "user",
      sender: "Estudante",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.messages.push(userMsg);

    const clinicalContext = this.extractClinicalContext(appState);
    this.isLoading = true;

    try {
      // Prepara payload para a rota de backend /api/chat (segurança: sem chaves no frontend)
      const payload = {
        message: text,
        clinicalContext: clinicalContext,
        history: this.messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        systemPrompt: PRECEPTOR_SYSTEM_PROMPT
      };

      let assistantReply = "";

      // 1. Tenta rota de API backend (/api/chat)
      try {
        const response = await fetch(this.apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          assistantReply = data.reply || data.content || data.message;
        }
      } catch (err) {
        console.warn("[Preceptor IA] Rota de backend /api/chat indisponível, recorrendo ao motor socrático integrado.", err);
      }

      // 2. Se a API de backend não respondeu (ex: modo estático ou chave em ambiente vazia)
      if (!assistantReply) {
        assistantReply = await this.generateLocalSocraticResponse(text, clinicalContext);
      }

      const assistantMsg = {
        id: "msg-ai-" + Date.now(),
        role: "assistant",
        sender: "Preceptor IA",
        avatar: "🧠",
        content: assistantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      this.messages.push(assistantMsg);
      this.isLoading = false;
      return assistantMsg;

    } catch (error) {
      this.isLoading = false;
      const errorMsg = {
        id: "msg-err-" + Date.now(),
        role: "assistant",
        sender: "Preceptor IA",
        avatar: "⚠️",
        content: "Houve uma oscilação na conexão com o preceptor virtual. Vamos retomar o raciocínio: considerando o quadro deste paciente, qual ponto você gostaria de reexaminar?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      this.messages.push(errorMsg);
      return errorMsg;
    }
  }

  /**
   * Resposta socrática de contingência em conformidade absoluta com o System Prompt
   * Usada quando rodando localmente sem servidor backend ou com chave de API pendente.
   */
  async generateLocalSocraticResponse(userText, context) {
    const pNome = context?.paciente?.nome || "o paciente";
    const pIdade = context?.paciente?.idade || "idade a apurar";
    const pPatol = context?.paciente?.patologiasHipoteses || "quadro clínico atual";
    const qLower = userText.toLowerCase();

    // Simula tempo de reflexão do preceptor
    await new Promise(r => setTimeout(r, 400));

    // Perguntas sobre cálculos ou valores
    if (qLower.includes("calcul") || qLower.includes("vet") || qLower.includes("caloria") || qLower.includes("quantas") || qLower.includes("quanto")) {
      return `[Parte 1 - Conceito]
A determinação das necessidades energéticas e de macronutrientes depende da taxa metabólica basal, do nível de atividade física e do fator de estresse metabólico gerado pelo quadro de ${pPatol}. Em ${pNome} (${pIdade}), a modulação calórica orienta diretamente o anabolismo tecidual ou a perda ponderal controlada.

[Parte 2 - Pergunta Socrática]
Considerando o estado nutricional e a demanda metabólica atual de ${pNome}, que equação preditiva você selecionaria e qual meta calórica (hipo, normo ou hipercalórica) melhor atende à fisiopatologia sem induzir sobrecarga metabólica?`;
    }

    // Perguntas sobre "certo ou errado" / avaliação
    if (qLower.includes("certo") || qLower.includes("errad") || qLower.includes("ta bom") || qLower.includes("está bom") || qLower.includes("avalia") || qLower.includes("o que acha")) {
      return `[Parte 1 - Conceito]
Na prática clínica baseada em evidências, não existem respostas absolutas de certo ou errado desvinculadas do contexto clínico, mas sim hipóteses terapêuticas embasadas na fisiopatologia de ${pPatol} e nas diretrizes vigentes (ex: BRASPEN, ESPEN, SBC, SBD).

[Parte 2 - Pergunta Socrática]
Se implementarmos essa conduta em ${pNome}, qual impacto fisiológico e metabólico você prevê nos exames bioquímicos e na composição corporal nas próximas semanas, e quais critérios clínicos levariam você a ajustar esse plano?`;
    }

    // Perguntas sobre exames bioquímicos
    if (qLower.includes("exame") || qLower.includes("glicem") || qLower.includes("creatin") || qLower.includes("lip") || qLower.includes("hba1c") || qLower.includes("ureia")) {
      return `[Parte 1 - Conceito]
Os biomarcadores laboratoriais refletem a resposta inflamatória, a integridade da função hepática/renal e o equilíbrio hidroeletrolítico na vigência de ${pPatol}. A interpretação integrada desses parâmetros com a clínica de ${pNome} previne descompensações iatrogênicas.

[Parte 2 - Pergunta Socrática]
Analisando essas alterações bioquímicas em conjunto, quais nutrientes ou frações lipídicas exigem modulação prioritária na sua prescrição dietoterápica para restabelecer a homeostase do paciente?`;
    }

    // Perguntas sobre prescrição, macronutrientes ou consistência
    if (qLower.includes("prescri") || qLower.includes("proteina") || qLower.includes("carboidrato") || qLower.includes("lipidio") || qLower.includes("dieta") || qLower.includes("pastosa") || qLower.includes("consistencia")) {
      return `[Parte 1 - Conceito]
A distribuição percentual e em gramas por quilo de macronutrientes deve respeitar a capacidade de metabolização de substratos, a sensibilidade insulínica e a preservação de massa magra frente ao quadro de ${pPatol} em ${pNome}.

[Parte 2 - Pergunta Socrática]
Qual é a sua justificativa metabólica para essa proporção de macronutrientes e fracionamento dietético, e de que maneira ela previne os riscos nutricionais identificados no diagnóstico PES?`;
    }

    // Resposta socrática genérica ancorada no paciente
    return `[Parte 1 - Conceito]
O raciocínio clínico nutricional exige a integração da anamnese, do diagnóstico PES e da fisiopatologia de ${pPatol} apresentada por ${pNome} (${pIdade}), assegurando que cada conduta intervenha diretamente na etiologia nutricional.

[Parte 2 - Pergunta Socrática]
Quais são os objetivos dietoterápicos prioritários para este momento do atendimento de ${pNome} e qual parâmetro clínico-laboratorial você monitorará para confirmar a eficácia da sua conduta?`;
  }

  openDrawer() {
    this.isOpen = true;
    const drawer = document.getElementById("preceptorDrawer");
    const backdrop = document.getElementById("preceptorBackdrop");
    if (drawer) {
      drawer.classList.remove("translate-x-full");
      drawer.classList.add("translate-x-0");
    }
    if (backdrop) {
      backdrop.classList.remove("hidden");
    }
    this.updateClinicalContextBadge();
    this.scrollChatToBottom();
  }

  closeDrawer() {
    this.isOpen = false;
    const drawer = document.getElementById("preceptorDrawer");
    const backdrop = document.getElementById("preceptorBackdrop");
    if (drawer) {
      drawer.classList.remove("translate-x-0");
      drawer.classList.add("translate-x-full");
    }
    if (backdrop) {
      backdrop.classList.add("hidden");
    }
  }

  toggleDrawer() {
    if (this.isOpen) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  updateClinicalContextBadge() {
    const ctx = this.extractClinicalContext();
    const infoSpan = document.getElementById("preceptorPatientInfoSpan");
    const contextBody = document.getElementById("preceptorContextSummaryBody");

    if (infoSpan) {
      infoSpan.textContent = `${ctx.paciente.nome} (${ctx.paciente.idade}) • ${ctx.modalidade}`;
    }

    if (contextBody) {
      contextBody.innerHTML = `
        <div class="space-y-1 text-[11px] text-slate-600">
          <div><strong class="text-slate-800">Cenário:</strong> ${ctx.modalidade}</div>
          <div><strong class="text-slate-800">Paciente:</strong> ${ctx.paciente.nome} (${ctx.paciente.idade}, ${ctx.paciente.genero})</div>
          <div><strong class="text-slate-800">Hipótese / Diagnóstico:</strong> <span class="text-indigo-900 font-semibold">${ctx.paciente.patologiasHipoteses}</span></div>
          <div><strong class="text-slate-800">Antropometria:</strong> Peso ${ctx.antropometria.peso} | Estatura ${ctx.antropometria.estatura} | IMC ${ctx.antropometria.imc} (${ctx.antropometria.diagnosticoNutricional})</div>
          ${ctx.diagnosticoPES.problema ? `<div><strong class="text-slate-800">PES:</strong> ${ctx.diagnosticoPES.problema}</div>` : ''}
          ${ctx.planejamentoConduta.vetPlanejadoKcal !== "Não definido" ? `<div><strong class="text-slate-800">VET Planejado:</strong> ${ctx.planejamentoConduta.vetPlanejadoKcal}</div>` : ''}
        </div>
      `;
    }
  }

  renderMessages() {
    const container = document.getElementById("preceptorChatMessages");
    if (!container) return;

    container.innerHTML = this.messages.map(m => {
      const isUser = m.role === "user";
      const formattedContent = this.formatMarkdown(m.content);

      if (isUser) {
        return `
          <div class="flex justify-end mb-3">
            <div class="max-w-[85%] bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl rounded-tr-xs p-3 shadow-sm text-xs leading-relaxed">
              <div class="font-bold text-[10px] text-emerald-100 mb-1 flex items-center justify-between">
                <span>Você (Estudante)</span>
                <span class="opacity-80">${m.timestamp}</span>
              </div>
              <div class="whitespace-pre-wrap">${this.escapeHtml(m.content)}</div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="flex justify-start mb-3">
            <div class="flex items-start space-x-2 max-w-[90%]">
              <div class="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-base shrink-0 border border-purple-200 shadow-2xs">
                ${m.avatar || "🧠"}
              </div>
              <div class="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl rounded-tl-xs p-3 shadow-2xs text-xs leading-relaxed">
                <div class="font-bold text-[10px] text-purple-900 mb-1 flex items-center justify-between">
                  <span class="flex items-center space-x-1">
                    <span>${m.sender}</span>
                    <span class="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded-full">Socrático</span>
                  </span>
                  <span class="text-slate-400 font-normal">${m.timestamp}</span>
                </div>
                <div class="prose prose-xs text-slate-700 space-y-1.5">${formattedContent}</div>
              </div>
            </div>
          </div>
        `;
      }
    }).join("");

    if (this.isLoading) {
      container.innerHTML += `
        <div class="flex justify-start mb-3" id="preceptorTypingIndicator">
          <div class="flex items-center space-x-2 bg-purple-50 text-purple-800 border border-purple-200 px-3 py-2 rounded-2xl rounded-tl-xs text-xs font-medium animate-pulse">
            <span>🧠</span>
            <span>Preceptor formulando questão reflexiva...</span>
          </div>
        </div>
      `;
    }

    this.scrollChatToBottom();
  }

  scrollChatToBottom() {
    const container = document.getElementById("preceptorChatMessages");
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  }

  formatMarkdown(text) {
    if (!text) return "";
    let html = this.escapeHtml(text);
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Bullets
    html = html.replace(/^• (.*$)/gim, '<div class="pl-2 flex items-start space-x-1"><span>•</span><span>$1</span></div>');
    // Paragraph breaks
    html = html.replace(/\n\n/g, '<div class="h-2"></div>');
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Instância global
const preceptorEngine = new PreceptorEngine();
if (typeof window !== "undefined") {
  window.preceptorEngine = preceptorEngine;
  window.PRECEPTOR_SYSTEM_PROMPT = PRECEPTOR_SYSTEM_PROMPT;
}
