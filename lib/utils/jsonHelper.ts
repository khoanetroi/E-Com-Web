export function safeJsonParse<T>(value: string): T | null {
    try {
        return JSON.parse(value) as T;
    } catch {
        return null;
    }
}

export function extractJsonBlock(rawText: string) {
    const fenced = rawText.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) return fenced[1];

    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
        return rawText.slice(firstBrace, lastBrace + 1);
    }

    return rawText;
}