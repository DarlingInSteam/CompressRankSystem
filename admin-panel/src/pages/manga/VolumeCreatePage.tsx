import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Grid,
  useTheme,
  Breadcrumbs,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CollectionsBookmark as VolumeIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Volume, Manga } from '../../types/manga.types';
import mangaService from '../../services/manga.service';

const VolumeCreatePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id: mangaId } = useParams<{ id: string }>();

  // Manga data
  const [manga, setManga] = useState<Manga | null>(null);
  const [loadingManga, setLoadingManga] = useState<boolean>(true);
  const [mangaError, setMangaError] = useState<string | null>(null);

  // Form state
  const [volume, setVolume] = useState<Partial<Volume>>({
    title: '',
    volumeNumber: 1,
    published: false
  });

  // Form submission state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [createdVolumeId, setCreatedVolumeId] = useState<string | null>(null);

  // Fetch manga data
  useEffect(() => {
    const fetchManga = async () => {
      if (!mangaId) return;
      
      try {
        setLoadingManga(true);
        const mangaData = await mangaService.getManga(mangaId);
        setManga(mangaData);
        
        // Auto-increment volume number based on existing volumes
        if (mangaData.volumes && mangaData.volumes.length > 0) {
          const maxVolumeNumber = Math.max(...mangaData.volumes.map(v => v.volumeNumber));
          setVolume(prev => ({ ...prev, volumeNumber: maxVolumeNumber + 1 }));
        }
      } catch (err) {
        console.error('Error fetching manga:', err);
        setMangaError('Не удалось загрузить информацию о манге');
      } finally {
        setLoadingManga(false);
      }
    };
    
    fetchManga();
  }, [mangaId]);

  // Handle text field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for volume number (convert to number)
    if (name === 'volumeNumber') {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue > 0) {
        setVolume(prev => ({ ...prev, [name]: numValue }));
      }
    } else {
      setVolume(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle published switch
  const handlePublishedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(prev => ({ ...prev, published: e.target.checked }));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mangaId) {
      setError('ID манги не найден');
      return;
    }
    
    // Basic validation
    if (!volume.volumeNumber || volume.volumeNumber <= 0) {
      setError('Номер тома должен быть положительным числом');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const createdVolume = await mangaService.createVolume(mangaId, volume);
      
      setSuccess(true);
      setCreatedVolumeId(createdVolume.id);
      
    } catch (err: any) {
      console.error('Error creating volume:', err);
      setError(err.response?.data?.message || 'Не удалось создать том. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers
  const handleNavigateToManga = () => {
    navigate(`/manga/${mangaId}`);
  };
  
  const handleNavigateToChapterCreate = () => {
    if (createdVolumeId) {
      navigate(`/manga/${mangaId}/volumes/${createdVolumeId}/chapters/create`);
    }
  };

  // Loading state
  if (loadingManga) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
          <CircularProgress size={50} sx={{ my: 4 }} />
          <Typography>Загрузка информации о манге...</Typography>
        </Paper>
      </Container>
    );
  }

  // Error state
  if (mangaError || !manga) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {mangaError || 'Манга не найдена'}
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/manga')}
          >
            Вернуться в галерею
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        elevation={0} 
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
        {/* Breadcrumbs navigation */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link to="/" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>
            Главная
          </Link>
          <Link to="/manga" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>
            Галерея манги
          </Link>
          <Link 
            to={`/manga/${mangaId}`} 
            style={{ textDecoration: 'none', color: theme.palette.text.secondary }}
          >
            {manga.title}
          </Link>
          <Typography color="text.primary">Добавление тома</Typography>
        </Breadcrumbs>
        
        <Box 
          sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2
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
              <VolumeIcon fontSize="large" color="primary" />
              Добавление тома
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={1}>
              Добавление нового тома для манги "{manga.title}"
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleNavigateToManga}
            sx={{ borderRadius: '10px' }}
          >
            К манге
          </Button>
        </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {success ? (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              textAlign: 'center', 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ color: 'success.main' }}>
              Том успешно создан!
            </Typography>
            <Typography variant="body1" paragraph>
              Теперь вы можете вернуться к манге или добавить главы к созданному тому.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleNavigateToManga}
                sx={{ borderRadius: '10px', px: 3 }}
              >
                Вернуться к манге
              </Button>
              <Button
                variant="contained"
                onClick={handleNavigateToChapterCreate}
                sx={{ borderRadius: '10px', px: 3 }}
              >
                Добавить главу
              </Button>
            </Box>
          </Paper>
        ) : (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={{ xs:12, md:8}}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Информация о томе
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs:12, sm:4}}>
                      <TextField
                        label="Номер тома *"
                        name="volumeNumber"
                        type="number"
                        value={volume.volumeNumber}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        required
                        disabled={loading}
                        inputProps={{ min: 1, step: 1 }}
                        helperText="Порядковый номер тома"
                      />
                    </Grid>
                    <Grid size={{ xs:12, sm:8}}>
                      <TextField
                        label="Название тома"
                        name="title"
                        value={volume.title}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        disabled={loading}
                        helperText="Необязательное название тома"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid size={{ xs:12, md:4}}>
                <Box sx={{ position: 'sticky', top: '20px' }}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      mb: 3
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Настройки публикации
                    </Typography>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={volume.published}
                          onChange={handlePublishedChange}
                          disabled={loading}
                        />
                      }
                      label="Опубликовать том"
                    />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Если включено, том будет виден в публичном доступе
                    </Typography>
                    
                    <Divider sx={{ my: 3 }} />
                    
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="large"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                      sx={{
                        py: 1.2,
                        borderRadius: '10px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        mb: 2
                      }}
                    >
                      {loading ? 'Создание...' : 'Создать том'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={handleNavigateToManga}
                      disabled={loading}
                      sx={{ borderRadius: '10px' }}
                    >
                      Отмена
                    </Button>
                  </Paper>
                  
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      После создания тома вы сможете добавить главы и загрузить страницы манги.
                      Обложку для тома можно будет загрузить на странице информации о манге.
                    </Typography>
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          </form>
        )}
      </Paper>
    </Container>
  );
};

export default VolumeCreatePage;