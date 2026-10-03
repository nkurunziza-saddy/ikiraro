import { frames, SHOW } from "./terminal.ts";

// node src/cli.ts hello world
const FPS = 20;
const text = process.argv.slice(2).join(" ") || "hello";
const { columns, rows } = process.stdout;

process.on("SIGINT", () => {
  process.stdout.write(SHOW.end);
  process.exit(0);
});

process.stdout.write(SHOW.start);
for (const frame of frames(text, columns, rows, FPS)) {
  process.stdout.write(frame);
  await new Promise((resolve) => setTimeout(resolve, 1000 / FPS));
}
process.stdout.write(SHOW.end);
