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
  useTheme,
  Skeleton,
  alpha,
  Avatar,
  Stack
} from '@mui/material';
import {
  Info as InfoIcon,
  Delete as DeleteIcon,
  Book as BookIcon,
  MenuBook as MenuBookIcon,
  LibraryBooks as LibraryBooksIcon,
  CollectionsBookmark as CollectionsBookmarkIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Manga, MangaStatus } from '../../types/manga.types';

// Функция для отображения статуса манги
const getMangaStatusInfo = (status: string) => {
  switch (status) {
    case MangaStatus.ONGOING:
      return { label: 'Онгоинг', color: 'success' as const, icon: <MenuBookIcon fontSize="small" /> };
    case MangaStatus.COMPLETED:
      return { label: 'Завершено', color: 'primary' as const, icon: <LibraryBooksIcon fontSize="small" /> };
    case MangaStatus.HIATUS:
      return { label: 'Хиатус', color: 'warning' as const, icon: <CollectionsBookmarkIcon fontSize="small" /> };
    case MangaStatus.CANCELED:
      return { label: 'Отменено', color: 'error' as const, icon: <BookIcon fontSize="small" /> };
    default:
      return { label: 'Неизвестно', color: 'default' as const, icon: <BookIcon fontSize="small" /> };
  }
};

interface MangaGalleryProps {
  mangas: Manga[];
  selectionMode?: boolean;
  selectedMangas?: string[];
  onToggleSelection?: (id: string) => void;
  onViewManga?: (id: string) => void;
  onDeleteManga?: (id: string) => void;
  loading?: boolean;
}

