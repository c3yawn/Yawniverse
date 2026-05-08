import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Grid, Typography, Card, Chip, Button, Skeleton, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import WorldAtmosphere from '../components/WorldAtmosphere';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function spriteUrl(speciesId, stage) {
  return `${SUPABASE_URL}/storage/v1/object/public/creature-sprites/${speciesId}_${stage}.png`;
}
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import NebulaBackground from '../components/NebulaBackground';

const RARITY_CONFIG = {
  common:    { color: '#94a3b8', label: 'Common' },
  uncommon:  { color: '#4ade80', label: 'Uncommon' },
  rare:      { color: '#38bdf8', label: 'Rare' },
  very_rare: { color: '#c084fc', label: 'Very Rare' },
};

const WORLD_CONFIG = {
  umihotaru: { gradient: 'linear-gradient(145deg, #042f2e 0%, #0d9488 60%, #0ea5e9 100%)', accent: '#0d9488' },
  enlil:     { gradient: 'linear-gradient(145deg, #451a03 0%, #b45309 55%, #fbbf24 100%)', accent: '#f59e0b' },
  taranis:   { gradient: 'linear-gradient(145deg, #1e1b4b 0%, #6d28d9 55%, #a78bfa 100%)', accent: '#a78bfa' },
  janus:     { gradient: 'linear-gradient(90deg, #7f1d1d 0%, #3b0000 45%, #001233 55%, #1e3a5f 100%)', accent: '#ef4444' },
};

const SHINY_FILTER = 'sepia(0.4) saturate(4) hue-rotate(15deg) brightness(1.15)';

function CreatureCard({ creature }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const rarity = RARITY_CONFIG[creature.species?.rarity] ?? RARITY_CONFIG.common;
  const world = WORLD_CONFIG[creature.species_biome] ?? WORLD_CONFIG.umihotaru;
  const hoverColor = creature.is_shiny ? '#fbbf24' : rarity.color;

  function handleCopy(e) {
    e.stopPropagation();
    const url = `${window.location.origin}${import.meta.env.BASE_URL}arcadia/creature/${creature.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card
      onClick={() => navigate(`/arcadia/creature/${creature.id}`)}
      sx={{
        background: 'rgba(6, 4, 20, 0.88)',
        backdropFilter: 'blur(20px)',
        border: creature.is_shiny ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 2.5,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.22s ease, transform 0.22s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: `0 0 24px ${hoverColor}44`,
          borderColor: `${hoverColor}44`,
        },
      }}
    >
      <Box sx={{ height: 120, position: 'relative', overflow: 'hidden', background: '#06040e' }}>
        <Box sx={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 100%, ${world.accent}2a 0%, transparent 62%)` }} />
        <WorldAtmosphere worldId={creature.species_biome} />
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <img
            src={spriteUrl(creature.species_id, creature.stage)}
            alt={creature.species?.name}
            style={{
              height: 72, width: 72, objectFit: 'contain', imageRendering: 'pixelated',
              filter: `drop-shadow(0 2px 10px ${world.accent}99)${creature.is_shiny ? ` ${SHINY_FILTER}` : ''}`,
            }}
          />
        </Box>
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '42%', background: 'linear-gradient(to bottom, transparent, rgba(6,4,20,0.96))', zIndex: 3, pointerEvents: 'none' }} />
      </Box>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
            {creature.name ?? creature.species?.name ?? 'Unknown'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, ml: 1 }}>
            {creature.is_shiny && (
              <Chip
                label="✦ Shiny"
                size="small"
                sx={{
                  fontSize: '0.62rem', height: 20,
                  fontFamily: '"Raleway", sans-serif', fontWeight: 700,
                  color: '#fbbf24', background: 'rgba(251,191,36,0.12)',
                  border: '1px solid rgba(251,191,36,0.4)',
                }}
              />
            )}
            <Chip
              label={rarity.label}
              size="small"
              sx={{
                fontSize: '0.62rem', height: 20,
                fontFamily: '"Raleway", sans-serif', fontWeight: 700,
                color: rarity.color, background: `${rarity.color}18`,
                border: `1px solid ${rarity.color}44`,
              }}
            />
          </Box>
        </Box>

        <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: '"Raleway", sans-serif', textTransform: 'capitalize', mb: 0.5 }}>
          {creature.species?.name}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={creature.stage} size="small" sx={{ fontSize: '0.62rem', height: 18, fontFamily: '"Raleway", sans-serif', textTransform: 'capitalize', color: '#94a3b8', background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)' }} />
            <Chip label={creature.gender} size="small" sx={{ fontSize: '0.62rem', height: 18, fontFamily: '"Raleway", sans-serif', textTransform: 'capitalize', color: '#94a3b8', background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)' }} />
          </Box>
          <IconButton size="small" onClick={handleCopy} sx={{ color: copied ? '#4ade80' : '#475569', transition: 'color 0.2s ease', '&:hover': { color: copied ? '#4ade80' : '#94a3b8', background: 'transparent' } }}>
            {copied ? <CheckIcon sx={{ fontSize: '0.85rem' }} /> : <ContentCopyIcon sx={{ fontSize: '0.85rem' }} />}
          </IconButton>
        </Box>
      </Box>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card sx={{ background: 'rgba(6,4,20,0.88)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2.5, overflow: 'hidden' }}>
      <Skeleton variant="rectangular" height={80} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
      <Box sx={{ p: 2 }}>
        <Skeleton width="60%" height={20} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 1 }} />
        <Skeleton width="40%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
      </Box>
    </Card>
  );
}

