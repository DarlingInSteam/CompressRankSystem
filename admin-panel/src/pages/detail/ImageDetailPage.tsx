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
  LinearProgress
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Compress as CompressIcon,
  Refresh as RestoreIcon,
} from '@mui/icons-material';

import ImageService from '../../services/image.service';
import { ImageDTO } from '../../types/api.types';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Байт';
  const k = 1024;
  const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ImageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [image, setImage] = useState<ImageDTO | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  // Update the slider value when the image compression level changes
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

      // If the image has been compressed before, try to get original size
      if (imageData.compressionLevel > 0) {
        try {
          // We'll add a new endpoint to get original size
          const originalSizeData = await ImageService.getOriginalImageSize(imageId);
          setOriginalSize(originalSizeData);
        } catch (err) {
          console.warn('Could not fetch original size:', err);
          // Not critical, we'll just not show the comparison
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
      // Save the current original size before compression if it's the first time
      if (image && image.compressionLevel === 0) {
        setOriginalSize(image.size);
      }
      
      const compressedImage = await ImageService.compressImage(id, compressionLevel);
      
      // Update the image data with the compressed version
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
      
      // Update the image with restored data
      setImage(restoredImage);

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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !image) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Ошибка загрузки
          </Typography>
          <Typography variant="body1">
            {error || 'Изображение не найдено'}
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Вернуться на главную
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Просмотр изображения
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
        >
          Вернуться к списку
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ width: { xs: '100%', md: '66.666%' } }}>
          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title={image.originalFilename}
              subheader={`Загружено: ${new Date(image.uploadedAt).toLocaleString()}`}
            />
            <CardMedia
              component="img"
              sx={{ 
                height: 'auto', 
                maxHeight: '500px',
                objectFit: 'contain',
                bgcolor: 'background.default'
              }}
              image={ImageService.getImageUrl(image.id)}
              alt={image.originalFilename}
            />
            <CardContent>
              <Box display="flex" justifyContent="space-between" flexWrap="wrap">
                <Box>
                  <Typography variant="body1">
                    <strong>Размер:</strong> {formatFileSize(image.size)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Тип:</strong> {image.contentType}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Просмотры:</strong> {image.accessCount}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Сжатие:</strong> {image.compressionLevel}%
                    {image.compressionLevel > 0 && (
                      <Chip 
                        label="Сжато" 
                        color={getCompressionColor(image.compressionLevel)} 
                        size="small" 
                        sx={{ ml: 1 }} 
                      />
                    )}
                    {image.compressionLevel === 0 && (
                      <Chip label="Оригинал" color="info" size="small" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                </Box>
                <Box display="flex" gap={1} alignItems="center">
                  <Chip
                    icon={<VisibilityIcon />}
                    label={`${image.accessCount} просмотров`}
                    variant="outlined"
                  />
                </Box>
              </Box>
            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
              >
                Скачать
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<DeleteIcon />}
                onClick={confirmDelete}
              >
                Удалить
              </Button>
            </CardActions>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title="Управление сжатием изображения"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              {image.compressionLevel > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Изображение сжато с уровнем <strong>{image.compressionLevel}%</strong>.
                  Вы можете изменить уровень сжатия или восстановить оригинал.
                </Alert>
              )}
              
              <Box px={2}>
                <Typography gutterBottom>
                  Уровень сжатия: {compressionLevel}%
                </Typography>
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
                />
                <Box mt={1} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Без сжатия</Typography>
                  <Typography variant="body2" color="text.secondary">Максимальное сжатие</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  <strong>0</strong> - без сжатия (оригинальное качество)<br />
                  <strong>50</strong> - среднее сжатие (баланс качества и размера)<br />
                  <strong>100</strong> - максимальное сжатие (низкое качество)
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ mt: 2 }}>
                <strong>Важно:</strong> Сжатие применяется напрямую к изображению. 
                Оригинал сохраняется в системе и может быть восстановлен в любой момент.
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<CompressIcon />}
                onClick={handleCompress}
                disabled={compressing || (compressionLevel === image.compressionLevel)}
              >
                {compressing ? 'Сжатие...' : 'Применить сжатие'}
              </Button>
              
              {image.compressionLevel > 0 && (
                <Button 
                  variant="outlined" 
                  color="warning"
                  startIcon={<RestoreIcon />}
                  onClick={handleRestore}
                  disabled={restoring}
                >
                  {restoring ? 'Восстановление...' : 'Восстановить оригинал'}
                </Button>
              )}
            </CardActions>
            {(compressing || restoring) && <LinearProgress />}
          </Card>
        </Box>

        <Box sx={{ width: { xs: '100%', md: '33.333%' } }}>
          <Card>
            <CardHeader 
              title="Информация о сжатии" 
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              {image.compressionLevel === 0 ? (
                <Alert severity="info">
                  Это оригинальное изображение без сжатия. Используйте панель слева для применения сжатия.
                </Alert>
              ) : (
                <>
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="body1">
                      Текущий уровень сжатия: <strong>{image.compressionLevel}%</strong>
                    </Typography>
                  </Alert>
                  
                  <Typography variant="h6" gutterBottom>Статистика сжатия</Typography>
                  
                  {originalSize && (
                    <>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Уменьшение размера:</Typography>
                          <Typography variant="h6">
                            {(100 - ((image.size * 100) / originalSize)).toFixed(1)}%
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="body2" color="text.secondary">Сохранено:</Typography>
                          <Typography variant="h6">
                            {formatFileSize(originalSize - image.size)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Сравнение размеров:
                        </Typography>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Typography variant="body2" minWidth={100}>Оригинал:</Typography>
                          <Box flex={1} ml={2}>
                            <LinearProgress 
                              variant="determinate" 
                              value={100} 
                              color="primary"
                              sx={{ height: 10, borderRadius: 1 }}
                            />
                          </Box>
                          <Typography variant="body2" ml={2} minWidth={70} textAlign="right">
                            {formatFileSize(originalSize)}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <Typography variant="body2" minWidth={100}>Сжато:</Typography>
                          <Box flex={1} ml={2}>
                            <LinearProgress 
                              variant="determinate" 
                              value={(image.size * 100) / originalSize} 
                              color="success"
                              sx={{ height: 10, borderRadius: 1 }}
                            />
                          </Box>
                          <Typography variant="body2" ml={2} minWidth={70} textAlign="right">
                            {formatFileSize(image.size)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box>
                        <Typography variant="body2" fontWeight="bold">Эффективность:</Typography>
                        <Typography>
                          {((100 - ((image.size * 100) / originalSize)) / image.compressionLevel).toFixed(2)}x
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          (уменьшение размера в % / уровень сжатия)
                        </Typography>
                      </Box>
                    </>
                  )}
                </>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Рекомендации</Typography>
              <Typography variant="body2" paragraph>
                <strong>10-30%</strong>: Минимальное сжатие, почти незаметное для глаза
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>40-60%</strong>: Хороший баланс размера и качества
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>70-90%</strong>: Значительное сжатие, заметное снижение качества
              </Typography>
              <Typography variant="body2">
                <strong>100%</strong>: Максимальное сжатие, серьезные потери качества
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>
          Подтверждение удаления
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить изображение "{image.originalFilename}"? 
            <br /><br />
            <strong>Внимание!</strong> Это действие невозможно отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Отмена</Button>
          <Button onClick={handleDeleteImage} color="error">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ImageDetailPage;