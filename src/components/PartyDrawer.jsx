import { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '../lib/supabase';
import { getSystem } from '../data/systems';

function hpPercent(data) {
  const cur = Number(data?.hp_current ?? data?.physical_monitor ?? 0);
  const max = Number(data?.hp_max ?? data?.physical_monitor ?? 1);
  return Math.max(0, Math.min(100, (cur / Math.max(max, 1)) * 100));
}

function hpColor(pct) {
  if (pct > 60) return '#10b981';
  if (pct > 25) return '#f59e0b';
  return '#ef4444';
}

function getSubtitle(systemId, d) {
  if (systemId === 'dnd5e') return [d.race, d.subclass || d.class, d.level && `Lv ${d.level}`].filter(Boolean).join(' · ');
  if (systemId === 'swn') return [d.class, d.level && `Lv ${d.level}`, d.homeworld].filter(Boolean).join(' · ');
  if (systemId === 'shadowrun') return [d.metatype, d.archetype].filter(Boolean).join(' · ');
  return '';
}

function CharacterCard({ character, systemId }) {
  const d = character.sheet_data ?? {};
  const pct = hpPercent(d);
  const color = hpColor(pct);

  return (
    <Card
      sx={{
        background: 'rgba(6,4,20,0.7)',
        border: '1px solid rgba(124,58,237,0.18)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <CardContent sx={{ pb: '12px !important' }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.95rem',
            background: 'linear-gradient(135deg, #f1f5f9, #c084fc)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.25,
          }}
        >
          {character.name}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
          {getSubtitle(systemId, d)}
        </Typography>

        {/* HP bar */}
        {(d.hp_max || d.physical_monitor) && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'rgba(148,163,184,0.6)', letterSpacing: '0.1em' }}>HP</Typography>
              <Typography variant="caption" sx={{ fontSize: '0.68rem', color }}>
                {d.hp_current ?? d.physical_monitor} / {d.hp_max ?? d.physical_monitor}
              </Typography>
            </Box>
            <Box sx={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.3s ease' }} />
            </Box>
          </Box>
        )}

        {/* Key stats */}
        <Box sx={{ display: 'flex', gap: 1.5, mt: 1.25 }}>
          {d.ac && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'rgba(148,163,184,0.5)', display: 'block', letterSpacing: '0.1em' }}>AC</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>{d.ac}</Typography>
            </Box>
          )}
          {(d.armor !== undefined) && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'rgba(148,163,184,0.5)', display: 'block', letterSpacing: '0.1em' }}>ARMOR</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>{d.armor}</Typography>
            </Box>
          )}
          {d.speed && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'rgba(148,163,184,0.5)', display: 'block', letterSpacing: '0.1em' }}>SPD</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>{d.speed}</Typography>
            </Box>
          )}
          {d.essence && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'rgba(148,163,184,0.5)', display: 'block', letterSpacing: '0.1em' }}>ESS</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>{d.essence}</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function PartyDrawer({ open, onClose, campaignId, systemId }) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !campaignId) return;
    setLoading(true);

    supabase
      .from('characters')
      .select('*')
      .eq('campaign_id', campaignId)
      .then(({ data }) => {
        setCharacters(data ?? []);
        setLoading(false);
      });
  }, [open, campaignId]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100vw', sm: 560 },
          background: 'rgba(6,4,20,0.97)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(124,58,237,0.2)',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: '1px solid rgba(124,58,237,0.15)',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Cinzel", serif',
              fontSize: '0.75rem',
              letterSpacing: '0.2em',
              color: 'rgba(124,58,237,0.8)',
              textTransform: 'uppercase',
            }}
          >
            Party — {characters.length} {characters.length === 1 ? 'Character' : 'Characters'}
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Character grid */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
              <CircularProgress size={28} sx={{ color: '#7c3aed' }} />
            </Box>
          ) : characters.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', pt: 4 }}>
              No characters have joined this campaign yet.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {characters.map((char) => (
                <Grid size={{ xs: 12, sm: 6 }} key={char.id}>
                  <CharacterCard character={char} systemId={char.system_id ?? systemId} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
