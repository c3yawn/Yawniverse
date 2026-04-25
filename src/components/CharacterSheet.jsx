import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Button,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { getSystem } from '../data/systems';

// ── Helpers ──────────────────────────────────────────────────────────────────

function dndMod(score) {
  const n = Number(score);
  if (!n) return null;
  return Math.floor((n - 10) / 2);
}

function swnMod(score) {
  const n = Number(score);
  if (!n) return null;
  if (n <= 4) return -2;
  if (n <= 7) return -1;
  if (n <= 13) return 0;
  if (n <= 17) return 1;
  return 2;
}

function modStr(mod) {
  if (mod === null || mod === undefined) return '';
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function getModifier(systemId, score) {
  if (systemId === 'dnd5e') return dndMod(score);
  if (systemId === 'swn') return swnMod(score);
  return null;
}

function hpPercent(d, systemId) {
  if (systemId === 'shadowrun') {
    const cur = Number(d.physical_monitor ?? 0);
    const max = 8 + Math.floor(Number(d.body ?? 0) / 2);
    return max ? Math.max(0, Math.min(100, (cur / max) * 100)) : 100;
  }
  const cur = Number(d.hp_current ?? 0);
  const max = Number(d.hp_max ?? 1);
  return max ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
}

function hpColor(pct) {
  if (pct > 60) return '#10b981';
  if (pct > 25) return '#f59e0b';
  return '#ef4444';
}

function getSubtitle(systemId, d) {
  if (systemId === 'dnd5e')
    return [d.race, d.subclass || d.class, d.level && `Level ${d.level}`, d.background]
      .filter(Boolean).join(' · ');
  if (systemId === 'swn')
    return [d.class, d.level && `Level ${d.level}`, d.homeworld].filter(Boolean).join(' · ');
  if (systemId === 'shadowrun')
    return [d.metatype, d.archetype, d.essence && `Essence ${d.essence}`].filter(Boolean).join(' · ');
  return '';
}

// ── View sections ─────────────────────────────────────────────────────────────

function StatBlock({ systemId, data, fields }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75 }}>
      {fields.map((f) => {
        const val = Number(data[f.id]);
        const mod = getModifier(systemId, val);
        return (
          <Box
            key={f.id}
            sx={{
              textAlign: 'center',
              p: 1,
              border: '1px solid rgba(124,58,237,0.18)',
              borderRadius: 1,
              background: 'rgba(124,58,237,0.04)',
            }}
          >
            <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(148,163,184,0.6)', mb: 0.25 }}>
              {f.label}
            </Typography>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>
              {val || '-'}
            </Typography>
            {mod !== null && (
              <Typography sx={{ fontSize: '0.68rem', color: mod >= 0 ? '#a78bfa' : '#f87171', lineHeight: 1.2 }}>
                {modStr(mod)}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function CombatBar({ systemId, data }) {
  const pct = hpPercent(data, systemId);
  const color = hpColor(pct);

  const stats = [];
  if (systemId === 'dnd5e') {
    if (data.hp_max) stats.push({ label: 'AC', value: data.ac });
    if (data.speed) stats.push({ label: 'SPD', value: `${data.speed}ft` });
    if (data.initiative) stats.push({ label: 'INIT', value: modStr(Number(data.initiative)) });
    if (data.proficiency_bonus) stats.push({ label: 'PROF', value: modStr(Number(data.proficiency_bonus)) });
  } else if (systemId === 'swn') {
    if (data.ac) stats.push({ label: 'AC', value: data.ac });
    if (data.attack_bonus) stats.push({ label: 'ATK', value: modStr(Number(data.attack_bonus)) });
    if (data.save) stats.push({ label: 'SAVE', value: data.save });
  } else if (systemId === 'shadowrun') {
    if (data.armor !== undefined) stats.push({ label: 'ARMOR', value: data.armor });
    if (data.initiative) stats.push({ label: 'INIT', value: data.initiative });
    if (data.essence) stats.push({ label: 'ESS', value: data.essence });
  }

  const hpLabel = systemId === 'shadowrun' ? 'PHYSICAL' : 'HP';
  const hpCur = systemId === 'shadowrun' ? data.physical_monitor : data.hp_current;
  const hpMax = systemId === 'shadowrun'
    ? 8 + Math.floor(Number(data.body ?? 0) / 2)
    : data.hp_max;

  return (
    <Box>
      {hpMax && (
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
            <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(148,163,184,0.6)' }}>
              {hpLabel}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color }}>
              {hpCur ?? '?'} / {hpMax}
            </Typography>
          </Box>
          <Box sx={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
          </Box>
        </Box>
      )}

      {systemId === 'shadowrun' && data.stun_monitor && (
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
            <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(148,163,184,0.6)' }}>
              STUN
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8' }}>
              {data.stun_monitor} / {8 + Math.floor(Number(data.willpower ?? 0) / 2)}
            </Typography>
          </Box>
          <Box sx={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ width: '100%', height: '100%', background: '#38bdf8', opacity: 0.6, borderRadius: 3 }} />
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {stats.map((s) => (
          <Box key={s.label} sx={{ textAlign: 'center', minWidth: 48 }}>
            <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '0.5rem', letterSpacing: '0.12em', color: 'rgba(148,163,184,0.5)', display: 'block' }}>
              {s.label}
            </Typography>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#e2e8f0' }}>{s.value || '-'}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function SkillsCompact({ systemId, data, fields }) {
  const active = fields.filter((f) => {
    const v = data[f.id];
    if (systemId === 'swn') return Number(v) > -1;
    return Number(v) > 0;
  });
  if (!active.length) return null;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {active.map((f) => (
        <Box
          key={f.id}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 0.75,
            py: 0.25,
            background: 'rgba(124,58,237,0.1)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 1,
          }}
        >
          <Typography sx={{ fontSize: '0.68rem', color: '#c084fc' }}>{f.label}</Typography>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#a78bfa' }}>{data[f.id]}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function CheckboxesCompact({ fields, data, label }) {
  const checked = fields.filter((f) => data[f.id]);
  if (!checked.length) return null;
  return (
    <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.8, display: 'block' }}>
      <span style={{ color: 'rgba(124,58,237,0.7)', fontFamily: '"Cinzel", serif', fontSize: '0.55rem', letterSpacing: '0.12em' }}>{label} </span>
      {checked.map((f) => f.label).join(', ')}
    </Typography>
  );
}

function TextSection({ value, label }) {
  if (!value?.trim()) return null;
  return (
    <Box>
      <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(124,58,237,0.7)', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.78rem' }}>
        {value}
      </Typography>
    </Box>
  );
}

// ── Edit form (reuses section-renderer logic) ─────────────────────────────────

function EditField({ field, value, onChange }) {
  if (field.type === 'textarea') {
    return (
      <Box sx={{ gridColumn: '1 / -1' }}>
        <TextField fullWidth multiline minRows={2} size="small" label={field.label}
          placeholder={field.placeholder ?? ''} value={value ?? ''} onChange={(e) => onChange(e.target.value)}
          required={field.required} />
      </Box>
    );
  }
  if (field.type === 'select') {
    return (
      <TextField select fullWidth size="small" label={field.label} value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={field.required}>
        <MenuItem value=""><em>—</em></MenuItem>
        {field.options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
      </TextField>
    );
  }
  if (field.type === 'boolean') {
    return (
      <FormControlLabel
        control={<Checkbox checked={!!value} onChange={(e) => onChange(e.target.checked)} size="small"
          sx={{ color: 'rgba(124,58,237,0.5)', '&.Mui-checked': { color: '#7c3aed' } }} />}
        label={<Typography variant="caption">{field.label}</Typography>}
      />
    );
  }
  return (
    <TextField fullWidth size="small" type={field.type === 'number' ? 'number' : 'text'}
      label={field.label} placeholder={field.placeholder ?? ''} value={value ?? ''}
      onChange={(e) => onChange(field.type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value)}
      required={field.required} inputProps={field.type === 'number' ? { min: field.min, max: field.max } : undefined}
    />
  );
}

function EditSection({ section, formData, onChange }) {
  const isStatBlock = section.layout === 'stat-block';
  const isSkillList = section.layout === 'skill-list';
  const isCheckboxRow = section.layout === 'checkbox-row';
  const isCheckboxGrid = section.layout === 'checkbox-grid';

  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '0.58rem', letterSpacing: '0.18em', color: 'rgba(124,58,237,0.75)', mb: 1.25 }}>
        {section.label}
      </Typography>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: isStatBlock ? 'repeat(3, 1fr)'
          : isSkillList ? 'repeat(2, 1fr)'
          : isCheckboxRow || isCheckboxGrid ? 'repeat(auto-fill, minmax(110px, 1fr))'
          : 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: isStatBlock || isSkillList ? 1 : 0.5,
      }}>
        {section.fields.map((f) => (
          <EditField key={f.id} field={f} value={formData[f.id]} onChange={(v) => onChange(f.id, v)} />
        ))}
      </Box>
    </Box>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CharacterSheet({ character, systemId, onUpdate }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const systemConfig = getSystem(systemId);
  const data = character?.sheet_data ?? {};

  const handleEdit = () => {
    setFormData({ ...data });
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData(null);
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const { error } = await onUpdate(formData);
    if (error) {
      setSaveError('Failed to save. Please try again.');
    } else {
      setEditMode(false);
      setFormData(null);
    }
    setSaving(false);
  };

  const handleFieldChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  if (!character) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.4)' }}>No character found.</Typography>
      </Box>
    );
  }

  if (!systemConfig) return null;

  // ── Edit mode ──
  if (editMode && formData) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '0.65rem', letterSpacing: '0.18em', color: 'rgba(124,58,237,0.8)' }}>
            Editing Character Sheet
          </Typography>
          <Button size="small" onClick={handleCancel} sx={{ color: 'text.secondary', minWidth: 0 }}>
            <CloseIcon fontSize="small" />
          </Button>
        </Box>

        {saveError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>{saveError}</Alert>}

        {systemConfig.characterSheet.sections.map((section, i) => (
          <Box key={section.id}>
            <EditSection section={section} formData={formData} onChange={handleFieldChange} />
            {i < systemConfig.characterSheet.sections.length - 1 && (
              <Divider sx={{ mb: 2.5, borderColor: 'rgba(124,58,237,0.1)' }} />
            )}
          </Box>
        ))}

        <Button
          fullWidth
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon fontSize="small" />}
          sx={{
            mt: 1,
            background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
            fontFamily: '"Cinzel", serif',
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
          }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </Box>
    );
  }

  // ── View mode ──
  const sections = systemConfig.characterSheet.sections;
  const statSection = sections.find((s) => s.layout === 'stat-block');
  const skillSection = sections.find((s) => s.layout === 'skill-list');
  const saveThrowSection = sections.find((s) => s.layout === 'checkbox-row');
  const skillProfSection = sections.find((s) => s.layout === 'checkbox-grid');
  const textSections = sections.filter((s) => !s.layout && s.id !== 'identity' && s.id !== 'combat');

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Character header */}
      <Box>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '1.05rem',
            background: 'linear-gradient(135deg, #f1f5f9, #c084fc)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.2,
            mb: 0.4,
          }}
        >
          {character.name}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.5 }}>
          {getSubtitle(systemId, data)}
        </Typography>
        {data.alignment && (
          <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.5)', fontSize: '0.65rem' }}>
            {data.alignment}
          </Typography>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(124,58,237,0.1)' }} />

      {/* Combat stats */}
      <Box>
        <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(124,58,237,0.7)', mb: 1 }}>
          Combat
        </Typography>
        <CombatBar systemId={systemId} data={data} />
      </Box>

      {/* Ability scores */}
      {statSection && (
        <>
          <Divider sx={{ borderColor: 'rgba(124,58,237,0.1)' }} />
          <Box>
            <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(124,58,237,0.7)', mb: 1 }}>
              {statSection.label}
            </Typography>
            <StatBlock systemId={systemId} data={data} fields={statSection.fields} />
          </Box>
        </>
      )}

      {/* Saving throws (D&D) */}
      {saveThrowSection && (
        <>
          <Divider sx={{ borderColor: 'rgba(124,58,237,0.1)' }} />
          <CheckboxesCompact fields={saveThrowSection.fields} data={data} label="Saves:" />
        </>
      )}

      {/* Skill proficiencies (D&D checkboxes) */}
      {skillProfSection && (
        <>
          <Divider sx={{ borderColor: 'rgba(124,58,237,0.1)' }} />
          <Box>
            <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(124,58,237,0.7)', mb: 0.75 }}>
              {skillProfSection.label}
            </Typography>
            <CheckboxesCompact fields={skillProfSection.fields} data={data} label="" />
          </Box>
        </>
      )}

      {/* Skills with ranks (SWN / Shadowrun) */}
      {skillSection && (
        <>
          <Divider sx={{ borderColor: 'rgba(124,58,237,0.1)' }} />
          <Box>
            <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(124,58,237,0.7)', mb: 0.75 }}>
              {skillSection.label}
            </Typography>
            <SkillsCompact systemId={systemId} data={data} fields={skillSection.fields} />
          </Box>
        </>
      )}

      {/* Text sections */}
      {textSections.map((section) => (
        section.fields
          .filter((f) => f.type === 'textarea' || f.type === 'text')
          .map((f) => data[f.id]?.trim() ? (
            <Box key={f.id}>
              <Divider sx={{ borderColor: 'rgba(124,58,237,0.1)', mb: 2 }} />
              <TextSection value={data[f.id]} label={f.label} />
            </Box>
          ) : null)
      ))}

      <Divider sx={{ borderColor: 'rgba(124,58,237,0.1)' }} />

      {/* Edit button */}
      <Button
        size="small"
        variant="outlined"
        startIcon={<EditIcon fontSize="small" />}
        onClick={handleEdit}
        sx={{
          borderColor: 'rgba(124,58,237,0.3)',
          color: '#a78bfa',
          fontFamily: '"Cinzel", serif',
          fontSize: '0.62rem',
          letterSpacing: '0.12em',
          '&:hover': { borderColor: '#7c3aed', background: 'rgba(124,58,237,0.08)' },
        }}
      >
        Edit Sheet
      </Button>
    </Box>
  );
}
