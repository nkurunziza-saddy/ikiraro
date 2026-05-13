export class WebSpeechProvider {
  static speak(text: string, voiceName?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const browserWindow = globalThis as typeof globalThis & {
        speechSynthesis?: {
          getVoices(): Array<{ name: string }>;
          speak(utterance: {
            voice?: { name: string };
            onend: (() => void) | null;
            onerror: ((event: unknown) => void) | null;
          }): void;
        };
        SpeechSynthesisUtterance?: new (value: string) => {
          voice?: { name: string };
          onend: (() => void) | null;
          onerror: ((event: unknown) => void) | null;
        };
      };

      if (!browserWindow.speechSynthesis || !browserWindow.SpeechSynthesisUtterance) {
        reject(new Error("Speech synthesis not supported"));
        return;
      }

      const utterance = new browserWindow.SpeechSynthesisUtterance(text);
      if (voiceName) {
        const voices = browserWindow.speechSynthesis.getVoices();
        const voice = voices.find((candidate) => candidate.name === voiceName);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event);
      browserWindow.speechSynthesis.speak(utterance);
    });
  }
}
