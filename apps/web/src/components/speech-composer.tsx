import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { AudioVisualizer } from "./audio-visualizer";
import { getSupportedAudioRecordingMimeType } from "@/lib/audio";

const MIN_SPEECH_RECORDING_MS = 250;
const MIN_SPEECH_AUDIO_BYTES = 512;

export function SpeechComposer({
  sttModel,
  setSttModel,
  speechPrompt,
  setSpeechPrompt,
  onSpeechCaptured,
  isWorking,
}: {
  sttModel: string;
  setSttModel: (model: any) => void;
  speechPrompt: string;
  setSpeechPrompt: (prompt: string) => void;
  onSpeechCaptured: (audio: Blob) => void;
  isWorking: boolean;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [speechAudio, setSpeechAudio] = useState<Blob | null>(null);
  const [speechAudioUrl, setSpeechAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);

  const STT_OPTIONS = ["whisper-large-v3", "whisper-large-v3-turbo"];

  const stopAudioStream = () => {
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
  };

  const startRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      const mimeType = getSupportedAudioRecordingMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const elapsedMs = recordingStartedAtRef.current
          ? performance.now() - recordingStartedAtRef.current
          : 0;
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (audioBlob.size < MIN_SPEECH_AUDIO_BYTES || elapsedMs < MIN_SPEECH_RECORDING_MS) {
          setError("Recording too short or no audio detected.");
          setSpeechAudio(null);
        } else {
          setSpeechAudio(audioBlob);
          setSpeechAudioUrl(URL.createObjectURL(audioBlob));
          onSpeechCaptured(audioBlob);
          setError(null);
        }

        setIsRecording(false);
        stopAudioStream();
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = performance.now();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to access microphone.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">
          STT Model
        </span>
        <select
          value={sttModel}
          onChange={(e) => setSttModel(e.target.value)}
          className="rounded-[1rem] border border-stone-800 bg-stone-900 px-4 py-3 text-sm text-white outline-none"
        >
          {STT_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={startRecording}
            disabled={isWorking}
          >
            {isRecording ? "Stop Capture" : speechAudio ? "Record Again" : "Record Audio"}
          </Button>
          <span className="text-xs text-stone-300">Accuracy-first intake using Whisper large.</span>
        </div>

        {isRecording && (
          <div className="mt-4">
            <AudioVisualizer stream={audioStreamRef.current} isRecording={isRecording} />
          </div>
        )}

        {speechAudioUrl && !isRecording && (
          <audio controls src={speechAudioUrl} className="mt-4 h-10 w-full rounded-xl" />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">
          STT Spelling Hints
        </span>
        <textarea
          value={speechPrompt}
          onChange={(e) => setSpeechPrompt(e.target.value)}
          placeholder="Add proper nouns, medical terms, or unusual spellings to help the STT engine."
          className="min-h-28 rounded-[1.5rem] border border-stone-800 bg-stone-900 px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-stone-500 focus:border-white"
        />
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}
