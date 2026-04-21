import { Box, Button, Dialog, DialogContent, Divider, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"/>
    </svg>
  );
}

export default function SignInModal({ open, onClose }) {
  const { signInWithGoogle, signInWithDiscord } = useAuth();

  async function handleGoogle() {
    await signInWithGoogle();
    onClose();
  }

  async function handleDiscord() {
    await signInWithDiscord();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          background: 'rgba(6, 4, 20, 0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(124, 58, 237, 0.2)',
          borderRadius: '16px',
          minWidth: 340,
          px: 1,
        },
      }}
    >
      <DialogContent sx={{ py: 4, px: 4 }}>
        <Typography
          variant="h6"
          sx={{
            fontFamily: '"Cinzel", serif',
            fontWeight: 700,
            fontSize: '1rem',
            letterSpacing: '0.12em',
            color: '#e2e8f0',
            mb: 0.75,
            textAlign: 'center',
          }}
        >
          Sign In
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: '#64748b', textAlign: 'center', mb: 3, fontSize: '0.8rem' }}
        >
          Choose a provider to continue
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            onClick={handleGoogle}
            startIcon={<GoogleIcon />}
            fullWidth
            sx={{
              background: '#fff',
              color: '#1f2937',
              fontFamily: '"Raleway", sans-serif',
              fontWeight: 600,
              fontSize: '0.85rem',
              letterSpacing: '0.02em',
              py: 1.25,
              borderRadius: '8px',
              textTransform: 'none',
              '&:hover': { background: '#f1f5f9' },
            }}
          >
            Sign in with Google
          </Button>

          <Button
            onClick={handleDiscord}
            startIcon={<DiscordIcon />}
            fullWidth
            sx={{
              background: '#5865F2',
              color: '#fff',
              fontFamily: '"Raleway", sans-serif',
              fontWeight: 600,
              fontSize: '0.85rem',
              letterSpacing: '0.02em',
              py: 1.25,
              borderRadius: '8px',
              textTransform: 'none',
              '&:hover': { background: '#4752c4' },
            }}
          >
            Sign in with Discord
          </Button>
        </Box>

        <Divider sx={{ my: 3, borderColor: 'rgba(124,58,237,0.12)' }} />

        <Typography
          variant="caption"
          sx={{ color: '#475569', fontSize: '0.7rem', textAlign: 'center', display: 'block' }}
        >
          Your data stays in The Yawniverse.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
