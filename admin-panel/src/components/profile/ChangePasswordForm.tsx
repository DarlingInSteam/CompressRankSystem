import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Divider
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { authService, ChangePasswordPayload } from '../../services/auth.service';

interface ChangePasswordFormProps {
  isFirstLogin?: boolean;
  onSuccess?: () => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ 
  isFirstLogin = false,
  onSuccess 
}) => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    watch, 
    reset 
  } = useForm<ChangePasswordPayload>();

  const newPassword = watch('newPassword', '');

  const onSubmit = async (data: ChangePasswordPayload) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await authService.changePassword(data);
      setSuccess('Пароль успешно изменен');
      reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error changing password:', err);
      if (err.response?.status === 400) {
        setError(err.response.data.message || 'Неверный текущий пароль');
      } else {
        setError('Произошла ошибка при смене пароля. Пожалуйста, попробуйте позже.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader 
        title={isFirstLogin ? "Требуется смена пароля" : "Сменить пароль"} 
        titleTypographyProps={{ variant: 'h6' }} 
        sx={{ 
          bgcolor: isFirstLogin ? 'warning.light' : 'inherit',
          color: isFirstLogin ? 'warning.contrastText' : 'inherit'
        }}
      />
      <Divider />
      <CardContent>
        {isFirstLogin && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Для обеспечения безопасности, при первом входе требуется смена пароля
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && !isFirstLogin && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            margin="normal"
            label="Текущий пароль"
            type={showOldPassword ? 'text' : 'password'}
            disabled={isSubmitting}
            error={!!errors.oldPassword}
            helperText={errors.oldPassword?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle old password visibility"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    edge="end"
                  >
                    {showOldPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            {...register('oldPassword', { 
              required: 'Введите текущий пароль' 
            })}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Новый пароль"
            type={showNewPassword ? 'text' : 'password'}
            disabled={isSubmitting}
            error={!!errors.newPassword}
            helperText={errors.newPassword?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle new password visibility"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            {...register('newPassword', { 
              required: 'Введите новый пароль',
              minLength: {
                value: 6,
                message: 'Пароль должен содержать не менее 6 символов'
              }
            })}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Подтверждение пароля"
            type={showConfirmPassword ? 'text' : 'password'}
            disabled={isSubmitting}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            {...register('confirmPassword', { 
              required: 'Подтвердите новый пароль',
              validate: value => 
                value === newPassword || 'Пароли не совпадают'
            })}
          />

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            {!isFirstLogin && (
              <Button
                variant="outlined"
                sx={{ mr: 1 }}
                disabled={isSubmitting}
                onClick={() => reset()}
              >
                Отмена
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{ minWidth: 120 }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : isFirstLogin ? (
                'Сохранить пароль'
              ) : (
                'Сменить пароль'
              )}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChangePasswordForm;