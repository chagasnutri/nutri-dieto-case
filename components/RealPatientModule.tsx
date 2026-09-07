'use client';

import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import PreceptorFAB from './PreceptorFAB';
import PreceptorDrawer from './PreceptorDrawer';

export default function RealPatientModule() {
  const [activeTab, setActiveTab] = useState<'identificacao' | 'antropometria' | 'triagem' | 'exameFisico' | 'interacoes' | 'conduta'>('identificacao');
  const [isPreceptorOpen, setIsPreceptorOpen] = useState(false);

  // Estado clínico do Paciente Real em Atendimento Ambulatorial
  const clinicalContext = {
    modalidade: "Modo Atendimento Real (Prontuário Ambulatorial)",
    paciente: {
      nome: "Carlos Eduardo Silva",
      idade: "52 anos",
      genero: "Masculino",
      ocupacao: "Contador",
      patologiasHipoteses: "Síndrome Metabólica, Esteatose Hepática Não Alcoólica Grau II e Dislipidemia"
    },
    antropometria: {
      peso: "94.0 kg",
      estatura: "175 cm",
      imc: "30.7 kg/m² (Obesidade Grau I)",
      circCintura: "104 cm (Risco Cardiovascular Muito Aumentado)",
      circBraco: "34.5 cm",
      alturaJoelho: "54.0 cm"
    },
    triagem: {
      ferramenta: "NRS-2002",
      pontuacao: "3",
      diagnostico: "Em risco nutricional"
    },
    interacoes: [
      { medicamento: "Metformina 850mg (2x/dia)", impacto: "Redução da absorção ileal de Vitamina B12 e folato." },
      { medicamento: "Atorvastatina 20mg", impacto: "Interação com fitoquímicos e necessidade de monitoramento de transaminases." }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Header activeModule="real" title="DietoCase - Atendimento Real" subtitle="Prontuário Clínico & Ambulatório de Nutrição" />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner do Prontuário Ambulatorial */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold bg-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/30 uppercase">
              Atendimento Ambulatorial Ativo
            </span>
            <h2 className="text-xl font-bold text-white">Carlos Eduardo Silva, 52 anos</h2>
            <p className="text-xs text-slate-400">
              Prontuário Aberto &bull; Avaliação Nutricional Completa &bull; 18 Variáveis Antropométricas
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/?view=real&tab=relatorio"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <span>??</span>
              <span>Exportar Prontuário Word (.docx)</span>
            </a>
          </div>
        </div>

        {/* Barra de Abas do Atendimento Real */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          {[
            { id: 'identificacao', label: '1. Identificação & Social', icon: '??' },
            { id: 'antropometria', label: '2. Antropometria (18 Vars + Chumlea)', icon: '??' },
            { id: 'triagem', label: '3. Triagem NRS-2002', icon: '??' },
            { id: 'exameFisico', label: '4. Exame Físico / Compartimentos', icon: '??' },
            { id: 'interacoes', label: '5. Droga-Nutriente', icon: '??' },
            { id: 'conduta', label: '6. Planejamento & Cardápio', icon: '??' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                activeTab === tab.id
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                  : 'bg-slate-850/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Conteúdo Dinâmico */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[420px]">
          {activeTab === 'identificacao' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>??</span> Dados de Identificação e Perfil Sociocultural
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">Nome do Paciente:</span>
                  <span className="text-white font-bold">Carlos Eduardo Silva</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">Idade / Sexo:</span>
                  <span className="text-white font-bold">52 anos &bull; Masculino</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">Profissão / Ocupação:</span>
                  <span className="text-white font-bold">Contador (sedentário 8h/dia)</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">Renda Familiar:</span>
                  <span className="text-white font-bold">4 a 6 Salários Mínimos</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">Moradia & Saneamento:</span>
                  <span className="text-white font-bold">Alvenaria, água tratada e rede de esgoto</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">Escolaridade:</span>
                  <span className="text-white font-bold">Superior Completo</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'antropometria' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>??</span> Tabela Antropométrica Ambulatorial (18 Variáveis & Chumlea)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Peso Atual:</span>
                  <span className="text-white font-bold text-sm">94.0 kg</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Estatura:</span>
                  <span className="text-white font-bold text-sm">175.0 cm</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">IMC Atual:</span>
                  <span className="text-indigo-400 font-bold text-sm">30.7 kg/m²</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Circunferência Cintura:</span>
                  <span className="text-rose-400 font-bold text-sm">104.0 cm</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Circunferência Braço (CB):</span>
                  <span className="text-white font-bold text-sm">34.5 cm</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Circ. Panturrilha (CP):</span>
                  <span className="text-white font-bold text-sm">39.0 cm</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Dobra Tricipital (DCT):</span>
                  <span className="text-white font-bold text-sm">18.0 mm</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Dobra Subescapular (DCSE):</span>
                  <span className="text-white font-bold text-sm">24.0 mm</span>
                </div>
              </div>

              <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4 space-y-1">
                <span className="text-indigo-300 font-bold block">Fórmulas Alternativas de Chumlea (1985/1988):</span>
                <p className="text-slate-300">
                  Altura do Joelho medida: <strong>54.0 cm</strong> &bull; Estatura Estimada: <strong>174.5 cm</strong> &bull; Peso Estimado: <strong>92.8 kg</strong>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'triagem' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>??</span> Triagem de Risco Nutricional (NRS-2002)
              </h3>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">Escore Total: 3 pontos</span>
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full font-bold">
                    Paciente em Risco Nutricional
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Critérios pontuados: Perda de peso recente associada a estresse metabólico crônico e IMC no limiar superior. Exige plano de intervenção dietoterápica imediata e monitoramento periódico.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'exameFisico' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>??</span> Exame Físico Nutricional por Compartimentos Anatômicos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-indigo-400 font-bold block">Cabeça & Fácies:</span>
                  <p className="text-slate-300">Fácies atípica, conjuntivas normocoradas e anictéricas, mucosa oral úmida e íntegra. Bola gordurosa de Bichat preservada.</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-indigo-400 font-bold block">Tronco & Tórax:</span>
                  <p className="text-slate-300">Adiposidade troncular e visceral aumentada. Sem edema sacral ou perda de massa clavicular/escapular.</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-indigo-400 font-bold block">Membros Superiores:</span>
                  <p className="text-slate-300">Tônus muscular em deltoides e bíceps preservado. Prega cutânea aumentada indicando reserva adiposa elevada.</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-indigo-400 font-bold block">Membros Inferiores:</span>
                  <p className="text-slate-300">Sem sarcopenia aparente em quadríceps ou panturrilhas. Edema maleolar ausente (cacifo negativo / Grau 0).</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'interacoes' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>??</span> Interações Fármaco-Nutriente e Farmacoterapia
              </h3>
              <div className="space-y-3">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <div className="font-bold text-indigo-300 mb-1">Metformina 850mg (Biguanida)</div>
                  <p className="text-slate-300">Compromete a absorção ileal de Vitamina B12 e ácido fólico a médio e longo prazo. Conduta: monitorar anualmente B12 sérica e homocisteína.</p>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <div className="font-bold text-indigo-300 mb-1">Atorvastatina 20mg (Hipolipemiante)</div>
                  <p className="text-slate-300">Inibidor da HMG-CoA redutase. Evitar consumo concomitante com toranja (grapefruit). Monitorar enzimas hepáticas TGO/TGP.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conduta' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>??</span> Planejamento Dietoterápico & Prescrição
              </h3>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-sm text-indigo-400 block">Conduta Ambulatorial Padronizada:</span>
                <p className="text-slate-200 leading-relaxed">
                  Dieta hipocalórica moderada (déficit de 500 kcal/dia), calculada para 2.000 kcal, com fracionamento em 5 a 6 refeições. Estímulo ao consumo de alimentos ricos em fibras solúveis (aveia, psyllium, leguminosas) e gorduras monoinsaturadas (azeite de oliva extravirgem) para controle da esteatose hepática e perfil lipídico.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Preceptor IA Socrático */}
      <PreceptorFAB onClick={() => setIsPreceptorOpen(true)} />
      <PreceptorDrawer
        isOpen={isPreceptorOpen}
        onClose={() => setIsPreceptorOpen(false)}
        clinicalContext={clinicalContext}
      />
    </div>
  );
}
