import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { supabase } from '../lib/supabase';

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

function PartyMemberRow({ character, systemId }) {
  const d = character.sheet_data ?? {};
  const pct = hpPercent(d);
  const color = hpColor(pct);
  const subtitle = getSubtitle(systemId ?? character.system_id, d);
  const hasHp = d.hp_max || d.physical_monitor;

  return (
    <Box
      sx={{
        p: 1.5,
        mb: 1,
        borderRadius: 1,
        background: 'rgba(6,4,20,0.5)',
        border: '1px solid rgba(124,58,237,0.12)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.25 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.82rem',
            background: 'linear-gradient(135deg, #f1f5f9, #c084fc)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {character.name}
        </Typography>
        {hasHp && (
          <Typography variant="caption" sx={{ fontSize: '0.62rem', color, flexShrink: 0, ml: 1 }}>
            {d.hp_current ?? d.physical_monitor} / {d.hp_max ?? d.physical_monitor} HP
          </Typography>
        )}
      </Box>

      {subtitle && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.65rem', mb: subtitle && hasHp ? 0.5 : 0 }}>
          {subtitle}
        </Typography>
      )}

      {hasHp && (
        <Box sx={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', mb: 0.75 }}>
          <Box sx={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {d.ac !== undefined && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ fontSize: '0.5rem', color: 'rgba(148,163,184,0.45)', display: 'block', letterSpacing: '0.1em' }}>AC</Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>{d.ac}</Typography>
          </Box>
        )}
        {d.speed !== undefined && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ fontSize: '0.5rem', color: 'rgba(148,163,184,0.45)', display: 'block', letterSpacing: '0.1em' }}>SPD</Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>{d.speed}</Typography>
          </Box>
        )}
        {d.armor !== undefined && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ fontSize: '0.5rem', color: 'rgba(148,163,184,0.45)', display: 'block', letterSpacing: '0.1em' }}>ARMOR</Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>{d.armor}</Typography>
          </Box>
        )}
        {d.essence !== undefined && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ fontSize: '0.5rem', color: 'rgba(148,163,184,0.45)', display: 'block', letterSpacing: '0.1em' }}>ESS</Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>{d.essence}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function GMPanel({ campaignId, systemId, mapData, onUpdateMap }) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const saveTimer = useRef(null);
  const notesInitialized = useRef(false);

  const fetchCharacters = () => {
    if (!campaignId) return;
    setLoading(true);
    supabase
      .from('characters')
      .select('*')
      .eq('campaign_id', campaignId)
      .then(({ data }) => {
        setCharacters(data ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchCharacters(); }, [campaignId]);

  useEffect(() => {
    if (!notesInitialized.current && mapData !== null) {
      setNotes(mapData?.notes ?? '');
      notesInitialized.current = true;
    }
  }, [mapData]);

  const handleNotesChange = (value) => {
    setNotes(value);
    setSaveStatus('idle');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      await onUpdateMap({ notes: value });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    }, 800);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Party overview */}
      <Box sx={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1.5, pb: 1, flexShrink: 0 }}>
          <Typography
            sx={{
              fontFamily: '"Cinzel", serif',
              fontSize: '0.58rem',
              letterSpacing: '0.2em',
              color: 'rgba(124,58,237,0.75)',
              textTransform: 'uppercase',
            }}
          >
            Party{!loading && ` · ${characters.length}`}
          </Typography>
          <Tooltip title="Refresh party">
            <IconButton
              size="small"
              onClick={fetchCharacters}
              sx={{ color: 'rgba(148,163,184,0.35)', p: 0.5, '&:hover': { color: '#a78bfa' } }}
            >
              <RefreshIcon sx={{ fontSize: '0.85rem' }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, pb: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
              <CircularProgress size={20} sx={{ color: '#7c3aed' }} />
            </Box>
          ) : characters.length === 0 ? (
            <Typography
              variant="caption"
              sx={{ color: 'rgba(148,163,184,0.35)', display: 'block', textAlign: 'center', pt: 4, fontSize: '0.68rem', letterSpacing: '0.06em' }}
            >
              No players have joined yet.
            </Typography>
          ) : (
            characters.map((char) => (
              <PartyMemberRow key={char.id} character={char} systemId={systemId} />
            ))
          )}
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(124,58,237,0.1)', flexShrink: 0 }} />

      {/* Session notes */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, p: 1.5, pt: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1, flexShrink: 0 }}>
          <Typography
            sx={{
              fontFamily: '"Cinzel", serif',
              fontSize: '0.58rem',
              letterSpacing: '0.2em',
              color: 'rgba(124,58,237,0.75)',
              textTransform: 'uppercase',
            }}
          >
            Session Notes
          </Typography>
          {saveStatus !== 'idle' && (
            <Typography
              variant="caption"
              sx={{ fontSize: '0.55rem', letterSpacing: '0.06em', color: saveStatus === 'saving' ? 'rgba(148,163,184,0.4)' : '#10b981' }}
            >
              {saveStatus === 'saving' ? 'saving…' : 'saved'}
            </Typography>
          )}
        </Box>

        <TextField
          fullWidth
          multiline
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="NPC names, plot threads, reminders…"
          variant="outlined"
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              height: '100%',
              alignItems: 'flex-start',
              fontSize: '0.78rem',
              lineHeight: 1.6,
              '& fieldset': { borderColor: 'rgba(124,58,237,0.15)' },
              '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.3)' },
              '&.Mui-focused fieldset': { borderColor: 'rgba(124,58,237,0.5)' },
            },
            '& .MuiInputBase-input': {
              height: '100% !important',
              overflowY: 'auto !important',
              color: '#cbd5e1',
            },
          }}
        />
      </Box>
    </Box>
  );
}
