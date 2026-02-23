# Deployment Guide - GitHub Pages

## Quick Start

Your Sequence game has been successfully pushed to GitHub! Follow these steps to enable GitHub Pages:

### Step 1: Access Repository Settings
1. Go to https://github.com/AnishKini007/Sequence-web-game
2. Click on **Settings** (gear icon at the top)

### Step 2: Enable GitHub Pages
1. In the left sidebar, click on **Pages**
2. Under **Source**, select:
   - Branch: **main**
   - Folder: **/ (root)**
3. Click **Save**

### Step 3: Wait for Deployment
- GitHub will take 1-3 minutes to build and deploy your site
- You'll see a blue box saying "Your site is ready to be published at..."
- Once deployed, it will turn green

### Step 4: Access Your Game
Your game will be live at:
**https://anishkini007.github.io/Sequence-web-game/**

## Testing Locally

Before publishing, you can test the game locally:

### Option 1: Simple Python Server
```bash
cd "C:\Users\anish\OneDrive\Desktop\Sequence\Sequence-web-game"
python -m http.server 8000
# Then open: http://localhost:8000
```

### Option 2: Open Directly in Browser
Simply open `index.html` in your browser:
```powershell
Start-Process "C:\Users\anish\OneDrive\Desktop\Sequence\Sequence-web-game\index.html"
```

## Troubleshooting

### Pages Not Showing
- Ensure the branch is set to `main` and folder is `/ (root)`
- Check that `index.html` is in the root of your repository
- Wait a few minutes for GitHub to build the site

### Game Not Working
- Check browser console (F12) for JavaScript errors
- Ensure all files (index.html, styles.css, game.js) are present
- Try a hard refresh (Ctrl + Shift + R)

### Updates Not Appearing
After pushing changes:
```bash
git add .
git commit -m "Update game"
git push origin main
```
Wait 1-3 minutes for GitHub Pages to rebuild.

## Custom Domain (Optional)

If you want to use a custom domain:
1. Go to Settings > Pages
2. Enter your custom domain in the "Custom domain" field
3. Add a CNAME record in your domain's DNS settings pointing to: `anishkini007.github.io`

## Features to Add (Future Enhancements)

- **Sound Effects**: Add audio for card plays and sequence completions
- **Animations**: Smooth chip placement animations
- **Game History**: Track wins/losses
- **AI Opponents**: Single-player mode
- **Online Multiplayer**: Real-time play with WebSockets
- **Save/Load**: Persist game state
- **Mobile Optimization**: Better touch controls

## Support

If you encounter any issues:
1. Check the browser console for errors (F12)
2. Verify all files are present in the repository
3. Ensure GitHub Pages is enabled in Settings

Enjoy your Sequence game! 🎉
