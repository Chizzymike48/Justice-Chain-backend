import { alpha, createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: {
      main: '#cb3a2f',
      light: '#e35b4f',
      dark: '#8f1f16',
    },
    secondary: {
      main: '#1d4ed8',
      light: '#60a5fa',
      dark: '#1e3a8a',
    },
    error: {
      main: '#cb3a2f',
    },
    warning: {
      main: '#f59e0b',
    },
    success: {
      main: '#10b981',
    },
    background: {
      default: '#f7f2ea',
      paper: '#ffffff',
    },
    text: {
      primary: '#1b1f2a',
      secondary: '#4c5161',
    },
    divider: alpha('#1b1f2a', 0.08),
  },
  typography: {
    fontFamily: "'Public Sans', 'Segoe UI', sans-serif",
    h1: {
      fontFamily: "'Fraunces', 'Georgia', serif",
      fontWeight: 700,
    },
    h2: {
      fontFamily: "'Fraunces', 'Georgia', serif",
      fontWeight: 700,
    },
    h3: {
      fontFamily: "'Fraunces', 'Georgia', serif",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f7f2ea',
          backgroundImage:
            'radial-gradient(circle at 14% 10%, rgba(203, 58, 47, 0.12), transparent 40%), radial-gradient(circle at 88% 0%, rgba(29, 78, 216, 0.1), transparent 35%)',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          paddingInline: '1rem',
          transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        containedPrimary: {
          boxShadow: '0 14px 26px rgba(203, 58, 47, 0.22)',
          '&:hover': {
            boxShadow: '0 16px 28px rgba(203, 58, 47, 0.28)',
          },
        },
        containedSecondary: {
          boxShadow: '0 14px 26px rgba(29, 78, 216, 0.18)',
        },
        outlined: {
          borderColor: alpha('#1b1f2a', 0.12),
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: `1px solid ${alpha('#1b1f2a', 0.08)}`,
          boxShadow: '0 16px 40px rgba(27, 31, 42, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: alpha('#1b1f2a', 0.08),
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: alpha('#ffffff', 0.94),
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha('#1b1f2a', 0.16),
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha('#cb3a2f', 0.32),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
            borderColor: '#cb3a2f',
          },
        },
      },
    },
  },
})
