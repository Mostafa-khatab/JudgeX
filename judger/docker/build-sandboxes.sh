#!/bin/bash
# Build all sandbox Docker images for JudgeX

echo "🔨 Building JudgeX Sandbox Images..."

# Build C/C++ sandbox
echo "📦 Building C/C++ sandbox..."
docker build -t judgex-sandbox:c -t judgex-sandbox:cpp -f docker/Dockerfile.sandbox.cpp .

# Build Python sandbox
echo "📦 Building Python sandbox..."
docker build -t judgex-sandbox:python -f docker/Dockerfile.sandbox.python .

# Build Java sandbox
echo "📦 Building Java sandbox..."
docker build -t judgex-sandbox:java -f docker/Dockerfile.sandbox.java .

# Build Node.js sandbox
echo "📦 Building Node.js sandbox..."
docker build -t judgex-sandbox:node -f docker/Dockerfile.sandbox.node .

echo ""
echo "✅ All sandbox images built successfully!"
echo ""
echo "Available images:"
docker images | grep judgex-sandbox
