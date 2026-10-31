// import { alpha } from '@mui/material/styles';
// import { Theme } from '@mui/material';
// import { FONT_FAMILY, brand } from '../theme/tokens';
// import { dashboardCardStyle } from './dashboardStyles';

// export { dashboardCardStyle };

// export const tableStyles = {
//   fontFamily: FONT_FAMILY,
//   headerBg: '#1A3C6E',
//   headerColor: '#ffffff',
//   headerWeight: 600,
//   fontSize: '0.8125rem',
//   py: 1.5,
//   rowPadding: '8px 14px',
//   borderColor: '#f1f5f9',
//   hoverBg: '#f8fafc',
//   hoverDarkBg: '#1c1f30',
//   nameColor: '#0f2942',
//   textPrimary: '#334155',
//   textSecondary: '#64748b',
//   chipHeight: 24,
//   chipFontSize: '0.75rem',
//   chipBorder: '#e2e8f0',
//   chipBg: '#f1f5f9',
//   chipColor: '#64748b',
//   statusActiveBg: '#e0e7ff',
//   statusActiveColor: brand.primary,
//   statusDraftBg: '#f1f5f9',
//   statusDraftColor: '#475569',
// };

// export const useTableStyles = (isDark: boolean) => {
//   return {
//     ...tableStyles,
//     headerBg: isDark ? '#0f2442' : '#1A3C6E',
//     headerColor: '#ffffff',
//     hoverBg: isDark ? '#1c1f30' : '#f8fafc',
//     borderColor: isDark ? '#222538' : '#f1f5f9',
//     chipBg: isDark ? '#1e293b' : tableStyles.chipBg,
//     chipBorder: isDark ? '#334155' : tableStyles.chipBorder,
//     chipColor: isDark ? '#94a3b8' : tableStyles.chipColor,
//     statusActiveBg: isDark ? alpha(brand.primary, 0.25) : '#e0e7ff',
//     statusActiveColor: isDark ? '#818cf8' : brand.primary,
//     statusDraftBg: isDark ? '#1e293b' : '#f1f5f9',
//     statusDraftColor: isDark ? '#94a3b8' : '#475569',
//     textPrimary: isDark ? '#cbd5e1' : '#334155',
//     textSecondary: isDark ? '#94a3b8' : '#64748b',
//   };
// };

// export const tableContainerStyles = (theme: Theme) => {
//   const isDark = theme.palette.mode === 'dark';
//   return {
//     borderRadius: 8,
//     border: `1px solid ${isDark ? '#222538' : '#e2e8f0'}`,
//     overflow: 'hidden',
//     backgroundColor: isDark ? '#151724' : '#ffffff',
//   };
// };


// export const tableHeaderRowStyles = (isDark: boolean) => {
//   const bgColor = isDark ? '#0f2442' : '#1A3C6E';
//   return {
//     backgroundColor: bgColor,
//     pointerEvents: 'none', 
//     '& th': {
//       borderBottom: 'none',
//       backgroundColor: `${bgColor} !important`,
//       color: '#ffffff !important',
//       padding: '10px 14px',
//     },
//     '&:hover': {
//       backgroundColor: `${bgColor} !important`,
//     },
//     '&:hover th': {
//       backgroundColor: `${bgColor} !important`,
//     }
//   };
// };

// export const tableHeaderCellStyles = (isDark: boolean) => ({
//   fontWeight: 600,
//   fontSize: '0.75rem',
//   letterSpacing: '0.3px',
//   py: 1.5,
//   borderBottom: 'none',
//   fontFamily: FONT_FAMILY,
//   backgroundColor: isDark ? '#0f2442' : '#1A3C6E',
//   color: '#ffffff',
// });

// export const tableRowStyles = (isDark: boolean) => ({
//   cursor: 'pointer',
//   transition: 'all 0.15s ease-in-out',
  
