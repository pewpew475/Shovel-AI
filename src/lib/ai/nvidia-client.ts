import OpenAI from 'openai';

export function getNvidiaClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY!,
    baseURL: process.env.NVIDIA_BASE_URL ?? 'https://integrate.api.nvidia.com/v1',
  });
}

export const PARSE_MODEL =
  process.env.NVIDIA_MODEL_PARSE ?? 'nvidia/llama-3.1-nemotron-ultra-253b-v1';
export const VALIDATE_MODEL =
  process.env.NVIDIA_MODEL_VALIDATE ?? 'meta/llama-3.3-70b-instruct';
