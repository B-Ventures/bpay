# Push getBPay Code to GitHub Repository

## Current Git Status
- Repository: https://github.com/B-Ventures/bpay
- Current branch: main
- Last commit: c21db5d - "Add a description of the project's architecture and main components"

## Steps to Push Code to GitHub

### Option 1: Fix Git Lock and Push (Recommended)
1. Open a terminal/shell in your Replit workspace
2. Remove the git lock file:
   ```bash
   rm -f .git/config.lock .git/index.lock
   ```
3. Add your GitHub repository as remote:
   ```bash
   git remote add origin https://github.com/B-Ventures/bpay.git
   ```
4. Push the code:
   ```bash
   git push -u origin main
   ```

### Option 2: Create Fresh Repository
If the above doesn't work, you can create a fresh git repository:
1. Backup your current code
2. Delete the .git folder:
   ```bash
   rm -rf .git
   ```
3. Initialize new git repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - getBPay platform"
   git branch -M main
   git remote add origin https://github.com/B-Ventures/bpay.git
   git push -u origin main
   ```

### Option 3: Download and Upload Manually
1. Download the project files from Replit
2. Clone your empty GitHub repository locally
3. Copy all files (except .git folder) to the cloned repository
4. Commit and push:
   ```bash
   git add .
   git commit -m "Initial commit - getBPay platform"
   git push origin main
   ```

## Project Structure Being Pushed
```
getBPay/
├── client/           # React frontend
├── server/           # Express backend
├── shared/           # Shared schemas and types
├── public/           # Static assets
├── scripts/          # Build and utility scripts
├── henry-cms/        # CMS integration
├── wordpress/        # WordPress plugin
├── package.json      # Dependencies
├── drizzle.config.ts # Database configuration
├── vite.config.ts    # Build configuration
├── tailwind.config.ts # Styling configuration
└── replit.md         # Project documentation
```

## Important Files to Include
- All source code files (.js, .jsx, .ts, .tsx)
- Configuration files (package.json, tsconfig.json, etc.)
- Documentation (replit.md, README files)
- Build scripts and configurations
- Database schema and migrations

## Environment Variables to Set in GitHub
After pushing, make sure to set these environment variables in your production environment:
- `DATABASE_URL` - PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `STRIPE_PUBLIC_KEY` - Stripe publishable key

## Next Steps After Push
1. Set up GitHub Actions for CI/CD
2. Configure deployment environment
3. Set up database in production
4. Configure domain and SSL certificates