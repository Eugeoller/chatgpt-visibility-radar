
import { supabase } from './supabase-client.ts';
import { processBatch } from './question-processing.ts';

// Find or create batches for a questionnaire
export async function prepareQuestionBatches(
  questionnaireId: string,
  questions: string[]
): Promise<{ batchNumber: number; questions: string[]; id?: string }[]> {
  // Check if we already have batches for this questionnaire
  const { data: existingBatches, error: batchesError } = await supabase
    .from('prompt_batches')
    .select('batch_number, status, questions, id')
    .eq('questionnaire_id', questionnaireId)
    .order('batch_number', { ascending: true });
    
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
        
      batches = allQuestions;
      
      console.log(`Reconstructed ${questions.length} questions from ${batches.length} existing batches`);
    } else {
      console.log(`No questions found in existing batches, creating new batches`);
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
    console.log(`No existing batches found, creating new batches`);
    
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
  
  return batches;
}

// Process a specific batch
export async function processSpecificBatch(
  questionnaireId: string,
  batches: { batchNumber: number; questions: string[]; id?: string }[],
  existingBatches: any[],
  batchToProcess: { batchNumber: number; questions: string[]; id?: string },
  brandName: string,
  aliases: string[],
  competitors: string[],
  totalQuestionsCount: number
): Promise<void> {
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
    { brand: brandName, aliases: aliases || [] },
    competitors || [],
    totalQuestionsCount,
    previouslyProcessed,
    batchToProcess.id
  );
}

// Process all remaining batches
export async function processAllBatches(
  questionnaireId: string,
  batches: { batchNumber: number; questions: string[]; id?: string }[],
  existingBatches: any[],
  brandName: string,
  aliases: string[],
  competitors: string[],
  totalQuestionsCount: number
): Promise<void> {
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
      { brand: brandName, aliases: aliases || [] },
      competitors || [],
      totalQuestionsCount,
      processedCount,
      existingBatch?.id
    );
  }
}

// Check if all batches are complete and update status
export async function checkBatchesCompletion(questionnaireId: string): Promise<boolean> {
  const { data: updatedBatches } = await supabase
    .from('prompt_batches')
    .select('status')
    .eq('questionnaire_id', questionnaireId);
    
  return updatedBatches?.every(b => b.status === 'complete') || false;
}
