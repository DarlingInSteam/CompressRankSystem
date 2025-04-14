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
      
      // Вычисляем статистику
      const imagesArray = Object.values(imagesData);
      const totalCount = imagesArray.length;
      const compressedCount = imagesArray.filter(img => img.compressionLevel > 0).length;
      const totalSize = imagesArray.reduce((sum, img) => sum + img.size, 0);
      
      // Приблизительная оценка сохраненного места (на основе уровня сжатия)
      const spaceSaved = imagesArray
        .filter(img => img.compressionLevel > 0)
        .reduce((sum, img) => {
          // Приблизительное оригинальное значение размера (если есть)
          const estimatedOriginalSize = img.size / (1 - img.compressionLevel / 100);
          return sum + (estimatedOriginalSize - img.size);
        }, 0);
      
      const compressionEfficiency = totalSize > 0 
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Каталог изображений
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Управление и мониторинг загруженных изображений
        </Typography>
      </Box>
      
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
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid component="div" xs={12} sm={6} lg={3}>
              <StatCard
                title="Всего изображений"
                value={stats.totalImages}
                icon={<StorageIcon />}
                change={{ value: stats.totalImages > 0 ? stats.totalImages : 0, isPositive: true }}
                color="primary.main"
              />
            </Grid>
            <Grid component="div" xs={12} sm={6} lg={3}>
              <StatCard
                title="Сжатых изображений"
                value={`${stats.compressedImages} / ${stats.totalImages}`}
                icon={<CompressIcon />}
                change={{ value: stats.compressedImages > 0 ? stats.compressedImages : 0, isPositive: true }}
                color="success.main"
              />
            </Grid>
            <Grid component="div" xs={12} sm={6} lg={3}>
              <StatCard
                title="Общий объем"
                value={formatFileSize(stats.totalSize)}
                icon={<StorageIcon />}
                change={{ value: 0, isPositive: true }}
                color="info.main"
              />
            </Grid>
            <Grid component="div" xs={12} sm={6} lg={3}>
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
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Button 
                variant="contained" 
                startIcon={<UploadIcon />}
                onClick={handleOpenUploadModal}
                sx={{ mr: 2 }}
              >
                Загрузить изображения
              </Button>
            </Box>
            
            <Box>
              <Button 
                variant={selectionMode ? "contained" : "outlined"}
                color={selectionMode ? "primary" : "inherit"}
                onClick={handleToggleSelectionMode}
                sx={{ mr: 2 }}
              >
                {selectionMode ? "Отменить выделение" : "Выделить изображения"}
              </Button>
              
              {selectionMode && (
                <>
                  <Button 
                    variant="outlined"
                    onClick={handleSelectAll}
                    sx={{ mr: 2 }}
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
                  >
                    Удалить выбранные ({selectedImages.length})
                  </Button>
                </>
              )}
            </Box>
          </Box>
          
          {/* Каталог изображений */}
          {Object.keys(images).length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              Нет загруженных изображений. Загрузите ваше первое изображение.
            </Alert>
          ) : (
            <Box sx={{ width: '100%' }}>
              <Grid 
                container 
                spacing={3} 
                sx={{ 
                  mb: 4,
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',              // На маленьких экранах - 1 колонка
                    sm: 'repeat(2, 1fr)',   // На средних экранах - 2 колонки
                    md: 'repeat(3, 1fr)'    // На больших экранах - строго 3 колонки
                  },
                  gap: 3
                }}
              >
                {Object.entries(images)
                  .filter(([_, image]) => image.originalImageId === null) // Показываем только оригинальные изображения
                  .map(([id, image]) => (
                    <Card 
                      key={id}
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: 4
                        },
                        border: selectedImages.includes(id) ? '2px solid' : 'none',
                        borderColor: 'primary.main',
                        position: 'relative'
                      }}
                    >
                      {selectionMode && (
                        <Checkbox 
                          checked={selectedImages.includes(id)}
                          onChange={() => handleToggleSelection(id)}
                          sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            right: 0, 
                            zIndex: 1,
                            bgcolor: 'rgba(255,255,255,0.7)', 
                            m: 1,
                            borderRadius: '50%'
                          }}
                        />
                      )}
                      
                      {/* Статус сжатия - добавлен в верхний левый угол */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          zIndex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          bgcolor: 'rgba(255,255,255,0.85)',
                          borderRadius: '4px',
                          px: 1,
                          py: 0.5,
                          boxShadow: 1
                        }}
                      >
                        <CompressIcon fontSize="small" color={image.compressionLevel > 0 ? "success" : "disabled"} sx={{ mr: 0.5 }} />
                        <Typography variant="caption" fontWeight="medium">
                          {image.compressionLevel > 0 ? `Сжато ${image.compressionLevel}%` : 'Оригинал'}
                        </Typography>
                      </Box>
                      
                      <CardActionArea 
                        onClick={selectionMode ? () => handleToggleSelection(id) : () => handleViewImage(id)}
                        sx={{ flexGrow: 0 }}
                      >
                        <CardMedia
                          component="img"
                          height="200"
                          image={ImageService.getImageUrl(id)}
                          alt={image.originalFilename}
                          sx={{ 
                            objectFit: 'contain', 
                            bgcolor: 'background.default',
                            borderBottom: '1px solid',
                            borderBottomColor: 'divider'
                          }}
                        />
                      </CardActionArea>
                      
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" noWrap title={image.originalFilename}>
                          {image.originalFilename}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {formatFileSize(image.size)} • {new Date(image.uploadedAt).toLocaleDateString()}
                        </Typography>
                        
                        {/* Информация о размере до/после сжатия */}
                        {image.compressionLevel > 0 && (
                          <Box sx={{ mt: 1, mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Изначальный размер: {formatFileSize(Math.round(image.size / (1 - image.compressionLevel / 100)))}
                            </Typography>
                            <Typography variant="body2" color="success.main">
                              Сэкономлено: {formatFileSize(Math.round(image.size / (1 - image.compressionLevel / 100)) - image.size)}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                          <Chip 
                            size="small" 
                            label={image.compressionLevel > 0 ? 'Сжато' : 'Оригинал'}
                            color={image.compressionLevel > 0 ? 'success' : 'info'}
                          />
                          {image.compressionLevel > 0 && (
                            <Chip 
                              size="small"
                              label={`${image.compressionLevel}%`}
                              variant="outlined"
                            />
                          )}
                          <Chip 
                            size="small" 
                            icon={<VisibilityIcon fontSize="small" />}
                            label={image.accessCount}
                            variant="outlined"
                            title="Количество просмотров"
                          />
                          <Chip 
                            size="small" 
                            icon={<CloudDownloadIcon fontSize="small" />}
                            label={image.accessCount > 0 ? Math.floor(image.accessCount * 0.4) : 0}
                            variant="outlined"
                            title="Количество загрузок"
                          />
                        </Box>
                      </CardContent>
                      
                      <CardActions>
                        <Button 
                          size="small" 
                          startIcon={<InfoIcon />} 
                          onClick={() => handleViewImage(id)}
                        >
                          Просмотр
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<DownloadIcon />}
                          component="a"
                          href={ImageService.getImageUrl(id, true)}
                          download={image.originalFilename}
                        >
                          Скачать
                        </Button>
                        
                        <Box flexGrow={1} />
                        
                        <Tooltip title="Удалить">
                          <IconButton 
                            color="error"
                            onClick={() => handleOpenDeleteConfirm(id)}
                            size="small"
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