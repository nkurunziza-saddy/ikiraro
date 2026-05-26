import { Hand, Mic, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { AslHandSvg } from "@ikiraro/renderer";
import { usePlaygroundStore } from "../../store/playground";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { PlaygroundSettings } from "./playground-settings";
import { VoiceInputChannel } from "../../lib/input-channels";

interface PlaygroundOmnibarProps {
  commitText: (text: string) => void;
  commitSignUnits: () => void;
  voiceChannel: VoiceInputChannel;
  isWorking: boolean;
}

export function PlaygroundOmnibar({
  commitText,
  commitSignUnits,
  voiceChannel,
  isWorking,
}: PlaygroundOmnibarProps) {
  const { showKeyboard, setShowKeyboard, textDraft, setTextDraft, signUnits, setSignUnits } =
    usePlaygroundStore();
  const [isRecording, setIsRecording] = useState(false);

  const isVoiceSupported = voiceChannel.isSupported();

  const toggleRecording = () => {
    if (isRecording) {
      voiceChannel.stop();
      setIsRecording(false);
    } else {
      voiceChannel.start();
      setIsRecording(true);
      // Voice results will come through the orchestrator via the channel's intent emitter
    }
  };

  // We still want to stop recording visual state when an intent is processed or after a timeout
  useEffect(() => {
    if (isRecording) {
      const tid = setTimeout(() => setIsRecording(false), 8000);
      return () => clearTimeout(tid);
    }
  }, [isRecording]);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 w-full max-w-[600px] px-4 md:px-0">
      {/* ASL Keyboard Popover */}
      {showKeyboard && (
        <div className="bg-popover/95 backdrop-blur-xl border border-border rounded-2xl shadow-xl p-4 w-full animate-in slide-in-from-bottom-2 text-popover-foreground">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium">
              {signUnits.length > 0 ? signUnits.join(" ") : "Manual Alphabet Input"}
            </span>
            {signUnits.length > 0 && (
              <Button
                onClick={() => commitSignUnits()}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
              >
                Send Sign
              </Button>
            )}
          </div>
          <div className="grid grid-cols-7 sm:grid-cols-9 gap-1 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
              <button
                key={l}
                onClick={() => setSignUnits((p) => [...p, l])}
                className="flex flex-col items-center justify-center gap-1 py-2 bg-secondary hover:bg-accent rounded-lg transition-colors border border-transparent hover:border-border"
              >
                <AslHandSvg letter={l} size={20} className="text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground">{l}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* The Main Toolbar */}
      <div className="bg-popover/95 backdrop-blur-xl border border-border rounded-full shadow-2xl p-2 flex items-center w-full transition-shadow hover:shadow-lg text-popover-foreground">
        <button
          onClick={() => setShowKeyboard(!showKeyboard)}
          className={`p-3 rounded-full transition-colors flex-shrink-0 ${showKeyboard ? "bg-primary/10 text-primary" : "hover:bg-accent text-muted-foreground"}`}
          title="Manual Sign Keyboard"
        >
          <Hand size={20} />
        </button>

        <PlaygroundSettings />

        <Input
          type="text"
          value={textDraft}
          onChange={(e) => setTextDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && textDraft) {
              commitText(textDraft);
            }
          }}
          placeholder="Ask for details, or say 'add mouse to cart'..."
          className="flex-1 bg-transparent border-none outline-none focus-visible:ring-0 shadow-none px-4 text-[15px]"
          id="playground-input"
        />

        <button
          onClick={toggleRecording}
          disabled={!isVoiceSupported}
          className={`p-3 rounded-full transition-colors flex-shrink-0 relative disabled:opacity-30 disabled:cursor-not-allowed ${
            isRecording
              ? "bg-destructive/10 text-destructive animate-pulse"
              : "hover:bg-accent text-muted-foreground"
          }`}
          title={isVoiceSupported ? "Voice Input" : "Voice input is not supported in this browser"}
        >
          <Mic size={20} />
          {isRecording && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-popover" />
          )}
        </button>

        <button
          onClick={() => textDraft && commitText(textDraft)}
          disabled={!textDraft || isWorking}
          className="p-3 bg-primary text-primary-foreground rounded-full transition-all disabled:opacity-50 disabled:scale-100 ml-1 flex-shrink-0 hover:bg-primary/90 active:scale-95 shadow-md shadow-primary/20"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
