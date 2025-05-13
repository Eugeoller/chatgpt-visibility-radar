
// Environment variables and configuration
export const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
export const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';
export const BATCH_SIZE = Number(Deno.env.get('BATCH_SIZE') || '20');
export const MAX_RETRIES = Number(Deno.env.get('MAX_RETRIES') || '3');
export const TEMPERATURE = Number(Deno.env.get('TEMPERATURE') || '0.3');
export const COST_LIMIT_EUR = Number(Deno.env.get('COST_LIMIT_EUR') || '20');
export const MIN_QUESTIONS = 20;
export const REQUIRED_QUESTIONS = 30;

// Rate for cost calculation (adjust based on model)
export const COST_PER_1K_TOKENS = 0.01; // gpt-4o-mini rate

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
