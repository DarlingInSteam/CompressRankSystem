import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  Divider, 
  Chip, 
  Button, 
  IconButton, 
  Card, 
  CardContent,
  CardActions,
  CardMedia,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Skeleton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack,
  Breadcrumbs,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  MenuBook as MenuBookIcon,
  CollectionsBookmark as VolumeIcon,
  Book as ChapterIcon,
  ImageOutlined as PageIcon,
  Visibility as VisibilityIcon,
  CloudUpload as UploadIcon,
  Check as CheckIcon,
  HourglassEmpty as HourglassIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Manga, Volume, Chapter, MangaStatus } from '../../types/manga.types';
import mangaService from '../../services/manga.service';

const MangaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVolume, setExpandedVolume] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteItemType, setDeleteItemType] = useState<'manga' | 'volume' | 'chapter'>('manga');

  useEffect(() => {
    fetchMangaDetails();
  }, [id]);

  const fetchMangaDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const mangaData = await mangaService.getManga(id, true); // true to include volumes
      setManga(mangaData);
      setError(null);
    } catch (err) {
      console.error('Error fetching manga details:', err);
      setError('Failed to load manga details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleVolumeAccordionChange = (volumeId: string) => {
    setExpandedVolume(expandedVolume === volumeId ? null : volumeId);
  };

  const handleDeleteClick = (itemId: string, type: 'manga' | 'volume' | 'chapter') => {
    setDeleteItemId(itemId);
    setDeleteItemType(type);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItemId) return;

    try {
      switch (deleteItemType) {
        case 'manga':
          await mangaService.deleteManga(deleteItemId);
          navigate('/manga');
          break;
        case 'volume':
          await mangaService.deleteVolume(deleteItemId);
          fetchMangaDetails(); // Refresh data
          break;
        case 'chapter':
          await mangaService.deleteChapter(deleteItemId);
          fetchMangaDetails(); // Refresh data
          break;
      }
    } catch (err) {
      console.error(`Error deleting ${deleteItemType}:`, err);
      setError(`Failed to delete ${deleteItemType}. Please try again later.`);
    } finally {
      setDeleteDialogOpen(false);
      setDeleteItemId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteItemId(null);
  };

  const getMangaStatusInfo = (status: MangaStatus | string) => {
    switch (status) {
      case MangaStatus.ONGOING:
        return { label: 'Онгоинг', color: 'success' as const };
      case MangaStatus.COMPLETED:
        return { label: 'Завершено', color: 'primary' as const };
      case MangaStatus.HIATUS:
        return { label: 'Хиатус', color: 'warning' as const };
      case MangaStatus.CANCELED:
        return { label: 'Отменено', color: 'error' as const };
      default:
        return { label: status || 'Неизвестно', color: 'default' as const };
    }
  };

  // Skeleton loader for the manga details
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Skeleton variant="text" width={200} height={40} />
            <Box sx={{ display: 'flex', mt: 1 }}>
              <Skeleton variant="rectangular" width={80} height={24} sx={{ mr: 1, borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            <Grid size={{ xs:12, md:4}}>
              <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 2 }} />
              
              <Box sx={{ mt: 2 }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={24} />
                <Box sx={{ mt: 2 }}>
                  <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                </Box>
              </Box>
            </Grid>
            
            <Grid size={{ xs:12, md:8}}>
              <Skeleton variant="text" width="40%" height={32} />
              <Skeleton variant="text" width="100%" height={120} sx={{ mt: 2 }} />
              
              <Box sx={{ mt: 3 }}>
                <Skeleton variant="text" width="30%" height={32} />
                <Skeleton variant="rectangular" height={60} sx={{ mt: 1, borderRadius: 1 }} />
                <Skeleton variant="rectangular" height={60} sx={{ mt: 1, borderRadius: 1 }} />
                <Skeleton variant="rectangular" height={60} sx={{ mt: 1, borderRadius: 1 }} />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
          <WarningIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" color="error" gutterBottom>
            {error}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/manga')}
            sx={{ mt: 2 }}
          >
            Back to Manga Gallery
          </Button>
        </Paper>
      </Container>
    );
  }

  // If no manga data
  if (!manga) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Manga not found
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/manga')}
            sx={{ mt: 2 }}
          >
            Back to Manga Gallery
          </Button>
        </Paper>
      </Container>
    );
  }

  // Helper function to get total pages count for a volume
  const getVolumePageCount = (volume: Volume): number => {
    return volume.chapters?.reduce((total, chapter) => total + (chapter.pageCount || 0), 0) || 0;
  };

  // Prepare genres for display
  const genres = manga.genres?.split(',').map(g => g.trim()) || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs navigation */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link to="/" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>
          Home
        </Link>
        <Link to="/manga" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>
          Manga Gallery
        </Link>
        <Typography color="text.primary">{manga.title}</Typography>
      </Breadcrumbs>

      <Paper 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          background: theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.9)'
            : 'rgba(30, 30, 30, 0.75)',
          backdropFilter: 'blur(10px)',
          boxShadow: theme.palette.mode === 'light'
            ? '0 8px 32px rgba(0, 0, 0, 0.1)'
            : '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            mb: 3
          }}
        >
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <MenuBookIcon fontSize="large" color="primary" />
              {manga.title}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              {/* Status chip */}
              {manga.status && (
                <Chip
                  label={getMangaStatusInfo(manga.status).label}
                  color={getMangaStatusInfo(manga.status).color}
                  size="small"
                  sx={{ borderRadius: '16px' }}
                />
              )}
              
              {/* View count */}
              <Chip
                icon={<VisibilityIcon fontSize="small" />}
                label={`${manga.viewCount || 0} просмотров`}
                variant="outlined"
                size="small"
                sx={{ borderRadius: '16px' }}
              />
              
              {/* Publication status */}
              <Chip
                icon={manga.published ? <CheckIcon fontSize="small" /> : <HourglassIcon fontSize="small" />}
                label={manga.published ? "Опубликовано" : "Не опубликовано"}
                variant="outlined"
                size="small"
                color={manga.published ? "success" : "default"}
                sx={{ borderRadius: '16px' }}
              />
            </Box>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/manga')}
              sx={{ borderRadius: '10px' }}
            >
              К галерее
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/manga/${id}/edit`)}
              sx={{ borderRadius: '10px' }}
            >
              Редактировать
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleDeleteClick(manga.id, 'manga')}
              sx={{ borderRadius: '10px' }}
            >
              Удалить
            </Button>
          </Stack>
        </Box>
        
        <Grid container spacing={3}>
          {/* Left column - Cover image and metadata */}
          <Grid size={{ xs:12, md:4}}>
            <Card 
              elevation={0} 
              sx={{ 
                borderRadius: 2, 
                overflow: 'hidden',
                boxShadow: theme.palette.mode === 'light'
                  ? '0 4px 20px rgba(0, 0, 0, 0.1)'
                  : '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              <CardMedia
                component="img"
                image={manga.coverImageUrl || `https://via.placeholder.com/400x600?text=${encodeURIComponent(manga.title)}`}
                alt={manga.title}
                sx={{ 
                  height: 350, 
                  objectFit: 'cover',
                  objectPosition: 'center top'
                }}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Автор:</strong> {manga.author}
                </Typography>
                {manga.artist && manga.artist !== manga.author && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Художник:</strong> {manga.artist}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Добавлено:</strong> {new Date(manga.createdAt).toLocaleDateString()}
                </Typography>
                {manga.updatedAt && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Обновлено:</strong> {new Date(manga.updatedAt).toLocaleDateString()}
                  </Typography>
                )}
                
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {genres.map((genre) => (
                    <Chip
                      key={genre}
                      label={genre}
                      size="small"
                      sx={{ borderRadius: '16px' }}
                    />
                  ))}
                </Box>
              </CardContent>
              
              <CardActions>
                <Button 
                  startIcon={<UploadIcon />} 
                  fullWidth
                  variant="contained"
                  onClick={() => navigate(`/manga/${id}/upload-cover`)}
                  sx={{
                    borderRadius: '10px',
                    py: 1
                  }}
                >
                  Загрузить обложку
                </Button>
              </CardActions>
            </Card>
            
            {/* Statistics */}
            <Card 
              elevation={0} 
              sx={{ 
                mt: 3, 
                borderRadius: 2,
                boxShadow: theme.palette.mode === 'light'
                  ? '0 4px 20px rgba(0, 0, 0, 0.05)'
                  : '0 4px 20px rgba(0, 0, 0, 0.2)',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Статистика
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs:4}}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {manga.volumeCount || manga.volumes?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Томов
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs:4}}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {manga.chapterCount || 
                          manga.volumes?.reduce((total, volume) => total + (volume.chapters?.length || 0), 0) || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Глав
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs:4}}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {manga.pageCount || 
                          manga.volumes?.reduce((total, volume) => {
                            return total + getVolumePageCount(volume);
                          }, 0) || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Страниц
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Right column - Description, volumes and chapters */}
          <Grid size={{ xs:12, md:8}}>
            {/* Description */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                mb: 3,
                boxShadow: theme.palette.mode === 'light'
                  ? '0 4px 15px rgba(0, 0, 0, 0.05)'
                  : '0 4px 15px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Typography variant="h6" gutterBottom>
                Описание
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {manga.description || "Описание отсутствует"}
              </Typography>
            </Paper>
            
            {/* Volumes and Chapters */}
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2
              }}
            >
              <Typography variant="h6">
                Тома и главы
              </Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() => navigate(`/manga/${id}/volumes/create`)}
                sx={{ borderRadius: '10px' }}
              >
                Добавить том
              </Button>
            </Box>
            
            {manga.volumes && manga.volumes.length > 0 ? (
              manga.volumes.map((volume) => (
                <Accordion 
                  key={volume.id} 
                  expanded={expandedVolume === volume.id}
                  onChange={() => handleVolumeAccordionChange(volume.id)}
                  sx={{ 
                    mb: 2,
                    borderRadius: '12px !important',
                    overflow: 'hidden',
                    '&:before': { display: 'none' }, // Remove the default divider
                    boxShadow: theme.palette.mode === 'light'
                      ? '0 4px 15px rgba(0, 0, 0, 0.05)'
                      : '0 4px 15px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      backgroundColor: expandedVolume === volume.id ? 
                        alpha(theme.palette.primary.main, 0.05) : 'transparent'
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Typography>
                          <Box component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
                            Том {volume.volumeNumber}:
                          </Box>
                          {volume.title || `Том ${volume.volumeNumber}`}
                        </Typography>
                        <Box>
                          <Chip 
                            size="small" 
                            label={`${volume.chapters?.length || 0} глав`}
                            sx={{ mr: 1, borderRadius: '10px' }}
                          />
                          <Chip 
                            size="small" 
                            label={`${getVolumePageCount(volume)} страниц`}
                            sx={{ borderRadius: '10px' }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/manga/${id}/volumes/${volume.id}/chapters/create`)}
                      >
                        Добавить главу
                      </Button>
                      <Box>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => navigate(`/manga/${id}/volumes/${volume.id}/edit`)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteClick(volume.id, 'volume')}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    {volume.chapters && volume.chapters.length > 0 ? (
                      <List sx={{ pt: 0 }}>
                        {volume.chapters.map((chapter) => (
                          <ListItem
                            key={chapter.id}
                            component="div"
                            onClick={() => navigate(`/manga/${id}/volumes/${volume.id}/chapters/${chapter.id}`)}
                            sx={{ 
                              borderRadius: 2,
                              mb: 1, 
                              backgroundColor: theme.palette.mode === 'light' 
                                ? alpha(theme.palette.background.paper, 0.7)
                                : alpha(theme.palette.background.paper, 0.2),
                              '&:hover': {
                                backgroundColor: theme.palette.mode === 'light'
                                  ? alpha(theme.palette.primary.main, 0.05)
                                  : alpha(theme.palette.primary.main, 0.15),
                                cursor: 'pointer'
                              }
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <ChapterIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                  <Typography variant="body1">
                                    <Box component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
                                      Глава {chapter.chapterNumber}:
                                    </Box>
                                    {chapter.title || `Глава ${chapter.chapterNumber}`}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {chapter.pageCount || 0} страниц
                                  </Typography>
                                </Box>
                              }
                            />
                            <Box>
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/manga/${id}/volumes/${volume.id}/chapters/${chapter.id}/edit`);
                                }}
                                sx={{ mr: 1 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(chapter.id, 'chapter');
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Box 
                        sx={{ 
                          textAlign: 'center', 
                          py: 3,
                          backgroundColor: alpha(theme.palette.background.paper, 0.4),
                          borderRadius: 2
                        }}
                      >
                        <Typography color="text.secondary" gutterBottom>
                          В этом томе пока нет глав
                        </Typography>
                        <Button
                          startIcon={<AddIcon />}
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/manga/${id}/volumes/${volume.id}/chapters/create`)}
                          sx={{ mt: 1 }}
                        >
                          Добавить главу
                        </Button>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))
            ) : (
              <Paper 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.4),
                }}
              >
                <VolumeIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  У этой манги пока нет томов
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  onClick={() => navigate(`/manga/${id}/volumes/create`)}
                  sx={{ mt: 2, borderRadius: '10px' }}
                >
                  Добавить том
                </Button>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>
          Подтверждение удаления
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteItemType === 'manga' && 'Вы уверены, что хотите удалить эту мангу? Это действие нельзя отменить.'}
            {deleteItemType === 'volume' && 'Вы уверены, что хотите удалить этот том? Все главы и страницы в этом томе будут удалены.'}
            {deleteItemType === 'chapter' && 'Вы уверены, что хотите удалить эту главу? Все страницы в этой главе будут удалены.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Отмена
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MangaDetailPage;