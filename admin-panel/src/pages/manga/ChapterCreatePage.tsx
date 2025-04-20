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
  Skeleton,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Book as ChapterIcon,
  CollectionsBookmark as VolumeIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Volume, Chapter, Manga } from '../../types/manga.types';
import mangaService from '../../services/manga.service';

const ChapterCreatePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id: mangaId, volumeId } = useParams<{ id: string; volumeId: string }>();

  // States
  const [chapter, setChapter] = useState<Partial<Chapter>>({
    title: '',
    chapterNumber: 1,
    published: false,
  });
  const [manga, setManga] = useState<Manga | null>(null);
  const [volume, setVolume] = useState<Volume | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [nextStep, setNextStep] = useState<boolean>(false);

  // Fetch manga and volume details
  useEffect(() => {
    const fetchDetails = async () => {
      if (!mangaId || !volumeId) return;

      try {
        setInitialLoading(true);
        
        // Fetch manga details
        const mangaData = await mangaService.getManga(mangaId, false);
        setManga(mangaData);
        
        // Fetch volume details
        const volumeData = await mangaService.getVolume(volumeId, true);
        setVolume(volumeData);
        
        // Set next chapter number based on existing chapters
        if (volumeData.chapters && volumeData.chapters.length > 0) {
          const maxChapterNumber = Math.max(...volumeData.chapters.map(c => c.chapterNumber));
          setChapter(prev => ({ ...prev, chapterNumber: maxChapterNumber + 1 }));
        }
        
      } catch (err: any) {
        console.error('Error fetching details:', err);
        setError('Не удалось загрузить информацию о томе');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchDetails();
  }, [mangaId, volumeId]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'chapterNumber') {
      // Allow decimal values for chapter numbers (e.g., 1.5)
      const chapterNumber = parseFloat(value);
      if (isNaN(chapterNumber) || chapterNumber <= 0) return;
      setChapter(prev => ({ ...prev, [name]: chapterNumber }));
    } else {
      setChapter(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle published switch
  const handlePublishedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChapter(prev => ({ ...prev, published: e.target.checked }));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mangaId || !volumeId) {
      setError('ID манги или тома отсутствует');
      return;
    }
    
    if (!chapter.chapterNumber) {
      setError('Пожалуйста, укажите номер главы');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const createdChapter = await mangaService.createChapter(volumeId, chapter);
      
      setSuccess(true);
      setNextStep(true);
      
    } catch (err: any) {
      console.error('Error creating chapter:', err);
      setError(err.response?.data?.message || 'Не удалось создать главу. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  // Go to page upload
  const handleGoToPageUpload = () => {
    if (success && chapter.id) {
      navigate(`/manga/${mangaId}/volumes/${volumeId}/chapters/${chapter.id}/pages/upload`);
    }
  };

  // Go back to manga detail
  const handleGoBackToManga = () => {
    navigate(`/manga/${mangaId}`);
  };

  // Loading state
  if (initialLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Skeleton variant="text" width="50%" height={40} />
            <Skeleton variant="text" width="30%" height={24} />
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
          </Box>
        </Paper>
      </Container>
    );
  }

  // Error state when manga or volume is not found
  if ((!manga || !volume) && !initialLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {!manga ? 'Манга не найдена' : 'Том не найден'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/manga')}
            sx={{ mt: 2 }}
          >
            Вернуться к галерее
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
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
          <Link to={`/manga/${mangaId}`} style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>
            {manga?.title}
          </Link>
          <Typography color="text.primary">Создание главы</Typography>
        </Breadcrumbs>

        <Box 
          sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
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
              <ChapterIcon fontSize="large" color="primary" />
              Создание главы
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={1}>
              Манга: {manga?.title}, Том {volume?.volumeNumber}: {volume?.title || `Том ${volume?.volumeNumber}`}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/manga/${mangaId}`)}
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

        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3, borderRadius: 2 }}
          >
            Глава успешно создана!
          </Alert>
        )}

        {!success ? (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={{ xs:12, md:8}}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    borderRadius: 2,
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Информация о главе
                  </Typography>
                  
                  <TextField
                    label="Номер главы *"
                    name="chapterNumber"
                    type="number"
                    value={chapter.chapterNumber}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    required
                    InputProps={{ 
                      inputProps: { 
                        min: 0.1, 
                        step: 0.1
                      } 
                    }}
                    sx={{ mb: 3 }}
                    disabled={loading}
                    helperText="Можно указать дробное число (например, 1.5)"
                  />

                  <TextField
                    label="Название главы"
                    name="title"
                    value={chapter.title}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 3 }}
                    disabled={loading}
                    helperText="Оставьте пустым для автоматического названия по номеру главы"
                  />
                </Paper>

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
                    Настройки публикации
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={chapter.published}
                        onChange={handlePublishedChange}
                        disabled={loading}
                      />
                    }
                    label="Опубликовано"
                  />
                </Paper>
              </Grid>

              <Grid size={{ xs:12, md:4}}>
                <Box sx={{ position: 'sticky', top: '20px' }}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3,
                      borderRadius: 2,
                      mb: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: theme.palette.mode === 'light' 
                        ? 'rgba(255, 255, 255, 0.8)'
                        : 'rgba(50, 50, 50, 0.8)',
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Действия
                    </Typography>

                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="large"
                      disabled={loading || success}
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                      sx={{
                        py: 1.2,
                        borderRadius: '10px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        mb: 2
                      }}
                    >
                      {loading ? 'Создание...' : 'Создать главу'}
                    </Button>

                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => navigate(`/manga/${mangaId}`)}
                      disabled={loading}
                      startIcon={<ArrowBackIcon />}
                      sx={{ borderRadius: '10px' }}
                    >
                      Отмена
                    </Button>
                  </Paper>

                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      После создания главы вы сможете загрузить страницы
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </form>
        ) : (
          <Box>
            <Paper
              elevation={0}
              sx={{ 
                p: 4,
                borderRadius: 2,
                mb: 3,
                border: '1px solid',
                borderColor: 'divider',
                textAlign: 'center'
              }}
            >
              <Typography variant="h5" gutterBottom>
                Глава успешно создана!
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Теперь вы можете добавить страницы в созданную главу или вернуться к манге
              </Typography>
              
              <Divider sx={{ my: 3 }} />
              
              <Grid container spacing={2}>
                <Grid size={{ xs:12, sm:6}}>
                  <Button
                    variant="contained"
                    fullWidth
                    color="primary"
                    size="large"
                    onClick={handleGoToPageUpload}
                    sx={{ borderRadius: '10px', py: 1.2 }}
                  >
                    Загрузить страницы
                  </Button>
                </Grid>
                <Grid size={{ xs:12, sm:6}}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleGoBackToManga}
                    sx={{ borderRadius: '10px', py: 1.2 }}
                  >
                    Вернуться к манге
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ChapterCreatePage;