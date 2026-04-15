# My Coding Agent

Fully automatic coding agent setup with smart deployment to multiple platforms.

## Project Structure

```
my-coding-agent/
├── projects/                    # All projects live here
│   ├── websites/                # Web apps → Deployed on Vercel
│   ├── apps/                    # Mobile apps → Built on Expo
│   ├── apis/                    # Backend APIs → Deployed on Render
│   ├── ai-models/               # AI/ML models → Deployed on HuggingFace
│   └── databases/               # Database schemas → Setup on Supabase
├── .github/workflows/           # Automated deploy workflows
│   ├── smart-deploy.yml         # Auto platform selection + deploy
│   ├── deploy-vercel.yml        # Vercel deployment
│   ├── deploy-render.yml        # Render deployment
│   ├── deploy-expo.yml          # Expo mobile build
│   ├── deploy-huggingface.yml   # HuggingFace Spaces deploy
│   └── deploy-supabase.yml      # Supabase database setup
├── scripts/                     # Helper scripts
│   ├── create-project.sh        # Create new project template
│   └── deploy.sh                # Deploy helper
└── .env.example                 # Environment variables template
```

## Platform Mapping

| Project Type | Folder | Platform | Workflow |
|---|---|---|---|
| Website | `projects/websites/` | Vercel | `deploy-vercel.yml` |
| Mobile App | `projects/apps/` | Expo | `deploy-expo.yml` |
| Backend API | `projects/apis/` | Render | `deploy-render.yml` |
| AI Model | `projects/ai-models/` | HuggingFace | `deploy-huggingface.yml` |
| Database | `projects/databases/` | Supabase | `deploy-supabase.yml` |

## How to Deploy

### Option 1: Automatic (Push & Deploy)
Just push code to `projects/<type>/<name>/` and run the Smart Deploy workflow.

### Option 2: Manual (GitHub Actions)
1. Go to **Actions** tab
2. Select the platform workflow
3. Fill in project path and name
4. Click **Run workflow**

### Option 3: Using Scripts
```bash
# Create a new website project
./scripts/create-project.sh website my-portfolio

# Deploy it
./scripts/deploy.sh projects/websites/my-portfolio vercel
```

## Security

- All secrets stored in **GitHub Secrets** (encrypted)
- `.env` files never committed (blocked by .gitignore)
- Tokens never exposed in code
- Public repo safe to use

## Available Secrets (GitHub)

- `VERCEL_TOKEN` - Vercel deployments
- `RENDER_TOKEN` - Render deployments
- `EXPO_TOKEN` - Expo mobile builds
- `SUPABASE_ANON_KEY` - Supabase public access
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin access
- `HUGGINGFACE_TOKEN` - HuggingFace model deploy
- `GEMINI_API_KEY` - Gemini AI assistant
