import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { supabase } from '../lib/supabase';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ message, profile, isOwn }) {
  const displayName = profile?.display_name ?? message.user_id.slice(0, 8);
  const avatarUrl = profile?.avatar_url;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'flex-start',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        mb: 1.5,
      }}
    >
      <Avatar
        src={avatarUrl ?? undefined}
        sx={{
          width: 28,
          height: 28,
          fontSize: '0.6rem',
          bgcolor: isOwn ? '#7c3aed' : '#0ea5e9',
          flexShrink: 0,
          mt: 0.5,
        }}
      >
        {!avatarUrl && getInitials(displayName)}
      </Avatar>

      <Box sx={{ maxWidth: '75%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 0.75,
            flexDirection: isOwn ? 'row-reverse' : 'row',
            mb: 0.25,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontFamily: '"Cinzel", serif',
              fontSize: '0.6rem',
              color: isOwn ? '#a78bfa' : '#38bdf8',
              letterSpacing: '0.06em',
            }}
          >
            {isOwn ? 'You' : displayName}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'rgba(148,163,184,0.45)' }}>
            {formatTime(message.created_at)}
          </Typography>
        </Box>

        <Box
          sx={{
            background: isOwn
              ? 'rgba(124,58,237,0.18)'
              : 'rgba(14,165,233,0.1)',
            border: `1px solid ${isOwn ? 'rgba(124,58,237,0.25)' : 'rgba(14,165,233,0.15)'}`,
            borderRadius: isOwn ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
            px: 1.5,
            py: 0.75,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.82rem',
              lineHeight: 1.5,
              color: '#e2e8f0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {message.content}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function CampaignChat({ campaignId, userId }) {
  const [messages, setMessages] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const channelRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Initial load: messages + profiles
  useEffect(() => {
    if (!campaignId) return;

    supabase
      .from('messages')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(async ({ data: msgs }) => {
        const loaded = msgs ?? [];
        setMessages(loaded);

        // Fetch profiles for all unique senders
        const ids = [...new Set(loaded.map((m) => m.user_id))];
        if (ids.length) {
          const { data: profileRows } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', ids);
          const map = {};
          profileRows?.forEach((p) => { map[p.id] = p; });
          setProfiles(map);
        }

        setLoading(false);
      });
  }, [campaignId]);

  // Realtime subscription
  useEffect(() => {
    if (!campaignId) return;

    const channel = supabase
      .channel(`chat:${campaignId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `campaign_id=eq.${campaignId}` },
        async (payload) => {
          const msg = payload.new;
          setMessages((prev) => [...prev, msg]);

          // Fetch profile if not yet cached
          setProfiles((prev) => {
            if (prev[msg.user_id]) return prev;
            supabase
              .from('profiles')
              .select('id, display_name, avatar_url')
              .eq('id', msg.user_id)
              .maybeSingle()
              .then(({ data }) => {
                if (data) setProfiles((p) => ({ ...p, [data.id]: data }));
              });
            return prev;
          });
        },
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [campaignId]);

  // Auto-scroll on new messages
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || sending || content.length > 2000) return;
    setSending(true);
    setInput('');
    await supabase.from('messages').insert({ campaign_id: campaignId, user_id: userId, content });
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'rgba(1,1,6,0.5)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: '1px solid rgba(124,58,237,0.15)',
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Cinzel", serif',
            fontSize: '0.62rem',
            letterSpacing: '0.2em',
            color: 'rgba(124,58,237,0.7)',
            textTransform: 'uppercase',
          }}
        >
          Campaign Chat
        </Typography>
      </Box>

      {/* Message list */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
            <CircularProgress size={24} sx={{ color: '#7c3aed' }} />
          </Box>
        ) : messages.length === 0 ? (
          <Typography
            variant="caption"
            sx={{ color: 'rgba(148,163,184,0.4)', display: 'block', textAlign: 'center', pt: 4, letterSpacing: '0.06em' }}
          >
            No messages yet. Say hello.
          </Typography>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              profile={profiles[msg.user_id]}
              isOwn={msg.user_id === userId}
            />
          ))
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Input area */}
      <Box
        sx={{
          px: 1.5,
          py: 1.5,
          borderTop: '1px solid rgba(124,58,237,0.12)',
          display: 'flex',
          gap: 1,
          alignItems: 'flex-end',
          flexShrink: 0,
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          size="small"
          placeholder="Send a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          inputProps={{ maxLength: 2000 }}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.82rem',
              borderRadius: 2,
              '& fieldset': { borderColor: 'rgba(124,58,237,0.2)' },
              '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.4)' },
              '&.Mui-focused fieldset': { borderColor: 'rgba(124,58,237,0.6)' },
            },
          }}
        />
        <IconButton
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          size="small"
          sx={{
            color: '#7c3aed',
            '&:hover': { background: 'rgba(124,58,237,0.12)' },
            '&.Mui-disabled': { color: 'rgba(124,58,237,0.25)' },
            mb: 0.25,
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>

      {input.length > 1800 && (
        <Typography variant="caption" sx={{ px: 2, pb: 0.5, color: input.length > 2000 ? '#ef4444' : '#f59e0b', fontSize: '0.65rem' }}>
          {2000 - input.length} characters remaining
        </Typography>
      )}
    </Box>
  );
}
