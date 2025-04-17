import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
  Paper
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockOutlined as LockIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormInputs {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isInitializing } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showExpiredMessage, setShowExpiredMessage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormInputs>();

  // Redirect if already authenticated
  useEffect(() => {
    // Check URL query params for expired session notification
    const queryParams = new URLSearchParams(location.search);
    const expired = queryParams.get('expired') === 'true';
    
    if (expired) {
      setShowExpiredMessage(true);
    }
    
    // Redirect to dashboard if already authenticated
    if (isAuthenticated && !isInitializing) {
      navigate('/');
    }
  }, [isAuthenticated, isInitializing, navigate, location]);

  const onSubmit = async (data: LoginFormInputs) => {
    setLoginError(null);
    setIsLoading(true);
    
    try {
      await login(data.username, data.password);
      navigate('/');
    } catch (error: any) {
      if (error.response?.status === 401) {
        setLoginError('Неверное имя пользователя или пароль');
      } else {
        setLoginError('Произошла ошибка при входе. Пожалуйста, попробуйте позже.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (isInitializing) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(200,200,255,0.1)',
        px: 2
      }}
    >
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            borderRadius: '50%',
            p: 2,
            mb: 2,
            backgroundColor: theme.palette.primary.main,
            color: 'white'
          }}
        >
          <LockIcon fontSize="large" />
        </Paper>
        <Typography component="h1" variant="h4" fontWeight="bold" mb={1}>
          Compress Rank
        </Typography>
        <Typography component="h2" variant="h6" color="textSecondary">
          Вход в панель управления
        </Typography>
      </Box>

      <Card
        sx={{
          maxWidth: 450,
          width: '100%',
          borderRadius: 2,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 16px rgba(0, 0, 0, 0.4)' 
            : '0 8px 32px rgba(145, 158, 171, 0.16)'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {showExpiredMessage && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Ваша сессия истекла. Пожалуйста, войдите снова.
            </Alert>
          )}

          {loginError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {loginError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              id="username"
              label="Имя пользователя"
              variant="outlined"
              margin="normal"
              autoComplete="username"
              autoFocus
              disabled={isLoading}
              error={!!errors.username}
              helperText={errors.username?.message}
              {...register('username', { required: 'Введите имя пользователя' })}
            />

            <TextField
              fullWidth
              id="password"
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              margin="normal"
              autoComplete="current-password"
              disabled={isLoading}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              {...register('password', { required: 'Введите пароль' })}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 'bold',
                boxShadow: '0 8px 16px rgba(25, 118, 210, 0.24)',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 20px rgba(25, 118, 210, 0.3)'
                }
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Войти'
              )}
            </Button>
          </form>

          <Typography 
            variant="body2" 
            color="textSecondary" 
            align="center"
            sx={{ mt: 3 }}
          >
            Система управления изображениями и сжатием
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;