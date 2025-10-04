import type { ModelConfig } from '../src/types/config/models';

export const models: ModelConfig[] = [
  {
    provider: "openai",
    model: "gpt-3.5-turbo",
    apiKey: "import.meta.env.OPENAI_API_KEY"
  }
];

export default models;