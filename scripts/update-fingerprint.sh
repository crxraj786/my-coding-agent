#!/bin/bash
# ============================================
# UPDATE SETUP FINGERPRINT
# ============================================
# Run yeh script jab setup files intentionally
# change ki hain (sirf bhai ke bolne pe):
#   bash scripts/update-fingerprint.sh
# Yeh checksums update kar dega.
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FINGERPRINT_FILE="$REPO_ROOT/SETUP_FINGERPRINT"

echo "=== Updating Setup Fingerprint ==="

# All protected files
FILES=(
  ".gitignore"
  ".env.example"
  "SYSTEM_SPECIFICATION.md"
  "README.md"
  ".github/workflows/deploy-vercel.yml"
  ".github/workflows/deploy-render.yml"
  ".github/workflows/deploy-expo.yml"
  ".github/workflows/deploy-huggingface.yml"
  ".github/workflows/deploy-supabase.yml"
  ".github/workflows/smart-deploy.yml"
  "scripts/create-project.sh"
  "scripts/deploy.sh"
  "scripts/copy-secrets.sh"
  "scripts/protect-setup.sh"
  "scripts/pre-commit"
  "scripts/install-hooks.sh"
  "scripts/verify-setup.sh"
  "scripts/update-fingerprint.sh"
)

# Generate fingerprint
echo "# ============================================" > "$FINGERPRINT_FILE"
echo "# SETUP FINGERPRINT — INTEGRITY VERIFICATION" >> "$FINGERPRINT_FILE"
echo "# ============================================" >> "$FINGERPRINT_FILE"
echo "# Yeh file sab protected files ke checksums store karti hai." >> "$FINGERPRINT_FILE"
echo "# Kisi bhi change ke baad verify-setup.sh run karo." >> "$FINGERPRINT_FILE"
echo "# Agar checksum match nahi karta → setup KHRAB hua hai." >> "$FINGERPRINT_FILE"
echo "# ============================================" >> "$FINGERPRINT_FILE"
echo "# LAST UPDATED: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$FINGERPRINT_FILE"
echo "# ============================================" >> "$FINGERPRINT_FILE"
echo "" >> "$FINGERPRINT_FILE"

ALL_OK=true
for file in "${FILES[@]}"; do
  FULL_PATH="$REPO_ROOT/$file"
  if [ -f "$FULL_PATH" ]; then
    # SHA256 checksum
    HASH=$(sha256sum "$FULL_PATH" | awk '{print $1}')
    echo "$file:$HASH" >> "$FINGERPRINT_FILE"
    echo "  ✅ $file"
  else
    echo "  ❌ $file — FILE NOT FOUND"
    ALL_OK=false
  fi
done

echo ""
if [ "$ALL_OK" = true ]; then
  echo "✅ Fingerprint updated successfully!"
  echo "   File: $FINGERPRINT_FILE"
else
  echo "⚠️  Some files are missing — fingerprint incomplete"
fi