export default function ViviariumPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creatures, setCreatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from('creatures')
      .select(`
        id, name, gender, stage, adopted_at,
        species_id, is_shiny,
        species:species_id ( name, rarity )
      `)
      .eq('owner_id', user.id)
      .order('adopted_at', { ascending: false })
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return; }

        // Fetch the biome each species lives in (for world gradient)
        const speciesIds = [...new Set(data.map(c => c.species_id))];
        const { data: biomeRows } = await supabase
          .from('species_biomes')
          .select('species_id, biome_id')
          .in('species_id', speciesIds);

        const speciesBiomeMap = {};
        (biomeRows ?? []).forEach(row => { speciesBiomeMap[row.species_id] = row.biome_id; });

        setCreatures(data.map(c => ({ ...c, species_biome: speciesBiomeMap[c.species_id] ?? 'umihotaru' })));
        setLoading(false);
      });
  }, [user]);

  return (
    <>
      <NebulaBackground src="images/arcadia_bg.mp4" />
      <Container maxWidth="lg" sx={{ py: 6, position: 'relative', zIndex: 1 }}>

        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/arcadia')}
          sx={{
            color: '#64748b',
            fontFamily: '"Raleway", sans-serif',
            fontSize: '0.8rem',
            mb: 3,
            '&:hover': { color: '#e2e8f0' },
          }}
        >
          Arcadia
        </Button>

        <Box sx={{ mb: 5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
          <Typography
            sx={{
              fontFamily: '"Cinzel", serif',
              fontWeight: 700,
              fontSize: { xs: '1.6rem', md: '2.2rem' },
              color: '#f1f5f9',
              filter: 'drop-shadow(0 0 18px rgba(167,139,250,0.35))',
              letterSpacing: '-0.01em',
              mb: 0.5,
            }}
          >
            Vivarium
          </Typography>
          {!loading && creatures.length > 0 && (
            <Typography sx={{ color: '#94a3b8', fontFamily: '"Raleway", sans-serif', fontSize: '0.88rem' }}>
              {creatures.length} {creatures.length === 1 ? 'creature' : 'creatures'} in your collection
            </Typography>
          )}
          </Box>
          {user && (
            <Button
              onClick={() => navigate('/arcadia/breeding')}
              sx={{
                fontFamily: '"Cinzel", serif',
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                color: '#e2e8f0',
                background: 'linear-gradient(rgba(6,4,20,0.92), rgba(6,4,20,0.92)) padding-box, linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%) border-box',
                border: '1.5px solid transparent',
                borderRadius: '6px',
                px: 2.5,
                py: 0.9,
                alignSelf: 'flex-start',
                textTransform: 'none',
                transition: 'box-shadow 0.2s ease',
                '&:hover': { background: 'linear-gradient(rgba(10,6,28,0.96), rgba(10,6,28,0.96)) padding-box, linear-gradient(135deg, #c084fc 0%, #38bdf8 100%) border-box', boxShadow: '0 0 18px rgba(167,139,250,0.2)' },
              }}
            >
              Breeding
            </Button>
          )}
        </Box>

        {/* Loading */}
        {loading && (
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                <SkeletonCard />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Not signed in */}
        {!loading && !user && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography sx={{ color: '#94a3b8', fontFamily: '"Raleway", sans-serif', mb: 3 }}>
              Sign in to view your Vivarium.
            </Typography>
            <Button
              onClick={() => navigate('/arcadia')}
              sx={{
                fontFamily: '"Cinzel", serif',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: '#e2e8f0',
                background: 'linear-gradient(rgba(6,4,20,0.92), rgba(6,4,20,0.92)) padding-box, linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%) border-box',
                border: '1.5px solid transparent',
                borderRadius: '6px',
                px: 3,
                py: 1,
                textTransform: 'none',
                transition: 'box-shadow 0.2s ease',
                '&:hover': { background: 'linear-gradient(rgba(10,6,28,0.96), rgba(10,6,28,0.96)) padding-box, linear-gradient(135deg, #c084fc 0%, #38bdf8 100%) border-box', boxShadow: '0 0 18px rgba(167,139,250,0.2)' },
              }}
            >
              Back to Arcadia
            </Button>
          </Box>
        )}

        {/* Empty state */}
        {!loading && user && creatures.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography
              sx={{
                fontFamily: '"Cinzel", serif',
                fontSize: '1.1rem',
                color: '#e2e8f0',
                mb: 1.5,
              }}
            >
              Your Vivarium is empty.
            </Typography>
            <Typography sx={{ color: '#94a3b8', fontFamily: '"Raleway", sans-serif', fontSize: '0.9rem', mb: 4 }}>
              Send an expedition to a world and adopt your first creature.
            </Typography>
            <Button
              onClick={() => navigate('/arcadia')}
              variant="contained"
              sx={{
                fontFamily: '"Cinzel", serif',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
                px: 4,
                py: 1.25,
                background: 'rgba(124,58,237,0.25)',
                border: '1px solid rgba(124,58,237,0.45)',
                color: '#e2e8f0',
                boxShadow: '0 0 20px rgba(124,58,237,0.2)',
                '&:hover': {
                  background: 'rgba(124,58,237,0.4)',
                  boxShadow: '0 0 32px rgba(124,58,237,0.35)',
                },
              }}
            >
              Explore Worlds
            </Button>
          </Box>
        )}

        {/* Creature grid */}
        {!loading && creatures.length > 0 && (
          <Grid container spacing={2}>
            {creatures.map(creature => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={creature.id}>
                <CreatureCard creature={creature} />
              </Grid>
            ))}
          </Grid>
        )}

      </Container>
    </>
  );
}
