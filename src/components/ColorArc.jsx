import { useRef, useState, useCallback } from 'react';

// Single-path arc with a real SVG gradient stroke (smooth, no banding), a
// continuous floating-point hue mapping (no stepping), and a glowing marker
// that follows the pointer for visual feedback while dragging.

const RADIUS = 150;
const STROKE = 56;
const CENTER = { x: 200, y: 200 };
const GRADIENT_STOPS = 96;

function hslToHexLocal(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function pointToAngle(x, y) {
  const dx = x - CENTER.x;
  const dy = y - CENTER.y;
  let angle = Math.atan2(-dy, dx) * (180 / Math.PI); // range (-180, 180]

  // Any point below the arc's horizontal baseline (dy > 0) produces a
  // negative raw angle here — but negatives happen on BOTH the left side
  // (dx < 0) and the right side (dx > 0). The old code collapsed every
  // negative angle to 0, which silently forced every below-the-line click
  // — including ones near the left tip — to resolve as the far right end.
  // Instead, snap to whichever endpoint (0 or 180) actually matches the
  // side of center the click landed on.
  if (angle < 0) {
    angle = dx < 0 ? 180 : 0;
  }
  if (angle > 180) angle = 180;
  return 180 - angle;
}

// Sweep only 0-330 degrees of hue (not the full 360) — since 0 and 360 are
// literally the same color, mapping the arc's full width to 0-360 made both
// ends identical. Stopping at 330 keeps the endpoints visually distinct
// (pure red on the left, red-violet on the right) while still covering
// effectively the whole usable spectrum.
const MAX_HUE = 330;

function angleToHex(angleDeg) {
  const hue = (angleDeg / 180) * MAX_HUE;
  return hslToHexLocal(hue, 75, 55);
}

function angleToPoint(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER.x - RADIUS * Math.cos(rad),
    y: CENTER.y - RADIUS * Math.sin(rad)
  };
}

export default function ColorArc({ onHover, onCommit, onDragStart }) {
  const svgRef = useRef(null);
  const isDragging = useRef(false);
  const [markerAngle, setMarkerAngle] = useState(null);
  const [markerColor, setMarkerColor] = useState(null);

  const handlePointer = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 236 / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const angle = pointToAngle(x, y);
    const hex = angleToHex(angle);
    setMarkerAngle(angle);
    setMarkerColor(hex);
    return hex;
  }, []);

  const onMove = (e) => {
    if (!isDragging.current) return;
    const hex = handlePointer(e.clientX, e.clientY);
    if (hex) onHover(hex);
  };

  const onDown = (e) => {
    isDragging.current = true;
    if (onDragStart) onDragStart();
    const hex = handlePointer(e.clientX, e.clientY);
    if (hex) onHover(hex);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const onUp = (e) => {
    isDragging.current = false;
    const hex = handlePointer(e.clientX, e.clientY);
    if (hex) onCommit(hex);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  };

  const toRad = (deg) => (deg * Math.PI) / 180;
  const startA = toRad(180);
  const endA = toRad(0);
  const x1 = CENTER.x + RADIUS * Math.cos(startA);
  const y1 = CENTER.y - RADIUS * Math.sin(startA);
  const x2 = CENTER.x + RADIUS * Math.cos(endA);
  const y2 = CENTER.y - RADIUS * Math.sin(endA);

  const stops = [];
  for (let i = 0; i <= GRADIENT_STOPS; i++) {
    const t = i / GRADIENT_STOPS;
    const hue = t * MAX_HUE;
    stops.push(
      <stop key={i} offset={`${t * 100}%`} stopColor={hslToHexLocal(hue, 75, 55)} />
    );
  }

  const markerPoint = markerAngle !== null ? angleToPoint(markerAngle) : null;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 400 236"
      className="color-arc"
      onPointerDown={onDown}
      role="slider"
      aria-label="Mood color selector"
    >
      <defs>
        <linearGradient
          id="arcRainbow"
          gradientUnits="userSpaceOnUse"
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
        >
          {stops}
        </linearGradient>
        <filter id="markerGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={`M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2}`}
        stroke="url(#arcRainbow)"
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
      />
      {markerPoint && (
        <circle
          cx={markerPoint.x}
          cy={markerPoint.y}
          r="16"
          fill={markerColor}
          stroke="#ffffff"
          strokeWidth="3"
          filter="url(#markerGlow)"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </svg>
  );
}
