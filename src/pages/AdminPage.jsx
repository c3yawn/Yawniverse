import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import NebulaBackground from '../components/NebulaBackground';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [quoteText, setQuoteText] = useState('');
  const [attribution, setAttribution] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading || !isAdmin) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: '#7c3aed' }} />
      </Box>
    );
  }

  async function handleSaveQuote(e) {
    e.preventDefault();
    if (!quoteText.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('quotes').insert({
      text: quoteText.trim(),
      attribution: attribution.trim() || null,
    });
    setSaving(false);
    if (error) {
      setToast({ open: true, message: 'Failed to save quote. Check console for details.', severity: 'error' });
      console.error(error);
    } else {
      setQuoteText('');
      setAttribution('');
      setToast({ open: true, message: 'Quote saved successfully.', severity: 'success' });
    }
  }

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      fontFamily: '"Raleway", sans-serif',
      fontSize: '0.88rem',
      color: '#e2e8f0',
      '& fieldset': { borderColor: 'rgba(124,58,237,0.2)' },
      '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.4)' },
      '&.Mui-focused fieldset': { borderColor: 'rgba(124,58,237,0.7)' },
    },
    '& .MuiInputLabel-root': {
      fontFamily: '"Raleway", sans-serif',
      fontSize: '0.82rem',
      color: '#64748b',
      '&.Mui-focused': { color: '#a78bfa' },
    },
  };

  return (
    <>
      <NebulaBackground />

      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Cinzel", serif',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: '#a78bfa',
            mb: 0.75,
          }}
        >
          Admin Tools
        </Typography>
        <Typography sx={{ fontFamily: '"Raleway", sans-serif', fontSize: '0.8rem', color: '#475569', mb: 6 }}>
          Yawniverse admin access only.
        </Typography>

        <Paper
          sx={{
            background: 'rgba(6, 4, 20, 0.88)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(124, 58, 237, 0.12)',
            borderRadius: '12px',
            p: { xs: 3, sm: 4 },
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Cinzel", serif',
              fontSize: '0.85rem',
              letterSpacing: '0.14em',
              color: '#c084fc',
              mb: 0.5,
              textTransform: 'uppercase',
            }}
          >
            Add a Quote
          </Typography>
          <Typography sx={{ fontFamily: '"Raleway", sans-serif', fontSize: '0.78rem', color: '#475569', mb: 3 }}>
            Quotes are shown randomly on the homepage. Leave attribution blank to display no source.
          </Typography>

          <Box component="form" onSubmit={handleSaveQuote} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Quote text"
              multiline
              minRows={3}
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              required
              fullWidth
              sx={fieldSx}
            />
            <TextField
              label="Attribution"
              placeholder="e.g. — Plutarch, on Alexander"
              value={attribution}
              onChange={(e) => setAttribution(e.target.value)}
              fullWidth
              sx={fieldSx}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={saving || !quoteText.trim()}
                sx={{
                  fontFamily: '"Raleway", sans-serif',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  letterSpacing: '0.08em',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  borderRadius: '6px',
                  px: 3,
                  py: 0.9,
                  '&:hover': { background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
                  '&.Mui-disabled': { opacity: 0.4 },
                }}
              >
                {saving ? 'Saving…' : 'Save Quote'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ fontFamily: '"Raleway", sans-serif', fontSize: '0.82rem' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}
