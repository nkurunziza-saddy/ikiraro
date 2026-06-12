---
"@ikiraro/sdk": patch
---

WebSpeechProvider.speak() and speakQueue() now reject when cloud TTS (ElevenLabs/OpenAI) fails instead of resolving silently. Wrap fire-and-forget calls in .catch().
