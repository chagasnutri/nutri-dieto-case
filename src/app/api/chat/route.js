import { NextResponse } from 'next/server';

/**
 * Rota Oficial de API do Preceptor IA para Next.js (App Router: /app/api/chat/route.js)
 * Executada exclusivamente pelo lado do servidor.
 * Aplica rigorosamente o Método Socrático e consome a variável segura AI_API_KEY (sem prefixo NEXT_PUBLIC_).
 */
const PRECEPTOR_SYSTEM_PROMPT = `Você é um professor experiente de Nutrição Clínica atuando como preceptor de estágio. Seu único objetivo é instigar o raciocínio clínico e a tomada de decisão do estudante. Você É ESTRITAMENTE PROIBIDO de: 1. Dar respostas diretas ou condutas prontas. 2. Calcular valores. 3. Avaliar o que o aluno escreveu. 4. Dar feedback direto dizendo se algo está "certo" ou "errado". Você não avalia, você questiona. Utilize exclusivamente o Método Socrático. Se o aluno perguntar algo ou apresentar uma conduta, devolva com perguntas que o façam refletir sobre a fisiopatologia, as diretrizes e os impactos metabólicos de sua escolha, guiando-o para que ele mesmo chegue à conclusão e julgue a própria conduta.`;

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
    // Retorna resposta socrática de demonstração clínica contextualizada
    const pNome = clinicalContext?.paciente?.nome || "o paciente";
    const pIdade = clinicalContext?.paciente?.idade || "idade a apurar";
    const pPatol = clinicalContext?.paciente?.patologiasHipoteses || "quadro clínico atual";
    const qLower = message.toLowerCase();

    let socraticReply = "";
    if (qLower.includes("calcul") || qLower.includes("vet") || qLower.includes("caloria")) {
      socraticReply = `Como seu preceptor de nutrição clínica, meu papel não é realizar cálculos por você, mas instigar seu raciocínio.\n\nObserve o paciente (${pNome}, ${pIdade}) e as condições relatadas: **${pPatol}**.\n\n• Qual é o estado nutricional e a demanda metabólica atual dele?\n• Você busca uma conduta hipocalórica, normocalórica ou hipercalórica neste momento?\n• Que equações preditivas você considera mais adequadas para essa faixa etária e por que fatores de atividade e injúria seriam justificados?`;
    } else if (qLower.includes("certo") || qLower.includes("errad") || qLower.includes("avalia")) {
      socraticReply = `Em nutrição clínica não procuramos respostas prontas de "certo" ou "errado", mas sim condutas cientificamente fundamentadas.\n\nReflita comigo:\n1. Quais diretrizes clínicas embasam essa sua proposta para um quadro de **${pPatol}**?\n2. Se adotarmos essa conduta, qual é o impacto metabólico esperado nos parâmetros laboratoriais e no peso corporal dele nas próximas semanas?\n3. O que faria você reavaliar ou ajustar essa decisão?`;
    } else {
      socraticReply = `Essa é uma reflexão essencial para a condução de ${pNome} (${pIdade}, portador de ${pPatol}).\n\nPara orientar sua tomada de decisão:\n• Quais são os principais objetivos dietoterápicos que devem nortear o cuidado deste paciente?\n• Que riscos metabólicos ou de desnutrição devem ser prevenidos em primeiro lugar?\n• Como sua conduta atua diretamente na etiologia identificada no PES?`;
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
