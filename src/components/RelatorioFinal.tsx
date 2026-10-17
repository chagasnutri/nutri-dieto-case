'use client';

import React from 'react';

// Checa se uma aba ou seção específica está liberada para o aluno neste caso clínico
// Suporta objetos de configuração flexíveis como caseConfig.abasLiberadas, clinicalCase.blockedTabs, etc.
export function isSectionLiberada(sectionKey: string, clinicalCase: any = {}): boolean {
  if (!clinicalCase) return true;

  const norm = (s: any) => String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const normSec = norm(sectionKey);

  const aliasesMap: Record<string, string[]> = {
    anamnese: ["anamnese", "historia", "historiaclinica", "anamneseclinica", "1", "1anamnese", "identificacao"],
    antropometria: ["antropometria", "antropo", "triagem", "2", "2antropometria", "avaliacaoantropometrica"],
    bioquimica: ["bioquimica", "exames", "examesbioquimicos", "laboratorio", "laboratorial", "3", "3bioquimica", "perfilbioquimico"],
    examefisico: ["examefisico", "exame_fisico", "exame-fisico", "examesfisicos", "exames_fisicos", "exames-fisicos", "semiologia", "exames fisicos", "exame fisico", "4", "4examefisico"],
    droganutriente: ["droganutriente", "droga_nutriente", "droga-nutriente", "interacoes", "farmacoterapia", "droga nutriente", "interacaodroganutriente"],
    consumo: ["consumo", "consumoalimentar", "r24h", "recordatorio", "inquerito", "5", "5consumo", "5consumor24h"],
    pes: ["pes", "diagnostico", "diagnosticonutricional", "diagnosticopes", "6", "6diagnosticopes"],
    necessidades: ["necessidades", "calculos", "calculosnecessidades", "formulas", "7", "7calculosdenecessidades", "calculosdenecessidades"],
    prescricao: ["prescricao", "prescricaodietetica", "prescricaodietoterapica", "conduta", "8", "8prescricaodietetica"],
    cardapio: ["cardapio", "planejamento", "planejamentoalimentar", "tne", "9", "9cardapio"],
    questoes: ["questoes", "questoesavaliativas", "perguntas", "avaliacao", "questoes avaliativas", "10", "10questoesavaliativas"]
  };

  let canonical = sectionKey;
  for (const [canon, aliases] of Object.entries(aliasesMap)) {
    if (canon === normSec || aliases.some(a => norm(a) === normSec)) {
      canonical = canon;
      break;
    }
  }

  const currentAliases = aliasesMap[canonical] || [normSec];
  const matchesSection = (val: any) => {
    const n = norm(val);
    return currentAliases.some(a => norm(a) === n || n.includes(norm(a)) || norm(a).includes(n));
  };

  const config = clinicalCase.caseConfig || clinicalCase;
  const abasLiberadas = config.abasLiberadas !== undefined ? config.abasLiberadas : clinicalCase.abasLiberadas;
  const blockedTabs = config.blockedTabs || clinicalCase.blockedTabs;
  const abasBloqueadas = config.abasBloqueadas || clinicalCase.abasBloqueadas;
  const trancadas = config.trancadas || clinicalCase.trancadas;

  if (canonical === "questoes") {
    if (clinicalCase.habilitarQuestoesAvaliativas === false || config.habilitarQuestoesAvaliativas === false) {
      return false;
    }
  }

  const checkBlockedArray = (arr: any) => {
    if (!Array.isArray(arr)) return false;
    return arr.some(item => matchesSection(item));
  };

  if (checkBlockedArray(blockedTabs) || checkBlockedArray(abasBloqueadas) || checkBlockedArray(trancadas)) {
    return false;
  }

  if (abasLiberadas !== undefined && abasLiberadas !== null) {
    if (Array.isArray(abasLiberadas)) {
      return abasLiberadas.some(item => matchesSection(item));
    }

    if (typeof abasLiberadas === "object") {
      let hasExplicitMatch = false;
      let matchResult = true;

      for (const [key, val] of Object.entries(abasLiberadas)) {
        if (matchesSection(key)) {
          hasExplicitMatch = true;
          if (val === false || val === "false" || val === 0 || val === "bloqueada" || val === "trancada" || val === "oculta" || val === "hidden") {
            return false;
          }
          if (val === true || val === "true" || val === 1 || val === "liberada" || val === "aberta" || val === "visible") {
            matchResult = true;
          }
        }
      }

      if (hasExplicitMatch) {
        return matchResult;
      }

      const entries = Object.entries(abasLiberadas);
      const hasAnyExplicitFalse = entries.some(([_, v]) => v === false || v === "false" || v === "bloqueada" || v === "trancada" || v === "oculta");
      const hasAnyExplicitTrue = entries.some(([_, v]) => v === true || v === "true" || v === "liberada" || v === 1);

      if (hasAnyExplicitTrue && !hasAnyExplicitFalse) {
        return false;
      }
    }
  }

  return true;
}

