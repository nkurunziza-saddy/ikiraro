import { Shrink, Expand } from "lucide-react";
import { AvatarViewer } from "@ikiraro/renderer";
import { usePlaygroundStore } from "../../store/playground";

interface PlaygroundAvatarProps {
  activeEnvelope: any;
  modelUrl: string;
  displayError?: string | null;
}

export function PlaygroundAvatar({
  activeEnvelope,
  modelUrl,
  displayError,
}: PlaygroundAvatarProps) {
  const { avatarExpanded, setAvatarExpanded } = usePlaygroundStore();

  return (
    <div
      className={`absolute z-10 transition-all duration-500 ease-in-out border border-border shadow-2xl overflow-hidden bg-background ${
        avatarExpanded
          ? "inset-0 rounded-none"
          : "bottom-6 right-6 w-[220px] h-[220px] md:w-[260px] md:h-[280px] rounded-3xl glass-pane border-2"
      }`}
    >
      {/* Widget Toolbar */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent z-10 flex justify-between items-center opacity-0 hover:opacity-100 transition-opacity">
        <span className="text-white/80 text-xs font-semibold tracking-wider uppercase drop-shadow-md">
          Sign Language Agent
        </span>
        <button
          onClick={() => setAvatarExpanded(!avatarExpanded)}
          className="text-foreground hover:text-primary transition-colors bg-background/40 p-1.5 rounded-md backdrop-blur-md"
          aria-label={avatarExpanded ? "Shrink Avatar" : "Expand Avatar"}
        >
          {avatarExpanded ? <Shrink size={16} /> : <Expand size={16} />}
        </button>
      </div>

      <AvatarViewer envelope={activeEnvelope} modelUrl={modelUrl} className="w-full h-full" />

      {/* Subtitles Overlay */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 text-center pointer-events-none w-[90%] transition-all duration-500 ${
          avatarExpanded ? "bottom-32 max-w-2xl" : "bottom-4 max-w-full"
        }`}
      >
        {activeEnvelope ? (
          <div
            className={`bg-background/60 backdrop-blur-md rounded-xl border border-border/10 ${avatarExpanded ? "p-4" : "p-2"}`}
          >
            <p
              className={`font-semibold text-foreground tracking-tight leading-tight ${avatarExpanded ? "text-2xl" : "text-sm"}`}
            >
              {activeEnvelope.plan.glossText || activeEnvelope.normalizedText}
            </p>
            {activeEnvelope.normalizedText !== activeEnvelope.plan.glossText && (
              <p
                className={`text-foreground/70 mt-0.5 ${avatarExpanded ? "text-sm" : "text-[10px]"}`}
              >
                {activeEnvelope.normalizedText}
              </p>
            )}
          </div>
        ) : (
          <div
            className={`bg-background/40 backdrop-blur-sm rounded-lg opacity-0 transition-opacity ${avatarExpanded ? "p-3" : "p-1.5"}`}
          >
            <p className="text-white/60 text-xs">Waiting...</p>
          </div>
        )}
        {displayError && (
          <div className="bg-destructive/20 text-destructive-foreground p-2 rounded mt-2 text-xs backdrop-blur-sm border border-destructive">
            {displayError}
          </div>
        )}
      </div>
    </div>
  );
}
