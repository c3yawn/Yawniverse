import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Card, Chip, Grid, CircularProgress, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import NebulaBackground from '../components/NebulaBackground';

const WORLD_CONFIG = {
  umihotaru: {
    gradient: 'linear-gradient(145deg, #042f2e 0%, #0d9488 60%, #0ea5e9 100%)',
    glow: 'rgba(13, 148, 136, 0.5)',
    accent: '#0d9488',
    scanLabel: 'Scanning bioluminescent canopy...',
  },
  enlil: {
    gradient: 'linear-gradient(145deg, #451a03 0%, #b45309 55%, #fbbf24 100%)',
    glow: 'rgba(180, 83, 9, 0.5)',
    accent: '#f59e0b',
    scanLabel: 'Tracking movement across the amber plains...',
  },
  taranis: {
    gradient: 'linear-gradient(145deg, #1e1b4b 0%, #6d28d9 55%, #a78bfa 100%)',
    glow: 'rgba(109, 40, 217, 0.5)',
    accent: '#a78bfa',
    scanLabel: 'Filtering EM interference in crystal caves...',
  },
  janus: {
    gradient: 'linear-gradient(90deg, #7f1d1d 0%, #3b0000 45%, #001233 55%, #1e3a5f 100%)',
    glow: 'rgba(127, 29, 29, 0.4)',
    accent: '#ef4444',
    scanLabel: 'Scanning the Terminator strip...',
  },
};

const RARITY_CONFIG = {
  common:    { color: '#94a3b8', label: 'Common' },
  uncommon:  { color: '#4ade80', label: 'Uncommon' },
  rare:      { color: '#38bdf8', label: 'Rare' },
  very_rare: { color: '#c084fc', label: 'Very Rare' },
};

const POOL_SIZE = 6;

function weightedRandom(species) {
  const total = species.reduce((sum, s) => sum + s.spawn_weight, 0);
  let rand = Math.random() * total;
  for (const s of species) {
    rand -= s.spawn_weight;
    if (rand <= 0) return s;
  }
  return species[species.length - 1];
}

function generatePool(species) {
  return Array.from({ length: POOL_SIZE }, (_, i) => ({
    ...weightedRandom(species),
    gender: Math.random() < 0.5 ? 'male' : 'female',
    _uid: i,
  }));
}