interface RelatorioFinalProps {
  draftData?: any;
  studentData?: any;
  clinicalCase?: any;
  onClose?: () => void;
}

// 1.1, 1.2, 1.3: Seção Anamnese & Identificação
export function AnamneseSection({ data, clinicalCase }: { data: any; clinicalCase: any }) {
  if (!isSectionLiberada("anamnese", clinicalCase)) {
    return null;
  }

  const anamnese = data.anamnese || {};
  const patient = clinicalCase.patient || {};
  const patName = data.dadosPacienteReal?.nome || patient.name || "Paciente Simulado";
  const patAge = data.dadosPacienteReal?.idade ? `${data.dadosPacienteReal.idade} anos` : (patient.age ? `${patient.age} anos` : "Não informada / ---");
  const patGender = data.dadosPacienteReal?.sexo || patient.gender || "Não informado / ---";
  const patOccupation = data.dadosPacienteReal?.ocupacao || patient.occupation || "Não informada / ---";
  const hipoteseDiagnostica = data.dadosPacienteReal?.hipoteseDiagnostica || anamnese.hipoteseDiagnostica || clinicalCase.hipoteseDiagnostica || clinicalCase.history?.hipoteseDiagnostica || "Não informada / ---";

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">1.1. Identificação do Paciente &amp; Histórico Social</h3>
      <table className="w-full text-xs border border-slate-300">
        <thead className="bg-slate-100">
          <tr>
            <th className="border border-slate-300 px-3 py-1.5 text-left text-slate-700 font-bold w-1/3">Campo de Identificação / Social</th>
            <th className="border border-slate-300 px-3 py-1.5 text-left text-slate-700 font-bold">Informação Registrada</th>
          </tr>
        </thead>
        <tbody>
          <tr><td className="border border-slate-300 px-3 py-1 bg-white font-medium">Nome do Paciente:</td><td className="border border-slate-300 px-3 py-1 bg-white">{patName}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1 bg-slate-50 font-medium">Idade:</td><td className="border border-slate-300 px-3 py-1 bg-slate-50">{patAge}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1 bg-white font-medium">Gênero / Sexo:</td><td className="border border-slate-300 px-3 py-1 bg-white">{patGender}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1 bg-slate-50 font-medium">Naturalidade:</td><td className="border border-slate-300 px-3 py-1 bg-slate-50">{data.dadosPacienteReal?.naturalidade || anamnese.naturalidade || patient.naturalidade || "Não informada / ---"}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1 bg-white font-medium">Procedência:</td><td className="border border-slate-300 px-3 py-1 bg-white">{data.dadosPacienteReal?.procedencia || anamnese.procedencia || patient.procedencia || "Não informada / ---"}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1 bg-slate-50 font-medium">Profissão / Ocupação:</td><td className="border border-slate-300 px-3 py-1 bg-slate-50">{patOccupation}</td></tr>
        </tbody>
      </table>

      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1 mt-4">1.2. Diagnóstico Médico de Base &amp; Queixa Principal</h3>
      <div className="bg-red-50 border-l-4 border-red-700 p-3 rounded text-xs text-red-950 font-medium">
        <strong>Hipótese Diagnóstica / Diagnóstico Médico:</strong> {hipoteseDiagnostica}
      </div>
      <p className="text-xs text-slate-700"><strong>Queixa Principal:</strong> {anamnese.queixaPrincipal || "Não preenchida / ---"}</p>
      <p className="text-xs text-slate-700"><strong>História da Doença Atual (HDA):</strong> {anamnese.historiaClinica || "Não preenchida / ---"}</p>

      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1 mt-4">1.3. Antecedentes Patológicos, Medicamentos e Estilo de Vida</h3>
      <p className="text-xs text-slate-700"><strong>Antecedentes e Medicamentos:</strong> {anamnese.antecedentesMedicamentos || "Não preenchido / ---"}</p>
      <p className="text-xs text-slate-700"><strong>Hábitos e Estilo de Vida:</strong> {anamnese.habitosEstiloVida || "Não preenchido / ---"}</p>
    </div>
  );
}

