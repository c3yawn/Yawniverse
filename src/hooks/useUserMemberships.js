import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Fetches all campaign IDs and roles for the currently authenticated user.
 * Returns:
 *   memberCampaignIds  — Set of campaign IDs the user has joined
 *   gmCampaignIds      — Set of campaign IDs where the user is GM
 *   loading            — true while the query is in flight
 *   refresh            — call to re-fetch (e.g. after joining a campaign)
 */
export function useUserMemberships(userId) {
  const [memberCampaignIds, setMemberCampaignIds] = useState(new Set());
  const [gmCampaignIds, setGmCampaignIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!userId) {
      setMemberCampaignIds(new Set());
      setGmCampaignIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);

    supabase
      .from('campaign_members')
      .select('campaign_id, role')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (!error && data) {
          const members = new Set();
          const gms = new Set();
          for (const { campaign_id, role } of data) {
            members.add(campaign_id);
            if (role === 'gm') gms.add(campaign_id);
          }
          setMemberCampaignIds(members);
          setGmCampaignIds(gms);
        }
        setLoading(false);
      });
  }, [userId, tick]);

  return { memberCampaignIds, gmCampaignIds, loading, refresh };
}
