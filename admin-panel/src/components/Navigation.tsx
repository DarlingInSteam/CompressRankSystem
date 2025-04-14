import React, { useState, useContext } from 'react';
import { 
  AppBar, 
  Box,
  Button,
  Container,
  Divider,
  IconButton, 
  Menu,
  MenuItem,
  Toolbar, 
  Typography,
  Tooltip,
  Badge,
  Avatar,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Notifications as NotificationsIcon,
  BarChart as ChartIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { ColorModeContext } from '../App';

const Navigation: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const colorMode = useContext(ColorModeContext);
  
  // Состояния для управления меню
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);

  // Пункты основного меню
  const menuItems = [
    {
      text: 'Панель управления',
      icon: <DashboardIcon fontSize="small" sx={{ mr: 1 }} />,
      path: '/'
    },
    {
      text: 'Метрики',
      icon: <ChartIcon fontSize="small" sx={{ mr: 1 }} />,
      path: '/metrics'
    },
    {
      text: 'Аналитика',
      icon: <AnalyticsIcon fontSize="small" sx={{ mr: 1 }} />,
      path: '/analytics'
    }
  ];

  // Пример уведомлений для демонстрации
  const notifications = [
    { id: 1, text: 'Загружено новое изображение', time: '5 мин назад' },
    { id: 2, text: 'Задача сжатия завершена', time: '20 мин назад' },
    { id: 3, text: 'Достигнут лимит хранилища (90%)', time: '2 ч назад', important: true }
  ];

  // Обработчики меню
  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  
  const handleOpenNotificationsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleCloseNotificationsMenu = () => {
    setAnchorElNotifications(null);
  };

  // Проверка активного маршрута для подсветки меню
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <AppBar position="static">
      <Container maxWidth={false}>
        <Toolbar disableGutters>
          {/* Логотип и заголовок для десктоп-версии */}
          <DashboardIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              flexGrow: 0
            }}
          >
            Compress Rank Admin
          </Typography>

          {/* Мобильное меню */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="меню навигации"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {menuItems.map((item) => (
                <MenuItem 
                  key={item.text} 
                  component={Link} 
                  to={item.path}
                  onClick={handleCloseNavMenu}
                  selected={isActive(item.path)}
                >
                  {item.icon}
                  <Typography textAlign="center">{item.text}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Логотип и заголовок для мобильной версии */}
          <DashboardIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            CR Admin
          </Typography>

          {/* Десктоп-меню */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {menuItems.map((item) => (
              <Button
                key={item.text}
                component={Link}
                to={item.path}
                onClick={handleCloseNavMenu}
                sx={{ 
                  my: 2, 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center',
                  backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)'
                  }
                }}
                startIcon={item.icon}
              >
                {item.text}
              </Button>
            ))}
          </Box>

          {/* Правая часть меню */}
          <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
            {/* Уведомления */}
            <Tooltip title="Уведомления">
              <IconButton 
                onClick={handleOpenNotificationsMenu} 
                size="large"
                color="inherit"
                sx={{ mr: 1 }}
              >
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-notifications"
              anchorEl={anchorElNotifications}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElNotifications)}
              onClose={handleCloseNotificationsMenu}
            >
              <Box sx={{ p: 1, width: 320, maxHeight: 400, overflow: 'auto' }}>
                <Typography variant="h6" sx={{ p: 1 }}>Уведомления</Typography>
                <Divider />
                {notifications.map((notification) => (
                  <MenuItem 
                    key={notification.id} 
                    onClick={handleCloseNotificationsMenu}
                    sx={{
                      whiteSpace: 'normal',
                      display: 'block',
                      borderLeft: notification.important ? `4px solid ${theme.palette.error.main}` : 'none',
                      backgroundColor: notification.important ? 'rgba(255,0,0,0.05)' : 'transparent',
                    }}
                  >
                    <Typography variant="body1">{notification.text}</Typography>
                    <Typography variant="caption" color="text.secondary">{notification.time}</Typography>
                  </MenuItem>
                ))}
                {notifications.length === 0 && (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Нет новых уведомлений</Typography>
                  </Box>
                )}
                <Divider />
                <Box sx={{ p: 1, textAlign: 'center' }}>
                  <Button size="small" component={Link} to="/notifications">
                    Посмотреть все
                  </Button>
                </Box>
              </Box>
            </Menu>

            {/* Переключатель темы */}
            <Tooltip title={colorMode.mode === 'dark' ? 'Светлая тема' : 'Темная тема'}>
              <IconButton onClick={colorMode.toggleColorMode} color="inherit" sx={{ mr: 1 }}>
                {colorMode.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Меню пользователя */}
            <Tooltip title="Настройки">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt="Admin" src="/static/images/avatar/avatar.jpg" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem component={Link} to="/profile" onClick={handleCloseUserMenu}>
                <Typography textAlign="center">Профиль</Typography>
              </MenuItem>
              <MenuItem component={Link} to="/settings" onClick={handleCloseUserMenu}>
                <Typography textAlign="center">Настройки</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleCloseUserMenu}>
                <Typography textAlign="center">Выход</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation;