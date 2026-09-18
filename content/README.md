# Content drop system

## Blogs
Drop a folder or a ZIP into `content/blog/`.

A folder can contain:
- `meta.json` (optional)
- `index.md` or `README.md` (optional)
- `cover.*` (optional)
- any supporting images/files

## Classes
Drop a folder or a ZIP into `content/classes/`.

Recommended class files:
- `meta.json` (optional)
- `index.html` / `style.css` / `script.js` for an editable exercise
- `README.md` for lesson notes
- any assets used by the lesson

The build automatically supplies fallback metadata from folder/file names and Git history when metadata is missing.
