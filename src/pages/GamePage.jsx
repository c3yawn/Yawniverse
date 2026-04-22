import { Suspense, lazy } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import NebulaBackground from '../components/NebulaBackground';
import { useAuth } from '../context/AuthContext';

const PhaserGame = lazy(() => import('../game/PhaserGame.jsx'));

const NAVBAR_HEIGHT = 52;

export default function GamePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <>
        <NebulaBackground />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}>
          <CircularProgress sx={{ color: '#7c3aed' }} />
        </Box>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <NebulaBackground />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
            gap: 2,
          }}
        >
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '1.1rem', letterSpacing: '0.1em', color: '#e2e8f0' }}>
            Sign in to play
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Your progress is saved to your account.
          </Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <NebulaBackground />
      <Box
        sx={{
          height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            width: 'min(960px, calc(100vw - 32px))',
            height: `min(600px, calc(100vh - ${NAVBAR_HEIGHT}px - 32px))`,
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            boxShadow: '0 0 60px rgba(124, 58, 237, 0.15), 0 0 0 1px rgba(124, 58, 237, 0.08)',
            position: 'relative',
          }}
        >
          <Suspense
            fallback={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#020208' }}>
                <CircularProgress sx={{ color: '#7c3aed' }} />
              </Box>
            }
          >
            <PhaserGame />
          </Suspense>
        </Box>
      </Box>
    </>
  );
}
