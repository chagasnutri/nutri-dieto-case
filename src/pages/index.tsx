'use client';

import React, { useState } from 'react';

/**
 * Página Inicial do DietoCase (App Router)
 * Interface de boas-vindas oficial com navegação para Modo Simulação e Modo Atendimento Real
 */
export default function Home() {
  const [selectedModule, setSelectedModule] = useState<'simulation' | 'real' | null>(null);

  const navigateToSimulation = () => {
    setSelectedModule('simulation');
    window.location.href = '/?view=simulation&tab=anamnese';
  };

  const navigateToRealPatient = () => {
    setSelectedModule('real');
    window.location.href = '/?view=real&tab=anamnese';
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Bar Institucional */}
      <header className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 py-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20 border border-emerald-300/30">
            🥗
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>DietoCase</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                v2.5 Oficial
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-tight max-w-xs sm:max-w-md md:max-w-xl mt-0.5">
              Laboratório interativo de Nutrição Clínica: Simulação clínica, anamnese interativa e prontuário virtual
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden sm:flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Preceptor IA Socrático Ativo</span>
          </div>
          <a
            href="/?view=simulation"
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 transition"
          >
            Acessar Prontuário Direto
          </a>
        </div>
      </header>

      {/* Hero Central */}
      <section className="max-w-4xl w-full mx-auto my-auto py-8 sm:py-12 text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-inner">
          <span>🎓</span>
          <span>Disciplina de Dietoterapia &bull; Curso de Graduação em Nutrição</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Prática Clínica, Raciocínio Fisiopatológico &amp; Decisão Nutricional
        </h2>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Selecione abaixo a modalidade de aprendizagem desejada para iniciar o atendimento. Todas as etapas contam com o suporte pedagógico do <strong>Preceptor IA</strong> e exportação oficial para <strong>Word (.docx)</strong> e <strong>PDF A4</strong>.
        </p>

        {/* Grade dos 2 Módulos Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-6">
          {/* Card 1: Modo Simulação */}
          <div
            onClick={navigateToSimulation}
            className="group relative bg-slate-900/90 hover:bg-slate-850 border-2 border-emerald-500/30 hover:border-emerald-500 rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer transform hover:-translate-y-1.5 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-3xl border border-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition duration-300">
                  💻
                </div>
                <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
                  Simulação Clínica
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition">
                  Modo Simulação
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Resolução de casos clínicos complexos baseados em evidências. Interaja com o paciente virtual, consulte a equipe multiprofissional, analise exames bioquímicos com valores de referência e opere as 5 equações preditivas abertas.
                </p>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 space-y-1 text-[11px] text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">&#10003;</span>
                  <span>Casos estruturados de DM2, HAS, DRC e Desnutrição</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">&#10003;</span>
                  <span>5 Fórmulas Abertas (Bolso, Harris, Mifflin, FAO, DRI)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">&#10003;</span>
                  <span>Diagnóstico PES e Objetivos Dietoterápicos integrados</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                className="w-full py-3.5 px-4 bg-emerald-600 group-hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/40 text-xs sm:text-sm flex items-center justify-center gap-2 transition"
              >
                <span>Acessar Modo Simulação</span>
                <span className="text-base group-hover:translate-x-1 transition-transform">&rarr;</span>
              </button>
            </div>
          </div>

          {/* Card 2: Modo Atendimento Real */}
          <div
            onClick={navigateToRealPatient}
            className="group relative bg-slate-900/90 hover:bg-slate-850 border-2 border-indigo-500/30 hover:border-indigo-500 rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer transform hover:-translate-y-1.5 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-3xl border border-indigo-500/20 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition duration-300">
                  👤
                </div>
                <span className="text-[11px] font-bold bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
                  Atendimento Ambulatorial
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition">
                  Modo Atendimento Real
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Prontuário eletrônico livre para o atendimento presencial de pacientes reais em ambulatório ou clínica-escola. Coleta de anamnese direta, avaliação antropométrica completa com 18 parâmetros e planejamento nutricional.
                </p>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 space-y-1 text-[11px] text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">&#10003;</span>
                  <span>Identificação e histórico social individualizado</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">&#10003;</span>
                  <span>Tabela antropométrica com 18 variáveis e Chumlea</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">&#10003;</span>
                  <span>Cardápio quali-quantitativo TACO ou Prescrição de TNE</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                className="w-full py-3.5 px-4 bg-indigo-600 group-hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-900/40 text-xs sm:text-sm flex items-center justify-center gap-2 transition"
              >
                <span>Iniciar Atendimento Real</span>
                <span className="text-base group-hover:translate-x-1 transition-transform">&rarr;</span>
              </button>
            </div>
          </div>
        </div>

        {/* Destaque do Preceptor IA Socrático */}
        <div className="bg-gradient-to-r from-purple-950/50 via-slate-900 to-indigo-950/50 border border-purple-500/30 rounded-2xl p-5 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-2xl border border-purple-400/30 shrink-0">
              🧠
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-purple-200">Preceptor IA &bull; Tutor Socrático Integrado</h4>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                  Pedagógico
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Não fornece respostas diretas nem cálculos prontos: estimula seu raciocínio fisiopatológico com questionamentos clínicos guiados em ambos os módulos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={navigateToSimulation}
            className="text-xs text-purple-300 hover:text-purple-100 font-semibold bg-purple-900/40 hover:bg-purple-800/60 px-3.5 py-2 rounded-xl border border-purple-500/40 transition shrink-0"
          >
            Experimentar Preceptor &rarr;
          </button>
        </div>
      </section>

      {/* Rodapé Global com Direitos Autorais */}
      <footer className="max-w-6xl w-full mx-auto pt-6 border-t border-slate-800/80 text-center flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
        <p className="font-medium tracking-tight">
          &copy; 2026 DietoCase - Desenvolvido por Prof. Chagas Neto. Todos os direitos reservados.
        </p>
      </footer>
    </main>
  );
}
