// Módulo Revisor de Português e Adequação de Tempos Verbais Clínicos
// Garante correção ortográfica, acentuação médica, concordância de gênero/número
// e adequação rigorosa dos tempos verbais em casos clínicos de Dietoterapia.

class ClinicalPortugueseReviser {
  
  // Dicionário de termos médicos e nutricionais em português com acentuação e grafia padronizadas
  static MEDICAL_SPELL_MAP = {
    // Patologias e condições
    "diabete": "diabetes",
    "diabetes melitus": "diabetes mellitus",
    "diabetes melito": "diabetes mellitus",
    "hipertensao": "hipertensão",
    "hipertensao arterial": "hipertensão arterial",
    "dislepidemia": "dislipidemia",
    "dislipidemias": "dislipidemias",
    "obesidade grau 1": "obesidade grau I",
    "obesidade grau 2": "obesidade grau II",
    "obesidade grau 3": "obesidade grau III",
    "doenca renal cronica": "doença renal crônica",
    "insuficiencia cardiaca": "insuficiência cardíaca",
    "desnutricao": "desnutrição",
    "sindrome": "síndrome",
    "sindrome de dumping": "síndrome de Dumping",
    "sindrome metabolica": "síndrome metabólica",
    "nefropatia": "nefropatia",
    "neuropatia": "neuropatia",
    "retinopatia": "retinopatia",
    "disfagia": "disfagia",
    "anemia ferropriva": "anemia ferropriva",
    "constipacao": "constipação",
    "diarreia": "diarreia",
    "nauseas": "náuseas",
    "vomitos": "vômitos",
    "emese": "êmese",
    "azia": "azia",
    "pirose": "pirose",
    "refluxo gastroesofagico": "refluxo gastroesofágico",
    
    // Bioquímica e exames
    "glicemia de gejum": "glicemia de jejum",
    "glicemia jejum": "glicemia de jejum",
    "glicose": "glicose",
    "hemoglobina glicosada": "hemoglobina glicada",
    "hba1c": "HbA1c",
    "colestero": "colesterol",
    "colesterol total": "colesterol total",
    "trigliceridios": "triglicerídeos",
    "triglicerides": "triglicerídeos",
    "triglicerideos": "triglicerídeos",
    "ureia": "ureia",
    "acido urico": "ácido úrico",
    "potassio": "potássio",
    "sodio": "sódio",
    "fosforo": "fósforo",
    "calcio": "cálcio",
    "albumina": "albumina",
    "proteinuria": "proteinúria",
    "gasometria": "gasometria",
    "taxa de filtracao glomerular": "taxa de filtração glomerular",
    
    // Antropometria e nutrição
    "antropometria": "antropometria",
    "circunferencia": "circunferência",
    "circunferencia da cintura": "circunferência da cintura",
    "circunferencia do braco": "circunferência do braço",
    "dobra cutanea": "dobra cutânea",
    "dobra tricipital": "dobra tricipital",
    "estatura": "estatura",
    "perda ponderal": "perda ponderal",
    "ganho ponderal": "ganho ponderal",
    "macronutrientes": "macronutrientes",
    "micronutrientes": "micronutrientes",
    "carboidrato": "carboidratos",
    "carboidratos": "carboidratos",
    "proteina": "proteínas",
    "proteinas": "proteínas",
    "lipidio": "lipídios",
    "lipidios": "lipídios",
    "valor energetico total": "valor energético total",
    "ingestao hidrica": "ingestão hídrica",
    "inquerito alimentar": "inquérito alimentar",
    "recordatorio 24h": "recordatório de 24 horas",
    "recordatorio": "recordatório",
    "fracionamento": "fracionamento",
    "consistencia": "consistência",
    "prescricao dietoterapica": "prescrição dietoterápica",
    
    // Exame físico e equipe
    "acantose nigricans": "acantose nigricans",
    "cavidade oral": "cavidade oral",
    "degluticao": "deglutição",
    "mastigacao": "mastigação",
    "protese dentaria": "prótese dentária",
    "dentadura": "prótese dentária",
    "anictérico": "anictérico",
    "acianotico": "acianótico",
    "eutrofico": "eutrófico",
    "eutrofica": "eutrófica",
    "fonoaudiologo": "fonoaudiólogo",
    "fonoaudiologa": "fonoaudióloga",
    "fisioterapeuta": "fisioterapeuta",
    "nutricionista": "nutricionista",
    "multiprofissional": "multiprofissional"
  };

