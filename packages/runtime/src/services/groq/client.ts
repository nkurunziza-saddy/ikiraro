import { Context, Layer } from "effect";

export interface GroqOptions {
  readonly apiKey: string;
  readonly baseUrl?: string;
}

export class Groq extends Context.Tag("Groq")<Groq, GroqOptions>() {}

export const makeGroqLayer = (options: GroqOptions) => Layer.succeed(Groq, options);
