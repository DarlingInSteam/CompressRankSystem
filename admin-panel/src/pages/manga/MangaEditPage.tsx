import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  FormControlLabel,
  Switch,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Breadcrumbs,
  Divider,
  Grid,
  useTheme,
  FormHelperText,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { Manga, MangaStatus } from '../../types/manga.types';
import mangaService from '../../services/manga.service';

const MangaEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [manga, setManga] = useState<Manga | null>(null);
  const [formData, setFormData] = useState<Partial<Manga>>({
    title: '',
    description: '',
    author: '',
    artist: '',
    genres: '',
    status: MangaStatus.ONGOING,
    published: false
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch manga details
  useEffect(() => {
    const fetchManga = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const mangaData = await mangaService.getManga(id, false);
        setManga(mangaData);
        setFormData({
          title: mangaData.title || '',
          description: mangaData.description || '',
          author: mangaData.author || '',
          artist: mangaData.artist || '',
          genres: mangaData.genres || '',
          status: mangaData.status || MangaStatus.ONGOING,
          published: mangaData.published || false
        });
      } catch (err) {
        console.error('Error fetching manga:', err);
        setError('Failed to load manga details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchManga();
  }, [id]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
      
      // Clear error for this field
      if (formErrors[name]) {
        setFormErrors((prev) => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };

  // Handle switch changes
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle select changes with correct type
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
      
      // Clear error for this field
      if (formErrors[name]) {
        setFormErrors((prev) => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };

  // Validate form data
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title || formData.title.trim() === '') {
      errors.title = 'Title is required';
    }
    
    if (!formData.author || formData.author.trim() === '') {
      errors.author = 'Author is required';
    }
    
    if (!formData.status) {
      errors.status = 'Status is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      await mangaService.updateManga(id as string, formData);
      
      setSuccess(true);
      setError(null);
      
      // Wait a moment to show success message
      setTimeout(() => {
        navigate(`/manga/${id}`);
      }, 2000);
    } catch (err) {
      console.error('Error updating manga:', err);
      setError('Failed to update manga. Please try again.');
    } finally {
      setSaving(false);
    }
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

  // Error state if manga not found
  if (error && !manga) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
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
          {manga?.title}
        </Link>
        <Typography color="text.primary">Edit</Typography>
      </Breadcrumbs>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>Edit Manga: {manga?.title}</Typography>
        
        {success && (
          <Alert severity="success" sx={{ my: 2 }}>
            Manga updated successfully! Redirecting to manga page...
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs:12}}>
              <TextField
                name="title"
                label="Title"
                value={formData.title}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.title}
                helperText={formErrors.title}
              />
            </Grid>
            
            <Grid size={{ xs:12, md:6 }}>
              <TextField
                name="author"
                label="Author"
                value={formData.author}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.author}
                helperText={formErrors.author}
              />
            </Grid>
            
            <Grid size={{ xs:12, md:6 }}>
              <TextField
                name="artist"
                label="Artist"
                value={formData.artist}
                onChange={handleInputChange}
                fullWidth
                helperText="Leave empty if same as author"
              />
            </Grid>
            
            <Grid size={{ xs:12}}>
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={4}
              />
            </Grid>
            
            <Grid size={{ xs:12}}>
              <TextField
                name="genres"
                label="Genres"
                value={formData.genres}
                onChange={handleInputChange}
                fullWidth
                helperText="Comma-separated list of genres (e.g. Action, Adventure, Fantasy)"
              />
              
              {formData.genres && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {formData.genres.split(',').map((genre, idx) => (
                    genre.trim() && (
                      <Chip 
                        key={idx} 
                        label={genre.trim()} 
                        size="small" 
                        sx={{ borderRadius: '16px' }} 
                      />
                    )
                  ))}
                </Box>
              )}
            </Grid>
            
            <Grid size={{ xs:12, md:6 }}>
              <FormControl fullWidth error={!!formErrors.status}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleSelectChange}
                >
                  <MenuItem value={MangaStatus.ONGOING}>Ongoing</MenuItem>
                  <MenuItem value={MangaStatus.COMPLETED}>Completed</MenuItem>
                  <MenuItem value={MangaStatus.HIATUS}>Hiatus</MenuItem>
                  <MenuItem value={MangaStatus.CANCELED}>Canceled</MenuItem>
                </Select>
                {formErrors.status && <FormHelperText>{formErrors.status}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid size={{ xs:12, md:6 }}>
              <FormControlLabel
                control={
                  <Switch
                    name="published"
                    checked={!!formData.published}
                    onChange={handleSwitchChange}
                    color="primary"
                  />
                }
                label="Published (visible to all users)"
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 4 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => navigate(`/manga/${id}`)}
              disabled={saving}
              sx={{ borderRadius: '10px' }}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={saving}
              sx={{ borderRadius: '10px' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default MangaEditPage;