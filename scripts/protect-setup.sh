#!/bin/bash
# ============================================
# SETUP PROTECTION CHECK
# ============================================
# This script checks if any SETUP/INFRASTRUCTURE
# files have been modified before pushing.
# Run BEFORE every git push to protect setup.
# ============================================
# If you need to modify setup files intentionally,
# use: PROTECT_SETUP=override ./scripts/protect-setup.sh
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== SETUP PROTECTION CHECK ===${NC}"

# Protected files and directories
PROTECTED_FILES=(
  ".gitignore"
  ".env.example"
  "SYSTEM_SPECIFICATION.md"
  "README.md"
)

PROTECTED_DIRS=(
  ".github/workflows"
  "scripts"
)

# Check override
if [ "$PROTECT_SETUP" = "override" ]; then
  echo -e "${RED}⚠️  OVERRIDE MODE — Setup protection disabled${NC}"
  echo -e "${RED}⚠️  Make sure you know what you're doing!${NC}"
  exit 0
fi

# Check staged changes
STAGED=$(git diff --cached --name-only)
UNSTAGED=$(git diff --name-only)
ALL_CHANGES="$STAGED
$UNSTAGED"

VIOLATIONS=""

# Check protected files
for file in "${PROTECTED_FILES[@]}"; do
  if echo "$ALL_CHANGES" | grep -q "^${file}$"; then
    VIOLATIONS="$VIOLATIONS\n  ❌ $file (protected file)"
  fi
done

# Check protected directories
for dir in "${PROTECTED_DIRS[@]}"; do
  MATCHES=$(echo "$ALL_CHANGES" | grep "^${dir}/" || true)
  if [ -n "$MATCHES" ]; then
    while IFS= read -r match; do
      VIOLATIONS="$VIOLATIONS\n  ❌ $match (protected directory: $dir/)"
    done <<< "$MATCHES"
  fi
done

if [ -n "$VIOLATIONS" ]; then
  echo -e "${RED}╔══════════════════════════════════════════╗${NC}"
  echo -e "${RED}║     SETUP PROTECTION VIOLATION!          ║${NC}"
  echo -e "${RED}╠══════════════════════════════════════════╣${NC}"
  echo -e "${RED}║ Following PROTECTED files are modified:   ║${NC}"
  echo -e "$VIOLATIONS"
  echo -e "${RED}╠══════════════════════════════════════════╣${NC}"
  echo -e "${RED}║ WARNING: Modifying setup files can break  ║${NC}"
  echo -e "${RED}║ the entire coding agent system!           ║${NC}"
  echo -e "${RED}║ Secrets may get exposed!                  ║${NC}"
  echo -e "${RED}║ Workflows may stop working!               ║${NC}"
  echo -e "${RED}╠══════════════════════════════════════════╣${NC}"
  echo -e "${YELLOW}║ If you MUST modify setup files:           ║${NC}"
  echo -e "${YELLOW}║ Use: PROTECT_SETUP=override git push    ║${NC}"
  echo -e "${RED}╚══════════════════════════════════════════╝${NC}"
  exit 1
else
  echo -e "${GREEN}✅ No protected files modified. Safe to push.${NC}"
  exit 0
fi
