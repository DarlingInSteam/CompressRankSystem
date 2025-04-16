import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardHeader,
  CardActions,
  Container,
  CircularProgress,
  Divider,
  Paper,
  Typography,
  Slider,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  LinearProgress,
  Avatar,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Compress as CompressIcon,
  Refresh as RestoreIcon,
  Info as InfoIcon,
  Check as CheckIcon,
  Share as ShareIcon
} from '@mui/icons-material';

import ImageService from '../../services/image.service';
import { ImageDTO, ImageStatistics } from '../../types/api.types';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Байт';
  const k = 1024;
  const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Функция для сохранения originalSize в localStorage
const saveOriginalSizeToStorage = (imageId: string, size: number) => {
  try {
    const storedSizes = JSON.parse(localStorage.getItem('originalImageSizes') || '{}');
    storedSizes[imageId] = size;
    localStorage.setItem('originalImageSizes', JSON.stringify(storedSizes));
  } catch (error) {
    console.error('Ошибка при сохранении размера в localStorage:', error);
  }
};

// Функция для получения originalSize из localStorage
const getOriginalSizeFromStorage = (imageId: string): number | null => {
  try {
    const storedSizes = JSON.parse(localStorage.getItem('originalImageSizes') || '{}');
    return storedSizes[imageId] || null;
  } catch (error) {
    console.error('Ошибка при чтении размера из localStorage:', error);
    return null;
  }
};

const ImageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [image, setImage] = useState<ImageDTO | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageStatistics, setImageStatistics] = useState<ImageStatistics | null>(null);

  const [compressionLevel, setCompressionLevel] = useState<number>(0);
  const [compressing, setCompressing] = useState<boolean>(false);
  const [restoring, setRestoring] = useState<boolean>(false);

  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    if (id) {
      loadImageData(id);
    }
  }, [id]);

  useEffect(() => {
    if (image) {
      setCompressionLevel(image.compressionLevel);
    }
  }, [image?.compressionLevel]);

  const loadImageData = async (imageId: string) => {
    setLoading(true);
    setError(null);

    try {
      const imageData = await ImageService.getImageMetadata(imageId);
      setImage(imageData);
      console.log('Загружены метаданные изображения:', imageData);

      // Получаем статистику для изображения
      try {
        const statistics = await ImageService.getImageStatisticById(imageId);
        setImageStatistics(statistics);
        console.log('Загружена статистика изображения:', statistics);
      } catch (err) {
        console.warn('Could not fetch image statistics:', err);
        // Продолжаем загрузку даже если статистика недоступна
      }

      // Получаем оригинальный размер, независимо от того, сжато изображение или нет
      // Это гарантирует, что у нас всегда будут данные для расчета статистики
      try {
        // Запрос оригинального размера с сервера
        const originalSizeData = await ImageService.getOriginalImageSize(imageId);
        console.log('Получен оригинальный размер с сервера:', originalSizeData);
        setOriginalSize(originalSizeData);
        // Обновляем значение в localStorage
        saveOriginalSizeToStorage(imageId, originalSizeData);
      } catch (err) {
        console.warn('Не удалось получить оригинальный размер с сервера:', err);
        
        // Пробуем получить из localStorage
        const cachedSize = getOriginalSizeFromStorage(imageId);
        if (cachedSize) {
          console.log(`Используем кэшированный оригинальный размер для ${imageId}: ${cachedSize}`);
          setOriginalSize(cachedSize);
        } else if (imageData.compressionLevel === 0) {
          // Если изображение не сжато, то текущий размер = оригинальный
          console.log(`Изображение не сжато, используем текущий размер как оригинальный: ${imageData.size}`);
          setOriginalSize(imageData.size);
          saveOriginalSizeToStorage(imageId, imageData.size);
        } else {
          // Если изображение сжато и нет данных в localStorage, используем приблизительный расчет
          const estimatedOriginalSize = Math.round(imageData.size / (1 - imageData.compressionLevel / 100));
          console.log(`Используем оценочный оригинальный размер: ${estimatedOriginalSize}`);
          setOriginalSize(estimatedOriginalSize);
          saveOriginalSizeToStorage(imageId, estimatedOriginalSize);
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных изображения:', error);
      setError('Не удалось загрузить данные изображения. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompress = async () => {
    if (!id) return;

    setCompressing(true);
    showSnackbar('Начато сжатие изображения...', 'success');

    try {
      if (image && image.compressionLevel === 0) {
        // Перед сжатием сохраняем оригинальный размер
        setOriginalSize(image.size);
        saveOriginalSizeToStorage(id, image.size);
      }
      
      const compressedImage = await ImageService.compressImage(id, compressionLevel);
      setImage(compressedImage);

      showSnackbar('Изображение успешно сжато!', 'success');
    } catch (error) {
      console.error('Ошибка при сжатии изображения:', error);
      showSnackbar('Ошибка при сжатии изображения', 'error');
    } finally {
      setCompressing(false);
    }
  };

  const handleRestore = async () => {
    if (!id) return;
    
    setRestoring(true);
    showSnackbar('Идёт восстановление изображения...', 'success');

    try {
      const restoredImage = await ImageService.restoreImage(id);
      setImage(restoredImage);
      
      // Очищаем originalSize после восстановления, так как изображение вернулось к оригинальному состоянию
      if (id) {
        setOriginalSize(restoredImage.size);
        saveOriginalSizeToStorage(id, restoredImage.size);
      }

      showSnackbar('Изображение успешно восстановлено до оригинала!', 'success');
    } catch (error) {
      console.error('Ошибка при восстановлении изображения:', error);
      showSnackbar('Ошибка при восстановлении изображения', 'error');
    } finally {
      setRestoring(false);
    }
  };

  const confirmDelete = () => {
    setOpenDeleteDialog(true);
  };

  const handleDeleteImage = async () => {
    if (!id) return;

    try {
      await ImageService.deleteImage(id);
      showSnackbar('Изображение успешно удалено', 'success');
      setTimeout(() => navigate('/'), 1500);
      
      setOpenDeleteDialog(false);
    } catch (error) {
      console.error('Ошибка при удалении изображения:', error);
      showSnackbar('Ошибка при удалении изображения', 'error');
    }
  };

  const handleDownload = async () => {
    if (!id) return;
    
    try {
      const blob = await ImageService.getImage(id, true);
      const filename = image?.originalFilename;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSnackbar('Изображение скачано', 'success');
    } catch (error) {
      console.error('Ошибка при скачивании изображения:', error);
      showSnackbar('Ошибка при скачивании изображения', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const getCompressionColor = (level: number) => {
    if (level === 0) return 'success';
    if (level < 30) return 'info';
    if (level < 70) return 'primary';
    return 'error';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header with back button */}
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 4, 
          p: 3,
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          backgroundColor: theme => theme.palette.mode === 'light' 
            ? 'rgba(255, 255, 255, 0.9)' 
            : 'rgba(66, 66, 66, 0.8)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          border: '1px solid',
          borderColor: theme => theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.4)'
            : 'rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {image?.originalFilename}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: 'text.secondary',
              gap: 2
            }}>
              <Typography variant="body1">
                Загружено: {image && new Date(image.uploadedAt).toLocaleString()}
              </Typography>
              {image && image.compressionLevel > 0 && (
                <Chip 
                  icon={<CompressIcon fontSize="small" />} 
                  label={`Сжато ${image.compressionLevel}%`}
                  color="success"
                  size="small"
                  sx={{ 
                    borderRadius: '50px',
                    fontWeight: 500,
                    background: 'linear-gradient(90deg, #4caf50, #8bc34a)',
                    color: 'white',
                    '& .MuiChip-icon': {
                      color: 'white'
                    }
                  }}
                />
              )}
            </Box>
          </Box>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ 
              borderRadius: '12px', 
              textTransform: 'none',
              fontWeight: 'medium',
              borderWidth: '1.5px',
              px: 3,
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }
            }}
          >
            Вернуться к списку
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2
        }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" color="text.secondary">Загрузка данных...</Typography>
        </Box>
      ) : error ? (
        <Paper 
          sx={{ 
            p: 4, 
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
            backdropFilter: 'blur(8px)',
            backgroundColor: theme => theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.9)' 
              : 'rgba(66, 66, 66, 0.8)',
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            Ошибка загрузки
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {error || 'Изображение не найдено'}
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ 
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 'medium',
              px: 4,
              py: 1.5
            }}
          >
            Вернуться на главную
          </Button>
        </Paper>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Main content column */}
            <Box sx={{ width: { xs: '100%', md: '66.666%' } }}>
              {/* Image preview card */}
              <Paper 
                elevation={0} 
                sx={{ 
                  mb: 3, 
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.08)',
                  border: '1px solid',
                  borderColor: theme => theme.palette.mode === 'light'
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(255, 255, 255, 0.1)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 14px 40px 0 rgba(0,0,0,0.12)'
                  }
                }}
              >
                <Box sx={{ 
                  p: 3, 
                  pb: 2, 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography 
                    variant="h6" 
                    fontWeight="medium"
                    sx={{
                      background: theme.palette.mode === 'dark' 
                        ? 'linear-gradient(90deg, #e3f2fd, #bbdefb)' 
                        : 'linear-gradient(90deg, #1976d2, #42a5f5)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      display: 'inline-block'
                    }}
                  >
                    Предпросмотр
                  </Typography>
                  {image && (
                    <Chip 
                      label={image.contentType}
                      variant="outlined"
                      size="small"
                      sx={{ borderRadius: '8px' }}
                    />
                  )}
                </Box>
                <Box 
                  sx={{ 
                    bgcolor: theme => theme.palette.mode === 'light'
                      ? 'rgba(240, 240, 240, 0.5)'
                      : 'rgba(30, 30, 30, 0.6)',
                    p: { xs: 2, md: 3 },
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '300px',
                    borderTop: '1px solid',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    backdropFilter: 'blur(5px)'
                  }}
                >
                  {image && (
                    <Box
                      component="img"
                      sx={{ 
                        maxHeight: '500px',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        borderRadius: '8px',
                        transition: 'transform 0.5s ease',
                        '&:hover': {
                          transform: 'scale(1.02)'
                        }
                      }}
                      src={ImageService.getImageUrl(image.id)}
                      alt={image.originalFilename}
                    />
                  )}
                </Box>
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: '12px', 
                        bgcolor: theme => 
                          alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.05 : 0.15),
                        height: '100%'
                      }}>
                        <Typography variant="body2" color="text.secondary">Размер файла</Typography>
                        <Typography variant="body1" fontWeight="medium" sx={{ mt: 0.5 }}>
                          {image && formatFileSize(image.size)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: '12px', 
                        bgcolor: theme => 
                          alpha(theme.palette.info.main, theme.palette.mode === 'light' ? 0.05 : 0.15),
                        height: '100%'
                      }}>
                        <Typography variant="body2" color="text.secondary">Тип файла</Typography>
                        <Typography variant="body1" fontWeight="medium" sx={{ mt: 0.5 }}>
                          {image && image.contentType.split('/')[1].toUpperCase()}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: '12px', 
                        bgcolor: theme => 
                          alpha(theme.palette.secondary.main, theme.palette.mode === 'light' ? 0.05 : 0.15),
                        height: '100%'
                      }}>
                        <Typography variant="body2" color="text.secondary">Просмотры</Typography>
                        <Typography variant="body1" fontWeight="medium" sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                          <VisibilityIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                          {image && image.accessCount}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: '12px', 
                        bgcolor: theme => 
                          alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.05 : 0.15),
                        height: '100%'
                      }}>
                        <Typography variant="body2" color="text.secondary">Скачивания</Typography>
                        <Typography variant="body1" fontWeight="medium" sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                          <DownloadIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                          {imageStatistics ? imageStatistics.downloadCount : 0}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: '12px', 
                        bgcolor: theme => 
                          alpha(theme.palette.success.main, theme.palette.mode === 'light' ? 0.05 : 0.15),
                        height: '100%'
                      }}>
                        <Typography variant="body2" color="text.secondary">Статус сжатия</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          {image && (
                            <Chip 
                              label={image.compressionLevel > 0 ? `Сжато ${image.compressionLevel}%` : "Оригинал"} 
                              color={getCompressionColor(image.compressionLevel)}
                              size="small"
                              sx={{ fontWeight: 'medium', fontSize: '0.75rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button 
                      variant="contained" 
                      startIcon={<DownloadIcon />}
                      onClick={handleDownload}
                      sx={{ 
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 'medium',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                        transition: 'all 0.3s',
                        px: 3,
                        py: 1.2,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
                          background: 'linear-gradient(45deg, #1565c0, #1976d2)'
                        }
                      }}
                    >
                      Скачать
                    </Button>
                    
                    <Button 
                      variant="outlined" 
                      color="error" 
                      startIcon={<DeleteIcon />}
                      onClick={confirmDelete}
                      sx={{ 
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 'medium',
                        borderWidth: '1.5px',
                        px: 3,
                        py: 1.2,
                        transition: 'all 0.3s',
                        '&:hover': {
                          backgroundColor: 'rgba(211, 47, 47, 0.04)',
                          borderColor: 'error.main',
                          borderWidth: '1.5px',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(211, 47, 47, 0.15)'
                        }
                      }}
                    >
                      Удалить
                    </Button>
                    
                    <Tooltip title="Поделиться изображением">
                      <IconButton 
                        sx={{ 
                          ml: 'auto', 
                          bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
                          '&:hover': { 
                            bgcolor: theme => alpha(theme.palette.primary.main, 0.2) 
                          }
                        }}
                      >
                        <ShareIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Paper>

              {/* Compression controls card */}
              <Paper 
                elevation={0} 
                sx={{ 
                  mb: 3, 
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: theme => theme.palette.mode === 'light'
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(255, 255, 255, 0.1)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 14px 40px 0 rgba(0,0,0,0.12)'
                  }
                }}
              >
                <Box sx={{ 
                  p: 3, 
                  pb: 2, 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      sx={{
                        bgcolor: theme => theme.palette.mode === 'light' 
                          ? 'rgba(46, 125, 50, 0.1)' 
                          : 'rgba(46, 125, 50, 0.3)',
                        color: 'success.main',
                        mr: 2
                      }}
                    >
                      <CompressIcon />
                    </Avatar>
                    <Typography 
                      variant="h6" 
                      fontWeight="medium"
                      sx={{
                        background: theme.palette.mode === 'dark' 
                          ? 'linear-gradient(90deg, #e8f5e9, #c8e6c9)' 
                          : 'linear-gradient(90deg, #2e7d32, #66bb6a)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        display: 'inline-block'
                      }}
                    >
                      Управление сжатием
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ px: 3, pt: 3, pb: 2 }}>
                  {image && image.compressionLevel > 0 && (
                    <Alert 
                      severity="info" 
                      icon={<InfoIcon fontSize="inherit" />}
                      sx={{ 
                        mb: 3,
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                        animation: 'fadeIn 0.5s ease-in-out',
                        '@keyframes fadeIn': {
                          '0%': { opacity: 0, transform: 'translateY(-10px)' },
                          '100%': { opacity: 1, transform: 'translateY(0)' }
                        }
                      }}
                    >
                      Изображение сжато с уровнем <strong>{image.compressionLevel}%</strong>.
                      Вы можете изменить уровень сжатия или восстановить оригинал.
                    </Alert>
                  )}
                  
                  <Box px={2}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mb: 1.5
                    }}>
                      <Typography fontWeight="medium">
                        Уровень сжатия
                      </Typography>
                      <Chip 
                        label={`${compressionLevel}%`}
                        color={getCompressionColor(compressionLevel)}
                        size="small"
                        sx={{ 
                          minWidth: '60px', 
                          fontWeight: 'medium',
                          transition: 'all 0.3s ease',
                          borderRadius: '8px',
                          boxShadow: compressionLevel > 0 
                            ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                            : 'none'
                        }}
                      />
                    </Box>
                    
                    <Slider
                      value={compressionLevel}
                      onChange={(_, value) => setCompressionLevel(value as number)}
                      step={1}
                      marks={[
                        { value: 0, label: '0' },
                        { value: 25, label: '25' },
                        { value: 50, label: '50' },
                        { value: 75, label: '75' },
                        { value: 100, label: '100' }
                      ]}
                      min={0}
                      max={100}
                      valueLabelDisplay="auto"
                      color={getCompressionColor(compressionLevel)}
                      sx={{ 
                        '& .MuiSlider-markLabel': { 
                          fontSize: '0.75rem',
                          color: 'text.secondary'
                        },
                        '& .MuiSlider-thumb': {
                          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                          '&:hover': {
                            boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`
                          },
                          '&:active': {
                            transform: 'scale(1.2)'
                          }
                        },
                        '& .MuiSlider-rail': {
                          opacity: 0.3
                        }
                      }}
                    />
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      mt: 1, 
                      color: 'text.secondary',
                      fontSize: '0.75rem'
                    }}>
                      <Typography variant="caption">Без сжатия</Typography>
                      <Typography variant="caption">Максимальное сжатие</Typography>
                    </Box>
                    
                    <Paper 
                      elevation={0}
                      sx={{ 
                        mt: 3, 
                        p: 2.5,
                        borderRadius: '12px',
                        bgcolor: theme => theme.palette.mode === 'light'
                          ? alpha(theme.palette.info.main, 0.05)
                          : alpha(theme.palette.info.main, 0.2),
                        border: '1px solid',
                        borderColor: theme => theme.palette.mode === 'light'
                          ? alpha(theme.palette.info.main, 0.2)
                          : alpha(theme.palette.info.main, 0.3)
                      }}
                    >
                      <Typography variant="body2" component="div">
                        <Box component="span" sx={{ fontWeight: 'bold', mr: 1, color: 'info.main' }}>0%:</Box>
                        без сжатия (оригинальное качество)
                      </Typography>
                      <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                        <Box component="span" sx={{ fontWeight: 'bold', mr: 1, color: 'primary.main' }}>50%:</Box>
                        среднее сжатие (баланс качества и размера)
                      </Typography>
                      <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                        <Box component="span" sx={{ fontWeight: 'bold', mr: 1, color: 'error.main' }}>100%:</Box>
                        максимальное сжатие (низкое качество)
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
                
                <Box sx={{ px: 3, pb: 3 }}>
                  <Alert 
                    severity="warning" 
                    variant="outlined"
                    icon={<InfoIcon />}
                    sx={{ 
                      mt: 2,
                      borderRadius: '12px',
                      borderWidth: '1.5px',
                      '& .MuiAlert-icon': {
                        alignItems: 'center'
                      }
                    }}
                  >
                    <Typography variant="body2">
                      <strong>Важно:</strong> Сжатие применяется напрямую к изображению. 
                      Оригинал сохраняется в системе и может быть восстановлен в любой момент.
                    </Typography>
                  </Alert>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    p: 3, 
                    pt: 0,
                    borderTop: compressing || restoring ? '1px solid' : 'none',
                    borderColor: 'divider'
                  }}
                >
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={compressing ? <CircularProgress size={16} color="inherit" /> : <CompressIcon />}
                    onClick={handleCompress}
                    disabled={!!compressing || !!(image && compressionLevel === image.compressionLevel)}
                    sx={{ 
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 'medium',
                      background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                      transition: 'all 0.3s',
                      px: 3,
                      py: 1.2,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
                        background: 'linear-gradient(45deg, #1565c0, #1976d2)'
                      },
                      '&.Mui-disabled': {
                        background: theme => theme.palette.mode === 'light'
                          ? alpha(theme.palette.primary.main, 0.3)
                          : alpha(theme.palette.primary.main, 0.2)
                      }
                    }}
                  >
                    {compressing ? 'Сжатие...' : 'Применить сжатие'}
                  </Button>
                  
                  {image && image.compressionLevel > 0 && (
                    <Button 
                      variant="outlined" 
                      color="warning"
                      startIcon={restoring ? <CircularProgress size={16} color="inherit" /> : <RestoreIcon />}
                      onClick={handleRestore}
                      disabled={restoring}
                      sx={{ 
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 'medium',
                        borderWidth: '1.5px',
                        transition: 'all 0.3s',
                        '&:hover': {
                          borderWidth: '1.5px',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      {restoring ? 'Восстановление...' : 'Восстановить оригинал'}
                    </Button>
                  )}
                </Box>
                
                {(compressing || restoring) && (
                  <LinearProgress 
                    sx={{ 
                      height: '4px',
                      borderBottomLeftRadius: '16px',
                      borderBottomRightRadius: '16px'
                    }}
                  />
                )}
              </Paper>
            </Box>

            {/* Sidebar column */}
            <Box sx={{ width: { xs: '100%', md: '33.333%' } }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.08)',
                  border: '1px solid',
                  borderColor: theme => theme.palette.mode === 'light'
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(255, 255, 255, 0.1)',
                  height: '100%',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 14px 40px 0 rgba(0,0,0,0.12)'
                  }
                }}
              >
                <Box sx={{ 
                  p: 3, 
                  pb: 2, 
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Typography 
                    variant="h6" 
                    fontWeight="medium"
                    sx={{
                      background: theme.palette.mode === 'dark' 
                        ? 'linear-gradient(90deg, #e8f5e9, #c8e6c9)' 
                        : 'linear-gradient(90deg, #2e7d32, #66bb6a)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      display: 'inline-block'
                    }}
                  >
                    Информация о сжатии
                  </Typography>
                </Box>
                
                <Box sx={{ px: 3, py: 2.5 }}>
                  {image && image.compressionLevel === 0 ? (
                    <Alert 
                      severity="info"
                      sx={{ 
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                        '& .MuiAlert-icon': {
                          alignItems: 'flex-start',
                          py: 1
                        }
                      }}
                    >
                      Это оригинальное изображение без сжатия. Используйте панель слева для применения сжатия.
                    </Alert>
                  ) : (
                    <>
                      <Alert 
                        severity="success" 
                        icon={<CheckIcon fontSize="inherit" />}
                        sx={{ 
                          mb: 3,
                          borderRadius: '12px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                          animation: 'pulse 1.5s infinite',
                          '@keyframes pulse': {
                            '0%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.4)' },
                            '70%': { boxShadow: '0 0 0 6px rgba(76, 175, 80, 0)' },
                            '100%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)' }
                          }
                        }}
                      >
                        <Typography variant="body1" fontWeight="medium">
                          {image && `Текущий уровень сжатия: ${image.compressionLevel}%`}
                        </Typography>
                      </Alert>
                      
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Статистика сжатия</Typography>
                      
                      {originalSize && image && (
                        <>
                          <Box 
                            sx={{ 
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: 2,
                              my: 2,
                              p: 2.5,
                              borderRadius: '12px',
                              bgcolor: theme => alpha(theme.palette.success.main, theme.palette.mode === 'light' ? 0.05 : 0.15),
                              border: '1px solid',
                              borderColor: theme => alpha(theme.palette.success.main, theme.palette.mode === 'light' ? 0.1 : 0.2)
                            }}
                          >
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Уменьшение размера
                              </Typography>
                              <Typography 
                                variant="h5" 
                                fontWeight="bold" 
                                color="success.main"
                                sx={{
                                  background: 'linear-gradient(90deg, #4caf50, #8bc34a)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  display: 'inline-block'
                                }}
                              >
                                {(100 - ((image.size * 100) / originalSize)).toFixed(1)}%
                              </Typography>
                            </Box>
                            
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Сохранено места
                              </Typography>
                              <Typography 
                                variant="h5" 
                                fontWeight="bold" 
                                color="success.main"
                                sx={{
                                  background: 'linear-gradient(90deg, #4caf50, #8bc34a)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  display: 'inline-block'
                                }}
                              >
                                {formatFileSize(originalSize - image.size)}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Divider sx={{ my: 3 }} />
                          
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            Сравнение размеров:
                          </Typography>
                          
                          <Box sx={{ mb: 3 }}>
                            <Box display="flex" alignItems="center" mb={1.5}>
                              <Typography variant="body2" color="text.secondary" minWidth={100}>Оригинал:</Typography>
                              <Box flex={1} ml={2}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={100} 
                                  color="primary"
                                  sx={{ 
                                    height: 10, 
                                    borderRadius: '5px',
                                    backgroundColor: theme => alpha(theme.palette.primary.main, 0.1)
                                  }}
                                />
                              </Box>
                              <Typography variant="body2" ml={2} minWidth={80} textAlign="right" fontWeight="medium">
                                {formatFileSize(originalSize)}
                              </Typography>
                            </Box>
                            
                            <Box display="flex" alignItems="center">
                              <Typography variant="body2" color="text.secondary" minWidth={100}>Сжато:</Typography>
                              <Box flex={1} ml={2}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={(image.size * 100) / originalSize} 
                                  color="success"
                                  sx={{ 
                                    height: 10, 
                                    borderRadius: '5px',
                                    backgroundColor: theme => alpha(theme.palette.success.main, 0.1),
                                    '& .MuiLinearProgress-bar': {
                                      background: 'linear-gradient(90deg, #4caf50, #8bc34a)',
                                      transition: 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }
                                  }}
                                />
                              </Box>
                              <Typography variant="body2" ml={2} minWidth={80} textAlign="right" fontWeight="medium">
                                {formatFileSize(image.size)}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Divider sx={{ my: 3 }} />
                          
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              Эффективность сжатия:
                            </Typography>
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                mt: 1,
                                p: 2,
                                borderRadius: '12px',
                                bgcolor: theme => alpha(theme.palette.success.main, theme.palette.mode === 'light' ? 0.08 : 0.2),
                              }}
                            >
                              <Typography 
                                variant="h4" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  background: 'linear-gradient(90deg, #4caf50, #8bc34a)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  mr: 1,
                                  animation: 'fadeScale 1s ease-out',
                                  '@keyframes fadeScale': {
                                    '0%': { opacity: 0, transform: 'scale(0.8)' },
                                    '100%': { opacity: 1, transform: 'scale(1)' }
                                  }
                                }}
                              >
                                {((100 - ((image.size * 100) / originalSize)) / image.compressionLevel).toFixed(2)}x
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                коэффициент
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              (уменьшение размера в % / уровень сжатия)
                            </Typography>
                          </Box>
                        </>
                      )}
                    </>
                  )}
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Рекомендации по сжатию</Typography>
                  
                  <Box 
                    sx={{ 
                      mt: 2,
                      p: 2.5,
                      borderRadius: '12px',
                      bgcolor: theme => theme.palette.mode === 'light'
                        ? alpha(theme.palette.info.main, 0.05)
                        : alpha(theme.palette.info.main, 0.15),
                      border: '1px solid',
                      borderColor: theme => theme.palette.mode === 'light'
                        ? alpha(theme.palette.info.main, 0.1)
                        : alpha(theme.palette.info.main, 0.2)
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Box 
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: 'success.light',
                          mr: 1.5
                        }}
                      />
                      <Typography variant="body2">
                        <strong>10-30%</strong>: Минимальное сжатие, почти незаметное для глаза
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Box 
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: 'info.light',
                          mr: 1.5
                        }}
                      />
                      <Typography variant="body2">
                        <strong>40-60%</strong>: Хороший баланс размера и качества
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Box 
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: 'warning.light',
                          mr: 1.5
                        }}
                      />
                      <Typography variant="body2">
                        <strong>70-90%</strong>: Значительное сжатие, заметное снижение качества
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: 'error.light',
                          mr: 1.5
                        }}
                      />
                      <Typography variant="body2">
                        <strong>100%</strong>: Максимальное сжатие, серьезные потери качества
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
          
          {/* Delete Confirmation Dialog */}
          <Dialog
            open={openDeleteDialog}
            onClose={() => setOpenDeleteDialog(false)}
            PaperProps={{
              sx: {
                borderRadius: '16px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                backdropFilter: 'blur(10px)',
                background: theme => theme.palette.mode === 'light' 
                  ? 'rgba(255, 255, 255, 0.9)' 
                  : 'rgba(40, 40, 40, 0.9)',
                border: '1px solid',
                borderColor: theme => theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.5)'
                  : 'rgba(255, 255, 255, 0.05)',
                overflow: 'hidden'
              }
            }}
          >
            <DialogTitle 
              sx={{ 
                fontWeight: 'medium',
                borderBottom: '1px solid',
                borderColor: 'divider',
                p: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <DeleteIcon color="error" />
              Подтверждение удаления
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <DialogContentText sx={{ mb: 2 }}>
                {image && `Вы действительно хотите удалить изображение "${image.originalFilename}"?`}
              </DialogContentText>
              <Box 
                sx={{ 
                  mt: 2,
                  p: 2,
                  bgcolor: alpha(theme.palette.error.main, theme.palette.mode === 'light' ? 0.1 : 0.25),
                  color: 'error.main',
                  borderRadius: '12px',
                  fontWeight: 'medium',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.error.main, 0.3),
                  animation: 'pulse-error 2s infinite',
                  '@keyframes pulse-error': {
                    '0%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.4)' },
                    '70%': { boxShadow: '0 0 0 6px rgba(211, 47, 47, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0)' }
                  }
                }}
              >
                <Typography variant="body2" fontWeight="medium">
                  <strong>Внимание!</strong> Это действие невозможно отменить.
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
              <Button 
                onClick={() => setOpenDeleteDialog(false)}
                sx={{ 
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 'medium',
                  px: 3
                }}
              >
                Отмена
              </Button>
              <Button 
                onClick={handleDeleteImage} 
                color="error"
                variant="contained"
                sx={{ 
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 'medium',
                  px: 3,
                  background: 'linear-gradient(45deg, #d32f2f, #f44336)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 15px rgba(211, 47, 47, 0.3)',
                    background: 'linear-gradient(45deg, #c62828, #e53935)'
                  }
                }}
              >
                Удалить
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(8px)',
            backgroundColor: theme => alpha(
              theme.palette[snackbar.severity === 'success' ? 'success' : 'error'].main, 
              theme.palette.mode === 'light' ? 0.9 : 0.8
            ),
            border: '1px solid',
            borderColor: theme => alpha(
              theme.palette[snackbar.severity === 'success' ? 'success' : 'error'].main, 
              0.2
            ),
          }}
          icon={snackbar.severity === 'success' ? <CheckIcon /> : undefined}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ImageDetailPage;