import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7c3aed' },
    secondary: { main: '#0ea5e9' },
    success: { main: '#10b981' },
    warning: { main: '#f59e0b' },
    background: {
      default: '#050510',
      paper: 'rgba(10, 8, 30, 0.72)',
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
    },
  },
  typography: {
    fontFamily: '"Raleway", "Inter", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(124, 58, 237, 0.18)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"Raleway", sans-serif',
          fontWeight: 600,
          fontSize: '0.7rem',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(5, 5, 16, 0.75)',
          borderBottom: '1px solid rgba(124, 58, 237, 0.2)',
        },
      },
    },
  },
});
