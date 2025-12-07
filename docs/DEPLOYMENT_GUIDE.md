# Deployment Guide for Christmas Gift Tracker

## Quick Start
1. **Initialize Git**: `git init` (Already done)
2. **Commit Changes**: `git add .` then `git commit -m "Initial commit"`
3. **Push to GitHub**:
   ```bash
   git remote add origin <your-repo-url>
   git branch -M main
   git push -u origin main
   ```
4. **Enable Pages**:
   - Go to Repository Settings on GitHub
   - Navigate to "Pages" sidebar item
   - Under "Source", select "Deploy from a branch"
   - Select `main` branch and `/ (root)` folder
   - Save

## Troubleshooting

### Styles Not Loading
- Ensure `css/styles.css` exists.
- Check Console for 404 errors.
- Verify `index.html` link tag: `<link rel="stylesheet" href="css/styles.css">`

### JavaScript Errors
- Open DevTools (F12) -> Console.
- Check for errors.
- Ensure `js/app.js` is loaded correctly.

### 404 on Refresh
- GitHub Pages is static. If you add routing later, you might need a 404 hack. For now, it's a single page app, so this shouldn't be an issue.

## Optimization Tips
- **Images**: Run images through [ImageOptim](https://imageoptim.com/) or similar.
- **Minification**: For production, consider using a bundler (Vite/Webpack) to minify CSS/JS.
- **Caching**: GitHub Pages handles some caching, but file fingerprinting (e.g. `styles.ah32kf.css`) helps invalidation in complex setups.

## Git Workflow
- Create feature branches: `git checkout -b feature/my-cool-feature`
- Commit often: `git commit -m "feat: added snow"`
- Push and PR: `git push origin feature/my-cool-feature` -> Create Pull Request.
