import { Box, Grid, Typography } from '@mui/material';
import CampaignCard from './CampaignCard';

export default function SystemSection({ system }) {
  return (
    <Box component="section" sx={{ mb: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 20,
            height: 2,
            background: 'linear-gradient(90deg, #7c3aed, #0ea5e9)',
            borderRadius: 1,
            flexShrink: 0,
          }}
        />
        <Typography
          variant="overline"
          component="h2"
          sx={{
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: 'rgba(167, 139, 250, 0.9)',
            fontSize: '0.72rem',
            lineHeight: 1,
          }}
        >
          {system.name}
        </Typography>
        <Box
          sx={{
            flexGrow: 1,
            height: '1px',
            background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.4) 0%, transparent 100%)',
          }}
        />
      </Box>

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
