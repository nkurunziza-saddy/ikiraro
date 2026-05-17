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
        const defaultVoice =
          availableVoices.find((v: SpeechSynthesisVoice) => v.default) || availableVoices[0];
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
    <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-2 shadow-sm">
      <Button
        size="sm"
        variant={isSpeaking ? "outline" : "default"}
        onClick={isSpeaking ? handleStop : handleSpeak}
        className="h-9 min-w-[5.5rem] text-[11px] font-bold uppercase tracking-wider"
      >
        {isSpeaking ? "Stop" : "Speak"}
      </Button>

      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          Voice
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1 text-[11px] font-bold text-muted-foreground hover:text-foreground justify-start truncate"
              />
            }
          >
            {selectedVoice
              ? selectedVoice.length > 20
                ? selectedVoice.slice(0, 18) + "..."
                : selectedVoice
              : "Select Voice"}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-60 overflow-y-auto w-64">
            {voices.map((voice) => (
              <DropdownMenuItem
                key={voice.name}
                onClick={() => setSelectedVoice(voice.name)}
                className="text-xs py-2"
              >
                <div className="flex flex-col">
                  <span className="font-bold">{voice.name}</span>
                  <span className="text-[10px] opacity-60 uppercase tracking-widest">
                    {voice.lang}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-1.5 px-3 border-l ml-auto sm:ml-0">
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          STT Rate
        </span>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className="h-1 w-24 cursor-pointer accent-primary appearance-none bg-secondary rounded-full"
        />
      </div>

      <div className="hidden sm:block ml-auto pr-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
        TTS
      </div>
    </div>
  );
}
