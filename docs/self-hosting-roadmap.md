# Self-Hosting Roadmap — The Yawniverse

Written as a pick-up-and-go reference. Everything here assumes you are migrating
from the current setup (hosted Supabase + GitHub Pages) to a self-hosted VPS stack
managed by Coolify.

---

## Why bother

- OAuth consent screen shows your domain instead of `ogwmphbvlhqslkinhagn.supabase.co`
- Full control over the database (backups, extensions, direct SQL access)
- Campaign images served from your own S3-compatible storage (Minio) instead of GitHub
- Plausible analytics without sending data to Google
- Supabase Realtime (WebSockets) already included — enables live chat and real-time
  campaign updates with zero extra infrastructure
- One monthly VPS bill covers everything

---

## Stack overview

| Service | Role | Port (internal) |
|---|---|---|
| **Coolify** | PaaS layer — deploys and manages everything else | 8000 |
| **Supabase** | Auth, database (Postgres), Realtime, Storage API | 8000 (Kong) |
| **Minio** | S3-compatible object storage for campaign images | 9000 / 9001 |
| **Plausible** | Privacy-friendly analytics | 8001 |
| **Vaultwarden** | Personal password manager (see note below) | 80 |

### A note on Vaultwarden

Vaultwarden is a self-hosted Bitwarden-compatible password manager. It does **not**
add any feature to the campaign tracker itself — your site's users will never
interact with it. What it gives **you**:

- A secure place to store all the secrets involved in running this stack (Supabase
  service key, Minio root credentials, Plausible secret key, Google OAuth secret, etc.)
- Accessible from any device via the Bitwarden browser extension or mobile app
- Keeps you from storing secrets in Notion, a notes app, or your browser

Worth running on the same VPS since it's extremely lightweight (~50MB RAM).
Whether to include it is purely a personal preference call.

---

## Infrastructure requirements

### VPS sizing

Minimum for this full stack:

| Tier | Spec | Est. cost | Notes |
|---|---|---|---|
| Minimum | 4 vCPU / 8GB RAM / 80GB disk | ~€8/mo (Hetzner CX32) | Tight but works |
| Comfortable | 4 vCPU / 16GB RAM / 160GB disk | ~€16/mo (Hetzner CX42) | Recommended |

Supabase alone needs ~3-4GB RAM. Minio, Plausible, and Vaultwarden add ~500MB total.

**Recommended provider: Hetzner** (cheapest per spec, datacenter in Nuremberg/Helsinki/Ashburn)
Alternatives: DigitalOcean (more beginner-friendly UI), Vultr, Linode

### Domain setup

You need a domain. Assume `yawniverse.com` for this doc — substitute yours.

DNS records to create (all A records pointing to your VPS IP):

```
yawniverse.com          → VPS IP   (future: serve the React app from here instead of GitHub Pages)
supabase.yawniverse.com → VPS IP   (Supabase Studio dashboard)
auth.yawniverse.com     → VPS IP   (GoTrue auth — this fixes the Google consent screen)
db.yawniverse.com       → VPS IP   (optional: direct Postgres access)
storage.yawniverse.com  → VPS IP   (Minio API)
storage-ui.yawniverse.com → VPS IP (Minio console)
analytics.yawniverse.com → VPS IP  (Plausible)
vault.yawniverse.com    → VPS IP   (Vaultwarden, if included)
```

Coolify handles SSL for all of these automatically via Let's Encrypt.

---

## Phase 1 — Coolify installation

SSH into your VPS as root, then:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

This installs Docker, Docker Compose, and Coolify itself. Takes ~5 minutes.
Access Coolify at `http://YOUR_VPS_IP:8000` and create your admin account.

**First things to configure in Coolify:**
1. Settings → Domain → set to `coolify.yawniverse.com` (add that DNS record too)
2. Settings → SSL → enable Let's Encrypt, add your email
3. Add your server (it asks to SSH back into itself — follow the UI)

---

## Phase 2 — Supabase self-hosted

### Deploy via Coolify

