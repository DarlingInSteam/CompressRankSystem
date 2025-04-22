import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Divider,
  Breadcrumbs,
  Link as MuiLink,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Image as ImageIcon,
  Upload as UploadIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { Manga } from '../../types/manga.types';
import mangaService from '../../services/manga.service';
import imageService from '../../services/image.service';

const MangaCoverSelectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<Array<[string, any]>>([]);
  const [imagesLoading, setImagesLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [applying, setApplying] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);

  // Fetch manga details and images
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        // Fetch manga details
        setLoading(true);
        const mangaData = await mangaService.getManga(id, false);
        setManga(mangaData);
        
        // If manga has a preview image already, preselect it
        if (mangaData.previewImageId) {
          setSelectedImage(mangaData.previewImageId);
        }
        
        // Fetch images
        setImagesLoading(true);
        const imagesData = await imageService.getAllImages();
        console.log('Images data from API:', imagesData); // Debug output
        
        // Convert image data to array of [id, image] tuples, with improved handling
        if (imagesData) {
          let imagesArray: Array<[string, any]> = [];
          
          // Check if imagesData is a direct map of images
          if (typeof imagesData === 'object' && !imagesData.images) {
            imagesArray = Object.entries(imagesData);
            console.log('Direct map format detected');
          } 
          // Check if imagesData has an images property
          else if (imagesData.images && typeof imagesData.images === 'object') {
            imagesArray = Object.entries(imagesData.images);
            console.log('Nested images property format detected');
          }
          // Check if imagesData is an array
          else if (Array.isArray(imagesData)) {
            imagesArray = imagesData.map(img => [img.id || String(Math.random()), img]);
            console.log('Array format detected');
          }
          
          console.log(`Found ${imagesArray.length} images`);
          setImages(imagesArray);
        } else {
          // Set empty array if no images found
          setImages([]);
          console.warn('No images data returned from API');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
        setImagesLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle image selection
  const handleImageSelect = (imageId: string) => {
    setSelectedImage(imageId);
  };

  // Apply selected image as cover
  const handleApplyCover = async () => {
    if (!id || !selectedImage) return;
    
    try {
      setApplying(true);
      
      // Call API to set manga preview image
      await mangaService.setMangaPreviewImage(id, selectedImage);
      
      setSuccess(true);
      
      // Wait a moment to show success message
      setTimeout(() => {
        navigate(`/manga/${id}`);
      }, 2000);
    } catch (err) {
      console.error('Error setting cover image:', err);
      setError('Failed to set cover image. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  // Handle upload new image click
  const handleUploadClick = () => {
    navigate('/upload', { state: { returnPath: `/manga/${id}/select-cover` } });
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Loading manga details...</Typography>
        </Paper>
      </Container>
    );
  }

  // Error state
  if (error || !manga) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" color="error" gutterBottom>
            {error || 'Manga not found'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/manga/${id}`)}
            sx={{ mt: 2 }}
          >
            Back to Manga
          </Button>
        </Paper>
      </Container>
    );
  }

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
        <Link to={`/manga/${id}`} style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>
          {manga.title}
        </Link>
        <Typography color="text.primary">Select Cover</Typography>
      </Breadcrumbs>

      {/* Main content */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ImageIcon />
          Select Cover Image for "{manga.title}"
        </Typography>
        
        {success && (
          <Alert severity="success" sx={{ my: 2 }}>
            Cover image set successfully! Redirecting to manga page...
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/manga/${id}`)}
            sx={{ borderRadius: '10px' }}
          >
            Back to Manga
          </Button>
          
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={handleUploadClick}
            sx={{ borderRadius: '10px' }}
          >
            Upload New Image
          </Button>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ mb: 3 }}
          variant="fullWidth"
        >
          <Tab label="All Images" />
          <Tab label="My Uploads" />
        </Tabs>
        
        {imagesLoading ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>Loading images...</Typography>
          </Box>
        ) : images.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center', bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>
              No images found
            </Typography>
            <Button 
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={handleUploadClick}
              sx={{ mt: 2 }}
            >
              Upload Images
            </Button>
          </Paper>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select an image to use as the manga cover:
            </Typography>
            
            <Grid container spacing={3}>
              {images.map(([imageId, image]) => (
                <Grid size={{ xs:12, sm:6, md:4, lg:3}} key={imageId}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: selectedImage === imageId ? 'scale(0.98)' : 'none',
                      outline: selectedImage === imageId ? '2px solid' : 'none',
                      outlineColor: 'primary.main',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}
                    onClick={() => handleImageSelect(imageId)}
                  >
                    <CardMedia
                      component="img"
                      height="180"
                      image={imageService.getImageUrl(imageId)}
                      alt={image.originalFilename}
                      sx={{
                        objectFit: 'cover'
                      }}
                    />
                    <CardContent sx={{ py: 1 }}>
                      <Typography variant="body2" noWrap title={image.originalFilename}>
                        {image.originalFilename}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      {selectedImage === imageId && (
                        <Box 
                          sx={{ 
                            bgcolor: 'primary.main', 
                            color: 'white', 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontWeight: 'medium',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          <CheckIcon fontSize="inherit" />
                          Selected
                        </Box>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                size="large"
                disabled={!selectedImage || applying}
                onClick={handleApplyCover}
                startIcon={applying ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
                sx={{ minWidth: 200, borderRadius: '10px' }}
              >
                {applying ? 'Applying...' : 'Set as Cover'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default MangaCoverSelectPage;