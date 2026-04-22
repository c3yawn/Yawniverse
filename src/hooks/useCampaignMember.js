import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Fetches the current user's membership role and character sheet for a
 * specific campaign. Returns updateCharacter to patch sheet_data in place.
 */
export function useCampaignMember(userId, campaignId) {
  const [character, setCharacter] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!userId || !campaignId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    Promise.all([
      supabase
        .from('campaign_members')
        .select('role')
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('characters')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .maybeSingle(),
    ]).then(([memberRes, charRes]) => {
      setRole(memberRes.data?.role ?? null);
      setCharacter(charRes.data ?? null);
      setLoading(false);
    });
  }, [userId, campaignId, tick]);

  const updateCharacter = async (sheetData) => {
    const { data, error } = await supabase
      .from('characters')
      .update({
        name: sheetData.name || character?.name,
        sheet_data: sheetData,
      })
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)
      .select()
      .single();

    if (!error && data) setCharacter(data);
    return { data, error };
  };

  return { character, role, loading, refresh, updateCharacter };
}
