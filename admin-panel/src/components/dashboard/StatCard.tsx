import React from 'react';
import {
  Paper,
  Typography,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
    suffix?: string;
  };
  color?: string;
  bgGradient?: string;
  animationDelay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  color = '#1976d2',
  bgGradient,
  animationDelay = 0
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        height: '100%',
        borderRadius: '16px',
        p: 3,
        overflow: 'hidden',
        background: bgGradient || alpha(color, 0.1),
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: isDark 
          ? alpha(color, 0.2)
          : alpha(color, 0.1),
        boxShadow: `0 5px 15px ${alpha(color, 0.1)}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        animation: `fadeIn 0.5s ease ${animationDelay}s both`,
        '@keyframes fadeIn': {
          '0%': {
            opacity: 0,
            transform: 'translateY(20px)'
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)'
          }
        },
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px) scale(1.02)',
          boxShadow: `0 10px 25px ${alpha(color, 0.25)}`,
          '& .icon-container': {
            transform: 'scale(1.1) rotateY(10deg)',
          }
        }
      }}
    >
      {/* Background decoration elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          backgroundColor: alpha(color, 0.05),
          mixBlendMode: 'multiply', // This will help blend with background
          filter: 'blur(25px)',
          zIndex: 0,
          opacity: 0.6 // Reduced opacity
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-30px',
          left: '-20px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: alpha(color, 0.1),
          mixBlendMode: 'multiply', // This will help blend with background
          filter: 'blur(20px)',
          zIndex: 0,
          opacity: 0.6 // Reduced opacity
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              color: isDark ? theme.palette.text.primary : 'text.secondary',
              fontSize: '0.95rem',
              opacity: 0.85,
              textTransform: 'capitalize'
            }}
          >
            {title}
          </Typography>
          <Box
            className="icon-container"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '12px',
              backgroundColor: alpha(color, isDark ? 0.2 : 0.15),
              color: color,
              transition: 'all 0.3s ease',
              transform: 'perspective(700px)',
              transformStyle: 'preserve-3d'
            }}
          >
            {icon}
          </Box>
        </Box>

        <Typography
          variant="h4"
          component="div"
          sx={{
            fontWeight: 700,
            color: isDark ? alpha(color, 0.9) : color,
            mb: 1.5,
            fontSize: '1.75rem',
            textShadow: isDark ? '0 0 15px rgba(255,255,255,0.15)' : 'none'
          }}
        >
          {value}
        </Typography>

        {change && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mt: 'auto'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: change.isPositive ? 'success.main' : 'error.main',
                fontSize: '0.875rem'
              }}
            >
              {change.isPositive ? (
                <TrendingUpIcon fontSize="small" />
              ) : (
                <TrendingDownIcon fontSize="small" />
              )}
              <Typography
                variant="body2"
                component="span"
                sx={{
                  ml: 0.5,
                  fontWeight: 600
                }}
              >
                {change.value}{change.suffix || ''}
              </Typography>
            </Box>
            {change.isPositive && (
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Рост
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Animated subtle glow */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '40%',
          backgroundColor: alpha(color, 0.05),
          borderRadius: '50%',
          filter: 'blur(30px)',
          animation: 'pulse 3s infinite alternate',
          '@keyframes pulse': {
            '0%': { opacity: 0.3 },
            '100%': { opacity: 0.7 }
          },
          zIndex: 0
        }}
      />
    </Paper>
  );
};

export default StatCard;