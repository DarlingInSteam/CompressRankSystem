import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  LinearProgress,
  Alert,
  Snackbar,
  Backdrop,
  CircularProgress,
  useTheme,
  SelectChangeEvent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Import components
import DashboardStats from '../../components/dashboard/DashboardStats';
import QuickActions from '../../components/gallery/QuickActions';
import ImageFilters from '../../components/gallery/ImageFilters';
import ImageGallery from '../../components/gallery/ImageGallery';
import UploadModal from '../../components/gallery/UploadModal';
import DeleteConfirmDialog from '../../components/gallery/DeleteConfirmDialog';

// Import services and types
import ImageService from '../../services/image.service';
import { ImageDTO, ImageStatistics, SortType, DateFilterType, SizeFilterType } from '../../types/api.types';

const HomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State for images and statistics
  const [images, setImages] = useState<Record<string, ImageDTO>>({});
  const [originalSizes, setOriginalSizes] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({
    totalImages: 0,
    compressedImages: 0,
    totalSize: 0,
    spaceSaved: 0,
    compressionEfficiency: 0
  });
  const [imageStatistics, setImageStatistics] = useState<Record<string, ImageStatistics>>({});
  
  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Selection state
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  
  // Modal and dialog state
  const [openUploadModal, setOpenUploadModal] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    completed: number;
    current: string | null;
  }>({ total: 0, completed: 0, current: null });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortType, setSortType] = useState<SortType>('uploadedAt');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('');
  const [sizeFilter, setSizeFilter] = useState<SizeFilterType>('');
  const [compressionFilter, setCompressionFilter] = useState<string>('all');

  // Data fetching - Using useCallback to optimize
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get all images
      const imagesData = await ImageService.getAllImages();
      setImages(imagesData);
      
      // Get image statistics
      try {
        const statisticsData = await ImageService.getAllImageStatistics();
        setImageStatistics(statisticsData);
      } catch (err) {
        console.error('Error loading statistics:', err);
      }
      
      // Calculate dashboard stats
      const imagesArray = Object.values(imagesData);
      const totalCount = imagesArray.length;
      const compressedImagesArray = imagesArray.filter(img => img.compressionLevel > 0);
      const compressedCount = compressedImagesArray.length;
      const totalSize = imagesArray.reduce((sum, img) => sum + img.size, 0);
      
      // Get original sizes for compressed images
      const compressedImageIds = compressedImagesArray.map(img => img.id);
      const imageSizes: Record<string, number> = {};
      let spaceSaved = 0;
      
      if (compressedImageIds.length > 0) {
        try {
          // Get original sizes for compressed images in batches
          const originalSizesData = await ImageService.getOriginalImageSizes(compressedImageIds);
          
          for (const [imageId, originalSize] of Object.entries(originalSizesData)) {
            imageSizes[imageId] = originalSize;
            const image = imagesData[imageId];
            if (image) {
              spaceSaved += originalSize - image.size;
            }
          }
          
          setOriginalSizes(imageSizes);
        } catch (error) {
          console.error('Error loading original sizes:', error);
        }
      }
      
      const compressionEfficiency = totalSize + spaceSaved > 0 
        ? Math.round((spaceSaved / (totalSize + spaceSaved)) * 100) 
        : 0;
      
      setStats({
        totalImages: totalCount,
        compressedImages: compressedCount,
        totalSize,
        spaceSaved,
        compressionEfficiency
      });
      
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Не удалось загрузить данные каталога изображений');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers for image actions
  const handleViewImage = (id: string) => {
    navigate(`/images/${id}/view`);
  };
  
  const handleToggleSelection = (id: string) => {
    if (selectedImages.includes(id)) {
      setSelectedImages(selectedImages.filter(imgId => imgId !== id));
    } else {
      setSelectedImages([...selectedImages, id]);
    }
  };
  
  const handleSelectAll = () => {
    const originalImages = Object.entries(images)
      .filter(([_, image]) => image.originalImageId === null)
      .map(([id]) => id);
      
    if (selectedImages.length === originalImages.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(originalImages);
    }
  };
  
  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedImages([]);
    }
  };
  
  // Handlers for modals and dialogs
  const handleOpenDeleteConfirm = (id: string | null) => {
    setImageToDelete(id);
    setConfirmDeleteOpen(true);
  };
  
  const handleCloseDeleteConfirm = () => {
    setConfirmDeleteOpen(false);
    setImageToDelete(null);
  };
  
  const handleDeleteImage = async () => {
    try {
      setUploading(true);
      if (imageToDelete) {
        // Delete a single image
        await ImageService.deleteImage(imageToDelete);
        setSuccess('Изображение успешно удалено');
      } else if (selectedImages.length > 0) {
        // Delete multiple images
        for (const id of selectedImages) {
          await ImageService.deleteImage(id);
        }
        setSuccess(`Удалено изображений: ${selectedImages.length}`);
        setSelectedImages([]);
        setSelectionMode(false);
      }
      // Refresh data
      fetchData();
    } catch (err) {
      setError('Ошибка при удалении изображения');
    } finally {
      handleCloseDeleteConfirm();
      setUploading(false);
    }
  };
  
  const handleOpenUploadModal = () => {
    setOpenUploadModal(true);
  };
  
  const handleCloseUploadModal = () => {
    if (!uploading) {
      setOpenUploadModal(false);
      setUploadProgress({ total: 0, completed: 0, current: null });
    }
  };
  
  // Handle file upload
  const handleUploadFiles = async (files: File[]) => {
    // Filter only images
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setError('Выберите хотя бы один файл изображения');
      return;
    }
    
    setUploadProgress({
      total: imageFiles.length,
      completed: 0,
      current: imageFiles[0].name
    });
    
    setUploading(true);
    
    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        setUploadProgress({
          total: imageFiles.length,
          completed: i,
          current: file.name
        });
        
        await ImageService.uploadImage(file);
      }
      
      setUploadProgress({
        total: imageFiles.length,
        completed: imageFiles.length,
        current: null
      });
      
      setSuccess(`Загружено изображений: ${imageFiles.length}`);
      
      // Update the image list
      fetchData();
      
      // Close modal with delay
      setTimeout(() => {
        handleCloseUploadModal();
      }, 1500);
    } catch (err) {
      setError('Ошибка при загрузке изображений');
    } finally {
      setUploading(false);
    }
  };

  // Handlers for search and filters
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSortChange = (e: SelectChangeEvent) => {
    setSortType(e.target.value as SortType);
  };
  
  const handleDateFilterChange = (e: SelectChangeEvent) => {
    setDateFilter(e.target.value as DateFilterType);
  };
  
  const handleSizeFilterChange = (e: SelectChangeEvent) => {
    setSizeFilter(e.target.value as SizeFilterType);
  };
  
  const handleCompressionFilterChange = (e: SelectChangeEvent) => {
    setCompressionFilter(e.target.value as string);
  };
  
  const resetFilters = () => {
    setSearchQuery('');
    setSortType('uploadedAt');
    setDateFilter('');
    setSizeFilter('');
    setCompressionFilter('all');
  };
  
  // Apply filters and sorting to images
  const filteredAndSortedImages = React.useMemo(() => {
    // Get only original images (not compression results)
    let result = Object.entries(images)
      .filter(([_, image]) => image.originalImageId === null);
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(([_, image]) => 
        image.originalFilename.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply date filter
    if (dateFilter) {
      const now = new Date();
      let compareDate = new Date();
      
      switch(dateFilter) {
        case 'today':
          compareDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          compareDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          compareDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          compareDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      result = result.filter(([_, image]) => {
        if (!image.uploadedAt) return false;
        const uploadDate = new Date(image.uploadedAt);
        return uploadDate >= compareDate;
      });
    }
    
    // Apply size filter
    if (sizeFilter) {
      result = result.filter(([_, image]) => {
        switch(sizeFilter) {
          case 'small': // < 100KB
            return image.size < 100 * 1024;
          case 'medium': // 100KB - 1MB
            return image.size >= 100 * 1024 && image.size < 1024 * 1024;
          case 'large': // 1MB - 10MB
            return image.size >= 1024 * 1024 && image.size < 10 * 1024 * 1024;
          case 'xlarge': // > 10MB
            return image.size >= 10 * 1024 * 1024;
          default:
            return true;
        }
      });
    }
    
    // Apply compression filter
    if (compressionFilter !== 'all') {
      result = result.filter(([_, image]) => {
        return compressionFilter === 'compressed' 
          ? image.compressionLevel > 0 
          : image.compressionLevel === 0;
      });
    }
    
    // Apply sorting
    result.sort(([id1, img1], [id2, img2]) => {
      const stat1 = imageStatistics[id1] || { viewCount: 0, downloadCount: 0, popularityScore: 0 };
      const stat2 = imageStatistics[id2] || { viewCount: 0, downloadCount: 0, popularityScore: 0 };
      
      switch(sortType) {
        case 'uploadedAt':
          const date1 = img1.uploadedAt ? new Date(img1.uploadedAt).getTime() : 0;
          const date2 = img2.uploadedAt ? new Date(img2.uploadedAt).getTime() : 0;
          return date2 - date1;
        case 'views':
          return (stat2.viewCount || 0) - (stat1.viewCount || 0);
        case 'downloads':
          return (stat2.downloadCount || 0) - (stat1.downloadCount || 0);
        case 'popularity':
          return (stat2.popularityScore || 0) - (stat1.popularityScore || 0);
        case 'size_asc':
          return img1.size - img2.size;
        case 'size_desc':
          return img2.size - img1.size;
        default:
          return 0;
      }
    });
    
    return result;
  }, [images, imageStatistics, searchQuery, sortType, dateFilter, sizeFilter, compressionFilter]);

  return (
    <Container maxWidth={false} sx={{ 
      mt: 4, 
      mb: 4, 
      px: { xs: 2, sm: 3, md: 4 },
      position: 'relative',
    }}>
      {/* Background decoration elements (2025 trend: abstract/geometric background elements) */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: theme.palette.mode === 'light' 
            ? 'radial-gradient(circle, rgba(63,81,181,0.05) 0%, rgba(63,81,181,0.02) 50%, rgba(63,81,181,0) 70%)' 
            : 'radial-gradient(circle, rgba(63,81,181,0.1) 0%, rgba(63,81,181,0.05) 50%, rgba(63,81,181,0) 70%)',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          left: '-5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: theme.palette.mode === 'light' 
            ? 'radial-gradient(circle, rgba(76,175,80,0.05) 0%, rgba(76,175,80,0.02) 50%, rgba(76,175,80,0) 70%)' 
            : 'radial-gradient(circle, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 50%, rgba(76,175,80,0) 70%)',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />

      {/* Notifications */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ '& .MuiAlert-root': { borderRadius: '12px' } }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          sx={{ 
            width: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            '& .MuiAlert-icon': { fontSize: '1.2rem' } 
          }}
        >
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ '& .MuiAlert-root': { borderRadius: '12px' } }}
      >
        <Alert 
          onClose={() => setSuccess(null)} 
          severity="success" 
          sx={{ 
            width: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            '& .MuiAlert-icon': { fontSize: '1.2rem' }
          }}
        >
          {success}
        </Alert>
      </Snackbar>
      
      {loading && (
        <Box sx={{ width: '100%', mb: 4 }}>
          <LinearProgress 
            sx={{ 
              borderRadius: '8px', 
              height: 6, 
              '& .MuiLinearProgress-bar': {
                backgroundImage: 'linear-gradient(45deg, #4a8ef1, #1e3c72)'
              }
            }} 
          />
        </Box>
      )}
      
      {/* Statistics Dashboard */}
      <DashboardStats stats={stats} loading={loading} />
      
      {/* Quick Actions */}
      <QuickActions 
        selectionMode={selectionMode}
        selectedCount={selectedImages.length}
        onUploadClick={handleOpenUploadModal}
        onToggleSelection={handleToggleSelectionMode}
        onSelectAll={handleSelectAll}
        onDeleteSelected={() => handleOpenDeleteConfirm(null)}
        totalCount={Object.keys(images).filter(key => !images[key].originalImageId).length}
      />
      
      {/* Image Filters */}
      <ImageFilters 
        searchQuery={searchQuery}
        sortType={sortType}
        dateFilter={dateFilter}
        sizeFilter={sizeFilter}
        compressionFilter={compressionFilter}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onDateFilterChange={handleDateFilterChange}
        onSizeFilterChange={handleSizeFilterChange}
        onCompressionFilterChange={handleCompressionFilterChange}
        onResetFilters={resetFilters}
      />
      
      {/* Image Gallery */}
      <ImageGallery 
        images={filteredAndSortedImages}
        imageStatistics={imageStatistics}
        originalSizes={originalSizes}
        selectionMode={selectionMode}
        selectedImages={selectedImages}
        onToggleSelection={handleToggleSelection}
        onViewImage={handleViewImage}
        onDeleteImage={(id) => handleOpenDeleteConfirm(id)}
        loading={loading}
      />
      
      {/* Upload Modal */}
      <UploadModal
        open={openUploadModal}
        onClose={handleCloseUploadModal}
        onUpload={handleUploadFiles}
        uploading={uploading}
        uploadProgress={uploadProgress}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={confirmDeleteOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleDeleteImage}
        imageId={imageToDelete}
        selectedCount={selectedImages.length}
        deleting={uploading}
      />
      
      {/* Loading Backdrop */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: theme => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(4px)'
        }}
        open={uploading}
      >
        <CircularProgress 
          color="inherit" 
          sx={{
            '& .MuiCircularProgress-svg': {
              filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.6))'
            }
          }}
        />
      </Backdrop>
    </Container>
  );
};

export default HomePage;