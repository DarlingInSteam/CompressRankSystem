import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  useTheme,
  alpha,
  Button,
  Stack,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import MangaGallery from '../../components/gallery/MangaGallery';
import mangaService from '../../services/manga.service';
import { Manga, MangaStatus } from '../../types/manga.types';

const MangaGalleryPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Состояние для галереи манги
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMangas, setSelectedMangas] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);

  // Fetch mangas when component mounts
  useEffect(() => {
    const fetchMangas = async () => {
      setLoading(true);
      try {
        const response = await mangaService.getAllMangas();
        
        // Extract the mangas from the response based on its structure
        // Backend API returns response with 'mangas' property
        if (response && Array.isArray(response)) {
          // Direct array response
          setMangas(response);
        } else if (response && response.mangas && Array.isArray(response.mangas)) {
          // Response with mangas property
          setMangas(response.mangas);
        } else {
          // Fallback to empty array if response format is unexpected
          console.warn('Unexpected response format from manga API', response);
          setMangas([]);
        }
      } catch (error) {
        console.error('Error fetching mangas:', error);
        setMangas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMangas();
  }, []);

  // Обработчики для взаимодействия с галереей
  const handleToggleSelection = (id: string) => {
    setSelectedMangas(prev => 
      prev.includes(id) 
        ? prev.filter(mangaId => mangaId !== id) 
        : [...prev, id]
    );
  };
  
  const handleViewManga = (id: string) => {
    navigate(`/manga/${id}`);
  };
  
  const handleDeleteManga = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту мангу?')) {
      try {
        await mangaService.deleteManga(id);
        setMangas(prev => prev.filter(manga => manga.id !== id));
        setSelectedMangas(prev => prev.filter(mangaId => mangaId !== id));
      } catch (error) {
        console.error('Error deleting manga:', error);
        alert('Не удалось удалить мангу. Пожалуйста, попробуйте снова позже.');
      }
    }
  };

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
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
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2}
          mb={3}
        >
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <MenuBookIcon fontSize="large" color="primary" />
              Галерея манги
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={1}>
              Управление коллекцией манги, томами и главами
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/manga/create')}
              sx={{
                py: 1.2,
                px: 3,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                background: 'linear-gradient(45deg, #42a5f5, #1976d2)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976d2, #1565c0)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Создать мангу
            </Button>
          </Stack>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Информация о выбранных мангах */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center"
          mb={2}
        >
          <Typography variant="body2" color="text.secondary">
            {mangas.length === 0 ? (
              'Нет манги'
            ) : (
              `Всего: ${mangas.length} ${mangas.length === 1 ? 'манга' : mangas.length > 1 && mangas.length < 5 ? 'манги' : 'манги'}`
            )}
          </Typography>
          
          <Box>
            {selectedMangas.length > 0 && (
              <Chip 
                label={`Выбрано: ${selectedMangas.length}`} 
                color="primary" 
                onDelete={() => setSelectedMangas([])}
                sx={{ mr: 1 }}
              />
            )}
            
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelectionMode(!selectionMode)}
              sx={{ 
                minWidth: 'auto', 
                borderRadius: 2,
                bgcolor: selectionMode ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
              }}
            >
              {selectionMode ? 'Отменить выбор' : 'Выбрать'}
            </Button>
          </Box>
        </Box>
        
        {/* Галерея манги */}
        <MangaGallery 
          mangas={mangas}
          loading={loading}
          selectionMode={selectionMode}
          selectedMangas={selectedMangas}
          onToggleSelection={handleToggleSelection}
          onViewManga={handleViewManga}
          onDeleteManga={handleDeleteManga}
        />
      </Paper>
    </Container>
  );
};

export default MangaGalleryPage;