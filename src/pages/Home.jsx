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
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#a78bfa',
              fontSize: '0.78rem',
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
              fontWeight: 700,
              mb: 2,
              background: 'linear-gradient(135deg, #c084fc 0%, #818cf8 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
            }}
          >
            Campaign Codex
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 400, mx: 'auto', lineHeight: 1.8, letterSpacing: '0.03em' }}
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
