
import { supabase } from './supabase-client.ts';
import { withRetry } from './helpers.ts';
import { callOpenAI } from './openai-service.ts';
import { updateProgress } from './helpers.ts';

// Process a single question
export async function processQuestion(
  question: string, 
  brandInfo: { brand: string; aliases: string[] },
  competitors: string[],
  batchId: string
): Promise<void> {
  const prompt = question;
  const systemPrompt = "Actúa como ChatGPT. Un usuario pregunta. Responde de forma natural, objetiva y completa.";
  
  const { text: answer, tokens } = await withRetry(() => callOpenAI(prompt, systemPrompt));
  
  // Check for brand mentions
  const allBrandTerms = [brandInfo.brand, ...brandInfo.aliases].filter(Boolean);
  const brandRegex = new RegExp(allBrandTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
  const brandMatch = allBrandTerms.length > 0 && brandRegex.test(answer);
  
  // Check for competitor mentions
  const competitorMatches = competitors.filter(competitor => 
    new RegExp(competitor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(answer)
  );
  
  // Store response in the database
  await supabase.from('prompt_responses').insert({
    batch_id: batchId,
    question_text: question,
    answer_text: answer,
    tokens_used: tokens,
    brand_match: brandMatch,
    competitor_matches: competitorMatches.length > 0 ? competitorMatches : []
  });
}

// Process a batch of questions with improved resilience and resume capability
export async function processBatch(
  batchNumber: number,
  questions: string[],
  questionnaireId: string,
  brandInfo: { brand: string; aliases: string[] },
  competitors: string[],
  totalQuestions: number,
  previouslyProcessed: number,
  specificBatchId?: string // Optional parameter for processing a specific batch
): Promise<number> {
  // Check if batch already exists or use the specific batch ID
  let batchId: string;
  
  if (specificBatchId) {
    // Use the provided specific batch ID
    const { data: existingBatch, error: batchCheckError } = await supabase
      .from('prompt_batches')
      .select('id, status')
      .eq('id', specificBatchId)
      .single();
      
    if (batchCheckError || !existingBatch) {
      throw new Error(`Failed to find specified batch: ${batchCheckError?.message || 'No data returned'}`);
    }
    
    batchId = specificBatchId;
    console.log(`Using specified batch with ID: ${batchId}`);
    
    // If batch is already complete, skip processing
    if (existingBatch.status === 'complete') {
      console.log(`Batch ${batchNumber} is already complete. Skipping.`);
      // Return the number of questions in this batch as already processed
      return previouslyProcessed + questions.length;
    }
    
    // Update to processing
    await supabase
      .from('prompt_batches')
      .update({ status: 'processing', error_message: null })
      .eq('id', batchId);
      
    console.log(`Processing batch with ID: ${batchId}`);
  } else {
    // Check if batch already exists based on questionnaire_id and batch_number
    const { data: existingBatch, error: batchCheckError } = await supabase
      .from('prompt_batches')
      .select('id, status')
      .eq('questionnaire_id', questionnaireId)
      .eq('batch_number', batchNumber)
      .single();
      
    if (batchCheckError || !existingBatch) {
      // Create new batch record if it doesn't exist
      const { data: batchData, error: batchError } = await supabase
        .from('prompt_batches')
        .insert({
          questionnaire_id: questionnaireId,
          batch_number: batchNumber,
          questions: JSON.stringify(questions),
          status: 'processing'
        })
        .select('id')
        .single();
        
      if (batchError || !batchData) {
        throw new Error(`Failed to create batch: ${batchError?.message || 'No data returned'}`);
      }
      
      batchId = batchData.id;
      console.log(`Created new batch with ID: ${batchId}`);
    } else {
      // Use existing batch
      batchId = existingBatch.id;
      
      // If batch is already complete, skip processing
      if (existingBatch.status === 'complete') {
        console.log(`Batch ${batchNumber} is already complete. Skipping.`);
        // Return the number of questions in this batch as already processed
        return previouslyProcessed + questions.length;
      }
      
      // If batch had an error, update to processing
      if (existingBatch.status === 'error') {
        await supabase
          .from('prompt_batches')
          .update({ status: 'processing', error_message: null })
          .eq('id', batchId);
        
        console.log(`Resuming batch ${batchNumber} with ID: ${batchId} after previous error`);
      } else {
        console.log(`Resuming batch ${batchNumber} with ID: ${batchId}`);
      }
    }
  }
  
  try {
    // Get already processed questions to resume work
    const { data: processed, error: processedError } = await supabase
      .from('prompt_responses')
      .select('question_text')
      .eq('batch_id', batchId);
      
    if (processedError) {
      console.error(`Error fetching processed questions: ${processedError.message}`);
    }
    
    // Create set of already processed questions
    const alreadyProcessed = new Set(processed?.map(p => p.question_text) || []);
    console.log(`Found ${alreadyProcessed.size} already processed questions out of ${questions.length}`);
    
    // Get pending questions (those that haven't been processed yet)
    const pendingQuestions = questions.filter(q => !alreadyProcessed.has(q));
    console.log(`Processing ${pendingQuestions.length} remaining questions`);
    
    // Process questions individually with try/catch to avoid losing progress
    let completedCount = alreadyProcessed.size;
    let failedCount = 0;
    
    for (const question of pendingQuestions) {
      try {
        await processQuestion(question, brandInfo, competitors, batchId);
        completedCount++;
        
        // Update progress after each question
        const currentProcessed = previouslyProcessed + completedCount;
        await updateProgress(questionnaireId, totalQuestions, currentProcessed, supabase);
        
        // Log progress
        if (completedCount % 5 === 0 || completedCount === questions.length) {
          console.log(`Batch ${batchNumber} progress: ${completedCount}/${questions.length} (${Math.round((completedCount/questions.length)*100)}%)`);
          
          // Update batch status with progress information
          await supabase
            .from('prompt_batches')
            .update({ status: 'processing' })
            .eq('id', batchId);
        }
      } catch (error) {
        failedCount++;
        console.error(`Error processing question "${question}":`, error);
        // Continue with the next question despite this error
      }
    }
    
    // Generate batch summary only if we processed at least some questions
    if (completedCount > 0) {
      try {
        await generateBatchSummary(batchId, brandInfo.brand, competitors);
      } catch (error) {
        console.error(`Error generating summary for batch ${batchId}:`, error);
        // Don't fail the entire batch because of summary generation error
      }
    }
    
    // Check if all questions have been processed
    if (completedCount === questions.length) {
      // Mark batch as complete
      await supabase
        .from('prompt_batches')
        .update({ status: 'complete' })
        .eq('id', batchId);
        
      console.log(`Successfully completed batch ${batchNumber}`);
    } else {
      // If we still have some pending questions after all retries, mark as error
      await supabase
        .from('prompt_batches')
        .update({ 
          status: 'error', 
          error_message: `Processed ${completedCount}/${questions.length} questions. Failed to process ${failedCount} questions.` 
        })
        .eq('id', batchId);
        
      console.log(`Batch ${batchNumber} ended with ${questions.length - completedCount} unprocessed questions`);
    }
    
    // Return the total number of processed questions including this batch
    return previouslyProcessed + completedCount;
      
  } catch (error) {
    console.error(`Error in batch ${batchNumber} processing:`, error);
    
    // Mark batch as error but preserve any progress made
    await supabase
      .from('prompt_batches')
      .update({ 
        status: 'error', 
        error_message: error.message || 'Unknown error' 
      })
      .eq('id', batchId);
      
    throw error;
  }
}

// Generate summary for a batch of responses
export async function generateBatchSummary(batchId: string, brand: string, competitors: string[]): Promise<void> {
  // Check if summary already exists
  const { data: existingSummary } = await supabase
    .from('batch_summaries')
    .select('id')
    .eq('batch_id', batchId)
    .maybeSingle();
    
  if (existingSummary) {
    console.log(`Summary for batch ${batchId} already exists, skipping summary generation`);
    return;
  }
  
  // Get all responses for this batch
  const { data: responses, error: responsesError } = await supabase
    .from('prompt_responses')
    .select('question_text, answer_text, brand_match, competitor_matches')
    .eq('batch_id', batchId);
    
  if (responsesError || !responses || responses.length === 0) {
    throw new Error(`Failed to fetch responses for summary: ${responsesError?.message || 'No data returned'}`);
  }
  
  const prompt = `Resume las siguientes respuestas destacando (a) menciones de ${brand}, (b) menciones de competidores (${competitors.join(', ')}), (c) tono general y sentimiento.\n\nRespuestas:\n${JSON.stringify(responses, null, 2)}`;
  const systemPrompt = "Eres un analista de branding. Devuélve tu análisis en formato JSON.";
  
  const { text: summary, tokens } = await withRetry(() => callOpenAI(prompt, systemPrompt));
  
  try {
    // Extract JSON object from response
    const jsonMatch = summary.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No valid JSON object found in response");
    
    const summaryJson = JSON.parse(jsonMatch[0]);
    
    // Store batch summary
    await supabase.from('batch_summaries').insert({
      batch_id: batchId,
      summary_json: summaryJson
    });
    
    console.log(`Generated and stored summary for batch ${batchId}`);
    
  } catch (e) {
    console.error("Failed to parse batch summary:", e);
    throw new Error(`Failed to parse batch summary: ${e.message}`);
  }
}
