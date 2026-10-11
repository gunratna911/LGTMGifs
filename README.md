# LGTMGifs

**The fastest way to say "Looks Good To Me" on a pull request.**

A curated, searchable gallery of LGTM/approval GIFs — static site, no backend, no frameworks. Find the perfect GIF, copy the markdown, paste it into your PR review.

🌐 **Live site:** [gunratna911.github.io/LGTMGifs](https://gunratna911.github.io/LGTMGifs/)

---

## Features

- 🔍 **Search** — filter by title, tags, category, or attribution
- 🏷️ **Tag filters** — AND-filter by popular tags (lgtm, ship-it, merge, approved…)
- 📋 **One-click copy** — Copy Markdown, Copy URL, or Copy HTML
- 🎲 **Random GIF** — pick a random GIF from your filtered set
- ⭐ **Favorites** — star GIFs, stored in localStorage
- 🔗 **Deep links** — share `?q=`, `?tag=`, `?category=`, `?gif=slug`
- ⌨️ **Keyboard shortcuts** — `/` to focus search, `Escape` to clear
- 📱 **Responsive** — works on mobile, tablet, desktop
- ♿ **Accessible** — all buttons labelled, keyboard navigable, alt text on images

## How it works

GIFs are **not hosted here**. The file `gifs.json` is a catalog of metadata + public CDN URLs (Giphy, Tenor). The site hotlinks images from their original CDNs.

## Run locally

No build step needed. Just open `index.html`:

```bash
# Option 1: Open directly
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux

# Option 2: Local server (for fetch to work)
npx serve .
# or
python -m http.server 8000
```

> **Note:** If you open `index.html` as a `file://` URL, the `fetch('gifs.json')` call may be blocked by CORS. Use a local server instead.

## Submit a GIF

Anyone can suggest a GIF:

1. Go to [**Submit a GIF**](https://github.com/gunratna911/LGTMGifs/issues/new?template=submit-gif.yml)
2. Fill in: title, direct GIF URL, category, tags
3. Submit the issue (auto-labelled `gif-submission`)

### How approval works

1. A maintainer reviews the submission issue
2. Checks: the GIF URL loads, it's work-appropriate, and it's LGTM-adjacent
3. Adds the **`approved`** label to the issue
4. The [approve-gif workflow](.github/workflows/approve-gif.yml) automatically:
   - Parses the issue fields
   - Validates the data (rejects empty/invalid entries)
   - Appends a new entry to `gifs.json`
   - Commits as `github-actions[bot]`
   - Comments with success + direct link
   - Closes the issue
5. GitHub Pages re-deploys and the GIF appears on the site

### Add a GIF manually (fallback)

If you prefer to skip the issue workflow:

1. Fork the repo
2. Edit `gifs.json` — add an entry at the end:
   ```json
   {
     "id": "my-new-gif",
     "title": "My New GIF",
     "url": "https://media.giphy.com/media/XXXXX/giphy.gif",
     "category": "Reactions",
     "tags": ["lgtm", "approved", "thumbs-up"],
     "source": "giphy",
     "attribution": "via Giphy",
     "added": "2026-10-11"
   }
   ```
3. Open a pull request

### GIF entry schema

| Field         | Type     | Required | Description                              |
|---------------|----------|----------|------------------------------------------|
| `id`          | string   | ✅       | Unique slug (kebab-case)                 |
| `title`       | string   | ✅       | Display name                             |
| `url`         | string   | ✅       | Direct GIF image URL (https)             |
| `category`    | string   | ✅       | One of: Reactions, Funny, Work, Love, Celebrations, Animals, Movies, Other |
| `tags`        | string[] | ✅       | Lowercase keywords                       |
| `source`      | string   | ✅       | `giphy`, `tenor`, or `other`             |
| `attribution` | string   | optional | Credit line                              |
| `added`       | string   | ✅       | ISO date (YYYY-MM-DD)                    |

## Tech stack

- **HTML + CSS + vanilla JS** — zero dependencies
- **GitHub Pages** — static hosting
- **GitHub Actions** — automated approval workflow
- **GitHub Issues** — submission intake

## License

GIFs belong to their original creators and are served from Giphy/Tenor CDNs. This repository only contains metadata (URLs, titles, tags). The site code is MIT licensed.
