# PowerShell script to run all JudgeX services in separate windows

echo "🚀 Starting JudgeX Services..."

# Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev" -Title "JudgeX Server"

# Judger
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd judger; npm run dev" -Title "JudgeX Judger"

# Client
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev" -Title "JudgeX Client"

# Admin
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd admin; npm run dev" -Title "JudgeX Admin"

# AI Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ai-service; python main.py" -Title "JudgeX AI Service"

echo "✅ All services are starting in separate windows."
