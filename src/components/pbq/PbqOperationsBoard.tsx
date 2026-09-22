"use client";

import { useState } from "react";
import {
  PBQ_OPERATIONS,
  PbqOperation,
  PbqDifficulty,
} from "@/lib/pbqData";
import PbqLiveIncidentTicker from "./PbqLiveIncidentTicker";
import PbqMissionContainer from "./PbqMissionContainer";
import {
  Clock,
  ChevronRight,
  CheckCircle2,
  Search,
  Shield,
} from "lucide-react";

const DIFF_LABEL: Record<PbqDifficulty, string> = {
  Beginner: "Beginner",
  Intermediate: "Intermediate",
  Advanced: "Advanced",
};


export default function PbqOperationsBoard() {
  const [selectedOperation, setSelectedOperation] = useState<PbqOperation | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<"ALL" | PbqDifficulty>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Track completed missions in state / local storage
  const [completedMissions, setCompletedMissions] = useState<
    Record<string, { score: number; time: number }>
  >(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem("cybercert_completed_pbqs");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const handleMissionComplete = (
    opId: string,
    success: boolean,
    score: number,
    time: number
  ) => {
    if (success) {
      setCompletedMissions((prev) => {
        const next = { ...prev, [opId]: { score, time } };
        try {
          localStorage.setItem("cybercert_completed_pbqs", JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });
    }
  };

  const filteredOperations = PBQ_OPERATIONS.filter((op) => {
    if (difficultyFilter !== "ALL" && op.difficulty !== difficultyFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        op.title.toLowerCase().includes(q) ||
        op.category.toLowerCase().includes(q) ||
        op.incidentCode.toLowerCase().includes(q) ||
        op.opCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const completedCount = Object.keys(completedMissions).length;

  // Active mission view
  if (selectedOperation) {
    return (
      <PbqMissionContainer
        operation={selectedOperation}
        onBackToMenu={() => setSelectedOperation(null)}
        onComplete={handleMissionComplete}
      />
    );
  }

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              PBQ Operations
            </h1>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-2.5 py-0.5 rounded-full">
              SOC SIMULATOR
            </span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
            Simulações práticas de segurança defensiva. Analise vetores de ataque, tome decisões técnicas sob pressão e monitore o impacto na infraestrutura.
          </p>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-2 shrink-0 bg-zinc-900/90 border border-zinc-800 px-4 py-2 rounded-xl">
          <span className="text-xs text-zinc-400">Concluídos:</span>
          <span className="text-sm font-bold text-emerald-400 font-mono">
            {completedCount} / {PBQ_OPERATIONS.length}
          </span>
        </div>
      </div>

      {/* Incident Activity Ticker */}
      <PbqLiveIncidentTicker />

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs">
          {(["ALL", "Beginner", "Intermediate", "Advanced"] as const).map((diff) => {
            const isActive = difficultyFilter === diff;
            return (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-3.5 py-2 rounded-lg font-bold transition-all ${
                  isActive
                    ? "bg-cyan-950 border border-cyan-600/80 text-cyan-300 shadow-sm"
                    : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80"
                }`}
              >
                {diff === "ALL" ? `Todos (${PBQ_OPERATIONS.length})` : diff}
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cenário, incidente ou código..."
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-lg px-3 py-2 pl-9 text-xs focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOperations.map((op) => {
          const isDone = Boolean(completedMissions[op.id]);
          const result = completedMissions[op.id];

          return (
            <button
              key={op.id}
              onClick={() => setSelectedOperation(op)}
              className={`group text-left p-5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                isDone
                  ? "bg-zinc-900/70 border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900"
                  : "bg-zinc-900/80 border-zinc-800/90 hover:border-cyan-500/60 hover:bg-zinc-900 shadow-lg shadow-black/40"
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                    {op.title}
                  </h3>
                  {isDone ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolvido
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700/60 shrink-0">
                      {op.incidentCode}
                    </span>
                  )}
                </div>

                {/* Meta row with clear pills */}
                <div className="flex items-center flex-wrap gap-2 text-xs mb-3">
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700/60 rounded text-[11px] font-medium">
                    {op.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      op.difficulty === "Beginner"
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/60"
                        : op.difficulty === "Intermediate"
                        ? "bg-amber-950/80 text-amber-300 border-amber-800/60"
                        : "bg-rose-950/80 text-rose-300 border-rose-800/60"
                    }`}
                  >
                    {DIFF_LABEL[op.difficulty]}
                  </span>
                  <span className="text-zinc-500 text-[11px]">{op.opCode}</span>
                </div>

                {/* Objective */}
                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2 mb-4">
                  {op.objective}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs pt-3 border-t border-zinc-800/80">
                <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
                  <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    {op.timeLimit}s
                  </span>
                  {isDone && result && (
                    <span className="text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/50">
                      {result.time}s · {result.score}%
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1 transition-colors">
                  Iniciar Missão
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredOperations.length === 0 && (
        <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 rounded-xl">
          <p className="text-zinc-400 text-sm">Nenhum cenário corresponde aos filtros selecionados.</p>
        </div>
      )}
    </div>
  );
}