  // Revisa integralmente um caso clínico, corrigindo ortografia, gênero e tempos verbais
  static reviewCase(c) {
    if (!c || typeof c !== "object") return c;

    const gender = c.patient?.gender || "Feminino";
    const revised = JSON.parse(JSON.stringify(c));

    // 1. Identificação do Paciente
    if (revised.patient) {
      revised.patient.name = this.capitalizeWords(revised.patient.name || "Paciente");
      revised.patient.occupation = this.formatSentence(this.adjustGenderConcordance(revised.patient.occupation || "", gender));
      revised.patient.maritalStatus = this.adjustMaritalStatus(revised.patient.maritalStatus || "", gender);
      revised.patient.residence = this.formatSentence(revised.patient.residence || "");
    }

    // 2. Título e Categoria
    if (revised.title) revised.title = this.correctOrthography(revised.title);
    if (revised.category) revised.category = this.correctOrthography(revised.category);
    if (revised.description) {
      revised.description = this.formatSentence(this.adjustGenderConcordance(this.correctOrthography(revised.description), gender));
    }

    // 3. História Clínica (Adequação rigorosa de tempos verbais)
    if (revised.history) {
      revised.history.queixaPrincipal = this.adjustVerbTenses(revised.history.queixaPrincipal || "", "queixa", gender);
      revised.history.hda = this.adjustVerbTenses(revised.history.hda || "", "hda", gender);
      revised.history.hpp = this.adjustVerbTenses(revised.history.hpp || "", "hpp", gender);
      revised.history.historiaFamiliar = this.formatSentence(this.correctOrthography(revised.history.historiaFamiliar || ""));
      revised.history.medicamentos = this.formatSentence(this.correctOrthography(revised.history.medicamentos || ""));
      revised.history.habitosVida = this.formatSentence(this.correctOrthography(revised.history.habitosVida || ""));
      revised.history.funcaoIntestinalDiurese = this.formatSentence(this.correctOrthography(revised.history.funcaoIntestinalDiurese || ""));
    }

    // 4. Exame Físico (Todo no presente do indicativo clínico)
    if (revised.exameFisico) {
      revised.exameFisico.estadoGeral = this.adjustVerbTenses(revised.exameFisico.estadoGeral || "", "exameFisico", gender);
      revised.exameFisico.sinaisEspecificos = this.adjustVerbTenses(revised.exameFisico.sinaisEspecificos || "", "exameFisico", gender);
      revised.exameFisico.edema = this.adjustVerbTenses(revised.exameFisico.edema || "", "exameFisico", gender);
      revised.exameFisico.cavidadeOral = this.adjustVerbTenses(revised.exameFisico.cavidadeOral || "", "exameFisico", gender);
      revised.exameFisico.tgi = this.adjustVerbTenses(revised.exameFisico.tgi || "", "exameFisico", gender);
    }

    // 5. Antropometria
    if (revised.antropometria?.historicoPerdaPonderal) {
      revised.antropometria.historicoPerdaPonderal = this.formatSentence(
        this.adjustGenderConcordance(this.correctOrthography(revised.antropometria.historicoPerdaPonderal), gender)
      );
    }
    if (revised.antropometria?.demaisAvaliacoes) {
      revised.antropometria.demaisAvaliacoes = this.formatSentence(
        this.correctOrthography(revised.antropometria.demaisAvaliacoes)
      );
    }

    // 6. Bioquímica (Títulos e interpretações padronizadas)
    if (Array.isArray(revised.bioquimica)) {
      revised.bioquimica.forEach(item => {
        if (item.exame) {
          const orth = this.correctOrthography(item.exame);
          item.exame = this.capitalizeFirstLetter(orth);
        }
        if (item.interpretacao) item.interpretacao = this.formatSentence(this.correctOrthography(item.interpretacao));
      });
    }

    // 7. Consumo Alimentar (Presente habitual)
    if (revised.consumoAlimentar) {
      if (Array.isArray(revised.consumoAlimentar.recordatorio24h)) {
        revised.consumoAlimentar.recordatorio24h.forEach(rec => {
          if (rec && typeof rec === "object") {
            if (rec.refeicao) rec.refeicao = this.capitalizeFirstLetter(this.correctOrthography(rec.refeicao));
            if (rec.alimentos) rec.alimentos = this.formatSentence(this.correctOrthography(rec.alimentos));
          }
        });
      } else if (typeof revised.consumoAlimentar.recordatorio24h === "string") {
        revised.consumoAlimentar.recordatorio24h = this.formatSentence(this.correctOrthography(revised.consumoAlimentar.recordatorio24h));
      }
      if (revised.consumoAlimentar.padraoDiario) revised.consumoAlimentar.padraoDiario = this.formatSentence(this.correctOrthography(revised.consumoAlimentar.padraoDiario));
      if (revised.consumoAlimentar.preferencias) revised.consumoAlimentar.preferencias = this.formatSentence(this.correctOrthography(revised.consumoAlimentar.preferencias));
      if (revised.consumoAlimentar.aversoesIntolerancias) revised.consumoAlimentar.aversoesIntolerancias = this.formatSentence(this.correctOrthography(revised.consumoAlimentar.aversoesIntolerancias));
      if (revised.consumoAlimentar.preferenciasAversoes) revised.consumoAlimentar.preferenciasAversoes = this.adjustVerbTenses(revised.consumoAlimentar.preferenciasAversoes || "", "consumo", gender);
      if (revised.consumoAlimentar.ingestaoHidrica) revised.consumoAlimentar.ingestaoHidrica = this.adjustVerbTenses(revised.consumoAlimentar.ingestaoHidrica || "", "consumo", gender);
      if (revised.consumoAlimentar.rotinaRefeicoes) revised.consumoAlimentar.rotinaRefeicoes = this.formatSentence(this.correctOrthography(revised.consumoAlimentar.rotinaRefeicoes || ""));
      if (revised.consumoAlimentar.quemPrepara) revised.consumoAlimentar.quemPrepara = this.formatSentence(this.correctOrthography(revised.consumoAlimentar.quemPrepara || ""));
    }

    // 8. Equipe Multiprofissional
    if (Array.isArray(revised.equipeMultiprofissional)) {
      revised.equipeMultiprofissional.forEach(prof => {
        if (prof.parecer) {
          prof.parecer = this.adjustVerbTenses(prof.parecer, "multiprofissional", gender);
        }
      });
    }

    // 9. Questões Avaliativas
    if (Array.isArray(revised.questoesAvaliativas)) {
      revised.questoesAvaliativas.forEach((q, idx) => {
        if (q.pergunta) {
          let p = this.correctOrthography(q.pergunta.trim());
          if (!p.endsWith("?") && !p.endsWith(".")) p += "?";
          q.pergunta = this.capitalizeFirstLetter(p);
        }
      });
    }

    // 10. Gabarito
    if (revised.resolucaoGabarito) {
      for (const k of Object.keys(revised.resolucaoGabarito)) {
        if (typeof revised.resolucaoGabarito[k] === "string") {
          revised.resolucaoGabarito[k] = this.formatSentence(this.correctOrthography(revised.resolucaoGabarito[k]));
        }
      }
    }

    return revised;
  }

