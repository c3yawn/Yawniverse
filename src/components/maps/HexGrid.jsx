import { useMemo, useState } from 'react';
import { Box, Typography, TextField, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const HEX_SIZE = 36;
const SQRT3 = Math.sqrt(3);
const COLS = 8;
const ROWS = 10;
const PAD = HEX_SIZE;

// Offset coordinates (odd rows shift right)
function hexCenter(col, row) {
  const x = PAD + HEX_SIZE * SQRT3 * (col + (row % 2 === 1 ? 0.5 : 0));
  const y = PAD + HEX_SIZE * 1.5 * row;
  return { x, y };
}

function hexPoints(cx, cy) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const deg = 60 * i - 30;
    const rad = (Math.PI / 180) * deg;
    pts.push(`${(cx + HEX_SIZE * Math.cos(rad)).toFixed(2)},${(cy + HEX_SIZE * Math.sin(rad)).toFixed(2)}`);
  }
  return pts.join(' ');
}

const VB_W = PAD * 2 + HEX_SIZE * SQRT3 * (COLS - 1 + 0.5) + HEX_SIZE * SQRT3;
const VB_H = PAD * 2 + HEX_SIZE * (1.5 * (ROWS - 1) + 2);

// Deterministic star field — seeded so it doesn't shift on re-render
const BG_STARS = (() => {
  const stars = [];
  let s = 0xdeadbeef;
  const rand = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0xffffffff; };
  for (let i = 0; i < 220; i++) {
    stars.push({ x: rand() * VB_W, y: rand() * VB_H, r: rand() * 1.1 + 0.3, o: rand() * 0.65 + 0.25 });
  }
  return stars;
})();

const EMPTY_HEX_STROKE = 'rgba(14,165,233,0.14)';
const OCCUPIED_HEX_STROKE = 'rgba(124,58,237,0.45)';
const HOVER_HEX_STROKE = 'rgba(56,189,248,0.55)';
const SELECTED_HEX_STROKE = 'rgba(192,132,252,0.9)';

function hexKey(col, row) { return `${col}:${row}`; }

