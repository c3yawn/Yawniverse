import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7c3aed' },
    secondary: { main: '#0ea5e9' },
    success: { main: '#10b981' },
    warning: { main: '#f59e0b' },
    background: {
      default: '#020208',
      paper: 'rgba(6, 4, 20, 0.88)',
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#64748b',
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
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(124, 58, 237, 0.12)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"Raleway", sans-serif',
          fontWeight: 600,
          fontSize: '0.65rem',
          letterSpacing: '0.04em',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(2, 2, 8, 0.85)',
          borderBottom: '1px solid rgba(124, 58, 237, 0.1)',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '52px !important',
          '@media (min-width: 600px)': {
            minHeight: '52px !important',
          },
        },
      },
    },
  },
});
