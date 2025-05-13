
import { MAX_RETRIES } from './config.ts';

// Helper for exponential backoff retry
export async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = MAX_RETRIES): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (retries >= maxRetries) {
        console.error(`Failed after ${maxRetries} retries:`, error);
        throw error;
      }
      retries++;
      const delay = Math.pow(2, retries) * 500; // Exponential backoff: 1s, 2s, 4s...
      console.log(`Retry ${retries}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Helper for updating progress
export async function updateProgress(
  questionnaireId: string,
  totalQuestions: number,
  processedQuestions: number,
  supabase: any
): Promise<void> {
  const progressPercent = Math.min(Math.round((processedQuestions / totalQuestions) * 100), 99);
  
  await supabase
    .from('brand_questionnaires')
    .update({ progress_percent: progressPercent })
    .eq('id', questionnaireId);
    
  console.log(`[V2] Updated progress for ${questionnaireId}: ${progressPercent}% (${processedQuestions}/${totalQuestions} questions)`);
}
