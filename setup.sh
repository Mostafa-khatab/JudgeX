#!/bin/bash
set -e

echo "🔧 Updating packages..."
sudo apt-get update -y
sudo apt-get install -y time util-linux

echo "📦 Installing dependencies..."

# Server
cd server
npm install --legacy-peer-deps
cd ..

# Judger
cd judger
npm install
cd ..

# Client
cd client
npm install
cd ..

# Admin
cd admin
npm install
cd ..

echo "🚀 Starting services..."

# Run everything in parallel
tmux new-session -d -s floatpoint "cd server && npm start"
tmux split-window -h "cd judger && npm start"
tmux split-window -v "cd client && npm run dev -- --host 0.0.0.0"
tmux select-pane -t 0
tmux split-window -v "cd admin && npm run dev -- --host 0.0.0.0"
tmux -2 attach-session -d