//   // Entire Table Row hover with strong background & left accent bar
//   '&.MuiTableRow-root:hover': {
//     backgroundColor: isDark ? '#1e293b !important' : '#e0e7ff !important',
//     boxShadow: isDark ? 'inset 4px 0 0 #3b82f6 !important' : 'inset 4px 0 0 #4f46e5 !important',
//   },
//   '&.MuiTableRow-root:hover > .MuiTableCell-root': {
//     backgroundColor: isDark ? '#1e293b !important' : '#e0e7ff !important',
//     color: isDark ? '#ffffff !important' : '#0f172a !important',
//   },
// });

// export const actionIconButtonStyles = (isDark: boolean, colorType?: 'default' | 'error' | 'success') => {
//   const isError = colorType === 'error';
//   const isSuccess = colorType === 'success';
//   const textColor = isError 
//     ? (isDark ? '#f87171' : '#dc2626') 
//     : isSuccess
//     ? (isDark ? '#34d399' : '#059669')
//     : (isDark ? '#cbd5e1' : '#475569');
//   const borderColor = isError 
//     ? (isDark ? 'rgba(248, 113, 113, 0.4)' : 'rgba(220, 38, 38, 0.4)') 
//     : isSuccess
//     ? (isDark ? 'rgba(52, 211, 153, 0.4)' : 'rgba(5, 150, 105, 0.4)')
//     : (isDark ? '#334155' : '#cbd5e1');
//   const hoverBg = isError 
//     ? (isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(220, 38, 38, 0.05)')
//     : isSuccess
//     ? (isDark ? 'rgba(52, 211, 153, 0.1)' : 'rgba(5, 150, 105, 0.05)')
//     : (isDark ? '#334155' : '#f1f5f9');

//   return {
//     border: `1px solid ${borderColor}`,
//     borderRadius: '6px',
//     p: 0.5,
//     color: textColor,
//     backgroundColor: isDark ? '#1e293b' : '#ffffff',
//     '&:hover': {
//       backgroundColor: hoverBg,
//     },
//   };
// };

// export const actionCellStyles = {
//   whiteSpace: 'nowrap',
//   width: '1%',
// };

// export const tableBodyCellStyles = (isDark: boolean) => ({
//   fontFamily: FONT_FAMILY,
//   fontSize: '0.8125rem',
//   color: isDark ? '#cbd5e1' : '#334155',
//   borderBottom: `1px solid ${isDark ? '#222538' : '#f1f5f9'}`,
// });

// export const tableBodyCellPrimaryStyles = (isDark: boolean) => ({
//   ...tableBodyCellStyles(isDark),
//   fontWeight: 600,
//   color: isDark ? '#cbd5e1' : '#334155',
// });

// export const tableBodyCellSecondaryStyles = (isDark: boolean) => ({
//   ...tableBodyCellStyles(isDark),
//   fontWeight: 500,
//   color: isDark ? '#94a3b8' : '#64748b',
// });



// import { alpha } from '@mui/material/styles';
// import { Theme } from '@mui/material';
// import { FONT_FAMILY, brand } from '../theme/tokens';
// import { dashboardCardStyle } from './dashboardStyles';

// export { dashboardCardStyle };

// export const tableStyles = {
//   fontFamily: FONT_FAMILY,
//   headerBg: '#1A3C6E',
//   headerColor: '#ffffff',
//   headerWeight: 600,
//   fontSize: '0.8125rem',
//   py: 1.5,
//   rowPadding: '8px 14px',
//   borderColor: '#f1f5f9',
//   hoverBg: '#f8fafc',
//   hoverDarkBg: '#1c1f30',
//   nameColor: '#0f2942',
//   textPrimary: '#334155',
//   textSecondary: '#64748b',
//   chipHeight: 24,
//   chipFontSize: '0.75rem',
//   chipBorder: '#e2e8f0',
//   chipBg: '#f1f5f9',
//   chipColor: '#64748b',
//   statusActiveBg: '#e0e7ff',
//   statusActiveColor: brand.primary,
//   statusDraftBg: '#f1f5f9',
//   statusDraftColor: '#475569',
// };

