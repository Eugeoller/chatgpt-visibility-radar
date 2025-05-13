
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

async function processAllBatches(questionnaireId: string): Promise<void> {
  // Update questionnaire status
  await supabase
    .from('brand_questionnaires')
    .update({ 
      status: 'processing', 
      error_message: null 
    })
    .eq('id', questionnaireId);

  // Call the original report generation function without batch limitations
  const { error: functionError } = await supabase.functions.invoke('generar-reporte-chatgpt-v2', {
    body: { 
      questionnaireId, 
      processAllBatches: true 
    }
  });

  if (functionError) {
    throw new Error(`Error calling report generation function: ${functionError.message}`);
  }
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
    
    console.log(`Processing all batches for questionnaire: ${questionnaireId}`);
    
    // Process all batches in the background
    EdgeRuntime.waitUntil(processAllBatches(questionnaireId));
    
    // Return immediate response
    return new Response(
      JSON.stringify({ 
        message: 'Procesamiento automático de todos los lotes iniciado',
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing all batches:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
