import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/steam-proxy`;
const LIB_CACHE_KEY = 'steam_lib_v1';
const ACH_CACHE_KEY = 'steam_ach_v1';
const LIB_TTL = 60 * 60 * 1000;
const ACH_TTL = 24 * 60 * 60 * 1000;
const ACH_BATCH = 10;

async function steamProxy(action, params = {}) {
  const url = new URL(PROXY_URL);
  url.searchParams.set('action', action);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

function readCache(key) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; }
}
function writeCache(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function useSteamTracker() {
  const [library, setLibrary] = useState([]);
  const [achMap, setAchMap] = useState({});
  const [statuses, setStatuses] = useState({});
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [achProgress, setAchProgress] = useState({ loaded: 0, total: 0 });
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLibrary([]);
    setAchMap({});
    setAchProgress({ loaded: 0, total: 0 });
    setLoadingLibrary(true);
    setError(null);

    async function init() {
      const { data: rows } = await supabase
        .from('steam_game_status')
        .select('app_id, status');
      if (!cancelled && rows) {
        const map = {};
        for (const r of rows) map[r.app_id] = r.status;
        setStatuses(map);
      }

      const libCache = readCache(LIB_CACHE_KEY);
      let games;
      if (libCache && (Date.now() - libCache.ts) < LIB_TTL) {
        games = libCache.data;
      } else {
        try {
          const data = await steamProxy('getOwnedGames');
          games = (data?.response?.games ?? [])
            .filter(g => g.has_community_visible_stats)
            .sort((a, b) => a.name.localeCompare(b.name));
          writeCache(LIB_CACHE_KEY, { data: games, ts: Date.now() });
        } catch (err) {
          if (!cancelled) { setError(err.message); setLoadingLibrary(false); }
          return;
        }
      }

      if (!cancelled) { setLibrary(games); setLoadingLibrary(false); }
    }

    init();
    return () => { cancelled = true; };
  }, [refreshKey]);

  useEffect(() => {
    if (!library.length) return;
    let cancelled = false;

    async function fetchAll() {
      const achCache = readCache(ACH_CACHE_KEY) ?? {};
      const now = Date.now();
      const preloaded = {};
      const toFetch = [];

      for (const g of library) {
        const entry = achCache[g.appid];
        if (entry && (now - entry.ts) < ACH_TTL) {
          preloaded[g.appid] = entry.a === null ? null : { achieved: entry.a, total: entry.t };
        } else {
          toFetch.push(g.appid);
        }
      }

      if (Object.keys(preloaded).length) setAchMap(prev => ({ ...prev, ...preloaded }));
      let loaded = Object.keys(preloaded).length;
      setAchProgress({ loaded, total: library.length });

      for (let i = 0; i < toFetch.length; i += ACH_BATCH) {
        if (cancelled) break;
        const batch = toFetch.slice(i, i + ACH_BATCH);

        const settled = await Promise.allSettled(
          batch.map(async (appId) => {
            try {
              const data = await steamProxy('getAchievements', { appid: appId });
              const list = data?.playerstats?.achievements ?? [];
              return [appId, list.length === 0 ? null : {
                achieved: list.filter(a => a.achieved === 1).length,
                total: list.length,
              }];
            } catch {
              return [appId, null];
            }
          })
        );

        if (cancelled) break;

        const updates = {};
        for (const r of settled) {
          if (r.status === 'fulfilled') {
            const [id, ach] = r.value;
            updates[id] = ach;
            achCache[id] = ach === null
              ? { a: null, ts: now }
              : { a: ach.achieved, t: ach.total, ts: now };
            loaded++;
          }
        }

        setAchMap(prev => ({ ...prev, ...updates }));
        setAchProgress({ loaded, total: library.length });
        writeCache(ACH_CACHE_KEY, achCache);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [library]);

  const setStatus = useCallback(async (appId, status, gameName, imgIconUrl) => {
    if (!status) {
      await supabase.from('steam_game_status').delete().eq('app_id', appId);
      setStatuses(prev => { const n = { ...prev }; delete n[appId]; return n; });
    } else {
      await supabase.from('steam_game_status').upsert({
        app_id: appId, status, game_name: gameName, img_icon_url: imgIconUrl ?? null,
      });
      setStatuses(prev => ({ ...prev, [appId]: status }));
    }
  }, []);

  const refresh = useCallback(() => {
    localStorage.removeItem(LIB_CACHE_KEY);
    localStorage.removeItem(ACH_CACHE_KEY);
    setRefreshKey(k => k + 1);
  }, []);

  const games = useMemo(() =>
    library.filter(g => achMap[g.appid] !== null).map(g => {
      const ach = g.appid in achMap ? achMap[g.appid] : undefined;
      const status = statuses[g.appid] ?? null;
      const completed = ach != null && ach.total > 0 && ach.achieved === ach.total;
      const pct = ach != null ? Math.round((ach.achieved / ach.total) * 100) : null;
      return { ...g, ach, status, completed, pct };
    }),
    [library, achMap, statuses]
  );

  return { games, loadingLibrary, achProgress, error, setStatus, refresh };
}
