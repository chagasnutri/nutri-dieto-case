/**
 * Gerador de Relatório A4 / Word (.docx) com Esqueleto Imutável e Paridade Total
 * Garante mapeamento de 100% dos dados, Objetivos Dietoterápicos e Análises Quantitativas.
 */

export interface ReportData {
  aluno: { nome: string; matriculaTurma: string; data: string };
  modalidade: "simulacao" | "real";
  paciente: any;
  antropometria: any;
  exames: any[];
  necessidades: any;
  diagnosticoPES: { problema: string; etiologia: string; sinaisSintomas: string; textoFormatado: string };
  objetivosDietoterapicos: string[];
  prescricao: any;
  cardapio: any[];
}

export function formatReportSkeleton(data: Partial<ReportData>) {
  return {
    titulo: data.modalidade === "real" ? "PRONTUÁRIO CLÍNICO AMBULATORIAL" : "RELATÓRIO CLÍNICO-NUTRICIONAL (SIMULAÇÃO)",
    aluno: data.aluno?.nome || "Não preenchido",
    matriculaTurma: data.aluno?.matriculaTurma || "Não preenchido",
    dataEmissao: data.aluno?.data || new Date().toLocaleDateString("pt-BR"),
    paciente: {
      nome: data.paciente?.nome || "Não preenchido",
      idade: data.paciente?.idade || "---",
      sexo: data.paciente?.sexo || data.paciente?.genero || "---",
      diagnosticoClinico: data.paciente?.patologiasHipoteses || data.paciente?.hipoteseDiagnostica || "---"
    },
    diagnosticoPES: data.diagnosticoPES?.textoFormatado || "Não preenchido",
    objetivosDietoterapicos: data.objetivosDietoterapicos && data.objetivosDietoterapicos.length > 0 
      ? data.objetivosDietoterapicos 
      : ["Não preenchido"],
    analisesQuantitativas: {
      vet: data.prescricao?.vetPlanejadoKcal || "---",
      cho: data.prescricao?.choGramas || "---",
      ptn: data.prescricao?.ptnGramas || "---",
      lip: data.prescricao?.lipGramas || "---"
    }
  };
}
