#!/bin/bash
# ============================================
# DEPLOY HELPER - Coding Agent Script
# ============================================
# Usage: ./scripts/deploy.sh <project_path> [platform]
# Example: ./scripts/deploy.sh projects/websites/my-site vercel
# If platform is not specified, auto-detection is used
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_PATH="$1"
PLATFORM="$2"

if [ -z "$PROJECT_PATH" ]; then
  echo -e "${RED}Error: Project path required${NC}"
  echo "Usage: $0 <project-path> [platform]"
  echo "Example: $0 projects/websites/my-site vercel"
  exit 1
fi

if [ ! -d "$PROJECT_PATH" ]; then
  echo -e "${RED}Error: Directory '$PROJECT_PATH' not found${NC}"
  exit 1
fi

PROJECT_NAME=$(basename "$PROJECT_PATH")

# Auto-detect platform if not specified
if [ -z "$PLATFORM" ]; then
  CATEGORY=$(echo "$PROJECT_PATH" | cut -d'/' -f2)
  case "$CATEGORY" in
    websites)
      PLATFORM="vercel"
      ;;
    apps)
      PLATFORM="expo"
      ;;
    apis)
      PLATFORM="render"
      ;;
    ai-models)
      PLATFORM="huggingface"
      ;;
    databases)
      PLATFORM="supabase"
      ;;
    *)
      PLATFORM="vercel"
      ;;
  esac
fi

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  CODING AGENT - DEPLOY HELPER${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "Project: ${GREEN}$PROJECT_NAME${NC}"
echo -e "Path: $PROJECT_PATH"
echo -e "Platform: ${YELLOW}$PLATFORM${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo -e "${YELLOW}Note: Actual deployment happens via GitHub Actions.${NC}"
echo -e "${YELLOW}This script helps prepare and commit your project.${NC}"
echo ""

# Check if there are changes to commit
CHANGES=$(git status --porcelain "$PROJECT_PATH" 2>/dev/null || echo "")
if [ -n "$CHANGES" ]; then
  echo -e "${YELLOW}Uncommitted changes detected:${NC}"
  echo "$CHANGES"
  echo ""
  read -p "Commit and push? (y/N): " confirm
  if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    git add "$PROJECT_PATH"
    git commit -m "Prepare $PROJECT_NAME for $PLATFORM deployment"
    git push origin main
    echo -e "${GREEN}✅ Pushed to GitHub!${NC}"
  fi
else
  echo -e "${GREEN}✅ No uncommitted changes${NC}"
fi

echo ""
echo -e "${YELLOW}To deploy, go to:${NC}"
echo -e "  https://github.com/crxraj786/my-coding-agent/actions"
echo -e "  Run: deploy-${PLATFORM}.yml"
echo -e "  Set project_path: ${PROJECT_PATH}"
echo ""
