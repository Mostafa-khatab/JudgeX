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
        const problem = await Problem.findById(problemId);
        if (problem) {
          problemContext = `
Problem_Context:
- Title: ${problem.title}
- Description: ${problem.task}
- Time Limit: ${problem.timeLimit || '1s'}
- Memory Limit: ${problem.memoryLimit || '256MB'}
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('Invalid or missing GEMINI_API_KEY');
    }

    // 1. List available models for this key
    let availableModels = [];
    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
      const listRes = await fetch(listUrl);
      const listData = await listRes.json();
      availableModels = listData.models?.map(m => m.name.replace('models/', '')) || [];
      console.log('[ChatBot] Available Models:', availableModels.join(', '));
    } catch (e) {
      console.error('[ChatBot] ListModels failed:', e.message);
    }

    // 3. Try models
    const apiVersions = ['v1', 'v1beta'];
    const modelsToTry = [...new Set(['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', ...availableModels])];
    
    let success = false;
    let aiText = '';
    let lastErrorMsg = '';

    for (const version of apiVersions) {
      for (const modelName of modelsToTry) {
        try {
          console.log(`[ChatBot] Trying ${modelName} on ${version}...`);
          const url = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });

          const data = await response.json();
          if (response.ok) {
            aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (aiText) {
              success = true;
              console.log(`[ChatBot] SUCCESS with ${modelName} (${version})`);
              break;
            }
          } else {
            lastErrorMsg = data.error?.message || response.statusText;
          }
        } catch (e) {
          lastErrorMsg = e.message;
        }
      }
      if (success) break;
    }

    if (!success) {
      throw new Error(`Gemini API failed on all versions/models. Last error: ${lastErrorMsg}`);
    }

    return res.status(200).json({ success: true, message: aiText });

  } catch (error) {
    console.error('[ChatBot] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: `Neural Link Error: ${error.message}`,
      hint: 'Check your GEMINI_API_KEY in server/.env'
    });
  }
};
