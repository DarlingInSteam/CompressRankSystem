import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Tab,
  Tabs,
  Paper,
  Divider,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  IconButton,
  useMediaQuery,
  useTheme,
  alpha,
  Chip,
  Button,
  Menu,
  MenuItem,
  Fade,
  Collapse
} from '@mui/material';
import { 
  PeopleAlt as UsersIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Storage as DataIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  ExitToApp as ExitToAppIcon,
  ArrowForward as ArrowForwardIcon,
  NightsStay as DarkModeIcon,
  WbSunny as LightModeIcon
} from '@mui/icons-material';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import UserManagement from '../../components/admin/UserManagement';
import SystemSettings from '../../components/admin/SystemSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

const AdminPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated, isInitializing, logout } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedStats, setExpandedStats] = useState<string | null>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const toggleStats = (key: string) => {
    if (expandedStats === key) {
      setExpandedStats(null);
    } else {
      setExpandedStats(key);
    }
  };

  // If not authenticated or not an admin, redirect to login
  if (!isInitializing && (!isAuthenticated || (user && user.role !== UserRole.ADMIN))) {
    return <Navigate to="/" />;
  }

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3, fontWeight: 500 }}>
          Загрузка административной панели...
        </Typography>
      </Box>
    );
  }

  const renderAdminHeader = () => (
    <Box
      sx={{
        mb: 4,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', md: 'center' },
        gap: 2,
      }}
    >
      <Box>
        <Typography 
          variant="h4" 
          gutterBottom 
          fontWeight={700}
          sx={{
            backgroundImage: 'linear-gradient(90deg, #1976d2, #42a5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0px 2px 5px rgba(66, 165, 245, 0.2)',
          }}
        >
          Панель администрирования
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Управление пользователями и настройками системы компрессии изображений
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip
          avatar={
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              {user?.username.substring(0, 1).toUpperCase() || 'A'}
            </Avatar>
          }
          label={user?.username || 'Администратор'}
          variant="outlined"
          sx={{ 
            borderRadius: '12px',
            px: 1,
            fontSize: '0.95rem',
            fontWeight: 500,
            borderWidth: '1.5px',
            borderColor: alpha(theme.palette.primary.main, 0.4)
          }}
        />
        
        <Button
          variant="outlined"
          color="inherit"
          onClick={handleMenuClick}
          endIcon={<KeyboardArrowDownIcon />}
          sx={{ 
            borderRadius: '12px',
            textTransform: 'none',
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px'
            }
          }}
        >
          Действия
        </Button>
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              borderRadius: '12px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              mt: 1.5,
              width: 200,
              backdropFilter: 'blur(10px)',
              bgcolor: theme => theme.palette.mode === 'light'
                ? 'rgba(255, 255, 255, 0.9)'
                : 'rgba(30, 30, 30, 0.9)',
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              }
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem 
            onClick={() => {
              handleMenuClose();
              // Navigation action would go here
            }}
            sx={{
              borderRadius: '8px',
              mx: 1,
              mb: 0.5,
              '&:hover': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.08)
              }
            }}
          >
            <ArrowBackIcon fontSize="small" sx={{ mr: 2 }} />
            На сайт
          </MenuItem>
          <MenuItem 
            onClick={() => {
              handleMenuClose();
              // Theme toggle action would go here
            }}
            sx={{
              borderRadius: '8px',
              mx: 1,
              mb: 0.5,
              '&:hover': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.08)
              }
            }}
          >
            {theme.palette.mode === 'light' 
              ? <DarkModeIcon fontSize="small" sx={{ mr: 2 }} />
              : <LightModeIcon fontSize="small" sx={{ mr: 2 }} />
            }
            {theme.palette.mode === 'light' ? 'Тёмная тема' : 'Светлая тема'}
          </MenuItem>
          <Divider sx={{ my: 1 }} />
          <MenuItem 
            onClick={() => {
              handleMenuClose();
              logout();
            }}
            sx={{
              borderRadius: '8px',
              mx: 1,
              color: 'error.main',
              '&:hover': {
                bgcolor: theme => alpha(theme.palette.error.main, 0.08)
              }
            }}
          >
            <ExitToAppIcon fontSize="small" sx={{ mr: 2 }} />
            Выйти
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );

  const renderAdminStats = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid size={{xs: 12, sm: 6, md: 3}}> 
        <Card
          sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(61, 71, 82, 0.1)',
            transition: 'all 0.3s ease',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: theme => theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.8)'
              : 'rgba(255, 255, 255, 0.08)',
            bgcolor: theme => theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.8)'
              : 'rgba(30, 30, 30, 0.7)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 6px 24px rgba(61, 71, 82, 0.15)',
            }
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.04,
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h80v80H0V0zm20 20h40v40H20V20zm20 35a15 15 0 1 1 0-30 15 15 0 0 1 0 30z\' fill=\'%23000000\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
              backgroundRepeat: 'repeat',
              zIndex: 0
            }}
          />
          <CardContent sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>Пользователи</Typography>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <UsersIcon />
              </Avatar>
            </Box>
            <Typography variant="h4" fontWeight={700}>54</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <ArrowForwardIcon fontSize="small" color="success" />
              <Typography variant="body2" color="success.main" fontWeight={500} sx={{ ml: 0.5 }}>
                +12% с прошлого месяца
              </Typography>
            </Box>
            <Button 
              size="small" 
              endIcon={<KeyboardArrowDownIcon 
                sx={{ 
                  transform: expandedStats === 'users' ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.3s'
                }} 
              />}
              onClick={() => toggleStats('users')}
              sx={{ 
                mt: 2, 
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.85rem'
              }}
            >
              Подробнее
            </Button>
            <Collapse in={expandedStats === 'users'}>
              <Box sx={{ mt: 1 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2">
                  • Активные: 38
                </Typography>
                <Typography variant="body2">
                  • Администраторы: 3
                </Typography>
                <Typography variant="body2">
                  • Новые за месяц: 7
                </Typography>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{xs: 12, sm: 6, md: 3}}>
        <Card
          sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(61, 71, 82, 0.1)',
            transition: 'all 0.3s ease',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: theme => theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.8)'
              : 'rgba(255, 255, 255, 0.08)',
            bgcolor: theme => theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.8)'
              : 'rgba(30, 30, 30, 0.7)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 6px 24px rgba(61, 71, 82, 0.15)',
            }
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.04,
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\'%3E%3Cpath d=\'M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z\' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              backgroundRepeat: 'repeat',
              zIndex: 0
            }}
          />
          <CardContent sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>Изображения</Typography>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <DataIcon />
              </Avatar>
            </Box>
            <Typography variant="h4" fontWeight={700}>2,148</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <ArrowForwardIcon fontSize="small" color="success" />
              <Typography variant="body2" color="success.main" fontWeight={500} sx={{ ml: 0.5 }}>
                +24% с прошлой недели
              </Typography>
            </Box>
            <Button 
              size="small" 
              endIcon={<KeyboardArrowDownIcon 
                sx={{ 
                  transform: expandedStats === 'images' ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.3s'
                }} 
              />}
              onClick={() => toggleStats('images')}
              sx={{ 
                mt: 2, 
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.85rem'
              }}
            >
              Подробнее
            </Button>
            <Collapse in={expandedStats === 'images'}>
              <Box sx={{ mt: 1 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2">
                  • Сжатых: 1,892
                </Typography>
                <Typography variant="body2">
                  • Оригиналов: 256
                </Typography>
                <Typography variant="body2">
                  • Общий объем: 542 MB
                </Typography>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{xs: 12, sm: 6, md: 3}}>
        <Card
          sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(61, 71, 82, 0.1)',
            transition: 'all 0.3s ease',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: theme => theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.8)'
              : 'rgba(255, 255, 255, 0.08)',
            bgcolor: theme => theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.8)'
              : 'rgba(30, 30, 30, 0.7)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 6px 24px rgba(61, 71, 82, 0.15)',
            }
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.04,
              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\' viewBox=\'0 0 80 80\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M0 0h40v40H0V0zm40 40h40v40H40V40zm0-40h2l-2 2V0zm0 4l4-4h2l-6 6V4zm0 4l8-8h2L40 10V8zm0 4L52 0h2L40 14v-2zm0 4L56 0h2L40 18v-2zm0 4L60 0h2L40 22v-2zm0 4L64 0h2L40 26v-2zm0 4L68 0h2L40 30v-2zm0 4L72 0h2L40 34v-2zm0 4L76 0h2L40 38v-2zm0 4L80 0v2L42 40h-2zm4 0L80 4v2L46 40h-2zm4 0L80 8v2L50 40h-2zm4 0l28-28v2L54 40h-2zm4 0l24-24v2L58 40h-2zm4 0l20-20v2L62 40h-2zm4 0l16-16v2L66 40h-2zm4 0l12-12v2L70 40h-2zm4 0l8-8v2l-6 6h-2zm4 0l4-4v2l-2 2h-2z\'/%3E%3C/g%3E%3C/svg%3E")',
              backgroundRepeat: 'repeat',
              zIndex: 0
            }}
          />
          <CardContent sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>Система</Typography>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <DashboardIcon />
              </Avatar>
            </Box>
            <Typography variant="h4" fontWeight={700}>82%</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <ArrowForwardIcon fontSize="small" color="error" sx={{ transform: 'rotate(90deg)' }} />
              <Typography variant="body2" color="error.main" fontWeight={500} sx={{ ml: 0.5 }}>
                +5% нагрузка
              </Typography>
            </Box>
            <Button 
              size="small" 
              endIcon={<KeyboardArrowDownIcon 
                sx={{ 
                  transform: expandedStats === 'system' ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.3s'
                }} 
              />}
              onClick={() => toggleStats('system')}
              sx={{ 
                mt: 2, 
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.85rem'
              }}
            >
              Подробнее
            </Button>
            <Collapse in={expandedStats === 'system'}>
              <Box sx={{ mt: 1 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2">
                  • CPU: 43%
                </Typography>
                <Typography variant="body2">
                  • Память: 78%
                </Typography>
                <Typography variant="body2">
                  • Диск: 62%
                </Typography>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{xs: 12, sm: 6, md: 3}}>
        <Card
          sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(61, 71, 82, 0.1)',
            transition: 'all 0.3s ease',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: theme => theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.8)'
              : 'rgba(255, 255, 255, 0.08)',
            bgcolor: theme => theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.8)'
              : 'rgba(30, 30, 30, 0.7)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 6px 24px rgba(61, 71, 82, 0.15)',
            }
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.04,
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M0 0h10v10H0V0zm10 10h10v10H10V10zm10-10h10v10H20V0zm10 10h10v10H30V10zm10-10h10v10H40V0zm10 10h10v10H50V10zm10-10h10v10H60V0zm10 10h10v10H70V10zm10-10h10v10H80V0zm-10 20h10v10H70V20zm10 10h10v10H80V30zm-10 10h10v10H70V40zm10 10h10v10H80V50zm-10 10h10v10H70V60zm10 10h10v10H80V70zm-10 10h10v10H70V80zm-10 0h10v10H60V80zm-10 0h10v10H50V80zm-10 0h10v10H40V80zm-10 0h10v10H30V80zm-10 0h10v10H20V80zm-10 0h10v10H10V80zM0 80h10v10H0V80zm10-10h10v10H10V70zM0 70h10v10H0V70zm10-10h10v10H10V60zM0 60h10v10H0V60zm10-10h10v10H10V50zM0 50h10v10H0V50zm10-10h10v10H10V40zM0 40h10v10H0V40zm10-10h10v10H10V30zM0 30h10v10H0V30zm10-10h10v10H10V20zM0 20h10v10H0V20zm30-10h10v10H30V10zm-10 0h10v10H20V10zm-10 0h10v10H10V10zM0 10h10v10H0V10zm40 0h10v10H40V10zm30 0h10v10H70V10zm-10 0h10v10H60V10zm-10 0h10v10H50V10z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              backgroundRepeat: 'repeat',
              zIndex: 0
            }}
          />
          <CardContent sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>Настройки</Typography>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <SettingsIcon />
              </Avatar>
            </Box>
            <Typography variant="h4" fontWeight={700}>21</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <ArrowForwardIcon fontSize="small" color="info" />
              <Typography variant="body2" color="info.main" fontWeight={500} sx={{ ml: 0.5 }}>
                Последнее обновление: сегодня
              </Typography>
            </Box>
            <Button 
              size="small" 
              endIcon={<KeyboardArrowDownIcon 
                sx={{ 
                  transform: expandedStats === 'settings' ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.3s'
                }} 
              />}
              onClick={() => toggleStats('settings')}
              sx={{ 
                mt: 2, 
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.85rem'
              }}
            >
              Подробнее
            </Button>
            <Collapse in={expandedStats === 'settings'}>
              <Box sx={{ mt: 1 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2">
                  • Лимиты файлов: 7
                </Typography>
                <Typography variant="body2">
                  • Квоты пользователей: 5
                </Typography>
                <Typography variant="body2">
                  • Категории: 9
                </Typography>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTabsContent = () => (
    <Paper
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        bgcolor: theme => theme.palette.mode === 'light'
          ? 'rgba(255, 255, 255, 0.8)'
          : 'rgba(30, 30, 30, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: theme => theme.palette.mode === 'light'
          ? 'rgba(255, 255, 255, 0.5)'
          : 'rgba(255, 255, 255, 0.05)',
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)'
      }}
    >
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          position: 'relative',
          bgcolor: theme => theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.6)'
            : 'rgba(30, 30, 30, 0.5)',
          backdropFilter: 'blur(10px)',
          top: 0,
          zIndex: 10
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="admin tabs"
          indicatorColor="primary"
          textColor="primary"
          variant={isMobile ? "fullWidth" : "standard"}
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '1rem',
              textTransform: 'none',
              fontWeight: 500
            }
          }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UsersIcon />
                <Box component="span">Пользователи</Box>
              </Box>
            }
            {...a11yProps(0)} 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon />
                <Box component="span">Настройки системы</Box>
              </Box>
            }
            {...a11yProps(1)} 
          />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <UserManagement />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <SystemSettings />
      </TabPanel>
    </Paper>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: 4 }}>
      {/* Admin Header */}
      {renderAdminHeader()}
      
      {/* Admin Stats */}
      {renderAdminStats()}
      
      {/* Main Tab Content */}
      {renderTabsContent()}
    </Container>
  );
};

export default AdminPage;