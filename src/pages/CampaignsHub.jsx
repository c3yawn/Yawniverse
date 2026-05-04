import { useState, useMemo } from 'react';
import { Box, Container, Typography } from '@mui/material';
import NebulaBackground from '../components/NebulaBackground';
import SystemSection from '../components/SystemSection';
import { systems } from '../data/campaigns';
import { useAuth } from '../context/AuthContext';
import { useCampaignCharacters } from '../hooks/useCampaignCharacters';
import { useUserMemberships } from '../hooks/useUserMemberships';

const SYSTEM_GRADIENTS = {
  swn: {
    text: 'linear-gradient(90deg, #a78bfa, #38bdf8, #2dd4bf)',
    underline: 'linear-gradient(90deg, #a78bfa, #38bdf8, #2dd4bf)',
    glow: 'rgba(56,189,248,0.5)',
  },
  dnd5e: {
    text: 'linear-gradient(90deg, #d4af37, #8b1c2a)',
    underline: 'linear-gradient(90deg, #d4af37, #8b1c2a)',
    glow: 'rgba(212,175,55,0.4)',
  },
  shadowrun: {
    text: 'linear-gradient(90deg, #ff6eb4, #a855f7, #22d3ee)',
    underline: 'linear-gradient(90deg, #ff6eb4, #a855f7, #22d3ee)',
    glow: 'rgba(255,110,180,0.4)',
  },
};

const DEFAULT_GRADIENT = {
  text: 'linear-gradient(90deg, #a78bfa, #818cf8)',
  underline: 'linear-gradient(90deg, #a78bfa, #818cf8)',
  glow: 'rgba(167,139,250,0.4)',
};

const allCampaignIds = systems.flatMap((s) => s.campaigns.map((c) => c.id));

export default function CampaignsHub() {
  const [activeSystemId, setActiveSystemId] = useState(systems[0].id);
  const activeSystem = systems.find((s) => s.id === activeSystemId);

  const { user } = useAuth();
  const { charactersByCampaign } = useCampaignCharacters(allCampaignIds);
  const { memberCampaignIds } = useUserMemberships(user?.id ?? null);

  return (
    <>
      <NebulaBackground src="images/campaigncodex_bg.mp4" />

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontFamily: '"Uncial Antiqua", serif',
              fontWeight: 400,
              mb: 2,
              background: 'linear-gradient(135deg, #e2c9ff 0%, #c084fc 40%, #818cf8 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
              filter: 'drop-shadow(0 0 28px rgba(192, 132, 252, 0.45))',
              letterSpacing: '0.02em',
            }}
          >
            Campaign Codex
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: '36px',
            alignItems: 'flex-end',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(124,58,237,0.15)',
            mb: 4,
            width: 'fit-content',
            mx: 'auto',
            px: '24px',
          }}
        >
          {systems.map((system) => {
            const isActive = system.id === activeSystemId;
            const grad = SYSTEM_GRADIENTS[system.id] ?? DEFAULT_GRADIENT;
            return (
              <Box
                key={system.id}
                component="button"
                onClick={() => setActiveSystemId(system.id)}
                sx={{
                  fontFamily: '"Cinzel", serif',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  background: grad.text,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  opacity: isActive ? 1 : 0.78,
                  filter: isActive
                    ? `drop-shadow(0 0 14px ${grad.glow})`
                    : 'drop-shadow(0 0 6px rgba(226,232,240,0.45))',
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: 'transparent',
                  padding: '0 0 10px 0',
                  position: 'relative',
                  '&::after': isActive
                    ? {
                        content: '""',
                        position: 'absolute',
                        bottom: '-1px',
                        left: 0,
                        right: 0,
                        height: '2px',
                        borderRadius: '2px',
                        background: grad.underline,
                        boxShadow: `0 0 10px ${grad.glow}`,
                      }
                    : {},
                }}
              >
                {system.name}
              </Box>
            );
          })}
        </Box>

        {activeSystem && (
          <SystemSection
            system={activeSystem}
            memberCampaignIds={memberCampaignIds}
            charactersByCampaign={charactersByCampaign}
          />
        )}
      </Container>
    </>
  );
}
