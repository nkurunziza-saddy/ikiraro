import { useState, useEffect } from "react";
import { WebSpeechProvider } from "@sensa/communication";
import { Button } from "./ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function TtsControls({ text }: { text: string }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [rate, setRate] = useState(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speech = WebSpeechProvider.getInstance();

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speech.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        const defaultVoice = availableVoices.find((v) => v.default) || availableVoices[0];
        if (defaultVoice) {
          setSelectedVoice(defaultVoice.name);
        }
      }
    };

    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice, speech]);

  const handleSpeak = async () => {
    if (!text) return;
    setIsSpeaking(true);
    await speech.speak(text, { voiceName: selectedVoice, rate });
    setIsSpeaking(false);
  };

  const handleStop = () => {
    speech.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-muted p-2.5">
      <Button
        size="sm"
        variant={isSpeaking ? "outline" : "default"}
        onClick={isSpeaking ? handleStop : handleSpeak}
        className="h-8 min-w-[4.5rem] text-[11px] font-bold uppercase tracking-wider"
      >
        {isSpeaking ? "Stop" : "Speak"}
      </Button>

      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          Voice
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="xs"
                className="h-5 px-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              />
            }
          >
            {selectedVoice
              ? selectedVoice.length > 15
                ? selectedVoice.slice(0, 12) + "..."
                : selectedVoice
              : "Select Voice"}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-60 overflow-y-auto">
            {voices.map((voice) => (
              <DropdownMenuItem
                key={voice.name}
                onClick={() => setSelectedVoice(voice.name)}
                className="text-xs"
              >
                {voice.name} ({voice.lang})
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-1 px-2 border-l">
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          Speed
        </span>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className="h-1 w-20 cursor-pointer accent-primary"
        />
      </div>

      <div className="ml-auto pr-2 text-[9px] font-bold tracking-widest text-muted-foreground">
        TTS
      </div>
    </div>
  );
}
