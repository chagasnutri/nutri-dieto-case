import React, { useState, useRef, useEffect } from 'react';

/**
 * Painel Lateral (Drawer) do Preceptor IA
 * Sobreposto ao prontuário, com contexto clínico em tempo real e Método Socrático Estrito
 */
export default function PreceptorDrawer({
  isOpen,
  onClose,
  clinicalContext = {},
  messages = [],
  onSendMessage,
  isLoading = false
}) {
  const [inputText, setInputText] = useState('');
  const [isContextExpanded, setIsContextExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickPrompts = [
    "Qual a relação fisiopatológica dos exames com o quadro?",
    "Como o estado nutricional deve impactar minha conduta?",
    "Que diretrizes justificam a distribuição de macros?",
    "Como definir os objetivos dietoterápicos prioritários?"
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 text-white p-4 shrink-0 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-xl border border-white/20 shadow-inner">
                🧠
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide flex items-center space-x-1.5">
                  <span>Preceptor IA</span>
                  <span className="text-[10px] bg-purple-300/30 text-purple-100 px-2 py-0.5 rounded-full font-semibold border border-purple-300/40">
                    Método Socrático
                  </span>
                </h3>
                <p className="text-[11px] text-purple-200/90 font-medium">
                  Professor Virtual de Nutrição Clínica
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Cenário Clínico Ativo */}
          <div className="bg-black/20 rounded-lg px-2.5 py-1.5 text-[11px] flex items-center justify-between text-purple-100 border border-white/10">
            <span className="truncate max-w-[280px]">
              👤 {clinicalContext.paciente?.nome || 'Paciente'} ({clinicalContext.paciente?.idade || '--'})
            </span>
            <span className="text-[10px] bg-emerald-400/30 text-emerald-200 font-bold px-2 py-0.5 rounded">
              {clinicalContext.modalidade ? 'Cenário Ativo' : 'Sincronizado'}
            </span>
          </div>
        </div>

        {/* Banner Sanfonado de Contexto Clínico */}
        <div className="bg-slate-50 border-b border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setIsContextExpanded(!isContextExpanded)}
            className="w-full px-4 py-2 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <span className="flex items-center space-x-1.5">
              <span>📋</span>
              <span>Contexto Clínico Lido em Tempo Real</span>
            </span>
            <span className="text-slate-400 text-xs">{isContextExpanded ? '▲ Fechar' : '▼ Ver'}</span>
          </button>

          {isContextExpanded && (
            <div className="p-3 bg-white text-[11px] text-slate-600 border-t border-slate-100 space-y-1 max-h-48 overflow-y-auto">
              <div><strong className="text-slate-800">Modalidade:</strong> {clinicalContext.modalidade || 'Não informada'}</div>
              <div><strong className="text-slate-800">Diagnóstico / Hipótese:</strong> {clinicalContext.paciente?.patologiasHipoteses || 'Não especificado'}</div>
              <div><strong className="text-slate-800">Antropometria:</strong> Peso {clinicalContext.antropometria?.peso || '--'} | Altura {clinicalContext.antropometria?.estatura || '--'} | IMC {clinicalContext.antropometria?.imc || '--'}</div>
              <div><strong className="text-slate-800">Exames:</strong> {clinicalContext.bioquimica?.length ? `${clinicalContext.bioquimica.length} exames mapeados` : 'Sem exames adicionados'}</div>
              {clinicalContext.diagnosticoPES?.problema && (
                <div><strong className="text-slate-800">PES:</strong> {clinicalContext.diagnosticoPES.problema}</div>
              )}
            </div>
          )}
        </div>

        {/* Mensagens do Chat */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/50">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold mb-1 opacity-80">
                    <span>{isUser ? 'Você (Estudante)' : 'Preceptor IA'}</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-purple-50 border border-purple-200 text-purple-800 text-xs px-3 py-2 rounded-2xl rounded-tl-xs font-medium flex items-center space-x-2 animate-pulse">
                <span>🧠</span>
                <span>Preceptor formulando questão socrática...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chips de Perguntas Rápidas */}
        <div className="bg-white border-t border-slate-100 p-2 overflow-x-auto whitespace-nowrap flex gap-1.5 shrink-0">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSendMessage(q)}
              className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-2.5 py-1 rounded-full font-medium transition shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Campo de Entrada e Envio */}
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-end space-x-2">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte ou apresente sua conduta ao Preceptor..."
              className="flex-1 border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none outline-none text-slate-800 placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center cursor-pointer"
            >
              Enviar
            </button>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-2">
            ⚠️ O Preceptor questiona e estimula o raciocínio. Não fornece respostas diretas, cálculos ou avaliações de certo/errado.
          </p>
        </form>
      </div>
    </>
  );
}
