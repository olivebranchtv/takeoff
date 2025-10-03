export type ProjectAnalysis = {
  summary: string;
  suggestions: string[];
  detectedItems: Array<{
    type: string;
    count: number;
    location: string;
  }>;
};

let openAIApiKey: string | null = null;

export function getOpenAIApiKey(): string | null {
  return openAIApiKey;
}

export function setOpenAIApiKey(key: string): void {
  openAIApiKey = key;
}

export async function analyzeDrawingsWithImages(
  images: string[],
  apiKey: string
): Promise<ProjectAnalysis> {
  return {
    summary: 'AI analysis not yet implemented',
    suggestions: [],
    detectedItems: [],
  };
}
