import type { ChunkingOptions, TextChunk } from "./types.js";

export const defaultChunkingOptions: ChunkingOptions = {
  chunkSizeWords: 1000,
  overlapWords: 150
};

export function chunkText(
  text: string,
  options: ChunkingOptions = defaultChunkingOptions
): TextChunk[] {
  if (options.chunkSizeWords <= 0) {
    throw new Error("chunkSizeWords must be greater than zero");
  }

  if (options.overlapWords < 0 || options.overlapWords >= options.chunkSizeWords) {
    throw new Error("overlapWords must be lower than chunkSizeWords");
  }

  const words = text.split(/\s+/u).filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  const chunks: TextChunk[] = [];
  const step = options.chunkSizeWords - options.overlapWords;

  for (let start = 0; start < words.length; start += step) {
    const chunkWords = words.slice(start, start + options.chunkSizeWords);

    chunks.push({
      index: chunks.length,
      text: chunkWords.join(" "),
      wordCount: chunkWords.length
    });

    if (start + options.chunkSizeWords >= words.length) {
      break;
    }
  }

  return chunks;
}
