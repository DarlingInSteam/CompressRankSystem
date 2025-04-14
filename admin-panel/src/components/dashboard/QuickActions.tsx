import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button,
  Grid,
  SvgIcon
} from '@mui/material';
import { 
  CloudUpload as UploadIcon, 
  Compress as CompressIcon, 
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  Backup as BackupIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

interface ActionButtonProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  to: string;
  color?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  title, 
  icon, 
  description, 
  to, 
  color = 'primary' 
}) => {
  return (
    <Button
      component={Link}
      to={to}
      variant="outlined"
      color={color as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        borderWidth: 2
      }}
      fullWidth
    >
      <Box sx={{ mb: 1, '& svg': { fontSize: '2rem' }}}>
        {icon}
      </Box>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {description}
      </Typography>
    </Button>
  );
};

const QuickActions: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }} elevation={2}>
      <Typography variant="h6" gutterBottom>
        Быстрые действия
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid component="div" xs={12} sm={6} md={4}>
          <ActionButton 
            title="Загрузить изображение" 
            icon={<UploadIcon />} 
            description="Загрузить новое изображение в сервис"
            to="/upload"
          />
        </Grid>
        <Grid component="div" xs={12} sm={6} md={4}>
          <ActionButton 
            title="Сжать изображение" 
            icon={<CompressIcon />}
            description="Выбрать изображение для сжатия"
            to="/compress"
            color="secondary"
          />
        </Grid>
        <Grid component="div" xs={12} sm={6} md={4}>
          <ActionButton 
            title="Очистить хранилище" 
            icon={<DeleteIcon />}
            description="Удалить устаревшие изображения"
            to="/cleanup"
            color="error"
          />
        </Grid>
        <Grid component="div" xs={12} sm={6} md={4}>
          <ActionButton 
            title="Настройки" 
            icon={<SettingsIcon />}
            description="Настройки сервиса и конфигурация"
            to="/settings"
            color="info"
          />
        </Grid>
        <Grid component="div" xs={12} sm={6} md={4}>
          <ActionButton 
            title="Статистика хранилища" 
            icon={<StorageIcon />}
            description="Проверить использование хранилища"
            to="/storage"
            color="success"
          />
        </Grid>
        <Grid component="div" xs={12} sm={6} md={4}>
          <ActionButton 
            title="Резервное копирование" 
            icon={<BackupIcon />}
            description="Создать резервную копию данных"
            to="/backup"
            color="warning"
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default QuickActions;