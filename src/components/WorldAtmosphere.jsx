import { keyframes } from '@emotion/react';
import { Box } from '@mui/material';

const floatUp = keyframes`
  0%   { transform: translateY(0) scale(1); opacity: 0; }
  12%  { opacity: var(--peak-op); }
  82%  { opacity: var(--peak-op); }
  100% { transform: translateY(-42px) scale(0.4); opacity: 0; }
`;

const driftMote = keyframes`
  0%   { transform: translate(0, 0); opacity: 0; }
  15%  { opacity: var(--peak-op); }
  85%  { opacity: var(--peak-op); }
  100% { transform: translate(22px, -14px); opacity: 0; }
`;

const spark = keyframes`
  0%, 100% { transform: scale(0); opacity: 0; }
  18%, 78%  { transform: scale(1); opacity: var(--peak-op); }
`;

const emberRise = keyframes`
  0%   { transform: translateY(0) scale(1); opacity: 0; }
  14%  { opacity: var(--peak-op); }
  80%  { opacity: calc(var(--peak-op) * 0.5); }
  100% { transform: translateY(-48px) scale(0.2); opacity: 0; }
`;

const frostDrift = keyframes`
  0%   { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  20%  { opacity: var(--peak-op); }
  78%  { opacity: var(--peak-op); }
  100% { transform: translate(-10px, 14px) rotate(60deg); opacity: 0; }
`;

const WORLDS = {
  umihotaru: [
    { anim: floatUp,   size: 4,   left: '13%', bottom: '16%', dur: '5.4s', delay: '0s',     color: '#0d9488', op: 0.55, blur: 2   },
    { anim: floatUp,   size: 3,   left: '32%', bottom: '26%', dur: '7.1s', delay: '-2.2s',  color: '#0ea5e9', op: 0.5,  blur: 1.5 },
    { anim: floatUp,   size: 5,   left: '57%', bottom: '10%', dur: '4.8s', delay: '-1.4s',  color: '#0d9488', op: 0.6,  blur: 2.5 },
    { anim: floatUp,   size: 3,   left: '78%', bottom: '36%', dur: '6.6s', delay: '-3.8s',  color: '#2dd4bf', op: 0.45, blur: 1.5 },
    { anim: floatUp,   size: 2,   left: '46%', bottom: '52%', dur: '5.9s', delay: '-0.9s',  color: '#0ea5e9', op: 0.5,  blur: 1   },
  ],
  enlil: [
    { anim: driftMote, size: 2,   left: '11%', top: '62%', dur: '8.2s',  delay: '0s',    color: '#d97706', op: 0.38 },
    { anim: driftMote, size: 1.5, left: '28%', top: '72%', dur: '10s',   delay: '-2.6s', color: '#b45309', op: 0.32 },
    { anim: driftMote, size: 2.5, left: '44%', top: '52%', dur: '7.4s',  delay: '-1.9s', color: '#fbbf24', op: 0.42 },
    { anim: driftMote, size: 1.5, left: '62%', top: '67%', dur: '9.1s',  delay: '-4.4s', color: '#d97706', op: 0.35 },
    { anim: driftMote, size: 2,   left: '80%', top: '74%', dur: '8.6s',  delay: '-1.1s', color: '#b45309', op: 0.38 },
    { anim: driftMote, size: 1.5, left: '53%', top: '84%', dur: '11s',   delay: '-3.3s', color: '#fbbf24', op: 0.3  },
  ],
  taranis: [
    { anim: spark,     size: 2,   left: '18%', top: '36%', dur: '3.4s', delay: '0s',    color: '#c084fc', op: 0.65 },
    { anim: spark,     size: 1.5, left: '42%', top: '20%', dur: '2.9s', delay: '-1.2s', color: '#a78bfa', op: 0.58 },
    { anim: spark,     size: 3,   left: '68%', top: '50%', dur: '4.2s', delay: '-2.4s', color: '#8b5cf6', op: 0.7  },
    { anim: spark,     size: 1.5, left: '32%', top: '60%', dur: '3.8s', delay: '-0.8s', color: '#c084fc', op: 0.6  },
    { anim: spark,     size: 2,   left: '82%', top: '28%', dur: '2.6s', delay: '-3.6s', color: '#a78bfa', op: 0.55 },
  ],
  janus: [
    { anim: emberRise, size: 2,   left: '8%',  bottom: '16%', dur: '3.9s', delay: '0s',    color: '#ef4444', op: 0.55 },
    { anim: emberRise, size: 1.5, left: '20%', bottom: '26%', dur: '4.7s', delay: '-1.7s', color: '#f97316', op: 0.5  },
    { anim: emberRise, size: 2,   left: '36%', bottom: '10%', dur: '3.3s', delay: '-3.1s', color: '#ef4444', op: 0.6  },
    { anim: frostDrift,size: 2,   left: '60%', top: '20%',    dur: '6.5s', delay: '-0.4s', color: '#93c5fd', op: 0.45 },
    { anim: frostDrift,size: 1.5, left: '74%', top: '38%',    dur: '7.4s', delay: '-3.4s', color: '#bfdbfe', op: 0.4  },
    { anim: frostDrift,size: 2.5, left: '86%', top: '26%',    dur: '6.1s', delay: '-1.9s', color: '#60a5fa', op: 0.5  },
  ],
};

export default function WorldAtmosphere({ worldId }) {
  const particles = WORLDS[worldId] ?? WORLDS.umihotaru;

  return (
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
      {particles.map((p, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: p.left,
            right: p.right,
            top: p.top,
            bottom: p.bottom,
            borderRadius: '50%',
            background: p.color,
            filter: p.blur ? `blur(${p.blur}px)` : undefined,
            '--peak-op': p.op,
            animation: `${p.anim} ${p.dur} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}
    </Box>
  );
}
