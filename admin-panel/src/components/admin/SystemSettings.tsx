import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { systemService } from '../../services/system.service';
import { SystemSettingsDTO } from '../../types/api.types';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
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
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const SystemSettings: React.FC = () => {
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
  
  // Определяем группы настроек
  const settingGroups = ['file_limits', 'user_quotas', 'image_categories'];
  const groupLabels: Record<string, string> = {
    'file_limits': 'Лимиты файлов',
    'user_quotas': 'Квоты пользователей',
    'image_categories': 'Категории изображений'
  };

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

  // Отображение формы редактирования настройки
  const renderSettingForm = () => {
    const isEditing = !!currentSetting;
    
    return (
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <DialogTitle>
            {isEditing ? 'Редактировать настройку' : 'Создать настройку'}
            <IconButton
              aria-label="close"
              onClick={handleCloseDialog}
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
                  label="Ключ настройки"
                  fullWidth
                  margin="normal"
                  disabled={isEditing}
                  error={!!errors.settingKey}
                  helperText={errors.settingKey?.message}
                  {...register('settingKey', { 
                    required: 'Ключ настройки обязателен' 
                  })}
                />
              </Grid>

              <Grid component={"div"} container spacing={12}>
                <TextField
                  label="Значение настройки"
                  fullWidth
                  margin="normal"
                  error={!!errors.settingValue}
                  helperText={errors.settingValue?.message}
                  {...register('settingValue', { 
                    required: 'Значение настройки обязательно'
                  })}
                />
              </Grid>
              
              <Grid component={"div"} container spacing={12}>
                <TextField
                  label="Описание"
                  fullWidth
                  margin="normal"
                  {...register('description')}
                />
              </Grid>
              
              <Grid component={"div"} container spacing={12}>
                <FormControl fullWidth margin="normal">
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
                      >
                        {settingGroups.map((group) => (
                          <MenuItem key={group} value={group}>
                            {groupLabels[group] || group}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading}>Отмена</Button>
            <Button 
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
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
      >
        <DialogTitle>
          Подтвердите удаление
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить настройку {settingToDelete?.settingKey}?
            Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={loading}>Отмена</Button>
          <Button 
            onClick={handleDeleteSetting} 
            color="error" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Если не администратор - запретить доступ
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            У вас нет прав для доступа к настройкам системы
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Настройки системы"
        titleTypographyProps={{ variant: 'h6' }}
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
        
        <Paper>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="settings tabs"
              indicatorColor="primary"
              textColor="primary"
            >
              {settingGroups.map((group, index) => (
                <Tab 
                  key={group} 
                  label={groupLabels[group] || group} 
                  {...a11yProps(index)} 
                />
              ))}
            </Tabs>
          </Box>
          
          {settingGroups.map((group, index) => (
            <TabPanel key={group} value={tabValue} index={index}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  disabled={loading}
                >
                  Новая настройка
                </Button>
              </Box>
              
              {loading && !groupedSettings[group] ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {groupedSettings[group]?.length > 0 ? (
                    groupedSettings[group].map((setting) => (
                      <ListItem
                        key={setting.settingKey}
                        divider
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'flex-start',
                          flexDirection: { xs: 'column', md: 'row' }
                        }}
                      >
                        <ListItemText
                          primary={setting.settingKey}
                          secondary={setting.description || 'Нет описания'}
                          primaryTypographyProps={{ fontWeight: 'bold' }}
                          sx={{ flex: 1, mr: 2, mb: { xs: 1, md: 0 } }}
                        />
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          width: { xs: '100%', md: 'auto' },
                          justifyContent: { xs: 'space-between', md: 'flex-end' }
                        }}>
                          <Typography sx={{ mr: 2, color: 'text.secondary' }}>
                            {formatSettingValue(setting)}
                          </Typography>
                          <Box>
                            <IconButton 
                              color="primary" 
                              onClick={() => handleOpenDialog(setting)}
                              disabled={loading}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              color="error" 
                              onClick={() => handleOpenDeleteDialog(setting)}
                              disabled={loading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </ListItem>
                    ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="textSecondary">
                        Нет настроек в этой группе
                      </Typography>
                    </Box>
                  )}
                </List>
              )}
            </TabPanel>
          ))}
        </Paper>
      </CardContent>
      
      {/* Диалоги */}
      {renderSettingForm()}
      {renderDeleteDialog()}
    </Card>
  );
};

export default SystemSettings;