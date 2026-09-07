'use client';

import React, { useState } from 'react';

interface LipidQualityProps {
  title: string;
  subtitle?: string;
  vetKcal: number;
  theme?: 'emerald' | 'indigo';
  defaultValues?: {
    satG?: string;
    satPct?: string;
    monoG?: string;
    monoPct?: string;
    poliG?: string;
    poliPct?: string;
  };
}

export default function LipidQualitySection({
  title,
  subtitle = 'Distribuição de ácidos graxos com conversão automática (1g de lipídio = 9 kcal) e validação de diretrizes.',
  vetKcal,
  theme = 'emerald',
  defaultValues
}: LipidQualityProps) {
  const [satG, setSatG] = useState(defaultValues?.satG || '');
  const [satPct, setSatPct] = useState(defaultValues?.satPct || '');
  const [monoG, setMonoG] = useState(defaultValues?.monoG || '');
  const [monoPct, setMonoPct] = useState(defaultValues?.monoPct || '');
  const [poliG, setPoliG] = useState(defaultValues?.poliG || '');
  const [poliPct, setPoliPct] = useState(defaultValues?.poliPct || '');

  // Conversão bidirecional: 1g = 9 kcal
  const handleSatGChange = (val: string) => {
    setSatG(val);
    const num = parseFloat(val.replace(',', '.'));
    if (!isNaN(num) && vetKcal > 0) {
      setSatPct(((num * 9 / vetKcal) * 100).toFixed(1));
    } else if (val === '') {
      setSatPct('');
    }
  };

  const handleSatPctChange = (val: string) => {
    setSatPct(val);
    const num = parseFloat(val.replace(',', '.'));
    if (!isNaN(num) && vetKcal > 0) {
      setSatG(((num * vetKcal / 100) / 9).toFixed(1));
    } else if (val === '') {
      setSatG('');
    }
  };

  const handleMonoGChange = (val: string) => {
    setMonoG(val);
    const num = parseFloat(val.replace(',', '.'));
    if (!isNaN(num) && vetKcal > 0) {
      setMonoPct(((num * 9 / vetKcal) * 100).toFixed(1));
    } else if (val === '') {
      setMonoPct('');
    }
  };

  const handleMonoPctChange = (val: string) => {
    setMonoPct(val);
    const num = parseFloat(val.replace(',', '.'));
    if (!isNaN(num) && vetKcal > 0) {
      setMonoG(((num * vetKcal / 100) / 9).toFixed(1));
    } else if (val === '') {
      setMonoG('');
    }
  };

  const handlePoliGChange = (val: string) => {
    setPoliG(val);
    const num = parseFloat(val.replace(',', '.'));
    if (!isNaN(num) && vetKcal > 0) {
      setPoliPct(((num * 9 / vetKcal) * 100).toFixed(1));
    } else if (val === '') {
      setPoliPct('');
    }
  };

  const handlePoliPctChange = (val: string) => {
    setPoliPct(val);
    const num = parseFloat(val.replace(',', '.'));
    if (!isNaN(num) && vetKcal > 0) {
      setPoliG(((num * vetKcal / 100) / 9).toFixed(1));
    } else if (val === '') {
      setPoliG('');
    }
  };

  // Avaliação das Diretrizes
  const getSatBadge = () => {
    const val = parseFloat(satPct.replace(',', '.'));
    if (isNaN(val) || satPct.trim() === '') {
      return { text: 'Aguardando Dados', className: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
    if (val < 10) {
      return { text: 'Adequado (< 10%)', className: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' };
    }
    return { text: 'Inadequado (≥ 10%)', className: 'bg-rose-950/80 text-rose-300 border-rose-500/50' };
  };

  const getMonoBadge = () => {
    const val = parseFloat(monoPct.replace(',', '.'));
    if (isNaN(val) || monoPct.trim() === '') {
      return { text: 'Aguardando Dados', className: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
    if (val <= 20) {
      return { text: 'Adequado (Até 20%)', className: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' };
    }
    return { text: 'Inadequado (> 20%)', className: 'bg-rose-950/80 text-rose-300 border-rose-500/50' };
  };

  const getPoliBadge = () => {
    const val = parseFloat(poliPct.replace(',', '.'));
    if (isNaN(val) || poliPct.trim() === '') {
      return { text: 'Aguardando Dados', className: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
    if (val <= 10.5) {
      return { text: 'Adequado (Média ~10%)', className: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' };
    }
    return { text: 'Inadequado (> 10%)', className: 'bg-rose-950/80 text-rose-300 border-rose-500/50' };
  };

  const satBadge = getSatBadge();
  const monoBadge = getMonoBadge();
  const poliBadge = getPoliBadge();

  return (
    <div className=bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3>
      <div className=flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-2>
        <div>
          <h4 className=text-xs font-bold text-slate-200 flex items-center gap-1.5>
            <span>🥑</span>
            <span>{title}</span>
          </h4>
          <p className=text-[11px] text-slate-400 mt-0.5>{subtitle}</p>
        </div>
        <div className=text-[11px] bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300 font-mono self-start sm:self-auto>
          VET de Referência: <strong className=text-amber-300>{vetKcal} kcal</strong>
        </div>
      </div>

      <div className=grid grid-cols-1 md:grid-cols-3 gap-3>
        {/* Saturadas */}
        <div className=bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-2>
          <div className=flex items-center justify-between>
            <span className=text-xs font-bold text-slate-200>Saturadas (SAT)</span>
            <span className={	ext-[10px] font-bold px-2 py-0.5 rounded border }>
              {satBadge.text}
            </span>
          </div>
          <div className=text-[10px] text-slate-400>
            Diretriz Clínica: <strong className=text-rose-400>&lt; 10% do VET</strong>
          </div>
          <div className=grid grid-cols-2 gap-2 pt-1>
            <div>
              <label className=block text-[10px] text-slate-400 mb-1 font-medium>Gramas (g):</label>
              <input
                type=text
                inputMode=decimal
                value={satG}
                onChange={(e) => handleSatGChange(e.target.value)}
                placeholder=Ex: 15.0
                className=w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 font-bold focus:border-rose-500 outline-none
              />
            </div>
            <div>
              <label className=block text-[10px] text-slate-400 mb-1 font-medium>% do VET:</label>
              <input
                type=text
                inputMode=decimal
                value={satPct}
                onChange={(e) => handleSatPctChange(e.target.value)}
                placeholder=Ex: 6.4
                className=w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 font-bold focus:border-rose-500 outline-none
              />
            </div>
          </div>
        </div>

        {/* Monoinsaturadas */}
        <div className=bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-2>
          <div className=flex items-center justify-between>
            <span className=text-xs font-bold text-slate-200>Monoinsaturadas (MONO)</span>
            <span className={	ext-[10px] font-bold px-2 py-0.5 rounded border }>
              {monoBadge.text}
            </span>
          </div>
          <div className=text-[10px] text-slate-400>
            Diretriz Clínica: <strong className=text-amber-400>Até 20% do VET</strong>
          </div>
          <div className=grid grid-cols-2 gap-2 pt-1>
            <div>
              <label className=block text-[10px] text-slate-400 mb-1 font-medium>Gramas (g):</label>
              <input
                type=text
                inputMode=decimal
                value={monoG}
                onChange={(e) => handleMonoGChange(e.target.value)}
                placeholder=Ex: 35.0
                className=w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:border-amber-500 outline-none
              />
            </div>
            <div>
              <label className=block text-[10px] text-slate-400 mb-1 font-medium>% do VET:</label>
              <input
                type=text
                inputMode=decimal
                value={monoPct}
                onChange={(e) => handleMonoPctChange(e.target.value)}
                placeholder=Ex: 15.0
                className=w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:border-amber-500 outline-none
              />
            </div>
          </div>
        </div>

        {/* Poli-insaturadas */}
        <div className=bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-2>
          <div className=flex items-center justify-between>
            <span className=text-xs font-bold text-slate-200>Poli-insaturadas (POLI)</span>
            <span className={	ext-[10px] font-bold px-2 py-0.5 rounded border }>
              {poliBadge.text}
            </span>
          </div>
          <div className=text-[10px] text-slate-400>
            Diretriz Clínica: <strong className=text-sky-400>Em média 10% do VET</strong>
          </div>
          <div className=grid grid-cols-2 gap-2 pt-1>
            <div>
              <label className=block text-[10px] text-slate-400 mb-1 font-medium>Gramas (g):</label>
              <input
                type=text
                inputMode=decimal
                value={poliG}
                onChange={(e) => handlePoliGChange(e.target.value)}
                placeholder=Ex: 20.0
                className=w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-sky-300 font-bold focus:border-sky-500 outline-none
              />
            </div>
            <div>
              <label className=block text-[10px] text-slate-400 mb-1 font-medium>% do VET:</label>
              <input
                type=text
                inputMode=decimal
                value={poliPct}
                onChange={(e) => handlePoliPctChange(e.target.value)}
                placeholder=Ex: 8.6
                className=w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-sky-300 font-bold focus:border-sky-500 outline-none
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
