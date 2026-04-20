import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import NebulaBackground from '../components/NebulaBackground';
import SystemSection from '../components/SystemSection';
import { systems } from '../data/campaigns';

export default function Home() {
  return (
    <>
      <NebulaBackground />

      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1.5 }}>
          <AutoAwesomeIcon sx={{ color: 'secondary.main', fontSize: 22 }} />
          <Typography
            variant="h6"
            component="span"
            sx={{
              fontWeight: 700,
              letterSpacing: '0.06em',
              background: 'linear-gradient(90deg, #a855f7, #0ea5e9)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            The Astral Archive
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ mb: 7, textAlign: 'center' }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 1.5,
              background: 'linear-gradient(135deg, #c084fc 0%, #60a5fa 50%, #2dd4bf 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2rem', sm: '2.75rem', md: '3.5rem' },
            }}
          >
            Campaign Codex
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 540, mx: 'auto', lineHeight: 1.8, letterSpacing: '0.02em' }}
          >
            Worlds built, stories told, legends remembered. A living record of every campaign
            across the stars and beyond.
          </Typography>
        </Box>

        {systems.map((system) => (
          <SystemSection key={system.id} system={system} />
        ))}
      </Container>
    </>
  );
}
