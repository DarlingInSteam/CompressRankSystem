import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { WarningAmber } from '@mui/icons-material';

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  imageId: string | null;
  selectedCount: number;
  deleting: boolean;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  imageId,
  selectedCount,
  deleting
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="delete-dialog-title"
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxWidth: 400,
          width: '100%',
          p: 1
        }
      }}
    >
      <DialogTitle 
        id="delete-dialog-title"
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          color: 'error.main'
        }}
      >
        <WarningAmber color="error" />
        <Typography variant="h6" component="span" fontWeight="medium">
          {imageId ? "Удалить изображение?" : `Удалить выбранные изображения (${selectedCount})?`}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1">
          {imageId
            ? "Вы уверены, что хотите удалить это изображение? Это действие нельзя отменить."
            : `Вы уверены, что хотите удалить ${selectedCount} выбранных изображений? Это действие нельзя отменить.`
          }
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose}
          disabled={deleting}
          variant="outlined"
          sx={{
            borderRadius: '8px',
            textTransform: 'none'
          }}
        >
          Отмена
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error" 
          variant="contained"
          disabled={deleting}
          startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ 
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          {deleting ? 'Удаление...' : 'Удалить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;