1. Coolify dashboard → **New Resource** → **Service** → search **Supabase**
2. Coolify generates a full `docker-compose.yml` with all Supabase services:
   - `supabase-db` — Postgres 15
   - `supabase-auth` — GoTrue (handles OAuth)
   - `supabase-rest` — PostgREST
   - `supabase-realtime` — Phoenix-based WebSocket server
   - `supabase-storage` — Storage API (you'll point this at Minio later)
   - `supabase-kong` — API gateway
   - `supabase-studio` — the dashboard UI
3. Set the domain to `supabase.yawniverse.com`
4. Set these critical environment variables in Coolify's UI:

```env
SITE_URL=https://yawniverse.com
API_EXTERNAL_URL=https://supabase.yawniverse.com
SUPABASE_PUBLIC_URL=https://supabase.yawniverse.com
JWT_SECRET=<generate: openssl rand -base64 64>
ANON_KEY=<generate using supabase-js or the JWT tool below>
SERVICE_ROLE_KEY=<generate using the JWT tool below>
POSTGRES_PASSWORD=<strong random password>
DASHBOARD_USERNAME=<your choice>
DASHBOARD_PASSWORD=<strong password>
```

To generate ANON_KEY and SERVICE_ROLE_KEY, use the Supabase JWT tool:
https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys

5. Deploy. First boot takes 2-3 minutes.
6. Access Studio at `https://supabase.yawniverse.com` — log in with DASHBOARD credentials.

### Update Google OAuth

In Google Cloud Console → APIs & Services → Credentials → your OAuth client:
- Remove: `https://ogwmphbvlhqslkinhagn.supabase.co/auth/v1/callback`
- Add: `https://auth.yawniverse.com/auth/v1/callback`

In Supabase Studio (self-hosted) → Authentication → Providers → Google:
- Paste the same Client ID and Secret from Google Cloud Console

### Migrate data from hosted Supabase

```bash
# On your local machine — export from hosted
supabase db dump --db-url "postgresql://postgres:[PASSWORD]@db.ogwmphbvlhqslkinhagn.supabase.co:5432/postgres" > backup.sql

# Import into self-hosted
psql "postgresql://postgres:[POSTGRES_PASSWORD]@db.yawniverse.com:5432/postgres" < backup.sql
```

Auth users can be exported from hosted Supabase dashboard:
Authentication → Users → Export (CSV), then re-import via SQL or the Auth API.
In practice for a small personal app it may be easier to just have users re-register.

---

## Phase 3 — Minio (object storage)

### Deploy via Coolify

1. New Resource → Service → search **Minio**
2. Set domains:
   - API: `storage.yawniverse.com`
   - Console: `storage-ui.yawniverse.com`
3. Environment variables:

```env
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=<strong password — save in Vaultwarden>
```

4. Deploy. Access console at `https://storage-ui.yawniverse.com`.

### Configure Minio for campaign images

In the Minio console:
1. Create a bucket: `campaign-images`
2. Set bucket policy to **public read** (so images load without auth tokens)
3. Create an access key for the app — save the key ID and secret

### Wire Minio into Supabase Storage (optional but clean)

Supabase Storage can use an S3-compatible backend. In your self-hosted Supabase
`docker-compose.yml`, update the storage service environment:

```env
STORAGE_BACKEND=s3
GLOBAL_S3_BUCKET=supabase-storage
GLOBAL_S3_ENDPOINT=https://storage.yawniverse.com
GLOBAL_S3_PROTOCOL=https
GLOBAL_S3_FORCE_PATH_STYLE=true
AWS_ACCESS_KEY_ID=<minio access key>
AWS_SECRET_ACCESS_KEY=<minio secret key>
```

This makes Supabase Storage use your Minio instance as the backend, so you only
interact with one API (Supabase Storage) and Minio handles the actual files.

### Update the app to serve images from Minio

Currently campaign images are in `public/images/campaigns/` (served by GitHub Pages).
After migration, images go in the Minio bucket and the `image` field in `campaigns.js`
changes from a relative path to a full URL:

```js
// Before
image: '/images/campaigns/strahd.jpg'

// After
image: 'https://storage.yawniverse.com/campaign-images/strahd.jpg'
```

`CampaignCard.jsx` already passes the `image` field directly to MUI's `CardMedia`
as the `image` prop — no code changes needed, just update the URLs in `campaigns.js`.

### Update environment variables in the app

```env
# .env.local
VITE_SUPABASE_URL=https://supabase.yawniverse.com
VITE_SUPABASE_ANON_KEY=<new anon key from self-hosted instance>
VITE_STORAGE_URL=https://storage.yawniverse.com
```

---

## Phase 4 — Plausible analytics

### Deploy via Coolify

1. New Resource → Service → search **Plausible**
2. Domain: `analytics.yawniverse.com`
3. Environment variables:

```env
BASE_URL=https://analytics.yawniverse.com
SECRET_KEY_BASE=<generate: openssl rand -base64 64>
DISABLE_REGISTRATION=true
```

4. Deploy. Create your admin account on first visit.
5. Add a site: `yawniverse.com` (or `c3yawn.github.io` if staying on GitHub Pages for now)

### Add tracking snippet to the app

In `index.html`, add before `</head>`:

```html
<script defer data-domain="yawniverse.com" src="https://analytics.yawniverse.com/js/script.js"></script>
```

That's the entire integration. Plausible is cookieless and GDPR-compliant — no
consent banner needed.

---

## Phase 5 — Vaultwarden (optional)

### Deploy via Coolify

1. New Resource → Service → search **Vaultwarden**
2. Domain: `vault.yawniverse.com`
3. Environment variables:

```env
SIGNUPS_ALLOWED=false
ADMIN_TOKEN=<generate: openssl rand -base64 48>
```

Setting `SIGNUPS_ALLOWED=false` means only you can use it (via admin token).

4. Deploy. Visit `https://vault.yawniverse.com/admin` to create your account.
5. Install the Bitwarden browser extension → point it at `https://vault.yawniverse.com`

**What to store here:** Minio root credentials, Supabase service role key, Postgres
password, Google OAuth secret, VPS root SSH key passphrase, Coolify admin password.

---

## Phase 6 — Realtime (WebSockets for chat + live updates)

### What you already have

Supabase Realtime is **already running** as part of your self-hosted Supabase stack.
No additional service needed. It provides three channels:

| Channel type | Use case |
|---|---|
| **Postgres Changes** | Listen to DB inserts/updates/deletes in real time |
| **Broadcast** | Send ephemeral messages between clients (chat) |
| **Presence** | Track who is currently online / viewing a page |

### Database schema for chat

When you're ready to implement, create this table in Supabase:

```sql
create table messages (
  id uuid default gen_random_uuid() primary key,
  campaign_id text not null,
  user_id uuid references auth.users not null,
  content text not null,
  created_at timestamptz default now()
);

-- RLS
alter table messages enable row level security;
create policy "authenticated users can read messages"
  on messages for select using (auth.role() = 'authenticated');
create policy "users can insert their own messages"
  on messages for insert with check (auth.uid() = user_id);
```

### React integration (Supabase Realtime)

Install is already done (`@supabase/supabase-js` includes Realtime).

**Chat messages (Broadcast + Postgres Changes):**

```js
// Subscribe to new messages for a campaign
const channel = supabase
  .channel(`campaign:${campaignId}`)
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages', filter: `campaign_id=eq.${campaignId}` },
    (payload) => setMessages((prev) => [...prev, payload.new])
  )
  .subscribe();

// Cleanup
return () => supabase.removeChannel(channel);
```

**Send a message:**

```js
await supabase.from('messages').insert({
  campaign_id: campaignId,
  user_id: user.id,
  content: text,
});
```

**Presence (who's online):**

```js
const channel = supabase.channel(`campaign:${campaignId}`)
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    setOnlineUsers(Object.values(state).flat());
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ user_id: user.id, name: user.user_metadata.full_name });
    }
  });
```

### Files to create/modify when implementing chat

| File | Change |
|---|---|
| `src/pages/CampaignPage.jsx` | Add chat panel, Realtime subscription |
| `src/components/ChatPanel.jsx` | New — message list + input |
| `src/hooks/useMessages.js` | New — Realtime subscription logic |
| `src/hooks/usePresence.js` | New — online users tracking |
| `src/data/campaigns.js` | No change needed |

---

## Migration checklist (when ready to pull the trigger)

- [ ] Spin up VPS, point DNS
- [ ] Install Coolify
- [ ] Deploy Supabase, verify Studio accessible
- [ ] Update Google OAuth redirect URI
- [ ] Export data from hosted Supabase, import to self-hosted
- [ ] Deploy Minio, create `campaign-images` bucket
- [ ] Upload existing campaign images to Minio, update `campaigns.js` URLs
- [ ] Wire Supabase Storage → Minio backend
- [ ] Deploy Plausible, add snippet to `index.html`
- [ ] Deploy Vaultwarden (optional), migrate saved secrets
- [ ] Update `.env.local` and GitHub secrets with new URLs/keys
- [ ] Update Supabase Auth URL config (Site URL + redirect URLs)
- [ ] Test sign-in flow end to end
- [ ] Verify OAuth consent screen now shows your domain
- [ ] Cancel hosted Supabase project

---

## Current state of the codebase (as of this writing)

All auth code is already written and compatible with self-hosted Supabase —
the only change needed at migration time is updating two environment variables:

```env
VITE_SUPABASE_URL=https://supabase.yawniverse.com   # was: https://ogwmphbvlhqslkinhagn.supabase.co
VITE_SUPABASE_ANON_KEY=<new key>                     # was: eyJhbGci...
```

Update these in:
1. `.env.local` (local dev)
2. GitHub repository secrets (production build)

No code changes needed in any `.jsx` or `.js` file.
