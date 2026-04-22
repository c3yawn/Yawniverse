import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

export default function PhaserGame() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    import('phaser').then((mod) => {
      const Phaser = mod.default ?? mod;
      window.Phaser = Phaser;
      import('./config.js').then(({ buildConfig }) => {
        if (cancelled || !containerRef.current) return;

        const config = buildConfig(containerRef.current, Phaser);
        gameRef.current = new Phaser.Game(config);
      });
    });

    return () => {
      cancelled = true;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100%',
        '& canvas': { display: 'block', width: '100% !important', height: '100% !important' },
      }}
    />
  );
}
