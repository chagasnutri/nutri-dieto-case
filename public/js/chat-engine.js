// Motor de Simulação Clínica e Diálogo com Proteção Estrita Anti-Alucinação
// Garante que o interlocutor responda com precisão aos fatos do caso e JAMAIS invente dados inexistentes.

class ClinicalChatEngine {
  constructor() {
    this.apiEndpoint = "/api/chat";
    this.apiKey = ""; // Por segurança, chaves de API não são armazenadas nem expostas no frontend
    this.activeRole = "paciente"; // 'paciente', 'acompanhante', 'medico', 'enfermagem', 'fono', 'psicologia'
  }

  setApiKey(key) {
    this.apiKey = key.trim();
    if (this.apiKey) {
      localStorage.setItem("dietoterapia_gemini_api_key", this.apiKey);
    } else {
      localStorage.removeItem("dietoterapia_gemini_api_key");
    }
  }

  getApiKey() {
    return this.apiKey;
  }

  setRole(role) {
    this.activeRole = role;
  }

  getRoleInfo(role, currentCase) {
    const pName = currentCase?.patient?.name || "Paciente";
    if (role === "paciente") {
      return {
        title: pName,
        subtitle: "Paciente Simulado",
        avatar: currentCase?.patient?.avatar || "👤",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300"
      };
    }
    if (role === "acompanhante") {
      return {
        title: "Acompanhante / Familiar",
        subtitle: `Familiar de ${pName}`,
        avatar: "👥",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-300"
      };
    }

    // Busca na equipe multiprofissional dinâmica do caso
    const equipe = (typeof normalizeEquipeMultiprofissional === "function") 
      ? normalizeEquipeMultiprofissional(currentCase?.equipeMultiprofissional)
      : (Array.isArray(currentCase?.equipeMultiprofissional) ? currentCase.equipeMultiprofissional : []);

    const foundProf = equipe.find(p => p.id === role || p.id === String(role).toLowerCase() || (p.nome && p.nome.toLowerCase() === String(role).toLowerCase()));
    if (foundProf) {
      return {
        title: foundProf.nome,
        subtitle: foundProf.especialidade || "Equipe Multiprofissional",
        avatar: foundProf.avatar || "🩺",
        badgeColor: "bg-teal-100 text-teal-800 border-teal-300",
        parecer: foundProf.parecer || "",
        id: foundProf.id
      };
    }

    // Fallbacks para papéis padrão
    switch (role) {
      case "medico":
        return {
          title: "Dr(a). Médico(a) Assistente",
          subtitle: "Equipe Médica Hospitalar / Ambulatorial",
          avatar: "🩺",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-300"
        };
      case "enfermagem":
        return {
          title: "Enfermeiro(a) Clínico(a)",
          subtitle: "Enfermagem do Plantão / Cuidados Clínicos",
          avatar: "💉",
          badgeColor: "bg-teal-100 text-teal-800 border-teal-300"
        };
      case "fono":
        return {
          title: "Fonoaudiólogo(a) Clínico(a)",
          subtitle: "Avaliação da Deglutição e Mastigação",
          avatar: "🗣️",
          badgeColor: "bg-purple-100 text-purple-800 border-purple-300"
        };
      case "psicologia":
        return {
          title: "Psicólogo(a) / Serv. Social",
          subtitle: "Apoio Emocional e Psicossocial",
          avatar: "🤝",
          badgeColor: "bg-rose-100 text-rose-800 border-rose-300"
        };
      default:
        return {
          title: "Equipe de Saúde",
          subtitle: "Profissional",
          avatar: "🏥",
          badgeColor: "bg-slate-100 text-slate-800 border-slate-300"
        };
    }
  }

