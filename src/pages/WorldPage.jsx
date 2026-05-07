import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Card, Chip, Grid, CircularProgress, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import NebulaBackground from '../components/NebulaBackground';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function eggSpriteUrl(speciesId) {
  return `${SUPABASE_URL}/storage/v1/object/public/creature-sprites/${speciesId}_egg.png`;
}

const WORLD_CONFIG = {
  umihotaru: {
    gradient: 'linear-gradient(145deg, #042f2e 0%, #0d9488 60%, #0ea5e9 100%)',
    glow: 'rgba(13, 148, 136, 0.5)',
    accent: '#0d9488',
    scanLabel: 'Pushing through the undergrowth...',
    caveText: 'Pushing through the bioluminescent undergrowth, you find a hollow carved into the reef-rock, dark and still, three softly glowing eggs nestled in the moss. Whatever left them here is long gone.',
  },
  enlil: {
    gradient: 'linear-gradient(145deg, #451a03 0%, #b45309 55%, #fbbf24 100%)',
    glow: 'rgba(180, 83, 9, 0.5)',
    accent: '#f59e0b',
    scanLabel: 'Tracking the migration trail...',
    caveText: 'The herd passed through here days ago. In the dust at the base of a sandstone outcrop, half-sheltered from the wind, three eggs sit unclaimed, left behind when the migration moved on.',
  },
  taranis: {
    gradient: 'linear-gradient(145deg, #1e1b4b 0%, #6d28d9 55%, #a78bfa 100%)',
    glow: 'rgba(109, 40, 217, 0.5)',
    accent: '#a78bfa',
    scanLabel: 'Filtering EM interference...',
    caveText: "Deep in the crystal caves, where the storm's static hum becomes a physical pressure, you find a sheltered alcove. Three eggs rest in the hollow, flickering faintly with absorbed charge.",
  },
  janus: {
    gradient: 'linear-gradient(90deg, #7f1d1d 0%, #3b0000 45%, #001233 55%, #1e3a5f 100%)',
    glow: 'rgba(127, 29, 29, 0.4)',
    accent: '#ef4444',
    scanLabel: 'Scanning the Terminator strip...',
    caveText: 'In a crack along the strip where warm air bleeds into cold, you find three eggs wedged into the rock, one side of the alcove faintly scorched, the other crusted with frost. Something laid them here deliberately.',
  },
};

const RARITY_CONFIG = {
  common:    { color: '#94a3b8', label: 'Common' },
  uncommon:  { color: '#4ade80', label: 'Uncommon' },
  rare:      { color: '#38bdf8', label: 'Rare' },
  very_rare: { color: '#c084fc', label: 'Very Rare' },
};

const EGG_HINTS = {
  lumoth:      'Dusty spores cling to the shell. Something inside is restless.',
  veloshade:   'Larger than expected for its weight. A faint vibration hums against your palm.',
  reefwyrm:    'Iridescent bands shift across the shell in the light.',
  duskstrider: 'Warm to the touch. You can feel a faint heartbeat through the shell.',
  sandreaver:  'Hairline fractures run across the surface like sun-baked earth.',
  ridgecrown:  'Surprisingly heavy. The shell has a rough, almost mineral texture.',
  lucerna:     'Cold despite the ambient heat. A faint violet glow pulses from within.',
  kaminari:    'Smooth and storm-grey. You feel a static charge when you pick it up.',
  raijin:      'The air around it smells like a lightning strike.',
  hazama:      "One side warm, one side cold. You're not sure which is which.",
  scoria:      'Jet black with a glassy surface. Heavier and warmer than it looks.',
  rimewarden:  "Ancient. The shell has a geological quality. You're not sure it's an egg at all.",
};

