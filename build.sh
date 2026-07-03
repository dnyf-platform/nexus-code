#!/bin/bash

echo "=============================================="
echo "🧹 NEXUSCODE - CLEAN BUILD"
echo "=============================================="

ROOT_DIR="/storage/emulated/0/Documents/NexusCode"
DIST_DIR="$ROOT_DIR/dist/NexusCode_IDE"

# Step 1: Clean everything
echo ""
echo "1️⃣ Cleaning old files..."
rm -rf "$DIST_DIR"
rm -f "$ROOT_DIR/dist/NexusCode_Final.zip"
echo "   ✓ Old dist removed"

# Step 2: Create fresh directories
echo ""
echo "2️⃣ Creating fresh structure..."
mkdir -p "$DIST_DIR/css/themes"
mkdir -p "$DIST_DIR/js/core"
mkdir -p "$DIST_DIR/js/editor"
mkdir -p "$DIST_DIR/js/dashboard"
mkdir -p "$DIST_DIR/js/terminal"
mkdir -p "$DIST_DIR/js/templates"
mkdir -p "$DIST_DIR/js/settings"
mkdir -p "$DIST_DIR/js/plugins"
mkdir -p "$DIST_DIR/terminal/js"
echo "   ✓ Directories created"

# Step 3: Copy root files
echo ""
echo "3️⃣ Copying root files..."
cp "$ROOT_DIR/index.html" "$DIST_DIR/" 2>/dev/null && echo "   ✓ index.html"
cp "$ROOT_DIR/home.html" "$DIST_DIR/" 2>/dev/null && echo "   ✓ home.html"
cp "$ROOT_DIR/manifest.json" "$DIST_DIR/" 2>/dev/null && echo "   ✓ manifest.json"
cp "$ROOT_DIR/sw.js" "$DIST_DIR/" 2>/dev/null && echo "   ✓ sw.js"
cp "$ROOT_DIR/server.js" "$DIST_DIR/" 2>/dev/null && echo "   ✓ server.js"

# Step 4: Copy CSS
echo ""
echo "4️⃣ Copying CSS..."
cp "$ROOT_DIR/css/"*.css "$DIST_DIR/css/" 2>/dev/null
cp "$ROOT_DIR/css/themes/"*.css "$DIST_DIR/css/themes/" 2>/dev/null
echo "   ✓ CSS files copied"

# Step 5: Copy JS
echo ""
echo "5️⃣ Copying JavaScript..."
cp "$ROOT_DIR/js/core/"*.js "$DIST_DIR/js/core/" 2>/dev/null
cp "$ROOT_DIR/js/editor/"*.js "$DIST_DIR/js/editor/" 2>/dev/null
cp "$ROOT_DIR/js/dashboard/"*.js "$DIST_DIR/js/dashboard/" 2>/dev/null
cp "$ROOT_DIR/js/terminal/"*.js "$DIST_DIR/js/terminal/" 2>/dev/null
cp "$ROOT_DIR/js/templates/"*.js "$DIST_DIR/js/templates/" 2>/dev/null
cp "$ROOT_DIR/js/settings/"*.js "$DIST_DIR/js/settings/" 2>/dev/null
cp "$ROOT_DIR/js/plugins/"*.js "$DIST_DIR/js/plugins/" 2>/dev/null
cp "$ROOT_DIR/js/"*.js "$DIST_DIR/js/" 2>/dev/null
echo "   ✓ JS files copied"

# Step 6: Copy Terminal app
echo ""
echo "6️⃣ Copying Terminal app..."
cp "$ROOT_DIR/terminal/terminal.html" "$DIST_DIR/terminal/" 2>/dev/null
cp "$ROOT_DIR/terminal/terminal.css" "$DIST_DIR/terminal/" 2>/dev/null
cp "$ROOT_DIR/terminal/js/"*.js "$DIST_DIR/terminal/js/" 2>/dev/null
echo "   ✓ Terminal app copied"

# Step 7: Create ZIP
echo ""
echo "7️⃣ Creating ZIP package..."
cd "$ROOT_DIR/dist"
rm -f NexusCode_Final.zip
zip -r NexusCode_Final.zip NexusCode_IDE/ -x "*.log" "*.tmp" ".DS_Store" > /dev/null 2>&1

if [ -f "NexusCode_Final.zip" ]; then
    SIZE=$(du -h NexusCode_Final.zip | cut -f1)
    echo "   ✓ NexusCode_Final.zip created ($SIZE)"
else
    echo "   ⚠ ZIP creation skipped (zip not available)"
fi

# Step 8: Summary
echo ""
echo "=============================================="
echo "✅ CLEAN BUILD COMPLETE"
echo "=============================================="
echo ""
echo "📁 Files in dist/NexusCode_IDE:"
find "$DIST_DIR" -type f | wc -l | xargs echo "   Total:"
echo ""
echo "🚀 To start:"
echo "   node server.js"
echo "   # or"
echo "   bash start.sh"
echo ""
echo "🌐 Open: http://localhost:8080/home.html"

chmod +x /storage/emulated/0/Documents/NexusCode/build.sh

echo "✅ Clean build script created"




echo ""
echo "=============================================="
echo "📋 PROJECT STATUS"
echo "=============================================="
echo ""
echo "📁 Clean files (no logs/cache):"
find . -type f -not -path "./dist/*" -not -path "./node_modules/*" -not -path "./.git/*" | sort
echo ""
echo "📊 File count: $(find . -type f -not -path './dist/*' -not -path './node_modules/*' -not -path './.git/*' | wc -l)"
echo ""
echo "🗑 These are excluded:"
echo "   - node_modules/"
echo "   - dist/"
echo "   - *.log"
echo "   - __pycache__/"
echo "   - .DS_Store"
echo "   - *.tmp"
echo "   - package-lock.json"
