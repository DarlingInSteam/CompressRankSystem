import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
  Skeleton,
  Alert,
  Paper,
  Tab,
  Tabs,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  useMediaQuery,
  useTheme,
  alpha,
  Stack,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  VpnKey as KeyIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  Notifications as NotificationsIcon,
  Timeline as TimelineIcon,
  History as HistoryIcon,
  CloudDownload as CloudDownloadIcon,
  Security as SecurityIcon,
  Image as ImageIcon,
  MoreVert as MoreVertIcon,
  Compress as CompressIcon,
  BarChart as BarChartIcon,
  Visibility as VisibilityIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import ChangePasswordForm from '../../components/profile/ChangePasswordForm';
import { authService } from '../../services/auth.service';
import ImageService from '../../services/image.service';
import { UserQuota } from '../../types/api.types';

// Интерфейс для активности пользователя (заглушка)
interface UserActivity {
  id: number;
  type: 'upload' | 'compression' | 'download' | 'view' | 'login';
  description: string;
  timestamp: string;
  details?: {
    imageId?: number;
    imageName?: string;
    compressionRatio?: number;
  };
}

// Интерфейс для суммарной статистики пользователя (заглушка)
interface UserStats {
  totalUploads: number;
  totalCompressions: number;
  totalDownloads: number;
  totalViews: number;
  diskSpaceUsed: number;
  compressionSaved: number;
  lastActivityDate: string;
}

