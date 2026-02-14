# Reagvis Labs Pvt. Ltd.

## Deploy to GitHub Pages
- Deployment runs automatically via GitHub Actions on every push to `main`.
- One-time setup in GitHub UI: Settings → Pages → Source: `GitHub Actions`.
- Base path is set for `Code-ConnectPREVIOUS-main`.
- Your site will be available at `https://LakshyaSood123.github.io/Code-ConnectPREVIOUS-main/` after a successful workflow run.
- GitHub Pages is static-only; the Express backend (and any API routes) must be hosted elsewhere.

## SPA Routing Note
- This app uses client-side routing (wouter). GitHub Pages does not support server-side rewrites.
- If you need deep links, use hash-based routing or implement the 404.html SPA fallback technique.
