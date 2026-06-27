import { getNvidiaClient, VALIDATE_MODEL } from './nvidia-client';
import { extractJson } from './intent-parser';

export interface ValidationResult {
  valid: boolean;
  missingFields: string[];
  cleanedRecord: Record<string, unknown>;
}

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1500;

export function parseValidationResponse(content: string, expectedCount: number): ValidationResult[] {
  try {
    const raw = JSON.parse(extractJson(content));
    let arr: ValidationResult[];

    if (Array.isArray(raw)) {
      arr = raw;
    } else if (raw.results) {
      arr = raw.results;
    } else if (raw.records) {
      arr = raw.records;
    } else if (raw.items) {
      arr = raw.items;
    } else if (typeof raw.valid === 'boolean' && Array.isArray(raw.missingFields)) {
      // Single object that looks like a ValidationResult (extracted from array by extractJson)
      arr = [raw];
    } else {
      arr = [];
    }

    if (arr.length === expectedCount) return arr;
  } catch { /* fall through */ }
  return Array.from({ length: expectedCount }, () => ({
    valid: false,
    missingFields: ['validation_failed'],
    cleanedRecord: {},
  }));
}

export async function validateBatch(
  records: Record<string, unknown>[],
  requiredFields: string[]
): Promise<ValidationResult[]> {
  const client = getNvidiaClient();
  const prompt = `Validate these ${records.length} records. Required fields: ${requiredFields.join(', ')}.
For each record check all required fields are present with plausible non-empty values.
Return a JSON array of exactly ${records.length} objects: [{"valid":bool,"missingFields":["field"],"cleanedRecord":{}}]
Records: ${JSON.stringify(records)}`;

  const res = await client.chat.completions.create({
    model: VALIDATE_MODEL,
    messages: [
      { role: 'system', content: 'You are a data validation assistant. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0,
  });
  return parseValidationResponse(res.choices[0]?.message?.content ?? '', records.length);
}

export async function* validateInBatches(
  records: Record<string, unknown>[],
  requiredFields: string[]
): AsyncGenerator<{ index: number; result: ValidationResult }> {
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const results = await validateBatch(batch, requiredFields);
    for (let j = 0; j < results.length; j++) {
      yield { index: i + j, result: results[j] };
    }
    if (i + BATCH_SIZE < records.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }
}
