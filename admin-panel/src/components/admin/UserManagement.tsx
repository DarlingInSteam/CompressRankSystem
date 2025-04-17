import React, { useState, useEffect } from 'react';
import { useAuth, User, UserRole } from '../../contexts/AuthContext';
import { authService, UserFormData } from '../../services/auth.service';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';

// Map role to display name and color
const roleConfig: Record<UserRole, { label: string, color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  [UserRole.ADMIN]: { label: 'Администратор', color: 'error' },
  [UserRole.MODERATOR]: { label: 'Модератор', color: 'primary' },
  [UserRole.READER]: { label: 'Читатель', color: 'success' }
};

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { 
    control, 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors },
    watch
  } = useForm<UserFormData>();

  const newPassword = watch('password', '');
  const isEditing = !!editingUser;

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset form when dialog opens/closes or editing user changes
  useEffect(() => {
    if (openUserDialog) {
      if (editingUser) {
        // When editing, prefill the form with user data
        reset({
          username: editingUser.username,
          firstName: editingUser.firstName || '',
          lastName: editingUser.lastName || '',
          email: editingUser.email || '',
          role: editingUser.role
        });
      } else {
        // When creating new user, reset to defaults
        reset({
          username: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          email: '',
          role: UserRole.READER
        });
      }
    }
  }, [openUserDialog, editingUser, reset]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError('Не удалось загрузить список пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUserDialog = (user: User | null = null) => {
    setEditingUser(user);
    setOpenUserDialog(true);
  };

  const handleCloseUserDialog = () => {
    setEditingUser(null);
    setOpenUserDialog(false);
    reset();
  };

  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setUserToDelete(null);
    setOpenDeleteDialog(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setLoading(true);
      await authService.deleteUser(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setSuccess(`Пользователь ${userToDelete.username} успешно удален`);
      handleCloseDeleteDialog();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      setError(`Не удалось удалить пользователя: ${err.response?.data?.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitUserForm = async (data: UserFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (editingUser) {
        // Update existing user
        const updatedUser = await authService.updateUser(editingUser.id, data);
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        setSuccess(`Пользователь ${updatedUser.username} успешно обновлен`);
      } else {
        // Create new user
        const newUser = await authService.createUser(data);
        setUsers([...users, newUser]);
        setSuccess(`Пользователь ${newUser.username} успешно создан`);
      }
      
      handleCloseUserDialog();
    } catch (err: any) {
      console.error('Failed to save user:', err);
      
      if (err.response?.status === 409) {
        setError('Пользователь с таким именем уже существует');
      } else {
        setError(`Не удалось ${isEditing ? 'обновить' : 'создать'} пользователя: ${err.response?.data?.message || 'Неизвестная ошибка'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            У вас нет прав для доступа к управлению пользователями
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Управление пользователями"
        titleTypographyProps={{ variant: 'h6' }}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenUserDialog()}
            disabled={loading}
          >
            Новый пользователь
          </Button>
        }
      />
      <Divider />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {loading && users.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Пользователь</TableCell>
                  <TableCell>Имя</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Роль</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : '-'}
                    </TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={roleConfig[user.role]?.label || user.role}
                        color={roleConfig[user.role]?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenUserDialog(user)}
                        disabled={loading}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleOpenDeleteDialog(user)}
                        disabled={loading || user.id === currentUser.id}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                        Нет пользователей для отображения
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>

      {/* User Create/Edit Dialog */}
      <Dialog 
        open={openUserDialog} 
        onClose={handleCloseUserDialog}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit(onSubmitUserForm)}>
          <DialogTitle>
            {isEditing ? 'Редактировать пользователя' : 'Новый пользователь'}
            <IconButton
              aria-label="close"
              onClick={handleCloseUserDialog}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid component={"div"} container spacing={12}>
                <TextField
                  label="Имя пользователя"
                  fullWidth
                  margin="normal"
                  disabled={isEditing}
                  error={!!errors.username}
                  helperText={errors.username?.message}
                  {...register('username', { 
                    required: 'Имя пользователя обязательно' 
                  })}
                />
              </Grid>

              {!isEditing && (
                <>
                  <Grid component={"div"} container spacing={12} sx={{ mb: 6 }}>
                    <TextField
                      label="Пароль"
                      type="password"
                      fullWidth
                      margin="normal"
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      {...register('password', { 
                        required: 'Пароль обязателен',
                        minLength: {
                          value: 6,
                          message: 'Пароль должен содержать не менее 6 символов'
                        }
                      })}
                    />
                  </Grid>
                  
                  <Grid component={"div"} container spacing={12} sx={{ mb: 6 }}>
                    <TextField
                      label="Подтверждение пароля"
                      type="password"
                      fullWidth
                      margin="normal"
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword?.message}
                      {...register('confirmPassword', { 
                        required: 'Подтвердите пароль',
                        validate: value => 
                          value === newPassword || 'Пароли не совпадают'
                      })}
                    />
                  </Grid>
                </>
              )}

              <Grid component={"div"} container spacing={12} sx={{ mb: 6 }}>
                <TextField
                  label="Имя"
                  fullWidth
                  margin="normal"
                  {...register('firstName')}
                />
              </Grid>
              
              <Grid component={"div"} container spacing={12} sx={{ mb: 6 }}>
                <TextField
                  label="Фамилия"
                  fullWidth
                  margin="normal"
                  {...register('lastName')}
                />
              </Grid>
              
              <Grid component={"div"} container spacing={12}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Некорректный email адрес'
                    }
                  })}
                />
              </Grid>
              
              <Grid component={"div"} container spacing={12}>
                <FormControl fullWidth margin="normal" error={!!errors.role}>
                  <InputLabel id="role-label">Роль</InputLabel>
                  <Controller
                    name="role"
                    control={control}
                    rules={{ required: 'Выберите роль' }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        labelId="role-label"
                        label="Роль"
                      >
                        <MenuItem value={UserRole.ADMIN}>
                          {roleConfig[UserRole.ADMIN].label}
                        </MenuItem>
                        <MenuItem value={UserRole.MODERATOR}>
                          {roleConfig[UserRole.MODERATOR].label}
                        </MenuItem>
                        <MenuItem value={UserRole.READER}>
                          {roleConfig[UserRole.READER].label}
                        </MenuItem>
                      </Select>
                    )}
                  />
                  {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUserDialog} disabled={loading}>Отмена</Button>
            <Button 
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <PersonIcon />}
            >
              {isEditing ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>
          Подтвердите удаление
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить пользователя {userToDelete?.username}?
            Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={loading}>Отмена</Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default UserManagement;