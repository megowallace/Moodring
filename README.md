# Moodring

Pick a color, get a Spotify playlist that matches your mood. Built with React + Vite, Spotify OAuth (PKCE), and the Spotify Web API.

## How it works

1. **Landing** — Moodring logo, tagline, "Log in with Spotify" button.
2. **Login** — Spotify's own OAuth screen (PKCE flow, no backend/server secret needed).
3. **Mood Selector** — greets you by name, shows a color arc. Hover/drag updates the background color live; releasing/clicking commits a color, which reveals the mood label + "Generate Playlist" button.
4. **Playlist** — generates a randomized, mood-flavored playlist title, creates a real playlist on your Spotify account seeded from mood-mapped genres/keywords, and shows a 4-track preview plus a "Listen on Spotify" link.

Every hex code maps to a mood profile (hue → emotional "zone", saturation → energy, lightness → depth), so different colors feel meaningfully different, and playlist titles are randomized per-generation so the same mood never gives you the same name twice.

## Setup

1. Create a Spotify app at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. In the app's settings, add this Redirect URI: `http://127.0.0.1:5173/callback`
3. Copy `.env.example` to `.env` and fill in your Client ID:
   ```
   cp .env.example .env
   ```
4. Install dependencies and run:
   ```
   npm install
   npm run dev
   ```
5. Open `http://127.0.0.1:5173`

No client secret is needed — this uses Authorization Code + PKCE, which is safe for a pure front-end app.

## Notes / things to extend

- Track discovery uses the Search API (genre + keyword tagged queries) rather than the old `/recommendations` endpoint, since that endpoint is restricted for newer Spotify developer apps.
- Playlists are created privately on your account (`playlist-modify-private` scope). Flip `public: false` in `src/utils/spotifyApi.js` if you want them public.
- The mood-mapping logic lives in `src/utils/moodMap.js` — easy to extend with more hue zones or swap in a different genre taxonomy.
- Title generation is in `src/utils/titleGenerator.js` — add more word banks / sentence shapes to keep it fresh.
- Nothing here calls an AI/LLM API — moods and titles are procedurally generated from the color itself plus randomness, so it works with just a Spotify Client ID.

## Deploying

This is a static Vite app — it builds to `dist/` and can be hosted on Vercel, Netlify, GitHub Pages, etc. Just remember to add your production URL as a Redirect URI in the Spotify dashboard and update `VITE_REDIRECT_URI`.
