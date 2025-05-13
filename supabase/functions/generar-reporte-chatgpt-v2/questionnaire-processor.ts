import { supabase } from './supabase-client.ts';
import { generateQuestions } from './questions-generation.ts';
import { generateFinalReport } from './report-generation.ts';
import { 
  prepareQuestionBatches, 
  processSpecificBatch, 
  processAllBatches,
  checkBatchesCompletion
} from './batch-manager.ts';
import {
  setQuestionnaireProcessing,
  setQuestionnairePending,
  setQuestionnaireComplete,
  setQuestionnaireError
} from './questionnaire-status.ts';

// Process questionnaire - Modified for manual batch processing
export async function processQuestionnaire(
  questionnaireId: string, 
  options: { 
    batchId?: string; 
    processSingleBatch?: boolean;
    processAllBatches?: boolean;
    generateFinalReport?: boolean;
  } = {}
): Promise<void> {
  console.log(`[V2] Processing questionnaire: ${questionnaireId} with options:`, options);
  
  // If we're only generating the final report, do that and return
  if (options.generateFinalReport) {
    await generateFinalReport(questionnaireId);
    return;
  }
  
  // Update questionnaire status to processing and initialize progress if not already set
  if (!options.processSingleBatch) {
    await setQuestionnaireProcessing(questionnaireId);
  }
  
  try {
    // Fetch questionnaire data
    const { data: questionnaire, error: questionnaireError } = await supabase
      .from('brand_questionnaires')
      .select('*')
      .eq('id', questionnaireId)
      .single();
      
    if (questionnaireError || !questionnaire) {
      throw new Error(`Failed to fetch questionnaire: ${questionnaireError?.message || 'No data returned'}`);
    }
    
    const { brand_name, aliases, competitors, user_id } = questionnaire;
    
    // Check if we already have batches for this questionnaire
    const { data: existingBatches, error: batchesError } = await supabase
      .from('prompt_batches')
      .select('batch_number, status, questions, id')
      .eq('questionnaire_id', questionnaireId)
      .order('batch_number', { ascending: true });
      
    // Generate questions or use existing ones
    let questions: string[] = [];
    
    // If we have existing batches with questions, use them
    if (!batchesError && existingBatches && existingBatches.some(batch => batch.questions)) {
      // Reconstruct questions from existing batches
      questions = existingBatches
        .filter(batch => batch.questions)
        .map(batch => JSON.parse(batch.questions))
        .flat();
        
      console.log(`Reconstructed ${questions.length} questions from existing batches`);
    } else {
      // Generate new questions
      questions = await generateQuestions(brand_name, competitors);
      console.log(`Generated ${questions.length} questions`);
    }
    
    // Create or retrieve batches
    const batches = await prepareQuestionBatches(questionnaireId, questions);
    
    // Determine which processing path to take based on options
    if (options.processSingleBatch || options.batchId) {
      console.log(`Processing single batch`);
      
      let batchToProcess;
      
      if (options.batchId) {
        // If a specific batch ID is provided, use that
        console.log(`Processing specific batch ID: ${options.batchId}`);
        
        const matchingBatch = batches.find(b => b.id === options.batchId);
        if (!matchingBatch) {
          throw new Error(`Batch ID ${options.batchId} not found`);
        }
        
        batchToProcess = matchingBatch;
      } else {
        // Otherwise find the next pending/error batch
        console.log(`Finding next pending/error batch`);
        
        const incompleteIndex = existingBatches
          .findIndex(b => b.status !== 'complete');
          
        if (incompleteIndex === -1) {
          throw new Error(`All batches are already complete`);
        }
        
        const nextBatch = existingBatches[incompleteIndex];
        batchToProcess = batches.find(b => b.batchNumber === nextBatch.batch_number);
        
        if (!batchToProcess) {
          throw new Error(`Batch ${nextBatch.batch_number} not found in reconstructed batches`);
        }
      }
      
      // Process the specific batch
      await processSpecificBatch(
        questionnaireId,
        batches,
        existingBatches,
        batchToProcess,
        brand_name,
        aliases,
        competitors,
        questions.length
      );
      
      // Check if all batches are complete
      const allComplete = await checkBatchesCompletion(questionnaireId);
      
      // If all batches are complete, generate final report
      if (allComplete) {
        console.log(`All batches are complete, generating final report`);
        await generateFinalReport(questionnaireId);
      } else {
        // Update questionnaire status to pending if there are more batches to process
        await setQuestionnairePending(questionnaireId);
        console.log(`Batch processed, waiting for next batch to be requested`);
      }
      
      return;
    }
    
    // Process all batches if requested
    if (options.processAllBatches) {
      console.log(`Processing all batches sequentially`);
      
      await processAllBatches(
        questionnaireId,
        batches,
        existingBatches,
        brand_name,
        aliases,
        competitors,
        questions.length
      );
      
      // Generate final report
      console.log(`All batches processed, generating final report`);
      await generateFinalReport(questionnaireId);
      
      return;
    }
    
    // Default processing (process everything at once)
    console.log(`Default processing mode: processing batches sequentially`);
    
    await processAllBatches(
      questionnaireId,
      batches,
      existingBatches,
      brand_name,
      aliases,
      competitors,
      questions.length
    );
    
    // Generate final report
    console.log(`All batches processed, generating final report`);
    await generateFinalReport(questionnaireId);
    
  } catch (error) {
    console.error(`Error in processQuestionnaire:`, error);
    
    // Update questionnaire status to error if not in single batch mode
    if (!options.processSingleBatch) {
      await setQuestionnaireError(questionnaireId, error.message);
    }
    
    throw error;
  }
}
