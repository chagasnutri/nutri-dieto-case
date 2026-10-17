'use client';

import React, { useMemo, useEffect, useState } from 'react';
import {
  analyzePatientMicronutrients,
  MicronutrientKey,
  DriProfile,
  MicronutrientEvaluationItem
} from '../lib/dri';

export interface MicronutrientAdequacySectionProps {
  title?: string;
  subtitle?: string;
  patientAge?: number | string;
  patientSex?: string;
  intakes: Partial<Record<MicronutrientKey, number>>;
  idPrefix?: string;
}

export default function MicronutrientAdequacySection({
  title = 'Análise de Adequação de Micronutrientes (DRIs)',
  subtitle = 'Seleção automática baseada na faixa etária e sexo do paciente. Hierarquia: RDA ➔ EAR ➔ AI e Limite Superior (UL).',
  patientAge = 58,
  patientSex = 'Masculino',
  intakes,
  idPrefix = 'dri'
}: MicronutrientAdequacySectionProps) {
  const [selectedProfile, setSelectedProfile] = useState<DriProfile | null>(null);
  const [evaluatedItems, setEvaluatedItems] = useState<MicronutrientEvaluationItem[]>([]);

  // 2. Lógica de Seleção Automática (Vínculo com o Paciente) via useEffect + função computada
  const computedAnalysis = useMemo(() => {
    return analyzePatientMicronutrients(intakes, patientAge, patientSex);
  }, [intakes, patientAge, patientSex]);

  useEffect(() => {
    setSelectedProfile(computedAnalysis.profile);
    setEvaluatedItems(computedAnalysis.items);
  }, [computedAnalysis]);

  const profile = selectedProfile || computedAnalysis.profile;
  const items = evaluatedItems.length > 0 ? evaluatedItems : computedAnalysis.items;

  return (
    <div
      id={`${idPrefix}-adequacy-container`}
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs shadow-lg"
    >
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
        <div>
          <h4 className="font-bold text-emerald-400 text-xs sm:text-sm flex items-center gap-1.5">
            <span>🧬</span>
            <span>{title}</span>
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-[11px]">
          <span className="text-slate-400 font-medium">Perfil DRI Ativo:</span>
          <span className="font-bold text-emerald-300">
            {profile.sexo} • {profile.faixaEtaria}
          </span>
          <span className="text-slate-500">({patientAge} anos)</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
            <tr>
              <th className="py-2 px-2.5">Micronutriente</th>
              <th className="py-2 px-2.5 text-right">Total Ingerido / Planejado</th>
              <th className="py-2 px-2.5 text-right">Referência DRI (RDA/EAR/AI)</th>
              <th className="py-2 px-2.5 text-right">Limite Máximo (UL)</th>
              <th className="py-2 px-2.5 text-right">% Adequação</th>
              <th className="py-2 px-2.5 text-center">Status de Adequação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {items.map((item) => (
              <tr key={item.key} className="hover:bg-slate-850/60 transition">
                <td className="py-2 px-2.5 font-semibold text-slate-200 flex items-center gap-1.5">
                  <span>{item.icone}</span>
                  <span>{item.nome}</span>
                </td>
                <td className="py-2 px-2.5 text-right font-bold text-white">
                  {item.ingerido} <span className="text-[10px] text-slate-400 font-normal">{item.unidade}</span>
                </td>
                <td className="py-2 px-2.5 text-right text-slate-300 font-medium">
                  {item.referencia} {item.unidade}
                  <span
                    className="ml-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60"
                    title="Parâmetro selecionado automaticamente pela regra de fallback: Prioridade 1 (RDA) > Prioridade 2 (EAR) > Prioridade 3 (AI)"
                  >
                    {item.tipoReferencia}
                  </span>
                </td>
                <td className="py-2 px-2.5 text-right text-slate-400">
                  {item.ul !== null ? `${item.ul} ${item.unidade}` : 'ND (Sem UL)'}
                </td>
                <td className="py-2 px-2.5 text-right font-bold text-slate-300">
                  {item.adequacaoPct}%
                </td>
                <td className="py-2 px-2.5 text-center">
                  <span
                    className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${item.badgeClass}`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
