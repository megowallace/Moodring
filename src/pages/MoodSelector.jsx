import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ColorArc from '../components/ColorArc';
import { getCurrentUser } from '../utils/spotifyApi';
import { getMoodProfile } from '../utils/moodMap';
import { isLoggedIn } from '../utils/spotifyAuth';

export default function MoodSelector() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hoverColor, setHoverColor] = useState(null);
  const [committedColor, setCommittedColor] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/', { replace: true });
      return;
    }
    getCurrentUser()
      .then(setUser)
      .catch((e) => setLoadError(e.message));
  }, [navigate]);

  const moodProfile = committedColor && !isDragging ? getMoodProfile(committedColor) : null;

  const handleGenerate = () => {
    navigate('/playlist', { state: { hex: committedColor } });
  };

  return (
    <div
      className="screen mood-selector"
      style={{ background: hoverColor ? `radial-gradient(circle at 30% 20%, ${hoverColor}40, #0b0b0f 65%)` : undefined }}
    >
      <div className="ambient-layer" aria-hidden="true">
        <div
          className="ambient-blob ambient-blob-1"
          style={{ background: hoverColor ? `${hoverColor}55` : undefined }}
        />
        <div
          className="ambient-blob ambient-blob-2"
          style={{ background: hoverColor ? `${hoverColor}33` : undefined }}
        />
      </div>

      <h2 className="greeting">
        How are you feeling today{user ? `, ${user.display_name}` : ''}?
      </h2>

      <p className={`hint-text ${committedColor ? 'hidden' : ''}`}>select a color</p>

      <div className="arc-wrap">
        <ColorArc
          onHover={(hex) => setHoverColor(hex)}
          onDragStart={() => {
            setIsDragging(true);
            setCommittedColor(null);
          }}
          onCommit={(hex) => {
            setIsDragging(false);
            setCommittedColor(hex);
          }}
        />
      </div>

      <div className={`mood-card ${moodProfile ? 'visible' : ''}`}>
        {moodProfile && (
          <>
            <div className="mood-card-header">
              <span className="mood-card-eyebrow">Today's mood</span>
              <div className="mood-card-icon" style={{ background: committedColor }} />
            </div>
            <p className="mood-card-label">{moodProfile.label}</p>
            <p className="mood-card-descriptor">{moodProfile.descriptor}</p>
            <button className="btn-primary" onClick={handleGenerate}>
              Generate Playlist
            </button>
            <p className="mood-card-hex">hue {committedColor}</p>
          </>
        )}
      </div>

      {loadError && <p className="error-text">{loadError}</p>}
    </div>
  );
}
