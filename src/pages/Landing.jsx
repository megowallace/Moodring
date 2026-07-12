import { redirectToSpotifyLogin } from '../utils/spotifyAuth';

export default function Landing() {
  return (
    <div className="screen landing">
      <div className="aurora-layer" aria-hidden="true">
        <div className="aurora-blob aurora-blob-teal" />
        <div className="aurora-blob aurora-blob-violet" />
        <div className="aurora-blob aurora-blob-coral" />
      </div>

      <div className="landing-card">
        <svg className="landing-arch" viewBox="0 0 520 300" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="archGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6ee7c9" />
              <stop offset="20%" stopColor="#9fd6f0" />
              <stop offset="40%" stopColor="#f4a6c1" />
              <stop offset="55%" stopColor="#f0806b" />
              <stop offset="70%" stopColor="#f7c948" />
              <stop offset="100%" stopColor="#f4a6c1" />
            </linearGradient>
          </defs>
          <path
            d="M 40 260 A 220 220 0 0 1 480 260"
            fill="none"
            stroke="url(#archGradient)"
            strokeWidth="46"
            strokeLinecap="round"
          />
        </svg>

        <div className="landing-content">
          <h1 className="wordmark">Moodring</h1>
          <p className="tagline">a playlist that matches whatever color you're feeling</p>
          <button className="btn-spotify" onClick={redirectToSpotifyLogin}>
            <SpotifyIcon />
            Log in with Spotify
          </button>
        </div>
      </div>
    </div>
  );
}

function SpotifyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.32-1.32 9.6-.66 13.32 1.62.361.181.54.78.42 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.301.421-1.02.599-1.56.3z"/>
    </svg>
  );
}
