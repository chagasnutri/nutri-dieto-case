import React from "react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  activeModule?: "simulation" | "real" | "home";
}

export default function Header({ title = "DietoCase", subtitle = "Simulador Clínico & Prática Ambulatorial", activeModule = "home" }: HeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
      <div className="flex items-center space-x-3">
        <a href="/" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-xl shadow-md border border-emerald-300/30 hover:scale-105 transition">
          ??
        </a>
        <div>
          <div className="flex items-center gap-2">
            <a href="/" className="font-black text-lg tracking-tight text-white hover:text-emerald-400 transition">
              {title}
            </a>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
              v2.5
            </span>
          </div>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      <nav className="flex items-center space-x-2 text-xs font-semibold">
        <a
          href="/?view=simulation"
          className={`px-3 py-1.5 rounded-xl border transition ${
            activeModule === "simulation"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
              : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700"
          }`}
        >
          Modo Simulação
        </a>
        <a
          href="/?view=real"
          className={`px-3 py-1.5 rounded-xl border transition ${
            activeModule === "real"
              ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
              : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700"
          }`}
        >
          Atendimento Real
        </a>
      </nav>
    </header>
  );
}

