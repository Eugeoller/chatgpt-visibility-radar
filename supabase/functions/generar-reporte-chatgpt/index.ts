
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import { createClient as createStorageClient } from 'https://esm.sh/@supabase/storage-js@2.5.5';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Environment variables
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';
const BATCH_SIZE = Number(Deno.env.get('BATCH_SIZE') || '20');
const MAX_RETRIES = Number(Deno.env.get('MAX_RETRIES') || '3');
const TEMPERATURE = Number(Deno.env.get('TEMPERATURE') || '0.3');
const COST_LIMIT_EUR = Number(Deno.env.get('COST_LIMIT_EUR') || '20');
const MIN_QUESTIONS = Number(Deno.env.get('MIN_QUESTIONS') || '90');
const REQUIRED_QUESTIONS = 100;

// Rate for cost calculation (adjust based on model)
const COST_PER_1K_TOKENS = 0.01; // gpt-4o-mini rate

// Supabase client setup
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper for exponential backoff retry
async function withRetry<T>(fn: () => Promise<T>, maxRetries: number): Promise<T> {
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

// Call OpenAI API
async function callOpenAI(prompt: string, systemPrompt: string): Promise<{ text: string; tokens: number }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: TEMPERATURE,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content;
  const tokens = data.usage.total_tokens;
  
  return { text, tokens };
}

// Generate questions based on brand and competitors
async function generateQuestions(brand: string, competitors: string[]): Promise<string[]> {
  const competitorsStr = competitors.join(', ');
  const prompt = `Crea EXACTAMENTE 100 preguntas que un usuario real podría hacer en ChatGPT donde, de forma natural, aparezca la marca ${brand} o alguno de sus competidores (${competitorsStr}).`;
  const systemPrompt = "Eres experto en branding e IA. Devuelve un JSON array con las 100 preguntas.";
  
  const { text, tokens } = await withRetry(() => callOpenAI(prompt, systemPrompt), MAX_RETRIES);
  
  try {
    // Extract JSON array from response (handle potential text before/after JSON)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No valid JSON array found in response");
    
    const questions = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(questions)) {
      throw new Error(`Expected an array of questions, got ${typeof questions}`);
    }
    
    console.log(`Received ${questions.length} questions from OpenAI`);
    
    // Check if we received enough questions (minimum threshold)
    if (questions.length < MIN_QUESTIONS) {
      throw new Error(`Expected at least ${MIN_QUESTIONS} questions, got ${questions.length}`);
    }
    
    // Complete the questions array to exactly 100 if needed
    if (questions.length < REQUIRED_QUESTIONS) {
      console.log(`Adding ${REQUIRED_QUESTIONS - questions.length} additional generic questions to reach 100`);
      const additionalQuestions = generateAdditionalQuestions(brand, competitors, REQUIRED_QUESTIONS - questions.length);
      return [...questions, ...additionalQuestions];
    }
    
    // If we have more than 100 questions, just take the first 100
    if (questions.length > REQUIRED_QUESTIONS) {
      console.log(`Limiting to ${REQUIRED_QUESTIONS} questions (received ${questions.length})`);
      return questions.slice(0, REQUIRED_QUESTIONS);
    }
    
    return questions;
  } catch (e) {
    console.error("Failed to parse questions:", e);
    throw new Error(`Failed to parse questions: ${e.message}`);
  }
}

// Generate additional questions if we don't have enough
function generateAdditionalQuestions(brand: string, competitors: string[], count: number): string[] {
  const additionalQuestions = [];
  const templates = [
    `¿Cuáles son las ventajas de ${brand} frente a la competencia?`,
    `¿Qué opina la gente sobre ${brand} en las redes sociales?`,
    `¿Cómo se compara ${brand} con ${competitors[0] || 'otros competidores'}?`,
    `¿Cuál es la historia detrás de ${brand}?`,
    `¿Cuáles son los productos o servicios más populares de ${brand}?`,
    `¿Qué hace único a ${brand} en su sector?`,
    `¿Hay alguna controversia relacionada con ${brand}?`,
    `¿Cuál es la reputación de ${brand} en términos de servicio al cliente?`,
    `¿Cómo ha evolucionado ${brand} a lo largo del tiempo?`,
    `¿Qué valores representa la marca ${brand}?`,
  ];
  
  // Generate as many questions as needed
  for (let i = 0; i < count; i++) {
    const templateIndex = i % templates.length;
    additionalQuestions.push(templates[templateIndex]);
  }
  
  return additionalQuestions;
}

