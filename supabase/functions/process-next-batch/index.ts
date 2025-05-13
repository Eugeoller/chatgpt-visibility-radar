
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

// Environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to process a specific batch
async function processBatch(questionnaireId: string, batchId: string): Promise<void> {
  // Get the batch details first
  const { data: batch, error: batchError } = await supabase
    .from('prompt_batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (batchError || !batch) {
    console.error(`Error fetching batch ${batchId}:`, batchError);
    throw new Error(`Error fetching batch: ${batchError?.message || 'Batch not found'}`);
  }

  // Update batch status to processing
  await supabase
    .from('prompt_batches')
    .update({ status: 'processing', error_message: null })
    .eq('id', batchId);

  // Update questionnaire status
  await supabase
    .from('brand_questionnaires')
    .update({ status: 'processing' })
    .eq('id', questionnaireId);

  // Call the main report generation edge function with specific batch ID
  const { error: functionError } = await supabase.functions.invoke('generar-reporte-chatgpt-v2', {
    body: { 
      questionnaireId, 
      batchId,
      processSingleBatch: true 
    }
  });

  if (functionError) {
    throw new Error(`Error calling report generation function: ${functionError.message}`);
  }
}

// Helper function to find and process the next pending batch
async function processNextBatch(questionnaireId: string): Promise<{ batchId: string | null, message: string }> {
  console.log(`Finding next pending batch for questionnaire: ${questionnaireId}`);
  
  // Find the next pending batch (or error batch that needs retry)
  const { data: pendingBatches, error: batchesError } = await supabase
    .from('prompt_batches')
    .select('*')
    .eq('questionnaire_id', questionnaireId)
    .or('status.eq.pending,status.eq.error')
    .order('batch_number', { ascending: true })
    .limit(1);

  if (batchesError) {
    throw new Error(`Error fetching pending batches: ${batchesError.message}`);
  }

  // Get info about all batches to determine overall status
  const { data: allBatches, error: allBatchesError } = await supabase
    .from('prompt_batches')
    .select('id, status, batch_number')
    .eq('questionnaire_id', questionnaireId)
    .order('batch_number', { ascending: true });

  if (allBatchesError) {
    throw new Error(`Error fetching all batches: ${allBatchesError.message}`);
  }

  console.log(`Total batches: ${allBatches?.length}, Pending batches: ${pendingBatches?.length}`);

  // No more pending batches, check if we need to generate summary and PDF
  if (!pendingBatches || pendingBatches.length === 0) {
    const allComplete = allBatches?.every(b => b.status === 'complete') || false;
    
    // If all batches are complete, generate summary and PDF
    if (allComplete && allBatches && allBatches.length > 0) {
      console.log("All batches are complete, generating final report");
      
      // Call the final phase of report generation
      const { error: functionError } = await supabase.functions.invoke('generar-reporte-chatgpt-v2', {
        body: { 
          questionnaireId, 
          generateFinalReport: true 
        }
      });

      if (functionError) {
        throw new Error(`Error generating final report: ${functionError.message}`);
      }

      return { batchId: null, message: 'Todos los grupos de preguntas completados. Generando informe final.' };
    }

    // Set questionnaire status to pending if there are any incomplete batches
    if (allBatches && allBatches.some(b => b.status !== 'complete')) {
      await supabase
        .from('brand_questionnaires')
        .update({ 
          status: 'pending', 
          progress_percent: 0 
        })
        .eq('id', questionnaireId);
        
      console.log("Updated questionnaire to pending status as there are incomplete batches");
    }

    return { batchId: null, message: 'No hay grupos de preguntas pendientes disponibles.' };
  }

  // We have a pending batch to process
  const nextBatch = pendingBatches[0];
  console.log(`Processing batch ${nextBatch.batch_number} (${nextBatch.id})`);
  
  // Process this batch
  await processBatch(questionnaireId, nextBatch.id);
  
  return { 
    batchId: nextBatch.id, 
    message: `Procesando grupo ${nextBatch.batch_number}.` 
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { questionnaireId } = await req.json();
    
    if (!questionnaireId) {
      return new Response(
        JSON.stringify({ error: 'questionnaireId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing next batch for questionnaire: ${questionnaireId}`);
    
    // Process the next batch
    const result = await processNextBatch(questionnaireId);
    
    // Return response
    return new Response(
      JSON.stringify({ 
        message: result.message, 
        batchId: result.batchId,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing next batch:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
