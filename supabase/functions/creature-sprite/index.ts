import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const WORLD: Record<string, { accent: string; mid: string }> = {
  umihotaru: { accent: '#0d9488', mid: '#0ea5e9' },
  enlil:     { accent: '#f59e0b', mid: '#fbbf24' },
  taranis:   { accent: '#a78bfa', mid: '#6d28d9' },
  janus:     { accent: '#ef4444', mid: '#7f1d1d' },
};

// Radius by stage — hatchling is small, adult is full-grown
const STAGE_RADIUS: Record<string, number> = {
  hatchling: 28,
  juvenile:  36,
  adult:     44,
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
};

function buildSvg(opts: { stage: string; worldKey: string }): string {
  const w = WORLD[opts.worldKey] ?? WORLD.umihotaru;
  const r = STAGE_RADIUS[opts.stage] ?? STAGE_RADIUS.hatchling;
  const cx = 50;
  const cy = 50;

  return `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="sphere" cx="38%" cy="34%" r="65%">
      <stop offset="0%"   stop-color="${w.mid}"    stop-opacity="1"/>
      <stop offset="55%"  stop-color="${w.accent}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${w.accent}" stop-opacity="0.2"/>
    </radialGradient>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Outer glow halo -->
  <circle cx="${cx}" cy="${cy}" r="${r + 6}"
    fill="${w.accent}" fill-opacity="0.12" filter="url(#glow)"/>

  <!-- Sphere body -->
  <circle cx="${cx}" cy="${cy}" r="${r}"
    fill="url(#sphere)" filter="url(#glow)"/>

  <!-- Specular highlight -->
  <ellipse cx="${cx - r * 0.22}" cy="${cy - r * 0.28}" rx="${r * 0.28}" ry="${r * 0.18}"
    fill="white" fill-opacity="0.22" transform="rotate(-20 ${cx - r * 0.22} ${cy - r * 0.28})"/>
</svg>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const creatureId = parts[parts.length - 1];

  if (!creatureId || creatureId === 'creature-sprite') {
    return new Response('Not found', { status: 404, headers: cors });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: creature, error } = await supabase
    .from('creatures')
    .select('id, stage, species_id')
    .eq('id', creatureId)
    .single();

  if (error || !creature) {
    return new Response('Not found', { status: 404, headers: cors });
  }

  const { data: biomeRow } = await supabase
    .from('species_biomes')
    .select('biome_id')
    .eq('species_id', creature.species_id)
    .limit(1)
    .single();

  const worldKey = biomeRow?.biome_id ?? 'umihotaru';

  // Log the view — await so errors show in Edge Function logs
  const { error: rpcError } = await supabase.rpc('increment_creature_views', { p_creature_id: creatureId });
  if (rpcError) console.error('increment_creature_views failed:', rpcError.message, rpcError.code);

  // Check Supabase Storage for a real sprite first
  const { data: spriteFile } = await supabase.storage
    .from('creature-sprites')
    .download(`${creature.species_id}.png`);

  if (spriteFile) {
    const arrayBuffer = await spriteFile.arrayBuffer();
    return new Response(arrayBuffer, {
      headers: {
        ...cors,
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=300',
      },
    });
  }

  const svg = buildSvg({ stage: creature.stage, worldKey });

  return new Response(svg, {
    headers: {
      ...cors,
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=300',
    },
  });
});
