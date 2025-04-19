import React from 'react';
import { Grid, Box, Skeleton, Typography } from '@mui/material';
import { 
  Storage as StorageIcon, 
  CompressOutlined as CompressIcon,
  CloudDoneOutlined as CloudDoneIcon,
  DataSaverOffOutlined as DataSaverIcon
} from '@mui/icons-material';
import StatCard from './StatCard';

// Utility function for formatting file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Байт';
  const k = 1024;
  const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface StatsData {
  totalImages: number;
  compressedImages: number;
  totalSize: number;
  spaceSaved: number;
  compressionEfficiency: number;
}

interface DashboardStatsProps {
  stats: StatsData;
  loading: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, loading }) => {
  return (
    <Grid 
      container 
      spacing={{ xs: 2, md: 3 }}
      columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}
      sx={{ 
        mb: 4, 
        width: '100%', 
        mx: 0,
        // Современные трансформации и эффекты Grid для 2025
        '& .MuiGrid-item': {
          animation: 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          '@keyframes fadeInUp': {
            '0%': {
              opacity: 0,
              transform: 'translateY(20px)'
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)'
            }
          }
        }
      }}
      alignItems="stretch"
      rowGap={2}
    >
      <Grid size={{ xs: 4, sm: 4, md: 3, lg: 4 }}>
        <Box sx={{ height: '100%', transition: 'transform 0.3s ease' }}>
          {loading ? (
            <Skeleton 
              variant="rounded" 
              height={150} 
              animation="wave" 
              sx={{
                borderRadius: '16px',
                background: theme => theme.palette.mode === 'light' 
                  ? 'linear-gradient(110deg, #f5f5f5 30%, #fafafa 50%, #f5f5f5 70%)' 
                  : 'linear-gradient(110deg, #333 30%, #444 50%, #333 70%)',
                backgroundSize: '200% 100%',
                animation: 'wave 2s linear infinite',
                '@keyframes wave': {
                  '0%': { backgroundPosition: '0% 0%' },
                  '100%': { backgroundPosition: '-200% 0%' }
                }
              }}
            />
          ) : (
            <StatCard
              title="Всего изображений"
              value={stats.totalImages}
              icon={<StorageIcon fontSize="large" />}
              change={{ value: stats.totalImages > 0 ? stats.totalImages : 0, isPositive: true }}
              color="#1a73e8"
              bgGradient="linear-gradient(135deg, rgba(26,115,232,0.15) 0%, rgba(66,133,244,0.05) 100%)"
              animationDelay={0}
            />
          )}
        </Box>
      </Grid>
      
      <Grid size={{ xs: 4, sm: 4, md: 3, lg: 4 }}>
        <Box sx={{ height: '100%' }}>
          {loading ? (
            <Skeleton 
              variant="rounded" 
              height={150} 
              animation="wave" 
              sx={{
                borderRadius: '16px',
                background: theme => theme.palette.mode === 'light' 
                  ? 'linear-gradient(110deg, #f5f5f5 30%, #fafafa 50%, #f5f5f5 70%)' 
                  : 'linear-gradient(110deg, #333 30%, #444 50%, #333 70%)',
                backgroundSize: '200% 100%',
                animation: 'wave 2s linear infinite',
                '@keyframes wave': {
                  '0%': { backgroundPosition: '0% 0%' },
                  '100%': { backgroundPosition: '-200% 0%' }
                }
              }}
            />
          ) : (
            <StatCard
              title="Сжатых изображений"
              value={`${stats.compressedImages} / ${stats.totalImages}`}
              icon={<CloudDoneIcon fontSize="large" />}
              change={{ value: stats.compressedImages > 0 ? stats.compressedImages : 0, isPositive: true }}
              color="#0f9d58"
              bgGradient="linear-gradient(135deg, rgba(15,157,88,0.15) 0%, rgba(66,183,121,0.05) 100%)"
              animationDelay={0.2}
            />
          )}
        </Box>
      </Grid>
      
      <Grid size={{ xs: 4, sm: 4, md: 3, lg: 4 }}>
        <Box sx={{ height: '100%' }}>
          {loading ? (
            <Skeleton 
              variant="rounded" 
              height={150} 
              animation="wave" 
              sx={{
                borderRadius: '16px',
                background: theme => theme.palette.mode === 'light' 
                  ? 'linear-gradient(110deg, #f5f5f5 30%, #fafafa 50%, #f5f5f5 70%)' 
                  : 'linear-gradient(110deg, #333 30%, #444 50%, #333 70%)',
                backgroundSize: '200% 100%',
                animation: 'wave 2s linear infinite',
                '@keyframes wave': {
                  '0%': { backgroundPosition: '0% 0%' },
                  '100%': { backgroundPosition: '-200% 0%' }
                }
              }}
            />
          ) : (
            <StatCard
              title="Общий объем"
              value={formatFileSize(stats.totalSize)}
              icon={<CompressIcon fontSize="large" />}
              change={{ value: 0, isPositive: true }}
              color="#4285f4"
              bgGradient="linear-gradient(135deg, rgba(66,133,244,0.15) 0%, rgba(8,66,152,0.05) 100%)"
              animationDelay={0.4}
            />
          )}
        </Box>
      </Grid>
      
      <Grid size={{ xs: 4, sm: 4, md: 3, lg: 4 }}>
        <Box sx={{ height: '100%' }}>
          {loading ? (
            <Skeleton 
              variant="rounded" 
              height={150} 
              animation="wave" 
              sx={{
                borderRadius: '16px',
                background: theme => theme.palette.mode === 'light' 
                  ? 'linear-gradient(110deg, #f5f5f5 30%, #fafafa 50%, #f5f5f5 70%)' 
                  : 'linear-gradient(110deg, #333 30%, #444 50%, #333 70%)',
                backgroundSize: '200% 100%',
                animation: 'wave 2s linear infinite',
                '@keyframes wave': {
                  '0%': { backgroundPosition: '0% 0%' },
                  '100%': { backgroundPosition: '-200% 0%' }
                }
              }}
            />
          ) : (
            <StatCard
              title="Экономия места"
              value={formatFileSize(stats.spaceSaved)}
              icon={<DataSaverIcon fontSize="large" />}
              change={{ value: stats.compressionEfficiency, isPositive: true, suffix: '%' }}
              color="#a142f4"
              bgGradient="linear-gradient(135deg, rgba(161,66,244,0.15) 0%, rgba(66,8,152,0.05) 100%)"
              animationDelay={0.6}
            />
          )}
        </Box>
      </Grid>
    </Grid>
  );
};

export default DashboardStats;