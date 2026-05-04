import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Grid, Typography, Card, CardActionArea, Chip, Button } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ExploreIcon from '@mui/icons-material/Explore';
import { supabase } from '../lib/supabase';
import NebulaBackground from '../components/NebulaBackground';

const WORLD_ORDER = ['umihotaru', 'enlil', 'taranis', 'janus'];

const WORLD_CONFIG = {
  umihotaru: {
    gradient: 'linear-gradient(145deg, #042f2e 0%, #0d9488 60%, #0ea5e9 100%)',
    glow: 'rgba(13, 148, 136, 0.5)',
    accent: '#0d9488',
    subtitle: 'Bioluminescent Ocean Moon',
  },
  enlil: {
    gradient: 'linear-gradient(145deg, #451a03 0%, #b45309 55%, #fbbf24 100%)',
    glow: 'rgba(180, 83, 9, 0.5)',
    accent: '#f59e0b',
    subtitle: 'Amber Savanna World',
  },
  taranis: {
    gradient: 'linear-gradient(145deg, #1e1b4b 0%, #6d28d9 55%, #a78bfa 100%)',
    glow: 'rgba(109, 40, 217, 0.5)',
    accent: '#a78bfa',
    subtitle: 'Electromagnetic Storm World',
  },
  janus: {
    gradient: 'linear-gradient(90deg, #7f1d1d 0%, #3b0000 45%, #001233 55%, #1e3a5f 100%)',
    glow: 'rgba(127, 29, 29, 0.4)',
    accent: '#ef4444',
    subtitle: 'The Tidally Locked Divide',
  },
};

export default function WildPage() {
  const [worlds, setWorlds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('biomes').select('*').then(({ data }) => {
      if (data) setWorlds(data);
    });
  }, []);

  const sorted = WORLD_ORDER.map(id => worlds.find(w => w.id === id)).filter(Boolean);

  return (
    <>
      <NebulaBackground />
      <Container maxWidth="lg" sx={{ py: 8, position: 'relative', zIndex: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Cinzel", serif',
              fontWeight: 700,
              fontSize: { xs: '1.8rem', md: '2.4rem' },
              background: 'linear-gradient(90deg, #e2c9ff, #c084fc, #818cf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 18px rgba(192, 132, 252, 0.45))',
              mb: 1,
            }}
          >
            The Wild
          </Typography>
          <Typography sx={{ color: '#64748b', fontFamily: '"Raleway", sans-serif', fontSize: '0.95rem' }}>
            Select a world and send an expedition to discover creatures.
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mt: 3 }}>
          {sorted.map(world => {
            const config = WORLD_CONFIG[world.id] ?? WORLD_CONFIG.umihotaru;
            const locked = !world.is_active;

            return (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={world.id}>
                <Card
                  sx={{
                    height: '100%',
                    background: 'rgba(6, 4, 20, 0.88)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(124, 58, 237, 0.12)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                    ...(!locked && {
                      '&:hover': {
                        boxShadow: `0 0 32px ${config.glow}`,
                        transform: 'translateY(-3px)',
                      },
                    }),
                    ...(locked && { opacity: 0.5, filter: 'grayscale(0.4)' }),
                  }}
                >
                  <CardActionArea
                    onClick={() => !locked && navigate(`/creatures/world/${world.id}`)}
                    disabled={locked}
                    sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    <Box
                      sx={{
                        height: 120,
                        background: locked
                          ? 'linear-gradient(145deg, #1e1b2e, #2a2440)'
                          : config.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      {locked && (
                        <LockIcon sx={{ fontSize: 36, color: 'rgba(255,255,255,0.25)' }} />
                      )}
                      {!locked && (
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.25)',
                            border: `1.5px solid ${config.accent}`,
                            boxShadow: `0 0 20px ${config.glow}`,
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: '"Cinzel", serif',
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: locked ? '#475569' : '#e2e8f0',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {locked ? '???' : world.name}
                      </Typography>

                      {!locked && (
                        <Typography
                          sx={{
                            fontSize: '0.72rem',
                            color: config.accent,
                            fontFamily: '"Raleway", sans-serif',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}
                        >
                          {config.subtitle}
                        </Typography>
                      )}

                      <Typography
                        sx={{
                          fontSize: '0.8rem',
                          color: locked ? '#334155' : '#94a3b8',
                          fontFamily: '"Raleway", sans-serif',
                          lineHeight: 1.55,
                          flexGrow: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {locked ? 'Classification pending. Access restricted.' : world.description}
                      </Typography>

                      {!locked && (
                        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ExploreIcon sx={{ fontSize: 14, color: config.accent }} />
                          <Typography sx={{ fontSize: '0.78rem', color: config.accent, fontFamily: '"Raleway", sans-serif', fontWeight: 600 }}>
                            Send Expedition
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </>
  );
}