// export const useTableStyles = (isDark: boolean) => {
//   return {
//     ...tableStyles,
//     headerBg: isDark ? '#0f2442' : '#1A3C6E',
//     headerColor: '#ffffff',
//     hoverBg: isDark ? '#1c1f30' : '#f8fafc',
//     borderColor: isDark ? '#222538' : '#f1f5f9',
//     chipBg: isDark ? '#1e293b' : tableStyles.chipBg,
//     chipBorder: isDark ? '#334155' : tableStyles.chipBorder,
//     chipColor: isDark ? '#94a3b8' : tableStyles.chipColor,
//     statusActiveBg: isDark ? alpha(brand.primary, 0.25) : '#e0e7ff',
//     statusActiveColor: isDark ? '#818cf8' : brand.primary,
//     statusDraftBg: isDark ? '#1e293b' : '#f1f5f9',
//     statusDraftColor: isDark ? '#94a3b8' : '#475569',
//     textPrimary: isDark ? '#cbd5e1' : '#334155',
//     textSecondary: isDark ? '#94a3b8' : '#64748b',
//   };
// };

// export const tableContainerStyles = (theme: Theme) => {
//   const isDark = theme.palette.mode === 'dark';
//   return {
//     borderRadius: 8,
//     border: `1px solid ${isDark ? '#222538' : '#e2e8f0'}`,
//     overflow: 'hidden',
//     backgroundColor: isDark ? '#151724' : '#ffffff',
//   };
// };

// export const tableHeaderRowStyles = (isDark: boolean) => {
//   const bgColor = isDark ? '#0f2442' : '#1A3C6E';
//   return {
//     backgroundColor: bgColor,
//     pointerEvents: 'none', 
//     '& th': {
//       borderBottom: 'none',
//       backgroundColor: `${bgColor} !important`,
//       color: '#ffffff !important',
//       padding: '10px 14px',
//     },
//     '&:hover': {
//       backgroundColor: `${bgColor} !important`,
//     },
//     '&:hover th': {
//       backgroundColor: `${bgColor} !important`,
//     }
//   };
// };

// export const tableHeaderCellStyles = (isDark: boolean) => ({
//   fontWeight: 600,
//   fontSize: '0.75rem',
//   letterSpacing: '0.3px',
//   py: 1.5,
//   borderBottom: 'none',
//   fontFamily: FONT_FAMILY,
//   backgroundColor: isDark ? '#0f2442' : '#1A3C6E',
//   color: '#ffffff',
// });

// export const tableRowStyles = (isDark: boolean) => ({
//   cursor: 'default',
//   transition: 'background-color 0.2s ease',
  
 
//   '&:hover': {
//     backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05) !important' : 'rgba(0, 0, 0, 0.04) !important',
//     boxShadow: isDark ? 'inset 3px 0 0 #3b82f6 !important' : 'inset 3px 0 0 #2563eb !important',
//   },
  

//   '&:hover .MuiTableCell-root': {
//     backgroundColor: 'transparent !important',
//     color: 'inherit !important', 
//   },
// });
// export const actionIconButtonStyles = (isDark: boolean, colorType?: 'default' | 'error' | 'success') => {
//   const isError = colorType === 'error';
//   const isSuccess = colorType === 'success';
//   const textColor = isError 
//     ? (isDark ? '#f87171' : '#dc2626') 
//     : isSuccess
//     ? (isDark ? '#34d399' : '#059669')
//     : (isDark ? '#cbd5e1' : '#475569');
//   const borderColor = isError 
//     ? (isDark ? 'rgba(248, 113, 113, 0.4)' : 'rgba(220, 38, 38, 0.4)') 
//     : isSuccess
//     ? (isDark ? 'rgba(52, 211, 153, 0.4)' : 'rgba(5, 150, 105, 0.4)')
//     : (isDark ? '#334155' : '#cbd5e1');
//   const hoverBg = isError 
//     ? (isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(220, 38, 38, 0.05)')
//     : isSuccess
//     ? (isDark ? 'rgba(52, 211, 153, 0.1)' : 'rgba(5, 150, 105, 0.05)')
//     : (isDark ? '#334155' : '#f1f5f9');