  // Ajusta e unifica os tempos verbais de acordo com o contexto clínico
  static adjustVerbTenses(text, context, gender = "Feminino") {
    if (!text || typeof text !== "string") return "";
    let s = text.trim();
    if (!s) return "";

    // Aplica primeiro correções ortográficas e de gênero
    s = this.correctOrthography(s);
    s = this.adjustGenderConcordance(s, gender);

    // Contexto: HDA (História da Doença Atual)
    // Regra clínica: Início e evolução no Pretérito (iniciou, apresentou, notou); quadro atual no Presente (apresenta, refere, relata).
    if (context === "hda") {
      // Elimina gerúndios soltos no início de oração
      s = s.replace(/^Tendo\s+/i, "Paciente refere histórico de ");
      s = s.replace(/^Sentindo\s+/i, "Paciente refere que tem sentido ");
      s = s.replace(/^Apresentando\s+/i, "Paciente apresenta ");
      s = s.replace(/^Ganhando\s+/i, "Relata ganho de ");
      s = s.replace(/^Perdendo\s+/i, "Relata perda de ");

      // Padroniza verbos no pretérito para início de sintomas mantendo maiúscula/minúscula
      s = s.replace(/\bcomeça a ter\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Iniciou quadro de" : "iniciou quadro de");
      s = s.replace(/\bcomeçou a ter\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Iniciou quadro de" : "iniciou quadro de");
      s = s.replace(/\bcomeçou ter\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Iniciou" : "iniciou");
      s = s.replace(/\bpassa a sentir\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Passou a apresentar" : "passou a apresentar");
      s = s.replace(/\bvem sentindo\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Tem sentido" : "tem sentido");
      s = s.replace(/\bfoi diagnosticado há\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Recebeu diagnóstico há" : "recebeu diagnóstico há");
      s = s.replace(/\bfoi diagnosticada há\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Recebeu diagnóstico há" : "recebeu diagnóstico há");

      // Verbos de relato atual no presente
      s = s.replace(/\bO paciente relatava\b/gi, "O paciente relata");
      s = s.replace(/\bA paciente relatava\b/gi, "A paciente relata");
      s = s.replace(/\bReferia que\b/gi, "Refere que");
      s = s.replace(/\bNegava dor\b/gi, "Nega dor");
      s = s.replace(/\bNegava febre\b/gi, "Nega febre");
    }

    // Contexto: HPP (História Patológica Pregressa)
    // Regra clínica: Fatos passados e cirurgias no Pretérito Perfeito / Imperfeito
    if (context === "hpp") {
      const isFem = String(gender).toLowerCase().startsWith("f");
      const partIntern = isFem ? "internada" : "internado";
      const partSubmet = isFem ? "submetida" : "submetido";

      s = s.replace(/\bfaz cirurgia\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Realizou cirurgia" : "realizou cirurgia");
      s = s.replace(/\bfez cirurgia\b/gi, (m) => m[0] === m[0].toUpperCase() ? `Foi ${partSubmet} a procedimento cirúrgico` : `foi ${partSubmet} a procedimento cirúrgico`);
      s = s.replace(/\binterna em\b/gi, (m) => m[0] === m[0].toUpperCase() ? `Foi ${partIntern} em` : `foi ${partIntern} em`);
      s = s.replace(/\binternou em\b/gi, (m) => m[0] === m[0].toUpperCase() ? `Esteve ${partIntern} em` : `esteve ${partIntern} em`);
      s = s.replace(/\bopera de\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Operou de" : "operou de");
      s = s.replace(/\btem diagnóstico prévio\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Apresenta histórico de" : "apresenta histórico de");
      s = s.replace(/\bnega cirurgias\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Nega cirurgias prévias" : "nega cirurgias prévias");
      s = s.replace(/\bnega internacoes\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Nega internações prévias" : "nega internações prévias");
    }

    // Contexto: Exame Físico
    // Regra clínica: SEMPRE no Presente do Indicativo da observação médica/clínica
    if (context === "exameFisico") {
      s = s.replace(/\bapresentava\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Apresenta" : "apresenta");
      s = s.replace(/\bestava com\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Encontra-se com" : "encontra-se com");
      s = s.replace(/\bmostrava-se\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Mostra-se" : "mostra-se");
      s = s.replace(/\bnotou-se\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Nota-se" : "nota-se");
      s = s.replace(/\bobservou-se\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Observa-se" : "observa-se");
      s = s.replace(/\bencontrava-se\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Encontra-se" : "encontra-se");
      s = s.replace(/\btinha edemas?\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Apresenta edema" : "apresenta edema");
      s = s.replace(/\bhavia presença de\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Presença de" : "presença de");
    }

    // Contexto: Consumo Alimentar
    // Regra clínica: Presente habitual (consome, ingere, realiza, prefere, rejeita)
    if (context === "consumo") {
      s = s.replace(/\bcomia\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Consome" : "consome");
      s = s.replace(/\bbebia\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Ingere" : "ingere");
      s = s.replace(/\btomava pouca agua\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Apresenta baixa ingestão hídrica" : "apresenta baixa ingestão hídrica");
      s = s.replace(/\bpreferia\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Refere preferência por" : "refere preferência por");
      s = s.replace(/\brejeitava\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Refere aversão a" : "refere aversão a");
      s = s.replace(/\bnão gostava\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Não gosta" : "não gosta");
    }

    // Contexto: Equipe Multiprofissional
    if (context === "multiprofissional") {
      s = s.replace(/\bPaciente internou\b/gi, "Paciente admitido(a)");
      s = s.replace(/\bManteve-se conduta\b/gi, "Mantida conduta");
      s = s.replace(/\bPediu avaliação\b/gi, "Solicito avaliação");
    }

    // Contexto: Queixa Principal
    if (context === "queixa") {
      if (/^(edema|dor|fraqueza|descontrole|falta de ar|cansaco|perda de peso|vomitos|tontura)/i.test(s)) {
        s = "Queixa-se de " + s.charAt(0).toLowerCase() + s.slice(1);
      }
    }

    return this.formatSentence(s);
  }

  // Ajusta a concordância de gênero do paciente (Masculino vs Feminino)
  static adjustGenderConcordance(text, gender = "Feminino") {
    if (!text) return "";
    let s = text;
    const isFem = String(gender).toLowerCase().startsWith("f");

    if (isFem) {
      s = s.replace(/\bo paciente\b/gi, (m) => m[0] === m[0].toUpperCase() ? "A paciente" : "a paciente");
      s = s.replace(/\bdo paciente\b/gi, "da paciente");
      s = s.replace(/\bao paciente\b/gi, "à paciente");
      s = s.replace(/\bpelo paciente\b/gi, "pela paciente");
      s = s.replace(/\bum paciente\b/gi, "uma paciente");
      s = s.replace(/\bdele\b/gi, "dela");
      s = s.replace(/\bnele\b/gi, "nela");

      // Adjetivos e particípios clínicos
      s = s.replace(/\b(admitido)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Admitida" : "admitida");
      s = s.replace(/\b(diagnosticado)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Diagnosticada" : "diagnosticada");
      s = s.replace(/\b(acompanhado)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Acompanhada" : "acompanhada");
      s = s.replace(/\b(encaminhado)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Encaminhada" : "encaminhada");
      s = s.replace(/\b(internado)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Internada" : "internada");
      s = s.replace(/\b(hidratado)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Hidratada" : "hidratada");
      s = s.replace(/\b(corado)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Corada" : "corada");
      s = s.replace(/\b(orientado)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Orientada" : "orientada");
      s = s.replace(/\b(eutrófico)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Eutrófica" : "eutrófica");
      s = s.replace(/\b(desnutrido)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Desnutrida" : "desnutrida");
      s = s.replace(/\b(obeso)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Obesa" : "obesa");
      s = s.replace(/\b(idoso)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Idosa" : "idosa");
      s = s.replace(/\b(aposentado)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Aposentada" : "aposentada");
      s = s.replace(/\b(casado)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Casada" : "casada");
      s = s.replace(/\b(viúvo)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Viúva" : "viúva");
      s = s.replace(/\b(solteiro)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Solteira" : "solteira");
    } else {
      s = s.replace(/\ba paciente\b/gi, (m) => m[0] === m[0].toUpperCase() ? "O paciente" : "o paciente");
      s = s.replace(/\bda paciente\b/gi, "do paciente");
      s = s.replace(/\bà paciente\b/gi, "ao paciente");
      s = s.replace(/\bpela paciente\b/gi, "pelo paciente");
      s = s.replace(/\buma paciente\b/gi, "um paciente");
      s = s.replace(/\bdela\b/gi, "dele");
      s = s.replace(/\bnela\b/gi, "nele");

      // Adjetivos e particípios masculinos
      s = s.replace(/\b(admitida)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Admitido" : "admitido");
      s = s.replace(/\b(diagnosticada)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Diagnosticado" : "diagnosticado");
      s = s.replace(/\b(acompanhada)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Acompanhado" : "acompanhado");
      s = s.replace(/\b(encaminhada)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Encaminhado" : "encaminhado");
      s = s.replace(/\b(internada)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Internado" : "internado");
      s = s.replace(/\b(hidratada)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Hidratado" : "hidratado");
      s = s.replace(/\b(corada)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Corado" : "corado");
      s = s.replace(/\b(orientada)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Orientado" : "orientado");
      s = s.replace(/\b(eutrófica)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Eutrófico" : "eutrófico");
      s = s.replace(/\b(desnutrida)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Desnutrido" : "desnutrido");
      s = s.replace(/\b(obesa)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Obeso" : "obeso");
      s = s.replace(/\b(idosa)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Idoso" : "idoso");
      s = s.replace(/\b(aposentada)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Aposentado" : "aposentado");
      s = s.replace(/\b(casada)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Casado" : "casado");
      s = s.replace(/\b(viúva)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Viúvo" : "viúvo");
      s = s.replace(/\b(solteira)\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Solteiro" : "solteiro");
    }

    return s;
  }

  // Harmoniza estado civil
  static adjustMaritalStatus(status, gender) {
    if (!status || status === "Não informado") return "Não informado";
    const isFem = String(gender).toLowerCase().startsWith("f");
    const s = status.toLowerCase().trim();
    if (s.includes("casad")) return isFem ? "Casada" : "Casado";
    if (s.includes("solteir")) return isFem ? "Solteira" : "Solteiro";
    if (s.includes("viuv") || s.includes("viúv")) return isFem ? "Viúva" : "Viúvo";
    if (s.includes("divorciad")) return isFem ? "Divorciada" : "Divorciado";
    if (s.includes("uniao") || s.includes("união")) return "União estável";
    return this.capitalizeFirstLetter(status);
  }

  // Aplica correções ortográficas médicas do dicionário e pontuação geral
  static correctOrthography(text) {
    if (!text || typeof text !== "string") return "";
    let s = text;

    // Normaliza acentuações do dicionário médico preservando caixa inicial
    for (const [wrong, correct] of Object.entries(this.MEDICAL_SPELL_MAP)) {
      const regex = new RegExp(`\\b${wrong}\\b`, "gi");
      s = s.replace(regex, (m) => {
        if (m[0] === m[0].toUpperCase() && m[0] !== m[0].toLowerCase()) {
          return correct.charAt(0).toUpperCase() + correct.slice(1);
        }
        return correct;
      });
    }

    // Correções de ortografia geral da língua portuguesa
    s = s.replace(/\bvoce\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Você" : "você");
    s = s.replace(/\bja\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Já" : "já");
    s = s.replace(/\bate\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Até" : "até");
    s = s.replace(/\bapos\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Após" : "após");
    s = s.replace(/\bha\s+(\d+)/gi, "há $1");
    s = s.replace(/\bnao\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Não" : "não");
    s = s.replace(/\btambem\b/gi, (m) => m[0] === m[0].toUpperCase() ? "Também" : "também");
    s = s.replace(/\bhorario\b/gi, "horário");
    s = s.replace(/\bhorarios\b/gi, "horários");
    s = s.replace(/\bremedio\b/gi, "remédio");
    s = s.replace(/\bremedios\b/gi, "remédios");
    s = s.replace(/\bmedico\b/gi, "médico");
    s = s.replace(/\bmedicos\b/gi, "médicos");
    s = s.replace(/\bmanha\b/gi, "manhã");
    s = s.replace(/\bcafe\b/gi, "café");
    s = s.replace(/\balmoco\b/gi, "almoço");
    s = s.replace(/\bfeijao\b/gi, "feijão");
    s = s.replace(/\bmacarrao\b/gi, "macarrão");
    s = s.replace(/\bpao\b/gi, "pão");
    s = s.replace(/\bliquido\b/gi, "líquido");
    s = s.replace(/\bliquidos\b/gi, "líquidos");
    s = s.replace(/\bfrequencia\b/gi, "frequência");
    s = s.replace(/\bpaciência\b/gi, "paciência");

    // Limpeza de espaços duplicados
    s = s.replace(/[ \t]+/g, " ");
    s = s.replace(/\s+([,.;?!])/g, "$1");
    return s.trim();
  }

  // Garante a humanização estrita em 1ª pessoa com concordância verbal e pronominal rigorosa (Paciente)
  static harmonizeFirstPerson(text) {
    if (!text) return "";
    let s = text;

    // Converte prefixos formais de prontuário
    s = s.replace(/\bPaciente relata diagnóstico de\b/gi, "Eu tenho diagnóstico de");
    s = s.replace(/\bPaciente relata que nos últimos\b/gi, "Nos últimos");
    s = s.replace(/\bPaciente relata que\b/gi, "Eu ando sentindo que");
    s = s.replace(/\bPaciente relata\b/gi, "Eu tenho");
    s = s.replace(/\bO paciente refere que\b/gi, "Eu sinto que");
    s = s.replace(/\bO paciente refere\b/gi, "Eu sinto");
    s = s.replace(/\bA paciente refere que\b/gi, "Eu sinto que");
    s = s.replace(/\bA paciente refere\b/gi, "Eu sinto");
    s = s.replace(/\bO paciente\b/gi, "eu");
    s = s.replace(/\bA paciente\b/gi, "eu");
    s = s.replace(/\bRefere que nos últimos\b/gi, "Nos últimos");
    s = s.replace(/\bRefere que\b/gi, "Eu sinto que");
    s = s.replace(/\bRefere\b/gi, "Eu sinto");
    s = s.replace(/\bRelata que nos últimos\b/gi, "Nos últimos");
    s = s.replace(/\bRelata que\b/gi, "Eu sinto que");
    s = s.replace(/\bRelata\b/gi, "Eu sinto");
    s = s.replace(/\bApresenta\b/gi, "Eu apresento");
    s = s.replace(/\bNega dor precordial ou dispneia\b/gi, "Graças a Deus não sinto dor no peito nem falta de ar");
    s = s.replace(/\bNega cirurgias prévias ou internações recentes\b/gi, "Nunca fiz nenhuma cirurgia e não precisei internar recentemente");
    s = s.replace(/\bNega tabagismo\b/gi, "Eu não fumo de jeito nenhum");
    s = s.replace(/\bNega\b/gi, "Eu não tenho");
    s = s.replace(/\bdo paciente\b/gi, "meu");
    s = s.replace(/\bda paciente\b/gi, "minha");
    s = s.replace(/\bcom o paciente\b/gi, "comigo");
    s = s.replace(/\bcom a paciente\b/gi, "comigo");
    s = s.replace(/\bao paciente\b/gi, "a mim");
    s = s.replace(/\bà paciente\b/gi, "a mim");

    // CORREÇÃO CRÍTICA DE CONCORDÂNCIA VERBAL EM 1ª PESSOA:
    // Transforma verbos na 3ª pessoa para 1ª pessoa quando o sujeito for "eu"
    s = s.replace(/\b(eu\s+(?:ando\s+sentindo\s+que\s+)?(?:às vezes|as vezes)\s+)esquece\b/gi, "$1esqueço");
    s = s.replace(/\b(sinto\s+que\s+(?:às vezes|as vezes)\s+)esquece\b/gi, "$1esqueço");
    s = s.replace(/\bàs vezes esquece de tomar\b/gi, "às vezes eu esqueço de tomar");
    s = s.replace(/\bas vezes esquece de tomar\b/gi, "às vezes eu esqueço de tomar");
    s = s.replace(/\beu toma\b/gi, "eu tomo");
    s = s.replace(/\beu come\b/gi, "eu como");
    s = s.replace(/\beu bebe\b/gi, "eu bebo");
    s = s.replace(/\beu dorme\b/gi, "eu durmo");
    s = s.replace(/\beu acorda\b/gi, "eu acordo");
    s = s.replace(/\beu tem\b/gi, "eu tenho");
    s = s.replace(/\beu sente\b/gi, "eu sinto");
    s = s.replace(/\beu anda\b/gi, "eu ando");
    s = s.replace(/\beu ganha\b/gi, "eu ganho");
    s = s.replace(/\beu perde\b/gi, "eu perco");
    s = s.replace(/\beu não pratica\b/gi, "eu não pratico");
    s = s.replace(/\beu não consegue\b/gi, "eu não consigo");
    s = s.replace(/\beu não gosta\b/gi, "eu não gosto");
    s = s.replace(/\beu prefere\b/gi, "eu prefiro");

    return s.trim();
  }

  // Formata sentença (maiúscula inicial, ponto final se faltar, limpa espaços)
  static formatSentence(text) {
    if (!text || typeof text !== "string") return "";
    let s = text.trim();
    if (!s) return "";
    s = s.charAt(0).toUpperCase() + s.slice(1);
    if (!/[.!?]$/.test(s)) s += ".";
    return s;
  }

  // Capitaliza cada palavra de um nome próprio (ex: "maria da silva" -> "Maria da Silva")
  static capitalizeWords(text) {
    if (!text) return "";
    const lower = ["da", "de", "do", "das", "dos", "e"];
    return text
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((w, idx) => {
        if (idx > 0 && lower.includes(w)) return w;
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(" ");
  }

  // Capitaliza apenas a primeira letra
  static capitalizeFirstLetter(text) {
    if (!text) return "";
    const s = text.trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
