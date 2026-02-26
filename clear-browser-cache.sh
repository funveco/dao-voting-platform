#!/bin/bash

##############################################################################
# Clear Browser Cache & Storage
#
# Clears browser storage/cache that might prevent fresh wallet connection
# Useful when wallet state seems "stuck" from previous sessions
#
# Usage: ./clear-browser-cache.sh
##############################################################################

echo ""
echo "🧹 Clearing browser cache & storage..."
echo ""

# Kill any running dev servers
pkill -f "next dev" 2>/dev/null || true

# Clear Next.js cache
if [ -d "web/.next" ]; then
    echo "  Removing Next.js cache (.next/)..."
    rm -rf web/.next
fi

# Clear Node modules cache (if needed)
if [ -d "web/node_modules/.cache" ]; then
    echo "  Removing node_modules cache..."
    rm -rf web/node_modules/.cache
fi

# Inform user about browser cache
echo ""
echo "✅ App cache cleared"
echo ""
echo "📱 For Chrome/Edge - Also do this manually:"
echo "   1. Open DevTools (F12)"
echo "   2. Application → Storage → Clear site data"
echo "   3. Or: Ctrl+Shift+Delete → Cookies and other site data"
echo ""
echo "🦊 For Firefox - Also do this manually:"
echo "   1. Open DevTools (F12)"
echo "   2. Storage → Clear All"
echo "   3. Or: Ctrl+Shift+Delete → Cookies and Site Data"
echo ""
echo "Then restart the app:"
echo "   $ ./deploy-full.sh"
echo ""
