// Netlify Serverless Function para a rota /api/chat do Preceptor IA
// Executada exclusivamente pelo lado do servidor.
// Suporta a injeção da variável de ambiente segura AI_API_KEY (sem prefixo NEXT_PUBLIC_).

const MANDATORY_SYSTEM_PROMPT = `Você é o Preceptor Virtual do DietoCase, um preceptor clínico docente de nutrição clínica de excelência (padrão USP/Unifesp/HC-FMUSP).
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

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Método não permitido. Utilize POST." })
    };
  }

  try {
    const data = JSON.parse(event.body || "{}");
    const { message, clinicalContext, history = [], systemPrompt: customSystemPrompt } = data;

    if (!message || typeof message !== "string") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Campo 'message' é obrigatório." })
      };
    }

    // Identifica chave de API em variáveis de ambiente exclusivamente no servidor
    const apiKey = (
      process.env.AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      ""
    ).trim();

    const activeSystemPrompt = customSystemPrompt || MANDATORY_SYSTEM_PROMPT;

    // Contexto textual formatado para o LLM
    const ctxString = clinicalContext ? `
[CENÁRIO CLÍNICO DO PACIENTE EM TEMPO REAL]
• Modalidade: ${clinicalContext.modalidade || 'Atendimento Clínico'}
• Paciente: ${clinicalContext.paciente?.nome || 'Paciente'}, ${clinicalContext.paciente?.idade || 'Idade não informada'}, ${clinicalContext.paciente?.genero || 'Gênero não informado'}
• Hipótese Diagnóstica / Patologias: ${clinicalContext.paciente?.patologiasHipoteses || 'Não descritas'}
• Antropometria: Peso ${clinicalContext.antropometria?.peso || '--'}, Altura ${clinicalContext.antropometria?.estatura || '--'}, IMC ${clinicalContext.antropometria?.imc || '--'} (${clinicalContext.antropometria?.diagnosticoNutricional || '--'})
• Exames Bioquímicos: ${Array.isArray(clinicalContext.bioquimica) && clinicalContext.bioquimica.length ? clinicalContext.bioquimica.map(b => `${b.exame}: ${b.valorAchado} (Ref: ${b.valorReferencia})${b.interpretacaoAluno ? ` [Interpretação do Aluno: ${b.interpretacaoAluno}]` : ''}`).join('; ') : 'Nenhum exame cadastrado'}
• Diagnóstico PES preenchido: ${clinicalContext.diagnosticoPES?.problema ? `P: ${clinicalContext.diagnosticoPES.problema} | E: ${clinicalContext.diagnosticoPES.etiologia} | S: ${clinicalContext.diagnosticoPES.sinaisSintomas}` : 'Ainda não formulado'}
• Objetivos Dietoterápicos: ${clinicalContext.diagnosticoPES?.objetivosDietoterapicos || 'Ainda não estabelecidos'}
• Conduta / VET Planejado: ${clinicalContext.planejamentoConduta?.vetPlanejadoKcal || 'Ainda não calculado'}
` : "";

    // SE A CHAVE DE API ESTIVER CONFIGURADA NO SERVIDOR: Dispara chamada real ao modelo LLM (Google Gemini)
    if (apiKey) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const contents = [];
      // Histórico anterior
      if (Array.isArray(history)) {
        history.slice(-4).forEach(h => {
          contents.push({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.content }]
          });
        });
      }

      // Pergunta atual com o contexto clínico acoplado
      contents.push({
        role: "user",
        parts: [{
          text: `${ctxString}\n\n[MENSAGEM DO ESTUDANTE]\n${message}`
        }]
      });

      const geminiBody = {
        systemInstruction: {
          parts: [{ text: activeSystemPrompt }]
        },
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600
        }
      };

      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody)
      });

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              reply: replyText,
              apiKeyConfigured: true
            })
          };
        }
      } else {
        console.warn("[chat.js] Erro na resposta do Gemini:", await geminiResponse.text());
      }
    }

    // CASO A CHAVE DE API ESTEJA VAZIA (AI_API_KEY PENDENTE NO SERVIDOR):
    // Retorna resposta socrática pedagogicamente guiada demonstrando a funcionalidade
    const pNome = clinicalContext?.paciente?.nome || "o paciente";
    const pIdade = clinicalContext?.paciente?.idade || "idade a apurar";
    const pPatol = clinicalContext?.paciente?.patologiasHipoteses || "quadro clínico atual";
    const qLower = message.toLowerCase();

    let socraticReply = "";
    if (qLower.includes("calcul") || qLower.includes("vet") || qLower.includes("caloria") || qLower.includes("quantas") || qLower.includes("quanto")) {
      socraticReply = `[Parte 1 - Conceito]
A determinação das necessidades energéticas e de macronutrientes depende da taxa metabólica basal, do nível de atividade física e do estresse metabólico gerado pelo quadro de ${pPatol}. Em ${pNome} (${pIdade}), o VET dita o anabolismo e a resposta clínica esperada.

[Parte 2 - Pergunta Socrática]
Considerando a condição metabólica de ${pNome}, que equação preditiva você selecionaria e qual meta calórica (hipo, normo ou hipercalórica) se fundamenta na fisiopatologia sem sobrecarregar o organismo?`;
    } else if (qLower.includes("certo") || qLower.includes("errad") || qLower.includes("avalia") || qLower.includes("o que acha")) {
      socraticReply = `[Parte 1 - Conceito]
Na prática clínica baseada em evidências, não existem respostas binárias descontextualizadas de certo ou errado, mas sim hipóteses terapêuticas fundamentadas na fisiopatologia de ${pPatol} e nas diretrizes vigentes.

[Parte 2 - Pergunta Socrática]
Se implementarmos essa conduta em ${pNome}, qual impacto fisiológico e metabólico você prevê nos exames bioquímicos e no peso corporal nas próximas semanas, e quais sinais clínicos fariam você reavaliar?`;
    } else {
      socraticReply = `[Parte 1 - Conceito]
O raciocínio clínico nutricional requer articular a anamnese, o diagnóstico PES e a fisiopatologia de ${pPatol} de ${pNome} (${pIdade}), assegurando intervenção direta na causa-raiz do problema.

[Parte 2 - Pergunta Socrática]
Quais são os objetivos dietoterápicos prioritários neste momento para ${pNome} e de que forma sua proposta atua diretamente sobre a etiologia identificada no diagnóstico PES?`;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply: socraticReply,
        apiKeyConfigured: false,
        note: "Chave AI_API_KEY aguardando injeção no servidor. Modo Socrático de demonstração ativo."
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Erro interno ao processar mensagem do preceptor." })
    };
  }
};
