import React from 'react';
import {
  Box,
  Button,
  Paper,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
} from '@mui/icons-material';

interface QuickActionsProps {
  selectionMode: boolean;
  selectedCount: number;
  onUploadClick: () => void;
  onToggleSelection: () => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  totalCount: number;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  selectionMode,
  selectedCount,
  onUploadClick,
  onToggleSelection,
  onSelectAll,
  onDeleteSelected,
  totalCount
}) => {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        mb: 4, 
        borderRadius: '16px',
        backdropFilter: 'blur(10px)',
        backgroundColor: theme => theme.palette.mode === 'light' 
          ? 'rgba(255, 255, 255, 0.9)' 
          : 'rgba(66, 66, 66, 0.8)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        border: '1px solid',
        borderColor: theme => theme.palette.mode === 'light'
          ? 'rgba(255, 255, 255, 0.4)'
          : 'rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)'
        }
      }}
    >
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Tooltip title="Загрузить новые изображения">
            <Button 
              variant="contained" 
              startIcon={<UploadIcon />}
              onClick={onUploadClick}
              sx={{ 
                borderRadius: '8px', 
                textTransform: 'none',
                px: 3,
                py: 1,
                fontWeight: 'medium',
                boxShadow: '0 4px 10px 0 rgba(0,0,0,0.12)'
              }}
            >
              Загрузить изображения
            </Button>
          </Tooltip>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant={selectionMode ? "contained" : "outlined"}
            color={selectionMode ? "primary" : "inherit"}
            onClick={onToggleSelection}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 'medium'
            }}
          >
            {selectionMode ? "Отменить выделение" : "Выделить изображения"}
          </Button>
          
          {selectionMode && (
            <>
              <Button 
                variant="outlined"
                onClick={onSelectAll}
                sx={{ 
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 'medium'
                }}
              >
                {selectedCount === totalCount 
                  ? "Снять выделение" 
                  : "Выделить все"}
              </Button>
              
              <Button 
                variant="outlined"
                color="error"
                onClick={onDeleteSelected}
                disabled={selectedCount === 0}
                sx={{ 
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 'medium'
                }}
              >
                Удалить выбранные ({selectedCount})
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default QuickActions;