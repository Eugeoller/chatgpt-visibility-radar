import { supabase } from './supabase-client.ts';
import { generateQuestions } from './questions-generation.ts';
import { processBatch } from './question-processing.ts';
import { generateFinalReport } from './report-generation.ts';

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
    await supabase
      .from('brand_questionnaires')
      .update({ status: 'processing', progress_percent: 0 })
      .eq('id', questionnaireId);
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
      
    let questions: string[] = [];
    let batches: { batchNumber: number; questions: string[]; id?: string }[] = [];
    
    // If we have existing batches, use them to resume
    if (!batchesError && existingBatches && existingBatches.length > 0) {
      console.log(`Found ${existingBatches.length} existing batches`);
      
      // Check if we need to generate questions or if we can use existing ones
      if (existingBatches.some(batch => batch.questions)) {
        // Reconstruct questions from existing batches
        const allQuestions = existingBatches
          .filter(batch => batch.questions)
          .map(batch => ({ 
            batchNumber: batch.batch_number, 
            questions: JSON.parse(batch.questions),
            id: batch.id
          }))
          .sort((a, b) => a.batchNumber - b.batchNumber);
          
        questions = allQuestions.flatMap(batch => batch.questions);
        batches = allQuestions;
        
        console.log(`Reconstructed ${questions.length} questions from ${batches.length} existing batches`);
      } else {
        console.log(`No questions found in existing batches, regenerating questions`);
        questions = await generateQuestions(brand_name, competitors);
        
        // Create batches from questions
        batches = [];
        for (let i = 0; i < Math.ceil(questions.length / 20); i++) {
          const batchQuestions = questions.slice(i * 20, (i + 1) * 20);
          batches.push({ 
            batchNumber: i + 1, 
            questions: batchQuestions,
            id: existingBatches.find(b => b.batch_number === i + 1)?.id
          });
        }
      }
    } else {
      console.log(`No existing batches found, generating questions and creating batches`);
      
      // Generate questions first
      questions = await generateQuestions(brand_name, competitors);
      console.log(`Generated ${questions.length} questions`);
      
      // Create batches from questions
      batches = [];
      for (let i = 0; i < Math.ceil(questions.length / 20); i++) {
        const batchQuestions = questions.slice(i * 20, (i + 1) * 20);
        batches.push({ batchNumber: i + 1, questions: batchQuestions });
      }
      
      console.log(`Created ${batches.length} batches`);
      
      // Store all batch information upfront
      for (const batch of batches) {
        await supabase.from('prompt_batches').insert({
          questionnaire_id: questionnaireId,
          batch_number: batch.batchNumber,
          questions: JSON.stringify(batch.questions),
          status: 'pending'
        });
      }
      
      console.log(`Saved batch information to database`);
    }
    
    // Determine which batch to process if we're processing a single batch
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
      
      // Calculate previously processed questions
      const completedBatches = existingBatches
        .filter(b => b.status === 'complete' && b.batch_number < batchToProcess.batchNumber)
        .length;
        
      const previouslyProcessed = completedBatches * 20;
      
      console.log(`Processing batch ${batchToProcess.batchNumber} (previously processed: ${previouslyProcessed} questions)`);
      
      // Process this batch
      await processBatch(
        batchToProcess.batchNumber,
        batchToProcess.questions,
        questionnaireId,
        { brand: brand_name, aliases: aliases || [] },
        competitors || [],
        questions.length,
        previouslyProcessed,
        batchToProcess.id
      );
      
      // Check if all batches are complete
      const { data: updatedBatches } = await supabase
        .from('prompt_batches')
        .select('status')
        .eq('questionnaire_id', questionnaireId);
        
      const allComplete = updatedBatches?.every(b => b.status === 'complete');
      
      // If all batches are complete, generate final report
      if (allComplete) {
        console.log(`All batches are complete, generating final report`);
        await generateFinalReport(questionnaireId);
      } else {
        // Update questionnaire status to reflect partial completion
        await supabase
          .from('brand_questionnaires')
          .update({ status: 'pending' })
          .eq('id', questionnaireId);
          
        console.log(`Batch processed, waiting for next batch to be requested`);
      }
      
      return;
    }
    
    // Process all batches if requested
    if (options.processAllBatches) {
      console.log(`Processing all batches sequentially`);
      
      let processedCount = 0;
      
      // Process batches one by one
      for (const batch of batches) {
        // Skip already completed batches
        const existingBatch = existingBatches?.find(b => b.batch_number === batch.batchNumber);
        if (existingBatch?.status === 'complete') {
          console.log(`Batch ${batch.batchNumber} already complete, skipping`);
          processedCount += batch.questions.length;
          continue;
        }
        
        console.log(`Processing batch ${batch.batchNumber} of ${batches.length}`);
        
        // Process this batch
        processedCount = await processBatch(
          batch.batchNumber,
          batch.questions,
          questionnaireId,
          { brand: brand_name, aliases: aliases || [] },
          competitors || [],
          questions.length,
          processedCount,
          existingBatch?.id
        );
      }
      
      // Generate final report
      console.log(`All batches processed, generating final report`);
      await generateFinalReport(questionnaireId);
      
      return;
    }
    
    // Default processing (process everything at once)
    console.log(`Default processing mode: processing batches sequentially`);
    
    let processedCount = 0;
    
    // Process batches one by one
    for (const batch of batches) {
      // Skip already completed batches
      const existingBatch = existingBatches?.find(b => b.batch_number === batch.batchNumber);
      if (existingBatch?.status === 'complete') {
        console.log(`Batch ${batch.batchNumber} already complete, skipping`);
        processedCount += batch.questions.length;
        continue;
      }
      
      console.log(`Processing batch ${batch.batchNumber} of ${batches.length}`);
      
      // Process this batch
      processedCount = await processBatch(
        batch.batchNumber,
        batch.questions,
        questionnaireId,
        { brand: brand_name, aliases: aliases || [] },
        competitors || [],
        questions.length,
        processedCount,
        existingBatch?.id
      );
    }
    
    // Generate final report
    console.log(`All batches processed, generating final report`);
    await generateFinalReport(questionnaireId);
    
  } catch (error) {
    console.error(`Error in processQuestionnaire:`, error);
    
    // Update questionnaire status to error if not in single batch mode
    if (!options.processSingleBatch) {
      await supabase
        .from('brand_questionnaires')
        .update({ 
          status: 'error', 
          error_message: `Error: ${error.message || 'Error desconocido'}` 
        })
        .eq('id', questionnaireId);
    }
    
    throw error;
  }
}
