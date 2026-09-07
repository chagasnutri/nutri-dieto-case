import React from "react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-500 text-xs py-6 px-4 text-center sm:text-left">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          &copy; {new Date().getFullYear()} <strong>DietoCase</strong> &bull; Sistema Clínico-Nutricional Integrado.
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
          <span>Tabela TACO 4ª Edição</span>
          <span>&bull;</span>
          <span>5 Fórmulas Abertas</span>
          <span>&bull;</span>
          <span>Preceptor IA Socrático</span>
        </div>
      </div>
    </footer>
  );
}

