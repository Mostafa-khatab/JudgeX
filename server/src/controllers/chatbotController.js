// server/controllers/chatController.js
import Problem from '../models/problem.js';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

// Init client
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY not set in .env');
}
const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });



export const sendMessage = async (req, res) => {
  try {
    const { message, problemId, code, language, history, allowFullSolution = false } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ msg: 'Message is required' });
    }

    let problem = null;
    if (problemId) {
      try {
        problem = await Problem.findOne({ id: problemId });
      } catch (e) {
        console.error('Problem lookup failed:', e);
      }
    }

    // Build prompt
    let prompt = 'You are an expert programming tutor helping students solve coding problems. Be helpful and concise.\n\n';

    if (problem) {
      const task = (problem.task || '').replace(/<[^>]*>/g, '').substring(0, 2000);
      prompt += `Problem: ${problem.name}\nDifficulty: ${problem.difficulty}\nTime Limit: ${problem.timeLimit}ms\nMemory Limit: ${problem.memoryLimit}MB\nDescription: ${task}\n\n`;

      if (problem.examples && problem.examples[0]) {
        prompt += `Example:\nInput: ${problem.examples[0].input}\nOutput: ${problem.examples[0].output}\n\n`;
      }
    }

    if (code && code.trim()) {
      prompt += `Student's code (${language}):\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    }

    if (history && history.length) {
      prompt += 'Previous conversation:\n';
      history.slice(-3).forEach(m => {
        prompt += `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}\n`;
      });
      prompt += '\n';
    }

    prompt += `Question: ${message}\n\n`;
    prompt += allowFullSolution
      ? 'Provide full step-by-step solution and code.\n'
      : 'Provide only hints or guidance. Do not give full code.\n';
    prompt += 'Respond with markdown and code blocks when needed.';

    // Call Gemini
    const modelName = 'gemini-2.5-flash'; // أو gemini-2.5-pro
    const response = await aiClient.models.generateContent({
      model: modelName,
      contents: [{ text: prompt }],
    });

    console.log('Gemini raw response:', JSON.stringify(response, null, 2));

    // Extract AI text safely
    let aiText = '';
if (response?.candidates?.length > 0) {
  for (const candidate of response.candidates) {
    const parts = candidate?.content?.parts;
    if (parts?.length > 0) {
      aiText = parts.map(p => p.text || '').join('\n').trim();
      if (aiText) break;
    }
  }
}


    // Fallback if empty
    if (!aiText) {
      console.warn('Empty response from Gemini, returning fallback message.');
      aiText = 'Sorry, I could not generate a response. Please try again.';
    }

    return res.status(200).json({ success: true, message: aiText });

  } catch (error) {
    console.error('Chatbot error:', error);
    return res.status(500).json({
      success: false,
      msg: 'Failed to process message',
      error: error.message,
    });
  }
};
