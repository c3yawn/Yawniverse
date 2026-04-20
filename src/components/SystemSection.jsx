import { Box, Divider, Grid, Typography } from '@mui/material';
import CampaignCard from './CampaignCard';

export default function SystemSection({ system }) {
  return (
    <Box component="section" sx={{ mb: 7 }}>
      <Typography
        variant="h4"
        component="h2"
        sx={{
          mb: 0.75,
          fontWeight: 700,
          background: 'linear-gradient(90deg, #a855f7 0%, #0ea5e9 60%, #2dd4bf 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-block',
        }}
      >
        {system.name}
      </Typography>

      <Divider
        sx={{
          mb: 3,
          borderColor: 'rgba(124, 58, 237, 0.3)',
          boxShadow: '0 0 6px rgba(124, 58, 237, 0.3)',
        }}
      />

      <Grid container spacing={3}>
        {system.campaigns.map((campaign, i) => (
          <Grid item xs={12} sm={6} md={4} key={campaign.id}>
            <CampaignCard campaign={campaign} systemId={system.id} index={i} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