// 1.4: Droga-Nutriente
export function DrogaNutrienteSection({ data, clinicalCase }: { data: any; clinicalCase: any }) {
  if (!isSectionLiberada("droganutriente", clinicalCase)) {
    return null;
  }

  const interacoes = data.interacaoDrogaNutriente || data.interactions || [];

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">1.4. Interações Droga-Nutriente &amp; Farmacoterapia Aplicada</h3>
      <table className="w-full text-xs border border-slate-300">
        <thead className="bg-slate-100">
          <tr>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold">Medicação</th>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold">Classificação</th>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold">Interação / Conduta</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(interacoes) && interacoes.length > 0 ? (
            interacoes.map((it: any, idx: number) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="border border-slate-300 px-3 py-1 font-semibold">{it.medicacao || it.medicamento || "---"}</td>
                <td className="border border-slate-300 px-3 py-1">{it.classificacao || it.nutrientes || "---"}</td>
                <td className="border border-slate-300 px-3 py-1">{it.interacao || it.conduta || "Não preenchido / ---"}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={3} className="border border-slate-300 px-3 py-1 text-center text-slate-500">Nenhuma interação registrada</td></tr>
          )}
        </tbody>
      </table>
      <p className="text-xs text-slate-700"><strong>Observações Farmacoterapêuticas:</strong> {data.observacoesFarmacoterapia || "Não preenchido / ---"}</p>
    </div>
  );
}

