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
    let prompt = `You are an expert programming tutor helping students solve coding problems on the JudgeX platform. 
Your goal is to be a supportive mentor. Provide hints, conceptual explanations, and guidance rather than direct solutions.
Respond using Markdown with clear headings and code blocks where appropriate.

USER PERFORMANCE CONTEXT:
`;

    // Add Skill Gap Context
    try {
      const { calculateUserSkillGap } = await import('../services/skillGapService.js');
      const skillGap = await calculateUserSkillGap(req.user.name);
      
      if (skillGap.summary.totalSubmissions > 0) {
        prompt += `- Strong Topics: ${skillGap.summary.strongTopics.join(', ') || 'N/A'}\n`;
        prompt += `- Weak Topics: ${skillGap.summary.weakTopics.join(', ') || 'N/A'}\n`;
        prompt += `- Top Mastery: ${skillGap.summary.topTopic}\n`;
        prompt += 'Use this info to tailor your advice. If they are weak in a topic related to the current problem, be more patient. If they are strong, challenge them more.\n\n';
      } else {
        prompt += '- User is new/has no submissions yet.\n\n';
      }
    } catch (err) {
      console.warn('Could not fetch skill gap for chatbot context:', err.message);
    }

    // Add Course Context if present
    if (req.body.courseId) {
      try {
        const Course = (await import('../models/course.js')).default;
        const targetCourse = await Course.findById(req.body.courseId);
        if (targetCourse) {
          prompt += `COURSE CONTEXT:
- Title: ${targetCourse.title}
- Instructor: ${targetCourse.instructor}
- Description: ${targetCourse.description}
- Modules/Videos: ${targetCourse.videos?.map(v => v.title).join(', ')}
You are actings as a tutor for THIS SPECIFIC COURSE. Use the module list to explain where the student is in their learning journey if they ask.\n\n`;
        }
      } catch (err) {
        console.warn('Could not fetch course context for chatbot:', err.message);
      }
    }

    if (problem) {
      const task = (problem.task || '').replace(/<[^>]*>/g, '').substring(0, 2000);
      prompt += `CURRENT PROBLEM:
- Name: ${problem.name}
- Difficulty: ${problem.difficulty}
- Tags: ${problem.tags?.join(', ')}
- Task: ${task}\n\n`;

      if (problem.examples && problem.examples[0]) {
        prompt += `Example:\nInput: ${problem.examples[0].input}\nOutput: ${problem.examples[0].output}\n\n`;
      }
    }

    if (code && code.trim()) {
      prompt += `STUDENT'S CURRENT CODE (${language}):
\`\`\`${language}
${code}
\`\`\`\n\n`;
    }

    if (history && history.length) {
      prompt += 'CONVERSATION HISTORY:\n';
      history.slice(-3).forEach(m => {
        prompt += `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}\n`;
      });
      prompt += '\n';
    }

    prompt += `STUDENT'S QUESTION: ${message}\n\n`;
    
    if (allowFullSolution) {
      prompt += 'Provide a full step-by-step solution and completed code.\n';
    } else {
      prompt += 'Provide only strategic hints or conceptual guidance. DO NOT give the full completed code unless explicitly unlocked by allowFullSolution.\n';
    }

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
