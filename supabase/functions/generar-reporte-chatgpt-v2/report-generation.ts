
import { COST_LIMIT_EUR, COST_PER_1K_TOKENS } from './config.ts';
import { supabase } from './supabase-client.ts';
import { withRetry } from './helpers.ts';
import { callOpenAI } from './openai-service.ts';

// Generate final meta-summary from all batch summaries
export async function generateMetaSummary(questionnaireId: string, brand: string): Promise<object> {
  // Get all batch summaries for this questionnaire
  const { data: batches, error: batchesError } = await supabase
    .from('prompt_batches')
    .select('id')
    .eq('questionnaire_id', questionnaireId)
    .eq('status', 'complete');
    
  if (batchesError || !batches || batches.length === 0) {
    throw new Error(`Failed to fetch completed batches: ${batchesError?.message || 'No completed batches found'}`);
  }
  
  const batchIds = batches.map(b => b.id);
  
  const { data: summaries, error: summariesError } = await supabase
    .from('batch_summaries')
    .select('summary_json')
    .in('batch_id', batchIds);
    
  if (summariesError || !summaries || summaries.length === 0) {
    throw new Error(`Failed to fetch summaries: ${summariesError?.message || 'No summaries found'}`);
  }
  
  const prompt = `Fusiona estos resúmenes y genera:
  1. % de presencia de ${brand} sobre 100 preguntas
  2. Top 3 competidores y cómo aparecen
  3. 3-5 tácticas concretas para mejorar visibilidad
  4. Conclusión ejecutiva en ≤150 palabras
  
  Resúmenes:
  ${JSON.stringify(summaries.map(s => s.summary_json), null, 2)}`;
  
  const systemPrompt = "Eres un consultor experto en branding y visibilidad en IA. Devuelve tu análisis en formato JSON.";
  
  const { text: metaSummary, tokens } = await withRetry(() => callOpenAI(prompt, systemPrompt));
  
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
export async function generatePDFReport(
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
  
  // Make sure the reports bucket exists
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const reportsBucketExists = buckets?.some(bucket => bucket.name === 'reports');
    
    if (!reportsBucketExists) {
      // Create bucket if it doesn't exist
      const { error } = await supabase.storage.createBucket('reports', {
        public: true,  // Make bucket public
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (error) {
        console.error("Error creating bucket:", error);
      } else {
        console.log("Created reports bucket");
      }
    } else {
      // Update bucket to make it public if it exists
      const { error } = await supabase.storage.updateBucket('reports', {
        public: true
      });
      
      if (error) {
        console.error("Error updating bucket:", error);
      } else {
        console.log("Updated reports bucket to be public");
      }
    }
  } catch (error) {
    console.error("Error checking/creating storage bucket:", error);
  }
  
  // Save the HTML as a "PDF" file in storage
  const fileName = `${userId}/${questionnaireId}/report-${Date.now()}.html`;
  
  // Upload to storage
  const { error: uploadError } = await supabase
    .storage
    .from('reports')
    .upload(fileName, html, {
      contentType: 'text/html',
      cacheControl: '31536000' // 1 year cache
    });
    
  if (uploadError) {
    throw new Error(`Failed to upload report: ${uploadError.message}`);
  }
  
  // Get public URL instead of signed URL
  const { data: publicUrlData } = await supabase
    .storage
    .from('reports')
    .getPublicUrl(fileName);
    
  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error('Failed to create public URL');
  }
  
  return publicUrlData.publicUrl;
}

// Calculate total cost and tokens
export async function calculateMetrics(questionnaireId: string): Promise<{ totalTokens: number; costEur: number }> {
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

// Generate final report after all batches are complete
export async function generateFinalReport(questionnaireId: string): Promise<void> {
  console.log(`[V2] Generating final report for questionnaire: ${questionnaireId}`);
  
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
    
    const { brand_name, competitors, user_id } = questionnaire;
    
    // Generate meta-summary
    console.log(`Generating meta-summary`);
    const metaSummary = await generateMetaSummary(questionnaireId, brand_name);
    
    // Calculate metrics
    const { totalTokens, costEur } = await calculateMetrics(questionnaireId);
    
    // Check if cost exceeds limit
    const costAlert = costEur > COST_LIMIT_EUR;
    if (costAlert) {
      console.warn(`Cost alert: €${costEur.toFixed(2)} exceeds limit of €${COST_LIMIT_EUR}`);
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
    
    // Update questionnaire status and set progress to 100%
    await supabase
      .from('brand_questionnaires')
      .update({ status: 'complete', progress_percent: 100 })
      .eq('id', questionnaireId);
      
    console.log(`Questionnaire ${questionnaireId} completed successfully`);
  } catch (error) {
    console.error(`Error generating final report:`, error);
    
    // Update questionnaire status to error
    await supabase
      .from('brand_questionnaires')
      .update({ 
        status: 'error', 
        error_message: `Error en el procesamiento final: ${error.message || 'Error desconocido'}`
      })
      .eq('id', questionnaireId);
      
    throw error;
  }
}
