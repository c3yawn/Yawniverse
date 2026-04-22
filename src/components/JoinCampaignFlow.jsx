import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Typography,
  Box,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getSystem } from '../data/systems';

function buildInitialData(sections) {
  const data = {};
  for (const section of sections) {
    for (const field of section.fields) {
      if (field.type === 'boolean') {
        data[field.id] = false;
      } else if (field.type === 'number') {
        data[field.id] = field.default ?? '';
      } else {
        data[field.id] = '';
      }
    }
  }
  return data;
}

function StatBlockLayout({ fields, formData, onChange }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1.5,
      }}
    >
      {fields.map((field) => (
        <Box
          key={field.id}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 1.5,
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 1,
            background: 'rgba(124,58,237,0.05)',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontFamily: '"Cinzel", serif',
              fontSize: '0.6rem',
              letterSpacing: '0.15em',
              color: 'rgba(148,163,184,0.7)',
              mb: 0.5,
            }}
          >
            {field.label}
          </Typography>
          <TextField
            variant="standard"
            type="number"
            inputProps={{ min: field.min, max: field.max, style: { textAlign: 'center', fontSize: '1.1rem', fontWeight: 700 } }}
            value={formData[field.id]}
            onChange={(e) => onChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ width: 64 }}
          />
        </Box>
      ))}
    </Box>
  );
}

function SkillListLayout({ fields, formData, onChange }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 1 }}>
      {fields.map((field) => (
        <Box key={field.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            variant="outlined"
            size="small"
            type="number"
            label={field.label}
            inputProps={{ min: field.min, max: field.max, style: { width: 40 } }}
            value={formData[field.id]}
            onChange={(e) => onChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ '& .MuiInputBase-input': { px: 1 } }}
          />
        </Box>
      ))}
    </Box>
  );
}

function CheckboxRowLayout({ fields, formData, onChange }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {fields.map((field) => (
        <FormControlLabel
          key={field.id}
          control={
            <Checkbox
              checked={!!formData[field.id]}
              onChange={(e) => onChange(field.id, e.target.checked)}
              size="small"
              sx={{ color: 'rgba(124,58,237,0.5)', '&.Mui-checked': { color: '#7c3aed' } }}
            />
          }
          label={<Typography variant="caption" sx={{ fontSize: '0.75rem' }}>{field.label}</Typography>}
        />
      ))}
    </Box>
  );
}

function CheckboxGridLayout({ fields, formData, onChange }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 0.5 }}>
      {fields.map((field) => (
        <FormControlLabel
          key={field.id}
          control={
            <Checkbox
              checked={!!formData[field.id]}
              onChange={(e) => onChange(field.id, e.target.checked)}
              size="small"
              sx={{ color: 'rgba(124,58,237,0.5)', '&.Mui-checked': { color: '#7c3aed' } }}
            />
          }
          label={<Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>{field.label}</Typography>}
        />
      ))}
    </Box>
  );
}

function DefaultFieldLayout({ fields, formData, onChange }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
      {fields.map((field) => {
        if (field.type === 'textarea') {
          return (
            <Box key={field.id} sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label={field.label}
                placeholder={field.placeholder ?? ''}
                value={formData[field.id]}
                onChange={(e) => onChange(field.id, e.target.value)}
                required={field.required}
                variant="outlined"
                size="small"
              />
            </Box>
          );
        }
        if (field.type === 'select') {
          return (
            <TextField
              key={field.id}
              select
              fullWidth
              label={field.label}
              value={formData[field.id]}
              onChange={(e) => onChange(field.id, e.target.value)}
              required={field.required}
              variant="outlined"
              size="small"
            >
              <MenuItem value=""><em>— select —</em></MenuItem>
              {field.options.map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>
          );
        }
        if (field.type === 'boolean') {
          return (
            <FormControlLabel
              key={field.id}
              control={
                <Checkbox
                  checked={!!formData[field.id]}
                  onChange={(e) => onChange(field.id, e.target.checked)}
                  size="small"
                  sx={{ color: 'rgba(124,58,237,0.5)', '&.Mui-checked': { color: '#7c3aed' } }}
                />
              }
              label={field.label}
            />
          );
        }
        return (
          <TextField
            key={field.id}
            fullWidth
            type={field.type === 'number' ? 'number' : 'text'}
            label={field.label}
            placeholder={field.placeholder ?? ''}
            value={formData[field.id]}
            onChange={(e) =>
              onChange(
                field.id,
                field.type === 'number' && e.target.value !== ''
                  ? Number(e.target.value)
                  : e.target.value,
              )
            }
            required={field.required}
            inputProps={field.type === 'number' ? { min: field.min, max: field.max } : undefined}
            variant="outlined"
            size="small"
          />
        );
      })}
    </Box>
  );
}

