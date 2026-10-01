"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Crosshair, Shield } from "lucide-react";
import CampaignOrchestrator from "@/components/campaign/CampaignOrchestrator";
import { bastionBreachCampaign } from "@/data/campaigns/bastionBreach";
import { auroraNegraCampaign } from "@/data/campaigns/auroraNegra";
import { useCampaignStore } from "@/stores/campaignStore";

export default function CampanhasPage() {
  const { activeCampaignId } = useCampaignStore();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("aurora-negra");

  useEffect(() => {
    if (activeCampaignId) {
      setSelectedCampaignId(activeCampaignId);
    }
  }, [activeCampaignId]);

  const activeCampaign = selectedCampaignId === "bastion-breach" 
    ? bastionBreachCampaign 
    : auroraNegraCampaign;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top operational navigation bar */}
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retornar ao CyberCert Console</span>
          </Link>

          {/* Operation Selector */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
            <button
              onClick={() => setSelectedCampaignId("aurora-negra")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
                selectedCampaignId === "aurora-negra"
                  ? "bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 font-bold shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 text-rose-400" />
              <span>AURORA NEGRA (5 ETAPAS)</span>
            </button>

            <button
              onClick={() => setSelectedCampaignId("bastion-breach")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
                selectedCampaignId === "bastion-breach"
                  ? "bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 font-bold shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>BASTION BREACH (PILOTO)</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
              Live Threat Simulation Deck
            </span>
          </div>
        </div>
      </nav>

      {/* Main Campaign Canvas */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <CampaignOrchestrator campaign={activeCampaign} />
      </main>
    </div>
  );
}
