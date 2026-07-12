import { getValidAccessToken } from './spotifyAuth';

const BASE = 'https://api.spotify.com/v1';

async function apiFetch(path, options = {}) {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getCurrentUser() {
  return apiFetch('/me');
}

// The old /recommendations endpoint is restricted on newer Spotify apps, so we
// build a "mood playlist" by running plain-text searches against mood-derived
// genre/keyword seeds and merging the results. As of Spotify's Feb 2026 API
// changes, search results are capped at 10 per request (previously up to 50),
// so we pull from more seeds instead of asking for more per seed.
export async function buildMoodTracks(moodProfile, limit = 20) {
  const seeds = moodProfile.searchSeeds;
  const queries = seeds.slice(0, 5);

  const trackMap = new Map();

  for (const seed of queries) {
    try {
      const result = await apiFetch(`/search?q=${encodeURIComponent(seed)}&type=track&limit=10`);
      const items = result?.tracks?.items || [];
      for (const track of items) {
        if (track && !trackMap.has(track.id)) {
          trackMap.set(track.id, track);
        }
      }
    } catch (err) {
      // Log but don't abort — other seed queries may still succeed.
      console.error(`Moodring: search failed for seed "${seed}"`, err);
    }
  }

  // Last-resort fallback: combine all seeds into one looser query.
  if (trackMap.size < 4) {
    try {
      const fallback = await apiFetch(
        `/search?q=${encodeURIComponent(seeds.join(' '))}&type=track&limit=10`
      );
      for (const track of fallback?.tracks?.items || []) {
        if (track && !trackMap.has(track.id)) trackMap.set(track.id, track);
      }
    } catch (err) {
      console.error('Moodring: fallback search failed', err);
    }
  }

  const tracks = Array.from(trackMap.values());
  // Shuffle so repeat generations for the same mood don't return identical order.
  for (let i = tracks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
  }

  return tracks.slice(0, limit);
}

// Spotify removed POST /users/{user_id}/playlists in their Feb 2026 API
// changes — playlists are now created for the current user via /me/playlists,
// with no user ID needed at all.
export async function createPlaylist(title, description) {
  return apiFetch('/me/playlists', {
    method: 'POST',
    body: JSON.stringify({
      name: title,
      description,
      public: false
    })
  });
}

// /playlists/{id}/tracks was renamed to /playlists/{id}/items in the same
// Feb 2026 changes.
export async function addTracksToPlaylist(playlistId, trackUris) {
  return apiFetch(`/playlists/${playlistId}/items`, {
    method: 'POST',
    body: JSON.stringify({ uris: trackUris })
  });
}
