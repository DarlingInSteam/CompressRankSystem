import React, { useState, useMemo, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box, ThemeProvider, createTheme, PaletteMode } from '@mui/material';

// Компоненты
import Navigation from './components/Navigation';

// Страницы
import HomePage from './pages/home/HomePage';
import UploadPage from './pages/upload/UploadPage';
import ImageDetailPage from './pages/detail/ImageDetailPage';

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
            main: '#dc004e',
          },
          background: {
            default: mode === 'light' ? '#f5f5f5' : '#121212',
            paper: mode === 'light' ? '#fff' : '#1e1e1e',
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
