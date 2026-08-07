# First Light — deploy notes

## Files
```
index.html                    the app (single file)
netlify.toml                  build + redirect config
netlify/functions/apod.js     server-side NASA proxy
```

## Connecting the daily image

1. Get a free key at **api.nasa.gov** (takes about a minute — name and email).
2. In Netlify: **Site settings → Environment variables → Add a variable**
   - Key: `NASA_API_KEY`
   - Value: your key
3. Redeploy.

The key stays on Netlify's servers. The browser only ever calls `/api/apod`,
so the key is never in the page source and can't be scraped from devtools.

## Local development

Netlify Functions don't run when you open `index.html` directly — the daily
image panel will show a quiet note instead. Everything else works offline.

To run the function locally:
```
npm i -g netlify-cli
echo "NASA_API_KEY=your_key_here" > .env
echo ".env" >> .gitignore        # never commit this
netlify dev
```

## Copyright note

APOD responses may include a `copyright` field. **Those images are not public
domain** — they're licensed to NASA by third-party photographers. The app shows
the attribution when present and "Public domain · NASA" when absent. Don't strip
that, and don't reuse copyrighted APOD images elsewhere without permission.

## Rate limits

A personal key allows far more than the shared `DEMO_KEY`. The app caches each
day's image in localStorage and clears yesterday's, so it makes at most one
request per day per visitor. A 429 falls back to the last cached image.
