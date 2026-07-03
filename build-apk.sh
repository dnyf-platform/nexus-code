#!/bin/bash

echo "=============================================="
echo "📱 NEXUSCODE APK BUILDER"
echo "=============================================="

SCRIPT_DIR="/storage/emulated/0/Documents/NexusCode"
ANDROID_DIR="$SCRIPT_DIR/android-app"
DIST_DIR="$SCRIPT_DIR/dist/NexusCode_IDE"

# Step 1: Ensure dist exists
if [ ! -d "$DIST_DIR" ]; then
    echo "❌ Dist directory not found. Run build-clean.sh first."
    exit 1
fi

# Step 2: Copy web files to assets
echo "📦 Copying web files to Android assets..."
rm -rf "$ANDROID_DIR/app/src/main/assets/www/build"
mkdir -p "$ANDROID_DIR/app/src/main/assets/www/build"
cp -r "$DIST_DIR"/* "$ANDROID_DIR/app/src/main/assets/www/build/"
echo "   ✓ Files copied ($(find "$ANDROID_DIR/app/src/main/assets/www/build" -type f | wc -l) files)"

# Step 3: Check for Gradle
if command -v gradle &> /dev/null; then
    echo "🔨 Building APK with Gradle..."
    cd "$ANDROID_DIR"
    gradle assembleDebug
    
    if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
        cp app/build/outputs/apk/debug/app-debug.apk "$SCRIPT_DIR/NexusCode.apk"
        echo ""
        echo "=============================================="
        echo "✅ APK BUILT SUCCESSFULLY!"
        echo "=============================================="
        echo "📱 APK: NexusCode.apk"
        echo "📏 Size: $(du -h "$SCRIPT_DIR/NexusCode.apk" | cut -f1)"
        echo ""
        echo "Install on device:"
        echo "  adb install NexusCode.apk"
    fi
elif command -v gradlew &> /dev/null; then
    echo "🔨 Building with Gradle Wrapper..."
    cd "$ANDROID_DIR"
    ./gradlew assembleDebug
else
    echo ""
    echo "⚠️ Gradle not found. APK must be built in Android Studio."
    echo ""
    echo "📁 Android project is ready at:"
    echo "   $ANDROID_DIR"
    echo ""
    echo "📋 To build APK:"
    echo "   1. Open Android Studio"
    echo "   2. Open: $ANDROID_DIR"
    echo "   3. Build > Build Bundle(s) / APK(s) > Build APK(s)"
    echo ""
    echo "📱 Or zip the project and use online builder:"
    echo "   cd $SCRIPT_DIR && zip -r NexusCode_Android.zip android-app/"
fi

echo ""
echo "📱 Android project structure:"
find "$ANDROID_DIR" -type f -not -path "*/build/*" -not -path "*/assets/*" | sort | sed "s|$ANDROID_DIR/||"
