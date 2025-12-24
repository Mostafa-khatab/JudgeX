# ChatBot Feature - LeetCode Style Interface

## Overview
This feature adds a LeetCode-style problem-solving interface with an integrated AI chatbot assistant.

## Features

### 1. Split-Screen Interface
- **Left Panel**: Problem description with tabs for:
  - Description: Full problem statement with examples
  - Details: Problem metadata (ID, points, constraints, statistics)
  
- **Right Panel**: Code editor with:
  - Multi-language support (C, C++, Python)
  - Monaco Editor integration
  - Syntax highlighting
  - Run and Submit buttons

### 2. AI Chatbot Assistant
- **Floating Chat Button**: Always accessible in the bottom-right corner
- **Context-Aware**: Knows about the current problem and your code
- **Helpful Responses**: Can provide:
  - Hints and guidance
  - Debugging assistance
  - Algorithm suggestions
  - Complexity analysis
  - Example walkthroughs

### 3. User Experience
- **Fullscreen Mode**: Toggle to focus only on the code editor
- **Dark Mode Support**: Seamless theme integration
- **Responsive Design**: Works on all screen sizes
- **Real-time Updates**: Instant feedback and responses

## Usage

### Accessing the Solve Page
1. Navigate to any problem page
2. Click the "Solve" button (requires authentication)
3. You'll be redirected to `/problem/:id/solve`

### Using the Chatbot
1. Click the floating chat button in the bottom-right
2. Type your question in the input field
3. Press Enter or click Send
4. The bot will respond with helpful guidance

### Example Questions
- "Can you give me a hint?"
- "What's the time complexity of my approach?"
- "Help me debug this code"
- "Explain the algorithm"
- "Walk me through an example"

## Technical Implementation

### Frontend Components
- **ProblemSolve.jsx**: Main page component with split layout
- **ChatBot.jsx**: Floating chatbot interface
- **Services**: API integration for chat messages

### Backend API
- **Endpoint**: `POST /chatbot/message`
- **Authentication**: Required (uses authMiddleware)
- **Request Body**:
  ```json
  {
    "message": "User's question",
    "problemId": "problem-id",
    "code": "user's code",
    "language": "c++17",
    "history": []
  }
  ```

### Routes
- **Config**: `routesConfig.problemSolve = '/problem/:id/solve'`
- **Type**: Protected route (requires authentication)
- **Layout**: Full-screen (no default layout)

## Future Enhancements

### AI Integration
Currently, the chatbot uses rule-based responses. To integrate with real AI:

1. **OpenAI Integration**:
   ```javascript
   import OpenAI from 'openai';
   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
   
   const completion = await openai.chat.completions.create({
     model: "gpt-4",
     messages: [
       { role: "system", content: "You are a helpful coding assistant..." },
       { role: "user", content: message }
     ]
   });
   ```

2. **Anthropic Claude**:
   ```javascript
   import Anthropic from '@anthropic-ai/sdk';
   const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
   
   const message = await anthropic.messages.create({
     model: "claude-3-sonnet-20240229",
     messages: [{ role: "user", content: message }]
   });
   ```

### Additional Features
- [ ] Code execution and testing
- [ ] Solution templates
- [ ] Video explanations
- [ ] Community solutions
- [ ] Progress tracking
- [ ] Personalized hints based on user level

## Configuration

### Environment Variables (Optional for AI)
```env
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### Dependencies
All required dependencies are already included in package.json:
- `@monaco-editor/react`: Code editor
- `lucide-react`: Icons
- `react-markdown`: Problem description rendering

## Testing

### Manual Testing Steps
1. Start the server: `cd server && npm run dev`
2. Start the client: `cd client && npm run dev`
3. Login to your account
4. Navigate to any problem
5. Click "Solve" button
6. Test the code editor
7. Test the chatbot by asking questions

### Known Issues
- Chatbot responses are currently rule-based (not AI-powered)
- Run button is not yet implemented (only Submit works)

## Support
For issues or questions, please refer to the main project documentation or create an issue in the repository.
