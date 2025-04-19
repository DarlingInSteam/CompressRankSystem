import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  SelectChangeEvent,
  InputAdornment,
  Paper,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { SortType, DateFilterType, SizeFilterType } from '../../types/api.types';

interface ImageFiltersProps {
  searchQuery: string;
  sortType: SortType;
  dateFilter: DateFilterType;
  sizeFilter: SizeFilterType;
  compressionFilter: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSortChange: (e: SelectChangeEvent) => void;
  onDateFilterChange: (e: SelectChangeEvent) => void;
  onSizeFilterChange: (e: SelectChangeEvent) => void;
  onCompressionFilterChange: (e: SelectChangeEvent) => void;
  onResetFilters: () => void;
}

const ImageFilters: React.FC<ImageFiltersProps> = ({
  searchQuery,
  sortType,
  dateFilter,
  sizeFilter,
  compressionFilter,
  onSearchChange,
  onSortChange,
  onDateFilterChange,
  onSizeFilterChange,
  onCompressionFilterChange,
  onResetFilters
}) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0}
      sx={{ 
        mb: 4,
        p: 2, 
        borderRadius: '16px',
        backdropFilter: 'blur(8px)',
        backgroundColor: theme => theme.palette.mode === 'light' 
          ? 'rgba(255, 255, 255, 0.8)' 
          : 'rgba(50, 50, 50, 0.8)',
        border: '1px solid',
        borderColor: theme => theme.palette.mode === 'light'
          ? 'rgba(255, 255, 255, 0.6)'
          : 'rgba(100, 100, 100, 0.2)',
        boxShadow: theme => theme.palette.mode === 'light'
          ? '0 8px 20px rgba(0,0,0,0.06)'
          : '0 8px 20px rgba(0,0,0,0.25)'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2,
        '& .MuiFormControl-root, & .MuiButton-root': {
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 5px 10px rgba(0,0,0,0.1)'
          }
        }
      }}>
        <TextField
          label="Поиск"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={onSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ 
            flexGrow: 1, 
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              backgroundColor: theme => theme.palette.mode === 'light'
                ? 'rgba(255, 255, 255, 0.9)'
                : 'rgba(66, 66, 66, 0.6)',
              backdropFilter: 'blur(5px)',
              transition: 'all 0.3s'
            }
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Сортировка</InputLabel>
          <Select
            value={sortType}
            onChange={onSortChange}
            label="Сортировка"
            sx={{
              borderRadius: '10px',
              backgroundColor: theme => theme.palette.mode === 'light'
                ? 'rgba(255, 255, 255, 0.9)'
                : 'rgba(66, 66, 66, 0.6)',
            }}
          >
            <MenuItem value="uploadedAt">Дата загрузки</MenuItem>
            <MenuItem value="views">Просмотры</MenuItem>
            <MenuItem value="downloads">Загрузки</MenuItem>
            <MenuItem value="popularity">Популярность</MenuItem>
            <MenuItem value="size_asc">Размер (по возрастанию)</MenuItem>
            <MenuItem value="size_desc">Размер (по убыванию)</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Фильтр по дате</InputLabel>
          <Select
            value={dateFilter}
            onChange={onDateFilterChange}
            label="Фильтр по дате"
            sx={{
              borderRadius: '10px',
              backgroundColor: theme => theme.palette.mode === 'light'
                ? 'rgba(255, 255, 255, 0.9)'
                : 'rgba(66, 66, 66, 0.6)',
            }}
          >
            <MenuItem value="">Все</MenuItem>
            <MenuItem value="today">Сегодня</MenuItem>
            <MenuItem value="week">Последняя неделя</MenuItem>
            <MenuItem value="month">Последний месяц</MenuItem>
            <MenuItem value="year">Последний год</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Фильтр по размеру</InputLabel>
          <Select
            value={sizeFilter}
            onChange={onSizeFilterChange}
            label="Фильтр по размеру"
            sx={{
              borderRadius: '10px',
              backgroundColor: theme => theme.palette.mode === 'light'
                ? 'rgba(255, 255, 255, 0.9)'
                : 'rgba(66, 66, 66, 0.6)',
            }}
          >
            <MenuItem value="">Все</MenuItem>
            <MenuItem value="small">Маленькие (&lt; 100KB)</MenuItem>
            <MenuItem value="medium">Средние (100KB - 1MB)</MenuItem>
            <MenuItem value="large">Большие (1MB - 10MB)</MenuItem>
            <MenuItem value="xlarge">Очень большие (&gt; 10MB)</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Фильтр по сжатию</InputLabel>
          <Select
            value={compressionFilter}
            onChange={onCompressionFilterChange}
            label="Фильтр по сжатию"
            sx={{
              borderRadius: '10px',
              backgroundColor: theme => theme.palette.mode === 'light'
                ? 'rgba(255, 255, 255, 0.9)'
                : 'rgba(66, 66, 66, 0.6)',
            }}
          >
            <MenuItem value="all">Все</MenuItem>
            <MenuItem value="compressed">Сжатые</MenuItem>
            <MenuItem value="original">Оригиналы</MenuItem>
          </Select>
        </FormControl>
        
        <Button 
          variant="outlined" 
          onClick={onResetFilters}
          endIcon={<FilterListIcon fontSize="small" />}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 'medium'
          }}
        >
          Сбросить
        </Button>
      </Box>
    </Paper>
  );
};

export default ImageFilters;