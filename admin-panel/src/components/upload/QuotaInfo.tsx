import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Divider,
  Alert,
  Tooltip,
  Grid,
  CircularProgress,
  Skeleton,
  Paper
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

interface QuotaInfoProps {
  refreshTrigger?: number; // Триггер для обновления информации при загрузке новых файлов
}

const QuotaInfo: React.FC<QuotaInfoProps> = ({ refreshTrigger = 0 }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileLimits, setFileLimits] = useState<Record<string, number>>({
    min_file_size: 1024, // 1 KB по умолчанию
    max_file_size: 10485760 // 10 MB по умолчанию
  });
  const [userQuota, setUserQuota] = useState<number>(0); // Максимальное количество файлов
  const [usedQuota, setUsedQuota] = useState<number>(0); // Использовано файлов
  
  useEffect(() => {
    const fetchQuotaInfo = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Получение лимитов файлов
        const limits = await systemService.getFileLimits();
        setFileLimits({
          min_file_size: parseInt(limits.min_file_size || '1024'),
          max_file_size: parseInt(limits.max_file_size || '10485760')
        });
        
        // Получение квоты пользователя
        const quotaKey = `user_quota_${user.role.toLowerCase()}`;
        const userQuotaResponse = await systemService.getSettingByKey(quotaKey);
        const maxQuota = parseInt(userQuotaResponse?.settingValue || '0');
        setUserQuota(maxQuota);
        
        // Получение списка изображений для подсчета использованной квоты
        const images = await ImageService.getAllImages();
        const userImages = Object.values(images).filter(img => 
          // Считаем только оригинальные изображения (без сжатых копий)
          !img.originalImageId && img.userId === user.username
        );
        setUsedQuota(userImages.length);
        
      } catch (err) {
        console.error('Failed to fetch quota information:', err);
        setError('Не удалось загрузить информацию о квотах и лимитах.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuotaInfo();
  }, [user, refreshTrigger]);
  
  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" width="60%" height={32} />
        </Box>
        <Skeleton variant="rectangular" height={80} />
      </Paper>
    );
  }
  
  if (error) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
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
    if (quotaPercentage < 70) return 'success';
    if (quotaPercentage < 90) return 'warning';
    return 'error';
  };
  
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Лимиты и квоты
        </Typography>
        
        <Grid container spacing={2}>
          <Grid component={"div"} container spacing={12} sx={{ mb: 4 }}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                borderRadius: 2,
                boxShadow: theme => 
                  theme.palette.mode === 'light'
                    ? '0 2px 12px rgba(0, 0, 0, 0.05)'
                    : '0 2px 12px rgba(0, 0, 0, 0.2)'
              }}
            >
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Использование хранилища
                </Typography>
                
                <Box sx={{ my: 4 }}>
                  <CircularProgressWithLabel value={quotaPercentage} size={120} />
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Занято {formatFileSize(usedQuota)} из {formatFileSize(userQuota)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Квота пользователя */}
          <Grid component={"div"} container spacing={12} sx={{ mb: 6 }}>
            <Typography variant="subtitle2" gutterBottom>
              Квота изображений:
            </Typography>
            {userQuota > 0 ? (
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Использовано {usedQuota} из {userQuota}
                  </Typography>
                  <Typography variant="body2" color={getQuotaColor()}>
                    {quotaPercentage.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={quotaPercentage} 
                  color={getQuotaColor()}
                />
              </Box>
            ) : (
              <Typography variant="body2">
                Нет ограничений на количество изображений
              </Typography>
            )}
          </Grid>
        </Grid>
        
        {userQuota > 0 && usedQuota >= userQuota && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Вы достигли лимита по количеству изображений! Удалите неиспользуемые изображения, чтобы загружать новые.
          </Alert>
        )}
        
        {userQuota > 0 && usedQuota >= userQuota * 0.9 && usedQuota < userQuota && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Вы приближаетесь к лимиту количества изображений. Рассмотрите возможность удаления неиспользуемых изображений.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default QuotaInfo;