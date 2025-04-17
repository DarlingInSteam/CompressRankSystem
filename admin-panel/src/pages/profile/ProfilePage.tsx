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
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  VpnKey as KeyIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import ChangePasswordForm from '../../components/profile/ChangePasswordForm';
import { authService } from '../../services/auth.service';

// Map role to display name and color
const roleConfig: Record<UserRole, { label: string, color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  [UserRole.ADMIN]: { label: 'Администратор', color: 'error' },
  [UserRole.MODERATOR]: { label: 'Модератор', color: 'primary' },
  [UserRole.READER]: { label: 'Читатель', color: 'success' }
};

const ProfilePage: React.FC = () => {
  const { user, logout, isAuthenticated, isInitializing } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordResetRequired, setPasswordResetRequired] = useState(false);

  useEffect(() => {
    // Check if password reset is required (for first login)
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

    checkPasswordReset();
  }, [user]);

  const handleLogout = () => {
    logout();
  };

  const handlePasswordChangeSuccess = () => {
    setPasswordResetRequired(false);
  };

  // If not authenticated, redirect to login
  if (!isAuthenticated && !isInitializing) {
    return <Navigate to="/login" />;
  }

  // While initializing auth state, show loading skeleton
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

  // Get role display config
  const roleDisplay = roleConfig[user.role] || { label: 'Неизвестно', color: 'default' };

  // Function to get initials from user's name
  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* User profile information */}
        <Grid container spacing={12} sx={{ mb: 4 }}>
          <Card>
            <CardHeader 
              title="Профиль пользователя" 
              titleTypographyProps={{ variant: 'h6' }}
            />
            <Divider />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 100, 
                  height: 100, 
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  mb: 2
                }}
              >
                {getInitials()}
              </Avatar>
              
              <Typography variant="h6" gutterBottom>
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.username}
              </Typography>
              
              <Chip 
                label={roleDisplay.label}
                color={roleDisplay.color}
                size="small"
                sx={{ mb: 3 }}
              />

              <List sx={{ width: '100%' }}>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Имя пользователя" 
                    secondary={user.username} 
                  />
                </ListItem>
                
                {user.email && (
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Email" 
                      secondary={user.email} 
                    />
                  </ListItem>
                )}
                
                <ListItem>
                  <ListItemIcon>
                    <BadgeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Роль" 
                    secondary={roleDisplay.label} 
                  />
                </ListItem>
              </List>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ mt: 2 }}
                fullWidth
              >
                Выйти из аккаунта
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Password change section */}
        <Grid container spacing={12} sx={{ mb: 8 }}>
          <ChangePasswordForm 
            isFirstLogin={passwordResetRequired} 
            onSuccess={handlePasswordChangeSuccess}
          />
          
          {/* Role-specific information */}
          <Card>
            <CardHeader 
              title="Доступные возможности" 
              titleTypographyProps={{ variant: 'h6' }}
              avatar={<KeyIcon />}
            />
            <Divider />
            <CardContent>
              {user.role === UserRole.ADMIN && (
                <>
                  <Typography variant="body1" paragraph>
                    Как <strong>администратор</strong>, вы имеете полный доступ к системе, включая:
                  </Typography>
                  <ul>
                    <li>Управление пользователями (создание, редактирование, удаление)</li>
                    <li>Управление настройками системы</li>
                    <li>Загрузку и управление изображениями</li>
                    <li>Доступ к метрикам и статистике</li>
                  </ul>
                </>
              )}
              
              {user.role === UserRole.MODERATOR && (
                <>
                  <Typography variant="body1" paragraph>
                    Как <strong>модератор</strong>, вы можете:
                  </Typography>
                  <ul>
                    <li>Загружать и управлять изображениями</li>
                    <li>Сжимать изображения</li>
                    <li>Просматривать статистику по изображениям</li>
                  </ul>
                </>
              )}
              
              {user.role === UserRole.READER && (
                <>
                  <Typography variant="body1" paragraph>
                    Как <strong>читатель</strong>, вы можете:
                  </Typography>
                  <ul>
                    <li>Просматривать загруженные изображения</li>
                    <li>Скачивать изображения</li>
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;