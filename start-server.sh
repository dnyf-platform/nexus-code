#!/bin/bash

DIR="/storage/emulated/0/Documents/NexusCode/dist/NexusCode_IDE"
PORT=8080

if [ ! -d "$DIR" ]; then
    echo "❌ Build directory not found. Run build first:"
    echo "   bash build-final.sh"
    exit 1
fi

echo "=============================================="
echo "🚀 NexusCode Studio Server"
echo "=============================================="
echo ""
echo "📂 Serving: $DIR"
echo "🌐 Port: $PORT"
echo ""
echo "📱 Open in browser:"
echo "   Home:     http://localhost:$PORT/home.html"
echo "   Editor:   http://localhost:$PORT/index.html"
echo "   Terminal: http://localhost:$PORT/terminal/terminal.html"
echo ""
echo "Press Ctrl+C to stop"
echo "=============================================="
echo ""

cd "$DIR"
python3 -m http.server $PORT
