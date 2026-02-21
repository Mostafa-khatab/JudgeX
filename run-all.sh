#!/bin/bash

# Shell script to run all JudgeX services using tmux (similar to setup.sh but updated)

echo "🚀 Starting JudgeX Services..."

if command -v tmux >/dev/null 2>&1; then
    tmux new-session -d -s judgex "cd server && npm run dev"
    tmux split-window -h "cd judger && npm run dev"
    tmux split-window -v "cd client && npm run dev"
    tmux select-pane -t 0
    tmux split-window -v "cd admin && npm run dev"
    tmux split-window -v "cd ai-service && python main.py"
    tmux select-layout tiled
    tmux -2 attach-session -d
else
    echo "⚠️ tmux not found. Running services using concurrently..."
    npm run dev
fi
