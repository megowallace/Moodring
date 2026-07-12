import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildMoodTracks, createPlaylist, addTracksToPlaylist } from '../utils/spotifyApi';
import { getMoodProfile } from '../utils/moodMap';
import { generatePlaylistTitle } from '../utils/titleGenerator';

export default function Playlist() {
  const location = useLocation();
  const navigate = useNavigate();
  const hex = location.state?.hex;

  const [status, setStatus] = useState('loading');
  const [title, setTitle] = useState('');
  const [tracks, setTracks] = useState([]);
  const [playlistUrl, setPlaylistUrl] = useState(null);
  const [error, setError] = useState(null);
  const built = useRef(false);

  useEffect(() => {
    if (!hex) {
      navigate('/mood', { replace: true });
      return;
    }
    if (built.current) return;
    built.current = true;

    const moodProfile = getMoodProfile(hex);
    const generatedTitle = generatePlaylistTitle(moodProfile);
    setTitle(generatedTitle);

    (async () => {
      try {
        const foundTracks = await buildMoodTracks(moodProfile, 20);

        if (foundTracks.length === 0) {
          setError('Could not find tracks for this mood. Try a different color.');
          setStatus('error');
          return;
        }

        setTracks(foundTracks);

        const playlist = await createPlaylist(
          generatedTitle,
          `A Moodring playlist generated from ${hex} — ${moodProfile.label}, ${moodProfile.descriptor}.`
        );
        await addTracksToPlaylist(
          playlist.id,
          foundTracks.map((t) => t.uri)
        );
        setPlaylistUrl(playlist.external_urls.spotify);
        setStatus('done');
      } catch (e) {
        setError(e.message);
        setStatus('error');
      }
    })();
  }, [hex, navigate]);

  return (
    <div
      className="screen playlist-screen"
      style={hex ? { background: `radial-gradient(circle at 50% 15%, ${hex}30, #0b0b0f 70%)` } : undefined}
    >
      <div className="ambient-layer" aria-hidden="true">
        <div className="ambient-blob ambient-blob-1" style={{ background: hex ? `${hex}55` : undefined }} />
        <div className="ambient-blob ambient-blob-2" style={{ background: hex ? `${hex}33` : undefined }} />
      </div>

      {status === 'loading' && <p className="loading-text">mixing your playlist…</p>}

      {status === 'error' && (
        <div>
          <p className="error-text">{error}</p>
          <button className="btn-secondary" onClick={() => navigate('/mood')}>Try another color</button>
        </div>
      )}

      {status === 'done' && (
        <div className="playlist-result">
          <div className="playlist-swatch" style={{ background: hex, boxShadow: `0 0 40px ${hex}80` }} />
          <p className="playlist-eyebrow">Give this a listen</p>
          <h2 className="playlist-title">{title}</h2>
          <div className="track-preview">
            {tracks.slice(0, 4).map((track, i) => (
              <div
                className="track-row"
                key={track.id}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {track.album?.images?.[2] && (
                  <img src={track.album.images[2].url} alt="" className="track-art" />
                )}
                <div className="track-meta">
                  <p className="track-name">{track.name}</p>
                  <p className="track-artist">{track.artists.map((a) => a.name).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
          <a
            className="btn-spotify"
            href={playlistUrl}
            target="_blank"
            rel="noreferrer"
            style={{ boxShadow: `0 0 30px ${hex}40` }}
          >
            Listen on Spotify
          </a>
          <button className="btn-secondary" onClick={() => navigate('/mood')}>
            Pick another mood
          </button>
        </div>
      )}
    </div>
  );
}
