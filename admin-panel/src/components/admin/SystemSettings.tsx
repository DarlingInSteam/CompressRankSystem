import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { systemService } from '../../services/system.service';
import { SystemSettingsDTO } from '../../types/api.types';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  Fade,
  Grow,
  Zoom,
  Badge,
  Avatar,
  Tooltip,
  Skeleton,
  Chip,
  Collapse,
  ListItemIcon,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  Category as CategoryIcon,
  Tune as TuneIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';

// Интерфейс для группированных настроек
interface GroupedSettings {
  [group: string]: SystemSettingsDTO[];
}

// Интерфейс для параметров вкладки настроек
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Вкладка настроек
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

// Информация о группах настроек с дополнительными метаданными
const groupMetadata: Record<string, {
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}> = {
  'file_limits': {
    label: 'Лимиты файлов',
    icon: <StorageIcon />,
    description: 'Настройки максимальных размеров файлов и ограничения загрузок',
    color: '#1976d2' // primary blue
  },
  'user_quotas': {
    label: 'Квоты пользователей',
    icon: <TuneIcon />,
    description: 'Управление дисковым пространством и ограничениями на пользователя',
    color: '#2e7d32' // success green
  },
  'image_categories': {
    label: 'Категории изображений',
    icon: <CategoryIcon />,
    description: 'Настройка типов и категорий для классификации изображений',
    color: '#9c27b0' // secondary purple
  }
};

