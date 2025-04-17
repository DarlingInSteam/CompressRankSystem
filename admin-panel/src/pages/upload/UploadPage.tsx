import React, { useState, useRef } from 'react';
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
  Snackbar
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircleOutline as CheckIcon,
  ErrorOutline as ErrorIcon,
  Delete as DeleteIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ImageService from '../../services/image.service';
import { ImageDTO } from '../../types/api.types';
import QuotaInfo from '../../components/upload/QuotaInfo';

interface UploadItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  imageId?: string;
  error?: string;
}

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Триггер для обновления информации о квотах
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    fileInputRef.current?.click();
  };

  // Функция для показа уведомлений
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleFiles = (files: FileList) => {
    const newItems: UploadItem[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        status: 'pending',
        progress: 0
      }));
    
    if (newItems.length === 0) {
      showSnackbar('Выбранные файлы не являются изображениями', 'error');
      return;
    }
    
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
      // Имитация прогресса загрузки
      const progressInterval = setInterval(() => {
        setUploadItems(prev => 
          prev.map(i => {
            if (i.id === item.id && i.progress < 90) {
              return { ...i, progress: i.progress + 10 };
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
      
      showSnackbar('Изображение успешно загружено', 'success');
      
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
      
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleRemoveItem = (id: string) => {
    setUploadItems(prev => prev.filter(item => item.id !== id));
  };

  const handleRetryUpload = (item: UploadItem) => {
    uploadFile(item);
  };

  const handleViewImage = (imageId?: string) => {
    if (imageId) {
      navigate(`/images/${imageId}/view`);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Загрузка изображений
      </Typography>
      
      {/* Компонент с информацией о лимитах и квотах */}
      <QuotaInfo refreshTrigger={refreshTrigger} />

      <Paper
        sx={{
          p: 3,
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: dragActive ? 'primary.main' : 'divider',
          backgroundColor: dragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
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

        <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6" align="center" gutterBottom>
          Перетащите изображения сюда
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary">
          или нажмите для выбора файлов
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          startIcon={<CloudUploadIcon />}
          onClick={(e) => {
            e.stopPropagation();
            handleButtonClick();
          }}
        >
          Выбрать файлы
        </Button>
      </Paper>

      {uploadItems.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Загружаемые файлы ({uploadItems.length})
          </Typography>
          <List>
            {uploadItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveItem(item.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    {item.status === 'success' ? (
                      <CheckIcon color="success" />
                    ) : item.status === 'error' ? (
                      <ErrorIcon color="error" />
                    ) : (
                      <ImageIcon />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.file.name}
                    secondary={
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2">
                            {item.status === 'pending' && 'Ожидание...'}
                            {item.status === 'uploading' && `Загрузка: ${item.progress}%`}
                            {item.status === 'success' && 'Загрузка завершена'}
                            {item.status === 'error' && item.error}
                          </Typography>
                          <Typography variant="body2">
                            {(item.file.size / 1024).toFixed(1)} КБ
                          </Typography>
                        </Box>
                        {item.status === 'uploading' && (
                          <LinearProgress variant="determinate" value={item.progress} />
                        )}
                        {item.status === 'error' && (
                          <Button 
                            size="small" 
                            color="primary" 
                            onClick={() => handleRetryUpload(item)}
                            sx={{ mt: 0.5 }}
                          >
                            Повторить
                          </Button>
                        )}
                        {item.status === 'success' && (
                          <Button 
                            size="small" 
                            color="primary" 
                            onClick={() => handleViewImage(item.imageId)}
                            sx={{ mt: 0.5 }}
                          >
                            Просмотреть
                          </Button>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
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
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UploadPage;