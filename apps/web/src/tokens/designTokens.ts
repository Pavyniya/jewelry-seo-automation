/**
 * Design Tokens for Ohh Glam
 * Core design system constants
 */

// Color Tokens
export const colors = {
  // Primary Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Brand Colors
  brand: {
    gold: {
      50: '#fffbf0',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    silver: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    rose: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    emerald: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
    }
  },

  // Status Colors
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Semantic Colors
  semantic: {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950',
      text: 'text-emerald-700 dark:text-emerald-200',
      border: 'border-emerald-200 dark:border-emerald-800',
      hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900',
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-950',
      text: 'text-rose-700 dark:text-rose-200',
      border: 'border-rose-200 dark:border-rose-800',
      hover: 'hover:bg-rose-100 dark:hover:bg-rose-900',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950',
      text: 'text-amber-700 dark:text-amber-200',
      border: 'border-amber-200 dark:border-amber-800',
      hover: 'hover:bg-amber-100 dark:hover:bg-amber-900',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      text: 'text-blue-700 dark:text-blue-200',
      border: 'border-blue-200 dark:border-blue-800',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900',
    }
  }
} as const;

// Spacing Tokens
export const spacing = {
  // Base spacing scale (4px base)
  px: '1px',
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem',   // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',    // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',   // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  9: '2.25rem',   // 36px
  10: '2.5rem',   // 40px
  11: '2.75rem',  // 44px
  12: '3rem',     // 48px
  14: '3.5rem',   // 56px
  16: '4rem',     // 64px
  18: '4.5rem',   // 72px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  28: '7rem',     // 112px
  32: '8rem',     // 128px
  36: '9rem',     // 144px
  40: '10rem',    // 160px
  44: '11rem',    // 176px
  48: '12rem',    // 192px
  52: '13rem',    // 208px
  56: '14rem',    // 224px
  60: '15rem',    // 240px
  64: '16rem',    // 256px
  72: '18rem',    // 288px
  80: '20rem',    // 320px
  96: '24rem',    // 384px
} as const;

// Border Radius Tokens
export const borderRadius = {
  none: '0',
  xs: '0.125rem',  // 2px
  sm: '0.25rem',   // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// Font Size Tokens
export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
  sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
  base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
  lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
  xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
  '5xl': ['3rem', { lineHeight: '1' }],          // 48px
  '6xl': ['3.75rem', { lineHeight: '1' }],       // 60px
  '7xl': ['4.5rem', { lineHeight: '1' }],        // 72px
  '8xl': ['6rem', { lineHeight: '1' }],          // 96px
} as const;

// Font Weight Tokens
export const fontWeight = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

// Line Height Tokens
export const lineHeight = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const;

// Letter Spacing Tokens
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

// Shadow Tokens
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
} as const;

// Transition Tokens
export const transitions = {
  none: 'none',
  fast: '150ms ease-in-out',
  normal: '300ms ease-in-out',
  slow: '500ms ease-in-out',
} as const;

// Z-Index Tokens
export const zIndex = {
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modalBackdrop: '1040',
  modal: '1050',
  popover: '1060',
  tooltip: '1070',
  toast: '1080',
} as const;

// Breakpoint Tokens
export const breakpoints = {
  sm: '640px',   // Small screens
  md: '768px',   // Medium screens
  lg: '1024px',  // Large screens
  xl: '1280px',  // Extra large screens
  '2xl': '1536px', // 2X large screens
} as const;

// Animation Tokens
export const animations = {
  fadeIn: 'fadeIn 0.5s ease-in-out',
  fadeOut: 'fadeOut 0.5s ease-in-out',
  slideUp: 'slideUp 0.3s ease-out',
  slideDown: 'slideDown 0.3s ease-out',
  slideLeft: 'slideLeft 0.3s ease-out',
  slideRight: 'slideRight 0.3s ease-out',
  scaleIn: 'scaleIn 0.2s ease-out',
  scaleOut: 'scaleOut 0.2s ease-out',
  bounceIn: 'bounceIn 0.6s ease-out',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  spin: 'spin 1s linear infinite',
} as const;

// Export all tokens
export const designTokens = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  animations,
} as const;