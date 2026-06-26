import { getNvidiaClient, PARSE_MODEL } from './nvidia-client';

export interface ParsedIntent {
  role: string;
  location: string;
  fields: string[];
  targetCount: number;
  filters: Record<string, unknown>;
  scrapeQueries: string[];
  extractionPrompt: string;
  zodSchema: Record<string, { type: string; description: string; optional?: boolean }>;
}

export function extractJson(content: string): string {
  const block = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (block) return block[1].trim();
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start !== -1 && end !== -1) return content.slice(start, end + 1);
  return content;
}

const SYSTEM = `You are a data extraction intent parser. Given a user command, return ONLY valid JSON with this exact structure:
{
  "role": "what to find",
  "location": "where (empty string if not specified)",
  "fields": ["field1", "field2"],
  "targetCount": 500,
  "filters": {},
  "scrapeQueries": ["5-8 targeted Google search queries"],
  "extractionPrompt": "one sentence: extract X from this page including fields Y, Z",
  "zodSchema": {
    "fieldName": { "type": "string", "description": "what this field is", "optional": false }
  }
}`;

export async function parseIntent(command: string): Promise<ParsedIntent> {
  const client = getNvidiaClient();
  const res = await client.chat.completions.create({
    model: PARSE_MODEL,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: command },
    ],
    temperature: 0.1,
  });
  const content = res.choices[0]?.message?.content ?? '';
  return JSON.parse(extractJson(content)) as ParsedIntent;
}
