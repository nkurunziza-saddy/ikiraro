import {
  createContext,
  useContext,
  useEffect,
  useState,
  useDeferredValue,
  type ReactNode,
} from "react";
import { AvatarViewer } from "@ikiraro/renderer";
import { useIkiraro } from "../../lib/ikiraro";
const MODEL_URL = "/models/avatar.glb";
type Sign = { units: string[]; delay: number };
const signs: Sign[] = [
  { units: ["H", "E", "L", "L", "O"], delay: 3000 },
  { units: ["W", "O", "R", "L", "D"], delay: 4000 },
  { units: ["S", "E", "N", "S", "A"], delay: 5000 },
  { units: ["P", "R", "I", "V", "A", "C", "Y"], delay: 4000 },
  { units: ["S", "P", "E", "E", "D"], delay: 3000 },
];
const LandingAvatarContext = createContext<{
  envelope: any;
  currentSign: Sign;
} | null>(null);
export function LandingAvatarProvider({ children }: { children: ReactNode }) {
  const { snapshot, translateUnits } = useIkiraro();
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSign = signs[currentIndex];
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const playNext = () => {
      translateUnits(currentSign.units);
      setHasStarted(true);
      timeoutId = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % signs.length);
      }, currentSign.delay);
    };
    timeoutId = setTimeout(playNext, hasStarted ? 0 : 1000);
    return () => clearTimeout(timeoutId);
  }, [currentIndex, translateUnits, currentSign, hasStarted]);
  return (
    <LandingAvatarContext.Provider
      value={{
        envelope: snapshot.lastEnvelope,
        currentSign,
      }}
    >
      {children}
    </LandingAvatarContext.Provider>
  );
}
function useLandingAvatar() {
  const ctx = useContext(LandingAvatarContext);
  if (!ctx) throw new Error("Missing provider");
  return { ...ctx, envelope: useDeferredValue(ctx.envelope) };
}
export function HeroAvatarPane() {
  const { envelope, currentSign } = useLandingAvatar();
  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
      <div className="absolute inset-0 z-0 mix-blend-screen opacity-90 transition-all duration-1000">
        <AvatarViewer envelope={envelope} modelUrl={MODEL_URL} className="w-full h-full" />
      </div>
      <div className="absolute bottom-10 right-10 flex flex-col items-end gap-1">
        <span className="text-foreground font-semibold text-[32px] tracking-tighter leading-none block">
          {currentSign.units.join("")}
        </span>
      </div>
    </div>
  );
}
export function FloatingAvatarWidget() {
  const { envelope } = useLandingAvatar();
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 800);
    };
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
            envelope={envelope}
            modelUrl={MODEL_URL}
            className="w-full h-full scale-[1.2]"
          />
        </div>
      </div>
    </div>
  );
}
