import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Volume2, VolumeX } from "lucide-react";
import { AvatarViewer, WebSpeechProvider } from "@ikiraro/renderer";
import { buildPlanFromUnits, createEnvelope } from "@ikiraro/engine/planning";
import type { TranslationEnvelope } from "@ikiraro/engine/types";

const MODEL_URL = "/models/avatar.glb";
const tts = WebSpeechProvider.getInstance();

// Phrases drawn from the landing page copy — all in LEXEME_POSES
type DemoSign = { units: string[]; text: string };

const DEMO_SIGNS: DemoSign[] = [
  { units: ["HELLO"], text: "Hello" },
  { units: ["SIGN"], text: "Sign" },
  { units: ["LEARN"], text: "Learn" },
  { units: ["UNDERSTAND"], text: "Understand" },
  { units: ["PLEASE"], text: "Please" },
  { units: ["THANK-YOU"], text: "Thank you" },
  { units: ["GOOD"], text: "Good" },
];

type AvatarCtx = {
  envelope: TranslationEnvelope | null;
  currentSign: DemoSign;
  audioEnabled: boolean;
  toggleAudio: () => void;
};

const Ctx = createContext<AvatarCtx | null>(null);

function useLandingAvatar() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLandingAvatar must be within LandingAvatarProvider");
  return ctx;
}

export function LandingAvatarProvider({ children }: { children: ReactNode }) {
  const [signIndex, setSignIndex] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioRef = useRef(false);
  audioRef.current = audioEnabled;

  // Build the envelope using the engine planning pipeline directly —
  // same path as translateUnits, no API key needed.
  const envelope = useMemo<TranslationEnvelope>(() => {
    const sign = DEMO_SIGNS[signIndex]!;
    return createEnvelope(buildPlanFromUnits(sign.units), {
      mode: "sign-keys",
      rawInput: sign.units.join(" "),
    });
  }, [signIndex]);

  // Advance to the next phrase after the current animation finishes.
  useEffect(() => {
    const totalDuration = envelope.rendererQueue.reduce((s, f) => s + f.duration, 0);
    const timer = setTimeout(
      () => setSignIndex((i) => (i + 1) % DEMO_SIGNS.length),
      totalDuration + 1600,
    );
    return () => clearTimeout(timer);
  }, [envelope]);

  // Speak the current phrase when audio is enabled.
  useEffect(() => {
    if (!audioRef.current) return;
    void tts.speak(DEMO_SIGNS[signIndex]!.text);
  }, [signIndex]);

  const toggleAudio = () =>
    setAudioEnabled((prev) => {
      if (prev) tts.cancel();
      return !prev;
    });

  return (
    <Ctx.Provider
      value={{ envelope, currentSign: DEMO_SIGNS[signIndex]!, audioEnabled, toggleAudio }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function HeroAvatarPane() {
  const { envelope, currentSign, audioEnabled, toggleAudio } = useLandingAvatar();

  return (
    <div className="relative aspect-[3/4] bg-foreground rounded-2xl overflow-hidden select-none">
      <AvatarViewer envelope={envelope} modelUrl={MODEL_URL} className="w-full h-full" />

      <div className="absolute bottom-0 inset-x-0 px-4 py-3 bg-gradient-to-t from-black/55 to-transparent flex items-end justify-between">
        <span className="text-white/90 font-bold text-[11px] tracking-[0.22em] uppercase">
          {currentSign.units.join(" · ")}
        </span>
        <button
          onClick={toggleAudio}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          title={audioEnabled ? "Mute" : "Enable audio"}
        >
          {audioEnabled ? (
            <Volume2 size={13} className="text-white" />
          ) : (
            <VolumeX size={13} className="text-white/50" />
          )}
        </button>
      </div>
    </div>
  );
}

export function FloatingAvatarWidget({ heroRef }: { heroRef: RefObject<HTMLDivElement | null> }) {
  const { envelope, currentSign } = useLandingAvatar();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!(entry?.isIntersecting ?? true)),
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [heroRef]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="w-[120px] h-[152px] bg-foreground rounded-xl overflow-hidden shadow-xl relative">
        <AvatarViewer envelope={envelope} modelUrl={MODEL_URL} className="w-full h-full" />
        <div className="absolute bottom-0 inset-x-0 px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent">
          <span className="text-white/80 text-[8px] font-bold tracking-[0.2em] uppercase">
            {currentSign.units.join(" · ")}
          </span>
        </div>
      </div>
    </div>
  );
}
