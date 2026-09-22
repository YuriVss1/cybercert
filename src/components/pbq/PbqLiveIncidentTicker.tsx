"use client";

import { useEffect, useState, useRef } from "react";
import { LIVE_INCIDENT_FEED, type PbqIncidentEvent } from "@/lib/pbqData";

export default function PbqLiveIncidentTicker() {
  const [events, setEvents] = useState<PbqIncidentEvent[]>(() => LIVE_INCIDENT_FEED.slice(0, 3));
  const currentIndexRef = useRef(3);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndexRef.current + 1) % LIVE_INCIDENT_FEED.length;
      currentIndexRef.current = nextIndex;
      const newEvent = LIVE_INCIDENT_FEED[nextIndex];

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      setEvents((prev) => [
        { ...newEvent, id: `${newEvent.id}-${Date.now()}`, timestamp: timeStr },
        ...prev.slice(0, 2),
      ]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono shadow-sm">
      <div className="flex items-center gap-2 shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
          SOC Live Telemetry
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 min-w-0">
        {events.map((evt, idx) => (
          <div
            key={evt.id}
            className={`flex items-center gap-2 text-xs transition-opacity ${
              idx === 0 ? "text-zinc-100" : "text-zinc-400"
            }`}
          >
            <span className="text-zinc-500 tabular-nums text-[11px]">{evt.timestamp}</span>
            <span className="text-cyan-400 font-semibold text-[11px]">{evt.source.split("-")[0]}</span>
            <span className="text-zinc-300 text-[11px]">→ {evt.targetHost}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
