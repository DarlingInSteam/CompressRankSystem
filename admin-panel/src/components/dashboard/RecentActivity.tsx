import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Chip,
  Divider
} from '@mui/material';
import { 
  CloudUpload as UploadIcon, 
  Compress as CompressIcon, 
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  DeleteOutline as DeleteIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

// Типы активностей
type ActivityType = 'upload' | 'compress' | 'view' | 'download' | 'delete';

// Интерфейс для активности
interface Activity {
  id: number;
  type: ActivityType;
  fileName: string;
  imageId?: string;
  timestamp: Date;
  user?: string;
  success: boolean;
  details?: string;
}

// Функция для форматирования времени в формате "5 минут назад"
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'только что';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${getMinutesString(minutes)} назад`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${getHoursString(hours)} назад`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${getDaysString(days)} назад`;
  }
};

// Вспомогательные функции для правильного склонения
const getMinutesString = (minutes: number): string => {
  if (minutes % 10 === 1 && minutes % 100 !== 11) return 'минуту';
  if ([2, 3, 4].includes(minutes % 10) && ![12, 13, 14].includes(minutes % 100)) return 'минуты';
  return 'минут';
};

const getHoursString = (hours: number): string => {
  if (hours % 10 === 1 && hours % 100 !== 11) return 'час';
  if ([2, 3, 4].includes(hours % 10) && ![12, 13, 14].includes(hours % 100)) return 'часа';
  return 'часов';
};

const getDaysString = (days: number): string => {
  if (days % 10 === 1 && days % 100 !== 11) return 'день';
  if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) return 'дня';
  return 'дней';
};

// Получаем иконку в зависимости от типа активности
const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'upload':
      return <UploadIcon />;
    case 'compress':
      return <CompressIcon />;
    case 'view':
      return <ViewIcon />;
    case 'download':
      return <DownloadIcon />;
    case 'delete':
      return <DeleteIcon />;
    default:
      return <UploadIcon />;
  }
};

// Получаем цвет в зависимости от типа активности
const getActivityColor = (type: ActivityType) => {
  switch (type) {
    case 'upload':
      return '#1976d2';  // blue
    case 'compress':
      return '#9c27b0';  // purple
    case 'view':
      return '#2e7d32';  // green
    case 'download':
      return '#ed6c02';  // orange
    case 'delete':
      return '#d32f2f';  // red
    default:
      return '#1976d2';  // blue
  }
};

// Получаем текст действия в зависимости от типа активности
const getActivityText = (activity: Activity) => {
  const { type, fileName, user } = activity;
  const userText = user ? `${user}` : 'Пользователь';
  
  switch (type) {
    case 'upload':
      return `${userText} загрузил изображение ${fileName}`;
    case 'compress':
      return `${userText} сжал изображение ${fileName}`;
    case 'view':
      return `${userText} просмотрел изображение ${fileName}`;
    case 'download':
      return `${userText} скачал изображение ${fileName}`;
    case 'delete':
      return `${userText} удалил изображение ${fileName}`;
    default:
      return `${userText} выполнил действие с ${fileName}`;
  }
};

// Имитация данных последних активностей
const mockActivities: Activity[] = [
  {
    id: 1,
    type: 'upload',
    fileName: 'image001.jpg',
    imageId: 'img_001',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 минут назад
    user: 'admin',
    success: true
  },
  {
    id: 2,
    type: 'compress',
    fileName: 'image001.jpg',
    imageId: 'img_001',
    timestamp: new Date(Date.now() - 4 * 60 * 1000), // 4 минуты назад
    user: 'admin',
    success: true,
    details: 'Сжатие: 68% экономии'
  },
  {
    id: 3,
    type: 'view',
    fileName: 'banner.png',
    imageId: 'img_002',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 минут назад
    success: true
  },
  {
    id: 4,
    type: 'download',
    fileName: 'presentation.jpg',
    imageId: 'img_003',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 часа назад
    user: 'user123',
    success: true
  },
  {
    id: 5,
    type: 'delete',
    fileName: 'old-photo.jpg',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 часа назад
    user: 'admin',
    success: true
  }
];

interface RecentActivityProps {
  limit?: number;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ limit = 5 }) => {
  const activities = mockActivities.slice(0, limit);
  
  return (
    <Paper sx={{ p: 3 }} elevation={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          Последние действия
        </Typography>
        <Tooltip title="Все действия">
          <IconButton component={Link} to="/activities" size="small">
            <OpenIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      <List disablePadding>
        {activities.map((activity, index) => (
          <React.Fragment key={activity.id}>
            {index > 0 && <Divider component="li" />}
            <ListItem 
              alignItems="flex-start"
              sx={{ py: 1.5 }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: getActivityColor(activity.type) }}>
                  {getActivityIcon(activity.type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={getActivityText(activity)}
                secondary={
                  <React.Fragment>
                    <Typography
                      sx={{ display: 'inline' }}
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {formatTimeAgo(activity.timestamp)}
                    </Typography>
                    {activity.details && (
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        {activity.details}
                      </Typography>
                    )}
                  </React.Fragment>
                }
              />
              
              <ListItemSecondaryAction>
                {activity.imageId && (
                  <Tooltip title="Открыть изображение">
                    <IconButton 
                      edge="end" 
                      component={Link} 
                      to={`/images/${activity.imageId}/view`}
                      size="small"
                    >
                      <OpenIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          </React.Fragment>
        ))}
      </List>
      
      {activities.length === 0 && (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Нет недавних действий
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default RecentActivity;