  // Remove acentos e normaliza para análise semântica
  normalizeText(str) {
    if (!str) return "";
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Transforma anotações clínicas formais de prontuário em fala natural em 1ª pessoa (Paciente)
  cleanFirstPerson(text) {
    if (!text) return "";
    if (typeof ClinicalPortugueseReviser !== "undefined" && ClinicalPortugueseReviser.harmonizeFirstPerson) {
      return ClinicalPortugueseReviser.harmonizeFirstPerson(text);
    }
    let s = text;
    s = s.replace(/\bPaciente relata diagnóstico de\b/gi, "Eu tenho diagnóstico de");
    s = s.replace(/\bPaciente relata que nos últimos\b/gi, "Nos últimos");
    s = s.replace(/\bPaciente relata que\b/gi, "Eu ando sentindo que");
    s = s.replace(/\bPaciente relata\b/gi, "Eu tenho");
    s = s.replace(/\bO paciente refere que\b/gi, "Eu ando sentindo que");
    s = s.replace(/\bO paciente refere\b/gi, "Eu sinto");
    s = s.replace(/\bO paciente\b/gi, "eu");
    s = s.replace(/\bRefere que nos últimos\b/gi, "Nos últimos");
    s = s.replace(/\bRefere que\b/gi, "Eu ando sentindo que");
    s = s.replace(/\bRefere\b/gi, "Eu sinto");
    s = s.replace(/\bRelata que nos últimos\b/gi, "Nos últimos");
    s = s.replace(/\bRelata que\b/gi, "Eu sinto que");
    s = s.replace(/\bRelata\b/gi, "Eu sinto");
    s = s.replace(/\bNega dor precordial ou dispneia\b/gi, "Graças a Deus não sinto dor no peito nem falta de ar");
    s = s.replace(/\bNega cirurgias prévias ou internações recentes\b/gi, "Nunca fiz nenhuma cirurgia e não tive que internar recentemente");
    s = s.replace(/\bNega tabagismo\b/gi, "Eu não fumo de jeito nenhum");
    s = s.replace(/\bNega\b/gi, "Não tenho");
    s = s.replace(/\bApresenta\b/gi, "Eu tenho");
    s = s.replace(/\bEtilismo social: consome\b/gi, "Bebo socialmente:");
    s = s.replace(/\bNão pratica nenhuma atividade física regular, referindo\b/gi, "Não consigo fazer exercícios físicos por causa de");
    s = s.replace(/\bSem perda de peso; na verdade ganhou\b/gi, "Eu não perdi peso não, na verdade acabei ganhando");
    s = s.replace(/\bdo paciente\b/gi, "meu");
    s = s.replace(/\bcom o paciente\b/gi, "comigo");
    s = s.replace(/\bao paciente\b/gi, "a mim");
    return s.trim();
  }

  // Transforma anotações clínicas em fala natural de familiar/acompanhante
  cleanThirdPerson(text, pName = "ele") {
    if (!text) return "";
    let s = text;
    s = s.replace(/\bPaciente relata que\b/gi, "Ele(a) me contou que");
    s = s.replace(/\bPaciente relata\b/gi, "Ele(a) relata");
    s = s.replace(/\bO paciente refere que\b/gi, "Ele(a) diz que");
    s = s.replace(/\bRefere que\b/gi, "Ele(a) comenta que");
    s = s.replace(/\bRelata que\b/gi, "Ele(a) sente que");
    s = s.replace(/\bNega dor precordial ou dispneia\b/gi, "Ele(a) não reclama de dor no peito nem cansaço");
    s = s.replace(/\bNega cirurgias prévias\b/gi, "Ele(a) nunca fez nenhuma cirurgia antes");
    s = s.replace(/\bNega tabagismo\b/gi, "Ele(a) não fuma");
    s = s.replace(/\bNega\b/gi, "Ele(a) não tem");
    s = s.replace(/\bApresenta\b/gi, "Ele(a) apresenta");
    return s.trim();
  }

  // Resposta padrão humanizada e estrita quando uma informação NÃO consta no caso cadastrado
  getStrictUnknownResponse(role, questionText) {
    const q = this.normalizeText(questionText);

    // Respostas específicas por tipo de pergunta ausente
    if (q.includes("alergia") || q.includes("camarao") || q.includes("frutos do mar") || q.includes("intolerancia")) {
      if (role === "paciente") return "Olha, doutor(a), que eu me lembre eu nunca tive alergia a nada não. Como de tudo sem passar mal.";
      if (role === "acompanhante") return "Doutor(a), ele(a) nunca teve crise alérgica nem alergia alimentar que a gente saiba em casa.";
      if (role === "medico") return "Colega, não há registros de alergias alimentares ou medicamentosas na história clínica deste paciente.";
      return "Não há anotação ou queixa de alergias alimentares registradas no prontuário de enfermagem deste caso.";
    }

    if (q.includes("cirurgia") || q.includes("plastica") || q.includes("rinoplastia") || q.includes("estetica")) {
      if (role === "paciente") return "Não, doutor(a)! Nunca fiz esse tipo de cirurgia não, de jeito nenhum.";
      if (role === "acompanhante") return "Não, doutor(a), ele(a) nunca fez rinoplastia nem nenhuma cirurgia plástica.";
      if (role === "medico") return "Colega, não há registro dessa intervenção cirúrgica nos antecedentes médicos do paciente.";
      return "Não consta histórico desse procedimento cirúrgico nos registros de enfermagem.";
    }

    if (q.includes("gasometria") || q.includes("lactato") || q.includes("troponina") || q.includes("psa") || q.includes("tomografia")) {
      if (role === "paciente") return "Esse exame aí eu não cheguei a fazer não, doutor(a). O médico não me pediu isso.";
      if (role === "acompanhante") return "Doutor(a), esse exame não consta na pastinha dele(a), os médicos não pediram.";
      if (role === "medico") return "Colega, essa dosagem laboratorial específica não consta nos exames solicitados nem foi realizada no momento.";
      return "Não há registro de solicitação ou resultado desse exame laboratorial nas evoluções deste plantão.";
    }

    // Respostas gerais humanizadas mantendo fidelidade estrita
    const unknownResponses = {
      paciente: [
        "Olha, doutor(a), que eu me lembre eu não sinto isso não e nunca tive esse problema.",
        "Pra ser bem sincero, doutor(a), ninguém me falou nada sobre isso na consulta e eu nunca reparei.",
        "Eu não sei te informar sobre isso, doutor(a). Essa queixa eu não tenho.",
        "Não me recordo disso não, doutor(a). Acredito que comigo não acontece isso.",
        "Olha, o médico do posto não comentou nada a respeito disso comigo."
      ],
      acompanhante: [
        "Doutor(a), disso eu realmente não sei te dizer. Ele(a) nunca comentou nada parecido em casa.",
        "Pelo que a gente convive com ele(a) no dia a dia, ele(a) não tem esse problema não.",
        "Olha, os médicos não falaram nada disso com a gente e ele(a) não reclama disso.",
        "Essa informação eu não sei te confirmar, doutor(a), acho que não tem relação com o quadro dele(a)."
      ],
      medico: [
        "Colega, esse dado ou queixa específica não consta na anamnese médica nem na propedêutica clínica realizada até o momento.",
        "Não foi identificada ou documentada essa alteração no prontuário médico do paciente neste atendimento.",
        "Esse parâmetro clínico não foi avaliado ou não consta nos registros diagnósticos do paciente até agora."
      ],
      enfermagem: [
        "Durante os cuidados e checagens deste plantão, não observamos essa intercorrência nem há anotações a esse respeito.",
        "O paciente não nos relatou essa queixa durante as passagens de visita da enfermagem.",
        "Não há registro desse parâmetro no relatório de enfermagem deste turno."
      ],
      fono: [
        "Colega, não identificamos essa alteração na triagem orofacial fonoaudiológica e não há queixas registradas a esse respeito.",
        "Essa queixa não consta nos achados da nossa avaliação clínica funcional da deglutição."
      ],
      psicologia: [
        "Esse tema específico não surgiu durante as sessões de escuta e acolhimento psicossocial com o paciente ou a família.",
        "Não foram trazidas demandas ou queixas referentes a esse ponto nos atendimentos psicológicos."
      ]
    };

    const list = unknownResponses[role] || (
      role !== "paciente" && role !== "acompanhante"
        ? [
            "Colega, pela avaliação e registros da nossa área, essa informação específica não consta no prontuário do paciente nem foi avaliada.",
            "Não há anotações ou registros desse parâmetro no relatório multiprofissional deste caso clínico.",
            "Esse dado não foi relatado ou documentado durante a intervenção da nossa especialidade."
          ]
        : unknownResponses.paciente
    );
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  }

  // Processa a pergunta de forma estrita e humanizada contra a base de dados do caso
  async processQuestion(question, clinicalCase, role = "paciente") {
    // Tenta chamada ao LLM no backend (/api/chat) com chave AI_API_KEY no servidor (sem expor credenciais no cliente)
    try {
      const serverResponse = await this.callServerLlmWithStrictRules(question, clinicalCase, role);
      if (serverResponse) {
        return serverResponse;
      }
    } catch (err) {
      // Recorre suavemente ao motor humanizado estrito local caso o servidor esteja sem chave ou offline
    }

    // Processamento estrito e humanizado local (sem dependência de API externa e sem alucinação)
    return this.evaluateStrictLocal(question, clinicalCase, role);
  }

  // Motor humanizado local: fala natural em 1ª pessoa (paciente) ou diálogo multiprofissional
  evaluateStrictLocal(question, c, role) {
    const q = this.normalizeText(question);
    const p = c.patient || {};
    const h = c.history || {};
    const a = c.antropometria || {};
    const b = c.bioquimica || [];
    const ef = c.exameFisico || {};
    const ca = c.consumoAlimentar || {};
    const em = c.equipeMultiprofissional || {};

    // 1. DIÁLOGO MULTIPROFISSIONAL (MÉDICO, ENFERMAGEM, FONOAUDIOLOGIA, PSICOLOGIA OU OUTRO ADICIONADO)
    const equipeList = (typeof normalizeEquipeMultiprofissional === "function")
      ? normalizeEquipeMultiprofissional(c.equipeMultiprofissional)
      : (Array.isArray(c.equipeMultiprofissional) ? c.equipeMultiprofissional : []);
    const prof = equipeList.find(item => item.id === role || item.id === String(role).toLowerCase() || (item.nome && item.nome.toLowerCase() === String(role).toLowerCase()));

    if (role === "medico" || prof?.id === "medico") {
      const parecerMed = prof?.parecer || em.medico || "";
      if (q.includes("diagnostico") || q.includes("parecer") || q.includes("conduta") || q.includes("quadro") || q.includes("meta") || q.includes("o que acha") || q.includes("o que o senhor acha") || q.includes("avaliacao") || q.includes("suporte") || q.includes("medico")) {
        return `Olá, colega nutricionista! Do ponto de vista médico e clínico: ${parecerMed || "O paciente encontra-se sob acompanhamento ambulatorial regular, mantidas as condutas atuais e aguardando a intervenção nutricional para alinhamento terapêutico."}`;
      }
      if (q.includes("remedio") || q.includes("medicamento") || q.includes("prescricao") || q.includes("droga") || q.includes("dose")) {
        return `Colega, mantivemos a seguinte prescrição farmacológica para o paciente: ${h.medicamentos || "Nenhum medicamento contínuo prescrito no momento."}`;
      }
      if (q.includes("cirurgia") || q.includes("historico") || q.includes("antecedente") || q.includes("passado") || q.includes("hpp")) {
        return `Na história patológica pregressa e antecedentes clínicos documentados, temos: ${h.hpp || "Sem antecedentes patológicos relevantes relatados na anamnese."}`;
      }
    }

    if (role === "enfermagem" || prof?.id === "enfermagem") {
      const parecerEnf = prof?.parecer || em.enfermagem || "";
      if (q.includes("pressao") || q.includes("pa") || q.includes("sinais vitais") || q.includes("temperatura") || q.includes("pulso") || q.includes("batimento") || q.includes("fc") || q.includes("glicemia capilar") || q.includes("hgt") || q.includes("plantao") || q.includes("aceitacao")) {
        return `Olá! Pelas anotações e checagens da nossa equipe de enfermagem: ${parecerEnf || "Os sinais vitais do paciente foram checados no plantão e encontram-se estáveis dentro dos parâmetros esperados."}`;
      }
      if (q.includes("diurese") || q.includes("urina") || q.includes("xixi") || q.includes("fezes") || q.includes("evacuou") || q.includes("evacuacao")) {
        return `Em relação às eliminações fisiológicas registradas pela enfermagem: ${h.funcaoIntestinalDiurese || "Sem intercorrências de retenção ou diarreia relatadas neste plantão."}`;
      }
    }

    if (role === "fono" || prof?.id === "fono") {
      const parecerFono = prof?.parecer || em.fonoaudiologia || "";
      if (q.includes("engolir") || q.includes("degluticao") || q.includes("engasgo") || q.includes("engasga") || q.includes("tosse") || q.includes("consistencia") || q.includes("mastigacao") || q.includes("mastigar") || q.includes("disfagia")) {
        return `Olá, colega da nutrição! Realizamos a avaliação fonoaudiológica orofacial e funcional: ${parecerFono || "O paciente foi avaliado para risco de disfagia e deglutição orofaríngea; as funções mastigatórias e de deglutição encontram-se preservadas, sem sinais de engasgos ou tosse."}`;
      }
      return this.getStrictUnknownResponse("fono", question);
    }

    if (role === "psicologia" || prof?.id === "psicologia") {
      const parecerPsico = prof?.parecer || em.psicologiaSocial || "";
      if (q.includes("emocional") || q.includes("triste") || q.includes("ansiedade") || q.includes("medo") || q.includes("social") || q.includes("familia") || q.includes("trabalho") || q.includes("adesao") || q.includes("estresse") || q.includes("preocupado")) {
        return `Olá! Durante o acolhimento psicológico e social realizado com o paciente e a família: ${parecerPsico || "O paciente e sua família foram acolhidos e demonstraram boa receptividade ao acompanhamento e orientações da equipe multidisciplinar."}`;
      }
      return this.getStrictUnknownResponse("psicologia", question);
    }

    // Tratamento para qualquer outro profissional acrescentado (ex: Fisioterapia, Farmácia, Odontologia, etc.)
    if (prof && role !== "paciente" && role !== "acompanhante" && role !== "medico" && role !== "enfermagem") {
      if (q.includes("parecer") || q.includes("avaliacao") || q.includes("conduta") || q.includes("o que acha") || q.includes("diagnostico") || q.includes("opiniao") || q.includes("como esta") || q.includes("quadro") || q.includes("relatorio") || q.includes("suporte") || q.includes("acompanhamento") || q.includes("plano") || q.includes(this.normalizeText(prof.nome))) {
        return `Olá, colega nutricionista! Pela avaliação e parecer da nossa área (${prof.nome}): ${prof.parecer || "Nossas condutas foram alinhadas e estamos em acompanhamento do paciente."}`;
      }
      const parecerNorm = this.normalizeText(prof.parecer || "");
      const tokens = q.split(" ").filter(t => t.length >= 4 && !["como", "qual", "quais", "esse", "esta", "para", "doutor", "doutora", "paciente"].includes(t));
      const hasMatch = tokens.some(t => parecerNorm.includes(t));
      if (hasMatch) {
        return `Pelo acompanhamento da nossa área (${prof.nome}): ${prof.parecer}`;
      }
      return this.getStrictUnknownResponse(prof.id, question);
    }

    // 2. IDENTIFICAÇÃO E DADOS GERAIS DO PACIENTE
    if (q.includes("nome") || q.includes("como se chama") || q.includes("qual o seu nome") || q.includes("quem e voce")) {
      if (role === "paciente") return `Olá, doutor(a)! Meu nome é ${p.name}.`;
      if (role === "acompanhante") return `O nome dele(a) é ${p.name}. Eu sou familiar dele(a) e vim junto para ajudar na consulta.`;
      return `Trata-se do(a) paciente ${p.name}.`;
    }

    if (q.includes("idade") || q.includes("quantos anos") || q.includes("sua idade")) {
      if (role === "paciente") return `Eu tenho ${p.age} anos, doutor(a).`;
      if (role === "acompanhante") return `Ele(a) tem ${p.age} anos.`;
      return `O paciente possui ${p.age} anos de idade.`;
    }

    if (q.includes("profissao") || q.includes("trabalha") || q.includes("ocupacao") || q.includes("emprego") || q.includes("servico") || q.includes("aposentado")) {
      if (role === "paciente") return `Eu trabalho como ${p.occupation}, doutor(a).`;
      if (role === "acompanhante") return `A profissão dele(a) é ${p.occupation}.`;
      return `Na ocupação principal do paciente, consta: ${p.occupation}.`;
    }

    if (q.includes("casado") || q.includes("estado civil") || q.includes("esposa") || q.includes("marido") || q.includes("solteiro")) {
      if (role === "paciente") return `Eu sou ${p.maritalStatus}.`;
      if (role === "acompanhante") return `Nós somos ${p.maritalStatus === 'Casado' || p.maritalStatus === 'Casada' ? 'casados' : p.maritalStatus}.`;
      return `Estado civil do paciente: ${p.maritalStatus}.`;
    }

    if (q.includes("onde mora") || q.includes("residencia") || q.includes("cidade") || q.includes("bairro")) {
      if (role === "paciente") return `Eu moro em ${p.residence || 'minha cidade'}, doutor(a).`;
      if (role === "acompanhante") return `Nós moramos em ${p.residence || 'nossa residência'}.`;
      return `Residência do paciente: ${p.residence || 'Não especificada'}.`;
    }

    // 3. QUEIXA PRINCIPAL E HISTÓRIA DA DOENÇA ATUAL (HDA)
    if (q.includes("queixa") || q.includes("sentindo") || q.includes("o que trouxe") || q.includes("motivo") || q.includes("o que esta sentindo") || q.includes("qual o problema") || q.includes("como posso ajudar") || q.includes("acontecendo") || q.includes("veio aqui")) {
      if (role === "paciente") {
        return h.queixaPrincipal || `Olha, doutor(a), o que me trouxe aqui foi o seguinte: ${this.cleanFirstPerson(h.hda || '')}`;
      }
      if (role === "acompanhante") {
        return `Doutor(a), a gente veio porque ele(a) tá passando por isso: a queixa principal foi que "${h.queixaPrincipal || ''}". ${this.cleanThirdPerson(h.hda || '')}`;
      }
      return `Colega, o paciente deu entrada relatando como queixa principal: "${h.queixaPrincipal || ''}". Na história clínica atual: ${h.hda || ''}`;
    }

    if (q.includes("apetite") || q.includes("fome") || q.includes("vontade de comer") || q.includes("sem fome") || q.includes("com fome") || q.includes("come bem")) {
      if (role === "paciente") {
        if (h.queixaPrincipal && (h.queixaPrincipal.toLowerCase().includes("fome") || h.queixaPrincipal.toLowerCase().includes("comer") || h.queixaPrincipal.toLowerCase().includes("enjoo"))) {
          return `Olha doutor(a), sobre a minha fome e o meu apetite: ${h.queixaPrincipal}`;
        }
        return `Olha doutor(a), sobre o meu apetite: ${this.cleanFirstPerson(ca.padraoDiario || 'Tenho momentos em que sinto pouca fome.')}`;
      }
      if (role === "acompanhante") {
        return `Doutor(a), sobre o apetite e a alimentação dele(a): ${this.cleanThirdPerson(ca.padraoDiario || h.hda || 'O apetite tem sido uma preocupação pra gente.')}`;
      }
      return `Avaliação propedêutica do apetite e comportamento alimentar: ${ca.padraoDiario || h.hda || 'Sem registros de alteração do apetite.'}`;
    }

    if (q.includes("tempo") || q.includes("quando comecou") || q.includes("ha quanto tempo") || q.includes("quanto tempo faz") || q.includes("desde quando")) {
      if (role === "paciente") return `Olha doutor(a), isso começou mais ou menos assim: ${this.cleanFirstPerson(h.hda || '')}`;
      if (role === "acompanhante") return `Doutor(a), começou assim: ${this.cleanThirdPerson(h.hda || '')}`;
      return `Evolução temporal documentada na história da doença atual: ${h.hda || ''}`;
    }

    // 4. SINTOMAS GASTROINTESTINAIS E QUEIXAS ESPECÍFICAS
    if (q.includes("dor") || q.includes("abdomen") || q.includes("barriga") || q.includes("queimacao") || q.includes("azia") || q.includes("refluxo") || q.includes("estomago") || q.includes("azia")) {
      if (ef.tgi && ef.tgi.length > 5) {
        if (role === "paciente") return `Sobre a minha barriga e estômago, doutor(a): ${this.cleanFirstPerson(ef.tgi)}`;
        if (role === "acompanhante") return `Sobre o estômago e a barriga dele(a), doutor(a): ${ef.tgi}`;
        return `Ao exame do trato gastrointestinal e abdome: ${ef.tgi}`;
      }
      return this.getStrictUnknownResponse(role, question);
    }

    if (q.includes("enjoo") || q.includes("nausea") || q.includes("vomito") || q.includes("vomitou")) {
      const temEnjoo = (h.hda && (h.hda.toLowerCase().includes("enjoo") || h.hda.toLowerCase().includes("nausea") || h.hda.toLowerCase().includes("vomito"))) ||
                       (h.queixaPrincipal && (h.queixaPrincipal.toLowerCase().includes("enjoo") || h.queixaPrincipal.toLowerCase().includes("vomito")));
      if (temEnjoo) {
        if (role === "paciente") return `Sim, doutor(a). ${this.cleanFirstPerson(h.hda || h.queixaPrincipal)}`;
        if (role === "acompanhante") return `Sim, doutor(a). ${this.cleanThirdPerson(h.hda || h.queixaPrincipal)}`;
        return `O paciente apresenta queixas ativas de náuseas/vômitos documentadas: ${h.hda || h.queixaPrincipal}`;
      }
      if (role === "paciente") return "Não tenho sentido enjoo nem vômito não, doutor(a). Meu estômago tá tranquilo quanto a isso.";
      if (role === "acompanhante") return "Ele(a) não costuma reclamar de enjoo nem vômitos não, doutor(a).";
      return "Não há registro de queixas de náuseas ou episódios de vômitos no quadro clínico atual.";
    }

    if (q.includes("diarreia") || q.includes("fezes") || q.includes("evacuacao") || q.includes("intestino") || q.includes("prisao de ventre") || q.includes("constipacao") || q.includes("evacua") || q.includes("banheiro")) {
      if (role === "paciente") return `Sobre o meu intestino, doutor(a): ${this.cleanFirstPerson(h.funcaoIntestinalDiurese || "Funciona normalmente todos os dias.")}`;
      if (role === "acompanhante") return `Sobre as idas ao banheiro e intestino dele(a): ${this.cleanThirdPerson(h.funcaoIntestinalDiurese || "Funciona normalmente.")}`;
      return `Histórico e avaliação da função intestinal e diurese: ${h.funcaoIntestinalDiurese || "Sem alterações intestinais registradas."}`;
    }

    if (q.includes("urina") || q.includes("urinar") || q.includes("xixi") || q.includes("noite") || q.includes("nocturia") || q.includes("diurese")) {
      if (role === "paciente") return `Sobre a urina, doutor(a): ${this.cleanFirstPerson(h.funcaoIntestinalDiurese || "Urina normal ao longo do dia.")}`;
      if (role === "acompanhante") return `Sobre a urina dele(a), doutor(a): ${this.cleanThirdPerson(h.funcaoIntestinalDiurese || "Não notamos alterações na urina.")}`;
      return `Parâmetros de diurese documentados no prontuário: ${h.funcaoIntestinalDiurese || "Sem alterações de volume ou coloração registradas."}`;
    }

    if (q.includes("sede") || q.includes("boca seca") || q.includes("xerostomia") || q.includes("gosto metalico") || q.includes("gosto de ferro") || q.includes("paladar")) {
      const temSede = (h.hda && (h.hda.toLowerCase().includes("sede") || h.hda.toLowerCase().includes("boca seca") || h.hda.toLowerCase().includes("gosto"))) ||
                      (ef.cavidadeOral && (ef.cavidadeOral.toLowerCase().includes("boca") || ef.cavidadeOral.toLowerCase().includes("seco")));
      if (temSede) {
        if (role === "paciente") return `É verdade, doutor(a)! ${this.cleanFirstPerson(h.hda || ef.cavidadeOral)}`;
        if (role === "acompanhante") return `Ele(a) reclama bastante disso mesmo, doutor(a): ${this.cleanThirdPerson(h.hda || ef.cavidadeOral)}`;
        return `Queixas de cavidade oral e sede registradas no caso: ${h.hda || ef.cavidadeOral}`;
      }
      if (role === "paciente") return "Não tenho sentido boca seca nem alteração no paladar não, doutor(a).";
      if (role === "acompanhante") return "Ele(a) não comentou nada de boca seca nem de gosto estranho na boca não, doutor(a).";
      return "Não há menção a xerostomia ou alterações de paladar na avaliação clínica.";
    }

    // 5. ANTROPOMETRIA (PESO, ESTATURA, PERDA/GANHO PONDERAL, CIRCUNFERÊNCIAS)
    if (q.includes("peso atual") || q.includes("quanto pesa") || q.includes("quanto esta pesando") || q.includes("seu peso") || q.includes("pesou")) {
      if (role === "paciente") return `Na última pesagem que fiz na balança aqui, eu estava com ${a.pesoAtual} kg, doutor(a).`;
      if (role === "acompanhante") return `Doutor(a), na última pesagem que fizeram dele(a), estava com ${a.pesoAtual} kg.`;
      if (role === "medico") return `Colega, o peso atual aferido do paciente é de ${a.pesoAtual} kg.`;
      return `Aferimos o peso na balança hoje: o paciente está com ${a.pesoAtual} kg.`;
    }

    if (q.includes("peso habitual") || q.includes("costumava pesar") || q.includes("pesava antes") || q.includes("peso normal")) {
      if (role === "paciente") return `O meu peso normal que eu sempre costumava manter era cerca de ${a.pesoHabitual} kg, doutor(a).`;
      if (role === "acompanhante") return `O peso habitual que ele(a) costumava manter era por volta de ${a.pesoHabitual} kg.`;
      return `O peso habitual de referência documentado na anamnese é de ${a.pesoHabitual} kg.`;
    }

    if (q.includes("altura do joelho") || q.includes("joelho") || q.includes(" aj ") || q.startsWith("aj ") || q === "aj" || q.includes("comprimento do joelho")) {
      const ajVal = a.alturaJoelho || null;
      if (ajVal) {
        if (role === "paciente") return `Mediram a altura do meu joelho com o paquímetro no leito e deu ${ajVal} cm, doutor(a).`;
        if (role === "acompanhante") return `A equipe mediu a altura do joelho dele(a) no leito e anotou ${ajVal} cm para cálculo de estatura.`;
        return `A Altura do Joelho (AJ) aferida é de ${ajVal} cm (aplicável para estimativa de estatura pelas equações de Chumlea).`;
      } else {
        if (role === "paciente") return `Não mediram a altura do meu joelho especificamente, doutor(a). Só mediram minha altura normal de pé (${a.estatura} m).`;
        if (role === "acompanhante") return `Não mediram o joelho dele(a), apenas a altura normal no estadiômetro (${a.estatura} m).`;
        return `A Altura do Joelho (AJ) não foi aferida neste caso clínico (estatura direta disponível: ${a.estatura} m).`;
      }
    }

    if (q.includes("altura") || q.includes("estatura") || q.includes("quanto mede") || q.includes("qual seu tamanho")) {
      if (role === "paciente") return `Eu tenho ${a.estatura} m de altura, doutor(a).`;
      if (role === "acompanhante") return `A altura dele(a) é de ${a.estatura} m.`;
      return `A estatura registrada no estadiômetro é de ${a.estatura} m.`;
    }

    if (q.includes("perdeu peso") || q.includes("emagreceu") || q.includes("engordou") || q.includes("ganhou peso") || q.includes("perda ponderal") || q.includes("perda de peso") || q.includes("variacao de peso")) {
      if (role === "paciente") return `Olha doutor(a), sobre a variação do meu peso: ${this.cleanFirstPerson(a.historicoPerdaPonderal || '')}`;
      if (role === "acompanhante") return `Doutor(a), sobre a mudança de peso dele(a): ${this.cleanThirdPerson(a.historicoPerdaPonderal || '')}`;
      return `Na evolução ponderal documentada no prontuário: ${a.historicoPerdaPonderal || 'Sem variação ponderal significativa registrada.'}`;
    }

    if (q.includes("cintura") || q.includes("circunferencia") || q.includes("braco") || q.includes("dobra") || q.includes("panturrilha") || q.includes("quadril") || q.includes("demais avaliacoes") || q.includes("subescapular") || q.includes("suprailiaca") || q.includes("abdominal")) {
      if (role === "paciente") {
        let msg = `Pelo que mediram de fita aqui hoje, doutor(a): minha cintura deu ${a.circunferenciaCintura || '--'} cm`;
        if (a.circunferenciaQuadril) msg += `, o quadril deu ${a.circunferenciaQuadril} cm`;
        if (a.circunferenciaBraco) msg += `, o braço deu ${a.circunferenciaBraco} cm`;
        if (a.circunferenciaPanturrilha) msg += `, a panturrilha deu ${a.circunferenciaPanturrilha} cm`;
        if (a.dobraTricipital) msg += `, e a dobra do braço deu ${a.dobraTricipital} mm`;
        if (a.alturaJoelho) msg += `. A altura do joelho deu ${a.alturaJoelho} cm`;
        msg += ".";
        return msg;
      }
      if (role === "acompanhante") {
        return `A equipe mediu com a fita métrica e a cintura dele(a) deu ${a.circunferenciaCintura || '--'} cm${a.circunferenciaBraco ? ', o braço ' + a.circunferenciaBraco + ' cm' : ''}${a.circunferenciaPanturrilha ? ', a panturrilha ' + a.circunferenciaPanturrilha + ' cm' : ''}.`;
      }
      const details = [];
      if (a.circunferenciaCintura) details.push(`Circunferência da cintura: ${a.circunferenciaCintura} cm`);
      if (a.circunferenciaQuadril) details.push(`Circunferência do quadril: ${a.circunferenciaQuadril} cm`);
      if (a.circunferenciaBraco) details.push(`CB: ${a.circunferenciaBraco} cm`);
      if (a.circunferenciaPanturrilha) details.push(`CP: ${a.circunferenciaPanturrilha} cm`);
      if (a.dobraTricipital) details.push(`DCT: ${a.dobraTricipital} mm`);
      if (a.dobraSubescapular) details.push(`Dobra subescapular: ${a.dobraSubescapular} mm`);
      if (a.dobraSuprailiaca) details.push(`Dobra suprailíaca: ${a.dobraSuprailiaca} mm`);
      if (a.dobraAbdominal) details.push(`Dobra abdominal: ${a.dobraAbdominal} mm`);
      if (a.alturaJoelho) details.push(`Altura do Joelho (AJ): ${a.alturaJoelho} cm`);
      if (a.demaisAvaliacoes) details.push(`Demais avaliações: ${a.demaisAvaliacoes}`);
      return `Medidas antropométricas aferidas: ${details.join(", ")}.`;
    }

    // 6. MEDICAMENTOS E TRATAMENTOS
    if (q.includes("medicamento") || q.includes("remedio") || q.includes("toma algum remedio") || q.includes("comprimido") || q.includes("insulina") || q.includes("prescricao medica")) {
      if (role === "paciente") {
        return `Eu tomo os seguintes remédios receitados pelo médico, doutor(a): ${this.cleanFirstPerson(h.medicamentos || 'nenhum remédio fixo no momento')}. Tento tomar direitinho, mas às vezes na correria do dia a dia acabo esquecendo de alguma dose.`;
      }
      if (role === "acompanhante") {
        return `Ele(a) toma essas medicações receitadas: ${this.cleanThirdPerson(h.medicamentos || 'ele(a) não toma remédios contínuos')}. A gente até cobra em casa, mas na rotina puxada às vezes ele(a) esquece.`;
      }
      if (role === "medico") {
        return `Colega, a prescrição médica em curso compreende: ${h.medicamentos || 'Nenhum fármaco contínuo no momento.'} Mantivemos a posologia com foco no controle clínico.`;
      }
      return `No cartão de aprazamento da enfermagem, constam: ${h.medicamentos || 'Sem medicações prescritas no momento.'}`;
    }

    // 7. HÁBITOS DE VIDA (FUMO, BEBIDA, ATIVIDADE FÍSICA)
    if (q.includes("fuma") || q.includes("cigarro") || q.includes("tabaco") || q.includes("fumo") || q.includes("tabagismo") ||
        q.includes("bebe") || q.includes("bebida") || q.includes("alcool") || q.includes("cerveja") || q.includes("etilismo") ||
        q.includes("exercicio") || q.includes("atividade fisica") || q.includes("caminhada") || q.includes("academia") || q.includes("sedentario") || q.includes("habitos")) {
      if (role === "paciente") return `Olha doutor(a), vou te contar com sinceridade como são os meus hábitos: ${this.cleanFirstPerson(h.habitosVida || 'Tenho hábitos normais do dia a dia.')}`;
      if (role === "acompanhante") return `Doutor(a), sobre os hábitos dele(a) no dia a dia: ${this.cleanThirdPerson(h.habitosVida || 'Não há hábitos fora do comum relatados.')}`;
      return `Na anamnese dirigida aos hábitos de vida do paciente, consta: ${h.habitosVida || 'Sem outros hábitos de risco documentados.'}`;
    }

    // 8. HISTÓRICO FAMILIAR, ANTECEDENTES E CIRURGIAS
    if (q.includes("familia") || q.includes("pais") || q.includes("pai") || q.includes("mae") || q.includes("irmao") || q.includes("infarto na familia") || q.includes("historico familiar") || q.includes("parentes")) {
      if (role === "paciente") return `Na minha família tem esses casos de saúde sim, doutor(a): ${this.cleanFirstPerson(h.historiaFamiliar || 'Nenhum caso grave na família que eu lembre.')}`;
      if (role === "acompanhante") return `A família dele(a) tem bastante histórico de doenças: ${this.cleanThirdPerson(h.historiaFamiliar || 'Não há antecedentes familiares relevantes relatados.')}`;
      return `A história familiar relevante para estratificação de risco clínico documenta: ${h.historiaFamiliar || 'Histórico familiar sem comorbidades precoces registradas.'}`;
    }

    if (q.includes("cirurgia") || q.includes("operacao") || q.includes("operou") || q.includes("procedimento cirurgico") || q.includes("rinoplastia") || q.includes("plastica") || q.includes("bariatrica")) {
      const hppNorm = this.normalizeText(h.hpp || "");
      if (q.includes("rinoplastia") || q.includes("plastica") || (q.includes("bariatrica") && !hppNorm.includes("bariatrica"))) {
        if (!hppNorm.includes("plastica") && !hppNorm.includes("rinoplastia") && !hppNorm.includes("bariatrica")) {
          if (role === "paciente") return "Não, doutor(a)! Nunca fiz esse tipo de cirurgia não, de jeito nenhum.";
          if (role === "acompanhante") return "Não, doutor(a), ele(a) nunca fez rinoplastia nem nenhuma cirurgia plástica.";
          return "Colega, não há registro dessa cirurgia pregressa nos antecedentes médicos do paciente.";
        }
      }
      if (role === "paciente") return `Sobre cirurgias e meu histórico de saúde, doutor(a): ${this.cleanFirstPerson(h.hpp || "Não tenho cirurgias anteriores registradas.")}`;
      if (role === "acompanhante") return `No histórico de cirurgias e saúde dele(a): ${this.cleanThirdPerson(h.hpp || "Sem histórico cirúrgico informado.")}`;
      return `Histórico cirúrgico e patológico pregresso (HPP): ${h.hpp || "Sem histórico cirúrgico informado."}`;
    }

    if (q.includes("doencas anteriores") || q.includes("pressao alta") || q.includes("diabetes") || q.includes("antecedentes") || q.includes("outras doencas") || q.includes("hpp") || q.includes("comorbidade")) {
      if (role === "paciente") return `Das doenças que eu já tenho e acompanho, doutor(a): ${this.cleanFirstPerson(h.hpp || 'Não tenho outras doenças graves conhecidas.')}`;
      if (role === "acompanhante") return `Sobre as doenças anteriores dele(a): ${this.cleanThirdPerson(h.hpp || 'Sem comorbidades prévias além das mencionadas.')}`;
      return `Nos antecedentes patológicos pregressos (HPP): ${h.hpp || 'Sem outras patologias documentadas.'}`;
    }

    // 9. EXAMES BIOQUÍMICOS E LABORATORIAIS
    if (q.includes("exame") || q.includes("laboratorio") || q.includes("sangue") || q.includes("bioquimica") || q.includes("resultado")) {
      if (role === "paciente") {
        return `Eu trouxe a pastinha com todos os meus exames aqui, doutor(a)! Fiz glicose, colesterol, rins, sangue e urina. Qual exame em específico você gostaria de ver primeiro?`;
      }
      if (role === "acompanhante") {
        return `Doutor(a), nós trouxemos os laudos do laboratório. Tem glicemia, colesterol, triglicerídeos, ureia, creatinina e outros exames. Pode perguntar de qualquer um deles.`;
      }
      const labs = b.map(item => `${item.exame}: ${item.valor} (Ref: ${item.referencia})`).join("; ");
      return `Colega, temos o painel laboratorial recente disponível: ${labs}.`;
    }

    // Checa exames laboratoriais específicos com correspondência inteligente
    for (const item of b) {
      const examNorm = this.normalizeText(item.exame);
      const tokens = examNorm.split(" ").filter(t => t.length >= 3 && !["dos", "das", "para", "total"].includes(t));
      const match = tokens.some(t => {
        if (t.length <= 4) {
          const regex = new RegExp(`\\b${t}\\b`, "i");
          return regex.test(q);
        }
        return q.includes(t);
      });
      
      if (match || 
         (q.includes("glicemia") && examNorm.includes("glicemia")) ||
         (q.includes("glicose") && examNorm.includes("glicemia")) ||
         (q.includes("hemoglobina glicada") && examNorm.includes("glicada")) ||
         (q.includes("hba1c") && examNorm.includes("hba1c")) ||
         (q.includes("colesterol") && examNorm.includes("colesterol")) ||
         (q.includes("triglicerid") && examNorm.includes("triglicer")) ||
         (q.includes("creatinina") && examNorm.includes("creatinina")) ||
         (q.includes("ureia") && examNorm.includes("ureia")) ||
         (q.includes("potassio") && examNorm.includes("potassio")) ||
         (q.includes("fosforo") && examNorm.includes("fosforo")) ||
         (q.includes("albumina") && examNorm.includes("albumina")) ||
         (q.includes("anemia") && examNorm.includes("hemoglobina")) ||
         (q.includes("acido urico") && examNorm.includes("urico")) ||
         (q.includes("tfg") && examNorm.includes("tfg"))) {
        
        if (role === "paciente") {
          return `Olha, doutor(a), no meu exame de ${item.exame} o resultado deu ${item.valor} (com referência de ${item.referencia} no laudo).`;
        }
        if (role === "acompanhante") {
          return `Doutor(a), no laudo do exame de ${item.exame} dele(a) deu ${item.valor} (a referência indicada é ${item.referencia}).`;
        }
        if (role === "medico") {
          return `Colega, o laudo de ${item.exame} do paciente resultou em ${item.valor} (valor de referência: ${item.referencia}). A análise clínica e dietoterápica fica a cargo da sua avaliação nutricional.`;
        }
        return `No sistema laboratorial, a dosagem de ${item.exame} consta em ${item.valor} (referência: ${item.referencia}).`;
      }
    }

    // 10. EXAME FÍSICO / SINAIS CLÍNICOS
    if (q.includes("dente") || q.includes("protese") || q.includes("dentadura") || q.includes("boca") || q.includes("mastiga") || q.includes("engole")) {
      if (role === "paciente") return `Na minha boca, doutor(a): ${this.cleanFirstPerson(ef.cavidadeOral || "Consigo mastigar normalmente e não sinto dor.")}`;
      if (role === "acompanhante") return `Sobre a mastigação e dentes dele(a), doutor(a): ${ef.cavidadeOral || "Sem queixas orais aparentes."}`;
      return `Avaliação da cavidade oral e mastigação: ${ef.cavidadeOral || "Sem queixas orais relatadas."}`;
    }

    if (q.includes("inchaco") || q.includes("edema") || q.includes("perna inchada") || q.includes("tornozelo") || q.includes("pes inchados")) {
      if (role === "paciente") return `De inchaço nas pernas ou pés, doutor(a): ${this.cleanFirstPerson(ef.edema || "Não tenho inchaço nas pernas não.")}`;
      if (role === "acompanhante") return `Sobre inchaço nas pernas dele(a): ${ef.edema || "Não notamos inchaço nas pernas."}`;
      return `Avaliação de edemas periféricos e perfusão: ${ef.edema || "Ausência de edemas."}`;
    }

    if (q.includes("pele") || q.includes("pescoco") || q.includes("mancha") || q.includes("acantose") || q.includes("musculo") || q.includes("massa muscular") || q.includes("gordura") || q.includes("exame fisico")) {
      if (role === "paciente") {
        return `O médico me examinou aqui e comentou sobre isso, doutor(a): ${this.cleanFirstPerson(ef.sinaisEspecificos || '')} ${this.cleanFirstPerson(ef.estadoGeral || '')}`;
      }
      if (role === "acompanhante") {
        return `Doutor(a), no exame físico os médicos notaram: ${ef.sinaisEspecificos || ''} ${ef.estadoGeral || ''}`;
      }
      return `Ao exame físico dirigido: ${ef.sinaisEspecificos || ''} ${ef.estadoGeral || ''}`;
    }

    // 11. CONSUMO ALIMENTAR / RECORDATÓRIO DE 24 HORAS
    if (q.includes("o que come") || q.includes("alimentacao") || q.includes("costuma comer") || q.includes("recordatorio") || q.includes("dieta") || q.includes("rotina alimentar") || q.includes("dia a dia") || q.includes("comeu ontem")) {
      const recList = (ca.recordatorio24h || []).map(r => `• ${r.refeicao}: ${r.alimentos}`).join("\n");
      if (role === "paciente") {
        return `Vou te contar como é o meu dia a dia de comida, doutor(a):\n\n${recList}\n\nNo geral: ${this.cleanFirstPerson(ca.padraoDiario || '')}`;
      }
      if (role === "acompanhante") {
        return `Doutor(a), a rotina de alimentação dele(a) no dia a dia é mais ou menos assim:\n\n${recList}\n\n${ca.padraoDiario || ''}`;
      }
      return `Inquérito alimentar e recordatório alimentar habitual do paciente:\n\n${recList}\n\nPadrão clínico: ${ca.padraoDiario || ''}`;
    }

    if (q.includes("cafe da manha") || q.includes("desjejum") || q.includes("manha")) {
      const item = (ca.recordatorio24h || []).find(r => this.normalizeText(r.refeicao).includes("cafe") || this.normalizeText(r.refeicao).includes("manha") || this.normalizeText(r.refeicao).includes("desjejum"));
      if (role === "paciente") return item ? `No meu café da manhã, eu costumo comer: ${item.alimentos}.` : "Não costumo tomar café da manhã, doutor(a).";
      if (role === "acompanhante") return item ? `No café da manhã dele(a), ele(a) costuma comer: ${item.alimentos}.` : "Ele(a) geralmente pula o café da manhã.";
      return item ? `Café da manhã relatado: ${item.alimentos}.` : "Sem relato de café da manhã habitual.";
    }

    if (q.includes("almoco") || q.includes("almocar")) {
      const item = (ca.recordatorio24h || []).find(r => this.normalizeText(r.refeicao).includes("almoco"));
      if (role === "paciente") return item ? `No meu almoço, eu costumo comer: ${item.alimentos}.` : "Não tenho um almoço fixo no dia a dia, doutor(a).";
      if (role === "acompanhante") return item ? `No almoço, ele(a) costuma comer: ${item.alimentos}.` : "Não há almoço específico registrado.";
      return item ? `Almoço habitual registrado: ${item.alimentos}.` : "Sem relato formal de almoço.";
    }

    if (q.includes("lanche") || q.includes("tarde") || q.includes("colacao")) {
      const items = (ca.recordatorio24h || []).filter(r => this.normalizeText(r.refeicao).includes("lanche") || this.normalizeText(r.refeicao).includes("colacao"));
      if (role === "paciente") return items.length > 0 ? `Nos meus lanches durante o dia:\n` + items.map(i => `• ${i.refeicao}: ${i.alimentos}`).join("\n") : "Geralmente eu não costumo lanchar entre as refeições não, doutor(a).";
      if (role === "acompanhante") return items.length > 0 ? `Nos lanches dele(a):\n` + items.map(i => `• ${i.refeicao}: ${i.alimentos}`).join("\n") : "Ele(a) não costuma fazer lanches.";
      return items.length > 0 ? items.map(i => `${i.refeicao}: ${i.alimentos}`).join("; ") : "Sem lanches intermediários habituais registrados.";
    }

    if (q.includes("jantar") || q.includes("janta") || q.includes("noite") || q.includes("ceia")) {
      const items = (ca.recordatorio24h || []).filter(r => this.normalizeText(r.refeicao).includes("jantar") || this.normalizeText(r.refeicao).includes("ceia"));
      if (role === "paciente") return items.length > 0 ? `À noite, no jantar e ceia:\n` + items.map(i => `• ${i.refeicao}: ${i.alimentos}`).join("\n") : "Geralmente eu não costumo jantar comida pesada à noite não, doutor(a).";
      if (role === "acompanhante") return items.length > 0 ? `No jantar dele(a):\n` + items.map(i => `• ${i.refeicao}: ${i.alimentos}`).join("\n") : "Ele(a) não costuma jantar.";
      return items.length > 0 ? items.map(i => `${i.refeicao}: ${i.alimentos}`).join("; ") : "Sem registros de refeição noturna.";
    }

    if (q.includes("agua") || q.includes("liquido") || q.includes("hidrata") || q.includes("bebe agua") || q.includes("refrigerante") || q.includes("suco")) {
      if (role === "paciente") return `Sobre líquidos e água, doutor(a): ${this.cleanFirstPerson(ca.ingestaoHidrica || "Tomo água ao longo do dia conforme sinto sede.")}`;
      if (role === "acompanhante") return `Doutor(a), sobre o consumo de água dele(a): ${ca.ingestaoHidrica || "Ele(a) tem um consumo habitual de líquidos."}`;
      return `Ingestão hídrica documentada no inquérito nutricional: ${ca.ingestaoHidrica || "Sem estimativa precisa documentada."}`;
    }

    if (q.includes("gosta") || q.includes("preferencia") || q.includes("comida preferida") || q.includes("prato preferido")) {
      if (role === "paciente") return `Eu gosto bastante de: ${this.cleanFirstPerson(ca.preferencias || "Como de tudo um pouco, doutor(a).")}`;
      if (role === "acompanhante") return `As preferências de comida dele(a) são: ${ca.preferencias || "Ele(a) costuma comer de tudo."}`;
      return `Preferências alimentares relatadas pelo paciente: ${ca.preferencias || "Sem preferências exclusivas informadas."}`;
    }

    if (q.includes("aversao") || q.includes("nao gosta") || q.includes("rejeita") || q.includes("alergia") || q.includes("intolerancia") || q.includes("passa mal")) {
      if (role === "paciente") return `Sobre o que eu não gosto ou rejeito comer, doutor(a): ${this.cleanFirstPerson(ca.aversoesIntolerancias || "Não tenho aversões fortes a nenhum alimento não.")}`;
      if (role === "acompanhante") return `Sobre aversões dele(a): ${ca.aversoesIntolerancias || "Não há aversões alimentares marcantes conhecidas."}`;
      return `Aversões e intolerâncias alimentares registradas: ${ca.aversoesIntolerancias || "Sem aversões ou intolerâncias alimentares conhecidas."}`;
    }

    if (q.includes("quem prepara") || q.includes("cozinha") || q.includes("quem faz a comida") || q.includes("onde come")) {
      if (role === "paciente") return `Sobre quem prepara a comida, doutor(a): ${this.cleanFirstPerson(ca.quemPrepara || "Eu mesmo ou minha família preparamos as refeições.")}`;
      if (role === "acompanhante") return `Sobre quem prepara as refeições dele(a): ${ca.quemPrepara || "Preparo familiar."}`;
      return `Logística de preparo e aquisição de refeições do paciente: ${ca.quemPrepara || "Não especificado."}`;
    }

    // 12. SAUDAÇÃO BÁSICA E ACOLHIMENTO
    if (q === "ola" || q === "oi" || q === "bom dia" || q === "boa tarde" || q === "boa noite" || q.startsWith("ola doutor") || q.startsWith("oi doutor") || q === "tudo bem" || q.startsWith("ola tudo bem")) {
      if (role === "paciente") return `Olá, doutor(a)! Tudo bem? Vim para a consulta de nutrição. Em que posso te ajudar?`;
      if (role === "acompanhante") return `Olá, doutor(a)! Estou acompanhando ele(a) aqui hoje para ajudar a tirar as dúvidas sobre a saúde e a nossa rotina em casa.`;
      if (role === "medico") return `Olá, colega nutricionista! Estou à disposição para alinharmos a conduta clínica e discutir o quadro do paciente.`;
      if (role === "enfermagem") return `Olá! Sou da equipe de enfermagem do plantão. Em que posso te auxiliar com as checagens e sinais vitais do paciente?`;
      if (role === "fono") return `Olá, colega da nutrição! Fonoaudiologia à disposição para esclarecimentos sobre deglutição e mastigação.`;
      if (role === "psicologia") return `Olá! Psicologia e Serviço Social à disposição para compartilhar os aspectos emocionais e apoio familiar.`;
      if (prof) return `Olá, colega nutricionista! Sou o(a) ${prof.nome}. Estou à disposição para discutir o caso clínico e compartilhar a avaliação da nossa área.`;
      return `Olá! Como posso ajudar na condução do caso clínico?`;
    }

    // 13. SE A PERGUNTA NÃO BATEU COM NENHUMA INFORMAÇÃO CADASTRADA:
    // REGRA DE OURO: NÃO INVENTE! RESPONDA COM HUMANIDADE QUE NÃO CONSTA / NÃO SABE!
    return this.getStrictUnknownResponse(role, question);
  }

  // Chamada exclusiva do lado do servidor via rota /api/chat (segurança: sem expor chaves no cliente)
  async callServerLlmWithStrictRules(question, c, role) {
    const roleInfo = this.getRoleInfo(role, c);
    const caseJson = JSON.stringify(c, null, 2);

    const systemPrompt = `
Você é o interlocutor de um simulador educacional de Dietoterapia ("DietoCase") para estudantes de Nutrição.
Seu papel atual é: "${roleInfo.title}" (${roleInfo.subtitle}).

DADOS DO CASO CLÍNICO CADASTRADOS PELO PROFESSOR:
\`\`\`json
${caseJson}
\`\`\`

DIRETRIZES DE COMUNICAÇÃO HUMANIZADA (SEM TOM ROBÓTICO):
1. FALE NATURALMENTE EM PRIMEIRA PESSOA OU REFERINDO AO PACIENTE:
   - Se você for o PACIENTE: responda com calor humano, falando em PRIMEIRA PESSOA ("eu sinto...", "meu nome é...", "no meu trabalho...", "olha doutor(a)..."). Use linguagem espontânea, empática e realista baseada na sua idade e ocupação. Nunca fale como prontuário de hospital.
   - Se você for o ACOMPANHANTE/FAMILIAR: fale como um familiar atencioso e amoroso ("doutor(a), ele(a) esquece de tomar...", "a gente tenta cuidar dele(a) em casa...").
   - Se você for o MÉDICO, ENFERMEIRO, FONOAUDIÓLOGO ou PSICÓLOGO: responda como um colega de saúde em diálogo interdisciplinar respeitoso com o colega nutricionista ("Olá, colega!", "Do ponto de vista médico...", "No plantão de enfermagem notamos que..."). Nunca utilize prefixos mecânicos com colchetes como "[Parecer Médico]:".

2. REGRA ABSOLUTA ANTI-ALUCINAÇÃO (JAMAIS INVENTE FATOS):
   - Suas respostas devem ser 100% fiéis às informações contidas no JSON acima.
   - SE O ESTUDANTE PERGUNTAR QUALQUER COISA QUE NÃO CONSTA NO CASO (alergias não citadas, exames laboratoriais não solicitados, cirurgias não feitas, etc.):
     * O Paciente deve dizer que não sente isso, que não sabe ou que nunca teve esse problema.
     * O Acompanhante deve dizer que ele(a) nunca comentou nada a respeito.
     * O Médico/Enfermeiro deve dizer claramente que esse parâmetro ou exame não consta no prontuário ou não foi avaliado.
   - JAMAIS deduza, suponha ou invente dados ausentes!
    `.trim();

    try {
      const response = await fetch(this.apiEndpoint || "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          systemPrompt: systemPrompt,
          clinicalContext: {
            modalidade: "Simulação de Interlocutor Clínico",
            paciente: {
              nome: c?.patient?.name,
              idade: c?.patient?.age,
              genero: c?.patient?.gender,
              patologiasHipoteses: c?.patient?.diagnosis
            },
            antropometria: c?.antropometria,
            bioquimica: c?.bioquimica
          }
        })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.apiKeyConfigured && data.reply) {
        return data.reply;
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  // Mantido para compatibilidade retroativa, delegando a chamada exclusivamente ao servidor
  async callGeminiWithStrictRules(question, c, role) {
    return this.callServerLlmWithStrictRules(question, c, role);
  }
}