// Process a single question
async function processQuestion(
  question: string, 
  brandInfo: { brand: string; aliases: string[] },
  competitors: string[],
  batchId: string
): Promise<void> {
  const prompt = question;
  const systemPrompt = "Actúa como ChatGPT. Un usuario pregunta. Responde de forma natural, objetiva y completa.";
  
  const { text: answer, tokens } = await withRetry(() => callOpenAI(prompt, systemPrompt), MAX_RETRIES);
  
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

// Process a batch of questions
async function processBatch(
  batchNumber: number,
  questions: string[],
  questionnaireId: string,
  brandInfo: { brand: string; aliases: string[] },
  competitors: string[]
): Promise<void> {
  // Create batch record
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
  
  const batchId = batchData.id;
  
  try {
    // Process questions in sequence (to avoid rate limits)
    for (const question of questions) {
      await processQuestion(question, brandInfo, competitors, batchId);
    }
    
    // Generate batch summary
    await generateBatchSummary(batchId, brandInfo.brand, competitors);
    
    // Mark batch as complete
    await supabase
      .from('prompt_batches')
      .update({ status: 'complete' })
      .eq('id', batchId);
      
  } catch (error) {
    console.error(`Error processing batch ${batchNumber}:`, error);
    
    // Mark batch as error
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
async function generateBatchSummary(batchId: string, brand: string, competitors: string[]): Promise<void> {
  // Get all responses for this batch
  const { data: responses, error: responsesError } = await supabase
    .from('prompt_responses')
    .select('question_text, answer_text, brand_match, competitor_matches')
    .eq('batch_id', batchId);
    
  if (responsesError || !responses) {
    throw new Error(`Failed to fetch responses: ${responsesError?.message || 'No data returned'}`);
  }
  
  const prompt = `Resume las siguientes respuestas destacando (a) menciones de ${brand}, (b) menciones de competidores (${competitors.join(', ')}), (c) tono general y sentimiento.\n\nRespuestas:\n${JSON.stringify(responses, null, 2)}`;
  const systemPrompt = "Eres un analista de branding. Devuélve tu análisis en formato JSON.";
  
  const { text: summary, tokens } = await withRetry(() => callOpenAI(prompt, systemPrompt), MAX_RETRIES);
  
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
    
  } catch (e) {
    console.error("Failed to parse batch summary:", e);
    throw new Error(`Failed to parse batch summary: ${e.message}`);
  }
}

// Generate final meta-summary from all batch summaries
async function generateMetaSummary(questionnaireId: string, brand: string): Promise<object> {
  // Get all batch summaries for this questionnaire
  const { data: batches, error: batchesError } = await supabase
    .from('prompt_batches')
    .select('id')
    .eq('questionnaire_id', questionnaireId)
    .eq('status', 'complete');
    
  if (batchesError || !batches) {
    throw new Error(`Failed to fetch batches: ${batchesError?.message || 'No data returned'}`);
  }
  
  const batchIds = batches.map(b => b.id);
  
  const { data: summaries, error: summariesError } = await supabase
    .from('batch_summaries')
    .select('summary_json')
    .in('batch_id', batchIds);
    
  if (summariesError || !summaries) {
    throw new Error(`Failed to fetch summaries: ${summariesError?.message || 'No data returned'}`);
  }
  
  const prompt = `Fusiona estos resúmenes y genera:
  1. % de presencia de ${brand} sobre 100 preguntas
  2. Top 3 competidores y cómo aparecen
  3. 3-5 tácticas concretas para mejorar visibilidad
  4. Conclusión ejecutiva en ≤150 palabras
  
  Resúmenes:
  ${JSON.stringify(summaries.map(s => s.summary_json), null, 2)}`;
  
  const systemPrompt = "Eres un consultor experto en branding y visibilidad en IA. Devuelve tu análisis en formato JSON.";
  
  const { text: metaSummary, tokens } = await withRetry(() => callOpenAI(prompt, systemPrompt), MAX_RETRIES);
  
  try {
    // Extract JSON object from response
    const jsonMatch = metaSummary.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No valid JSON object found in response");
    
    return JSON.parse(jsonMatch[0]);
    
  } catch (e) {
    console.error("Failed to parse meta summary:", e);
    throw new Error(`Failed to parse meta summary: ${e.message}`);
  }
}

// Generate PDF report
async function generatePDFReport(
  questionnaireId: string,
  userId: string,
  brand: string,
  summary: object
): Promise<string> {
  // For now, we'll just generate a simple HTML report and convert it to a "PDF" (actually HTML)
  // In a production system, you would use a proper PDF generation library
  
  const { data: responses, error: responsesError } = await supabase
    .from('prompt_responses')
    .select(`
      question_text,
      answer_text,
      brand_match,
      competitor_matches,
      prompt_batches!inner(questionnaire_id)
    `)
    .eq('prompt_batches.questionnaire_id', questionnaireId)
    .order('created_at', { ascending: true });
    
  if (responsesError || !responses) {
    throw new Error(`Failed to fetch responses: ${responsesError?.message || 'No data returned'}`);
  }
  
  // Generate HTML report
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Reporte de Visibilidad en ChatGPT - ${brand}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333; }
      .header { background: #1a365d; color: white; padding: 2rem; text-align: center; }
      .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
      .summary { background: #f8f8f8; padding: 2rem; border-radius: 5px; margin-bottom: 2rem; }
      .metrics { display: flex; flex-wrap: wrap; gap: 1rem; margin: 2rem 0; }
      .metric { background: white; padding: 1.5rem; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1; }
      .metric h3 { margin-top: 0; color: #1a365d; }
      .tactics { background: white; padding: 1.5rem; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 2rem 0; }
      .responses { margin-top: 3rem; }
      .response { background: white; padding: 1.5rem; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 1rem; }
      .question { font-weight: bold; margin-bottom: 1rem; }
      .answer { margin-bottom: 1rem; }
      .match { color: #38a169; }
      .no-match { color: #e53e3e; }
      .footer { text-align: center; padding: 2rem; color: #666; font-size: 0.8rem; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Reporte de Visibilidad en ChatGPT</h1>
      <h2>${brand}</h2>
      <p>Fecha: ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="container">
      <div class="summary">
        <h2>Resumen Ejecutivo</h2>
        <p>${JSON.stringify(summary)}</p>
      </div>
      
      <h2>Análisis Detallado</h2>
      
      <div class="responses">
        <h2>Respuestas de ChatGPT Analizadas</h2>
        ${responses.map(r => `
          <div class="response ${r.brand_match ? 'with-match' : ''}">
            <div class="question">${r.question_text}</div>
            <div class="answer">${r.answer_text}</div>
            <div class="${r.brand_match ? 'match' : 'no-match'}">
              ${r.brand_match 
                ? `✅ Marca mencionada` 
                : `❌ Marca no mencionada`}
            </div>
            ${r.competitor_matches.length > 0 
              ? `<div>🔄 Competidores mencionados: ${r.competitor_matches.join(', ')}</div>` 
              : ''}
          </div>
        `).join('')}
      </div>
      
      <div class="footer">
        <p>Este reporte fue generado automáticamente por SEOChatGPT.</p>
        <p>© ${new Date().getFullYear()} SEOChatGPT - Todos los derechos reservados.</p>
      </div>
    </div>
  </body>
  </html>
  `;
  
  // Save the HTML as a "PDF" file in storage
  const fileName = `${userId}/${questionnaireId}/report-${Date.now()}.html`;
  
  // Upload to storage
  const { error: uploadError } = await supabase
    .storage
    .from('reports')
    .upload(fileName, html, {
      contentType: 'text/html',
      cacheControl: '3600'
    });
    
  if (uploadError) {
    throw new Error(`Failed to upload report: ${uploadError.message}`);
  }
  
  // Get public URL
  const { data: urlData } = await supabase
    .storage
    .from('reports')
    .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days expiry
    
  if (!urlData) {
    throw new Error('Failed to create signed URL');
  }
  
  return urlData.signedUrl;
}

// Calculate total cost and tokens
async function calculateMetrics(questionnaireId: string): Promise<{ totalTokens: number; costEur: number }> {
  const { data, error } = await supabase
    .from('prompt_responses')
    .select(`
      tokens_used,
      prompt_batches!inner(questionnaire_id)
    `)
    .eq('prompt_batches.questionnaire_id', questionnaireId);
    
  if (error || !data) {
    throw new Error(`Failed to fetch token usage: ${error?.message || 'No data returned'}`);
  }
  
  const totalTokens = data.reduce((sum, item) => sum + (item.tokens_used || 0), 0);
  const costEur = (totalTokens / 1000) * COST_PER_1K_TOKENS;
  
  return { totalTokens, costEur };
}

// Process questionnaire
async function processQuestionnaire(questionnaireId: string): Promise<void> {
  console.log(`Processing questionnaire: ${questionnaireId}`);
  
  // Update questionnaire status to processing
  await supabase
    .from('brand_questionnaires')
    .update({ status: 'processing' })
    .eq('id', questionnaireId);
  
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
    
    // Generate 100 questions
    console.log(`Generating questions for brand: ${brand_name}`);
    const questions = await generateQuestions(brand_name, competitors);
    
    // Process questions in batches
    const batches = [];
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batchQuestions = questions.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      batches.push({ batchNumber, questions: batchQuestions });
    }
    
    // Process each batch
    for (const batch of batches) {
      console.log(`Processing batch ${batch.batchNumber} with ${batch.questions.length} questions`);
      await processBatch(
        batch.batchNumber,
        batch.questions,
        questionnaireId,
        { brand: brand_name, aliases: aliases || [] },
        competitors
      );
    }
    
    // Generate meta-summary
    console.log(`Generating meta-summary`);
    const metaSummary = await generateMetaSummary(questionnaireId, brand_name);
    
    // Calculate metrics
    const { totalTokens, costEur } = await calculateMetrics(questionnaireId);
    
    // Check if cost exceeds limit
    const costAlert = costEur > COST_LIMIT_EUR;
    if (costAlert) {
      console.warn(`Cost alert: €${costEur.toFixed(2)} exceeds limit of €${COST_LIMIT_EUR}`);
      // In a real system, send an alert to Slack or other monitoring system
    }
    
    // Generate PDF report
    console.log(`Generating PDF report`);
    const pdfUrl = await generatePDFReport(questionnaireId, user_id, brand_name, metaSummary);
    
    // Update final report
    await supabase.from('final_reports').upsert({
      questionnaire_id: questionnaireId,
      pdf_url: pdfUrl,
      summary_json: metaSummary,
      total_tokens: totalTokens,
      cost_eur: costEur,
      status: 'ready',
      cost_alert: costAlert
    });
    
    // Update questionnaire status
    await supabase
      .from('brand_questionnaires')
      .update({ status: 'complete' })
      .eq('id', questionnaireId);
      
    console.log(`Questionnaire ${questionnaireId} completed successfully`);
    
  } catch (error) {
    console.error(`Error processing questionnaire: ${error}`);
    
    // Update questionnaire status to error
    await supabase
      .from('brand_questionnaires')
      .update({ 
        status: 'error', 
        error_message: error.message || 'Unknown error'
      })
      .eq('id', questionnaireId);
      
    throw error;
  }
}

// Main edge function handler
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
    
    // Start processing in the background
    EdgeRuntime.waitUntil(processQuestionnaire(questionnaireId));
    
    // Return immediate response
    return new Response(
      JSON.stringify({ message: 'Processing started', questionnaireId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
