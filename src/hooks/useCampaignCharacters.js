import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Batch-fetches character names for a list of campaign IDs.
 * Returns a map of { [campaignId]: string[] } and a loading flag.
 * Falls back to an empty map on error so cards still render with static data.
 */
export function useCampaignCharacters(campaignIds) {
  const [charactersByCampaign, setCharactersByCampaign] = useState({});
  const [loading, setLoading] = useState(true);

  const key = campaignIds?.join(',') ?? '';

  useEffect(() => {
    if (!campaignIds?.length) {
      setLoading(false);
      return;
    }

    setLoading(true);

    supabase
      .from('characters')
      .select('campaign_id, name')
      .in('campaign_id', campaignIds)
      .then(({ data, error }) => {
        if (!error && data) {
          const map = {};
          for (const { campaign_id, name } of data) {
            if (!map[campaign_id]) map[campaign_id] = [];
            map[campaign_id].push(name);
          }
          setCharactersByCampaign(map);
        }
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { charactersByCampaign, loading };
}
