import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AvatarViewer } from "@ikiraro/renderer/avatar-viewer";
import { buildPlanFromUnits, createEnvelope } from "@ikiraro/engine/planning";
import type { TranslationEnvelope } from "@ikiraro/engine/types";

const MODEL_URL = "/models/avatar.glb";

type SignEntry = { glosses: string[] | null; delay: number };

const SIGN_SEQUENCE: SignEntry[] = [
  { glosses: ["HELLO"], delay: 3500 },
  { glosses: ["GOOD"], delay: 3000 },
  { glosses: ["SIGN"], delay: 3000 },
  { glosses: ["THANK-YOU"], delay: 3500 },
  { glosses: null, delay: 2500 },
];

const ENVELOPES: (TranslationEnvelope | null)[] = SIGN_SEQUENCE.map((s) => {
  if (!s.glosses) return null;
  return createEnvelope(buildPlanFromUnits(s.glosses));
});

const LandingAvatarContext = createContext<{
  currentEnvelope: TranslationEnvelope | null;
} | null>(null);

export function LandingAvatarProvider({ children }: { children: ReactNode }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentEnvelope = ENVELOPES[currentIndex] ?? null;
  const delay = SIGN_SEQUENCE[currentIndex]!.delay;

  useEffect(() => {
    const tid = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % SIGN_SEQUENCE.length);
    }, delay);
    return () => clearTimeout(tid);
  }, [currentIndex, delay]);

  return (
    <LandingAvatarContext.Provider value={{ currentEnvelope }}>
      {children}
    </LandingAvatarContext.Provider>
  );
}

function useLandingAvatar() {
  const ctx = useContext(LandingAvatarContext);
  if (!ctx) throw new Error("Missing LandingAvatarProvider");
  return ctx;
}

export function HeroAvatarPane() {
  const { currentEnvelope } = useLandingAvatar();
  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
      <div className="absolute inset-0 z-0 mix-blend-screen opacity-90 transition-all duration-1000">
        <AvatarViewer envelope={currentEnvelope} modelUrl={MODEL_URL} className="w-full h-full" />
      </div>
    </div>
  );
}

export function FloatingAvatarWidget() {
  const { currentEnvelope } = useLandingAvatar();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > 800);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-10 right-10 z-50 pointer-events-none w-[180px] h-[220px] transition-all duration-700 ease-in-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="w-full h-full relative group pointer-events-auto">
        <div className="absolute inset-0 z-10 mix-blend-screen opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <AvatarViewer
            envelope={currentEnvelope}
            modelUrl={MODEL_URL}
            className="w-full h-full scale-[1.2]"
          />
        </div>
      </div>
    </div>
  );
}
