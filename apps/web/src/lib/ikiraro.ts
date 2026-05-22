import { createIkiraroClient } from "@ikiraro/sdk";
export const ikiraroClient = createIkiraroClient({
  sdk: {
    groqApiKey: import.meta.env.VITE_GROQ_API_KEY || "demo",
  },
  keyboard: true,
});
export const { useIkiraro, useIkiraroPlugin } = ikiraroClient;
