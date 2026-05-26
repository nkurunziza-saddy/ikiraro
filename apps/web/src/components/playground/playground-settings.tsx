import { Eye, Settings as SettingsIcon } from "lucide-react";
import { usePlaygroundStore, type TTSProvider } from "../../store/playground";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export function PlaygroundSettings() {
  const { visionEnabled, setVisionEnabled, ttsProvider, setTtsProvider, ttsApiKey, setTtsApiKey } =
    usePlaygroundStore();

  return (
    <Popover>
      <PopoverTrigger
        className="p-3 rounded-full transition-colors flex-shrink-0 hover:bg-accent text-muted-foreground"
        title="Playground Settings"
        aria-label="Playground Settings"
      >
        <SettingsIcon size={20} />
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-72 p-5 space-y-4">
        <div className="border-b border-border pb-2">
          <h3 className="font-semibold text-foreground text-sm">Playground Settings</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Sign Language Input
            </Label>
            <button
              onClick={() => setVisionEnabled(!visionEnabled)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-colors ${visionEnabled ? "bg-primary/10 border-primary/20 text-primary" : "bg-secondary border-border text-secondary-foreground hover:bg-secondary/80"}`}
            >
              <div className="flex items-center gap-2">
                <Eye size={15} />
                <span className="text-xs font-medium">Camera Tracking</span>
              </div>
              <div
                className={`w-2.5 h-2.5 rounded-full ${visionEnabled ? "bg-primary" : "bg-muted-foreground"}`}
              />
            </button>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              TTS Voice Engine
            </Label>
            <Select
              value={ttsProvider}
              onValueChange={(val) => {
                if (val) setTtsProvider(val as TTSProvider);
              }}
            >
              <SelectTrigger className="w-full mb-2 bg-secondary border-border h-8 text-xs">
                <SelectValue placeholder="Select Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="browser">Browser Default (Free)</SelectItem>
                <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
              </SelectContent>
            </Select>

            {ttsProvider !== "browser" && (
              <Input
                type="password"
                value={ttsApiKey}
                onChange={(e) => setTtsApiKey(e.target.value)}
                placeholder="API Key"
                className="w-full bg-secondary border-border text-xs h-8"
              />
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