export default function WorldPage() {
  const { worldId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [world, setWorld] = useState(null);
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adoptingSlot, setAdoptingSlot] = useState(null);
  const [eggCount, setEggCount] = useState(0);
  const [justAdopted, setJustAdopted] = useState(null);
  const [error, setError] = useState(null);

  const config = WORLD_CONFIG[worldId] ?? WORLD_CONFIG.umihotaru;

  useEffect(() => {
    supabase.from('biomes').select('*').eq('id', worldId).single()
      .then(({ data }) => setWorld(data));
  }, [worldId]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('creatures')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .eq('stage', 'egg')
      .then(({ count }) => setEggCount(count ?? 0));
  }, [user]);

  useEffect(() => {
    loadPool();
  }, [worldId]);

  async function loadPool() {
    setLoading(true);
    const { data: slots, error: rpcErr } = await supabase.rpc('get_expedition_pool', { p_world_id: worldId });
    if (rpcErr || !slots) {
      setError(`Pool load failed: ${rpcErr?.message ?? 'no data'} (code: ${rpcErr?.code ?? '?'})`);
      setLoading(false);
      return;
    }

    const speciesIds = [...new Set(slots.map(s => s.species_id))];
    const { data: speciesRows } = await supabase
      .from('species')
      .select('id, name, rarity')
      .in('id', speciesIds);

    const speciesMap = {};
    (speciesRows ?? []).forEach(s => { speciesMap[s.id] = s; });

    setPool(slots.map(slot => ({ ...slot, species: speciesMap[slot.species_id] })));
    setLoading(false);
  }

  async function handleAdopt(slot) {
    if (!user || adoptingSlot !== null) return;
    setAdoptingSlot(slot.slot);
    setError(null);

    const { data: newCreature, error: insertErr } = await supabase
      .from('creatures')
      .insert({
        species_id: slot.species_id,
        owner_id: user.id,
        gender: slot.gender,
        stage: 'egg',
        is_cave_born: true,
        generation: 1,
      })
      .select()
      .single();

    if (insertErr) {
      setError('Something went wrong. Please try again.');
      setAdoptingSlot(null);
      return;
    }

    const { data: newSlots } = await supabase.rpc('replace_expedition_slot', {
      p_world_id: worldId,
      p_slot: slot.slot,
    });

    if (newSlots?.length > 0) {
      const newSlot = newSlots[0];
      const { data: speciesData } = await supabase
        .from('species')
        .select('id, name, rarity')
        .eq('id', newSlot.species_id)
        .single();

      setPool(prev => prev.map(p =>
        p.slot === slot.slot ? { ...newSlot, species: speciesData } : p
      ));
    }

    setJustAdopted({ name: slot.species?.name ?? 'Egg', creatureId: newCreature.id });
    setEggCount(c => c + 1);
    setAdoptingSlot(null);
  }

  return (
    <>
      <NebulaBackground src="images/arcadia_bg.mp4" />
      <Container maxWidth="lg" sx={{ py: 6, position: 'relative', zIndex: 1 }}>

        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/arcadia')}
          sx={{ color: '#64748b', fontFamily: '"Raleway", sans-serif', fontSize: '0.8rem', mb: 3, '&:hover': { color: '#e2e8f0' } }}
        >
          All Worlds
        </Button>

        {/* World header */}
        <Box sx={{ borderRadius: 3, overflow: 'hidden', mb: 5, border: '1px solid rgba(124,58,237,0.12)' }}>
          <Box sx={{ height: 140, background: config.gradient, position: 'relative' }}>
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(6,4,20,0.9) 100%)' }} />
          </Box>
          <Box sx={{ background: 'rgba(6,4,20,0.92)', backdropFilter: 'blur(20px)', px: { xs: 3, md: 5 }, py: 3 }}>
            <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' }, color: '#e2e8f0', mb: 1 }}>
              {world?.name ?? worldId}
            </Typography>
            <Typography sx={{ color: '#64748b', fontFamily: '"Raleway", sans-serif', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: 700 }}>
              {world?.description}
            </Typography>
          </Box>
        </Box>

        {/* Success banner */}
        {justAdopted && (
          <Box sx={{ mb: 3, p: 2.5, background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.22)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Typography sx={{ fontFamily: '"Raleway", sans-serif', fontSize: '0.88rem', color: '#e2e8f0' }}>
              You picked up a <strong>{justAdopted.name}</strong> egg.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button size="small" onClick={() => navigate(`/arcadia/creature/${justAdopted.creatureId}`)}
                sx={{ fontFamily: '"Raleway", sans-serif', fontSize: '0.75rem', color: '#0d9488', '&:hover': { color: '#e2e8f0' } }}>
                View Egg
              </Button>
              <Button size="small" onClick={() => setJustAdopted(null)}
                sx={{ fontFamily: '"Raleway", sans-serif', fontSize: '0.75rem', color: '#64748b', '&:hover': { color: '#94a3b8' } }}>
                Dismiss
              </Button>
            </Box>
          </Box>
        )}

        {/* Not signed in */}
        {!user && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ color: '#94a3b8', fontFamily: '"Raleway", sans-serif' }}>
              Sign in to explore this world.
            </Typography>
          </Box>
        )}

        {/* Egg cap */}
        {user && eggCount >= 5 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '1rem', color: '#e2e8f0', mb: 1 }}>
              Vivarium capacity reached.
            </Typography>
            <Typography sx={{ color: '#94a3b8', fontFamily: '"Raleway", sans-serif', fontSize: '0.88rem', mb: 3 }}>
              You have {eggCount} eggs. Wait for some to hatch before taking another.
            </Typography>
            <Button onClick={() => navigate('/arcadia/vivarium')} variant="outlined"
              sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.1em', color: '#94a3b8', borderColor: 'rgba(148,163,184,0.3)', textTransform: 'none', '&:hover': { borderColor: '#94a3b8', background: 'rgba(148,163,184,0.06)' } }}>
              View Vivarium
            </Button>
          </Box>
        )}

        {/* Loading */}
        {user && eggCount < 5 && loading && (
          <Box sx={{ textAlign: 'center', py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <Box sx={{ position: 'relative', width: 100, height: 100 }}>
              {[0, 1, 2].map(i => (
                <Box key={i} sx={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: `1.5px solid ${config.accent}`,
                  '@keyframes scanRing': { '0%': { transform: 'scale(0.2)', opacity: 0.9 }, '100%': { transform: 'scale(2.2)', opacity: 0 } },
                  animation: 'scanRing 2.2s ease-out infinite',
                  animationDelay: `${i * 0.7}s`,
                }} />
              ))}
              <Box sx={{
                position: 'absolute', inset: '35%', borderRadius: '50%',
                background: config.accent, opacity: 0.7, boxShadow: `0 0 16px ${config.glow}`,
                '@keyframes corePulse': { '0%, 100%': { opacity: 0.7, transform: 'scale(1)' }, '50%': { opacity: 1, transform: 'scale(1.15)' } },
                animation: 'corePulse 1.4s ease-in-out infinite',
              }} />
            </Box>
            <Typography sx={{ color: config.accent, fontFamily: '"Cinzel", serif', fontSize: '0.85rem', letterSpacing: '0.12em', opacity: 0.9 }}>
              {config.scanLabel}
            </Typography>
          </Box>
        )}

        {/* Pool */}
        {user && eggCount < 5 && !loading && (
          <>
            <Typography sx={{ color: '#94a3b8', fontFamily: '"Raleway", sans-serif', fontSize: '0.88rem', lineHeight: 1.75, fontStyle: 'italic', mb: 3, maxWidth: 680 }}>
              {config.caveText}
            </Typography>
            <Typography sx={{ color: '#64748b', fontFamily: '"Raleway", sans-serif', fontSize: '0.82rem', mb: 2.5 }}>
              Choose one of the eggs to take back to the ship with you.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={2}>
              {pool.map(slot => {
                const rarity = RARITY_CONFIG[slot.species?.rarity] ?? RARITY_CONFIG.common;
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={slot.slot}>
                    <Card sx={{
                      background: 'rgba(6, 4, 20, 0.88)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid rgba(124,58,237,0.12)`,
                      borderRadius: 2.5,
                      overflow: 'hidden',
                      transition: 'box-shadow 0.2s ease',
                      '&:hover': { boxShadow: `0 0 24px ${config.glow}`, borderColor: `${rarity.color}44` },
                    }}>
                      <Box sx={{ height: 80, background: config.gradient, opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={eggSpriteUrl(slot.species_id)} alt={slot.species?.name} style={{ height: 64, width: 64, objectFit: 'contain' }} />
                      </Box>
                      <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
                            {slot.species?.name ?? '???'}
                          </Typography>
                          <Chip label={rarity.label} size="small" sx={{
                            fontSize: '0.65rem', height: 20, fontFamily: '"Raleway", sans-serif', fontWeight: 700,
                            color: rarity.color, background: `${rarity.color}18`, border: `1px solid ${rarity.color}44`,
                          }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontFamily: '"Raleway", sans-serif', fontStyle: 'italic', mb: 1.5, lineHeight: 1.55 }}>
                          {EGG_HINTS[slot.species_id] ?? ''}
                        </Typography>
                        <Button
                          fullWidth variant="outlined" size="small"
                          onClick={() => handleAdopt(slot)}
                          disabled={adoptingSlot !== null}
                          sx={{
                            fontFamily: '"Raleway", sans-serif', fontWeight: 700, fontSize: '0.75rem',
                            color: rarity.color, borderColor: `${rarity.color}55`,
                            '&:hover': { borderColor: rarity.color, background: `${rarity.color}11` },
                            '&.Mui-disabled': { opacity: 0.4, color: rarity.color },
                          }}
                        >
                          {adoptingSlot === slot.slot
                            ? <CircularProgress size={14} sx={{ color: rarity.color }} />
                            : 'Take Egg'}
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}

      </Container>
    </>
  );
}
