
import { supabase } from './supabase-client.ts';

// Update questionnaire status to processing
export async function setQuestionnaireProcessing(questionnaireId: string): Promise<void> {
  await supabase
    .from('brand_questionnaires')
    .update({ status: 'processing', progress_percent: 0 })
    .eq('id', questionnaireId);
}

// Update questionnaire status to pending (waiting for next batch)
export async function setQuestionnairePending(questionnaireId: string): Promise<void> {
  await supabase
    .from('brand_questionnaires')
    .update({ 
      status: 'pending',
      progress_percent: 0  // Reset progress for next batch
    })
    .eq('id', questionnaireId);
}

// Update questionnaire status to complete
export async function setQuestionnaireComplete(questionnaireId: string): Promise<void> {
  await supabase
    .from('brand_questionnaires')
    .update({ status: 'complete', progress_percent: 100 })
    .eq('id', questionnaireId);
}

// Update questionnaire status to error
export async function setQuestionnaireError(questionnaireId: string, errorMessage: string): Promise<void> {
  await supabase
    .from('brand_questionnaires')
    .update({ 
      status: 'error', 
      error_message: `Error: ${errorMessage || 'Error desconocido'}` 
    })
    .eq('id', questionnaireId);
}
