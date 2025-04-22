import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  useTheme,
  Breadcrumbs,
  Skeleton,
  Divider,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  TextField,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  DragIndicator as DragIndicatorIcon,
  Image as ImageIcon,
  Check as CheckIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Chapter, Page, Manga, Volume } from '../../types/manga.types';
import mangaService from '../../services/manga.service';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface FileUpload {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  error: string | null;
  pageNumber: number;
  id?: string; // Will be set after upload
}

const PageUploadPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id: mangaId, volumeId, chapterId } = useParams<{
    id: string;
    volumeId: string;
    chapterId: string;
  }>();

  // States
  const [manga, setManga] = useState<Manga | null>(null);
  const [volume, setVolume] = useState<Volume | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [savingOrder, setSavingOrder] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Fetch details for manga, volume, chapter and existing pages
  useEffect(() => {
    const fetchDetails = async () => {
      if (!mangaId || !volumeId || !chapterId) return;

      try {
        setInitialLoading(true);
        
        // Fetch manga details
        const mangaData = await mangaService.getManga(mangaId, false);
        setManga(mangaData);
        
        // Fetch volume details
        const volumeData = await mangaService.getVolume(volumeId, false);
        setVolume(volumeData);
        
        // Fetch chapter details with pages
        const chapterData = await mangaService.getChapter(chapterId, true);
        setChapter(chapterData);
        
        // Set existing pages
        if (chapterData.pages && chapterData.pages.length > 0) {
          setPages(chapterData.pages.sort((a, b) => a.pageNumber - b.pageNumber));
        }
        
      } catch (err: any) {
        console.error('Error fetching details:', err);
        setError('Не удалось загрузить информацию о главе');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchDetails();
  }, [mangaId, volumeId, chapterId]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files.length) return;
    
    const selectedFiles = Array.from(event.target.files);
    
    // Create file uploads with initial page numbers
    const newFileUploads: FileUpload[] = selectedFiles.map((file, index) => {
      // Generate preview URL
      const preview = URL.createObjectURL(file);
      
      // Determine page number - continuation from existing pages
      const nextPageNumber = pages.length + fileUploads.length + index + 1;
      
      return {
        file,
        preview,
        uploading: false,
        uploaded: false,
        error: null,
        pageNumber: nextPageNumber,
      };
    });
    
    setFileUploads([...fileUploads, ...newFileUploads]);
    
    // Reset input value to allow selecting the same files again if needed
    event.target.value = '';
  };
  
  // Remove a file from the upload list
  const removeFile = (index: number) => {
    const updatedFileUploads = [...fileUploads];
    
    // Release object URL to prevent memory leaks
    URL.revokeObjectURL(updatedFileUploads[index].preview);
    
    // Remove file from array
    updatedFileUploads.splice(index, 1);
    
    // Update page numbers for all subsequent files
    for (let i = index; i < updatedFileUploads.length; i++) {
      updatedFileUploads[i].pageNumber = i + 1 + pages.length;
    }
    
    setFileUploads(updatedFileUploads);
  };
  
  // Change page number manually
  const handlePageNumberChange = (index: number, newValue: number) => {
    const updatedFileUploads = [...fileUploads];
    
    // Ensure page number is valid
    if (newValue < 1) newValue = 1;
    
    updatedFileUploads[index].pageNumber = newValue;
    setFileUploads(updatedFileUploads);
  };
  
  // Upload all files
  const uploadAllFiles = async () => {
    if (!chapterId) return;
    
    // Check if any files need to be uploaded
    const pendingUploads = fileUploads.filter(file => !file.uploaded);
    if (pendingUploads.length === 0) {
      setError('Нет файлов для загрузки');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Create a copy of the file uploads array
    const updatedFileUploads = [...fileUploads];
    
    // Upload files one by one
    for (let i = 0; i < updatedFileUploads.length; i++) {
      const fileUpload = updatedFileUploads[i];
      
      // Skip already uploaded files
      if (fileUpload.uploaded) continue;
      
      fileUpload.uploading = true;
      setFileUploads([...updatedFileUploads]);
      
      try {
        const uploadedPage = await mangaService.uploadPage(
          chapterId, 
          fileUpload.pageNumber, 
          fileUpload.file
        );
        
        fileUpload.uploaded = true;
        fileUpload.id = uploadedPage.id;
        
        // Add to the pages array
        const newPage: Page = {
          id: uploadedPage.id,
          chapterId: uploadedPage.chapterId,
          pageNumber: uploadedPage.pageNumber,
          imageId: uploadedPage.imageId,
          imageUrl: fileUpload.preview, // Use the preview for now
          createdAt: uploadedPage.createdAt,
          updatedAt: uploadedPage.updatedAt
        };
        
        setPages(prevPages => [...prevPages, newPage]);
        
      } catch (err: any) {
        console.error('Error uploading file:', err);
        fileUpload.error = 'Не удалось загрузить файл';
      } finally {
        fileUpload.uploading = false;
        setFileUploads([...updatedFileUploads]);
      }
    }
    
    // Refresh page data after uploads
    try {
      const chapterData = await mangaService.getChapter(chapterId, true);
      if (chapterData.pages && chapterData.pages.length > 0) {
        setPages(chapterData.pages.sort((a, b) => a.pageNumber - b.pageNumber));
      }
      setChapter(chapterData);
      
      setSuccess(true);
    } catch (err: any) {
      console.error('Error refreshing chapter data:', err);
    }
    
    setLoading(false);
  };
  
  // Delete a page
  const handleDeletePage = async (pageId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту страницу?')) {
      return;
    }
    
    try {
      setLoading(true);
      await mangaService.deletePage(pageId);
      
      // Remove from pages array
      setPages(prevPages => prevPages.filter(page => page.id !== pageId));
      
      // Update chapter data
      if (chapterId) {
        const chapterData = await mangaService.getChapter(chapterId, true);
        setChapter(chapterData);
      }
      
    } catch (err: any) {
      console.error('Error deleting page:', err);
      setError('Не удалось удалить страницу');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle drag and drop for reordering pages
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const reorderedPages = [...pages];
    const [removed] = reorderedPages.splice(result.source.index, 1);
    reorderedPages.splice(result.destination.index, 0, removed);
    
    // Update page numbers
    const updatedPages = reorderedPages.map((page, index) => ({
      ...page,
      pageNumber: index + 1
    }));
    
    setPages(updatedPages);
    
    // Save the new order
    try {
      setSavingOrder(true);
      await mangaService.reorderPages(
        chapterId as string,
        updatedPages.map(page => page.id)
      );
      
      // Show success message and hide it after a few seconds
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err: any) {
      console.error('Error saving page order:', err);
      setError('Не удалось обновить порядок страниц');
    } finally {
      setSavingOrder(false);
    }
  };

  // Move page up or down
  const movePage = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === pages.length - 1)
    ) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const reorderedPages = [...pages];
    const [removed] = reorderedPages.splice(index, 1);
    reorderedPages.splice(newIndex, 0, removed);
    
    // Update page numbers
    const updatedPages = reorderedPages.map((page, idx) => ({
      ...page,
      pageNumber: idx + 1
    }));
    
    setPages(updatedPages);
    
    // Save the new order
    try {
      setSavingOrder(true);
      await mangaService.reorderPages(
        chapterId as string,
        updatedPages.map(page => page.id)
      );
      
    } catch (err: any) {
      console.error('Error saving page order:', err);
      setError('Не удалось обновить порядок страниц');
    } finally {
      setSavingOrder(false);
    }
  };

  // Navigate to manga detail
  const handleGoBackToManga = () => {
    // Set refresh flag to ensure manga details update with new pages
    if (mangaId) {
      localStorage.setItem('manga_detail_refresh_needed', 'true');
      localStorage.setItem('manga_detail_id', mangaId);
    }
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
          
          <Grid container spacing={2}>
            {[1, 2, 3, 4, 5, 6].map((_, index) => (
              <Grid size={{ xs:6, sm:4, md:3, lg:2}} key={index}>
                <Skeleton 
                  variant="rectangular" 
                  height={200} 
                  sx={{ mb: 2, borderRadius: 1 }} 
                />
                <Skeleton variant="text" width="80%" height={24} />
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>
    );
  }

  // Error state when manga, volume or chapter is not found
  if ((!manga || !volume || !chapter) && !initialLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {!manga ? 'Манга не найдена' : !volume ? 'Том не найден' : 'Глава не найдена'}
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
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
          <Typography color="text.primary">
            Загрузка страниц главы {chapter?.chapterNumber}
          </Typography>
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
              <ImageIcon fontSize="large" color="primary" />
              Загрузка страниц
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={1}>
              Манга: {manga?.title}, Том {volume?.volumeNumber}, Глава {chapter?.chapterNumber}
              {chapter?.title ? `: ${chapter?.title}` : ''}
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
            onClose={() => setSuccess(false)}
          >
            Операция выполнена успешно!
          </Alert>
        )}

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
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Загрузить новые страницы
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Вы можете выбрать несколько файлов изображений для загрузки (.jpg, .png, .webp)
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
              sx={{ borderRadius: '10px' }}
              disabled={loading}
            >
              Выбрать файлы
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={handleFileSelect}
                disabled={loading}
              />
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              onClick={uploadAllFiles}
              disabled={loading || fileUploads.length === 0}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
              sx={{ borderRadius: '10px' }}
            >
              {loading ? 'Загрузка...' : 'Загрузить все файлы'}
            </Button>

            <Typography variant="body2" color="text.secondary">
              {fileUploads.length > 0 
                ? `Выбрано ${fileUploads.length} файлов` 
                : 'Файлы не выбраны'
              }
            </Typography>
          </Box>
          
          {/* File uploads preview */}
          {fileUploads.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Выбранные файлы
              </Typography>
              
              <Grid container spacing={2}>
                {fileUploads.map((fileUpload, index) => (
                  <Grid size={{ xs:6, sm:4, md:3, lg:2}} key={index}>
                    <Card sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={fileUpload.preview}
                        alt={`Page ${fileUpload.pageNumber}`}
                        sx={{ 
                          objectFit: 'contain',
                          bgcolor: 'rgba(0, 0, 0, 0.05)'
                        }}
                      />
                      
                      {fileUpload.uploading && (
                        <LinearProgress 
                          sx={{ 
                            position: 'absolute', 
                            bottom: 0, 
                            left: 0, 
                            right: 0 
                          }} 
                        />
                      )}
                      
                      {fileUpload.uploaded && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'success.main',
                            color: 'white',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <CheckIcon fontSize="small" />
                        </Box>
                      )}
                      
                      <CardContent sx={{ py: 1 }}>
                        <TextField
                          label="Номер"
                          type="number"
                          size="small"
                          value={fileUpload.pageNumber}
                          onChange={(e) => handlePageNumberChange(
                            index, 
                            parseInt(e.target.value)
                          )}
                          inputProps={{ min: 1 }}
                          disabled={fileUpload.uploading || fileUpload.uploaded}
                          fullWidth
                          sx={{ mt: 1 }}
                        />
                      </CardContent>
                      
                      <CardActions disableSpacing>
                        {!fileUpload.uploaded && !fileUpload.uploading && (
                          <IconButton 
                            onClick={() => removeFile(index)}
                            color="error"
                            size="small"
                            sx={{ ml: 'auto' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Paper>

        {/* Existing pages */}
        <Paper
          elevation={0}
          sx={{ 
            p: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Управление страницами (всего: {pages.length})
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {savingOrder && (
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  <Typography variant="body2">Сохранение...</Typography>
                </Box>
              )}
            </Box>
          </Box>
          
          {pages.length > 0 ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Перетащите страницы, чтобы изменить их порядок. Страницы будут отображаться в том порядке, в котором они здесь расположены.
              </Typography>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="pages" direction="horizontal">
                  {(provided) => (
                    <Grid 
                      container 
                      spacing={2}
                      ref={provided.innerRef} 
                      {...provided.droppableProps}
                    >
                      {pages.map((page, index) => (
                        <Draggable 
                          key={page.id} 
                          draggableId={page.id} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Grid 
                              size= {{xs:6, sm:4, md:3, lg:2}}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              sx={{
                                transition: 'transform 0.2s ease',
                                transform: snapshot.isDragging ? 'scale(1.05)' : 'scale(1)',
                                zIndex: snapshot.isDragging ? 1 : 0,
                              }}
                            >
                              <Card 
                                sx={{ 
                                  position: 'relative',
                                  border: snapshot.isDragging 
                                    ? `2px solid ${theme.palette.primary.main}` 
                                    : 'none',
                                }}
                              >
                                <Box {...provided.dragHandleProps} 
                                  sx={{
                                    position: 'absolute', 
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '30px',
                                    cursor: 'grab',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: theme.palette.mode === 'light' 
                                      ? 'rgba(255, 255, 255, 0.7)' 
                                      : 'rgba(0, 0, 0, 0.5)',
                                    backdropFilter: 'blur(4px)',
                                    borderTopLeftRadius: 4,
                                    borderTopRightRadius: 4,
                                  }}
                                >
                                  <DragIndicatorIcon 
                                    fontSize="small" 
                                    color="action" 
                                  />
                                </Box>
                                
                                <CardMedia
                                  component="img"
                                  height="200"
                                  image={page.imageUrl || `${process.env.PUBLIC_URL}/placeholder-image.png`}
                                  alt={`Page ${page.pageNumber}`}
                                  sx={{ 
                                    objectFit: 'contain',
                                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                                    mt: '30px'
                                  }}
                                />

                                <CardContent sx={{ py: 1 }}>
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary" 
                                    align="center"
                                    fontWeight={500}
                                  >
                                    Страница {index + 1}
                                  </Typography>
                                </CardContent>

                                <CardActions disableSpacing>
                                  <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                                    <Box>
                                      <Tooltip title="Переместить вверх">
                                        <span>
                                          <IconButton 
                                            size="small" 
                                            disabled={index === 0 || savingOrder}
                                            onClick={() => movePage(index, 'up')}
                                          >
                                            <ArrowUpwardIcon fontSize="small" />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                      <Tooltip title="Переместить вниз">
                                        <span>
                                          <IconButton 
                                            size="small" 
                                            disabled={index === pages.length - 1 || savingOrder}
                                            onClick={() => movePage(index, 'down')}
                                          >
                                            <ArrowDownwardIcon fontSize="small" />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                    </Box>
                                    <Tooltip title="Удалить страницу">
                                      <IconButton 
                                        edge="end" 
                                        size="small"
                                        color="error"
                                        disabled={loading || savingOrder}
                                        onClick={() => handleDeletePage(page.id)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </CardActions>
                              </Card>
                            </Grid>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Grid>
                  )}
                </Droppable>
              </DragDropContext>
              
              {pages.length === 0 && (
                <Box 
                  sx={{ 
                    py: 6, 
                    textAlign: 'center',
                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    У этой главы пока нет страниц. Загрузите изображения, чтобы добавить страницы.
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box 
              sx={{ 
                py: 6, 
                textAlign: 'center',
                bgcolor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 2
              }}
            >
              <Typography variant="body1" color="text.secondary">
                У этой главы пока нет страниц. Загрузите изображения, чтобы добавить страницы.
              </Typography>
            </Box>
          )}
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleGoBackToManga}
              sx={{ borderRadius: '10px' }}
            >
              Завершить и вернуться к манге
            </Button>
          </Box>
        </Paper>
      </Paper>
    </Container>
  );
};

export default PageUploadPage;