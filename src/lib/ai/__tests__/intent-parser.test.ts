import { extractJson } from '@/lib/ai/intent-parser';

describe('extractJson', () => {
  it('extracts from markdown code block', () => {
    const raw = '```json\n{"key": "value"}\n```';
    expect(JSON.parse(extractJson(raw))).toEqual({ key: 'value' });
  });

  it('extracts bare JSON', () => {
    const raw = 'Here is the result: {"key": "value"} done';
    expect(JSON.parse(extractJson(raw))).toEqual({ key: 'value' });
  });
});