// 1.5: Avaliação Antropométrica
export function AntropometriaSection({ data, clinicalCase }: { data: any; clinicalCase: any }) {
  if (!isSectionLiberada("antropometria", clinicalCase)) {
    return null;
  }

  const antro = data.antropometria || {};

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">1.5. Avaliação Antropométrica e Estado Nutricional</h3>
      <table className="w-full text-xs border border-slate-300">
        <thead className="bg-slate-100">
          <tr>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold w-1/3">Parâmetro Antropométrico</th>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold w-1/3">Valor Coletado / Calculado</th>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold">Classificação / Observação Clínica</th>
          </tr>
        </thead>
        <tbody>
          <tr><td className="border border-slate-300 px-3 py-1 font-medium">Peso Atual (Aferido)</td><td className="border border-slate-300 px-3 py-1">{antro.pesoAtual ? `${antro.pesoAtual} kg` : (antro.pesoEstimadoChumlea ? `${antro.pesoEstimadoChumlea} kg (Chumlea)` : "Não aferido / ---")}</td><td className="border border-slate-300 px-3 py-1">{antro.pesoAtual ? "Medição direta" : "-"}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1 font-medium">Estatura (Aferida)</td><td className="border border-slate-300 px-3 py-1">{antro.estatura ? `${antro.estatura} m` : (antro.estaturaEstimadaChumlea ? `${antro.estaturaEstimadaChumlea} m (Chumlea)` : "Não aferida / ---")}</td><td className="border border-slate-300 px-3 py-1">{antro.estatura ? "Medição direta" : "-"}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1 font-medium">Altura do Joelho (AJ)</td><td className="border border-slate-300 px-3 py-1">{antro.alturaJoelho ? `${antro.alturaJoelho} cm` : "Não aferida / ---"}</td><td className="border border-slate-300 px-3 py-1">Parâmetro de Chumlea</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1 font-medium">Circunferência do Braço (CB)</td><td className="border border-slate-300 px-3 py-1">{antro.circBraco ? `${antro.circBraco} cm` : "Não aferida / ---"}</td><td className="border border-slate-300 px-3 py-1">Reserva muscular</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1 font-medium">Índice de Massa Corporal (IMC)</td><td className="border border-slate-300 px-3 py-1">{antro.imc ? `${antro.imc} kg/m²` : "Não calculado / ---"}</td><td className="border border-slate-300 px-3 py-1">{antro.classificacaoImc ? `${antro.classificacaoImc} (${antro.criterioClassificacao || 'OMS'})` : "-"}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1 font-medium">Circunferência da Panturrilha (CP)</td><td className="border border-slate-300 px-3 py-1">{antro.circPanturrilha ? `${antro.circPanturrilha} cm` : "Não aferida / ---"}</td><td className="border border-slate-300 px-3 py-1">Massa muscular esquelética</td></tr>
        </tbody>
      </table>
      <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded text-xs text-blue-950 font-medium">
        <strong>DIAGNÓSTICO NUTRICIONAL POR EXTENSO (ESTADO PONDERAL):</strong> {antro.diagnosticoNutricionalExtenso || "Não preenchido / ---"}
      </div>
    </div>
  );
}

// 1.6: Bioquímica
export function BioquimicaSection({ data, clinicalCase }: { data: any; clinicalCase: any }) {
  if (!isSectionLiberada("bioquimica", clinicalCase)) {
    return null;
  }

  const bio = data.bioquimica || {};
  const exams = bio.exames || data.exams || clinicalCase.bioquimica || [];

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">1.6. Avaliação Bioquímica Relevante e Raciocínio Clínico</h3>
      <table className="w-full text-xs border border-slate-300">
        <thead className="bg-slate-100">
          <tr>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold">Exame Bioquímico</th>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold">Referência</th>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold">Valor Achado</th>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold">Interpretação Clínica</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(exams) && exams.length > 0 ? (
            exams.map((ex: any, idx: number) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="border border-slate-300 px-3 py-1 font-semibold">{ex.exame || ex.nome || "Não preenchido"}</td>
                <td className="border border-slate-300 px-3 py-1">{ex.referencia || "---"}</td>
                <td className="border border-slate-300 px-3 py-1">{ex.valor || "---"}</td>
                <td className="border border-slate-300 px-3 py-1">{ex.interpretacao || bio.interpretacoes?.[ex.exame] || "Não preenchido / ---"}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={4} className="border border-slate-300 px-3 py-1 text-center text-slate-500">Nenhum exame cadastrado</td></tr>
          )}
        </tbody>
      </table>
      <div className="bg-emerald-50 border-l-4 border-emerald-600 p-3 rounded text-xs text-emerald-950 font-medium">
        <strong>SÍNTESE E RACIOCÍNIO CLÍNICO-NUTRICIONAL GLOBAL:</strong> {bio.interpretacaoNutricional || "Não preenchido / ---"}
      </div>
    </div>
  );
}

