import { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography, TextField, IconButton } from '@mui/material';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import CloseIcon from '@mui/icons-material/Close';
import UploadIcon from '@mui/icons-material/Upload';
import { supabase } from '../../lib/supabase';
import 'leaflet/dist/leaflet.css';

// Default coordinate space when no custom bounds are stored
const DEFAULT_BOUNDS = [[0, 0], [1000, 2000]];

export default function LeafletMap({ campaignId, data, isGM, onUpdate }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const imageLayerRef = useRef(null);
  const markersRef = useRef([]);
  const [placingMarker, setPlacingMarker] = useState(false);
  const [uploading, setUploading] = useState(false);

  const bounds = data?.bounds ?? DEFAULT_BOUNDS;
  const markers = data?.markers ?? [];

  // Initialize Leaflet once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamic import so Leaflet only loads in browser
    import('leaflet').then((L) => {
      const map = L.map(containerRef.current, {
        crs: L.CRS.Simple,
        maxBounds: bounds,
        maxBoundsViscosity: 0.9,
        zoomSnap: 0.25,
        attributionControl: false,
      });

      // Dark background for empty map
      map.getContainer().style.background = '#010106';

      map.fitBounds(bounds);
      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync image overlay when imageUrl changes
  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then((L) => {
      if (imageLayerRef.current) {
        imageLayerRef.current.remove();
        imageLayerRef.current = null;
      }
      if (data?.image_url) {
        imageLayerRef.current = L.imageOverlay(data.image_url, bounds).addTo(mapRef.current);
        mapRef.current.fitBounds(bounds);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.image_url]);

  // Sync markers
  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then((L) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      markers.forEach((marker) => {
        const circle = L.circleMarker([marker.lat, marker.lng], {
          radius: 7,
          color: '#7c3aed',
          fillColor: '#c084fc',
          fillOpacity: 0.85,
          weight: 2,
        }).addTo(mapRef.current);

        circle.bindPopup(
          `<div style="font-family:Raleway,sans-serif;color:#e2e8f0;background:#06041400;font-size:13px;padding:4px 0">${marker.label || 'Location'}</div>`,
          { className: 'leaflet-dark-popup' },
        );

        if (isGM) {
          circle.on('contextmenu', async () => {
            const newMarkers = markers.filter((m) => m.id !== marker.id);
            await onUpdate?.({ map_type: 'leaflet', image_url: data?.image_url ?? null, data: { ...data, markers: newMarkers } });
          });
        }

        markersRef.current.push(circle);
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  // GM: click map to place marker
  useEffect(() => {
    if (!mapRef.current || !isGM) return;

    const handler = async (e) => {
      if (!placingMarker) return;
      const label = window.prompt('Marker label:');
      if (!label) return;
      const newMarker = {
        id: crypto.randomUUID(),
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        label,
      };
      const newMarkers = [...markers, newMarker];
      await onUpdate?.({ map_type: 'leaflet', image_url: data?.image_url ?? null, data: { ...data, markers: newMarkers } });
      setPlacingMarker(false);
    };

    mapRef.current.on('click', handler);
    return () => { mapRef.current?.off('click', handler); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placingMarker, markers, data]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${campaignId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('campaign-maps').upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('campaign-maps').getPublicUrl(path);
      await onUpdate?.({ map_type: 'leaflet', image_url: publicUrl, data: data ?? {} });
    }
    setUploading(false);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Leaflet CSS override for dark theme */}
      <style>{`
        .leaflet-container { background: #010106 !important; }
        .leaflet-control-zoom a { background: rgba(6,4,20,0.9) !important; color: #e2e8f0 !important; border-color: rgba(124,58,237,0.3) !important; }
        .leaflet-popup-content-wrapper { background: rgba(6,4,20,0.95) !important; border: 1px solid rgba(124,58,237,0.3) !important; color: #e2e8f0 !important; border-radius: 6px !important; }
        .leaflet-popup-tip { background: rgba(6,4,20,0.95) !important; }
      `}</style>

      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* No image placeholder */}
      {!data?.image_url && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            pointerEvents: 'none',
          }}
        >
          <Typography sx={{ color: 'rgba(148,163,184,0.4)', fontSize: '0.85rem', letterSpacing: '0.06em' }}>
            {isGM ? 'No map image uploaded yet' : 'Map not yet available'}
          </Typography>
        </Box>
      )}

      {/* GM toolbar */}
      {isGM && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            zIndex: 1000,
          }}
        >
          <Button
            component="label"
            size="small"
            variant="contained"
            startIcon={<UploadIcon fontSize="small" />}
            disabled={uploading}
            sx={{
              background: 'rgba(6,4,20,0.92)',
              border: '1px solid rgba(124,58,237,0.35)',
              color: '#c084fc',
              fontSize: '0.65rem',
              letterSpacing: '0.1em',
              fontFamily: '"Cinzel", serif',
              backdropFilter: 'blur(8px)',
              '&:hover': { background: 'rgba(124,58,237,0.2)' },
            }}
          >
            {uploading ? 'Uploading…' : 'Upload Map'}
            <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
          </Button>

          <Button
            size="small"
            variant="contained"
            startIcon={<AddLocationAltIcon fontSize="small" />}
            onClick={() => setPlacingMarker((p) => !p)}
            sx={{
              background: placingMarker ? 'rgba(124,58,237,0.45)' : 'rgba(6,4,20,0.92)',
              border: `1px solid ${placingMarker ? 'rgba(124,58,237,0.8)' : 'rgba(124,58,237,0.35)'}`,
              color: '#c084fc',
              fontSize: '0.65rem',
              letterSpacing: '0.1em',
              fontFamily: '"Cinzel", serif',
              backdropFilter: 'blur(8px)',
              '&:hover': { background: 'rgba(124,58,237,0.25)' },
            }}
          >
            {placingMarker ? 'Click Map…' : 'Add Marker'}
          </Button>

          {placingMarker && (
            <Button
              size="small"
              onClick={() => setPlacingMarker(false)}
              sx={{ color: 'text.secondary', fontSize: '0.65rem' }}
            >
              Cancel
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
