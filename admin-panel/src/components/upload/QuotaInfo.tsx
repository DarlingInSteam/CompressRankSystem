import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Divider,
  Alert,
  AlertTitle,
  Tooltip,
  Grid,
  CircularProgress,
  Skeleton,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { systemService } from '../../services/system.service';
import ImageService from '../../services/image.service';

// Круговой индикатор прогресса с подписью
interface CircularProgressWithLabelProps {
  value: number;
  size?: number;
}

const CircularProgressWithLabel: React.FC<CircularProgressWithLabelProps> = ({ value, size = 40 }) => {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={value}
        size={size}
        thickness={4}
        sx={{ 
          color: value < 70 ? 'success.main' : value < 90 ? 'warning.main' : 'error.main',
        }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="caption"
          component="div"
          sx={{ 
            fontWeight: 'bold',
            fontSize: size && size > 80 ? '1.5rem' : '0.875rem'
          }}
        >
          {`${Math.round(value)}%`}
        </Typography>
      </Box>
    </Box>
  );
};

// Define ref type for exposing methods to parent
export interface QuotaInfoRefType {
  canUpload: () => boolean;
  getRemainingQuota: () => number;
  getFileSizeLimit: () => number;
}

interface QuotaInfoProps {
  refreshTrigger?: number; // Триггер для обновления информации при загрузке новых файлов
}

const QuotaInfo = forwardRef<QuotaInfoRefType, QuotaInfoProps>(({ refreshTrigger = 0 }, ref) => {
  const theme = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileLimits, setFileLimits] = useState<Record<string, number>>({
    min_file_size: 1024, // 1 KB по умолчанию
    max_file_size: 10485760 // 10 MB по умолчанию
  });
  const [userQuota, setUserQuota] = useState<number>(0); // Максимальное количество файлов
  const [usedQuota, setUsedQuota] = useState<number>(0); // Использовано файлов
  const [totalStorageUsed, setTotalStorageUsed] = useState<number>(0); // Общий размер использованного хранилища
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    canUpload: () => {
      return userQuota === 0 || usedQuota < userQuota;
    },
    getRemainingQuota: () => {
      return userQuota > 0 ? userQuota - usedQuota : Number.MAX_SAFE_INTEGER;
    },
    getFileSizeLimit: () => {
      return fileLimits.max_file_size;
    }
  }));
  
  useEffect(() => {
    const fetchQuotaInfo = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Получение лимитов файлов
        const limits = await systemService.getFileLimits();
        setFileLimits({
          min_file_size: parseInt(limits.min_file_size || '1024'),
          max_file_size: parseInt(limits.max_file_size || '10485760')
        });
        
        // Получение квоты пользователя через готовый API эндпоинт
        const quotaInfo = await ImageService.getUserQuota();
        console.log('User quota information:', quotaInfo);
        
        // Установка значений из ответа API
        setUserQuota(quotaInfo.imagesQuota);
        setUsedQuota(quotaInfo.imagesUsed);
        setTotalStorageUsed(quotaInfo.diskSpaceUsed);
        
      } catch (err) {
        console.error('Failed to fetch quota information:', err);
        setError('Не удалось загрузить информацию о квотах и лимитах.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuotaInfo();
  }, [user, isAuthenticated, refreshTrigger]);
  
  if (!isAuthenticated || !user) {
    return (
      <Alert 
        severity="info" 
        sx={{ 
          mb: 3,
          borderRadius: 4, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        Войдите в систему для просмотра информации о квотах и лимитах.
      </Alert>
    );
  }
  
  if (loading) {
    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 3,
          borderRadius: 4,
          background: alpha(theme.palette.background.paper, 0.7),
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: theme.palette.divider
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" width="60%" height={32} />
        </Box>
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
      </Paper>
    );
  }
  
  if (error) {
    return (
      <Alert 
        severity="warning" 
        sx={{ 
          mb: 3,
          borderRadius: 4, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        {error}
      </Alert>
    );
  }
  
  // Форматирование размеров в человекочитаемый вид
  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) return `${sizeInBytes} байт`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  // Расчет процента использованной квоты
  const quotaPercentage = userQuota > 0 ? Math.min(100, (usedQuota / userQuota) * 100) : 0;
  
  // Определение цвета индикатора квоты
  const getQuotaColor = () => {
    if (quotaPercentage < 70) return theme.palette.success.main;
    if (quotaPercentage < 90) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Card 
      elevation={0} 
      sx={{ 
        mb: 3,
        borderRadius: 4,
        background: alpha(theme.palette.background.paper, 0.7),
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: theme.palette.divider,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <Box 
        sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
          opacity: 0.04,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%23000000" fill-opacity="0.4" fill-rule="evenodd"/%3E%3C/svg%3E")',
        }}
      />
      <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
        <Typography variant="h5" gutterBottom fontWeight={600} color="primary">
          Лимиты и квоты
        </Typography>
        
        <Grid container spacing={4} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Box 
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 3
              }}
            >
              <CircularProgressWithLabel 
                value={quotaPercentage} 
                size={160} 
              />
              
              <Typography variant="h6" sx={{ mt: 3, fontWeight: 600 }}>
                {userQuota > 0 ? `${usedQuota} / ${userQuota}` : 'Без ограничений'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                {userQuota > 0 
                  ? `Осталось места для ${userQuota - usedQuota} изображений` 
                  : 'Нет ограничений на количество изображений'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Общее количество файлов:</span>
                  <span>{usedQuota}</span>
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom fontWeight={600} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Использовано памяти:</span>
                  <span>{formatFileSize(totalStorageUsed)}</span>
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom fontWeight={600} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Максимальный размер файла:</span>
                  <span>{formatFileSize(fileLimits.max_file_size)}</span>
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom fontWeight={600} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Минимальный размер файла:</span>
                  <span>{formatFileSize(fileLimits.min_file_size)}</span>
                </Typography>
              </Box>
              
              {userQuota > 0 && (
                <Box sx={{ width: '100%', mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      Заполнено {quotaPercentage.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={quotaPercentage}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha(getQuotaColor(), 0.2),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getQuotaColor(),
                        borderRadius: 4
                      }
                    }}
                  />
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
        
        {userQuota > 0 && usedQuota >= userQuota && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 3, 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(211, 47, 47, 0.15)'
            }}
          >
            <AlertTitle sx={{ fontWeight: 600 }}>Достигнут лимит!</AlertTitle>
            Вы исчерпали квоту на загрузку изображений. Удалите неиспользуемые изображения, чтобы загружать новые.
          </Alert>
        )}
        
        {userQuota > 0 && usedQuota >= userQuota * 0.9 && usedQuota < userQuota && (
          <Alert 
            severity="warning" 
            sx={{ 
              mt: 3,
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(237, 108, 2, 0.15)'
            }}
          >
            <AlertTitle sx={{ fontWeight: 600 }}>Квота почти исчерпана</AlertTitle>
            Вы приближаетесь к лимиту количества изображений. Рассмотрите возможность удаления неиспользуемых изображений.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
});

export default QuotaInfo;