//   return {
//     border: `1px solid ${borderColor}`,
//     borderRadius: '6px',
//     p: 0.5,
//     color: textColor,
//     backgroundColor: isDark ? '#1e293b' : '#ffffff',
//     '&:hover': {
//       backgroundColor: hoverBg,
//     },
//   };
// };

// export const actionCellStyles = {
//   whiteSpace: 'nowrap',
//   width: '1%',
// };

// export const tableBodyCellStyles = (isDark: boolean) => ({
//   fontFamily: FONT_FAMILY,
//   fontSize: '0.8125rem',
//   color: isDark ? '#cbd5e1' : '#334155',
//   borderBottom: `1px solid ${isDark ? '#222538' : '#f1f5f9'}`,
// });

// export const tableBodyCellPrimaryStyles = (isDark: boolean) => ({
//   ...tableBodyCellStyles(isDark),
//   fontWeight: 600,
//   color: isDark ? '#cbd5e1' : '#334155',
// });

// export const tableBodyCellSecondaryStyles = (isDark: boolean) => ({
//   ...tableBodyCellStyles(isDark),
//   fontWeight: 500,
//   color: isDark ? '#94a3b8' : '#64748b',
// });



import { alpha } from '@mui/material/styles';
import { Theme } from '@mui/material';
import { FONT_FAMILY, brand } from '../theme/tokens';
import { dashboardCardStyle } from './dashboardStyles';

export { dashboardCardStyle };

export const tableStyles = {
  fontFamily: FONT_FAMILY,
  headerBg: '#1A3C6E',
  headerColor: '#ffffff',
  headerWeight: 600,
  fontSize: '0.8125rem',
  py: 1.5,
  rowPadding: '8px 14px',
  borderColor: '#f1f5f9',
  hoverBg: '#f8fafc',
  hoverDarkBg: '#1c1f30',
  nameColor: '#0f2942',
  textPrimary: '#334155',
  textSecondary: '#64748b',
  chipHeight: 24,
  chipFontSize: '0.75rem',
  chipBorder: '#e2e8f0',
  chipBg: '#f1f5f9',
  chipColor: '#64748b',
  statusActiveBg: '#e0e7ff',
  statusActiveColor: brand.primary,
  statusDraftBg: '#f1f5f9',
  statusDraftColor: '#475569',
};

export const useTableStyles = (isDark: boolean) => {
  return {
    ...tableStyles,
    headerBg: isDark ? '#0f2442' : '#1A3C6E',
    headerColor: '#ffffff',
    hoverBg: isDark ? '#2a2f45' : '#e2e8f0', // High contrast hover colors
    borderColor: isDark ? '#222538' : '#f1f5f9',
    chipBg: isDark ? '#1e293b' : tableStyles.chipBg,
    chipBorder: isDark ? '#334155' : tableStyles.chipBorder,
    chipColor: isDark ? '#94a3b8' : tableStyles.chipColor,
    statusActiveBg: isDark ? alpha(brand.primary, 0.25) : '#e0e7ff',
    statusActiveColor: isDark ? '#818cf8' : brand.primary,
    statusDraftBg: isDark ? '#1e293b' : '#f1f5f9',
    statusDraftColor: isDark ? '#94a3b8' : '#475569',
    textPrimary: isDark ? '#cbd5e1' : '#334155',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
  };
};

export const tableContainerStyles = (theme: Theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    borderRadius: 8,
    border: `1px solid ${isDark ? '#222538' : '#e2e8f0'}`,
    overflow: 'hidden',
    backgroundColor: isDark ? '#151724' : '#ffffff',
  };
};