// 1.7: Exame Físico
export function ExameFisicoSection({ data, clinicalCase }: { data: any; clinicalCase: any }) {
  if (!isSectionLiberada("examefisico", clinicalCase)) {
    return null;
  }

  const ef = data.exameFisico || {};
  const sis = ef.orgaosSistemas || {};
  const comp = ef.compartimentos || {};

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">1.7. Exame Físico Nutricional e Semiologia Clínica</h3>
      <h4 className="text-xs font-bold text-slate-700">Parte A - Avaliação dos Órgãos e Sistemas</h4>
      <table className="w-full text-xs border border-slate-300">
        <thead className="bg-slate-100">
          <tr>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold w-1/3">Sistema Orgânico</th>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold">Avaliação Clínica / Achados</th>
          </tr>
        </thead>
        <tbody>
          <tr><td className="border border-slate-300 px-3 py-1 font-medium">Neurológico</td><td className="border border-slate-300 px-3 py-1">{sis.neurologico || "Sem alterações relatadas / Não preenchido"}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1 font-medium">Respiratório</td><td className="border border-slate-300 px-3 py-1">{sis.respiratorio || "Sem alterações relatadas / Não preenchido"}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1 font-medium">Digestório</td><td className="border border-slate-300 px-3 py-1">{sis.digestorio || "Sem alterações relatadas / Não preenchido"}</td></tr>
        </tbody>
      </table>

      <h4 className="text-xs font-bold text-slate-700 mt-3">Parte B - Semiologia Nutricional por Compartimentos Anatômicos</h4>
      <table className="w-full text-xs border border-slate-300">
        <thead className="bg-slate-100">
          <tr>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold w-1/3">Compartimento</th>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold">Semiologia Nutricional</th>
          </tr>
        </thead>
        <tbody>
          <tr><td className="border border-slate-300 px-3 py-1 font-medium">Cabeça e Cavidade Oral</td><td className="border border-slate-300 px-3 py-1">{comp.cabeca || "Sem alterações evidentes / Não preenchido"}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1 font-medium">Membros Superiores (MMSS)</td><td className="border border-slate-300 px-3 py-1">{comp.mmss || "Sem alterações evidentes / Não preenchido"}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1 font-medium">Membros Inferiores (MMII)</td><td className="border border-slate-300 px-3 py-1">{comp.mmii || "Sem alterações evidentes / Não preenchido"}</td></tr>
        </tbody>
      </table>
      <p className="text-xs text-slate-700"><strong>Sinais Clínicos e Achados Adicionais:</strong> {ef.sinaisClinicos || "Não preenchido / ---"}</p>
    </div>
  );
}

// 1.8: Consumo Alimentar & R24h
export function ConsumoSection({ data, clinicalCase }: { data: any; clinicalCase: any }) {
  if (!isSectionLiberada("consumo", clinicalCase)) {
    return null;
  }

  const ca = data.consumoAlimentar || {};
  const recItems = ca.refeicoesRecordatorio || data.recordatorioItems || [];

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">1.8. Consumo Alimentar e Inquérito Nutricional</h3>
      <p className="text-xs text-slate-700"><strong>Resumo do Padrão Dietético:</strong> {ca.inqueritoResumo || "Não preenchido / ---"}</p>
      <p className="text-xs text-slate-700"><strong>Ingestão Hídrica:</strong> {ca.aguaPreferenciasAversoes || "Não preenchido / ---"}</p>

      <h4 className="text-xs font-bold text-slate-700 mt-3">1.8.1. Refeições e Alimentos no Recordatório de 24h</h4>
      <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded p-3">
        {Array.isArray(recItems) && recItems.length > 0 ? (
          recItems.map((r: any, idx: number) => (
            <div key={idx} className="mb-2">
              <strong>{r.refeicao || r.nome} ({r.horario || '--:--'}):</strong> {r.alimentos || (r.itens?.map((it: any) => `${it.alimentoNome || it.nome} (${it.gramatura || it.gramas || 0}g)`).join(", ")) || "Não detalhado"}
            </div>
          ))
        ) : (
          <p className="text-slate-500">Nenhuma refeição detalhada no recordatório alimentar.</p>
        )}
      </div>
    </div>
  );
}

