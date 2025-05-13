
import { MIN_QUESTIONS, REQUIRED_QUESTIONS } from './config.ts';
import { withRetry } from './helpers.ts';
import { callOpenAI } from './openai-service.ts';

// Generate questions based on brand and competitors
export async function generateQuestions(brand: string, competitors: string[]): Promise<string[]> {
  const competitorsStr = competitors.join(', ');
  const prompt = `Crea preguntas que un usuario real podría hacer en ChatGPT donde, de forma natural, aparezca la marca ${brand} o alguno de sus competidores (${competitorsStr}). Genera al menos ${MIN_QUESTIONS} preguntas, idealmente ${REQUIRED_QUESTIONS} preguntas.`;
  const systemPrompt = "Eres experto en branding e IA. Devuelve un JSON array con las preguntas.";
  
  const { text, tokens } = await withRetry(() => callOpenAI(prompt, systemPrompt));
  
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
    
    // Complete the questions array to exactly REQUIRED_QUESTIONS if needed
    if (questions.length < REQUIRED_QUESTIONS) {
      console.log(`Adding ${REQUIRED_QUESTIONS - questions.length} additional generic questions to reach ${REQUIRED_QUESTIONS}`);
      const additionalQuestions = generateAdditionalQuestions(brand, competitors, REQUIRED_QUESTIONS - questions.length);
      return [...questions, ...additionalQuestions];
    }
    
    // If we have more than REQUIRED_QUESTIONS questions, just take the first REQUIRED_QUESTIONS
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
export function generateAdditionalQuestions(brand: string, competitors: string[], count: number): string[] {
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
    `¿Cuáles son las críticas más comunes sobre ${brand}?`,
    `¿Tiene ${brand} programas de responsabilidad social?`,
    `¿Cuál es la presencia internacional de ${brand}?`,
    `¿Cómo es la experiencia de usuario con ${brand}?`,
    `¿Qué tecnologías utiliza ${brand} en sus productos?`,
    `¿Quiénes son los principales directivos de ${brand}?`,
    `¿Cuál es la estrategia de marketing de ${brand}?`,
    `¿Cómo maneja ${brand} las quejas de los clientes?`,
    `¿Cuáles son las promociones actuales de ${brand}?`,
    `¿Qué innovaciones ha presentado ${brand} recientemente?`,
  ];
  
  // Generate as many questions as needed
  for (let i = 0; i < count; i++) {
    const templateIndex = i % templates.length;
    additionalQuestions.push(templates[templateIndex]);
  }
  
  return additionalQuestions;
}
