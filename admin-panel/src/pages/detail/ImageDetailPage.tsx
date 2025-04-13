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
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Compress as CompressIcon,
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

interface CompressedVersion {
  id: string;
  originalFilename: string;
  size: number;
  compressionLevel: number;
  uploadedAt: string;
  accessCount: number;
}

const ImageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [image, setImage] = useState<ImageDTO | null>(null);
  const [compressedVersions, setCompressedVersions] = useState<Record<string, ImageDTO>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [compressionLevel, setCompressionLevel] = useState<number>(5);
  const [compressing, setCompressing] = useState<boolean>(false);

  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

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

  const loadImageData = async (imageId: string) => {
    setLoading(true);
    setError(null);

    try {
      const imageData = await ImageService.getImageMetadata(imageId);
      setImage(imageData);

      const allImages = await ImageService.getAllImages();

      const compressedImages = Object.values(allImages)
        .filter(img => img.originalImageId === imageId)
        .reduce((acc, img) => ({
          ...acc,
          [img.id]: img
        }), {});

      setCompressedVersions(compressedImages);
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
      const compressedImage = await ImageService.compressImage(id, compressionLevel);

      setCompressedVersions(prev => ({
        ...prev,
        [compressedImage.id]: compressedImage
      }));

      showSnackbar('Изображение успешно сжато!', 'success');
    } catch (error) {
      console.error('Ошибка при сжатии изображения:', error);
      showSnackbar('Ошибка при сжатии изображения', 'error');
    } finally {
      setCompressing(false);
    }
  };

  const confirmDelete = (imageId: string) => {
    setImageToDelete(imageId);
    setOpenDeleteDialog(true);
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      await ImageService.deleteImage(imageToDelete);

      if (imageToDelete === id) {
        showSnackbar('Изображение успешно удалено', 'success');
        setTimeout(() => navigate('/'), 1500);
      } else {
        const updatedVersions = { ...compressedVersions };
        delete updatedVersions[imageToDelete];
        setCompressedVersions(updatedVersions);
        showSnackbar('Сжатая версия успешно удалена', 'success');
      }

      setOpenDeleteDialog(false);
      setImageToDelete(null);
    } catch (error) {
      console.error('Ошибка при удалении изображения:', error);
      showSnackbar('Ошибка при удалении изображения', 'error');
    }
  };

  const handleDownload = async (imageId: string) => {
    try {
      const blob = await ImageService.getImage(imageId, true);
      const filename = imageId === id ? image?.originalFilename : compressedVersions[imageId]?.originalFilename;

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
                onClick={() => handleDownload(image.id)}
              >
                Скачать оригинал
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<DeleteIcon />}
                onClick={() => confirmDelete(image.id)}
              >
                Удалить
              </Button>
            </CardActions>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title="Сжать изображение"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <Box px={2}>
                <Typography gutterBottom>
                  Уровень сжатия: {compressionLevel}
                </Typography>
                <Slider
                  value={compressionLevel}
                  onChange={(_, value) => setCompressionLevel(value as number)}
                  step={1}
                  marks
                  min={0}
                  max={10}
                  valueLabelDisplay="auto"
                />
                <Box mt={1} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Минимальное сжатие</Typography>
                  <Typography variant="body2" color="text.secondary">Максимальное сжатие</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  <strong>0</strong> - минимальное сжатие (высокое качество)<br />
                  <strong>10</strong> - максимальное сжатие (низкое качество)
                </Typography>
              </Box>
            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<CompressIcon />}
                onClick={handleCompress}
                disabled={compressing}
              >
                {compressing ? 'Сжатие...' : 'Сжать'}
              </Button>
            </CardActions>
          </Card>
        </Box>

        <Box sx={{ width: { xs: '100%', md: '33.333%' } }}>
          <Card>
            <CardHeader 
              title="Сжатые версии" 
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              {Object.keys(compressedVersions).length === 0 ? (
                <Alert severity="info">
                  Нет сжатых версий этого изображения
                </Alert>
              ) : (
                <List disablePadding>
                  {Object.values(compressedVersions)
                    .sort((a, b) => a.compressionLevel - b.compressionLevel)
                    .map((version) => (
                      <React.Fragment key={version.id}>
                        <ListItem alignItems="flex-start" disableGutters>
                          <Box width="100%">
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle1">
                                Сжатие: {version.compressionLevel}/10
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(version.uploadedAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Typography variant="body2">
                              Размер: {formatFileSize(version.size)}
                              {' '}({(100 - (version.size * 100 / image.size)).toFixed(1)}% от оригинала)
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Просмотров: {version.accessCount}
                            </Typography>
                            <Box display="flex" gap={1} mt={1}>
                              <Button
                                size="small"
                                variant="outlined"
                                component="a"
                                href={ImageService.getImageUrl(version.id)}
                                target="_blank"
                              >
                                Просмотреть
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleDownload(version.id)}
                              >
                                Скачать
                              </Button>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => confirmDelete(version.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        </ListItem>
                        <Divider sx={{ my: 1 }} />
                      </React.Fragment>
                    ))}
                </List>
              )}
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
            {imageToDelete === id ? (
              <>
                Вы действительно хотите удалить изображение "{image.originalFilename}"? 
                <br /><br />
                <strong>Внимание!</strong> Это действие невозможно отменить. Все сжатые версии изображения также будут удалены.
              </>
            ) : (
              <>
                Вы действительно хотите удалить сжатую версию изображения?
                <br />
                Это действие невозможно отменить.
              </>
            )}
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