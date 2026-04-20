import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material';
import NebulaBackground from '../components/NebulaBackground';
import SystemSection from '../components/SystemSection';
import { systems } from '../data/campaigns';

export default function Home() {
  return (
    <>
      <NebulaBackground />

      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <Typography
            variant="subtitle2"
            component="span"
            sx={{
              fontFamily: '"Cinzel", serif',
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: '#a78bfa',
              fontSize: '0.72rem',
              textShadow: '0 0 20px rgba(167, 139, 250, 0.5)',
            }}
          >
            The Yawniverse
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ mb: 8, textAlign: 'center' }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontFamily: '"Cinzel", serif',
              fontWeight: 900,
              mb: 2,
              background: 'linear-gradient(135deg, #e2c9ff 0%, #c084fc 40%, #818cf8 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
              textShadow: 'none',
              filter: 'drop-shadow(0 0 28px rgba(192, 132, 252, 0.45))',
              letterSpacing: '0.06em',
            }}
          >
            Campaign Codex
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: 420,
              mx: 'auto',
              lineHeight: 1.8,
              letterSpacing: '0.08em',
              color: 'rgba(148, 163, 184, 0.9)',
            }}
          >
            A living record of every campaign across the stars and beyond.
          </Typography>
        </Box>

        {systems.map((system) => (
          <SystemSection key={system.id} system={system} />
        ))}
      </Container>
    </>
  );
}