// 2.1: Diagnóstico PES
export function DiagnosticoPesSection({ data, clinicalCase }: { data: any; clinicalCase: any }) {
  if (!isSectionLiberada("pes", clinicalCase)) {
    return null;
  }

  const pes = data.diagnosticoPES || {};

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">2.1. Diagnóstico em Nutrição (Metodologia PES)</h3>
      <div className="bg-emerald-50 border-l-4 border-emerald-700 p-3 rounded text-xs text-emerald-950 font-medium">
        <strong>DIAGNÓSTICO EM NUTRIÇÃO (PES):</strong> {pes.textoCompletoPES || `Problema (P): ${pes.problema || 'Não informado'} | Relacionado a (E): ${pes.etiologia || 'Não informada'} | Evidenciado por (S): ${pes.sinaisSintomas || 'Não informado'}`}
      </div>
      <h4 className="text-xs font-bold text-slate-700 mt-2">2.1.1. Objetivos Dietoterápicos e Metas do Cuidado</h4>
      <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-700">
        {pes.objetivosDietoterapicos || "Não preenchido"}
      </div>
    </div>
  );
}

// 2.2: Cálculos de Necessidades
export function CalculoNecessidadesSection({ data, clinicalCase }: { data: any; clinicalCase: any }) {
  if (!isSectionLiberada("necessidades", clinicalCase)) {
    return null;
  }

  const calc = data.calculoNecessidades || {};

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">2.2. Cálculos de Necessidades Energéticas e Equações Preditivas</h3>
      <div className="bg-teal-50 border-l-4 border-teal-600 p-3 rounded text-xs text-teal-950 font-medium">
        <strong>DECISÃO CLÍNICA E VET PLANEJADO:</strong> VET Planejado: {calc.vetPlanejadoKcal ? `${calc.vetPlanejadoKcal} kcal/dia` : "Não preenchido / ---"} | Justificativa: {calc.justificativaEscolha || "Não preenchido / ---"}
      </div>
    </div>
  );
}

// 2.3: Prescrição Dietoterápica
export function PrescricaoSection({ data, clinicalCase }: { data: any; clinicalCase: any }) {
  if (!isSectionLiberada("prescricao", clinicalCase)) {
    return null;
  }

  const presc = data.prescricaoDietoterapica || {};

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">2.3. Determinação das Necessidades Energéticas e Distribuição de Macros</h3>
      <table className="w-full text-xs border border-slate-300">
        <thead className="bg-slate-100">
          <tr>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold">Parâmetro Prescrito</th>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold">Faixa / Valor</th>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold">Kcal e Gramas</th>
          </tr>
        </thead>
        <tbody>
          <tr><td className="border border-slate-300 px-3 py-1 font-medium">VET Total</td><td className="border border-slate-300 px-3 py-1">{presc.vetKcal ? `${presc.vetKcal} kcal/dia` : "---"}</td><td className="border border-slate-300 px-3 py-1">Meta calórica planejada</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1 font-medium">Carboidratos (CHO)</td><td className="border border-slate-300 px-3 py-1">{presc.carboidratosPct ? `${presc.carboidratosPct}%` : "---"}</td><td className="border border-slate-300 px-3 py-1">{presc.carboidratosG ? `${presc.carboidratosG} g` : "---"}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1 font-medium">Proteínas (PTN)</td><td className="border border-slate-300 px-3 py-1">{presc.proteinasPct ? `${presc.proteinasPct}%` : "---"}</td><td className="border border-slate-300 px-3 py-1">{presc.proteinasG ? `${presc.proteinasG} g (${presc.proteinasGKg || '--'} g/kg)` : "---"}</td></tr>
          <tr><td className="border border-slate-300 px-3 py-1 font-medium">Lipídios (LIP)</td><td className="border border-slate-300 px-3 py-1">{presc.lipidiosPct ? `${presc.lipidiosPct}%` : "---"}</td><td className="border border-slate-300 px-3 py-1">{presc.lipidiosG ? `${presc.lipidiosG} g` : "---"}</td></tr>
        </tbody>
      </table>
      <p className="text-xs text-slate-700"><strong>Justificativa Fisiopatológica:</strong> {presc.justificativaFisiopatologica || "Não preenchido / ---"}</p>
    </div>
  );
}

