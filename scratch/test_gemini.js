import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const apiKey = process.env.GEMINI_API_KEY;

async function testGemini() {
  console.log('Testing Gemini API with key:', apiKey.substring(0, 5) + '...');
  
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
  const versions = ['v1', 'v1beta'];

  for (const version of versions) {
    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
      try {
        console.log(`Trying ${model} on ${version}...`);
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hello, respond with "OK" if you receive this.' }] }]
          })
        });
        const data = await response.json();
        if (response.ok) {
          console.log(`✅ Success with ${model} on ${version}:`, data.candidates?.[0]?.content?.parts?.[0]?.text);
          return;
        } else {
          console.log(`❌ Failed with ${model} on ${version}:`, data.error?.message || response.statusText);
        }
      } catch (e) {
        console.log(`❌ Error with ${model} on ${version}:`, e.message);
      }
    }
  }
}

testGemini();
