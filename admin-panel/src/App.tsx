import React, { useState, useMemo, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box, ThemeProvider, createTheme, PaletteMode } from '@mui/material';

// Компоненты
import Navigation from './components/Navigation';

// Страницы
import HomePage from './pages/home/HomePage';
import UploadPage from './pages/upload/UploadPage';
import ImageDetailPage from './pages/detail/ImageDetailPage';
import MetricsPage from './pages/metrics/MetricsPage';

// Создание контекста для темы
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: 'light' as PaletteMode
});

const App: React.FC = () => {
  // Получаем сохраненную тему из localStorage или используем светлую тему по умолчанию
  const storedMode = localStorage.getItem('colorMode') as PaletteMode || 'light';
  // Состояние для текущей темы (светлая или темная)
  const [mode, setMode] = useState<PaletteMode>(storedMode);

  // Эффект для сохранения выбранной темы в localStorage
  useEffect(() => {
    localStorage.setItem('colorMode', mode);
  }, [mode]);

  // Контекст для переключения темы
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      mode
    }),
    [mode]
  );

  // Создание темы в зависимости от выбранного режима
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#9c27b0',
          },
          info: {
            main: '#0288d1',
          },
          success: {
            main: '#2e7d32',
          },
          warning: {
            main: '#ed6c02',
          },
          error: {
            main: '#d32f2f',
          },
          background: {
            default: mode === 'light' ? '#f5f5f5' : '#121212',
            paper: mode === 'light' ? '#fff' : '#1e1e1e',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h4: {
            fontWeight: 500,
          },
          h6: {
            fontWeight: 500,
          },
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: '8px',
                boxShadow: mode === 'light' 
                  ? '0 2px 4px rgba(0,0,0,0.08)' 
                  : '0 2px 4px rgba(0,0,0,0.2)',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: '8px',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: '6px',
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navigation />
            <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
              <Routes>
                {/* Основные маршруты */}
                <Route path="/" element={<HomePage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/images/:id/view" element={<ImageDetailPage />} />
                <Route path="/metrics" element={<MetricsPage />} />
                
                {/* Заглушки для страниц, которые будут добавлены позже */}
                <Route path="/analytics" element={<div>Страница аналитики будет добавлена позже</div>} />
                <Route path="/settings" element={<div>Страница настроек будет добавлена позже</div>} />
                <Route path="/profile" element={<div>Страница профиля будет добавлена позже</div>} />
                <Route path="/activities" element={<div>Страница активностей будет добавлена позже</div>} />
                <Route path="/compress" element={<div>Страница сжатия будет добавлена позже</div>} />
                <Route path="/cleanup" element={<div>Страница очистки хранилища будет добавлена позже</div>} />
                <Route path="/storage" element={<div>Страница статистики хранилища будет добавлена позже</div>} />
                <Route path="/backup" element={<div>Страница резервного копирования будет добавлена позже</div>} />
                <Route path="/notifications" element={<div>Страница уведомлений будет добавлена позже</div>} />
                
                {/* Редирект на главную для неизвестных маршрутов */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