export default function WorldPage() {
  const { worldId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [world, setWorld] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | scanning | revealed | adopting | done
  const [pool, setPool] = useState([]);
  const [adoptedName, setAdoptedName] = useState('');
  const [error, setError] = useState(null);
  const [visibleCards, setVisibleCards] = useState(0);

  const config = WORLD_CONFIG[worldId] ?? WORLD_CONFIG.umihotaru;

  useEffect(() => {
    supabase.from('biomes').select('*').eq('id', worldId).single()
      .then(({ data }) => setWorld(data));
  }, [worldId]);

  async function startExpedition() {
    if (!user) return;
    setPhase('scanning');
    setPool([]);
    setVisibleCards(0);

    const { data } = await supabase
      .from('species_biomes')
      .select('spawn_weight, species(*)')
      .eq('biome_id', worldId);

    const speciesList = (data ?? []).map(row => ({
      ...row.species,
      spawn_weight: row.spawn_weight,
    }));

    const generated = generatePool(speciesList);

    await new Promise(resolve => setTimeout(resolve, 2800));

    setPool(generated);
    setPhase('revealed');

    // Stagger card reveal
    for (let i = 1; i <= POOL_SIZE; i++) {
      setTimeout(() => setVisibleCards(i), i * 130);
    }
  }

  async function handleAdopt(creature) {
    if (!user || phase === 'adopting') return;
    setPhase('adopting');
    setError(null);

    const { data, error: err } = await supabase
      .from('creatures')
      .insert({
        species_id: creature.id,
        owner_id: user.id,
        gender: creature.gender,
        stage: 'hatchling',
        is_cave_born: true,
        generation: 1,
      })
      .select()
      .single();

    if (err) {
      setError('Something went wrong. Please try again.');
      setPhase('revealed');
      return;
    }

    setAdoptedName(creature.name);
    setPhase('done');
  }

  return (
    <>
      <NebulaBackground />
      <Container maxWidth="lg" sx={{ py: 6, position: 'relative', zIndex: 1 }}>

        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/creatures')}
          sx={{
            color: '#64748b',
            fontFamily: '"Raleway", sans-serif',
            fontSize: '0.8rem',
            mb: 3,
            '&:hover': { color: '#e2e8f0' },
          }}
        >
          All Worlds
        </Button>

        {/* World header */}
        <Box
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            mb: 5,
            border: '1px solid rgba(124,58,237,0.12)',
          }}
        >
          <Box sx={{ height: 140, background: config.gradient, position: 'relative' }}>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, transparent 40%, rgba(6,4,20,0.9) 100%)',
              }}
            />
          </Box>
          <Box
            sx={{
              background: 'rgba(6,4,20,0.92)',
              backdropFilter: 'blur(20px)',
              px: { xs: 3, md: 5 },
              py: 3,
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Cinzel", serif',
                fontWeight: 700,
                fontSize: { xs: '1.5rem', md: '2rem' },
                color: '#e2e8f0',
                mb: 1,
              }}
            >
              {world?.name ?? worldId}
            </Typography>
            <Typography
              sx={{
                color: '#64748b',
                fontFamily: '"Raleway", sans-serif',
                fontSize: '0.88rem',
                lineHeight: 1.7,
                maxWidth: 700,
              }}
            >
              {world?.description}
            </Typography>
          </Box>
        </Box>

        {/* Idle */}
        {phase === 'idle' && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            {!user ? (
              <Typography sx={{ color: '#64748b', fontFamily: '"Raleway", sans-serif' }}>
                Sign in to send an expedition.
              </Typography>
            ) : (
              <>
                <Typography
                  sx={{
                    color: '#94a3b8',
                    fontFamily: '"Raleway", sans-serif',
                    mb: 3,
                    fontSize: '0.9rem',
                  }}
                >
                  Deploy a survey team to locate creatures in this world.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={startExpedition}
                  sx={{
                    fontFamily: '"Cinzel", serif',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    letterSpacing: '0.1em',
                    px: 5,
                    py: 1.5,
                    background: `linear-gradient(135deg, ${config.accent}33, ${config.accent}66)`,
                    border: `1px solid ${config.accent}88`,
                    color: '#e2e8f0',
                    boxShadow: `0 0 20px ${config.glow}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${config.accent}55, ${config.accent}88)`,
                      boxShadow: `0 0 32px ${config.glow}`,
                    },
                  }}
                >
                  Send Expedition
                </Button>
              </>
            )}
          </Box>
        )}

        {/* Scanning */}
        {phase === 'scanning' && (
          <Box sx={{ textAlign: 'center', py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <Box sx={{ position: 'relative', width: 100, height: 100 }}>
              {[0, 1, 2].map(i => (
                <Box
                  key={i}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: `1.5px solid ${config.accent}`,
                    '@keyframes scanRing': {
                      '0%': { transform: 'scale(0.2)', opacity: 0.9 },
                      '100%': { transform: 'scale(2.2)', opacity: 0 },
                    },
                    animation: 'scanRing 2.2s ease-out infinite',
                    animationDelay: `${i * 0.7}s`,
                  }}
                />
              ))}
              <Box
                sx={{
                  position: 'absolute',
                  inset: '35%',
                  borderRadius: '50%',
                  background: config.accent,
                  opacity: 0.7,
                  boxShadow: `0 0 16px ${config.glow}`,
                  '@keyframes corePulse': {
                    '0%, 100%': { opacity: 0.7, transform: 'scale(1)' },
                    '50%': { opacity: 1, transform: 'scale(1.15)' },
                  },
                  animation: 'corePulse 1.4s ease-in-out infinite',
                }}
              />
            </Box>
            <Typography
              sx={{
                color: config.accent,
                fontFamily: '"Cinzel", serif',
                fontSize: '0.85rem',
                letterSpacing: '0.12em',
                opacity: 0.9,
              }}
            >
              {config.scanLabel}
            </Typography>
          </Box>
        )}

        {/* Revealed */}
        {(phase === 'revealed' || phase === 'adopting') && (
          <Box>
            <Typography
              sx={{
                color: '#64748b',
                fontFamily: '"Raleway", sans-serif',
                fontSize: '0.85rem',
                mb: 3,
              }}
            >
              {POOL_SIZE} creatures located. Choose one to adopt.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={2}>
              {pool.map((creature, i) => {
                const rarity = RARITY_CONFIG[creature.rarity] ?? RARITY_CONFIG.common;
                const visible = i < visibleCards;

                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={creature._uid}>
                    <Card
                      sx={{
                        background: 'rgba(6, 4, 20, 0.88)',
                        backdropFilter: 'blur(20px)',
                        border: `1px solid rgba(124,58,237,0.12)`,
                        borderRadius: 2.5,
                        overflow: 'hidden',
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
                        transition: 'opacity 0.45s ease, transform 0.45s ease, box-shadow 0.2s ease',
                        '&:hover': {
                          boxShadow: `0 0 24px ${config.glow}`,
                          borderColor: `${rarity.color}44`,
                        },
                      }}
                    >
                      {/* Creature gradient banner */}
                      <Box
                        sx={{
                          height: 80,
                          background: config.gradient,
                          opacity: 0.7,
                          position: 'relative',
                        }}
                      />

                      <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                          <Typography
                            sx={{
                              fontFamily: '"Cinzel", serif',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              color: '#e2e8f0',
                            }}
                          >
                            {creature.name}
                          </Typography>
                          <Chip
                            label={rarity.label}
                            size="small"
                            sx={{
                              fontSize: '0.65rem',
                              height: 20,
                              fontFamily: '"Raleway", sans-serif',
                              fontWeight: 700,
                              color: rarity.color,
                              background: `${rarity.color}18`,
                              border: `1px solid ${rarity.color}44`,
                            }}
                          />
                        </Box>

                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            color: '#475569',
                            fontFamily: '"Raleway", sans-serif',
                            textTransform: 'capitalize',
                            mb: 1.5,
                          }}
                        >
                          {creature.gender} · Hatchling
                        </Typography>

                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          onClick={() => handleAdopt(creature)}
                          disabled={phase === 'adopting'}
                          sx={{
                            fontFamily: '"Raleway", sans-serif',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            color: rarity.color,
                            borderColor: `${rarity.color}55`,
                            '&:hover': {
                              borderColor: rarity.color,
                              background: `${rarity.color}11`,
                            },
                          }}
                        >
                          Adopt
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                onClick={startExpedition}
                disabled={phase === 'adopting'}
                sx={{
                  color: '#475569',
                  fontFamily: '"Raleway", sans-serif',
                  fontSize: '0.8rem',
                  '&:hover': { color: '#94a3b8' },
                }}
              >
                Send another expedition
              </Button>
            </Box>
          </Box>
        )}

        {/* Done */}
        {phase === 'done' && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography
              sx={{
                fontFamily: '"Cinzel", serif',
                fontWeight: 700,
                fontSize: '1.4rem',
                color: '#e2e8f0',
                mb: 1,
              }}
            >
              {adoptedName} adopted.
            </Typography>
            <Typography sx={{ color: '#64748b', fontFamily: '"Raleway", sans-serif', mb: 4 }}>
              Your new hatchling is waiting.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/creatures/stable')}
                sx={{
                  fontFamily: '"Raleway", sans-serif',
                  fontWeight: 700,
                  background: 'rgba(124,58,237,0.3)',
                  border: '1px solid rgba(124,58,237,0.5)',
                  color: '#e2e8f0',
                  '&:hover': { background: 'rgba(124,58,237,0.5)' },
                }}
              >
                View Stable
              </Button>
              <Button
                onClick={startExpedition}
                sx={{
                  fontFamily: '"Raleway", sans-serif',
                  color: '#64748b',
                  '&:hover': { color: '#94a3b8' },
                }}
              >
                Send another expedition
              </Button>
            </Box>
          </Box>
        )}

      </Container>
    </>
  );
}
