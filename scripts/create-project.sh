#!/bin/bash
# ============================================
# CREATE NEW PROJECT - Coding Agent Script
# ============================================
# Usage: ./scripts/create-project.sh <type> <name>
# Types: website, app, api, ai-model, database
# Example: ./scripts/create-project.sh website my-portfolio
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Project type to folder mapping
case "$1" in
  website|web)
    FOLDER="websites"
    TEMPLATE="web"
    ;;
  app|mobile|expo)
    FOLDER="apps"
    TEMPLATE="expo"
    ;;
  api|backend)
    FOLDER="apis"
    TEMPLATE="api"
    ;;
  ai|model|huggingface)
    FOLDER="ai-models"
    TEMPLATE="ai"
    ;;
  database|db|supabase)
    FOLDER="databases"
    TEMPLATE="database"
    ;;
  *)
    echo -e "${RED}Error: Unknown project type '$1'${NC}"
    echo "Usage: $0 <website|app|api|ai-model|database> <project-name>"
    exit 1
    ;;
esac

PROJECT_NAME="$2"
if [ -z "$PROJECT_NAME" ]; then
  echo -e "${RED}Error: Project name required${NC}"
  echo "Usage: $0 <type> <project-name>"
  exit 1
fi

PROJECT_PATH="projects/${FOLDER}/${PROJECT_NAME}"

if [ -d "$PROJECT_PATH" ]; then
  echo -e "${YELLOW}Warning: Project '$PROJECT_NAME' already exists at $PROJECT_PATH${NC}"
  read -p "Overwrite? (y/N): " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Aborted."
    exit 0
  fi
fi

echo -e "${BLUE}Creating project: ${PROJECT_NAME}${NC}"
echo -e "${BLUE}Type: $1 | Path: $PROJECT_PATH${NC}"
echo ""

# Create project directory
mkdir -p "$PROJECT_PATH"

# Create basic template files based on type
case "$TEMPLATE" in
  web)
    cat > "$PROJECT_PATH/index.html" << 'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PROJECT_NAME</title>
</head>
<body>
    <h1>PROJECT_NAME</h1>
    <p>Project created by Coding Agent</p>
</body>
</html>
HTML
    sed -i "s/PROJECT_NAME/$PROJECT_NAME/g" "$PROJECT_PATH/index.html"

    cat > "$PROJECT_PATH/package.json" << PKG
{
  "name": "$PROJECT_NAME",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "npx serve .",
    "build": "echo 'Static site - no build needed'",
    "start": "npx serve ."
  }
}
PKG
    ;;

  expo)
    cat > "$PROJECT_PATH/package.json" << PKG
{
  "name": "$PROJECT_NAME",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "react": "18.2.0",
    "react-native": "0.74.0",
    "react-native-safe-area-context": "4.10.0",
    "react-native-screens": "~3.31.0"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0"
  }
}
PKG

    cat > "$PROJECT_PATH/app.json" << JSON
{
  "expo": {
    "name": "$PROJECT_NAME",
    "slug": "$PROJECT_NAME",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#ffffff"
      }
    }
  }
}
JSON

    mkdir -p "$PROJECT_PATH/app"
    cat > "$PROJECT_PATH/app/index.tsx" << TSX
import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to $PROJECT_NAME</Text>
    </View>
  );
}
TSX
    ;;

  api)
    cat > "$PROJECT_PATH/package.json" << PKG
{
  "name": "$PROJECT_NAME",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5"
  }
}
PKG

    cat > "$PROJECT_PATH/server.js" << JS
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: '$PROJECT_NAME API is running', status: 'ok' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('$PROJECT_NAME running on port ' + PORT);
});
JS
    ;;

  ai)
    cat > "$PROJECT_PATH/requirements.txt" << REQ
gradio>=4.0.0
REQ

    cat > "$PROJECT_PATH/app.py" << PY
import gradio as gr

def greet(name):
    return f"Hello {name}! Welcome to $PROJECT_NAME"

demo = gr.Interface(fn=greet, inputs="text", outputs="text")
demo.launch()
PY

    cat > "$PROJECT_PATH/README.md" << MD
# $PROJECT_NAME

AI Model deployed on HuggingFace Spaces.
MD
    ;;

  database)
    cat > "$PROJECT_PATH/schema.sql" << SQL
-- $PROJECT_NAME Database Schema
-- Apply this SQL in Supabase Dashboard SQL Editor

-- Example table
-- CREATE TABLE IF NOT EXISTS items (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   name TEXT NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );
SQL

    cat > "$PROJECT_PATH/README.md" << MD
# $PROJECT_NAME

Database project using Supabase.

## Setup
1. Go to https://supabase.com/dashboard
2. Open SQL Editor
3. Paste schema.sql content
4. Run the query
MD
    ;;
esac

# Create .env.local placeholder
cat > "$PROJECT_PATH/.env.local" << ENV
# Local environment variables for $PROJECT_NAME
# NEVER commit this file to git
ENV

echo ""
echo -e "${GREEN}✅ Project '$PROJECT_NAME' created successfully!${NC}"
echo -e "${GREEN}📁 Path: $PROJECT_PATH${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Add your code to: $PROJECT_PATH/"
echo -e "  2. Set secrets in .env.local (not committed)"
echo -e "  3. Push to GitHub: git add . && git commit && git push"
echo -e "  4. Run the deploy workflow from GitHub Actions"
echo ""
