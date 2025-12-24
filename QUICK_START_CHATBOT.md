# 🚀 Quick Start - ChatBot Feature

## ✅ Setup Complete!

تم إضافة نظام حل المشاكل البرمجية مع ChatBot بنجاح! 

---

## 📋 What Was Added?

### ✨ New Page: Problem Solve Interface
- **URL**: `/problem/:id/solve`
- **Features**: 
  - Split screen (Problem + Code Editor)
  - Monaco Editor with syntax highlighting
  - Multi-language support
  - AI ChatBot assistant

### 🤖 ChatBot Component
- Floating chat button
- Context-aware responses
- Helpful coding assistance

### 🔌 Backend API
- Endpoint: `POST /chatbot/message`
- Authentication required
- Ready for AI integration

---

## 🎯 How to Use

### Step 1: Start the Application

#### Terminal 1 - Start Server
```bash
cd server
npm run dev
```
Server will run on: `http://localhost:8080`

#### Terminal 2 - Start Client
```bash
cd client
npm run dev
```
Client will run on: `http://localhost:5173`

### Step 2: Test the Feature

1. **Open Browser**: Navigate to `http://localhost:5173`
2. **Login**: Use your account credentials
3. **Go to Problems**: Click on "Problems" in navigation
4. **Select a Problem**: Click on any problem
5. **Click "Solve"**: You'll see the new interface!
6. **Try ChatBot**: Click the chat button (bottom-right)

---

## 🎨 Interface Overview

```
┌─────────────────────────────────────────────────────────┐
│  Header: Problem Name | Submissions | Fullscreen        │
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│  Problem Description │  Code Editor                     │
│                      │                                  │
│  - Description Tab   │  - Language Selector             │
│  - Details Tab       │  - Monaco Editor                 │
│                      │  - Run & Submit Buttons          │
│                      │                                  │
└──────────────────────┴──────────────────────────────────┘
                                            [💬 ChatBot]
```

---

## 💬 ChatBot Examples

Try asking these questions:

### Getting Hints
```
"Can you give me a hint?"
"What approach should I use?"
"Help me understand this problem"
```

### Debugging
```
"Help me debug this code"
"Why is my solution wrong?"
"What's the error in my code?"
```

### Learning
```
"Explain the algorithm"
"What's the time complexity?"
"Walk me through an example"
```

---

## 🔧 Configuration

### Current Setup (No AI Key Required)
The chatbot currently uses **rule-based responses** - it works without any API keys!

### Optional: Add Real AI (Future)

#### Option 1: OpenAI
1. Get API key from: https://platform.openai.com/
2. Add to `server/.env`:
   ```env
   OPENAI_API_KEY=sk-...
   ```
3. Update `server/src/controllers/chatbotController.js`

#### Option 2: Anthropic Claude
1. Get API key from: https://console.anthropic.com/
2. Add to `server/.env`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Update `server/src/controllers/chatbotController.js`

---

## 📁 Project Structure

```
JudgeX/
├── client/
│   └── src/
│       ├── components/ChatBot/      ← ChatBot component
│       ├── pages/ProblemSolve/      ← Main solve page
│       └── services/chatbot.js      ← API service
│
├── server/
│   └── src/
│       ├── controllers/chatbotController.js  ← Logic
│       └── routes/chatbotRoutes.js           ← API routes
│
└── docs/
    ├── CHATBOT_FEATURE.md           ← Full documentation (EN)
    ├── CHATBOT_FEATURE_AR.md        ← Full documentation (AR)
    └── CHANGELOG_CHATBOT.md         ← Detailed changelog
```

---

## 🎓 Features Breakdown

### 1. Problem Description Panel (Left)
- **Description Tab**: Full problem statement with examples
- **Details Tab**: 
  - Problem ID, Points, Difficulty
  - Time & Memory limits
  - Statistics (AC count, AC rate)

### 2. Code Editor Panel (Right)
- **Language Support**: C, C++11/14/17/20, Python 2/3
- **Editor Features**:
  - Syntax highlighting
  - Auto-completion
  - Line numbers
  - Dark/Light theme
- **Actions**:
  - Run (coming soon)
  - Submit (working)

### 3. ChatBot Assistant
- **Always Available**: Floating button
- **Smart Context**: Knows your problem and code
- **Helpful Responses**:
  - Hints without spoilers
  - Debugging assistance
  - Algorithm explanations
  - Complexity analysis

---

## 🐛 Troubleshooting

### Issue: Server won't start
```bash
# Check if port 8080 is in use
netstat -ano | findstr :8080

# Kill the process
taskkill /PID <PID> /F

# Restart server
cd server && npm run dev
```

### Issue: MongoDB not running
```bash
# Start MongoDB service
net start MongoDB
```

### Issue: Client won't start
```bash
# Clear cache and reinstall
cd client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue: ChatBot not responding
- Check browser console for errors
- Verify you're logged in
- Check server logs
- Ensure `/chatbot/message` endpoint is accessible

---

## ✅ Testing Checklist

Before using, verify:

- [ ] Server running on port 8080
- [ ] Client running on port 5173
- [ ] MongoDB service started
- [ ] Can login successfully
- [ ] Can navigate to a problem
- [ ] "Solve" button appears (when logged in)
- [ ] Solve page loads correctly
- [ ] Code editor works
- [ ] ChatBot button appears
- [ ] Can send messages to ChatBot
- [ ] Can submit code

---

## 📚 Learn More

### Documentation
- **English**: `docs/CHATBOT_FEATURE.md`
- **Arabic**: `docs/CHATBOT_FEATURE_AR.md`
- **Changelog**: `CHANGELOG_CHATBOT.md`

### Key Technologies
- **Frontend**: React, Monaco Editor, Radix UI
- **Backend**: Node.js, Express, MongoDB
- **Editor**: Monaco (VS Code's editor)
- **UI**: Tailwind CSS, shadcn/ui

---

## 🎉 You're Ready!

Everything is set up and ready to use. Just:

1. ✅ Start server: `cd server && npm run dev`
2. ✅ Start client: `cd client && npm run dev`
3. ✅ Login and click "Solve" on any problem
4. ✅ Start coding with AI assistance!

---

## 💡 Tips

### For Best Experience
- Use **dark mode** for comfortable coding
- Try **fullscreen mode** for focus
- Ask ChatBot **specific questions**
- Use **keyboard shortcuts** in editor

### Keyboard Shortcuts (Monaco Editor)
- `Ctrl + S`: Save (triggers auto-format)
- `Ctrl + /`: Toggle comment
- `Ctrl + D`: Select next occurrence
- `Alt + Up/Down`: Move line up/down
- `Ctrl + Shift + K`: Delete line

---

## 🤝 Need Help?

If you encounter any issues:
1. Check the documentation files
2. Review the changelog
3. Check server/client logs
4. Verify all services are running

---

**Happy Coding! 🚀**

Made with ❤️ for JudgeX
