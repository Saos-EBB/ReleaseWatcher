#!/bin/bash
set -e

echo "🚀 Release Watcher UI Setup"
echo "=========================="

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
    echo "✓ Bun installed"
else
    echo "✓ Bun already installed"
fi

# Setup database and seed test data
echo ""
echo "🌱 Seeding test data..."
rm -f release-watcher.sqlite
bun scripts/seed-test-data.ts

# Done
echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Start the UI with:"
echo "   bun run ui"
echo ""
echo "   Then open: http://localhost:3000"
echo ""
