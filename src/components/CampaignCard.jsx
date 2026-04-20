import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Typography,
  Box,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
  Active: 'success',
  'On Hiatus': 'warning',
  Completed: 'default',
};

const placeholderGradients = [
  'linear-gradient(135deg, #2d0060 0%, #0a1560 50%, #00403a 100%)',
  'linear-gradient(135deg, #0a1560 0%, #3b0a6e 60%, #002a26 100%)',
  'linear-gradient(135deg, #00403a 0%, #0a1560 50%, #2d0060 100%)',
];

export default function CampaignCard({ campaign, systemId, index = 0 }) {
  const navigate = useNavigate();
  const gradient = placeholderGradients[index % placeholderGradients.length];

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper',
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        '&:hover': {
          boxShadow: '0 0 28px rgba(124, 58, 237, 0.45), 0 0 8px rgba(14, 165, 233, 0.25)',
          transform: 'translateY(-3px)',
        },
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/campaign/${systemId}/${campaign.id}`)}
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        {campaign.image ? (
          <CardMedia
            component="img"
            height="180"
            image={campaign.image}
            alt={campaign.title}
            sx={{ objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              height: 180,
              background: gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          />
        )}

        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 700,
                lineHeight: 1.2,
                background: 'linear-gradient(135deg, #f1f5f9 0%, #c084fc 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {campaign.title}
            </Typography>
            <Chip
              label={campaign.status}
              color={STATUS_COLORS[campaign.status] ?? 'default'}
              size="small"
              sx={{ flexShrink: 0, mt: 0.25 }}
            />
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ flexGrow: 1, lineHeight: 1.6 }}
          >
            {campaign.description}
          </Typography>

          {campaign.playerCharacters?.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
              <PersonIcon sx={{ fontSize: 13, color: '#7c3aed', flexShrink: 0, opacity: 0.8 }} />
              <Typography
                variant="caption"
                sx={{ color: 'rgba(148, 163, 184, 0.85)', fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '0.03em' }}
              >
                {campaign.playerCharacters.join('\u2004|\u2004')}
              </Typography>
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
