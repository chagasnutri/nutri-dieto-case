import React from 'react';

/**
 * Floating Action Button (FAB) do Preceptor IA
 * Posicionado no canto inferior direito, visível tanto na Simulação quanto no Atendimento Real
 */
export default function PreceptorFAB({ onClick, isOpen, unreadCount = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      id="preceptorFabBtn"
      aria-label="Abrir Preceptor IA"
      className="fixed bottom-6 right-6 z-40 flex items-center space-x-2.5 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold py-3.5 px-5 rounded-full shadow-2xl hover:shadow-purple-500/30 transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-95 cursor-pointer border border-purple-400/40 focus:outline-none focus:ring-4 focus:ring-purple-400/50 group"
    >
      <span className="relative flex h-3.5 w-3.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-purple-800"></span>
      </span>
      <span className="text-xl group-hover:scale-110 transition-transform">🧠</span>
      <span className="text-sm tracking-wide font-semibold">Preceptor IA</span>
      {unreadCount > 0 && (
        <span className="bg-rose-500 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
