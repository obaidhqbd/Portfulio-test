# Mohammed Obaidul Hoque — Portfolio Platform

A GitHub-driven personal portfolio + learning platform + project library + browser IDE.

## Information architecture

- / — branded portfolio homepage
- /classes/ — learning system
- /classes/<slug>/ — class overview, lessons, tasks and project files
- /blocks/ — reusable Code Blocks library
- /blocks/<slug>/ — block details and connected workspace
- /blog/ — Markdown-driven notes
- /workspace/?kind=<classes|blocks>&slug=<slug> — multi-file browser coding environment

## Content automation

Add content without editing website HTML:

- content/classes/<project>/
- content/blocks/<project>/
- content/blog/<post>.md

Project folders may contain index.html, style.css, script.js, assets/, README.md, meta.json, and any other required files.

When meta.json is missing or incomplete, the build derives safe fallback metadata from the folder name, README and project structure.

## Protected class packages

Set the GitHub Actions secret CLASS_PACKAGE_PASSWORD to encrypt class ZIP packages during the Pages build. The browser asks for that password before decrypting a package.

This is content protection for a static GitHub Pages site, not server-side authentication. The password is never written into frontend source.

The Pages build now fails if class packages exist and CLASS_PACKAGE_PASSWORD is missing, so it cannot silently publish unencrypted ZIPs. This does not hide the original content committed under content/classes: if those files must be private, keep them in a private repository and do not publish them here. Anyone with access to a public repository can read its committed source.

## Local commands

npm run check
npm run build
npm test

## Deployment

Push to main. GitHub Actions validates content, builds pages and project packages, runs regression tests, uploads the dist artifact and deploys GitHub Pages.
