import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-950/80 backdrop-blur-xs border-t border-slate-800/80 text-slate-400 text-xs py-4 px-4 text-center select-none print:block">
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-1.5 text-center">
        <p className="font-medium tracking-tight text-slate-300">
          &copy; 2026 DietoCase - Desenvolvido por Prof. Chagas Neto. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
