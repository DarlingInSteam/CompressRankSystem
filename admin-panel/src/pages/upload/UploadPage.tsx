import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  AlertTitle,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Snackbar,
  useTheme,
  alpha,
  Tooltip,
  Card,
  CardContent,
  Chip,
  Grid,
  Zoom,
  Fade,
  Badge,
  Backdrop,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircleOutline as CheckIcon,
  ErrorOutline as ErrorIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  CloudDownload as DownloadIcon,
  Compress as CompressIcon,
  Settings as SettingsIcon,
  HighlightOff as CancelIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Visibility as VisibilityIcon,
  PhotoSizeSelectActual as FileSizeIcon,
  Cached as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ImageService from '../../services/image.service';
import { ImageDTO } from '../../types/api.types';
import QuotaInfo, { QuotaInfoRefType } from '../../components/upload/QuotaInfo';

// Image formats that can be compressed
const COMPRESSIBLE_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];

interface UploadItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  imageId?: string;
  error?: string;
  compressible: boolean;
}

const UploadPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quotaInfoRef = useRef<QuotaInfoRefType>(null);

  // Обновляем счетчики статусов при изменении списка загрузок
  useEffect(() => {
    setSuccessCount(uploadItems.filter(item => item.status === 'success').length);
    setErrorCount(uploadItems.filter(item => item.status === 'error').length);
  }, [uploadItems]);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = ''; // Сброс input для возможности повторной загрузки тех же файлов
    }
  };

  const handleButtonClick = () => {
    // Проверяем квоту перед открытием диалога выбора файлов
    if (quotaInfoRef.current?.canUpload()) {
      fileInputRef.current?.click();
    } else {
      showSnackbar('Достигнут лимит загрузок. Удалите неиспользуемые изображения.', 'error');
    }
  };

  // Функция для показа уведомлений
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleFiles = (files: FileList) => {
    // Проверка квоты перед загрузкой
    const remainingQuota = quotaInfoRef.current?.getRemainingQuota() || 0;
    const maxSizeLimit = quotaInfoRef.current?.getFileSizeLimit() || 10485760; // 10MB по умолчанию
    
    if (remainingQuota <= 0 && remainingQuota !== Number.MAX_SAFE_INTEGER) {
      showSnackbar('Достигнут лимит количества загружаемых изображений.', 'error');
      return;
    }

    const filteredFiles = Array.from(files).filter(file => {
      // Проверка на тип файла
      if (!file.type.startsWith('image/')) {
        return false;
      }
      
      // Проверка на максимальный размер файла
      if (file.size > maxSizeLimit) {
        showSnackbar(`Файл ${file.name} слишком большой (${formatSize(file.size)}). Максимальный размер: ${formatSize(maxSizeLimit)}.`, 'warning');
        return false;
      }
      
      return true;
    });
    
    if (filteredFiles.length === 0) {
      showSnackbar('Нет подходящих изображений для загрузки', 'warning');
      return;
    }
    
    // Ограничиваем количество файлов квотой
    const filesToUpload = filteredFiles.slice(0, remainingQuota === Number.MAX_SAFE_INTEGER ? filteredFiles.length : remainingQuota);
    
    if (filesToUpload.length < filteredFiles.length) {
      showSnackbar(`Будет загружено только ${filesToUpload.length} из ${filteredFiles.length} изображений из-за ограничений квоты.`, 'warning');
    }
    
    const newItems: UploadItem[] = filesToUpload.map(file => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      status: 'pending',
      progress: 0,
      // Проверка, можно ли сжать этот формат
      compressible: COMPRESSIBLE_FORMATS.includes(file.type.toLowerCase())
    }));
    
    setUploadItems(prev => [...prev, ...newItems]);
    
    // Автоматический старт загрузки для новых файлов
    newItems.forEach(item => {
      uploadFile(item);
    });
  };

  const uploadFile = async (item: UploadItem) => {
    setUploadItems(prev => 
      prev.map(i => i.id === item.id ? { ...i, status: 'uploading', progress: 0 } : i)
    );

    try {
      setIsLoading(true);
      
      // Имитация прогресса загрузки
      const progressInterval = setInterval(() => {
        setUploadItems(prev => 
          prev.map(i => {
            if (i.id === item.id && i.progress < 90) {
              return { ...i, progress: i.progress + Math.random() * 10 };
            }
            return i;
          })
        );
      }, 300);

      // Загрузка файла через API
      const uploadedImage: ImageDTO = await ImageService.uploadImage(item.file);
      
      clearInterval(progressInterval);
      
      setUploadItems(prev => 
        prev.map(i => i.id === item.id ? { 
          ...i, status: 'success', progress: 100, imageId: uploadedImage.id 
        } : i)
      );
      
      showSnackbar(`Изображение "${item.file.name}" успешно загружено`, 'success');
      
      // Обновление информации о квотах после успешной загрузки
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      let errorMessage = 'Ошибка загрузки файла';
      
      // Обработка специфических ошибок от API
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setUploadItems(prev => 
        prev.map(i => i.id === item.id ? { 
          ...i, status: 'error', error: errorMessage
        } : i)
      );
      
      showSnackbar(`Ошибка: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = (id: string) => {
    setUploadItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCompressImage = async (imageId?: string) => {
    if (!imageId) return;
    
    try {
      setIsLoading(true);
      showSnackbar('Запуск сжатия изображения...', 'info');
      
      // Запрос на сжатие изображения - уровень сжатия 70 (средний)
      const compressedImage = await ImageService.compressImage(imageId, 70);
      
      showSnackbar('Изображение успешно сжато', 'success');
      
      // Обновляем список
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      let errorMessage = 'Ошибка при сжатии изображения';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showSnackbar(`Ошибка сжатия: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryUpload = (item: UploadItem) => {
    uploadFile(item);
  };

  const handleViewImage = (imageId?: string) => {
    if (imageId) {
      navigate(`/images/${imageId}/view`);
    }
  };
  
  const handleClearCompleted = () => {
    setUploadItems(prev => prev.filter(item => item.status !== 'success'));
  };
  
  const handleClearFailed = () => {
    setUploadItems(prev => prev.filter(item => item.status !== 'error'));
  };

  const handleClearAll = () => {
    setUploadItems([]);
  };
  
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Б';
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 10, pb: 4 }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      
      <Fade in={true} timeout={800}>
        <Box>
          <Typography 
            variant="h3" 
            component="h1" 
            fontWeight={800} 
            sx={{ 
              mb: 1,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px'
            }}
          >
            Загрузка изображений
          </Typography>
          
          <Typography 
            variant="subtitle1" 
            component="p" 
            color="text.secondary" 
            sx={{ mb: 4, maxWidth: '80%' }}
          >
            Загрузите изображения формата JPEG, PNG, WebP, или BMP для хранения и дальнейшей обработки. 
            Поддерживается сжатие для уменьшения размера файлов.
          </Typography>
        </Box>
      </Fade>
      
      {/* Компонент с информацией о лимитах и квотах */}
      <QuotaInfo ref={quotaInfoRef} refreshTrigger={refreshTrigger} />

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Zoom in={true} style={{ transitionDelay: '150ms' }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 5 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: dragActive ? 'primary.main' : alpha(theme.palette.text.secondary, 0.2),
                borderRadius: 4,
                backgroundColor: dragActive 
                  ? alpha(theme.palette.primary.main, 0.05) 
                  : alpha(theme.palette.background.paper, 0.5),
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: alpha(theme.palette.primary.main, 0.7),
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  transform: 'scale(1.01)',
                },
                position: 'relative',
                overflow: 'hidden'
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={handleButtonClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
              
              {/* Фоновый паттерн */}
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0.05,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23${theme.palette.primary.main.slice(1)}' fill-opacity='0.6' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            
              <Box
                sx={{ 
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                  position: 'relative',
                  zIndex: 2
                }}
              >
                <AddPhotoIcon 
                  sx={{ 
                    fontSize: 60, 
                    color: theme.palette.primary.main,
                  }}
                />
              </Box>

              <Typography variant="h5" align="center" gutterBottom fontWeight={600} sx={{ position: 'relative', zIndex: 2 }}>
                Перетащите изображения сюда
              </Typography>

              <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4, position: 'relative', zIndex: 2 }}>
                или нажмите для выбора файлов
              </Typography>

              <Button
                variant="contained"
                size="large"
                disableElevation
                startIcon={<CloudUploadIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleButtonClick();
                }}
                sx={{ 
                  borderRadius: 3, 
                  py: 1.5,
                  px: 4,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  position: 'relative',
                  zIndex: 2,
                  boxShadow: '0 8px 16px ' + alpha(theme.palette.primary.main, 0.3),
                  '&:hover': {
                    boxShadow: '0 10px 20px ' + alpha(theme.palette.primary.main, 0.4),
                  }
                }}
              >
                Выбрать файлы
              </Button>
            </Paper>
          </Zoom>
        </Grid>
        
        <Grid size={{ xs: 12, md: 6 }}>
          <Zoom in={true} style={{ transitionDelay: '300ms' }}>
            <Card 
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 4,
                background: alpha(theme.palette.background.paper, 0.7),
                backdropFilter: 'blur(10px)',
                border: '1px solid',
                borderColor: theme.palette.divider,
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <CardContent sx={{ p: 0, height: '100%' }}>
                <Box sx={{ p: 3, mb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" fontWeight={600}>
                      Информация
                    </Typography>
                    <IconButton color="primary" onClick={() => setRefreshTrigger(prev => prev + 1)}>
                      <RefreshIcon />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Загружайте изображения и управляйте ими прямо здесь. Вы можете сжать изображения для экономии места.
                  </Typography>
                </Box>
                
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Paper
                        elevation={0}
                        sx={{ 
                          p: 2,
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: theme.palette.divider,
                          bgcolor: alpha(theme.palette.success.main, 0.05),
                          height: '100%'
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Успешно загружено
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CheckIcon color="success" sx={{ mr: 1 }} />
                          <Typography variant="h4" fontWeight={700}>
                            {successCount}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                    
                    <Grid size={{ xs: 6 }}>
                      <Paper
                        elevation={0}
                        sx={{ 
                          p: 2,
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: theme.palette.divider,
                          bgcolor: errorCount > 0 ? alpha(theme.palette.error.main, 0.05) : 'transparent',
                          height: '100%'
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Ошибки загрузки
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ErrorIcon color={errorCount > 0 ? "error" : "disabled"} sx={{ mr: 1 }} />
                          <Typography variant="h4" fontWeight={700} color={errorCount > 0 ? "error" : "inherit"}>
                            {errorCount}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  {successCount > 0 && (
                    <Tooltip title="Перейти к просмотру всех изображений">
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        color="primary"
                        onClick={() => navigate('/images')}
                        sx={{ 
                          mt: 3,
                          borderRadius: 3,
                          textTransform: 'none'
                        }}
                        startIcon={<ImageIcon />}
                      >
                        Перейти к моим изображениям
                      </Button>
                    </Tooltip>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      </Grid>

      {uploadItems.length > 0 && (
        <Paper 
          elevation={0}
          sx={{ 
            mt: 4, 
            p: 0, 
            borderRadius: 4,
            background: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: theme.palette.divider,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            p: 3, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}` 
          }}>
            <Typography variant="h5" fontWeight={600}>
              Файлы ({uploadItems.length})
            </Typography>
            
            <Box>
              <Tooltip title="Очистить успешные">
                <IconButton 
                  size="small" 
                  color="success" 
                  onClick={handleClearCompleted}
                  sx={{ mr: 1 }}
                  disabled={successCount === 0}
                >
                  <CheckIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Очистить ошибки">
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={handleClearFailed}
                  sx={{ mr: 1 }}
                  disabled={errorCount === 0}
                >
                  <ErrorIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Очистить список">
                <IconButton size="small" color="primary" onClick={handleClearAll}>
                  <CancelIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <List sx={{ p: 0 }}>
            {uploadItems.map((item, index) => (
              <ListItem
                key={item.id}
                sx={{ 
                  py: 2.5,
                  px: 3,
                  bgcolor: index % 2 === 0 ? 'transparent' : alpha(theme.palette.primary.main, 0.03),
                  borderBottom: index < uploadItems.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none'
                }}
                secondaryAction={
                  <Box>
                    {item.status === 'success' && item.compressible && (
                      <Tooltip title="Сжать изображение">
                        <IconButton
                          edge="end"
                          onClick={() => handleCompressImage(item.imageId)}
                          sx={{ mr: 1 }}
                          color="primary"
                        >
                          <CompressIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {item.status === 'success' && (
                      <Tooltip title="Просмотреть">
                        <IconButton 
                          edge="end" 
                          onClick={() => handleViewImage(item.imageId)}
                          sx={{ mr: 1 }}
                          color="info"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Удалить из списка">
                      <IconButton edge="end" onClick={() => handleRemoveItem(item.id)}>
                        <DeleteIcon color="error" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemIcon sx={{ mr: 1 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 2, 
                    bgcolor: alpha(
                      item.status === 'success' 
                        ? theme.palette.success.main 
                        : item.status === 'error' 
                          ? theme.palette.error.main 
                          : theme.palette.info.main, 
                      0.1
                    ),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.status === 'success' ? (
                      <CheckIcon color="success" />
                    ) : item.status === 'error' ? (
                      <ErrorIcon color="error" />
                    ) : (
                      <ImageIcon color="info" />
                    )}
                  </Box>
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight={500} noWrap>
                      {item.file.name}
                      {item.compressible && (
                        <Chip 
                          label="Сжимаемый" 
                          size="small" 
                          color="info" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 500 }}
                        />
                      )}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" color={
                          item.status === 'success' 
                            ? 'success.main' 
                            : item.status === 'error' 
                              ? 'error.main' 
                              : 'info.main'
                        }>
                          {item.status === 'pending' && 'Ожидание...'}
                          {item.status === 'uploading' && `Загрузка: ${Math.round(item.progress)}%`}
                          {item.status === 'success' && 'Загрузка завершена'}
                          {item.status === 'error' && (item.error || 'Ошибка загрузки')}
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                          <FileSizeIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem', opacity: 0.7 }} />
                          {formatSize(item.file.size)}
                        </Typography>
                      </Box>
                      {item.status === 'uploading' && (
                        <LinearProgress
                          variant="determinate"
                          value={item.progress}
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            bgcolor: alpha(theme.palette.primary.main, 0.15),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                            }
                          }}
                        />
                      )}
                      {item.status === 'error' && (
                        <Button 
                          size="small" 
                          variant="contained"
                          color="warning"
                          disableElevation
                          onClick={() => handleRetryUpload(item)}
                          sx={{ 
                            mt: 1, 
                            borderRadius: 2,
                            textTransform: 'none'
                          }}
                          startIcon={<RefreshIcon />}
                        >
                          Повторить
                        </Button>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Уведомление */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity={snackbarSeverity} 
          sx={{ 
            width: '100%', 
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            borderRadius: 3
          }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UploadPage;