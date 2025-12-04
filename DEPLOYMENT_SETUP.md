# Deployment Setup Instructions

This document explains how to set up secure deployment of the Pricing Assistant to GitHub Pages using GitHub Secrets and GitHub Actions.

## Overview

The API key is now securely stored in GitHub Secrets and will be injected during the build process. This ensures your API key never appears in your source code.

## Setup Steps

### Step 1: Add API Key to GitHub Secrets

1. Go to your GitHub repository: `https://github.com/ckapl1/smb-pricing-assistant`
2. Click on **Settings** (top menu bar)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Fill in the form:
   - **Name:** `GEMINI_API_KEY` (must match exactly)
   - **Value:** Paste your actual Gemini API key: `AIzaSyASsMBfFZKGY4ZEDJ-mtGYOyp2e7Nvhm70`
6. Click **Add secret**

✅ Your API key is now securely stored and encrypted by GitHub.

### Step 2: Enable GitHub Pages with GitHub Actions

1. Still in your repository **Settings**
2. Click **Pages** in the left sidebar
3. Under **Source**, select:
   - **Deploy from a branch** → Change to **GitHub Actions**
4. Click **Save**

✅ GitHub Pages is now configured to use the GitHub Actions workflow.

### Step 3: Push Your Code

1. Commit and push all changes:
   ```bash
   git add .
   git commit -m "Set up GitHub Actions for secure API key deployment"
   git push origin main
   ```

2. The GitHub Actions workflow will automatically:
   - Replace the placeholder with your actual API key
   - Build and deploy your site to GitHub Pages

### Step 4: Verify Deployment

1. Go to your repository → **Actions** tab
2. You should see a workflow run called "Deploy to GitHub Pages"
3. Wait for it to complete (green checkmark)
4. Your site will be live at:
   **https://ckapl1.github.io/smb-pricing-assistant/**

## How It Works

1. **Source Code**: Contains placeholder `GITHUB_SECRET_API_KEY_PLACEHOLDER` instead of the real key
2. **GitHub Secrets**: Stores your actual API key securely (encrypted)
3. **GitHub Actions**: When you push code, it:
   - Checks out your code
   - Replaces the placeholder with the secret value
   - Deploys the site with the real API key

## Security Notes

- ✅ Your API key is **never** in your source code
- ✅ The key is only injected during build time
- ⚠️ The deployed site will contain the API key (anyone can view it in the browser)
- 💡 For maximum security, consider using a backend proxy in the future

## Troubleshooting

### Workflow fails
- Check that the secret name is exactly `GEMINI_API_KEY`
- Verify the secret was added correctly in Settings → Secrets

### Site doesn't load
- Check the Actions tab for error messages
- Ensure GitHub Pages is set to use "GitHub Actions" as the source

### API key not working
- Verify the API key value in GitHub Secrets is correct
- Check browser console for errors

## Next Steps

After setup is complete, share this URL with your professor:
**https://ckapl1.github.io/smb-pricing-assistant/**

