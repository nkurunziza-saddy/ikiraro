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
  console.log({ displayError });
  return (
    <div
      className={`absolute z-10 transition-all duration-500 ease-in-out border border-border shadow-2xl overflow-hidden bg-background ${
        avatarExpanded
          ? "inset-0 rounded-none"
          : "bottom-6 right-6 w-[220px] h-[220px] md:w-[260px] md:h-[280px] rounded-3xl glass-pane border-2"
      }`}
    >
      {/* Widget Toolbar */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent z-10 flex justify-end items-center opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={() => setAvatarExpanded(!avatarExpanded)}
          className="text-foreground hover:text-primary transition-colors bg-background/40 p-1.5 rounded-md backdrop-blur-md"
          aria-label={avatarExpanded ? "Shrink Avatar" : "Expand Avatar"}
        >
          {avatarExpanded ? <Shrink size={16} /> : <Expand size={16} />}
        </button>
      </div>

      <AvatarViewer envelope={activeEnvelope} modelUrl={modelUrl} className="w-full h-full" />
    </div>
  );
}
