export interface UserIntent {
  source: "voice" | "vision" | "manual";
  text: string;
  metadata?: Record<string, any>;
}

export type IntentHandler = (intent: UserIntent) => void;

export interface IInputChannel {
  id: string;
  onIntent(handler: IntentHandler): () => void;
  start(): Promise<void>;
  stop(): void;
  dispose(): void;
}

export class ManualInputChannel implements IInputChannel {
  id = "manual";
  private handlers = new Set<IntentHandler>();
  private disposed = false;

  onIntent(handler: IntentHandler) {
    if (this.disposed) return () => {};
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  emit(text: string) {
    if (this.disposed) return;
    this.handlers.forEach((h) => h({ source: "manual", text }));
  }

  async start() {}
  stop() {}

  dispose() {
    this.disposed = true;
    this.handlers.clear();
  }
}

export class VoiceInputChannel implements IInputChannel {
  id = "voice";
  private handlers = new Set<IntentHandler>();
  private recognition: any = null;
  private disposed = false;
  private endCbs = new Set<() => void>();

  constructor() {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = "en-US";

    this.recognition.onresult = (event: any) => {
      if (this.disposed) return;
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        this.handlers.forEach((h) => h({ source: "voice", text: transcript }));
      }
    };

    const fireEnd = () => {
      if (!this.disposed) this.endCbs.forEach((cb) => cb());
    };
    this.recognition.onend = fireEnd;
    this.recognition.onerror = fireEnd;
  }

  /** Subscribe to recording-end events. Returns unsubscribe fn. */
  onRecordingEnd(cb: () => void): () => void {
    this.endCbs.add(cb);
    return () => this.endCbs.delete(cb);
  }

  onIntent(handler: IntentHandler) {
    if (this.disposed) return () => {};
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  async start() {
    if (this.disposed || !this.recognition) return;
    try {
      this.recognition.start();
    } catch {
      // Already started or already stopped — onend will fire regardless
    }
  }

  stop() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch {
      /* already stopped */
    }
  }

  isSupported() {
    return !!this.recognition;
  }

  dispose() {
    this.stop();
    this.disposed = true;
    this.handlers.clear();
    this.endCbs.clear();
    this.recognition = null;
  }
}

export class VisionInputChannel implements IInputChannel {
  id = "vision";
  private handlers = new Set<IntentHandler>();
  private disposed = false;

  onIntent(handler: IntentHandler) {
    if (this.disposed) return () => {};
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  emit(text: string) {
    if (this.disposed) return;
    this.handlers.forEach((h) => h({ source: "vision", text }));
  }

  async start() {}
  stop() {}

  dispose() {
    this.disposed = true;
    this.handlers.clear();
  }
}
