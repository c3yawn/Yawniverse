import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Card, Chip, Grid, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import NebulaBackground from '../components/NebulaBackground';
import WorldAtmosphere from '../components/WorldAtmosphere';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
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
  umihotaru: { gradient: 'linear-gradient(145deg, #042f2e 0%, #0d9488 60%, #0ea5e9 100%)', accent: '#0d9488' },
  enlil:     { gradient: 'linear-gradient(145deg, #451a03 0%, #b45309 55%, #fbbf24 100%)', accent: '#f59e0b' },
  taranis:   { gradient: 'linear-gradient(145deg, #1e1b4b 0%, #6d28d9 55%, #a78bfa 100%)', accent: '#a78bfa' },
  janus:     { gradient: 'linear-gradient(90deg, #7f1d1d 0%, #3b0000 45%, #001233 55%, #1e3a5f 100%)', accent: '#ef4444' },
};

const ERROR_MESSAGES = {
  not_owner:     'You must own both creatures.',
  not_adult:     'Both creatures must be adults.',
  on_cooldown:   'One or both creatures are still on breeding cooldown.',
  egg_cap:       'You already have 5 eggs. Wait for some to hatch before breeding.',
  default:       'Something went wrong. Please try again.',
};

function formatCooldown(until) {
  const diff = new Date(until) - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

function CreatureCard({ creature, selected, onSelect, disabled }) {
  const rarity = RARITY_CONFIG[creature.species?.rarity] ?? RARITY_CONFIG.common;
  const world = WORLD_CONFIG[creature.species_biome] ?? WORLD_CONFIG.umihotaru;
  const cooldownLabel = creature.breed_cooldown_until ? formatCooldown(creature.breed_cooldown_until) : null;
  const onCooldown = !!cooldownLabel;

  return (
    <Card
      onClick={() => !disabled && !onCooldown && onSelect(creature)}
      sx={{
        background: 'rgba(6, 4, 20, 0.88)',
        backdropFilter: 'blur(20px)',
        border: selected
          ? `1px solid ${world.accent}99`
          : creature.is_shiny ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 2.5,
        overflow: 'hidden',
        cursor: onCooldown || disabled ? 'default' : 'pointer',
        opacity: onCooldown ? 0.5 : 1,
        transition: 'box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease',
        boxShadow: selected ? `0 0 20px ${world.accent}44` : 'none',
        transform: selected ? 'translateY(-3px)' : 'none',
        '&:hover': onCooldown || disabled ? {} : {
          transform: selected ? 'translateY(-3px)' : 'translateY(-2px)',
          boxShadow: `0 0 16px ${rarity.color}22`,
        },
      }}
    >
      <Box sx={{ height: 100, position: 'relative', overflow: 'hidden', background: '#06040e' }}>
        <Box sx={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 100%, ${world.accent}28 0%, transparent 62%)` }} />
        <WorldAtmosphere worldId={creature.species_biome} />
        {selected && (
          <Box sx={{ position: 'absolute', inset: 0, background: `${world.accent}22`, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', p: 0.75, zIndex: 4 }}>
            <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '0.6rem', color: world.accent, letterSpacing: '0.1em', background: `${world.accent}22`, px: 0.75, py: 0.25, borderRadius: '3px', border: `1px solid ${world.accent}44` }}>
              SELECTED
            </Typography>
          </Box>
        )}
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <img
            src={spriteUrl(creature.species_id, creature.stage)}
            alt={creature.species?.name}
            style={{
              height: 60, width: 60, objectFit: 'contain', imageRendering: 'pixelated',
              filter: `drop-shadow(0 2px 8px ${world.accent}99)`,
            }}
          />
        </Box>
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%', background: 'linear-gradient(to bottom, transparent, rgba(6,4,20,0.96))', zIndex: 3, pointerEvents: 'none' }} />
      </Box>
      <Box sx={{ p: 1.75 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '0.88rem', color: '#e2e8f0' }}>
            {creature.name ?? creature.species?.name ?? 'Unknown'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, ml: 0.5 }}>
            {creature.is_shiny && (
              <Chip label="✦" size="small" sx={{ fontSize: '0.6rem', height: 18, fontFamily: '"Raleway", sans-serif', fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.4)', minWidth: 0, px: 0.5 }} />
            )}
            <Chip label={rarity.label} size="small" sx={{
              fontSize: '0.6rem', height: 18, fontFamily: '"Raleway", sans-serif', fontWeight: 700,
              color: rarity.color, background: `${rarity.color}18`, border: `1px solid ${rarity.color}44`,
            }} />
          </Box>
        </Box>
        <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: '"Raleway", sans-serif', mb: 0.5 }}>
          {creature.species?.name} · Gen {creature.generation}
        </Typography>
        {onCooldown && (
          <Typography sx={{ fontSize: '0.68rem', color: '#f59e0b', fontFamily: '"Raleway", sans-serif' }}>
            Cooldown: {cooldownLabel}
          </Typography>
        )}
      </Box>
    </Card>
  );
}

export default function BreedingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [adults, setAdults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]); // max 2 creature ids
  const [breeding, setBreeding] = useState(false);
  const [result, setResult] = useState(null); // { offspringId, speciesName }
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from('creatures')
      .select(`
        id, name, gender, generation, breed_cooldown_until, species_id, is_shiny,
        species:species_id ( name, rarity )
      `)
      .eq('owner_id', user.id)
      .eq('stage', 'adult')
      .order('adopted_at', { ascending: false })
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return; }

        const speciesIds = [...new Set(data.map(c => c.species_id))];
        const { data: biomeRows } = await supabase
          .from('species_biomes')
          .select('species_id, biome_id')
          .in('species_id', speciesIds);

        const biomeMap = {};
        (biomeRows ?? []).forEach(r => { biomeMap[r.species_id] = r.biome_id; });

        setAdults(data.map(c => ({ ...c, species_biome: biomeMap[c.species_id] ?? 'umihotaru' })));
        setLoading(false);
      });
  }, [user]);

  function toggleSelect(creature) {
    setSelected(prev => {
      if (prev.includes(creature.id)) return prev.filter(id => id !== creature.id);
      if (prev.length >= 2) return [prev[1], creature.id];
      return [...prev, creature.id];
    });
    setError(null);
  }

  async function handleBreed() {
    if (selected.length !== 2 || breeding) return;
    setBreeding(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('breed_creatures', {
      p_parent_1_id: selected[0],
      p_parent_2_id: selected[1],
      p_user_id: user.id,
    });

    if (rpcError) {
      const key = Object.keys(ERROR_MESSAGES).find(k => rpcError.message?.includes(k)) ?? 'default';
      setError(ERROR_MESSAGES[key]);
      setBreeding(false);
      return;
    }

    const { data: offspring } = await supabase
      .from('creatures')
      .select('id, is_shiny, species:species_id ( name )')
      .eq('id', data)
      .single();

    setResult({ offspringId: data, speciesName: offspring?.species?.name ?? 'Unknown', isShiny: offspring?.is_shiny ?? false });
    setBreeding(false);
  }

  const selectedCreatures = adults.filter(c => selected.includes(c.id));

  if (!user) {
    return (
      <>
        <NebulaBackground src="images/arcadia_bg.mp4" />
        <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Typography sx={{ color: '#94a3b8', fontFamily: '"Raleway", sans-serif' }}>
            Sign in to access the breeding grounds.
          </Typography>
        </Container>
      </>
    );
  }

  return (
    <>
      <NebulaBackground src="images/arcadia_bg.mp4" />
      <Container maxWidth="lg" sx={{ py: 6, position: 'relative', zIndex: 1 }}>

        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/arcadia/vivarium')}
          sx={{ color: '#64748b', fontFamily: '"Raleway", sans-serif', fontSize: '0.8rem', mb: 3, '&:hover': { color: '#e2e8f0' } }}
        >
          Vivarium
        </Button>

        <Box sx={{ mb: 5 }}>
          <Typography sx={{
            fontFamily: '"Cinzel", serif', fontWeight: 700,
            fontSize: { xs: '1.6rem', md: '2.2rem' },
            color: '#f1f5f9',
            filter: 'drop-shadow(0 0 18px rgba(13,148,136,0.35))',
            letterSpacing: '-0.01em',
            mb: 0.5,
          }}>
            Breeding
          </Typography>
          <Typography sx={{ color: '#94a3b8', fontFamily: '"Raleway", sans-serif', fontSize: '0.88rem' }}>
            Select two adults to breed. Offspring inherits one parent's species at random.
          </Typography>
        </Box>

        {/* Result screen */}
        {result && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            {result.isShiny && (
              <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '0.8rem', letterSpacing: '0.2em', color: '#fbbf24', mb: 1.5, filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' }}>
                ✦ &nbsp; A SHINY EGG &nbsp; ✦
              </Typography>
            )}
            <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.4rem', color: result.isShiny ? '#fbbf24' : '#e2e8f0', mb: 1, filter: result.isShiny ? 'drop-shadow(0 0 12px rgba(251,191,36,0.4))' : 'none' }}>
              A {result.speciesName} egg appeared.
            </Typography>
            <Typography sx={{ color: '#94a3b8', fontFamily: '"Raleway", sans-serif', fontSize: '0.88rem', mb: 5 }}>
              Both parents are on a 7-day cooldown.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={() => navigate(`/arcadia/creature/${result.offspringId}`)}
                sx={{
                  fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '0.82rem',
                  letterSpacing: '0.08em', px: 4, py: 1.2,
                  background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.5)',
                  color: '#e2e8f0', '&:hover': { background: 'rgba(124,58,237,0.5)' },
                }}
              >
                View Hatchling
              </Button>
              <Button
                onClick={() => { setResult(null); setSelected([]); }}
                sx={{ color: '#64748b', fontFamily: '"Raleway", sans-serif', '&:hover': { color: '#94a3b8' } }}
              >
                Breed Again
              </Button>
            </Box>
          </Box>
        )}

        {/* Breeding UI */}
        {!result && (
          <>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress sx={{ color: '#7c3aed' }} />
              </Box>
            )}

            {!loading && adults.length < 2 && (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '1rem', color: '#e2e8f0', mb: 1 }}>
                  Not enough adults.
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontFamily: '"Raleway", sans-serif', fontSize: '0.88rem', mb: 4 }}>
                  You need at least two adult creatures to breed.
                </Typography>
                <Button
                  onClick={() => navigate('/arcadia')}
                  sx={{
                    fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '0.78rem',
                    color: '#e2e8f0',
                    background: 'linear-gradient(rgba(6,4,20,0.92), rgba(6,4,20,0.92)) padding-box, linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%) border-box',
                    border: '1.5px solid transparent',
                    borderRadius: '6px',
                    px: 3, py: 1, textTransform: 'none',
                    transition: 'box-shadow 0.2s ease',
                    '&:hover': { background: 'linear-gradient(rgba(10,6,28,0.96), rgba(10,6,28,0.96)) padding-box, linear-gradient(135deg, #c084fc 0%, #38bdf8 100%) border-box', boxShadow: '0 0 18px rgba(167,139,250,0.2)' },
                  }}
                >
                  Explore Worlds
                </Button>
              </Box>
            )}

            {!loading && adults.length >= 2 && (
              <>
                <Grid container spacing={2}>
                  {adults.map(creature => (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={creature.id}>
                      <CreatureCard
                        creature={creature}
                        selected={selected.includes(creature.id)}
                        onSelect={toggleSelect}
                        disabled={selected.length >= 2 && !selected.includes(creature.id)}
                      />
                    </Grid>
                  ))}
                </Grid>

                {/* Breed action bar */}
                <Box sx={{
                  mt: 5, p: 3,
                  background: 'rgba(6,4,20,0.92)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: 2,
                }}>
                  <Box>
                    {selected.length === 0 && (
                      <Typography sx={{ color: '#64748b', fontFamily: '"Raleway", sans-serif', fontSize: '0.85rem' }}>
                        Select two adults to begin.
                      </Typography>
                    )}
                    {selected.length === 1 && (
                      <Typography sx={{ color: '#94a3b8', fontFamily: '"Raleway", sans-serif', fontSize: '0.85rem' }}>
                        {selectedCreatures[0]?.name ?? selectedCreatures[0]?.species?.name} selected — choose one more.
                      </Typography>
                    )}
                    {selected.length === 2 && (
                      <Typography sx={{ color: '#e2e8f0', fontFamily: '"Raleway", sans-serif', fontSize: '0.85rem' }}>
                        {selectedCreatures.map(c => c.name ?? c.species?.name).join(' × ')}
                      </Typography>
                    )}
                    {error && (
                      <Typography sx={{ color: '#ef4444', fontFamily: '"Raleway", sans-serif', fontSize: '0.78rem', mt: 0.5 }}>
                        {error}
                      </Typography>
                    )}
                  </Box>

                  <Button
                    variant="contained"
                    disabled={selected.length !== 2 || breeding}
                    onClick={handleBreed}
                    sx={{
                      fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '0.82rem',
                      letterSpacing: '0.1em', px: 4, py: 1.1,
                      background: selected.length === 2 ? 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(13,148,136,0.4))' : 'rgba(124,58,237,0.15)',
                      border: '1px solid rgba(124,58,237,0.4)', color: '#e2e8f0',
                      boxShadow: selected.length === 2 ? '0 0 20px rgba(124,58,237,0.25)' : 'none',
                      '&:hover': { background: 'linear-gradient(135deg, rgba(124,58,237,0.6), rgba(13,148,136,0.6))' },
                      '&.Mui-disabled': { opacity: 0.35, color: '#e2e8f0' },
                    }}
                  >
                    {breeding ? 'Breeding…' : 'Breed'}
                  </Button>
                </Box>
              </>
            )}
          </>
        )}

      </Container>
    </>
  );
}
