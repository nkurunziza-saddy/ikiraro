import { WebSpeechProvider } from "@ikiraro/renderer";
import { useAccessibilityMode } from "@ikiraro/runtime/accessibility";
import { AudioQueue } from "@ikiraro/runtime/audio";
import { useHandTracking } from "@ikiraro/runtime/hand-tracking";
import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { type PlaygroundTab, Sidebar, type TtsProvider, Viewport } from "@/components/playground";
import { useIkiraro } from "../lib/ikiraro";

export const Route = createFileRoute("/playground")({
  component: SDKPlayground,
});

const MODEL_URL = "/models/avatar.glb";
const tts = WebSpeechProvider.getInstance();
const audioQueue = AudioQueue.getInstance(
  (text) => tts.speak(text).catch((err) => console.error("TTS failed:", err)),
  () => tts.cancel(),
);

function SDKPlayground() {
  const { snapshot, translate, startSpeech, stopSpeech, onTranslated } = useIkiraro();
  const camera = useHandTracking();
  const {
    videoRef,
    tracking,
    isActive: isCameraActive,
    fps,
    delegate,
    start: startCamera,
    stop: stopCamera,
  } = camera;
  const { mode: accessMode, setMode: setAccessMode } = useAccessibilityMode();
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState<PlaygroundTab>("stream");
  const [logs, setLogs] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [ttsProvider, setTtsProvider] = useState<TtsProvider>("browser");
  const [ttsApiKey, setTtsApiKey] = useState("");

  const activeEnvelope = useDeferredValue(snapshot.lastEnvelope);
  const isRecording = snapshot.speechStatus === "capturing";
  const isTranslating = snapshot.isTranslating;

  useEffect(() => {
    return onTranslated((envelope) => {
      if (!isMuted && envelope.normalizedText) {
        audioQueue.speak(envelope.normalizedText, "normal");
      }
    });
  }, [onTranslated, isMuted]);

  useEffect(() => {
    if (snapshot.lastEnvelope) {
      setLogs((prev) => [snapshot.lastEnvelope?.normalizedText ?? "", ...prev].slice(0, 20));
    }
  }, [snapshot.lastEnvelope]);

  useEffect(() => {
    tts.setConfig({
      provider: ttsProvider,
      apiKey: ttsApiKey || undefined,
    });
  }, [ttsProvider, ttsApiKey]);

  const lastCommittedRef = useRef<object | null>(null);
  useEffect(() => {
    const token = tracking.committedToken;
    if (!token || token === lastCommittedRef.current) return;
    lastCommittedRef.current = token;
    const word =
      token.type === "fingerspell" ? token.text : token.type === "number" ? token.value : "";
    if (!word) return;
    setText((prev) => (prev ? `${prev} ${word}` : word));
    setLogs((prev) => [`signed: ${word}`, ...prev].slice(0, 20));
    if (!isMuted) audioQueue.speak(word, "normal");
  }, [tracking.committedToken, isMuted]);

  const handleSend = () => {
    if (!text.trim()) return;
    translate(text);
    setText("");
  };

  const toggleRecording = () => {
    if (isRecording) stopSpeech();
    else startSpeech();
  };

  const toggleCamera = () => {
    if (isCameraActive) stopCamera();
    else void startCamera();
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCameraActive={isCameraActive}
        isRecording={isRecording}
        toggleCamera={toggleCamera}
        toggleRecording={toggleRecording}
        videoRef={(el) => {
          videoElRef.current = el;
          videoRef(el);
        }}
        videoEl={videoElRef.current}
        tracking={tracking}
        snapshot={snapshot}
        activeEnvelope={activeEnvelope}
        isTranslating={isTranslating}
        logs={logs}
        setLogs={setLogs}
        accessMode={accessMode}
        setAccessMode={setAccessMode}
        ttsProvider={ttsProvider}
        setTtsProvider={setTtsProvider}
        ttsApiKey={ttsApiKey}
        setTtsApiKey={setTtsApiKey}
        fps={fps}
        delegate={delegate}
      />
      <Viewport
        activeEnvelope={activeEnvelope}
        modelUrl={MODEL_URL}
        text={text}
        setText={setText}
        isTranslating={isTranslating}
        handleSend={handleSend}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        snapshot={snapshot}
      />
    </div>
  );
}
