#!/bin/bash
# ============================================
# VERIFY SETUP INTEGRITY
# ============================================
# Yeh script check karta hai ki saari protected
# files safe hain ya kisi ne modify ki hain.
# Run: bash scripts/verify-setup.sh
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FINGERPRINT_FILE="$REPO_ROOT/SETUP_FINGERPRINT"

echo -e "${CYAN}=== SETUP INTEGRITY VERIFICATION ===${NC}"
echo ""

if [ ! -f "$FINGERPRINT_FILE" ]; then
  echo -e "${RED}❌ SETUP_FINGERPRINT file not found!${NC}"
  echo -e "${RED}   Setup may be corrupted or not initialized.${NC}"
  echo -e "${YELLOW}   Run: bash scripts/update-fingerprint.sh${NC}"
  exit 1
fi

# Protected files list
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

TOTAL_CHECKED=0
MISSING=0
FAILED=0
PASSED=0

echo -e "${CYAN}Checking protected root files...${NC}"
for file in "${PROTECTED_FILES[@]}"; do
  TOTAL_CHECKED=$((TOTAL_CHECKED + 1))
  if [ -f "$REPO_ROOT/$file" ]; then
    echo -e "${GREEN}  ✅ EXISTS  $file${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}  ❌ MISSING  $file${NC}"
    MISSING=$((MISSING + 1))
  fi
done

echo ""
echo -e "${CYAN}Checking protected directories...${NC}"

# .github/workflows
TOTAL_CHECKED=$((TOTAL_CHECKED + 1))
if [ -d "$REPO_ROOT/.github/workflows" ]; then
  WORKFLOW_COUNT=$(ls -1 "$REPO_ROOT/.github/workflows/"*.yml 2>/dev/null | wc -l)
  echo -e "${GREEN}  ✅ .github/workflows/ — $WORKFLOW_COUNT workflow files found${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}  ❌ .github/workflows/ — DIRECTORY MISSING${NC}"
  MISSING=$((MISSING + 1))
fi

# scripts
TOTAL_CHECKED=$((TOTAL_CHECKED + 1))
if [ -d "$REPO_ROOT/scripts" ]; then
  SCRIPT_COUNT=$(ls -1 "$REPO_ROOT/scripts/"*.sh 2>/dev/null | wc -l)
  echo -e "${GREEN}  ✅ scripts/ — $SCRIPT_COUNT script files found${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}  ❌ scripts/ — DIRECTORY MISSING${NC}"
  MISSING=$((MISSING + 1))
fi

# Expected workflow files
EXPECTED_WORKFLOWS=(
  "deploy-vercel.yml"
  "deploy-render.yml"
  "deploy-expo.yml"
  "deploy-huggingface.yml"
  "deploy-supabase.yml"
  "smart-deploy.yml"
)

echo ""
echo -e "${CYAN}Checking expected workflow files...${NC}"
for wf in "${EXPECTED_WORKFLOWS[@]}"; do
  TOTAL_CHECKED=$((TOTAL_CHECKED + 1))
  if [ -f "$REPO_ROOT/.github/workflows/$wf" ]; then
    echo -e "${GREEN}  ✅ .github/workflows/$wf${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}  ❌ .github/workflows/$wf — MISSING${NC}"
    MISSING=$((MISSING + 1))
  fi
done

# Expected script files
EXPECTED_SCRIPTS=(
  "create-project.sh"
  "deploy.sh"
  "copy-secrets.sh"
  "protect-setup.sh"
  "pre-commit"
  "install-hooks.sh"
  "verify-setup.sh"
  "update-fingerprint.sh"
)

echo ""
echo -e "${CYAN}Checking expected script files...${NC}"
for sc in "${EXPECTED_SCRIPTS[@]}"; do
  TOTAL_CHECKED=$((TOTAL_CHECKED + 1))
  if [ -f "$REPO_ROOT/scripts/$sc" ]; then
    echo -e "${GREEN}  ✅ scripts/$sc${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}  ❌ scripts/$sc — MISSING${NC}"
    MISSING=$((MISSING + 1))
  fi
done

# Check pre-commit hook is installed
echo ""
echo -e "${CYAN}Checking git hook installation...${NC}"
TOTAL_CHECKED=$((TOTAL_CHECKED + 1))
if [ -f "$REPO_ROOT/.git/hooks/pre-commit" ]; then
  echo -e "${GREEN}  ✅ Pre-commit hook INSTALLED${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}  ⚠️  Pre-commit hook NOT installed${NC}"
  echo -e "${YELLOW}     Run: bash scripts/install-hooks.sh${NC}"
  MISSING=$((MISSING + 1))
