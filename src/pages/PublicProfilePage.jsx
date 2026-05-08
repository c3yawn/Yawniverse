import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Box, Container, Grid, Typography, Card, Chip, Button,
  Skeleton, Avatar, IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { supabase } from '../lib/supabase';
import NebulaBackground from '../components/NebulaBackground';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SHINY_FILTER = 'sepia(0.4) saturate(4) hue-rotate(15deg) brightness(1.15)';

function spriteUrl(speciesId, stage) {
  return `${SUPABASE_URL}/storage/v1/object/public/creature-sprites/${speciesId}_${stage}.png`;
}

const RARITY_CONFIG = {
  common:    { color: '#94a3b8', label: 'Common' },
  uncommon:  { color: '#4ade80', label: 'Uncommon' },
  rare:      { color: '#38bdf8', label: 'Rare' },
  very_rare: { color: '#c084fc', label: 'Very Rare' },
};

const WORLD_CONFIG = {
  umihotaru: { gradient: 'linear-gradient(145deg, #042f2e 0%, #0d9488 60%, #0ea5e9 100%)' },
  enlil:     { gradient: 'linear-gradient(145deg, #451a03 0%, #b45309 55%, #fbbf24 100%)' },
  taranis:   { gradient: 'linear-gradient(145deg, #1e1b4b 0%, #6d28d9 55%, #a78bfa 100%)' },
  janus:     { gradient: 'linear-gradient(90deg, #7f1d1d 0%, #3b0000 45%, #001233 55%, #1e3a5f 100%)' },
};

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
      <Box sx={{ height: 80, background: world.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={spriteUrl(creature.species_id, creature.stage)}
          alt={creature.species?.name}
          style={{ height: 64, width: 64, objectFit: 'contain', imageRendering: 'pixelated', filter: creature.is_shiny ? SHINY_FILTER : 'none' }}
        />
      </Box>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
            {creature.name ?? creature.species?.name ?? 'Unknown'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, ml: 1 }}>
            {creature.is_shiny && (
              <Chip label="✦ Shiny" size="small" sx={{ fontSize: '0.62rem', height: 20, fontFamily: '"Raleway", sans-serif', fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.4)' }} />
            )}
          <Chip
            label={rarity.label}
            size="small"
            sx={{
              fontSize: '0.62rem',
              height: 20,
              fontFamily: '"Raleway", sans-serif',
              fontWeight: 700,
              color: rarity.color,
              background: `${rarity.color}18`,
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
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{ color: copied ? '#4ade80' : '#475569', transition: 'color 0.2s ease', '&:hover': { color: copied ? '#4ade80' : '#94a3b8', background: 'transparent' } }}
          >
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

export default function PublicProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [creatures, setCreatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: prof, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('username', username)
        .single();

      if (error || !prof) { setNotFound(true); setLoading(false); return; }
      setProfileData(prof);

      const { data: creatureRows } = await supabase
        .from('creatures')
        .select(`
          id, name, gender, stage, adopted_at,
          species_id, is_shiny,
          species:species_id ( name, rarity )
        `)
        .eq('owner_id', prof.id)
        .order('adopted_at', { ascending: false });

      if (creatureRows && creatureRows.length > 0) {
        const speciesIds = [...new Set(creatureRows.map(c => c.species_id))];
        const { data: biomeRows } = await supabase
          .from('species_biomes')
          .select('species_id, biome_id')
          .in('species_id', speciesIds);

        const biomeMap = {};
        (biomeRows ?? []).forEach(r => { biomeMap[r.species_id] = r.biome_id; });
        setCreatures(creatureRows.map(c => ({ ...c, species_biome: biomeMap[c.species_id] ?? 'umihotaru' })));
      }

      setLoading(false);
    }
    load();
  }, [username]);

  function handleCopyProfile() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const displayName = profileData?.display_name || profileData?.username || '';
  const ogTitle = profileData ? `${displayName}'s Vivarium · Arcadia` : 'Arcadia';
  const ogDescription = profileData
    ? `${displayName} has ${creatures.length} ${creatures.length === 1 ? 'creature' : 'creatures'} in their collection.`
    : 'Adopt and raise creatures from across charted space.';
  const pageUrl = `https://c3yawn.github.io/Yawniverse/arcadia/user/${username}`;

  if (loading) {
    return (
      <>
        <NebulaBackground src="images/arcadia_bg.mp4" />
        <Container maxWidth="lg" sx={{ py: 6, position: 'relative', zIndex: 1 }}>
          <Skeleton width={80} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 3 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 5 }}>
            <Skeleton variant="circular" width={72} height={72} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            <Box>
              <Skeleton width={160} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 1 }} />
              <Skeleton width={100} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            </Box>
          </Box>
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}><SkeletonCard /></Grid>
            ))}
          </Grid>
        </Container>
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <NebulaBackground src="images/arcadia_bg.mp4" />
        <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '1.1rem', color: '#e2e8f0', mb: 1 }}>
            Trainer not found.
          </Typography>
          <Typography sx={{ color: '#94a3b8', fontFamily: '"Raleway", sans-serif', mb: 4 }}>
            No one goes by that name in the Yawniverse.
          </Typography>
          <Button
            onClick={() => navigate('/arcadia')}
            sx={{ color: '#94a3b8', fontFamily: '"Raleway", sans-serif', '&:hover': { color: '#e2e8f0' } }}
          >
            Back to Arcadia
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{ogTitle}</title>
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
      </Helmet>
      <NebulaBackground src="images/arcadia_bg.mp4" />
      <Container maxWidth="lg" sx={{ py: 6, position: 'relative', zIndex: 1 }}>

        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/arcadia')}
          sx={{ color: '#64748b', fontFamily: '"Raleway", sans-serif', fontSize: '0.8rem', mb: 3, '&:hover': { color: '#e2e8f0' } }}
        >
          Arcadia
        </Button>

        {/* Profile header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3, mb: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              src={profileData.avatar_url ?? undefined}
              sx={{
                width: 72,
                height: 72,
                fontSize: '1.5rem',
                fontFamily: '"Raleway", sans-serif',
                fontWeight: 700,
                bgcolor: '#7c3aed',
                border: '2px solid rgba(167,139,250,0.35)',
                flexShrink: 0,
              }}
            >
              {!profileData.avatar_url && (profileData.username?.[0] ?? '?').toUpperCase()}
            </Avatar>
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Cinzel", serif',
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  background: 'linear-gradient(135deg, #e2e8f0, #c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 14px rgba(192,132,252,0.25))',
                  lineHeight: 1.1,
                  mb: 0.5,
                }}
              >
                {displayName}
              </Typography>
              {profileData.display_name && (
                <Typography sx={{ fontFamily: '"Raleway", sans-serif', fontSize: '0.8rem', color: '#64748b' }}>
                  @{profileData.username}
                </Typography>
              )}
              {!loading && (
                <Typography sx={{ fontFamily: '"Raleway", sans-serif', fontSize: '0.8rem', color: '#475569', mt: 0.25 }}>
                  {creatures.length} {creatures.length === 1 ? 'creature' : 'creatures'}
                </Typography>
              )}
            </Box>
          </Box>

          <Button
            onClick={handleCopyProfile}
            startIcon={copied ? <CheckIcon sx={{ fontSize: '0.85rem !important' }} /> : <ContentCopyIcon sx={{ fontSize: '0.85rem !important' }} />}
            variant="outlined"
            size="small"
            sx={{
              fontFamily: '"Raleway", sans-serif',
              fontWeight: 600,
              fontSize: '0.78rem',
              color: copied ? '#4ade80' : '#64748b',
              borderColor: copied ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.08)',
              textTransform: 'none',
              transition: 'color 0.2s, border-color 0.2s',
              '&:hover': { color: copied ? '#4ade80' : '#94a3b8', borderColor: copied ? 'rgba(74,222,128,0.55)' : 'rgba(255,255,255,0.18)', background: 'transparent' },
            }}
          >
            {copied ? 'Copied!' : 'Copy link'}
          </Button>
        </Box>

        {/* Creature grid */}
        {creatures.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '1rem', color: '#64748b' }}>
              No creatures yet.
            </Typography>
          </Box>
        ) : (
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
