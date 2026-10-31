import { alpha, Theme } from '@mui/material/styles';

export const dashboardCardStyle = (theme: Theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    background: isDark ? '#151724' : '#ffffff',
    border: `1px solid ${isDark ? '#222538' : '#e2e8f0'}`,
    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.05)',
    borderRadius: '8px',

    '& .MuiTable-root': {
      borderCollapse: 'separate',
      borderSpacing: '0',
    },

    '& .MuiTableRow-root': {
      backgroundColor: 'transparent',
      transition: 'background-color 0.2s ease',
      '&:hover': {
        backgroundColor: `${isDark ? '#1c1f30' : '#f8fafc'} !important`,
      },
    },

    '& .MuiTableCell-root': {
      padding: '10px 16px',
      borderBottom: `1px solid ${isDark ? '#222538' : '#f1f5f9'}`,
      color: isDark ? '#cbd5e1' : '#334155',
      fontSize: '0.875rem',
      fontFamily: theme.typography.fontFamily,
    },

    '& .MuiTableHead-root .MuiTableCell-root': {
      fontWeight: 700,
      textTransform: 'none',
      fontSize: '0.82rem',
      letterSpacing: 'normal',
      backgroundColor: isDark ? '#1e2030' : '#f8fafc',
      color: isDark ? '#f8fafc' : '#0f172a',
      '&:hover': {
        backgroundColor: isDark ? '#1e2030 !important' : '#f8fafc !important',
      },
    },

    '& .MuiFormControl-root': {
      minWidth: 180,
    },

    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: isDark ? '#14141C' : '#F9FAFB',
      transition: 'all .2s ease',

      '& fieldset': {
        borderColor: theme.palette.divider,
      },

      '&:hover fieldset': {
        borderColor: theme.palette.primary.main,
      },

      '&.Mui-focused fieldset': {
        borderWidth: '2px',
        borderColor: theme.palette.primary.main,
      },
    },

    '& .MuiInputLabel-root.Mui-focused': {
      color: theme.palette.primary.main,
    },
  };
};
