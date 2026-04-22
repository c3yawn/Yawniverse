import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Tab,
  Tabs,
  Typography,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import { useNavigate, useParams } from 'react-router-dom';
import NebulaBackground from '../components/NebulaBackground';
import CharacterSheet from '../components/CharacterSheet';
import CampaignChat from '../components/CampaignChat';
import PartyDrawer from '../components/PartyDrawer';
import CampaignMap from '../components/maps/CampaignMap';
import JoinCampaignFlow from '../components/JoinCampaignFlow';
import { systems } from '../data/campaigns';
import { useAuth } from '../context/AuthContext';
import { useCampaignMember } from '../hooks/useCampaignMember';
import { useCampaignMap } from '../hooks/useCampaignMap';

const STATUS_COLORS = { Active: 'success', 'On Hiatus': 'warning', Completed: 'default' };
const NAVBAR_HEIGHT = 64;

export default function CampaignPage() {
  const { systemId, campaignId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const system = systems.find((s) => s.id === systemId);
  const campaign = system?.campaigns.find((c) => c.id === campaignId);

  const { character, role, loading: memberLoading, updateCharacter } = useCampaignMember(user?.id ?? null, campaignId);
  const { mapData, loading: mapLoading, updateMap } = useCampaignMap(campaignId);

  const [partyOpen, setPartyOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState(0);

  const isGM = role === 'gm';
  const isMember = !!role;

  if (!campaign) {
    return (
      <>
        <NebulaBackground />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <Typography sx={{ color: 'text.secondary' }}>Campaign not found.</Typography>
        </Box>
      </>
    );
  }

  // ── Not a member overlay ──────────────────────────────────────────────────
  const notMemberOverlay = !memberLoading && !isMember && (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(1,1,6,0.82)',
        backdropFilter: 'blur(8px)',
        gap: 2,
      }}
    >
      <Typography
        sx={{
          fontFamily: '"Cinzel", serif',
          fontSize: '1.1rem',
          letterSpacing: '0.1em',
          color: '#e2e8f0',
        }}
      >
        {campaign.title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
        {user ? 'You haven\'t joined this campaign yet.' : 'Sign in to join this campaign.'}
      </Typography>
      {user && (
        <Button
          variant="contained"
          onClick={() => setJoinOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
            fontFamily: '"Cinzel", serif',
            fontSize: '0.72rem',
            letterSpacing: '0.12em',
          }}
        >
          Join Campaign
        </Button>
      )}
    </Box>
  );

  // ── Header bar ────────────────────────────────────────────────────────────
  const headerBar = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: { xs: 2, md: 2.5 },
        py: 1,
        borderBottom: '1px solid rgba(124,58,237,0.15)',
        flexShrink: 0,
        background: 'rgba(1,1,6,0.6)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Button
        size="small"
        startIcon={<ArrowBackIcon fontSize="small" />}
        onClick={() => navigate('/campaigns')}
        sx={{ color: 'text.secondary', fontSize: '0.7rem', minWidth: 0, px: 1, '&:hover': { color: '#c084fc' } }}
      >
        Archive
      </Button>

      <Box sx={{ width: '1px', height: 16, background: 'rgba(124,58,237,0.2)' }} />

      <Typography
        sx={{
          fontWeight: 700,
          fontSize: { xs: '0.85rem', md: '0.95rem' },
          background: 'linear-gradient(135deg, #f1f5f9, #c084fc)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.02em',
          mr: 0.5,
        }}
      >
        {campaign.title}
      </Typography>

      <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.5)', display: { xs: 'none', sm: 'block' } }}>
        {system.name}
      </Typography>

      <Chip
        label={campaign.status}
        color={STATUS_COLORS[campaign.status] ?? 'default'}
        size="small"
        sx={{ ml: 0.5 }}
      />

      <Box sx={{ flex: 1 }} />

      {isGM && (
        <Button
          size="small"
          startIcon={<GroupsIcon fontSize="small" />}
          onClick={() => setPartyOpen(true)}
          sx={{
            borderColor: 'rgba(124,58,237,0.3)',
            color: '#a78bfa',
            border: '1px solid rgba(124,58,237,0.3)',
            fontFamily: '"Cinzel", serif',
            fontSize: '0.6rem',
            letterSpacing: '0.12em',
            px: 1.5,
            '&:hover': { background: 'rgba(124,58,237,0.1)' },
          }}
        >
          View Party
        </Button>
      )}
    </Box>
  );

  // ── Three-column desktop layout ───────────────────────────────────────────
  const desktopLayout = (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: 1, overflow: 'hidden', position: 'relative' }}>
      {notMemberOverlay}

      {/* Left: Character Sheet */}
      <Box
        sx={{
          width: 290,
          flexShrink: 0,
          overflowY: 'auto',
          borderRight: '1px solid rgba(124,58,237,0.12)',
          background: 'rgba(1,1,6,0.4)',
        }}
      >
        {memberLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
            <CircularProgress size={24} sx={{ color: '#7c3aed' }} />
          </Box>
        ) : (
          <CharacterSheet character={character} systemId={systemId} onUpdate={updateCharacter} />
        )}
      </Box>

      {/* Center: Map */}
      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {mapLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress size={28} sx={{ color: '#7c3aed' }} />
          </Box>
        ) : (
          <CampaignMap
            campaignId={campaignId}
            systemId={systemId}
            mapData={mapData}
            isGM={isGM}
            onUpdate={updateMap}
          />
        )}
      </Box>

      {/* Right: Chat */}
      <Box
        sx={{
          width: 300,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid rgba(124,58,237,0.12)',
        }}
      >
        <CampaignChat campaignId={campaignId} userId={user?.id} />
      </Box>
    </Box>
  );

  // ── Mobile tab layout ─────────────────────────────────────────────────────
  const mobileLayout = (
    <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', flex: 1, overflow: 'hidden', position: 'relative' }}>
      {notMemberOverlay}

      <Tabs
        value={mobileTab}
        onChange={(_, v) => setMobileTab(v)}
        sx={{
          flexShrink: 0,
          borderBottom: '1px solid rgba(124,58,237,0.15)',
          '& .MuiTab-root': { fontFamily: '"Cinzel", serif', fontSize: '0.6rem', letterSpacing: '0.12em', minHeight: 40 },
          '& .Mui-selected': { color: '#c084fc' },
          '& .MuiTabs-indicator': { background: 'linear-gradient(90deg, #7c3aed, #0ea5e9)' },
        }}
      >
        <Tab label="Character" />
        <Tab label="Map" />
        <Tab label="Chat" />
      </Tabs>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {mobileTab === 0 && (
          <Box sx={{ height: '100%', overflowY: 'auto' }}>
            <CharacterSheet character={character} systemId={systemId} onUpdate={updateCharacter} />
          </Box>
        )}
        {mobileTab === 1 && (
          <CampaignMap
            campaignId={campaignId}
            systemId={systemId}
            mapData={mapData}
            isGM={isGM}
            onUpdate={updateMap}
          />
        )}
        {mobileTab === 2 && (
          <CampaignChat campaignId={campaignId} userId={user?.id} />
        )}
      </Box>
    </Box>
  );

  return (
    <>
      <NebulaBackground />

      <Box
        sx={{
          height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {headerBar}
        {desktopLayout}
        {mobileLayout}
      </Box>

      <PartyDrawer
        open={partyOpen}
        onClose={() => setPartyOpen(false)}
        campaignId={campaignId}
        systemId={systemId}
      />

      {joinOpen && campaign && (
        <JoinCampaignFlow
          open={joinOpen}
          onClose={() => setJoinOpen(false)}
          campaign={campaign}
          systemId={systemId}
        />
      )}
    </>
  );
}
