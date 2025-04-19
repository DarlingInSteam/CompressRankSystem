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
  CircularProgress,
  Tooltip,
  Avatar,
  useMediaQuery,
  useTheme,
  alpha,
  Skeleton,
  InputAdornment,
  Zoom,
  Fade,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';

// Map role to display name and color
const roleConfig: Record<UserRole, { label: string, color: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning', icon: React.ReactElement }> = {
  [UserRole.ADMIN]: { 
    label: 'Администратор', 
    color: 'error',
    icon: <PersonIcon fontSize="small" />
  },
  [UserRole.MODERATOR]: { 
    label: 'Модератор', 
    color: 'primary',
    icon: <PersonIcon fontSize="small" />
  },
  [UserRole.READER]: { 
    label: 'Читатель', 
    color: 'success',
    icon: <PersonIcon fontSize="small" />
  }
};

const UserManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [transitionCompleted, setTransitionCompleted] = useState(false);

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

  // Apply filters whenever users, searchTerm, or filterRole changes
  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, filterRole]);

  // Effect for staggered animation after data loads
  useEffect(() => {
    if (!loading && users.length > 0) {
      setTimeout(() => {
        setTransitionCompleted(true);
      }, 300);
    }
  }, [loading, users]);

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
        setShowPassword(false);
      }
    }
  }, [openUserDialog, editingUser, reset]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.getUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError('Не удалось загрузить список пользователей');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...users];
    
    // Apply search term filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.username.toLowerCase().includes(lowerSearchTerm) || 
        (user.firstName && user.firstName.toLowerCase().includes(lowerSearchTerm)) || 
        (user.lastName && user.lastName.toLowerCase().includes(lowerSearchTerm)) || 
        (user.email && user.email.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    // Apply role filter
    if (filterRole) {
      result = result.filter(user => user.role === filterRole);
    }
    
    setFilteredUsers(result);
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
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
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
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
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

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setFilterRole(null);
  };

  // User cannot access user management if not admin
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return (
      <Card
        elevation={0}
        sx={{ 
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px 0 rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: theme => theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.5)'
            : 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <CardContent>
          <Alert 
            severity="error"
            icon={<ErrorIcon fontSize="inherit" />}
            sx={{ 
              alignItems: 'center',
              '& .MuiAlert-message': {
                fontSize: '1rem'
              }
            }}
          >
            У вас нет прав для доступа к управлению пользователями
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Render loading state
  const renderLoadingState = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton variant="rectangular" width={200} height={40} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={180} height={40} sx={{ borderRadius: 1 }} />
      </Box>
      
      <Skeleton variant="rectangular" height={52} sx={{ borderRadius: 1 }} />
      
      <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
        <Table>
          <TableHead>
            <TableRow>
              {['Пользователь', 'Имя', 'Email', 'Роль', ''].map((header, index) => (
                <TableCell key={index}>
                  <Skeleton variant="text" width={index === 4 ? 80 : '80%'} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                {[...Array(5)].map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    {cellIndex === 3 ? (
                      <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 12 }} />
                    ) : cellIndex === 4 ? (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Skeleton variant="circular" width={30} height={30} />
                        <Skeleton variant="circular" width={30} height={30} />
                      </Box>
                    ) : (
                      <Skeleton variant="text" width={cellIndex === 0 ? '40%' : '60%'} />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Default avatar content based on user name
  const getUserInitials = (user: User): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Notification Messages */}
      <Collapse in={!!error}>
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(211,47,47,0.15)',
            '& .MuiAlert-message': { width: '100%', display: 'flex', alignItems: 'center' }
          }}
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={() => setError(null)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Collapse>
      
      <Collapse in={!!success}>
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3, 
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(46,125,50,0.15)',
            '& .MuiAlert-message': { width: '100%', display: 'flex', alignItems: 'center' }
          }}
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={() => setSuccess(null)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {success}
        </Alert>
      </Collapse>

      {/* Header with actions */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 2, 
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', md: 'center' },
        mb: 3
      }}>
        <Typography variant="h5" fontWeight={600}>
          Управление пользователями
        </Typography>
      
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenUserDialog()}
          disabled={loading}
          sx={{ 
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 500,
            px: 3,
            py: 1.2,
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
            background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
            transition: 'all 0.3s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(25, 118, 210, 0.3)',
            }
          }}
        >
          Новый пользователь
        </Button>
      </Box>

      {/* Filters Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: '16px',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          background: theme => alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: theme => theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.9)'
            : 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <TextField
          placeholder="Поиск пользователя..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            sx: { borderRadius: '8px' }
          }}
          sx={{ flexGrow: 1 }}
        />
        
        <FormControl 
          size="small" 
          sx={{ minWidth: { xs: '100%', sm: 200 } }}
        >
          <InputLabel id="role-filter-label">Роль</InputLabel>
          <Select
            labelId="role-filter-label"
            value={filterRole || ''}
            label="Роль"
            onChange={(e) => setFilterRole(e.target.value || null)}
            sx={{ borderRadius: '8px' }}
            displayEmpty
          >
            <MenuItem value="">Все роли</MenuItem>
            <MenuItem value={UserRole.ADMIN}>Администратор</MenuItem>
            <MenuItem value={UserRole.MODERATOR}>Модератор</MenuItem>
            <MenuItem value={UserRole.READER}>Читатель</MenuItem>
          </Select>
        </FormControl>
        
        <Button 
          variant="outlined" 
          disabled={!searchTerm && !filterRole}
          onClick={clearFilters}
          size="medium"
          startIcon={<FilterIcon />}
          sx={{ 
            minWidth: { xs: '100%', sm: 140 },
            borderRadius: '8px',
            whiteSpace: 'nowrap',
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px'
            }
          }}
        >
          Сбросить
        </Button>
      </Paper>

      {/* Main content */}
      <Fade in={!loading} timeout={500}>
        <Box>
          {loading ? renderLoadingState() : (
            filteredUsers.length === 0 ? (
              <Paper
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: '16px',
                  bgcolor: theme => alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid',
                  borderColor: theme => theme.palette.mode === 'light'
                    ? 'rgba(255, 255, 255, 0.9)'
                    : 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Нет пользователей для отображения
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {searchTerm || filterRole ? 'Измените критерии фильтрации для поиска пользователей' : 'Создайте нового пользователя, нажав на кнопку выше'}
                </Typography>
              </Paper>
            ) : (
              <TableContainer 
                component={Paper}
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid',
                  borderColor: theme => theme.palette.mode === 'light'
                    ? 'rgba(255, 255, 255, 0.9)'
                    : 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.95rem',
                          bgcolor: theme => alpha(theme.palette.background.paper, 0.6),
                          backdropFilter: 'blur(10px)',
                          color: 'text.primary' 
                        }}
                      >
                        Пользователь
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.95rem',
                          bgcolor: theme => alpha(theme.palette.background.paper, 0.6),
                          backdropFilter: 'blur(10px)',
                          color: 'text.primary',
                          display: { xs: 'none', md: 'table-cell' }
                        }}
                      >
                        Имя
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.95rem',
                          bgcolor: theme => alpha(theme.palette.background.paper, 0.6),
                          backdropFilter: 'blur(10px)',
                          color: 'text.primary',
                          display: { xs: 'none', sm: 'table-cell' }
                        }}
                      >
                        Email
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.95rem',
                          bgcolor: theme => alpha(theme.palette.background.paper, 0.6),
                          backdropFilter: 'blur(10px)',
                          color: 'text.primary'
                        }}
                      >
                        Роль
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.95rem',
                          bgcolor: theme => alpha(theme.palette.background.paper, 0.6),
                          backdropFilter: 'blur(10px)',
                          color: 'text.primary' 
                        }}
                      >
                        Действия
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user, idx) => (
                      <Fade 
                        key={user.id} 
                        in={transitionCompleted}
                        timeout={300 + (idx * 50)}
                        mountOnEnter
                        unmountOnExit
                      >
                        <TableRow
                          hover
                          sx={{ 
                            '&:nth-of-type(odd)': {
                              bgcolor: theme => alpha(theme.palette.action.hover, 0.05),
                            },
                            '&:hover': {
                              bgcolor: theme => alpha(theme.palette.action.hover, 0.15),
                            },
                            transition: 'background-color 0.2s',
                            animation: `fadeIn ${300 + (idx * 50)}ms ease forwards`
                          }}
                        >
                          <TableCell 
                            component="th" 
                            scope="row"
                            sx={{
                              py: 2,
                              borderColor: alpha(theme.palette.divider, 0.5)
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar 
                                sx={{ 
                                  bgcolor: (theme) => {
                                    const color = roleConfig[user.role].color;
                                    return theme.palette[color]?.main || theme.palette.primary.main;
                                  },
                                  width: 40,
                                  height: 40,
                                  fontWeight: 'bold'
                                }}
                              >
                                {getUserInitials(user)}
                              </Avatar>
                              <Typography variant="body1" fontWeight={500}>
                                {user.username}
                                {user.id === currentUser.id && (
                                  <Chip 
                                    label="Вы" 
                                    color="primary"
                                    size="small" 
                                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                  />
                                )}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell 
                            sx={{ 
                              display: { xs: 'none', md: 'table-cell' },
                              borderColor: alpha(theme.palette.divider, 0.5)
                            }}
                          >
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : '-'}
                          </TableCell>
                          <TableCell 
                            sx={{ 
                              display: { xs: 'none', sm: 'table-cell' },
                              borderColor: alpha(theme.palette.divider, 0.5)
                            }}
                          >
                            {user.email || '-'}
                          </TableCell>
                          <TableCell
                            sx={{ borderColor: alpha(theme.palette.divider, 0.5) }}
                          >
                            <Chip
                              icon={roleConfig[user.role].icon}
                              label={roleConfig[user.role].label}
                              color={roleConfig[user.role].color}
                              size="small"
                              sx={{ 
                                fontWeight: 500,
                                boxShadow: (theme) => {
                                  const color = roleConfig[user.role].color;
                                  const colorMain = theme.palette[color]?.main || theme.palette.primary.main;
                                  return `0 2px 5px ${alpha(colorMain, 0.2)}`;
                                },
                                border: '1px solid',
                                borderColor: (theme) => {
                                  const color = roleConfig[user.role].color;
                                  const colorMain = theme.palette[color]?.main || theme.palette.primary.main;
                                  return alpha(colorMain, 0.3);
                                },
                                transition: 'transform 0.2s ease',
                                '&:hover': {
                                  transform: 'translateY(-2px)'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell 
                            align="right"
                            sx={{ borderColor: alpha(theme.palette.divider, 0.5) }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <Tooltip title="Редактировать">
                                <IconButton 
                                  color="primary" 
                                  onClick={() => handleOpenUserDialog(user)}
                                  disabled={loading}
                                  sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.primary.main, 0.2)
                                    }
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={user.id === currentUser.id ? 'Вы не можете удалить себя' : 'Удалить'}>
                                <span>
                                  <IconButton 
                                    color="error" 
                                    onClick={() => handleOpenDeleteDialog(user)}
                                    disabled={loading || user.id === currentUser.id}
                                    sx={{
                                      bgcolor: user.id !== currentUser.id ? alpha(theme.palette.error.main, 0.1) : undefined,
                                      '&:hover': {
                                        bgcolor: user.id !== currentUser.id ? alpha(theme.palette.error.main, 0.2) : undefined
                                      }
                                    }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      </Fade>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}
        </Box>
      </Fade>

      {/* User Create/Edit Dialog */}
      <Dialog 
        open={openUserDialog} 
        onClose={handleCloseUserDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          elevation: 24,
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(10px)',
            bgcolor: theme => theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.95)' 
              : 'rgba(30, 30, 30, 0.95)'
          }
        }}
      >
        <form onSubmit={handleSubmit(onSubmitUserForm)}>
          <DialogTitle sx={{ 
            p: 3,
            bgcolor: theme => alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(10px)'
          }}>
            <Typography variant="h6" fontWeight={600}>
              {isEditing ? 'Редактировать пользователя' : 'Новый пользователь'}
            </Typography>
            <IconButton
              aria-label="close"
              onClick={handleCloseUserDialog}
              sx={{
                position: 'absolute',
                right: 16,
                top: 16,
                bgcolor: alpha(theme.palette.text.primary, 0.05),
                '&:hover': {
                  bgcolor: alpha(theme.palette.text.primary, 0.1)
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent 
            dividers 
            sx={{ 
              p: 3,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: alpha(theme.palette.text.primary, 0.05)
              },
              '&::-webkit-scrollbar-thumb': {
                background: alpha(theme.palette.text.primary, 0.2),
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: alpha(theme.palette.text.primary, 0.3)
              }
            }}
          >
            <Grid container spacing={3}>
              <Grid size={{xs: 12 }}>
                <TextField
                  label="Имя пользователя"
                  fullWidth
                  disabled={isEditing}
                  error={!!errors.username}
                  helperText={errors.username?.message}
                  InputProps={{
                    sx: { borderRadius: '10px' }
                  }}
                  {...register('username', { 
                    required: 'Имя пользователя обязательно' 
                  })}
                />
              </Grid>

              {!isEditing && (
                <>
                  <Grid size={{xs: 12 }}>
                    <TextField
                      label="Пароль"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      InputProps={{
                        sx: { borderRadius: '10px' },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleTogglePasswordVisibility}
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      {...register('password', { 
                        required: 'Пароль обязателен',
                        minLength: {
                          value: 6,
                          message: 'Пароль должен содержать не менее 6 символов'
                        }
                      })}
                    />
                  </Grid>
                  
                  <Grid size={{xs: 12 }}>
                    <TextField
                      label="Подтверждение пароля"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword?.message}
                      InputProps={{
                        sx: { borderRadius: '10px' }
                      }}
                      {...register('confirmPassword', { 
                        required: 'Подтвердите пароль',
                        validate: value => 
                          value === newPassword || 'Пароли не совпадают'
                      })}
                    />
                  </Grid>
                </>
              )}

              <Grid size={{xs: 12, sm: 6 }}>
                <TextField
                  label="Имя"
                  fullWidth
                  InputProps={{
                    sx: { borderRadius: '10px' }
                  }}
                  {...register('firstName')}
                />
              </Grid>
              
              <Grid size={{xs: 12, sm: 6 }}>
                <TextField
                  label="Фамилия"
                  fullWidth
                  InputProps={{
                    sx: { borderRadius: '10px' }
                  }}
                  {...register('lastName')}
                />
              </Grid>
              
              <Grid size={{xs: 12 }}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    sx: { borderRadius: '10px' }
                  }}
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Некорректный email адрес'
                    }
                  })}
                />
              </Grid>
              
              <Grid size={{xs: 12 }}>
                <FormControl fullWidth error={!!errors.role}>
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
                        sx={{
                          borderRadius: '10px',
                          '& .MuiSelect-select': {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }
                        }}
                        renderValue={(value) => (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar 
                              sx={{ 
                                width: 24, 
                                height: 24, 
                                bgcolor: (theme) => {
                                  const color = roleConfig[value as UserRole].color;
                                  return theme.palette[color]?.main || theme.palette.primary.main;
                                },
                                '& .MuiSvgIcon-root': { 
                                  fontSize: '0.8rem' 
                                }
                              }}
                            >
                              {roleConfig[value as UserRole].icon}
                            </Avatar>
                            {roleConfig[value as UserRole].label}
                          </Box>
                        )}
                      >
                        <MenuItem value={UserRole.ADMIN}>
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              mr: 1, 
                              bgcolor: (theme) => {
                                const color = roleConfig[UserRole.ADMIN].color;
                                return theme.palette[color]?.main || theme.palette.primary.main;
                              },
                              '& .MuiSvgIcon-root': { 
                                fontSize: '0.8rem' 
                              }
                            }}
                          >
                            {roleConfig[UserRole.ADMIN].icon}
                          </Avatar>
                          {roleConfig[UserRole.ADMIN].label}
                        </MenuItem>
                        <MenuItem value={UserRole.MODERATOR}>
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              mr: 1, 
                              bgcolor: (theme) => {
                                const color = roleConfig[UserRole.MODERATOR].color;
                                return theme.palette[color]?.main || theme.palette.primary.main;
                              },
                              '& .MuiSvgIcon-root': { 
                                fontSize: '0.8rem' 
                              }
                            }}
                          >
                            {roleConfig[UserRole.MODERATOR].icon}
                          </Avatar>
                          {roleConfig[UserRole.MODERATOR].label}
                        </MenuItem>
                        <MenuItem value={UserRole.READER}>
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              mr: 1, 
                              bgcolor: (theme) => {
                                const color = roleConfig[UserRole.READER].color;
                                return theme.palette[color]?.main || theme.palette.primary.main;
                              },
                              '& .MuiSvgIcon-root': { 
                                fontSize: '0.8rem' 
                              }
                            }}
                          >
                            {roleConfig[UserRole.READER].icon}
                          </Avatar>
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
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={handleCloseUserDialog} 
              disabled={loading}
              variant="outlined"
              sx={{ 
                borderRadius: '10px',
                borderWidth: '1.5px',
                '&:hover': {
                  borderWidth: '1.5px'
                }
              }}
            >
              Отмена
            </Button>
            <Button 
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <PersonIcon />}
              sx={{ 
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(25,118,210,0.2)',
                background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
                px: 3
              }}
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
        PaperProps={{
          elevation: 24,
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle sx={{ 
          p: 3,
          bgcolor: theme => alpha(theme.palette.background.paper, 0.4),
          backdropFilter: 'blur(10px)'
        }}>
          <Typography variant="h6" fontWeight={600}>
            Подтверждение удаления
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Alert 
            severity="warning" 
            variant="outlined"
            sx={{ 
              mb: 2, 
              borderRadius: '10px',
              borderWidth: '1.5px',
              '& .MuiAlert-icon': {
                alignItems: 'center'
              }
            }}
          >
            <Typography>
              Это действие нельзя отменить
            </Typography>
          </Alert>
          <DialogContentText sx={{ color: 'text.primary' }}>
            Вы уверены, что хотите удалить пользователя <Box component="span" fontWeight="bold">{userToDelete?.username}</Box>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseDeleteDialog} 
            disabled={loading}
            variant="outlined"
            sx={{ 
              borderRadius: '10px',
              borderWidth: '1.5px',
              '&:hover': {
                borderWidth: '1.5px'
              }
            }}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
            sx={{ 
              borderRadius: '10px',
              background: 'linear-gradient(90deg, #d32f2f, #ef5350)',
              boxShadow: '0 4px 12px rgba(211,47,47,0.3)',
              px: 3
            }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;