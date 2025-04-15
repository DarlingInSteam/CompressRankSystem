import React, { useState, useContext, useEffect, useRef } from 'react';
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
  useTheme,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Notifications as NotificationsIcon,
  Upload as UploadIcon,
  Storage as StorageIcon,
  Analytics as AnalyticsIcon,
  CompressOutlined as CompressIcon,
  CleaningServices as CleanupIcon,
  Backup as BackupIcon,
  Image as ImageIcon,
  Person as PersonIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  Category as CategoryIcon,
  Tune as TuneIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  BarChart as BarChartIcon,
  PhotoLibrary as GalleryIcon,
  Insights as StatsIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { ColorModeContext } from '../App';

const Navigation: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const colorMode = useContext(ColorModeContext);
  
  // Состояния для управления меню
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const menuRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  
  // Отслеживание скролла для изменения эффекта навигации
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Пункты основного меню с подменю
  const menuItems = [
    {
      text: 'Обзор',
      icon: <DashboardIcon />,
      path: '/'
    },
    {
      text: 'Изображения',
      icon: <ImageIcon />,
      submenu: [
        { text: 'Загрузить', icon: <UploadIcon />, path: '/upload' },
        { text: 'Категории', icon: <CategoryIcon />, path: '/categories' }
      ]
    },
    {
      text: 'Сжатие',
      icon: <CompressIcon />,
      submenu: [
        { text: 'Сжать изображения', icon: <CompressIcon />, path: '/compress' },
        { text: 'Планировщик', icon: <TuneIcon />, path: '/compress/scheduler' }
      ]
    },
    {
      text: 'Аналитика',
      icon: <AnalyticsIcon />,
      submenu: [
        { text: 'Метрики', icon: <StatsIcon />, path: '/analytics' },
        { text: 'Отчеты', icon: <BarChartIcon />, path: '/reports' }
      ]
    },
    {
      text: 'Хранилище',
      icon: <StorageIcon />,
      submenu: [
        { text: 'Статистика хранилища', icon: <StorageIcon />, path: '/storage' },
        { text: 'Очистка', icon: <CleanupIcon />, path: '/cleanup' },
        { text: 'Резервное копирование', icon: <BackupIcon />, path: '/backup' }
      ]
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
  
  const toggleSubmenu = (submenuName: string | null) => {
    setExpandedSubmenu(expandedSubmenu === submenuName ? null : submenuName);
  };

  // Проверка активного маршрута для подсветки меню
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };
  
  // Проверка есть ли активный элемент в подменю
  const hasActiveSubmenu = (submenuItems: any[]) => {
    return submenuItems.some(item => isActive(item.path));
  };

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        background: scrolled
          ? theme.palette.mode === 'light' 
            ? 'rgba(255, 255, 255, 0.8)' 
            : 'rgba(33, 33, 33, 0.85)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        boxShadow: scrolled ? '0 4px 20px 0 rgba(0, 0, 0, 0.05)' : 'none',
        borderBottom: scrolled ? '1px solid' : 'none',
        borderColor: theme.palette.mode === 'light' 
          ? 'rgba(230, 230, 230, 0.7)' 
          : 'rgba(76, 76, 76, 0.5)',
        transition: 'all 0.3s ease',
        color: theme.palette.mode === 'light' && scrolled 
          ? 'rgba(0, 0, 0, 0.87)' 
          : 'white',
        zIndex: theme.zIndex.drawer + 1
      }}
      elevation={0}
    >
      <Container maxWidth={false}>
        <Toolbar 
          disableGutters 
          sx={{ 
            py: scrolled ? 0.5 : 1.2,
            transition: 'all 0.3s ease',
          }}
        >
          {/* Логотип и заголовок для десктоп-версии */}
          <Box 
            sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              alignItems: 'center', 
              mr: 2,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          >
            <CompressIcon 
              sx={{ 
                mr: 1.5, 
                fontSize: '2rem',
                background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                borderRadius: '8px',
                p: 0.7,
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
              }} 
            />
            <Typography
              variant="h5"
              noWrap
              component={Link}
              to="/"
              sx={{
                fontWeight: 700,
                letterSpacing: '0.5px',
                color: 'inherit',
                textDecoration: 'none',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #e3f2fd, #bbdefb)'
                  : 'linear-gradient(45deg, #1976d2, #42a5f5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: scrolled && theme.palette.mode === 'light' ? 'inherit' : 'transparent',
                textShadow: theme.palette.mode === 'dark' ? '0 0 20px rgba(187, 222, 251, 0.3)' : 'none'
              }}
            >
              Compress Rank
              <Typography 
                component="span" 
                sx={{ 
                  opacity: 0.8, 
                  ml: 0.5, 
                  fontSize: '0.6em', 
                  verticalAlign: 'super',
                  background: 'linear-gradient(45deg, #e91e63, #f48fb1)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  borderRadius: '3px',
                  px: 0.5,
                }}
              >
                Admin
              </Typography>
            </Typography>
          </Box>

          {/* Мобильное меню */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }}>
            <IconButton
              size="large"
              aria-label="меню навигации"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
              sx={{
                background: Boolean(anchorElNav) ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                transition: 'all 0.2s',
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.25)
                }
              }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              keepMounted
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              PaperProps={{
                elevation: 3,
                sx: {
                  mt: 1.5,
                  backdropFilter: 'blur(10px)',
                  backgroundColor: theme.palette.mode === 'light' 
                    ? 'rgba(255, 255, 255, 0.9)'
                    : 'rgba(33, 33, 33, 0.9)',
                  backgroundImage: 'none',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'light' 
                    ? 'rgba(240, 240, 240, 0.9)' 
                    : 'rgba(76, 76, 76, 0.3)',
                  overflow: 'visible',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: -6,
                    left: 20,
                    width: 12,
                    height: 12,
                    bgcolor: 'background.paper',
                    transform: 'rotate(45deg)',
                    zIndex: 0,
                    borderTop: '1px solid',
                    borderLeft: '1px solid',
                    borderColor: theme.palette.mode === 'light' 
                      ? 'rgba(240, 240, 240, 0.9)' 
                      : 'rgba(76, 76, 76, 0.3)',
                  }
                }
              }}
              transformOrigin={{ horizontal: 'left', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              <List 
                sx={{ 
                  py: 1, 
                  width: isSmall ? 260 : 320,
                  maxHeight: '70vh',
                  overflow: 'auto'
                }}
              >
                {menuItems.map((item) => (
                  item.submenu ? (
                    <React.Fragment key={item.text}>
                      <ListItemButton 
                        onClick={() => toggleSubmenu(item.text)}
                        sx={{
                          borderRadius: 1,
                          mx: 1,
                          bgcolor: hasActiveSubmenu(item.submenu) ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.15)
                          }
                        }}
                      >
                        <ListItemIcon 
                          sx={{ 
                            minWidth: 36,
                            color: hasActiveSubmenu(item.submenu) ? 'primary.main' : 'inherit'
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text} 
                          primaryTypographyProps={{
                            fontWeight: hasActiveSubmenu(item.submenu) ? 600 : 400,
                            color: hasActiveSubmenu(item.submenu) ? 'primary.main' : 'inherit'
                          }}
                        />
                        {expandedSubmenu === item.text ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                      </ListItemButton>
                      <Collapse in={expandedSubmenu === item.text} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {item.submenu.map(subitem => (
                            <ListItemButton
                              key={subitem.text}
                              component={Link}
                              to={subitem.path}
                              onClick={handleCloseNavMenu}
                              sx={{
                                pl: 4,
                                py: 1,
                                borderRadius: 1,
                                mx: 1,
                                bgcolor: isActive(subitem.path) ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                                }
                              }}
                            >
                              <ListItemIcon 
                                sx={{ 
                                  minWidth: 36,
                                  color: isActive(subitem.path) ? 'primary.main' : 'inherit'
                                }}
                              >
                                {subitem.icon}
                              </ListItemIcon>
                              <ListItemText 
                                primary={subitem.text} 
                                primaryTypographyProps={{
                                  fontSize: '0.875rem',
                                  fontWeight: isActive(subitem.path) ? 600 : 400,
                                  color: isActive(subitem.path) ? 'primary.main' : 'inherit'
                                }}
                              />
                            </ListItemButton>
                          ))}
                        </List>
                      </Collapse>
                    </React.Fragment>
                  ) : (
                    <ListItemButton
                      key={item.text}
                      component={Link}
                      to={item.path}
                      onClick={handleCloseNavMenu}
                      sx={{
                        borderRadius: 1,
                        mx: 1,
                        bgcolor: isActive(item.path) ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1)
                        }
                      }}
                    >
                      <ListItemIcon 
                        sx={{ 
                          minWidth: 36,
                          color: isActive(item.path) ? 'primary.main' : 'inherit'
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text} 
                        primaryTypographyProps={{
                          fontWeight: isActive(item.path) ? 600 : 400,
                          color: isActive(item.path) ? 'primary.main' : 'inherit'
                        }}
                      />
                    </ListItemButton>
                  )
                ))}
              </List>
            </Menu>
          </Box>

          {/* Логотип и заголовок для мобильной версии */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CompressIcon 
              sx={{ 
                mr: 1, 
                fontSize: '1.8rem',
                background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                borderRadius: '8px',
                p: 0.5,
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)'
              }}
            />
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #e3f2fd, #bbdefb)'
                  : 'linear-gradient(45deg, #1976d2, #42a5f5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: scrolled && theme.palette.mode === 'light' ? 'inherit' : 'transparent',
              }}
            >
              CR Admin
            </Typography>
          </Box>

          {/* Десктоп-меню */}
          <Box 
            sx={{ 
              flexGrow: 1, 
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'center',
              ml: 4
            }}
          >
            {menuItems.map((item) => (
              item.submenu ? (
                <Box
                  key={item.text}
                  sx={{ position: 'relative' }}
                  onMouseEnter={() => toggleSubmenu(item.text)}
                  onMouseLeave={() => toggleSubmenu(null)}
                  ref={(el: HTMLElement | null) => {
                    menuRefs.current[item.text] = el;
                  }}
                >
                  <Button
                    onClick={() => {
                      handleCloseNavMenu();
                      toggleSubmenu(item.text);
                    }}
                    sx={{ 
                      mx: 0.5, 
                      px: 2,
                      py: 1.5,
                      color: hasActiveSubmenu(item.submenu)
                        ? 'primary.main'
                        : scrolled && theme.palette.mode === 'light' ? 'text.primary' : 'white',
                      display: 'flex', 
                      alignItems: 'center',
                      position: 'relative',
                      fontWeight: hasActiveSubmenu(item.submenu) ? 600 : 500,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '&::after': {
                          width: '80%'
                        }
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: '8px',
                        left: '10%',
                        width: hasActiveSubmenu(item.submenu) ? '80%' : '0%',
                        height: '2px',
                        background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
                        borderRadius: '2px',
                        transition: 'width 0.3s ease'
                      }
                    }}
                    endIcon={expandedSubmenu === item.text ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                    startIcon={React.cloneElement(item.icon, { 
                      sx: { 
                        fontSize: '1.2rem', 
                        color: hasActiveSubmenu(item.submenu) ? 'primary.main' : 'inherit' 
                      } 
                    })}
                  >
                    {item.text}
                  </Button>
                  <Menu
                    id={`menu-${item.text}`}
                    anchorEl={menuRefs.current[item.text]}
                    open={expandedSubmenu === item.text}
                    autoFocus={false}
                    disableAutoFocus
                    disableEnforceFocus
                    disablePortal
                    onClose={() => toggleSubmenu(null)}
                    MenuListProps={{
                      onMouseLeave: () => toggleSubmenu(null)
                    }}
                    slotProps={{
                      paper: {
                        sx: {
                          overflow: 'visible',
                          mt: 0.5,
                          backdropFilter: 'blur(10px)',
                          backgroundColor: theme.palette.mode === 'light' 
                            ? 'rgba(255, 255, 255, 0.95)'
                            : 'rgba(33, 33, 33, 0.95)',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                          borderRadius: 2,
                          '&:before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: -6,
                            left: 24,
                            width: 12,
                            height: 12,
                            bgcolor: 'background.paper',
                            transform: 'rotate(45deg)',
                            zIndex: 0,
                            borderTop: '1px solid',
                            borderLeft: '1px solid',
                            borderColor: theme.palette.mode === 'light' 
                              ? 'rgba(240, 240, 240, 0.9)' 
                              : 'rgba(76, 76, 76, 0.3)',
                          }
                        }
                      }
                    }}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                    keepMounted={false}
                    disableScrollLock={true}
                  >
                    <List sx={{ py: 1, minWidth: 220 }}>
                      {item.submenu.map(subitem => (
                        <ListItemButton
                          key={subitem.text}
                          component={Link}
                          to={subitem.path}
                          onClick={() => {
                            handleCloseNavMenu();
                            toggleSubmenu(null);
                          }}
                          sx={{
                            borderRadius: 1,
                            mx: 1,
                            py: 1,
                            transition: 'all 0.2s ease',
                            bgcolor: isActive(subitem.path) ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                            '&:hover': {
                              transform: 'translateX(5px)',
                              bgcolor: alpha(theme.palette.primary.main, 0.15)
                            }
                          }}
                        >
                          <ListItemIcon 
                            sx={{ 
                              minWidth: 36,
                              color: isActive(subitem.path) ? 'primary.main' : 'inherit'
                            }}
                          >
                            {subitem.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={subitem.text} 
                            primaryTypographyProps={{
                              fontWeight: isActive(subitem.path) ? 600 : 400
                            }}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Menu>
                </Box>
              ) : (
                <Button
                  key={item.text}
                  component={Link}
                  to={item.path}
                  onClick={handleCloseNavMenu}
                  sx={{ 
                    mx: 0.5, 
                    px: 2,
                    py: 1.5,
                    color: isActive(item.path)
                      ? 'primary.main'
                      : scrolled && theme.palette.mode === 'light' ? 'text.primary' : 'white',
                    display: 'flex', 
                    alignItems: 'center',
                    position: 'relative',
                    fontWeight: isActive(item.path) ? 600 : 500,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '&::after': {
                        width: '80%'
                      }
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: '8px',
                      left: '10%',
                      width: isActive(item.path) ? '80%' : '0%',
                      height: '2px',
                      background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease'
                    }
                  }}
                  startIcon={React.cloneElement(item.icon, { 
                    sx: { 
                      fontSize: '1.2rem', 
                      color: isActive(item.path) ? 'primary.main' : 'inherit' 
                    } 
                  })}
                >
                  {item.text}
                </Button>
              )
            ))}
          </Box>

          {/* Правая часть меню */}
          <Box 
            sx={{ 
              flexGrow: 0, 
              display: 'flex', 
              alignItems: 'center',
              gap: { xs: 0.5, sm: 1 }
            }}
          >
            {/* Кнопка загрузки */}
            {!isMobile && (
              <Button
                variant="contained"
                component={Link}
                to="/upload"
                startIcon={<UploadIcon />}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 'medium',
                  px: 2,
                  py: 1,
                  mr: 1.5,
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  boxShadow: theme.palette.mode === 'light' 
                    ? '0 4px 12px rgba(25, 118, 210, 0.3)'
                    : '0 4px 12px rgba(25, 118, 210, 0.5)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(25, 118, 210, 0.45)'
                  }
                }}
              >
                Загрузить
              </Button>
            )}
            
            {/* Уведомления */}
            <Tooltip title="Уведомления">
              <IconButton 
                onClick={handleOpenNotificationsMenu} 
                size="large"
                sx={{ 
                  color: scrolled && theme.palette.mode === 'light' ? 'text.primary' : 'inherit',
                  background: Boolean(anchorElNotifications) ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    background: alpha(theme.palette.primary.main, 0.25)
                  }
                }}
              >
                <Badge 
                  badgeContent={notifications.length} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      animation: notifications.length > 0 ? 'pulse 1.5s infinite' : 'none',
                      '@keyframes pulse': {
                        '0%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.4)' },
                        '70%': { boxShadow: '0 0 0 6px rgba(211, 47, 47, 0)' },
                        '100%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0)' }
                      }
                    }
                  }}
                >
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
              PaperProps={{
                elevation: 3,
                sx: {
                  overflow: 'visible',
                  backdropFilter: 'blur(10px)',
                  backgroundColor: theme.palette.mode === 'light' 
                    ? 'rgba(255, 255, 255, 0.9)'
                    : 'rgba(33, 33, 33, 0.9)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'light' 
                    ? 'rgba(240, 240, 240, 0.9)' 
                    : 'rgba(76, 76, 76, 0.3)',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: -6,
                    right: 14,
                    width: 12,
                    height: 12,
                    bgcolor: 'background.paper',
                    transform: 'rotate(45deg)',
                    zIndex: 0,
                    borderTop: '1px solid',
                    borderLeft: '1px solid',
                    borderColor: theme.palette.mode === 'light' 
                      ? 'rgba(240, 240, 240, 0.9)' 
                      : 'rgba(76, 76, 76, 0.3)',
                  }
                }
              }}
            >
              <Box sx={{ p: 1, width: 320, maxHeight: 400, overflow: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, py: 0.5 }}>
                  <Typography variant="subtitle1" fontWeight="bold">Уведомления</Typography>
                  <Chip 
                    label={`${notifications.length} новых`} 
                    size="small" 
                    color="primary"
                    sx={{ 
                      borderRadius: '10px',
                      fontWeight: 500,
                      background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                      boxShadow: '0 2px 5px rgba(25, 118, 210, 0.2)'
                    }}
                  />
                </Box>
                <Divider sx={{ my: 1 }} />
                {notifications.map((notification) => (
                  <MenuItem 
                    key={notification.id} 
                    onClick={handleCloseNotificationsMenu}
                    sx={{
                      whiteSpace: 'normal',
                      display: 'block',
                      borderLeft: notification.important ? `4px solid ${theme.palette.error.main}` : 'none',
                      backgroundColor: notification.important ? alpha(theme.palette.error.main, 0.05) : 'transparent',
                      borderRadius: 1,
                      my: 0.5,
                      mx: 0.5,
                      px: notification.important ? 1.5 : 2,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        transform: 'translateX(5px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >
                    <Typography variant="body2" fontWeight="medium">{notification.text}</Typography>
                    <Typography variant="caption" color="text.secondary">{notification.time}</Typography>
                  </MenuItem>
                ))}
                {notifications.length === 0 && (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Нет новых уведомлений</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ p: 1, textAlign: 'center' }}>
                  <Button 
                    size="small" 
                    component={Link} 
                    to="/notifications"
                    variant="outlined"
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 'medium',
                      borderWidth: '1.5px'
                    }}
                  >
                    Посмотреть все
                  </Button>
                </Box>
              </Box>
            </Menu>

            {/* Переключатель темы */}
            <Tooltip title={colorMode.mode === 'dark' ? 'Светлая тема' : 'Темная тема'}>
              <IconButton 
                onClick={colorMode.toggleColorMode} 
                sx={{ 
                  color: scrolled && theme.palette.mode === 'light' ? 'text.primary' : 'inherit',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'rotate(180deg)'
                  }
                }}
              >
                {colorMode.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Меню пользователя */}
            <Tooltip title="Настройки профиля">
              <IconButton 
                onClick={handleOpenUserMenu} 
                sx={{ 
                  p: 0.3,
                  border: '2px solid',
                  borderColor: 'transparent',
                  ml: 0.5,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <Avatar 
                  alt="Admin" 
                  src="/static/images/avatar/avatar.jpg" 
                  sx={{ 
                    width: 36, 
                    height: 36,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }} 
                />
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
              PaperProps={{
                elevation: 3,
                sx: {
                  overflow: 'visible',
                  backdropFilter: 'blur(10px)',
                  backgroundColor: theme.palette.mode === 'light' 
                    ? 'rgba(255, 255, 255, 0.9)'
                    : 'rgba(33, 33, 33, 0.9)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  borderRadius: 2,
                  minWidth: 220,
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'light' 
                    ? 'rgba(240, 240, 240, 0.9)' 
                    : 'rgba(76, 76, 76, 0.3)',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: -6,
                    right: 14,
                    width: 12,
                    height: 12,
                    bgcolor: 'background.paper',
                    transform: 'rotate(45deg)',
                    zIndex: 0,
                    borderTop: '1px solid',
                    borderLeft: '1px solid',
                    borderColor: theme.palette.mode === 'light' 
                      ? 'rgba(240, 240, 240, 0.9)' 
                      : 'rgba(76, 76, 76, 0.3)',
                  }
                }
              }}
            >
              <Box sx={{ px: 2, py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    alt="Admin" 
                    src="/static/images/avatar/avatar.jpg"
                    sx={{ 
                      width: 50, 
                      height: 50,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  />
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Админ</Typography>
                    <Typography variant="body2" color="text.secondary">admin@example.com</Typography>
                  </Box>
                </Box>
              </Box>
              <Divider />
              <List sx={{ py: 1 }}>
                <ListItemButton 
                  component={Link} 
                  to="/profile" 
                  onClick={handleCloseUserMenu}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    mb: 0.5,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      transform: 'translateX(5px)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Профиль" />
                </ListItemButton>
                
                <ListItemButton 
                  component={Link} 
                  to="/settings" 
                  onClick={handleCloseUserMenu}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    mb: 0.5,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      transform: 'translateX(5px)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Настройки" />
                </ListItemButton>
                
                <ListItemButton 
                  component={Link} 
                  to="/help" 
                  onClick={handleCloseUserMenu}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    mb: 0.5,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      transform: 'translateX(5px)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <HelpIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Справка" />
                </ListItemButton>
              </List>
              <Divider />
              <List sx={{ py: 1 }}>
                <ListItemButton 
                  onClick={handleCloseUserMenu}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    color: theme.palette.error.main,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      transform: 'translateX(5px)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Выход" />
                </ListItemButton>
              </List>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation;