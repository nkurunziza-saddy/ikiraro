import { useSensa, type SensaRuntime, type SensaEvent } from "@sensa/communication";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "lucide-react";

interface SensaInspectorProps {
  runtime: SensaRuntime;
}

/**
 * Dev Tooling village: A visual debugger for the Sensa Event Bus.
 */
export function SensaInspector({ runtime }: SensaInspectorProps) {
  const { state } = useSensa(runtime);
  const events: SensaEvent[] = state.plugins.inspector?.events || [];

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-black/90 border border-white/10 rounded-xl overflow-hidden shadow-2xl font-mono text-xs text-white z-50">
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-blue-400" />
          <span className="font-bold uppercase tracking-wider">Sensa Inspector</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${state.status === "active" ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}
          />
          <span className="opacity-50">{state.status}</span>
        </div>
      </div>

      <div className="h-64 overflow-y-auto p-2 space-y-1">
        <AnimatePresence initial={false}>
          {events.map((event, i) => (
            <motion.div
              key={event.timestamp + i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-2 rounded bg-white/5 border border-white/5 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between opacity-50 text-[10px]">
                <span>{event.source}</span>
                <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-300">{event.type}</span>
                <span className="opacity-80 truncate">{JSON.stringify(event.payload)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-3 border-t border-white/10 bg-white/5 grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="opacity-40 uppercase text-[9px] font-bold">Composition</span>
          <div className="flex gap-1 flex-wrap">
            {state.plugins.composition?.tokens?.map((t: any, i: number) => (
              <span
                key={i}
                className={`px-1.5 py-0.5 rounded border ${
                  t.stability === "committed"
                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                    : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                }`}
              >
                {t.value}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="opacity-40 uppercase text-[9px] font-bold">Active Tracks</span>
          <div className="flex gap-1">
            {state.activeTracks.map((t: string, i: number) => (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-green-500/20 text-green-300 rounded border border-green-500/30"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
