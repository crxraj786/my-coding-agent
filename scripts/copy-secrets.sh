#!/bin/bash
# ============================================
# COPY SECRETS TO NEW REPO
# ============================================
# Usage: ./scripts/copy-secrets.sh <new-repo-name>
# Example: ./scripts/copy-secrets.sh my-new-project
# ============================================
# This script copies all secrets from my-coding-agent
# to a new repository using the GitHub API.
# Requires: PAT stored in ~/.coding-agent/config.json
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NEW_REPO="$1"
SOURCE_REPO="my-coding-agent"

if [ -z "$NEW_REPO" ]; then
  echo -e "${RED}Error: New repo name required${NC}"
  echo "Usage: $0 <new-repo-name>"
  echo "Example: $0 my-portfolio-site"
  exit 1
fi

# Read PAT from config
CONFIG_FILE="$HOME/.coding-agent/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
  echo -e "${RED}Error: Config not found at $CONFIG_FILE${NC}"
  echo "Run setup first."
  exit 1
fi

PAT=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['github']['pat'])")
USERNAME=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['github']['username'])")

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  COPY SECRETS TO NEW REPO${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "Source: ${YELLOW}$SOURCE_REPO${NC}"
echo -e "Target: ${YELLOW}$NEW_REPO${NC}"
echo ""

# Check if target repo exists
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://api.github.com/repos/$USERNAME/$NEW_REPO" \
  -H "Authorization: Bearer $PAT")

if [ "$HTTP_CODE" != "200" ]; then
  echo -e "${YELLOW}Repo '$NEW_REPO' not found. Creating it...${NC}"
  CREATE_RESPONSE=$(curl -s -X POST \
    "https://api.github.com/user/repos" \
    -H "Authorization: Bearer $PAT" \
    -H "Accept: application/vnd.github+json" \
    -d "{\"name\":\"$NEW_REPO\",\"private\":false,\"auto_init\":true}")

  REPO_URL=$(echo "$CREATE_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('html_url',''))" 2>/dev/null)
  if [ -n "$REPO_URL" ]; then
    echo -e "${GREEN}✅ Repo created: $REPO_URL${NC}"
  else
    echo -e "${RED}❌ Failed to create repo${NC}"
    exit 1
  fi
fi

# Copy secrets using Python (for proper encryption)
python3 << PYEOF
import base64, json, urllib.request, sys
from nacl import public

pat = "$PAT"
username = "$USERNAME"
source_repo = "$SOURCE_REPO"
target_repo = "$NEW_REPO"

def api_get(url):
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {pat}")
    req.add_header("Accept", "application/vnd.github+json")
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return {}

def get_public_key(repo):
    data = api_get(f"https://api.github.com/repos/{username}/{repo}/actions/secrets/public-key")
    return data.get("key", ""), data.get("key_id", "")

def encrypt_secret(value, public_key_b64):
    pk = public.PublicKey(base64.b64decode(public_key_b64))
    sealed = public.SealedBox(pk).encrypt(value.encode("utf-8"))
    return base64.b64encode(sealed).decode("utf-8")

def set_secret(repo, name, value):
    pub_key, key_id = get_public_key(repo)
    if not pub_key:
        print(f"  Skip {name}: Cannot get public key for {repo}")
        return False
    encrypted = encrypt_secret(value, pub_key)
    data = json.dumps({"encrypted_value": encrypted, "key_id": key_id}).encode("utf-8")
    url = f"https://api.github.com/repos/{username}/{repo}/actions/secrets/{name}"
    req = urllib.request.Request(url, data=data, method='PUT')
    req.add_header("Authorization", f"Bearer {pat}")
    req.add_header("Accept", "application/vnd.github+json")
    try:
        urllib.request.urlopen(req)
        return True
    except Exception as e:
        print(f"  Error setting {name}: {e}")
        return False

# Get source secrets list (names only - can't read values)
# We read from local config instead
config = json.load(open("$CONFIG_FILE"))
secrets_map = {
    "VERCEL_TOKEN": config.get("vercel", {}).get("token", ""),
    "RENDER_TOKEN": config.get("render", {}).get("api_key", ""),
    "EXPO_TOKEN": config.get("expo", {}).get("access_token", ""),
    "SUPABASE_URL": config.get("supabase", {}).get("project_url", ""),
    "SUPABASE_ANON_KEY": config.get("supabase", {}).get("anon_key", ""),
    "SUPABASE_SERVICE_ROLE_KEY": config.get("supabase", {}).get("service_role_key", ""),
    "HUGGINGFACE_TOKEN": config.get("huggingface", {}).get("token", "PLACEHOLDER"),
    "GEMINI_API_KEY": config.get("gemini", {}).get("api_key", "PLACEHOLDER"),
}

print(f"\nCopying secrets to {username}/{target_repo}...")
copied = 0
skipped = 0
for name, value in secrets_map.items():
    if not value or value == "PLACEHOLDER":
        print(f"  Skip {name}: No value available locally")
        skipped += 1
        continue
    if set_secret(target_repo, name, value):
        print(f"  Copied: {name}")
        copied += 1
    else:
        skipped += 1

print(f"\nResult: {copied} copied, {skipped} skipped")
PYEOF

echo ""
echo -e "${GREEN}✅ Secrets copied to $USERNAME/$NEW_REPO!${NC}"
echo -e "${YELLOW}Note: Copy workflows from $SOURCE_REPO to $NEW_REPO for deployments${NC}"
