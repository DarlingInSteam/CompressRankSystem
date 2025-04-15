import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  LinearProgress,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Alert,
  Snackbar,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  CardActionArea,
  Backdrop,
  CircularProgress,
  Tooltip,
  Modal,
  Paper,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Visibility as VisibilityIcon,
  GetApp as DownloadIcon,
  Storage as StorageIcon,
  CompressOutlined as CompressIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  FileUpload as FileUploadIcon,
  CheckCircleOutline as CheckCircleIcon,
  CloudDownload as CloudDownloadIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Импорт компонентов дашборда
import StatCard from '../../components/dashboard/StatCard';

// Импорт сервисов и типов
import ImageService from '../../services/image.service';
import { ImageDTO, ImageStatistics, SortType, DateFilterType, SizeFilterType } from '../../types/api.types';

// Утилиты
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Байт';
  const k = 1024;
  const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const HomePage: React.FC = () => {
  const [images, setImages] = useState<Record<string, ImageDTO>>({});
  const [stats, setStats] = useState({
    totalImages: 0,
    compressedImages: 0,
    totalSize: 0,
    spaceSaved: 0,
    compressionEfficiency: 0
  });
  const [imageStatistics, setImageStatistics] = useState<Record<string, ImageStatistics>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const [openUploadModal, setOpenUploadModal] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    completed: number;
    current: string | null;
  }>({ total: 0, completed: 0, current: null });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  
  // Состояния для поиска, фильтрации и сортировки
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortType, setSortType] = useState<SortType>('uploadedAt');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('');
  const [sizeFilter, setSizeFilter] = useState<SizeFilterType>('');
  const [compressionFilter, setCompressionFilter] = useState<string>('all'); // 'all', 'compressed', 'original'
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Загрузка данных
  const fetchData = async () => {
    setLoading(true);
    try {
      // Получаем все изображения
      const imagesData = await ImageService.getAllImages();
      setImages(imagesData);
      
      // Получаем статистику изображений
      try {
        const statisticsData = await ImageService.getAllImageStatistics();
        setImageStatistics(statisticsData);
      } catch (err) {
        console.error('Ошибка при загрузке статистики:', err);
        // Не прерываем общий процесс загрузки, если статистика недоступна
      }
      
      // Вычисляем статистику
      const imagesArray = Object.values(imagesData);
      const totalCount = imagesArray.length;
      const compressedCount = imagesArray.filter(img => img.compressionLevel > 0).length;
      const totalSize = imagesArray.reduce((sum, img) => sum + img.size, 0);
      
      // Корректная оценка сохраненного места
      const spaceSaved = imagesArray
        .filter(img => img.compressionLevel > 0)
        .reduce((sum, img) => {
          // Вычисляем оригинальный размер на основе формулы:
          // current = original * (1 - compressionLevel/100)
          // original = current / (1 - compressionLevel/100)
          if (img.compressionLevel <= 0) return sum;
          
          const originalSize = img.size / (1 - img.compressionLevel / 100);
          return sum + (originalSize - img.size);
        }, 0);
      
      const compressionEfficiency = totalSize + spaceSaved > 0 
        ? Math.round((spaceSaved / (totalSize + spaceSaved)) * 100) 
        : 0;
      
      setStats({
        totalImages: totalCount,
        compressedImages: compressedCount,
        totalSize,
        spaceSaved,
        compressionEfficiency
      });
      
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке данных:', err);
      setError('Не удалось загрузить данные каталога изображений');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  const handleViewImage = (id: string) => {
    navigate(`/images/${id}/view`);
  };
  
  const handleToggleSelection = (id: string) => {
    if (selectedImages.includes(id)) {
      setSelectedImages(selectedImages.filter(imgId => imgId !== id));
    } else {
      setSelectedImages([...selectedImages, id]);
    }
  };
  
  const handleSelectAll = () => {
    const originalImages = Object.entries(images)
      .filter(([_, image]) => image.originalImageId === null)
      .map(([id]) => id);
      
    if (selectedImages.length === originalImages.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(originalImages);
    }
  };
  
  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedImages([]);
    }
  };
  
  const handleOpenDeleteConfirm = (id: string | null) => {
    setImageToDelete(id);
    setConfirmDeleteOpen(true);
  };
  
  const handleCloseDeleteConfirm = () => {
    setConfirmDeleteOpen(false);
    setImageToDelete(null);
  };
  
  const handleDeleteImage = async () => {
    try {
      if (imageToDelete) {
        // Удаление одного изображения
        await ImageService.deleteImage(imageToDelete);
        setSuccess('Изображение успешно удалено');
        // Обновляем список изображений
        fetchData();
      } else if (selectedImages.length > 0) {
        // Удаление нескольких изображений
        setUploading(true);
        for (const id of selectedImages) {
          await ImageService.deleteImage(id);
        }
        setSuccess(`Удалено изображений: ${selectedImages.length}`);
        setSelectedImages([]);
        setSelectionMode(false);
        // Обновляем список изображений
        fetchData();
      }
    } catch (err) {
      setError('Ошибка при удалении изображения');
    } finally {
      handleCloseDeleteConfirm();
      setUploading(false);
    }
  };
  
  const handleOpenUploadModal = () => {
    setOpenUploadModal(true);
  };
  
  const handleCloseUploadModal = () => {
    if (!uploading) {
      setOpenUploadModal(false);
      setDragActive(false);
      setUploadProgress({ total: 0, completed: 0, current: null });
    }
  };
  
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
      handleUploadFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(Array.from(e.target.files));
    }
  };
  
  const handleUploadFiles = async (files: File[]) => {
    // Фильтруем только изображения
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setError('Выберите хотя бы один файл изображения');
      return;
    }
    
    setUploadProgress({
      total: imageFiles.length,
      completed: 0,
      current: imageFiles[0].name
    });
    
    setUploading(true);
    
    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        setUploadProgress({
          total: imageFiles.length,
          completed: i,
          current: file.name
        });
        
        await ImageService.uploadImage(file);
      }
      
      setUploadProgress({
        total: imageFiles.length,
        completed: imageFiles.length,
        current: null
      });
      
      setSuccess(`Загружено изображений: ${imageFiles.length}`);
      
      // Обновляем список изображений
      fetchData();
      
      // Очищаем input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Закрываем модальное окно через небольшую задержку
      setTimeout(() => {
        handleCloseUploadModal();
      }, 1500);
    } catch (err) {
      setError('Ошибка при загрузке изображений');
    } finally {
      setUploading(false);
    }
  };

  // Функции для поиска и фильтрации изображений
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSortChange = (e: SelectChangeEvent) => {
    setSortType(e.target.value as SortType);
  };
  
  const handleDateFilterChange = (e: SelectChangeEvent) => {
    setDateFilter(e.target.value as DateFilterType);
  };
  
  const handleSizeFilterChange = (e: SelectChangeEvent) => {
    setSizeFilter(e.target.value as SizeFilterType);
  };
  
  const handleCompressionFilterChange = (e: SelectChangeEvent) => {
    setCompressionFilter(e.target.value);
  };
  
  const resetFilters = () => {
    setSearchQuery('');
    setSortType('uploadedAt');
    setDateFilter('');
    setSizeFilter('');
    setCompressionFilter('all');
  };
  
  // Применение фильтров и сортировки к изображениям
  const filteredAndSortedImages = React.useMemo(() => {
    // Получаем только оригинальные изображения (не результаты сжатия)
    let result = Object.entries(images)
      .filter(([_, image]) => image.originalImageId === null);
    
    // Применяем поиск по имени файла
    if (searchQuery) {
      result = result.filter(([_, image]) => 
        image.originalFilename.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Применяем фильтр по дате
    if (dateFilter) {
      const now = new Date();
      let compareDate = new Date();
      
      switch(dateFilter) {
        case 'today':
          compareDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          compareDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          compareDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          compareDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      result = result.filter(([_, image]) => {
        const uploadDate = new Date(image.uploadedAt);
        return uploadDate >= compareDate;
      });
    }
    
    // Применяем фильтр по размеру
    if (sizeFilter) {
      result = result.filter(([_, image]) => {
        switch(sizeFilter) {
          case 'small': // < 100KB
            return image.size < 100 * 1024;
          case 'medium': // 100KB - 1MB
            return image.size >= 100 * 1024 && image.size < 1024 * 1024;
          case 'large': // 1MB - 10MB
            return image.size >= 1024 * 1024 && image.size < 10 * 1024 * 1024;
          case 'xlarge': // > 10MB
            return image.size >= 10 * 1024 * 1024;
          default:
            return true;
        }
      });
    }
    
    // Применяем фильтр по сжатию
    if (compressionFilter !== 'all') {
      result = result.filter(([_, image]) => {
        return compressionFilter === 'compressed' 
          ? image.compressionLevel > 0 
          : image.compressionLevel === 0;
      });
    }
    
    // Применяем сортировку
    result.sort(([id1, img1], [id2, img2]) => {
      const stat1 = imageStatistics[id1] || { viewCount: 0, downloadCount: 0, popularityScore: 0 };
      const stat2 = imageStatistics[id2] || { viewCount: 0, downloadCount: 0, popularityScore: 0 };
      
      switch(sortType) {
        case 'uploadedAt':
          return new Date(img2.uploadedAt).getTime() - new Date(img1.uploadedAt).getTime();
        case 'views':
          return (stat2.viewCount || 0) - (stat1.viewCount || 0);
        case 'downloads':
          return (stat2.downloadCount || 0) - (stat1.downloadCount || 0);
        case 'popularity':
          return (stat2.popularityScore || 0) - (stat1.popularityScore || 0);
        case 'size_asc':
          return img1.size - img2.size;
        case 'size_desc':
          return img2.size - img1.size;
        default:
          return 0;
      }
    });
    
    return result;
  }, [images, imageStatistics, searchQuery, sortType, dateFilter, sizeFilter, compressionFilter]);

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
      {/* Уведомления */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      
      {loading ? (
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
        </Box>
      ) : (
        <>
          {/* Карточки со статистикой */}
          <Grid 
            container 
            spacing={3} 
            sx={{ mb: 4, width: '100%', mx: 0 }}
          >
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                title="Всего изображений"
                value={stats.totalImages}
                icon={<StorageIcon />}
                change={{ value: stats.totalImages > 0 ? stats.totalImages : 0, isPositive: true }}
                color="primary.main"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                title="Сжатых изображений"
                value={`${stats.compressedImages} / ${stats.totalImages}`}
                icon={<CompressIcon />}
                change={{ value: stats.compressedImages > 0 ? stats.compressedImages : 0, isPositive: true }}
                color="success.main"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                title="Общий объем"
                value={formatFileSize(stats.totalSize)}
                icon={<StorageIcon />}
                change={{ value: 0, isPositive: true }}
                color="info.main"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                title="Экономия места"
                value={formatFileSize(stats.spaceSaved)}
                icon={<CompressIcon />}
                change={{ value: stats.compressionEfficiency, isPositive: true }}
                color="secondary.main"
              />
            </Grid>
          </Grid>
          
          {/* Быстрые действия */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 4, 
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
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)'
              }
            }}
          >
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box>
                <Button 
                  variant="contained" 
                  startIcon={<UploadIcon />}
                  onClick={handleOpenUploadModal}
                  sx={{ 
                    borderRadius: '8px', 
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    fontWeight: 'medium',
                    boxShadow: '0 4px 10px 0 rgba(0,0,0,0.12)'
                  }}
                >
                  Загрузить изображения
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant={selectionMode ? "contained" : "outlined"}
                  color={selectionMode ? "primary" : "inherit"}
                  onClick={handleToggleSelectionMode}
                  sx={{ 
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 'medium'
                  }}
                >
                  {selectionMode ? "Отменить выделение" : "Выделить изображения"}
                </Button>
                
                {selectionMode && (
                  <>
                    <Button 
                      variant="outlined"
                      onClick={handleSelectAll}
                      sx={{ 
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 'medium'
                      }}
                    >
                      {selectedImages.length === Object.keys(images).filter(key => !images[key].originalImageId).length 
                        ? "Снять выделение" 
                        : "Выделить все"}
                    </Button>
                    
                    <Button 
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleOpenDeleteConfirm(null)}
                      disabled={selectedImages.length === 0}
                      sx={{ 
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 'medium'
                      }}
                    >
                      Удалить выбранные ({selectedImages.length})
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Paper>
          
          {/* Фильтры и поиск */}
          <Paper 
            elevation={0}
            sx={{ 
              mb: 4,
              p: 2, 
              borderRadius: '16px',
              backdropFilter: 'blur(8px)',
              backgroundColor: theme => theme.palette.mode === 'light' 
                ? 'rgba(255, 255, 255, 0.8)' 
                : 'rgba(50, 50, 50, 0.8)',
              border: '1px solid',
              borderColor: theme => theme.palette.mode === 'light'
                ? 'rgba(255, 255, 255, 0.6)'
                : 'rgba(100, 100, 100, 0.2)',
              boxShadow: theme => theme.palette.mode === 'light'
                ? '0 8px 20px rgba(0,0,0,0.06)'
                : '0 8px 20px rgba(0,0,0,0.25)'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2,
              '& .MuiFormControl-root, & .MuiButton-root': {
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 5px 10px rgba(0,0,0,0.1)'
                }
              }
            }}>
              <TextField
                label="Поиск"
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                sx={{ 
                  flexGrow: 1, 
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    backgroundColor: theme => theme.palette.mode === 'light'
                      ? 'rgba(255, 255, 255, 0.9)'
                      : 'rgba(66, 66, 66, 0.6)',
                    backdropFilter: 'blur(5px)',
                    transition: 'all 0.3s'
                  }
                }}
              />
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Сортировка</InputLabel>
                <Select
                  value={sortType}
                  onChange={handleSortChange}
                  label="Сортировка"
                  sx={{
                    borderRadius: '10px',
                    backgroundColor: theme => theme.palette.mode === 'light'
                      ? 'rgba(255, 255, 255, 0.9)'
                      : 'rgba(66, 66, 66, 0.6)',
                  }}
                >
                  <MenuItem value="uploadedAt">Дата загрузки</MenuItem>
                  <MenuItem value="views">Просмотры</MenuItem>
                  <MenuItem value="downloads">Загрузки</MenuItem>
                  <MenuItem value="popularity">Популярность</MenuItem>
                  <MenuItem value="size_asc">Размер (по возрастанию)</MenuItem>
                  <MenuItem value="size_desc">Размер (по убыванию)</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Фильтр по дате</InputLabel>
                <Select
                  value={dateFilter}
                  onChange={handleDateFilterChange}
                  label="Фильтр по дате"
                  sx={{
                    borderRadius: '10px',
                    backgroundColor: theme => theme.palette.mode === 'light'
                      ? 'rgba(255, 255, 255, 0.9)'
                      : 'rgba(66, 66, 66, 0.6)',
                  }}
                >
                  <MenuItem value="">Все</MenuItem>
                  <MenuItem value="today">Сегодня</MenuItem>
                  <MenuItem value="week">Последняя неделя</MenuItem>
                  <MenuItem value="month">Последний месяц</MenuItem>
                  <MenuItem value="year">Последний год</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Фильтр по размеру</InputLabel>
                <Select
                  value={sizeFilter}
                  onChange={handleSizeFilterChange}
                  label="Фильтр по размеру"
                  sx={{
                    borderRadius: '10px',
                    backgroundColor: theme => theme.palette.mode === 'light'
                      ? 'rgba(255, 255, 255, 0.9)'
                      : 'rgba(66, 66, 66, 0.6)',
                  }}
                >
                  <MenuItem value="">Все</MenuItem>
                  <MenuItem value="small">Маленькие (&lt; 100KB)</MenuItem>
                  <MenuItem value="medium">Средние (100KB - 1MB)</MenuItem>
                  <MenuItem value="large">Большие (1MB - 10MB)</MenuItem>
                  <MenuItem value="xlarge">Очень большие (&gt; 10MB)</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Фильтр по сжатию</InputLabel>
                <Select
                  value={compressionFilter}
                  onChange={handleCompressionFilterChange}
                  label="Фильтр по сжатию"
                  sx={{
                    borderRadius: '10px',
                    backgroundColor: theme => theme.palette.mode === 'light'
                      ? 'rgba(255, 255, 255, 0.9)'
                      : 'rgba(66, 66, 66, 0.6)',
                  }}
                >
                  <MenuItem value="all">Все</MenuItem>
                  <MenuItem value="compressed">Сжатые</MenuItem>
                  <MenuItem value="original">Оригиналы</MenuItem>
                </Select>
              </FormControl>
              
              <Button 
                variant="outlined" 
                onClick={resetFilters}
                endIcon={<FilterListIcon fontSize="small" />}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 'medium'
                }}
              >
                Сбросить
              </Button>
            </Box>
          </Paper>
          
          {/* Каталог изображений */}
          {filteredAndSortedImages.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              Нет изображений, соответствующих заданным критериям.
            </Alert>
          ) : (
            <Box sx={{ width: '100%' }}>
              <Grid 
                container 
                spacing={2}
                sx={{ 
                  mb: 4,
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(1, 1fr)',  // На маленьких экранах - 1 колонка
                    sm: 'repeat(2, 1fr)',  // На средних экранах - 2 колонки
                    md: 'repeat(3, 1fr)',  // На средних-больших экранах - 3 колонки
                    lg: 'repeat(5, minmax(0, 1fr))'   // На больших экранах - строго 5 колонок
                  },
                  gap: '16px',
                  width: '100%'
                }}
              >
                {filteredAndSortedImages.map(([id, image]) => (
                  <Card 
                    key={id}
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '16px',
                      backdropFilter: 'blur(8px)',
                      backgroundColor: theme => theme.palette.mode === 'light' 
                        ? 'rgba(255, 255, 255, 0.9)' 
                        : 'rgba(30, 30, 30, 0.75)',
                      border: '1px solid',
                      borderColor: theme => theme.palette.mode === 'light'
                        ? 'rgba(255, 255, 255, 0.5)'
                        : 'rgba(255, 255, 255, 0.1)',
                      boxShadow: theme => theme.palette.mode === 'light'
                        ? '0 8px 16px rgba(70, 70, 70, 0.1)'
                        : '0 8px 16px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      transform: selectedImages.includes(id) ? 'scale(0.98)' : 'scale(1)',
                      '&:hover': {
                        transform: 'translateY(-10px) scale(1.02)',
                        boxShadow: theme => theme.palette.mode === 'light'
                          ? '0 14px 28px rgba(70, 70, 70, 0.2), 0 10px 10px rgba(70, 70, 70, 0.15)'
                          : '0 14px 28px rgba(0, 0, 0, 0.3), 0 10px 10px rgba(0, 0, 0, 0.22)'
                      },
                      outline: selectedImages.includes(id) ? '2px solid' : 'none',
                      outlineColor: 'primary.main',
                      outlineOffset: 2,
                      position: 'relative',
                      overflow: 'visible'
                    }}
                  >
                    {selectionMode && (
                      <Checkbox 
                        checked={selectedImages.includes(id)}
                        onChange={() => handleToggleSelection(id)}
                        sx={{ 
                          position: 'absolute', 
                          top: -6, 
                          right: -6, 
                          zIndex: 2,
                          bgcolor: 'background.paper', 
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.15)'
                          }
                        }}
                      />
                    )}
                    
                    {/* Статус сжатия */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 14,
                        left: 14,
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: theme => theme.palette.mode === 'light'
                          ? 'rgba(255, 255, 255, 0.9)'
                          : 'rgba(40, 40, 40, 0.9)',
                        backdropFilter: 'blur(5px)',
                        borderRadius: '50px',
                        px: 1.5,
                        py: 0.5,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                        border: '1px solid',
                        borderColor: theme => theme.palette.mode === 'light'
                          ? 'rgba(255, 255, 255, 0.5)'
                          : 'rgba(255, 255, 255, 0.1)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <CompressIcon 
                        fontSize="small" 
                        color={image.compressionLevel > 0 ? "success" : "disabled"} 
                        sx={{ 
                          mr: 0.5,
                          animation: image.compressionLevel > 0 ? 'pulse 2s infinite' : 'none',
                          '@keyframes pulse': {
                            '0%': { opacity: 0.7 },
                            '50%': { opacity: 1 },
                            '100%': { opacity: 0.7 }
                          }
                        }}
                      />
                      <Typography 
                        variant="caption" 
                        fontWeight="medium"
                        component="span"
                        sx={{
                          background: image.compressionLevel > 0 
                            ? 'linear-gradient(90deg, #4caf50, #8bc34a)' 
                            : 'none',
                          WebkitBackgroundClip: image.compressionLevel > 0 ? 'text' : 'none',
                          WebkitTextFillColor: image.compressionLevel > 0 ? 'transparent' : 'inherit'
                        }}
                      >
                        {image.compressionLevel > 0 ? `Сжато ${image.compressionLevel}%` : 'Оригинал'}
                      </Typography>
                    </Box>
                    
                    <Box 
                      sx={{ 
                        overflow: 'hidden', 
                        borderTopLeftRadius: '16px', 
                        borderTopRightRadius: '16px',
                        position: 'relative'
                      }}
                    >
                      <CardActionArea 
                        onClick={selectionMode ? () => handleToggleSelection(id) : () => handleViewImage(id)}
                        sx={{ flexGrow: 0 }}
                      >
                        <CardMedia
                          component="img"
                          height="220"
                          image={ImageService.getImageUrl(id)}
                          alt={image.originalFilename}
                          sx={{ 
                            objectFit: 'cover', 
                            transition: 'transform 0.5s ease',
                            '&:hover': {
                              transform: 'scale(1.05)'
                            }
                          }}
                        />
                      </CardActionArea>
                    </Box>
                    
                    <CardContent sx={{ flexGrow: 1, p: 3, pb: 2 }}>
                      <Typography 
                        variant="h6" 
                        noWrap 
                        title={image.originalFilename}
                        sx={{
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          mb: 0.5
                        }}
                      >
                        {image.originalFilename}
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2,
                        color: 'text.secondary',
                        fontSize: '0.875rem'
                      }}>
                        <Box component="span" sx={{ fontWeight: 500 }}>
                          {formatFileSize(image.size)}
                        </Box>
                        <Box 
                          component="span" 
                          sx={{ 
                            mx: 0.7,
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: 'text.disabled',
                            display: 'inline-block'
                          }} 
                        />
                        <Box component="span">
                          {new Date(image.uploadedAt).toLocaleDateString()}
                        </Box>
                      </Box>
                      
                      {/* Информация о размере до/после сжатия */}
                      {image.compressionLevel > 0 && (
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            mt: 1, 
                            mb: 1.5, 
                            p: 1.5, 
                            backgroundColor: theme => theme.palette.mode === 'light'
                              ? 'rgba(237, 247, 237, 0.8)'
                              : 'rgba(46, 125, 50, 0.1)',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: theme => theme.palette.mode === 'light'
                              ? 'rgba(76, 175, 80, 0.2)'
                              : 'rgba(76, 175, 80, 0.1)',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">Исходный:</Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {formatFileSize(Math.round(image.size / (1 - image.compressionLevel / 100)))}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="success.main" fontWeight="medium">
                              Экономия:
                            </Typography>
                            <Typography variant="body2" color="success.main" fontWeight="medium">
                              {formatFileSize(Math.round(image.size / (1 - image.compressionLevel / 100)) - image.size)}
                            </Typography>
                          </Box>
                        </Paper>
                      )}
                      
                      <Box display="flex" flexWrap="wrap" gap={0.8} mt={1.5}>
                        <Chip 
                          size="small" 
                          label={image.compressionLevel > 0 ? 'Сжато' : 'Оригинал'}
                          color={image.compressionLevel > 0 ? 'success' : 'info'}
                          sx={{ 
                            borderRadius: '50px',
                            px: 0.5,
                            fontWeight: 500,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                          }}
                        />
                        {image.compressionLevel > 0 && (
                          <Chip 
                            size="small"
                            label={`${image.compressionLevel}%`}
                            variant="outlined"
                            sx={{ 
                              borderRadius: '50px',
                              fontWeight: 500 
                            }}
                          />
                        )}
                        <Chip 
                          size="small" 
                          icon={<VisibilityIcon sx={{ fontSize: '1rem !important' }} />}
                          label={image.accessCount}
                          variant="outlined"
                          title="Количество просмотров"
                          sx={{ 
                            borderRadius: '50px',
                            fontWeight: 500 
                          }}
                        />
                        <Chip 
                          size="small" 
                          icon={<CloudDownloadIcon sx={{ fontSize: '1rem !important' }} />}
                          label={image.accessCount > 0 ? Math.floor(image.accessCount * 0.4) : 0}
                          variant="outlined"
                          title="Количество загрузок"
                          sx={{ 
                            borderRadius: '50px',
                            fontWeight: 500 
                          }}
                        />
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                      <Button 
                        size="small" 
                        startIcon={<InfoIcon />} 
                        onClick={() => handleViewImage(id)}
                        sx={{ 
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 500,
                          background: theme => theme.palette.mode === 'light'
                            ? 'linear-gradient(to right, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.05))'
                            : 'linear-gradient(to right, rgba(25, 118, 210, 0.15), rgba(25, 118, 210, 0.05))',
                          '&:hover': {
                            background: theme => theme.palette.mode === 'light'
                              ? 'linear-gradient(to right, rgba(25, 118, 210, 0.2), rgba(25, 118, 210, 0.1))'
                              : 'linear-gradient(to right, rgba(25, 118, 210, 0.25), rgba(25, 118, 210, 0.1))'
                          }
                        }}
                      >
                        Просмотр
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<DownloadIcon />}
                        component="a"
                        href={ImageService.getImageUrl(id, true)}
                        download={image.originalFilename}
                        sx={{ 
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 500,
                          ml: 1
                        }}
                      >
                        Скачать
                      </Button>
                      
                      <Box flexGrow={1} />
                      
                      <Tooltip title="Удалить">
                        <IconButton 
                          color="error"
                          onClick={() => handleOpenDeleteConfirm(id)}
                          size="small"
                          sx={{ 
                            width: 32, 
                            height: 32,
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            '&:hover': {
                              backgroundColor: 'error.light',
                              '& .MuiSvgIcon-root': {
                                color: 'white'
                              }
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </Card>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}
      
      {/* Модальное окно загрузки файлов */}
      <Modal
        open={openUploadModal}
        onClose={handleCloseUploadModal}
        aria-labelledby="upload-modal-title"
      >
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 600 },
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            outline: 'none',
            borderRadius: 2,
            maxHeight: '90vh',
            overflow: 'auto'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography id="upload-modal-title" variant="h5" component="h2">
              Загрузка изображений
            </Typography>
            <IconButton onClick={handleCloseUploadModal} disabled={uploading}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Box
            sx={{
              border: '2px dashed',
              borderColor: dragActive ? 'primary.main' : 'divider',
              borderRadius: 2,
              p: 3,
              mb: 2,
              textAlign: 'center',
              bgcolor: dragActive ? 'action.hover' : 'background.paper',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 200
            }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            {uploading ? (
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  Загрузка: {uploadProgress.completed + 1} / {uploadProgress.total}
                </Typography>
                {uploadProgress.current && (
                  <Typography variant="body2" color="text.secondary">
                    {uploadProgress.current}
                  </Typography>
                )}
              </Box>
            ) : uploadProgress.completed > 0 && uploadProgress.completed === uploadProgress.total ? (
              <Box sx={{ textAlign: 'center' }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Загрузка завершена!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Загружено изображений: {uploadProgress.completed}
                </Typography>
              </Box>
            ) : (
              <>
                <ImageIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Перетащите изображения сюда
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  или
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<FileUploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Выбрать файлы
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                  Поддерживаемые форматы: JPEG, PNG, GIF, BMP
                </Typography>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                />
              </>
            )}
          </Box>
          
          <DialogActions>
            <Button 
              onClick={handleCloseUploadModal} 
              disabled={uploading}
            >
              {uploadProgress.completed > 0 && uploadProgress.completed === uploadProgress.total ? 'Закрыть' : 'Отмена'}
            </Button>
          </DialogActions>
        </Paper>
      </Modal>
      
      {/* Диалог подтверждения удаления */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={handleCloseDeleteConfirm}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          {imageToDelete ? "Удалить изображение?" : `Удалить выбранные изображения (${selectedImages.length})?`}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {imageToDelete
              ? "Вы уверены, что хотите удалить это изображение? Это действие нельзя отменить."
              : `Вы уверены, что хотите удалить ${selectedImages.length} выбранных изображений? Это действие нельзя отменить.`
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>Отмена</Button>
          <Button 
            onClick={handleDeleteImage} 
            color="error" 
            variant="contained"
            disabled={uploading}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Фоновый индикатор загрузки */}
      <Backdrop
        sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }}
        open={uploading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Container>
  );
};

export default HomePage;