export const tableHeaderRowStyles = (isDark: boolean) => {
  const bgColor = isDark ? '#0f2442' : '#1A3C6E';
  return {
    backgroundColor: bgColor,
    pointerEvents: 'none', 
    '& th': {
      borderBottom: 'none',
      backgroundColor: `${bgColor} !important`,
      color: '#ffffff !important',
      padding: '10px 14px',
    },
    '&:hover': {
      backgroundColor: `${bgColor} !important`,
    },
    '&:hover th': {
      backgroundColor: `${bgColor} !important`,
    }
  };
};

export const tableHeaderCellStyles = (isDark: boolean) => ({
  fontWeight: 600,
  fontSize: '0.75rem',
  letterSpacing: '0.3px',
  py: 1.5,
  borderBottom: 'none',
  fontFamily: FONT_FAMILY,
  backgroundColor: isDark ? '#0f2442' : '#1A3C6E',
  color: '#ffffff',
});

// 🔥 UPDATED TABLE ROW HOVER STYLES (CLEARLY VISIBLE)
export const tableRowStyles = (isDark: boolean) => ({
  cursor: 'pointer',
  transition: 'background-color 0.15s ease-in-out',
  
  '&:hover': {
    // Softer, elegant background highlight (Linear/Vercel/Stripe style)
    backgroundColor: isDark ? '#182338 !important' : '#e0e7ff !important',
    // 3px thick left border accent
    boxShadow: isDark ? 'inset 3px 0 0 #3b82f6 !important' : 'inset 3px 0 0 #2563eb !important',
  },

  '&:hover .MuiTableCell-root': {
    backgroundColor: 'transparent !important',
    color: 'inherit !important', 
  },
});

export const actionIconButtonStyles = (isDark: boolean, colorType?: 'default' | 'error' | 'success') => {
  const isError = colorType === 'error';
  const isSuccess = colorType === 'success';
  const textColor = isError 
    ? (isDark ? '#f87171' : '#dc2626') 
    : isSuccess
    ? (isDark ? '#34d399' : '#059669')
    : (isDark ? '#cbd5e1' : '#475569');
  const borderColor = isError 
    ? (isDark ? 'rgba(248, 113, 113, 0.4)' : 'rgba(220, 38, 38, 0.4)') 
    : isSuccess
    ? (isDark ? 'rgba(52, 211, 153, 0.4)' : 'rgba(5, 150, 105, 0.4)')
    : (isDark ? '#334155' : '#cbd5e1');
  const hoverBg = isError 
    ? (isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(220, 38, 38, 0.05)')
    : isSuccess
    ? (isDark ? 'rgba(52, 211, 153, 0.1)' : 'rgba(5, 150, 105, 0.05)')
    : (isDark ? '#334155' : '#f1f5f9');

  return {
    border: `1px solid ${borderColor}`,
    borderRadius: '6px',
    p: 0.5,
    color: textColor,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    '&:hover': {
      backgroundColor: hoverBg,
    },
  };
};

export const actionCellStyles = {
  whiteSpace: 'nowrap',
  width: '1%',
};

export const tableBodyCellStyles = (isDark: boolean) => ({
  fontFamily: FONT_FAMILY,
  fontSize: '0.8125rem',
  color: isDark ? '#cbd5e1' : '#334155',
  borderBottom: `1px solid ${isDark ? '#222538' : '#f1f5f9'}`,
});

export const tableBodyCellPrimaryStyles = (isDark: boolean) => ({
  ...tableBodyCellStyles(isDark),
  fontWeight: 600,
  color: isDark ? '#f1f5f9' : '#0f2942',
});

export const tableBodyCellSecondaryStyles = (isDark: boolean) => ({
  ...tableBodyCellStyles(isDark),
  fontWeight: 500,
  color: isDark ? '#94a3b8' : '#64748b',
});