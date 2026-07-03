#!/bin/bash

echo "=============================================="
echo "🚀 NEXUSCODE STUDIO - STARTING SERVER"
echo "=============================================="

# Check if Node.js is available
if command -v node &> /dev/null; then
    echo "✅ Node.js found: $(node --version)"
    
    # Check if server.js exists
    if [ -f "server.js" ]; then
        echo "📂 Starting Node.js backend server..."
        echo ""
        node server.js
    else
        echo "❌ server.js not found!"
        echo "Run: bash build-final.sh first"
        exit 1
    fi
else
    echo "⚠️ Node.js not found, falling back to Python server..."
    echo ""
    
    # Fallback to Python
    if [ -d "dist/NexusCode_IDE" ]; then
        cd dist/NexusCode_IDE
        echo "📂 Serving from: $(pwd)"
        echo "🌐 http://localhost:8080/home.html"
        echo ""
        python3 -m http.server 8080
    elif [ -d "terminal" ]; then
        echo "📂 Serving from: $(pwd)"
        echo "🌐 http://localhost:8080/home.html"
        echo ""
        python3 -m http.server 8080
    else
        echo "❌ No files to serve!"
        exit 1
    fi
fi