fi

# Check .gitignore has critical entries
echo ""
echo -e "${CYAN}Checking .gitignore security entries...${NC}"
TOTAL_CHECKED=$((TOTAL_CHECKED + 1))
if [ -f "$REPO_ROOT/.gitignore" ]; then
  GITIGNORE_OK=true
  # Check catch-all pattern (.env.* covers all .env variants)
  if ! grep -qF ".env" "$REPO_ROOT/.gitignore"; then
    echo -e "${RED}  ❌ .gitignore missing .env patterns${NC}"
    GITIGNORE_OK=false
  fi
  if ! grep -qF ".env.*" "$REPO_ROOT/.gitignore" && ! grep -qF ".env.local" "$REPO_ROOT/.gitignore"; then
    echo -e "${RED}  ❌ .gitignore missing .env.* or .env.local pattern${NC}"
    GITIGNORE_OK=false
  fi
  for entry in "*.key" "*.pem"; do
    if ! grep -qF "$entry" "$REPO_ROOT/.gitignore"; then
      echo -e "${RED}  ❌ .gitignore missing entry: $entry${NC}"
      GITIGNORE_OK=false
    fi
  done
  if [ "$GITIGNORE_OK" = true ]; then
    echo -e "${GREEN}  ✅ .gitignore has all critical security entries${NC}"
    PASSED=$((PASSED + 1))
  else
    FAILED=$((FAILED + 1))
  fi
fi

# ===== LAYER 2: SHA256 CHECKSUM VERIFICATION =====
echo ""
echo -e "${CYAN}=== LAYER 2: SHA256 CHECKSUM VERIFICATION ===${NC}"
echo -e "${CYAN}Comparing file checksums against SETUP_FINGERPRINT...${NC}"

CHECKSUM_TOTAL=0
CHECKSUM_PASS=0
CHECKSUM_FAIL=0

while IFS=':' read -r file expected_hash; do
  # Skip comments and empty lines
  [[ "$file" =~ ^#.*$ ]] && continue
  [[ "$file" =~ ^[[:space:]]*$ ]] && continue
  [[ -z "$file" ]] && continue

  CHECKSUM_TOTAL=$((CHECKSUM_TOTAL + 1))
  TOTAL_CHECKED=$((TOTAL_CHECKED + 1))

  FULL_PATH="$REPO_ROOT/$file"
  if [ ! -f "$FULL_PATH" ]; then
    echo -e "${RED}  ❌ TAMPERED/MISSING  $file (file not found)${NC}"
    CHECKSUM_FAIL=$((CHECKSUM_FAIL + 1))
    MISSING=$((MISSING + 1))
    continue
  fi

  ACTUAL_HASH=$(sha256sum "$FULL_PATH" | awk '{print $1}')

  if [ "$ACTUAL_HASH" = "$expected_hash" ]; then
    echo -e "${GREEN}  ✅ MATCH  $file${NC}"
    CHECKSUM_PASS=$((CHECKSUM_PASS + 1))
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}  ❌ TAMPERED  $file${NC}"
    echo -e "${RED}     Expected: $expected_hash${NC}"
    echo -e "${RED}     Actual:   $ACTUAL_HASH${NC}"
    CHECKSUM_FAIL=$((CHECKSUM_FAIL + 1))
    FAILED=$((FAILED + 1))
  fi
done < "$FINGERPRINT_FILE"

# Final result
echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}  VERIFICATION COMPLETE                                      ${NC}"
echo -e "${CYAN}============================================================${NC}"
echo -e "  Total checks:  $TOTAL_CHECKED"
echo -e "  ${GREEN}Passed:         $PASSED${NC}"
echo -e "  ${RED}Missing/Failed: $((MISSING + FAILED))${NC}"

if [ $((MISSING + FAILED)) -gt 0 ]; then
  echo ""
  echo -e "${RED}⚠️  SETUP IS NOT FULLY INTACT!${NC}"
  echo -e "${YELLOW}   Some protected files are missing or corrupted.${NC}"
  echo -e "${YELLOW}   Please restore from git history or rebuild.${NC}"
  exit 1
else
  echo ""
  echo -e "${GREEN}✅ ALL SETUP FILES ARE INTACT AND PROTECTED!${NC}"
  echo -e "${GREEN}   System is ready for project work.${NC}"
  exit 0
fi
