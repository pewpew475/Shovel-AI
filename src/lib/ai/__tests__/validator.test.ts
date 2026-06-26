import { parseValidationResponse } from '@/lib/ai/validator';

describe('parseValidationResponse', () => {
  it('parses array response', () => {
    const input = '[{"valid":true,"missingFields":[],"cleanedRecord":{"name":"Alice"}}]';
    const results = parseValidationResponse(input, 1);
    expect(results[0].valid).toBe(true);
    expect(results[0].cleanedRecord).toEqual({ name: 'Alice' });
  });

  it('parses wrapped object response', () => {
    const input = '{"results":[{"valid":false,"missingFields":["email"],"cleanedRecord":{}}]}';
    const results = parseValidationResponse(input, 1);
    expect(results[0].valid).toBe(false);
    expect(results[0].missingFields).toEqual(['email']);
  });

  it('returns fallback on parse error', () => {
    const results = parseValidationResponse('bad json', 2);
    expect(results).toHaveLength(2);
    expect(results[0].valid).toBe(true);
  });
});
