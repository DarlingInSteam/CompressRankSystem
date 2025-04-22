import React, { useState } from 'react';
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
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Chip,
  Autocomplete,
  Divider,
  Breadcrumbs,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { Manga, MangaStatus } from '../../types/manga.types';
import mangaService from '../../services/manga.service';

// Common manga genres for autocomplete
const commonGenres = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery',
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
  'Historical', 'Mecha', 'Psychological', 'Isekai', 'School', 'Martial Arts'
];

const MangaCreatePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Form state
  const [manga, setManga] = useState<Partial<Manga>>({
    title: '',
    description: '',
    author: '',
    artist: '',
    genres: '',
    status: MangaStatus.ONGOING,
    published: false
  });
  
  // Selected genres state (for the multi-select)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  
  // Form submission state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [createdMangaId, setCreatedMangaId] = useState<string | null>(null);

  // Handle text field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setManga(prev => ({ ...prev, [name]: value }));
  };

  // Handle status select change
  const handleStatusChange = (e: any) => {
    setManga(prev => ({ ...prev, status: e.target.value }));
  };

  // Handle published switch
  const handlePublishedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManga(prev => ({ ...prev, published: e.target.checked }));
  };

  // Handle genre selection
  const handleGenreChange = (_: any, values: string[]) => {
    setSelectedGenres(values);
    setManga(prev => ({ ...prev, genres: values.join(', ') }));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!manga.title?.trim()) {
      setError('Название манги обязательно для заполнения');
      return;
    }
    
    if (!manga.author?.trim()) {
      setError('Имя автора обязательно для заполнения');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const createdManga = await mangaService.createManga(manga);
      
      setSuccess(true);
      setCreatedMangaId(createdManga.id);
      
    } catch (err: any) {
      console.error('Error creating manga:', err);
      setError(err.response?.data?.message || 'Не удалось создать мангу. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to manga detail or volume creation
  const handleNavigateToMangaDetail = () => {
    if (createdMangaId) {
      navigate(`/manga/${createdMangaId}`);
    }
  };
  
  const handleNavigateToVolumeCreate = () => {
    if (createdMangaId) {
      navigate(`/manga/${createdMangaId}/volumes/create`);
    }
  };

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
          <Typography color="text.primary">Создание манги</Typography>
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
              <MenuBookIcon fontSize="large" color="primary" />
              Создание новой манги
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={1}>
              Заполните информацию о манге, после чего вы сможете добавить тома и главы
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/manga')}
            sx={{ borderRadius: '10px' }}
          >
            К галерее
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
              Манга успешно создана!
            </Typography>
            <Typography variant="body1" paragraph>
              Теперь вы можете просмотреть информацию о манге или сразу приступить к добавлению томов.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleNavigateToMangaDetail}
                sx={{ borderRadius: '10px', px: 3 }}
              >
                Просмотреть мангу
              </Button>
              <Button
                variant="contained"
                onClick={handleNavigateToVolumeCreate}
                sx={{ borderRadius: '10px', px: 3 }}
              >
                Добавить том
              </Button>
            </Box>
          </Paper>
        ) : (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Left column - Basic info */}
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
                    Основная информация
                  </Typography>
                  
                  <TextField
                    label="Название манги *"
                    name="title"
                    value={manga.title}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    required
                    sx={{ mb: 3 }}
                    disabled={loading}
                  />
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs:12, md:8}}>
                      <TextField
                        label="Автор *"
                        name="author"
                        value={manga.author}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        required
                        disabled={loading}
                        helperText="Сценарист, писатель"
                      />
                    </Grid>
                    <Grid size={{ xs:12, md:8}}>
                      <TextField
                        label="Художник"
                        name="artist"
                        value={manga.artist}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        disabled={loading}
                        helperText="Оставьте пустым, если совпадает с автором"
                      />
                    </Grid>
                  </Grid>
                  
                  <TextField
                    label="Описание"
                    name="description"
                    value={manga.description}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={5}
                    variant="outlined"
                    disabled={loading}
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
                    Дополнительная информация
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="status-label">Статус манги</InputLabel>
                    <Select
                      labelId="status-label"
                      name="status"
                      value={manga.status}
                      label="Статус манги"
                      onChange={handleStatusChange}
                      disabled={loading}
                    >
                      <MenuItem value={MangaStatus.ONGOING}>Выпускается (Онгоинг)</MenuItem>
                      <MenuItem value={MangaStatus.COMPLETED}>Завершена</MenuItem>
                      <MenuItem value={MangaStatus.HIATUS}>Приостановлена (Хиатус)</MenuItem>
                      <MenuItem value={MangaStatus.CANCELED}>Отменена</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Autocomplete
                    multiple
                    id="genres"
                    options={commonGenres}
                    value={selectedGenres}
                    onChange={handleGenreChange}
                    disabled={loading}
                    freeSolo
                    renderTags={(value: string[], getTagProps) =>
                      value.map((option: string, index: number) => (
                        <Chip 
                          variant="outlined" 
                          label={option} 
                          {...getTagProps({ index })} 
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Жанры"
                        placeholder="Добавьте жанры"
                        helperText="Выберите из списка или введите свои жанры"
                      />
                    )}
                  />
                </Paper>
              </Grid>
              
              {/* Right column - Settings and actions */}
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
                      Настройки публикации
                    </Typography>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={manga.published}
                          onChange={handlePublishedChange}
                          disabled={loading}
                        />
                      }
                      label="Опубликовано"
                    />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Если включено, манга будет видна пользователям сразу после создания
                    </Typography>
                    
                    <Divider sx={{ my: 3 }} />
                    
                    <Box>
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
                        {loading ? 'Создание...' : 'Создать мангу'}
                      </Button>
                      
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate('/manga')}
                        disabled={loading}
                        startIcon={<ArrowBackIcon />}
                        sx={{ borderRadius: '10px' }}
                      >
                        Отмена
                      </Button>
                    </Box>
                  </Paper>
                  
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: theme.palette.mode === 'light' 
                        ? 'rgba(255, 255, 255, 0.8)'
                        : 'rgba(50, 50, 50, 0.8)',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      После создания манги вы сможете добавлять тома, главы и страницы. 
                      Также вы можете загрузить обложку для манги на странице информации о манге.
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

export default MangaCreatePage;