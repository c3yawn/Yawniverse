import { Box, Button, Container, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import NebulaBackground from '../components/NebulaBackground';
import { systems } from '../data/campaigns';

export default function CampaignPage() {
  const { systemId, campaignId } = useParams();
  const navigate = useNavigate();

  const system = systems.find((s) => s.id === systemId);
  const campaign = system?.campaigns.find((c) => c.id === campaignId);

  return (
    <>
      <NebulaBackground />
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 4, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
        >
          Back to Archive
        </Button>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            mb: 1,
            background: 'linear-gradient(90deg, #a855f7, #0ea5e9)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {campaign?.title ?? 'Campaign Not Found'}
        </Typography>

        {system && (
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
            {system.name}
          </Typography>
        )}

        <Box
          sx={{
            p: 4,
            borderRadius: 2,
            backgroundColor: 'background.paper',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(124, 58, 237, 0.18)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary' }}>
            Campaign detail page coming soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Session logs, lore, and chronicles will live here.
          </Typography>
        </Box>
      </Container>
    </>
  );
}
