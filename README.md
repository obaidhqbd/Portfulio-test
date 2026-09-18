# Mohammed Obaidul Hoque — Portfolio + Learning Workspace

Static, GitHub Pages–first portfolio with an automated blog/content pipeline, class workspaces, task progress and encrypted class packages.

## Stack
- GitHub Pages + GitHub Actions
- Node.js 24 LTS build pipeline
- Vanilla HTML/CSS/JS for a tiny runtime and no frontend framework dependency
- Web Crypto API for browser-side class-package unlocking
- Progressive enhancement with IntersectionObserver, View Transitions-friendly structure, native sandboxed iframe previews and service-worker caching

## Content workflow

### Blog
Upload a folder or ZIP to `content/blog/`.

Supported optional files:
- `meta.json`
- `index.md` / `README.md`
- `cover.*`
- additional assets

### Classes
Upload a folder or ZIP to `content/classes/`.

Recommended files:
- `meta.json`
- `index.html`
- `style.css`
- `script.js`
- `README.md`
- additional assets

### Metadata fallback
No `meta.json` is required. The build derives title, description, category and timestamps from file names, Markdown and Git history.

## Student access
Set repository secret `CLASS_PACKAGE_PASSWORD` before deploying. GitHub Actions uses the secret only during the build to encrypt the class ZIP. The deployed website never receives the secret. Students enter the same password in the browser to decrypt their package locally.

Important: this is content protection, not user authentication. Anyone who knows the password can unlock the package. GitHub Pages itself is public and should not be treated as a server-side password gate.

## Local preview
`npm run build`

For a local class package, the build falls back to `demo-student-password` when `CLASS_PACKAGE_PASSWORD` is not set. This fallback is disabled in CI.

`npm run dev`

## Deployment
1. Push this repository to GitHub.
2. Settings → Pages → Source: GitHub Actions.
3. Add `CLASS_PACKAGE_PASSWORD` under Settings → Secrets and variables → Actions.
4. Update social/contact fields in `site.config.json`.
5. Upload new blog/class folders or ZIPs; the workflow rebuilds and deploys automatically.
