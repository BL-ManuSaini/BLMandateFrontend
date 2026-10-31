import React from 'react';
import {
  Box, Chip, Avatar, Tooltip, LinearProgress,
  Typography, alpha, useTheme, CircularProgress,
  TextField, InputAdornment, IconButton
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import type { ChipProps } from '@mui/material';
import type {
  CandidateStatus, MappingStatus, MandateStatus,
  LOIStatus, DriveStatus, UserRole,
} from '../../types';
import {
  CANDIDATE_STATUS_COLOR, MAPPING_STATUS_COLOR,
  MANDATE_STATUS_COLOR, LOI_STATUS_COLOR, DRIVE_STATUS_COLOR,
  pct,
} from '../../utils';
import { ROLE_LABELS } from '../../auth/permissions';

// ─── Status Chip ──────────────────────────────────────────────────────────────
type AnyStatus = CandidateStatus | MappingStatus | MandateStatus | LOIStatus | DriveStatus | string;
type StatusType = 'candidate' | 'mapping' | 'mandate' | 'loi' | 'drive';
interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: AnyStatus;
  type?: StatusType | 'user' | string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, type = 'mapping', ...rest }) => {
  const maps: Record<StatusType | 'user' | string, Record<string, string>> = {
    candidate: CANDIDATE_STATUS_COLOR as Record<string, string>,
    mapping: MAPPING_STATUS_COLOR as Record<string, string>,
    mandate: MANDATE_STATUS_COLOR as Record<string, string>,
    loi: LOI_STATUS_COLOR as Record<string, string>,
    drive: DRIVE_STATUS_COLOR as Record<string, string>,
    user: { active: 'success', inactive: 'default' },
  };

  const rawStatus = String(status || '').trim();
  const statusMap = maps[type] || {};
  let color = statusMap[rawStatus];

  if (!color) {
    const lower = rawStatus.toLowerCase();
    const foundKey = Object.keys(statusMap).find(k => k.toLowerCase() === lower);
    if (foundKey) {
      color = statusMap[foundKey];
    }
  }

  if (!color) {
    const lower = rawStatus.toLowerCase();
    if (lower.includes('active') || lower.includes('signed') || lower.includes('confirmed') || lower.includes('approved') || lower.includes('completed') || lower.includes('fulfilled')) color = 'success';
    else if (lower.includes('canc') || lower.includes('drop') || lower.includes('close') || lower.includes('fail') || lower.includes('reject')) color = 'error';
    else if (lower.includes('pend') || lower.includes('review') || lower.includes('hold') || lower.includes('progress') || lower.includes('sent') || lower.includes('discussion')) color = 'warning';
    else if (lower.includes('draft')) color = 'default';
    else color = 'primary';
  }

  const muiToBadge: Record<string, string> = {
    default: 'draft',
    primary: 'active',
    secondary: 'mapped',
    error: 'cancelled',
    info: 'cfp',
    success: 'fulfilled',
    warning: 'mapping',
  };

  const badgeClass = muiToBadge[color] || 'draft';

  return (
    <span className={`badge ${badgeClass}`} style={{ padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
      <span style={{ marginRight: '4px', fontSize: '14px', lineHeight: 1 }}>&bull;</span> {capitalizeStatus(rawStatus)}
    </span>
  );
};

export const capitalizeStatus = (status?: string) => {
  if (!status) return '';
  const lower = status.toLowerCase().trim();
  if (lower === 'engineering review') return 'Pending HOE Review';
  if (lower === 'approved by eng') return 'Approved by HOE';
  if (lower === 'signed' || lower === 'loi signed' || lower === 'loi_signed') return 'LOI Signed';
  if (lower === 'sent' || lower === 'loi sent' || lower === 'loi_sent') return 'LOI Sent';

  return status
    .replace(/[_]/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((word) => {
      const upper = word.toUpperCase();
      if (['LOI', 'MIS', 'CFP', 'COE', 'ID', 'ISA', 'SLA', 'HOE'].includes(upper)) {
        return upper;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

export const TruncatedBadge: React.FC<{ text: string; maxLen?: number }> = ({ text, maxLen = 15 }) => (
  <Tooltip title={text} arrow placement="top">
    <span className="badge mapped" style={{ fontFamily: 'monospace', fontSize: '13px', padding: '4px 8px', cursor: 'help', whiteSpace: 'nowrap', display: 'inline-block' }}>
      {text.length > maxLen ? `${text.slice(0, maxLen)}...` : text}
    </span>
</Tooltip>
);

// ─── Data Box (First Column IDs) ──────────────────────────────────────────────
export const DataBox: React.FC<{ text: string | number; maxLen?: number; showTooltip?: boolean; sx?: any }> = ({ text, maxLen, showTooltip = false, sx }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!text && text !== 0 && text !== '0') return null;

  const displayText = typeof text === 'string' ? text : String(text);
  const isTruncated = maxLen ? displayText.length > maxLen : false;
  const formattedText = isTruncated ? `${displayText.slice(0, maxLen)}...` : displayText;

  const boxContent = (
    <Box 
      component="span"
      sx={{ 
        fontFamily: 'monospace', 
        fontSize: '13px', 
        padding: '4px 8px', 
        whiteSpace: 'nowrap', 
        display: 'inline-flex',
        alignItems: 'center',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        boxSizing: 'border-box',
        verticalAlign: 'middle',
        backgroundColor: isDark ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.1),
        color: isDark ? theme.palette.primary.light : theme.palette.primary.dark,
        border: `1px solid ${isDark ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.primary.main, 0.2)}`,
        borderRadius: '6px',
        fontWeight: 600,
        cursor: 'pointer',
        ...sx,
      }}
    >
      <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
        {formattedText}
      </Box>
    </Box>
  );

  return (
    <Tooltip title={displayText} arrow placement="top" enterDelay={100}>
      {boxContent}
    </Tooltip>
  );
};

// ─── Role Badge ───────────────────────────────────────────────────────────────
export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const theme = useTheme();
  const colorMap: Record<UserRole, string> = {
    MIS_MANAGER: theme.palette.error.main,
    ACCOUNT_MANAGER: theme.palette.info.main,
    COE_LAB_HEAD: theme.palette.primary.main,
    HEAD_OF_ENGINEERING: theme.palette.warning.main,
    COE_COORDINATOR: theme.palette.success.main,
  };
  const color = colorMap[role] ?? theme.palette.primary.main;
  return (
    <Chip
      label={ROLE_LABELS[role]}
      size="small"
      sx={{
        fontWeight: 700, fontSize: '0.68rem',
        background: alpha(color, 0.15), color,
        border: `1px solid ${alpha(color, 0.3)}`,
      }}
    />
  );
};

// ─── User Avatar Cell ─────────────────────────────────────────────────────────
export const UserAvatarCell: React.FC<{
  name: string; email?: string; avatar?: string;
}> = ({ name, email, avatar }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
      {avatar || name.slice(0, 2).toUpperCase()}
    </Avatar>
    <Box>
      <Typography variant="body2" fontWeight={600} lineHeight={1.2}>{name}</Typography>
      {email && (
        <Typography variant="caption" color="text.secondary">{email}</Typography>
      )}
    </Box>
  </Box>
);

// ─── Capacity Bar ─────────────────────────────────────────────────────────────
export const CapacityBar: React.FC<{
  filled: number; open: number; showLabel?: boolean;
}> = ({ filled, open, showLabel = true }) => {
  const theme = useTheme();
  const percent = pct(filled, open);
  const color =
    percent >= 100 ? theme.palette.success.main
    : percent >= 60 ? theme.palette.warning.main
    : theme.palette.primary.main;
  return (
    <Box>
      {showLabel && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">{filled}/{open} filled</Typography>
          <Typography variant="caption" fontWeight={700} sx={{ color }}>{percent}%</Typography>
        </Box>
      )}
      <LinearProgress
        variant="determinate"
        value={Math.min(percent, 100)}
        sx={{ bgcolor: alpha(color, 0.15), '& .MuiLinearProgress-bar': { bgcolor: color } }}
      />
    </Box>
  );
};

// ─── Info Row ─────────────────────────────────────────────────────────────────
export const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, py: 1, gap: { xs: 0.25, sm: 0 } }}>
    <Typography variant="body1" color="text.secondary" sx={{ minWidth: { sm: 140 }, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>{label}</Typography>
    <Typography variant="body1" fontWeight={500} textAlign={{ xs: 'left', sm: 'right' }} sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>{value}</Typography>
  </Box>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard: React.FC<{
  label: string; value: number | string; icon?: React.ReactNode;
  color?: string; trend?: string; trendUp?: boolean;
}> = ({ label, value, icon, color = '#6366f1', trend, trendUp }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: `${theme.shape.borderRadius}px`,
        background: theme.palette.background.paper,
        border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
        borderTop: `3.5px solid ${color}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        height: '100%',
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.02)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.06)',
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontWeight: 600,
          letterSpacing: 0.5,
          display: 'block',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary' }}>
        {value}
      </Typography>
      {trend && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.75rem' }}>
          {trend}
        </Typography>
      )}
    </Box>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{
  icon: React.ReactNode; title: string; subtitle?: string;
}> = ({ icon, title, subtitle }) => (
  <Box sx={{ textAlign: 'center', py: 8 }}>
    <Box sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }}>{icon}</Box>
    <Typography variant="h6" color="text.secondary" gutterBottom>{title}</Typography>
    {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
  </Box>
);

// ─── Truncated text ───────────────────────────────────────────────────────────
export const TruncatedText: React.FC<{ text: string; maxLen?: number }> = ({ text, maxLen = 40 }) => (
  <Tooltip title={text || ''} arrow placement="top">
    <span style={{ cursor: 'pointer' }}>
      {maxLen && text && text.length > maxLen ? `${text.slice(0, maxLen)}…` : (text || '')}
    </span>
  </Tooltip>
);

// ─── Page Header ─────────────────────────────────────────────────────────────
export const PageHeader: React.FC<{
  title: string; subtitle?: string; action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <Box sx={{
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'row' },
    justifyContent: 'space-between',
    alignItems: { xs: 'flex-start', sm: 'center' },
    gap: { xs: 1.5, sm: 2 },
    mb: 2.2,
    width: '100%',
  }}>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}>{title}</Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" mt={0.5} sx={{ fontSize: { xs: '0.78rem', sm: '0.875rem' } }}>{subtitle}</Typography>
      )}
    </Box>
    {action && (
      <Box sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
          {action}
        </Box>
      </Box>
    )}
  </Box>
);

// ─── Section Card ─────────────────────────────────────────────────────────────
export const SectionCard: React.FC<{
  title?: string; children: React.ReactNode; action?: React.ReactNode; sx?: object; isTableCard?: boolean;
}> = ({ title, children, action, sx, isTableCard }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box sx={{
      p: isTableCard ? 0 : { xs: 2, sm: 2.5, md: 3 },
      borderRadius: `${theme.shape.borderRadius}px`,
      background: theme.palette.background.paper,
      border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
      boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.02)',
      overflow: isTableCard ? 'hidden' : 'visible',
      width: '100%',
      minWidth: 0,
      ...sx,
    }}>
      {(title || action) && (
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: { xs: 1.5, sm: 1 },
          flexWrap: 'wrap',
          px: isTableCard ? { xs: 1.5, sm: 2.5, md: 3 } : 0,
          pt: isTableCard ? { xs: 1.5, sm: 2 } : 0,
          pb: 1.5,
          mb: isTableCard ? 0 : 2,
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        }}>
          {title && <Typography variant="subtitle1" fontWeight={700} sx={{ flexShrink: 0 }}>{title}</Typography>}
          {action && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', minWidth: 0 }}>
              {action}
            </Box>
          )}
        </Box>
      )}
      {children}
    </Box>
  );
};

// ─── Global Loader ────────────────────────────────────────────────────────────
export const GlobalLoader: React.FC<{ type?: 'circular' | 'linear' | 'table'; rows?: number; message?: string }> = ({ type = 'circular', rows = 5, message }) => {
  const theme = useTheme();
  if (type === 'table') {
    return (
      <Box sx={{ width: '100%', py: 2 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1.5, px: 2 }}>
            <Box sx={{ height: 40, flex: 1, bgcolor: alpha(theme.palette.text.primary, 0.06), borderRadius: 1 }} />
            <Box sx={{ height: 40, width: 100, bgcolor: alpha(theme.palette.text.primary, 0.06), borderRadius: 1 }} />
            <Box sx={{ height: 40, width: 80, bgcolor: alpha(theme.palette.text.primary, 0.06), borderRadius: 1 }} />
          </Box>
        ))}
      </Box>
    );
  }
  if (type === 'linear') {
    return <Box sx={{ width: '100%', my: 2 }}><LinearProgress /></Box>;
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, gap: 2 }}>
      <CircularProgress size={32} thickness={4} />
      {message && <Typography variant="body2" color="text.secondary">{message}</Typography>}
    </Box>
  );
};

// ─── Debounced Search ─────────────────────────────────────────────────────────

export const DebouncedSearch: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  delay?: number;
  sx?: any;
}> = ({ value, onChange, placeholder = 'Search...', delay = 300, sx }) => {
  const [innerVal, setInnerVal] = React.useState(value);

  React.useEffect(() => {
    setInnerVal(value);
  }, [value]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (innerVal !== value) {
        onChange(innerVal);
      }
    }, delay);
    return () => clearTimeout(handler);
  }, [innerVal, onChange, delay, value]);

  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={innerVal}
      onChange={(e) => setInnerVal(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search fontSize="small" sx={{ color: 'text.secondary' }} />
          </InputAdornment>
        ),
        endAdornment: innerVal ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => { setInnerVal(''); onChange(''); }}>
              <Clear fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
      sx={{
        minWidth: { xs: 200, sm: 260 },
        '& .MuiOutlinedInput-root': {
          borderRadius: '50px',
          height: 38,
          fontSize: '0.875rem',
          backgroundColor: 'background.paper',
          transition: 'all 0.2s ease-in-out',
          '& fieldset': {
            borderColor: 'rgba(99, 102, 241, 0.4)',
            borderWidth: '1.5px',
          },
          '&:hover fieldset': {
            borderColor: '#6366f1',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)',
            '& fieldset': {
              borderColor: '#6366f1',
              borderWidth: '1.5px',
            },
          },
        },
        ...sx,
      }}
    />
  );
};