function SectionRenderer({ section, formData, onChange }) {
  const layout = section.layout;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="overline"
        sx={{
          fontFamily: '"Cinzel", serif',
          fontSize: '0.6rem',
          letterSpacing: '0.18em',
          color: 'rgba(124,58,237,0.75)',
          display: 'block',
          mb: 1.5,
        }}
      >
        {section.label}
      </Typography>

      {layout === 'stat-block' && (
        <StatBlockLayout fields={section.fields} formData={formData} onChange={onChange} />
      )}
      {layout === 'skill-list' && (
        <SkillListLayout fields={section.fields} formData={formData} onChange={onChange} />
      )}
      {layout === 'checkbox-row' && (
        <CheckboxRowLayout fields={section.fields} formData={formData} onChange={onChange} />
      )}
      {layout === 'checkbox-grid' && (
        <CheckboxGridLayout fields={section.fields} formData={formData} onChange={onChange} />
      )}
      {!layout && (
        <DefaultFieldLayout fields={section.fields} formData={formData} onChange={onChange} />
      )}
    </Box>
  );
}

export default function JoinCampaignFlow({ open, onClose, campaign, systemId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const systemConfig = getSystem(systemId);

  const initialData = useMemo(
    () => (systemConfig ? buildInitialData(systemConfig.characterSheet.sections) : {}),
    [systemConfig],
  );

  const [formData, setFormData] = useState(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (fieldId, value) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const validate = () => {
    if (!systemConfig) return 'Unknown system.';
    for (const section of systemConfig.characterSheet.sections) {
      for (const field of section.fields) {
        if (field.required && (formData[field.id] === '' || formData[field.id] == null)) {
          return `"${field.label}" is required.`;
        }
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    const role = campaign.gmEmails?.includes(user.email) ? 'gm' : 'player';
    const characterName = formData['name'] || formData['street_name'] || 'Unknown';

    const { error: memberError } = await supabase
      .from('campaign_members')
      .insert({ campaign_id: campaign.id, user_id: user.id, role });

    if (memberError && memberError.code !== '23505') {
      setError('Could not join campaign. Please try again.');
      setSubmitting(false);
      return;
    }

    const { error: charError } = await supabase
      .from('characters')
      .insert({
        campaign_id: campaign.id,
        user_id: user.id,
        system_id: systemId,
        name: characterName,
        sheet_data: formData,
      });

    if (charError) {
      setError('Could not save character. Please try again.');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onClose();
    navigate(`/campaigns/${systemId}/${campaign.id}`);
  };

  if (!systemConfig) return null;

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'background.paper',
          backgroundImage: 'none',
          border: '1px solid rgba(124,58,237,0.2)',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: '"Cinzel", serif',
          letterSpacing: '0.1em',
          borderBottom: '1px solid rgba(124,58,237,0.15)',
          pb: 2,
        }}
      >
        <Typography component="span" sx={{ fontFamily: 'inherit', fontSize: '1.1rem', fontWeight: 700 }}>
          Join — {campaign.title}
        </Typography>
        <Typography
          component="div"
          variant="caption"
          sx={{ color: 'text.secondary', letterSpacing: '0.12em', mt: 0.25 }}
        >
          {systemConfig.name}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 3, overflowY: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {systemConfig.characterSheet.sections.map((section, i) => (
          <Box key={section.id}>
            <SectionRenderer section={section} formData={formData} onChange={handleChange} />
            {i < systemConfig.characterSheet.sections.length - 1 && (
              <Divider sx={{ mb: 3, borderColor: 'rgba(124,58,237,0.1)' }} />
            )}
          </Box>
        ))}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid rgba(124,58,237,0.15)',
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          disabled={submitting}
          sx={{ color: 'text.secondary' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{
            background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
            fontFamily: '"Cinzel", serif',
            letterSpacing: '0.1em',
            fontSize: '0.75rem',
            '&:hover': { background: 'linear-gradient(135deg, #6d28d9, #0284c7)' },
          }}
        >
          {submitting ? <CircularProgress size={18} color="inherit" /> : 'Enter the Campaign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
