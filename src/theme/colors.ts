export const palette = {
  dark: {
    bg: '#0B0B0B',
    surface: '#111316',
    elevated: '#16191D',
    border: '#1F1F1F',
    muted: '#20232A',
    primary: '#5B8CFF',
    success: '#2ECC71',
    warning: '#F5C04E',
    danger: '#FF6B6B',
    text: { primary: '#FFFFFF', secondary: '#9AA0A6', muted: '#6B7280' },
    overlay: 'rgba(0,0,0,0.5)',
    rings: { move: '#FF2D55', exercise: '#30D158', stand: '#64D2FF' },
  },
  light: {
    bg: '#FFFFFF',
    surface: '#F7F7F9',
    elevated: '#FFFFFF',
    border: '#E6E6E6',
    muted: '#EEF0F3',
    primary: '#3366FF',
    success: '#23B26D',
    warning: '#E3A82B',
    danger: '#E15555',
    text: { primary: '#0B0B0B', secondary: '#4B5563', muted: '#6B7280' },
    overlay: 'rgba(0,0,0,0.35)',
    rings: { move: '#FF2D55', exercise: '#30D158', stand: '#64D2FF' },
  },
} as const;

export type AppTheme = typeof palette.dark;
