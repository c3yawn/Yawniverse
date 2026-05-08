import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Avatar, TextField,
  IconButton, CircularProgress, Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import NebulaBackground from '../components/NebulaBackground';

function StatBox({ label, value }) {
  return (
    <Box sx={{ textAlign: 'center', flex: 1 }}>
      <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.5rem', color: '#e2e8f0', lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontFamily: '"Raleway", sans-serif', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mt: 0.5 }}>
        {label}
      </Typography>
    </Box>
  );
}

export default function ProfilePage() {
  const { user, profile, fetchProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [editingDisplay, setEditingDisplay] = useState(false);
  const [displayInput, setDisplayInput] = useState('');
  const [displaySaving, setDisplaySaving] = useState(false);
  const [displayError, setDisplayError] = useState('');

  const avatarSrc = profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? undefined;
  const displayName = profile?.display_name || profile?.username || user?.user_metadata?.full_name || '';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '';

  useEffect(() => {
    if (!user) return;

    supabase
      .from('creatures')
      .select('stage')
      .eq('owner_id', user.id)
      .then(({ data }) => {
        const rows = data ?? [];
        setStats({
          total: rows.length,
          eggs: rows.filter(c => c.stage === 'egg').length,
          juveniles: rows.filter(c => c.stage === 'juvenile').length,
          adults: rows.filter(c => c.stage === 'adult').length,
        });
        setLoadingStats(false);
      });
  }, [user]);

  function startEditDisplay() {
    setDisplayInput(profile?.display_name ?? '');
    setDisplayError('');
    setEditingDisplay(true);
  }

  async function saveDisplay() {
    const trimmed = displayInput.trim();
    if (trimmed.length > 40) { setDisplayError('Max 40 characters.'); return; }

    setDisplaySaving(true);
    setDisplayError('');
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: trimmed || null })
      .eq('id', user.id);

    setDisplaySaving(false);
    if (error) {
      setDisplayError('Failed to save. Try again.');
    } else {
      await fetchProfile(user.id);
      setEditingDisplay(false);
    }
  }

  if (!user) {
    return (
      <>
        <NebulaBackground src="images/arcadia_bg.mp4" />
        <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Typography sx={{ color: '#94a3b8', fontFamily: '"Raleway", sans-serif', mb: 3 }}>
            Sign in to view your profile.
          </Typography>
          <Button onClick={() => navigate('/arcadia')} sx={{ color: '#a78bfa', fontFamily: '"Raleway", sans-serif' }}>
            Back to Arcadia
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <NebulaBackground src="images/arcadia_bg.mp4" />
      <Container maxWidth="sm" sx={{ py: 6, position: 'relative', zIndex: 1 }}>

        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/arcadia')}
          sx={{ color: '#64748b', fontFamily: '"Raleway", sans-serif', fontSize: '0.8rem', mb: 3, '&:hover': { color: '#e2e8f0' } }}
        >
          Arcadia
        </Button>

        {/* Identity card */}
        <Box
          sx={{
            background: 'rgba(6,4,20,0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(124,58,237,0.12)',
            borderRadius: 3,
            p: { xs: 3, sm: 4 },
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Avatar
              src={avatarSrc}
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
              {!avatarSrc && (user?.user_metadata?.full_name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontFamily: '"Raleway", sans-serif', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5 }}>
                Username
              </Typography>
              <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.25rem', color: '#e2e8f0' }}>
                {profile?.username ?? '—'}
              </Typography>
              {memberSince && (
                <Typography sx={{ fontFamily: '"Raleway", sans-serif', fontSize: '0.75rem', color: '#475569', mt: 0.5 }}>
                  Member since {memberSince}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(124,58,237,0.08)', mb: 3 }} />

          {/* Display name row */}
          <Box>
            <Typography sx={{ fontFamily: '"Raleway", sans-serif', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
              Display Name
            </Typography>
            {editingDisplay ? (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  value={displayInput}
                  onChange={e => { setDisplayInput(e.target.value); setDisplayError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') saveDisplay(); if (e.key === 'Escape') setEditingDisplay(false); }}
                  size="small"
                  autoFocus
                  placeholder="Optional display name"
                  error={!!displayError}
                  helperText={displayError || 'Shown in place of your username where space allows.'}
                  inputProps={{ maxLength: 40 }}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      fontFamily: '"Raleway", sans-serif',
                      fontSize: '0.9rem',
                      color: '#e2e8f0',
                      '& fieldset': { borderColor: 'rgba(124,58,237,0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.55)' },
                      '&.Mui-focused fieldset': { borderColor: '#7c3aed' },
                    },
                    '& .MuiFormHelperText-root': { fontFamily: '"Raleway", sans-serif', fontSize: '0.72rem' },
                  }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <IconButton onClick={saveDisplay} disabled={displaySaving} size="small" sx={{ color: '#7c3aed', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 1.5 }}>
                    {displaySaving ? <CircularProgress size={14} sx={{ color: '#7c3aed' }} /> : <CheckIcon fontSize="small" />}
                  </IconButton>
                  <IconButton onClick={() => setEditingDisplay(false)} size="small" sx={{ color: '#475569', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 1.5 }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontFamily: '"Raleway", sans-serif', fontSize: '0.95rem', color: displayName ? '#e2e8f0' : '#475569', fontStyle: displayName ? 'normal' : 'italic' }}>
                  {displayName || 'Not set'}
                </Typography>
                <IconButton onClick={startEditDisplay} size="small" sx={{ color: '#475569', '&:hover': { color: '#94a3b8' } }}>
                  <EditIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>

        {/* Creature stats */}
        <Box
          sx={{
            background: 'rgba(6,4,20,0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(124,58,237,0.12)',
            borderRadius: 3,
            p: { xs: 3, sm: 4 },
            mb: 3,
          }}
        >
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '0.8rem', color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase', mb: 3 }}>
            Collection
          </Typography>

          {loadingStats ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} sx={{ color: '#7c3aed' }} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <StatBox label="Total" value={stats.total} />
              <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(124,58,237,0.1)' }} />
              <StatBox label="Eggs" value={stats.eggs} />
              <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(124,58,237,0.1)' }} />
              <StatBox label="Juveniles" value={stats.juveniles} />
              <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(124,58,237,0.1)' }} />
              <StatBox label="Adults" value={stats.adults} />
            </Box>
          )}

          {!loadingStats && stats.total > 0 && (
            <Button
              onClick={() => navigate('/arcadia/vivarium')}
              sx={{
                mt: 3,
                color: '#7c3aed',
                fontFamily: '"Raleway", sans-serif',
                fontSize: '0.8rem',
                p: 0,
                '&:hover': { background: 'transparent', color: '#a78bfa' },
              }}
            >
              View Vivarium →
            </Button>
          )}
        </Box>

        {/* Account actions */}
        <Box
          sx={{
            background: 'rgba(6,4,20,0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(124,58,237,0.08)',
            borderRadius: 3,
            p: { xs: 3, sm: 4 },
          }}
        >
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '0.8rem', color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase', mb: 2 }}>
            Account
          </Typography>
          <Typography sx={{ fontFamily: '"Raleway", sans-serif', fontSize: '0.8rem', color: '#475569', mb: 2.5 }}>
            {user.email}
          </Typography>
          <Button
            onClick={() => { signOut(); navigate('/'); }}
            variant="outlined"
            sx={{
              fontFamily: '"Raleway", sans-serif',
              fontWeight: 600,
              fontSize: '0.8rem',
              color: '#64748b',
              borderColor: 'rgba(255,255,255,0.08)',
              textTransform: 'none',
              '&:hover': { color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.04)' },
            }}
          >
            Sign Out
          </Button>
        </Box>

      </Container>
    </>
  );
}
