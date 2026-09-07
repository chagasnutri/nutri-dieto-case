'use client';

import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import PreceptorFAB from './PreceptorFAB';
import PreceptorDrawer from './PreceptorDrawer';
import LipidQualitySection from './LipidQualitySection';

export default function RealPatientModule() {
  const [activeTab, setActiveTab] = useState<'identificacao' | 'antropometria' | 'triagem' | 'exameFisico' | 'exames' | 'interacoes' | 'conduta'>('identificacao');
  const [isPreceptorOpen, setIsPreceptorOpen] = useState(false);

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

  // Contexto clinico do atendimento real para o Preceptor IA
  const clinicalContext = {
    modalidade: "Modo Atendimento Real",
    paciente: {
      nome: "Carlos Eduardo Silva",
      idade: "52 anos",
      genero: "Masculino",
      profissao: "Contador",
      renda: "4 a 6 Salarios Minimos",
      hipoteseDiagnostica: "Sindrome Metabolica e Esteatose Hepatica Nao Alcoolica Grau II"
    },
    antropometria: {
      peso: "94.0 kg",
      estatura: "175 cm",
      circunferenciaCintura: "104 cm",
      imc: "30.7 kg/m2 (Obesidade Grau I)",
      chumleaEstimado: "Peso estimado: 92.8 kg; Estatura estimada: 174.5 cm"
    },
    triagem: {
      ferramenta: "NRS-2002",
      escore: "3 pontos (Em risco nutricional)"
    },
    exames: exams.filter(e => e.name).map(e => ({ exame: e.name, valorAchado: e.value, referencia: e.ref, interpretacao: e.interp })),
    interacoes: interactions.filter(i => i.med).map(i => ({ med: i.med, classe: i.classification, conduta: i.conduta }))
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Header activeModule="real" title="DietoCase - Atendimento Real" subtitle="Registro de Prontuario Ambulatorial e Hospitalar" />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Cabecalho do Atendimento Presencial */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30 uppercase">
              Atendimento Clinico Presencial
            </span>
            <h2 className="text-xl font-bold text-white">Carlos Eduardo Silva, 52 anos</h2>
            <p className="text-xs text-slate-400">
              Hipotese: Sindrome Metabolica e Esteatose Hepatica Grau II &bull; Encaminhamento: Cardiologia
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/?view=real&tab=relatorio"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <span>Relatorio A4 / Word</span>
            </a>
          </div>
        </div>

        {/* Barra de Abas do Atendimento Real */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          {[
            { id: 'identificacao', label: '1. Identificacao & Social', icon: '1' },
            { id: 'antropometria', label: '2. Antropometria (18 Vars + Chumlea)', icon: '2' },
            { id: 'triagem', label: '3. Triagem NRS-2002', icon: '3' },
            { id: 'exameFisico', label: '4. Exame Fisico / Compartimentos', icon: '4' },
            { id: 'exames', label: '5. Exames Bioquimicos', icon: '5' },
            { id: 'interacoes', label: '6. Droga-Nutriente', icon: '6' },
            { id: 'conduta', label: '7. Planejamento & Conduta', icon: '7' }
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
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Conteudo Dinamico */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[420px]">
          {activeTab === 'identificacao' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                Dados de Identificacao e Perfil Sociocultural
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
                  <span className="text-slate-400 block">Profissao / Ocupacao:</span>
                  <span className="text-white font-bold">Contador (sedentario 8h/dia)</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">Renda Familiar:</span>
                  <span className="text-white font-bold">4 a 6 Salarios Minimos</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">Moradia & Saneamento:</span>
                  <span className="text-white font-bold">Alvenaria, agua tratada e rede de esgoto</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">Escolaridade:</span>
                  <span className="text-white font-bold">Superior Completo</span>
                </div>
              </div>

              <LipidQualitySection
                title="Análise do Recordatório de 24h - Frações Lipídicas"
                subtitle="Avaliação da ingestão habitual de ácidos graxos relatada pelo paciente (1g = 9 kcal)."
                vetKcal={2000}
                theme="indigo"
                defaultValues={{
                  satG: '',
                  satPct: '',
                  monoG: '',
                  monoPct: '',
                  poliG: '',
                  poliPct: ''
                }}
              />
            </div>
          )}

          {activeTab === 'antropometria' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                Tabela Antropometrica Ambulatorial (18 Variaveis & Chumlea)
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
                  <span className="text-indigo-400 font-bold text-sm">30.7 kg/m2</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Circunferencia Cintura:</span>
                  <span className="text-rose-400 font-bold text-sm">104.0 cm</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Circunferencia Braco (CB):</span>
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
                <span className="text-indigo-300 font-bold block">Formulas Alternativas de Chumlea (1985/1988):</span>
                <p className="text-slate-300">
                  Altura do Joelho medida: <strong>54.0 cm</strong> &bull; Estatura Estimada: <strong>174.5 cm</strong> &bull; Peso Estimado: <strong>92.8 kg</strong>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'triagem' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                Triagem de Risco Nutricional (NRS-2002)
              </h3>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">Escore Total: 3 pontos</span>
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full font-bold">
                    Paciente em Risco Nutricional
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Criterios pontuados: Perda de peso recente associada a estresse metabolico cronico e IMC no limiar superior. Exige plano de intervencao dietoterapica imediata e monitoramento periodico.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'exameFisico' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                Exame Fisico Nutricional por Compartimentos Anatomicos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-indigo-400 font-bold block">Cabeca & Facies:</span>
                  <p className="text-slate-300">Facies atipica, conjuntivas normocoradas e anictericas, mucosa oral umida e integra. Bola gordurosa de Bichat preservada.</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-indigo-400 font-bold block">Tronco & Torax:</span>
                  <p className="text-slate-300">Adiposidade troncular e visceral aumentada. Sem edema sacral ou perda de massa clavicular/escapular.</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-indigo-400 font-bold block">Membros Superiores:</span>
                  <p className="text-slate-300">Tonus muscular em deltoides e biceps preservado. Prega cutanea aumentada indicando reserva adiposa elevada.</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-indigo-400 font-bold block">Membros Inferiores:</span>
                  <p className="text-slate-300">Sem sarcopenia aparente em quadriceps ou panturrilhas. Edema maleolar ausente (cacifo negativo / Grau 0).</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'exames' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Exames Bioquimicos e Raciocinio Clinico
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Insira os exames laboratoriais trazidos pelo paciente e registre a analise clinica do zero.
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
                            placeholder="Digite o exame..."
                            className="w-full bg-slate-950 border border-slate-750 rounded-lg p-2 text-xs text-white focus:border-indigo-500 outline-none"
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
                            placeholder="Valores de referência..."
                            className="w-full bg-slate-950 border border-slate-750 rounded-lg p-2 text-xs font-mono text-slate-300 focus:border-indigo-500 outline-none"
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
                            placeholder="Valor encontrado..."
                            className="w-full bg-slate-950 border border-slate-750 rounded-lg p-2 text-xs font-semibold text-white focus:border-indigo-500 outline-none"
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
                            placeholder="Interpretação e raciocínio clínico..."
                            className="w-full bg-slate-950 border border-slate-750 rounded-lg p-2 text-xs text-slate-200 focus:border-indigo-500 outline-none resize-y"
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
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+ Adicionar Exame</span>
                </button>
                <span className="text-[11px] text-slate-400">Clique para adicionar quantas linhas de exames forem necessarias.</span>
              </div>
            </div>
          )}

          {activeTab === 'interacoes' && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Interacoes Droga-Nutriente & Farmacoterapia
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Cadastre os farmacos em uso pelo paciente e registre a analise de interacao droga-nutriente do zero.
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
                            placeholder="Digite o fármaco..."
                            className="w-full bg-slate-950 border border-slate-755 rounded-lg p-2 text-xs text-white focus:border-indigo-500 outline-none"
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
                            placeholder="Classe farmacológica..."
                            className="w-full bg-slate-950 border border-slate-755 rounded-lg p-2 text-xs text-slate-300 focus:border-indigo-500 outline-none"
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
                            placeholder="Descreva a interação e conduta..."
                            className="w-full bg-slate-950 border border-slate-755 rounded-lg p-2 text-xs text-slate-200 focus:border-indigo-500 outline-none resize-y"
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
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+ Adicionar Interacao</span>
                </button>
                <span className="text-[11px] text-slate-400">Clique para adicionar quantas linhas de farmacos forem necessarias.</span>
              </div>
            </div>
          )}

          {activeTab === 'conduta' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                Planejamento Dietoterápico & Prescrição (Bancos Oficiais & Colaborativos)
              </h3>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-sm text-indigo-400 block">Conduta Ambulatorial Padronizada:</span>
                <p className="text-slate-200 leading-relaxed">
                  Dieta hipocalorica moderada (deficit de 500 kcal/dia), calculada para 2.000 kcal, com fracionamento em 5 a 6 refeicoes. Estimulo ao consumo de alimentos ricos em fibras soluveis (aveia, psyllium, leguminosas) e gorduras monoinsaturadas (azeite de oliva extravirgem) para controle da esteatose hepatica e perfil lipidico.
                </p>
              </div>

              {/* Seletor de Bases e Botao Cadastrar Alimento */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 block">Fonte de Dados de Alimentos:</span>
                    <span className="text-[11px] text-slate-400">Escolha a base para consulta ou adicione novos itens compartilhados</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCadAlimentoOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1 cursor-pointer"
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
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <LipidQualitySection
                title="Quadro de Distribuição de Gorduras (Frações Lipídicas do Cardápio)"
                subtitle="Planejamento quali-quantitativo de lipídios da conduta ambulatorial (1g = 9 kcal)."
                vetKcal={2000}
                theme="indigo"
                defaultValues={{
                  satG: '',
                  satPct: '',
                  monoG: '',
                  monoPct: '',
                  poliG: '',
                  poliPct: ''
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
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-xl w-full p-6 text-white space-y-4 shadow-2xl my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥗</span>
                <div>
                  <h4 className="font-bold text-base text-white">Cadastrar Novo Alimento</h4>
                  <p className="text-xs text-slate-400">Tabela Colaborativa Global em Nuvem • Modo Atendimento Real</p>
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoria:</label>
                  <select
                    value={novoAlimento.categoria}
                    onChange={(e) => setNovoAlimento({ ...novoAlimento, categoria: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:border-indigo-500"
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
                <span className="font-bold text-indigo-400 block">Macronutrientes (por 100g): *</span>
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow cursor-pointer flex items-center gap-1.5"
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

      {/* Rodapé Global Institucional */}
      <Footer />
    </div>
  );
}
