import React, { useState, useMemo, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box, ThemeProvider, createTheme, PaletteMode, GlobalStyles as MuiGlobalStyles } from '@mui/material';

// Компоненты
import Navigation from './components/Navigation';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Страницы
import HomePage from './pages/home/HomePage';
import UploadPage from './pages/upload/UploadPage';
import ImageDetailPage from './pages/detail/ImageDetailPage';
import LoginPage from './pages/login/LoginPage';
import ProfilePage from './pages/profile/ProfilePage';
import AdminPage from './pages/admin/AdminPage';
import MangaGalleryPage from './pages/manga/MangaGalleryPage';
import MangaDetailPage from './pages/manga/MangaDetailPage';
import MangaCreatePage from './pages/manga/MangaCreatePage';
import MangaEditPage from './pages/manga/MangaEditPage';
import MangaCoverSelectPage from './pages/manga/MangaCoverSelectPage';
import VolumeCreatePage from './pages/manga/VolumeCreatePage';
import ChapterCreatePage from './pages/manga/ChapterCreatePage';
import PageUploadPage from './pages/manga/PageUploadPage';

// Контекст авторизации
import { AuthProvider, UserRole } from './contexts/AuthContext';

// Глобальные стили для изолированной анимации
import './App.css';

// Создаем глобальные стили для анимации уведомлений с использованием MUI GlobalStyles
const GlobalStyles = () => (
  <MuiGlobalStyles
    styles={`
      @keyframes pulseNotification {
        0% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.4); }
        70% { box-shadow: 0 0 0 6px rgba(211, 47, 47, 0); }
        100% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); }
      }
      
      .notification-badge .MuiBadge-badge {
        animation: pulseNotification 1.5s infinite;
      }
      
      @keyframes pulseAnimation {
        0% { opacity: 0.6; transform: translateX(-100%); }
        50% { opacity: 0.8; transform: translateX(300%); }
        100% { opacity: 0.6; transform: translateX(1000%); }
      }
    `}
  />
);

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
        {/* Добавляем глобальные стили здесь */}
        <GlobalStyles />
        <AuthProvider>
          <Router>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navigation />
              <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
                <Routes>
                  {/* Публичные маршруты */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  
                  {/* Защищенные маршруты (требуют авторизацию) */}
                  <Route 
                    path="/upload" 
                    element={
                      <ProtectedRoute>
                        <UploadPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/images/:id/view" 
                    element={
                      <ProtectedRoute>
                        <ImageDetailPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Маршруты для манги */}
                  <Route 
                    path="/manga" 
                    element={
                      <ProtectedRoute>
                        <MangaGalleryPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/manga/create" 
                    element={
                      <ProtectedRoute>
                        <MangaCreatePage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/manga/:id" 
                    element={
                      <ProtectedRoute>
                        <MangaDetailPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/manga/:id/edit" 
                    element={
                      <ProtectedRoute>
                        <MangaEditPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/manga/:id/cover/select" 
                    element={
                      <ProtectedRoute>
                        <MangaCoverSelectPage />
                      </ProtectedRoute>
                    } 
                  />
                  {/* Новые маршруты для создания томов, глав и загрузки страниц */}
                  <Route 
                    path="/manga/:id/volumes/create" 
                    element={
                      <ProtectedRoute>
                        <VolumeCreatePage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/manga/:id/volumes/:volumeId/chapters/create" 
                    element={
                      <ProtectedRoute>
                        <ChapterCreatePage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/manga/:id/volumes/:volumeId/chapters/:chapterId/pages/upload" 
                    element={
                      <ProtectedRoute>
                        <PageUploadPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Маршруты, требующие специфичных ролей */}
                  <Route 
                    path="/admin/*" 
                    element={
                      <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                        <AdminPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Остальные маршруты (будут добавлены позже) */}
                  <Route path="/analytics" element={
                    <ProtectedRoute>
                      <div>Страница аналитики будет добавлена позже</div>
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <div>Страница настроек будет добавлена позже</div>
                    </ProtectedRoute>
                  } />
                  <Route path="/activities" element={
                    <ProtectedRoute>
                      <div>Страница активностей будет добавлена позже</div>
                    </ProtectedRoute>
                  } />
                  <Route path="/compress" element={
                    <ProtectedRoute>
                      <div>Страница сжатия будет добавлена позже</div>
                    </ProtectedRoute>
                  } />
                  <Route path="/compress/scheduler" element={
                    <ProtectedRoute>
                      <div>Страница планировщика сжатия будет добавлена позже</div>
                    </ProtectedRoute>
                  } />
                  <Route path="/cleanup" element={
                    <ProtectedRoute>
                      <div>Страница очистки хранилища будет добавлена позже</div>
                    </ProtectedRoute>
                  } />
                  <Route path="/storage" element={
                    <ProtectedRoute>
                      <div>Страница статистики хранилища будет добавлена позже</div>
                    </ProtectedRoute>
                  } />
                  <Route path="/backup" element={
                    <ProtectedRoute>
                      <div>Страница резервного копирования будет добавлена позже</div>
                    </ProtectedRoute>
                  } />
                  <Route path="/notifications" element={
                    <ProtectedRoute>
                      <div>Страница уведомлений будет добавлена позже</div>
                    </ProtectedRoute>
                  } />
                  <Route path="/help" element={
                    <div>Справочная информация будет добавлена позже</div>
                  } />
                  <Route path="/categories" element={
                    <ProtectedRoute>
                      <div>Страница категорий изображений будет добавлена позже</div>
                    </ProtectedRoute>
                  } />
                  
                  {/* Редирект на главную для неизвестных маршрутов */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Box>
            </Box>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
