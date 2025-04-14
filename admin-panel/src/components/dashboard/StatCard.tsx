import React from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';

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
  return (
    <Paper
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderTop: 3,
        borderColor: color
      }}
      elevation={2}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        <Box sx={{ color }}>
          {icon}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50px' }}>
          <CircularProgress size={30} />
        </Box>
      ) : (
        <Typography variant="h4" component="div" sx={{ mb: 1 }}>
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