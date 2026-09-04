// Motor de Leitura de Arquivos e Montagem Automática de Casos Clínicos - DietoCase
// Suporta arquivos Word (.docx), texto (.txt, .md), .json e colagem livre de prontuários.

class DocxTextExtractor {
  // Extrai texto completo de arquivo File ou Blob .docx
  static async extractTextFromFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    return DocxTextExtractor.extractTextFromZipBuffer(arrayBuffer);
  }

  // Descompacta e extrai o word/document.xml do container ZIP OpenXML
  static async extractTextFromZipBuffer(buffer) {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    let offset = 0;

    // Varre as entradas de arquivos locais (Local File Headers - assinatura 0x04034b50)
    while (offset < bytes.length - 30) {
      if (view.getUint32(offset, true) === 0x04034b50) {
        const compression = view.getUint16(offset + 8, true);
        const compSize = view.getUint32(offset + 18, true);
        const fnLen = view.getUint16(offset + 26, true);
        const extraLen = view.getUint16(offset + 28, true);

        const fnBytes = bytes.subarray(offset + 30, offset + 30 + fnLen);
        const filename = new TextDecoder("utf-8").decode(fnBytes);
        const dataStart = offset + 30 + fnLen + extraLen;

        if (filename === "word/document.xml") {
          const compData = bytes.subarray(dataStart, dataStart + compSize);
          let xmlText = "";

          if (compression === 0) {
            // Não comprimido (Stored)
            xmlText = new TextDecoder("utf-8").decode(compData);
          } else if (compression === 8) {
            // Comprimido com Deflate
            try {
              if (typeof DecompressionStream !== "undefined") {
                const stream = new ReadableStream({
                  start(controller) {
                    controller.enqueue(compData);
                    controller.close();
                  }
                }).pipeThrough(new DecompressionStream("deflate-raw"));
                xmlText = await new Response(stream).text();
              }
            } catch (err) {
              console.warn("DecompressionStream falhou ao descompactar word/document.xml:", err);
            }
          }

          if (xmlText) {
            return DocxTextExtractor.parseDocumentXml(xmlText);
          }
        }

        offset = dataStart + compSize;
      } else {
        offset++;
      }
    }

    // Fallback: tenta buscar padrões de texto no buffer se a estrutura do ZIP foi alterada
    try {
      const decoded = new TextDecoder("latin1").decode(bytes);
      const docIndex = decoded.indexOf("<w:document");
      if (docIndex !== -1) {
        const sub = decoded.substring(docIndex);
        return DocxTextExtractor.parseDocumentXml(sub);
      }
    } catch (e) {
      console.warn("Fallback de leitura de docx falhou:", e);
    }

    return "";
  }

  // Converte o XML OpenXML do Word em texto legível com quebras de parágrafo
  static parseDocumentXml(xmlString) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, "application/xml");
      const paragraphs = doc.querySelectorAll("p, w\\:p");
      const lines = [];

      paragraphs.forEach(p => {
        const texts = p.querySelectorAll("t, w\\:t");
        const line = Array.from(texts).map(t => t.textContent).join("");
        if (line.trim()) {
          lines.push(line.trim());
        }
      });

      if (lines.length > 0) {
        return lines.join("\n");
      }
    } catch (e) {
      console.warn("DOMParser falhou ao parsear document.xml, usando regex:", e);
    }

    // Fallback via regex
    return xmlString
      .replace(/<w:p[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

// Construtor Inteligente de Casos Clínicos a partir de Texto Livre ou Arquivo
class CaseBuilderEngine {

  // Processa o texto bruto e monta o objeto completo do caso clínico
  static buildCaseFromText(rawText, options = {}) {
    const text = (rawText || "").trim();
    if (!text) {
      throw new Error("O texto do arquivo ou conteúdo colado está vazio.");
    }

    // 1. Tenta verificar se o texto já é um JSON de caso clínico
    if (text.startsWith("{") && text.endsWith("}")) {
      try {
        const parsed = JSON.parse(text);
        if (parsed.title || parsed.patient) {
          return CaseBuilderEngine.normalizeStructuredCase(parsed);
        }
      } catch (e) {
        // Não é JSON puro, prossegue com extração heurística
      }
    }

    // 2. Extração Heurística Estruturada
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const caseId = "caso_" + Date.now();

    // Extrai dados básicos do paciente
    const patientData = CaseBuilderEngine.extractPatientData(text, lines);

    // Extrai dados da história clínica
    const historyData = CaseBuilderEngine.extractHistoryData(text, lines);

    // Extrai dados antropométricos
    const antropometriaData = CaseBuilderEngine.extractAntropometriaData(text, lines);

    // Extrai exames laboratoriais / bioquímica
    const bioquimicaData = CaseBuilderEngine.extractBioquimicaData(text, lines);

    // Extrai exame físico
    const exameFisicoData = CaseBuilderEngine.extractExameFisicoData(text, lines);

    // Extrai consumo alimentar e recordatório 24h
    const consumoAlimentarData = CaseBuilderEngine.extractConsumoAlimentarData(text, lines);

    // Extrai equipe multiprofissional
    const equipeMultiprofissional = CaseBuilderEngine.extractEquipeMultiprofissional(text, lines);

    // Extrai questões avaliativas
    const questoesAvaliativas = CaseBuilderEngine.extractQuestoesAvaliativas(text, lines);

    // Extrai gabarito e resolução sugerida
    const resolucaoGabarito = CaseBuilderEngine.extractResolucaoGabarito(text, lines, patientData, antropometriaData);

    // Título e Categoria do Caso
    const title = CaseBuilderEngine.extractCaseTitle(text, lines, patientData);
    const category = CaseBuilderEngine.extractCaseCategory(text);
    const description = CaseBuilderEngine.extractCaseDescription(text, patientData, historyData);
    const disciplinaId = (typeof options === "string" ? options : options?.disciplinaId) || "dietoterapia";

    const rawCase = {
      id: caseId,
      disciplinaId: disciplinaId,
      title: title,
      category: category,
      description: description,
      isLocked: false,
      patient: patientData,
      history: historyData,
      antropometria: antropometriaData,
      bioquimica: bioquimicaData,
      exameFisico: exameFisicoData,
      consumoAlimentar: consumoAlimentarData,
      equipeMultiprofissional: equipeMultiprofissional,
      questoesAvaliativas: questoesAvaliativas,
      resolucaoGabarito: resolucaoGabarito
    };

    if (typeof ClinicalPortugueseReviser !== "undefined" && ClinicalPortugueseReviser.reviewCase) {
      return ClinicalPortugueseReviser.reviewCase(rawCase);
    }
    return rawCase;
  }

  // Garante que um caso importado como JSON tenha todos os campos válidos
  static normalizeStructuredCase(c) {
    const normalized = {
      id: c.id || "caso_" + Date.now(),
      disciplinaId: c.disciplinaId || "dietoterapia",
      title: c.title || "Caso Clínico de Dietoterapia",
      category: c.category || "Clínica Médica / Ambulatorial",
      description: c.description || (c.patient ? `${c.patient.name || 'Paciente'}, ${c.patient.age || ''} anos.` : "Atendimento nutricional"),
      isLocked: c.isLocked === true,
      patient: Object.assign({
        name: "Paciente",
        age: 45,
        gender: "Feminino",
        occupation: "Não informado",
        maritalStatus: "Não informado",
        residence: "Urbana",
        avatar: "👤"
      }, c.patient || {}),
      history: Object.assign({
        queixaPrincipal: "Consulta de rotina nutricional",
        hda: "Sem histórico detalhado.",
        hpp: "Sem antecedentes relevantes.",
        historiaFamiliar: "Não informada.",
        medicamentos: "Nenhum medicamento contínuo.",
        habitosVida: "Não informado.",
        funcaoIntestinalDiurese: "Fisiológico."
      }, c.history || {}),
      antropometria: Object.assign({
        pesoAtual: 70,
        pesoHabitual: 70,
        estatura: 1.65,
        circunferenciaCintura: null,
        circunferenciaBraco: null,
        dobraTricipital: null,
        circunferenciaPanturrilha: null,
        historicoPerdaPonderal: "Sem perda de peso recente relatada."
      }, c.antropometria || {}),
      bioquimica: Array.isArray(c.bioquimica) ? c.bioquimica : [],
      exameFisico: Object.assign({
        estadoGeral: "Bom estado geral (BEG), lúcido(a) e orientado(a).",
        sinaisEspecificos: "Sem sinais carenciais visíveis.",
        edema: "Ausente.",
        cavidadeOral: "Dentição preservada, mucosas úmidas e normocoradas.",
        tgi: "Sem queixas de náuseas, vômitos ou disfagia."
      }, c.exameFisico || {}),
      consumoAlimentar: Object.assign({
        padraoDiario: "Consumo habitual variado.",
        recordatorio24h: Array.isArray(c.consumoAlimentar?.recordatorio24h) ? c.consumoAlimentar.recordatorio24h : [],
        ingestaoHidrica: "1.5 a 2 litros por dia.",
        preferencias: "Variadas.",
        aversoesIntolerancias: "Nega aversões ou alergias conhecidas.",
        quemPrepara: "O próprio paciente ou família."
      }, c.consumoAlimentar || {}),
      equipeMultiprofissional: (typeof normalizeEquipeMultiprofissional === "function")
        ? normalizeEquipeMultiprofissional(c.equipeMultiprofissional)
        : (Array.isArray(c.equipeMultiprofissional) ? c.equipeMultiprofissional : []),
      questoesAvaliativas: Array.isArray(c.questoesAvaliativas) && c.questoesAvaliativas.length > 0 ? c.questoesAvaliativas : [
        { id: "q1", pergunta: "1. Formule o Diagnóstico em Nutrição (PES) prioritário para o caso.", tipo: "discursiva" },
        { id: "q2", pergunta: "2. Calcule o Valor Energético Total (VET) e estabeleça a distribuição de macronutrientes recomendada.", tipo: "discursiva" },
        { id: "q3", pergunta: "3. Defina a conduta dietoterápica: consistência da dieta, fracionamento e metas clínicas nutricionais.", tipo: "discursiva" },
        { id: "q4", pergunta: "4. Proponha o planejamento alimentar quali-quantitativo (cardápio) com orientações nutricionais.", tipo: "discursiva" }
      ],
      resolucaoGabarito: Object.assign({
        diagnosticoNutricional: "Diagnóstico PES a definir pelo docente.",
        calculoEnergetico: "Estimativa calórica padrão.",
        distribuicaoMacronutrientes: "Carboidratos 50-55%, Proteínas 15-20%, Lipídios 25-30%.",
        condutaPlanejamento: "Conduta dietoterápica individualizada."
      }, c.resolucaoGabarito || {})
    };

    if (typeof ClinicalPortugueseReviser !== "undefined" && ClinicalPortugueseReviser.reviewCase) {
      return ClinicalPortugueseReviser.reviewCase(normalized);
    }
    return normalized;
  }

  // Extrai Título do Caso
  static extractCaseTitle(text, lines, patient) {
    // Procura por título explícito
    for (const l of lines.slice(0, 5)) {
      if (/^caso\s*cl[ií]nico/i.test(l) || /^estudo\s*de\s*caso/i.test(l) || /^t[ií]tulo:/i.test(l)) {
        return l.replace(/^t[ií]tulo:\s*/i, "").trim();
      }
    }

    // Se houver diagnóstico claro no início
    const diagMatch = text.match(/(diabetes\s*mellitus|hipertens[aã]o|doen[cç]a\s*renal|insufici[eê]ncia\s*card[ií]aca|obesidade|desnutri[cç][aã]o|cirrose|dislipidemia|s[ií]ndrome\s*metab[oó]lica)/i);
    if (diagMatch) {
      const patName = patient?.name || "Paciente";
      return `Caso Clínico: ${diagMatch[0].charAt(0).toUpperCase() + diagMatch[0].slice(1)} (${patName})`;
    }

    return `Caso Clínico: ${patient.name || 'Novo Atendimento'} (${patient.age || 40} anos)`;
  }

  // Extrai Categoria
  static extractCaseCategory(text) {
    const t = text.toLowerCase();
    if (t.includes("uti") || t.includes("cuidados intensivos") || t.includes("leito") || t.includes("internado") || t.includes("enfermaria")) {
      return "Nutrição Hospitalar / Internação";
    }
    if (t.includes("pediatria") || t.includes("crian[cç]a") || t.includes("lactente") || t.includes("meses de vida")) {
      return "Nutrição Pediátrica";
    }
    if (t.includes("idoso") || t.includes("geri[aá]trico") || t.includes("institui[cç][aã]o de longa perman[eê]ncia")) {
      return "Nutrição Geriátrica";
    }
    if (t.includes("atleta") || t.includes("hipertrofia") || t.includes("esporte") || t.includes("corrida")) {
      return "Nutrição Esportiva";
    }
    return "Clínica Médica / Ambulatorial";
  }

  // Extrai Descrição Curta
  static extractCaseDescription(text, p, h) {
    let desc = `${p.name || 'Paciente'}, ${p.age || 45} anos`;
    if (p.occupation && p.occupation !== "Não informado") desc += `, ${p.occupation}`;
    if (h.queixaPrincipal && h.queixaPrincipal.length > 5) {
      desc += `. Queixa: ${h.queixaPrincipal}`;
    }
    return desc.length > 150 ? desc.substring(0, 147) + "..." : desc;
  }

  // Extrai Dados do Paciente
  static extractPatientData(text, lines) {
    let name = "Paciente";
    let age = 45;
    let gender = "Feminino";
    let occupation = "Não informado";
    let maritalStatus = "Não informado";
    let residence = "Urbana";

    // Nome
    const nameMatch = text.match(/(?:paciente|nome|identifica[cç][aã]o):\s*(?:(?:sr\.|sra\.|dr\.|dra\.|d\.|dona)\s*)?([A-ZÀ-Úa-zà-ú\s\-]+?)(?:\,|\n|\;|\d|idade)/i);
    if (nameMatch && nameMatch[1] && nameMatch[1].trim().length > 2) {
      const cleanName = nameMatch[1].trim().replace(/\b(de|do|da|dos|das)\b/gi, m => m.toLowerCase());
      if (!/^(do|da|de|o|a|sexo|idade|anos|com)$/i.test(cleanName)) {
        name = cleanName;
      }
    } else {
      // Tenta nas primeiras linhas
      for (const l of lines.slice(0, 6)) {
        if (/^(d\.|sr\.|sra\.|paciente)\s+[A-Z]/i.test(l)) {
          name = l.replace(/^(d\.|sr\.|sra\.|paciente[:\s]+)/i, "").trim();
          break;
        }
      }
    }

    // Idade
    const ageMatch = text.match(/(\d{1,3})\s*(?:anos|a\b|a\.)/i) || text.match(/idade[:\s]+(\d{1,3})/i);
    if (ageMatch) {
      const parsedAge = parseInt(ageMatch[1], 10);
      if (parsedAge > 0 && parsedAge < 120) {
        age = parsedAge;
      }
    }

    // Sexo / Gênero
    if (/\b(feminino|mulher|feminina|senhora|dona|garota|menina)\b/i.test(text)) {
      gender = "Feminino";
    } else if (/\b(masculino|homem|senhor|garoto|menino)\b/i.test(text)) {
      gender = "Masculino";
    }

    // Ocupação / Profissão
    const occMatch = text.match(/(?:profiss[aã]o|ocupa[cç][aã]o|trabalha como|aposentad[oa]|profissoes):\s*([A-Za-zÀ-ú\s]+?)(?:\,|\.|\n|\;)/i);
    if (occMatch && occMatch[1].trim()) {
      occupation = occMatch[1].trim();
    } else if (/\b(aposentad[oa]|motorista|professor[a]?|pedreiro|do lar|aut[oô]nomo|m[eé]dic[oa]|enfermeir[oa]|vendedor[a]?|auxiliar)\b/i.test(text)) {
      const simpleOcc = text.match(/\b(aposentad[oa]|motorista|professor[a]?|pedreiro|do lar|aut[oô]nomo|m[eé]dic[oa]|enfermeir[oa]|vendedor[a]?|auxiliar)\b/i);
      if (simpleOcc) occupation = simpleOcc[0].charAt(0).toUpperCase() + simpleOcc[0].slice(1);
    }

    // Estado Civil
    const marMatch = text.match(/(?:estado civil):\s*([A-Za-zÀ-ú\s]+?)(?:\,|\.|\n|\;)/i) ||
                     text.match(/\b(casad[oa]|solteir[oa]|vi[uú]v[oa]|divorciad[oa]|uni[aã]o est[aá]vel)\b/i);
    if (marMatch) {
      maritalStatus = (marMatch[1] || marMatch[0]).trim();
      maritalStatus = maritalStatus.charAt(0).toUpperCase() + maritalStatus.slice(1);
    }

    // Avatar inteligente baseado na idade e sexo
    let avatar = "👤";
    if (age >= 60) {
      avatar = gender === "Feminino" ? "👵" : "👴";
    } else if (age <= 12) {
      avatar = gender === "Feminino" ? "👧" : "👦";
    } else {
      avatar = gender === "Feminino" ? "👩" : "👨";
    }

    return {
      name: name,
      age: age,
      gender: gender,
      occupation: occupation,
      maritalStatus: maritalStatus,
      residence: residence,
      avatar: avatar
    };
  }

  // Extrai História Clínica e Anamnese
  static extractHistoryData(text, lines) {
    let qp = "";
    let hda = "";
    let hpp = "";
    let hf = "";
    let meds = "";
    let habitos = "";
    let eliminacoes = "";

    // Queixa Principal (QP)
    const qpMatch = text.match(/(?:queixa principal|qp|motivo da consulta)[:\s]+([\s\S]+?)(?=(?:hda|hist[oó]ria da doen[cç]a|hpp|antecedentes|medicamentos|exame|antropometria|\n\n|$))/i);
    if (qpMatch) qp = qpMatch[1].trim().split("\n")[0];

    // HDA
    const hdaMatch = text.match(/(?:hda|hist[oó]ria da doen[cç]a atual)[:\s]+([\s\S]+?)(?=(?:hpp|antecedentes patol[oó]gicos|hist[oó]ria familiar|medicamentos|exames|antropometria|\n\n[A-Z]|$))/i);
    if (hdaMatch) hda = hdaMatch[1].trim();

    // HPP
    const hppMatch = text.match(/(?:hpp|antecedentes patol[oó]gicos|hist[oó]ria patol[oó]gica pregressa|hist[oó]rico m[eé]dico)[:\s]+([\s\S]+?)(?=(?:hist[oó]ria familiar|hf|medicamentos|h[aá]bitos|exames|\n\n[A-Z]|$))/i);
    if (hppMatch) hpp = hppMatch[1].trim();

    // História Familiar
    const hfMatch = text.match(/(?:hf|hist[oó]ria familiar|antecedentes familiares)[:\s]+([\s\S]+?)(?=(?:medicamentos|h[aá]bitos|estilo de vida|exames|antropometria|\n\n[A-Z]|$))/i);
    if (hfMatch) hf = hfMatch[1].trim();

    // Medicamentos em uso
    const medMatch = text.match(/(?:medicamentos|em uso de|farmacoterapia|rem[eé]dios|prescri[cç][aã]o m[eé]dica)[:\s]+([\s\S]+?)(?=(?:h[aá]bitos|estilo de vida|elimina[cç][oõ]es|exame f[ií]sico|antropometria|\n\n[A-Z]|$))/i);
    if (medMatch) meds = medMatch[1].trim();

    // Hábitos de vida
    const habMatch = text.match(/(?:h[aá]bitos|estilo de vida|tabagismo|etilismo|atividade f[ií]sica)[:\s]+([\s\S]+?)(?=(?:elimina[cç][oõ]es|fun[cç][aã]o intestinal|exame f[ií]sico|antropometria|\n\n[A-Z]|$))/i);
    if (habMatch) habitos = habMatch[1].trim();

    // Eliminações
    const elimMatch = text.match(/(?:elimina[cç][oõ]es|fun[cç][aã]o intestinal|diurese|h[aá]bito intestinal)[:\s]+([\s\S]+?)(?=(?:antropometria|exame f[ií]sico|bioqu[ií]mica|\n\n[A-Z]|$))/i);
    if (elimMatch) eliminacoes = elimMatch[1].trim();

    return {
      queixaPrincipal: qp || "Paciente encaminhado(a) para avaliação e conduta nutricional individualizada.",
      hda: hda || "Refere diagnóstico clínico recente e busca orientação para reeducação alimentar e controle de sintomas.",
      hpp: hpp || "Sem outras patologias graves documentadas além do diagnóstico de base.",
      historiaFamiliar: hf || "Relato de antecedentes de doenças crônicas não transmissíveis na família.",
      medicamentos: meds || "Nenhum medicamento de uso contínuo relatado.",
      habitosVida: habitos || "Sedentário(a), nega tabagismo ou etilismo expressivo.",
      funcaoIntestinalDiurese: eliminacoes || "Hábito intestinal regular (escala de Bristol tipo 3-4) e diurese espontânea preservada."
    };
  }

  // Extrai Antropometria
  static extractAntropometriaData(text, lines) {
    let pesoAtual = 70;
    let pesoHabitual = 70;
    let estatura = 1.65;
    let cc = null;
    let cb = null;
    let cp = null;
    let dct = null;
    let perda = "Sem perda recente relatada.";

    // Peso Atual
    const pesoMatch = text.match(/(?:peso atual|peso|pa)[:\s]+([\d\.\,]+)\s*kg/i) || text.match(/\b(\d{2,3}(?:[\.\,]\d{1,2})?)\s*kg\b/i);
    if (pesoMatch) {
      pesoAtual = parseFloat(pesoMatch[1].replace(",", "."));
      pesoHabitual = pesoAtual;
    }

    // Peso Habitual
    const phMatch = text.match(/(?:peso habitual|ph)[:\s]+([\d\.\,]+)\s*kg/i);
    if (phMatch) {
      pesoHabitual = parseFloat(phMatch[1].replace(",", "."));
    }

    // Estatura / Altura
    const altMatch = text.match(/(?:estatura|altura|alt)[:\s]+([\d\.\,]+)\s*(?:m|cm)?/i) || text.match(/\b([12][\.\,]\d{2})\s*m\b/i);
    if (altMatch) {
      let v = parseFloat(altMatch[1].replace(",", "."));
      if (v > 50 && v < 250) v = v / 100; // Converte cm para metros
      if (v >= 0.5 && v <= 2.5) estatura = v;
    }

    // Circunferência da Cintura (CC)
    const ccMatch = text.match(/(?:circunfer[eê]ncia da cintura|cc)[:\s]+([\d\.\,]+)\s*cm/i);
    if (ccMatch) cc = parseFloat(ccMatch[1].replace(",", "."));

    // Circunferência do Braço (CB)
    const cbMatch = text.match(/(?:circunfer[eê]ncia do bra[cç]o|cb)[:\s]+([\d\.\,]+)\s*cm/i);
    if (cbMatch) cb = parseFloat(cbMatch[1].replace(",", "."));

    // Circunferência da Panturrilha (CP)
    const cpMatch = text.match(/(?:circunfer[eê]ncia da panturrilha|cp)[:\s]+([\d\.\,]+)\s*cm/i);
    if (cpMatch) cp = parseFloat(cpMatch[1].replace(",", "."));

    // Dobra Cutânea Tricipital (DCT)
    const dctMatch = text.match(/(?:dobra tricipital|dobra cut[aâ]nea tricipital|dct)[:\s]+([\d\.\,]+)\s*mm/i);
    if (dctMatch) dct = parseFloat(dctMatch[1].replace(",", "."));

    // Perda ponderal
    const perdaMatch = text.match(/(perda de peso|perdeu|redu[cç][aã]o de peso)[:\s]+([^.\n;]+)/i);
    if (perdaMatch) perda = perdaMatch[0].trim();

    return {
      pesoAtual: pesoAtual,
      pesoHabitual: pesoHabitual,
      estatura: estatura,
      circunferenciaCintura: cc,
      circunferenciaBraco: cb,
      dobraTricipital: dct,
      circunferenciaPanturrilha: cp,
      historicoPerdaPonderal: perda
    };
  }

  // Extrai Bioquímica / Exames Laboratoriais
  static extractBioquimicaData(text, lines) {
    const list = [];
    const labDict = [
      { key: "glicemia de jejum|glicemia", name: "Glicemia de Jejum", ref: "70 a 99 mg/dL", unit: "mg/dL" },
      { key: "hba1c|hemoglobina glicada", name: "Hemoglobina Glicada (HbA1c)", ref: "< 5,7%", unit: "%" },
      { key: "colesterol total", name: "Colesterol Total", ref: "< 190 mg/dL", unit: "mg/dL" },
      { key: "hdl|colesterol hdl", name: "HDL-Colesterol", ref: "> 40 mg/dL (homem) / > 50 mg/dL (mulher)", unit: "mg/dL" },
      { key: "ldl|colesterol ldl", name: "LDL-Colesterol", ref: "< 100 mg/dL", unit: "mg/dL" },
      { key: "triglicer[ií]deos|triglic[eé]rides", name: "Triglicerídeos", ref: "< 150 mg/dL", unit: "mg/dL" },
      { key: "creatinina", name: "Creatinina Sérica", ref: "0,7 a 1,3 mg/dL", unit: "mg/dL" },
      { key: "ureia", name: "Ureia", ref: "15 a 45 mg/dL", unit: "mg/dL" },
      { key: "hemoglobina|hb", name: "Hemoglobina", ref: "12 a 16 g/dL", unit: "g/dL" },
      { key: "hemat[oó]crito|ht", name: "Hematócrito", ref: "36 a 48%", unit: "%" },
      { key: "albumina", name: "Albumina Sérica", ref: "3,5 a 5,0 g/dL", unit: "g/dL" },
      { key: "s[oó]dio|na\+", name: "Sódio Sérico (Na)", ref: "135 a 145 mEq/L", unit: "mEq/L" },
      { key: "pot[aá]ssio|k\+", name: "Potássio Sérico (K)", ref: "3,5 a 5,0 mEq/L", unit: "mEq/L" },
      { key: "tgo|ast", name: "TGO (AST)", ref: "< 35 U/L", unit: "U/L" },
      { key: "tgp|alt", name: "TGP (ALT)", ref: "< 35 U/L", unit: "U/L" },
      { key: "pcr|prote[ií]na c reativa", name: "Proteína C-Reativa (PCR)", ref: "< 5,0 mg/L", unit: "mg/L" },
      { key: "ferritina", name: "Ferritina", ref: "30 a 400 ng/mL", unit: "ng/mL" }
    ];

    const today = new Date().toISOString().split("T")[0];

    labDict.forEach(item => {
      const reg = new RegExp(`(?:${item.key})[:\\s]+([\\d\\.\\,]+)\\s*(?:${item.unit})?`, "i");
      const match = text.match(reg);
      if (match) {
        const valStr = match[1].replace(",", ".");
        list.push({
          exame: item.name,
          valor: `${valStr} ${item.unit}`,
          data: today,
          referencia: item.ref
        });
      }
    });

    // Se nenhum exame foi detectado pelo dicionário específico, cria uma linha padrão de exemplo
    if (list.length === 0) {
      list.push(
        { exame: "Glicemia de Jejum", valor: "92 mg/dL", data: today, referencia: "70 a 99 mg/dL" },
        { exame: "Hemoglobina", valor: "13.8 g/dL", data: today, referencia: "12 a 16 g/dL" }
      );
    }

    return list;
  }

  // Extrai Exame Físico
  static extractExameFisicoData(text, lines) {
    let estado = "Bom estado geral (BEG), corado(a), hidratado(a), lúcido(a) e orientado(a).";
    let sinais = "Sem sinais clínicos de desnutrição grave ou carências de micronutrientes.";
    let edema = "Ausente (-/4+).";
    let boca = "Cavidade oral íntegra, dentição preservada sem queixas de mastigação.";
    let tgi = "Trato gastrointestinal funcionante, sem pirose, náuseas ou dor abdominal.";

    const efMatch = text.match(/(?:exame f[ií]sico|avalia[cç][aã]o cl[ií]nica)[:\s]+([\s\S]+?)(?=(?:consumo alimentar|recordat[oó]rio|equipe multiprofissional|quest[oõ]es|\n\n[A-Z]|$))/i);
    const efText = efMatch ? efMatch[1] : text;

    if (/\b(beg|reg|meg|l[uú]cido|orientado|desorientado|corado|descorado)\b/i.test(efText)) {
      const m = efText.match(/([^\n\.;]+(?:beg|reg|meg|l[uú]cido|orientado)[^\n\.;]*)/i);
      if (m) estado = m[0].trim();
    }

    if (/\b(acantose|icter[ií]cia|palidez|deple[cç][aã]o|sarcopenia|atrofia)\b/i.test(efText)) {
      const m = efText.match(/([^\n\.;]*(?:acantose|icter[ií]cia|palidez|deple[cç][aã]o|sarcopenia)[^\n\.;]*)/i);
      if (m) sinais = m[0].trim();
    }

    if (/\b(edema|incha[cç]o|cacifo|anasarca)\b/i.test(efText)) {
      const m = efText.match(/([^\n\.;]*(?:edema|cacifo|incha[cç]o)[^\n\.;]*)/i);
      if (m) edema = m[0].trim();
    }

    if (/\b(pr[oó]tese|dentes|denti[cç][aã]o|ed[eê]ntul[oa]|aftas|mucosa oral|mastiga[cç][aã]o)\b/i.test(efText)) {
      const m = efText.match(/([^\n\.;]*(?:pr[oó]tese|dentes|ed[eê]ntul|mastiga[cç][aã]o)[^\n\.;]*)/i);
      if (m) boca = m[0].trim();
    }

    if (/\b(rha|refluxo|n[aá]useas|v[oô]mitos|pirose|plenitude|distens[aã]o|tgi)\b/i.test(efText)) {
      const m = efText.match(/([^\n\.;]*(?:rha|refluxo|n[aá]useas|v[oô]mitos|pirose|tgi)[^\n\.;]*)/i);
      if (m) tgi = m[0].trim();
    }

    return {
      estadoGeral: estado,
      sinaisEspecificos: sinais,
      edema: edema,
      cavidadeOral: boca,
      tgi: tgi
    };
  }

  // Extrai Consumo Alimentar e Recordatório 24h
  static extractConsumoAlimentarData(text, lines) {
    let padrao = "Padrão alimentar habitual misto com refeições preparadas em domicílio.";
    let agua = "1,5 a 2,0 litros de água pura ao dia.";
    let pref = "Alimentos tradicionais da cultura brasileira (arroz, feijão, carnes magras, legumes).";
    let aver = "Nega aversões ou intolerâncias relatadas.";
    let quem = "O próprio paciente com auxílio familiar.";

    const recList = [];
    const meals = [
      { name: "Desjejum / Café da Manhã", time: "07:30", regex: /(?:desjejum|caf[eé] da manh[aã])[:\s]+([^\n]+)/i },
      { name: "Colação / Lanche da Manhã", time: "10:00", regex: /(?:cola[cç][aã]o|lanche da manh[aã])[:\s]+([^\n]+)/i },
      { name: "Almoço", time: "12:30", regex: /(?:almo[cç]o)[:\s]+([^\n]+)/i },
      { name: "Lanche da Tarde", time: "16:00", regex: /(?:lanche da tarde|merenda)[:\s]+([^\n]+)/i },
      { name: "Jantar", time: "19:30", regex: /(?:jantar|janta)[:\s]+([^\n]+)/i },
      { name: "Ceia", time: "22:00", regex: /(?:ceia)[:\s]+([^\n]+)/i }
    ];

    meals.forEach(m => {
      const match = text.match(m.regex);
      if (match) {
        recList.push({
          refeicao: m.name,
          horario: m.time,
          alimentos: match[1].trim()
        });
      }
    });

    if (recList.length === 0) {
      recList.push(
        { refeicao: "Café da Manhã", horario: "07:30", alimentos: "Pão francês com margarina e café com açúcar." },
        { refeicao: "Almoço", horario: "12:30", alimentos: "Arroz branco, feijão carioca, carne moída refogada e salada de tomate." },
        { refeicao: "Lanche da Tarde", horario: "16:30", alimentos: "Biscoito cream cracker e suco industrializado." },
        { refeicao: "Jantar", horario: "20:00", alimentos: "Mesmo cardápio do almoço em menor porção ou sopa caseira." }
      );
    }

    // Água
    const aguaMatch = text.match(/(?:ingest[aã]o h[ií]drica|[aá]gua|l[ií]quidos)[:\s]+([^\n;\.]+)/i);
    if (aguaMatch) agua = aguaMatch[1].trim();

    // Preferências
    const prefMatch = text.match(/(?:prefer[eê]ncias|gosta de)[:\s]+([^\n;\.]+)/i);
    if (prefMatch) pref = prefMatch[1].trim();

    // Aversões
    const averMatch = text.match(/(?:avers[oõ]es|intoler[aâ]ncias|alergias alimentares)[:\s]+([^\n;\.]+)/i);
    if (averMatch) aver = averMatch[1].trim();

    // Quem prepara
    const quemMatch = text.match(/(?:quem prepara|preparo das refei[cç][oõ]es)[:\s]+([^\n;\.]+)/i);
    if (quemMatch) quem = quemMatch[1].trim();

    return {
      padraoDiario: padrao,
      recordatorio24h: recList,
      ingestaoHidrica: agua,
      preferencias: pref,
      aversoesIntolerancias: aver,
      quemPrepara: quem
    };
  }

  // Extrai Equipe Multiprofissional
  static extractEquipeMultiprofissional(text, lines) {
    const equipe = [];

    // Médico
    const medMatch = text.match(/(?:parecer m[eé]dico|conduta m[eé]dica|m[eé]dico\(a\) assistente)[:\s]+([\s\S]+?)(?=(?:enfermagem|fonoaudiologia|fisioterapia|psicologia|servi[cç]o social|\n\n[A-Z]|$))/i);
    const parecerMed = medMatch ? medMatch[1].trim().split("\n")[0] : "Diagnóstico clínico firmado, solicitadas condutas nutricionais integradas ao plano terapêutico.";
    equipe.push({
      id: "medico",
      nome: "Dr(a). Médico(a) Assistente",
      avatar: "🩺",
      especialidade: "Medicina Clínica e Especializada",
      parecer: parecerMed
    });

    // Enfermagem
    const enfMatch = text.match(/(?:parecer da enfermagem|enfermagem)[:\s]+([\s\S]+?)(?=(?:fonoaudiologia|fisioterapia|psicologia|servi[cç]o social|\n\n[A-Z]|$))/i);
    const parecerEnf = enfMatch ? enfMatch[1].trim().split("\n")[0] : "Sinais vitais checados, pressão arterial e glicemia capilar estáveis no atendimento.";
    equipe.push({
      id: "enfermagem",
      nome: "Enfermeiro(a) do Plantão",
      avatar: "💉",
      especialidade: "Enfermagem e Cuidados Clínicos",
      parecer: parecerEnf
    });

    // Fisioterapia (se citada no texto)
    const fisioMatch = text.match(/(?:fisioterapia|fisioterapeuta)[:\s]+([\s\S]+?)(?=(?:fonoaudiologia|psicologia|servi[cç]o social|\n\n[A-Z]|$))/i);
    if (fisioMatch) {
      equipe.push({
        id: "fisioterapia",
        nome: "Fisioterapeuta",
        avatar: "🏃",
        especialidade: "Reabilitação Fisioterapêutica",
        parecer: fisioMatch[1].trim().split("\n")[0]
      });
    }

    // Fonoaudiologia (se citada no texto)
    const fonoMatch = text.match(/(?:fonoaudiologia|fonoaudi[oó]log[oa])[:\s]+([\s\S]+?)(?=(?:psicologia|fisioterapia|servi[cç]o social|\n\n[A-Z]|$))/i);
    if (fonoMatch) {
      equipe.push({
        id: "fono",
        nome: "Fonoaudiólogo(a) Clínico(a)",
        avatar: "🗣️",
        especialidade: "Avaliação da Deglutição e Mastigação",
        parecer: fonoMatch[1].trim().split("\n")[0]
      });
    }

    // Psicologia / Serviço Social (se citado)
    const psicoMatch = text.match(/(?:psicologia|servi[cç]o social|psic[oó]log[oa])[:\s]+([\s\S]+?)(?=(?:quest[oõ]es|resolu[cç][aã]o|\n\n[A-Z]|$))/i);
    if (psicoMatch) {
      equipe.push({
        id: "psicologia",
        nome: "Psicólogo(a) / Serv. Social",
        avatar: "🤝",
        especialidade: "Apoio Psicossocial e Adesão Terapêutica",
        parecer: psicoMatch[1].trim().split("\n")[0]
      });
    }

    return equipe;
  }

  // Extrai Questões Avaliativas
  static extractQuestoesAvaliativas(text, lines) {
    const questoes = [];
    
    // Procura por perguntas numeradas no texto: "1. ...", "Questão 1: ..."
    const qMatches = text.matchAll(/(?:^|\n)(?:quest[aã]o\s*)?(\d{1,2})[\.\:\)\-]\s*([^\n\?]+\?)/gim);
    for (const m of qMatches) {
      const num = m[1];
      const qText = m[2].trim();
      if (qText.length > 10) {
        questoes.push({
          id: "q" + num,
          pergunta: `${num}. ${qText}`,
          tipo: "discursiva"
        });
      }
    }

    // Se nenhuma questão foi encontrada no arquivo, fornece o quarteto pedagógico padrão
    if (questoes.length === 0) {
      return [
        { id: "q1", pergunta: "1. Formule o Diagnóstico em Nutrição (PES) prioritário para o caso.", tipo: "discursiva" },
        { id: "q2", pergunta: "2. Calcule o Valor Energético Total (VET) e estabeleça a distribuição de macronutrientes recomendada.", tipo: "discursiva" },
        { id: "q3", pergunta: "3. Defina a conduta dietoterápica: consistência da dieta, fracionamento e metas clínicas nutricionais.", tipo: "discursiva" },
        { id: "q4", pergunta: "4. Proponha o planejamento alimentar quali-quantitativo (cardápio) com orientações nutricionais.", tipo: "discursiva" }
      ];
    }

    return questoes;
  }

  // Extrai Gabarito / Resolução do Professor
  static extractResolucaoGabarito(text, lines, p, a) {
    const imc = (a.pesoAtual / (a.estatura * a.estatura)).toFixed(1);
    
    return {
      diagnosticoNutricional: `Ingestão alimentar inadequada relacionada a hábitos prévios evidenciada por IMC de ${imc} kg/m² e alterações clínicas/laboratoriais documentadas.`,
      calculoEnergetico: `Estimativa calórica baseada no peso atual (${a.pesoAtual} kg), aplicando 25 a 30 kcal/kg/dia para manutenção e controle metabólico.`,
      distribuicaoMacronutrientes: "Carboidratos: 50% a 55% | Proteínas: 15% a 20% (1,0 a 1,2 g/kg/dia) | Lipídios: 25% a 30% (< 7% saturados).",
      condutaPlanejamento: "Dieta geral balanceada com fracionamento em 5 a 6 refeições diárias, aumento do aporte de fibras alimentares e adequada hidratação hídrica."
    };
  }
}

// Exportações globais
window.DocxTextExtractor = DocxTextExtractor;
window.CaseBuilderEngine = CaseBuilderEngine;
