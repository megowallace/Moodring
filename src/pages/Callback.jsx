import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCodeForToken } from '../utils/spotifyAuth';

export default function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errParam = params.get('error');

    if (errParam) {
      setError(errParam);
      return;
    }

    if (code) {
      exchangeCodeForToken(code)
        .then(() => navigate('/mood', { replace: true }))
        .catch((e) => setError(e.message));
    }
  }, [navigate]);

  return (
    <div className="screen centered">
      {error ? (
        <div>
          <p>Something went wrong logging in: {error}</p>
          <button className="btn-secondary" onClick={() => navigate('/')}>Back home</button>
        </div>
      ) : (
        <p className="loading-text">Connecting to Spotify…</p>
      )}
    </div>
  );
}
