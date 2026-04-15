#!/bin/bash
# ============================================
# INSTALL GIT HOOKS — PROTECTION SYSTEM
# ============================================
# Run yeh script jab bhi repo clone karo:
#   bash scripts/install-hooks.sh
# Yeh pre-commit hook install karega jo protected
# files ko modify hone se rokta hai.
# ============================================

echo "=== Installing Git Hooks for Setup Protection ==="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"

# Ensure .git/hooks exists
mkdir -p "$HOOKS_DIR"

# Copy pre-commit hook
cp "$SCRIPT_DIR/pre-commit" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"

echo "✅ Pre-commit hook installed successfully!"
echo "   Location: $HOOKS_DIR/pre-commit"
echo ""
echo "🛡️  Protection active:"
echo "   - .gitignore"
echo "   - .env.example"
echo "   - SYSTEM_SPECIFICATION.md"
echo "   - README.md"
echo "   - SETUP_FINGERPRINT"
echo "   - .github/workflows/*"
echo "   - scripts/*"
echo ""
echo "⚠️  These files CANNOT be committed without --no-verify flag"
echo "   (which should ONLY be used when bhai explicitly asks)"
