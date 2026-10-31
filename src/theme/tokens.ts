/** Shared design tokens — single source for layout, typography, and brand colors. */
export const FONT_FAMILY = '"Inter", "Roboto", "Helvetica Neue", sans-serif';

export const layout = {
  drawerWidth: 220,
  topbarHeight: 52,
  contentMaxWidth: 1600,
  pagePadding: { xs: 1.5, sm: 2, md: 2.5 } as const,
};

export const brand = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  navy: '#0a3066',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};
// Global styling tokens
export const FONT_COLOR = {
  dark: '#f8fafc',
  light: '#1e293b',
};

export const FONT_WEIGHT = {
  regular: 400,
  medium: 500,
  bold: 700,
};

export const FONT_SIZE = {
  base: '0.875rem',
  small: '0.75rem',
  large: '1rem',
};