// Seção 3: Cardápio TACO ou TNE
export function CardapioSection({ data, clinicalCase }: { data: any; clinicalCase: any }) {
  if (!isSectionLiberada("cardapio", clinicalCase)) {
    return null;
  }

  const rawPlano = data.planejamentoAlimentar;
  const plano = Array.isArray(rawPlano) ? rawPlano : (Array.isArray(rawPlano?.refeicoes) ? rawPlano.refeicoes : (data.cardapioItems || []));

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">3. Planejamento Alimentar Quali-Quantitativo (Cardápio TACO)</h3>
      <table className="w-full text-xs border border-slate-300">
        <thead className="bg-slate-100">
          <tr>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold w-1/4">Refeição / Horário</th>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold">Alimentos e Gramaturas</th>
            <th className="border border-slate-300 px-3 py-1.5 text-left font-bold w-1/4">Substituições</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(plano) && plano.length > 0 ? (
            plano.map((r: any, idx: number) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="border border-slate-300 px-3 py-1 font-semibold">{r.refeicao || r.nome || "Refeição"} ({r.horario || '--:--'})</td>
                <td className="border border-slate-300 px-3 py-1">{Array.isArray(r.itens) ? r.itens.map((it: any) => `• ${it.alimentoNome || it.nome} (${it.gramatura || it.gramas || 0}g) [${it.kcal || 0} kcal]`).join("\n") : (r.alimentoNome || r.alimentos || "Não informado")}</td>
                <td className="border border-slate-300 px-3 py-1">{r.substituicoes || "Não descrita"}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={3} className="border border-slate-300 px-3 py-1 text-center text-slate-500">Nenhuma refeição detalhada no cardápio.</td></tr>
          )}
        </tbody>
      </table>
      <p className="text-xs text-slate-700"><strong>Orientações Nutricionais de Alta:</strong> {data.orientacoesNutricionais || "Não preenchido / ---"}</p>
    </div>
  );
}

// Seção 4: Questões Avaliativas
export function QuestoesSection({ data, clinicalCase }: { data: any; clinicalCase: any }) {
  if (data.isRealPatient === true || clinicalCase?.isRealCase === true || !isSectionLiberada("questoes", clinicalCase)) {
    return null;
  }

  const questoes = clinicalCase.questoesAvaliativas || [];
  const respostas = data.respostasQuestoes || {};

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">4. Avaliação Acadêmica &amp; Questões Avaliativas</h3>
      {questoes.length > 0 ? (
        questoes.map((q: any, idx: number) => (
          <div key={q.id || idx} className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1">
            <strong className="text-slate-900 block font-bold">Questão {idx + 1}: {q.pergunta}</strong>
            <div className="bg-sky-50 border-l-4 border-sky-600 p-2 text-sky-950 font-medium">
              <strong>Resposta do Estudante:</strong> {respostas[q.id] || "Questão não respondida pelo estudante."}
            </div>
          </div>
        ))
      ) : (
        <p className="text-xs text-slate-500">Não foram cadastradas questões avaliativas específicas para este caso.</p>
      )}
    </div>
  );
}

