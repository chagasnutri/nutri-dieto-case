'use client';

import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import PreceptorFAB from './PreceptorFAB';
import PreceptorDrawer from './PreceptorDrawer';

export default function SimulationModule() {
  const [activeTab, setActiveTab] = useState<'anamnese' | 'exames' | 'calculos' | 'diagnostico' | 'prescricao' | 'cardapio'>('anamnese');
  const [isPreceptorOpen, setIsPreceptorOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState('caso-dm2-has');

  // Estado clínico simulado para o Preceptor IA
  const clinicalContext = {
    modalidade: "Modo Simulação",
    casoId: selectedCase,
    paciente: {
      nome: "João Batista da Silva",
      idade: "58 anos",
      genero: "Masculino",
      patologiasHipoteses: "Diabetes Mellitus Tipo 2 descompensado e Hipertensão Arterial Sistêmica Estágio 2"
    },
    antropometria: {
      peso: "88.5 kg",
      estatura: "172 cm",
      imc: "29.9 kg/m² (Sobrepeso Grau II)"
    },
    bioquimica: [
      { exame: "Glicemia de Jejum", valorAchado: "186 mg/dL", referencia: "70-99 mg/dL" },
      { exame: "HbA1c", valorAchado: "8.9 %", referencia: "< 5.7 %" },
      { exame: "Creatinina", valorAchado: "1.1 mg/dL", referencia: "0.7-1.3 mg/dL" }
    ],
    diagnosticoPES: {
      problema: "Ingestão excessiva de carboidratos simples relacionada a hábitos alimentares inadequados evidenciada por HbA1c de 8.9% e glicemia de jejum de 186 mg/dL."
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Header activeModule="simulation" title="DietoCase - Simulação Clínica" subtitle="Resolução de Casos Clínicos Supervisionados" />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Seletor de Casos e Cabeçalho do Paciente */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase">
              Caso Clínico Ativo
            </span>
            <h2 className="text-xl font-bold text-white">João Batista da Silva, 58 anos</h2>
            <p className="text-xs text-slate-400">
              Hipótese Diagnóstica: DM2 descompensado, HAS Estágio 2 e Dislipidemia mista
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="caso-dm2-has">Caso 1: DM2 e HAS (Adulto/Idoso)</option>
              <option value="caso-desnutricao">Caso 2: Desnutrição Hospitalar Grave</option>
              <option value="caso-drc-idoso">Caso 3: Doença Renal Crônica Conservadora</option>
            </select>

            <a
              href="/?view=simulation&tab=relatorio"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <span>??</span>
              <span>Emitir Relatório A4 / Word</span>
            </a>
          </div>
        </div>

        {/* Barra de Abas de Preenchimento */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          {[
            { id: 'anamnese', label: '1. Anamnese Clínica', icon: '??' },
            { id: 'exames', label: '2. Exames Bioquímicos', icon: '??' },
            { id: 'calculos', label: '3. Fórmulas Abertas (5 Eqs)', icon: '?' },
            { id: 'diagnostico', label: '4. Diagnóstico PES & Objetivos', icon: '??' },
            { id: 'prescricao', label: '5. Prescrição Dietoterápica', icon: '??' },
            { id: 'cardapio', label: '6. Cardápio TACO', icon: '??' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                activeTab === tab.id
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-850/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Conteúdo Dinâmico da Aba Selecionada */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[420px]">
          {activeTab === 'anamnese' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>??</span> História Clínica e Queixa Principal
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Paciente refere poliúria, polidipsia e perda ponderal não intencional de 4 kg nos últimos dois meses. Queixa de astenia e cefaleia ocasional. Em uso irregular de Metformina 850mg e Enalapril 20mg.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-1">Peso Atual:</span>
                  <span className="text-white font-bold text-sm">88.5 kg</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-1">Estatura:</span>
                  <span className="text-white font-bold text-sm">1.72 m (172 cm)</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-1">IMC:</span>
                  <span className="text-emerald-400 font-bold text-sm">29.9 kg/m²</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'exames' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>??</span> Exames Bioquímicos com Sinalização Visual
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Parâmetro</th>
                      <th className="p-3">Valor Achado</th>
                      <th className="p-3">Valor de Referência</th>
                      <th className="p-3">Interpretação Clínica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    <tr className="bg-rose-950/20">
                      <td className="p-3 font-semibold">Glicemia de Jejum</td>
                      <td className="p-3 font-bold text-rose-400">186 mg/dL &uarr;</td>
                      <td className="p-3 text-slate-400">70 a 99 mg/dL</td>
                      <td className="p-3 text-rose-300">Hiperglicemia acentuada; descontrole glicêmico</td>
                    </tr>
                    <tr className="bg-rose-950/20">
                      <td className="p-3 font-semibold">Hemoglobina Glicada (HbA1c)</td>
                      <td className="p-3 font-bold text-rose-400">8.9 % &uarr;</td>
                      <td className="p-3 text-slate-400">&lt; 5.7 %</td>
                      <td className="p-3 text-rose-300">Média glicêmica trimestral elevada (meta &lt; 7.0%)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Creatinina Sérica</td>
                      <td className="p-3 font-bold text-emerald-400">1.1 mg/dL</td>
                      <td className="p-3 text-slate-400">0.7 a 1.3 mg/dL</td>
                      <td className="p-3 text-slate-300">Função renal aparentemente preservada</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'calculos' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>?</span> As 5 Equações Preditivas Abertas
              </h3>
              <p className="text-xs text-slate-400">
                Compare as equações simultaneamente para definir a conduta normocalórica ou restritiva adequada.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-emerald-400 font-bold">1. Regra de Bolso</span>
                  <div className="text-xl font-bold text-white">2.212 kcal/dia</div>
                  <div className="text-[11px] text-slate-400">25 kcal/kg peso atual (25-30 kcal/kg)</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-emerald-400 font-bold">2. Harris & Benedict (1919)</span>
                  <div className="text-xl font-bold text-white">2.180 kcal/dia</div>
                  <div className="text-[11px] text-slate-400">GEB (1.677 kcal) &times; FA 1.3</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-emerald-400 font-bold">3. Mifflin-St Jeor (1990)</span>
                  <div className="text-xl font-bold text-white">2.145 kcal/dia</div>
                  <div className="text-[11px] text-slate-400">Indicada para sobrepeso e obesidade</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-emerald-400 font-bold">4. FAO / OMS (1985/2001)</span>
                  <div className="text-xl font-bold text-white">2.250 kcal/dia</div>
                  <div className="text-[11px] text-slate-400">Faixa etária 30 a 60 anos</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-emerald-400 font-bold">5. EER / IOM (DRI 2002/2006)</span>
                  <div className="text-xl font-bold text-white">2.190 kcal/dia</div>
                  <div className="text-[11px] text-slate-400">Sedentário / Leve (CAF 1.12)</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'diagnostico' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>??</span> Diagnóstico Nutricional (PES) e Objetivos Dietoterápicos
              </h3>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="text-emerald-400 font-bold block text-sm">Diagnóstico PES Padronizado:</span>
                <p className="text-slate-200 leading-relaxed italic bg-slate-950 p-3 rounded-lg border border-slate-850">
                  &ldquo;Ingestão excessiva de carboidratos simples (P) relacionada a hábitos alimentares inadequados e fracionamento irregular (E) evidenciada por HbA1c de 8.9%, glicemia de jejum de 186 mg/dL e sobrepeso (IMC 29.9 kg/m²) (S).&rdquo;
                </p>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="text-emerald-400 font-bold block text-sm">Objetivos Dietoterápicos:</span>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                  <li>Promover o controle glicêmico estrito, visando HbA1c &lt; 7.0% e glicemias pré-prandiais entre 80-130 mg/dL.</li>
                  <li>Adequar o aporte de carboidratos complexos e fibras (&gt; 25 g/dia) para reduzir o índice glicêmico total da dieta.</li>
                  <li>Auxiliar na redução gradual e sustentada de peso corporal (5 a 7% nos próximos 6 meses).</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'prescricao' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>??</span> Prescrição Dietoterápica Quantitativa
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-1">VET Planejado:</span>
                  <span className="text-white font-bold text-base">2.100 kcal</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-1">Carboidratos (CHO):</span>
                  <span className="text-emerald-400 font-bold text-base">50 % (262.5 g)</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-1">Proteínas (PTN):</span>
                  <span className="text-sky-400 font-bold text-base">20 % (105.0 g)</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-1">Lipídios (LIP):</span>
                  <span className="text-amber-400 font-bold text-base">30 % (70.0 g)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cardapio' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>??</span> Cardápio Quali-Quantitativo (Tabela TACO 4ª Edição)
              </h3>
              <p className="text-xs text-slate-400">
                Alimentos vinculados à base TACO da UNICAMP com cálculo em tempo real de macro e micronutrientes.
              </p>
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 text-xs space-y-2">
                <div className="font-bold text-slate-200">Exemplo de Refeição: Desjejum (07:30)</div>
                <div className="text-slate-300 flex justify-between border-b border-slate-800 py-1">
                  <span>Pão de forma integral (50g)</span>
                  <span className="font-mono">124 kcal | 23.5g CHO | 4.8g PTN</span>
                </div>
                <div className="text-slate-300 flex justify-between border-b border-slate-800 py-1">
                  <span>Queijo minas frescal (30g)</span>
                  <span className="font-mono">79 kcal | 1.0g CHO | 5.2g PTN</span>
                </div>
                <div className="text-slate-300 flex justify-between py-1">
                  <span>Mamão papaia (100g)</span>
                  <span className="font-mono">40 kcal | 10.4g CHO | 0.5g PTN</span>
                </div>
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
