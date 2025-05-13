
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';
import { processQuestionnaire } from './questionnaire-processor.ts';

// Main edge function handler
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const body = await req.json();
    const { questionnaireId, batchId, processSingleBatch, processAllBatches, generateFinalReport } = body;
    
    // Validate required parameter
    if (!questionnaireId) {
      throw new Error('Missing required parameter: questionnaireId');
    }
    
    // Process the request in the background to avoid timeout
    EdgeRuntime.waitUntil(
      processQuestionnaire(questionnaireId, { 
        batchId, 
        processSingleBatch, 
        processAllBatches, 
        generateFinalReport 
      })
    );
    
    // Return immediate response
    return new Response(
      JSON.stringify({ 
        message: 'Processing started', 
        questionnaireId, 
        processSingleBatch: !!processSingleBatch,
        processAllBatches: !!processAllBatches,
        generateFinalReport: !!generateFinalReport
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
