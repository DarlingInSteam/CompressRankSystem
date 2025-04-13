import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  GetApp as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

// Импортируем сервисы и типы
import ImageService from '../../services/image.service';
import { ImageDTO, SortType, DateFilterType, SizeFilterType } from '../../types/api.types';

// Форматирование размера файла
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Байт';
  const k = 1024;
  const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Создаем интерфейс для статистики изображения для внутреннего использования
interface ImageStats {
  viewCount: number;
  downloadCount: number;
  popularityScore: number;
}

const HomePage: React.FC = () => {
  const [images, setImages] = useState<Record<string, ImageDTO>>({});
  const [statistics, setStatistics] = useState<Record<string, ImageStats>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortType>('uploadedAt');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('');
  const [sizeFilter, setSizeFilter] = useState<SizeFilterType>('');
  
  // Состояния для диалогов и уведомлений
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [openRenameDialog, setOpenRenameDialog] = useState(false);
  const [imageToRename, setImageToRename] = useState<ImageDTO | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    // Загрузка данных
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      // Получаем все изображения
      const imagesData = await ImageService.getAllImages();
      
      // Создаем статистику с нулевыми значениями для каждого изображения
      const statsMap: Record<string, ImageStats> = {};
      
      // Обработка полученных изображений
      Object.entries(imagesData).forEach(([id, image]) => {
        // Простая статистика для каждого изображения
        statsMap[id] = {
          viewCount: image.accessCount || 0,
          downloadCount: 0,
          popularityScore: image.accessCount || 0
        };
      });
      
      setImages(imagesData);
      setStatistics(statsMap);
    } catch (error) {
      console.error('Ошибка при загрузке изображений:', error);
      showSnackbar('Ошибка при загрузке данных', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Функция для показа уведомлений
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  // Обработка поиска и фильтрации
  const handleSearch = () => {
    loadImages();
    // В будущем можно реализовать фильтрацию по поисковому запросу
  };

  // Функция фильтрации изображений
  const filteredAndSortedImages = () => {
    // Фильтрация по originalImageId === null (только исходные изображения)
    let filtered = Object.values(images).filter(img => img.originalImageId === null);

    // Сортировка в соответствии с выбранным параметром
    switch (sortBy) {
      case 'views':
        return filtered.sort((a, b) => {
          const statsA = statistics[a.id]?.viewCount || 0;
          const statsB = statistics[b.id]?.viewCount || 0;
          return statsB - statsA;
        });
      case 'downloads':
        return filtered.sort((a, b) => {
          const statsA = statistics[a.id]?.downloadCount || 0;
          const statsB = statistics[b.id]?.downloadCount || 0;
          return statsB - statsA;
        });
      case 'popularity':
        return filtered.sort((a, b) => {
          const statsA = statistics[a.id]?.popularityScore || 0;
          const statsB = statistics[b.id]?.popularityScore || 0;
          return statsB - statsA;
        });
      case 'size_asc':
        return filtered.sort((a, b) => a.size - b.size);
      case 'size_desc':
        return filtered.sort((a, b) => b.size - a.size);
      case 'uploadedAt':
      default:
        return filtered.sort((a, b) => 
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
    }
  };

  // Открытие диалога удаления
  const openDeleteConfirmation = (id: string) => {
    setImageToDelete(id);
    setOpenDeleteDialog(true);
  };

  // Отмена удаления
  const cancelDelete = () => {
    setOpenDeleteDialog(false);
    setImageToDelete(null);
  };

  // Выполнение удаления изображения
  const handleDeleteImage = async () => {
    if (!imageToDelete) return;
    
    try {
      await ImageService.deleteImage(imageToDelete);
      
      // Удаляем изображение из состояния
      const updatedImages = {...images};
      delete updatedImages[imageToDelete];
      setImages(updatedImages);
      
      // Закрываем диалог и показываем успешное уведомление
      setOpenDeleteDialog(false);
      setImageToDelete(null);
      showSnackbar('Изображение успешно удалено', 'success');
    } catch (error) {
      console.error('Ошибка при удалении изображения:', error);
      showSnackbar('Ошибка при удалении изображения', 'error');
    }
  };

  // Открытие диалога переименования
  const handleOpenRenameDialog = (image: ImageDTO) => {
    setImageToRename(image);
    setNewName(image.originalFilename);
    setOpenRenameDialog(true);
  };

  // Отмена переименования
  const cancelRename = () => {
    setOpenRenameDialog(false);
    setImageToRename(null);
    setNewName('');
  };

  // Выполнение переименования
  const handleRenameImage = async () => {
    if (!imageToRename || !newName) return;
    
    try {
      // Так как у нас нет метода updateImageName, мы временно имитируем обновление
      // В будущем здесь будет вызов реального API
      
      const updatedImages = {...images};
      updatedImages[imageToRename.id] = {
        ...imageToRename,
        originalFilename: newName
      };
      
      setImages(updatedImages);
      
      // Закрываем диалог и показываем успешное уведомление
      setOpenRenameDialog(false);
      setImageToRename(null);
      setNewName('');
      showSnackbar('Название изображения обновлено', 'success');
    } catch (error) {
      console.error('Ошибка при переименовании изображения:', error);
      showSnackbar('Ошибка при переименовании изображения', 'error');
    }
  };

  // Скачивание изображения
  const handleDownloadImage = async (id: string) => {
    try {
      const blob = await ImageService.getImage(id, true);
      const image = images[id];
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = image.originalFilename;
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Каталог изображений
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            label="Поиск"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            InputProps={{
              endAdornment: (
                <IconButton onClick={handleSearch} size="small">
                  <SearchIcon />
                </IconButton>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel>Сортировка</InputLabel>
            <Select
              value={sortBy}
              label="Сортировка"
              onChange={(e) => setSortBy(e.target.value as SortType)}
            >
              <MenuItem value="uploadedAt">По дате (новые сначала)</MenuItem>
              <MenuItem value="views">По просмотрам</MenuItem>
              <MenuItem value="downloads">По скачиваниям</MenuItem>
              <MenuItem value="popularity">По популярности</MenuItem>
              <MenuItem value="size_asc">По размеру (по возрастанию)</MenuItem>
              <MenuItem value="size_desc">По размеру (по убыванию)</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel>Фильтр по дате</InputLabel>
            <Select
              value={dateFilter}
              label="Фильтр по дате"
              onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
            >
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="today">За сегодня</MenuItem>
              <MenuItem value="week">За неделю</MenuItem>
              <MenuItem value="month">За месяц</MenuItem>
              <MenuItem value="year">За год</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel>Фильтр по размеру</InputLabel>
            <Select
              value={sizeFilter}
              label="Фильтр по размеру"
              onChange={(e) => setSizeFilter(e.target.value as SizeFilterType)}
            >
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="small">Маленький (&lt;100 КБ)</MenuItem>
              <MenuItem value="medium">Средний (100 КБ - 1 МБ)</MenuItem>
              <MenuItem value="large">Большой (1 МБ - 5 МБ)</MenuItem>
              <MenuItem value="xlarge">Очень большой (&gt;5 МБ)</MenuItem>
            </Select>
          </FormControl>

          <Button 
            variant="contained" 
            onClick={handleSearch}
          >
            Применить
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredAndSortedImages().map((image) => (
            <Grid key={image.id} sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4', lg: 'span 3' } }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 0,
                    paddingTop: '75%', // 4:3 aspect ratio
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}
                  image={ImageService.getImageUrl(image.id)}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="h2" noWrap>
                    {image.originalFilename}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Размер: {formatFileSize(image.size)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(image.uploadedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      size="small" 
                      icon={<VisibilityIcon fontSize="small" />} 
                      label={`${statistics[image.id]?.viewCount || 0} просмотров`} 
                    />
                    <Chip 
                      size="small" 
                      icon={<DownloadIcon fontSize="small" />} 
                      label={`${statistics[image.id]?.downloadCount || 0} скачиваний`} 
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" component={Link} to={`/images/${image.id}/view`}>
                    Просмотр
                  </Button>
                  <Button size="small" onClick={() => handleDownloadImage(image.id)}>
                    Скачать
                  </Button>
                  <Box sx={{ flexGrow: 1 }} />
                  <Tooltip title="Редактировать название">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleOpenRenameDialog(image)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Удалить">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => openDeleteConfirmation(image.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {filteredAndSortedImages().length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="text.secondary">
            Изображения не найдены
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Попробуйте изменить параметры поиска или фильтры
          </Typography>
        </Box>
      )}

      {/* Диалог подтверждения удаления */}
      <Dialog
        open={openDeleteDialog}
        onClose={cancelDelete}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Подтверждение удаления
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить это изображение? Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Отмена</Button>
          <Button onClick={handleDeleteImage} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог переименования */}
      <Dialog
        open={openRenameDialog}
        onClose={cancelRename}
        aria-labelledby="rename-dialog-title"
      >
        <DialogTitle id="rename-dialog-title">
          Изменение названия изображения
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Введите новое название для изображения:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Новое название"
            fullWidth
            variant="outlined"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelRename}>Отмена</Button>
          <Button 
            onClick={handleRenameImage} 
            color="primary" 
            disabled={!newName || newName === imageToRename?.originalFilename}
            autoFocus
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

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
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default HomePage;