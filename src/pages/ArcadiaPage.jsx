import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button } from '@mui/material';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import NebulaBackground from '../components/NebulaBackground';

const WORLD_ORDER = ['umihotaru', 'enlil', 'taranis', 'janus'];

const WORLD_CONFIG = {
  umihotaru: {
    icon: 'images/umihotaru_icon_v2_transparent.png',
    glow: 'rgba(13, 148, 136, 0.6)',
    accent: '#0d9488',
  },
  enlil: {
    icon: 'images/enlil_icon_transparent.png',
    glow: 'rgba(217, 119, 6, 0.6)',
    accent: '#f59e0b',
  },
  taranis: {
    icon: 'images/taranis_icon_transparent.png',
    glow: 'rgba(124, 58, 237, 0.6)',
    accent: '#a78bfa',
  },
  janus: {
    icon: 'images/janus_icon_transparent.png',
    glow: 'rgba(127, 29, 29, 0.5)',
    accent: '#ef4444',
  },
};

function PlanetSprite({ worldId, world, locked, unlockHint }) {
  const navigate = useNavigate();
  const config = WORLD_CONFIG[worldId] ?? WORLD_CONFIG.umihotaru;

  return (
    <Box
      onClick={() => !locked && navigate(`/arcadia/world/${worldId}`)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        cursor: locked ? 'default' : 'pointer',
        opacity: locked ? 0.35 : 1,
        transition: 'transform 0.22s ease, opacity 0.22s ease',
        '&:hover': locked ? {} : { transform: 'translateY(-5px)' },
      }}
    >
      <Box
        sx={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          overflow: 'hidden',
          filter: locked
            ? 'grayscale(1) brightness(0.3)'
            : `drop-shadow(0 0 14px ${config.glow})`,
          transition: 'filter 0.25s ease',
          '&:hover': locked ? {} : {
            filter: `drop-shadow(0 0 26px ${config.glow})`,
          },
        }}
      >
        {locked ? (
          <Box sx={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 40% 35%, #1e293b, #0f172a)' }} />
        ) : (
          <Box
            component="img"
            src={`${import.meta.env.BASE_URL}${config.icon}`}
            alt={worldId}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', imageRendering: 'pixelated' }}
          />
        )}
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          sx={{
            fontFamily: '"Cinzel", serif',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: locked ? '#1e293b' : '#e2e8f0',
            letterSpacing: '0.06em',
            mb: 0.25,
          }}
        >
          {locked ? '???' : (world?.name ?? worldId)}
        </Typography>
        {!locked && (
          <Typography
            sx={{
              fontSize: '0.7rem',
              color: config.accent,
              fontFamily: '"Raleway", sans-serif',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            Begin Expedition →
          </Typography>
        )}
        {locked && (
          <Typography sx={{ fontSize: '0.7rem', color: '#475569', fontFamily: '"Raleway", sans-serif' }}>
            {unlockHint ?? 'Access Restricted'}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function ArcadiaPage() {
  const [worlds, setWorlds] = useState([]);
  const [janusUnlocked, setJanusUnlocked] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('biomes').select('id, name, is_active').then(({ data }) => {
      if (data) setWorlds(data);
    });
  }, []);

  useEffect(() => {
    if (!user) { setJanusUnlocked(false); return; }
    supabase
      .from('creatures')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .eq('stage', 'adult')
      .then(({ count }) => setJanusUnlocked((count ?? 0) >= 5));
  }, [user]);

  const sorted = WORLD_ORDER.map(id => worlds.find(w => w.id === id) ?? { id, name: id, is_active: false });

  return (
    <>
      <NebulaBackground src="images/arcadia_bg.mp4" />
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 }, position: 'relative', zIndex: 1 }}>

        {/* Hero */}
        <Box sx={{ textAlign: 'center', mb: 10 }}>
          <Typography
            variant="h1"
            sx={{
              fontFamily: '"Cinzel", serif',
              fontWeight: 700,
              fontSize: { xs: '3rem', md: '5rem' },
              background: 'linear-gradient(135deg, #0d9488, #7c3aed, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 28px rgba(124, 58, 237, 0.45))',
              mb: 2,
              lineHeight: 1.1,
            }}
          >
            Arcadia
          </Typography>

          <Typography
            sx={{
              fontFamily: '"Cinzel", serif',
              fontSize: { xs: '0.85rem', md: '1rem' },
              color: '#8892a4',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              mb: 4,
            }}
          >
            Creatures from beyond the known
          </Typography>

          <Typography
            sx={{
              fontFamily: '"Raleway", sans-serif',
              fontSize: { xs: '0.92rem', md: '1rem' },
              color: '#94a3b8',
              lineHeight: 1.85,
              maxWidth: 560,
              mx: 'auto',
              mb: 5,
            }}
          >
            The galaxy harbors life in forms no catalog has fully mapped. Four worlds.
            Survey teams embedded in hostile biomes. Creatures that exist nowhere else
            in charted space. Send an expedition. Choose what comes back with you.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <Button
                onClick={() => navigate('/arcadia/vivarium')}
                variant="outlined"
                sx={{
                  fontFamily: '"Cinzel", serif',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.12em',
                  color: '#a78bfa',
                  borderColor: 'rgba(167,139,250,0.4)',
                  px: 3.5,
                  py: 1.1,
                  borderRadius: '6px',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#a78bfa',
                    background: 'rgba(167,139,250,0.08)',
                    boxShadow: '0 0 20px rgba(167,139,250,0.2)',
                  },
                }}
              >
                My Vivarium
              </Button>
            ) : (
              <Typography sx={{ color: '#94a3b8', fontFamily: '"Raleway", sans-serif', fontSize: '0.85rem', alignSelf: 'center' }}>
                Sign in to build your Vivarium.
              </Typography>
            )}
          </Box>
        </Box>

        {/* Planet selection */}
        <Box>
          <Typography
            sx={{
              fontFamily: '"Cinzel", serif',
              fontSize: '0.7rem',
              color: '#64748b',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              textAlign: 'center',
              mb: 5,
            }}
          >
            Known Worlds
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: { xs: 4, md: 8 },
              flexWrap: 'wrap',
            }}
          >
            {sorted.map(world => (
              <PlanetSprite
                key={world.id}
                worldId={world.id}
                world={world}
                locked={world.id === 'janus' ? !janusUnlocked : !world.is_active}
                unlockHint={world.id === 'janus' ? 'Raise 5 adults to unlock' : undefined}
              />
            ))}
          </Box>
        </Box>

      </Container>
    </>
  );
}
