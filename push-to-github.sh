#!/bin/bash

echo "🚀 Pushing NexusCode to GitHub..."
echo "=============================================="

REPO_URL="https://github.com/dnyf-platform/nexus-code.git"

# Check if remote exists
if git remote | grep -q origin; then
    echo "Remote 'origin' already exists"
    git remote set-url origin "$REPO_URL"
else
    echo "Adding remote origin..."
    git remote add origin "$REPO_URL"
fi

# Push
echo ""
echo "Pushing to $REPO_URL ..."
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "=============================================="
    echo "✅ SUCCESSFULLY PUSHED TO GITHUB!"
    echo "=============================================="
    echo "🔗 Repository: $REPO_URL"
else
    echo ""
    echo "❌ Push failed. Check your credentials."
    echo "💡 Create a token at: https://github.com/settings/tokens"
fi
