import { Box, Typography } from '@mui/material';
import { getSystem } from '../../data/systems';
import HexGrid from './HexGrid';
import LeafletMap from './LeafletMap';

export default function CampaignMap({ campaignId, systemId, mapData, isGM, onUpdate }) {
  const system = getSystem(systemId);
  const mapType = system?.mapType ?? 'leaflet';

  if (mapType === 'hex-grid') {
    return (
      <HexGrid
        data={mapData?.data ?? null}
        isGM={isGM}
        onUpdate={async (updates) => {
          await onUpdate?.({ map_type: 'hex-grid', ...updates });
        }}
      />
    );
  }

  return (
    <LeafletMap
      campaignId={campaignId}
      data={mapData ? { image_url: mapData.image_url, ...(mapData.data ?? {}) } : null}
      isGM={isGM}
      onUpdate={onUpdate}
    />
  );
}
