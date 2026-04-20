import { Box } from '@mui/material';

export default function NebulaBackground() {
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: -1, backgroundColor: '#020208', overflow: 'hidden' }}>
      <video
        autoPlay
        loop
        muted
        playsInline
        src={`${import.meta.env.BASE_URL}nebula.mp4`}
        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65, display: 'block' }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(2,2,8,0.55) 0%, rgba(2,2,8,0.15) 50%, rgba(2,2,8,0.65) 100%)',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
}