// Componente Principal do Relatório Final (Tela e PDF)
export default function RelatorioFinal({ draftData = {}, studentData, clinicalCase = {}, onClose }: RelatorioFinalProps) {
  const mergedData = studentData || draftData || {};
  const aluno = mergedData.aluno || {};
  const patient = clinicalCase.patient || {};
  const patName = mergedData.dadosPacienteReal?.nome || patient.name || "Paciente Simulado";

  const handlePrint = () => {
    window.print();
  };

  const hasSec1 = isSectionLiberada("anamnese", clinicalCase) ||
                  isSectionLiberada("droganutriente", clinicalCase) ||
                  isSectionLiberada("antropometria", clinicalCase) ||
                  isSectionLiberada("bioquimica", clinicalCase) ||
                  isSectionLiberada("examefisico", clinicalCase) ||
                  isSectionLiberada("consumo", clinicalCase);

  const hasSec2 = isSectionLiberada("pes", clinicalCase) ||
                  isSectionLiberada("necessidades", clinicalCase) ||
                  isSectionLiberada("prescricao", clinicalCase);

  return (
    <div className="w-full max-w-5xl mx-auto bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-xl print:p-0 print:shadow-none print:max-w-none">
      {/* Botões Superiores de Ação (Ocultos na Impressão) */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6 print:hidden">
        <div>
          <h2 className="text-lg font-black text-emerald-800">Visualização do Relatório Final (DietoCase)</h2>
          <p className="text-xs text-slate-500">Apenas as seções ativamente liberadas pelo professor são renderizadas e impressas.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>🖨️ Imprimir / Salvar em PDF</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer"
            >
              Fechar
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo Imprimível do Relatório */}
      <div className="print-content space-y-6">
        {/* Cabeçalho Institucional */}
        <div className="text-center space-y-1 border-b border-slate-300 pb-4">
          <h1 className="text-base sm:text-lg font-black text-emerald-800 uppercase tracking-tight">DietoCase - Disciplina de Dietoterapia</h1>
          <h2 className="text-xs sm:text-sm font-bold text-slate-600 uppercase">Relatório Clínico-Nutricional e Conduta Dietoterápica</h2>
          <p className="text-[11px] text-slate-500">Estudante: {aluno.nome || "Não informado"} | Matrícula: {aluno.matriculaTurma || "Não informada"} | Caso: {clinicalCase.title || "Caso Clínico"}</p>
        </div>

        {/* SEÇÃO 1: PRONTUÁRIO CLÍNICO-NUTRICIONAL (ANAMNESE) */}
        {hasSec1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase bg-slate-100 p-2 rounded border-l-4 border-emerald-600">
              1. Prontuário Clínico-Nutricional (Anamnese)
            </h2>
            <AnamneseSection data={mergedData} clinicalCase={clinicalCase} />
            <DrogaNutrienteSection data={mergedData} clinicalCase={clinicalCase} />
            <AntropometriaSection data={mergedData} clinicalCase={clinicalCase} />
            <BioquimicaSection data={mergedData} clinicalCase={clinicalCase} />
            <ExameFisicoSection data={mergedData} clinicalCase={clinicalCase} />
            <ConsumoSection data={mergedData} clinicalCase={clinicalCase} />
          </div>
        )}

        {/* SEÇÃO 2: RESOLUÇÃO DIETOTERÁPICA E CONDUTA NUTRICIONAL */}
        {hasSec2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase bg-slate-100 p-2 rounded border-l-4 border-emerald-600">
              2. Resolução Dietoterápica e Conduta Nutricional
            </h2>
            <DiagnosticoPesSection data={mergedData} clinicalCase={clinicalCase} />
            <CalculoNecessidadesSection data={mergedData} clinicalCase={clinicalCase} />
            <PrescricaoSection data={mergedData} clinicalCase={clinicalCase} />
          </div>
        )}

        {/* SEÇÃO 3: CARDÁPIO TACO */}
        <CardapioSection data={mergedData} clinicalCase={clinicalCase} />

        {/* SEÇÃO 4: QUESTÕES AVALIATIVAS */}
        <QuestoesSection data={mergedData} clinicalCase={clinicalCase} />

        {/* Rodapé Obrigatório */}
        <footer className="border-t border-slate-300 pt-3 text-center text-[10px] text-slate-500 mt-8">
          <p className="font-bold text-slate-700">© 2026 DietoCase - Desenvolvido por Prof. Chagas Neto. Todos os direitos reservados.</p>
          <p>Laboratório Interativo de Nutrição Clínica • Emissão do Relatório Oficial</p>
        </footer>
      </div>
    </div>
  );
}
