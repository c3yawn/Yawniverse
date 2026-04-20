import { Box, Divider, Grid, Typography } from '@mui/material';
import CampaignCard from './CampaignCard';

export default function SystemSection({ system }) {
  return (
    <Box component="section" sx={{ mb: 8 }}>
      <Typography
        variant="overline"
        component="h2"
        sx={{
          display: 'block',
          mb: 1.5,
          fontWeight: 700,
          letterSpacing: '0.15em',
          color: 'rgba(167, 139, 250, 0.85)',
          fontSize: '0.72rem',
        }}
      >
        {system.name}
      </Typography>

      <Divider sx={{ mb: 3, borderColor: 'rgba(124, 58, 237, 0.15)' }} />

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
