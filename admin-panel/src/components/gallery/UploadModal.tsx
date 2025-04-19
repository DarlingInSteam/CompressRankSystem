import React, { useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  IconButton,
  Modal,
  DialogActions,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircleOutline as CheckCircleIcon,
  Image as ImageIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
  uploading: boolean;
  uploadProgress: {
    total: number;
    completed: number;
    current: string | null;
  };
}

const UploadModal: React.FC<UploadModalProps> = ({
  open,
  onClose,
  onUpload,
  uploading,
  uploadProgress
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState<boolean>(false);

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
      onUpload(Array.from(e.dataTransfer.files));
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(Array.from(e.target.files));
    }
  };

  const uploadComplete = uploadProgress.completed > 0 && uploadProgress.completed === uploadProgress.total;

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="upload-modal-title"
      sx={{ 
        backdropFilter: 'blur(5px)',
      }}
    >
      <Paper
        elevation={24}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 600 },
          bgcolor: 'background.paper',
          p: 4,
          outline: 'none',
          borderRadius: 4,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid',
          borderColor: theme.palette.mode === 'light' 
            ? 'rgba(255, 255, 255, 0.5)' 
            : 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography 
            id="upload-modal-title" 
            variant="h5" 
            component="h2"
            sx={{
              fontWeight: 600,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #82b1ff, #2979ff)'
                : 'linear-gradient(45deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Загрузка изображений
          </Typography>
          <IconButton 
            onClick={onClose} 
            disabled={uploading}
            sx={{
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'rotate(90deg)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Box
          sx={{
            border: '2px dashed',
            borderColor: dragActive ? 'primary.main' : 'divider',
            borderRadius: 4,
            p: 3,
            mb: 2,
            textAlign: 'center',
            bgcolor: dragActive ? 'action.hover' : 'background.default',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 220,
            position: 'relative',
            overflow: 'hidden',
            '&::after': dragActive ? {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: 'primary.main',
              opacity: 0.04,
              zIndex: 0,
            } : {},
          }}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
            <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <CircularProgress 
                variant="determinate" 
                value={(uploadProgress.completed / uploadProgress.total) * 100}
                sx={{ mb: 2, position: 'relative' }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="caption" component="div" color="text.secondary">
                  {`${Math.round((uploadProgress.completed / uploadProgress.total) * 100)}%`}
                </Typography>
              </Box>
              <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
                Загрузка: {uploadProgress.completed} / {uploadProgress.total}
              </Typography>
              {uploadProgress.current && (
                <Typography variant="body2" color="text.secondary">
                  {uploadProgress.current}
                </Typography>
              )}
            </Box>
          ) : uploadComplete ? (
            <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <CheckCircleIcon 
                color="success" 
                sx={{ 
                  fontSize: 60, 
                  mb: 2,
                  animation: 'pop-in 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
                  '@keyframes pop-in': {
                    '0%': {
                      transform: 'scale(0.5)',
                      opacity: 0,
                    },
                    '100%': {
                      transform: 'scale(1)',
                      opacity: 1,
                    },
                  }
                }} 
              />
              <Typography variant="h6" gutterBottom>
                Загрузка завершена!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Загружено изображений: {uploadProgress.completed}
              </Typography>
              <Button 
                variant="contained" 
                size="small" 
                sx={{ mt: 2 }}
                onClick={onClose}
              >
                Готово
              </Button>
            </Box>
          ) : (
            <>
              <ImageIcon 
                sx={{ 
                  fontSize: 60, 
                  color: 'text.secondary', 
                  mb: 2,
                  transition: 'transform 0.3s ease',
                  animation: dragActive ? 'bounce 1.5s infinite' : 'none',
                  '@keyframes bounce': {
                    '0%, 100%': {
                      transform: 'translateY(0)',
                    },
                    '50%': {
                      transform: 'translateY(-10px)',
                    },
                  },
                }} 
              />
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
                sx={{ 
                  borderRadius: '50px',
                  px: 3,
                  py: 1,
                  fontWeight: 500,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0,118,255,0.39)'
                  }
                }}
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
            onClick={onClose} 
            disabled={uploading}
            variant="outlined"
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            {uploadComplete ? 'Закрыть' : 'Отмена'}
          </Button>
        </DialogActions>
      </Paper>
    </Modal>
  );
};

export default UploadModal;