import { createTheme, alpha } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';
import { FONT_FAMILY, brand, layout } from './tokens';

export { FONT_FAMILY, brand, layout } from './tokens';

const brandPrimary = brand.primary;
const brandSecondary = brand.secondary;
const brandAccent = brand.accent;
const brandSuccess = brand.success;
const brandWarning = brand.warning;
const brandError = brand.error;

export const getTheme = (mode: PaletteMode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: brandPrimary,
        light: '#818cf8',
        dark: '#4f46e5',
        contrastText: '#ffffff',
      },
      secondary: {
        main: brandSecondary,
        light: '#a78bfa',
        dark: '#7c3aed',
        contrastText: '#ffffff',
      },
      success: { main: brandSuccess },
      warning: { main: brandWarning },
      error: { main: brandError },
      info: { main: brandAccent },
      background: {
        default: isDark ? '#0f0f1a' : '#f1f5f9',
        paper: isDark ? '#1a1a2e' : '#ffffff',
      },
      text: {
        primary: isDark ? '#e2e8f0' : '#1e293b',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    },
    typography: {
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      h1: { fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.025em', lineHeight: 1.2 },
      h2: { fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em', lineHeight: 1.25 },
      h3: { fontWeight: 600, fontSize: '1.3rem', letterSpacing: '-0.015em', lineHeight: 1.3 },
      h4: { fontWeight: 600, fontSize: '1.15rem', letterSpacing: '-0.01em', lineHeight: 1.35 },
      h5: { fontWeight: 600, fontSize: '1.05rem', lineHeight: 1.4 },
      h6: { fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.45 },
      subtitle1: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 },
      subtitle2: { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.5 },
      body1: { fontSize: '0.95rem', lineHeight: 1.5 },
      body2: { fontSize: '0.875rem', lineHeight: 1.45 },
      caption: { fontSize: '0.75rem', lineHeight: 1.35 },
      overline: { fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', lineHeight: 1.4 },
      button: { fontWeight: 600, fontSize: '0.875rem', textTransform: 'none', letterSpacing: '0.01em' },
    },
    shape: { borderRadius: 12 },
    shadows: isDark
      ? [
          'none',
          '0 1px 3px rgba(0,0,0,0.4)',
          '0 2px 6px rgba(0,0,0,0.4)',
          '0 4px 12px rgba(0,0,0,0.4)',
          '0 8px 24px rgba(0,0,0,0.4)',
          '0 12px 40px rgba(0,0,0,0.5)',
          ...Array(19).fill('0 12px 40px rgba(0,0,0,0.5)'),
        ] as ReturnType<typeof createTheme>['shadows']
      : [
          'none',
          '0 1px 3px rgba(0,0,0,0.06)',
          '0 2px 6px rgba(0,0,0,0.06)',
          '0 4px 12px rgba(0,0,0,0.08)',
          '0 8px 24px rgba(0,0,0,0.08)',
          '0 12px 40px rgba(0,0,0,0.10)',
          ...Array(19).fill('0 12px 40px rgba(0,0,0,0.10)'),
        ] as ReturnType<typeof createTheme>['shadows'],
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          :root {
            --table-header-bg: ${isDark ? '#0f3066' : '#0a3066'};
            --table-row-bg: ${isDark ? '#151724' : '#ffffff'};
            --table-border-color: ${isDark ? '#222538' : '#f1f5f9'};
            --kpi-bg: ${isDark ? '#151724' : '#ffffff'};
            --kpi-border: ${isDark ? '#222538' : 'var(--g300)'};
            --kpi-text: ${isDark ? '#f8fafc' : 'var(--g900)'};
            --kpi-sub: ${isDark ? '#94a3b8' : 'var(--g500)'};
            --panel-bg: ${isDark ? '#151724' : '#ffffff'};
            --panel-border: ${isDark ? '#222538' : 'var(--g300)'};
            --panel-title: ${isDark ? '#f8fafc' : 'var(--g900)'};
            --panel-text: ${isDark ? '#94a3b8' : 'var(--g500)'};
          }

          /* ── Global Table Body: Row Base ─────────────────── */
          .MuiTableBody-root .MuiTableRow-root .MuiTableCell-root {
            background-color: var(--table-row-bg);
          }

          /* ── Table Row Hover: Visible highlight ──────────── */
          .MuiTableBody-root .MuiTableRow-root:hover .MuiTableCell-root,
          .MuiTableBody-root .MuiTableRow-root.MuiTableRow-hover:hover .MuiTableCell-root {
            background-color: ${isDark ? '#182338' : '#e0e7ff'} !important;
            color: ${isDark ? '#f1f5f9' : '#0f172a'} !important;
            transition: background-color 0.15s ease, color 0.15s ease;
          }

          /* ── Global Table Header: Lock Background ────────── */
          .MuiTableHead-root .MuiTableRow-root .MuiTableCell-root,
          .MuiTableHead-root .MuiTableRow-root:hover .MuiTableCell-root {
            background-color: var(--table-header-bg) !important;
            color: #ffffff !important;
            cursor: default;
          }

          /* ── Scrollbar ────────────────────────────────────── */
          body {
            scrollbar-width: thin;
            scrollbar-color: ${isDark ? '#374151 transparent' : '#cbd5e1 transparent'};
          }
          body::-webkit-scrollbar { width: 6px; }
          body::-webkit-scrollbar-track { background: transparent; }
          body::-webkit-scrollbar-thumb {
            background: ${isDark ? '#374151' : '#cbd5e1'};
            border-radius: 3px;
          }

          /* ── Dark Mode Date Picker Icon Contrast Fix ───────────────────────── */
          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: ${isDark ? 'invert(1) hue-rotate(180deg) brightness(1.2)' : 'none'};
            cursor: pointer;
            opacity: ${isDark ? 0.9 : 0.7};
            transition: opacity 0.2s ease, filter 0.2s ease;
          }
          input[type="date"]::-webkit-calendar-picker-indicator:hover {
            opacity: 1;
          }
        `,
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 20px',
            transition: 'all 0.2s ease',
            '&:hover': { transform: 'translateY(-1px)' },
          },
          contained: {
            boxShadow: `0 4px 14px ${alpha(brandPrimary, 0.4)}`,
            '&:hover': {
              boxShadow: `0 6px 20px ${alpha(brandPrimary, 0.5)}`,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 8,
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              fontSize: '0.92rem',
              color: isDark ? '#f8fafc' : '#0f172a',
              transition: 'box-shadow 0.2s ease',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: brandPrimary,
              },
              '&.Mui-focused': {
                boxShadow: `0 0 0 3px ${alpha(brandPrimary, 0.2)}`,
              },
              '&.Mui-disabled': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: isDark ? 'rgba(255,255,255,0.3) !important' : 'rgba(0,0,0,0.35) !important',
                },
                '& .MuiOutlinedInput-input': {
                  color: isDark ? '#ffffff !important' : '#000000 !important',
                  WebkitTextFillColor: isDark ? '#ffffff !important' : '#000000 !important',
                  fontWeight: 600,
                },
              },
              '& .MuiOutlinedInput-input': {
                color: isDark ? '#f8fafc' : '#0f172a',
              },
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            fontSize: '0.92rem',
            color: isDark ? '#f8fafc' : '#0f172a',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: brandPrimary,
            },
            '&.Mui-disabled': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isDark ? 'rgba(255,255,255,0.3) !important' : 'rgba(0,0,0,0.35) !important',
              },
              '& .MuiOutlinedInput-input': {
                color: isDark ? '#ffffff !important' : '#000000 !important',
                WebkitTextFillColor: isDark ? '#ffffff !important' : '#000000 !important',
                fontWeight: 600,
              },
            },
            '& .MuiOutlinedInput-input': {
              color: isDark ? '#f8fafc' : '#0f172a',
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.9rem',
            color: isDark ? '#cbd5e1' : '#334155',
            fontWeight: 500,
            '&.Mui-focused': {
              color: brandPrimary,
            },
            '&.Mui-disabled': {
              color: isDark ? '#94a3b8 !important' : '#1e293b !important',
              fontWeight: 600,
            },
          },
        },
      },
      MuiSelect: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: { 
            borderRadius: 10,
            fontSize: '0.92rem',
            color: isDark ? '#f8fafc' : '#0f172a',
            '&.Mui-disabled': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isDark ? 'rgba(255,255,255,0.3) !important' : 'rgba(0,0,0,0.35) !important',
              },
              '& .MuiSelect-select': {
                color: isDark ? '#ffffff !important' : '#000000 !important',
                WebkitTextFillColor: isDark ? '#ffffff !important' : '#000000 !important',
                fontWeight: 600,
              },
              '& .MuiSelect-icon': {
                color: isDark ? '#ffffff !important' : '#000000 !important',
              },
            },
            '& .MuiSelect-select': {
              color: isDark ? '#f8fafc' : '#0f172a',
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 700,
              fontSize: '0.82rem',
              letterSpacing: '0.02em',
              color: '#ffffff',
              background: isDark ? '#0f3066' : '#0a3066',
            },
            // Lock header row so hover never changes its color
            '& .MuiTableRow-root:hover': {
              backgroundColor: `${isDark ? '#0f3066' : '#0a3066'} !important`,
            },
            '& .MuiTableRow-root': {
              backgroundColor: `${isDark ? '#0f3066' : '#0a3066'} !important`,
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.15s ease, color 0.15s ease',
            // Data row hover — visible highlight in light and dark mode
            '&.MuiTableRow-hover:hover': {
              backgroundColor: isDark ? '#182338 !important' : '#e0e7ff !important',
            },
            '&.MuiTableRow-hover:hover .MuiTableCell-root': {
              backgroundColor: isDark ? '#182338 !important' : '#e0e7ff !important',
              color: isDark ? '#f1f5f9 !important' : '#0f172a !important',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            padding: '10px 14px',
          },
          head: {
            backgroundColor: `${isDark ? '#0f3066' : '#0a3066'} !important`,
            color: '#ffffff !important',
            fontWeight: 700,
            // Prevent cell background from changing on header row hover
            '&:hover': {
              backgroundColor: `${isDark ? '#0f3066' : '#0a3066'} !important`,
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            background: isDark
              ? 'linear-gradient(180deg, #16213e 0%, #0f0f1a 100%)'
              : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: isDark ? alpha('#1a1a2e', 0.85) : alpha('#ffffff', 0.85),
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: 'none',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: '2px 8px',
            transition: 'all 0.2s ease',
            '&.Mui-selected': {
              background: `linear-gradient(135deg, ${alpha(brandPrimary, 0.2)}, ${alpha(brandSecondary, 0.15)})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${alpha(brandPrimary, 0.25)}, ${alpha(brandSecondary, 0.2)})`,
              },
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 4, height: 6 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: '0.75rem',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            textTransform: 'none',
            minHeight: 44,
          },
        },
      },
    },
  });
};
