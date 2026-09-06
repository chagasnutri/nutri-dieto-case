// Netlify Serverless Function para a rota /api/chat do Preceptor IA
// Suporta a injeção da variável de ambiente NEXT_PUBLIC_AI_API_KEY ou AI_API_KEY

const MANDATORY_SYSTEM_PROMPT = `Você é um professor experiente de Nutrição Clínica atuando como preceptor de estágio. Seu único objetivo é instigar o raciocínio clínico e a tomada de decisão do estudante. Você É ESTRITAMENTE PROIBIDO de: 1. Dar respostas diretas ou condutas prontas. 2. Calcular valores. 3. Avaliar o que o aluno escreveu. 4. Dar feedback direto dizendo se algo está "certo" ou "errado". Você não avalia, você questiona. Utilize exclusivamente o Método Socrático. Se o aluno perguntar algo ou apresentar uma conduta, devolva com perguntas que o façam refletir sobre a fisiopatologia, as diretrizes e os impactos metabólicos de sua escolha, guiando-o para que ele mesmo chegue à conclusão e julgue a própria conduta.`;

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
    const { message, clinicalContext, history = [], clientApiKey } = data;

    if (!message || typeof message !== "string") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Campo 'message' é obrigatório." })
      };
    }

    // Identifica chave de API em variáveis de ambiente ou enviada pelo cliente
    const apiKey = (
      process.env.NEXT_PUBLIC_AI_API_KEY ||
      process.env.AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      clientApiKey ||
      ""
    ).trim();

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

    // SE A CHAVE DE API ESTIVER CONFIGURADA: Dispara chamada real ao modelo LLM (Google Gemini)
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
          parts: [{ text: MANDATORY_SYSTEM_PROMPT }]
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

    // CASO A CHAVE DE API ESTEJA VAZIA (NEXT_PUBLIC_AI_API_KEY PENDENTE):
    // Retorna resposta socrática pedagogicamente guiada demonstrando a funcionalidade
    const pNome = clinicalContext?.paciente?.nome || "o paciente";
    const pIdade = clinicalContext?.paciente?.idade || "idade a apurar";
    const pPatol = clinicalContext?.paciente?.patologiasHipoteses || "quadro clínico atual";
    const qLower = message.toLowerCase();

    let socraticReply = "";
    if (qLower.includes("calcul") || qLower.includes("vet") || qLower.includes("caloria") || qLower.includes("quantas") || qLower.includes("quanto")) {
      socraticReply = `Como seu preceptor de nutrição clínica, meu papel não é realizar cálculos por você, mas instigar seu raciocínio.\n\nObserve o paciente (${pNome}, ${pIdade}) e o quadro clínico relatado: **${pPatol}**.\n\n• Qual é o estado nutricional e a demanda metabólica atual dele?\n• Você busca uma conduta hipocalórica, normocalórica ou hipercalórica neste momento?\n• Que equações preditivas você considera mais adequadas para essa faixa etária e por que fatores de atividade e injúria seriam justificados?`;
    } else if (qLower.includes("certo") || qLower.includes("errad") || qLower.includes("avalia") || qLower.includes("o que acha")) {
      socraticReply = `Em nutrição clínica não procuramos respostas prontas de "certo" ou "errado", mas sim condutas cientificamente fundamentadas.\n\nReflita comigo:\n1. Quais diretrizes clínicas embasam essa sua proposta para um quadro de **${pPatol}**?\n2. Se adotarmos essa conduta, qual é o impacto metabólico esperado nos parâmetros laboratoriais e no peso corporal dele nas próximas semanas?\n3. O que faria você reavaliar ou ajustar essa decisão?`;
    } else {
      socraticReply = `Essa é uma reflexão fundamental para o manejo de ${pNome} (${pIdade}, ${pPatol}).\n\nPara guiar sua tomada de decisão:\n• Quais são os principais objetivos dietoterápicos que devem nortear o cuidado deste paciente?\n• Que riscos metabólicos ou de desnutrição devem ser prevenidos em primeiro lugar?\n• Como sua conduta atua diretamente na etiologia que você identificou no diagnóstico PES?`;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply: socraticReply,
        apiKeyConfigured: false,
        note: "Chave NEXT_PUBLIC_AI_API_KEY aguardando injeção. Modo Socrático de demonstração ativo."
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