// Интерфейс для свойств вкладки
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Компонент панели вкладки
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
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
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`,
  };
}

// Преобразование байтов в читаемый формат
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Байт';
  const k = 1024;
  const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Форматирование даты для лучшего отображения
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Карточка с метрикой для дашборда пользователя
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        borderRadius: '16px',
        transition: 'transform 0.3s, box-shadow 0.3s',
        backdropFilter: 'blur(10px)',
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.1),
        boxShadow: `0 10px 15px -3px ${alpha(color, 0.1)}, 0 4px 6px -2px ${alpha(color, 0.06)}`,
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 20px 25px -5px ${alpha(color, 0.2)}, 0 10px 10px -5px ${alpha(color, 0.1)}`
        }
      }}
    >
      <CardContent sx={{ p: 3, position: 'relative' }}>
        <Box sx={{ 
          position: 'absolute',
          top: 12,
          right: 12,
          width: 40,
          height: 40,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: alpha(color, 0.1),
          color: color
        }}>
          {icon}
        </Box>
        
        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2, fontWeight: 500 }}>
          {title}
        </Typography>
        
        <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
        
        <Box 
          sx={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '4px',
            backgroundColor: alpha(color, 0.2)
          }}
        >
          <Box 
            sx={{ 
              width: '30%',
              height: '100%',
              backgroundColor: color
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

// Компонент одного элемента активности
const ActivityItem: React.FC<{activity: UserActivity}> = ({activity}) => {
  const theme = useTheme();
  
  // Определяем иконку и цвет в зависимости от типа активности
  const getIconAndColor = () => {
    switch(activity.type) {
      case 'upload':
        return { icon: <ImageIcon />, color: theme.palette.primary.main };
      case 'compression':
        return { icon: <CompressIcon />, color: theme.palette.success.main };
      case 'download':
        return { icon: <CloudDownloadIcon />, color: theme.palette.info.main };
      case 'view':
        return { icon: <VisibilityIcon />, color: theme.palette.warning.main };
      case 'login':
        return { icon: <SecurityIcon />, color: theme.palette.secondary.main };
      default:
        return { icon: <HistoryIcon />, color: theme.palette.text.secondary };
    }
  };
  
  const { icon, color } = getIconAndColor();
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        mb: 2, 
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        border: '1px solid',
        borderColor: theme.palette.divider,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateX(5px)',
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`
        }
      }}
    >
      <Avatar 
        sx={{ 
          bgcolor: alpha(color, 0.1), 
          color: color,
          mr: 2,
          width: 40,
          height: 40
        }}
      >
        {icon}
      </Avatar>
      
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body2" component="div" fontWeight={500}>
          {activity.description}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {formatDate(activity.timestamp)}
        </Typography>
      </Box>
      
      {activity.type === 'compression' && activity.details?.compressionRatio && (
        <Chip 
          label={`-${activity.details.compressionRatio}%`}
          size="small"
          color="success"
          sx={{ borderRadius: '8px', fontWeight: 500 }}
        />
      )}
      
      {(activity.type === 'upload' || activity.type === 'download' || activity.type === 'view') && activity.details?.imageName && (
        <Tooltip title="Перейти к изображению">
          <IconButton size="small">
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Paper>
  );
};

// Главный компонент страницы профиля
const ProfilePage: React.FC = () => {
  const { user, logout, isAuthenticated, isInitializing } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordResetRequired, setPasswordResetRequired] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userQuota, setUserQuota] = useState<UserQuota | null>(null);
  
  // Моковые данные для пользовательской статистики (в реальности должны загружаться с сервера)
  const [userStats, setUserStats] = useState<UserStats>({
    totalUploads: 127,
    totalCompressions: 98,
    totalDownloads: 312,
    totalViews: 945,
    diskSpaceUsed: 0, // Will be updated from real data
    compressionSaved: 1024 * 1024 * 350, // 350 МБ
    lastActivityDate: new Date().toISOString()
  });
  
  // Моковые данные для последних активностей пользователя
  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([
    {
      id: 1,
      type: 'upload',
      description: 'Загружено изображение product-hero-new.jpg',
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      details: {
        imageId: 125,
        imageName: 'product-hero-new.jpg'
      }
    },
    {
      id: 2,
      type: 'compression',
      description: 'Сжато изображение banner-homepage.png',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      details: {
        imageId: 124,
        imageName: 'banner-homepage.png',
        compressionRatio: 65
      }
    },
    {
      id: 3,
      type: 'view',
      description: 'Просмотрено изображение team-photo.jpg',
      timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
      details: {
        imageId: 120,
        imageName: 'team-photo.jpg'
      }
    },
    {
      id: 4,
      type: 'download',
      description: 'Скачано изображение logo-transparent.png',
      timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
      details: {
        imageId: 115,
        imageName: 'logo-transparent.png'
      }
    },
    {
      id: 5,
      type: 'login',
      description: 'Выполнен вход в систему',
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    }
  ]);

  useEffect(() => {
    // Проверка необходимости смены пароля (для первого входа)
    const checkPasswordReset = async () => {
      if (user) {
        try {
          setLoading(true);
          const resetRequired = await authService.checkPasswordReset();
          setPasswordResetRequired(resetRequired);
        } catch (err) {
          console.error('Error checking password reset status:', err);
          setError('Не удалось проверить необходимость смены пароля');
        } finally {
          setLoading(false);
        }
      }
    };

    // Fetch user quota information
    const fetchUserQuota = async () => {
      try {
        setLoading(true);
        const quota = await ImageService.getUserQuota();
        setUserQuota(quota);
        
        // Update user stats with real disk space usage
        setUserStats(prevStats => ({
          ...prevStats,
          diskSpaceUsed: quota.diskSpaceUsed
        }));
      } catch (err) {
        console.error('Error fetching quota information:', err);
        setError('Не удалось загрузить информацию о квоте');
      } finally {
        setLoading(false);
      }
    };

    checkPasswordReset();
    fetchUserQuota();
    
    // В реальном приложении здесь также должна быть загрузка статистики и активностей
    // const fetchUserActivities = async () => {...}
  }, [user]);

  const handleLogout = () => {
    logout();
  };

  const handlePasswordChangeSuccess = () => {
    setPasswordResetRequired(false);
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Map role to display name and color
  const roleConfig: Record<UserRole, { label: string, color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
    [UserRole.ADMIN]: { label: 'Администратор', color: 'error' },
    [UserRole.MODERATOR]: { label: 'Модератор', color: 'primary' },
    [UserRole.READER]: { label: 'Читатель', color: 'success' }
  };

  // Если не авторизован, редирект на логин
  if (!isAuthenticated && !isInitializing) {
    return <Navigate to="/login" />;
  }

  // Пока инициализируется авторизация, показываем скелетон
  if (isInitializing || !user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="rectangular" width="100%" height={200} />
        </Box>
        <Box>
          <Skeleton variant="rectangular" width="100%" height={400} />
        </Box>
      </Container>
    );
  }

  // Получаем информацию о роли для отображения
  const roleDisplay = roleConfig[user.role] || { label: 'Неизвестно', color: 'default' };

  // Функция для получения инициалов имени пользователя
  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  // Render section with storage info using real quota data
  const renderStorageSection = () => {
    const diskSpaceUsed = userQuota ? userQuota.diskSpaceUsed : userStats.diskSpaceUsed;
    const diskSpaceQuota = userQuota ? userQuota.diskSpaceQuota : 1024 * 1024 * 1024; // 1GB default
    const percentUsed = (diskSpaceUsed / diskSpaceQuota) * 100;
    
    return (
      <Card sx={{ mb: 4, borderRadius: '16px', overflow: 'hidden' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <StorageIcon color="primary" sx={{ mr: 1.5 }} />
              <Typography variant="h6" fontWeight={600}>Используемое хранилище</Typography>
            </Box>
            <Typography variant="body2">
              {formatFileSize(diskSpaceUsed)} из {formatFileSize(diskSpaceQuota)}
            </Typography>
          </Box>
          
          <Box sx={{ position: 'relative', height: 8, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 2, overflow: 'hidden' }}>
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                height: '100%', 
                width: `${percentUsed}%`,
                bgcolor: theme.palette.primary.main,
                borderRadius: 2,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Сэкономлено сжатием: {formatFileSize(userStats.compressionSaved)}
            </Typography>
            <Chip 
              size="small" 
              label={`-${Math.round((userStats.compressionSaved / (diskSpaceUsed + userStats.compressionSaved)) * 100)}%`} 
              color="success"
              sx={{ height: 20, fontSize: '0.75rem', borderRadius: '6px' }}
            />
          </Box>
          
          {userQuota && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Изображения: {userQuota.imagesUsed} из {userQuota.imagesQuota}
              </Typography>
              <Chip 
                size="small" 
                label={`${Math.round(userQuota.imagesQuotaPercentage)}%`} 
                color="info"
                sx={{ height: 20, fontSize: '0.75rem', borderRadius: '6px' }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, pb: 6 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {error}
        </Alert>
      )}
      
      {/* Show loading indicator when fetching data */}
      {loading && (
        <LinearProgress sx={{ mb: 3, borderRadius: '4px' }} />
      )}
      
      <Grid container spacing={4}>
        {/* Верхняя секция профиля с основной информацией */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: '16px',
              overflow: 'visible',
              boxShadow: theme.palette.mode === 'light' 
                ? '0 10px 28px rgba(0, 0, 0, 0.08)'
                : '0 10px 28px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}
          >
            {/* Меню действий */}
            <IconButton 
              sx={{ position: 'absolute', top: 8, right: 8 }}
              onClick={handleMenuClick}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            
            <Menu
              id="profile-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  mt: 1
                }
              }}
            >
              <MenuItem onClick={handleMenuClose}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">Редактировать профиль</Typography>
              </MenuItem>
              <MenuItem onClick={handleMenuClose}>
                <ListItemIcon>
                  <SecurityIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">Настройки безопасности</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                <Typography variant="body2">Выйти из аккаунта</Typography>
              </MenuItem>
            </Menu>
            
            <CardContent sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              p: 4,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '120px', 
                  bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
                  zIndex: 0,
                }}
              />
              
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Tooltip title="Редактировать фото">
                    <IconButton 
                      sx={{ 
                        bgcolor: 'background.paper', 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        '&:hover': { bgcolor: 'background.paper', transform: 'scale(1.1)' }
                      }}
                      size="small"
                    >
                      <EditIcon fontSize="small" color="primary" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <Avatar 
                  sx={{ 
                    width: 130, 
                    height: 130, 
                    mt: 4,
                    mb: 3,
                    bgcolor: 'primary.main',
                    fontSize: '3rem',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
                    border: '4px solid',
                    borderColor: 'background.paper',
                    zIndex: 1
                  }}
                >
                  {getInitials()}
                </Avatar>
              </Badge>
              
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, textAlign: 'center' }}>
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.username}
              </Typography>
              
              <Chip 
                label={roleDisplay.label}
                color={roleDisplay.color}
                sx={{ 
                  mb: 3,
                  borderRadius: '8px',
                  fontWeight: 600,
                  px: 1
                }}
              />

              <List sx={{ width: '100%' }}>
                <ListItem sx={{ px: 1, py: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <PersonIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography variant="body2" color="textSecondary">Имя пользователя</Typography>} 
                    secondary={<Typography variant="body1" fontWeight={500}>{user.username}</Typography>} 
                  />
                </ListItem>
                
                {user.email && (
                  <ListItem sx={{ px: 1, py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <EmailIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography variant="body2" color="textSecondary">Email</Typography>} 
                      secondary={<Typography variant="body1" fontWeight={500}>{user.email}</Typography>} 
                    />
                  </ListItem>
                )}
                
                <ListItem sx={{ px: 1, py: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <BadgeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography variant="body2" color="textSecondary">Роль</Typography>} 
                    secondary={<Typography variant="body1" fontWeight={500}>{roleDisplay.label}</Typography>} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Правая часть с основным контентом */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Секция со статистикой */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              Общая статистика
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <StatCard 
                  title="Загрузки" 
                  value={userStats.totalUploads}
                  icon={<ImageIcon />}
                  color={theme.palette.primary.main}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <StatCard 
                  title="Сжатия" 
                  value={userStats.totalCompressions}
                  icon={<CompressIcon />}
                  color={theme.palette.success.main}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <StatCard 
                  title="Скачивания" 
                  value={userStats.totalDownloads}
                  icon={<CloudDownloadIcon />}
                  color={theme.palette.info.main}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <StatCard 
                  title="Просмотры" 
                  value={userStats.totalViews}
                  icon={<VisibilityIcon />}
                  color={theme.palette.warning.main}
                />
              </Grid>
            </Grid>
          </Box>
          
          {/* Секция с хранилищем */}
          {renderStorageSection()}

          {/* Вкладки для разных секций профиля */}
          <Card sx={{ borderRadius: '16px', overflow: 'hidden' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                variant="fullWidth" 
                aria-label="profile tabs"
              >
                <Tab 
                  label="Активность" 
                  icon={<HistoryIcon />} 
                  iconPosition="start" 
                  {...a11yProps(0)} 
                />
                <Tab 
                  label="Аналитика" 
                  icon={<BarChartIcon />} 
                  iconPosition="start" 
                  {...a11yProps(1)} 
                />
                <Tab 
                  label="Безопасность" 
                  icon={<SecurityIcon />} 
                  iconPosition="start" 
                  {...a11yProps(2)} 
                />
              </Tabs>
            </Box>

            {/* Содержимое вкладки "Активность" */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ px: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                  Последние действия
                </Typography>
                
                {recentActivities.map(activity => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
                
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<TimelineIcon />}
                    sx={{ borderRadius: '10px', px: 3, py: 1 }}
                  >
                    Показать больше активностей
                  </Button>
                </Box>
              </Box>
            </TabPanel>

            {/* Содержимое вкладки "Аналитика" */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ px: 2, py: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Аналитика использования
                </Typography>
                
                <Paper 
                  sx={{ 
                    p: 3, 
                    mb: 3, 
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    height: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <BarChartIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography>
                      График активности будет доступен в будущих обновлениях
                    </Typography>
                  </Box>
                </Paper>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Button variant="outlined" size="small">За неделю</Button>
                  <Button variant="outlined" size="small">За месяц</Button>
                  <Button variant="outlined" size="small">За квартал</Button>
                  <Button variant="outlined" size="small">За год</Button>
                  <Button variant="outlined" size="small">По типам</Button>
                </Box>
              </Box>
            </TabPanel>

            {/* Содержимое вкладки "Безопасность" */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ px: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Настройки безопасности
                </Typography>
                
                <ChangePasswordForm 
                  isFirstLogin={passwordResetRequired} 
                  onSuccess={handlePasswordChangeSuccess}
                />
                
                {/* Дополнительные настройки безопасности (заготовки) */}
                <Card 
                  sx={{ 
                    mb: 3, 
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    boxShadow: 'none',
                    bgcolor: 'background.default'
                  }}
                >
                  <CardHeader 
                    title="Двухфакторная аутентификация" 
                    titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }} 
                    avatar={<SecurityIcon color="primary" />}
                  />
                  <Divider />
                  <CardContent>
                    <Typography variant="body2" paragraph>
                      Двухфакторная аутентификация добавляет дополнительный уровень защиты для вашей учетной записи.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      disabled 
                      sx={{ borderRadius: '10px' }}
                    >
                      Будет доступно скоро
                    </Button>
                  </CardContent>
                </Card>
                
                <Card 
                  sx={{ 
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    boxShadow: 'none',
                    bgcolor: 'background.default'
                  }}
                >
                  <CardHeader 
                    title="История входов" 
                    titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }} 
                    avatar={<HistoryIcon color="primary" />}
                  />
                  <Divider />
                  <CardContent>
                    <Typography variant="body2" paragraph>
                      Просмотрите историю входов в систему для мониторинга активности вашей учетной записи.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      disabled 
                      sx={{ borderRadius: '10px' }}
                    >
                      Будет доступно скоро
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            </TabPanel>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;