'use client';

import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import PreceptorFAB from './PreceptorFAB';
import PreceptorDrawer from './PreceptorDrawer';
import LipidQualitySection from './LipidQualitySection';

export default function SimulationModule() {
  const [activeTab, setActiveTab] = useState<'anamnese' | 'exames' | 'interacoes' | 'calculos' | 'diagnostico' | 'prescricao' | 'cardapio'>('anamnese');
  const [isPreceptorOpen, setIsPreceptorOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState('caso-dm2-has');

  // Estado dinamico de exames laboratoriais (estritamente em branco para aprendizado ativo)
  const [exams, setExams] = useState<Array<{ id: string; name: string; ref: string; value: string; interp: string }>>([
    { id: '1', name: '', ref: '', value: '', interp: '' }
  ]);

  // Estado dinamico de interacoes droga-nutriente (estritamente em branco para aprendizado ativo)
  const [interactions, setInteractions] = useState<Array<{ id: string; med: string; classification: string; conduta: string }>>([
    { id: '1', med: '', classification: '', conduta: '' }
  ]);

  // Estado de fontes de alimentos e cadastro colaborativo multi-tabelas
  const [foodSource, setFoodSource] = useState<'todas' | 'taco' | 'decisao' | 'colaborativa'>('taco');
  const [isCadAlimentoOpen, setIsCadAlimentoOpen] = useState(false);
  const [novoAlimento, setNovoAlimento] = useState({
    nome: '',
    categoria: 'Cereais e derivados',
    baseGramas: 100,
    porcaoSugerida: '',
    kcal: '',
    cho: '',
    ptn: '',
    lip: '',
    sat: '',
    mono: '',
    poli: '',
    fibra: '',
    calcio: '',
    ferro: '',
    sodio: '',
    potassio: '',
    vitA: '',
    vitC: ''
  });

  const addExamRow = () => {
    setExams(prev => [...prev, { id: Date.now().toString(), name: '', ref: '', value: '', interp: '' }]);
  };

  const removeExamRow = (idx: number) => {
    setExams(prev => {
      if (prev.length <= 1) return [{ id: Date.now().toString(), name: '', ref: '', value: '', interp: '' }];
      return prev.filter((_, i) => i !== idx);
    });
  };

  const addInteractionRow = () => {
    setInteractions(prev => [...prev, { id: Date.now().toString(), med: '', classification: '', conduta: '' }]);
  };

  const removeInteractionRow = (idx: number) => {
    setInteractions(prev => {
      if (prev.length <= 1) return [{ id: Date.now().toString(), med: '', classification: '', conduta: '' }];
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Estado clinico simulado para o Preceptor IA
  const clinicalContext = {
    modalidade: "Modo Simulacao",
    casoId: selectedCase,
    paciente: {
      nome: "Joao Batista da Silva",
      idade: "58 anos",
      genero: "Masculino",
      patologiasHipoteses: "Diabetes Mellitus Tipo 2 descompensado e Hipertensao Arterial Sistemica Estagio 2"
    },
    antropometria: {
      peso: "88.5 kg",
      estatura: "172 cm",
      imc: "29.9 kg/m2 (Sobrepeso Grau II)"
    },
    bioquimica: exams.filter(e => e.name).map(e => ({ exame: e.name, valorAchado: e.value, referencia: e.ref, interpretacao: e.interp })),
    interacoes: interactions.filter(i => i.med).map(i => ({ med: i.med, classe: i.classification, conduta: i.conduta })),
    diagnosticoPES: {
      problema: "Ingestao excessiva de carboidratos simples relacionada a habitos alimentares inadequados evidenciada por HbA1c de 8.9% e glicemia de jejum de 186 mg/dL."
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Header activeModule="simulation" title="DietoCase - Simulacao Clinica" subtitle="Resolucao de Casos Clinicos Supervisionados" />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Seletor de Casos e Cabecalho do Paciente */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase">
              Caso Clinico Ativo
            </span>
            <h2 className="text-xl font-bold text-white">Joao Batista da Silva, 58 anos</h2>
            <p className="text-xs text-slate-400">
              Hipotese Diagnostica: DM2 descompensado, HAS Estagio 2 e Dislipidemia mista
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="caso-dm2-has">Caso 1: DM2 e HAS (Adulto/Idoso)</option>
              <option value="caso-desnutricao">Caso 2: Desnutricao Hospitalar Grave</option>
              <option value="caso-drc-idoso">Caso 3: Doenca Renal Cronica Conservadora</option>
            </select>

            <a
              href="/?view=simulation&tab=relatorio"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <span>Relatorio A4 / Word</span>
            </a>
          </div>
        </div>

        {/* Barra de Abas de Preenchimento */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          {[
            { id: 'anamnese', label: '1. Anamnese Clinica', icon: '1' },
            { id: 'exames', label: '2. Exames Bioquimicos', icon: '2' },
            { id: 'interacoes', label: '3. Droga-Nutriente', icon: '3' },
            { id: 'calculos', label: '4. Formulas Abertas (5 Eqs)', icon: '4' },
            { id: 'diagnostico', label: '5. Diagnostico PES & Objetivos', icon: '5' },
            { id: 'prescricao', label: '6. Prescricao Dietoterapica', icon: '6' },
            { id: 'cardapio', label: '7. Cardapio TACO', icon: '7' }
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
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Conteudo Dinamico da Aba Selecionada */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[420px]">
          {activeTab === 'anamnese' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                Historia Clinica e Queixa Principal
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Paciente refere poliuria, polidipsia e perda ponderal nao intencional de 4 kg nos ultimos dois meses. Queixa de astenia e cefaleia ocasional. Em uso irregular de medicacao para diabetes e hipertensao.
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
                  <span className="text-emerald-400 font-bold text-sm">29.9 kg/m2</span>
                </div>
              </div>

              <LipidQualitySection
                title="Análise do Recordatório de 24h - Frações Lipídicas"
                subtitle="Avaliação da ingestão habitual de ácidos graxos relatada no recordatório com conversão automática (1g = 9 kcal)."
                vetKcal={2212}
                theme="emerald"
                defaultValues={{
                  satG: '15.0',
                  satPct: '6.1',
                  monoG: '35.0',
                  monoPct: '14.2',
                  poliG: '20.0',
                  poliPct: '8.1'
                }}
              />
            </div>
          )}

          {activeTab === 'exames' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Exames Bioquimicos e Raciocinio Clinico
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Insira os exames laboratoriais e registre sua interpretacao e raciocinio clinico do zero.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-1/4">Exame</th>
                      <th className="p-3 w-1/5">Valor de Referencia</th>
                      <th className="p-3 w-1/5">Valor Achado</th>
                      <th className="p-3 w-1/3">Interpretacao Clinica</th>
                      <th className="p-3 text-center w-12">Acao</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {exams.map((exam, idx) => (
                      <tr key={exam.id} className="bg-slate-900/40 hover:bg-slate-800/50 transition">
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={exam.name}
                            onChange={(e) => {
                              const updated = [...exams];
                              updated[idx].name = e.target.value;
                              setExams(updated);
                            }}
                            placeholder=""
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-emerald-500 outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={exam.ref}
                            onChange={(e) => {
                              const updated = [...exams];
                              updated[idx].ref = e.target.value;
                              setExams(updated);
                            }}
                            placeholder=""
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-300 focus:border-emerald-500 outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={exam.value}
                            onChange={(e) => {
                              const updated = [...exams];
                              updated[idx].value = e.target.value;
                              setExams(updated);
                            }}
                            placeholder=""
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-semibold text-white focus:border-emerald-500 outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <textarea
                            rows={2}
                            value={exam.interp}
                            onChange={(e) => {
                              const updated = [...exams];
                              updated[idx].interp = e.target.value;
                              setExams(updated);
                            }}
                            placeholder=""
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:border-emerald-500 outline-none resize-y"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeExamRow(idx)}
                            className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-950/30 transition cursor-pointer"
                            title="Remover exame"
                          >
                            X
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Botao Adicionar Exame abaixo da tabela */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={addExamRow}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+ Adicionar Exame</span>
                </button>
                <span className="text-[11px] text-slate-400">Clique para adicionar quantas linhas de exames forem necessarias.</span>
              </div>
            </div>
          )}

          {activeTab === 'interacoes' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Interacoes Droga-Nutriente & Farmacoterapia
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Cadastre os farmacos em uso e formule sua analise de interacoes droga-nutriente do zero.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-1/4">Medicacao / Farmaco</th>
                      <th className="p-3 w-1/4">Classificacao Farmacologica</th>
                      <th className="p-3 w-5/12">Interacao e Conduta Nutricional</th>
                      <th className="p-3 text-center w-12">Acao</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {interactions.map((item, idx) => (
                      <tr key={item.id} className="bg-slate-900/40 hover:bg-slate-800/50 transition">
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.med}
                            onChange={(e) => {
                              const updated = [...interactions];
                              updated[idx].med = e.target.value;
                              setInteractions(updated);
                            }}
                            placeholder=""
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-emerald-500 outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.classification}
                            onChange={(e) => {
                              const updated = [...interactions];
                              updated[idx].classification = e.target.value;
                              setInteractions(updated);
                            }}
                            placeholder=""
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 focus:border-emerald-500 outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <textarea
                            rows={2}
                            value={item.conduta}
                            onChange={(e) => {
                              const updated = [...interactions];
                              updated[idx].conduta = e.target.value;
                              setInteractions(updated);
                            }}
                            placeholder=""
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:border-emerald-500 outline-none resize-y"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeInteractionRow(idx)}
                            className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-950/30 transition cursor-pointer"
                            title="Remover farmaco"
                          >
                            X
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Botao Adicionar Interacao abaixo da tabela */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={addInteractionRow}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+ Adicionar Interacao</span>
                </button>
                <span className="text-[11px] text-slate-400">Clique para adicionar quantas linhas de farmacos forem necessarias.</span>
              </div>
            </div>
          )}

          {activeTab === 'calculos' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                As 5 Equacoes Preditivas Abertas
              </h3>
              <p className="text-xs text-slate-400">
                Compare as equacoes simultaneamente para definir a conduta normocalorica ou restritiva adequada.
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
                  <div className="text-[11px] text-slate-400">Faixa etaria 30 a 60 anos</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-emerald-400 font-bold">5. EER / IOM (DRI 2002/2006)</span>
                  <div className="text-xl font-bold text-white">2.190 kcal/dia</div>
                  <div className="text-[11px] text-slate-400">Sedentario / Leve (CAF 1.12)</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'diagnostico' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                Diagnostico Nutricional (PES) e Objetivos Dietoterapicos
              </h3>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="text-emerald-400 font-bold block text-sm">Diagnostico PES Padronizado:</span>
                <p className="text-slate-200 leading-relaxed italic bg-slate-950 p-3 rounded-lg border border-slate-850">
                  &ldquo;Ingestao excessiva de carboidratos simples (P) relacionada a habitos alimentares inadequados e fracionamento irregular (E) evidenciada por HbA1c de 8.9%, glicemia de jejum de 186 mg/dL e sobrepeso (IMC 29.9 kg/m2) (S).&rdquo;
                </p>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="text-emerald-400 font-bold block text-sm">Objetivos Dietoterapicos:</span>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                  <li>Promover o controle glicemico estrito, visando HbA1c &lt; 7.0% e glicemias pre-prandiais entre 80-130 mg/dL.</li>
                  <li>Adequar o aporte de carboidratos complexos e fibras (&gt; 25 g/dia) para reduzir o indice glicemico total da dieta.</li>
                  <li>Auxiliar na reducao gradual e sustentada de peso corporal (5 a 7% nos proximos 6 meses).</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'prescricao' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                Prescricao Dietoterapica Quantitativa
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
                  <span className="text-slate-400 block mb-1">Proteinas (PTN):</span>
                  <span className="text-sky-400 font-bold text-base">20 % (105.0 g)</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-1">Lipidios (LIP):</span>
                  <span className="text-amber-400 font-bold text-base">30 % (70.0 g)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cardapio' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                Cardápio Quali-Quantitativo (Bancos Oficiais & Colaborativos)
              </h3>
              <p className="text-xs text-slate-400">
                Alimentos vinculados às bases TACO (UNICAMP), Decisão Nutricional (Philippi) e Tabela Colaborativa Global com cálculo em tempo real de macro e micronutrientes.
              </p>

              {/* Seletor de Bases e Botao Cadastrar Alimento */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block">Fonte de Dados Nutricionais:</span>
                    <span className="text-[11px] text-slate-400">Escolha a base para consulta ou adicione novos itens compartilhados</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCadAlimentoOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>➕</span>
                    <span>Cadastrar Alimento</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { id: 'todas', label: 'Todas as Fontes' },
                    { id: 'taco', label: 'TACO - UNICAMP (4ª Ed)' },
                    { id: 'decisao', label: 'Decisão Nutricional (Philippi)' },
                    { id: 'colaborativa', label: 'Tabela Colaborativa (Nuvem)' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFoodSource(tab.id as any)}
                      className={`text-xs px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                        foodSource === tab.id
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 text-xs space-y-2">
                <div className="font-bold text-slate-200">Exemplo de Refeicao: Desjejum (07:30)</div>
                <div className="text-slate-300 flex justify-between border-b border-slate-800 py-1">
                  <span>Pao de forma integral (50g)</span>
                  <span className="font-mono">124 kcal | 23.5g CHO | 4.8g PTN</span>
                </div>
                <div className="text-slate-300 flex justify-between border-b border-slate-800 py-1">
                  <span>Queijo minas frescal (30g)</span>
                  <span className="font-mono">79 kcal | 1.0g CHO | 5.2g PTN</span>
                </div>
                <div className="text-slate-300 flex justify-between py-1">
                  <span>Mamao papaia (100g)</span>
                  <span className="font-mono">40 kcal | 10.4g CHO | 0.5g PTN</span>
                </div>
              </div>

              <LipidQualitySection
                title="Quadro de Distribuição de Gorduras (Frações Lipídicas do Cardápio)"
                subtitle="Planejamento de ácidos graxos com diretrizes e conversão automática (1g = 9 kcal)."
                vetKcal={2100}
                theme="emerald"
                defaultValues={{
                  satG: '14.0',
                  satPct: '6.0',
                  monoG: '38.0',
                  monoPct: '16.3',
                  poliG: '18.0',
                  poliPct: '7.7'
                }}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modal Cadastrar Alimento Colaborativo */}
      {isCadAlimentoOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-xl w-full p-6 text-white space-y-4 shadow-2xl my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥗</span>
                <div>
                  <h4 className="font-bold text-base text-white">Cadastrar Novo Alimento</h4>
                  <p className="text-xs text-slate-400">Tabela Colaborativa Global em Nuvem • Sincronização Compartilhada</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCadAlimentoOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!novoAlimento.nome) return;
                alert(`Alimento "${novoAlimento.nome}" cadastrado com sucesso e sincronizado em nuvem!`);
                setIsCadAlimentoOpen(false);
                setNovoAlimento({
                  nome: '',
                  categoria: 'Cereais e derivados',
                  baseGramas: 100,
                  porcaoSugerida: '',
                  kcal: '',
                  cho: '',
                  ptn: '',
                  lip: '',
                  sat: '',
                  mono: '',
                  poli: '',
                  fibra: '',
                  calcio: '',
                  ferro: '',
                  sodio: '',
                  potassio: '',
                  vitA: '',
                  vitC: ''
                });
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome do Alimento: *</label>
                <input
                  type="text"
                  required
                  value={novoAlimento.nome}
                  onChange={(e) => setNovoAlimento({ ...novoAlimento, nome: e.target.value })}
                  placeholder="Ex: Iogurte grego natural tradicional"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoria:</label>
                  <select
                    value={novoAlimento.categoria}
                    onChange={(e) => setNovoAlimento({ ...novoAlimento, categoria: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500"
                  >
                    <option value="Cereais e derivados">Cereais e derivados</option>
                    <option value="Leguminosas e derivados">Leguminosas e derivados</option>
                    <option value="Carnes e derivados">Carnes e derivados</option>
                    <option value="Pescados e frutos do mar">Pescados e frutos do mar</option>
                    <option value="Ovos e derivados">Ovos e derivados</option>
                    <option value="Leite e derivados">Leite e derivados</option>
                    <option value="Frutas e derivados">Frutas e derivados</option>
                    <option value="Verduras e derivados">Verduras e derivados</option>
                    <option value="Óleos e gorduras">Óleos e gorduras</option>
                    <option value="Panificação">Panificação</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Gramatura Base (g): *</label>
                  <input
                    type="number"
                    required
                    value={novoAlimento.baseGramas}
                    onChange={(e) => setNovoAlimento({ ...novoAlimento, baseGramas: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  />
                </div>
              </div>

              {/* Macros */}
              <div className="bg-slate-850 p-3 rounded-xl border border-slate-750 space-y-2">
                <span className="font-bold text-emerald-400 block">Macronutrientes (por 100g): *</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Kcal:</span>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={novoAlimento.kcal}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, kcal: e.target.value })}
                      placeholder="0.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">CHO (g):</span>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={novoAlimento.cho}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, cho: e.target.value })}
                      placeholder="0.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">PTN (g):</span>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={novoAlimento.ptn}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, ptn: e.target.value })}
                      placeholder="0.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">LIP (g):</span>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={novoAlimento.lip}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, lip: e.target.value })}
                      placeholder="0.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Frações Lipídicas */}
              <div className="bg-slate-850 p-3 rounded-xl border border-slate-750 space-y-2">
                <span className="font-bold text-amber-400 block">Frações Lipídicas Obrigatórias (g por 100g): *</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">SAT (g):</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={novoAlimento.sat}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, sat: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">MONO (g):</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={novoAlimento.mono}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, mono: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">POLI (g):</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={novoAlimento.poli}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, poli: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Micronutrientes */}
              <div className="bg-slate-850 p-3 rounded-xl border border-slate-750 space-y-2">
                <span className="font-bold text-sky-400 block">Micronutrientes e Minerais (por 100g): *</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Fibras (g):</span>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={novoAlimento.fibra}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, fibra: e.target.value })}
                      placeholder="0.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Cálcio (mg):</span>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={novoAlimento.calcio}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, calcio: e.target.value })}
                      placeholder="0.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Ferro (mg):</span>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={novoAlimento.ferro}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, ferro: e.target.value })}
                      placeholder="0.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Sódio (mg):</span>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={novoAlimento.sodio}
                      onChange={(e) => setNovoAlimento({ ...novoAlimento, sodio: e.target.value })}
                      placeholder="0.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCadAlimentoOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow cursor-pointer flex items-center gap-1.5"
                >
                  <span>☁️</span>
                  <span>Salvar na Nuvem</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preceptor IA Socratico */}
      <PreceptorFAB onClick={() => setIsPreceptorOpen(true)} />
      <PreceptorDrawer
        isOpen={isPreceptorOpen}
        onClose={() => setIsPreceptorOpen(false)}
        clinicalContext={clinicalContext}
      />
    </div>
  );
}