export default function HexGrid({ data, isGM, onUpdate }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({});

  const hexMap = useMemo(() => {
    const map = {};
    (data?.hexes ?? []).forEach((h) => { map[hexKey(h.col, h.row)] = h; });
    return map;
  }, [data]);

  const routes = data?.routes ?? [];

  const handleHexClick = (col, row) => {
    const key = hexKey(col, row);
    if (selected === key) {
      setSelected(null);
      setEditForm({});
    } else {
      setSelected(key);
      const existing = hexMap[key] ?? { col, row, name: '', tags: '', faction: '' };
      setEditForm(existing);
    }
  };

  const handleSave = async () => {
    const hexes = [...(data?.hexes ?? []).filter((h) => hexKey(h.col, h.row) !== selected)];
    if (editForm.name?.trim()) hexes.push({ ...editForm });
    await onUpdate?.({ map_type: 'hex-grid', data: { ...(data ?? {}), hexes } });
    setSelected(null);
    setEditForm({});
  };

  const handleClear = async () => {
    const hexes = (data?.hexes ?? []).filter((h) => hexKey(h.col, h.row) !== selected);
    await onUpdate?.({ map_type: 'hex-grid', data: { ...(data ?? {}), hexes } });
    setSelected(null);
    setEditForm({});
  };

  const selectedHexData = selected ? hexMap[selected] : null;

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#010106' }}>
      <svg
        viewBox={`0 0 ${VB_W.toFixed(0)} ${VB_H.toFixed(0)}`}
        style={{ width: '100%', height: '100%' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Star glow gradient */}
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="35%" stopColor="#e2e8f0" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </radialGradient>
          {/* Subtle nebula hint */}
          <radialGradient id="nebula1" cx="30%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nebula2" cx="70%" cy="65%" r="45%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </radialGradient>
          {/* Hex selected glow filter */}
          <filter id="hexGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width={VB_W} height={VB_H} fill="#010106" />
        <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#nebula1)" />
        <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#nebula2)" />

        {/* Star field */}
        {BG_STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.o} />
        ))}

        {/* Navigation routes */}
        {routes.map((r, i) => {
          const a = hexCenter(r.from[0], r.from[1]);
          const b = hexCenter(r.to[0], r.to[1]);
          return (
            <line
              key={i}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="rgba(56,189,248,0.35)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
          );
        })}

        {/* Hex grid */}
        {Array.from({ length: ROWS }, (_, row) =>
          Array.from({ length: COLS }, (_, col) => {
            const { x, y } = hexCenter(col, row);
            const key = hexKey(col, row);
            const hex = hexMap[key];
            const isHovered = hovered === key;
            const isSelected = selected === key;

            let stroke = hex ? OCCUPIED_HEX_STROKE : EMPTY_HEX_STROKE;
            if (isHovered) stroke = HOVER_HEX_STROKE;
            if (isSelected) stroke = SELECTED_HEX_STROKE;

            return (
              <g
                key={key}
                onClick={() => handleHexClick(col, row)}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: isGM ? 'pointer' : hex ? 'pointer' : 'default' }}
              >
                <polygon
                  points={hexPoints(x, y)}
                  fill={isSelected ? 'rgba(124,58,237,0.12)' : isHovered ? 'rgba(56,189,248,0.06)' : 'rgba(1,1,6,0.7)'}
                  stroke={stroke}
                  strokeWidth={isSelected ? 1.8 : 1}
                  filter={isSelected ? 'url(#hexGlow)' : undefined}
                />

                {/* Coordinate label — very subtle, for GM reference */}
                <text
                  x={x - HEX_SIZE * 0.72}
                  y={y - HEX_SIZE * 0.62}
                  fontSize="5"
                  fill="rgba(56,189,248,0.18)"
                  fontFamily="monospace"
                >
                  {String(col + 1).padStart(2, '0')}{String(row + 1).padStart(2, '0')}
                </text>

                {/* Star system */}
                {hex?.name && (
                  <>
                    {/* Glow halo */}
                    <circle cx={x} cy={y - 4} r={9} fill="url(#starGlow)" opacity={0.5} />
                    {/* Star core */}
                    <circle cx={x} cy={y - 4} r={2.8} fill="white" opacity={0.95} />
                    {/* System name */}
                    <text
                      x={x}
                      y={y + 14}
                      textAnchor="middle"
                      fontSize="7.5"
                      fill="#e2e8f0"
                      fontFamily="Raleway, sans-serif"
                      fontWeight="600"
                      letterSpacing="0.04em"
                    >
                      {hex.name}
                    </text>
                    {/* Faction tag if set */}
                    {hex.faction && (
                      <text
                        x={x}
                        y={y + 23}
                        textAnchor="middle"
                        fontSize="6"
                        fill="rgba(167,139,250,0.7)"
                        fontFamily="Raleway, sans-serif"
                      >
                        {hex.faction}
                      </text>
                    )}
                  </>
                )}

                {/* GM hover hint on empty hexes */}
                {isGM && !hex?.name && isHovered && (
                  <text
                    x={x} y={y + 4}
                    textAnchor="middle"
                    fontSize="18"
                    fill="rgba(56,189,248,0.25)"
                    fontFamily="sans-serif"
                  >
                    +
                  </text>
                )}
              </g>
            );
          })
        )}
      </svg>

      {/* Info / edit panel */}
      {selected && (
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 240,
            background: 'rgba(6,4,20,0.96)',
            backdropFilter: 'blur(12px)',
            borderLeft: '1px solid rgba(124,58,237,0.25)',
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            gap: 1.5,
            overflowY: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              sx={{
                fontFamily: '"Cinzel", serif',
                fontSize: '0.6rem',
                letterSpacing: '0.18em',
                color: 'rgba(124,58,237,0.8)',
                textTransform: 'uppercase',
              }}
            >
              {isGM ? 'Edit System' : 'System Info'}
            </Typography>
            <IconButton size="small" onClick={() => setSelected(null)} sx={{ color: 'text.secondary', p: 0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {isGM ? (
            <>
              <TextField
                label="System Name"
                size="small"
                fullWidth
                value={editForm.name ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Avernus Prime"
              />
              <TextField
                label="Faction"
                size="small"
                fullWidth
                value={editForm.faction ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, faction: e.target.value }))}
                placeholder="e.g. Perimeter Agency"
              />
              <TextField
                label="Tags"
                size="small"
                fullWidth
                value={editForm.tags ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="Hostile Space, Alien Ruins…"
              />
              <TextField
                label="Notes"
                size="small"
                fullWidth
                multiline
                minRows={3}
                value={editForm.notes ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                <Button
                  fullWidth
                  size="small"
                  variant="contained"
                  onClick={handleSave}
                  sx={{
                    background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
                    fontFamily: '"Cinzel", serif',
                    fontSize: '0.6rem',
                    letterSpacing: '0.1em',
                  }}
                >
                  Save
                </Button>
                {selectedHexData && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleClear}
                    sx={{ borderColor: 'rgba(239,68,68,0.4)', color: '#f87171', fontSize: '0.6rem', letterSpacing: '0.08em' }}
                  >
                    Clear
                  </Button>
                )}
              </Box>
            </>
          ) : (
            <>
              {selectedHexData ? (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
                    {selectedHexData.name}
                  </Typography>
                  {selectedHexData.faction && (
                    <Typography variant="caption" sx={{ color: '#a78bfa' }}>{selectedHexData.faction}</Typography>
                  )}
                  {selectedHexData.tags && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{selectedHexData.tags}</Typography>
                  )}
                  {selectedHexData.notes && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, mt: 1 }}>
                      {selectedHexData.notes}
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Empty sector hex.</Typography>
              )}
            </>
          )}
        </Box>
      )}

      {/* GM instruction when map is empty */}
      {isGM && !data?.hexes?.length && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(6,4,20,0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 1,
            px: 2,
            py: 1,
          }}
        >
          <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.7)', letterSpacing: '0.06em' }}>
            Click any hex to add a star system
          </Typography>
        </Box>
      )}
    </Box>
  );
}
