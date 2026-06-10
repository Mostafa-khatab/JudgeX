import Problem from '../models/problem.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Init client safely
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Invalid or missing GEMINI_API_KEY');
  }
  return new GoogleGenerativeAI(apiKey);
};

export const sendMessage = async (req, res) => {
  console.log('[ChatBot] Diagnostic request received');
  try {
    const { message, code, language, problemId } = req.body;

    if (!message) return res.status(400).json({ msg: 'Message is required' });

    // Fetch Problem Context if problemId is provided
    let problemContext = "General Context: No specific problem selected.";
    if (problemId) {
      try {
        // Try searching by custom string 'id' field first, then fallback to _id
        let problem = await Problem.findOne({ id: problemId });
        
        // If not found by string id, try by _id if it's a valid ObjectId
        if (!problem && problemId.match(/^[0-9a-fA-F]{24}$/)) {
          problem = await Problem.findById(problemId);
        }

        if (problem) {
          problemContext = `
Problem_Context:
- Title: ${problem.name}
- Description: ${problem.task}
- Time Limit: ${problem.timeLimit}s
- Memory Limit: ${problem.memoryLimit}MB
- Difficulty: ${problem.difficulty}
- Tags: ${problem.tags?.join(', ')}
`;
        }
      } catch (e) {
        console.warn('[ChatBot] Failed to fetch problem details:', e.message);
      }
    }

    const systemPrompt = `
System Prompt: The Neural Assistant (JudgeX Engine)
Role:
You are the Neural Assistant, a high-performance AI engine integrated into the JudgeX competitive programming platform. Your core mission is to act as an elite technical mentor, helping developers solve algorithmic challenges by analyzing their code and the problem's constraints.

Operational Protocol:
- Context Awareness: You will receive three inputs: Problem_Context, User_Code, and User_Query.
- Analysis Framework:
    1. Constraint Check: Compare time limits with code complexity.
    2. Logic Verification: Match algorithm with problem requirements.
    3. Edge Case Identification: Look for overflows, division by zero, etc.

Response Guidelines:
- Clarity First: Be concise. Focus on logic.
- Guiding vs. Giving: Offer hints first. Provide full solutions only if explicitly asked or code is nearly complete.
- Formatting: Use Markdown for code and LaTeX for math/complexity.

Tone & Personality:
- Technical, professional, and slightly witty.
- Peer-level mentor. Support dark-mode aesthetics (clean, modern logic).

Strict Constraints:
- Never hallucinate constraints.
- If User_Code is empty, explain the optimal strategy.
- Prioritize C++17/20 standards unless specified otherwise.
`;

    // 2. Build final prompt
    let prompt = `
${systemPrompt}

--- INPUTS ---
${problemContext}
User_Code: (${language || 'Unknown'}):
${code || 'Empty'}

User_Query:
${message}
`;

    // --- AI Interaction using SDK ---
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('Invalid or missing GEMINI_API_KEY');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try models in order of preference (including newer Gemini 2.x models found in this key)
    const modelsToTry = [
      'gemini-2.5-flash', 
      'gemini-2.0-flash', 
      'gemini-1.5-flash', 
      'gemini-1.5-pro', 
      'gemini-pro'
    ];
    let aiText = '';
    let lastErrorMsg = '';
    let success = false;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[ChatBot] Attempting with ${modelName} via SDK...`);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        aiText = response.text();

        if (aiText) {
          success = true;
          console.log(`[ChatBot] SUCCESS with ${modelName}`);
          break;
        }
      } catch (e) {
        lastErrorMsg = e.message;
        console.warn(`[ChatBot] ${modelName} failed:`, e.message);
        
        // If the error is about model not found, continue to next model
        if (e.message.includes('not found') || e.message.includes('404')) {
          continue;
        }
        // If it's a critical error (like invalid API key), we might want to stop, 
        // but for now, we'll try all models.
      }
    }

    if (!success) {
      throw new Error(`Gemini API failed on all models. Last error: ${lastErrorMsg}`);
    }

    return res.status(200).json({ success: true, data: { message: aiText } });

  } catch (error) {
    console.error('[ChatBot] Error:', error.message);
    return res.status(500).json({
      success: false,
      msg: `Neural Link Error: ${error.message}`,
      hint: 'Your API key may have been leaked and revoked. Please generate a new one at https://aistudio.google.com/'
    });
  }
};
