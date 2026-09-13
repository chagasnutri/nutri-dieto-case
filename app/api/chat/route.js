import { NextResponse } from 'next/server';

/**
 * Rota Oficial de API do Preceptor IA para Next.js (App Router: /app/api/chat/route.js)
 * Executada exclusivamente pelo lado do servidor.
 * Aplica rigorosamente o Método Socrático e consome a variável segura AI_API_KEY (sem prefixo NEXT_PUBLIC_).
 */
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

export async function POST(req) {
  try {
    const body = await req.json();
    const { message, clinicalContext, history = [], systemPrompt: customSystemPrompt } = body;

    if (!message) {
      return NextResponse.json({ error: "Campo 'message' é obrigatório." }, { status: 400 });
    }

    // Identificação da variável de ambiente segura no backend (exclusivamente no servidor)
    const apiKey = (
      process.env.AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      ""
    ).trim();

    const activeSystemPrompt = customSystemPrompt || PRECEPTOR_SYSTEM_PROMPT;

    const ctxString = clinicalContext ? `
[CENÁRIO CLÍNICO DO PACIENTE EM TEMPO REAL]
• Modalidade: ${clinicalContext.modalidade || 'Atendimento Clínico'}
• Paciente: ${clinicalContext.paciente?.nome || 'Paciente'}, ${clinicalContext.paciente?.idade || '--'}, ${clinicalContext.paciente?.genero || '--'}
• Hipótese / Patologia: ${clinicalContext.paciente?.patologiasHipoteses || 'Não especificada'}
• Antropometria: Peso ${clinicalContext.antropometria?.peso || '--'}, Altura ${clinicalContext.antropometria?.estatura || '--'}, IMC ${clinicalContext.antropometria?.imc || '--'}
• Exames: ${Array.isArray(clinicalContext.bioquimica) && clinicalContext.bioquimica.length ? clinicalContext.bioquimica.map(b => `${b.exame}: ${b.valorAchado}`).join(', ') : 'Nenhum'}
• PES: ${clinicalContext.diagnosticoPES?.problema || 'Não formulado'}
` : "";

    // SE A CHAVE DE API ESTIVER CONFIGURADA NO SERVIDOR: Executa chamada LLM (Google Gemini)
    if (apiKey) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const contents = [];
      if (Array.isArray(history)) {
        history.slice(-4).forEach((h) => {
          contents.push({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.content }]
          });
        });
      }

      contents.push({
        role: "user",
        parts: [{ text: `${ctxString}\n\n[MENSAGEM DO ESTUDANTE]\n${message}` }]
      });

      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: activeSystemPrompt }] },
          contents: contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
        })
      });

      if (geminiResponse.ok) {
        const data = await geminiResponse.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) {
          return NextResponse.json({ reply: replyText, apiKeyConfigured: true });
        }
      }
    }

    // CASO A CHAVE DE API ESTEJA VAZIA (AI_API_KEY PENDENTE NO SERVIDOR):
    // Retorna resposta socrática em estrita conformidade com as duas seções obrigatórias
    const pNome = clinicalContext?.paciente?.nome || "o paciente";
    const pIdade = clinicalContext?.paciente?.idade || "idade a apurar";
    const pPatol = clinicalContext?.paciente?.patologiasHipoteses || "quadro clínico atual";
    const qLower = message.toLowerCase();

    let socraticReply = "";
    if (qLower.includes("calcul") || qLower.includes("vet") || qLower.includes("caloria")) {
      socraticReply = `[Parte 1 - Conceito]
A determinação das necessidades energéticas e de macronutrientes depende da taxa metabólica basal, do nível de atividade física e do estresse metabólico imposto por ${pPatol}. Em ${pNome} (${pIdade}), a definição do VET dita o equilíbrio entre anabolismo tecidual e controle ponderal.

[Parte 2 - Pergunta Socrática]
Considerando o diagnóstico nutricional e as demandas metabólicas de ${pNome}, que método preditivo de gasto energético você indicaria e qual meta calórica (hipo, normo ou hipercalórica) se justifica do ponto de vista fisiopatológico?`;
    } else if (qLower.includes("certo") || qLower.includes("errad") || qLower.includes("avalia")) {
      socraticReply = `[Parte 1 - Conceito]
Na prática baseada em evidências, não existem respostas binárias de certo ou errado desvinculadas do contexto clínico, mas sim hipóteses dietoterápicas respaldadas na fisiopatologia de ${pPatol} e nas diretrizes vigentes.

[Parte 2 - Pergunta Socrática]
Se adotarmos essa conduta em ${pNome}, qual impacto metabólico você espera observar na composição corporal e nos biomarcadores nas próximas semanas, e quais critérios clínicos balizariam uma reavaliação?`;
    } else {
      socraticReply = `[Parte 1 - Conceito]
O raciocínio clínico nutricional exige integrar a anamnese, o diagnóstico PES e a fisiopatologia de ${pPatol} apresentada por ${pNome} (${pIdade}), assegurando que a intervenção atue diretamente sobre os fatores etiológicos.

[Parte 2 - Pergunta Socrática]
Quais são os objetivos dietoterápicos prioritários neste momento para ${pNome} e como sua proposta atua diretamente sobre a etiologia identificada no diagnóstico PES?`;
    }

    return NextResponse.json({
      reply: socraticReply,
      apiKeyConfigured: false,
      note: "Rota pronta para receber a chave em AI_API_KEY no servidor. Modo Socrático de demonstração ativo."
    });

  } catch (error) {
    return NextResponse.json({ error: error.message || "Erro interno." }, { status: 500 });
  }
}
