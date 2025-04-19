import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  IconButton,
  Box,
  Chip,
  CardActionArea,
  Checkbox,
  Tooltip,
  Paper,
  useTheme,
  Skeleton,
  alpha,
  Avatar,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Stack
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  GetApp as DownloadIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  CompressOutlined as CompressIcon,
  CloudDownload as CloudDownloadIcon,
  CheckCircle as CheckCircleIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ImageService from '../../services/image.service';
import { ImageDTO, ImageStatistics } from '../../types/api.types';

// Utility function for formatting file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Байт';
  const k = 1024;
  const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface ImageGalleryProps {
  images: [string, ImageDTO][];
  imageStatistics: Record<string, ImageStatistics>;
  originalSizes: Record<string, number>;
  selectionMode: boolean;
  selectedImages: string[];
  onToggleSelection: (id: string) => void;
  onViewImage: (id: string) => void;
  onDeleteImage: (id: string) => void;
  loading?: boolean;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (event: React.ChangeEvent<unknown>, page: number) => void;
  onPageSizeChange?: (event: SelectChangeEvent<number>) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  imageStatistics,
  originalSizes,
  selectionMode,
  selectedImages,
  onToggleSelection,
  onViewImage,
  onDeleteImage,
  loading = false,
  currentPage = 0,
  totalPages = 1,
  pageSize = 20,
  onPageChange,
  onPageSizeChange
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Состояние для эффектов наведения и взаимодействия
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [downloadingImage, setDownloadingImage] = useState<string | null>(null);
  
  // Имитация скачивания изображения с эффектом прогресса
  const handleDownloadClick = (id: string, originalFilename: string) => {
    if (downloadingImage === id) return;
    
    setDownloadingImage(id);
    
    // Имитация прогресса загрузки
    setTimeout(() => {
      // Настоящее скачивание
      const downloadLink = document.createElement('a');
      downloadLink.href = ImageService.getImageUrl(id, true);
      downloadLink.download = originalFilename;
      downloadLink.click();
      
      // Сбросить состояние скачивания через 1 секунду
      setTimeout(() => {
        setDownloadingImage(null);
      }, 1000);
    }, 800);
  };

  if (loading) {
    // Улучшенные скелеты загрузки с анимацией пульсации
    return (
      <Box sx={{ width: '100%' }}>
        <Grid
          container
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, minmax(0, 1fr))',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
              lg: 'repeat(5, minmax(0, 1fr))'
            },
            gap: '16px',
            width: '100%'
          }}
        >
          {[...Array(10)].map((_, index) => (
            <Card 
              key={index}
              sx={{
                height: '100%',
                borderRadius: '16px',
                backdropFilter: 'blur(8px)',
                backgroundColor: theme.palette.mode === 'light' 
                  ? 'rgba(255, 255, 255, 0.9)' 
                  : 'rgba(30, 30, 30, 0.75)',
                overflow: 'hidden',
                position: 'relative',
                animation: `breathe ${1.5 + (index % 3) * 0.5}s infinite alternate ease-in-out`,
                '@keyframes breathe': {
                  '0%': { opacity: 0.7 },
                  '100%': { opacity: 1 }
                }
              }}
            >
              <Skeleton 
                variant="rectangular" 
                height={220} 
                animation="wave"
                sx={{
                  background: theme => theme.palette.mode === 'light' 
                    ? 'linear-gradient(110deg, #f5f5f5 30%, #fafafa 50%, #f5f5f5 70%)' 
                    : 'linear-gradient(110deg, #333 30%, #444 50%, #333 70%)',
                  backgroundSize: '200% 100%',
                  animation: `wave ${1.5 + (index % 3) * 0.2}s linear infinite`,
                  '@keyframes wave': {
                    '0%': { backgroundPosition: '0% 0%' },
                    '100%': { backgroundPosition: '-200% 0%' }
                  }
                }}
              />
              <CardContent>
                <Skeleton variant="text" width="80%" height={24} animation="wave" />
                <Skeleton variant="text" width="60%" height={20} animation="wave" />
                <Box sx={{ mt: 1.5, mb: 1 }}>
                  <Skeleton variant="rectangular" height={60} animation="wave" sx={{ borderRadius: 1 }} />
                </Box>
                <Box display="flex" gap={1} mt={1.5}>
                  <Skeleton variant="rectangular" width={60} height={24} animation="wave" sx={{ borderRadius: 12 }} />
                  <Skeleton variant="rectangular" width={60} height={24} animation="wave" sx={{ borderRadius: 12 }} />
                </Box>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Skeleton variant="rectangular" width={90} height={30} animation="wave" sx={{ borderRadius: 8 }} />
                <Skeleton variant="rectangular" width={90} height={30} animation="wave" sx={{ borderRadius: 8, ml: 1 }} />
              </CardActions>
            </Card>
          ))}
        </Grid>
      </Box>
    );
  }

  if (images.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          borderRadius: 4,
          backgroundColor: theme => theme.palette.mode === 'light'
            ? 'rgba(245, 245, 245, 0.8)'
            : 'rgba(30, 30, 30, 0.6)',
          backdropFilter: 'blur(8px)',
          border: '1px dashed',
          borderColor: 'divider',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Декоративные элементы на заднем фоне */}
        <Box 
          sx={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            opacity: 0.5,
            background: 'linear-gradient(140deg, #8c72fb30, #42a5f530)',
            filter: 'blur(40px)',
            top: '10%',
            right: '15%',
            animation: 'move 10s infinite alternate',
            '@keyframes move': {
              '0%': { transform: 'translate(0, 0)' },
              '100%': { transform: 'translate(-30px, 30px)' }
            }
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            opacity: 0.3,
            background: 'linear-gradient(140deg, #42f5a230, #4285f430)',
            filter: 'blur(35px)',
            bottom: '15%',
            left: '10%',
            animation: 'move2 8s infinite alternate-reverse',
            '@keyframes move2': {
              '0%': { transform: 'translate(0, 0)' },
              '100%': { transform: 'translate(30px, -30px)' }
            }
          }}
        />

        {/* Иконка и текст */}
        <Box
          component="img"
          src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1pbWFnZSI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiPjwvcmVjdD48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSI+PC9jaXJjbGU+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSI+PC9wb2x5bGluZT48L3N2Zz4="
          alt="No images"
          sx={{ 
            width: 80, 
            height: 80, 
            opacity: 0.6, 
            mb: 2,
            filter: theme => theme.palette.mode === 'dark' ? 'invert(1)' : 'none'
          }}
        />
        <Typography variant="h5" color="text.secondary" sx={{ 
          mb: 2,
          fontWeight: 500,
          textAlign: 'center',
          maxWidth: '80%',
          lineHeight: 1.6
        }}>
          Нет изображений, соответствующих заданным критериям
        </Typography>
        <Button 
          variant="contained"
          onClick={() => navigate('/upload')}
          sx={{
            mt: 2,
            px: 4,
            py: 1.2,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '1rem',
            boxShadow: theme => theme.palette.mode === 'light'
              ? '0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
              : '0 10px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.2)',
            background: 'linear-gradient(45deg, #42a5f5, #1976d2)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 15px 30px -8px rgba(0,0,0,0.2), 0 15px 15px -8px rgba(0,0,0,0.1)'
            }
          }}
        >
          Загрузить изображения
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Grid
        container
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(1, minmax(0, 1fr))',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
            xl: 'repeat(5, minmax(0, 1fr))'
          },
          gap: { xs: '12px', md: '16px', lg: '20px' },
          width: '100%'
        }}
      >
        {images.map(([id, image], index) => (
          <Card
            key={id}
            onMouseEnter={() => setHoveredCard(id)}
            onMouseLeave={() => setHoveredCard(null)}
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
              borderColor: theme => {
                if (selectedImages.includes(id)) return theme.palette.primary.main;
                return theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.5)'
                  : 'rgba(255, 255, 255, 0.1)';
              },
              boxShadow: theme => {
                if (hoveredCard === id) {
                  return theme.palette.mode === 'light'
                    ? '0 14px 28px rgba(70, 70, 70, 0.2), 0 10px 10px rgba(70, 70, 70, 0.15)'
                    : '0 14px 28px rgba(0, 0, 0, 0.3), 0 10px 10px rgba(0, 0, 0, 0.22)';
                }
                return theme.palette.mode === 'light'
                  ? '0 8px 16px rgba(70, 70, 70, 0.1)'
                  : '0 8px 16px rgba(0, 0, 0, 0.3)';
              },
              transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
              transform: selectedImages.includes(id) 
                ? 'scale(0.98) translateY(-3px)' 
                : hoveredCard === id 
                  ? 'translateY(-10px) scale(1.02)' 
                  : 'scale(1)',
              outline: selectedImages.includes(id) ? '2px solid' : 'none',
              outlineColor: 'primary.main',
              outlineOffset: 2,
              position: 'relative',
              overflow: 'visible',
              animation: `fadeIn 0.6s ease ${index * 0.05}s both`,
              '@keyframes fadeIn': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(20px)'
                },
                '100%': {
                  opacity: 1,
                  transform: selectedImages.includes(id) 
                    ? 'scale(0.98) translateY(-3px)' 
                    : 'translateY(0)'
                }
              }
            }}
          >
            {selectionMode && (
              <Checkbox
                checked={selectedImages.includes(id)}
                onChange={() => onToggleSelection(id)}
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
                icon={
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: 'primary.main',
                    }}
                  />
                }
                checkedIcon={
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: 'primary.main',
                      animation: 'scaleIn 0.2s cubic-bezier(0.2, 0, 0.13, 1.5)',
                      '@keyframes scaleIn': {
                        '0%': { transform: 'scale(0)' },
                        '100%': { transform: 'scale(1)' }
                      }
                    }}
                  >
                    <CheckCircleIcon fontSize="small" />
                  </Avatar>
                }
              />
            )}

            {/* Compression Status Badge с улучшенной анимацией */}
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
                boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
                border: '1px solid',
                borderColor: theme => theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.5)'
                  : 'rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease, transform 0.2s ease',
                transform: 'perspective(100px)',
                transformStyle: 'preserve-3d',
                '&:hover': {
                  transform: 'perspective(100px) translateZ(5px)'
                }
              }}
            >
              <CompressIcon
                fontSize="small"
                color={image.compressionLevel > 0 ? "success" : "disabled"}
                sx={{
                  mr: 0.5,
                  animation: image.compressionLevel > 0 
                    ? 'pulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1)' 
                    : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 0.7 },
                    '50%': { opacity: 1 }
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

            {/* Улучшенное отображение изображений */}
            <Box
              sx={{
                overflow: 'hidden',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                position: 'relative'
              }}
            >
              <CardActionArea
                onClick={selectionMode ? () => onToggleSelection(id) : () => onViewImage(id)}
                sx={{ flexGrow: 0 }}
              >
                <CardMedia
                  component="img"
                  height="220"
                  image={ImageService.getImageUrl(id)}
                  alt={image.originalFilename}
                  sx={{
                    objectFit: 'cover',
                    transition: 'transform 0.6s cubic-bezier(0.25, 0.45, 0.45, 0.95), filter 0.3s ease',
                    filter: hoveredCard === id ? 'brightness(1.08) contrast(1.05)' : 'brightness(1)',
                    transform: hoveredCard === id ? 'scale(1.08)' : 'scale(1)', // Enhanced scaling effect
                    '&:hover': {
                      filter: 'brightness(1.1) contrast(1.08)', // Slightly stronger effect on direct hover
                    }
                  }}
                  loading="lazy"
                />
                {/* Наложение при наведении курсора */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    bgcolor: 'rgba(0,0,0,0.03)',
                    opacity: hoveredCard === id ? 1 : 0,
                    transition: 'opacity 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <IconButton
                    size="large"
                    color="primary"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.8)',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                      opacity: hoveredCard === id ? 1 : 0,
                      transform: hoveredCard === id ? 'scale(1)' : 'scale(0.7)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                        transform: 'scale(1.1)'
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewImage(id);
                    }}
                  >
                    <InfoIcon />
                  </IconButton>
                </Box>
              </CardActionArea>
            </Box>

            {/* Индикатор загрузки для скелетонов изображений */}
            {loading && (
              <Box 
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '220px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0,0,0,0.4)'
                }}
              >
                <CircularProgress color="primary" />
              </Box>
            )}

            <CardContent sx={{ flexGrow: 1, p: 3, pb: 2 }}>
              <Typography
                variant="h6"
                noWrap
                title={image.originalFilename}
                sx={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  mb: 0.5,
                  transition: 'all 0.2s ease',
                  color: theme => theme.palette.mode === 'light' 
                    ? hoveredCard === id ? theme.palette.primary.main : theme.palette.text.primary
                    : hoveredCard === id ? theme.palette.primary.light : theme.palette.text.primary
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
                  {image.uploadedAt ? new Date(image.uploadedAt).toLocaleDateString() : '-'}
                </Box>
              </Box>

              {/* Size info before/after compression с 3D-эффектами */}
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
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    transform: hoveredCard === id ? 'translateY(-3px)' : 'translateY(0)',
                    boxShadow: hoveredCard === id 
                      ? '0 6px 12px rgba(0,0,0,0.08)'
                      : '0 2px 6px rgba(0,0,0,0.03)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Исправленный фон: не накладывается на текст, не доходит до краев */}
                  <Box 
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 16,
                      right: 16,
                      bottom: 8,
                      background: theme => theme.palette.mode === 'light' 
                        ? 'radial-gradient(circle, rgba(76,175,80,0.10) 0%, rgba(76,175,80,0) 80%)'
                        : 'radial-gradient(circle, rgba(76,175,80,0.16) 0%, rgba(76,175,80,0) 80%)',
                      opacity: hoveredCard === id ? 0.7 : 0.3,
                      mixBlendMode: 'multiply',
                      borderRadius: 2,
                      zIndex: 0,
                      pointerEvents: 'none'
                    }}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Исходный:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatFileSize(originalSizes[image.id] || Math.round(image.size / (1 - image.compressionLevel / 100)))}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography 
                        variant="body2" 
                        color="success.main" 
                        fontWeight="medium"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        <CompressIcon fontSize="small" />
                        Экономия:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="success.main" 
                        fontWeight="medium"
                        sx={{
                          background: 'linear-gradient(90deg, #4caf50, #8bc34a)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {formatFileSize((originalSizes[image.id] || Math.round(image.size / (1 - image.compressionLevel / 100))) - image.size)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              )}

              <Box 
                display="flex" 
                flexWrap="wrap" 
                gap={0.8} 
                mt={1.5}
                sx={{
                  '& .MuiChip-root': {
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)'
                    }
                  }
                }}
              >
                <Chip
                  size="small"
                  label={image.compressionLevel > 0 ? 'Сжато' : 'Оригинал'}
                  color={image.compressionLevel > 0 ? 'success' : 'info'}
                  sx={{
                    borderRadius: '50px',
                    px: 0.5,
                    fontWeight: 500,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                    background: image.compressionLevel > 0
                      ? 'linear-gradient(45deg, #4caf50, #81c784)'
                      : 'linear-gradient(45deg, #42a5f5, #64b5f6)'
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
                  label={imageStatistics[id]?.viewCount || image.accessCount || 0}
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
                  label={imageStatistics[id]?.downloadCount || 0}
                  variant="outlined"
                  title="Количество загрузок"
                  sx={{
                    borderRadius: '50px',
                    fontWeight: 500
                  }}
                />
                {(imageStatistics[id]?.popularityScore || 0) > 10 && (
                  <Chip
                    size="small"
                    icon={<FavoriteBorderIcon sx={{ fontSize: '1rem !important' }} />}
                    label="Popular"
                    color="secondary"
                    variant="filled"
                    title="Популярное изображение"
                    sx={{
                      borderRadius: '50px',
                      fontWeight: 500,
                      background: 'linear-gradient(45deg, #ff4081, #f48fb1)',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.8 }
                      }
                    }}
                  />
                )}
              </Box>
            </CardContent>

            <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
              <Button
                size="small"
                startIcon={<InfoIcon />}
                onClick={() => onViewImage(id)}
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
                      : 'linear-gradient(to right, rgba(25, 118, 210, 0.25), rgba(25, 118, 210, 0.1))',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Просмотр
              </Button>

              {/* Кнопка скачивания с анимацией и эффектом прогресса */}
              <Button
                size="small"
                startIcon={downloadingImage === id ? (
                  <CircularProgress 
                    size={16} 
                    thickness={5}
                    sx={{ color: 'inherit' }}
                  /> 
                ) : (
                  <DownloadIcon />
                )}
                onClick={(e) => {
                  e.preventDefault();
                  handleDownloadClick(id, image.originalFilename);
                }}
                disabled={downloadingImage === id}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 500,
                  ml: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)'
                  },
                  background: downloadingImage === id ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
                }}
              >
                {downloadingImage === id ? 'Загрузка...' : 'Скачать'}
              </Button>

              <Box flexGrow={1} />

              <Tooltip title="Удалить">
                <IconButton
                  color="error"
                  onClick={() => onDeleteImage(id)}
                  size="small"
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'error.light',
                      transform: 'rotate(90deg) scale(1.1)',
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

      {/* Pagination Controls */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
        <Pagination
          count={totalPages}
          page={currentPage + 1} 
          onChange={onPageChange}
          color="primary"
          sx={{
            '& .MuiPaginationItem-root': {
              borderRadius: '50%',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.1)'
              }
            }
          }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="page-size-select-label">На странице</InputLabel>
          <Select
            labelId="page-size-select-label"
            value={pageSize}
            onChange={onPageSizeChange}
            label="На странице"
          >
            {[10, 20, 50, 100].map(size => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
};

export default ImageGallery;