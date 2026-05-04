import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button } from '@mui/material';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import NebulaBackground from '../components/NebulaBackground';

const WORLD_ORDER = ['umihotaru', 'enlil', 'taranis', 'janus'];

const WORLD_CONFIG = {
  umihotaru: {
    planetGradient: 'radial-gradient(circle at 35% 32%, #5eead4 0%, #0d9488 38%, #065f46 68%, #021a1a 100%)',
    glow: 'rgba(13, 148, 136, 0.6)',
    accent: '#0d9488',
  },
  enlil: {
    planetGradient: 'radial-gradient(circle at 38% 30%, #fde68a 0%, #d97706 32%, #92400e 62%, #3b1402 100%)',
    glow: 'rgba(217, 119, 6, 0.6)',
    accent: '#f59e0b',
  },
  taranis: {
    planetGradient: 'radial-gradient(circle at 40% 33%, #ddd6fe 0%, #7c3aed 38%, #312e81 66%, #0d0b20 100%)',
    glow: 'rgba(124, 58, 237, 0.6)',
    accent: '#a78bfa',
  },
  janus: {
    planetGradient: 'linear-gradient(108deg, #7f1d1d 0%, #ef4444 36%, #b91c1c 46%, #1e3a5f 54%, #1d4ed8 64%, #0f172a 100%)',
    glow: 'rgba(127, 29, 29, 0.5)',
    accent: '#ef4444',
  },
};

function PlanetSprite({ worldId, world, locked }) {
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
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: locked
            ? 'radial-gradient(circle at 40% 35%, #1e293b, #0f172a)'
            : config.planetGradient,
          boxShadow: locked
            ? 'inset -5px -7px 14px rgba(0,0,0,0.7)'
            : `0 0 28px ${config.glow}, inset -6px -8px 16px rgba(0,0,0,0.55)`,
          transition: 'box-shadow 0.25s ease',
          '&:hover': locked ? {} : {
            boxShadow: `0 0 48px ${config.glow}, inset -6px -8px 16px rgba(0,0,0,0.55)`,
          },
        }}
      />
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
          <Typography sx={{ fontSize: '0.7rem', color: '#1e293b', fontFamily: '"Raleway", sans-serif' }}>
            Access Restricted
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function ArcadiaPage() {
  const [worlds, setWorlds] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('biomes').select('id, name, is_active').then(({ data }) => {
      if (data) setWorlds(data);
    });
  }, []);

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
              color: '#475569',
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
              <Typography sx={{ color: '#334155', fontFamily: '"Raleway", sans-serif', fontSize: '0.85rem', alignSelf: 'center' }}>
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
              color: '#334155',
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
                locked={!world.is_active}
              />
            ))}
          </Box>
        </Box>

      </Container>
    </>
  );
}
