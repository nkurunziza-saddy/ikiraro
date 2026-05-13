import { useEffect, useState } from "react";
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
    <div className="flex items-center gap-4 rounded-2xl border border-stone-800 bg-stone-900 p-3">
      <Button
        size="sm"
        variant={isSpeaking ? "outline" : "default"}
        onClick={isSpeaking ? handleStop : handleSpeak}
        className="h-9 min-w-[4rem]"
      >
        {isSpeaking ? "Stop" : "Speak"}
      </Button>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Voice</span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-stone-300" />
            }
          >
            {selectedVoice
              ? selectedVoice.length > 20
                ? selectedVoice.slice(0, 17) + "..."
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

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Rate</span>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className="h-1.5 w-24 cursor-pointer accent-amber-500"
        />
      </div>

      <div className="ml-auto text-[10px] font-medium text-stone-600">TTS</div>
    </div>
  );
}
