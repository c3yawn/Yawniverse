import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Fetches and manages the map data for a campaign.
 * updateMap upserts the entire record (GM only — enforced by RLS).
 */
export function useCampaignMap(campaignId) {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) return;

    supabase
      .from('campaign_maps')
      .select('*')
      .eq('campaign_id', campaignId)
      .maybeSingle()
      .then(({ data }) => {
        setMapData(data ?? null);
        setLoading(false);
      });
  }, [campaignId]);

  const updateMap = async (updates) => {
    const { data, error } = await supabase
      .from('campaign_maps')
      .upsert({ campaign_id: campaignId, ...updates }, { onConflict: 'campaign_id' })
      .select()
      .single();

    if (!error && data) setMapData(data);
    return { data, error };
  };

  return { mapData, loading, updateMap };
}
