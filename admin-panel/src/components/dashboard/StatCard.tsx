import React from 'react';
import { Box, Paper, Typography, CircularProgress, alpha, useTheme } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  change, 
  color = 'primary.main',
  loading = false 
}) => {
  const theme = useTheme();
  // Правильное получение цвета из темы через path (например 'primary.main')
  const getColorFromTheme = (colorPath: string): string => {
    // Если это простой HEX или RGB цвет, возвращаем его как есть
    if (colorPath.startsWith('#') || colorPath.startsWith('rgb') || colorPath.startsWith('hsl')) {
      return colorPath;
    }
    
    // Разбиваем путь к цвету в объекте темы
    const parts = colorPath.split('.');
    let colorValue: any = theme;
    
    // Проходим по пути, получая вложенные значения
    for (const part of parts) {
      if (colorValue && colorValue[part] !== undefined) {
        colorValue = colorValue[part];
      } else {
        // Если путь не существует, возвращаем безопасный цвет по умолчанию
        console.warn(`Color path '${colorPath}' not found in theme`);
        return theme.palette.primary.main;
      }
    }
    
    // Возвращаем найденный цвет или безопасный вариант
    return typeof colorValue === 'string' ? colorValue : theme.palette.primary.main;
  };
  
  // Получаем конкретное значение цвета из темы
  const resolvedColor = getColorFromTheme(color);

  return (
    <Paper
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: '12px',
        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px 0 rgba(0,0,0,0.1)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: resolvedColor,
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
        }
      }}
      elevation={0}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Typography variant="subtitle2" fontWeight="500" color="text.secondary">
          {title}
        </Typography>
        <Box 
          sx={{ 
            color: 'white',
            backgroundColor: resolvedColor,
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 10px ${alpha(resolvedColor, 0.3)}`
          }}
        >
          {icon}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50px' }}>
          <CircularProgress size={30} color="inherit" sx={{ color: resolvedColor }} />
        </Box>
      ) : (
        <Typography 
          variant="h4" 
          component="div" 
          sx={{ 
            mb: 1, 
            fontWeight: 'bold',
            fontSize: { xs: '1.75rem', md: '2rem' }
          }}
        >
          {value}
        </Typography>
      )}

      {change && !loading && (
        <Box sx={{ mt: 'auto' }}>
          <Typography
            variant="body2"
            sx={{
              color: change.isPositive ? 'success.main' : 'error.main',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 500
            }}
          >
            {change.isPositive ? '▲' : '▼'} {Math.abs(change.value)}%
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              по сравнению с пред. периодом
            </Typography>
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default StatCard;