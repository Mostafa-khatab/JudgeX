import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Testing Gemini API with key:', apiKey?.substring(0, 10) + '...');
  
  if (!apiKey) {
    console.error('No API Key found');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];

  for (const modelName of models) {
    try {
      console.log(`Trying model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hello, say OK.');
      const response = await result.response;
      console.log(`✅ Success with ${modelName}:`, response.text());
      return;
    } catch (e) {
      console.log(`❌ Failed with ${modelName}:`, e.message);
    }
  }
}

testGemini().catch(console.error);