const MangaGallery: React.FC<MangaGalleryProps> = ({
  mangas,
  selectionMode = false,
  selectedMangas = [],
  onToggleSelection = () => {},
  onViewManga = () => {},
  onDeleteManga = () => {},
  loading = false
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Состояние для эффектов наведения и взаимодействия
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  if (loading) {
    // Скелеты загрузки с анимацией пульсации
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
              lg: 'repeat(4, minmax(0, 1fr))'
            },
            gap: '16px',
            width: '100%'
          }}
        >
          {[...Array(8)].map((_, index) => (
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
                height={260} 
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

  if (mangas.length === 0) {
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
          src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1ib29rIj48cGF0aCBkPSJNNCAxOS41QTIuNSAyLjUgMCAwIDEgNi41IDE3SDIwIj48L3BhdGg+PHBhdGggZD0iTTYuNSAySDIwdjIwSDYuNUEyLjUgMi41IDAgMCAxIDQgMTkuNXYtMTVBMi41IDIuNSAwIDAgMSA2LjUgMnoiPjwvcGF0aD48L3N2Zz4="
          alt="No manga"
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
          Нет манги, соответствующей заданным критериям
        </Typography>
        <Button 
          variant="contained"
          onClick={() => navigate('/manga/create')}
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
          Создать мангу
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
            lg: 'repeat(4, minmax(0, 1fr))'
          },
          gap: { xs: '12px', md: '16px', lg: '20px' },
          width: '100%'
        }}
      >
        {mangas.map((manga, index) => {
          const statusInfo = getMangaStatusInfo(manga.status);
          
          // Convert genres string to array if it exists
          const genresArray = manga.genres ? manga.genres.split(',').map(genre => genre.trim()) : [];
          
          return (
            <Card
              key={manga.id}
              onMouseEnter={() => setHoveredCard(manga.id)}
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
                  if (selectedMangas.includes(manga.id)) return theme.palette.primary.main;
                  return theme.palette.mode === 'light'
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(255, 255, 255, 0.1)';
                },
                boxShadow: theme => {
                  if (hoveredCard === manga.id) {
                    return theme.palette.mode === 'light'
                      ? '0 14px 28px rgba(70, 70, 70, 0.2), 0 10px 10px rgba(70, 70, 70, 0.15)'
                      : '0 14px 28px rgba(0, 0, 0, 0.3), 0 10px 10px rgba(0, 0, 0, 0.22)';
                  }
                  return theme.palette.mode === 'light'
                    ? '0 8px 16px rgba(70, 70, 70, 0.1)'
                    : '0 8px 16px rgba(0, 0, 0, 0.3)';
                },
                transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                transform: selectedMangas.includes(manga.id) 
                  ? 'scale(0.98) translateY(-3px)' 
                  : hoveredCard === manga.id 
                    ? 'translateY(-10px) scale(1.02)' 
                    : 'scale(1)',
                outline: selectedMangas.includes(manga.id) ? '2px solid' : 'none',
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
                    transform: selectedMangas.includes(manga.id) 
                      ? 'scale(0.98) translateY(-3px)' 
                      : 'translateY(0)'
                  }
                }
              }}
            >
              {selectionMode && (
                <Checkbox
                  checked={selectedMangas.includes(manga.id)}
                  onChange={() => onToggleSelection(manga.id)}
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

              {/* Status Badge */}
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
                {React.cloneElement(statusInfo.icon, {
                  fontSize: 'small',
                  color: statusInfo.color,
                  sx: { mr: 0.5 }
                })}
                <Typography
                  variant="caption"
                  fontWeight="medium"
                  component="span"
                >
                  {statusInfo.label}
                </Typography>
              </Box>

              {/* Cover Image */}
              <Box
                sx={{
                  overflow: 'hidden',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px',
                  position: 'relative'
                }}
              >
                <CardActionArea
                  onClick={selectionMode ? () => onToggleSelection(manga.id) : () => onViewManga(manga.id)}
                  sx={{ flexGrow: 0 }}
                >
                  <CardMedia
                    component="img"
                    height="260"
                    image={manga.coverImageUrl || `https://via.placeholder.com/400x600?text=${encodeURIComponent(manga.title)}`}
                    alt={manga.title}
                    sx={{
                      objectFit: 'cover',
                      transition: 'transform 0.6s cubic-bezier(0.25, 0.45, 0.45, 0.95), filter 0.3s ease',
                      filter: hoveredCard === manga.id ? 'brightness(1.08) contrast(1.05)' : 'brightness(1)',
                      transform: hoveredCard === manga.id ? 'scale(1.08)' : 'scale(1)', 
                      '&:hover': {
                        filter: 'brightness(1.1) contrast(1.08)',
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
                      opacity: hoveredCard === manga.id ? 1 : 0,
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
                        opacity: hoveredCard === manga.id ? 1 : 0,
                        transform: hoveredCard === manga.id ? 'scale(1)' : 'scale(0.7)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.9)',
                          transform: 'scale(1.1)'
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewManga(manga.id);
                      }}
                    >
                      <InfoIcon />
                    </IconButton>
                  </Box>
                </CardActionArea>
              </Box>

              <CardContent sx={{ flexGrow: 1, p: 3, pb: 2 }}>
                <Typography
                  variant="h6"
                  noWrap
                  title={manga.title}
                  sx={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    mb: 0.5,
                    transition: 'all 0.2s ease',
                    color: theme => theme.palette.mode === 'light' 
                      ? hoveredCard === manga.id ? theme.palette.primary.main : theme.palette.text.primary
                      : hoveredCard === manga.id ? theme.palette.primary.light : theme.palette.text.primary
                  }}
                >
                  {manga.title}
                </Typography>

                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 2,
                  color: 'text.secondary',
                  fontSize: '0.875rem'
                }}>
                  <Box component="span" sx={{ fontWeight: 500 }}>
                    {manga.author}
                  </Box>
                  {manga.artist && manga.artist !== manga.author && (
                    <>
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
                        {manga.artist}
                      </Box>
                    </>
                  )}
                </Box>

                {/* Description */}
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    height: '4.5em'
                  }}
                >
                  {manga.description}
                </Typography>

                {/* Volume info */}
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Томов:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {manga.volumeCount || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Просмотры:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {manga.viewCount}
                    </Typography>
                  </Box>
                </Box>

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
                  {genresArray.length > 0 ? (
                    <>
                      {genresArray.slice(0, 3).map((genre) => (
                        <Chip
                          key={genre}
                          size="small"
                          label={genre}
                          sx={{
                            borderRadius: '50px',
                            fontWeight: 500
                          }}
                        />
                      ))}
                      {genresArray.length > 3 && (
                        <Chip
                          size="small"
                          label={`+${genresArray.length - 3}`}
                          variant="outlined"
                          sx={{
                            borderRadius: '50px',
                            fontWeight: 500
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Нет жанров
                    </Typography>
                  )}
                </Box>
              </CardContent>

              <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                <Button
                  size="small"
                  startIcon={<InfoIcon />}
                  onClick={() => onViewManga(manga.id)}
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
                  Подробнее
                </Button>

                <Box flexGrow={1} />

                {onDeleteManga && (
                  <Tooltip title="Удалить">
                    <IconButton
                      color="error"
                      onClick={() => onDeleteManga(manga.id)}
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
                )}
              </CardActions>
            </Card>
          );
        })}
      </Grid>
    </Box>
  );
};

export default MangaGallery;