const SystemSettings: React.FC = () => {
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  const [settings, setSettings] = useState<SystemSettingsDTO[]>([]);
  const [groupedSettings, setGroupedSettings] = useState<GroupedSettings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentSetting, setCurrentSetting] = useState<SystemSettingsDTO | null>(null);
  const [settingToDelete, setSettingToDelete] = useState<SystemSettingsDTO | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [transitionCompleted, setTransitionCompleted] = useState(false);
  const [expandedSetting, setExpandedSetting] = useState<string | null>(null);
  
  // Определяем группы настроек
  const settingGroups = ['file_limits', 'user_quotas', 'image_categories'];

  const { 
    control, 
    register, 
    handleSubmit, 
    reset,
    formState: { errors }
  } = useForm<SystemSettingsDTO>();

  // Загрузка настроек при монтировании компонента
  useEffect(() => {
    fetchSettings();
  }, []);

  // Эффект для анимации после загрузки данных
  useEffect(() => {
    if (!loading && settings.length > 0) {
      setTimeout(() => {
        setTransitionCompleted(true);
      }, 300);
    }
  }, [loading, settings]);

  // Форматирование настроек по группам при получении списка настроек
  useEffect(() => {
    if (settings.length > 0) {
      const grouped: GroupedSettings = {};
      
      settings.forEach(setting => {
        if (!grouped[setting.settingGroup]) {
          grouped[setting.settingGroup] = [];
        }
        grouped[setting.settingGroup].push(setting);
      });
      
      setGroupedSettings(grouped);
    }
  }, [settings]);

  // Получение настроек с сервера
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await systemService.getAllSettings();
      setSettings(data);
    } catch (err: any) {
      console.error('Failed to fetch settings:', err);
      setError('Не удалось загрузить настройки системы');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик смены вкладки
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Открыть диалог создания/редактирования настройки
  const handleOpenDialog = (setting: SystemSettingsDTO | null = null) => {
    setCurrentSetting(setting);
    if (setting) {
      reset({
        settingKey: setting.settingKey,
        settingValue: setting.settingValue,
        description: setting.description,
        settingGroup: setting.settingGroup
      });
    } else {
      reset({
        settingKey: '',
        settingValue: '',
        description: '',
        settingGroup: settingGroups[tabValue]
      });
    }
    setOpenDialog(true);
  };

  // Закрыть диалог создания/редактирования настройки
  const handleCloseDialog = () => {
    setCurrentSetting(null);
    setOpenDialog(false);
  };

  // Открыть диалог удаления настройки
  const handleOpenDeleteDialog = (setting: SystemSettingsDTO) => {
    setSettingToDelete(setting);
    setOpenDeleteDialog(true);
  };

  // Закрыть диалог удаления настройки
  const handleCloseDeleteDialog = () => {
    setSettingToDelete(null);
    setOpenDeleteDialog(false);
  };

  // Удаление настройки
  const handleDeleteSetting = async () => {
    if (!settingToDelete) return;
    
    try {
      setLoading(true);
      await systemService.deleteSetting(settingToDelete.settingKey);
      setSettings(settings.filter(s => s.settingKey !== settingToDelete.settingKey));
      setSuccess(`Настройка ${settingToDelete.settingKey} успешно удалена`);
      handleCloseDeleteDialog();
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err: any) {
      console.error('Failed to delete setting:', err);
      setError(`Не удалось удалить настройку: ${err.response?.data?.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  // Сохранение настройки
  const onSubmitForm = async (data: SystemSettingsDTO) => {
    try {
      setLoading(true);
      setError(null);
      
      const savedSetting = await systemService.createOrUpdateSetting(data);
      
      if (currentSetting) {
        // Обновление существующей настройки в списке
        setSettings(settings.map(s => s.settingKey === savedSetting.settingKey ? savedSetting : s));
        setSuccess(`Настройка ${savedSetting.settingKey} успешно обновлена`);
      } else {
        // Добавление новой настройки в список
        setSettings([...settings, savedSetting]);
        setSuccess(`Настройка ${savedSetting.settingKey} успешно создана`);
      }
      
      handleCloseDialog();
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err: any) {
      console.error('Failed to save setting:', err);
      
      if (err.response?.status === 409) {
        setError('Настройка с таким ключом уже существует');
      } else {
        setError(`Не удалось ${currentSetting ? 'обновить' : 'создать'} настройку: ${err.response?.data?.message || 'Неизвестная ошибка'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Форматирование значения настройки для отображения
  const formatSettingValue = (setting: SystemSettingsDTO): string => {
    if (setting.settingKey === 'image_categories') {
      return setting.settingValue.split(',').join(', ');
    }
    
    if (setting.settingKey.includes('file_size')) {
      const sizeInBytes = parseInt(setting.settingValue);
      
      if (sizeInBytes >= 1048576) {
        return `${(sizeInBytes / 1048576).toFixed(2)} МБ`;
      } else if (sizeInBytes >= 1024) {
        return `${(sizeInBytes / 1024).toFixed(2)} КБ`;
      } else {
        return `${sizeInBytes} байт`;
      }
    }
    
    return setting.settingValue;
  };

  // Функция для поиска настроек
  const filterSettings = (settings: SystemSettingsDTO[]): SystemSettingsDTO[] => {
    if (!searchTerm) return settings;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return settings.filter(setting => 
      setting.settingKey.toLowerCase().includes(lowercaseSearch) ||
      setting.settingValue.toLowerCase().includes(lowercaseSearch) ||
      (setting.description && setting.description.toLowerCase().includes(lowercaseSearch))
    );
  };

  // Переключение развернутого состояния настройки
  const toggleSettingExpanded = (settingKey: string) => {
    if (expandedSetting === settingKey) {
      setExpandedSetting(null);
    } else {
      setExpandedSetting(settingKey);
    }
  };

  // Отображение формы редактирования настройки
  const renderSettingForm = () => {
    const isEditing = !!currentSetting;
    
    return (
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
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
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <DialogTitle sx={{ 
            p: 3,
            bgcolor: theme => alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(10px)'
          }}>
            <Typography variant="h6" fontWeight={600}>
              {isEditing ? 'Редактировать настройку' : 'Создать настройку'}
            </Typography>
            <IconButton
              aria-label="close"
              onClick={handleCloseDialog}
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
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid size={{xs: 12}}>
                <TextField
                  label="Ключ настройки"
                  fullWidth
                  disabled={isEditing}
                  error={!!errors.settingKey}
                  helperText={errors.settingKey?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CodeIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '10px' }
                  }}
                  {...register('settingKey', { 
                    required: 'Ключ настройки обязателен' 
                  })}
                />
              </Grid>

              <Grid size={{xs: 12}}>
                <TextField
                  label="Значение настройки"
                  fullWidth
                  error={!!errors.settingValue}
                  helperText={errors.settingValue?.message}
                  InputProps={{
                    sx: { borderRadius: '10px' }
                  }}
                  {...register('settingValue', { 
                    required: 'Значение настройки обязательно'
                  })}
                />
              </Grid>
              
              <Grid size={{xs: 12}}>
                <TextField
                  label="Описание"
                  fullWidth
                  multiline
                  rows={3}
                  InputProps={{
                    sx: { borderRadius: '10px' }
                  }}
                  {...register('description')}
                />
              </Grid>
              
              <Grid size={{xs: 12}}>
                <FormControl fullWidth>
                  <InputLabel id="setting-group-label">Группа настроек</InputLabel>
                  <Controller
                    name="settingGroup"
                    control={control}
                    rules={{ required: 'Выберите группу настроек' }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        labelId="setting-group-label"
                        label="Группа настроек"
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
                                bgcolor: groupMetadata[value as string]?.color || theme.palette.primary.main 
                              }}
                            >
                              {groupMetadata[value as string]?.icon || <SettingsIcon sx={{ fontSize: '1rem' }} />}
                            </Avatar>
                            {groupMetadata[value as string]?.label || value}
                          </Box>
                        )}
                      >
                        {settingGroups.map((group) => (
                          <MenuItem key={group} value={group}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar 
                                sx={{ 
                                  width: 24, 
                                  height: 24, 
                                  mr: 1, 
                                  bgcolor: groupMetadata[group]?.color || theme.palette.primary.main,
                                  '& .MuiSvgIcon-root': { fontSize: '0.8rem' }
                                }}
                              >
                                {groupMetadata[group]?.icon || <SettingsIcon sx={{ fontSize: '1rem' }} />}
                              </Avatar>
                              {groupMetadata[group]?.label || group}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={handleCloseDialog} 
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
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
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
    );
  };

  // Диалог подтверждения удаления настройки
  const renderDeleteDialog = () => {
    return (
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
            Вы уверены, что хотите удалить настройку <Box component="span" sx={{ fontWeight: 'bold' }}>{settingToDelete?.settingKey}</Box>?
            
            {settingToDelete?.description && (
              <Box mt={1} sx={{ fontStyle: 'italic', opacity: 0.8 }}>
                {settingToDelete.description}
              </Box>
            )}
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
            onClick={handleDeleteSetting} 
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
    );
  };

  // Отображение скелета загрузки
  const renderLoadingSkeleton = (groupIndex: number) => (
    <Box sx={{ pt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Skeleton variant="rectangular" width={200} height={40} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={180} height={40} sx={{ borderRadius: 1 }} />
      </Box>
      
      <List>
        {[...Array(3)].map((_, idx) => (
          <ListItem 
            key={idx} 
            divider 
            sx={{ 
              py: 2,
              opacity: 1 - (idx * 0.15)
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, width: '100%', gap: 2 }}>
              <Box sx={{ width: { xs: '100%', md: '40%' } }}>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
              </Box>
              
              <Box sx={{ 
                display: 'flex',
                width: { xs: '100%', md: '60%' },
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Skeleton variant="rectangular" width={120} height={25} sx={{ borderRadius: 1 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Skeleton variant="circular" width={35} height={35} />
                  <Skeleton variant="circular" width={35} height={35} />
                </Box>
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  // Отображение заглушки для пустой группы настроек
  const renderEmptyState = (group: string) => (
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
      <Avatar 
        sx={{ 
          width: 56, 
          height: 56, 
          mb: 2, 
          bgcolor: alpha(groupMetadata[group]?.color || theme.palette.primary.main, 0.1),
          color: groupMetadata[group]?.color || theme.palette.primary.main,
          mx: 'auto',
          transform: 'rotate(10deg)',
          transition: 'all 0.3s',
          '&:hover': {
            transform: 'rotate(-10deg) scale(1.1)'
          }
        }}
      >
        {groupMetadata[group]?.icon || <SettingsIcon />}
      </Avatar>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Нет настроек в этой группе
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {groupMetadata[group]?.description || 'Добавьте новую настройку, нажав на кнопку выше'}
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => handleOpenDialog(null)}
        disabled={loading}
        sx={{ 
          mt: 1,
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 500,
          background: `linear-gradient(90deg, ${groupMetadata[group]?.color || theme.palette.primary.main}, ${alpha(groupMetadata[group]?.color || theme.palette.primary.main, 0.7)})`,
          px: 3,
          py: 1,
          transition: 'all 0.3s',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: `0 8px 15px ${alpha(groupMetadata[group]?.color || theme.palette.primary.main, 0.2)}`
          }
        }}
      >
        Добавить настройку
      </Button>
    </Paper>
  );

  // Если не администратор - запретить доступ
  if (!currentUser || currentUser.role !== 'ADMIN') {
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
          <Alert severity="error">
            У вас нет прав для доступа к настройкам системы
          </Alert>
        </CardContent>
      </Card>
    );
  }

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
      
      {/* Header with title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Настройки системы
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Управление параметрами компрессии и системными лимитами
        </Typography>
      </Box>

      {/* Search Box */}
      <Paper 
        elevation={0} 
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          p: 2,
          mb: 3,
          borderRadius: '16px',
          bgcolor: theme => alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: theme => theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.9)'
            : 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <SearchIcon color="action" sx={{ mr: 1 }} />
        <TextField
          placeholder="Поиск по настройкам..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="standard"
          fullWidth
          InputProps={{
            disableUnderline: true,
          }}
        />
        {searchTerm && (
          <IconButton size="small" onClick={() => setSearchTerm('')}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Paper>
      
      {/* Main content */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: theme => theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.5)'
            : 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          bgcolor: theme => theme.palette.mode === 'light' 
            ? 'rgba(255, 255, 255, 0.9)' 
            : 'rgba(30, 30, 30, 0.7)',
        }}
      >
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: theme => theme.palette.mode === 'light'
              ? alpha(theme.palette.background.paper, 0.8)
              : alpha(theme.palette.background.paper, 0.4),
            backdropFilter: 'blur(10px)',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="settings tabs"
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '1rem',
                textTransform: 'none',
                fontWeight: 500,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.04)
                }
              }
            }}
          >
            {settingGroups.map((group, index) => (
              <Tab 
                key={group} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        bgcolor: groupMetadata[group]?.color || theme.palette.primary.main,
                      }}
                    >
                      {groupMetadata[group]?.icon || <SettingsIcon sx={{ fontSize: '1rem' }} />}
                    </Avatar>
                    <Box component="span">{groupMetadata[group]?.label || group}</Box>
                  </Box>
                }
                {...a11yProps(index)} 
              />
            ))}
          </Tabs>
        </Box>
        
        {settingGroups.map((group, index) => (
          <TabPanel key={group} value={tabValue} index={index}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: alpha(groupMetadata[group]?.color || theme.palette.primary.main, 0.1),
                    color: groupMetadata[group]?.color || theme.palette.primary.main
                  }}
                >
                  {groupMetadata[group]?.icon || <SettingsIcon sx={{ fontSize: '1.2rem' }} />}
                </Avatar>
                {groupMetadata[group]?.label || group}
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                disabled={loading}
                sx={{ 
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 3,
                  py: 1.2,
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                  background: `linear-gradient(90deg, ${groupMetadata[group]?.color || theme.palette.primary.main}, ${alpha(groupMetadata[group]?.color || theme.palette.primary.main, 0.7)})`,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 20px rgba(25, 118, 210, 0.3)`,
                  }
                }}
              >
                Новая настройка
              </Button>
            </Box>
            
            {/* <Fade in={!loading} timeout={500}> */}
              <Box>
                {loading ? (
                  renderLoadingSkeleton(index)
                ) : (
                  searchTerm && !groupedSettings[group]?.some(setting => 
                    setting.settingKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    setting.settingValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (setting.description && setting.description.toLowerCase().includes(searchTerm.toLowerCase()))) ? (
                    <Paper 
                      sx={{ 
                        p: 3, 
                        borderRadius: '12px',
                        mb: 2,
                        bgcolor: theme => alpha(theme.palette.background.paper, 0.6),
                        backdropFilter: 'blur(10px)',
                        textAlign: 'center',
                        border: '1px solid',
                        borderColor: theme => theme.palette.mode === 'light'
                          ? 'rgba(255, 255, 255, 0.9)'
                          : 'rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <Typography color="text.secondary">
                        Нет результатов для "{searchTerm}" в группе {groupMetadata[group]?.label || group}
                      </Typography>
                    </Paper>
                  ) : !groupedSettings[group] || groupedSettings[group].length === 0 ? (
                    renderEmptyState(group)
                  ) : (
                    <List
                      sx={{
                        bgcolor: theme => alpha(theme.palette.background.paper, 0.3),
                        backdropFilter: 'blur(8px)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: theme => theme.palette.mode === 'light'
                          ? 'rgba(255, 255, 255, 0.9)'
                          : 'rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      {filterSettings(groupedSettings[group] || []).map((setting, idx) => (
                        <Fade 
                          key={setting.settingKey} 
                          in={transitionCompleted} 
                          timeout={300 + (idx * 50)}
                          mountOnEnter
                          unmountOnExit
                        >
                          <Box>
                            <ListItem
                              divider={idx < (groupedSettings[group]?.length || 0) - 1}
                              sx={{ 
                                py: 2,
                                px: 3,
                                flexDirection: { xs: 'column', md: 'row' },
                                alignItems: 'flex-start',
                                bgcolor: expandedSetting === setting.settingKey ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                                transition: 'background-color 0.2s ease',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.action.hover, 0.05),
                                },
                                cursor: 'pointer',
                              }}
                              onClick={() => toggleSettingExpanded(setting.settingKey)}
                            >
                              <Box sx={{ 
                                width: '100%',
                                display: 'flex', 
                                flexDirection: { xs: 'column', md: 'row' },
                                alignItems: { xs: 'flex-start', md: 'center' },
                                gap: 2,
                              }}>
                                <Box sx={{ flex: 1, mr: { xs: 0, md: 2 } }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Typography fontWeight="bold" component="span">
                                      {setting.settingKey}
                                    </Typography>
                                    <Chip 
                                      label={setting.settingGroup}
                                      variant="outlined"
                                      size="small"
                                      sx={{ 
                                        height: 20,
                                        fontSize: '0.7rem',
                                        borderRadius: '10px',
                                        bgcolor: alpha(groupMetadata[setting.settingGroup]?.color || theme.palette.primary.main, 0.1),
                                        borderColor: alpha(groupMetadata[setting.settingGroup]?.color || theme.palette.primary.main, 0.3),
                                        color: groupMetadata[setting.settingGroup]?.color || theme.palette.primary.main
                                      }}
                                    />
                                  </Box>
                                  {setting.description && (
                                    <Typography variant="body2" color="text.secondary">
                                      {setting.description}
                                    </Typography>
                                  )}
                                </Box>
                                
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  width: { xs: '100%', md: 'auto' },
                                  justifyContent: { xs: 'space-between', md: 'flex-end' },
                                  gap: 2,
                                  mt: { xs: 1, md: 0 }
                                }}>
                                  <Chip 
                                    label={formatSettingValue(setting)} 
                                    sx={{ 
                                      fontWeight: 500, 
                                      borderRadius: '10px',
                                      maxWidth: '200px',
                                      '.MuiChip-label': {
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }
                                    }}
                                  />
                                  
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <IconButton 
                                      color="primary" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDialog(setting);
                                      }}
                                      disabled={loading}
                                      size="small"
                                      sx={{
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        '&:hover': {
                                          bgcolor: alpha(theme.palette.primary.main, 0.2)
                                        }
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton 
                                      color="error" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDeleteDialog(setting);
                                      }}
                                      disabled={loading}
                                      size="small"
                                      sx={{
                                        bgcolor: alpha(theme.palette.error.main, 0.1),
                                        '&:hover': {
                                          bgcolor: alpha(theme.palette.error.main, 0.2)
                                        }
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSettingExpanded(setting.settingKey);
                                      }}
                                      sx={{
                                        transform: expandedSetting === setting.settingKey ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s ease',
                                        bgcolor: alpha(theme.palette.text.primary, 0.05),
                                        '&:hover': {
                                          bgcolor: alpha(theme.palette.text.primary, 0.1)
                                        }
                                      }}
                                    >
                                      <KeyboardArrowDownIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>
                              </Box>
                            </ListItem>
                            
                            <Collapse in={expandedSetting === setting.settingKey}>
                              <Box sx={{ 
                                p: 3, 
                                pt: 0,
                                bgcolor: alpha(theme.palette.background.paper, 0.4),
                                borderBottom: idx < (groupedSettings[group]?.length || 0) - 1 ? '1px solid' : 'none',
                                borderColor: 'divider'
                              }}>
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid size={{xs: 12, md: 6}}>
                                    <Paper
                                      elevation={0}
                                      sx={{ 
                                        p: 2, 
                                        borderRadius: '10px',
                                        bgcolor: alpha(theme.palette.background.paper, 0.5),
                                        border: '1px solid',
                                        borderColor: theme.palette.divider
                                      }}
                                    >
                                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Информация о настройке
                                      </Typography>
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <Typography variant="body2" color="text.secondary">Ключ:</Typography>
                                          <Typography variant="body2" fontWeight={500}>{setting.settingKey}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <Typography variant="body2" color="text.secondary">Группа:</Typography>
                                          <Chip 
                                            size="small"
                                            label={groupMetadata[setting.settingGroup]?.label || setting.settingGroup}
                                            sx={{ 
                                              height: 20,
                                              fontSize: '0.7rem',
                                              bgcolor: alpha(groupMetadata[setting.settingGroup]?.color || theme.palette.primary.main, 0.1),
                                              color: groupMetadata[setting.settingGroup]?.color || theme.palette.primary.main,
                                            }}
                                          />
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <Typography variant="body2" color="text.secondary">Значение:</Typography>
                                          <Typography variant="body2" fontWeight={500}>{setting.settingValue}</Typography>
                                        </Box>
                                      </Box>
                                    </Paper>
                                  </Grid>
                                  <Grid size={{xs: 12, md: 6}}>
                                    <Paper
                                      elevation={0}
                                      sx={{ 
                                        p: 2, 
                                        borderRadius: '10px',
                                        bgcolor: alpha(theme.palette.background.paper, 0.5),
                                        border: '1px solid',
                                        borderColor: theme.palette.divider,
                                        height: '100%'
                                      }}
                                    >
                                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Описание
                                      </Typography>
                                      <Typography variant="body2">
                                        {setting.description || 'Описание не задано'}
                                      </Typography>
                                    </Paper>
                                  </Grid>
                                </Grid>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenDialog(setting);
                                    }}
                                    sx={{ borderRadius: '8px' }}
                                  >
                                    Редактировать
                                  </Button>
                                </Box>
                              </Box>
                            </Collapse>
                          </Box>
                        </Fade>
                      ))}
                    </List>
                  )
                )}
              </Box>
            {/* </Fade> */}
          </TabPanel>
        ))}
      </Paper>
      
      {/* Dialogs */}
      {renderSettingForm()}
      {renderDeleteDialog()}
    </Box>
  );
};

export default SystemSettings;